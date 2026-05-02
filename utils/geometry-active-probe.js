/**
 * Geometry — active diagnostic eligibility (conceptual bank probes).
 */

const APPROVED = new Set([
  "concept_confusion",
  "geometry_calculation_slip",
  "calculation_slip",
  "strategy_error",
  "prerequisite_gap",
  "instruction_misread",
  "fact_recall_gap",
  "classification_error",
]);

/** @param {string} s */
function low(s) {
  return String(s || "").trim().toLowerCase();
}

/**
 * @param {import("./mistake-event.js").MistakeEventV1} normalized
 * @param {string[]} inferredTags
 */
export function geometryWrongActivatesProbe(normalized, inferredTags) {
  if (!normalized || normalized.isCorrect !== false) return false;
  const tags = Array.isArray(inferredTags) ? inferredTags : [];
  const hit = tags.filter((t) => APPROVED.has(String(t).trim()));
  if (hit.length === 0) return false;

  const exp = Array.isArray(normalized.expectedErrorTags)
    ? normalized.expectedErrorTags.map((x) => String(x).trim())
    : [];
  const explicitOverlap = hit.some((t) => exp.includes(t));
  if (explicitOverlap) return true;

  const pf = low(normalized.patternFamily);
  const ct = low(normalized.conceptTag);
  const conceptualCue =
    pf.includes("perimeter") ||
    pf.includes("area") ||
    pf.includes("concept") ||
    pf.includes("shape") ||
    pf.includes("pv_") ||
    pf.includes("plan") ||
    pf.includes("solid") ||
    ct.includes("pv") ||
    ct.includes("shape");

  return conceptualCue;
}
