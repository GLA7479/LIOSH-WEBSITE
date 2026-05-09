/**
 * Parent Q&A Question Classifier — first product gate.
 *
 * Replaces the regex-only first gate with a two-tier signal model that produces
 * exactly 4 product buckets:
 *   - off_topic               (not about the report / child / learning)
 *   - diagnostic_sensitive    (asks for a clinical label / diagnosis)
 *   - ambiguous_or_unclear    (too short, contradictory, or pure topic-name without report intent)
 *   - report_related          (clearly asking about this report / child's learning)
 *
 * Architecture:
 *   - The deterministic step is the primary decider. It uses small CATEGORY lexicons
 *     (not a long regex FAQ list) plus payload-derived subject/topic vocabulary.
 *   - WEAK report tokens (e.g. הוא, היא, הילד, השבוע, היום, בבית) cannot classify a
 *     question as report_related on their own; they must combine with at least one
 *     STRONG report token (תרגול, מתקשה, חזק, לתרגל, לפי הדוח, etc.) or a strong
 *     report intent phrase. This guards against "הוא אוהב פיצה?" being classified
 *     as report_related.
 *   - Generic-knowledge framing (מה זה, מי המציא, איך מכינים, מי כתב) clamps
 *     report_signal so that even a topic-name match cannot push the question into
 *     report_related. "מה זה פוטוסינתזה?" stays off_topic even when science is in
 *     the report. The parent must phrase it as "מה עם פוטוסינתזה בדוח?" or
 *     "הוא מתקשה בפוטוסינתזה?" to trigger report_related.
 *   - On low confidence, the deterministic step returns ambiguous_or_unclear and
 *     defers the upgrade to the optional LLM classifier (see question-classifier-llm.js).
 *
 * Hard gate guarantee for index.js: for any non-report_related bucket, no TruthPacket
 * is built, no answer-LLM is called, and no report data appears in the response.
 */

import { SUBJECT_ORDER, normalizeSubjectId } from "./contract-reader.js";

/**
 * @typedef {(
 *   "report_related" |
 *   "off_topic" |
 *   "diagnostic_sensitive" |
 *   "ambiguous_or_unclear"
 * )} ClassifierBucket
 */

/**
 * @typedef {{
 *   bucket: ClassifierBucket;
 *   confidence: number;
 *   source: "deterministic" | "llm" | "fallback";
 *   signals: {
 *     reportSignal: number;
 *     offTopicSignal: number;
 *     diagnosticSignal: number;
 *     ambiguitySignal: number;
 *     hasStrongReportToken: boolean;
 *     hasGenericKnowledgeFraming: boolean;
 *     subjectTopicNameMatched: boolean;
 *     pronounsMatched: boolean;
 *     meaningfulTokenCount: number;
 *   };
 * }} ClassifierResult
 */

/**
 * Public boundary copy. Imported by question-router.js / index.js.
 */
export const OFF_TOPIC_RESPONSE_HE =
  "אפשר לשאול כאן שאלות על הדוח והתקדמות הלמידה שמופיעה בו. למשל: מה כדאי לתרגל השבוע? או במה הילד התחזק?";

export const DIAGNOSTIC_BOUNDARY_RESPONSE_HE =
  "על סמך הדוח הזה אי אפשר לקבוע אבחנה או להצמיד תווית קלינית. הדוח מבוסס על נתוני תרגול בלבד. אם יש חשש, מומלץ לפנות לאיש מקצוע מוסמך.";

export const AMBIGUOUS_RESPONSE_HE =
  "לא הבנתי בדיוק על מה השאלה. אפשר לשאול כאן שאלות על הדוח, למשל: מה הכי חשוב לתרגל השבוע? במה הילד התחזק? או מה לעשות בבית?";

/**
 * Decision thresholds. Exported so tests can assert behavior without re-deriving them.
 */
