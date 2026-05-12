/**
 * Phase 3-B1 — Geometry templates Batch A (G-02, G-04, G-05, G-06, G-07 bucketOverrides only).
 *   npx tsx scripts/parent-report-grade-aware-geometry-batch-a-verify.mjs
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
const { resolveUnitNextGoalHe, resolveUnitParentActionHe } = recMod;
const GRADE_AWARE_RECOMMENDATION_TEMPLATES = templatesMod.GRADE_AWARE_RECOMMENDATION_TEMPLATES;
const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = v2Mod;
const { buildTruthPacketV1 } = truthMod;

const SEP = "\u0001";
const G = GRADE_AWARE_RECOMMENDATION_TEMPLATES.geometry;

const BANNED = [
  "__RAW_PROBE_GEOM__",
  "__RAW_INTERVENTION_GEOM__",
  "__PATTERN_GEOM_INTERNAL__",
  "מודרך מול עצמאי",
  "תרגול סקאלה",
  "עם/בלי ציר",
  "רשת + קודקודים",
  "עם/בלי פריסה",
  "פריסה על נייר",
  "מפתח המרה",
];

function assertEq(name, actual, expected) {
  const a = String(actual ?? "");
  const e = String(expected ?? "");
  if (a !== e) throw new Error(`${name} mismatch:\nexpected (${e.length}): ${e.slice(0, 120)}…\nactual (${a.length}): ${a.slice(0, 120)}…`);
}

function assertNull(name, v) {
  if (v != null && String(v).trim() !== "") throw new Error(`${name} expected null/empty, got: ${String(v).slice(0, 80)}`);
}

function assertNoBanned(label, blob) {
  const s = typeof blob === "string" ? blob : JSON.stringify(blob);
  for (const b of BANNED) {
    if (s.includes(b)) throw new Error(`${label} contains banned/internal phrase: ${b}`);
  }
}

function assertDifferent(name, a, b) {
  if (String(a || "") === String(b || "")) throw new Error(`${name}: action and goal must differ`);
}

function rowGeo(topicRowKey, bucketKey, gradeKey) {
  return {
    bucketKey,
    displayName: "גאומטריה",
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

function buildGeoUnit(taxonomyId, bucketKey, topicRowKey) {
  return {
    blueprintRef: "test",
    engineVersion: "v2",
    unitKey: `geometry::${topicRowKey}`,
    subjectId: "geometry",
    topicRowKey,
    bucketKey,
    displayName: "גאומטריה",
    diagnosis: { allowed: true, taxonomyId, lineHe: "מצביע על דפוס." },
    intervention: {
      immediateActionHe: "__RAW_PROBE_GEOM__",
      shortPracticeHe: "__RAW_INTERVENTION_GEOM__",
      taxonomyId,
    },
    taxonomy: {
      id: taxonomyId,
      patternHe: "__PATTERN_GEOM_INTERNAL__",
      topicHe: "גאומטריה",
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
    probe: { specificationHe: "__RAW_PROBE_GEOM__", objectiveHe: "__RAW_INTERVENTION_GEOM__" },
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

function r(subjectId, taxonomyId, bucketKey, gradeKey, slot) {
  return resolveGradeAwareParentRecommendationHe({
    subjectId,
    taxonomyId,
    bucketKey,
    gradeKey,
    slot,
  });
}

delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;

// —— Resolver matrix (G-02 angles) ——
assertNull("G-02 angles g1 action", r("geometry", "G-02", "angles", "g1", "action"));
assertNull("G-02 angles g2 goal", r("geometry", "G-02", "angles", "g2", "nextGoal"));
const angG4a = G["G-02"].bucketOverrides.angles.g3_g4.actionTextHe;
const angG4g = G["G-02"].bucketOverrides.angles.g3_g4.goalTextHe;
assertEq("G-02 angles g4 action", r("geometry", "G-02", "angles", "g4", "action"), angG4a);
assertEq("G-02 angles g4 goal", r("geometry", "G-02", "angles", "g4", "nextGoal"), angG4g);
const angG6a = G["G-02"].bucketOverrides.angles.g5_g6.actionTextHe;
assertEq("G-02 angles g6 action", r("geometry", "G-02", "angles", "g6", "action"), angG6a);

// —— G-02 circles ——
assertNull("G-02 circles g1", r("geometry", "G-02", "circles", "g2", "action"));
assertEq("G-02 circles g4 action", r("geometry", "G-02", "circles", "g4", "action"), G["G-02"].bucketOverrides.circles.g3_g4.actionTextHe);
assertEq("G-02 circles g6 action", r("geometry", "G-02", "circles", "g6", "action"), G["G-02"].bucketOverrides.circles.g5_g6.actionTextHe);

// —— Unknown bucket / grade ——
assertNull("G-02 unknown bucket", r("geometry", "G-02", "triangles", "g4", "action"));
assertNull("unknown grade", r("geometry", "G-02", "angles", "g9", "action"));
assertNull("null grade", r("geometry", "G-02", "angles", null, "action"));

// —— G-04 transformations + rotation (all bands non-null) ——
for (const bk of ["transformations", "rotation"]) {
  for (const g of ["g1", "g4", "g6"]) {
    const band = g === "g1" || g === "g2" ? "g1_g2" : g === "g3" || g === "g4" ? "g3_g4" : "g5_g6";
    const a = r("geometry", "G-04", bk, g, "action");
    const ng = r("geometry", "G-04", bk, g, "nextGoal");
    assertDifferent(`G-04 ${bk} ${g}`, a, ng);
  }
}

// —— G-05 solids + volume ——
assertEq("G-05 solids g1 action", r("geometry", "G-05", "solids", "g1", "action"), G["G-05"].bucketOverrides.solids.g1_g2.actionTextHe);
assertNull("G-05 volume g2", r("geometry", "G-05", "volume", "g2", "action"));
assertNull("G-05 volume g4", r("geometry", "G-05", "volume", "g4", "nextGoal"));
assertEq("G-05 volume g6 goal", r("geometry", "G-05", "volume", "g6", "nextGoal"), G["G-05"].bucketOverrides.volume.g5_g6.goalTextHe);

// —— G-06 perimeter ——
assertNull("G-06 perimeter g1", r("geometry", "G-06", "perimeter", "g2", "action"));
assertEq("G-06 perimeter g4", r("geometry", "G-06", "perimeter", "g4", "action"), G["G-06"].bucketOverrides.perimeter.g3_g4.actionTextHe);
assertEq("G-06 perimeter g6", r("geometry", "G-06", "perimeter", "g6", "action"), G["G-06"].bucketOverrides.perimeter.g5_g6.actionTextHe);

// —— G-07 symmetry ——
assertEq("G-07 symmetry g2 action", r("geometry", "G-07", "symmetry", "g2", "action"), G["G-07"].bucketOverrides.symmetry.g1_g2.actionTextHe);
assertEq("G-07 symmetry g4", r("geometry", "G-07", "symmetry", "g4", "nextGoal"), G["G-07"].bucketOverrides.symmetry.g3_g4.goalTextHe);
assertEq("G-07 symmetry g6", r("geometry", "G-07", "symmetry", "g6", "action"), G["G-07"].bucketOverrides.symmetry.g5_g6.actionTextHe);

// —— Detailed + short + truth packet (representative paths) ——
const mk = (taxonomyId, bucket, gradeKey) => {
  const trk = `${bucket}${SEP}learning${SEP}${gradeKey}${SEP}easy`;
  return {
    base: {
      startDate: "2026-05-01",
      endDate: "2026-05-08",
      period: "week",
      playerName: "בדיקה",
      summary: { totalQuestions: 20 },
      geometryTopics: { [trk]: rowGeo(trk, bucket, gradeKey) },
      diagnosticEngineV2: { units: [buildGeoUnit(taxonomyId, bucket, trk)] },
    },
    trk,
  };
};

const dAngles = buildDetailedParentReportFromBaseReport(mk("G-02", "angles", "g4").base, { period: "week" });
const mpAngles = dAngles?.subjectProfiles?.find((p) => p.subject === "geometry");
assertEq("detailed G-02 angles g4 action", mpAngles?.parentActionHe, angG4a);
assertEq("detailed G-02 angles g4 goal", mpAngles?.nextWeekGoalHe, angG4g);
assertNoBanned("detailed G-02 angles action", mpAngles?.parentActionHe);
const tpAng = buildTruthPacketV1(dAngles, { scopeType: "topic", scopeId: mk("G-02", "angles", "g4").trk, scopeLabel: "זוויות" });
assertNoBanned("truth G-02 angles", tpAng?.narrative?.textSlots ? JSON.stringify(tpAng.narrative.textSlots) : "");

const { base: bTrans, trk: trTrans } = mk("G-04", "transformations", "g4");
const dTrans = buildDetailedParentReportFromBaseReport(bTrans, { period: "week" });
const mpTrans = dTrans?.subjectProfiles?.find((p) => p.subject === "geometry");
const t4 = G["G-04"].bucketOverrides.transformations.g3_g4;
assertEq("detailed G-04 transformations g4 action", mpTrans?.parentActionHe, t4.actionTextHe);
assertDifferent("G-04 trans detailed", mpTrans?.parentActionHe, mpTrans?.nextWeekGoalHe);
const tpTr = buildTruthPacketV1(dTrans, { scopeType: "topic", scopeId: trTrans, scopeLabel: "טרנספורמציה" });
assertNoBanned("truth G-04 trans", JSON.stringify(tpTr?.narrative?.textSlots || {}));

const { base: bVol, trk: trVol } = mk("G-05", "volume", "g6");
const dVol = buildDetailedParentReportFromBaseReport(bVol, { period: "week" });
const mpVol = dVol?.subjectProfiles?.find((p) => p.subject === "geometry");
const v6 = G["G-05"].bucketOverrides.volume.g5_g6;
assertEq("detailed G-05 volume g6 action", mpVol?.parentActionHe, v6.actionTextHe);
const tpVol = buildTruthPacketV1(dVol, { scopeType: "topic", scopeId: trVol, scopeLabel: "נפח" });
assertNoBanned("truth G-05 volume", JSON.stringify(tpVol?.narrative?.textSlots || {}));

const { base: bPer, trk: trPer } = mk("G-06", "perimeter", "g4");
const dPer = buildDetailedParentReportFromBaseReport(bPer, { period: "week" });
const mpPer = dPer?.subjectProfiles?.find((p) => p.subject === "geometry");
assertEq("detailed G-06 perimeter g4", mpPer?.parentActionHe, G["G-06"].bucketOverrides.perimeter.g3_g4.actionTextHe);

const { base: bSym, trk: trSym } = mk("G-07", "symmetry", "g2");
const dSym = buildDetailedParentReportFromBaseReport(bSym, { period: "week" });
const mpSym = dSym?.subjectProfiles?.find((p) => p.subject === "geometry");
assertEq("detailed G-07 symmetry g2", mpSym?.parentActionHe, G["G-07"].bucketOverrides.symmetry.g1_g2.actionTextHe);
const tpSym = buildTruthPacketV1(dSym, { scopeType: "topic", scopeId: trSym, scopeLabel: "סימטריה" });
assertNoBanned("truth G-07 symmetry", JSON.stringify(tpSym?.narrative?.textSlots || {}));

const uSym = bSym.diagnosticEngineV2.units[0];
const shSym = summarizeV2UnitsForSubjectForTests(bSym.diagnosticEngineV2.units, {
  subjectReportQuestions: 12,
  subjectLabelHe: "גאומטריה",
  topicMap: bSym.geometryTopics,
  reportTotalQuestions: 20,
});
assertEq("short G-07 symmetry g2 action", shSym.parentActionHe, resolveUnitParentActionHe(uSym, "g2"));
assertNoBanned("short G-07 symmetry", shSym.parentActionHe);

process.stdout.write("parent-report-grade-aware-geometry-batch-a-verify: ok\n");
