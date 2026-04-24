/**
 * Cross-topic consistency: downgrade-only when advance and drop coexist.
 * @param {unknown[]} topicResults
 */
export function applyConsistencyGuards(topicResults) {
  if (!Array.isArray(topicResults)) return topicResults;

  const out = [...topicResults];

  const steps = out.map((r) => r?.recommendedNextStep);

  const hasAdvance = steps.some(
    (s) => s === "advance_level" || s === "advance_grade_topic_only"
  );

  const hasDrop = steps.some(
    (s) => s === "drop_one_level_topic_only" || s === "drop_one_grade_topic_only"
  );

  if (hasAdvance && hasDrop) {
    for (const r of out) {
      if (!r) continue;
      if (r.recommendedNextStep === "advance_level" || r.recommendedNextStep === "advance_grade_topic_only") {
        r.recommendedNextStep = "maintain_and_strengthen";
        r._consistencyAdjusted = true;
      }
    }
  }

  return out;
}
