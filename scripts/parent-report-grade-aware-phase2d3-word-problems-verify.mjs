/**
 * Phase 2-D3 — M-07 / M-08 bucket templates: narrow product verify (detailed + short + banned phrase scan on parent-facing strings).
 *   npx tsx scripts/parent-report-grade-aware-phase2d3-word-problems-verify.mjs
 */

const BANNED = [
  "מספר נכון + יחידה שגויה",
  "כישלון רק באיחוד",
  "עם/בלי שדה יחידה",
  "מספר + שורת יחידה",
  "עם תבנית שלבים",
  "שלבים + בדיקה לאחור",
];

const prevE = process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
const prevN = process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

const [templatesMod, detailedMod, parentReportV2Mod, truthMod, wpOrderMod] = await Promise.all([
  import("../utils/parent-report-language/grade-aware-recommendation-templates.js"),
  import("../utils/detailed-parent-report.js"),
  import("../utils/parent-report-v2.js"),
  import("../utils/parent-copilot/truth-packet-v1.js"),
  import(new URL("../utils/diagnostic-engine-v2/word-problems-taxonomy-candidate-order.js", import.meta.url).href),
]);

const M07 = templatesMod.GRADE_AWARE_RECOMMENDATION_TEMPLATES.math["M-07"].bucketOverrides.word_problems;
const M08 = templatesMod.GRADE_AWARE_RECOMMENDATION_TEMPLATES.math["M-08"].bucketOverrides;
const { orderWordProblemsTaxonomyCandidates } = wpOrderMod;
const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = parentReportV2Mod;
const { buildTruthPacketV1 } = truthMod;

function assertEq(name, actual, expected) {
  const a = String(actual ?? "");
  const e = String(expected ?? "");
  if (a !== e) throw new Error(`${name} mismatch (${e.length} vs ${a.length} chars)`);
}

function assertNoBanned(label, blob) {
  const s = typeof blob === "string" ? blob : JSON.stringify(blob);
  for (const b of BANNED) {
    if (s.includes(b)) throw new Error(`${label} contains banned phrase: ${b}`);
  }
}

function rowFor(topicRowKey, bucketKey, gradeKey) {
  return {
    bucketKey,
    displayName: "מתמטיקה",
    questions: 12,
    correct: 8,
    wrong: 4,
    accuracy: 67,
    gradeKey,
    modeKey: "learning",
    levelKey: "easy",
    lastSessionMs: Date.UTC(2026, 4, 6, 12, 0, 0),
  };
}

/**
 * @param {string} taxonomyId
 * @param {string} bucketKey
 * @param {string} topicRowKey
 */
function buildUnit(taxonomyId, bucketKey, topicRowKey) {
  const isM07 = taxonomyId === "M-07";
  return {
    blueprintRef: "test",
    engineVersion: "v2",
    unitKey: `math::${topicRowKey}`,
    subjectId: "math",
    topicRowKey,
    bucketKey,
    displayName: "מתמטיקה",
    diagnosis: { allowed: true, taxonomyId, lineHe: "מצביע על דפוס." },
    intervention: {
      immediateActionHe: isM07 ? "מספר + שורת יחידה" : "שלבים + בדיקה לאחור",
      shortPracticeHe: isM07 ? "עם/בלי שדה יחידה" : "עם תבנית שלבים",
      taxonomyId,
    },
    taxonomy: {
      id: taxonomyId,
      patternHe: isM07 ? "מספר נכון + יחידה שגויה" : "כישלון רק באיחוד",
      topicHe: "מילולי",
      subskillHe: "test",
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
      topicStateId: `ts_${taxonomyId}_${bucketKey}`,
      stateHash: "h1",
    },
  };
}

