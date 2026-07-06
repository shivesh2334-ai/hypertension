import React, { useState } from "react";
import {
  Activity, AlertTriangle, HeartPulse, Stethoscope, Gauge,
  ClipboardList, ShieldAlert, Pill, CalendarClock, Ruler,
  ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Info, BookOpen
} from "lucide-react";

/* ---------------------------------------------------------------
   NG136 CLINICAL CONSTANTS (NICE NG136, last updated Feb 2026)
--------------------------------------------------------------- */
const STAGES = [
  { key: "normal", label: "Not hypertensive (by clinic reading)", band: "<140/90 clinic", color: "#2D6E6E" },
  { key: "stage1", label: "Stage 1 hypertension", band: "140–159 / 90–99 clinic · 135–149/85–94 ABPM/HBPM", color: "#C08A2E" },
  { key: "stage2", label: "Stage 2 hypertension", band: "160–179 / 100–119 clinic · ≥150/95 ABPM/HBPM", color: "#C1392B" },
  { key: "stage3", label: "Stage 3 / severe hypertension", band: "≥180 systolic or ≥120 diastolic clinic", color: "#7A1F14" },
];

function classify(sys, dia) {
  if (sys >= 180 || dia >= 120) return STAGES[3];
  if (sys >= 160 || dia >= 100) return STAGES[2];
  if (sys >= 140 || dia >= 90) return STAGES[1];
  return STAGES[0];
}

const RED_FLAG_SYMPTOMS = [
  { key: "papilledema", label: "Retinal haemorrhage or papilloedema (accelerated hypertension)", group: "1.5.2" },
  { key: "confusion", label: "New-onset confusion", group: "1.5.2" },
  { key: "chestpain", label: "Chest pain", group: "1.5.2" },
  { key: "hf", label: "Signs of heart failure", group: "1.5.2" },
  { key: "aki", label: "Acute kidney injury", group: "1.5.2" },
  { key: "phaeo", label: "Suspected phaeochromocytoma — labile/postural BP, headache, palpitations, pallor, abdominal pain, diaphoresis", group: "1.5.3" },
];

const TOD_SCREEN = [
  "Urine albumin:creatinine ratio + reagent-strip haematuria",
  "HbA1c, electrolytes, creatinine, eGFR, total cholesterol, HDL",
  "Fundoscopy for hypertensive retinopathy",
  "12-lead ECG",
];

const ETHNICITY_OPTIONS = ["Not Black African / African–Caribbean", "Black African or African–Caribbean family origin"];

