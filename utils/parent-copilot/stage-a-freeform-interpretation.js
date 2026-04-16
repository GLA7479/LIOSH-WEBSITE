/**
 * Stage A — free-form parent question interpretation (deterministic).
 * Output is the product interpretation object; not display copy and not final scope entity.
 */

import { normalizeFreeformParentUtteranceHe, foldUtteranceForHeMatch } from "./utterance-normalize-he.js";
import { SUBJECT_ORDER, subjectLabelHe } from "./contract-reader.js";

/**
 * @typedef {(
 *   "explain_report" |
 *   "what_is_most_important" |
 *   "what_to_do_today" |
 *   "what_to_do_this_week" |
 *   "why_not_advance" |
 *   "what_is_going_well" |
 *   "what_is_still_difficult" |
 *   "how_to_tell_child" |
 *   "question_for_teacher" |
 *   "is_intervention_needed" |
 *   "strength_vs_weakness_summary" |
 *   "clarify_term" |
 *   "unclear"
 * )} CanonicalParentIntent
 */

/**
 * @typedef {(
 *   "executive" |
 *   "subject" |
 *   "topic" |
 *   "recommendation" |
 *   "confidence_uncertainty" |
 *   "strengths" |
 *   "weaknesses" |
 *   "blocked_advance"
 * )} ScopeClass
 */

/** @type {CanonicalParentIntent[]} */
export const CANONICAL_PARENT_INTENTS = [
  "explain_report",
  "what_is_most_important",
  "what_to_do_today",
  "what_to_do_this_week",
  "why_not_advance",
  "what_is_going_well",
  "what_is_still_difficult",
  "how_to_tell_child",
  "question_for_teacher",
  "is_intervention_needed",
  "strength_vs_weakness_summary",
  "clarify_term",
  "unclear",
];

/**
 * @param {unknown} payload
 */
function listAnchoredTopicRows(payload) {
  /** @type {Array<{ subjectId: string; topicRowKey: string; displayName: string }>} */
  const out = [];
  const profiles = Array.isArray(payload?.subjectProfiles) ? payload.subjectProfiles : [];
  const bySubject = Object.fromEntries(profiles.map((sp) => [String(sp?.subject || ""), sp]));
  for (const sid of SUBJECT_ORDER) {
    const sp = bySubject[sid];
    const list = Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : [];
    for (const tr of list) {
      const displayNameHe = String(tr?.displayName || "").trim();
      const displayNameFolded = foldUtteranceForHeMatch(displayNameHe);
      const topicRowKey = String(tr?.topicRowKey || tr?.topicKey || "").trim();
      const nar = tr?.contractsV1?.narrative;
      const anchored = !!(nar && typeof nar === "object" && String(nar?.textSlots?.observation || "").trim());
      if (!topicRowKey || displayNameFolded.length < 2 || !anchored) continue;
      out.push({ subjectId: sid, topicRowKey, displayName: displayNameFolded, displayNameHe });
    }
  }
  return out;
}

/**
 * @param {string} utteranceFolded
 * @param {unknown} payload
 */
function extractTopicHint(utteranceFolded, payload) {
  const rows = listAnchoredTopicRows(payload);
  let best = null;
  for (const row of rows) {
    if (
      utteranceFolded.includes(row.displayName) &&
      (!best || row.displayName.length > best.displayName.length)
    ) {
      best = {
        subjectId: row.subjectId,
        topicRowKey: row.topicRowKey,
        displayName: row.displayNameHe || row.displayName,
      };
    }
  }
  return best;
}

/**
 * @param {string} utteranceFolded
 * @param {unknown} payload
 */
function extractSubjectHint(utteranceFolded, payload) {
  const profiles = Array.isArray(payload?.subjectProfiles) ? payload.subjectProfiles : [];
  const present = new Set(profiles.map((p) => String(p?.subject || "")).filter(Boolean));
  const pairs = [];
  for (const sid of SUBJECT_ORDER) {
    if (!present.has(sid)) continue;
    const lf = foldUtteranceForHeMatch(subjectLabelHe(sid));
    if (lf.length < 2) continue;
    pairs.push({ id: sid, fold: lf });
  }
  pairs.sort((a, b) => b.fold.length - a.fold.length);
  for (const { id, fold } of pairs) {
    if (fold.length >= 4 && utteranceFolded.includes(fold)) return { subjectId: id, labelFolded: fold };
    if (
      fold.length >= 2 &&
      (utteranceFolded === fold ||
        utteranceFolded.startsWith(`${fold} `) ||
        utteranceFolded.endsWith(` ${fold}`) ||
        utteranceFolded.includes(` ${fold} `))
    ) {
      return { subjectId: id, labelFolded: fold };
    }
  }
  return null;
}