try {
  process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";
  process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS = "true";

  const twp = "word_problems\u0001learning\u0001g4\u0001easy";
  const baseM07 = {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: { totalQuestions: 20 },
    mathOperations: { [twp]: rowFor(twp, "word_problems", "g4") },
    diagnosticEngineV2: { units: [buildUnit("M-07", "word_problems", twp)] },
  };
  const dM07 = buildDetailedParentReportFromBaseReport(baseM07, { period: "week" });
  const mpM07 = dM07?.subjectProfiles?.find((p) => p.subject === "math");
  assertEq("M-07 wp g4 action", mpM07?.parentActionHe, M07.g3_g4.actionTextHe);
  assertEq("M-07 wp g4 goal", mpM07?.nextWeekGoalHe, M07.g3_g4.goalTextHe);
  assertNoBanned("M-07 detailed action", mpM07?.parentActionHe);
  assertNoBanned("M-07 detailed goal", mpM07?.nextWeekGoalHe);
  const tpM07 = buildTruthPacketV1(dM07, { scopeType: "topic", scopeId: twp, scopeLabel: "מילולי" });
  const narM07 = tpM07?.narrative?.textSlots ? JSON.stringify(tpM07.narrative.textSlots) : "";
  assertNoBanned("truth M-07 narrative textSlots", narM07);

  const baseM08wp = {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: { totalQuestions: 20 },
    mathOperations: { [twp]: rowFor(twp, "word_problems", "g4") },
    diagnosticEngineV2: { units: [buildUnit("M-08", "word_problems", twp)] },
  };
  const dM08wp = buildDetailedParentReportFromBaseReport(baseM08wp, { period: "week" });
  const mpM08wp = dM08wp?.subjectProfiles?.find((p) => p.subject === "math");
  assertEq("M-08 wp g4 action", mpM08wp?.parentActionHe, M08.word_problems.g3_g4.actionTextHe);
  assertNoBanned("M-08 wp detailed action", mpM08wp?.parentActionHe);
  assertNoBanned("M-08 wp detailed goal", mpM08wp?.nextWeekGoalHe);

  const teq = "equations\u0001learning\u0001g6\u0001easy";
  const baseM08eq = {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: { totalQuestions: 20 },
    mathOperations: { [teq]: rowFor(teq, "equations", "g6") },
    diagnosticEngineV2: { units: [buildUnit("M-08", "equations", teq)] },
  };
  const dM08eq = buildDetailedParentReportFromBaseReport(baseM08eq, { period: "week" });
  const mpM08eq = dM08eq?.subjectProfiles?.find((p) => p.subject === "math");
  assertEq("M-08 equations g6 action", mpM08eq?.parentActionHe, M08.equations.g5_g6.actionTextHe);
  assertEq("M-08 equations g6 goal", mpM08eq?.nextWeekGoalHe, M08.equations.g5_g6.goalTextHe);
  assertNoBanned("M-08 eq detailed action", mpM08eq?.parentActionHe);

  const too = "order_of_operations\u0001learning\u0001g6\u0001easy";
  const baseM08oo = {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: { totalQuestions: 20 },
    mathOperations: { [too]: rowFor(too, "order_of_operations", "g6") },
    diagnosticEngineV2: { units: [buildUnit("M-08", "order_of_operations", too)] },
  };
  const dM08oo = buildDetailedParentReportFromBaseReport(baseM08oo, { period: "week" });
  const mpM08oo = dM08oo?.subjectProfiles?.find((p) => p.subject === "math");
  assertEq("M-08 OOO g6 action", mpM08oo?.parentActionHe, M08.order_of_operations.g5_g6.actionTextHe);
  assertNoBanned("M-08 OOO detailed action", mpM08oo?.parentActionHe);
  const tpoo = buildTruthPacketV1(dM08oo, { scopeType: "topic", scopeId: too, scopeLabel: "סדר" });
  const narOo = tpoo?.narrative?.textSlots ? JSON.stringify(tpoo.narrative.textSlots) : "";
  assertNoBanned("truth M-08 OOO narrative textSlots", narOo);

  const sh = summarizeV2UnitsForSubjectForTests(baseM08oo.diagnosticEngineV2.units, {
    subjectReportQuestions: 12,
    subjectLabelHe: "מתמטיקה",
    topicMap: baseM08oo.mathOperations,
    reportTotalQuestions: 20,
  });
  assertEq("M-08 OOO short action", sh.parentActionHe, M08.order_of_operations.g5_g6.actionTextHe);
  assertNoBanned("M-08 OOO short action", sh.parentActionHe);

  const ordUnit = orderWordProblemsTaxonomyCandidates(["M-07", "M-08"], [{ params: { wrong_unit: true } }], {});
  if (ordUnit[0] !== "M-07" || ordUnit[1] !== "M-08") throw new Error("routing unit evidence expected M-07 first");
  const ordModel = orderWordProblemsTaxonomyCandidates(
    ["M-07", "M-08"],
    [{ params: { kind: "wp_multi_step", multi_step: true } }],
    {}
  );
  if (ordModel[0] !== "M-08" || ordModel[1] !== "M-07") throw new Error("routing model evidence expected M-08 first");
  const ordAmb = orderWordProblemsTaxonomyCandidates(["M-07", "M-08"], [], {});
  if (ordAmb[0] !== "M-07" || ordAmb[1] !== "M-08") throw new Error("routing ambiguous expected default order");
} finally {
  if (prevE === undefined) delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  else process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS = prevE;
  if (prevN === undefined) delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  else process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS = prevN;
}

process.stdout.write("OK parent-report-grade-aware-phase2d3-word-problems-verify\n");
