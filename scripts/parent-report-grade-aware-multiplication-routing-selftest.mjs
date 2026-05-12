/**
 * Phase 2-C2 — multiplication taxonomy candidate ordering (M-03 / M-10).
 * Run: npx tsx scripts/parent-report-grade-aware-multiplication-routing-selftest.mjs
 */

import assert from "node:assert/strict";

const { multiplicationTaxonomyRoutingScores, orderMultiplicationTaxonomyCandidates } = await import(
  new URL("../utils/diagnostic-engine-v2/multiplication-taxonomy-candidate-order.js", import.meta.url).href
);

{
  const out = orderMultiplicationTaxonomyCandidates(
    ["M-03", "M-10"],
    [
      { patternFamily: "equal_groups", kind: "mul", params: { kind: "mul", semanticFamily: "multiplication_fact" } },
      { kind: "mul_tens", params: { factors: true } },
    ],
    {}
  );
  assert.deepEqual(out, ["M-03", "M-10"], "multiplication-fact / factors-style evidence should prefer M-03 first");
  const s = multiplicationTaxonomyRoutingScores(
    [
      { patternFamily: "equal_groups", kind: "mul", params: { kind: "mul", semanticFamily: "multiplication_fact" } },
      { kind: "mul_tens", params: { factors: true } },
    ],
    {}
  );
  assert.ok(s.m03Score > s.m10Score, "scores should favor M-03 for fact-style wrongs");
}

{
  const out = orderMultiplicationTaxonomyCandidates(
    ["M-03", "M-10"],
    [
      { patternFamily: "inverse_operation", params: { operation: "division", conceptTag: "quotient" } },
      { kind: "div_long", params: { contract: { ratio: true, remainder: 1 } } },
    ],
    {}
  );
  assert.deepEqual(out, ["M-10", "M-03"], "division / inverse / ratio evidence should prefer M-10 first");
  const s = multiplicationTaxonomyRoutingScores(
    [
      { patternFamily: "inverse_operation", params: { operation: "division", conceptTag: "quotient" } },
      { kind: "div_long", params: { contract: { ratio: true, remainder: 1 } } },
    ],
    {}
  );
  assert.ok(s.m10Score > s.m03Score, "scores should favor M-10 for division-style wrongs");
}

{
  const out = orderMultiplicationTaxonomyCandidates(["M-03", "M-10"], [], {});
  assert.deepEqual(out, ["M-03", "M-10"], "empty wrongs → preserve default order");
}

{
  const out = orderMultiplicationTaxonomyCandidates(
    ["M-03", "M-10"],
    [{ kind: "x", patternFamily: "y" }],
    {}
  );
  assert.deepEqual(out, ["M-03", "M-10"], "ambiguous / no-indicator evidence → preserve order");
}

{
  const w = [{ params: { probeTag: "powers_ratio_mixed_evidence" } }];
  const s = multiplicationTaxonomyRoutingScores(w, {}, undefined);
  assert.equal(s.m03Score, s.m10Score, "constructed tie for next assertion");
  const out = orderMultiplicationTaxonomyCandidates(["M-03", "M-10"], w, {});
  assert.deepEqual(out, ["M-03", "M-10"], "tied scores preserve default order");
}

{
  const out = orderMultiplicationTaxonomyCandidates(
    ["M-09", "M-02"],
    [{ patternFamily: "inverse_operation", params: { operation: "division" } }],
    {}
  );
  assert.deepEqual(out, ["M-09", "M-02"], "non M-03/M-10 candidate lists must be unchanged");
}

{
  const out = orderMultiplicationTaxonomyCandidates(["M-03"], [{ params: { operation: "division" } }], {});
  assert.deepEqual(out, ["M-03"], "single-id lists unchanged");
}

{
  const out = orderMultiplicationTaxonomyCandidates(
    ["M-10", "M-03"],
    [{ patternFamily: "powers", params: { kind: "power_calc" } }],
    {}
  );
  assert.deepEqual(out, ["M-03", "M-10"], "powers evidence should reorder to M-03 first even if input reversed");
}

process.stdout.write("OK parent-report-grade-aware-multiplication-routing-selftest\n");
