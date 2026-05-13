/**
 * Phase 5-B1 — Science S-02/S-03/S-04/S-07 bucketOverrides (experiments, body, materials, environment).
 *   npx tsx scripts/parent-report-grade-aware-phase5b1-science-verify.mjs
 */

const [resolverMod, recMod, templatesMod, detailedMod, v2Mod, truthMod] = await Promise.all([
  import("../utils/parent-report-language/grade-aware-recommendation-resolver.js"),
  import("../utils/parent-report-recommendation-consistency.js"),
  import("../utils/parent-report-language/grade-aware-recommendation-templates.js"),
  import("../utils/detailed-parent-report.js"),
  import("../utils/parent-report-v2.js"),
  import("../utils/parent-copilot/truth-packet-v1.js"),
]);

const { resolveGradeAwareParentRecommendationHe } = resolverMod;
const { resolveUnitParentActionHe } = recMod;
const GRADE_AWARE_RECOMMENDATION_TEMPLATES = templatesMod.GRADE_AWARE_RECOMMENDATION_TEMPLATES;
const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = v2Mod;
const { buildTruthPacketV1 } = truthMod;

const SCI = GRADE_AWARE_RECOMMENDATION_TEMPLATES.science;
const S02 = SCI["S-02"].bucketOverrides.experiments;
const S03 = SCI["S-03"].bucketOverrides.body;
const S04 = SCI["S-04"].bucketOverrides.materials;
const S07 = SCI["S-07"].bucketOverrides.environment;
const SEP = "\u0001";

/** Raw taxonomy / internal strings — must not appear in grade-aware resolved parent Hebrew (Phase 5-A list).
 *  Omitted when substring-collides with approved template copy (e.g. rootsHe "הבנת ניסוי" vs goal "בהבנת ניסוי הוגן").
 */
const BANNED = [
  "לשנות הכול",
  "אותו ניסוי עם טבלה",
  "משתנה אחד",
  "סדר/מיקום שגוי",
  "אנכי מול אופקי",
  "כרטיסיות מיקום",
  "בעיה רפואית",
  "דיווח רפואי",
  "נעלם בלי שימור",
  "עם/בלי דיאגרמה",
  "דיאגרמת מצבים",
  "רמה שגויה חוזרת",
  "רשת חלקית",
  "כרטיסיות",
  "בלבול מושגי",
  "קריאה",
  "מפת מרחב גסה",
  "שפה",
  "שימור מסה",
  "מבנה מערכת",
  "זיכרון שמות",
];

function assertEq(name, actual, expected) {
  const a = String(actual ?? "");
  const e = String(expected ?? "");
  if (a !== e) throw new Error(`${name} mismatch (len ${a.length} vs ${e.length})`);
}

function assertNull(name, v) {
  if (v != null && String(v).trim() !== "") throw new Error(`${name} expected null/empty`);
}

function assertNe(name, a, b) {
  if (String(a ?? "") === String(b ?? "")) throw new Error(`${name}: action and goal must differ`);
}

function assertNoBanned(label, blob) {
  const s = typeof blob === "string" ? blob : JSON.stringify(blob);
  for (const b of BANNED) {
    if (s.includes(b)) throw new Error(`${label} banned substring: ${b}`);
  }
}

function r(sid, tid, bucket, grade, slot) {
  return resolveGradeAwareParentRecommendationHe({
    subjectId: sid,
    taxonomyId: tid,
    bucketKey: bucket,
    gradeKey: grade,
    slot: slot === "nextGoal" ? "nextGoal" : "action",
  });
}

