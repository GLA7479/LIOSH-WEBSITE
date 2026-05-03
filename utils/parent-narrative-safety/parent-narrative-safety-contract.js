/**
 * Parent narrative safety — shared patterns and engine snapshot shape (validation-only).
 * Hebrew product copy is validated; English comments only.
 */

/** @typedef {"pass"|"warning"|"block"} NarrativeSafetyStatus */
/** @typedef {"none"|"low"|"medium"|"high"} NarrativeSafetySeverity */

/**
 * Minimal engine snapshot for guard checks (subset of real report / V2 payloads).
 * Unknown fields are ignored.
 *
 * @typedef {object} ParentNarrativeEngineOutput
 * @property {string[]} [doNotConclude]
 * @property {boolean} [cannotConclude]
 * @property {boolean} [thinData]
 * @property {number} [questionCount]
 * @property {"strong"|"medium"|"weak"|"thin"|"low"|"insufficient"} [dataSufficiencyLevel]
 * @property {"high"|"medium"|"low"|"insufficient"} [engineConfidence]
 * @property {"strong"|"moderate"|"weak"|"withheld"} [conclusionStrengthAllowed]
 * @property {string|null} [recommendedNextStepHe]
 * @property {"maintain"|"maintain_only"|"advance_ok"|"none"} [recommendationTier]
 * @property {"suspected"|"confirmed"|"none"|null} [prerequisiteGapLevel]
 * @property {boolean} [guessingLikelihoodHigh]
 * @property {string[]} [mustNotSay]
 */

/**
 * @typedef {object} ParentNarrativeReportContext
 * @property {"short"|"detailed"|"topic_row"|"letter"|"copilot"|"other"} [surface]
 * @property {string} [subjectId]
 */

/** Clinical / medical / disability-framing — parent report must not use (block). */
export const MEDICAL_DIAGNOSTIC_RES = [
  /דיסלקציה|דיסלקסיה|דיסקלקוליה/u,
  /לקות\s*למידה/u,
  /הפרעת\s*קשב|ADHD/u,
  /הפרעה\s*נוירולוגית|הפרעה\s*פסיכיאטרית/u,
  /אבחון\s*רפואי|אבחנה\s*קלינית|אבחון\s*קליני/u,
  /פסיכולוג\s*קליני|רופא\s*מומחה/u,
];

/** Absolute certainty — risky when engine forbids strong conclusions or has low confidence. */
export const OVERCONFIDENT_PHRASE_RES = [
  /בוודאות/u,
  /חד[\s-]*משמעי(?:ת)?/u,
  /אין\s*ספק/u,
  /ברור\s*ש(?!רק)/u, // allow "ברור שרק" careful? keep simple: ברור ש
  /מוכיח\s*במלואו|הוכחה\s*חד[\s-]*משמעית/u,
  /ללא\s*ספק\s*(?:ש|כי)/u,
];

/** Hedging / observational — reduces risk when evidence is thin. */
export const CAUTIOUS_HEDGE_RES = [
  /נראה\s*ש/u,
  /ייתכן\s*ש/u,
  /עדיין\s*מוקדם/u,
  /מהנתונים\s*כאן/u,
  /לא\s*ברור\s*עדיין/u,
  /כדאי\s*לאסוף/u,
  /אין\s*מספיק\s*נתונים/u,
  /עדיין\s+מעט\s+נתון/u,
];

/**
 * Hebrew narrative explicitly acknowledges limited evidence / need for more data.
 * When matched on thin engine rows, these are treated as safe framing (info), not `ambiguous_evidence`.
 */
