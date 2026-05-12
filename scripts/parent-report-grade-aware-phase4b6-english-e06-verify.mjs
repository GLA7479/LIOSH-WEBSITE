/**
 * Phase 4-B6 — English E-06 (sentences + sentence bucketOverrides) + narrow parent-facing cleanup for raw E-06 literals.
 *   npx tsx scripts/parent-report-grade-aware-phase4b6-english-e06-verify.mjs
 */

const [resolverMod, recMod, templatesMod, detailedMod, v2Mod, truthMod, normalizeMod] = await Promise.all([
  import("../utils/parent-report-language/grade-aware-recommendation-resolver.js"),
  import("../utils/parent-report-recommendation-consistency.js"),
  import("../utils/parent-report-language/grade-aware-recommendation-templates.js"),
  import("../utils/detailed-parent-report.js"),
  import("../utils/parent-report-v2.js"),
  import("../utils/parent-copilot/truth-packet-v1.js"),
  import("../utils/parent-report-language/parent-facing-normalize-he.js"),
]);

const { resolveGradeAwareParentRecommendationHe } = resolverMod;
const { resolveUnitParentActionHe } = recMod;
const GRADE_AWARE_RECOMMENDATION_TEMPLATES = templatesMod.GRADE_AWARE_RECOMMENDATION_TEMPLATES;
const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = v2Mod;
const { buildTruthPacketV1 } = truthMod;
const { normalizeParentFacingHe } = normalizeMod;

const ENG = GRADE_AWARE_RECOMMENDATION_TEMPLATES.english;
const E06_S = ENG["E-06"].bucketOverrides.sentences;
const E06_SENT = ENG["E-06"].bucketOverrides.sentence;
const SEP = "\u0001";

const E06_FORBIDDEN = [
  "inference",
  "Inference",
  "עובדה במקום הסקה",
  "עובדה מול inference",
  "מילות סימן להסקה",
  "טעות רק ב־inference",
  "לפני לימוד inference",
];