// —— Resolver: S-02 experiments ——
assertNull("S-02 experiments g1 action", r("science", "S-02", "experiments", "g1", "action"));
assertNull("S-02 experiments g2 goal", r("science", "S-02", "experiments", "g2", "nextGoal"));
assertEq("S-02 experiments g4 action", r("science", "S-02", "experiments", "g4", "action"), S02.g3_g4.actionTextHe);
assertEq("S-02 experiments g4 goal", r("science", "S-02", "experiments", "g4", "nextGoal"), S02.g3_g4.goalTextHe);
assertEq("S-02 experiments g6 action", r("science", "S-02", "experiments", "g6", "action"), S02.g5_g6.actionTextHe);
assertEq("S-02 experiments g6 goal", r("science", "S-02", "experiments", "g6", "nextGoal"), S02.g5_g6.goalTextHe);
assertNe("S-02 experiments g4", r("science", "S-02", "experiments", "g4", "action"), r("science", "S-02", "experiments", "g4", "nextGoal"));
assertEq("S-02 EXPERIMENTS uppercase", r("science", "S-02", "EXPERIMENTS", "g4", "action"), S02.g3_g4.actionTextHe);

// —— S-03 body ——
assertNull("S-03 body g1 action", r("science", "S-03", "body", "g1", "action"));
assertEq("S-03 body g4 action", r("science", "S-03", "body", "g4", "action"), S03.g3_g4.actionTextHe);
assertEq("S-03 body g4 goal", r("science", "S-03", "body", "g4", "nextGoal"), S03.g3_g4.goalTextHe);
assertEq("S-03 body g6 action", r("science", "S-03", "body", "g6", "action"), S03.g5_g6.actionTextHe);
assertNe("S-03 body g4", r("science", "S-03", "body", "g4", "action"), r("science", "S-03", "body", "g4", "nextGoal"));
const s03g4 = `${r("science", "S-03", "body", "g4", "action")}\n${r("science", "S-03", "body", "g4", "nextGoal")}`;
for (const clinical of ["רפואי", "קליני", "בעיה רפואית", "דיווח רפואי"]) {
  if (s03g4.includes(clinical)) throw new Error(`S-03 g3_g4 must not include clinical phrase: ${clinical}`);
}

// —— S-04 materials ——
assertNull("S-04 materials g2 action", r("science", "S-04", "materials", "g2", "action"));
assertEq("S-04 materials g5 action", r("science", "S-04", "materials", "g5", "action"), S04.g5_g6.actionTextHe);
assertEq("S-04 materials g5 goal", r("science", "S-04", "materials", "g5", "nextGoal"), S04.g5_g6.goalTextHe);
assertEq("S-04 MATERIALS uppercase", r("science", "S-04", "MATERIALS", "g5", "action"), S04.g5_g6.actionTextHe);

// —— S-07 environment ——
assertEq("S-07 environment g6 action", r("science", "S-07", "environment", "g6", "action"), S07.g5_g6.actionTextHe);
assertEq("S-07 environment g6 goal", r("science", "S-07", "environment", "g6", "nextGoal"), S07.g5_g6.goalTextHe);
assertEq("S-07 ENVIRONMENT uppercase", r("science", "S-07", "ENVIRONMENT", "g6", "nextGoal"), S07.g5_g6.goalTextHe);

// —— Not implemented / fallback ——
assertNull("S-01 experiments g4 (no template)", r("science", "S-01", "experiments", "g4", "action"));
assertNull("S-02 wrong bucket plants g4", r("science", "S-02", "plants", "g4", "action"));
assertNull("unknown grade g9 S-02 experiments", r("science", "S-02", "experiments", "g9", "action"));
delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

const resolvedBlob = [
  r("science", "S-02", "experiments", "g4", "action"),
  r("science", "S-02", "experiments", "g4", "nextGoal"),
  r("science", "S-02", "experiments", "g6", "action"),
  r("science", "S-02", "experiments", "g6", "nextGoal"),
  r("science", "S-03", "body", "g4", "action"),
  r("science", "S-03", "body", "g4", "nextGoal"),
  r("science", "S-03", "body", "g6", "action"),
  r("science", "S-03", "body", "g6", "nextGoal"),
  r("science", "S-04", "materials", "g4", "action"),
  r("science", "S-04", "materials", "g4", "nextGoal"),
  r("science", "S-04", "materials", "g6", "action"),
  r("science", "S-04", "materials", "g6", "nextGoal"),
  r("science", "S-07", "environment", "g4", "action"),
  r("science", "S-07", "environment", "g4", "nextGoal"),
  r("science", "S-07", "environment", "g6", "action"),
  r("science", "S-07", "environment", "g6", "nextGoal"),
].join("\n");
assertNoBanned("resolver science Phase 5-B1 outputs", resolvedBlob);

