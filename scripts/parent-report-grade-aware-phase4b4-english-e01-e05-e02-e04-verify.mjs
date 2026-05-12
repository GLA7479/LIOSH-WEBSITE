/**
 * Phase 4-B4 — English E-01 / E-05 (vocabulary) + E-02 / E-04 (grammar) bucketOverrides + routing smoke.
 *   npx tsx scripts/parent-report-grade-aware-phase4b4-english-e01-e05-e02-e04-verify.mjs
 */

const [resolverMod, recMod, templatesMod, detailedMod, v2Mod, truthMod, orderEnglishMod] = await Promise.all([
  import("../utils/parent-report-language/grade-aware-recommendation-resolver.js"),
  import("../utils/parent-report-recommendation-consistency.js"),
  import("../utils/parent-report-language/grade-aware-recommendation-templates.js"),
  import("../utils/detailed-parent-report.js"),
  import("../utils/parent-report-v2.js"),
  import("../utils/parent-copilot/truth-packet-v1.js"),
  import(new URL("../utils/diagnostic-engine-v2/english-taxonomy-candidate-order.js", import.meta.url).href),
]);

const { resolveGradeAwareParentRecommendationHe } = resolverMod;
const { resolveUnitParentActionHe } = recMod;
const GRADE_AWARE_RECOMMENDATION_TEMPLATES = templatesMod.GRADE_AWARE_RECOMMENDATION_TEMPLATES;
const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = v2Mod;
const { buildTruthPacketV1 } = truthMod;
const { orderEnglishTaxonomyCandidates } = orderEnglishMod;

const ENG = GRADE_AWARE_RECOMMENDATION_TEMPLATES.english;
const E01_V = ENG["E-01"].bucketOverrides.vocabulary;
const E05_V = ENG["E-05"].bucketOverrides.vocabulary;
const E02_G = ENG["E-02"].bucketOverrides.grammar;
const E04_G = ENG["E-04"].bucketOverrides.grammar;
const SEP = "\u0001";

