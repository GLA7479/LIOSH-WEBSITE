/**
 * Deterministic Hebrew keyword -> intent mapping with confidence.
 * Keeps `resolveIntent` return value backward-compatible for existing callers.
 */

/**
 * @typedef {"action_today"|"action_tomorrow"|"action_week"|"avoid_now"|"advance_or_hold"|"explain_to_child"|"ask_teacher"|"uncertainty_boundary"|"understand_observation"|"understand_meaning"} ParentCopilotIntent
 */

/**
 * @typedef {{
 *   intent: ParentCopilotIntent;
 *   confidence: number;
 *   reason: string;
 *   normalizedUtterance: string;
 *   shouldClarify: boolean;
 * }} IntentResolution
 */

const INTENT_RULES = [
  { intent: "action_today", reason: "action_today_phrase", confidence: 0.95, re: /מה\s*לעשות\s*היום|היום\s*מה|פעולה\s*היום|צעד\s*להיום|מה\s*לעשות\s*עכשיו/ },
  { intent: "action_tomorrow", reason: "action_tomorrow_phrase", confidence: 0.9, re: /מחר|להמשך\s*מחר|פעולה\s*למחר/ },
  { intent: "action_week", reason: "action_week_phrase", confidence: 0.95, re: /השבוע|שבוע\s*הקרוב|מה\s*לעשות\s*בשבוע|תוכנית\s*לשבוע/ },
  { intent: "avoid_now", reason: "avoid_phrase", confidence: 0.93, re: /מה\s*לא\s*לעשות|להימנע|לא\s*כדאי\s*עכשיו|avoid|מה\s*לא\s*כדאי/ },
  { intent: "advance_or_hold", reason: "advance_or_hold_phrase", confidence: 0.94, re: /להתקדם|לעצור|להמתין|advance|hold|לחכות\s*או\s*להמשיך/ },
  { intent: "explain_to_child", reason: "explain_to_child_phrase", confidence: 0.92, re: /איך\s*להסביר|להסביר\s*לילד|לילד|במילים\s*פשוטות\s*לילד/ },
  { intent: "ask_teacher", reason: "ask_teacher_phrase", confidence: 0.9, re: /מורה|בבית\s*הספר|לשאול\s*את|what\s*to\s*ask\s*teacher/ },
  { intent: "uncertainty_boundary", reason: "uncertainty_phrase", confidence: 0.88, re: /לא\s*ברור|חוסר\s*ודאות|ביטחון\s*נמוך|uncertain|לא\s*בטוח/ },
  { intent: "understand_observation", reason: "observation_phrase", confidence: 0.85, re: /מה\s*רואים|מה\s*נמדד|נתונים|מדדים|observation|מה\s*כתוב\s*בדוח/ },
  { intent: "understand_meaning", reason: "meaning_phrase", confidence: 0.86, re: /משמעות|מה\s*זה\s*אומר|למה|מסקנה|פירוש|תסביר\s*לי/ },
];

/**
 * @param {string} utterance
 */
function normalizeUtterance(utterance) {
  const t = String(utterance || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!t) return "";

  // Normalize common parent typos and shorthand.
  return t
    .replace(/משמעותת/g, "משמעות")
    .replace(/להיתקדם|להיתקדם/g, "להתקדם")
    .replace(/בשבו[עע]/g, "בשבוע")
    .replace(/מהזה|מה ז/g, "מה זה");
}

/**
 * @param {string} utterance
 * @returns {IntentResolution}
 */
export function resolveIntentWithConfidence(utterance) {
  const t = normalizeUtterance(utterance);
  if (!t) {
    return {
      intent: "understand_meaning",
      confidence: 0.2,
      reason: "empty_utterance_default",
      normalizedUtterance: t,
      shouldClarify: true,
    };
  }

  for (const rule of INTENT_RULES) {
    if (!rule.re.test(t)) continue;
    return {
      intent: /** @type {ParentCopilotIntent} */ (rule.intent),
      confidence: rule.confidence,
      reason: rule.reason,
      normalizedUtterance: t,
      shouldClarify: rule.confidence < 0.55,
    };
  }

  const hasQuestionMark = t.includes("?") || t.includes("?");
  const hasHebrew = /[\u0590-\u05FF]/.test(t);
  const confidence = hasQuestionMark || hasHebrew ? 0.46 : 0.35;
  return {
    intent: "understand_meaning",
    confidence,
    reason: "fallback_understand_meaning",
    normalizedUtterance: t,
    shouldClarify: confidence < 0.5,
  };
}

/**
 * Backward-compatible API.
 * @param {string} utterance
 */
export function resolveIntent(utterance) {
  return resolveIntentWithConfidence(utterance).intent;
}