export const SAFE_THIN_DATA_CAUTION_RES = [
  /אין\s+מספיק\s+נתונים\s+כדי\s+להסיק/u,
  /אין\s+מספיק\s+נתונים/u,
  /אין\s+די\s+נתון/u,
  /נתון\s*דל/u,
  /נתון\s+מצומצם/u,
  /עדיין\s+מעט\s+נתון/u,
  /מעט\s+נתון\s+בתקופה/u,
  /בתקופה\s+הנוכחית/u,
  /לא\s+מסכמים\s+ביטחון\s*סטטיסטי/u,
  /לא\s+מסכמים\s+ביטחון/u,
  /עדיין\s+אין\s+מספיק\s+דוגמאות/u,
  /אין\s+מספיק\s+דוגמאות/u,
  /כדאי\s+להמשיך\s+לאסוף\s+עוד/u,
  /כדאי\s+לאסוף\s+עוד/u,
  /לא\s+לבנות\s+תוכנית\s+ארוכה/u,
  /לפני\s+שיש\s+נתון/u,
  /אחרי\s+עוד\s+קצת\s+תרגול/u,
  /לנסח\s+תמונה\s+מלאה/u,
  /תמונה\s+מלאה\s+יותר/u,
  /קשה\s+להסיק\s+מסקנה/u,
  /לא\s+ניתן\s+להסיק/u,
  /עדיין\s+מוקדם\s+להסיק/u,
  /מוקדם\s+להסיק/u,
  /לפני\s+שמחליטים/u,
  /לפני\s+החלטה/u,
  /נדרש(?:ים)?\s+עוד\s+דוגמאות/u,
  /כדי\s+לראות\s+טעות\s+חוזרת/u,
  /לא\s+להסיק\s+מסקנות\s+חזקות/u,
  /צריך\s+עוד\s+כמה\s+דוגמאות/u,
  /עדיין\s+לא\s+ברור\s+מה/u,
];

/**
 * Strong claims or prescriptions despite thin data — still warn (do not treat as safe caution).
 */
export const UNSAFE_THIN_DATA_MIXED_CONCLUSION_RES = [
  /ניתן\s+לקבוע/u,
  /לקבוע\s+חולשה/u,
  /חולשה\s*משמעותית/u,
  /בעיה\s*ברורה/u,
  /למרות\s+ש(?:יש|מעט).{0,120}ברור\s+ש/u,
  /אין\s+מספיק\s+מידע.{0,80}אבל.{0,80}ברור/u,
  /על\s+בסיס\s+(?:שתי|שלוש|שלושת|מספר\s+מצומצם\s+של)/u,
  /למרות\s+שיש\s+מעט\s+נתונים.{0,80}ברור\s+ש/u,
];

/** Traits framed as permanent — block in educational reporting. */
export const PERMANENT_ABILITY_RES = [
  /לעולם\s*לא\s*י(?:למד|צליח)/u,
  /תמיד\s*נכשל/u,
  /לא\s*מסוגל\s*מטבעו/u,
  /לא\s*יוכל\s*לעולם/u,
];

/** Escalation wording when only maintenance is supported. */
export const UNSUPPORTED_ADVANCE_RES = [
  /העל(?:ים|ות)\s*(?:את\s*)?הרמה/u,
  /להעלות\s*(?:את\s*)?הרמה/u,
  /קפיצה\s*לרמה/u,
  /רמה\s*גבוהה\s*מיד/u,
  /בהכרח\s*להתקדם/u,
  /חובה\s*להתקדם/u,
  /חובה\s*לדלג/u,
];

/** Strong mastery claims — unsafe if guessing is likely. */
export const MASTERY_CLAIM_RES = [/שליטה\s*מלאה/u, /מצב\s*מאסטרי/u, /מושלם\s*בנושא/u, /ביצועים\s*מושלמים/u];

/** Strong gap / prerequisite claims — unsafe if only suspected. */
export const OVERSTATED_GAP_RES = [/חוסר\s*יסוד\s*מוכח/u, /מוכח\s*לחלוטין\s*שחסר/u, /הוכח\s*חוסר/u];

/** Default parent-facing phrases that must never appear (subset; extend via engineOutput.mustNotSay). */
export const DEFAULT_MUST_NOT_SAY = [
  "מאסטרי",
  "טקסונומיה",
  "probe",
  "fallback",
  "insufficient_data",
];

export const ISSUE_CODES = {
  medical_language: "medical_language",
  must_not_say: "must_not_say",
  overconfident: "overconfident",
  thin_data_strong: "thin_data_strong",
  do_not_conclude_violation: "do_not_conclude_violation",
  engine_confidence_contradiction: "engine_confidence_contradiction",
  recommendation_unsupported: "recommendation_unsupported",
  permanent_trait: "permanent_trait",
  guessing_as_mastery: "guessing_as_mastery",
  prerequisite_overstated: "prerequisite_overstated",
  ambiguous_evidence: "ambiguous_evidence",
};
