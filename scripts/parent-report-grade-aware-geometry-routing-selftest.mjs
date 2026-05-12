/**
 * Phase 3-B0 — geometry taxonomy candidate ordering (quadrilaterals G-01 vs G-03; area G-03 vs G-08).
 * Run: npx tsx scripts/parent-report-grade-aware-geometry-routing-selftest.mjs
 */

import assert from "node:assert/strict";

const {
  orderGeometryTaxonomyCandidates,
  geometryQuadrilateralRoutingScores,
  geometryAreaRoutingScores,
} = await import(
  new URL("../utils/diagnostic-engine-v2/geometry-taxonomy-candidate-order.js", import.meta.url).href
);

const { orderFractionTaxonomyCandidates } = await import(
  new URL("../utils/diagnostic-engine-v2/fraction-taxonomy-candidate-order.js", import.meta.url).href
);

// --- Quadrilaterals: G-01 before G-03 when property/shape evidence dominates ---
{
  const out = orderGeometryTaxonomyCandidates(
    ["G-01", "G-03"],
    [
      { patternFamily: "quadrilateral_props", kind: "parallel_lines" },
      { conceptTag: "diagonal", diagnosticSkillId: "classify_shape" },
    ],
    { bucketKey: "quadrilaterals", row: { gradeKey: "g4", levelKey: "easy" } }
  );
  assert.deepEqual(out, ["G-01", "G-03"], "quadrilateral property evidence should prefer G-01 first");
  const s = geometryQuadrilateralRoutingScores(
    [{ patternFamily: "rectangle", kind: "shape_property" }],
    {}
  );
  assert.ok(s.g01Score > s.g03Score, "sanity: constructed evidence should favor G-01 score");
}

// --- Quadrilaterals: G-03 before G-01 when height / base-height evidence dominates ---
{
  const out = orderGeometryTaxonomyCandidates(
    ["G-01", "G-03"],
    [{ params: { kind: "area_by_height", missing_height: true } }, { conceptTag: "base_height" }],
    { bucketKey: "quadrilaterals", row: {} }
  );
  assert.deepEqual(out, ["G-03", "G-01"], "height/base-height evidence should prefer G-03 first");
  const s = geometryQuadrilateralRoutingScores([{ kind: "height", topicOrOperation: "quadrilateral_area" }], {});
  assert.ok(s.g03Score > s.g01Score, "sanity: constructed evidence should favor G-03 score");
}

// --- Area: G-08 before G-03 when formula / triangle / pythagoras evidence dominates ---
{
  const out = orderGeometryTaxonomyCandidates(
    ["G-03", "G-08"],
    [
      { patternFamily: "triangle_area", params: { operation: "formula", theorem: "pythagoras" } },
      { diagnosticSkillId: "substitute_formula", kind: "hypotenuse" },
    ],
    { bucketKey: "area", row: { gradeKey: "g6" } }
  );
  assert.deepEqual(out, ["G-08", "G-03"], "formula/triangle/pythagoras evidence should prefer G-08 first on area bucket");
  const s = geometryAreaRoutingScores([{ params: { formula_pipeline: true, leg: 3, theorem: "pythagoras" } }], {});
  assert.ok(s.g08Score > s.g03Score, "sanity: constructed evidence should favor G-08 score");
}

// --- Ambiguous / missing / tied: preserve bridge order ---
{
  const out = orderGeometryTaxonomyCandidates(["G-01", "G-03"], [], { bucketKey: "quadrilaterals" });
  assert.deepEqual(out, ["G-01", "G-03"], "missing evidence preserves taxonomy bridge order");
}

{
  const w = [{ patternFamily: "shape", conceptTag: "height" }];
  const s = geometryQuadrilateralRoutingScores(w, {});
  assert.equal(s.g01Score, s.g03Score, "constructed tie for next assertion");
  const out = orderGeometryTaxonomyCandidates(["G-01", "G-03"], w, { bucketKey: "quadrilaterals" });
  assert.deepEqual(out, ["G-01", "G-03"], "tied scores preserve default order");
}

{
  const out = orderGeometryTaxonomyCandidates(["G-03", "G-08"], [], { bucketKey: "area" });
  assert.deepEqual(out, ["G-03", "G-08"], "area missing evidence preserves bridge order");
}

{
  const out = orderGeometryTaxonomyCandidates(
    ["G-03", "G-08"],
    [{ kind: "missing_height", params: { quadrilateral_area: true } }],
    { bucketKey: "area" }
  );
  assert.deepEqual(out, ["G-03", "G-08"], "height/structure area evidence should prefer G-03 before G-08");
}

{
  const out = orderGeometryTaxonomyCandidates(
    ["G-08", "G-03"],
    [{ kind: "missing_height", params: { quadrilateral_area: true } }],
    { bucketKey: "area" }
  );
  assert.deepEqual(out, ["G-03", "G-08"], "G-03 should lead when height-area evidence wins even if bridge listed G-08 first");
}

// --- Reversed input still respects evidence winner ---
{
  const out = orderGeometryTaxonomyCandidates(
    ["G-03", "G-01"],
    [{ kind: "parallelogram", conceptTag: "tiling" }],
    { bucketKey: "quadrilaterals" }
  );
  assert.deepEqual(out, ["G-01", "G-03"], "G-01 should lead when shape evidence wins regardless of input order");
}

// --- Non-conflict geometry bucket: unchanged ---
{
  const out = orderGeometryTaxonomyCandidates(["G-08"], [{ kind: "triangle_area" }], { bucketKey: "triangles" });
  assert.deepEqual(out, ["G-08"], "single-id geometry lists unchanged");
}

// --- Non-geometry candidate list: unchanged (helper ignores non-conflict ids) ---
{
  const out = orderGeometryTaxonomyCandidates(
    ["E-01", "E-02"],
    [{ patternFamily: "grammar_error" }],
    { bucketKey: "quadrilaterals" }
  );
  assert.deepEqual(out, ["E-01", "E-02"], "non-geometry ids on quadrilaterals bucket unchanged");
}

// --- Math fraction routing unchanged (regression guard) ---
{
  const out = orderFractionTaxonomyCandidates(
    ["M-04", "M-05"],
    [{ kind: "frac_compare_like_den_g4" }],
    {}
  );
  assert.deepEqual(out, ["M-04", "M-05"], "math fraction routing must stay unchanged");
}

process.stdout.write("OK parent-report-grade-aware-geometry-routing-selftest\n");
