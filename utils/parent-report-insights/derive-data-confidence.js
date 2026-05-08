/**
 * Confidence-band classifier shared across all `derive*` helpers.
 *
 * Bands: `thin` < `low` < `moderate` < `strong`. Thresholds are documented in the Insight
 * Packet schema and emitted in `sourceMetadata.thresholds` so consumers cannot drift.
 */

export const INSIGHT_DATA_CONFIDENCE_THRESHOLDS = Object.freeze({
  thinTotalQuestions: 6,
  moderateTotalQuestions: 12,
  strongTotalQuestions: 40,
});

export function classifyDataConfidence(totalQuestions, thresholds) {
  const t = thresholds || INSIGHT_DATA_CONFIDENCE_THRESHOLDS;
  const n = Number.isFinite(Number(totalQuestions)) ? Math.max(0, Math.round(Number(totalQuestions))) : 0;
  if (n >= t.strongTotalQuestions) return "strong";
  if (n >= t.moderateTotalQuestions) return "moderate";
  if (n >= t.thinTotalQuestions) return "low";
  return "thin";
}
