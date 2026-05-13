/**
 * Phase 5-C1 — moledet-geography MG-03 (citizenship) + MG-07 (community) bucketOverrides.
 * Report / bridge subjectId is **moledet-geography** (same as taxonomy rows and REPORT_MAP_KEY); no separate "moledet" alias.
 *   npx tsx scripts/parent-report-grade-aware-phase5c1-moledet-mg03-mg07-verify.mjs
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

const MG = GRADE_AWARE_RECOMMENDATION_TEMPLATES["moledet-geography"];
const MG03 = MG["MG-03"].bucketOverrides.citizenship;
const MG07 = MG["MG-07"].bucketOverrides.community;
const S02 = GRADE_AWARE_RECOMMENDATION_TEMPLATES.science["S-02"].bucketOverrides.experiments;
const SEP = "\u0001";

/** Raw MG-03/MG-07 taxonomy strings — must not appear in resolved parent-facing Hebrew. */
const BANNED = [
  "מיון שגוי חוזר",
  "שני תרחישים",
  "מיון לטבלה",
  "מסגרת חוקית",
  "ערכים",
  "בלבול תפקידים",
  "התאמת תפקיד למוסד",
  "טבלת מוסד–תפקיד",
  "מבנה ידע",
  "בעיה חברתית",
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

const sid = "moledet-geography";

// —— MG-03 citizenship ——
assertNull("MG-03 citizenship g1 action", r(sid, "MG-03", "citizenship", "g1", "action"));
assertEq("MG-03 citizenship g4 action", r(sid, "MG-03", "citizenship", "g4", "action"), MG03.g3_g4.actionTextHe);
assertEq("MG-03 citizenship g4 goal", r(sid, "MG-03", "citizenship", "g4", "nextGoal"), MG03.g3_g4.goalTextHe);
assertEq("MG-03 citizenship g6 action", r(sid, "MG-03", "citizenship", "g6", "action"), MG03.g5_g6.actionTextHe);
assertEq("MG-03 citizenship g6 goal", r(sid, "MG-03", "citizenship", "g6", "nextGoal"), MG03.g5_g6.goalTextHe);
assertNe("MG-03 citizenship g4", r(sid, "MG-03", "citizenship", "g4", "action"), r(sid, "MG-03", "citizenship", "g4", "nextGoal"));
assertEq("MG-03 CITIZENSHIP uppercase", r(sid, "MG-03", "CITIZENSHIP", "g4", "action"), MG03.g3_g4.actionTextHe);

// —— MG-07 community ——
assertNull("MG-07 community g2 goal", r(sid, "MG-07", "community", "g2", "nextGoal"));
assertEq("MG-07 community g4 action", r(sid, "MG-07", "community", "g4", "action"), MG07.g3_g4.actionTextHe);
assertEq("MG-07 community g4 goal", r(sid, "MG-07", "community", "g4", "nextGoal"), MG07.g3_g4.goalTextHe);
assertEq("MG-07 community g6 action", r(sid, "MG-07", "community", "g6", "action"), MG07.g5_g6.actionTextHe);
assertEq("MG-07 community g6 goal", r(sid, "MG-07", "community", "g6", "nextGoal"), MG07.g5_g6.goalTextHe);
assertNe("MG-07 community g4", r(sid, "MG-07", "community", "g4", "action"), r(sid, "MG-07", "community", "g4", "nextGoal"));
assertEq("MG-07 COMMUNITY uppercase", r(sid, "MG-07", "COMMUNITY", "g6", "nextGoal"), MG07.g5_g6.goalTextHe);

// —— Fallback + science regression ——
assertNull("MG-03 wrong bucket maps g4", r(sid, "MG-03", "maps", "g4", "action"));
assertNull("MG-07 unknown grade g9", r(sid, "MG-07", "community", "g9", "action"));
assertEq("S-02 experiments g4 unchanged", r("science", "S-02", "experiments", "g4", "action"), S02.g3_g4.actionTextHe);

delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

const resolvedBlob = [
  r(sid, "MG-03", "citizenship", "g4", "action"),
  r(sid, "MG-03", "citizenship", "g4", "nextGoal"),
  r(sid, "MG-03", "citizenship", "g6", "action"),
  r(sid, "MG-03", "citizenship", "g6", "nextGoal"),
  r(sid, "MG-07", "community", "g4", "action"),
  r(sid, "MG-07", "community", "g4", "nextGoal"),
  r(sid, "MG-07", "community", "g6", "action"),
  r(sid, "MG-07", "community", "g6", "nextGoal"),
].join("\n");
assertNoBanned("resolver MG-03/MG-07 outputs", resolvedBlob);

const summaryFixture = {
  totalQuestions: 24,
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
  hebrewQuestions: 0,
  hebrewCorrect: 0,
  hebrewAccuracy: 0,
  moledetGeographyQuestions: 12,
  moledetGeographyCorrect: 8,
  moledetGeographyAccuracy: 67,
};

function rowMoledet(topicRowKey, bucketKey, gradeKey) {
  return {
    bucketKey,
    displayName: "מולדת וגאוגרפיה",
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

function buildUnit(taxonomyId, bucketKey, gradeKey) {
  const trk = `${bucketKey}${SEP}learning${SEP}${gradeKey}${SEP}easy`;
  const isMg03 = taxonomyId === "MG-03";
  return {
    blueprintRef: "test",
    engineVersion: "v2",
    unitKey: `moledet-geography::${trk}`,
    subjectId: "moledet-geography",
    topicRowKey: trk,
    bucketKey,
    displayName: "מולדת וגאוגרפיה",
    diagnosis: { allowed: true, taxonomyId, lineHe: "מצביע על דפוס." },
    intervention: {
      immediateActionHe: isMg03 ? "מיון לטבלה" : "טבלת מוסד–תפקיד",
      shortPracticeHe: isMg03 ? "שני תרחישים" : "התאמת תפקיד למוסד",
      taxonomyId,
    },
    taxonomy: {
      id: taxonomyId,
      patternHe: isMg03 ? "מיון שגוי חוזר" : "בלבול תפקידים",
      topicHe: isMg03 ? "אזרחות" : "מוסדות",
      subskillHe: isMg03 ? "זכות/חובה" : "תפקיד מוסד",
      rootsHe: isMg03 ? ["מסגרת חוקית"] : ["מבנה ידע"],
      competitorsHe: isMg03 ? ["זיכרון"] : ["שמות"],
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
      specificationHe: "תרגול מודרך",
      objectiveHe: "מעקב אחרי דפוס",
    },
    explainability: { whyNotStrongerConclusionHe: [], cannotConcludeYetHe: [] },
    canonicalState: {
      actionState: "intervene",
      recommendation: { allowed: false, family: "remedial" },
      assessment: { readiness: "ready", confidenceLevel: "moderate", cannotConcludeYet: false },
      evidence: { positiveAuthorityLevel: "none" },
      topicStateId: `ts_${taxonomyId}_${bucketKey}`,
      stateHash: "mg5c1",
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
    moledetGeographyTopics: { [trk]: rowMoledet(trk, bucket, gradeKey) },
    diagnosticEngineV2: { units: [buildUnit(taxonomyId, bucket, gradeKey)] },
  };
}

const trk03 = `citizenship${SEP}learning${SEP}g4${SEP}easy`;
const d03 = buildDetailedParentReportFromBaseReport(mkBase("MG-03", "citizenship", "g4"), { period: "week" });
const mp03 = d03?.subjectProfiles?.find((p) => p.subject === "moledet-geography");
assertEq("detailed MG-03 citizenship g4", mp03?.parentActionHe, MG03.g3_g4.actionTextHe);
assertNoBanned("detailed MG-03 citizenship g4", mp03?.parentActionHe);
const tp03 = buildTruthPacketV1(d03, { scopeType: "topic", scopeId: trk03, scopeLabel: "אזרחות" });
assertNoBanned("truth MG-03 citizenship g4", JSON.stringify(tp03?.narrative?.textSlots || {}));

const trk03g6 = `citizenship${SEP}learning${SEP}g6${SEP}easy`;
const d03g6 = buildDetailedParentReportFromBaseReport(mkBase("MG-03", "citizenship", "g6"), { period: "week" });
const mp03g6 = d03g6?.subjectProfiles?.find((p) => p.subject === "moledet-geography");
assertEq("detailed MG-03 citizenship g6 goal", mp03g6?.nextWeekGoalHe, MG03.g5_g6.goalTextHe);
assertNoBanned("detailed MG-03 citizenship g6", `${mp03g6?.parentActionHe}\n${mp03g6?.nextWeekGoalHe}`);

const trk07 = `community${SEP}learning${SEP}g4${SEP}easy`;
const d07 = buildDetailedParentReportFromBaseReport(mkBase("MG-07", "community", "g4"), { period: "week" });
const mp07 = d07?.subjectProfiles?.find((p) => p.subject === "moledet-geography");
assertEq("detailed MG-07 community g4", mp07?.parentActionHe, MG07.g3_g4.actionTextHe);
assertNoBanned("detailed MG-07 community g4", mp07?.parentActionHe);

const trk07g6 = `community${SEP}learning${SEP}g6${SEP}easy`;
const d07g6 = buildDetailedParentReportFromBaseReport(mkBase("MG-07", "community", "g6"), { period: "week" });
const mp07g6 = d07g6?.subjectProfiles?.find((p) => p.subject === "moledet-geography");
assertEq("detailed MG-07 community g6 action", mp07g6?.parentActionHe, MG07.g5_g6.actionTextHe);
assertNoBanned("detailed MG-07 community g6", mp07g6?.parentActionHe);
const tp07g6 = buildTruthPacketV1(d07g6, { scopeType: "topic", scopeId: trk07g6, scopeLabel: "קהילה" });
assertNoBanned("truth MG-07 community g6", JSON.stringify(tp07g6?.narrative?.textSlots || {}));

const b07 = mkBase("MG-07", "community", "g4");
const u07 = b07.diagnosticEngineV2.units[0];
const sh = summarizeV2UnitsForSubjectForTests(b07.diagnosticEngineV2.units, {
  subjectReportQuestions: 12,
  subjectLabelHe: "מולדת וגאוגרפיה",
  topicMap: b07.moledetGeographyTopics,
  reportTotalQuestions: 24,
});
assertEq("short MG-07 community g4", sh.parentActionHe, resolveUnitParentActionHe(u07, "g4"));
assertNoBanned("short MG-07 community g4", sh.parentActionHe);

process.stdout.write("parent-report-grade-aware-phase5c1-moledet-mg03-mg07-verify: ok\n");
