/**
 * Priority score from system-intelligence metadata (sorts descending by score).
 * @param {unknown[]} topicResults
 */
export function computeTopicPriority(topicResults) {
  if (!Array.isArray(topicResults)) return topicResults;

  for (const r of topicResults) {
    if (!r) continue;

    let score = 0;

    if (r._feedback === "worsened") score += 3;
    if (r._feedback === "no_change") score += 2;
    if (r._feedback === "improved") score += 1;

    if (r._dependencyAdjusted) score += 2;
    if (r._consistencyAdjusted) score += 1;

    r._priorityScore = score;
  }

  return topicResults.sort((a, b) => (b._priorityScore || 0) - (a._priorityScore || 0));
}
