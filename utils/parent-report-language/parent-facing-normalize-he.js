/**
 * נרמול טקסט הורה סופי — מעבר לפדגוגיה בלבד: מסיר ז'רגון, קודי טקסונומיה, ומילים באנגלית שנדלפו למשפט עברי.
 * לא משנה לוגיקת מנוע; רק תצוגה.
 */

import { normalizePedagogyForParentReportHe } from "./pedagogy-glossary-he.js";
import {
  PARENT_TOPIC_FALLBACK_HE,
  rewriteEngineTaxonomySnippetForParentHe,
  rewriteTaxonomySubstringsOnlyHe,
} from "../diagnostic-labels-he.js";

/**
 * @param {string|null|undefined} raw
 * @returns {string}
 */
export function normalizeParentFacingHe(raw) {
  let s = normalizePedagogyForParentReportHe(String(raw ?? ""));
  if (!s) return "";

  const topicKeyPairs = [
    [/\bmain_idea\b/giu, "רעיון מרכזי"],
    [/\breading_comprehension\b/giu, "הבנת הנקרא"],
    [/\breading_comprehension_error\b/giu, "הבנת הנקרא"],
    [/\bdirections\b/giu, "הוראות"],
    [/\bplaces\b/giu, "מקומות"],
    [/\bsequence\b/giu, "רצף"],
    [/\bvocabulary\b/giu, "אוצר מילים"],
    [/\bVocabulary\b/g, "אוצר מילים"],
    [/\bgrammar_basics\b/giu, "יסודות דקדוק"],
    [/\bsentence_understanding\b/giu, "הבנת משפט"],
    [/\bfact_vs_opinion\b/giu, "עובדה מול דעה"],
    [/\bmap_reading\b/giu, "קריאת מפה"],
    [/\banimals_plants\b/giu, "בעלי חיים וצמחים"],
    [/\bbasic_experiments\b/giu, "ניסויים בסיסיים"],
    [/\bbasic_geography\b/giu, "יסודות גאוגרפיה"],
    [/\bmatching\b/giu, "התאמה"],
    [/\bshapes\b/giu, "צורות"],
    [/\binference\b/giu, "הסקה"],
  ];
  for (const [re, rep] of topicKeyPairs) {
    s = s.replace(re, rep);
  }

  // ביטויים שמבלבלים הורים (מתמטיקה / מונחי מערכת)
  const phrasePairs = [
    [
      /נראה מהתרגולים האחרונים מגמה כללית שאפשר לשתף בהירות עם ההורה/giu,
      "מהתרגול שנאסף אפשר לראות תמונה ברורה יותר של חוזקות ונושאים לחיזוק",
    ],
    [/שליטה\s+יציבה\s+בנשיאה/giu, "שליטה טובה בהעברה בחיבור"],
    [/מאסטרי\s+יציב/giu, "שליטה טובה"],
    [/מאסטרי\b/giu, "שליטה טובה"],
    [/פרופיל\s+מאסטרי/giu, "שליטה טובה"],
    [/אלגוריתם\s+של\s+חיבור\s+עם\s+העברה/giu, "דרך עבודה טובה בחיבור עם העברה"],
    [/העברה\s+עשרונית\s*\(בחיבור\)/giu, "העברה בחיבור"],
    [/העברה\s+עשרונית/giu, "העברה בחיבור"],
    [/חוזקה\s+עקבית/giu, "נושא שהילד מצליח בו יותר כרגע"],
    [/חוזקה\s+בולטת/giu, "נושא חזק כרגע"],
    [/חוזקה\s+יחסית/giu, "נושא שהילד מצליח בו יותר כרגע"],
    [/חוזק\s+יציב/giu, "נושא שעובד טוב כרגע"],
    [/יציבות\s+טובה\s+יחסית/giu, "תוצאות די עקביות בתקופה הזו"],
    [/יציבות\s+טובה\b/giu, "תוצאות די עקביות בתקופה הזו"],
    [/דפוס\s+אבחוני/giu, "תמונה מהתרגולים"],
    [/מיקוד\s+אבחוני/giu, "מה הכי בולט עכשיו"],
    [/דפוס\s+קושי\s+דומיננטי/giu, "אילו טעויות חוזרות כאן"],
    [/דפוס\s+התנהגות\s+נפוץ\s+בשטח/giu, "מה קורה בדרך כלל בזמן התרגול"],
    [/דפוס\s+התנהגות\s+נפוץ\s+בשורות/giu, "מה קורה בדרך כלל בזמן התרגול בשורות"],
    [/סולם\s+עדיפות/giu, "מה כדאי לתרגל קודם"],
    [/עדיפות\s+יסוד/giu, "מה צריך לחזק לפני הכל"],
    [/לפני\s+קידום/giu, "לפני שמעלים רמה"],
    [/מוכנות\s+להעברה/giu, "האם זה מצליח גם בשאלה חדשה"],
    [/ביטחון\s+בנתונים/giu, "עד כמה המסקנה הזו מבוססת"],
    [/בטחון\s+בנתונים/giu, "עד כמה המסקנה הזו מבוססת"],
    [/רמת\s+ודאות/giu, "כמה אפשר לסמוך על זה"],
    [/בסיס\s+הנתונים/giu, "על מה זה נשען"],
    [/מקום\s+לשיפור\s+ממוקד/giu, "יש עדיין נושאים שכדאי לחזק"],
    [/המסקנה\s+המקצועית/giu, "מה שנראה מהתרגולים"],
    [/כיוון\s+המקצועי/giu, "הכיוון שנראה מהתרגולים"],
    [/מוקד\s+חירום/giu, "נושא דחוף יותר"],
    [/איזון\s+ראיות/giu, "מה מחזק את התמונה ומה עדיין לא ברור"],
    [/ראיות\s+השורה/giu, "מה שרואים בשורה"],
    [/קושי\s+יסודי/giu, "נראה שחסר בסיס בנושא"],
    [/קפיצה\s+לרמה\s+גבוהה/giu, "עלייה מהירה מדי ברמה"],
    [/קפיצת\s+רמה/giu, "עלייה מהירה מדי ברמה"],
    [/נקודות\s+לשימת\s+לב/giu, "נקודות לתשומת לב"],
    [/הצלחה\s+עקבית/giu, "הילד מצליח בנושא הזה לאורך זמן"],
    [/תמונה\s+עקבית\s+יחסית/giu, "נראה שהנושא הזה נשמר טוב יחסית"],
    [/המערכת\s+משלבת[^.]*\./giu, ""],
    [/המערכת\s+שומרת[^.]*\./giu, ""],
    [/דגלי\s+סיכון\s+פעילים/giu, "נקודות לתשומת לב"],
    [/נקודות\s+לשיפור/giu, "איפה כדאי לחזק"],
    [/תחומים\s+הדורשים\s+תשומת\s+לב/giu, "מה כדאי לשים לב אליו השבוע"],
    [/ריענון\s+מסקנה/giu, "האם כדאי לשנות כיוון"],
    [/תמיכה,\s*תגובה\s+והתאמה/giu, "מה עוזר עכשיו ומה כדאי לשנות"],
    [/רצף\s+תמיכה/giu, "איך העזרה מתקדמת לאורך זמן"],
    [/זיכרון\s+המלצה\s+ותוצאה/giu, "מה ניסינו לאחרונה והאם זה עזר"],
    [/עדיפות\s+ראשונה:/giu, "מה לעשות קודם:"],
    [/עדיפות\s+שנייה:/giu, "מה לעשות אחר כך:"],
    [/עדיפות\s+סבב:/giu, "מה כדאי לעשות בסבב הזה:"],
    [/תחום\s+במגמת\s+שיפור/giu, "נושא שעדיין מתחזק"],
    [/לאבחון\s+מקצועי\s+ברור/giu, "לתמונה ברורה מהתרגולים"],
    [/קושי\s+ספציפי\s+של\s+הנושא/giu, "קושי שקשור לנושא הזה"],
    [/מזהה\s+טקסונומיה\s+[MH]-\d{2,}/giu, ""],
    [/לפי\s+טקסונומיה\s+[MH]-\d{2,}/giu, ""],
    [/כלל\s+בסיס\s+במנוע/giu, "שיקול זהירות נוסף"],
    [/כללי\s+זהירות\s+פנימיים/giu, "שיקולי זהירות"],
    [/כלל\s+פנימי/giu, "שיקול זהירות"],
    [/מה\s+חוזר\s+בטעויות\s+בנושא/giu, "אילו טעויות חוזרות כאן"],
    [/מה\s+חשוב\s+בנושא/giu, "מה הכי חשוב כאן"],
    [/יציבות\s+עקבית/giu, "ההצלחה חוזרת בכמה תרגולים"],
    [/תרגול\s+עקבי/giu, "כמה תרגולים נוספים"],
    [/כמה\s+אפשר\s+לסמוך\s+על\s+התמונה\s+כאן/giu, "עד כמה המסקנה הזו מבוססת"],
    [/האם\s+אפשר\s+לנסות\s+את\s+זה\s+גם\s+בשאלה\s+חדשה/giu, "האם זה מצליח גם בשאלה חדשה"],
    [/כמה\s+אפשר\s+לסמוך\s+על\s+זה\s*:/giu, "עד כמה המסקנה מבוססת:"],
    [/נשארים\s+עם\s+ניסוח\s+קצר\s+ו(?:ברור|בהיר)\s+עד\s+שיצטבר\s+עוד\s+תרגול\s+עקבי/giu, "כדאי להמשיך עם תרגול קצר ולבדוק שוב אחרי עוד כמה תרגולים"],
    [/ניסוח\s+קצר\s+ו(?:ברור|בהיר)/giu, "תרגול קצר"],
    [/התמונה\s+כרגע\s+חלקית\s+ו(?:זהירה|זהיר)/giu, "עדיין אין תמונה מספיק ברורה"],
    [/חלקית\s+ו(?:זהירה|זהיר)\s*—\s*/giu, "עדיין לא ברור במלואו — "],
    [/נשארים\s+עם\s+תרגול\s+קצר\s+ו(?:ברור|בהיר)/giu, "כדאי להמשיך בתרגול קצר"],
    [/תרגול\s+קצר\s+ו(?:ברור|בהיר)/giu, "תרגול קצר"],
    [/לא\s+להעלות\s+קושי\s+לפני\s+שמתקבלת\s+יציבות\s+עקבית/giu, "לא להעלות רמת קושי לפני שרואים שההצלחה חוזרת בכמה תרגולים"],
    [/יש\s+נפח\s+תרגול\s+במקצוע;\s*כדי\s+לצמצם\s+טעות\s+בפרשנות/giu, "יש נפח תרגול מסוים; כדי לצמצם טעות בפרשנות"],
    [/יש\s+נפח\s+תרגול\s+במקצוע\s+—\s*/giu, "יש נפח תרגול מסוים — "],
    [/יש\s+נתוני\s+תרגול\s+במקצוע/giu, "יש נתוני תרגול מסוימים"],
    [/מסקנת\s+רמת\s+הראיות\s+משפיעה\s+על\s+עוצמת\s+ההמלצה\s+הבאה/giu, "רמת הוודאות של הנתונים עוזרת לקבוע עד כמה להתקדם בצעד הבא"],
    [/איכות\s+הראיות\s+מהאגרגציה:\s*/giu, "עד כמה הנתונים מבוססים כרגע: "],
    [/בניסוח\s+המסונן\s+אין\s+כאן\s+נקודות\s+להצגה\s+כרגע/giu, "כרגע אין מספיק נקודות ברורות להצגה"],
    [/דפוס\s+שגיאות:\s*/giu, ""],
    [/דפוס\s+טעות\b/giu, "סוג טעות"],
    [/דפוס\s+הצלחה\b/giu, "מה שנראה חזק"],
    [/דפוס\s+קושי\b/giu, "מה שדורש חיזוק"],
    [/מוקדים\s+המעוגנים/giu, "הנושאים המרכזיים"],
    [/עוגן\s+מספרי/giu, "נתון מספרי"],
    [/משוקלל/giu, "כולל"],
  ];
  for (const [re, rep] of phrasePairs) {
    s = s.replace(re, rep);
  }

  s = rewriteTaxonomySubstringsOnlyHe(s);

  const practiceTail = (topicRaw) => {
    const cleaned = rewriteEngineTaxonomySnippetForParentHe(String(topicRaw).trim());
    if (!cleaned || cleaned === PARENT_TOPIC_FALLBACK_HE) return "כדאי לתרגל את זה שוב בכמה שאלות קצרות.";
    return `כדאי לתרגל שוב את ${cleaned} בכמה שאלות קצרות.`;
  };
  s = s.replace(/כדאי לחזק סביב בנושא(?: של)?\s+([^.!?\n]+)/giu, (_, topic) => practiceTail(topic));
  s = s.replace(/כדאי לחזק בנושא של\s+([^.!?\n]+)/giu, (_, topic) => practiceTail(topic));
  s = s.replace(/כדאי לחזק סביב\s+([^.!?\n]+)/giu, (_, topic) => practiceTail(topic));
  s = s.replace(/\sסביב בנושא(?: של)?\s+/giu, " בנושא ");

  // קודי טקסונומיה (M-02, H-10 …)
  s = s.replace(/\bטקסונומיה\s+M-\d{2,}\b/giu, "סוג הטעות שנבחר");
  s = s.replace(/\bM-\d{2,}\b/g, "");
  s = s.replace(/\bH-\d{2,}\b/g, "");

  // מזהי התנהגות באנגלית שנשארו במחרוזת (אחרי שלא הוחלפו במפה)
  const behaviorSnake = [
    "fragile_success_cluster",
    "stable_mastery",
    "fragile_success",
    "instruction_friction",
    "speed_pressure",
    "knowledge_gap",
    "careless_pattern",
    "undetermined",
    "mixed_low_signal",
    "none_sparse",
    "none_observed",
  ];
  for (const id of behaviorSnake) {
    s = s.replace(new RegExp(`\\b${id}\\b`, "g"), "");
  }

  // רמות באנגלית שנדפו לטקסט הורה
  s = s.replace(/\bmoderate\b/gi, "בינוני");
  s = s.replace(/\bmedium\b/gi, "בינוני");
  s = s.replace(/\bhigh\b/gi, "גבוה");
  s = s.replace(/\blow\b/gi, "נמוך");
  s = s.replace(/\bstrong\b/gi, "חזק");
  s = s.replace(/\bweak\b/gi, "חלש");
  s = s.replace(/\bresponseMs\b|\bretry\b|\bhint\b/gi, "פרטי תרגול");

  // כל מופע נותר של «נשיאה» (אחרי כללי הפדגוגיה) — במסלול דוח הורים זה כמעט תמיד העברה בחיבור
  if (/נשיאה/u.test(s)) {
    s = s.replace(/נשיאה/gu, "העברה בחיבור");
  }

  // snake_case גולמי שנשאר בתצוגה הורה -> ניסוח עברי בטוח
  s = s.replace(/\b[a-z]+(?:_[a-z0-9]+){1,}\b/g, (m) => {
    const rewritten = rewriteEngineTaxonomySnippetForParentHe(m);
    if (rewritten && rewritten !== m && rewritten !== PARENT_TOPIC_FALLBACK_HE) return rewritten;
    return m.replace(/_/g, " ");
  });

  // ניקוי עיצוב כפול וניקוד כפול בתצוגה הורה
  s = s.replace(/::+/g, ":");
  s = s.replace(/\.{2,}/g, ".");
  s = s.replace(/([!?])\1+/g, "$1");
  s = s.replace(/\s*([:])\s*:/g, "$1");
  s = s.replace(/([א-ת][א-ת\s]+):\s*:/g, "$1:");

  s = s.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
  return s;
}

