/**
 * Phase C — parent coaching lines and script variants (deterministic, in-session only).
 * Text is generic framing around contract slots; no new facts beyond TruthPacket + scope label.
 */

/**
 * @param {object} [conv]
 * @param {string[]} [conv.priorIntents]
 * @param {number} [conv.repeatedPhraseHits]
 * @param {string} intent
 * @param {number} [turnOrdinal]
 * @returns {number}
 */
export function coachingVariantIndex(conv, intent, turnOrdinal = 0) {
  const pi = Array.isArray(conv?.priorIntents) ? conv.priorIntents.slice(-6).join("|") : "";
  const n = Number(conv?.repeatedPhraseHits) || 0;
  let h = 0;
  for (let i = 0; i < pi.length; i++) h = (h * 31 + pi.charCodeAt(i)) >>> 0;
  const s = String(intent || "");
  for (let i = 0; i < s.length; i++) h = (h * 17 + s.charCodeAt(i)) >>> 0;
  h = (h + (n % 11) * 5 + (conv?.priorIntents?.length || 0) + (Number(turnOrdinal) || 0) * 13) >>> 0;
  return h % 24;
}

/** @param {string} label */
function scopeSnippet(label) {
  const t = String(label || "").trim();
  if (t.length < 2) return "בנושא שנבחר";
  if (t.length > 32) return `בנושא «${t.slice(0, 30)}…»`;
  return `בנושא «${t}»`;
}

/** @type {Record<string, string[]>} */
const OBS_PREFIX = {
  understand_observation: [
    "מהדוח: ",
    "לפי השורה שהדוח מציג: ",
    "בקצרה — לפי הנתון בדוח: ",
    "כאן מדובר על מה שמופיע בדוח, בלי להרחיב מעבר לו: ",
  ],
  understand_meaning: [
    "לפי הדוח: ",
    "מה שמופיע בדוח מסכם כך: ",
    "",
    "בניסוח של הדוח: ",
  ],
  action_today: ["לפי הדוח: ", "מה שמוצג בדוח: ", "", "בקשר לאותו נתון בדוח: "],
  action_tomorrow: ["לפי הדוח: ", "מה שמוצג בדוח: ", "", "בהמשך לניסוח בדוח: "],
  action_week: ["לפי הדוח: ", "מה שמוצג בדוח: ", "", "בקשר לתמונה מהדוח: "],
  avoid_now: ["לפי הדוח: ", "מה שמוצג בדוח: ", "", "בזהירות ובהתאם למה שכתוב: "],
  advance_or_hold: ["לפי הדוח: ", "מה שמוצג בדוח: ", "", "בלי לקבוע מעבר לניסוח בדוח: "],
  explain_to_child: ["לפי הדוח: ", "מה שמופיע בדוח: ", "", "על בסיס אותו ניסוח בדוח: "],
  ask_teacher: ["לפי הדוח: ", "מה שמופיע בדוח: ", "", "מתוך מה שמופיע בדוח: "],
  uncertainty_boundary: ["לפי הדוח: ", "מה שמוצג בדוח: ", "", "בגבולות הניסוח בדוח: "],
};

