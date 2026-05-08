/**
 * Deterministic Parent Q&A Question Router — product first gate.
 *
 * Must run BEFORE any LLM call, BEFORE scope resolution, BEFORE any report-data augmentation.
 * For off_topic and unsafe_or_diagnostic_request, returns deterministicResponse immediately.
 * No LLM is called, no report data is touched.
 *
 * Intent taxonomy (13 product intents):
 *   off_topic                    — not about the report or learning progress
 *   ask_main_focus               — "מה הכי חשוב לתרגל", "במה להתמקד"
 *   ask_strengths                — "במה הוא חזק", "מה הולך טוב"
 *   ask_weaknesses               — "במה הוא מתקשה", "מה חלש"
 *   ask_home_practice            — "מה לעשות בבית", "איך לעזור"
 *   ask_progress_trend           — "יש שיפור", "יש ירידה", "מה השינוי"
 *   ask_subject_specific         — "מה עם אנגלית", "מה המצב במתמטיקה"
 *   ask_topic_specific           — "מה עם גאומטריה", "מה עם חיבור"
 *   ask_explain_report           — "מה הדוח אומר", "תסביר לי"
 *   ask_is_it_bad_or_concerning  — "המצב גרוע?", "צריך לדאוג?"
 *   ask_data_limitations         — "כמה אפשר לסמוך", "הנתונים אמינים?"
 *   unsafe_or_diagnostic_request — "יש לו ADHD?", "יש לקות למידה?"
 *   unknown_report_question      — legitimate report question but no specific intent matched
 */

/** @type {string} */
export const OFF_TOPIC_RESPONSE_HE =
  "אפשר לשאול כאן שאלות על הדוח והתקדמות הלמידה שמופיעה בו. למשל: מה כדאי לתרגל השבוע? או במה הילד התחזק?";

/** @type {string} */
export const DIAGNOSTIC_BOUNDARY_RESPONSE_HE =
  "על סמך הדוח הזה אי אפשר לקבוע אבחנה או להצמיד תווית קלינית. הדוח מבוסס על נתוני תרגול בלבד. אם יש חשש, מומלץ לפנות לאיש מקצוע מוסמך.";

/**
 * @typedef {(
 *   "off_topic" |
 *   "ask_main_focus" |
 *   "ask_strengths" |
 *   "ask_weaknesses" |
 *   "ask_home_practice" |
 *   "ask_progress_trend" |
 *   "ask_subject_specific" |
 *   "ask_topic_specific" |
 *   "ask_explain_report" |
 *   "ask_is_it_bad_or_concerning" |
 *   "ask_data_limitations" |
 *   "unsafe_or_diagnostic_request" |
 *   "unknown_report_question"
 * )} QaRouterIntent
 */

/**
 * @typedef {{
 *   routerIntent: QaRouterIntent;
 *   requiresLlm: boolean;
 *   deterministicResponse: string | null;
 *   exitEarly: boolean;
 * }} QaRouterResult
 */

/**
 * Normalize utterance for matching: lowercase, collapse whitespace, strip leading/trailing punctuation.
 * @param {string} raw
 * @returns {string}
 */
