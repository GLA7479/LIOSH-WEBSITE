/**
 * נרמול טקסט הורה סופי — מעבר לפדגוגיה בלבד: מסיר ז'רגון, קודי טקסונומיה, ומילים באנגלית שנדלפו למשפט עברי.
 * לא משנה לוגיקת מנוע; רק תצוגה.
 */

import { normalizePedagogyForParentReportHe } from "./pedagogy-glossary-he.js";

/**
 * @param {string|null|undefined} raw
 * @returns {string}
 */
export function normalizeParentFacingHe(raw) {
  let s = normalizePedagogyForParentReportHe(String(raw ?? ""));
  if (!s) return "";

  // ביטויים שמבלבלים הורים (מתמטיקה / מונחי מערכת)
  const phrasePairs = [
    [/שליטה\s+יציבה\s+בנשיאה/giu, "שליטה טובה בהעברה בחיבור"],
    [/מאסטרי\s+יציב/giu, "שליטה טובה"],
    [/מאסטרי\b/giu, "שליטה טובה"],
    [/פרופיל\s+מאסטרי/giu, "שליטה טובה"],
    [/אלגוריתם\s+של\s+חיבור\s+עם\s+העברה/giu, "דרך עבודה טובה בחיבור עם העברה"],
    [/העברה\s+עשרונית\s*\(בחיבור\)/giu, "העברה בחיבור"],
    [/העברה\s+עשרונית/giu, "העברה בחיבור"],
    [/חוזקה\s+עקבית/giu, "תחום חזק"],
    [/הצלחה\s+עקבית/giu, "הילד מצליח בנושא הזה לאורך זמן"],
    [/תמונה\s+עקבית\s+יחסית/giu, "נראה שהנושא הזה נשמר טוב יחסית"],
    [/המערכת\s+משלבת[^.]*\./giu, ""],
    [/המערכת\s+שומרת[^.]*\./giu, ""],
    [/דגלי\s+סיכון\s+פעילים/giu, "נקודות לשימת לב"],
    [/מזהה\s+טקסונומיה\s+[MH]-\d{2,}/giu, ""],
    [/לפי\s+טקסונומיה\s+[MH]-\d{2,}/giu, ""],
    [/כלל\s+בסיס\s+במנוע/giu, "שיקול זהירות נוסף"],
    [/כללי\s+זהירות\s+פנימיים/giu, "שיקולי זהירות"],
    [/כלל\s+פנימי/giu, "שיקול זהירות"],
  ];
  for (const [re, rep] of phrasePairs) {
    s = s.replace(re, rep);
  }

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

  s = s.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
  return s;
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