/**
 * @param {string} t
 */
function inferTimeframeHint(t) {
  if (/היום|עכשיו|היום\s*בבית|היום\s*בערב/.test(t)) return "today";
  if (/השבוע|שבוע\s*הקרוב|בשבוע|השבוע\s*הזה/.test(t)) return "week";
  if (/תקופ|בדוח|בטווח|החודש|התקופה/.test(t)) return "period";
  return "none";
}

/**
 * @param {string} t
 */
function inferToneHint(t) {
  if (/דאג|חושש|לחוץ|מודאג|פחד|לא\s+יוצא|לא\s*הולך/.test(t)) return "worried";
  if (/מצוין|מעולה|שמח|מתרשם|גאה|מעודד/.test(t)) return "encouraging";
  return "neutral";
}

/** @type {Record<CanonicalParentIntent, RegExp[]>} */
const INTENT_PARAPHRASES = {
  explain_report: [
    /תמונת\s*מצב|איך\s*נראית\s*תמונת|איך\s*נראית\s*התמונה|מבט\s*על\s*הדוח|מבט\s*כללי/u,
    /מה\s*רואים|מה\s*נמדד|מה\s*כתוב\s*בדוח|מה\s*הנתונים|מה\s*מופיע|תמונת\s*מצב|סיכום\s*הדוח|מה\s*המצב\s*בדוח|מה\s*המצב\s*בנושא|איך\s*המצב|מה\s*קורה\s*בדוח|מה\s*קורה\s*בנושא/u,
    /הסבר\s*על\s*הדוח|מה\s*אומר\s*הדוח|מה\s*מספרים\s*אומרים|מה\s*המספרים|נתוני\s*התקופה/u,
    /בוא\s*נסביר\s*את\s*הדוח|תן\s*לי\s*סיכום|תני\s*לי\s*סיכום|מה\s*עשינו\s*בתקופה/u,
    /מה\s*למדנו\s*מהדוח|מה\s*אפשר\s*ללמוד\s*מהדוח|מה\s*התקדמות\s*לפי\s*הדוח/u,
    /איך\s*נראה\s*הדוח|איך\s*נראית\s*התקופה|מה\s*המצב\s*הכללי/u,
    /מה\s*המצב|מה\s*התמונה|תמונה\s*כללית|מבט\s*על/u,
    /פרטי\s*הדוח|תוכן\s*הדוח|מה\s*יש\s*בדוח/u,
    /הסבר\s*קצר|תסביר\s*לי\s*את\s*הדוח/u,
  ],
  what_is_most_important: [
    /להתקדם\s*או\s*להמתין|לחכות\s*או\s*להמשיך|להמשיך\s*או\s*להמתין|להמתין\s*או\s*להתקדם|כדאי\s*להתקדם/u,
    /מה\s*הכי\s*חשוב|מה\s*חשוב\s*ביותר|מה\s*העיקר|על\s*מה\s*להתמקד|מה\s*דחוף|מה\s*דורש\s*תשומת\s*לב\s*ראשונה/u,
    /מה\s*הדבר\s*הראשון|מה\s*לטפל\s*בו\s*קודם|מה\s*הכי\s*דחוף|מה\s*הכי\s*קריטי/u,
    /איפה\s*להתחיל|מאיפה\s*להתחיל|מה\s*העדיפות/u,
    /מה\s*הכי\s*חשוב\s*כרגע|מה\s*הכי\s*חשוב\s*עכשיו|מה\s*הכי\s*חשוב\s*היום/u,
    /מה\s*לשים\s*על\s*הכוונת|מה\s*לשים\s*בראש/u,
    /מה\s*הכי\s*בולט\s*לטיפול|מה\s*דורש\s*טיפול\s*ראשון/u,
    /מה\s*הכי\s*משמעותי|מה\s*משמעותי\s*ביותר/u,
    /מה\s*הכי\s*חשוב\s*לשים\s*לב/u,
  ],
  what_to_do_today: [
    /מה\s*הצעד\s*להיום|הצעד\s*להיום|צעד\s*קטן\s*להיום|פעולה\s*להיום|משימה\s*קטנה\s*להיום/u,
    /מה\s*מומלץ\s*לעשות\s*היום|מומלץ\s*לעשות\s*היום|מה\s*מומלץ\s*היום/u,
    /מה\s*לעשות\s*היום|מה\s*עושים\s*היום|מה\s*הצעד\s*היום|צעד\s*קטן\s*היום|היום\s*מה\s*לעשות|מה\s*לעשות\s*עכשיו/u,
    /מה\s*לעשות\s*הערב|מה\s*לעשות\s*אחרי\s*הבית\s*ספר|פעולה\s*להיום/u,
    /מה\s*לעשות\s*מיד|מה\s*לעשות\s*כעת|מה\s*עושים\s*עכשיו/u,
    /תכנון\s*ליום|משימה\s*להיום|משימות\s*להיום/u,
    /מה\s*לתרגל\s*היום|תרגול\s*להיום|מה\s*לחזק\s*היום/u,
    /מה\s*לעשות\s*בבית\s*היום|מה\s*לעשות\s*היום\s*בבית/u,
    /צעד\s*אחד\s*היום|דבר\s*אחד\s*להיום/u,
    /מה\s*המלצה\s*להיום|מה\s*מומלץ\s*היום/u,
  ],
  what_to_do_this_week: [
    /^מחר\s*\??$/u,
    /במה\s*להתמקד\s*השבוע|להתמקד\s*השבוע|מה\s*חשוב\s*השבוע/u,
    /מה\s*הכי\s*חשוב\s*עכשיו\s*בבית|מה\s*הכי\s*חשוב\s*בבית\s*השבוע|מה\s*הכי\s*חשוב\s*עכשיו\s*לבית/u,
    /מה\s*היית\s*מציע\s*לימים\s*הקרובים|מה\s*היית\s*מציע\s*לנו\s*לימים\s*הקרובים|מה\s*להתמקד\s*בימים\s*הקרובים/u,
    /מה\s*כדאי\s*לעשות\s*בשבוע|כדאי\s*לעשות\s*בשבוע\s*הקרוב|מה\s*לעשות\s*בשבוע\s*הקרוב/u,
    /מה\s*לעשות\s*השבוע|מה\s*לעשות\s*בשבוע|תוכנית\s*לשבוע|השבוע\s*מה\s*לעשות|שבוע\s*הקרוב/u,
    /מה\s*לעשות\s*בשבוע\s*הזה|מה\s*לעשות\s*בשבוע\s*הקרוב|תכנון\s*שבועי/u,
    /איך\s*לחלק\s*לשבוע|חלוקה\s*לשבוע|יעדים\s*לשבוע/u,
    /מה\s*המלצה\s*לשבוע|מה\s*מומלץ\s*לשבוע|תוכנית\s*עבודה\s*לשבוע/u,
    /מה\s*לתרגל\s*השבוע|תרגול\s*לשבוע/u,
    /מה\s*לעשות\s*בימים\s*הקרובים|מה\s*לעשות\s*השבוע\s*בבית/u,
    /שבוע\s*קדימה|השבוע\s*הבא/u,
    /מסלול\s*לשבוע|מפת\s*דרכים\s*לשבוע/u,
  ],
  why_not_advance: [
    /למה\s*לא\s*להתקדם|למה\s*לא\s*להעלות\s*רמה|למה\s*לעצור\s*כאן|מה\s*הסיבה\s*שלא\s*ממשיכים/u,
    /למה\s*אתה\s*לא\s*ממליץ\s*להעלות\s*רמה|למה\s*לא\s*ממליצים\s*להעלות\s*רמה/u,
    /למה\s*לא\s*מתקדמים|למה\s*לא\s*מתקדם|למה\s*עדיין\s*לא|למה\s*לא\s*עולים\s*רמה|למה\s*נשארים/u,
    /למה\s*לא\s*מקדמים|למה\s*לא\s*מקדמים\s*רמה|למה\s*לא\s*עולים/u,
    /למה\s*לא\s*משפרים|למה\s*אין\s*קידום|למה\s*הקידום\s*נעצר/u,
    /למה\s*עדיין\s*באותה\s*רמה|למה\s*לא\s*משתנה\s*הרמה/u,
    /מה\s*חוסם\s*קידום|מה\s*עוצר\s*קידום|מה\s*מעכב/u,
    /למה\s*לא\s*עולים\s*שלב|למה\s*לא\s*עולים\s*דרגה/u,
    /למה\s*לא\s*מתקדמים\s*רמה|למה\s*לא\s*מתקדמים\s*שלב/u,
    /למה\s*נתקעים|למה\s*זה\s*נתקע/u,
  ],
  what_is_going_well: [
    /מקצוע\s*החזק|המקצוע\s*החזק|מה\s*המקצוע\s*החזק|המקצוע\s*החזק\s*ביותר/u,
    /מה\s*הולך\s*טוב|מה\s*עובד\s*טוב|מה\s*חזק|איפה\s*החוזקות|מה\s*מצוין|מה\s*טוב\s*בדוח/u,
    /מה\s*משתפר|איפה\s*יש\s*הצלחה|מה\s*ההצלחות|מה\s*עובד|מה\s*יציב/u,
    /מה\s*הילד\s*מצליח|איפה\s*יש\s*חיזוק|מה\s*חיובי/u,
    /מה\s*בולט\s*לטובה|מה\s*מרגיש\s*טוב|מה\s*נראה\s*טוב/u,
    /נקודות\s*חוזק|חוזקות|מה\s*עובד\s*במקצוע/u,
    /איפה\s*הכי\s*טוב|איפה\s*הכי\s*חזק|מה\s*הכי\s*טוב/u,
    /מה\s*משביע\s*רצון|מה\s*מרשים/u,
    /מה\s*התקדמות\s*חיובית|מה\s*משתפר\s*בדוח/u,
  ],
  what_is_still_difficult: [
    /מה\s*לא\s*כדאי\s*לעשות|מה\s*לא\s*לעשות\s*עכשיו|לא\s*כדאי\s*עכשיו|מה\s*לא\s*לעשות|להימנע\s*מ/u,
    /מה\s*עדיין\s*קשה|מה\s*קשה|איפה\s*הקושי|מה\s*דורש\s*חיזוק|מה\s*חלש|מה\s*מתקשים/u,
    /מה\s*עדיין\s*לא\s*יושב|מה\s*לא\s*יושב|מה\s*לא\s*הולך|מה\s*לא\s*צולח/u,
    /איפה\s*החולשות|מה\s*החולשות|מה\s*חלש\s*בדוח/u,
    /מה\s*דורש\s*עבודה|מה\s*דורש\s*תרגול|מה\s*עדיין\s*נופל/u,
    /מה\s*עדיין\s*בעייתי|מה\s*בעייתי|מה\s*עדיין\s*קורה/u,
    /מה\s*הכי\s*קשה|מה\s*הכי\s*חלש|איפה\s*הכי\s*קשה/u,
    /מה\s*לא\s*מסתדר|מה\s*לא\s*סגור|מה\s*עדיין\s*פתוח/u,
    /מה\s*דורש\s*ליווי|מה\s*דורש\s*תשומת\s*לב/u,
  ],
  how_to_tell_child: [
    /איך\s*להגיד\s*את\s*זה\s*לילד|איך\s*להסביר\s*לו\s*את\s*זה|באיזה\s*ניסוח\s*לדבר\s*איתו/u,
    /מה\s*לומר\s*לו\s*בלי\s*להלחיץ|איך\s*לדבר\s*איתו\s*בלי\s*להלחיץ/u,
    /איך\s*לומר\s*את\s*זה\s*לילד|איך\s*לומר\s*לילד|איך\s*לומר\s*בבית/u,
    /איך\s*להסביר\s*לילד|איך\s*לספר\s*לילד|ניסוח\s*לילד|במילים\s*פשוטות\s*לילד/u,
    /איך\s*להעביר\s*לילד|איך\s*לדבר\s*עם\s*הילד|איך\s*לשתף\s*את\s*הילד/u,
    /מה\s*לומר\s*בבית|איך\s*להציג\s*את\s*זה|איך\s*להציג\s*לילד/u,
    /הסבר\s*לילד|מילים\s*לילד|לשון\s*של\s*ילדים/u,
    /איך\s*לא\s*להלחיץ|איך\s*בלי\s*לחץ|איך\s*ברוגע/u,
    /איך\s*לבנות\s*משפט|משפט\s*לילד|משפטים\s*לילד/u,
    /איך\s*להסביר\s*בבית|איך\s*לדבר\s*בבית/u,
    /איך\s*להראות\s*לילד|איך\s*להדריך\s*את\s*הילד/u,
  ],
  question_for_teacher: [
    /מה\s*חשוב\s*לברר\s*מול\s*המורה|מה\s*לברר\s*מול\s*המורה/u,
    /מה\s*לשאול\s*את\s*המורה|שאלה\s*למורה|ניסוח\s*למורה|מכתב\s*למורה|לשלוח\s*למורה/u,
    /מה\s*לכתוב\s*למורה|איך\s*לפנות\s*למורה|פנייה\s*למורה/u,
    /שאלה\s*לבית\s*הספר|לשאול\s*את\s*המורה|לשאול\s*את\s*הגננת/u,
    /מה\s*להעביר\s*למורה|מה\s*לשתף\s*עם\s*המורה/u,
    /נקודות\s*לשיחה\s*עם\s*המורה|נושאים\s*לשיחה\s*עם\s*המורה/u,
    /איך\s*לשאול\s*את\s*המורה|איך\s*לשאול\s*במייל/u,
    /שאלה\s*מנוסחת|ניסוח\s*שאלה\s*למורה/u,
    /מה\s*חשוב\s*להעלות\s*למורה|מה\s*להעלות\s*בשיחה/u,
  ],
  is_intervention_needed: [
    /זה\s*דורש\s*עזרה\s*מעבר\s*לבית|צריך\s*לפנות\s*למורה\s*או\s*לאיש\s*מקצוע/u,
    /יש\s*פה\s*משהו\s*מדאיג|זה\s*משהו\s*מדאיג|האם\s*יש\s*פה\s*דאגה/u,
    /חוסר\s*ודאות|לא\s*ברור\s*לי|לא\s*ברור|ביטחון\s*נמוך|יש\s*חוסר\s*ודאות/u,
    /האם\s*צריך\s*התערבות|האם\s*נדרש\s*טיפול|האם\s*יש\s*צורך\s*בליווי|האם\s*צריך\s*ליווי/u,
    /האם\s*זה\s*דחוף|האם\s*זה\s*חמור|האם\s*זה\s*מדאיג|האם\s*לדאוג/u,
    /צריך\s*טיפול\s*מקצועי|צריך\s*התערבות|צריך\s*עזרה\s*מקצועית/u,
    /האם\s*לפנות\s*למומחה|האם\s*לפנות\s*לגורם/u,
    /האם\s*זה\s*נורמלי|האם\s*זה\s*בטווח\s*הנורמלי/u,
    /האם\s*יש\s*בעיה|האם\s*יש\s*משהו\s*לא\s*תקין/u,
    /האם\s*צריך\s*לדאוג|האם\s*כדאי\s*לדאוג/u,
    /האם\s*נדרשת\s*התערבות|האם\s*נדרש\s*ליווי\s*מיוחד/u,
  ],
  strength_vs_weakness_summary: [
    /מה\s*טוב\s*ומה\s*חלש|מה\s*עובד\s*טוב\s*ומה\s*דורש\s*חיזוק|חוזקות\s*מול\s*קושי/u,
    /מה\s*טוב\s*ומה\s*חלש\s*בדוח|מה\s*חלש\s*ומה\s*טוב/u,
    /מה\s*עובד\s*טוב\s*ומה\s*צריך\s*חיזוק|מה\s*עובד\s*ומה\s*דורש\s*חיזוק/u,
    /איפה\s*הוא\s*מצליח\s*ואיפה\s*פחות|תסכם\s*לי\s*חוזקות\s*מול\s*קושי/u,
    /חוזקות\s*מול\s*חולשות|חוזק\s*מול\s*חולשה|סיכום\s*חוזקות\s*וחולשות/u,
    /מה\s*חזק\s*ומה\s*חלש|מה\s*טוב\s*ומה\s*קשה|מה\s*עובד\s*ומה\s*לא/u,
    /השוואה\s*בין\s*נושאים|השוואה\s*בין\s*מקצועות|מבט\s*משווה/u,
    /מאזן\s*חיובי\s*שלילי|מאזן\s*כללי|תמונה\s*מלאה/u,
    /חוזקות\s*וחולשות|חוזקות\s*ו\s*חולשות|חוזקות\s*וגם\s*חולשות/u,
    /סיכום\s*מאוזן|מבט\s*מאוזן|תמונה\s*מאוזנת/u,
    /מה\s*בולט\s*לטובה\s*ולרעה|מה\s*עובד\s*ומה\s*נופל/u,
    /פערים\s*בין\s*נושאים|פערים\s*בין\s*מקצועות/u,
  ],
  clarify_term: [
    /תסביר\s*לי\s*את\s*המושג\s*הזה|לא\s*הבנתי\s*את\s*הניסוח\s*הזה/u,
    /מהזה\s*אומר|מהזה|מה\s*זה\s*אומר/u,
    /מה\s*המשמעות\s*של|מה\s*הכוונה\s*של|מה\s*זה\s*אומר|מה\s*זה\s*אומר\s*בפועל|מה\s*המונח/u,
    /לא\s*הבנתי\s*את\s*המושג|לא\s*הבנתי\s*את\s*המילה|תסביר\s*מונח/u,
    /מה\s*ההגדרה|מה\s*ההסבר|מה\s*המשמעות/u,
    /מה\s*הכוונה|מה\s*הכוונה\s*במילה|מה\s*הכוונה\s*בביטוי/u,
    /תרגם\s*לי|תרגום\s*להורים|בשפה\s*פשוטה/u,
    /מה\s*זה\s*אומר\s*במילים\s*פשוטות|מה\s*זה\s*בקצרה/u,
    /לא\s*הבנתי\s*את\s*המושגים|לא\s*הבנתי\s*את\s*הטקסט/u,
    /מה\s*ההבדל\s*בין|מה\s*ההבדל\s*ל/u,
  ],
  unclear: [/^$/u],
};

