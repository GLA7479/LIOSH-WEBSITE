/**
 * Shared client/server guards for planner AI explanation text (no circular imports with view-model).
 */

/** @type {string} */
export const PLANNER_AI_EXPLANATION_SECTION_LABEL_HE = "ככה נבחר התרגול הבא";

const MAX_LEN = 180;
const MAX_SENTENCES = 2;

const FORBIDDEN_SUBSTRINGS = [
  /\bAI\b/i,
  /\bLLM\b/i,
  /\bgpt\b/i,
  /\bopenai\b/i,
  /\balgorithm\b/i,
  /\balgo\b/i,
  /\bmodel\b/i,
  /אלגוריתם/u,
  /מודל\s*למידה/u,
  /בינה\s*מלאכותית/u,
  /\bmetadata\b/i,
  /\bdiagnostic\b/i,
  /\breasonCode\b/i,
  /\bmustNotSay\b/i,
  /\badvance_skill\b/i,
  /\bmaintain_skill\b/i,
  /\bpractice_current\b/i,
  /\breview_prerequisite\b/i,
  /\bprobe_skill\b/i,
  /\bpause_collect_more_data\b/i,
  /reasonCodes?/i,
  /mustNotSay/i,
  /diagnostics?/i,
  /נכשל/u,
  /כישלון/u,
  /חולה/u,
  /אבחון/u,
  /ADHD/i,
  /דיסלקס/i,
  /דוח\s*להורים/u,
  /דוח\s*הורים/u,
  /#\s*\d/,
  /\*\*/,
  /\[.*\]\(/,
  /```/,
];

const PRESSURE_HE = [
  /חייבים?/u,
  /מחויבים?/u,
  /\bתמיד\b/u,
  /\bאף\s*פעם\b/u,
  /לעולם\s*לא/u,
  /בהכרח/u,
];

/**
 * @param {string} text
 * @returns {{ ok: true, text: string } | { ok: false, reason: string }}
 */
export function validateAdaptivePlannerExplanationText(text) {
  const raw = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const singleLine = raw.replace(/\s*\n+\s*/g, " ").trim();
  if (!singleLine) return { ok: false, reason: "empty" };
  if (singleLine.length > MAX_LEN) return { ok: false, reason: "too_long" };
  if (/[\n\r\t]/.test(singleLine)) return { ok: false, reason: "line_break" };
  if (/[#*_`[\]()]/.test(singleLine)) return { ok: false, reason: "markdown_like" };
  if (/\p{Extended_Pictographic}/u.test(singleLine)) return { ok: false, reason: "emoji" };
  if (/\d/.test(singleLine)) return { ok: false, reason: "digits" };

  const letters = singleLine.replace(/[^\p{L}]/gu, "");
  if (letters.length < 8) return { ok: false, reason: "too_short" };
  let he = 0;
  for (const ch of letters) {
    const c = ch.codePointAt(0);
    if (c >= 0x0590 && c <= 0x05ff) he += 1;
  }
  if (he / letters.length < 0.55) return { ok: false, reason: "not_hebrewish" };

  const lower = singleLine.toLowerCase();
  for (const re of FORBIDDEN_SUBSTRINGS) {
    if (re.test(singleLine) || re.test(lower)) return { ok: false, reason: "forbidden_term" };
  }
  for (const re of PRESSURE_HE) {
    if (re.test(singleLine)) return { ok: false, reason: "pressure_language" };
  }

  const sentenceEnders = singleLine.split(/[.!?׃]+/).filter((s) => s.trim().length > 0);
  if (sentenceEnders.length > MAX_SENTENCES) return { ok: false, reason: "too_many_sentences" };

  return { ok: true, text: singleLine };
}

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function isAdaptivePlannerAIExplainerClientDisplayEnabled(
  env = typeof process !== "undefined" && process.env ? process.env : {}
) {
  const v = String(env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER || "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
