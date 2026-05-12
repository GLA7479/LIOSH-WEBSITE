/**
 * Phase 4-B2 — English E-03 (translation) + E-07 (writing) bucketOverrides + english bucket normalization.
 *   npx tsx scripts/parent-report-grade-aware-phase4b2-english-e03-e07-verify.mjs
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
const { resolveUnitParentActionHe, resolveUnitNextGoalHe } = recMod;
const GRADE_AWARE_RECOMMENDATION_TEMPLATES = templatesMod.GRADE_AWARE_RECOMMENDATION_TEMPLATES;
const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = v2Mod;
const { buildTruthPacketV1 } = truthMod;

const ENG = GRADE_AWARE_RECOMMENDATION_TEMPLATES.english;
const E03_TR = ENG["E-03"].bucketOverrides.translation;
const E07_WR = ENG["E-07"].bucketOverrides.writing;
const SEP = "\u0001";

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

function r(sid, tid, bucket, grade, slot) {
  return resolveGradeAwareParentRecommendationHe({
    subjectId: sid,
    taxonomyId: tid,
    bucketKey: bucket,
    gradeKey: grade,
    slot: slot === "nextGoal" ? "nextGoal" : "action",
  });
}

// —— E-03 translation ——
assertNull("E-03 translation g1 action", r("english", "E-03", "translation", "g1", "action"));
assertNull("E-03 translation g2 goal", r("english", "E-03", "translation", "g2", "nextGoal"));
assertEq("E-03 translation g4 action", r("english", "E-03", "translation", "g4", "action"), E03_TR.g3_g4.actionTextHe);
assertEq("E-03 translation g4 goal", r("english", "E-03", "translation", "g4", "nextGoal"), E03_TR.g3_g4.goalTextHe);
assertEq("E-03 translation g6 action", r("english", "E-03", "translation", "g6", "action"), E03_TR.g5_g6.actionTextHe);
assertEq("E-03 translation g6 goal", r("english", "E-03", "translation", "g6", "nextGoal"), E03_TR.g5_g6.goalTextHe);
assertNe("E-03 translation g4", r("english", "E-03", "translation", "g4", "action"), r("english", "E-03", "translation", "g4", "nextGoal"));
assertEq("E-03 TRANSLATION uppercase", r("english", "E-03", "TRANSLATION", "g4", "action"), E03_TR.g3_g4.actionTextHe);

// —— E-07 writing ——
assertNull("E-07 writing g1", r("english", "E-07", "writing", "g1", "action"));
assertEq("E-07 writing g4 action", r("english", "E-07", "writing", "g4", "action"), E07_WR.g3_g4.actionTextHe);
assertEq("E-07 writing g6 goal", r("english", "E-07", "writing", "g6", "nextGoal"), E07_WR.g5_g6.goalTextHe);
assertNe("E-07 writing g6", r("english", "E-07", "writing", "g6", "action"), r("english", "E-07", "writing", "g6", "nextGoal"));
assertEq("E-07 WRITING uppercase", r("english", "E-07", "WRITING", "g4", "action"), E07_WR.g3_g4.actionTextHe);

// —— Cross-bucket / grade ——
assertNull("unknown grade g9 E-03", r("english", "E-03", "translation", "g9", "action"));
assertNull("null grade E-03", r("english", "E-03", "translation", null, "action"));
assertNull("E-03 unknown bucket grammar", r("english", "E-03", "grammar", "g4", "action"));
assertNull("E-07 unknown bucket translation", r("english", "E-07", "translation", "g4", "action"));

delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

const resolvedBlob = [
  r("english", "E-03", "translation", "g4", "action"),
  r("english", "E-03", "translation", "g4", "nextGoal"),
  r("english", "E-03", "translation", "g6", "action"),
  r("english", "E-03", "translation", "g6", "nextGoal"),
  r("english", "E-07", "writing", "g4", "action"),
  r("english", "E-07", "writing", "g4", "nextGoal"),
  r("english", "E-07", "writing", "g6", "action"),
  r("english", "E-07", "writing", "g6", "nextGoal"),
].join("\n");
assertNoBanned("resolver outputs", resolvedBlob);

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
      patternHe: "דפוס לבדיקת מערכת",
      topicHe: "אנגלית",
      subskillHe: "test",
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
      specificationHe: isE07 ? "כלל איות מיני" : "מספר שורה / אצבע",
      objectiveHe: isE07 ? "פונולוגיה" : "דיווח ראייה",
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

const trkE03g4 = `translation${SEP}learning${SEP}g4${SEP}easy`;
const dE03g4 = buildDetailedParentReportFromBaseReport(mkBase("E-03", "translation", "g4"), { period: "week" });
const mpE03g4 = dE03g4?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-03 translation g4", mpE03g4?.parentActionHe, E03_TR.g3_g4.actionTextHe);
assertNoBanned("detailed E-03 g4", mpE03g4?.parentActionHe);
const tpE03g4 = buildTruthPacketV1(dE03g4, { scopeType: "topic", scopeId: trkE03g4, scopeLabel: "תרגום" });
assertNoBanned("truth E-03 g4", JSON.stringify(tpE03g4?.narrative?.textSlots || {}));

const trkE03g6 = `translation${SEP}learning${SEP}g6${SEP}easy`;
const dE03g6 = buildDetailedParentReportFromBaseReport(mkBase("E-03", "translation", "g6"), { period: "week" });
const mpE03g6 = dE03g6?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-03 translation g6", mpE03g6?.parentActionHe, E03_TR.g5_g6.actionTextHe);
assertNoBanned("detailed E-03 g6", mpE03g6?.parentActionHe);
const tpE03g6 = buildTruthPacketV1(dE03g6, { scopeType: "topic", scopeId: trkE03g6, scopeLabel: "תרגום" });
assertNoBanned("truth E-03 g6", JSON.stringify(tpE03g6?.narrative?.textSlots || {}));

const trkE07g4 = `writing${SEP}learning${SEP}g4${SEP}easy`;
const dE07g4 = buildDetailedParentReportFromBaseReport(mkBase("E-07", "writing", "g4"), { period: "week" });
const mpE07g4 = dE07g4?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-07 writing g4", mpE07g4?.parentActionHe, E07_WR.g3_g4.actionTextHe);
assertNoBanned("detailed E-07 g4", mpE07g4?.parentActionHe);
const tpE07g4 = buildTruthPacketV1(dE07g4, { scopeType: "topic", scopeId: trkE07g4, scopeLabel: "כתיבה" });
assertNoBanned("truth E-07 g4", JSON.stringify(tpE07g4?.narrative?.textSlots || {}));

const trkE07g6 = `writing${SEP}learning${SEP}g6${SEP}easy`;
const bE07g6 = mkBase("E-07", "writing", "g6");
const dE07g6 = buildDetailedParentReportFromBaseReport(bE07g6, { period: "week" });
const mpE07g6 = dE07g6?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-07 writing g6", mpE07g6?.parentActionHe, E07_WR.g5_g6.actionTextHe);
assertNoBanned("detailed E-07 g6", mpE07g6?.parentActionHe);
const tpE07g6 = buildTruthPacketV1(dE07g6, { scopeType: "topic", scopeId: trkE07g6, scopeLabel: "כתיבה" });
assertNoBanned("truth E-07 g6", JSON.stringify(tpE07g6?.narrative?.textSlots || {}));

const uE07 = bE07g6.diagnosticEngineV2.units[0];
const sh = summarizeV2UnitsForSubjectForTests(bE07g6.diagnosticEngineV2.units, {
  subjectReportQuestions: 12,
  subjectLabelHe: "אנגלית",
  topicMap: bE07g6.englishTopics,
  reportTotalQuestions: 20,
});
assertEq("short E-07 g6", sh.parentActionHe, resolveUnitParentActionHe(uE07, "g6"));
assertNoBanned("short E-07 g6", sh.parentActionHe);

process.stdout.write("parent-report-grade-aware-phase4b2-english-e03-e07-verify: ok\n");
