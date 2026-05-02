/**
 * Math fractions — Active Diagnostic Core v1 eligibility (session probe only).
 */

/** Tags that may activate a fraction pending probe (aligned with infer-tags + probe-map). */
export const FRACTION_ACTIVE_PROBE_TAGS = new Set([
  "adds_denominators_directly",
  "wrong_lcm",
  "ignores_denominator",
  "concept_gap",
  "operation_confusion",
]);

/**
 * @param {import("./mistake-event.js").MistakeEventV1} normalized
 * @param {string[]} inferredTags
 */
export function mathFractionWrongActivatesProbe(normalized, inferredTags) {
  if (!normalized || normalized.isCorrect !== false) return false;
  const tags = Array.isArray(inferredTags) ? inferredTags : [];
  const tagHit = tags.some((t) => FRACTION_ACTIVE_PROBE_TAGS.has(String(t).trim()));
  if (!tagHit) return false;

  const pf = String(normalized.patternFamily || "").toLowerCase();
  const kind = String(normalized.kind || "").toLowerCase();
  const bucket = String(
    normalized.bucketKey || normalized.topicOrOperation || ""
  ).toLowerCase();

  const isFractionContext =
    bucket === "fractions" ||
    pf.includes("fraction") ||
    kind.startsWith("frac");

  return isFractionContext;
}
