// Paraphrased adult hypertension guidance, reviewed 24 November 2026.
export const guidelines = [
  {
    id: "NICE",
    title: "NICE NG136 — Hypertension in adults",
    url: "https://www.nice.org.uk/guidance/ng136/chapter/Recommendations",
    summary: [
      "Confirm clinic BP of at least 140/90 with daytime ABPM or HBPM average at least 135/85. Prefer ABPM when feasible. At clinic BP 180 systolic or 120 diastolic or higher, assess urgency and organ damage promptly. Retinal haemorrhage, papilloedema or life-threatening symptoms with severe BP warrant same-day specialist assessment.",
      "Baseline assessment includes urine ACR and haematuria, HbA1c, electrolytes, creatinine/eGFR, total and HDL cholesterol, fundoscopy and 12-lead ECG. Assess CVD risk using the UK pathway where applicable.",
      "Offer drug treatment for persistent stage 2. Discuss treatment for persistent stage 1 under age 80 with organ damage, CVD, renal disease, diabetes or estimated 10-year CVD risk at least 10%. Consider treatment under 60 even below that risk. Usual clinic targets are under 140/90 below age 80 and under 150/90 at 80+, with standing BP, frailty and disease-specific exceptions as appropriate.",
      "Step 1 generally uses ACE inhibitor/ARB for type 2 diabetes or age below 55 without Black African or African–Caribbean family origin; otherwise use CCB, or a thiazide-like diuretic if CCB is unsuitable. Escalate to ACE inhibitor or ARB plus CCB plus thiazide-like diuretic when appropriate. Confirm true resistance and assess potassium and renal function before fourth-line therapy.",
    ],
  },
  {
    id: "IGH-V",
    title: "Indian Guidelines on Hypertension V (2025–2026, JAPI)",
    url: "https://japi.org/article/japi-74-5-s1-8",
    summary: [
      "Indian guideline series developed with CSI participation in its original edition. Use IGH-V as the Indian practice reference and label it IGH-V.",
      "The usual office threshold is systolic 140 or diastolic 90 mm Hg. Out-of-office measurements help distinguish sustained, masked and white-coat hypertension. Assess CVD risk, hypertension-mediated organ damage, frailty and symptomatic orthostasis when choosing thresholds and targets.",
      "High-normal office BP with established CVD, CKD, diabetes, familial hypercholesterolaemia or hypertension-mediated organ damage may warrant earlier pharmacotherapy and a target below 130/80 when appropriate. The text and initiation table differ in wording on timing for high-normal BP. Flag this if relevant and avoid assigning a single timing rule from this summary.",
      "Use a DASH-style diet, reduce sodium and encourage regular moderate aerobic activity such as brisk walking for about 30 minutes on most days when clinically suitable. Adapt examples to Indian meals and avoid blanket advice to increase potassium in CKD or hyperkalaemia.",
    ],
  },
  {
    id: "CSI journal",
    title: "Indian Heart Journal — Indian primary-care hypertension protocol (2019)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7013193/",
    summary: [
      "This is an implementation paper in CSI's journal. Use it for Indian primary-care delivery context only. It proposes standardized BP measurement across the care team, shared treatment protocols, and patient education by trained team members at diagnosis and follow-up.",
    ],
  },
  {
    id: "ACC/AHA",
    title: "2025 ACC/AHA multisociety high blood pressure guideline",
    url: "https://www.acc.org/Guidelines/Guidelines/2025/08/14/10/42/High-Blood-Pressure-in-Adults-2025",
    summary: [
      "Stage 1 is systolic 130–139 or diastolic 80–89; stage 2 begins at systolic 140 or diastolic 90. Usual treatment goal is below 130/80, individualized for special circumstances.",
      "Recommend medication for average BP at least 140 systolic or 90 diastolic, or from 130 systolic or 80 diastolic with clinical CVD, prior stroke, diabetes, CKD or 10-year PREVENT-CVD risk at least 7.5%. In lower-risk adults, consider the recommended 3–6 month lifestyle trial before medication if BP remains at or above 130/80. PREVENT is a US risk model; avoid presenting it as calibrated for India.",
      "Stage 2 generally favours two first-line agents from different classes, preferably a single-pill combination. First-line classes include ACE inhibitors or ARBs, long-acting dihydropyridine CCBs and thiazide-type diuretics. Support home BP monitoring, DASH-style eating, sodium reduction and moderate physical activity.",
    ],
  },
];

export const planSections = {
  assessment: "Assessment and urgency",
  investigations: "Investigations",
  treatment: "Treatment",
  diet: "Diet",
  exercise: "Exercise",
  followUp: "Follow-up and monitoring",
};