export const CLASSIFIER_THRESHOLDS = Object.freeze({
  diagnostic: 0.7,
  offTopic: 0.4,
  reportRelated: 0.5,
  reportRelatedOffTopicCeiling: 0.3,
  llmConfidenceFloor: 0.7,
  meaningfulTokenMinForReport: 2,
});

const STRONG_REPORT_TOKEN_WEIGHT = 0.35;
const STRONG_REPORT_INTENT_WEIGHT = 0.5;
const WEAK_REPORT_TOKEN_WEIGHT = 0.1;
const SUBJECT_TOPIC_VOCAB_WEIGHT = 0.2;
const OFF_TOPIC_CATEGORY_WEIGHT = 0.4;
const MIXED_INTENT_PENALTY = 0.3;

// ─── Lexicons (intentionally short and category-based) ──────────────────────

/** STRONG report tokens — each contributes 0.35 to reportSignal. */
const STRONG_REPORT_TOKENS = [
  // Verbs / actions about practice and learning
  "תרגול", "להתאמן", "מתאמן", "מתאמנת", "להתקדם", "מתקדם", "מתקדמת",
  "התקדמות", "להתמקד", "לתרגל", "לתרגול", "לחזור על", "תרגיל", "תרגילים",
  // Strengths / weaknesses / state about the child's performance
  "חוזקה", "חוזקות", "חזק", "חזקה", "חזקים",
  "קושי", "קשיים", "מתקשה", "מתקשים", "חלש", "חלשה", "חלשים",
  "ציון", "ציונים", "הצלחה", "הצלחות",
  "שיפור", "ירידה", "מגמה",
  // Help / report references
  "לעזור לו", "לעזור לה", "איך לעזור", "איך אעזור", "איך נעזור",
  "לפי הדוח", "על פי הדוח", "מהדוח", "בדוח", "הדוח אומר", "הדוח מראה",
];

/** STRONG report intent phrases — match as substrings (after fold). */
const STRONG_REPORT_INTENTS = [
  /במה.{0,12}חזק/u, /במה.{0,12}מתקשה/u, /במה.{0,12}חלש/u,
  /מה.{0,8}לתרגל/u, /מה.{0,8}לעשות.{0,8}בבית/u, /איך.{0,8}לעזור/u,
  /מה.{0,8}הכי.{0,8}חשוב/u, /איפה.{0,8}להתמקד/u, /איפה.{0,8}להתחיל/u,
  /יש.{0,3}שיפור/u, /יש.{0,3}ירידה/u, /יש.{0,3}התקדמות/u,
  /סיבה.{0,3}לדאגה/u, /צריך.{0,3}לדאוג/u,
  /נקודות.{0,3}חוזק/u, /הצלחות/u,
  /בקצרה|תסביר.{0,3}לי.{0,3}את.{0,3}הדוח|מה.{0,3}הדוח.{0,3}אומר/u,
];

/** WEAK tokens — only count when paired with a STRONG token or strong intent. */
const WEAK_REPORT_TOKENS = [
  // Pronouns referring to the child
  "הוא", "היא", "הילד", "הילדה", "הבן", "הבת", "בני", "בתי",
  // Time / context
  "השבוע", "היום", "השנה", "החודש", "בבית",
];

