/**
 * מדיניות ניקוד תחרותי בעברית — Hebrew Master בלבד.
 * כיתות א׳–ב׳: ניקוד מלא (score, streak→points, XP, כוכבים, לוחות).
 * כיתות ג׳–ו׳: ללא צבירה תחרותית מהמסך (התקדמות/טעויות/זמן נשארים בדף).
 */

/**
 * @param {string|null|undefined} gradeKey e.g. "g1" … "g6"
 * @returns {boolean}
 */
export function isHebrewFullCompetitiveScoringGrade(gradeKey) {
  const k = String(gradeKey ?? "")
    .trim()
    .toLowerCase();
  return k === "g1" || k === "g2";
}
