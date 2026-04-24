import { computeTimeSignal } from "./time-intelligence.js";

/**
 * Time/trend-based downgrade or soften (additive).
 * @param {unknown[]} topicResults
 * @param {Record<string, { accuracy?: number }[]>} [historyMap]
 */
export function applyTimeDecisionGuards(topicResults, historyMap) {
  if (!Array.isArray(topicResults)) return topicResults;

  for (const r of topicResults) {
    if (!r) continue;

    const h = historyMap?.[r.topicKey];
    const signal = computeTimeSignal(h);

    if (!signal || signal.trend === "insufficient") continue;

    if (signal.trend === "declining") {
      if (r.recommendedNextStep === "advance_level" || r.recommendedNextStep === "advance_grade_topic_only") {
        r.recommendedNextStep = "maintain_and_strengthen";
        r._timeAdjusted = "declining_block";
      }
    }

    if (signal.trend === "improving") {
      if (
        r.recommendedNextStep === "drop_one_level_topic_only" ||
        r.recommendedNextStep === "drop_one_grade_topic_only"
      ) {
        r.recommendedNextStep = "remediate_same_level";
        r._timeAdjusted = "improving_soften";
      }
    }
  }

  return topicResults;
}
