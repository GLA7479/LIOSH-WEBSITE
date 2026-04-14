/**
 * קשירת הקראה סטטית לתוכן שאלה (first-pass) — hash דטרמיניסטי על טקסט מלא.
 * משותף לקליינט (attach) ולשרת (api/hebrew-audio-ensure).
 */

import { sha256 } from "js-sha256";

/** @param {string} s @param {number} max */
function clip(s, max) {
  const t = String(s || "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trim();
}

/**
 * נורמליזציה זהה בקליינט ובשרת לפני hash.
 * @param {string} plaintext
 */
export function normalizeNarrationForHash(plaintext) {
  return String(plaintext || "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 16 תווים hex — מפתח קובץ/זרם (ensure + /api/hebrew-audio-stream).
 * @param {string} plaintext
 */
export function narrationContentHash16(plaintext) {
  return sha256(normalizeNarrationForHash(plaintext)).slice(0, 16);
}

/**
 * טקסט מלא להקראה: כיתה + נושא + גוף השאלה + אפשרויות + סגירה.
 * @param {{
 *   gradeKey: string,
 *   topic: string,
 *   task_mode: string,
 *   qText: string,
 *   answers?: string[],
 * }} p
 */
export function buildFirstPassNarrationPlaintext(p) {
  const body = clip(p.qText, 1500);
  const ansLine = Array.isArray(p.answers)
    ? clip(
        p.answers
          .map((a) => String(a).trim())
          .filter(Boolean)
          .join(" · "),
        500
      )
    : "";
  const topicLabel = p.topic === "reading" ? "קריאה" : "הבנת הנקרא";
  const gl = p.gradeKey === "g1" ? "כיתה א׳" : "כיתה ב׳";
  const ansPart = ansLine ? ` האפשרויות: ${ansLine}.` : "";
  if (p.task_mode === "oral_comprehension_mcq") {
    return `${gl}, ${topicLabel}. תוכן השאלה: ${body}.${ansPart} בחרו את התשובה הנכונה לפי מה ששמעתם.`;
  }
  return `${gl}, ${topicLabel}. תוכן השאלה: ${body}.${ansPart} בחרו את התשובה הנכונה.`;
}
