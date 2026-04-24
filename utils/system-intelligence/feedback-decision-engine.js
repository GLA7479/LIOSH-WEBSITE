/**
 * Feedback-based downgrade or soften (uses _feedback from attachFeedbackSignal).
 * @param {unknown[]} topicResults
 */
export function applyFeedbackDecisionGuards(topicResults) {
  if (!Array.isArray(topicResults)) return topicResults;

  for (const r of topicResults) {
    if (!r) continue;

    const f = r._feedback;

    if (f === "worsened") {
      if (r.recommendedNextStep === "advance_level" || r.recommendedNextStep === "advance_grade_topic_only") {
        r.recommendedNextStep = "maintain_and_strengthen";
        r._feedbackAdjusted = "worsened_block";
      }
    }

    if (f === "improved") {
      if (
        r.recommendedNextStep === "drop_one_level_topic_only" ||
        r.recommendedNextStep === "drop_one_grade_topic_only"
      ) {
        r.recommendedNextStep = "remediate_same_level";
        r._feedbackAdjusted = "improved_soften";
      }
    }
  }

  return topicResults;
}
