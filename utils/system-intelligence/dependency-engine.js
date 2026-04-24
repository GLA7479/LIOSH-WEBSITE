import { TOPIC_DEPENDENCIES } from "./topic-dependency-map.js";

/**
 * Downgrade advance when a mapped dependency topic is in a drop step.
 * @param {unknown[]} topicResults
 */
export function applyDependencyGuards(topicResults) {
  if (!Array.isArray(topicResults)) return topicResults;

  const map = Object.fromEntries(topicResults.map((r) => [r?.topicKey, r]).filter((e) => e[0]));

  for (const r of topicResults) {
    if (!r) continue;
    const deps = TOPIC_DEPENDENCIES[r.topicKey] || [];

    for (const dep of deps) {
      const depRes = map[dep];
      if (!depRes) continue;

      const depStep = depRes.recommendedNextStep;

      if (depStep === "drop_one_level_topic_only" || depStep === "drop_one_grade_topic_only") {
        if (
          r.recommendedNextStep === "advance_level" ||
          r.recommendedNextStep === "advance_grade_topic_only"
        ) {
          r.recommendedNextStep = "maintain_and_strengthen";
          r._dependencyAdjusted = true;
        }
      }
    }
  }

  return topicResults;
}
