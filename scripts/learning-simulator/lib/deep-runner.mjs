/**
 * Deep longitudinal simulator v1 — storage build + horizon validation + report/behavior hooks.
 */

/**
 * Minimum evidence checks so 30d/90d windows are not accidentally thin.
 * @param {object} scenario
 * @param {{ sessionCount?: number, questionTotal?: number }} stats
 */
export function validateDeepHorizonEvidence(scenario, stats) {
  const errors = [];
  const h = Number(scenario.timeHorizonDays) || 0;
  const sc = Number(stats.sessionCount) || 0;
  const q = Number(stats.questionTotal) || 0;

  if (h >= 90) {
    if (sc < 38) errors.push(`deep 90d: expected >=38 sessions, got ${sc}`);
    if (q < 2100) errors.push(`deep 90d: expected >=2100 questions for longitudinal evidence, got ${q}`);
  } else if (h >= 30) {
    if (sc < 26) errors.push(`deep 30d: expected >=26 sessions, got ${sc}`);
    if (q < 680) errors.push(`deep 30d: expected >=680 questions for adequate evidence, got ${q}`);
  }

  return { ok: errors.length === 0, errors };
}