/** @type {Record<ScopeClass, RegExp[]>} */
const SCOPE_CLASS_SIGNALS = {
  recommendation: [
    /מלצ|המלצ|מה\s*לעשות|צעד\s*הבא|תוכנית|פעולה\s*מעשית|איך\s*לתרגל|תרגול\s*מומלץ/u,
    /מה\s*כדאי\s*לעשות|מה\s*מומלץ|מה\s*עושים\s*עכשיו|מה\s*לעשות\s*היום|מה\s*לעשות\s*השבוע/u,
  ],
  confidence_uncertainty: [
    /ודאות|ביטחון\s*במסקנה|לא\s*בטוחים|חוסר\s*ודאות|מוקדם\s*למסקנה|כמה\s*אפשר\s*לסמוך/u,
    /עד\s*כמה|רמת\s*ביטחון|עד\s*כמה\s*זה\s*ברור|כמה\s*זה\s*ברור/u,
  ],
  strengths: [
    /חוזק|חזקים|חזקה|מה\s*הולך\s*טוב|מצטיין|הצלח|מתקדמים\s*טוב|מה\s*טוב/u,
    /מה\s*עובד|נקודות\s*חיוביות|מה\s*מרגיש\s*טוב/u,
  ],
  weaknesses: [
    /חולש|חלשים|חלשה|קושי|קשה\s*ל|מתקשים|מה\s*לא\s*הולך|מה\s*נופל/u,
    /נקודות\s*לשיפור|מה\s*דורש\s*חיזוק|מה\s*עדיין\s*קשה/u,
  ],
  blocked_advance: [
    /למה\s*לא\s*מתקדמים|למה\s*לא\s*עולים|למה\s*נשארים|למה\s*עדיין\s*לא|נתקעים|חוסם\s*קידום/u,
    /למה\s*לא\s*מקדמים|למה\s*לא\s*משפרים/u,
  ],
  executive: [],
  subject: [],
  topic: [],
};

