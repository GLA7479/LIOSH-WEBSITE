/**
 * Phase 5-C2 — moledet-geography conflict-bucket taxonomy candidate ordering (diagnostic engine only).
 * Run: npx tsx scripts/parent-report-grade-aware-moledet-routing-selftest.mjs
 */

import assert from "node:assert/strict";

const {
  orderMoledetTaxonomyCandidates,
  moledetMapsRoutingScores,
  moledetGeographyRoutingScores,
  moledetHomelandRoutingScores,
} = await import(
  new URL("../utils/diagnostic-engine-v2/moledet-taxonomy-candidate-order.js", import.meta.url).href
);

const { resolveGradeAwareParentRecommendationHe } = await import(
  new URL("../utils/parent-report-language/grade-aware-recommendation-resolver.js", import.meta.url).href
);

const { GRADE_AWARE_RECOMMENDATION_TEMPLATES } = await import(
  new URL("../utils/parent-report-language/grade-aware-recommendation-templates.js", import.meta.url).href
);

const BRIDGE_MAPS = ["MG-01", "MG-02", "MG-08"];
const BRIDGE_GEOGRAPHY = ["MG-01", "MG-02", "MG-05"];
const BRIDGE_HOMELAND = ["MG-04", "MG-06"];

// —— maps (1–4) ——
{
  const out = orderMoledetTaxonomyCandidates(
    [...BRIDGE_MAPS],
    [
      { patternFamily: "map_scale", kind: "relative_distance", topicOrOperation: "measuring_distance" },
      { params: { scale_bar: true, units_on_map: true } },
    ],
    { bucketKey: "maps", row: { gradeKey: "g4" } }
  );
  assert.deepEqual(out, ["MG-01", "MG-02", "MG-08"], "maps scale/distance evidence should order MG-01 first");
  const s = moledetMapsRoutingScores(
    [{ conceptTag: "map_scale", diagnosticSkillId: "compare_distances" }],
    {}
  );
  assert.ok(s["MG-01"] > s["MG-02"] && s["MG-01"] > s["MG-08"], "sanity: scale evidence favors MG-01");
}

{
  const out = orderMoledetTaxonomyCandidates(
    [...BRIDGE_MAPS],
    [
      { kind: "compass_reading", topicOrOperation: "absolute_north" },
      { params: { rotated_map: true, map_rotation: true, orientation: "north_up" } },
    ],
    { bucketKey: "maps", row: {} }
  );
  assert.deepEqual(out, ["MG-02", "MG-01", "MG-08"], "maps north/orientation evidence should order MG-02 first");
  const s = moledetMapsRoutingScores([{ patternFamily: "direction", conceptTag: "spatial_reference" }], {});
  assert.ok(s["MG-02"] > s["MG-01"] && s["MG-02"] > s["MG-08"], "sanity: orientation evidence favors MG-02");
}

{
  const out = orderMoledetTaxonomyCandidates(
    [...BRIDGE_MAPS],
    [{ kind: "legend", params: { map_key: true, symbols: ["river", "road"] } }, { topicOrOperation: "key_reading" }],
    { bucketKey: "maps", row: {} }
  );
  assert.deepEqual(out, ["MG-08", "MG-01", "MG-02"], "maps symbol/legend evidence should order MG-08 first");
  const s = moledetMapsRoutingScores([{ conceptTag: "landscape_symbol", diagnosticSkillId: "icon" }], {});
  assert.ok(s["MG-08"] > s["MG-01"] && s["MG-08"] > s["MG-02"], "sanity: legend/symbol evidence favors MG-08");
}

{
  const out = orderMoledetTaxonomyCandidates([...BRIDGE_MAPS], [], { bucketKey: "maps" });
  assert.deepEqual(out, BRIDGE_MAPS, "maps missing evidence preserves bridge order");
  const tie = [{ patternFamily: "map_scale", kind: "compass" }];
  const s = moledetMapsRoutingScores(tie, {});
  assert.ok(s["MG-01"] > 0 && s["MG-02"] > 0 && s["MG-01"] === s["MG-02"], "constructed tie MG-01 vs MG-02");
  assert.deepEqual(
    orderMoledetTaxonomyCandidates([...BRIDGE_MAPS], tie, { bucketKey: "maps" }),
    BRIDGE_MAPS,
    "maps tied top scores preserve bridge order"
  );
}

