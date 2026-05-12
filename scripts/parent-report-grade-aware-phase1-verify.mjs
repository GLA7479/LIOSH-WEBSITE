/**
 * Phase 1 product-surface verification: math M-09 g4 subtraction with ENABLE_GRADE_AWARE_RECOMMENDATIONS=true.
 * Non-LLM checks: short + detailed rendered strings, full detailed JSON string scan, Copilot-style FACTS probe
 * (narrative textSlots parallel to buildGroundedPrompt FACTS_JSON.action field family).
 *
 *   npx tsx scripts/parent-report-grade-aware-phase1-verify.mjs
 */

const EXPECTED_ACTION =
  "כדאי לתרגל חיסור במאונך עם פריטה, תוך הקפדה על ערך הספרות בכל עמודה. אחרי כל תרגיל בקשו מהילד לבדוק את התשובה בעזרת חיבור הפוך.";
const EXPECTED_GOAL =
  "בשבוע הקרוב התמקדו בחיסור רב־ספרתי במאונך, בפריטה נכונה ובבדיקת התשובה בעזרת חיבור הפוך.";
const FORBIDDEN = ["ציר + סימבולי", "ציר + מרחק"];

const topicRowKey = "subtraction\u0001learning\u0001g4\u0001easy";

/**
 * @param {string} [gradeKey]
 */
function buildBaseReportG4Subtraction(gradeKey = "g4") {
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
function assertNoForbidden(label, blob) {
  const s = typeof blob === "string" ? blob : JSON.stringify(blob);
  for (const f of FORBIDDEN) {
    if (s.includes(f)) throw new Error(`${label} contains forbidden phrase: ${f}`);
  }
}

/**
 * @param {unknown} value
 * @param {Array<{ path: string; value: string }>} paths
 * @param {string} [prefix]
 */
function collectStrings(value, paths, prefix = "") {
  if (value == null) return;
  if (typeof value === "string") {
    paths.push({ path: prefix || "(root)", value });
    return;
  }
  if (typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => collectStrings(v, paths, `${prefix}[${i}]`));
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    const p = prefix ? `${prefix}.${k}` : k;
    collectStrings(v, paths, p);
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

function runFlagOnRendered() {
  process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";
  process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";

  if (!isGradeAwareRecommendationsEnabled()) {
    throw new Error("expected grade-aware flag on");
  }

  if (
    resolveGradeAwareParentRecommendationHe({
      subjectId: "math",
      gradeKey: "g4",
      taxonomyId: "M-01",
      slot: "action",
    }) !== null
  ) {
    throw new Error("flag on: math M-01 should not resolve (Phase 1 scope)");
  }
  if (
    resolveGradeAwareParentRecommendationHe({
      subjectId: "english",
      gradeKey: "g4",
      taxonomyId: "M-09",
      slot: "action",
    }) !== null
  ) {
    throw new Error("flag on: non-math subject should not resolve M-09");
  }

  const baseReport = buildBaseReportG4Subtraction("g4");
  const detailed = buildDetailedParentReportFromBaseReport(baseReport, { period: "week" });
  const mathProfile = detailed?.subjectProfiles?.find((p) => p.subject === "math");
  assertEq("detailed math parentActionHe", mathProfile?.parentActionHe, EXPECTED_ACTION);
  assertEq("detailed math nextWeekGoalHe", mathProfile?.nextWeekGoalHe, EXPECTED_GOAL);
  assertEq("detailed math recommendedHomeMethodHe", mathProfile?.recommendedHomeMethodHe, EXPECTED_GOAL);
  assertNoForbidden("detailed JSON full", JSON.stringify(detailed));

  const short = summarizeV2UnitsForSubjectForTests(baseReport.diagnosticEngineV2.units, {
    subjectReportQuestions: 12,
    subjectLabelHe: "מתמטיקה",
    topicMap: baseReport.mathOperations,
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
  const factsParallel = {
    observation: String(nar.observation || ""),
    interpretation: String(nar.interpretation || ""),
    action: String(nar.action || ""),
    uncertainty: String(nar.uncertainty || ""),
  };
  assertNoForbidden("Copilot FACTS_JSON parallel (narrative textSlots)", JSON.stringify(factsParallel));
  assertNoForbidden("truthPacketV1 full JSON", JSON.stringify(tp));

  const strings = [];
  collectStrings(detailed, strings, "detailed");
  for (const { path, value } of strings) {
    for (const f of FORBIDDEN) {
      if (value.includes(f)) {
        throw new Error(`forbidden "${f}" at ${path}`);
      }
    }
  }

  const mathTopics = mathProfile?.topicRecommendations || [];
  const subTr = mathTopics.find((t) => String(t.topicRowKey || t.topicKey) === topicRowKey);
  if (subTr) {
    assertEq("topic row doNowHe", subTr.doNowHe, EXPECTED_ACTION);
    assertEq("topic row interventionPlanHe", subTr.interventionPlanHe, EXPECTED_GOAL);
  }

  const es = detailed.executiveSummary;
  assertEq("executive topImmediateParentActionHe", es?.topImmediateParentActionHe, EXPECTED_ACTION);
}

function runFlagOff() {
  delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  if (isGradeAwareRecommendationsEnabled()) throw new Error("expected flag off");

  const u = buildBaseReportG4Subtraction().diagnosticEngineV2.units[0];
  const fb = resolveUnitParentActionHe(u, "g4");
  if (!fb || !String(fb).includes("ציר")) {
    throw new Error("flag off: expected engine fallback containing ציר");
  }
}

function runUnknownGradeFallback() {
  process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";
  process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";

  const nullResolved = resolveGradeAwareParentRecommendationHe({
    subjectId: "math",
    gradeKey: "g9",
    taxonomyId: "M-09",
    slot: "action",
  });
  if (nullResolved !== null) throw new Error("g9 band should yield null template");

  const u = buildBaseReportG4Subtraction("g9").diagnosticEngineV2.units[0];
  const act = resolveUnitParentActionHe(u, "g9");
  if (!act || !act.includes("ציר + סימבולי")) {
    throw new Error("unknown gradeKey should fall back to engine immediateActionHe");
  }
}

try {
  runFlagOnRendered();
  runFlagOff();
  runUnknownGradeFallback();
} finally {
  if (prevE === undefined) delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  else process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS = prevE;
  if (prevN === undefined) delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  else process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS = prevN;
}

process.stdout.write("OK parent-report-grade-aware-phase1-verify\n");