/** @type {Record<string, string[]>} */
const MEANING_COACH = {
  understand_meaning: [
    "מבחינה הורית אפשר לשאול: איפה זה נוגע ביום־יום — בלי להרחיב מעבר למה שכתוב בדוח.",
    "אם זה ברור, אפשר להשאיר את זה כהסבר לעצמך ולהמשיך לצעד קטן רק כשמתאים.",
    "שווה לחבר את המשפט הזה לדוגמה קונקרטית מהבית, בלי לייצר מסקנה חדשה שלא מופיעה בדוח.",
    "נכון לעכשיו, מספיק להחזיק את המשמעות הזו כמסגרת ולא למהר לפעולה גדולה.",
  ],
  understand_observation: [
    "כהורה אפשר לקרוא את המספר הזה כסימן לכיוון, לא כסיפור מלא בפני עצמו.",
    "אם משהו לא ברור בשורה, אפשר לחזור אליה מאוחר יותר עם שאלה ממוקדת — עדיין בתוך גבולות הדוח.",
    "שימוש טוב: לציין לילד מה רואים בדוח בלי לתת ציון אישי על אופי.",
    "נכון לעכשיו, מספיק לזהות מה מודדים כאן ומה עדיין לא נאמר.",
  ],
  action_today: [
    "מהצד ההורי: עדיף צעד קטן אחד שניתן לבדוק היום, במקום רשימה ארוכה.",
    "אם זה נשמע הרבה, אפשר לבחור חלק אחד בלבד ולהשאיר את השאר לימים הבאים.",
    "כדאי לוודא שהצעד מתאים למצב בבית — בלי להוסיף מטרות שלא מופיעות בדוח.",
    "נכון לעכשיו, מספיק לפרק למשהו שאפשר לתאר לילד במשפט אחד.",
  ],
  action_tomorrow: [
    "מחר עדיף משהו שכבר «מוכן מראש» — משפט אחד למשפחה ומשימה קצרה.",
    "אם היום צפוף, אפשר להכין הערה קצרה היום כדי שלמחרה לא יידרשו החלטות ברגע האחרון.",
    "מהצד ההורי: עדיף לא לשבת את כל הערב על תכנון — מספיק כיוון אחד ברור.",
    "נכון לעכשיו, מספיק לבחור חלון זמן קצר מראש.",
  ],
  action_week: [
    "תוכנית לשבוע אמורה להישאר ריאלית: עדיף פחות פריטים שמחזיקים מעמד מאשר רשימה ארוכה.",
    "אפשר לתזמן חזרה קצרה באמצע השבוע ולראות אם הצעד עדיין מתאים.",
    "כהורים, שווה לשייך את התוכנית ליום קבוע קצר — לא להפוך את זה למבחן.",
    "נכון לעכשיו, עדיף מסגרת קלה שניתן לעדכן אחרי שבוע.",
  ],
  avoid_now: [
    "רשימת הימנעות עובדת טוב כשהיא קצרה וברורה — במיוחד כשמדובר בשבוע עמוס.",
    "אפשר לבחור דבר אחד להימנעות ממנו ולהשאיר את השאר לשיחה אחרת.",
    "כדאי לשמור על טון של הגנה על אנרגיה, לא על ביקורת על הילד.",
    "נכון לעכשיו, מספיק לזהות מוקד אחד שמסבך ולהקל עליו.",
  ],
  advance_or_hold: [
    "החלטה של קידום מול המתנה טובה כשהיא נשענת על אותם אותות שבדוח, לא על תחושת בטן בלבד.",
    "אפשר לכתוב לעצמכם שני משפטים: מתי מקדמים צעד קטן ומתי נשארים במקום.",
    "כהורים, לפעמים «להמתין» הוא צעד חכם — במיוחד כשהנתונים עדיין דקים.",
    "נכון לעכשיו, שווה לקבוע תאריך לבדיקה חוזרת במקום להחליט הכול היום.",
  ],
  explain_to_child: [
    "ניסוח לילד עדיף שיהיה קצר, בגובה העיניים, ובלי מילים מהדוח שהילד לא מכיר.",
    "אפשר לפתוח במשפט על מה שרואים ביחד ורק אז להוסיף משפט משמעות אחד.",
    "אם הילד שואל «למה», אפשר להישאר בתוך מה שהדוח אומר בלי לנבא עתיד.",
    "נכון לעכשיו, מספיק משפט אחד של עידוד ומשפט אחד של כיוון.",
  ],
  ask_teacher: [
    "שאלה טובה למורה היא ספציפית וקצרה — עם ציטוט מהדוח אם צריך.",
    "אפשר לסדר מראש מה רוצים לשמוע בתשובה (מדד, דוגמה, המלצה הבאה).",
    "כדאי לשמור על שפה שיתופית: «איך נוכל לתמוך בבית» במקום האשמה.",
    "נכון לעכשיו, עדיף שאלה אחת ממוקדת מאשר רשימה ארוכה.",
  ],
  uncertainty_boundary: [
    "כשיש חוסר ודאות, עדיף לא למלא את החלל עם הסברים שלא מופיעים בדוח.",
    "אפשר לרשום לעצמכם מה כן יודעים מהדוח ומה עדיין פתוח — זה מוריד לחץ.",
    "כהורים, לפעמים הכי מועיל הוא להגדיר מתי בודקים שוב במקום לסגור היום.",
    "נכון לעכשיו, מספיק להחזיק את הסימן השאלה ולפעול בצעדים קטנים.",
  ],
};

