/**
 * Behavior-class detection for short parent follow-ups (Hebrew).
 * Uses normalization, token/phrase lexicons, fuzzy short-token match, and simple structural signals — not a tiny exact-phrase gate.
 */

/** @typedef {'affirmation_continue'|'rejection_not_now'|'concern_reaction'|'confusion_simpler'|'clarify_previous'|'brief_continue'} ReplyClassId */

/** @type {ReplyClassId[]} */
export const REPLY_CLASS_ORDER = [
  "concern_reaction",
  "clarify_previous",
  "confusion_simpler",
  "rejection_not_now",
  "affirmation_continue",
  "brief_continue",
];

const MAX_NORMALIZED_CHARS = 72;
const MAX_TOKENS = 10;
const MIN_SCORE_TO_WIN = 2.05;
const MIN_MARGIN = 0.22;

/**
 * @param {string} a
 * @param {string} b
 */
function levenshteinLeq1(a, b) {
  const A = String(a || "");
  const B = String(b || "");
  if (A === B) return true;
  if (Math.abs(A.length - B.length) > 1) return false;
  if (A.length === 0 || B.length === 0) return A.length + B.length === 1;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (A.length > B.length) i += 1;
    else if (A.length < B.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  edits += A.length - i + (B.length - j);
  return edits <= 1;
}

/**
 * @param {string} raw
 */
export function normalizeParentFollowupForClassHe(raw) {
  return String(raw || "")
    .replace(/[\u200f\u200e\u00a0]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[!?.…,:;"""''`׳״]+/u, "")
    .replace(/[!?.…,:;"""''`׳״]+$/u, "")
    .trim();
}

/**
 * @param {string} t
 */
function tokenizeHe(t) {
  const s = String(t || "").trim();
  if (!s) return [];
  return s
    .split(/\s+/u)
    .map((x) => x.replace(/^[^\u0590-\u05FF\w]+|[^\u0590-\u05FF\w]+$/gu, "").trim())
    .filter(Boolean);
}

/** Multi-word and phrase hits (substring on normalized string). */
const CONCERN_PHRASES = [
  "לא טוב",
  "זה לא טוב",
  "לא נשמע טוב",
  "לא כל כך טוב",
  "דואג",
  "דואגת",
  "דואגים",
  "דאגה",
  "מדאיג",
  "חושש",
  "חוששת",
  "חרדה",
  "מפחיד",
  "מלחיץ",
  "בעיה רצינית",
  "נשמע רע",
  "זה רע",
  "מצב רע",
  "אני מודאג",
  "אני מודאגת",
];

const AFFIRMATION_PHRASES = [
  "בסדר גמור",
  "נשמע טוב",
  "נשמע מצוין",
  "כן בטח",
  "מסכימה לגמרי",
  "יאללה קדימה",
  "בוא ננסה",
  "בואי ננסה",
  "ככה זה",
  "סבבה גמור",
  "לגמרי בסדר",
];

const REJECTION_PHRASES = [
  "לא עכשיו",
  "לא כרגע",
  "לא מעניין",
  "לא רוצה",
  "עדיין לא",
  "תעצור",
  "תעצרי",
  "די כבר",
  "מספיק",
  "אחר כך",
  "לא מוכן",
  "לא מוכנה",
  "נעצור",
  "בלי ללחוץ",
  "אל תדחף",
  "אל תדחפי",
  "לא בשביל עכשיו",
  "לא היום",
  "לא השבוע",
  "לא רלוונטי",
  "לא מתאים לי",
];

const CONFUSION_PHRASES = [
  "לא בטוח",
  "לא לגמרי ברור",
  "לא הבנתי",
  "לא מבין",
  "לא מבינה",
  "לא קולט",
  "לא קולטת",
  "תסביר",
  "תסבירי",
  "תסבירו",
  "אפשר להסביר",
  "יותר פשוט",
  "פשוט יותר",
  "במילים פשוטות",
  "לא ברור",
  "לא ברור לי",
  "מבולבל",
  "מבולבלת",
  "מה זה אומר",
  "מה זאת אומרת",
  "מה זה אמור להגיד",
  "לא הצלחתי להבין",
];

const CLARIFY_PREVIOUS_PHRASES = [
  "מה הכוונה",
  "מה הכוונה של",
  "למה אמרת",
  "למה כתבת",
  "מה שאמרת",
  "מה שאמרתם",
  "לגבי מה שאמרת",
  "לגבי מה שכתבת",
  "מה הקשר",
  "מה הקשר לזה",
  "מה זה קשור",
  "בקשר למה שאמרת",
  "לא הבנתי את הקטע",
  "לא הבנתי את החלק",
  "תחזור על",
  "תחזיר את",
  "תוכל לחדד",
  "תוכלי לחדד",
  "אפשר לחדד",
];

const BRIEF_CONTINUE_PHRASES = [
  "אז מה",
  "ואז",
  "אז ו",
  "מה עכשיו",
  "עכשיו מה",
  "מה הלאה",
  "ואחר כך",
  "תמשיך",
  "תמשיכי",
  "תמשיכו",
  "עוד קצת",
  "תן עוד",
  "תני עוד",
  "המשך",
  "נמשיך",
  "תמשיך בבקשה",
  "תמשיכי בבקשה",
  "מה עוד",
  "ואז מה",
];

/** Single-token / short affirmation stems (+ common colloquial). */
const AFFIRMATION_TOKENS = new Set([
  "כן",
  "ככה",
  "נכון",
  "בסדר",
  "טוב",
  "מעולה",
  "סבבה",
  "יאללה",
  "בטח",
  "אוקיי",
  "אוקי",
  "קדימה",
  "מסכים",
  "מסכימה",
  "מסכימים",
  "ברור",
  "סגור",
  "לגמרי",
  "בדיוק",
  "אישור",
  "יופי",
  "מצוין",
  "בוא",
  "בואי",
  "נשמע",
]);

/** Single-token rejection stems. */
const REJECTION_SINGLE = new Set(["לא", "לאא", "לאו", "די", "עצור", "עצרי", "מספיק", "בלי"]);

/**
 * @param {string} t normalized
 * @param {string[]} phrases
 * @param {number} weight
 */
function scorePhrases(t, phrases, weight) {
  let s = 0;
  for (const p of phrases) {
    if (!p) continue;
    if (t.includes(p)) s += weight * (p.split(/\s+/).length >= 2 ? 1.15 : 1);
  }
  return s;
}

/**
 * @param {string[]} tokens
 * @param {Set<string>} lex
 * @param {number} w
 */
function scoreLexTokens(tokens, lex, w) {
  let s = 0;
  for (const tok of tokens) {
    if (!tok || tok.length < 2) continue;
    if (lex.has(tok)) {
      s += w;
      continue;
    }
    if (tok.length >= 3 && tok.length <= 6) {
      for (const lem of lex) {
        if (lem && lem.length >= 3 && levenshteinLeq1(tok, lem)) {
          s += w * 0.72;
          break;
        }
      }
    }
  }
  return s;
}

/**
 * Classify a short parent utterance into a reply behavior class, or null if it does not read as a bounded conversational reply.
 * @param {string} utteranceRaw
 * @param {{ conv?: object }} [ctx]
 * @returns {ReplyClassId|null}
 */
export function classifyShortParentReplyClassHe(utteranceRaw, ctx = null) {
  const t = normalizeParentFollowupForClassHe(utteranceRaw);
  if (!t || t.length > MAX_NORMALIZED_CHARS) return null;
  const tokens = tokenizeHe(t);
  if (tokens.length === 0 || tokens.length > MAX_TOKENS) return null;

  /** Reject likely full new questions: many tokens + interrogative opener without continuation-class cues. */
  if (tokens.length >= 7) return null;

  const joined = tokens.join(" ");

  /** @type {Record<ReplyClassId, number>} */
  const sc = {
    affirmation_continue: 0,
    rejection_not_now: 0,
    concern_reaction: 0,
    confusion_simpler: 0,
    clarify_previous: 0,
    brief_continue: 0,
  };

  sc.concern_reaction += scorePhrases(t, CONCERN_PHRASES, 2.4);
  sc.rejection_not_now += scorePhrases(t, REJECTION_PHRASES, 2.2);
  sc.confusion_simpler += scorePhrases(t, CONFUSION_PHRASES, 2.3);
  sc.clarify_previous += scorePhrases(t, CLARIFY_PREVIOUS_PHRASES, 2.5);
  sc.brief_continue += scorePhrases(t, BRIEF_CONTINUE_PHRASES, 2.1);

  sc.affirmation_continue += scorePhrases(t, AFFIRMATION_PHRASES, 2.15);
  sc.affirmation_continue += scoreLexTokens(tokens, AFFIRMATION_TOKENS, 2.15);
  sc.rejection_not_now += scoreLexTokens(tokens, REJECTION_SINGLE, 2.0);

  /** Whole-utterance short affirmations: "כן בטח", "נשמע טוב" */
  if (/^(כן|בטח|נכון|בסדר|טוב|סבבה|יאללה|לגמרי|ברור|מסכים|מסכימה)\s+(בטח|נכון|טוב|מצוין|מעולה|ברור|סגור|יאללה)/u.test(joined)) {
    sc.affirmation_continue += 1.8;
  }

  /** Leading "אז" / "ואז" as continuation (not "אז לא"). */
  if (/^(אז|ואז)([?!…\s]*$|\s+מה)/u.test(t) && !/^אז\s+לא/u.test(t)) {
    sc.brief_continue += 2.0;
  }
  if (/^תמשיכ/i.test(t) || /^המשך/i.test(t) || /^נמשיך$/u.test(t)) {
    sc.brief_continue += 2.2;
  }

  /** Single-token disambiguation. */
  if (tokens.length === 1) {
    const one = tokens[0];
    if (one === "לא" || one === "לאא" || levenshteinLeq1(one, "לא")) sc.rejection_not_now += 2.8;
    else if (one === "כן" || levenshteinLeq1(one, "כן")) sc.affirmation_continue += 2.8;
    else if (AFFIRMATION_TOKENS.has(one)) sc.affirmation_continue += 2.55;
    else if (one.length >= 3) {
      for (const lem of AFFIRMATION_TOKENS) {
        if (lem && levenshteinLeq1(one, lem)) {
          sc.affirmation_continue += 2.35;
          break;
        }
      }
    } else if (levenshteinLeq1(one, "כן")) {
      sc.affirmation_continue += 2.35;
    }
    if (one === "אז" || one === "ואז") sc.brief_continue += 2.6;
    if (one === "מה" || one === "מה?") sc.confusion_simpler += 1.4;
  }

  /** Leading "לא" → rejection tilt unless confusion/clarify phrases already fired. */
  if (tokens[0] === "לא" || levenshteinLeq1(tokens[0], "לא")) {
    if (sc.confusion_simpler < 2.1 && sc.clarify_previous < 2.1) {
      sc.rejection_not_now += 1.2;
      if (sc.concern_reaction < 2) sc.rejection_not_now += 0.8;
    }
  }

  /** Clarify vs confusion: pointer words to prior message. */
  if (/(אמרת|אמרתם|כתבת|הכוונה|קודם|לפני|התשובה|מה שאמרת)/u.test(t)) {
    sc.clarify_previous += 1.4;
    sc.confusion_simpler *= 0.85;
  }

  /** Penalize affirmation if clear negation phrase. */
  if (sc.rejection_not_now >= 2.5) sc.affirmation_continue *= 0.35;

  /** "לא טוב" style is concern, not rejection — disambiguate leading לא. */
  if (/לא\s+טוב/u.test(t) || t.includes("לא נשמע טוב") || t.includes("זה לא טוב")) {
    sc.concern_reaction += 1.6;
    sc.rejection_not_now *= 0.18;
  }

  /** Clarify-the-prior-message vs generic confusion when both fire on "לא הבנתי…". */
  if (/(הקטע|החלק|מה שאמרת|למה אמרת|מה הכוונה)/u.test(t) && sc.clarify_previous > 0 && sc.confusion_simpler > 0) {
    sc.clarify_previous += 0.55;
    sc.confusion_simpler *= 0.78;
  }

  /** @type {ReplyClassId[]} */
  const ALL_KEYS = ["affirmation_continue", "rejection_not_now", "concern_reaction", "confusion_simpler", "clarify_previous", "brief_continue"];
  let best = /** @type {ReplyClassId|null} */ (null);
  let bestV = -1;
  let second = -1;
  for (const k of ALL_KEYS) {
    const v = sc[k];
    if (v > bestV) {
      second = bestV;
      bestV = v;
      best = k;
    } else if (v > second) second = v;
  }

  if (!best || bestV < MIN_SCORE_TO_WIN) return null;
  if (bestV - second < MIN_MARGIN && second >= MIN_SCORE_TO_WIN * 0.82) return null;

  return best;
}

export default {
  REPLY_CLASS_ORDER,
  normalizeParentFollowupForClassHe,
  classifyShortParentReplyClassHe,
};