/**
 * מעבר שני על מכתב מקצוע — תופס טקסט שהוחלף אחרי נרמול ראשון (למשל מעטפה מחייבת).
 * @param {Record<string, unknown>|null|undefined} letter
 */
export function normalizeSubjectParentLetterHe(letter) {
  if (!letter || typeof letter !== "object") return letter;
  const out = { ...letter };
  const keys = ["opening", "diagnosisHe", "homeAction", "closing", "goingWell", "fragile", "middle", "reliabilityNoteHe"];
  for (const k of keys) {
    if (typeof out[k] === "string" && out[k]) out[k] = normalizeParentFacingHe(out[k]);
  }
  return out;
}

/**
 * מעבר על אובייקט המלצת נושא — כל שדות מחרוזת ששמם מסתיים ב־He.
 * @param {Record<string, unknown>} rec
 * @returns {Record<string, unknown>}
 */
export function glossTopicRecommendationHeFields(rec) {
  if (!rec || typeof rec !== "object") return rec;
  const out = { ...rec };
  for (const [k, v] of Object.entries(out)) {
    if (!/He$/u.test(k)) continue;
    if (typeof v === "string" && v) {
      out[k] = normalizeParentFacingHe(v);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) => (typeof item === "string" ? normalizeParentFacingHe(item) : item));
    }
  }
  return out;
}
