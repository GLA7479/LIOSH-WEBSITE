/**
 * Map engine confidence levels → parent-facing Hebrew (no raw enums in UI).
 * @param {string|null|undefined} level
 * @returns {string}
 */
export function confidenceLevelParentSummaryHe(level) {
  const k = String(level || "").trim();
  switch (k) {
    case "high":
      return "הנתונים יציבים יחסית — אפשר לנסח כיוון ברור.";
    case "moderate":
      return "הנתונים בינוניים — נשמור על ניסוח זהיר ונבדוק בתרגולים הבאים.";
    case "low":
      return "הנתונים דלים — נשאר עם מסקנות זהירות; עוד תרגול יבהיר את התמונה.";
    case "early_signal_only":
      return "זה עדיין אות מוקדם — לא נמהרים למסקנה חזקה.";
    case "insufficient_data":
      return "כרגע אין מספיק נתונים כדי לקבוע מסקנה יציבה בנושא הזה.";
    case "contradictory":
      return "התוצאות לא מסתדרות זו עם זו — עוד קצת תרגול לפני מסקנה.";
    default:
      return "כרגע אין מספיק נתונים כדי לקבוע מסקנה יציבה בנושא הזה.";
  }
}
