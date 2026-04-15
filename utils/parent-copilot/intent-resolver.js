/**
 * Deterministic Hebrew keyword → intent mapping (v1).
 * @param {string} utterance
 */
export function resolveIntent(utterance) {
  const t = String(utterance || "")
    .trim()
    .toLowerCase();

  if (/מה\s*לעשות\s*היום|היום\s*מה|פעולה\s*היום/.test(t)) return "action_today";
  if (/מחר|להמשך\s*מחר/.test(t)) return "action_tomorrow";
  if (/השבוע|שבוע\s*הקרוב|מה\s*לעשות\s*בשבוע/.test(t)) return "action_week";
  if (/מה\s*לא\s*לעשות|להימנע|לא\s*כדאי\s*עכשיו|avoid/.test(t)) return "avoid_now";
  if (/להתקדם|לעצור|להמתין|advance|hold/.test(t)) return "advance_or_hold";
  if (/איך\s*להסביר|להסביר\s*לילד|לילד/.test(t)) return "explain_to_child";
  if (/מורה|בבית\s*הספר|לשאול\s*את/.test(t)) return "ask_teacher";
  if (/לא\s*ברור|חוסר\s*ודאות|ביטחון\s*נמוך|uncertain/.test(t)) return "uncertainty_boundary";
  if (/מה\s*רואים|מה\s*נמדד|נתונים|מדדים|observation/.test(t)) return "understand_observation";
  if (/משמעות|מה\s*זה\s*אומר|למה|מסקנה|פירוש/.test(t)) return "understand_meaning";

  return "understand_meaning";
}