/** @type {Record<string, string[]>} */
const NEXT_STEP_COACH = {
  action_today: [
    "לפני ביצוע: שווה לוודא שהצעד קטן מספיק שיהיה ברור מתי סיימנו אותו.",
    "מהצד ההורי: עדיף משהו שניתן לתאר לילד במשפט אחד.",
    "אם יש התנגדות, אפשר לקצר עוד יותר ולהישאר על חלק אחד בלבד.",
    "נכון לעכשיו, מספיק ניסיון קצר שניתן לחזור עליו מחר.",
  ],
  action_tomorrow: [
    "להמשך מחר: אפשר להכין הערה קצרה היום כדי שלמחרה לא יידרשו החלטות ברגע האחרון.",
    "שווה לבחור חלון זמן קצר מראש — לא משימה שפותחת ויכוח ארוך.",
    "מהצד ההורי: עדיף משהו שמתאים ליום שאחרי בית ספר, לא לשיא העומס.",
    "נכון לעכשיו, מספיק להגדיר «מה עושים במשך חמש דקות».",
  ],
  action_week: [
    "לשבוע הקרוב: עדיף שלושה צעדים קטנים שמחזיקים מאשר עשרה שלא מתקדמים.",
    "אפשר לשבץ יום אחד בלי משימה — כדי לאפשר ספיגה.",
    "מהצד ההורי: שווה לתאם מראש מי אחראי על מה, בלי הנחות.",
    "נכון לעכשיו, מספיק מסגרת שבועית שניתן לעדכן בסוף השבוע.",
  ],
};

/** @param {object} truthPacket */
function personalizedLine(truthPacket, ix) {
  const label = truthPacket?.scopeLabel || "";
  const snip = scopeSnippet(label);
  const pool = [
    `${snip} — אפשר לקרוא את התשובה כהדרכה מעשית, לא כהערכת אישיות.`,
    `${snip} שווה לשמור על קשר בין מה שכתוב בדוח לבין מה שאפשר לבצע בבית בפועל.`,
    `${snip} אם משהו לא מתיישב עם המצב בבית, עדיף לקצר צעד מאשר להרחיב מסקנה.`,
    `${snip} נכון לעכשיו, מספיק להחזיק את המידע כמסגרת ולעדכן אחרי תרגול נוסף.`,
  ];
  return pool[ix % pool.length];
}

/**
 * @param {Array<{ type: string; textHe: string; source: string }>} blocks
 * @param {{
 *   intent: string;
 *   truthPacket: object;
 *   conversationState?: object;
 *   continuityRepeat?: boolean;
 *   turnOrdinal?: number;
 * }} ctx
 */