const BANNED = [
  "טעות בדו־עמודי",
  "גופן גדול מול קטן",
  "מספר שורה / אצבע",
  "דיווח ראייה",
  "שגיאות חוזרות",
  "כתב יד מבוקר",
  "כלל איות מיני",
  "פונולוגיה",
  "לקות",
  "דיווח מקצועי",
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

function assertNoE06Forbidden(label, blob) {
  const t =
    blob == null
      ? ""
      : typeof blob === "string"
        ? blob
        : typeof blob === "object"
          ? JSON.stringify(blob)
          : String(blob);
  for (const ph of E06_FORBIDDEN) {
    if (t.includes(ph)) throw new Error(`${label} forbidden E-06 literal: ${ph}`);
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

// —— 1. sentences bucket ——
assertNull("E-06 sentences g1 action", r("english", "E-06", "sentences", "g1", "action"));
assertEq("E-06 sentences g4 action", r("english", "E-06", "sentences", "g4", "action"), E06_S.g3_g4.actionTextHe);
assertEq("E-06 sentences g4 goal", r("english", "E-06", "sentences", "g4", "nextGoal"), E06_S.g3_g4.goalTextHe);
assertEq("E-06 sentences g6 action", r("english", "E-06", "sentences", "g6", "action"), E06_S.g5_g6.actionTextHe);
assertEq("E-06 sentences g6 goal", r("english", "E-06", "sentences", "g6", "nextGoal"), E06_S.g5_g6.goalTextHe);
assertNe("E-06 sentences g4", r("english", "E-06", "sentences", "g4", "action"), r("english", "E-06", "sentences", "g4", "nextGoal"));
assertEq("E-06 SENTENCES uppercase", r("english", "E-06", "SENTENCES", "g4", "action"), E06_S.g3_g4.actionTextHe);

// —— 2. sentence alias bucket ——
assertNull("E-06 sentence g1 goal", r("english", "E-06", "sentence", "g1", "nextGoal"));
assertEq("E-06 sentence g4 action", r("english", "E-06", "sentence", "g4", "action"), E06_SENT.g3_g4.actionTextHe);
assertEq("E-06 sentence g4 goal", r("english", "E-06", "sentence", "g4", "nextGoal"), E06_SENT.g3_g4.goalTextHe);
assertEq("E-06 sentence g6 action", r("english", "E-06", "sentence", "g6", "action"), E06_SENT.g5_g6.actionTextHe);
assertEq("E-06 sentence matches sentences g4 action", E06_SENT.g3_g4.actionTextHe, E06_S.g3_g4.actionTextHe);

// —— 3. Feature behavior ——
assertNull("unknown grade g9 E-06", r("english", "E-06", "sentences", "g9", "action"));
assertNull("E-06 wrong bucket vocabulary g4", r("english", "E-06", "vocabulary", "g4", "action"));
delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

const resolvedBlob = [
  r("english", "E-06", "sentences", "g4", "action"),
  r("english", "E-06", "sentences", "g4", "nextGoal"),
  r("english", "E-06", "sentences", "g6", "action"),
  r("english", "E-06", "sentences", "g6", "nextGoal"),
  r("english", "E-06", "sentence", "g4", "action"),
  r("english", "E-06", "sentence", "g4", "nextGoal"),
  r("english", "E-06", "sentence", "g6", "action"),
  r("english", "E-06", "sentence", "g6", "nextGoal"),
].join("\n");
assertNoBanned("resolver E-06 outputs", resolvedBlob);
assertNoE06Forbidden("resolver E-06 outputs", resolvedBlob);

// —— E-03 / E-07 still resolve (unchanged) ——
{
  const a = r("english", "E-03", "translation", "g4", "action");
  if (!a || String(a).trim() === "") throw new Error("E-03 g4 action expected");
  const b = r("english", "E-07", "writing", "g4", "nextGoal");
  if (!b || String(b).trim() === "") throw new Error("E-07 g4 nextGoal expected");
}

// —— Narrow normalize: raw E-06 taxonomy mix must not leak "inference" ——
{
  const raw =
    "עובדה מול inference · עובדה במקום הסקה · מילות סימן להסקה · טעות רק ב־inference · לפני לימוד inference";
  const n = normalizeParentFacingHe(raw);
  assertNoE06Forbidden("normalizeParentFacingHe E-06 raw concat", n);
}

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
  englishQuestions: 12,
  englishCorrect: 8,
  englishAccuracy: 67,
  scienceQuestions: 0,
  scienceCorrect: 0,
  scienceAccuracy: 0,
  hebrewQuestions: 0,
  hebrewCorrect: 0,
  hebrewAccuracy: 0,
  moledetGeographyQuestions: 0,
  moledetGeographyCorrect: 0,
  moledetGeographyAccuracy: 0,
};

function rowEnglish(topicRowKey, bucketKey, gradeKey) {
  return {
    bucketKey,
    displayName: "אנגלית",
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

function buildEnglishUnit(taxonomyId, bucketKey, topicRowKey) {
  const isE07 = taxonomyId === "E-07";
  return {
    blueprintRef: "test",
    engineVersion: "v2",
    unitKey: `english::${topicRowKey}`,
    subjectId: "english",
    topicRowKey,
    bucketKey,
    displayName: "אנגלית",
    diagnosis: { allowed: true, taxonomyId, lineHe: "מצביע על דפוס." },
    intervention: {
      immediateActionHe: isE07 ? "שגיאות חוזרות" : "טעות בדו־עמודי",
      shortPracticeHe: isE07 ? "כתב יד מבוקר" : "גופן גדול מול קטן",
      taxonomyId,
    },
    taxonomy: {
      id: taxonomyId,
      patternHe: "עובדה במקום הסקה",
      topicHe: "הבנה",
      subskillHe: "inference",
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
      specificationHe: "עובדה מול inference",
      objectiveHe: "מילות סימן להסקה",
    },
    explainability: { whyNotStrongerConclusionHe: [], cannotConcludeYetHe: [] },
    canonicalState: {
      actionState: "intervene",
      recommendation: { allowed: false, family: "remedial" },
      assessment: { readiness: "ready", confidenceLevel: "moderate", cannotConcludeYet: false },
      evidence: { positiveAuthorityLevel: "none" },
      topicStateId: `ts_${taxonomyId}_${bucketKey}`,
      stateHash: "e1",
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
    englishTopics: { [trk]: rowEnglish(trk, bucket, gradeKey) },
    diagnosticEngineV2: { units: [buildEnglishUnit(taxonomyId, bucket, trk)] },
  };
}

const trkS4 = `sentences${SEP}learning${SEP}g4${SEP}easy`;
const dS4 = buildDetailedParentReportFromBaseReport(mkBase("E-06", "sentences", "g4"), { period: "week" });
const mpS4 = dS4?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-06 sentences g4", mpS4?.parentActionHe, E06_S.g3_g4.actionTextHe);
assertNoBanned("detailed E-06 sentences g4", mpS4?.parentActionHe);
assertNoE06Forbidden("detailed E-06 sentences g4", mpS4?.parentActionHe);
const tpS4 = buildTruthPacketV1(dS4, { scopeType: "topic", scopeId: trkS4, scopeLabel: "משפטים" });
assertNoE06Forbidden("truth E-06 sentences g4", JSON.stringify(tpS4?.narrative?.textSlots || {}));

const trkS6 = `sentences${SEP}learning${SEP}g6${SEP}easy`;
const dS6 = buildDetailedParentReportFromBaseReport(mkBase("E-06", "sentences", "g6"), { period: "week" });
const mpS6 = dS6?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-06 sentences g6", mpS6?.parentActionHe, E06_S.g5_g6.actionTextHe);
assertNoE06Forbidden("detailed E-06 sentences g6 action", mpS6?.parentActionHe);
assertNoE06Forbidden("detailed E-06 sentences g6 goal", mpS6?.parentNextGoalHe);

const trkN4 = `sentence${SEP}learning${SEP}g4${SEP}easy`;
const dN4 = buildDetailedParentReportFromBaseReport(mkBase("E-06", "sentence", "g4"), { period: "week" });
const mpN4 = dN4?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-06 sentence g4", mpN4?.parentActionHe, E06_SENT.g3_g4.actionTextHe);
assertNoE06Forbidden("detailed E-06 sentence g4 action", mpN4?.parentActionHe);
assertNoE06Forbidden("detailed E-06 sentence g4 goal", mpN4?.parentNextGoalHe);

const bS6 = mkBase("E-06", "sentences", "g6");
const uS6 = bS6.diagnosticEngineV2.units[0];
const sh = summarizeV2UnitsForSubjectForTests(bS6.diagnosticEngineV2.units, {
  subjectReportQuestions: 12,
  subjectLabelHe: "אנגלית",
  topicMap: bS6.englishTopics,
  reportTotalQuestions: 20,
});
assertEq("short E-06 g6", sh.parentActionHe, resolveUnitParentActionHe(uS6, "g6"));
assertNoE06Forbidden("short E-06 g6", sh.parentActionHe);

process.stdout.write("parent-report-grade-aware-phase4b6-english-e06-verify: ok\n");
