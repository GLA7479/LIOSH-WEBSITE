/**
 * Single place for "how many answers exist for this report window" rollups.
 * Copilot truth packets expose anchored-topic sums that can be far below the global
 * aggregate when many answers lack anchored topic rows — comparisons must use this helper.
 */

/**
 * @param {unknown} payload — Parent Copilot detailed payload (browser-shaped).
 * @returns {number}
 */
export function maxGlobalReportQuestionCount(payload) {
  if (!payload || typeof payload !== "object") return 0;
  const summary = payload.summary && typeof payload.summary === "object" ? payload.summary : {};
  const snap = payload.overallSnapshot && typeof payload.overallSnapshot === "object" ? payload.overallSnapshot : {};
  const fromSummary = Math.max(0, Math.round(Number(summary.totalAnswers) || 0));
  const fromSnap = Math.max(0, Math.round(Number(snap.totalQuestions) || 0));
  return Math.max(fromSummary, fromSnap);
}

/** Below this total we still allow global scarcity framing when contracts justify it. */
export const STRONG_GLOBAL_QUESTION_FLOOR = 120;
