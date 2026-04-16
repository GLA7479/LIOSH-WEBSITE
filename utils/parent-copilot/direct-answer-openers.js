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
        ? "בקצרה: הדוח מתאר כרגע את מה שכבר נכתב בניסוחים מעוגנים לתקופה — לא תמונה מלאה מעבר לזה."
        : "בקצרה: כאן מרוכז מה שהדוח אומר על הנושא שנבחר בטווח התקופה.";
    case "what_is_most_important":
      return fragile
        ? "בקצרה: עדיפות ראשונה היא לא «להחליט הכול היום», אלא לטפל במה שהדוח עדיין מציג כפתוח או זהיר."
        : "בקצרה: אפשר לסדר עדיפות לפי מה שהדוח מציג כבר ברור בניסוח — בלי להרחיב מעבר לו.";
    case "what_to_do_today":
    case "what_to_do_this_week":
      return recOk
        ? "בקצרה: יש בסיס בדוח לצעד קטן ומדיד — לא לתוכנית ארוכה שלא נשענת על אותו ניסוח."
        : "בקצרה: עדיין אין בדוח בסיס חזק מספיק לצעד גדול; עדיף משהו זעיר או המתנה עד שייתווסף תרגול.";
    case "why_not_advance":
      return "בקצרה: עצירת קידום או האטה מופיעות בדוח כשהניסוח עדיין לא סוגר מספיק — לא בהכרח כישלון.";
    case "what_is_going_well":
      return "בקצרה: מה שמסומן בדוח כחזק הוא מה שנמדד שם כרגע כיציב יחסית — לא הערכת אופי.";
    case "what_is_still_difficult":
      return "בקצרה: מה שמסומן כקשה הוא מה שהדוח עדיין מציג כדורש חיזוק — לא סיבה לפאניקה לבדה.";
    case "how_to_tell_child":
      return "בקצרה: עדיף משפט אחד רגוע על מה שרואים בדוח, ורק אז משפט משמעות אחד — בלי מילים שהילד לא מכיר.";
    case "question_for_teacher":
      return "בקצרה: שאלה טובה למורה היא קצרה ומצביעה על מה שמופיע בדוח — לא רשימת תלונות.";
    case "is_intervention_needed":
      return fragile
        ? "בקצרה: לפי הניסוח בדוח זה נראה עדיין מוקדם לקביעה חדה — זה לא אומר בהכרח «בעיה חמורה»."
        : "בקצרה: לפי מה שמופיע בדוח אין כאן אות לדאגה גורפת — עדיין נכון לעקוב שגרתי.";
    case "clarify_term":
      return "בקצרה: נשארים עם המילים שמופיעות בדוח עצמו — בלי להמציא מונח חדש.";
    case "strength_vs_weakness_summary":
      return "בקצרה: הדוח נותן שני כיוונים — מה נראה יחסית חזק ומה עדיין דורש עבודה — בתוך אותו טווח נתונים.";
    default:
      return exec
        ? "בקצרה: זה מה שהדוח מספק כרגע בניסוחים המעוגנים — לא מעבר."
        : "בקצרה: זה מה שהדוח מספק כאן בניסוח המעוגן — לא מעבר.";
  }
}

export default { parentDirectOpenerHe };
