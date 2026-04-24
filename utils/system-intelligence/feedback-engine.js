/**
 * Attach last-window feedback label from history (additive metadata).
 * @param {unknown[]} topicResults
 * @param {Record<string, { accuracy?: number }[]>} [historyMap]
 */
export function attachFeedbackSignal(topicResults, historyMap) {
  if (!Array.isArray(topicResults)) return topicResults;

  for (const r of topicResults) {
    if (!r) continue;
    const h = historyMap?.[r.topicKey];

    if (!Array.isArray(h)) continue;

    const before = h.slice(-2)[0];
    const after = h.slice(-1)[0];

    if (!before || !after) continue;

    if (after.accuracy > before.accuracy) {
      r._feedback = "improved";
    } else if (after.accuracy < before.accuracy) {
      r._feedback = "worsened";
    } else {
      r._feedback = "no_change";
    }
  }

  return topicResults;
}
