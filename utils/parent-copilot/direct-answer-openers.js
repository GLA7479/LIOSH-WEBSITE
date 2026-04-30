/**
 * Short parent-facing direct openers (behavior class), prepended before grounded contract text.
 * Must stay bounded and non-meta; specifics follow from contract slots.
 */

/**
 * @param {string} intent
 * @param {object} truthPacket
 */
export function parentDirectOpenerHe(intent, truthPacket) {
  const k = String(intent || "").trim();
  const dl = truthPacket?.derivedLimits || {};
  const exec = String(truthPacket?.scopeType || "") === "executive";
  const recOk = !!dl.recommendationEligible && String(dl.recommendationIntensityCap || "RI0") !== "RI0";
  const fragile = !!dl.cannotConcludeYet || String(dl.confidenceBand || "") === "low" || String(dl.readiness || "") === "insufficient";

  switch (k) {
    case "explain_report":
      return exec
        ? "לפני הפרטים: הדוח מתאר כרגע את מה שכבר נכתב לגבי התקופה — לא תמונה מלאה מעבר לזה."
        : "לפני הפרטים: כאן מרוכז מה שהדוח אומר על הנושא שנבחר בטווח התקופה.";
    case "what_is_most_important":
      return fragile
        ? "מה לעשות קודם זה לא «להחליט הכול היום», אלא לטפל במה שהדוח עדיין מציג כפתוח או זהיר."
        : "אפשר לסדר מה חשוב קודם לפי מה שהדוח כבר מנסח בבירור — בלי להרחיב מעבר לזה.";
    case "what_to_do_today":
    case "what_to_do_this_week":
      return recOk
        ? "יש בדוח בסיס לצעד קטן ומדיד — לא לתוכנית ארוכה שלא נשענת על אותו ניסוח."
        : "עדיין אין בדוח בסיס חזק מספיק לצעד גדול; עדיף משהו זעיר או המתנה עד שייתווסף תרגול.";
    case "why_not_advance":
      return "עצירת עלייה ברמה או האטה מופיעות בדוח כשהניסוח עדיין לא סוגר מספיק — לא בהכרח כישלון.";
    case "what_is_going_well":
      return "מה שמסומן בדוח כחזק הוא מה שנמדד שם כרגע בצורה די עקבית — לא הערכת אופי.";
    case "what_is_still_difficult":
      return "מה שמסומן כקשה הוא מה שהדוח עדיין מציג כדורש חיזוק — לא סיבה לפאניקה לבדה.";
    case "how_to_tell_child":
      return "עדיף משפט אחד רגוע על מה שרואים בדוח, ורק אז משפט משמעות אחד — בלי מילים שהילד לא מכיר.";
    case "question_for_teacher":
      return "שאלה טובה למורה היא קצרה ומצביעה על מה שמופיע בדוח — לא רשימת תלונות.";
    case "is_intervention_needed":
      return fragile
        ? "לפי הניסוח בדוח זה נראה עדיין מוקדם לקביעה חדה — זה לא אומר בהכרח «בעיה חמורה»."
        : "לפי מה שמופיע בדוח אין כאן אות לדאגה גורפת — עדיין נכון לעקוב שגרתי.";
    case "clarify_term":
      return "נשארים עם המילים שמופיעות בדוח עצמו — בלי להמציא מונח חדש.";
    case "strength_vs_weakness_summary":
      return "הדוח נותן שני כיוונים — מה נראה חזק יותר כרגע ומה עדיין דורש עבודה — בתוך אותו טווח נתונים.";
    default:
      return exec
        ? "זה מה שהדוח נותן כרגע לגבי התקופה — לא מעבר."
        : "זה מה שהדוח נותן כאן — לא מעבר.";
  }
}

export default { parentDirectOpenerHe };