const summaryFixture = {
  totalQuestions: 20,
  totalTimeMinutes: 30,
  overallAccuracy: 70,
  mathQuestions: 0,
  mathCorrect: 0,
  mathAccuracy: 0,
  geometryQuestions: 0,
  geometryCorrect: 0,
  geometryAccuracy: 0,
  englishQuestions: 0,
  englishCorrect: 0,
  englishAccuracy: 0,
  scienceQuestions: 10,
  scienceCorrect: 6,
  scienceAccuracy: 60,
  hebrewQuestions: 0,
  hebrewCorrect: 0,
  hebrewAccuracy: 0,
  moledetGeographyQuestions: 0,
  moledetGeographyCorrect: 0,
  moledetGeographyAccuracy: 0,
};

function rowScience(topicRowKey, bucketKey, gradeKey) {
  return {
    bucketKey,
    displayName: "מדעים",
    questions: 10,
    correct: 6,
    wrong: 4,
    accuracy: 60,
    gradeKey,
    modeKey: "learning",
    levelKey: "easy",
    lastSessionMs: Date.UTC(2026, 4, 6, 12, 0, 0),
  };
}

/**
 * @param {string} taxonomyId
 * @param {string} bucketKey
 * @param {string} gradeKey
 */
function buildScienceUnit(taxonomyId, bucketKey, gradeKey) {
  const rawById = {
    "S-02": {
      patternHe: "לשנות הכול",
      probeHe: "אותו ניסוי עם טבלה",
      interventionHe: "משתנה אחד",
      rootsHe: ["הבנת ניסוי"],
      competitorsHe: ["זיכרון"],
    },
    "S-03": {
      patternHe: "סדר/מיקום שגוי",
      probeHe: "אנכי מול אופקי",
      interventionHe: "כרטיסיות מיקום",
      rootsHe: ["מפת מרחב גסה"],
      competitorsHe: ["שפה"],
    },
    "S-04": {
      patternHe: "נעלם בלי שימור",
      probeHe: "עם/בלי דיאגרמה",
      interventionHe: "דיאגרמת מצבים",
      rootsHe: ["שימור מסה"],
      competitorsHe: ["שפה"],
    },
    "S-07": {
      patternHe: "רמה שגויה חוזרת",
      probeHe: "רשת חלקית",
      interventionHe: "כרטיסיות",
      rootsHe: ["מבנה מערכת"],
      competitorsHe: ["זיכרון שמות"],
    },
  };
  const raw = rawById[taxonomyId];
  if (!raw) throw new Error(`unknown taxonomy ${taxonomyId}`);
  const trk = `${bucketKey}${SEP}learning${SEP}${gradeKey}${SEP}easy`;
  return {
    blueprintRef: "test",
    engineVersion: "v2",
    unitKey: `science::${trk}`,
    subjectId: "science",
    topicRowKey: trk,
    bucketKey,
    displayName: "מדעים",
    diagnosis: { allowed: true, taxonomyId, lineHe: "מצביע על דפוס." },
    intervention: {
      immediateActionHe: raw.interventionHe,
      shortPracticeHe: raw.probeHe,
      taxonomyId,
    },
    taxonomy: {
      id: taxonomyId,
      patternHe: raw.patternHe,
      topicHe: "ניסוי",
      subskillHe: "משתנה מבודד",
      rootsHe: raw.rootsHe,
      competitorsHe: raw.competitorsHe,
    },
    recurrence: { wrongCountForRules: 4, full: true, wrongEventCount: 4, rowWrongTotal: 4 },
    confidence: { level: "moderate" },
    priority: { level: "P4", breadth: "narrow" },
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
    probe: {
      specificationHe: raw.probeHe,
      objectiveHe: raw.patternHe,
    },
    explainability: { whyNotStrongerConclusionHe: [], cannotConcludeYetHe: [] },
    canonicalState: {
      actionState: "intervene",
      recommendation: { allowed: false, family: "remedial" },
      assessment: { readiness: "ready", confidenceLevel: "moderate", cannotConcludeYet: false },
      evidence: { positiveAuthorityLevel: "none" },
      topicStateId: `ts_${taxonomyId}_${bucketKey}`,
      stateHash: "s5b1",
    },
  };
}