/* ---------------------------------------------------------------
   DETERMINISTIC ENGINE — mirrors NG136 recommendation numbers
--------------------------------------------------------------- */
function buildLocalAssessment(f, sys, dia, redFlags) {
  const stage = classify(sys, dia);
  const age = parseFloat(f.age) || null;
  const isBlackAfricanCaribbean = f.ethnicity === ETHNICITY_OPTIONS[1];
  const flagsChecked = Object.entries(redFlags).filter(([, v]) => v).map(([k]) => k);
  const hasEmergencyFlag = flagsChecked.some((k) => ["papilledema", "confusion", "chestpain", "hf", "aki"].includes(k));
  const hasPhaeo = flagsChecked.includes("phaeo");

  // 1.5.2 / 1.5.3 same-day referral
  let sameDayReferral = false;
  let referralReasons = [];
  if (sys >= 180 || dia >= 120) {
    if (hasEmergencyFlag) {
      sameDayReferral = true;
      referralReasons.push("Clinic BP ≥180/120 mmHg with retinal signs or a life-threatening feature (1.5.2)");
    }
  }
  if (hasPhaeo) {
    sameDayReferral = true;
    referralReasons.push("Features suggestive of phaeochromocytoma (1.5.3)");
  }
  const severeNoRedFlag = (sys >= 180 || dia >= 120) && !sameDayReferral;

  // 1.4.9–1.4.14 treatment threshold
  let treatmentPathway = "";
  if (stage.key === "stage3") {
    treatmentPathway = "Severe hypertension pathway — see same-day referral / TOD-first workup (1.5.1) rather than routine step-1 initiation.";
  } else if (stage.key === "stage2") {
    treatmentPathway = "Offer antihypertensive drug treatment alongside lifestyle advice, at any age (1.4.9). Use clinical judgement if frail/multimorbid.";
  } else if (stage.key === "stage1") {
    // 1.4.10 (discuss) must take priority over 1.4.12 (consider despite low risk)
    // whenever a qualifying risk factor is present, regardless of the person's age.
    const hasQualifyingRiskFactor = f.tod || f.cvd || f.ckd || f.diabetes || f.t1dm || (parseFloat(f.qrisk) >= 10);
    if (age !== null && age >= 80) {
      treatmentPathway = sys > 150 || dia > 90
        ? "Consider drug treatment — clinic BP is above 150/90 in a person aged ≥80 with stage 1 hypertension (1.4.13)."
        : "Stage 1 in a person aged ≥80 with clinic BP ≤150/90 — treatment threshold not automatically met; use clinical judgement (1.4.13).";
    } else if (hasQualifyingRiskFactor) {
      treatmentPathway = "Discuss starting treatment: qualifying factor present — target organ damage, established CVD, renal disease, diabetes, or QRISK ≥10% (1.4.10).";
    } else if (age !== null && age < 60) {
      treatmentPathway = "Consider antihypertensive treatment alongside lifestyle advice even though 10-year QRISK is below 10% and no other qualifying risk factor is present (1.4.12) — 10-year risk may underestimate lifetime risk.";
    } else if (age !== null && age < 80) {
      treatmentPathway = "Aged 60–79 with stage 1 hypertension, no qualifying risk factor, and QRISK <10% — NG136 does not give an explicit drug-treatment steer for this group; focus on lifestyle measures and reassess risk periodically.";
    } else {
      treatmentPathway = "Discuss starting treatment if the person has target organ damage, established CVD, renal disease, diabetes, or QRISK ≥10% (1.4.10). Provide age to refine further.";
    }
    if (age !== null && age < 40) {
      treatmentPathway += " Age <40: consider specialist evaluation for secondary causes and a fuller lifetime benefit/risk assessment (1.4.14).";
    }
  } else {
    treatmentPathway = "Clinic BP below diagnostic threshold — reinforce lifestyle advice; re-measure at least every 5 years, more often if borderline (1.2.10, 1.2.11).";
  }

  // 1.4.20–1.4.22 targets
  let clinicTarget = age !== null && age >= 80 ? "Below 150/90 mmHg" : "Below 140/90 mmHg";
  let ambTarget = age !== null && age >= 80 ? "Below 145/85 mmHg" : "Below 135/85 mmHg";
  if (f.ckd || f.t1dm) {
    if (parseFloat(f.acr) >= 70) {
      clinicTarget = "Below 130/80 mmHg (ACR ≥70 mg/mmol)";
    } else {
      clinicTarget = age !== null && age >= 80 ? "Below 140/90 mmHg (CKD/T1DM, ACR <70)" : "Below 140/90 mmHg (CKD/T1DM, ACR <70)";
    }
  }

  // Step 1–4 drug logic (1.4.32–1.4.52)
  let stepRecommendation = "";
  if (f.onTreatment && f.currentDrugClasses.length >= 3) {
    stepRecommendation = "Already on ACEi/ARB + CCB + thiazide-like diuretic at reported doses → meets definition of resistant hypertension (1.4.46) if BP remains uncontrolled at optimal tolerated doses. Confirm with ABPM/HBPM, assess postural hypotension, and check adherence before step 4 (1.4.47).";
  } else if (f.onTreatment && f.currentDrugClasses.length === 2) {
    stepRecommendation = "On 2 drug classes — step 3 would add the remaining class from ACEi/ARB, CCB, and thiazide-like diuretic to complete the 3-drug combination (1.4.45).";
  } else if (f.onTreatment && f.currentDrugClasses.length === 1) {
    const cls = f.currentDrugClasses[0];
    if (cls === "ACEi/ARB") {
      stepRecommendation = "On ACEi/ARB monotherapy — step 2 choice is a CCB or a thiazide-like diuretic (1.4.41).";
    } else if (cls === "CCB") {
      stepRecommendation = isBlackAfricanCaribbean
        ? "On CCB monotherapy — step 2 choice is ACEi, ARB (preferred over ACEi for Black African/African–Caribbean origin, 1.4.43), or thiazide-like diuretic (1.4.42)."
        : "On CCB monotherapy — step 2 choice is an ACE inhibitor, ARB, or thiazide-like diuretic (1.4.42).";
    } else {
      stepRecommendation = "On diuretic monotherapy — guideline step logic assumes ACEi/ARB or CCB as first-line; review original indication.";
    }
  } else {
    // treatment-naive step 1
    if (f.diabetes) {
      stepRecommendation = "Step 1: ACE inhibitor or ARB, regardless of age or family origin (1.4.32).";
    } else if (isBlackAfricanCaribbean) {
      stepRecommendation = "Step 1: calcium-channel blocker (1.4.35), as person is of Black African/African–Caribbean family origin without diabetes.";
    } else if (age !== null && age < 55) {
      stepRecommendation = "Step 1: ACE inhibitor or ARB (age <55, not of Black African/African–Caribbean origin) (1.4.32).";
    } else if (age !== null && age >= 55) {
      stepRecommendation = "Step 1: calcium-channel blocker (age ≥55) (1.4.35).";
    } else {
      stepRecommendation = "Step 1 choice depends on age/ethnicity/diabetes status — provide age to refine.";
    }
  }
  if (f.heartFailureHx) {
    stepRecommendation += " Heart failure evidence present → offer a thiazide-like diuretic and follow the chronic heart failure guideline in parallel (1.4.37).";
  }

  return {
    stage, sameDayReferral, referralReasons, severeNoRedFlag,
    treatmentPathway, clinicTarget, ambTarget, stepRecommendation,
  };
}

