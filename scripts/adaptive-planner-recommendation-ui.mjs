#!/usr/bin/env node
/**
 * Deterministic UI mapping tests for adaptive planner recommendation (Phase 3).
 * npm run test:adaptive-planner:recommendation-ui
 */
const vmMod = await import(
  new URL("../lib/learning-client/adaptive-planner-recommendation-view-model.js", import.meta.url).href
);
const schedMod = await import(
  new URL("../lib/learning-client/scheduleAdaptivePlannerRecommendation.js", import.meta.url).href
);

const { mapPlannerNextActionToHebrew, buildPlannerRecommendationViewModel, PLANNER_UI_SECTION_TITLE } = vmMod;
const { scheduleAdaptivePlannerRecommendation } = schedMod;

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

run("map advance_skill → approved Hebrew", () => {
  const t = mapPlannerNextActionToHebrew("advance_skill");
  assert(t === "אפשר להתקדם לשלב הבא", t);
});

run("map maintain_skill", () => {
  assert(mapPlannerNextActionToHebrew("maintain_skill") === "כדאי להמשיך לתרגל באותה רמה");
});

run("map practice_current → remediate copy", () => {
  assert(mapPlannerNextActionToHebrew("practice_current") === "כדאי לחזק את הבסיס לפני שמתקדמים");
});

run("map probe_skill → review copy", () => {
  assert(mapPlannerNextActionToHebrew("probe_skill") === "כדאי לבצע חזרה קצרה");
});

run("map review_prerequisite → review copy", () => {
  assert(mapPlannerNextActionToHebrew("review_prerequisite") === "כדאי לבצע חזרה קצרה");
});

run("ok=false → no view model", () => {
  assert(buildPlannerRecommendationViewModel({ ok: false, source: "x" }) === null);
});

run("safetyViolationCount>0 → hidden", () => {
  assert(
    buildPlannerRecommendationViewModel({
      ok: true,
      recommendation: { nextAction: "maintain_skill", targetDifficulty: "standard", questionCount: 3, reasonCodes: ["x"], mustNotSay: ["y"] },
      diagnostics: { safetyViolationCount: 1, metadataSubjectFallback: false },
    }) === null
  );
});

run("metadataSubjectFallback → hidden", () => {
  assert(
    buildPlannerRecommendationViewModel({
      ok: true,
      recommendation: { nextAction: "maintain_skill", targetDifficulty: "standard", questionCount: 3 },
      diagnostics: { safetyViolationCount: 0, metadataSubjectFallback: true },
    }) === null
  );
});

run("ok=true safe payload → view model (no leaked internals)", () => {
  const vm = buildPlannerRecommendationViewModel({
    ok: true,
    recommendation: {
      nextAction: "advance_skill",
      targetDifficulty: "standard",
      questionCount: 5,
      reasonCodes: ["ENGINE_INSUFFICIENT_DATA"],
      mustNotSay: ["Do not infer medical"],
    },
    diagnostics: {
      safetyViolationCount: 0,
      metadataSubjectFallback: false,
    },
  });
  assert(vm && vm.sectionTitle === PLANNER_UI_SECTION_TITLE);
  assert(!("reasonCodes" in vm) && !("mustNotSay" in vm) && !("diagnostics" in vm));
  const fp = vm.forPractice;
  assert(fp && typeof fp === "object");
  assert(Object.keys(fp).length === 3);
  assert(fp.nextAction === "advance_skill");
  assert(fp.targetDifficulty === "standard");
  assert(fp.questionCount === 5);
});

const prev = process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;
delete process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;
run("schedule returns undefined when flag off (no throw)", () => {
  const out = scheduleAdaptivePlannerRecommendation({ subject: "math", grade: "g3" }, { onResult: () => {} });
  assert(out === undefined, String(out));
});
if (prev !== undefined) process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION = prev;

if (process.exitCode) {
  console.error("adaptive-planner-recommendation-ui.mjs: failures");
  process.exit(1);
}
console.log("adaptive-planner-recommendation-ui.mjs: all checks passed");