export function applyParentCoachingPacks(blocks, ctx) {
  const intent = String(ctx.intent || "");
  const conv = ctx.conversationState || {};
  const turnOrd =
    ctx.turnOrdinal != null ? Number(ctx.turnOrdinal) : Number(conv?.priorIntents?.length) || 0;
  const ix = coachingVariantIndex(conv, intent, turnOrd);
  const hits = Number(conv.repeatedPhraseHits) || 0;
  const effIx = hits >= 2 ? ix % 4 : ix;
  const cont = !!ctx.continuityRepeat;

  /** @type {Array<{ type: string; textHe: string; source: string }>} */
  const out = [];

  const obsArr = OBS_PREFIX[intent] || ["לפי הדוח: ", "", "מה שמוצג בדוח: ", "בקשר לנתון בדוח: "];
  const obsPrefix = obsArr[effIx % obsArr.length];

  const meaningLines = MEANING_COACH[intent];
  const addMeaningCoach = Array.isArray(meaningLines) && meaningLines.length > 0;
  const meaningCoachText = addMeaningCoach ? meaningLines[effIx % meaningLines.length] : "";

  let meaningEmitted = 0;

  for (const b of blocks) {
    if (b.type === "observation" && b.source === "contract_slot" && String(b.textHe || "").trim()) {
      out.push({ ...b, textHe: obsPrefix + String(b.textHe).trim() });
      continue;
    }

    if (b.type === "meaning" && b.source === "contract_slot") {
      out.push(b);
      meaningEmitted += 1;
      if (addMeaningCoach && meaningEmitted === 1 && meaningCoachText) {
        out.push({ type: "meaning", textHe: meaningCoachText, source: "composed" });
        if (cont) {
          out.push({
            type: "meaning",
            textHe: personalizedLine(ctx.truthPacket, effIx + 3),
            source: "composed",
          });
        }
      }
      continue;
    }

    if (b.type === "next_step" && b.source === "contract_slot" && intent.startsWith("action")) {
      const arr = NEXT_STEP_COACH[intent] || NEXT_STEP_COACH.action_week;
      const line = arr[effIx % arr.length];
      if (line) {
        out.push({ type: "next_step", textHe: line, source: "composed" });
      }
      out.push(b);
      continue;
    }

    out.push(b);
  }

  return out;
}

/**
 * @param {object} dl
 * @param {string} intent
 * @param {number} ix
 */
export function pickUncertaintyReasonScript(dl, intent, ix) {
  const cannot = !!dl.cannotConcludeYet;
  const low = String(dl.confidenceBand || "") === "low";

  if (cannot) {
    const lines = [
      "לפי חוזי הדוח עדיין לא ניתן לסגור מסקנה יציבה — ממשיכים באיסוף תרגול ומעקב.",
      "הדוח עדיין לא מאפשר לסגור מסקנה חד־משמעית; נכון לעכשיו נשארים במעקב ובתרגול ממוקד.",
      "כשלא ניתן לסגור עדיין, עדיף לפרק לצעדים קטנים של איסוף מידע מאשר לנחש.",
      "לפי הגבולות בחוזה: אין עדיין «נקודת סיום» למסקנה; ממשיכים בזהירות ובמדידה חוזרת.",
    ];
    return lines[ix % lines.length];
  }
  if (low) {
    const lines = [
      "רמת הביטחון בנתונים נמוכה בטווח הזה, ולכן נשמרת זהירות בניסוח.",
      "כשהביטחון נמוך, נכון לעכשיו נשמרים קרוב למה שכתוב בדוח ולא מרחיבים הערכה.",
      "הנתונים כאן דקים מדי כדי לקבוע בביטחון; עדיף להחזיק שאלות פתוחות ולבדוק שוב בהמשך.",
      "במצב של ביטחון נמוך, המסגרת ההורית היא זהירות ותיעדוף של מדידה חוזרת.",
    ];
    return lines[ix % lines.length];
  }
  const lines = [
    "ההמלצות כאן משקפות את אותו מקור נתונים שבדוח בלבד, בלי הרחבה מעבר לו.",
    "מה שמופיע כאן נשען על אותו ניסוח שבדוח; אם משהו חסר, נשארים בתוך מה שמופיע שם.",
    "נכון לעכשיו, אין כאן מידע שלא מגיע מהדוח — כך שומרים על עקביות מול המורה והילד.",
    "כהורה, אפשר להשתמש בזה כמילון משמעויות לדוח, בלי להוסיף שכבת פרשנות חיצונית.",
  ];
  if (intent === "uncertainty_boundary") {
    const extra = [
      ...lines,
      "זה בדיוק המקום לשאול מה עוד חסר בדוח כדי להרגיש בטוחים יותר — לא למלא חוסר בדיעות.",
    ];
    return extra[ix % extra.length];
  }
  return lines[ix % lines.length];
}
