/**
 * Math — active diagnostic eligibility (session probes only).
 */

import {
  FRACTION_ACTIVE_PROBE_TAGS,
  mathFractionWrongActivatesProbe,
} from "./math-fraction-probe.js";

const PLACE_VALUE_TAGS = new Set(["place_value_error"]);
const MULT_TABLE_TAGS = new Set(["multiplication_fact_gap"]);
const OPERATION_TAGS = new Set(["operation_confusion"]);

/** @param {string} s */
function low(s) {
  return String(s || "").trim().toLowerCase();
}

/**
 * @param {import("./mistake-event.js").MistakeEventV1} normalized
 * @param {string[]} inferredTags
 */
export function mathWrongActivatesProbe(normalized, inferredTags) {
  if (!normalized || normalized.isCorrect !== false) return false;
  const tags = Array.isArray(inferredTags) ? inferredTags : [];

  if (mathFractionWrongActivatesProbe(normalized, tags)) return true;

  const bucket = low(normalized.bucketKey || normalized.topicOrOperation);
  const pf = low(normalized.patternFamily);
  const kind = low(normalized.kind);

  if (tags.some((t) => PLACE_VALUE_TAGS.has(String(t).trim()))) {
    const placeCtx =
      bucket.includes("number_sense") ||
      bucket.includes("decimals") ||
      pf.includes("place") ||
      pf.includes("digit") ||
      kind.includes("place") ||
      kind.includes("digit");
    if (placeCtx) return true;
  }

  if (tags.some((t) => MULT_TABLE_TAGS.has(String(t).trim()))) {
    const mulCtx =
      bucket === "multiplication" ||
      pf.includes("multiplication") ||
      pf.includes("times") ||
      kind.includes("mul") ||
      kind.includes("times");
    if (mulCtx) return true;
  }

  if (tags.some((t) => OPERATION_TAGS.has(String(t).trim()))) {
    const fracCtx =
      bucket === "fractions" ||
      pf.includes("fraction") ||
      kind.startsWith("frac");
    const wpCtx = bucket === "word_problems" || kind.includes("story") || pf.includes("word");
    if (fracCtx || wpCtx) return true;
  }

  return false;
}

export { FRACTION_ACTIVE_PROBE_TAGS, mathFractionWrongActivatesProbe };