/**
 * @param {string} folded
 */
function bestScopeClassFromSignals(folded) {
  /** @type {Array<{ k: ScopeClass; s: number }>} */
  const scores = [];
  for (const [k, patterns] of Object.entries(SCOPE_CLASS_SIGNALS)) {
    if (!patterns.length) continue;
    let s = 0;
    for (const re of patterns) {
      if (re.test(folded)) s += 1;
    }
    if (s > 0) scores.push({ k: /** @type {ScopeClass} */ (k), s });
  }
  scores.sort((a, b) => b.s - a.s);
  return scores[0]?.k || null;
}

/**
 * Free-form Stage A interpretation.
 * @param {string} utteranceRaw
 * @param {unknown} payload
 */
export function interpretFreeformStageA(utteranceRaw, payload) {
  const normalizedUtterance = normalizeFreeformParentUtteranceHe(String(utteranceRaw || ""));
  const t = normalizedUtterance.toLowerCase().replace(/\s+/g, " ").trim();
  const folded = foldUtteranceForHeMatch(normalizedUtterance);

  /** @type {Record<CanonicalParentIntent, number>} */
  const scores = /** @type {any} */ ({});
  for (const intent of CANONICAL_PARENT_INTENTS) scores[intent] = 0;

  for (const [intent, patterns] of Object.entries(INTENT_PARAPHRASES)) {
    if (intent === "unclear") continue;
    let s = 0;
    for (const re of patterns) {
      if (re.test(t) || re.test(folded)) s += 1;
    }
    scores[/** @type {CanonicalParentIntent} */ (intent)] = s;
  }

  // Product QA equivalence overrides for high-frequency free-form phrasings.
  if (/מה\s*הכי\s*חשוב\s*עכשיו\s*בבית/.test(t) || /מה\s*הכי\s*חשוב\s*עכשיו\s*בבית/.test(folded)) {
    scores.what_to_do_this_week += 3;
  }
  if (
    (/מה\s*טוב\s*ומה\s*חלש/.test(t) || /מה\s*טוב\s*ומה\s*חלש/.test(folded)) ||
    (/מה\s*עובד\s*טוב\s*ומה\s*דורש\s*חיזוק/.test(t) || /מה\s*עובד\s*טוב\s*ומה\s*דורש\s*חיזוק/.test(folded))
  ) {
    scores.strength_vs_weakness_summary += 3;
  }

  let best = /** @type {CanonicalParentIntent} */ ("unclear");
  let bestScore = 0;
  let second = 0;
  for (const intent of CANONICAL_PARENT_INTENTS) {
    if (intent === "unclear") continue;
    const v = scores[intent] || 0;
    if (v > bestScore) {
      second = bestScore;
      bestScore = v;
      best = intent;
    } else if (v > second) {
      second = v;
    }
  }
  if (bestScore === 0) best = "unclear";

  const scopeSignal = bestScopeClassFromSignals(folded);
  /** @type {ScopeClass} */
  let scopeClass =
    scopeSignal ||
    (best === "what_is_going_well"
      ? "strengths"
      : best === "what_is_still_difficult"
        ? "weaknesses"
        : best === "why_not_advance"
          ? "blocked_advance"
          : best === "what_to_do_today" || best === "what_to_do_this_week" || best === "is_intervention_needed"
            ? "recommendation"
            : "executive");

  const topicHint = payload ? extractTopicHint(folded, payload) : null;
  const subjectHint = payload ? extractSubjectHint(folded, payload) : null;

  if (best === "strength_vs_weakness_summary") {
    scopeClass = "executive";
  }

  const timeframeHint = inferTimeframeHint(t);
  const toneHint = inferToneHint(t);

  let ambiguityLevel = "low";
  if (bestScore > 0 && second > 0 && second >= bestScore - 1 && bestScore <= 3) ambiguityLevel = "medium";
  if (bestScore > 0 && second === bestScore) ambiguityLevel = "high";

  const canonicalIntentScore = best === "unclear" ? 0.25 : Math.min(0.98, 0.45 + bestScore * 0.07);
  /** Scope resolver owns clarification; intent never forces extra system prompts. */
  const shouldClarifyIntent = false;

  return {
    canonicalIntent: best,
    canonicalIntentScore,
    intentReason: best === "unclear" ? "no_intent_signal" : `stage_a:${best}`,
    normalizedUtterance: t,
    scopeClass,
    subjectHint,
    topicHint,
    timeframeHint,
    toneHint,
    ambiguityLevel,
    shouldClarifyIntent,
    /** Raw per-intent hit counts for tests / telemetry */
    intentHitCounts: { ...scores },
  };
}

export default { interpretFreeformStageA, CANONICAL_PARENT_INTENTS };
