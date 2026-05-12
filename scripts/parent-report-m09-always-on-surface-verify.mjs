/**
 * M-09 g4 subtraction — grade-aware surfaces must work with no ENABLE_* env vars.
 * Simulates JSON round-trip (stored snapshot) then rebuilds detailed + short + truth packet.
 *
 *   npx tsx scripts/parent-report-m09-always-on-surface-verify.mjs
 */

const EXPECTED_ACTION =
  "כדאי לתרגל חיסור במאונך עם פריטה, תוך הקפדה על ערך הספרות בכל עמודה. אחרי כל תרגיל בקשו מהילד לבדוק את התשובה בעזרת חיבור הפוך.";
const EXPECTED_GOAL =
  "בשבוע הקרוב התמקדו בחיסור רב־ספרתי במאונך, בפריטה נכונה ובבדיקת התשובה בעזרת חיבור הפוך.";
const FORBIDDEN = ["ציר + סימבולי", "ציר + מרחק"];

const topicRowKey = "subtraction\u0001learning\u0001g4\u0001easy";

function buildBaseReportG4Subtraction() {
  return {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: { totalQuestions: 20 },
    mathOperations: {
      [topicRowKey]: {
        bucketKey: "subtraction",
        displayName: "חיסור",
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
      units: [
        {
          blueprintRef: "test",
          engineVersion: "v2",
          unitKey: `math::${topicRowKey}`,
          subjectId: "math",
          topicRowKey,
          bucketKey: "subtraction",
          displayName: "חיסור",
          diagnosis: { allowed: true, taxonomyId: "M-09", lineHe: "מצביע על דפוס." },
          intervention: {
            immediateActionHe: "ציר + סימבולי",
            shortPracticeHe: "ציר + מרחק",
            taxonomyId: "M-09",
          },
          taxonomy: {
            id: "M-09",
            patternHe: "דפוס",
            topicHe: "חיסור",
            subskillHe: "חיסור",
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
            topicStateId: "ts_test",
            stateHash: "h1",
          },
        },
      ],
    },
  };
}

function assertEq(name, actual, expected) {
  const a = String(actual ?? "");
  const e = String(expected ?? "");
  if (a !== e) {
    throw new Error(`${name} mismatch.\nexpected (${e.length} chars): ${e}\nactual   (${a.length} chars): ${a}`);
  }
}

function assertNoForbidden(label, blob) {
  const s = typeof blob === "string" ? blob : JSON.stringify(blob);
  for (const f of FORBIDDEN) {
    if (s.includes(f)) throw new Error(`${label} contains forbidden phrase: ${f}`);
  }
}

delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

const [detailedMod, parentReportV2Mod, truthMod] = await Promise.all([
  import("../utils/detailed-parent-report.js"),
  import("../utils/parent-report-v2.js"),
  import("../utils/parent-copilot/truth-packet-v1.js"),
]);

const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = parentReportV2Mod;
const { buildTruthPacketV1 } = truthMod;

const raw = buildBaseReportG4Subtraction();
const rehydrated = JSON.parse(JSON.stringify(raw));

const detailed = buildDetailedParentReportFromBaseReport(rehydrated, { period: "week" });
const mathProfile = detailed?.subjectProfiles?.find((p) => p.subject === "math");
assertEq("detailed math parentActionHe", mathProfile?.parentActionHe, EXPECTED_ACTION);
assertEq("detailed math nextWeekGoalHe", mathProfile?.nextWeekGoalHe, EXPECTED_GOAL);
assertEq("detailed math recommendedHomeMethodHe", mathProfile?.recommendedHomeMethodHe, EXPECTED_GOAL);
assertNoForbidden("detailed JSON full", JSON.stringify(detailed));

const short = summarizeV2UnitsForSubjectForTests(rehydrated.diagnosticEngineV2.units, {
  subjectReportQuestions: 12,
  subjectLabelHe: "מתמטיקה",
  topicMap: rehydrated.mathOperations,
  reportTotalQuestions: 20,
});
assertEq("short parentActionHe", short.parentActionHe, EXPECTED_ACTION);
assertEq("short subjectDoNowHe", short.subjectDoNowHe, EXPECTED_ACTION);
assertEq("short nextWeekGoalHe", short.nextWeekGoalHe, EXPECTED_GOAL);
assertEq("short recommendedHomeMethodHe", short.recommendedHomeMethodHe, EXPECTED_GOAL);
assertNoForbidden("short JSON", JSON.stringify(short));

const tp = buildTruthPacketV1(detailed, {
  scopeType: "topic",
  scopeId: topicRowKey,
  scopeLabel: "חיסור",
});
if (!tp) throw new Error("buildTruthPacketV1 returned null");
const nar = tp?.contracts?.narrative?.textSlots || {};
assertNoForbidden(
  "Copilot FACTS_JSON parallel (narrative textSlots)",
  JSON.stringify({
    observation: String(nar.observation || ""),
    interpretation: String(nar.interpretation || ""),
    action: String(nar.action || ""),
    uncertainty: String(nar.uncertainty || ""),
  })
);
assertNoForbidden("truthPacketV1 full JSON", JSON.stringify(tp));

const mathTopics = mathProfile?.topicRecommendations || [];
const subTr = mathTopics.find((t) => String(t.topicRowKey || t.topicKey) === topicRowKey);
if (subTr) {
  assertEq("topic row doNowHe", subTr.doNowHe, EXPECTED_ACTION);
  assertEq("topic row interventionPlanHe", subTr.interventionPlanHe, EXPECTED_GOAL);
}

assertEq("executive topImmediateParentActionHe", detailed.executiveSummary?.topImmediateParentActionHe, EXPECTED_ACTION);

process.stdout.write("OK parent-report-m09-always-on-surface-verify\n");
