import assert from "node:assert/strict";
import { test } from "node:test";
import { buildLocalAssessment } from "../src/assessment.js";
import handler from "../api/assessment.js";

const form = { setting: "clinic", age: "56", qrisk: "", acr: "", potassium: "", eGFR: "", currentDrugClasses: [] };
const assess = (sys, dia, extras = {}, flags = {}) => buildLocalAssessment({ ...form, ...extras }, sys, dia, flags);

test("clinic BP bands use either qualifying component", () => {
  for (const [sys, dia, expected] of [[139, 89, "normal"], [139, 90, "stage1"], [159, 100, "stage2"], [180, 80, "stage3"], [170, 120, "stage3"]]) {
    assert.equal(assess(sys, dia).stage.key, expected);
  }
  assert.match(assess(140, 89).confirmation, /Confirm with daytime ABPM/);
});

test("home and ambulatory averages have their own threshold and do not establish clinic staging", () => {
  for (const setting of ["abpm", "hbpm"]) {
    assert.match(assess(134, 84, { setting }).stage.label, /Below/);
    assert.match(assess(134, 85, { setting }).stage.label, /Raised/);
    const severe = assess(181, 122, { setting });
    assert.equal(severe.severeOutOfOffice, true);
    assert.equal(severe.severeNoRedFlag, false);
    assert.match(severe.confirmation, /does not establish NICE stage/);
  }
});

test("selected urgent findings take precedence over routine treatment", () => {
  assert.equal(assess(180, 90, {}, { chestpain: true }).sameDayReferral, true);
  assert.equal(assess(180, 90).severeNoRedFlag, true);
  assert.equal(assess(142, 90, {}, { phaeo: true }).sameDayReferral, true);
  const symptomatic = assess(142, 90, {}, { chestpain: true });
  assert.equal(symptomatic.hasEmergencyFlag, true);
  assert.match(symptomatic.treatmentPathway, /urgent/);
  assert.doesNotMatch(symptomatic.stepRecommendation, /step 1/);
});

test("missing QRISK and ACR are explicit, and the age-80 T1DM target is preserved", () => {
  assert.match(assess(145, 90).treatmentPathway, /complete cardiovascular risk/);
  assert.match(assess(145, 90, { ckd: true }).clinicTarget, /Enter urine ACR/);
  assert.match(assess(145, 90, { ckd: true, acr: "70" }).clinicTarget, /<130\/80/);
  assert.equal(assess(150, 90, { age: "80", t1dm: true, acr: "70" }).clinicTarget, "<150/90 mmHg");
});

test("resistant hypertension checks the actual core classes and recent labs", () => {
  const currentDrugClasses = ["ACEi/ARB", "CCB", "Thiazide-like diuretic"];
  assert.match(assess(165, 99, { onTreatment: true, currentDrugClasses }).stepRecommendation, /Check potassium and renal function/);
  assert.match(assess(165, 99, { onTreatment: true, currentDrugClasses, potassium: "4.5", eGFR: "60" }).stepRecommendation, /spironolactone/);
  assert.match(assess(165, 99, { onTreatment: true, currentDrugClasses, potassium: "4.6", eGFR: "60" }).stepRecommendation, /alpha-blocker/);
  assert.doesNotMatch(assess(165, 99, { onTreatment: true, currentDrugClasses: ["CCB", "Alpha-blocker", "Beta-blocker"] }).stepRecommendation, /resistant/);
});

test("server response for a missing Claude key is graceful", async () => {
  const key = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  const response = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  try {
    await handler({ method: "POST", body: { systolic: 142, diastolic: 90, measurement_setting: "clinic" } }, response);
    assert.equal(response.code, 503);
    assert.equal(response.body.error, "Claude review unavailable");
  } finally {
    if (key !== undefined) process.env.ANTHROPIC_API_KEY = key;
  }
});