/** Raw / internal English taxonomy tokens must not appear in parent-facing resolver or report surfaces for these paths. */
const FORBIDDEN_SUBSTRINGS = [
  "past/present",
  "he/she/it",
  "collocation",
  "preposition",
  "false friend",
  "grammar_basic",
  "sentence_structure",
  "תרגום מילולי",
  "משפטים מקבילים",
  "כרטיסיות משפט",
  "מסיח false friend",
  "שרשרת עם נושא",
  "טבלת נושא–כינוי",
  "אותו פועל, שני יחסים",
  "זוגות מיניים",
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

function assertNoForbiddenInternal(label, blob) {
  const s = typeof blob === "string" ? blob : JSON.stringify(blob);
  const low = s.toLowerCase();
  for (const ph of FORBIDDEN_SUBSTRINGS) {
    const needle = ph.toLowerCase();
    if (low.includes(needle)) throw new Error(`${label} forbidden/internal substring: ${ph}`);
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

// —— E-01 vocabulary ——
assertNull("E-01 vocabulary g1 action", r("english", "E-01", "vocabulary", "g1", "action"));
assertNull("E-01 vocabulary g2 goal", r("english", "E-01", "vocabulary", "g2", "nextGoal"));
assertEq("E-01 vocabulary g4 action", r("english", "E-01", "vocabulary", "g4", "action"), E01_V.g3_g4.actionTextHe);
assertEq("E-01 vocabulary g4 goal", r("english", "E-01", "vocabulary", "g4", "nextGoal"), E01_V.g3_g4.goalTextHe);
assertEq("E-01 vocabulary g6 action", r("english", "E-01", "vocabulary", "g6", "action"), E01_V.g5_g6.actionTextHe);
assertEq("E-01 vocabulary g6 goal", r("english", "E-01", "vocabulary", "g6", "nextGoal"), E01_V.g5_g6.goalTextHe);
assertNe("E-01 vocabulary g4", r("english", "E-01", "vocabulary", "g4", "action"), r("english", "E-01", "vocabulary", "g4", "nextGoal"));
assertEq("E-01 VOCABULARY uppercase", r("english", "E-01", "VOCABULARY", "g4", "action"), E01_V.g3_g4.actionTextHe);

// —— E-05 vocabulary ——
assertNull("E-05 vocabulary g1 action", r("english", "E-05", "vocabulary", "g1", "action"));
assertEq("E-05 vocabulary g4 action", r("english", "E-05", "vocabulary", "g4", "action"), E05_V.g3_g4.actionTextHe);
assertEq("E-05 vocabulary g6 goal", r("english", "E-05", "vocabulary", "g6", "nextGoal"), E05_V.g5_g6.goalTextHe);
assertNe("E-05 vocabulary g6", r("english", "E-05", "vocabulary", "g6", "action"), r("english", "E-05", "vocabulary", "g6", "nextGoal"));

// —— E-02 grammar ——
assertNull("E-02 grammar g1 action", r("english", "E-02", "grammar", "g1", "action"));
assertEq("E-02 grammar g4 action", r("english", "E-02", "grammar", "g4", "action"), E02_G.g3_g4.actionTextHe);
assertEq("E-02 grammar g4 goal", r("english", "E-02", "grammar", "g4", "nextGoal"), E02_G.g3_g4.goalTextHe);
assertEq("E-02 grammar g6 action", r("english", "E-02", "grammar", "g6", "action"), E02_G.g5_g6.actionTextHe);
assertNe("E-02 grammar g4", r("english", "E-02", "grammar", "g4", "action"), r("english", "E-02", "grammar", "g4", "nextGoal"));

// —— E-04 grammar ——
assertNull("E-04 grammar g1 action", r("english", "E-04", "grammar", "g1", "action"));
assertEq("E-04 grammar g4 action", r("english", "E-04", "grammar", "g4", "action"), E04_G.g3_g4.actionTextHe);
assertEq("E-04 grammar g6 goal", r("english", "E-04", "grammar", "g6", "nextGoal"), E04_G.g5_g6.goalTextHe);
assertNe("E-04 grammar g6", r("english", "E-04", "grammar", "g6", "action"), r("english", "E-04", "grammar", "g6", "nextGoal"));

// —— Cross-bucket / grade / env ——
assertNull("unknown grade g9 E-01", r("english", "E-01", "vocabulary", "g9", "action"));
assertNull("E-01 wrong bucket translation g4", r("english", "E-01", "translation", "g4", "action"));
assertNull("E-05 wrong bucket grammar g4", r("english", "E-05", "grammar", "g4", "action"));
delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

const resolvedBlob = [
  r("english", "E-01", "vocabulary", "g4", "action"),
  r("english", "E-01", "vocabulary", "g4", "nextGoal"),
  r("english", "E-01", "vocabulary", "g6", "action"),
  r("english", "E-01", "vocabulary", "g6", "nextGoal"),
  r("english", "E-05", "vocabulary", "g4", "action"),
  r("english", "E-05", "vocabulary", "g4", "nextGoal"),
  r("english", "E-05", "vocabulary", "g6", "action"),
  r("english", "E-05", "vocabulary", "g6", "nextGoal"),
  r("english", "E-02", "grammar", "g4", "action"),
  r("english", "E-02", "grammar", "g4", "nextGoal"),
  r("english", "E-02", "grammar", "g6", "action"),
  r("english", "E-02", "grammar", "g6", "nextGoal"),
  r("english", "E-04", "grammar", "g4", "action"),
  r("english", "E-04", "grammar", "g4", "nextGoal"),
  r("english", "E-04", "grammar", "g6", "action"),
  r("english", "E-04", "grammar", "g6", "nextGoal"),
].join("\n");
assertNoBanned("resolver E-01/E-05/E-02/E-04 outputs", resolvedBlob);
assertNoForbiddenInternal("resolver E-01/E-05/E-02/E-04 outputs", resolvedBlob);

// —— Routing + first-id template resolution ——
{
  const oV = orderEnglishTaxonomyCandidates(
    ["E-01", "E-05"],
    [{ patternFamily: "vocabulary", kind: "word_meaning" }],
    { bucketKey: "vocabulary" }
  );
  if (oV[0] !== "E-01") throw new Error("routing vocab recognition should prefer E-01");
  assertEq("routing→E-01 template action", r("english", "E-01", "vocabulary", "g4", "action"), E01_V.g3_g4.actionTextHe);

  const oV2 = orderEnglishTaxonomyCandidates(
    ["E-01", "E-05"],
    [{ params: { kind: "meaning_from_context" } }],
    { bucketKey: "vocabulary" }
  );
  if (oV2[0] !== "E-05") throw new Error("routing vocab-in-context should prefer E-05");
  assertEq("routing→E-05 template goal g6", r("english", "E-05", "vocabulary", "g6", "nextGoal"), E05_V.g5_g6.goalTextHe);

  const oG = orderEnglishTaxonomyCandidates(
    ["E-02", "E-04"],
    [{ kind: "tense", params: { operation: "present" } }],
    { bucketKey: "grammar" }
  );
  if (oG[0] !== "E-02") throw new Error("routing basic grammar should prefer E-02");
  assertEq("routing→E-02 template action g4", r("english", "E-02", "grammar", "g4", "action"), E02_G.g3_g4.actionTextHe);

  const oG2 = orderEnglishTaxonomyCandidates(
    ["E-02", "E-04"],
    [{ patternFamily: "sentence_structure", params: { word_order: true } }],
    { bucketKey: "grammar" }
  );
  if (oG2[0] !== "E-04") throw new Error("routing sentence structure should prefer E-04");
  assertEq("routing→E-04 template goal g6", r("english", "E-04", "grammar", "g6", "nextGoal"), E04_G.g5_g6.goalTextHe);

  orderEnglishTaxonomyCandidates(["E-01", "E-05"], [], { bucketKey: "vocabulary" });
  r("english", "E-01", "vocabulary", "g4", "action");
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

const trkE01g4 = `vocabulary${SEP}learning${SEP}g4${SEP}easy`;
const dE01g4 = buildDetailedParentReportFromBaseReport(mkBase("E-01", "vocabulary", "g4"), { period: "week" });
const mpE01g4 = dE01g4?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-01 vocabulary g4", mpE01g4?.parentActionHe, E01_V.g3_g4.actionTextHe);
assertNoBanned("detailed E-01 g4", mpE01g4?.parentActionHe);
assertNoForbiddenInternal("detailed E-01 g4", mpE01g4?.parentActionHe);
const tpE01g4 = buildTruthPacketV1(dE01g4, { scopeType: "topic", scopeId: trkE01g4, scopeLabel: "אוצר מילים" });
assertNoBanned("truth E-01 g4", JSON.stringify(tpE01g4?.narrative?.textSlots || {}));
assertNoForbiddenInternal("truth E-01 g4", JSON.stringify(tpE01g4?.narrative?.textSlots || {}));

const trkE05g6 = `vocabulary${SEP}learning${SEP}g6${SEP}easy`;
const dE05g6 = buildDetailedParentReportFromBaseReport(mkBase("E-05", "vocabulary", "g6"), { period: "week" });
const mpE05g6 = dE05g6?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-05 vocabulary g6", mpE05g6?.parentActionHe, E05_V.g5_g6.actionTextHe);
assertNoForbiddenInternal("detailed E-05 g6", mpE05g6?.parentActionHe);
const tpE05g6 = buildTruthPacketV1(dE05g6, { scopeType: "topic", scopeId: trkE05g6, scopeLabel: "אוצר" });
assertNoForbiddenInternal("truth E-05 g6", JSON.stringify(tpE05g6?.narrative?.textSlots || {}));

const trkE02g4 = `grammar${SEP}learning${SEP}g4${SEP}easy`;
const dE02g4 = buildDetailedParentReportFromBaseReport(mkBase("E-02", "grammar", "g4"), { period: "week" });
const mpE02g4 = dE02g4?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-02 grammar g4", mpE02g4?.parentActionHe, E02_G.g3_g4.actionTextHe);
assertNoForbiddenInternal("detailed E-02 g4", mpE02g4?.parentActionHe);

const trkE04g6 = `grammar${SEP}learning${SEP}g6${SEP}easy`;
const dE04g6 = buildDetailedParentReportFromBaseReport(mkBase("E-04", "grammar", "g6"), { period: "week" });
const mpE04g6 = dE04g6?.subjectProfiles?.find((p) => p.subject === "english");
assertEq("detailed E-04 grammar g6", mpE04g6?.parentActionHe, E04_G.g5_g6.actionTextHe);
assertNoForbiddenInternal("detailed E-04 g6", mpE04g6?.parentActionHe);
const tpE04g6 = buildTruthPacketV1(dE04g6, { scopeType: "topic", scopeId: trkE04g6, scopeLabel: "דקדוק" });
assertNoForbiddenInternal("truth E-04 g6", JSON.stringify(tpE04g6?.narrative?.textSlots || {}));

const bE04g6 = mkBase("E-04", "grammar", "g6");
const uE04 = bE04g6.diagnosticEngineV2.units[0];
const sh = summarizeV2UnitsForSubjectForTests(bE04g6.diagnosticEngineV2.units, {
  subjectReportQuestions: 12,
  subjectLabelHe: "אנגלית",
  topicMap: bE04g6.englishTopics,
  reportTotalQuestions: 20,
});
assertEq("short E-04 g6", sh.parentActionHe, resolveUnitParentActionHe(uE04, "g6"));
assertNoForbiddenInternal("short E-04 g6", sh.parentActionHe);

process.stdout.write("parent-report-grade-aware-phase4b4-english-e01-e05-e02-e04-verify: ok\n");
