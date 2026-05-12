/**
 * Phase 4-B1 — Hebrew H-04 (reading, comprehension) + H-08 (speaking) bucketOverrides.
 *   npx tsx scripts/parent-report-grade-aware-phase4b1-hebrew-h04-h08-verify.mjs
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

const HE = GRADE_AWARE_RECOMMENDATION_TEMPLATES.hebrew;
const H04_READ = HE["H-04"].bucketOverrides.reading;
const H04_CMP = HE["H-04"].bucketOverrides.comprehension;
const H08_SPK = HE["H-08"].bucketOverrides.speaking;
const SEP = "\u0001";

const BANNED = [
  "טעות כשעובדה לא בסדר קריאה",
  "עם/בלי כותרות",
  "חיפוש עם סימון",
  "אסטרטגיית חיפוש",
  "רגיסטר",
  "זוג פורמלי",
  "כלל מיני",
  "פרגמטיקה",
  "מורה חברתי",
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

// —— Resolver: H-04 reading ——
assertNull("H-04 reading g1 action", r("hebrew", "H-04", "reading", "g1", "action"));
assertNull("H-04 reading g2 goal", r("hebrew", "H-04", "reading", "g2", "nextGoal"));
assertEq("H-04 reading g3 action", r("hebrew", "H-04", "reading", "g3", "action"), H04_READ.g3_g4.actionTextHe);
assertEq("H-04 reading g3 goal", r("hebrew", "H-04", "reading", "g3", "nextGoal"), H04_READ.g3_g4.goalTextHe);
assertEq("H-04 reading g4 action", r("hebrew", "H-04", "reading", "g4", "action"), H04_READ.g3_g4.actionTextHe);
assertEq("H-04 reading g6 goal", r("hebrew", "H-04", "reading", "g6", "nextGoal"), H04_READ.g5_g6.goalTextHe);
assertNe("H-04 reading g4", r("hebrew", "H-04", "reading", "g4", "action"), r("hebrew", "H-04", "reading", "g4", "nextGoal"));
assertEq("H-04 READING uppercase bucket", r("hebrew", "H-04", "READING", "g4", "action"), H04_READ.g3_g4.actionTextHe);

// —— Resolver: H-04 comprehension ——
assertNull("H-04 comprehension g1", r("hebrew", "H-04", "comprehension", "g1", "action"));
assertEq("H-04 comprehension g4 action", r("hebrew", "H-04", "comprehension", "g4", "action"), H04_CMP.g3_g4.actionTextHe);
assertEq("H-04 comprehension g5 goal", r("hebrew", "H-04", "comprehension", "g5", "nextGoal"), H04_CMP.g5_g6.goalTextHe);
assertNe("H-04 comprehension g5", r("hebrew", "H-04", "comprehension", "g5", "action"), r("hebrew", "H-04", "comprehension", "g5", "nextGoal"));

// —— Resolver: H-08 speaking ——
assertNull("H-08 speaking g1", r("hebrew", "H-08", "speaking", "g1", "action"));
assertNull("H-08 speaking g3", r("hebrew", "H-08", "speaking", "g3", "action"));
assertNull("H-08 speaking g4 goal", r("hebrew", "H-08", "speaking", "g4", "nextGoal"));
assertEq("H-08 speaking g5 action", r("hebrew", "H-08", "speaking", "g5", "action"), H08_SPK.g5_g6.actionTextHe);
assertEq("H-08 speaking g6 goal", r("hebrew", "H-08", "speaking", "g6", "nextGoal"), H08_SPK.g5_g6.goalTextHe);
assertNe("H-08 speaking g6", r("hebrew", "H-08", "speaking", "g6", "action"), r("hebrew", "H-08", "speaking", "g6", "nextGoal"));

// —— Feature behavior ——
assertNull("unknown grade g9", r("hebrew", "H-04", "reading", "g9", "action"));
assertNull("null grade", r("hebrew", "H-04", "reading", null, "action"));
assertNull("H-04 unknown bucket vocabulary", r("hebrew", "H-04", "vocabulary", "g4", "action"));
assertNull("H-08 unknown bucket reading", r("hebrew", "H-08", "reading", "g6", "action"));

delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

// —— Banned phrases on resolved template strings ——
const resolvedBlob = [
  r("hebrew", "H-04", "reading", "g4", "action"),
  r("hebrew", "H-04", "reading", "g4", "nextGoal"),
  r("hebrew", "H-04", "reading", "g6", "action"),
  r("hebrew", "H-04", "comprehension", "g5", "action"),
  r("hebrew", "H-04", "comprehension", "g5", "nextGoal"),
  r("hebrew", "H-08", "speaking", "g6", "action"),
  r("hebrew", "H-08", "speaking", "g6", "nextGoal"),
].join("\n");
assertNoBanned("resolver outputs", resolvedBlob);

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
  const isH08 = taxonomyId === "H-08";
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
      immediateActionHe: isH08 ? "רגיסטר שגוי חוזר" : "טעות כשעובדה לא בסדר קריאה",
      shortPracticeHe: isH08 ? "זוג פורמלי" : "עם/בלי כותרות",
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
    probe: {
      specificationHe: isH08 ? "כלל מיני + דוגמאות" : "חיפוש עם סימון",
      objectiveHe: isH08 ? "פרגמטיקה" : "אסטרטגיית חיפוש",
    },
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

// H-04 reading g4
const bRead = mkBase("H-04", "reading", "g4");
const dRead = buildDetailedParentReportFromBaseReport(bRead, { period: "week" });
const mpRead = dRead?.subjectProfiles?.find((p) => p.subject === "hebrew");
assertEq("detailed H-04 reading g4 parentAction", mpRead?.parentActionHe, H04_READ.g3_g4.actionTextHe);
assertNoBanned("detailed H-04 reading", mpRead?.parentActionHe);
const tpRead = buildTruthPacketV1(dRead, {
  scopeType: "topic",
  scopeId: `reading${SEP}learning${SEP}g4${SEP}easy`,
  scopeLabel: "קריאה",
});
assertNoBanned("truth H-04 reading", JSON.stringify(tpRead?.narrative?.textSlots || {}));

// H-04 comprehension g5
const bCmp = mkBase("H-04", "comprehension", "g5");
const dCmp = buildDetailedParentReportFromBaseReport(bCmp, { period: "week" });
const mpCmp = dCmp?.subjectProfiles?.find((p) => p.subject === "hebrew");
assertEq("detailed H-04 comprehension g5 parentAction", mpCmp?.parentActionHe, H04_CMP.g5_g6.actionTextHe);
assertNoBanned("detailed H-04 comprehension", mpCmp?.parentActionHe);
const trkCmp = `comprehension${SEP}learning${SEP}g5${SEP}easy`;
const tpCmp = buildTruthPacketV1(dCmp, { scopeType: "topic", scopeId: trkCmp, scopeLabel: "הבנה" });
assertNoBanned("truth H-04 comprehension", JSON.stringify(tpCmp?.narrative?.textSlots || {}));

// H-08 speaking g6
const bSpk = mkBase("H-08", "speaking", "g6");
const dSpk = buildDetailedParentReportFromBaseReport(bSpk, { period: "week" });
const mpSpk = dSpk?.subjectProfiles?.find((p) => p.subject === "hebrew");
assertEq("detailed H-08 speaking g6 parentAction", mpSpk?.parentActionHe, H08_SPK.g5_g6.actionTextHe);
assertNoBanned("detailed H-08 speaking", mpSpk?.parentActionHe);
const trkSpk = `speaking${SEP}learning${SEP}g6${SEP}easy`;
const tpSpk = buildTruthPacketV1(dSpk, { scopeType: "topic", scopeId: trkSpk, scopeLabel: "דיבור" });
assertNoBanned("truth H-08 speaking", JSON.stringify(tpSpk?.narrative?.textSlots || {}));

const uSpk = bSpk.diagnosticEngineV2.units[0];
const sh = summarizeV2UnitsForSubjectForTests(bSpk.diagnosticEngineV2.units, {
  subjectReportQuestions: 12,
  subjectLabelHe: "עברית",
  topicMap: bSpk.hebrewTopics,
  reportTotalQuestions: 20,
});
assertEq("short H-08", sh.parentActionHe, resolveUnitParentActionHe(uSpk, "g6"));
assertNoBanned("short H-08", sh.parentActionHe);

process.stdout.write("parent-report-grade-aware-phase4b1-hebrew-h04-h08-verify: ok\n");
