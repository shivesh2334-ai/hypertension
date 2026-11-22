const STAGES = [
  { key: "normal", label: "Not hypertensive (by clinic reading)", band: "<140/90 clinic", color: "#2D6E6E" },
  { key: "stage1", label: "Stage 1 hypertension", band: "140–159 / 90–99 clinic · 135–149/85–94 ABPM/HBPM", color: "#C08A2E" },
  { key: "stage2", label: "Stage 2 hypertension", band: "160–179 / 100–119 clinic · ≥150/95 ABPM/HBPM", color: "#C1392B" },
  { key: "stage3", label: "Stage 3 / severe hypertension", band: "≥180 systolic or ≥120 diastolic clinic", color: "#7A1F14" },
];

export function classify(sys, dia) {
  if (sys >= 180 || dia >= 120) return STAGES[3];
  if (sys >= 160 || dia >= 100) return STAGES[2];
  if (sys >= 140 || dia >= 90) return STAGES[1];
  return STAGES[0];
}

export const RED_FLAG_SYMPTOMS = [
  { key: "papilledema", label: "Retinal haemorrhage or papilloedema (accelerated hypertension)", group: "1.5.2" },
  { key: "confusion", label: "New-onset confusion", group: "1.5.2" },
  { key: "chestpain", label: "Chest pain", group: "1.5.2" },
  { key: "hf", label: "Signs of heart failure", group: "1.5.2" },
  { key: "aki", label: "Acute kidney injury", group: "1.5.2" },
  { key: "phaeo", label: "Suspected phaeochromocytoma — labile/postural BP, headache, palpitations, pallor, abdominal pain, diaphoresis", group: "1.5.3" },
];

export const TOD_SCREEN = [
  "Urine albumin:creatinine ratio + reagent-strip haematuria",
  "HbA1c, electrolytes, creatinine, eGFR, total cholesterol, HDL",
  "Fundoscopy for hypertensive retinopathy",
  "12-lead ECG",
];

export const ETHNICITY_OPTIONS = ["Not Black African / African–Caribbean", "Black African or African–Caribbean family origin"];

