/**
 * Phase 2-B4 — math fractions M-04 (comparison) / M-05 (operations) with ENABLE_GRADE_AWARE_RECOMMENDATIONS=true.
 * Verifies M-04 g4 comparison path and M-05 g5 operation path; parent-facing surfaces must not leak raw taxonomy probe/intervention/pattern strings.
 *
 *   npx tsx scripts/parent-report-grade-aware-phase2b4-fractions-verify.mjs
 */

import assert from "node:assert/strict";

const M04_G34_ACTION =
  "כדאי לתרגל השוואת שברים בעזרת ציור מדויק או סרגל שברים, ואז להסביר מה מייצג המונה ומה מייצג המכנה. בשברים בעלי אותו מכנה, בקשו מהילד להסביר מדוע משווים לפי מספר החלקים שנלקחו.";
const M04_G34_GOAL =
  "בשבוע הקרוב התמקדו בהשוואת שברים ובהבנת תפקיד המונה והמכנה, במיוחד בשברים בעלי אותו מכנה או בייצוגים פשוטים וברורים.";

const M05_G56_ACTION =
  "כדאי לתרגל חיבור וחיסור שברים עם מכנים שונים בעזרת מציאת מכנה משותף, יצירת שברים שקולים ובדיקת התוצאה לאחר הפעולה. בקשו מהילד להסביר כל שלב לפני שהוא מפשט את התשובה.";
const M05_G56_GOAL =
  "בשבוע הקרוב התמקדו בפעולות חיבור וחיסור בשברים עם מכנים שונים: מכנה משותף, שברים שקולים, ביצוע הפעולה ובדיקת סבירות.";

/** Raw taxonomy / engine cues that must not appear in grade-aware parent-facing strings for M-04/M-05 (template bands). */
const BANNED_IN_PARENT_FACING = [
  "השוואה לפי מונה בלבד",
  "טעות באותה שלב",
  "עם/בלי שרטוט",
  "חלק־כלל קונקרטי",
  "המראה 2,3,4",
  "שלבים כתובים + דוגמה מקבילה",
];

const topicRowKeyM04 = "fractions\u0001learning\u0001g4\u0001easy";
const topicRowKeyM05 = "fractions\u0001learning\u0001g5\u0001easy";

/**
 * @param {string} taxonomyId
 * @param {string} topicRowKey
 */
function buildFractionUnit(taxonomyId, topicRowKey) {
  const isM04 = taxonomyId === "M-04";
  return {
    blueprintRef: "test",
    engineVersion: "v2",
    unitKey: `math::${topicRowKey}`,
    subjectId: "math",
    topicRowKey,
    bucketKey: "fractions",
    displayName: "שברים",
    diagnosis: { allowed: true, taxonomyId, lineHe: "מצביע על דפוס." },
    intervention: {
      immediateActionHe: isM04 ? "חלק־כלל קונקרטי" : "שלבים כתובים + דוגמה מקבילה",
      shortPracticeHe: isM04 ? "עם/בלי שרטוט" : "המראה 2,3,4",
      taxonomyId,
    },
    taxonomy: {
      id: taxonomyId,
      patternHe: isM04 ? "השוואה לפי מונה בלבד" : "טעות באותה שלב",
      topicHe: "שברים",
      subskillHe: isM04 ? "חלק־כלל" : "המראה",
    },
    recurrence: { wrongCountForRules: 4, full: true, wrongEventCount: 4, rowWrongTotal: 4 },
    confidence: { level: "moderate" },
    priority: { level: "P3", breadth: "narrow" },
    competingHypotheses: { hypotheses: [], distinguishingEvidenceHe: [] },
    strengthProfile: { tags: [], dominantBehavior: null },
    outputGating: {
      interventionAllowed: true,
      diagnosisAllowed: true,
      probeOnly: false,
      cannotConcludeYet: false,
      additiveCautionAllowed: false,
      positiveAuthorityLevel: "none",
    },
    probe: { specificationHe: "בדיקה", objectiveHe: "מטרה" },
    explainability: { whyNotStrongerConclusionHe: [], cannotConcludeYetHe: [] },
    canonicalState: {
      actionState: "intervene",
      recommendation: { allowed: false, family: "remedial" },
      assessment: { readiness: "ready", confidenceLevel: "moderate", cannotConcludeYet: false },
      evidence: { positiveAuthorityLevel: "none" },
      topicStateId: isM04 ? "ts_m04" : "ts_m05",
      stateHash: "h1",
    },
  };
}

