/**
 * Phase 2-D2 — word_problems taxonomy candidate ordering (M-07 / M-08).
 * Run: npx tsx scripts/parent-report-grade-aware-word-problems-routing-selftest.mjs
 */

import assert from "node:assert/strict";

const { wordProblemsTaxonomyRoutingScores, orderWordProblemsTaxonomyCandidates } = await import(
  new URL("../utils/diagnostic-engine-v2/word-problems-taxonomy-candidate-order.js", import.meta.url).href
);

{
  const wrongs = [
    { patternFamily: "wp_units", params: { kind: "wp_unit_convert", missing_unit: true, answer_label: "cm" } },
    { conceptTag: "wrong_unit", params: { contract: { measurement_unit: "m" } } },
  ];
  const out = orderWordProblemsTaxonomyCandidates(["M-07", "M-08"], wrongs, {});
  assert.deepEqual(out, ["M-07", "M-08"], "unit / label evidence should prefer M-07 first");
  const s = wordProblemsTaxonomyRoutingScores(wrongs, {});
  assert.ok(s.m07Score > s.m08Score, "scores should favor M-07 for unit-style wrongs");
}

{
  const wrongs = [
    {
      patternFamily: "wp_model",
      params: {
        kind: "wp_multi_step",
        semanticFamily: "choose_operation",
        contract: { equation: true, order_of_operations: true },
      },
    },
    { diagnosticSkillId: "sequence_gap", params: { operation: "wrong_operation", pattern: "arithmetic" } },
  ];
  const out = orderWordProblemsTaxonomyCandidates(["M-07", "M-08"], wrongs, {});
  assert.deepEqual(out, ["M-08", "M-07"], "model / multi-step / equation evidence should prefer M-08 first");
  const s = wordProblemsTaxonomyRoutingScores(wrongs, {});
  assert.ok(s.m08Score > s.m07Score, "scores should favor M-08 for model-style wrongs");
}

{
  const out = orderWordProblemsTaxonomyCandidates(["M-07", "M-08"], [], {});
  assert.deepEqual(out, ["M-07", "M-08"], "empty wrongs → preserve default order");
}

{
  const out = orderWordProblemsTaxonomyCandidates(
    ["M-07", "M-08"],
    [{ kind: "wp_x", patternFamily: "y", params: { kind: "z" } }],
    {}
  );
  assert.deepEqual(out, ["M-07", "M-08"], "ambiguous / no-indicator evidence → preserve order");
}

{
  const w = [{ params: { probeTag: "wp_balanced_scores_placeholder", unit: 1, model: 1 } }];
  const s = wordProblemsTaxonomyRoutingScores(w, {});
  assert.equal(s.m07Score, s.m08Score, "constructed tie for next assertion");
  const out = orderWordProblemsTaxonomyCandidates(["M-07", "M-08"], w, {});
  assert.deepEqual(out, ["M-07", "M-08"], "tied scores preserve default order");
}

{
  const out = orderWordProblemsTaxonomyCandidates(
    ["M-09", "M-02"],
    [{ params: { kind: "wp_multi_step", multi_step: true } }],
    {}
  );
  assert.deepEqual(out, ["M-09", "M-02"], "non M-07/M-08 candidate lists must be unchanged");
}

{
  const out = orderWordProblemsTaxonomyCandidates(["M-07"], [{ params: { unit: "m" } }], {});
  assert.deepEqual(out, ["M-07"], "single-id lists unchanged");
}

{
  const out = orderWordProblemsTaxonomyCandidates(
    ["M-08", "M-07"],
    [{ params: { kind: "wp_unit_convert", wrong_unit: true } }],
    {}
  );
  assert.deepEqual(out, ["M-07", "M-08"], "unit evidence should reorder to M-07 first even if input reversed");
}

process.stdout.write("OK parent-report-grade-aware-word-problems-routing-selftest\n");