/* ---------------------------------------------------------------
   DETERMINISTIC ENGINE — mirrors NG136 recommendation numbers
--------------------------------------------------------------- */
export function buildLocalAssessment(f, sys, dia, redFlags) {
  const clinic = f.setting === "clinic";
  const severeReading = sys >= 180 || dia >= 120;
  const raisedAverage = sys >= 135 || dia >= 85;
  const stage = clinic ? classify(sys, dia) : {
    key: "average",
    label: raisedAverage ? "Raised out-of-office average" : "Below out-of-office diagnostic threshold",
    band: sys >= 150 || dia >= 95 ? "Meets ≥150 systolic or ≥95 diastolic" : "Diagnostic threshold 135/85",
    color: raisedAverage ? "#e8a46c" : "#80dbd0",
  };
  const age = parseFloat(f.age) || null;
  const isBlackAfricanCaribbean = f.ethnicity === ETHNICITY_OPTIONS[1];
  const flagsChecked = Object.entries(redFlags).filter(([, v]) => v).map(([k]) => k);
  const hasEmergencyFlag = flagsChecked.some((k) => ["papilledema", "confusion", "chestpain", "hf", "aki"].includes(k));
  const hasPhaeo = flagsChecked.includes("phaeo");

  // 1.5.2 / 1.5.3 same-day referral
  let sameDayReferral = false;
  const referralReasons = [];
  if (clinic && severeReading && hasEmergencyFlag) {
    sameDayReferral = true;
    referralReasons.push("Clinic systolic BP ≥180 or diastolic BP ≥120 mmHg with retinal signs or a life-threatening feature (1.5.2)");
  }
  if (hasPhaeo) {
    sameDayReferral = true;
    referralReasons.push("Features suggestive of phaeochromocytoma (1.5.3)");
  }
  const severeNoRedFlag = clinic && severeReading && !sameDayReferral;

  // 1.4.9–1.4.14 treatment threshold
  let treatmentPathway = "";
  if (sameDayReferral || hasEmergencyFlag) {
    treatmentPathway = "Arrange urgent clinical evaluation of the selected findings. Use the emergency pathway when indicated.";
  } else if (!clinic) {
    treatmentPathway = severeReading
      ? "Arrange prompt clinical review and verify a current BP. An average cannot establish the clinic-based severe hypertension pathway."
      : "Review this average with the standardized clinic BP and clinical history before deciding on treatment.";
  } else if (stage.key === "stage3") {
    treatmentPathway = "Severe hypertension pathway — see same-day referral / TOD-first workup (1.5.1) rather than routine step-1 initiation.";
  } else if (stage.key === "stage2") {
    treatmentPathway = "For persistent, confirmed stage 2 hypertension, offer drug treatment alongside lifestyle advice (1.4.9). Use clinical judgement if frail/multimorbid.";
  } else if (stage.key === "stage1") {
    const hasQualifyingRiskFactor = f.tod || f.cvd || f.priorStroke || f.heartFailureHx || f.ckd || f.diabetes || f.t1dm || (parseFloat(f.qrisk) >= 10);
    if (age !== null && age >= 80) {
      treatmentPathway = sys > 150 || dia > 90
        ? "Consider drug treatment — clinic BP is above 150/90 in a person aged ≥80 with stage 1 hypertension (1.4.13)."
        : "Stage 1 in a person aged ≥80 with clinic BP ≤150/90 — treatment threshold not automatically met; use clinical judgement (1.4.13).";
    } else if (age === null) {
      treatmentPathway = "Confirm the diagnosis and record age to choose the stage 1 treatment threshold (1.4.10–1.4.13).";
    } else if (hasQualifyingRiskFactor) {
      treatmentPathway = "Discuss starting treatment: qualifying factor present — target organ damage, established CVD, renal disease, diabetes, or QRISK ≥10% (1.4.10).";
    } else if (f.qrisk === "" || !Number.isFinite(Number(f.qrisk))) {
      treatmentPathway = "Confirm the diagnosis and complete cardiovascular risk assessment before selecting the stage 1 treatment pathway (1.4.10–1.4.12).";
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
  } else if (f.onTreatment) {
    treatmentPathway = "Review the reading against the individualized treatment target. Continue periodic monitoring and offer an annual hypertension review (1.4.15–1.4.23).";
  } else {
    treatmentPathway = "Clinic BP below diagnostic threshold — reinforce lifestyle advice; re-measure at least every 5 years, more often if borderline (1.2.10, 1.2.11).";
  }

  // 1.4.20–1.4.22 targets
  const older = age !== null && age >= 80;
  let clinicTarget = age === null ? "Enter age to select a target" : older ? "<150/90 mmHg" : "<140/90 mmHg";
  let ambTarget = age === null ? "Enter age to select a target" : older ? "<145/85 mmHg" : "<135/85 mmHg";
  if (f.ckd || (f.t1dm && !older)) {
    clinicTarget = f.acr === "" || !Number.isFinite(Number(f.acr)) || Number(f.acr) < 0 ? "Enter urine ACR to select a clinic target" :
      Number(f.acr) >= 70 ? "<130/80 mmHg (ACR ≥70 mg/mmol)" : "<140/90 mmHg (ACR <70 mg/mmol)";
    ambTarget = "Individualize with the relevant CKD or type 1 diabetes guidance";
  }

  // Step 1–4 drug logic (1.4.32–1.4.52)
  const core = ["ACEi/ARB", "CCB", "Thiazide-like diuretic"];
  const missing = core.filter((drug) => !f.currentDrugClasses.includes(drug));
  const aboveStandardTarget = age !== null && (sys >= (older ? 150 : 140) || dia >= 90);
  let stepRecommendation = "Review indications, contraindications and the confirmed BP pattern before changing medicines.";
  const routine = clinic && !severeReading && !sameDayReferral && !hasEmergencyFlag;
  if (routine && f.onTreatment && aboveStandardTarget && !f.ckd && !f.t1dm) {
    if (missing.length === 0) {
      stepRecommendation = "Possible resistant hypertension if BP remains above target on optimal tolerated doses. Confirm with ABPM/HBPM and review adherence and postural BP before step 4 (1.4.46–1.4.47).";
      if (f.currentDrugClasses.length > 3) {
        stepRecommendation += " Review the fourth agent and seek specialist advice if BP remains uncontrolled on four optimal tolerated agents (1.4.51).";
      } else if (!(Number(f.potassium) > 0) || !(Number(f.eGFR) > 0)) {
        stepRecommendation += " Check potassium and renal function before considering further treatment.";
      } else if (Number(f.potassium) <= 4.5) {
        stepRecommendation += " After confirmation, consider low-dose spironolactone with caution in reduced eGFR. Check sodium, potassium and renal function within 1 month if started (1.4.48–1.4.49).";
      } else {
        stepRecommendation += " After confirmation, consider an alpha-blocker or beta-blocker (1.4.50).";
      }
    } else if (missing.length === 1 && f.currentDrugClasses.length === 2) {
      stepRecommendation = `If still uncontrolled on optimal tolerated therapy, review adherence and consider adding ${missing[0]} (1.4.44–1.4.45).`;
    } else if (f.currentDrugClasses.length === 1 && f.currentDrugClasses[0] === "ACEi/ARB") {
      stepRecommendation = "If still uncontrolled, review adherence then consider adding a CCB or thiazide-like diuretic (1.4.41).";
    } else if (f.currentDrugClasses.length === 1 && f.currentDrugClasses[0] === "CCB") {
      stepRecommendation = isBlackAfricanCaribbean && !f.diabetes
        ? "If still uncontrolled, review adherence and consider an ARB or thiazide-like diuretic (1.4.42–1.4.43)."
        : "If still uncontrolled, review adherence and consider an ACE inhibitor, ARB or thiazide-like diuretic (1.4.42).";
    }
  } else if (routine && !f.onTreatment && !f.ckd && !f.t1dm && !f.heartFailureHx && stage.key !== "normal") {
    if (f.diabetes || (!isBlackAfricanCaribbean && age !== null && age < 55)) {
      stepRecommendation = "If treatment is indicated after confirmation, NICE step 1 generally uses an ACE inhibitor or ARB (1.4.32).";
    } else if (isBlackAfricanCaribbean || (age !== null && age >= 55)) {
      stepRecommendation = "If treatment is indicated after confirmation, NICE step 1 generally uses a calcium-channel blocker (1.4.35).";
    }
  }

  let confirmation = "Repeat standardized clinic measurements as appropriate. A single reading does not exclude masked hypertension.";
  if (!clinic) {
    confirmation = "Interpret alongside standardized clinic BP. A daytime ABPM or HBPM average alone does not establish NICE stage (1.2.8).";
  } else if (severeReading) {
    confirmation = "Use the severe clinic BP pathway (1.5.1–1.5.2).";
  } else if (stage.key !== "normal") {
    confirmation = "Confirm with daytime ABPM, or HBPM when ABPM is unsuitable. Assess cardiovascular risk and target organ damage while awaiting confirmation (1.2.3–1.2.9).";
  }

  return {
    stage, sameDayReferral, referralReasons, severeNoRedFlag,
    treatmentPathway, clinicTarget, ambTarget, stepRecommendation, confirmation,
    hasEmergencyFlag, severeOutOfOffice: !clinic && severeReading,
  };
}
