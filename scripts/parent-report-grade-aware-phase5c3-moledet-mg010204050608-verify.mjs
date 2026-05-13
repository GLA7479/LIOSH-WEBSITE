/**
 * Phase 5-C3 — moledet-geography MG-01, MG-02, MG-04, MG-05, MG-06, MG-08 bucketOverrides + routing smoke.
 *   npx tsx scripts/parent-report-grade-aware-phase5c3-moledet-mg010204050608-verify.mjs
 */

const { orderMoledetTaxonomyCandidates } = await import(
  new URL("../utils/diagnostic-engine-v2/moledet-taxonomy-candidate-order.js", import.meta.url).href
);

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

const BANNED = [
  "מרחקים יחסיים שגויים",
  "סרגל + יחידות",
  "בלבול כשהמפה מוטה",
  "סיבוב מפה",
  "סדר הפוך",
  "ציר פיזי + כרטיסיות",
  "אזור שגוי חוזר",
  "תרגול מפתח",
  "סיבה שגויה חוזרת",
  "שני הסברים מנוגדים",
  "שאלת מאין ידוע",
  "דעות קדומות",
  "מורה חברתי",
  "סימול שגוי חוזר",
  "סימבולים בקבוצות קטנות",
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

// —— MG-01 maps / geography / mixed ——
const m01m = MG["MG-01"].bucketOverrides.maps;
const m01g = MG["MG-01"].bucketOverrides.geography;
const m01x = MG["MG-01"].bucketOverrides.mixed;
assertNull("MG-01 maps g1 action", r(sid, "MG-01", "maps", "g1", "action"));
assertEq("MG-01 maps g4 action", r(sid, "MG-01", "maps", "g4", "action"), m01m.g3_g4.actionTextHe);
assertEq("MG-01 maps g4 goal", r(sid, "MG-01", "maps", "g4", "nextGoal"), m01m.g3_g4.goalTextHe);
assertNe("MG-01 maps g4", r(sid, "MG-01", "maps", "g4", "action"), r(sid, "MG-01", "maps", "g4", "nextGoal"));
assertEq("MG-01 maps g6 action", r(sid, "MG-01", "maps", "g6", "action"), m01m.g5_g6.actionTextHe);
assertEq("MG-01 geography g4 action", r(sid, "MG-01", "geography", "g4", "action"), m01g.g3_g4.actionTextHe);
assertEq("MG-01 geography g6 goal", r(sid, "MG-01", "geography", "g6", "nextGoal"), m01g.g5_g6.goalTextHe);
assertNe("MG-01 geography g6", r(sid, "MG-01", "geography", "g6", "action"), r(sid, "MG-01", "geography", "g6", "nextGoal"));
assertEq("MG-01 mixed g4 goal", r(sid, "MG-01", "mixed", "g4", "nextGoal"), m01x.g3_g4.goalTextHe);
assertEq("MG-01 MAPS uppercase", r(sid, "MG-01", "MAPS", "g4", "action"), m01m.g3_g4.actionTextHe);

// —— MG-02 maps / geography ——
const m02m = MG["MG-02"].bucketOverrides.maps;
const m02g = MG["MG-02"].bucketOverrides.geography;
assertNull("MG-02 maps g2 goal", r(sid, "MG-02", "maps", "g2", "nextGoal"));
assertEq("MG-02 maps g4 action", r(sid, "MG-02", "maps", "g4", "action"), m02m.g3_g4.actionTextHe);
assertEq("MG-02 maps g6 goal", r(sid, "MG-02", "maps", "g6", "nextGoal"), m02m.g5_g6.goalTextHe);
assertEq("MG-02 geography g4 goal", r(sid, "MG-02", "geography", "g4", "nextGoal"), m02g.g3_g4.goalTextHe);
assertEq("MG-02 geography g6 action", r(sid, "MG-02", "geography", "g6", "action"), m02g.g5_g6.actionTextHe);

// —— MG-04 homeland ——
const m04 = MG["MG-04"].bucketOverrides.homeland;
assertNull("MG-04 homeland g1 goal", r(sid, "MG-04", "homeland", "g1", "nextGoal"));
assertEq("MG-04 homeland g4 action", r(sid, "MG-04", "homeland", "g4", "action"), m04.g3_g4.actionTextHe);
assertEq("MG-04 homeland g6 goal", r(sid, "MG-04", "homeland", "g6", "nextGoal"), m04.g5_g6.goalTextHe);

// —— MG-05 geography g6 ——
const m05 = MG["MG-05"].bucketOverrides.geography;
assertEq("MG-05 geography g6 action", r(sid, "MG-05", "geography", "g6", "action"), m05.g5_g6.actionTextHe);
assertEq("MG-05 geography g6 goal", r(sid, "MG-05", "geography", "g6", "nextGoal"), m05.g5_g6.goalTextHe);

// —— MG-06 homeland / values ——
const m06h = MG["MG-06"].bucketOverrides.homeland;
const m06v = MG["MG-06"].bucketOverrides.values;
assertEq("MG-06 homeland g6 action", r(sid, "MG-06", "homeland", "g6", "action"), m06h.g5_g6.actionTextHe);
assertEq("MG-06 values g6 goal", r(sid, "MG-06", "values", "g6", "nextGoal"), m06v.g5_g6.goalTextHe);
assertEq("MG-06 VALUES uppercase", r(sid, "MG-06", "VALUES", "g4", "action"), m06v.g3_g4.actionTextHe);

// —— MG-08 maps ——
const m08 = MG["MG-08"].bucketOverrides.maps;
assertEq("MG-08 maps g4 action", r(sid, "MG-08", "maps", "g4", "action"), m08.g3_g4.actionTextHe);
assertEq("MG-08 maps g6 goal", r(sid, "MG-08", "maps", "g6", "nextGoal"), m08.g5_g6.goalTextHe);

// —— MG-03/MG-07 unchanged ——
assertEq("MG-03 citizenship g4", r(sid, "MG-03", "citizenship", "g4", "action"), MG03.g3_g4.actionTextHe);
assertEq("MG-07 community g4 goal", r(sid, "MG-07", "community", "g4", "nextGoal"), MG07.g3_g4.goalTextHe);

// —— Fallbacks ——
assertNull("MG-01 wrong bucket citizenship", r(sid, "MG-01", "citizenship", "g4", "action"));
assertNull("MG-05 unknown grade g9", r(sid, "MG-05", "geography", "g9", "action"));
assertEq("S-02 experiments g4 unchanged", r("science", "S-02", "experiments", "g4", "action"), S02.g3_g4.actionTextHe);

delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

// —— Routing + first candidate template (7) ——
const row = { gradeKey: "g4", levelKey: "easy" };
const mapsBridge = ["MG-01", "MG-02", "MG-08"];
const geoBridge = ["MG-01", "MG-02", "MG-05"];
const homeBridge = ["MG-04", "MG-06"];

const oMapsScale = orderMoledetTaxonomyCandidates(
  [...mapsBridge],
  [{ patternFamily: "map_scale", topicOrOperation: "measuring_distance" }],
  { bucketKey: "maps", row }
);
assertEq("routing maps scale first", oMapsScale[0], "MG-01");
assertEq("routing+tpl MG-01 maps g4", r(sid, "MG-01", "maps", "g4", "action"), m01m.g3_g4.actionTextHe);

const oMapsNorth = orderMoledetTaxonomyCandidates(
  [...mapsBridge],
  [{ kind: "compass", params: { north: true, orientation: "rotated_map" } }],
  { bucketKey: "maps", row }
);
assertEq("routing maps north first", oMapsNorth[0], "MG-02");
assertEq("routing+tpl MG-02 maps g4 action", r(sid, "MG-02", "maps", "g4", "action"), m02m.g3_g4.actionTextHe);

const oMapsSym = orderMoledetTaxonomyCandidates(
  [...mapsBridge],
  [{ params: { legend: true, map_key: true, symbols: true } }],
  { bucketKey: "maps", row }
);
assertEq("routing maps legend first", oMapsSym[0], "MG-08");
assertEq("routing+tpl MG-08 maps g4", r(sid, "MG-08", "maps", "g4", "action"), m08.g3_g4.actionTextHe);

const oGeoClimate = orderMoledetTaxonomyCandidates(
  [...geoBridge],
  [{ conceptTag: "climate_zone", params: { climate_map: true, color_key: true } }],
  { bucketKey: "geography", row }
);
assertEq("routing geo climate first", oGeoClimate[0], "MG-05");
assertEq("routing+tpl MG-05 geo g6", r(sid, "MG-05", "geography", "g6", "nextGoal"), m05.g5_g6.goalTextHe);

const oHomeTime = orderMoledetTaxonomyCandidates(
  [...homeBridge],
  [{ kind: "chronology", params: { timeline: true, dates: "2020-01-01" } }],
  { bucketKey: "homeland", row }
);
assertEq("routing homeland timeline first", oHomeTime[0], "MG-04");
assertEq("routing+tpl MG-04 homeland g4", r(sid, "MG-04", "homeland", "g4", "action"), m04.g3_g4.actionTextHe);

const oHomeCause = orderMoledetTaxonomyCandidates(
  [...homeBridge],
  [{ params: { population: true, cause_effect: true, explanation: "x" } }],
  { bucketKey: "homeland", row }
);
assertEq("routing homeland cause first", oHomeCause[0], "MG-06");
assertEq("routing+tpl MG-06 homeland g6", r(sid, "MG-06", "homeland", "g6", "action"), m06h.g5_g6.actionTextHe);

const amb = orderMoledetTaxonomyCandidates([...mapsBridge], [], { bucketKey: "maps" });
assertEq("routing maps ambiguous bridge0", amb[0], mapsBridge[0]);

const resolvedBlob = [
  m01m.g3_g4.actionTextHe,
  m01m.g3_g4.goalTextHe,
  m02m.g3_g4.actionTextHe,
  m04.g3_g4.actionTextHe,
  m05.g5_g6.actionTextHe,
  m05.g5_g6.goalTextHe,
  m06h.g5_g6.actionTextHe,
  m06v.g5_g6.goalTextHe,
  m08.g3_g4.actionTextHe,
  m08.g5_g6.goalTextHe,
].join("\n");
assertNoBanned("resolver MG-01/02/04/05/06/08 bundle", resolvedBlob);

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
      immediateActionHe: "המשך לתרגל לפי הנחיות",
      shortPracticeHe: "תרגול מובנה",
      taxonomyId,
    },
    taxonomy: {
      id: taxonomyId,
      patternHe: "דפוס בתרגול",
      topicHe: "נושא כללי",
      subskillHe: "מיומנות",
      rootsHe: ["בסיס"],
      competitorsHe: ["אחר"],
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
      stateHash: "mg5c3",
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

const trk01 = `maps${SEP}learning${SEP}g4${SEP}easy`;
const d01 = buildDetailedParentReportFromBaseReport(mkBase("MG-01", "maps", "g4"), { period: "week" });
const mp01 = d01?.subjectProfiles?.find((p) => p.subject === "moledet-geography");
assertEq("detailed MG-01 maps g4", mp01?.parentActionHe, m01m.g3_g4.actionTextHe);
assertNoBanned("detailed MG-01 maps g4", mp01?.parentActionHe);
const tp01 = buildTruthPacketV1(d01, { scopeType: "topic", scopeId: trk01, scopeLabel: "מפות" });
assertNoBanned("truth MG-01 maps g4", JSON.stringify(tp01?.narrative?.textSlots || {}));

const trk05g6 = `geography${SEP}learning${SEP}g6${SEP}easy`;
const d05 = buildDetailedParentReportFromBaseReport(mkBase("MG-05", "geography", "g6"), { period: "week" });
const mp05 = d05?.subjectProfiles?.find((p) => p.subject === "moledet-geography");
assertEq("detailed MG-05 geography g6 goal", mp05?.nextWeekGoalHe, m05.g5_g6.goalTextHe);
assertNoBanned("detailed MG-05 geography g6", `${mp05?.parentActionHe}\n${mp05?.nextWeekGoalHe}`);
const tp05 = buildTruthPacketV1(d05, { scopeType: "topic", scopeId: trk05g6, scopeLabel: "גאוגרפיה" });
assertNoBanned("truth MG-05 geography g6", JSON.stringify(tp05?.narrative?.textSlots || {}));

const trk06v = `values${SEP}learning${SEP}g6${SEP}easy`;
const d06v = buildDetailedParentReportFromBaseReport(mkBase("MG-06", "values", "g6"), { period: "week" });
const mp06v = d06v?.subjectProfiles?.find((p) => p.subject === "moledet-geography");
assertEq("detailed MG-06 values g6 action", mp06v?.parentActionHe, m06v.g5_g6.actionTextHe);
assertNoBanned("detailed MG-06 values g6", mp06v?.parentActionHe);
const tp06v = buildTruthPacketV1(d06v, { scopeType: "topic", scopeId: trk06v, scopeLabel: "חברה וקהילה" });
assertNoBanned("truth MG-06 values g6", JSON.stringify(tp06v?.narrative?.textSlots || {}));

const b08 = mkBase("MG-08", "maps", "g4");
const u08 = b08.diagnosticEngineV2.units[0];
const sh08 = summarizeV2UnitsForSubjectForTests(b08.diagnosticEngineV2.units, {
  subjectReportQuestions: 12,
  subjectLabelHe: "מולדת וגאוגרפיה",
  topicMap: b08.moledetGeographyTopics,
  reportTotalQuestions: 24,
});
assertEq("short MG-08 maps g4", sh08.parentActionHe, resolveUnitParentActionHe(u08, "g4"));
assertNoBanned("short MG-08 maps g4", sh08.parentActionHe);

process.stdout.write("parent-report-grade-aware-phase5c3-moledet-mg010204050608-verify: ok\n");
