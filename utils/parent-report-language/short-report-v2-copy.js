/**
 * דוח הורים קצר (V2) — ניסוח הורי בלבד, פרמטרים בלבד.
 */

/** @param {string} subjectLabel @param {number} q */
export function insufficientSubjectQuestionsLineHe(subjectLabel, q) {
  const n = Math.max(0, Number(q) || 0);
  return `${subjectLabel}: ${n} שאלות בטווח התקופה — עדיין מעט מדי לסיכום עשיר, אבל אפשר לקבל כיוון ראשוני`;
}

export function tierStableStrengthHe() {
  return "חוזק שמחזיק";
}

export function tierWeaknessRecurringHe() {
  return "קושי שחוזר על עצמו";
}

export function tierWeaknessSupportHe() {
  return "מקום לחיזוק עדין";
}

export function evidenceExampleTitleFallbackHe() {
  return "נושא שנבדק";
}

export function evidenceExampleBodyFallbackHe() {
  return "עדיין אין מספיק פרטים כאן כדי להאריך — עדיף להמשיך בתרגול קצר ואז לחזור לניסוח.";
}

export function v2SubjectMemoryPartialEvidenceHe() {
  return "בחלק מהנושאים עדיין מעט תרגול — עוד כמה שאלות יעשו את התמונה ברורה יותר.";
}

export function v2SubjectDiagnosticRestraintHe() {
  return "לא סוגרים מסקנה חזקה על כל הנושאים בבת אחת — עדיף לתת לתרגול עקבי עוד זמן.";
}