function mkBase(taxonomyId, bucket, gradeKey) {
  const trk = `${bucket}${SEP}learning${SEP}${gradeKey}${SEP}easy`;
  return {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: summaryFixture,
    scienceTopics: { [trk]: rowScience(trk, bucket, gradeKey) },
    diagnosticEngineV2: { units: [buildScienceUnit(taxonomyId, bucket, gradeKey)] },
  };
}

const trkS2 = `experiments${SEP}learning${SEP}g4${SEP}easy`;
const dS2 = buildDetailedParentReportFromBaseReport(mkBase("S-02", "experiments", "g4"), { period: "week" });
const mpS2 = dS2?.subjectProfiles?.find((p) => p.subject === "science");
assertEq("detailed S-02 experiments g4 action", mpS2?.parentActionHe, S02.g3_g4.actionTextHe);
assertNoBanned("detailed S-02 experiments g4", mpS2?.parentActionHe);
const tpS2 = buildTruthPacketV1(dS2, { scopeType: "topic", scopeId: trkS2, scopeLabel: "ניסויים" });
assertNoBanned("truth S-02 experiments g4", JSON.stringify(tpS2?.narrative?.textSlots || {}));

const trkS3 = `body${SEP}learning${SEP}g4${SEP}easy`;
const dS3 = buildDetailedParentReportFromBaseReport(mkBase("S-03", "body", "g4"), { period: "week" });
const mpS3 = dS3?.subjectProfiles?.find((p) => p.subject === "science");
assertEq("detailed S-03 body g4", mpS3?.parentActionHe, S03.g3_g4.actionTextHe);
assertNoBanned("detailed S-03 body g4", mpS3?.parentActionHe);

const trkS4 = `materials${SEP}learning${SEP}g5${SEP}easy`;
const dS4 = buildDetailedParentReportFromBaseReport(mkBase("S-04", "materials", "g5"), { period: "week" });
const mpS4 = dS4?.subjectProfiles?.find((p) => p.subject === "science");
assertEq("detailed S-04 materials g5", mpS4?.parentActionHe, S04.g5_g6.actionTextHe);
assertNoBanned("detailed S-04 materials g5", mpS4?.parentActionHe);

const trkS7 = `environment${SEP}learning${SEP}g6${SEP}easy`;
const dS7 = buildDetailedParentReportFromBaseReport(mkBase("S-07", "environment", "g6"), { period: "week" });
const mpS7 = dS7?.subjectProfiles?.find((p) => p.subject === "science");
assertEq("detailed S-07 environment g6 goal", mpS7?.nextWeekGoalHe, S07.g5_g6.goalTextHe);
assertNoBanned("detailed S-07 environment g6", `${mpS7?.parentActionHe}\n${mpS7?.nextWeekGoalHe}`);

const bS4 = mkBase("S-04", "materials", "g5");
const uS4 = bS4.diagnosticEngineV2.units[0];
const sh = summarizeV2UnitsForSubjectForTests(bS4.diagnosticEngineV2.units, {
  subjectReportQuestions: 10,
  subjectLabelHe: "מדעים",
  topicMap: bS4.scienceTopics,
  reportTotalQuestions: 20,
});
assertEq("short S-04 materials g5", sh.parentActionHe, resolveUnitParentActionHe(uS4, "g5"));
assertNoBanned("short S-04 materials g5", sh.parentActionHe);

process.stdout.write("parent-report-grade-aware-phase5b1-science-verify: ok\n");
