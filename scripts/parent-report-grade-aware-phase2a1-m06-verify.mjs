/**
 * Phase 2-A1 product verification: math M-06 (decimals) g4 with ENABLE_GRADE_AWARE_RECOMMENDATIONS=true.
 * Non-LLM: exact template strings, parent-facing surfaces free of M-06 engine probe/intervention/pattern tokens.
 *
 *   npx tsx scripts/parent-report-grade-aware-phase2a1-m06-verify.mjs
 */

const EXPECTED_ACTION =
  "כדאי לתרגל עיגול והשוואת מספרים לפי ערך הספרות, במיוחד עשרות, מאות ואלפים. לפני החישוב בקשו מהילד לומר לאיזה מספר התשובה בערך צריכה להיות קרובה.";
const EXPECTED_GOAL =
  "בשבוע הקרוב התמקדו בעיגול לפי ערך מקום ובבדיקת סבירות של תשובות במספרים שלמים.";

/** Must not appear in parent-facing resolver output for M-06 (engine / internal taxonomy cues). */
const M06_PARENT_BANNED = [
  "טעות כיוון עיגול",
  "עם/בלי טבלת עמדות",
  "צביעת עמדות",
  "עיגול/השוואה",
];

const topicRowKey = "decimals\u0001learning\u0001g4\u0001easy";

/**
 * @param {string} [gradeKey]
 */
