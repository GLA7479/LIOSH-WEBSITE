/**
 * Short parent report — how we describe diagnostic data source (no engine jargon).
 * @param {string} source raw `report.diagnosticPrimarySource`
 */
export function diagnosticPrimarySourceParentLabelHe(source) {
  const s = String(source || "").trim();
  if (s === "diagnosticEngineV2") return "האבחון מבוסס על ניתוח מעודכן של פעילות התרגול בתקופה.";
  if (s === "legacy_patternDiagnostics_fallback") {
    return "חלק מהאבחון מבוסס על שיטה קודמת (פחות נתונים מעודכנים) — כדאי לקרוא בזהירות.";
  }
  return "מקור האבחון לא זוהה בבירור — מומלץ להמשיך בתרגול ולבדוק שוב מאוחר יותר.";
}
