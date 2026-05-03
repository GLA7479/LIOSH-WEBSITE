#!/usr/bin/env node
/**
 * Phase 5 — adaptive planner AI explainer guards (validator, allowlist, view-model gates).
 * npm run test:adaptive-planner:ai-explainer
 */
const validateMod = await import(
  new URL("../lib/learning-client/adaptive-planner-explanation-validate.js", import.meta.url).href
);
const explainerMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-ai-explainer.js", import.meta.url).href
);
const vmMod = await import(
  new URL("../lib/learning-client/adaptive-planner-recommendation-view-model.js", import.meta.url).href
);

const {
  validateAdaptivePlannerExplanationText,
  isAdaptivePlannerAIExplainerClientDisplayEnabled,
  PLANNER_AI_EXPLANATION_SECTION_LABEL_HE,
} = validateMod;
const {
  buildStrictPlannerExplainerInput,
  isAdaptivePlannerAIExplainerServerEnabled,
  getDeterministicPlannerExplanationFallback,
  buildAdaptivePlannerAIExplanation,
} = explainerMod;
const { buildPlannerRecommendationViewModel } = vmMod;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function run(label, fn) {
  try {
    fn();
    console.log(`OK  ${label}`);
  } catch (e) {
    console.error(`FAIL ${label}:`, e?.message || e);
    process.exitCode = 1;
  }
}

run("validator rejects markdown", () => {
  const r = validateAdaptivePlannerExplanationText("זהו טקסט **לא** תקין.");
  assert(r.ok === false);
});

run("validator rejects English planner labels", () => {
  assert(validateAdaptivePlannerExplanationText("נמשיך עם advance_skill עכשיו.").ok === false);
});

run("validator rejects too long", () => {
  const s = "א".repeat(200);
  assert(validateAdaptivePlannerExplanationText(s).ok === false);
});

run("validator rejects emoji", () => {
  assert(validateAdaptivePlannerExplanationText("זה טוב 😀 לתרגל.").ok === false);
});

run("validator rejects digits", () => {
  assert(validateAdaptivePlannerExplanationText("נתרגל עוד 3 שאלות.").ok === false);
});

run("validator rejects pressure Hebrew", () => {
  assert(validateAdaptivePlannerExplanationText("חייבים לעשות את זה עכשיו.").ok === false);
});

run("validator accepts safe Hebrew one-liner", () => {
  const r = validateAdaptivePlannerExplanationText("המערכת מציעה להמשיך לתרגל בהתאם למה שמתאים לך עכשיו.");
  assert(r.ok === true && r.text.length > 0);
});

run("strict explainer input excludes unknown keys (shape)", () => {
  const inp = buildStrictPlannerExplainerInput({
    subject: "math",
    grade: "g3",
    nextAction: "maintain_skill",
    targetDifficulty: "standard",
    questionCount: 5,
    approvedHebrewRecommendationLine: "כדאי להמשיך לתרגל באותה רמה",
    reasonCodes: ["X"],
    mustNotSay: ["Y"],
    diagnostics: { z: 1 },
  });
  assert(inp && Object.keys(inp).length === 6);
  assert(!("reasonCodes" in inp));
});

run("server explainer disabled → buildAdaptivePlannerAIExplanation not ok", async () => {
  const prev = process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  delete process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  const out = await buildAdaptivePlannerAIExplanation(
    {
      subject: "math",
      grade: "g3",
      nextAction: "maintain_skill",
      targetDifficulty: "standard",
      questionCount: 4,
      approvedHebrewRecommendationLine: "כדאי להמשיך לתרגל באותה רמה",
    },
    { env: process.env, preferDeterministicOnly: true }
  );
  if (prev !== undefined) process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = prev;
  assert(out.ok === false);
});

run("server explainer enabled + deterministic only → ok text", async () => {
  process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = "1";
  const out = await buildAdaptivePlannerAIExplanation(
    {
      subject: "math",
      grade: "g3",
      nextAction: "maintain_skill",
      targetDifficulty: "standard",
      questionCount: 4,
      approvedHebrewRecommendationLine: "כדאי להמשיך לתרגל באותה רמה",
    },
    { env: process.env, preferDeterministicOnly: true }
  );
  delete process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  assert(out.ok === true && out.source === "deterministic_fallback");
  const v = validateAdaptivePlannerExplanationText(out.text);
  assert(v.ok === true);
});

run("view model hides explanation when client display flag off", () => {
  const prev = process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  delete process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  const vm = buildPlannerRecommendationViewModel({
    ok: true,
    recommendation: { nextAction: "maintain_skill", targetDifficulty: "standard", questionCount: 3 },
    diagnostics: { safetyViolationCount: 0, metadataSubjectFallback: false },
    explanation: { ok: true, text: getDeterministicPlannerExplanationFallback("maintain_skill") },
  });
  if (prev !== undefined) process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = prev;
  assert(vm && !("explanationText" in vm));
});

run("view model includes explanation when client flag on and API safe", () => {
  const prev = process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = "1";
  const text = getDeterministicPlannerExplanationFallback("practice_current");
  const vm = buildPlannerRecommendationViewModel({
    ok: true,
    recommendation: { nextAction: "practice_current", targetDifficulty: "intro", questionCount: 2 },
    diagnostics: { safetyViolationCount: 0, metadataSubjectFallback: false },
    explanation: { ok: true, text },
  });
  if (prev !== undefined) process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = prev;
  else delete process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  assert(vm && vm.explanationText === text);
});

run("view model drops invalid explanation text", () => {
  const prev = process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = "true";
  const vm = buildPlannerRecommendationViewModel({
    ok: true,
    recommendation: { nextAction: "maintain_skill", targetDifficulty: "standard", questionCount: 3 },
    diagnostics: { safetyViolationCount: 0, metadataSubjectFallback: false },
    explanation: { ok: true, text: "bad advance_skill" },
  });
  if (prev !== undefined) process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = prev;
  else delete process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  assert(vm && !("explanationText" in vm));
});

run("fixed Hebrew UI label constant", () => {
  assert(PLANNER_AI_EXPLANATION_SECTION_LABEL_HE === "ככה נבחר התרגול הבא");
});

run("isAdaptivePlannerAIExplainerServerEnabled respects env", () => {
  const prev = process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  delete process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
  assert(isAdaptivePlannerAIExplainerServerEnabled(process.env) === false);
  process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = "yes";
  assert(isAdaptivePlannerAIExplainerServerEnabled(process.env) === true);
  if (prev !== undefined) process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = prev;
  else delete process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;
});

if (process.exitCode) {
  console.error("adaptive-planner-ai-explainer.mjs: failures");
  process.exit(1);
}
console.log("adaptive-planner-ai-explainer.mjs: all checks passed");
