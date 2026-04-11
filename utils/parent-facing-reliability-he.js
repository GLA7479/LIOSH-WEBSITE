/**
 * ניסוח קצר להורה על חוזק המסקנה — לפי אותות קיימים בלבד,
 * בלי מונחי מערכת, בלי ציון גולמי ובלי תוויות טכניות.
 */

const URGENT_STEPS = new Set([
  "drop_one_level_topic_only",
  "drop_one_grade_topic_only",
  "remediate_same_level",
]);

/**
 * שורת אמון אחת להורה (שורת נושא בדוח רגיל / כרטיס נושא במקיף).
 * משתמש ב־questions, evidenceStrength, dataSufficiencyLevel, isEarlySignalOnly,
 * mistakeEventCount, needsPractice, excellent, recommendedNextStep (אופציונלי).
 *
 * @param {Record<string, unknown>} input
 * @returns {string}
 */
export function parentReliabilityVoiceHe(input) {
  const q = Number(input?.questions) || 0;
  const ev = String(input?.evidenceStrength || "");
  const suff = String(input?.dataSufficiencyLevel || "");
  const early = !!input?.isEarlySignalOnly;
  const m = Number(input?.mistakeEventCount ?? input?.mistakeEventCountResolved) || 0;
  const needsPractice = !!input?.needsPractice;
  const excellent = !!input?.excellent;
  const step = String(input?.recommendedNextStep || input?.diagnosticRecommendedNextStep || "");

  if (q <= 0) return "עדיין אין כאן נתון — קשה לגזור מסקנה.";
  if (q < 4 || suff === "low") {
    return "עדיין מוקדם לקבוע — כדאי להמשיך לתרגל ולעקוב בשבוע הקרוב.";
  }

  const seriousByStep = step && URGENT_STEPS.has(step) && m >= 8;
  const seriousByRow = needsPractice && m >= 8 && q >= 8;
  if (seriousByStep || seriousByRow) {
    return "זה כבר חוזר מספיק פעמים כדי להתייחס אליו ברצינות.";
  }

  if (q < 8 || ev === "low") {
    return "יש כאן כיוון, אבל עדיין מוקדם להסיק — כדאי לאסוף עוד קצת תרגול.";
  }

  if (excellent && !early && q >= 10 && ev === "strong") {
    return "התמונה כאן יציבה יחסית.";
  }
  if (ev === "strong" && suff === "strong" && !early && q >= 12) {
    return "התמונה כאן יציבה יחסית.";
  }

  if (needsPractice && m >= 5 && (early || suff === "medium" || ev === "medium")) {
    return "כדאי לעקוב עוד לפני שמשנים רמה.";
  }
  if (early || suff === "medium" || ev === "medium") {
    return "יש כאן כיוון, אבל עדיין מוקדם להסיק חד־משמעית.";
  }

  return "התמונה כאן מתחילה להתבהר — כדאי לעקוב בלי לשנות מהר.";
}

/**
 * משפט אחד אופציונלי במכתב המקצועי — רק כשיש כמה נושאים וכולם «מוקדמים»,
 * כדי לא לכפול את אותו המסר בכל כרטיס.
 *
 * @param {Record<string, unknown>} sp
 * @returns {string}
 */
export function subjectLetterReliabilityOptionalHe(sp) {
  const recs = Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : [];
  if (recs.length < 2) return "";
  if (!recs.every((tr) => tr?.isEarlySignalOnly)) return "";
  return "רוב מה שמופיע כאן עדיין נבנה מאט — כדאי לעקוב עוד קצת לפני שמסכמים על המקצוע כולו.";
}