/** Off-topic category lexicons. Short, category-based. */
const OFF_TOPIC_CATEGORIES = {
  weather: ["מזג", "אוויר", "אויר", "ממטרים", "גשם", "שלג", "טמפרטורה"],
  time: ["מה השעה", "השעון", "כמה השעה"],
  jokes_chat: ["בדיחה", "תספר בדיחה", "ספר בדיחה", "תספר לי משהו"],
  politics: ["ראש הממשלה", "ראש ממשלה", "כנסת", "בחירות", "מפלגה", "בנימין"],
  sports: ["כדורגל", "כדורסל", "מי ניצח", "המכבייה", "אולימפיאדה", "משחק אתמול"],
  food: ["מתכון", "עוגה", "פיצה", "המבורגר", "מאכל", "ארוחה", "מה לאכול", "איך מכינים"],
  code: ["javascript", "java script", "פייתון", "קוד תקין", "תכנות"],
  shopping: ["איפה לקנות", "כמה עולה", "מחיר של", "נעליים", "ביטקוין", "מטבע", "דולר"],
  songs: ["תכתוב לי שיר", "שיר על", "כתוב שיר"],
  news: ["מה החדשות", "חדשות היום", "מה קרה בעולם"],
  generic_knowledge_qa: [
    "מה זה ", "מהו ", "מהי ", "מי המציא", "מי גילה", "מי כתב", "מתי קרה",
    "באיזו שנה", "באיזה תאריך", "איפה נמצאת", "איפה נמצא",
  ],
  trivia: ["הארי פוטר", "נארניה", "פוטוסינתזה", "פירמידות", "פרל הארבור"],
  // Note: phrases like "מה אתה חושב", "מה דעתך", "תסביר" are intentionally
  //       NOT in smalltalk because we want them to surface as ambiguous_or_unclear,
  //       so the LLM upgrade can decide based on context. Smalltalk targets only
  //       phrases that are clearly about the bot itself.
  smalltalk: ["מי אתה", "מה השם שלך", "אתה בוט", "אתה אדם"],
  computation: ["כמה זה ", "תחשב לי", "תפתור לי "],
  hobbies_general: ["שחמט", "מוזיקה", "אמנות", "מחול"],
};

/**
 * Generic-knowledge framing — clamps reportSignal even on subject/topic match.
 * IMPORTANT: JavaScript's `\b` matches ASCII word boundaries only (`[A-Za-z0-9_]`).
 * Hebrew letters are NOT word characters, so `\b` after a Hebrew character does
 * not match. We use `(?:\s|$)` explicitly instead.
 */
const GENERIC_KNOWLEDGE_FRAMING = [
  /^מה\s+זה(?:\s|$)/u,
  /^(מהו|מהי)(?:\s|$)/u,
  /^מי\s+המציא(?:\s|$)/u,
  /^מי\s+גילה(?:\s|$)/u,
  /^מי\s+כתב(?:\s|$)/u,
  /^איך\s+מכינים(?:\s|$)/u,
  /^כמה\s+עולה(?:\s|$)/u,
  /^כמה\s+זה(?:\s|$)/u,
  /^באיזו?\s+(שנה|תאריך)(?:\s|$)/u,
  /^הסבר\s+לי\s+מה\s+זה(?:\s|$)/u,
  /תסביר\s+לי\s+על\s+(?!הדוח)/u,
];

/** Diagnostic / clinical lexicon — independent of report context. */
const DIAGNOSTIC_PATTERNS = [
  /דיסלקצי[הא]|דיסלקסי[הא]?|דיסלקסי[ת]?\b|דיסקלקולי[הא]/u,
  /לקות\s*למידה/u,
  /הפרעת\s*קשב|בעיית\s*קשב|הפרעות\s*קשב/u,
  /\badhd\b/i,
  /אוטיסט|על\s*הספקטרום|אוטיזם/u,
  /חרד[הת]\s*(חברתית|מתמדת|של|אצל)?|חרדות\s*(של|אצל)?/u,
  /\bocd\b/i,
  /(הוא|היא|הילד|הילדה).{0,16}(בסדר\s*רגשית|רגשית\s*בסדר)/u,
  /רגשית\s*בסדר|רגשי\s*בסדר/u,
  /יש\s*לו\s*אבחון|יש\s*לה\s*אבחון|מה\s*ה?אבחון|מה\s*ה?אבחנה/u,
  /(?:יש\s*לילד|לילד\s*יש|יש\s*לילדה|לילדה\s*יש|יש\s*לו|יש\s*לה).{0,40}(?:דיסלקצי|דיסלקסי|דיסקלקולי|לקות|הפרעת|adhd|אוטיז|אוטיסט)/iu,
];

