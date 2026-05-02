/**
 * Deterministic Hebrew copy for fast diagnosis (no LLM).
 */

/** @type {Record<string, string>} */
export const TAG_LABEL_HE = {
  calculation_slip: "רגע של טעות חישובית",
  concept_gap: "פער בהבנת המושג",
  strategy_error: "בחירת דרך פתרון לא מתאימה",
  instruction_misread: "קריאה לא מדויקת של הניסוח",
  repeated_misconception: "דפוס שגוי חוזר",
  guessing_pattern: "ניחוש במקום וידוא",
  speed_block: "לחץ מהירות שמשפיע על הדיוק",
  attention_variability: "ריכוז משתנה בין שאלות",
  prerequisite_gap: "חוסר יציבות במושג קודם",
  language_comprehension_gap: "הבנת לשון",
  decoding_error: "פיענוח אותיות/צלילים",
  comprehension_gap: "הבנת הנקרא",
  detail_recall_error: "שליפת פרטים מהטקסט",
  inference_error: "הסקה מהטקסט",
  vocabulary_gap: "אוצר מילים",
  sequence_error: "סדר צעדים או מידע",
  grammar_pattern_error: "דפוס דקדוקי",
  tense_confusion: "בלבול בזמני הפועל",
  reading_comprehension_gap: "הבנה כללית של טקסט",
  spelling_pattern_error: "דפוס כתיב",
  fact_recall_gap: "שליפת עובדות",
  cause_effect_gap: "קשר סיבה–תוצאה",
  classification_error: "סיווג",
  map_reading_gap: "קריאת מפה/מפתח",
  adds_denominators_directly: "חיבור שברים ללא מציאת מכנה משותף",
  wrong_lcm: "בחירת מכנה משותף",
  ignores_denominator: "התעלמות מהמכנה",
  operation_confusion: "בלבול בין פעולות",
  place_value_error: "ערך מקום",
  multiplication_fact_gap: "עובדות כפל",
  concept_confusion: "בלבול מושגי",
};

/**
 * @param {string[]} suspectedTags
 * @returns {string}
 */
export function tagsSummaryHe(suspectedTags) {
  const labels = suspectedTags
    .map((t) => TAG_LABEL_HE[t] || "")
    .filter(Boolean)
    .slice(0, 3);
  if (!labels.length) return "";
  return labels.join(" · ");
}
