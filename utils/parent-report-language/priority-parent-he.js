/**
 * Map diagnostic priority codes → parent-facing Hebrew (never show P1–P4 to parents).
 * @param {string|null|undefined} level
 * @returns {string|null}
 */
export function priorityLevelParentLabelHe(level) {
  const k = String(level || "").trim().toUpperCase();
  if (!k) return null;
  switch (k) {
    case "P4":
      return "תשומת לב גבוהה השבוע — לטפל קודם בנושאים האלה.";
    case "P3":
      return "לשים לב ולתאם קצב תרגול הדוק יותר השבוע.";
    case "P2":
      return "מעקב שבועי רגיל, עם דגש על ייצוב.";
    case "P1":
      return "מעקב רגיל — בלי חריגה דחופה.";
    default:
      return null;
  }
}