// ─── Normalization ──────────────────────────────────────────────────────────

/**
 * Strip niqqud, quotes, punctuation; lowercase; collapse whitespace.
 * @param {string} raw
 */
function normalizeForClassifier(raw) {
  return String(raw || "")
    .replace(/[\u05b0-\u05c7]/g, "")
    .replace(/['"״׳`]/g, "")
    .replace(/[?!.,:;]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Count meaningful tokens (after dropping fillers). */
function countMeaningfulTokens(normalized) {
  if (!normalized) return 0;
  const drops = new Set([
    "אבל", "כן", "לא", "טוב", "אוקיי", "אוקי", "תודה", "סליחה",
    "אז", "אה", "הא", "אהה", "אממ", "אם", "ש", "אש", "ב", "ל", "מ",
  ]);
  const tokens = normalized.split(/\s+/).filter((t) => t.length >= 2 && !drops.has(t));
  return tokens.length;
}

// ─── Payload-derived vocabulary ─────────────────────────────────────────────

/**
 * Extract subject + topic display name vocabulary from the report payload.
 * @param {unknown} payload
 * @returns {{ subjectsHe: string[]; topicsHe: string[] }}
 */
function extractReportVocabulary(payload) {
  /** @type {string[]} */
  const subjectsHe = [];
  /** @type {string[]} */
  const topicsHe = [];
  const profiles = Array.isArray(payload?.subjectProfiles) ? payload.subjectProfiles : [];
  for (const sp of profiles) {
    const sid = normalizeSubjectId(sp?.subject);
    if (!sid) continue;
    const subjectLabel = subjectLabelLocalHe(sid);
    if (subjectLabel) subjectsHe.push(subjectLabel.toLowerCase());
    const recs = Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : [];
    for (const tr of recs) {
      const dn = String(tr?.displayName || "").trim().toLowerCase();
      if (dn.length >= 3) topicsHe.push(dn);
    }
  }
  return { subjectsHe, topicsHe };
}

/**
 * Local Hebrew subject label map. Mirrors contract-reader's SUBJECT_ORDER.
 * Avoids importing display dictionaries that are tied to UI layers.
 * @param {string} subjectId
 */
function subjectLabelLocalHe(subjectId) {
  const sid = normalizeSubjectId(subjectId);
  switch (sid) {
    case "math": return "חשבון";
    case "geometry": return "גאומטריה";
    case "english": return "אנגלית";
    case "science": return "מדעים";
    case "hebrew": return "עברית";
    case "moledet-geography": return "מולדת";
    default: return "";
  }
}

// ─── Signal scorers ─────────────────────────────────────────────────────────

/**
 * @param {string} t — normalized utterance
 * @param {{ subjectsHe: string[]; topicsHe: string[] }} vocab
 */
function scoreReportSignal(t, vocab) {
  let score = 0;
  let hasStrong = false;
  let pronounsMatched = false;
  let subjectTopicNameMatched = false;
  let hasGenericKnowledgeFraming = false;

  for (const tok of STRONG_REPORT_TOKENS) {
    if (t.includes(tok.toLowerCase())) {
      score += STRONG_REPORT_TOKEN_WEIGHT;
      hasStrong = true;
    }
  }
  for (const re of STRONG_REPORT_INTENTS) {
    if (re.test(t)) {
      score += STRONG_REPORT_INTENT_WEIGHT;
      hasStrong = true;
    }
  }
  for (const tok of WEAK_REPORT_TOKENS) {
    if (new RegExp(`(^|\\s)${tok}(\\s|$)`, "u").test(t)) {
      if (tok === "הוא" || tok === "היא" || tok === "הילד" || tok === "הילדה" ||
          tok === "הבן" || tok === "הבת" || tok === "בני" || tok === "בתי") {
        pronounsMatched = true;
      }
    }
  }
  if (hasStrong) {
    for (const tok of WEAK_REPORT_TOKENS) {
      if (new RegExp(`(^|\\s)${tok}(\\s|$)`, "u").test(t)) {
        score += WEAK_REPORT_TOKEN_WEIGHT;
      }
    }
  }

  // Subject / topic name matches
  for (const lbl of vocab.subjectsHe) {
    if (lbl && t.includes(lbl)) {
      subjectTopicNameMatched = true;
      score += SUBJECT_TOPIC_VOCAB_WEIGHT;
      break;
    }
  }
  for (const lbl of vocab.topicsHe) {
    if (lbl && t.includes(lbl)) {
      subjectTopicNameMatched = true;
      score += SUBJECT_TOPIC_VOCAB_WEIGHT;
      break;
    }
  }

  // Generic-knowledge framing clamp
  for (const re of GENERIC_KNOWLEDGE_FRAMING) {
    if (re.test(t)) {
      hasGenericKnowledgeFraming = true;
      break;
    }
  }
  if (hasGenericKnowledgeFraming && score > 0.3) {
    score = 0.3;
  }

  return {
    score: Math.min(1, score),
    hasStrong,
    pronounsMatched,
    subjectTopicNameMatched,
    hasGenericKnowledgeFraming,
  };
}

/**
 * @param {string} t — normalized utterance
 * @param {boolean} hasStrongReportToken
 */
function scoreOffTopicSignal(t, hasStrongReportToken) {
  let score = 0;
  for (const cat of Object.values(OFF_TOPIC_CATEGORIES)) {
    for (const phrase of cat) {
      if (t.includes(phrase.toLowerCase())) {
        score += OFF_TOPIC_CATEGORY_WEIGHT;
      }
    }
  }
  // Cap and reduce when a STRONG report token is also present (mixed intent).
  score = Math.min(1, score);
  if (hasStrongReportToken && score > 0) {
    score = Math.max(0, score - MIXED_INTENT_PENALTY);
  }
  return score;
}

/**
 * @param {string} t — normalized utterance
 */
function scoreDiagnosticSignal(t) {
  for (const re of DIAGNOSTIC_PATTERNS) {
    if (re.test(t)) return 0.95;
  }
  return 0;
}

// ─── Main entry ─────────────────────────────────────────────────────────────

/**
 * Run the deterministic classifier. Pure / sync / no I/O.
 *
 * @param {{ utterance: string; payload?: unknown }} args
 * @returns {ClassifierResult}
 */
export function classifyParentQuestionDeterministic({ utterance, payload }) {
  const t = normalizeForClassifier(utterance);
  const vocab = extractReportVocabulary(payload);
  const meaningfulTokenCount = countMeaningfulTokens(t);

  const reportRes = scoreReportSignal(t, vocab);
  const offTopicSignal = scoreOffTopicSignal(t, reportRes.hasStrong);
  const diagnosticSignal = scoreDiagnosticSignal(t);
  const ambiguitySignal = computeAmbiguity({
    meaningfulTokenCount,
    reportSignal: reportRes.score,
    offTopicSignal,
    hasStrong: reportRes.hasStrong,
    subjectTopicNameMatched: reportRes.subjectTopicNameMatched,
    pronounsMatched: reportRes.pronounsMatched,
  });

  const signals = {
    reportSignal: reportRes.score,
    offTopicSignal,
    diagnosticSignal,
    ambiguitySignal,
    hasStrongReportToken: reportRes.hasStrong,
    hasGenericKnowledgeFraming: reportRes.hasGenericKnowledgeFraming,
    subjectTopicNameMatched: reportRes.subjectTopicNameMatched,
    pronounsMatched: reportRes.pronounsMatched,
    meaningfulTokenCount,
  };

  // Decision rules in strict order.
  // 1. Diagnostic takes precedence over everything (clinical safety).
  if (diagnosticSignal >= CLASSIFIER_THRESHOLDS.diagnostic) {
    return {
      bucket: "diagnostic_sensitive",
      confidence: diagnosticSignal,
      source: "deterministic",
      signals,
    };
  }

  // 2. Off-topic: clear category match AND no strong report token.
  if (offTopicSignal >= CLASSIFIER_THRESHOLDS.offTopic && !reportRes.hasStrong) {
    return {
      bucket: "off_topic",
      confidence: offTopicSignal,
      source: "deterministic",
      signals,
    };
  }

  // 3. Report-related: needs strong signal AND low off-topic AND meaningful length.
  if (
    reportRes.score >= CLASSIFIER_THRESHOLDS.reportRelated &&
    offTopicSignal <= CLASSIFIER_THRESHOLDS.reportRelatedOffTopicCeiling &&
    reportRes.hasStrong &&
    meaningfulTokenCount >= CLASSIFIER_THRESHOLDS.meaningfulTokenMinForReport
  ) {
    return {
      bucket: "report_related",
      confidence: reportRes.score,
      source: "deterministic",
      signals,
    };
  }

  // 4. Subject/topic match without strong intent => ambiguous (NOT report_related).
  //    "תסביר לי שברים" or "מה עם גאומטריה?" without strong report verb.
  //    Note: "מה עם X?" is a common parent shorthand for "what about X in the report".
  //    We treat it as ambiguous so the LLM upgrade can decide; the deterministic
  //    fallback for "מה עם גאומטריה" will be report_related via the dedicated
  //    "מה עם" rule below.
  if (
    reportRes.subjectTopicNameMatched &&
    !reportRes.hasStrong &&
    /^מה\s+עם(?:\s|$)/u.test(t)
  ) {
    // "מה עם <topic>?" is a clear report-related shorthand even without explicit verb.
    return {
      bucket: "report_related",
      confidence: 0.65,
      source: "deterministic",
      signals: { ...signals, hasStrongReportToken: true },
    };
  }

  // 5. Everything else => ambiguous_or_unclear (the LLM may upgrade in async path).
  return {
    bucket: "ambiguous_or_unclear",
    confidence: ambiguitySignal,
    source: "deterministic",
    signals,
  };
}

/**
 * @param {{
 *   meaningfulTokenCount: number;
 *   reportSignal: number;
 *   offTopicSignal: number;
 *   hasStrong: boolean;
 *   subjectTopicNameMatched: boolean;
 *   pronounsMatched: boolean;
 * }} args
 */
function computeAmbiguity(args) {
  let amb = 0;
  if (args.meaningfulTokenCount < 2) amb += 0.6;
  if (args.reportSignal >= 0.4 && args.offTopicSignal >= 0.4) amb += 0.4;
  if (args.subjectTopicNameMatched && !args.hasStrong) amb += 0.3;
  if (!args.hasStrong && args.pronounsMatched && args.offTopicSignal < 0.4) amb += 0.2;
  return Math.min(1, amb);
}

/**
 * Map classifier bucket to the existing CanonicalParentIntent used downstream.
 * @param {ClassifierBucket} bucket
 */
export function bucketToCanonicalIntent(bucket) {
  switch (bucket) {
    case "off_topic": return "off_topic_redirect";
    case "diagnostic_sensitive": return "clinical_boundary";
    case "ambiguous_or_unclear": return "unclear";
    case "report_related":
    default:
      return null;
  }
}

export default {
  classifyParentQuestionDeterministic,
  bucketToCanonicalIntent,
  OFF_TOPIC_RESPONSE_HE,
  DIAGNOSTIC_BOUNDARY_RESPONSE_HE,
  AMBIGUOUS_RESPONSE_HE,
  CLASSIFIER_THRESHOLDS,
};
