/**
 * Grade-aware parent recommendation resolver (Phase 1+).
 * Always active in dev and production — no feature flag; returns template Hebrew when taxonomy/band/bucket match.
 * Supports legacy flat templates (M-02, M-09, M-06) and extended M-01 (defaultBands + bucketOverrides: compare, number_sense, estimation).
 */

import { mathReportBaseOperationKey } from "../math-report-generator.js";
import { GRADE_AWARE_RECOMMENDATION_TEMPLATES } from "./grade-aware-recommendation-templates.js";

/**
 * @param {string|null|undefined} gradeKey
 * @returns {"g1_g2"|"g3_g4"|"g5_g6"|null}
 */
function gradeKeyToBand(gradeKey) {
  const g = String(gradeKey || "").trim().toLowerCase();
  if (g === "g1" || g === "g2") return "g1_g2";
  if (g === "g3" || g === "g4") return "g3_g4";
  if (g === "g5" || g === "g6") return "g5_g6";
  return null;
}

/**
 * @param {string} subjectId
 * @param {unknown} bucketKeyRaw
 */
function normalizedMathBucketKey(subjectId, bucketKeyRaw) {
  if (String(subjectId || "").trim() !== "math") return "";
  return mathReportBaseOperationKey(String(bucketKeyRaw || ""));
}

/**
 * @param {unknown} bandObj
 * @param {"action"|"nextGoal"} slot
 * @returns {string|null}
 */
function slotTextFromBandObject(bandObj, slot) {
  if (!bandObj || typeof bandObj !== "object") return null;
  const raw = slot === "nextGoal" ? bandObj.goalTextHe : bandObj.actionTextHe;
  if (raw == null) return null;
  const text = String(raw).trim();
  return text ? text : null;
}

/**
 * @typedef {{
 *   subjectId?: string | null;
 *   gradeKey?: string | null;
 *   taxonomyId?: string | null;
 *   bucketKey?: string | null;
 *   slot?: "action" | "nextGoal" | string | null;
 * }} GradeAwareParentRecommendationInput
 */

/**
 * @param {GradeAwareParentRecommendationInput} input
 * @returns {string | null}
 */
export function resolveGradeAwareParentRecommendationHe(input) {
  const subjectId = String(input?.subjectId || "").trim();
  const taxonomyId = String(input?.taxonomyId || "").trim();
  const gradeKey =
    input?.gradeKey != null && String(input.gradeKey).trim() !== ""
      ? String(input.gradeKey).trim()
      : null;
  const slot = input?.slot === "nextGoal" ? "nextGoal" : "action";

  const bandKey = gradeKeyToBand(gradeKey);
  if (!bandKey || !subjectId || !taxonomyId) return null;

  const subjectBank = GRADE_AWARE_RECOMMENDATION_TEMPLATES[subjectId];
  if (!subjectBank) return null;
  const entry = subjectBank[taxonomyId];
  if (!entry || typeof entry !== "object") return null;

  /** Extended shape: M-01 partial bucket-aware (defaultBands + optional bucketOverrides). */
  if (entry.defaultBands != null && typeof entry.defaultBands === "object") {
    const bucketNorm = normalizedMathBucketKey(subjectId, input?.bucketKey);
    const bo = entry.bucketOverrides && typeof entry.bucketOverrides === "object" ? entry.bucketOverrides : null;
    let bandObj = null;
    if (bo && bucketNorm && bo[bucketNorm] && typeof bo[bucketNorm] === "object") {
      bandObj = bo[bucketNorm][bandKey];
    }
    if (!bandObj || typeof bandObj !== "object") {
      bandObj = entry.defaultBands[bandKey];
    }
    return slotTextFromBandObject(bandObj, slot);
  }

  const band = entry[bandKey];
  return slotTextFromBandObject(band, slot);
}
