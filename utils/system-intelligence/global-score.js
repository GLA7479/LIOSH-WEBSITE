/**
 * Aggregate score from final recommended steps (additive).
 * @param {unknown[]} topicResults
 */
export function computeGlobalScore(topicResults) {
  if (!Array.isArray(topicResults) || topicResults.length === 0) {
    return { score: 0, level: "unknown" };
  }

  let total = 0;

  for (const r of topicResults) {
    if (!r) continue;
    const step = r.recommendedNextStep;

    if (step === "advance_level") total += 3;
    else if (step === "maintain_and_strengthen") total += 2;
    else if (step === "remediate_same_level") total += 1;
    else total += 0;
  }

  const avg = total / topicResults.length;

  let level = "low";
  if (avg >= 2.5) level = "high";
  else if (avg >= 1.5) level = "medium";

  return { score: Number(avg.toFixed(2)), level };
}
