import React, { useState } from "react";
import GuidelineChat from "./GuidelineChat.jsx";
import {
  Activity, AlertTriangle, HeartPulse, Stethoscope, Gauge,
  ClipboardList, ShieldAlert, Pill, CalendarClock, Ruler,
  ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, Info, BookOpen
} from "lucide-react";

/* ---------------------------------------------------------------
   NG136 CLINICAL CONSTANTS (NICE NG136, last updated Feb 2026)
--------------------------------------------------------------- */
import { buildLocalAssessment, classify, ETHNICITY_OPTIONS, RED_FLAG_SYMPTOMS, TOD_SCREEN } from "./assessment.js";

const TABS = [
  ["assessment", "BP assessment"], ["chat", "Ask Claude"], ["measurement", "Measurement"],
  ["risk", "Risk and organ damage"], ["treatment", "Treatment"], ["urgent", "Urgent review"],
  ["guidelines", "NICE reference"],
];

/* ---------------------------------------------------------------
   MERCURY GAUGE
--------------------------------------------------------------- */
function MercuryGauge({ sys, dia, setting }) {
  const max = 220;
  const sysPct = Math.min(100, (sys / max) * 100);
  const diaPct = Math.min(100, (dia / max) * 100);
  const stage = setting === "clinic" && sys && dia ? classify(sys, dia) : null;
  const ticks = [0, 40, 80, 120, 160, 200];

  return (
    <div className="flex items-stretch gap-3">
      <div className="relative w-16 h-80 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shadow-inner">
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
          style={{ height: `${sysPct}%`, background: `linear-gradient(to top, ${stage ? stage.color : "#C1392B"}, ${stage ? stage.color : "#C1392B"}dd)` }}
        />
        <div
          className="absolute left-0 right-0 h-[3px] bg-slate-900 transition-all duration-700 ease-out"
          style={{ bottom: `${diaPct}%` }}
        />
        {ticks.map((t) => (
          <div key={t} className="absolute left-0 w-3 h-px bg-[#9C9584]" style={{ bottom: `${(t / max) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-col justify-between py-0 text-[10px] tracking-wide text-slate-400 font-mono h-80">
        {ticks.slice().reverse().map((t) => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   STATIC REFERENCE: devices & measurement + confirmation protocol
--------------------------------------------------------------- */
function MeasurementGuidance() {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-700 rounded-sm bg-slate-900">
      <button aria-expanded={open} onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-2 font-serif text-[17px] text-slate-100">
          <Ruler size={18} className="text-teal-300" /> Devices, technique &amp; diagnostic confirmation (NG136 1.1–1.2)
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="px-5 pb-6 text-[14px] leading-relaxed text-slate-200 space-y-4 border-t border-slate-800 pt-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-1">Device &amp; pulse check (1.1.2–1.1.3)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Palpate the radial/brachial pulse before measuring — if irregular (e.g. AF), switch to manual auscultation, as automated devices are unreliable with pulse irregularity.</li>
              <li>Use only devices validated, maintained, and recalibrated per the manufacturer's schedule. The British and Irish Hypertension Society maintains a validated-device list.</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-1">Environment &amp; technique (1.1.4, 1.2.1–1.2.2)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Quiet, temperate, relaxed setting; person seated, arm outstretched and supported; correct cuff size for arm circumference.</li>
              <li>Measure both arms at first assessment. Inter-arm difference &gt;15 mmHg → repeat; if still &gt;15 mmHg, use the arm with the higher reading going forward.</li>
              <li>If clinic BP ≥140/90: take a second reading in the consultation; if substantially different, take a third. Record the lower of the last two as the clinic BP.</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-1">Postural hypotension (1.1.5–1.1.8, 1.4.16)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>In people with falls or postural dizziness — or those ≥80, or with type 2 diabetes — measure lying (or seated if lying is impractical), then again after standing ≥1 minute.</li>
              <li>A drop of ≥20 mmHg systolic or ≥10 mmHg diastolic on standing confirms postural hypotension: review causative medication, manage accordingly, and use standing BP for future monitoring/targets.</li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-teal-300 mb-1">Confirming diagnosis — ABPM / HBPM (1.2.3–1.2.8)</p>
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
  const [tab, setTab] = useState("assessment");
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
  const validReading = Number.isFinite(sysN) && Number.isFinite(diaN) && sysN > diaN && diaN > 0;
  const adult = form.age === "" || Number(form.age) >= 18;
  const inScope = adult && !form.pregnant;
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDrugClass = (cls) => setForm((f) => ({
    ...f, currentDrugClasses: f.currentDrugClasses.includes(cls)
      ? f.currentDrugClasses.filter((c) => c !== cls) : [...f.currentDrugClasses, cls],
  }));

  const local = React.useMemo(
    () => validReading && inScope ? buildLocalAssessment(form, sysN, diaN, redFlags) : null,
    [form, redFlags, validReading, inScope, sysN, diaN],
  );
  const analysis = result?.local === local ? result?.analysis : null;
  const failed = error?.form === form && error?.redFlags === redFlags;
  const isAssessment = tab === "assessment";
  const show = (id) => isAssessment || tab === id;

  async function runAnalysis() {
    setError(null); setResult(null);
    if (!local || loading || local.sameDayReferral || local.hasEmergencyFlag || local.severeNoRedFlag || local.severeOutOfOffice) return;
    setLoading(true);

    const flagList = Object.entries(redFlags).filter(([, v]) => v).map(([k]) => RED_FLAG_SYMPTOMS.find((r) => r.key === k)?.label).filter(Boolean);

    const clinicalPacket = {
      measurement_setting: form.setting, systolic: sysN, diastolic: diaN, heart_rate: form.hr || "not recorded",
      age: form.age || "not provided", sex: form.sex, ethnicity_category: form.ethnicity,
      risk_factors: {
        type2_diabetes: form.diabetes, type1_diabetes: form.t1dm, ckd: form.ckd, urine_acr: form.acr || "not provided",
        established_cvd: form.cvd, confirmed_target_organ_damage: form.tod, heart_failure_history: form.heartFailureHx, current_smoker: form.smoker,
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

    try {
      const response = await fetch("/api/assessment", {
        signal: AbortSignal.timeout(32000),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicalPacket),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error("API unavailable");
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
      const sections = {
        diagnosis: ["stage_confirmed", "confirmation_required", "narrative"],
        risk_and_target_organ_damage: ["qrisk_context", "narrative", "target_organ_damage_workup"],
        treatment_and_monitoring: ["treatment_indicated", "bp_target", "recommended_step", "drug_class_guidance", "monitoring_interval", "narrative"],
        same_day_referral: ["indicated", "reasons", "narrative"],
      };
      const valid = Object.entries(sections).every(([section, keys]) => keys.every((key) => {
        const value = parsed?.[section]?.[key];
        if (key === "indicated" || key === "treatment_indicated") return typeof value === "boolean";
        if (key === "reasons" || key === "target_organ_damage_workup") return Array.isArray(value) && value.every((item) => typeof item === "string");
        return typeof value === "string" && value.trim().length > 0;
      }));
      if (!valid || typeof parsed.specialist_summary !== "string" || !parsed.specialist_summary.trim()) {
        throw new Error("Incomplete assessment");
      }
      setResult({ local, analysis: parsed });
    } catch (e) {
      setError({ form, redFlags });
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="advisor-hero border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="font-serif text-4xl text-white">Hypertension</h1>
          <p className="mt-2 text-sm text-slate-300">Adult clinical decision support · NICE NG136</p>
        </div>
      </header>
      <nav aria-label="Clinical tools" className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto px-4 py-2">
          {TABS.map(([id, label]) => (
            <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm ${tab === id ? "bg-rose-950 text-rose-200" : "text-slate-300 hover:bg-slate-800"}`}>
              {label}
            </button>
          ))}
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <GuidelineChat active={tab === "chat"} />
        {isAssessment && <p className="text-sm text-slate-300">
          Enter a reading for an instant rules-based assessment. Claude can add a second review on request. Use clinical judgement and local protocols.
        </p>}
        {isAssessment && (
        <section className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 bg-slate-900 border border-slate-700 rounded-sm p-6">
          <div className="space-y-5">
            <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
              <Gauge size={18} className="text-teal-300" /> Measurement input
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Setting</label>
                <select aria-label="Measurement setting" value={form.setting} onChange={(e) => update("setting", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm">
                  <option value="clinic">Clinic (attended)</option>
                  <option value="abpm">ABPM daytime average</option>
                  <option value="hbpm">HBPM average</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Heart rate (bpm)</label>
                <input type="number" aria-label="Heart rate in bpm" value={form.hr} onChange={(e) => update("hr", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm font-mono" placeholder="72" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Systolic (mmHg)</label>
                <input type="number" aria-label="Systolic (mmHg)" value={form.sys} onChange={(e) => update("sys", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-lg font-mono" placeholder="142" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Diastolic (mmHg)</label>
                <input type="number" aria-label="Diastolic (mmHg)" value={form.dia} onChange={(e) => update("dia", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-lg font-mono" placeholder="91" />
              </div>
            </div>

            {local && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium">
                <Activity size={14} /> {local.stage.label} <span className="font-mono text-xs opacity-70">({local.stage.band})</span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Age</label>
                <input type="number" aria-label="Age" value={form.age} onChange={(e) => update("age", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm font-mono" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Sex</label>
                <select aria-label="Sex" value={form.sex} onChange={(e) => update("sex", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm">
                  <option value="male">Male</option><option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">QRISK 10yr %</label>
                <input type="number" aria-label="QRISK 10-year percent" value={form.qrisk} onChange={(e) => update("qrisk", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm font-mono" placeholder="%" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Family origin (drug-choice relevant, NG136 1.4.30)</label>
                <select aria-label="Family origin" value={form.ethnicity} onChange={(e) => update("ethnicity", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm">
                  {ETHNICITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Total chol.</label>
                <input type="number" aria-label="Total cholesterol in mmol/L" value={form.totalChol} onChange={(e) => update("totalChol", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm font-mono" placeholder="mmol/L" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">HDL</label>
                <input type="number" aria-label="HDL in mmol/L" value={form.hdl} onChange={(e) => update("hdl", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm font-mono" placeholder="mmol/L" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Potassium</label>
                <input type="number" step="0.1" aria-label="Potassium in mmol/L" value={form.potassium} onChange={(e) => update("potassium", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm font-mono" placeholder="mmol/L" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">eGFR</label>
                <input type="number" aria-label="eGFR" value={form.eGFR} onChange={(e) => update("eGFR", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm font-mono" placeholder="mL/min/1.73m²" />
              </div>
              <div>
                <label className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Urine ACR</label>
                <input type="number" aria-label="Urine ACR in mg/mmol" value={form.acr} onChange={(e) => update("acr", e.target.value)} className="mt-1 w-full border border-slate-700 rounded-sm px-3 py-2 bg-slate-950 text-sm font-mono" placeholder="mg/mmol" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.pregnant} onChange={(e) => update("pregnant", e.target.checked)} />
              Pregnancy or postpartum
            </label>
            {!inScope && <p role="status" className="text-amber-200">Use the appropriate paediatric or maternity hypertension pathway. If acute symptoms are present, seek urgent clinical assessment.</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm pt-1">
              {[["diabetes","T2DM"],["t1dm","T1DM"],["ckd","CKD"],["cvd","Established CVD"],["tod","Confirmed target organ damage"],["heartFailureHx","Heart failure Hx"],["smoker","Current smoker"],["priorStroke","Prior stroke/TIA"],["familyHistoryCVD","FHx premature CVD"],["onTreatment","Already on treatment"]].map(([k,l]) => (
                <label key={k} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={form[k]} onChange={(e) => update(k, e.target.checked)} /> {l}
                </label>
              ))}
            </div>

            {form.onTreatment && (
              <div className="pt-1">
                <p className="text-[12px] font-mono uppercase tracking-wide text-slate-400 mb-1">Current drug classes (check all)</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  {["ACEi/ARB", "CCB", "Thiazide-like diuretic", "Beta-blocker", "Alpha-blocker", "Spironolactone"].map((cls) => (
                    <label key={cls} className="flex items-center gap-1.5">
                      <input type="checkbox" checked={form.currentDrugClasses.includes(cls)} onChange={() => toggleDrugClass(cls)} /> {cls}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800">
              <p className="text-[12px] font-mono uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1">
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
            <MercuryGauge sys={validReading ? sysN : 0} dia={validReading ? diaN : 0} setting={form.setting} />
            {validReading && <p className="mt-3 font-mono text-sm text-center">{sysN}/{diaN}</p>}
          </div>
        </section>
        )}

        {(local?.sameDayReferral ) && (
          <div role="alert" className="flex gap-3 items-start bg-[#7A1F14] text-[#FBEAE6] rounded-sm px-5 py-4">
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

        {RED_FLAG_SYMPTOMS.some(({ key }) => redFlags[key]) && !local?.sameDayReferral && (
          <p role="alert" className="rounded-lg bg-rose-950 p-4 text-rose-100">Urgently assess the selected acute findings using the appropriate emergency pathway. Do not wait for a BP threshold or Claude review.</p>
        )}
        {local?.severeOutOfOffice && (
          <p role="alert" className="rounded-lg bg-amber-950 p-4 text-amber-100">This out-of-office average is markedly raised. Arrange prompt clinical review and verify a current BP.</p>
        )}
        {tab === "measurement" && <MeasurementGuidance />}
        {tab === "urgent" && <ResultCard icon={<ShieldAlert size={18} />} title="Same-day specialist criteria">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Clinic BP with systolic ≥180 or diastolic ≥120 mmHg plus retinal haemorrhage, papilloedema or life-threatening symptoms (1.5.2).</li>
            <li>Suspected phaeochromocytoma (1.5.3).</li>
            <li>Severe clinic BP without these findings requires prompt target-organ assessment (1.5.1).</li>
          </ul>
        </ResultCard>}
        {tab === "guidelines" && <ResultCard icon={<BookOpen size={18} />} title="NICE NG136">
          <p>Hypertension in adults · Diagnosis and management</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-rose-300">
            <a href="https://www.nice.org.uk/guidance/ng136/chapter/recommendations" target="_blank" rel="noreferrer">NICE recommendations ↗</a>
            <a href="/hypertension-guidance.pdf" target="_blank" rel="noreferrer">Guideline PDF ↗</a>
          </div>
        </ResultCard>}
        {local && (isAssessment || ["risk", "treatment", "urgent"].includes(tab)) && (
          <section aria-label="Rules-based assessment" className="space-y-4">
            {isAssessment && <h2 className="text-lg font-semibold">Rules-based assessment</h2>}
            {isAssessment && <ResultCard icon={<ClipboardList size={18} />} title="BP classification and confirmation">
              <FieldRow label="Reading">{sysN}/{diaN} mmHg · {local.stage.label}</FieldRow>
              <FieldRow label="Next step">{local.confirmation}</FieldRow>
            </ResultCard>}
            {show("risk") && <ResultCard icon={<Activity size={18} />} title="Cardiovascular risk and target organ damage">
              <FieldRow label="10-year QRISK">{form.qrisk !== "" ? `${form.qrisk}% entered` : "Unrecorded. Review eligibility for formal cardiovascular risk assessment."}</FieldRow>
              <FieldRow label="Organ damage">{form.tod ? "Reported as confirmed" : "Status unconfirmed"}</FieldRow>
              <ul className="mt-2 list-disc pl-5 text-sm">{TOD_SCREEN.map((item) => <li key={item}>{item}</li>)}</ul>
            </ResultCard>}
            {show("treatment") && <ResultCard icon={<Pill size={18} />} title="Treatment and monitoring">
              <FieldRow label="Pathway">{local.treatmentPathway}</FieldRow>
              <FieldRow label="Clinic target">{local.clinicTarget}</FieldRow>
              <FieldRow label="Home / daytime target">{local.ambTarget}</FieldRow>
              <FieldRow label="Drug class review">{local.stepRecommendation}</FieldRow>
            </ResultCard>}
            {show("urgent") && <ResultCard icon={<ShieldAlert size={18} />} title="Urgent review">
              <p className="text-sm">{local.sameDayReferral ? local.referralReasons.join(". ") :
                local.hasEmergencyFlag ? "Urgent clinical evaluation of selected findings." :
                local.severeNoRedFlag ? "Assess target organ damage promptly and follow the 7-day confirmation or review pathway when appropriate (1.5.1)." :
                "Same-day NG136 referral criteria are not triggered by the recorded findings. Assess acute symptoms independently."}</p>
            </ResultCard>}
          </section>
        )}
        {!local && ["risk", "treatment"].includes(tab) && (
          <button className="text-sm text-rose-300 underline" onClick={() => setTab("assessment")}>Enter a valid adult BP reading to assess this case</button>
        )}
        {isAssessment && local && !local.sameDayReferral && !local.hasEmergencyFlag &&
          !local.severeNoRedFlag && !local.severeOutOfOffice && (
          <div className="space-y-2">
            <button onClick={runAnalysis} disabled={loading} className="flex items-center gap-2 rounded-lg bg-rose-900 px-4 py-3 text-white hover:bg-rose-800 disabled:opacity-60">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Requesting Claude review…</> : <><HeartPulse size={18} /> Request Claude review</>}
            </button>
            <p className="text-xs text-slate-400">Sends the structured clinical inputs to Claude. Use de-identified data.</p>
            {failed && <p role="status" className="rounded-lg bg-amber-950 p-3 text-sm text-amber-100">Claude review is unavailable. The rules-based assessment above remains available.</p>}
          </div>
        )}

        {isAssessment && analysis && (
          <section aria-label="Claude review" className="space-y-5">
            <h2 className="text-lg font-semibold">Claude review</h2>
            <ResultCard icon={<ClipboardList size={18} />} title="Diagnosing hypertension">
              <FieldRow label="AI interpretation">{analysis.diagnosis?.stage_confirmed}</FieldRow>
              <FieldRow label="Confirmation required">{analysis.diagnosis?.confirmation_required}</FieldRow>
              <p className="text-sm leading-relaxed mt-2">{analysis.diagnosis?.narrative}</p>
            </ResultCard>

            <ResultCard icon={<Activity size={18} />} title="2. Cardiovascular risk & target organ damage">
              <FieldRow label="Risk context">{analysis.risk_and_target_organ_damage?.qrisk_context}</FieldRow>
              {analysis.risk_and_target_organ_damage?.target_organ_damage_workup?.length > 0 && (
                <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                  {analysis.risk_and_target_organ_damage.target_organ_damage_workup.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
              <p className="text-sm leading-relaxed mt-2">{analysis.risk_and_target_organ_damage?.narrative}</p>
              <details className="mt-2 text-[13px]">
                <summary className="cursor-pointer text-teal-300 font-mono text-xs uppercase tracking-wide">Standard TOD screen (1.3.3)</summary>
                <ul className="list-disc pl-5 mt-1 space-y-1">{TOD_SCREEN.map((t,i)=><li key={i}>{t}</li>)}</ul>
              </details>
            </ResultCard>

            <ResultCard icon={<Pill size={18} />} title="3. Treating and monitoring hypertension">
              <div className="flex items-center gap-2 mb-1">
                {analysis.treatment_and_monitoring?.treatment_indicated
                  ? <span className="flex items-center gap-1 text-rose-300 text-sm font-medium"><CheckCircle2 size={15}/> Treatment indicated</span>
                  : <span className="flex items-center gap-1 text-teal-300 text-sm font-medium"><XCircle size={15}/> No drug recommendation in Claude review</span>}
              </div>
              <FieldRow label="BP target">{analysis.treatment_and_monitoring?.bp_target || local?.clinicTarget}</FieldRow>
              <FieldRow label="Recommended step">{analysis.treatment_and_monitoring?.recommended_step || local?.stepRecommendation}</FieldRow>
              <FieldRow label="Drug class guidance">{analysis.treatment_and_monitoring?.drug_class_guidance}</FieldRow>
              <FieldRow label="Monitoring interval"><span className="flex items-center gap-1"><CalendarClock size={13}/>{analysis.treatment_and_monitoring?.monitoring_interval}</span></FieldRow>
              <p className="text-sm leading-relaxed mt-2">{analysis.treatment_and_monitoring?.narrative}</p>
            </ResultCard>

            <ResultCard icon={<ShieldAlert size={18} />} title="4. Same-day specialist review" accent={analysis.same_day_referral?.indicated ? "#7A1F14" : undefined}>
              <p className="font-medium text-sm mb-1" style={{ color: analysis.same_day_referral?.indicated ? "#fda4af" : "#99f6e4" }}>
                {analysis.same_day_referral?.indicated ? "Indicated" : "Not indicated at this time"}
              </p>
              {analysis.same_day_referral?.reasons?.length > 0 && (
                <ul className="list-disc pl-5 text-sm space-y-1">{analysis.same_day_referral.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
              )}
              <p className="text-sm leading-relaxed mt-2">{analysis.same_day_referral?.narrative}</p>
            </ResultCard>

            <div className="bg-slate-900 text-[#F7F5F0] rounded-sm p-5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#9FB8C4] mb-2 flex items-center gap-1"><BookOpen size={13}/> Specialist summary</p>
              <p className="text-sm leading-relaxed">{analysis.specialist_summary}</p>
            </div>
          </section>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 pb-10 pt-2 text-[12px] text-slate-400 font-mono">
        NICE NG136, hypertension in adults: diagnosis and management (last updated Feb 2026) · decision support only, not a diagnostic device
      </footer>
    </div>
  );
}

function ResultCard({ icon, title, children, accent }) {
  return (
    <div className="bg-slate-900 border rounded-sm p-5" style={{ borderColor: accent ? "#9f1239" : "#334155" }}>
      <h3 className="font-serif text-[17px] font-semibold flex items-center gap-2 mb-3" style={{ color: accent ? "#fda4af" : "#f1f5f9" }}>{icon} {title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm py-0.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400 w-40 shrink-0">{label}</span>
      <span>{children}</span>
    </div>
  );
}
