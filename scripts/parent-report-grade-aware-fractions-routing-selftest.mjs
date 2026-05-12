/**
 * Phase 2-B3 — fraction taxonomy candidate ordering selftest (M-04 / M-05 only).
 * Run: npx tsx scripts/parent-report-grade-aware-fractions-routing-selftest.mjs
 */

import assert from "node:assert/strict";

const { fractionTaxonomyRoutingScores, orderFractionTaxonomyCandidates } = await import(
  new URL("../utils/diagnostic-engine-v2/fraction-taxonomy-candidate-order.js", import.meta.url).href
);

{
  const out = orderFractionTaxonomyCandidates(
    ["M-04", "M-05"],
    [
      { patternFamily: "fraction_same_denominator_add_sub", kind: "frac_same_den_add" },
      { patternFamily: "fraction_unlike_denominators_add_sub", conceptTag: "frac_common_denominator" },
    ],
    {}
  );
  assert.deepEqual(out, ["M-05", "M-04"], "operation-heavy evidence should prefer M-05 first");
}

{
  const out = orderFractionTaxonomyCandidates(
    ["M-04", "M-05"],
    [
      { kind: "frac_compare_like_den_g4" },
      { patternFamily: "numerator_only_trap", kind: "frac_equiv_missing_den_g4" },
    ],
    {}
  );
  assert.deepEqual(out, ["M-04", "M-05"], "comparison-heavy evidence should prefer M-04 first");
}

{
  const out = orderFractionTaxonomyCandidates(["M-04", "M-05"], [], {});
  assert.deepEqual(out, ["M-04", "M-05"], "missing evidence preserves default order");
}

{
  const w = [{ patternFamily: "x_numerator_only_x" }, { diagnosticSkillId: "lcm_only_skill" }];
  const s = fractionTaxonomyRoutingScores(w, {}, "fractions", "fractions\u0001learning\u0001g4\u0001easy");
  assert.equal(s.comparisonScore, s.operationScore, "constructed tie for next assertion");
  const out = orderFractionTaxonomyCandidates(["M-04", "M-05"], w, {
    bucketKey: "fractions",
    topicRowKey: "fractions\u0001learning\u0001g4\u0001easy",
  });
  assert.deepEqual(out, ["M-04", "M-05"], "tied scores preserve default order");
}

{
  const out = orderFractionTaxonomyCandidates(
    ["M-09", "M-02"],
    [{ patternFamily: "fraction_same_denominator_add_sub" }],
    {}
  );
  assert.deepEqual(out, ["M-09", "M-02"], "non-fraction candidate lists must be unchanged");
}

{
  const out = orderFractionTaxonomyCandidates(["M-04"], [{ patternFamily: "fraction_same_denominator_add_sub" }], {});
  assert.deepEqual(out, ["M-04"], "single-id lists unchanged");
}

{
  const out = orderFractionTaxonomyCandidates(["M-05", "M-04"], [{ patternFamily: "fraction_same_denominator_add_sub" }], {});
  assert.deepEqual(out, ["M-05", "M-04"], "operation-heavy with reversed input still yields M-05 first");
}

process.stdout.write("OK parent-report-grade-aware-fractions-routing-selftest\n");