/* ---------------------------------------------------------------
   MERCURY GAUGE
--------------------------------------------------------------- */
function MercuryGauge({ sys, dia }) {
  const max = 220;
  const sysPct = Math.min(100, (sys / max) * 100);
  const diaPct = Math.min(100, (dia / max) * 100);
  const stage = sys && dia ? classify(sys, dia) : null;
  const ticks = [0, 40, 80, 120, 160, 200];

  return (
    <div className="flex items-stretch gap-3">
      <div className="relative w-16 h-80 rounded-full bg-[#EFEAE0] border border-[#D8D3C7] overflow-hidden shadow-inner">
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
          style={{ height: `${sysPct}%`, background: `linear-gradient(to top, ${stage ? stage.color : "#C1392B"}, ${stage ? stage.color : "#C1392B"}dd)` }}
        />
        <div
          className="absolute left-0 right-0 h-[3px] bg-[#1C2B39] transition-all duration-700 ease-out"
          style={{ bottom: `${diaPct}%` }}
        />
        {ticks.map((t) => (
          <div key={t} className="absolute left-0 w-3 h-px bg-[#9C9584]" style={{ bottom: `${(t / max) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-col justify-between py-0 text-[10px] tracking-wide text-[#7A7364] font-mono h-80">
        {ticks.slice().reverse().map((t) => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   STATIC REFERENCE: devices & measurement + confirmation protocol
--------------------------------------------------------------- */
function MeasurementGuidance() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#D8D3C7] rounded-sm bg-[#FBFAF6]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-2 font-serif text-[17px] text-[#1C2B39]">
          <Ruler size={18} className="text-[#2D6E6E]" /> Devices, technique &amp; diagnostic confirmation (NG136 1.1–1.2)
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="px-5 pb-6 text-[14px] leading-relaxed text-[#3A3428] space-y-4 border-t border-[#EAE5D9] pt-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#2D6E6E] mb-1">Device &amp; pulse check (1.1.2–1.1.3)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Palpate the radial/brachial pulse before measuring — if irregular (e.g. AF), switch to manual auscultation, as automated devices are unreliable with pulse irregularity.</li>
              <li>Use only devices validated, maintained, and recalibrated per the manufacturer's schedule. The British and Irish Hypertension Society maintains a validated-device list.</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#2D6E6E] mb-1">Environment &amp; technique (1.1.4, 1.2.1–1.2.2)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Quiet, temperate, relaxed setting; person seated, arm outstretched and supported; correct cuff size for arm circumference.</li>
              <li>Measure both arms at first assessment. Inter-arm difference &gt;15 mmHg → repeat; if still &gt;15 mmHg, use the arm with the higher reading going forward.</li>
              <li>If clinic BP ≥140/90: take a second reading in the consultation; if substantially different, take a third. Record the lower of the last two as the clinic BP.</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#2D6E6E] mb-1">Postural hypotension (1.1.5–1.1.8, 1.4.16)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>In people with falls or postural dizziness — or those ≥80, or with type 2 diabetes — measure lying (or seated if lying is impractical), then again after standing ≥1 minute.</li>
              <li>A drop of ≥20 mmHg systolic or ≥10 mmHg diastolic on standing confirms postural hypotension: review causative medication, manage accordingly, and use standing BP for future monitoring/targets.</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#2D6E6E] mb-1">Confirming diagnosis — ABPM / HBPM (1.2.3–1.2.8)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Clinic BP 140/90–179/119: offer ABPM to confirm diagnosis (gold standard); offer HBPM if ABPM unsuitable/not tolerated.</li>
              <li>ABPM: ≥2 measurements/hour during waking hours; average of ≥14 daytime readings.</li>
              <li>HBPM: 2 consecutive seated readings ≥1 minute apart, morning and evening, for ≥4 days (ideally 7); discard day 1, average the rest.</li>
              <li>Diagnosis is confirmed with clinic BP ≥140/90 <em>and</em> ABPM daytime/HBPM average ≥135/85.</li>
              <li>White-coat effect: clinic vs ABPM/HBPM average differs by &gt;20/10 mmHg. Masked hypertension: clinic &lt;140/90 but ABPM/HBPM average higher — consider ABPM/HBPM alongside clinic readings when these conflict (1.4.18).</li>
              <li>While awaiting confirmation, proceed with target-organ-damage investigations and formal CV risk assessment in parallel (1.2.5).</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   MAIN APP
--------------------------------------------------------------- */
export default function App() {
  const [form, setForm] = useState({
    setting: "clinic", sys: "", dia: "", hr: "",
    age: "", sex: "male", ethnicity: ETHNICITY_OPTIONS[0],
    diabetes: false, t1dm: false, ckd: false, acr: "", tod: false,
    cvd: false, smoker: false, priorStroke: false, familyHistoryCVD: false, heartFailureHx: false,
    totalChol: "", hdl: "", potassium: "", eGFR: "",
    onTreatment: false, currentDrugClasses: [], qrisk: "",
  });
  const [redFlags, setRedFlags] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sysN = parseFloat(form.sys);
  const diaN = parseFloat(form.dia);
  const validReading = !isNaN(sysN) && !isNaN(diaN) && sysN > 0 && diaN > 0;
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDrugClass = (cls) => setForm((f) => ({
    ...f, currentDrugClasses: f.currentDrugClasses.includes(cls)
      ? f.currentDrugClasses.filter((c) => c !== cls) : [...f.currentDrugClasses, cls],
  }));

  const local = validReading ? buildLocalAssessment(form, sysN, diaN, redFlags) : null;

  async function runAnalysis() {
    setError(null); setResult(null);
    if (!validReading) { setError("Enter a valid systolic and diastolic reading before running analysis."); return; }
    setLoading(true);

    const flagList = Object.entries(redFlags).filter(([, v]) => v).map(([k]) => RED_FLAG_SYMPTOMS.find((r) => r.key === k)?.label).filter(Boolean);

    const clinicalPacket = {
      measurement_setting: form.setting, systolic: sysN, diastolic: diaN, heart_rate: form.hr || "not recorded",
      age: form.age || "not provided", sex: form.sex, ethnicity_category: form.ethnicity,
      risk_factors: {
        type2_diabetes: form.diabetes, type1_diabetes: form.t1dm, ckd: form.ckd, urine_acr: form.acr || "not provided",
        established_cvd: form.cvd, heart_failure_history: form.heartFailureHx, current_smoker: form.smoker,
        prior_stroke_tia: form.priorStroke, family_history_premature_cvd: form.familyHistoryCVD,
        total_cholesterol: form.totalChol || "not provided", hdl: form.hdl || "not provided",
        potassium: form.potassium || "not provided", eGFR: form.eGFR || "not provided",
        qrisk_10yr_percent: form.qrisk || "not provided",
      },
      currently_treated: form.onTreatment,
      current_drug_classes: form.currentDrugClasses,
      red_flag_features_present: flagList,
      local_engine_output: local,
    };

    const system = `You are providing specialist-level cardiology decision support to a consultant cardiologist, strictly applying NICE NG136 "Hypertension in adults: diagnosis and management" (last updated Feb 2026). Use its exact recommendation numbers, staging definitions, the two clinic BP target tables (under 80 vs 80+, with CKD/T1DM ACR modifiers), the 4-step drug algorithm (step 1 by age/ethnicity/diabetes, steps 2-3 combination logic, step 4 resistant hypertension with spironolactone/alpha/beta-blocker by potassium threshold of 4.5 mmol/L), and same-day referral criteria (1.5.1-1.5.3). A local deterministic engine has already computed a first-pass answer (local_engine_output) — validate it, refine it with clinical nuance the engine cannot capture, and flag if you disagree with its output and why.

Respond with ONLY a valid JSON object (no markdown fences, no prose outside JSON), matching exactly:
{
  "diagnosis": { "stage_confirmed": string, "confirmation_required": string, "narrative": string },
  "risk_and_target_organ_damage": { "qrisk_context": string, "target_organ_damage_workup": [string], "narrative": string },
  "treatment_and_monitoring": { "treatment_indicated": boolean, "bp_target": string, "recommended_step": string, "drug_class_guidance": string, "monitoring_interval": string, "narrative": string },
  "same_day_referral": { "indicated": boolean, "reasons": [string], "narrative": string },
  "specialist_summary": string
}
Keep narratives to 2-4 dense clinical sentences citing NG136 recommendation numbers where relevant. This is decision support only — final judgement rests with the treating physician.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1800, system,
          messages: [{ role: "user", content: `Clinical data packet:\n${JSON.stringify(clinicalPacket, null, 2)}\n\nProvide the structured specialist analysis.` }],
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        const apiMsg = data?.error?.message || `HTTP ${response.status}`;
        throw new Error(`API error: ${apiMsg}`);
      }
      if (data.stop_reason === "max_tokens") {
        throw new Error("Response was cut off before completing — try again (narratives may need to be shorter).");
      }

      const text = (data.content || []).map((b) => b.text || "").join("\n");
      if (!text.trim()) {
        throw new Error("Empty response from model.");
      }

      // Strip markdown fences, then fall back to extracting the outermost {...}
      // block in case the model added any stray prose despite instructions.
      let clean = text.replace(/```json|```/g, "").trim();
      const firstBrace = clean.indexOf("{");
      const lastBrace = clean.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.slice(firstBrace, lastBrace + 1);
      }

      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch (parseErr) {
        throw new Error(`Could not parse model output as JSON: ${parseErr.message}`);
      }
      setResult(parsed);
    } catch (e) {
      setError(e.message || "Could not complete AI analysis. Please retry.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C2B39]" style={{ fontFamily: "'Source Sans 3', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@500;600;700&family=Source+Sans+3:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .font-serif { font-family: 'Source Serif 4', Georgia, serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <header className="border-b border-[#D8D3C7] bg-[#FBFAF6]">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center gap-3">
          <Stethoscope size={26} className="text-[#C1392B]" />
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Hypertension Assessment Console</h1>
            <p className="text-[13px] text-[#7A7364] font-mono">NICE NG136-aligned specialist decision support</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="flex gap-3 text-[13px] text-[#5C5644] bg-[#EFEAE0] border border-[#D8D3C7] rounded-sm px-4 py-3">
          <Info size={16} className="shrink-0 mt-0.5 text-[#7A7364]" />
          <p>Built against NICE NG136 (last updated Feb 2026), for use by qualified clinicians as decision support only. Does not replace clinical judgement, examination, or local protocols. Data entered is not stored.</p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 bg-[#FBFAF6] border border-[#D8D3C7] rounded-sm p-6">
          <div className="space-y-5">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              <Gauge size={18} className="text-[#2D6E6E]" /> Measurement input
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Setting</label>
                <select value={form.setting} onChange={(e) => update("setting", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm">
                  <option value="clinic">Clinic (attended)</option>
                  <option value="abpm">ABPM daytime average</option>
                  <option value="hbpm">HBPM average</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Heart rate (bpm)</label>
                <input type="number" value={form.hr} onChange={(e) => update("hr", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm font-mono" placeholder="72" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Systolic (mmHg)</label>
                <input type="number" value={form.sys} onChange={(e) => update("sys", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-lg font-mono" placeholder="142" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Diastolic (mmHg)</label>
                <input type="number" value={form.dia} onChange={(e) => update("dia", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-lg font-mono" placeholder="91" />
              </div>
            </div>

            {local && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium" style={{ background: `${local.stage.color}1a`, color: local.stage.color }}>
                <Activity size={14} /> {local.stage.label} <span className="font-mono text-xs opacity-70">({local.stage.band})</span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-[#EAE5D9]">
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Age</label>
                <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm font-mono" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Sex</label>
                <select value={form.sex} onChange={(e) => update("sex", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm">
                  <option value="male">Male</option><option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">QRISK 10yr %</label>
                <input type="number" value={form.qrisk} onChange={(e) => update("qrisk", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm font-mono" placeholder="%" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Family origin (drug-choice relevant, NG136 1.4.30)</label>
                <select value={form.ethnicity} onChange={(e) => update("ethnicity", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm">
                  {ETHNICITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Total chol.</label>
                <input type="number" value={form.totalChol} onChange={(e) => update("totalChol", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm font-mono" placeholder="mmol/L" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">HDL</label>
                <input type="number" value={form.hdl} onChange={(e) => update("hdl", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm font-mono" placeholder="mmol/L" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Potassium</label>
                <input type="number" step="0.1" value={form.potassium} onChange={(e) => update("potassium", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm font-mono" placeholder="mmol/L" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">eGFR</label>
                <input type="number" value={form.eGFR} onChange={(e) => update("eGFR", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm font-mono" placeholder="mL/min/1.73m²" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364]">Urine ACR</label>
                <input type="number" value={form.acr} onChange={(e) => update("acr", e.target.value)} className="mt-1 w-full border border-[#D8D3C7] rounded-sm px-3 py-2 bg-white text-sm font-mono" placeholder="mg/mmol" />
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm pt-1">
              {[["diabetes","T2DM"],["t1dm","T1DM"],["ckd","CKD"],["cvd","Established CVD"],["tod","Confirmed target organ damage"],["heartFailureHx","Heart failure Hx"],["smoker","Current smoker"],["priorStroke","Prior stroke/TIA"],["familyHistoryCVD","FHx premature CVD"],["onTreatment","Already on treatment"]].map(([k,l]) => (
                <label key={k} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={form[k]} onChange={(e) => update(k, e.target.checked)} /> {l}
                </label>
              ))}
            </div>

            {form.onTreatment && (
              <div className="pt-1">
                <p className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364] mb-1">Current drug classes (check all)</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {["ACEi/ARB", "CCB", "Thiazide-like diuretic", "Beta-blocker", "Alpha-blocker", "Spironolactone"].map((cls) => (
                    <label key={cls} className="flex items-center gap-1.5">
                      <input type="checkbox" checked={form.currentDrugClasses.includes(cls)} onChange={() => toggleDrugClass(cls)} /> {cls}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#EAE5D9]">
              <p className="text-[12px] font-mono uppercase tracking-wide text-[#7A7364] mb-2 flex items-center gap-1">
                <ShieldAlert size={13} /> Red-flag features (NG136 1.5.2–1.5.3)
              </p>
              <div className="grid md:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {RED_FLAG_SYMPTOMS.map((r) => (
                  <label key={r.key} className="flex items-start gap-1.5">
                    <input type="checkbox" className="mt-0.5" checked={!!redFlags[r.key]} onChange={(e) => setRedFlags((f) => ({ ...f, [r.key]: e.target.checked }))} />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-start pt-8">
            <MercuryGauge sys={sysN} dia={diaN} />
            {validReading && <p className="mt-3 font-mono text-sm text-center">{sysN}/{diaN}</p>}
          </div>
        </section>

        {local?.sameDayReferral && (
          <div className="flex gap-3 items-start bg-[#7A1F14] text-[#FBEAE6] rounded-sm px-5 py-4">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Same-day specialist review indicated (NG136 1.5.2 / 1.5.3)</p>
              <ul className="text-sm opacity-90 list-disc pl-5 mt-1">
                {local.referralReasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        )}
        {local?.severeNoRedFlag && (
          <div className="flex gap-3 items-start bg-[#C08A2E] text-[#3A2A0E] rounded-sm px-5 py-4">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Severe hypertension, no red-flag features (NG136 1.5.1)</p>
              <p className="text-sm">Arrange target-organ-damage investigations as soon as possible. If TOD found, consider starting treatment immediately without waiting for ABPM/HBPM. If not, confirm with repeat clinic BP within 7 days, or ABPM/HBPM with clinical review within 7 days.</p>
            </div>
          </div>
        )}

        <MeasurementGuidance />

        <button onClick={runAnalysis} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-[#1C2B39] hover:bg-[#26394B] disabled:opacity-60 text-[#F7F5F0] font-medium py-3.5 rounded-sm transition-colors">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Running specialist analysis…</> : <><HeartPulse size={18} /> Run Claude specialist analysis</>}
        </button>
        {error && <p className="text-sm text-[#C1392B]">{error}</p>}

        {result && (
          <section className="space-y-5">
            <ResultCard icon={<ClipboardList size={18} />} title="1. Diagnosing hypertension">
              <FieldRow label="Stage confirmed">{result.diagnosis?.stage_confirmed}</FieldRow>
              <FieldRow label="Confirmation required">{result.diagnosis?.confirmation_required}</FieldRow>
              <p className="text-sm leading-relaxed mt-2">{result.diagnosis?.narrative}</p>
            </ResultCard>

            <ResultCard icon={<Activity size={18} />} title="2. Cardiovascular risk & target organ damage">
              <FieldRow label="Risk context">{result.risk_and_target_organ_damage?.qrisk_context}</FieldRow>
              {result.risk_and_target_organ_damage?.target_organ_damage_workup?.length > 0 && (
                <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                  {result.risk_and_target_organ_damage.target_organ_damage_workup.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
              <p className="text-sm leading-relaxed mt-2">{result.risk_and_target_organ_damage?.narrative}</p>
              <details className="mt-2 text-[13px]">
                <summary className="cursor-pointer text-[#2D6E6E] font-mono text-xs uppercase tracking-wide">Standard TOD screen (1.3.3)</summary>
                <ul className="list-disc pl-5 mt-1 space-y-1">{TOD_SCREEN.map((t,i)=><li key={i}>{t}</li>)}</ul>
              </details>
            </ResultCard>

            <ResultCard icon={<Pill size={18} />} title="3. Treating and monitoring hypertension">
              <div className="flex items-center gap-2 mb-1">
                {result.treatment_and_monitoring?.treatment_indicated
                  ? <span className="flex items-center gap-1 text-[#C1392B] text-sm font-medium"><CheckCircle2 size={15}/> Treatment indicated</span>
                  : <span className="flex items-center gap-1 text-[#5C8A6E] text-sm font-medium"><XCircle size={15}/> Lifestyle measures only</span>}
              </div>
              <FieldRow label="BP target">{result.treatment_and_monitoring?.bp_target || local?.clinicTarget}</FieldRow>
              <FieldRow label="Recommended step">{result.treatment_and_monitoring?.recommended_step || local?.stepRecommendation}</FieldRow>
              <FieldRow label="Drug class guidance">{result.treatment_and_monitoring?.drug_class_guidance}</FieldRow>
              <FieldRow label="Monitoring interval"><span className="flex items-center gap-1"><CalendarClock size={13}/>{result.treatment_and_monitoring?.monitoring_interval}</span></FieldRow>
              <p className="text-sm leading-relaxed mt-2">{result.treatment_and_monitoring?.narrative}</p>
            </ResultCard>

            <ResultCard icon={<ShieldAlert size={18} />} title="4. Same-day specialist review" accent={result.same_day_referral?.indicated ? "#7A1F14" : undefined}>
              <p className="font-medium text-sm mb-1" style={{ color: result.same_day_referral?.indicated ? "#7A1F14" : "#5C8A6E" }}>
                {result.same_day_referral?.indicated ? "Indicated" : "Not indicated at this time"}
              </p>
              {result.same_day_referral?.reasons?.length > 0 && (
                <ul className="list-disc pl-5 text-sm space-y-1">{result.same_day_referral.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
              )}
              <p className="text-sm leading-relaxed mt-2">{result.same_day_referral?.narrative}</p>
            </ResultCard>

            <div className="bg-[#1C2B39] text-[#F7F5F0] rounded-sm p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#9FB8C4] mb-2 flex items-center gap-1"><BookOpen size={13}/> Specialist summary</p>
              <p className="text-sm leading-relaxed">{result.specialist_summary}</p>
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 pb-10 pt-2 text-[12px] text-[#9C9584] font-mono">
        NICE NG136, hypertension in adults: diagnosis and management (last updated Feb 2026) · decision support only, not a diagnostic device
      </footer>
    </div>
  );
}

function ResultCard({ icon, title, children, accent }) {
  return (
    <div className="bg-[#FBFAF6] border rounded-sm p-5" style={{ borderColor: accent || "#D8D3C7" }}>
      <h3 className="font-serif text-[17px] font-semibold flex items-center gap-2 mb-3" style={{ color: accent || "#1C2B39" }}>{icon} {title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm py-0.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-[#7A7364] w-40 shrink-0">{label}</span>
      <span>{children}</span>
    </div>
  );
}