/**
 * @param {string} name
 * @param {unknown} actual
 * @param {string} expected
 */
function assertEq(name, actual, expected) {
  const a = String(actual ?? "");
  const e = String(expected ?? "");
  if (a !== e) {
    throw new Error(`${name} mismatch.\nexpected (${e.length} chars): ${e}\nactual   (${a.length} chars): ${a}`);
  }
}

/**
 * @param {string} label
 * @param {unknown} blob
 */
function assertNoBanned(label, blob) {
  const s = typeof blob === "string" ? blob : JSON.stringify(blob);
  for (const b of BANNED_IN_PARENT_FACING) {
    if (s.includes(b)) throw new Error(`${label} contains banned internal phrase: ${b}`);
  }
}

const [detailedMod, parentReportV2Mod, truthMod, resolverMod] = await Promise.all([
  import("../utils/detailed-parent-report.js"),
  import("../utils/parent-report-v2.js"),
  import("../utils/parent-copilot/truth-packet-v1.js"),
  import("../utils/parent-report-language/grade-aware-recommendation-resolver.js"),
]);

const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = parentReportV2Mod;
const { buildTruthPacketV1 } = truthMod;
const { resolveGradeAwareParentRecommendationHe } = resolverMod;

const fractionOrderMod = await import(
  new URL("../utils/diagnostic-engine-v2/fraction-taxonomy-candidate-order.js", import.meta.url).href
);
const { orderFractionTaxonomyCandidates } = fractionOrderMod;

function runRoutingSanity() {
  assert.deepEqual(
    orderFractionTaxonomyCandidates(
      ["M-04", "M-05"],
      [{ kind: "frac_compare_like_den_g4" }, { patternFamily: "numerator_only_trap" }],
      {}
    ),
    ["M-04", "M-05"]
  );
  assert.deepEqual(
    orderFractionTaxonomyCandidates(["M-04", "M-05"], [{ patternFamily: "fraction_same_denominator_add_sub" }], {}),
    ["M-05", "M-04"]
  );
}

