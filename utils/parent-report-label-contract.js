/**
 * בדיקות חוזה — מזהים פנימיים לא אמורים להופיע כטקסט UI במקום תוויות עבריות.
 * משמש סקריפטי בדיקה בלבד; לא משנה מנוע או דוח.
 */

/** מזהים שמוצגים לעיתים כערך גולמי כשחסר מיפוי תווית */
export const INTERNAL_DOMINANT_AND_DIAGNOSTIC_IDS = new Set([
  "knowledge_gap",
  "fragile_success",
  "careless_pattern",
  "instruction_friction",
  "speed_pressure",
  "stable_mastery",
  "mixed_low_signal",
  "none_sparse",
  "none_observed",
  "mixed",
  "undetermined",
  "fragile_success_cluster",
  "hint_dependence",
  "false_promotion",
]);

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * @param {string} s
 */
function looksLikeAsciiSnakeId(s) {
  const t = s.trim();
  return /^[a-z][a-z0-9_]*$/i.test(t) && t.includes("_");
}

/**
 * טקסט שאמור להיות תווית עברית למשתמש — לא מזהה פנימי ידוע ולא snake ASCII בלי עברית.
 * @param {string} fieldCtx
 * @param {unknown} value
 */
export function assertUiHebrewLabelField(fieldCtx, value) {
  if (!isNonEmptyString(value)) return;
  const s = String(value).trim();
  if (INTERNAL_DOMINANT_AND_DIAGNOSTIC_IDS.has(s)) {
    throw new Error(`${fieldCtx}: raw internal id leaked as label: "${s}"`);
  }
  if (looksLikeAsciiSnakeId(s) && !/[\u0590-\u05FF]/.test(s)) {
    throw new Error(`${fieldCtx}: snake_case ASCII without Hebrew (possible id leak): "${s}"`);
  }
}

/**
 * @param {Record<string, unknown>|null|undefined} detailed
 */
export function assertDetailedExecutiveLabels(detailed) {
  const es = detailed?.executiveSummary;
  if (!es || typeof es !== "object") return;
  assertUiHebrewLabelField("executiveSummary.dominantCrossSubjectRiskLabelHe", es.dominantCrossSubjectRiskLabelHe);
  assertUiHebrewLabelField(
    "executiveSummary.dominantCrossSubjectSuccessPatternLabelHe",
    es.dominantCrossSubjectSuccessPatternLabelHe
  );
  for (const [i, line] of (es.topStrengthsAcrossHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.topStrengthsAcrossHe[${i}]`, line);
  }
  for (const [i, line] of (es.topFocusAreasHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.topFocusAreasHe[${i}]`, line);
  }
}

/**
 * @param {Record<string, unknown>|null|undefined} sp
 * @param {string} subjectCtx
 */
export function assertSubjectProfileUiLabels(sp, subjectCtx) {
  if (!sp || typeof sp !== "object") return;
  assertUiHebrewLabelField(`${subjectCtx}.dominantLearningRiskLabelHe`, sp.dominantLearningRiskLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.dominantSuccessPatternLabelHe`, sp.dominantSuccessPatternLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.recommendedHomeMethodHe`, sp.recommendedHomeMethodHe);
}
