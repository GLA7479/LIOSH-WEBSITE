/**
 * Phase 4-C3 — Hebrew H-01/H-02/H-03/H-06/H-07 bucketOverrides + routing integration + parent-facing phrase guard.
 *   npx tsx scripts/parent-report-grade-aware-phase4c3-hebrew-h01030607-verify.mjs
 */

const [resolverMod, templatesMod, detailedMod, v2Mod, truthMod, orderHebrewMod] = await Promise.all([
  import("../utils/parent-report-language/grade-aware-recommendation-resolver.js"),
  import("../utils/parent-report-language/grade-aware-recommendation-templates.js"),
  import("../utils/detailed-parent-report.js"),
  import("../utils/parent-report-v2.js"),
  import("../utils/parent-copilot/truth-packet-v1.js"),
  import("../utils/diagnostic-engine-v2/hebrew-taxonomy-candidate-order.js"),
]);

const { resolveGradeAwareParentRecommendationHe } = resolverMod;
const GRADE_AWARE_RECOMMENDATION_TEMPLATES = templatesMod.GRADE_AWARE_RECOMMENDATION_TEMPLATES;
const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = v2Mod;
const { buildTruthPacketV1 } = truthMod;
const { orderHebrewTaxonomyCandidates } = orderHebrewMod;

const HE = GRADE_AWARE_RECOMMENDATION_TEMPLATES.hebrew;
const H01_VOC = HE["H-01"].bucketOverrides.vocabulary;
const H01_MIX = HE["H-01"].bucketOverrides.mixed;
const H02_GR = HE["H-02"].bucketOverrides.grammar;
const H03_WR = HE["H-03"].bucketOverrides.writing;
const H06_GR = HE["H-06"].bucketOverrides.grammar;
const H07_WR = HE["H-07"].bucketOverrides.writing;
const SEP = "\u0001";

