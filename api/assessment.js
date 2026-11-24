const SYSTEM_PROMPT = `You are providing specialist-level cardiology decision support to a consultant cardiologist, strictly applying NICE NG136 "Hypertension in adults: diagnosis and management" (last updated Feb 2026). Use its exact recommendation numbers, staging definitions, the two clinic BP target tables (under 80 vs 80+, with CKD/T1DM ACR modifiers), the 4-step drug algorithm (step 1 by age/ethnicity/diabetes, steps 2-3 combination logic, step 4 resistant hypertension with spironolactone/alpha/beta-blocker by potassium threshold of 4.5 mmol/L), and same-day referral criteria (1.5.1-1.5.3). A local deterministic engine has already computed a first-pass answer (local_engine_output) — validate it, refine it with clinical nuance the engine cannot capture, and flag if you disagree with its output and why.

Respond with ONLY a valid JSON object (no markdown fences, no prose outside JSON), matching exactly:
{
  "diagnosis": { "stage_confirmed": string, "confirmation_required": string, "narrative": string },
  "risk_and_target_organ_damage": { "qrisk_context": string, "target_organ_damage_workup": [string], "narrative": string },
  "treatment_and_monitoring": { "treatment_indicated": boolean, "bp_target": string, "recommended_step": string, "drug_class_guidance": string, "monitoring_interval": string, "narrative": string },
  "same_day_referral": { "indicated": boolean, "reasons": [string], "narrative": string },
  "specialist_summary": string
}
Keep narratives to 2-4 dense clinical sentences citing NG136 recommendation numbers where relevant. This is decision support only — final judgement rests with the treating physician.`;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const packet = req.body;
  if (!packet || typeof packet !== "object" ||
      !["clinic", "abpm", "hbpm"].includes(packet.measurement_setting) ||
      !Number.isFinite(packet.systolic) || !Number.isFinite(packet.diastolic) ||
      packet.systolic <= packet.diastolic || packet.diastolic <= 0 ||
      JSON.stringify(packet).length > 8000) {
    return res.status(400).json({ error: "Invalid clinical inputs" });
  }

  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return res.status(503).json({ error: "Claude review unavailable" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-5-5",
        max_tokens: 1800,
        thinking: { type: "disabled" },
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: JSON.stringify(packet) }],
      }),
    });
    if (!response.ok) {
      console.warn("Claude assessment upstream status", response.status);
      return res.status(502).json({ error: "Claude review unavailable" });
    }
    return res.status(200).json(await response.json());
  } catch (error) {
    console.warn("Claude assessment request failed", error?.name === "TimeoutError" ? "timeout" : "network or response error");
    return res.status(502).json({ error: "Claude review unavailable" });
  }
}
