#!/usr/bin/env node
/**
 * Phase 4 — deterministic recommended practice adapter + button visibility rules.
 * npm run test:adaptive-planner:recommended-practice
 */
const vmMod = await import(
  new URL("../lib/learning-client/adaptive-planner-recommendation-view-model.js", import.meta.url).href
);
const rpMod = await import(
  new URL("../lib/learning-client/adaptive-planner-recommended-practice.js", import.meta.url).href
);
const schedMod = await import(
  new URL("../lib/learning-client/scheduleAdaptivePlannerRecommendation.js", import.meta.url).href
);

const { buildPlannerRecommendationViewModel } = vmMod;
const {
  buildRecommendedPracticeFromViewModel,
  mapPlannerTargetDifficultyToTriLevel,
  mergePlannerSessionClientMeta,
  shouldRenderPlannerRecommendedPracticeButton,
  PLANNER_RECOMMENDED_PRACTICE_BUTTON_HE,
} = rpMod;
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

const safeVm = () =>
  buildPlannerRecommendationViewModel({
    ok: true,
    recommendation: {
      nextAction: "maintain_skill",
      targetDifficulty: "standard",
      questionCount: 7,
      reasonCodes: ["X"],
      mustNotSay: ["Y"],
    },
    diagnostics: { safetyViolationCount: 0, metadataSubjectFallback: false },
  });

run("adapter maps targetDifficulty / questionCount / nextAction", () => {
  const vm = safeVm();
  const out = buildRecommendedPracticeFromViewModel(vm);
  assert(out.ok === true && out.source === "adaptive_planner_recommended_practice");
  assert(out.startOptions.recommended === true);
  assert(out.startOptions.nextAction === "maintain_skill");
  assert(out.startOptions.targetDifficulty === "standard");
  assert(out.startOptions.questionCount === 7);
});

run("tri-level map: standard → medium", () => {
  assert(mapPlannerTargetDifficultyToTriLevel("standard") === "medium");
});

run("tri-level map: unknown → null (safe degrade)", () => {
  assert(mapPlannerTargetDifficultyToTriLevel("not_a_real_tier") === null);
});

run("adapter ok=false when view model null", () => {
  const out = buildRecommendedPracticeFromViewModel(null);
  assert(out.ok === false);
});

run("adapter ok=false when missing nextAction", () => {
  const vm = safeVm();
  vm.forPractice.nextAction = "";
  const out = buildRecommendedPracticeFromViewModel(vm);
  assert(out.ok === false && out.reason === "missing_next_action");
});

run("mergePlannerSessionClientMeta adds markers only", () => {
  const merged = mergePlannerSessionClientMeta(
    { source: "test", version: "1" },
    {
      plannerRecommended: true,
      plannerNextAction: "advance_skill",
      plannerTargetDifficulty: "intro",
      plannerQuestionCount: 12,
    }
  );
  assert(merged.source === "test");
  assert(merged.plannerRecommended === true);
  assert(merged.plannerNextAction === "advance_skill");
  assert(merged.plannerTargetDifficulty === "intro");
  assert(merged.plannerQuestionCount === 12);
});

run("button hidden when no callback", () => {
  assert(shouldRenderPlannerRecommendedPracticeButton(safeVm(), null) === false);
  assert(shouldRenderPlannerRecommendedPracticeButton(safeVm(), undefined) === false);
});

run("button visible when callback + safe vm", () => {
  assert(shouldRenderPlannerRecommendedPracticeButton(safeVm(), () => {}) === true);
});

run("button hidden for null recommendation", () => {
  assert(shouldRenderPlannerRecommendedPracticeButton(null, () => {}) === false);
});

run("button hidden when ok=false payload (no vm)", () => {
  assert(shouldRenderPlannerRecommendedPracticeButton(buildPlannerRecommendationViewModel({ ok: false }), () => {}) === false);
});

run("button hidden when safetyViolationCount>0", () => {
  const vm = buildPlannerRecommendationViewModel({
    ok: true,
    recommendation: { nextAction: "maintain_skill", targetDifficulty: "easy", questionCount: 1 },
    diagnostics: { safetyViolationCount: 2, metadataSubjectFallback: false },
  });
  assert(vm === null);
  assert(shouldRenderPlannerRecommendedPracticeButton(vm, () => {}) === false);
});

run("view model never exposes reasonCodes/mustNotSay on forPractice", () => {
  const vm = safeVm();
  assert(!("reasonCodes" in vm.forPractice) && !("mustNotSay" in vm.forPractice));
});

run("Hebrew button label constant", () => {
  assert(PLANNER_RECOMMENDED_PRACTICE_BUTTON_HE === "המשך לתרגול מומלץ");
});

const prev = process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;
delete process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;
run("schedule flag off unchanged (undefined)", () => {
  const out = scheduleAdaptivePlannerRecommendation({ subject: "math", grade: "g3" }, { onResult: () => {} });
  assert(out === undefined, String(out));
});
if (prev !== undefined) process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION = prev;

if (process.exitCode) {
  console.error("adaptive-planner-recommended-practice.mjs: failures");
  process.exit(1);
}
console.log("adaptive-planner-recommended-practice.mjs: all checks passed");