/** Raw taxonomy / internal phrases (Phase 4-C1 slice) — must not appear in resolved parent-facing strings. */
const FORBIDDEN = [
  "מילה קרובה לא נכונה",
  "זוג משפטים מקבילים",
  "זוג מילים + החלפה",
  "כינוי/שם עצם שגוי",
  "מגדר/מספר",
  "טבלת התאמה",
  "אותה משפחה שגויה",
  "כתב יד מול הקלדה",
  "כלל משפחה + 5 מילים",
  "סדר מילים שגוי",
  "השלמת מילות שאלה",
  "תבניות מיניות",
  "משפטים לא מחוברים",
  "שני משפטים עם קישור חובה",
  "מילות קישור",
  "אוצר דק",
  "כללי התאמה",
  "דיסלקציה",
  "דיווח חוצה־מקצועות",
  "עברית חלשה",
  "סינטקס",
  "תחביר",
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

function assertNoForbidden(label, blob) {
  const s = typeof blob === "string" ? blob : JSON.stringify(blob);
  for (const f of FORBIDDEN) {
    if (s.includes(f)) throw new Error(`${label} forbidden substring: ${f}`);
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

// —— 1. H-01 vocabulary + mixed ——
assertNull("H-01 vocabulary g1 action", r("hebrew", "H-01", "vocabulary", "g1", "action"));
assertNull("H-01 vocabulary g2 goal", r("hebrew", "H-01", "vocabulary", "g2", "nextGoal"));
assertEq("H-01 vocabulary g4 action", r("hebrew", "H-01", "vocabulary", "g4", "action"), H01_VOC.g3_g4.actionTextHe);
assertEq("H-01 vocabulary g4 goal", r("hebrew", "H-01", "vocabulary", "g4", "nextGoal"), H01_VOC.g3_g4.goalTextHe);
assertEq("H-01 vocabulary g6 action", r("hebrew", "H-01", "vocabulary", "g6", "action"), H01_VOC.g5_g6.actionTextHe);
assertNe("H-01 vocabulary g4", r("hebrew", "H-01", "vocabulary", "g4", "action"), r("hebrew", "H-01", "vocabulary", "g4", "nextGoal"));
assertNull("H-01 mixed g1 action", r("hebrew", "H-01", "mixed", "g1", "action"));
assertEq("H-01 mixed g4 action", r("hebrew", "H-01", "mixed", "g4", "action"), H01_MIX.g3_g4.actionTextHe);
assertEq("H-01 mixed g6 goal", r("hebrew", "H-01", "mixed", "g6", "nextGoal"), H01_MIX.g5_g6.goalTextHe);

// —— 2. H-02 grammar ——
assertNull("H-02 grammar g1 action", r("hebrew", "H-02", "grammar", "g1", "action"));
assertEq("H-02 grammar g4 action", r("hebrew", "H-02", "grammar", "g4", "action"), H02_GR.g3_g4.actionTextHe);
assertEq("H-02 grammar g6 goal", r("hebrew", "H-02", "grammar", "g6", "nextGoal"), H02_GR.g5_g6.goalTextHe);

// —— 3. H-03 writing ——
assertNull("H-03 writing g1 action", r("hebrew", "H-03", "writing", "g1", "action"));
assertEq("H-03 writing g4 action", r("hebrew", "H-03", "writing", "g4", "action"), H03_WR.g3_g4.actionTextHe);
assertEq("H-03 writing g6 goal", r("hebrew", "H-03", "writing", "g6", "nextGoal"), H03_WR.g5_g6.goalTextHe);

// —— 4. H-06 grammar ——
assertNull("H-06 grammar g1 goal", r("hebrew", "H-06", "grammar", "g1", "nextGoal"));
assertEq("H-06 grammar g4 action", r("hebrew", "H-06", "grammar", "g4", "action"), H06_GR.g3_g4.actionTextHe);
assertEq("H-06 grammar g6 action", r("hebrew", "H-06", "grammar", "g6", "action"), H06_GR.g5_g6.actionTextHe);

// —— 5. H-07 writing ——
assertNull("H-07 writing g1 goal", r("hebrew", "H-07", "writing", "g1", "nextGoal"));
assertEq("H-07 writing g4 action", r("hebrew", "H-07", "writing", "g4", "action"), H07_WR.g3_g4.actionTextHe);
assertEq("H-07 writing g6 action", r("hebrew", "H-07", "writing", "g6", "action"), H07_WR.g5_g6.actionTextHe);
assertEq("H-07 writing g6 goal", r("hebrew", "H-07", "writing", "g6", "nextGoal"), H07_WR.g5_g6.goalTextHe);

// —— 6. Routing + resolver template integration ——
{
  const gBasic = orderHebrewTaxonomyCandidates(
    ["H-02", "H-06"],
    [{ patternFamily: "grammar_basic", params: { agreement: true, gender: "f" } }],
    { bucketKey: "grammar" }
  );
  if (gBasic[0] !== "H-02") throw new Error(`expected H-02 first for basic grammar, got ${gBasic.join(",")}`);
  assertEq("H-02 wins copy", r("hebrew", "H-02", "grammar", "g4", "action"), H02_GR.g3_g4.actionTextHe);

  const gAdv = orderHebrewTaxonomyCandidates(
    ["H-02", "H-06"],
    [{ patternFamily: "syntax", params: { binyan: "hifil", root_pattern: "x" } }],
    { bucketKey: "grammar" }
  );
  if (gAdv[0] !== "H-06") throw new Error(`expected H-06 first for advanced grammar, got ${gAdv.join(",")}`);
  assertEq("H-06 wins copy", r("hebrew", "H-06", "grammar", "g6", "action"), H06_GR.g5_g6.actionTextHe);

  const wBasic = orderHebrewTaxonomyCandidates(
    ["H-03", "H-07"],
    [{ kind: "spelling", params: { sentence_writing: true } }],
    { bucketKey: "writing" }
  );
  if (wBasic[0] !== "H-03") throw new Error(`expected H-03 first for basic writing, got ${wBasic.join(",")}`);
  assertEq("H-03 wins copy", r("hebrew", "H-03", "writing", "g4", "action"), H03_WR.g3_g4.actionTextHe);

  const wHi = orderHebrewTaxonomyCandidates(
    ["H-03", "H-07"],
    [{ patternFamily: "text_structure", params: { cohesion: true } }],
    { bucketKey: "writing" }
  );
  if (wHi[0] !== "H-07") throw new Error(`expected H-07 first for higher writing, got ${wHi.join(",")}`);
    assertEq("H-07 wins copy", r("hebrew", "H-07", "writing", "g6", "nextGoal"), H07_WR.g5_g6.goalTextHe);

  assertEq("H-01 vocab still", r("hebrew", "H-01", "vocabulary", "g4", "action"), H01_VOC.g3_g4.actionTextHe);

  const tie = orderHebrewTaxonomyCandidates(
    ["H-02", "H-06"],
    [{ kind: "grammar_basic" }, { params: { kind: "syntax" } }],
    { bucketKey: "grammar" }
  );
  if (tie[0] !== "H-02" || tie[1] !== "H-06") throw new Error(`tie should preserve bridge order, got ${tie.join(",")}`);
  if (!r("hebrew", "H-02", "grammar", "g4", "action")) throw new Error("ambiguous tie: resolver should still return H-02 grammar g4");
}

// —— 7. Feature behavior ——
delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;
assertNull("unknown grade g9", r("hebrew", "H-02", "grammar", "g9", "action"));
assertNull("null grade", r("hebrew", "H-02", "grammar", null, "action"));
assertNull("H-02 wrong bucket vocabulary", r("hebrew", "H-02", "vocabulary", "g4", "action"));
assertNull("H-01 wrong bucket grammar", r("hebrew", "H-01", "grammar", "g4", "action"));

// —— 8. Detailed + short + truth-packet scan (H-02 grammar g4) ——
function rowHebrew(topicRowKey, bucketKey, gradeKey) {
  return {
    bucketKey,
    displayName: "עברית",
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

function buildHebrewUnit(taxonomyId, bucketKey, topicRowKey) {
  return {
    blueprintRef: "test",
    engineVersion: "v2",
    unitKey: `hebrew::${topicRowKey}`,
    subjectId: "hebrew",
    topicRowKey,
    bucketKey,
    displayName: "עברית",
    diagnosis: { allowed: true, taxonomyId, lineHe: "מצביע על דפוס." },
    intervention: {
      immediateActionHe: "פעולה",
      shortPracticeHe: "תרגול",
      taxonomyId,
    },
    taxonomy: {
      id: taxonomyId,
      patternHe: "דפוס לבדיקת מערכת",
      topicHe: "עברית",
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
    probe: { specificationHe: "בדיקה", objectiveHe: "בדיקה" },
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
  scienceQuestions: 0,
  scienceCorrect: 0,
  scienceAccuracy: 0,
  hebrewQuestions: 12,
  hebrewCorrect: 8,
  hebrewAccuracy: 67,
  moledetGeographyQuestions: 0,
  moledetGeographyCorrect: 0,
  moledetGeographyAccuracy: 0,
};

function mkBase(taxonomyId, bucket, gradeKey) {
  const trk = `${bucket}${SEP}learning${SEP}${gradeKey}${SEP}easy`;
  return {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: summaryFixture,
    hebrewTopics: { [trk]: rowHebrew(trk, bucket, gradeKey) },
    diagnosticEngineV2: { units: [buildHebrewUnit(taxonomyId, bucket, trk)] },
  };
}

const bH02 = mkBase("H-02", "grammar", "g4");
const dH02 = buildDetailedParentReportFromBaseReport(bH02, { period: "week" });
const mpH02 = dH02?.subjectProfiles?.find((p) => p.subject === "hebrew");
assertEq("detailed H-02 grammar g4 parentAction", mpH02?.parentActionHe, H02_GR.g3_g4.actionTextHe);
assertNoForbidden("detailed H-02 grammar", mpH02?.parentActionHe);
const trkG = `grammar${SEP}learning${SEP}g4${SEP}easy`;
const tpH02 = buildTruthPacketV1(dH02, { scopeType: "topic", scopeId: trkG, scopeLabel: "דקדוק" });
assertNoForbidden("truth H-02 grammar", JSON.stringify(tpH02?.narrative?.textSlots || {}));

const uH02 = bH02.diagnosticEngineV2.units[0];
const sh = summarizeV2UnitsForSubjectForTests(bH02.diagnosticEngineV2.units, {
  subjectReportQuestions: 12,
  subjectLabelHe: "עברית",
  topicMap: bH02.hebrewTopics,
  reportTotalQuestions: 20,
});
assertEq("short H-02 grammar", sh.parentActionHe, r("hebrew", "H-02", "grammar", "g4", "action"));
assertNoForbidden("short H-02 grammar", sh.parentActionHe);

const resolvedBlob = [
  r("hebrew", "H-01", "vocabulary", "g4", "action"),
  r("hebrew", "H-01", "mixed", "g5", "nextGoal"),
  r("hebrew", "H-02", "grammar", "g5", "action"),
  r("hebrew", "H-03", "writing", "g4", "nextGoal"),
  r("hebrew", "H-06", "grammar", "g4", "nextGoal"),
  r("hebrew", "H-07", "writing", "g5", "action"),
].join("\n");
assertNoForbidden("resolver batch H-01..H-07", resolvedBlob);

process.stdout.write("parent-report-grade-aware-phase4c3-hebrew-h01030607-verify: ok\n");