function buildBaseReportDecimalsM06(gradeKey = "g4") {
  return {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: { totalQuestions: 20 },
    mathOperations: {
      [topicRowKey]: {
        bucketKey: "decimals",
        displayName: "עשרוניות",
        questions: 12,
        correct: 8,
        wrong: 4,
        accuracy: 67,
        gradeKey,
        modeKey: "learning",
        levelKey: "easy",
        lastSessionMs: Date.UTC(2026, 4, 6, 12, 0, 0),
      },
    },
    diagnosticEngineV2: {
      units: [
        {
          blueprintRef: "test",
          engineVersion: "v2",
          unitKey: `math::${topicRowKey}`,
          subjectId: "math",
          topicRowKey,
          bucketKey: "decimals",
          displayName: "עשרוניות",
          diagnosis: { allowed: true, taxonomyId: "M-06", lineHe: "מצביע על דפוס." },
          intervention: {
            immediateActionHe: "צביעת עמדות",
            shortPracticeHe: "עם/בלי טבלת עמדות",
            taxonomyId: "M-06",
          },
          taxonomy: {
            id: "M-06",
            patternHe: "דפוס",
            topicHe: "מקום",
            subskillHe: "עיגול/השוואה",
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
            topicStateId: "ts_m06",
            stateHash: "h1",
          },
        },
      ],
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
function assertM06ParentBannedAbsent(label, blob) {
  const s = typeof blob === "string" ? blob : JSON.stringify(blob);
  for (const b of M06_PARENT_BANNED) {
    if (s.includes(b)) throw new Error(`${label} contains banned M-06 internal phrase: ${b}`);
  }
}

const prevE = process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
const prevN = process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

const [detailedMod, parentReportV2Mod, truthMod, resolverMod, recMod] = await Promise.all([
  import("../utils/detailed-parent-report.js"),
  import("../utils/parent-report-v2.js"),
  import("../utils/parent-copilot/truth-packet-v1.js"),
  import("../utils/parent-report-language/grade-aware-recommendation-resolver.js"),
  import("../utils/parent-report-recommendation-consistency.js"),
]);

const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = parentReportV2Mod;
const { buildTruthPacketV1 } = truthMod;
const { resolveGradeAwareParentRecommendationHe, isGradeAwareRecommendationsEnabled } = resolverMod;
const { resolveUnitParentActionHe } = recMod;

function runFlagOnM06G4() {
  process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";
  process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";

  if (!isGradeAwareRecommendationsEnabled()) throw new Error("expected grade-aware flag on");

  if (
    resolveGradeAwareParentRecommendationHe({
      subjectId: "math",
      gradeKey: "g4",
      taxonomyId: "M-01",
      slot: "action",
    }) !== null
  ) {
    throw new Error("M-01 must remain without template");
  }

  const base = buildBaseReportDecimalsM06("g4");
  const detailed = buildDetailedParentReportFromBaseReport(base, { period: "week" });
  const mp = detailed?.subjectProfiles?.find((p) => p.subject === "math");
  assertEq("detailed math parentActionHe (M-06 g4)", mp?.parentActionHe, EXPECTED_ACTION);
  assertEq("detailed math nextWeekGoalHe (M-06 g4)", mp?.nextWeekGoalHe, EXPECTED_GOAL);
  assertEq("detailed math recommendedHomeMethodHe (M-06 g4)", mp?.recommendedHomeMethodHe, EXPECTED_GOAL);
  assertM06ParentBannedAbsent("detailed math parentActionHe", mp?.parentActionHe);
  assertM06ParentBannedAbsent("detailed math nextWeekGoalHe", mp?.nextWeekGoalHe);
  assertM06ParentBannedAbsent("detailed math recommendedHomeMethodHe", mp?.recommendedHomeMethodHe);

  const short = summarizeV2UnitsForSubjectForTests(base.diagnosticEngineV2.units, {
    subjectReportQuestions: 12,
    subjectLabelHe: "מתמטיקה",
    topicMap: base.mathOperations,
    reportTotalQuestions: 20,
  });
  assertEq("short parentActionHe (M-06 g4)", short.parentActionHe, EXPECTED_ACTION);
  assertEq("short nextWeekGoalHe (M-06 g4)", short.nextWeekGoalHe, EXPECTED_GOAL);
  assertEq("short recommendedHomeMethodHe (M-06 g4)", short.recommendedHomeMethodHe, EXPECTED_GOAL);
  assertM06ParentBannedAbsent("short parentActionHe", short.parentActionHe);
  assertM06ParentBannedAbsent("short nextWeekGoalHe", short.nextWeekGoalHe);

  const dJson = JSON.stringify(detailed);
  if (dJson.includes("צביעת עמדות") || dJson.includes("עם/בלי טבלת עמדות")) {
    throw new Error("detailed payload still contains raw M-06 intervention strings in JSON");
  }

  const tp = buildTruthPacketV1(detailed, {
    scopeType: "topic",
    scopeId: topicRowKey,
    scopeLabel: "עשרוניות",
  });
  if (!tp) throw new Error("buildTruthPacketV1 returned null");
  const nar = tp?.contracts?.narrative?.textSlots || {};
  const factsParallel = {
    observation: String(nar.observation || ""),
    interpretation: String(nar.interpretation || ""),
    action: String(nar.action || ""),
    uncertainty: String(nar.uncertainty || ""),
  };
  assertM06ParentBannedAbsent("FACTS_JSON parallel narrative slots", JSON.stringify(factsParallel));
  assertM06ParentBannedAbsent("truthPacket JSON", JSON.stringify(tp));

  const topics = mp?.topicRecommendations || [];
  const tr = topics.find((t) => String(t.topicRowKey || t.topicKey) === topicRowKey);
  if (tr) {
    assertEq("topic doNowHe", tr.doNowHe, EXPECTED_ACTION);
    assertEq("topic interventionPlanHe", tr.interventionPlanHe, EXPECTED_GOAL);
    assertM06ParentBannedAbsent("topic doNowHe", tr.doNowHe);
    assertM06ParentBannedAbsent("topic interventionPlanHe", tr.interventionPlanHe);
  }

  assertEq("executive topImmediateParentActionHe", detailed.executiveSummary?.topImmediateParentActionHe, EXPECTED_ACTION);
  assertM06ParentBannedAbsent("executive topImmediateParentActionHe", detailed.executiveSummary?.topImmediateParentActionHe);
}

function runResolverBands() {
  process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";
  const a2 = resolveGradeAwareParentRecommendationHe({
    subjectId: "math",
    gradeKey: "g2",
    taxonomyId: "M-06",
    slot: "action",
  });
  if (!a2 || !(a2.includes("קו מספרים") || a2.includes("העשרת הקרובה"))) {
    throw new Error("M-06 g2 action expected early-band wording");
  }
  const a4 = resolveGradeAwareParentRecommendationHe({
    subjectId: "math",
    gradeKey: "g4",
    taxonomyId: "M-06",
    slot: "action",
  });
  if (a4 !== EXPECTED_ACTION) throw new Error("M-06 g4 action exact match failed");
  const g4 = resolveGradeAwareParentRecommendationHe({
    subjectId: "math",
    gradeKey: "g4",
    taxonomyId: "M-06",
    slot: "nextGoal",
  });
  if (g4 !== EXPECTED_GOAL) throw new Error("M-06 g4 nextGoal exact match failed");
  if (a4 === g4) throw new Error("M-06 g4 action and goal must differ");
  const a6 = resolveGradeAwareParentRecommendationHe({
    subjectId: "math",
    gradeKey: "g6",
    taxonomyId: "M-06",
    slot: "action",
  });
  if (!a6 || !(a6.includes("עשרוניים") || a6.includes("אחוזים"))) {
    throw new Error("M-06 g6 action expected upper-band decimals/percentages wording");
  }
  assertM06ParentBannedAbsent("M-06 g6 action", a6);
}

function runFlagOffAndUnknown() {
  delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  if (isGradeAwareRecommendationsEnabled()) throw new Error("expected flag off");
  if (
    resolveGradeAwareParentRecommendationHe({
      subjectId: "math",
      gradeKey: "g4",
      taxonomyId: "M-06",
      slot: "action",
    }) !== null
  ) {
    throw new Error("resolver M-06 must be null when flag off");
  }
  const u = buildBaseReportDecimalsM06("g4").diagnosticEngineV2.units[0];
  const fb = resolveUnitParentActionHe(u, "g4");
  if (!fb || !fb.includes("צביעת")) throw new Error("flag off: M-06 expected engine intervention fallback");

  process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";
  if (
    resolveGradeAwareParentRecommendationHe({
      subjectId: "math",
      gradeKey: "g9",
      taxonomyId: "M-06",
      slot: "action",
    }) !== null
  ) {
    throw new Error("unknown grade must yield null template for M-06");
  }
  const u9 = buildBaseReportDecimalsM06("g9").diagnosticEngineV2.units[0];
  const act9 = resolveUnitParentActionHe(u9, "g9");
  if (!act9 || !act9.includes("צביעת")) throw new Error("unknown grade: expected engine fallback for M-06 action");
}

try {
  runFlagOnM06G4();
  runResolverBands();
  runFlagOffAndUnknown();
} finally {
  if (prevE === undefined) delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  else process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS = prevE;
  if (prevN === undefined) delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  else process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS = prevN;
}

process.stdout.write("OK parent-report-grade-aware-phase2a1-m06-verify\n");