function normalizeForRouter(raw) {
  return String(raw || "")
    .replace(/[\u05b0-\u05c7]/g, "") // strip niqqud
    .replace(/['"״׳]/g, "")         // strip quotes
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Tier 1: Absolute off-topic patterns ────────────────────────────────────
// Must NOT touch any report data. Return deterministicResponse immediately.
const OFF_TOPIC_PATTERNS = [
  // Weather — all spellings including without ה
  /מזג\s*ה?אוויר|מזג\s*ה?אויר/u,
  // Time
  /מה\s*ה?שעה|כמה\s*ה?שעה|שעון/u,
  // Jokes
  /תספר\s*בדיחה|ספר\s*בדיחה|^בדיחה\b/u,
  // Politics / prime minister
  /מי\s*ראש\s*ה?ממשלה|ראש\s*ה?ממשלה/u,
  // Sports / who won
  /כדורגל|מי\s*ניצח|ניצח\s*ב|משחק\s*אתמול/u,
  // Recipes / food
  /מתכון\b|עוגה\b/u,
  // Crypto
  /ביטקוין|ביטקוין/u,
  // Code / programming help
  /javascript\b|עזור\s*לי\s*עם\s*קוד|קוד\s*\(/iu,
  // Shopping
  /איפה\s*לקנות|נעליים\b/u,
  // Songs
  /תכתוב\s*לי\s*שיר|תכתוב\s*שיר|^שיר\s*על/u,
  // News (non-report)
  /מה\s*ה?חדשות|חדשות\s*היום/u,
  // Chess, music, general hobbies not in report
  /מה\s*מצב.*שחמט|במוזיקה\b|שחמט\b/u,
];

// ─── Tier 2: Diagnostic / clinical requests — deterministic boundary ─────────
const DIAGNOSTIC_PATTERNS = [
  // All forms: noun, adjective, variants
  /דיסלקצי[הא]|דיסלקסי[הא]?|דיסקלקולי[הא]/u,
  /לקות\s*למידה/u,
  /הפרעת\s*קשב|בעיית\s*קשב/u,
  /\badhd\b/i,
  /מה\s*ה?אבחון|מה\s*ה?אבחנה|יש\s*אבחון|יש\s*אבחנה/u,
  /(?:יש\s*לילד|לילד\s*יש).{0,64}(?:דיסלקצי|דיסלקסי|לקות|הפרעת|adhd)/iu,
];

// ─── Tier 3: Specific product intents ────────────────────────────────────────
const INTENT_PATTERNS = /** @type {Array<{ intent: QaRouterIntent; patterns: RegExp[] }>} */ ([
  {
    intent: "ask_main_focus",
    patterns: [
      /מה\s*הכי\s*חשוב\s*(לתרגל|עכשיו|כרגע|היום|השבוע)/u,
      /במה\s*(להתמקד|לשים\s*לב|לשים\s*דגש)/u,
      /מה\s*העיקר|מה\s*ה?עדיפות|מה\s*דחוף/u,
      /איפה\s*להתחיל|מה\s*הדבר\s*הראשון|מה\s*לטפל/u,
      /מה\s*הכי\s*דחוף|מה\s*הכי\s*קריטי|מה\s*הכי\s*משמעותי/u,
    ],
  },
  {
    intent: "ask_strengths",
    patterns: [
      /במה\s*(הוא|היא|הילד|הילדה)\s*חזק|מה\s*חוזקות|נקודות\s*חוזק/u,
      /מה\s*הולך\s*טוב|מה\s*עובד\s*טוב|מה\s*(הוא|היא)\s*מצליח/u,
      /איפה\s*(הוא|היא|הילד)?\s*(הכי\s*)?חזק|מה\s*ה?חוזקה/u,
      /מה\s*טוב\s*בדוח|מה\s*חיובי|מה\s*בולט\s*לטובה/u,
      /מה\s*מרשים|מה\s*משביע\s*רצון|הצלחות\b/u,
    ],
  },
  {
    intent: "ask_weaknesses",
    patterns: [
      /במה\s*(הוא|היא|הילד|הילדה)\s*(מתקשה|חלש|חלשה)/u,
      /מה\s*(הוא|היא|הילד)?\s*מתקשה/u,
      /מה\s*חלש|מה\s*קשה|מה\s*עדיין\s*קשה/u,
      /איפה\s*(הוא|היא|הילד)?\s*(הכי\s*)?(מתקשה|חלש|קשה)/u,
      /מה\s*ה?חולשות|מה\s*דורש\s*חיזוק|מה\s*לא\s*יושב|מה\s*נופל/u,
      /מה\s*(לא\s*)?הולך\s*(טוב)?|מה\s*עדיין\s*לא\s*הולך/u,
    ],
  },
  {
    intent: "ask_home_practice",
    patterns: [
      /מה\s*לעשות\s*בבית|מה\s*לעשות\s*היום\s*בבית/u,
      /איך\s*לעזור\s*(לו|לה|לילד)?/u,
      /תוכנית\s*(לבית|קצרה|לשבוע|עבודה)/u,
      /מה\s*כדאי\s*לתרגל|מה\s*לתרגל/u,
      /איך\s*לתמוך|איך\s*לסייע/u,
    ],
  },
  {
    intent: "ask_progress_trend",
    patterns: [
      /יש\s*שיפור|יש\s*ירידה|יש\s*התקדמות/u,
      /מה\s*ה?שינוי|מה\s*השתנה|האם\s*יש\s*שינוי/u,
      /האם\s*(הוא|היא|הילד)?\s*(משתפר|מתקדם|יורד|נחלש)/u,
      /ביצועים\s*לאורך\s*זמן|מגמה\b|טרנד\b/u,
      /השוואה\s*לחודש\s*שעבר|לעומת\s*קודם/u,
    ],
  },
  {
    intent: "ask_is_it_bad_or_concerning",
    patterns: [
      /ה?מצב\s*(גרוע|רע|חמור|בעייתי)/u,
      /צריך\s*(לדאוג|לחשוש|להיות\s*מודאג)/u,
      /האם\s*זה\s*(מדאיג|חמור|גרוע|רע|נורמלי)/u,
      /כדאי\s*לדאוג|יש\s*סיבה\s*לדאגה|יש\s*מה\s*לדאוג/u,
      /האם\s*זה\s*ב?נורמה|בתחום\s*ה?נורמה/u,
      /יש\s*בעיה\s*אמיתית|זה\s*חמור|זה\s*רע/u,
      /האם\s*(יש\s*)?סיבה\s*לדאגה/u,
    ],
  },
  {
    intent: "ask_data_limitations",
    patterns: [
      /כמה\s*אפשר\s*לסמוך|האם\s*הנתונים\s*אמינים/u,
      /האם\s*יש\s*מספיק\s*נתונים|כמה\s*נתונים\s*יש/u,
      /מה\s*ה?מגבלות|מה\s*חסר\s*בדוח/u,
      /עד\s*כמה\s*הדוח\s*(מדויק|אמין|אפשר\s*לסמוך)/u,
    ],
  },
  {
    intent: "ask_explain_report",
    patterns: [
      /מה\s*ה?דוח\s*אומר|מה\s*הדוח\s*מראה/u,
      /תסביר\s*(לי)?\s*(את\s*)?(ה?דוח|ה?נתונים|ה?מצב)/u,
      /מה\s*רואים\s*בדוח|מה\s*כתוב|מה\s*המצב\s*בדוח/u,
      /תמונת\s*מצב|סיכום\s*ה?דוח|מבט\s*כללי/u,
      /מה\s*ה?שורה\s*התחתונה|מה\s*לקחת\s*מזה/u,
      /אז\s*מה\s*בעצם|בקיצור\b|מה\s*המשמעות/u,
    ],
  },
]);

/**
 * Deterministic question router — the first product gate for every parent question.
 *
 * @param {string} utteranceRaw
 * @returns {QaRouterResult}
 */
export function routeParentQuestion(utteranceRaw) {
  const t = normalizeForRouter(utteranceRaw);

  // Tier 1 — Absolute off-topic: exit immediately, no LLM, no report data
  for (const re of OFF_TOPIC_PATTERNS) {
    if (re.test(t)) {
      return {
        routerIntent: "off_topic",
        requiresLlm: false,
        deterministicResponse: OFF_TOPIC_RESPONSE_HE,
        exitEarly: true,
      };
    }
  }

  // Tier 2 — Diagnostic boundary: exit immediately, no LLM
  for (const re of DIAGNOSTIC_PATTERNS) {
    if (re.test(t)) {
      return {
        routerIntent: "unsafe_or_diagnostic_request",
        requiresLlm: false,
        deterministicResponse: DIAGNOSTIC_BOUNDARY_RESPONSE_HE,
        exitEarly: true,
      };
    }
  }

  // Tier 3 — Specific product intents (no early exit, but hint downstream)
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const re of patterns) {
      if (re.test(t)) {
        return {
          routerIntent: intent,
          requiresLlm: true,
          deterministicResponse: null,
          exitEarly: false,
        };
      }
    }
  }

  // Default: legitimate report question but no specific intent
  return {
    routerIntent: "unknown_report_question",
    requiresLlm: true,
    deterministicResponse: null,
    exitEarly: false,
  };
}

/**
 * Map router's product intent to the existing CanonicalParentIntent used downstream.
 * @param {QaRouterIntent} routerIntent
 * @returns {import("./stage-a-freeform-interpretation.js").CanonicalParentIntent | null}
 */
export function routerIntentToCanonical(routerIntent) {
  /** @type {Partial<Record<QaRouterIntent, import("./stage-a-freeform-interpretation.js").CanonicalParentIntent>>} */
  const map = {
    ask_main_focus: "what_is_most_important",
    ask_strengths: "what_is_going_well",
    ask_weaknesses: "what_is_still_difficult",
    ask_home_practice: "what_to_do_this_week",
    ask_progress_trend: "explain_report",
    ask_subject_specific: "explain_report",
    ask_topic_specific: "explain_report",
    ask_explain_report: "explain_report",
    ask_is_it_bad_or_concerning: "is_intervention_needed",
    ask_data_limitations: "report_trust_question",
    unknown_report_question: "explain_report",
  };
  return map[routerIntent] ?? null;
}

export default { routeParentQuestion, routerIntentToCanonical, OFF_TOPIC_RESPONSE_HE, DIAGNOSTIC_BOUNDARY_RESPONSE_HE };