// —— geography (5–8) ——
{
  const out = orderMoledetTaxonomyCandidates(
    [...BRIDGE_GEOGRAPHY],
    [{ params: { ruler: true, map_scale: true } }, { topicOrOperation: "units_on_map" }],
    { bucketKey: "geography", row: {} }
  );
  assert.deepEqual(out, ["MG-01", "MG-02", "MG-05"], "geography scale/distance evidence should order MG-01 first");
}

{
  const out = orderMoledetTaxonomyCandidates(
    [...BRIDGE_GEOGRAPHY],
    [{ kind: "direction_choice", params: { north: true } }, { patternFamily: "orientation" }],
    { bucketKey: "geography", row: {} }
  );
  assert.deepEqual(out, ["MG-02", "MG-01", "MG-05"], "geography orientation evidence should order MG-02 first");
}

{
  const out = orderMoledetTaxonomyCandidates(
    [...BRIDGE_GEOGRAPHY],
    [
      { conceptTag: "climate_zone", params: { climate_map: true, color_key: true } },
      { topicOrOperation: "geographic_region", kind: "zone_reading" },
    ],
    { bucketKey: "geography", row: {} }
  );
  assert.deepEqual(out, ["MG-05", "MG-01", "MG-02"], "geography climate/region evidence should order MG-05 first");
  const s = moledetGeographyRoutingScores([{ params: { map_key_for_climate: true } }], {});
  assert.ok(s["MG-05"] > s["MG-01"] && s["MG-05"] > s["MG-02"], "sanity: climate map-key evidence favors MG-05");
}

{
  assert.deepEqual(orderMoledetTaxonomyCandidates([...BRIDGE_GEOGRAPHY], [], { bucketKey: "geography" }), BRIDGE_GEOGRAPHY);
  const tie = [{ params: { scale: true, climate: true } }];
  const s = moledetGeographyRoutingScores(tie, {});
  assert.ok(s["MG-01"] > 0 && s["MG-05"] > 0 && s["MG-01"] === s["MG-05"], "constructed tie MG-01 vs MG-05");
  assert.deepEqual(
    orderMoledetTaxonomyCandidates([...BRIDGE_GEOGRAPHY], tie, { bucketKey: "geography" }),
    BRIDGE_GEOGRAPHY,
    "geography tied top scores preserve bridge order"
  );
}

// —— homeland (9–11) ——
{
  const out = orderMoledetTaxonomyCandidates(
    [...BRIDGE_HOMELAND],
    [{ kind: "chronology", params: { timeline: true, historical_sequence: true } }, { topicOrOperation: "order_of_events" }],
    { bucketKey: "homeland", row: { levelKey: "dates_review" } }
  );
  assert.deepEqual(out, ["MG-04", "MG-06"], "homeland timeline/order evidence should order MG-04 first");
  const s = moledetHomelandRoutingScores([{ patternFamily: "event_order", conceptTag: "before_after" }], {});
  assert.ok(s["MG-04"] > s["MG-06"], "sanity: timeline evidence favors MG-04");
}

{
  const out = orderMoledetTaxonomyCandidates(
    [...BRIDGE_HOMELAND],
    [
      { kind: "population", params: { settlement: true, explanation: "two explanations" } },
      { topicOrOperation: "cause_effect", diagnosticSkillId: "inference_from_text/map" },
    ],
    { bucketKey: "homeland", row: {} }
  );
  assert.deepEqual(out, ["MG-06", "MG-04"], "homeland cause/effect/population evidence should order MG-06 first");
  const s = moledetHomelandRoutingScores([{ params: { evidence: true, reason: "why" } }], {});
  assert.ok(s["MG-06"] > s["MG-04"], "sanity: cause/effect evidence favors MG-06");
}