function runResolverAndProductSurfaces() {
  assertEq("M-04 g4 resolver action", resolveGradeAwareParentRecommendationHe({
    subjectId: "math",
    gradeKey: "g4",
    taxonomyId: "M-04",
    slot: "action",
  }), M04_G34_ACTION);
  assertEq("M-04 g4 resolver nextGoal", resolveGradeAwareParentRecommendationHe({
    subjectId: "math",
    gradeKey: "g4",
    taxonomyId: "M-04",
    slot: "nextGoal",
  }), M04_G34_GOAL);

  assertEq("M-05 g5 resolver action", resolveGradeAwareParentRecommendationHe({
    subjectId: "math",
    gradeKey: "g5",
    taxonomyId: "M-05",
    slot: "action",
  }), M05_G56_ACTION);
  assertEq("M-05 g5 resolver nextGoal", resolveGradeAwareParentRecommendationHe({
    subjectId: "math",
    gradeKey: "g5",
    taxonomyId: "M-05",
    slot: "nextGoal",
  }), M05_G56_GOAL);

  const baseM04 = {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: { totalQuestions: 20 },
    mathOperations: {
      [topicRowKeyM04]: {
        bucketKey: "fractions",
        displayName: "שברים",
        questions: 12,
        correct: 8,
        wrong: 4,
        accuracy: 67,
        gradeKey: "g4",
        modeKey: "learning",
        levelKey: "easy",
        lastSessionMs: Date.UTC(2026, 4, 6, 12, 0, 0),
      },
    },
    diagnosticEngineV2: {
      units: [buildFractionUnit("M-04", topicRowKeyM04)],
    },
  };

  const detailedM04 = buildDetailedParentReportFromBaseReport(baseM04, { period: "week" });
  const mp04 = detailedM04?.subjectProfiles?.find((p) => p.subject === "math");
  assertEq("detailed M-04 g4 parentActionHe", mp04?.parentActionHe, M04_G34_ACTION);
  assertEq("detailed M-04 g4 nextWeekGoalHe", mp04?.nextWeekGoalHe, M04_G34_GOAL);
  assertNoBanned("detailed M-04 parentActionHe", mp04?.parentActionHe);
  assertNoBanned("detailed M-04 nextWeekGoalHe", mp04?.nextWeekGoalHe);

  const shortM04 = summarizeV2UnitsForSubjectForTests(baseM04.diagnosticEngineV2.units, {
    subjectReportQuestions: 12,
    subjectLabelHe: "מתמטיקה",
    topicMap: baseM04.mathOperations,
    reportTotalQuestions: 20,
  });
  assertEq("short M-04 g4 parentActionHe", shortM04.parentActionHe, M04_G34_ACTION);
  assertEq("short M-04 g4 nextWeekGoalHe", shortM04.nextWeekGoalHe, M04_G34_GOAL);
  assertNoBanned("short M-04 parentActionHe", shortM04.parentActionHe);

  const tp04 = buildTruthPacketV1(detailedM04, {
    scopeType: "topic",
    scopeId: topicRowKeyM04,
    scopeLabel: "שברים",
  });
  if (!tp04) throw new Error("buildTruthPacketV1 M-04 returned null");
  const nar04 = tp04?.contracts?.narrative?.textSlots || {};
  assertNoBanned("truth M-04 narrative", JSON.stringify(nar04));
  assertNoBanned("truth M-04 full JSON", JSON.stringify(tp04));

  const baseM05 = {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: { totalQuestions: 20 },
    mathOperations: {
      [topicRowKeyM05]: {
        bucketKey: "fractions",
        displayName: "שברים",
        questions: 12,
        correct: 8,
        wrong: 4,
        accuracy: 67,
        gradeKey: "g5",
        modeKey: "learning",
        levelKey: "easy",
        lastSessionMs: Date.UTC(2026, 4, 6, 12, 0, 0),
      },
    },
    diagnosticEngineV2: {
      units: [buildFractionUnit("M-05", topicRowKeyM05)],
    },
  };

  const detailedM05 = buildDetailedParentReportFromBaseReport(baseM05, { period: "week" });
  const mp05 = detailedM05?.subjectProfiles?.find((p) => p.subject === "math");
  assertEq("detailed M-05 g5 parentActionHe", mp05?.parentActionHe, M05_G56_ACTION);
  assertEq("detailed M-05 g5 nextWeekGoalHe", mp05?.nextWeekGoalHe, M05_G56_GOAL);
  assertNoBanned("detailed M-05 parentActionHe", mp05?.parentActionHe);

  const shortM05 = summarizeV2UnitsForSubjectForTests(baseM05.diagnosticEngineV2.units, {
    subjectReportQuestions: 12,
    subjectLabelHe: "מתמטיקה",
    topicMap: baseM05.mathOperations,
    reportTotalQuestions: 20,
  });
  assertEq("short M-05 g5 parentActionHe", shortM05.parentActionHe, M05_G56_ACTION);
  assertEq("short M-05 g5 nextWeekGoalHe", shortM05.nextWeekGoalHe, M05_G56_GOAL);
  assertNoBanned("short M-05 parentActionHe", shortM05.parentActionHe);
  assertNoBanned("short M-05 nextWeekGoalHe", shortM05.nextWeekGoalHe);

  const tp05 = buildTruthPacketV1(detailedM05, {
    scopeType: "topic",
    scopeId: topicRowKeyM05,
    scopeLabel: "שברים",
  });
  if (!tp05) throw new Error("buildTruthPacketV1 M-05 returned null");
  assertNoBanned("truth M-05 full JSON", JSON.stringify(tp05));
}

runRoutingSanity();
runResolverAndProductSurfaces();

process.stdout.write("OK parent-report-grade-aware-phase2b4-fractions-verify\n");
