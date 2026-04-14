/**
 * עדיפות וחומרה P1–P4 — stage1 §10 (מטריצה מול ביטחון ורוחב).
 * @typedef {"P1"|"P2"|"P3"|"P4"} PriorityLevel
 */

/**
 * @param {import("./confidence-policy.js").ConfidenceLevel} confidence
 * @param {"narrow"|"medium"|"wide"} breadth
 * @param {{ sharpDecline?: boolean, repeatedFailureAfterTwoCycles?: boolean, crossSubjectContradiction?: boolean }} [flags]
 * @returns {PriorityLevel}
 */
export function resolvePriority(confidence, breadth, flags = {}) {
  if (flags.crossSubjectContradiction || flags.repeatedFailureAfterTwoCycles) return "P4";
  if (flags.sharpDecline && (confidence === "moderate" || confidence === "high")) return "P4";

  const b = breadth || "narrow";
  /** @type {Record<string, Record<string, PriorityLevel>>} */
  const matrix = {
    high: { narrow: "P3", medium: "P3", wide: "P4" },
    moderate: { narrow: "P2", medium: "P3", wide: "P3" },
    low: { narrow: "P1", medium: "P2", wide: "P2" },
    early_signal_only: { narrow: "P1", medium: "P2", wide: "P2" },
    insufficient_data: { narrow: "P1", medium: "P1", wide: "P2" },
    contradictory: { narrow: "P2", medium: "P3", wide: "P4" },
  };
  const row = matrix[confidence] || matrix.insufficient_data;
  return row[b] || "P2";
}

/**
 * רוחב לפי מספר שורות עם needsPractice באותו מקצוע.
 * @param {number} weakRowCount
 * @returns {"narrow"|"medium"|"wide"}
 */
export function breadthFromWeakRowCount(weakRowCount) {
  if (weakRowCount >= 4) return "wide";
  if (weakRowCount >= 2) return "medium";
  return "narrow";
}