{
  assert.deepEqual(orderMoledetTaxonomyCandidates([...BRIDGE_HOMELAND], [], { bucketKey: "homeland" }), BRIDGE_HOMELAND);
  const tie = [{ params: { chronology: true, population: true } }];
  const s = moledetHomelandRoutingScores(tie, {});
  assert.ok(s["MG-04"] > 0 && s["MG-06"] > 0 && s["MG-04"] === s["MG-06"], "constructed tie MG-04 vs MG-06");
  assert.deepEqual(
    orderMoledetTaxonomyCandidates([...BRIDGE_HOMELAND], tie, { bucketKey: "homeland" }),
    BRIDGE_HOMELAND,
    "homeland tied top scores preserve bridge order"
  );
}

// —— non-conflict buckets unchanged (12–14) ——
{
  const c = ["MG-03"];
  assert.deepEqual(orderMoledetTaxonomyCandidates(c, [{ kind: "anything" }], { bucketKey: "citizenship" }), c);
}
{
  const c = ["MG-07"];
  assert.deepEqual(orderMoledetTaxonomyCandidates(c, [{ params: { legend: true } }], { bucketKey: "community" }), c);
}
{
  const c = ["MG-06"];
  assert.deepEqual(orderMoledetTaxonomyCandidates(c, [{ kind: "chronology" }], { bucketKey: "values" }), c);
}
{
  const c = ["MG-01"];
  assert.deepEqual(orderMoledetTaxonomyCandidates(c, [{ kind: "compass" }], { bucketKey: "mixed" }), c);
}

// —— MG-03 / MG-07 templates still resolve (15) ——
const sid = "moledet-geography";
const MG = GRADE_AWARE_RECOMMENDATION_TEMPLATES[sid];
function r(tid, bucket, grade, slot) {
  return resolveGradeAwareParentRecommendationHe({
    subjectId: sid,
    taxonomyId: tid,
    bucketKey: bucket,
    gradeKey: grade,
    slot: slot === "nextGoal" ? "nextGoal" : "action",
  });
}
assert.equal(
  r("MG-03", "citizenship", "g4", "action"),
  MG["MG-03"].bucketOverrides.citizenship.g3_g4.actionTextHe
);
assert.equal(
  r("MG-07", "community", "g6", "nextGoal"),
  MG["MG-07"].bucketOverrides.community.g5_g6.goalTextHe
);

// —— science S-01 / S-02 / S-03 / S-04 / S-07 (16) ——
const sci = GRADE_AWARE_RECOMMENDATION_TEMPLATES.science;
assert.equal(
  resolveGradeAwareParentRecommendationHe({
    subjectId: "science",
    taxonomyId: "S-01",
    bucketKey: "animals",
    gradeKey: "g4",
    slot: "action",
  }),
  sci["S-01"].bucketOverrides.animals.g3_g4.actionTextHe
);
assert.equal(
  resolveGradeAwareParentRecommendationHe({
    subjectId: "science",
    taxonomyId: "S-02",
    bucketKey: "experiments",
    gradeKey: "g4",
    slot: "action",
  }),
  sci["S-02"].bucketOverrides.experiments.g3_g4.actionTextHe
);
assert.equal(
  resolveGradeAwareParentRecommendationHe({
    subjectId: "science",
    taxonomyId: "S-03",
    bucketKey: "body",
    gradeKey: "g4",
    slot: "action",
  }),
  sci["S-03"].bucketOverrides.body.g3_g4.actionTextHe
);
assert.equal(
  resolveGradeAwareParentRecommendationHe({
    subjectId: "science",
    taxonomyId: "S-04",
    bucketKey: "materials",
    gradeKey: "g4",
    slot: "action",
  }),
  sci["S-04"].bucketOverrides.materials.g3_g4.actionTextHe
);
assert.equal(
  resolveGradeAwareParentRecommendationHe({
    subjectId: "science",
    taxonomyId: "S-07",
    bucketKey: "environment",
    gradeKey: "g4",
    slot: "action",
  }),
  sci["S-07"].bucketOverrides.environment.g3_g4.actionTextHe
);

// —— moledet-geography template keys (Phase 5-C3: MG-01/02/04/05/06/08 + 5-C1 MG-03/MG-07) ——
assert.deepEqual(
  Object.keys(MG).sort(),
  ["MG-01", "MG-02", "MG-03", "MG-04", "MG-05", "MG-06", "MG-07", "MG-08"].sort()
);

console.log("parent-report-grade-aware-moledet-routing-selftest: ok");
