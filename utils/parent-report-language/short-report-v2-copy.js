/**
 * דוח הורים קצר (V2) — ניסוח הורי בלבד, פרמטרים בלבד.
 */

/** @param {string} subjectLabel @param {number} q */
export function insufficientSubjectQuestionsLineHe(subjectLabel, q) {
  const n = Math.max(0, Number(q) || 0);
  return `${subjectLabel}: ${n} שאלות בטווח התקופה — עדיין מעט לסיכום מלא`;
}

export function tierStableStrengthHe() {
  return "חוזק יציב";
}

export function tierWeaknessRecurringHe() {
  return "קושי חוזר";
}

export function tierWeaknessSupportHe() {
  return "תחום לחיזוק";
}

export function evidenceExampleTitleFallbackHe() {
  return "נושא שנבדק";
}

export function evidenceExampleBodyFallbackHe() {
  return "עדיין אין מספיק פרטים כדי לנסח הסבר ארוך — כדאי להמשיך בתרגול.";
}

export function v2SubjectMemoryPartialEvidenceHe() {
  return "בחלק מהנושאים עדיין מעט תרגול — עוד כמה שאלות לפני מסקנה חזקה.";
}

export function v2SubjectDiagnosticRestraintHe() {
  return "לא מסיקים מסקנה חזקה בכל הנושאים עד שיצטבר עוד תרגול עקבי.";
}
