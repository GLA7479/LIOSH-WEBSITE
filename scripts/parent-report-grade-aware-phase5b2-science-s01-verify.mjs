/**
 * Phase 5-B2 — Science S-01 bucketOverrides (animals, plants, earth_space, mixed).
 *   npx tsx scripts/parent-report-grade-aware-phase5b2-science-s01-verify.mjs
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
const S01A = SCI["S-01"].bucketOverrides.animals;
const S01P = SCI["S-01"].bucketOverrides.plants;
const S01E = SCI["S-01"].bucketOverrides.earth_space;
const S01M = SCI["S-01"].bucketOverrides.mixed;
const S02 = SCI["S-02"].bucketOverrides.experiments;
const SEP = "\u0001";

/** Raw S-01 taxonomy strings — must not appear in resolved parent-facing Hebrew. */
const BANNED = [
  "בלבול קטגוריה",
  "הפרדה בין תכונה לבין תהליך",
  "תרגול ממוקד",
  "טבלת תכונה/תהליך",
  "בלבול מושגי",
  "אין מדעים",
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

// —— S-01 animals ——
assertNull("S-01 animals g1 action", r("science", "S-01", "animals", "g1", "action"));
assertEq("S-01 animals g4 action", r("science", "S-01", "animals", "g4", "action"), S01A.g3_g4.actionTextHe);
assertEq("S-01 animals g4 goal", r("science", "S-01", "animals", "g4", "nextGoal"), S01A.g3_g4.goalTextHe);
assertEq("S-01 animals g6 action", r("science", "S-01", "animals", "g6", "action"), S01A.g5_g6.actionTextHe);
assertEq("S-01 animals g6 goal", r("science", "S-01", "animals", "g6", "nextGoal"), S01A.g5_g6.goalTextHe);
assertNe("S-01 animals g4", r("science", "S-01", "animals", "g4", "action"), r("science", "S-01", "animals", "g4", "nextGoal"));
assertEq("S-01 ANIMALS uppercase", r("science", "S-01", "ANIMALS", "g4", "action"), S01A.g3_g4.actionTextHe);

// —— S-01 plants ——
assertNull("S-01 plants g2 goal", r("science", "S-01", "plants", "g2", "nextGoal"));
assertEq("S-01 plants g4 action", r("science", "S-01", "plants", "g4", "action"), S01P.g3_g4.actionTextHe);
assertEq("S-01 plants g4 goal", r("science", "S-01", "plants", "g4", "nextGoal"), S01P.g3_g4.goalTextHe);
assertEq("S-01 plants g6 action", r("science", "S-01", "plants", "g6", "action"), S01P.g5_g6.actionTextHe);
assertEq("S-01 plants g6 goal", r("science", "S-01", "plants", "g6", "nextGoal"), S01P.g5_g6.goalTextHe);

// —— S-01 earth_space ——
assertEq("S-01 earth_space g6 action", r("science", "S-01", "earth_space", "g6", "action"), S01E.g5_g6.actionTextHe);
assertEq("S-01 earth_space g6 goal", r("science", "S-01", "earth_space", "g6", "nextGoal"), S01E.g5_g6.goalTextHe);
assertEq("S-01 EARTH_SPACE uppercase", r("science", "S-01", "EARTH_SPACE", "g6", "action"), S01E.g5_g6.actionTextHe);

// —— S-01 mixed ——
assertEq("S-01 mixed g4 action", r("science", "S-01", "mixed", "g4", "action"), S01M.g3_g4.actionTextHe);
assertEq("S-01 mixed g4 goal", r("science", "S-01", "mixed", "g4", "nextGoal"), S01M.g3_g4.goalTextHe);
assertEq("S-01 mixed g6 action", r("science", "S-01", "mixed", "g6", "action"), S01M.g5_g6.actionTextHe);
assertEq("S-01 mixed g6 goal", r("science", "S-01", "mixed", "g6", "nextGoal"), S01M.g5_g6.goalTextHe);
assertEq("S-01 MIXED uppercase", r("science", "S-01", "MIXED", "g6", "nextGoal"), S01M.g5_g6.goalTextHe);

// —— Fallback / Phase 5-B1 regression ——
assertNull("S-01 wrong bucket experiments g4", r("science", "S-01", "experiments", "g4", "action"));
assertNull("unknown grade g9 S-01 animals", r("science", "S-01", "animals", "g9", "action"));
assertEq("S-02 experiments g4 still", r("science", "S-02", "experiments", "g4", "action"), S02.g3_g4.actionTextHe);

delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

const resolvedBlob = [
  r("science", "S-01", "animals", "g4", "action"),
  r("science", "S-01", "animals", "g4", "nextGoal"),
  r("science", "S-01", "plants", "g4", "action"),
  r("science", "S-01", "plants", "g6", "nextGoal"),
  r("science", "S-01", "earth_space", "g6", "action"),
  r("science", "S-01", "earth_space", "g6", "nextGoal"),
  r("science", "S-01", "mixed", "g4", "action"),
  r("science", "S-01", "mixed", "g6", "nextGoal"),
].join("\n");
assertNoBanned("resolver S-01 outputs", resolvedBlob);

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

function buildS01Unit(bucketKey, gradeKey) {
  const trk = `${bucketKey}${SEP}learning${SEP}${gradeKey}${SEP}easy`;
  return {
    blueprintRef: "test",
    engineVersion: "v2",
    unitKey: `science::${trk}`,
    subjectId: "science",
    topicRowKey: trk,
    bucketKey,
    displayName: "מדעים",
    diagnosis: { allowed: true, taxonomyId: "S-01", lineHe: "מצביע על דפוס." },
    intervention: {
      immediateActionHe: "טבלת תכונה/תהליך",
      shortPracticeHe: "הפרדה בין תכונה לבין תהליך (תרגול ממוקד)",
      taxonomyId: "S-01",
    },
    taxonomy: {
      id: "S-01",
      patternHe: "בלבול קטגוריה",
      topicHe: "סיווג",
      subskillHe: "תכונה מול תהליך",
      rootsHe: ["בלבול מושגי"],
      competitorsHe: ["קריאה"],
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
      specificationHe: "הפרדה בין תכונה לבין תהליך (תרגול ממוקד)",
      objectiveHe: "בלבול קטגוריה",
    },
    explainability: { whyNotStrongerConclusionHe: [], cannotConcludeYetHe: [] },
    canonicalState: {
      actionState: "intervene",
      recommendation: { allowed: false, family: "remedial" },
      assessment: { readiness: "ready", confidenceLevel: "moderate", cannotConcludeYet: false },
      evidence: { positiveAuthorityLevel: "none" },
      topicStateId: `ts_S-01_${bucketKey}`,
      stateHash: "s5b2",
    },
  };
}

function mkBase(bucket, gradeKey) {
  const trk = `${bucket}${SEP}learning${SEP}${gradeKey}${SEP}easy`;
  return {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: summaryFixture,
    scienceTopics: { [trk]: rowScience(trk, bucket, gradeKey) },
    diagnosticEngineV2: { units: [buildS01Unit(bucket, gradeKey)] },
  };
}

const trkA = `animals${SEP}learning${SEP}g4${SEP}easy`;
const dA = buildDetailedParentReportFromBaseReport(mkBase("animals", "g4"), { period: "week" });
const mpA = dA?.subjectProfiles?.find((p) => p.subject === "science");
assertEq("detailed S-01 animals g4", mpA?.parentActionHe, S01A.g3_g4.actionTextHe);
assertNoBanned("detailed S-01 animals g4", mpA?.parentActionHe);
const tpA = buildTruthPacketV1(dA, { scopeType: "topic", scopeId: trkA, scopeLabel: "בעלי חיים" });
assertNoBanned("truth S-01 animals g4", JSON.stringify(tpA?.narrative?.textSlots || {}));

const trkP = `plants${SEP}learning${SEP}g4${SEP}easy`;
const dP = buildDetailedParentReportFromBaseReport(mkBase("plants", "g4"), { period: "week" });
const mpP = dP?.subjectProfiles?.find((p) => p.subject === "science");
assertEq("detailed S-01 plants g4", mpP?.parentActionHe, S01P.g3_g4.actionTextHe);
assertNoBanned("detailed S-01 plants g4", mpP?.parentActionHe);

const trkE = `earth_space${SEP}learning${SEP}g6${SEP}easy`;
const dE = buildDetailedParentReportFromBaseReport(mkBase("earth_space", "g6"), { period: "week" });
const mpE = dE?.subjectProfiles?.find((p) => p.subject === "science");
assertEq("detailed S-01 earth_space g6 goal", mpE?.nextWeekGoalHe, S01E.g5_g6.goalTextHe);
assertNoBanned("detailed S-01 earth_space g6", `${mpE?.parentActionHe}\n${mpE?.nextWeekGoalHe}`);

const trkMx = `mixed${SEP}learning${SEP}g6${SEP}easy`;
const dMx = buildDetailedParentReportFromBaseReport(mkBase("mixed", "g6"), { period: "week" });
const mpMx = dMx?.subjectProfiles?.find((p) => p.subject === "science");
assertEq("detailed S-01 mixed g6 action", mpMx?.parentActionHe, S01M.g5_g6.actionTextHe);
assertNoBanned("detailed S-01 mixed g6", mpMx?.parentActionHe);
const tpMx = buildTruthPacketV1(dMx, { scopeType: "topic", scopeId: trkMx, scopeLabel: "מעורב" });
assertNoBanned("truth S-01 mixed g6", JSON.stringify(tpMx?.narrative?.textSlots || {}));

const bMx = mkBase("mixed", "g6");
const uMx = bMx.diagnosticEngineV2.units[0];
const sh = summarizeV2UnitsForSubjectForTests(bMx.diagnosticEngineV2.units, {
  subjectReportQuestions: 10,
  subjectLabelHe: "מדעים",
  topicMap: bMx.scienceTopics,
  reportTotalQuestions: 20,
});
assertEq("short S-01 mixed g6", sh.parentActionHe, resolveUnitParentActionHe(uMx, "g6"));
assertNoBanned("short S-01 mixed g6", sh.parentActionHe);

process.stdout.write("parent-report-grade-aware-phase5b2-science-s01-verify: ok\n");
