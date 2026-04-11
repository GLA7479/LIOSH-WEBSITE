/**
 * מנוע המלצות ברמת נושא/פעולה לדוח מקיף בלבד.
 * מבוסס על שורות דוח V2 (questions, accuracy, levelKey, gradeKey) + ספירת אירועי טעות לפי bucket.
 */

import { splitBucketModeRowKey } from "./parent-report-v2";
import { canonicalParentReportGradeKey } from "./math-report-generator";

/** @typedef {'advance_level'|'advance_grade_topic_only'|'maintain_and_strengthen'|'remediate_same_level'|'drop_one_level_topic_only'|'drop_one_grade_topic_only'} RecommendedNextStep */

export const RECOMMENDED_STEP_LABEL_HE = {
  advance_level: "העלאת רמת קושי — בנושא זה בלבד",
  advance_grade_topic_only: "העלאת כיתה — בנושא זה בלבד",
  maintain_and_strengthen: "לבסס באותה רמה",
  remediate_same_level: "חיזוק באותה רמה",
  drop_one_level_topic_only: "הורדת רמת קושי — בנושא זה בלבד",
  drop_one_grade_topic_only: "הורדת כיתה — בנושא זה בלבד",
};

const GRADE_ORDER = ["g1", "g2", "g3", "g4", "g5", "g6"];
const LEVEL_ORDER = ["easy", "medium", "hard"];

const MIN_Q_LOW_CONFIDENCE = 7;
const MIN_Q_STEP_CHANGE = 14;
const MIN_Q_ADVANCE_LEVEL = 18;
const MIN_Q_ADVANCE_GRADE = 22;
const MIN_Q_REMEDIATE = 10;

function gradeIndex(g) {
  if (!g || typeof g !== "string") return -1;
  return GRADE_ORDER.indexOf(g);
}

function levelIndex(l) {
  if (!l || typeof l !== "string") return -1;
  return LEVEL_ORDER.indexOf(String(l).toLowerCase());
}

function normLevelKey(row) {
  const k = row?.levelKey;
  if (!k || typeof k !== "string") return null;
  const s = k.toLowerCase();
  return LEVEL_ORDER.includes(s) ? s : null;
}

function normGradeKey(row) {
  const g = row?.gradeKey != null ? canonicalParentReportGradeKey(row.gradeKey) : null;
  return g && GRADE_ORDER.includes(g) ? g : null;
}

/**
 * שליטה נוכחית בנושא — אחוז הדיוק בטווח (0–100).
 */
function computeCurrentMastery(row) {
  return Math.max(0, Math.min(100, Math.round(Number(row?.accuracy) || 0)));
}

/**
 * יציבות משוערת: נפח + יחס טעויות (אין סדרת סשנים לפי דיוק — קירוב שמרני).
 * @returns {number} 0–1
 */
function computeStability(row, mistakeEventCount) {
  const q = Number(row?.questions) || 0;
  if (q <= 0) return 0;
  const wrong = Math.max(0, Number(row?.wrong) ?? q - (Number(row?.correct) || 0));
  const wrongRatio = wrong / q;
  const volume = Math.min(1, q / 28);
  const mistakePressure = Math.min(0.45, (mistakeEventCount || 0) / Math.max(q, 8) + wrongRatio * 0.35);
  const raw = volume * (1 - mistakePressure);
  return Math.round(Math.max(0, Math.min(1, raw)) * 100) / 100;
}

/**
 * ביטחון סטטיסטי משוער בדגימת הדיוק (נפח בלבד + עקביות טעויות).
 * @returns {number} 0–1
 */
function computeConfidence(row, mistakeEventCount) {
  const q = Number(row?.questions) || 0;
  if (q <= 0) return 0;
  const base = 1 - Math.exp(-q / 20);
  const m = Number(mistakeEventCount) || 0;
  const noise = m > q * 1.8 ? 0.75 : m > q ? 0.88 : 1;
  return Math.round(Math.max(0, Math.min(1, base * noise)) * 100) / 100;
}

function mistakeCountForRow(mistakesByBucket, bucketKey) {
  if (!mistakesByBucket || !bucketKey) return 0;
  const direct = mistakesByBucket[bucketKey];
  if (direct && typeof direct.count === "number") return direct.count;
  return 0;
}

/**
 * @param {string} step
 * @param {object} ctx
 */
function buildHebrewCopy(step, ctx) {
  const {
    displayName,
    questions: q,
    accuracy: acc,
    mistakeEventCount: mC,
    levelLabel,
    gradeLabel,
    wrongRatio,
  } = ctx;

  const mPart =
    mC >= 3
      ? ` נרשמו בטווח ${mC} אירועי טעות בנושא הזה, ולכן חשוב לקרוא את המשימה לאט לפני מענה.`
      : "";

  /** @type {Record<RecommendedNextStep, { reasonHe: string, parentHe: string, studentHe: string }>} */
  const table = {
    advance_level: {
      reasonHe: `ב«${displayName}» הופיעו ${q} שאלות עם דיוק של כ-${acc}%${mPart}. התמונה מספיק יציבה כדי לנסות דרגת קושי גבוהה יותר — רק בנושא הזה, בלי לשנות את שאר המקצוע.`,
      parentHe: `הנושא «${displayName}» נראה מבוסס: ${q} שאלות ודיוק ${acc}%. מומלץ לעלות רמת קושי אחת רק בנושא הזה במשחק, ולוודא שזה נשאר חוויה מוצלחת (שאלה–שאלה, לא מרתון ארוך).`,
      studentHe: `אתה מוכן לאתגר הבא ב«${displayName}» — ננסה רמה אחת מעלה רק שם.`,
    },
    advance_grade_topic_only: {
      reasonHe: `ב«${displayName}» כבר עובדים ברמה קשה יחסית (${levelLabel}) עם דיוק טוב (${acc}%) ונפח סביר (${q} שאלות). אפשר לנסות כיתה גבוהה יותר דווקא בנושא הזה — לא לכל המקצוע.`,
      parentHe: `אם במשחק יש בחירת כיתה לפי נושא — ב«${displayName}» אפשר לנסות כיתה אחת מעלה. זה רק לנושא הזה; בשאר הנושאים נשארים כרגיל עד שיהיו נתונים דומים.`,
      studentHe: `ב«${displayName}» אפשר לנסות כיתה קצת יותר גבוהה — רק שם, צעד אחר צעד.`,
    },
    maintain_and_strengthen: {
      reasonHe: `ב«${displayName}» יש ${q} שאלות ודיוק של כ-${acc}%${mPart}. עדיין לא בטוחים מספיק לקפיצה קדימה או אחורה — הכי נכון להישאר באותה כיתה ורמת קושי ולחזק עקביות.`,
      parentHe: `נשארים על אותה הגדרה ב«${displayName}» (כיתה ${gradeLabel}, רמה ${levelLabel}), ומוסיפים תרגול קצר וממוקד פעמיים בשבוע. המטרה: דיוק יציב לפני שמשנים משהו.`,
      studentHe: `כדאי להתאמן עוד קצת ב«${displayName}» באותה רמה — ואז נחליט על צעד הבא.`,
    },
    remediate_same_level: {
      reasonHe: `ב«${displayName}» הדיוק בינוני (${acc}%) עם ${q} שאלות${mPart}. עדיף לחזק את הבסיס באותה רמת קושי לפני שמנסים משהו חדש.`,
      parentHe: `ב«${displayName}» נשארים על רמה ${levelLabel} ומתמקדים בהבנת הטעות: אחרי כל תשובה שגויה — שאלה אחת «מה ביקשו כאן?». לא לעלות רמה עד שהדיוק יתייצב.`,
      studentHe: `נחזק קודם את הבסיס ב«${displayName}» באותה רמה — ואז נתקדם.`,
    },
    drop_one_level_topic_only: {
      reasonHe: `ב«${displayName}» הדיוק נמוך (${acc}%) והטעויות מהוות חלק משמעותי מהתרגול${mPart}. כנראה שהקושי יושב על בסיס חסר — עדיף לרדת רמה אחת רק בנושא הזה.`,
      parentHe: `ב«${displayName}» מומלץ לרדת רמת קושי אחת (רק בנושא הזה) ולתת לילד לבנות הצלחות קטנות. אחרי כמה מפגשים עם דיוק טוב — נחזור לבחון העלאה.`,
      studentHe: `נוריד רגע רמת קושי ב«${displayName}» כדי שיהיה יותר ברור — ואז יהיה קל יותר להצליח.`,
    },
    drop_one_grade_topic_only: {
      reasonHe: `ב«${displayName}» עובדים כבר ברמה הקלה ביותר (${levelLabel}) אבל הדיוק עדיין נמוך (${acc}%)${mPart}. סביר שהפער הוא כיתתי — כדאי לרדת כיתה אחת רק בנושא הזה.`,
      parentHe: `אם אפשר לבחור כיתה נפרדת לפי נושא — ב«${displayName}» כדאי כיתה אחת נמוכה יותר. בשאר הנושאים לא חייבים לשנות.`,
      studentHe: `ב«${displayName}» ננסה כיתה קצת יותר נוחה — רק שם — כדי שהכל יהיה יותר הוגן.`,
    },
  };

  return table[step] || table.maintain_and_strengthen;
}

/**
 * מודל החלטה: סדר עדיפויות משמרני (לא מעלים/יורדים מהר בלי נפח וביטחון).
 * @returns {{ step: RecommendedNextStep, reasonHe: string, parentHe: string, studentHe: string, currentMastery: number, stability: number, confidence: number }}
 */
function decideTopicNextStep(row, mistakeEventCount) {
  const q = Number(row?.questions) || 0;
  const acc = computeCurrentMastery(row);
  const wrong = Math.max(0, Number(row?.wrong) ?? 0);
  const wrongRatio = q > 0 ? wrong / q : 0;
  const levelKey = normLevelKey(row);
  const gradeKey = normGradeKey(row);
  const li = levelIndex(levelKey);
  const gi = gradeIndex(gradeKey);
  const displayName = String(row?.displayName || row?.bucketKey || "נושא").trim();

  const stability = computeStability(row, mistakeEventCount);
  const confidence = computeConfidence(row, mistakeEventCount);

  const ctx = {
    displayName,
    questions: q,
    accuracy: acc,
    mistakeEventCount,
    levelLabel: row?.level || levelKey || "לא זמין",
    gradeLabel: row?.grade || gradeKey || "לא זמין",
    wrongRatio,
  };

  const repeatedStruggle =
    q >= MIN_Q_STEP_CHANGE && acc < 52 && (mistakeEventCount >= 4 || wrongRatio >= 0.42);
  const highVolumeStrong =
    q >= MIN_Q_ADVANCE_LEVEL && acc >= 86 && stability >= 0.52 && confidence >= 0.48;
  const mistakeDrag = mistakeEventCount >= 4 && acc < 90;

  /** דגימה קטנה מדי — לא משנים רמה/כיתה; רק חיזוק באותה הגדרה */
  if (q < MIN_Q_LOW_CONFIDENCE && q > 0) {
    const step = "maintain_and_strengthen";
    const copy = buildHebrewCopy(step, ctx);
    return {
      step,
      ...copy,
      currentMastery: acc,
      stability,
      confidence,
      reasonHe: `יש רק ${q} שאלות ב«${displayName}» בטווח — מוקדם מדי לשנות כיתה או רמת קושי. עדיף עוד מפגשים קצרים באותה הגדרה ואז נבחן מחדש.`,
      parentHe: `ב«${displayName}» יש עדיין מעט נתונים (${q} שאלות). נשארים על אותה כיתה ורמה, ומוסיפים 2–3 סשנים קצרים כדי שההמלצה הבאה תהיה מדויקת יותר.`,
      studentHe: `נמשיך עוד קצת באותה רמה ב«${displayName}» — ואז נדע טוב יותר מה הלאה.`,
    };
  }

  if (repeatedStruggle && li >= 1) {
    const step = "drop_one_level_topic_only";
    const copy = buildHebrewCopy(step, ctx);
    return { step, ...copy, currentMastery: acc, stability, confidence };
  }

  if (repeatedStruggle && li === 0 && gi > 0) {
    const step = "drop_one_grade_topic_only";
    const copy = buildHebrewCopy(step, ctx);
    return { step, ...copy, currentMastery: acc, stability, confidence };
  }

  if (q >= MIN_Q_REMEDIATE && acc >= 54 && acc <= 68 && !mistakeDrag) {
    const step = "remediate_same_level";
    const copy = buildHebrewCopy(step, ctx);
    return { step, ...copy, currentMastery: acc, stability, confidence };
  }

  if (
    q >= MIN_Q_ADVANCE_GRADE &&
    levelKey === "hard" &&
    gi >= 0 &&
    gi < GRADE_ORDER.length - 1 &&
    acc >= 84 &&
    stability >= 0.55 &&
    confidence >= 0.55 &&
    !mistakeDrag
  ) {
    const step = "advance_grade_topic_only";
    const copy = buildHebrewCopy(step, ctx);
    return { step, ...copy, currentMastery: acc, stability, confidence };
  }

  if (
    highVolumeStrong &&
    levelKey &&
    li >= 0 &&
    li < LEVEL_ORDER.length - 1 &&
    !mistakeDrag
  ) {
    const step = "advance_level";
    const copy = buildHebrewCopy(step, ctx);
    return { step, ...copy, currentMastery: acc, stability, confidence };
  }

  if (q >= MIN_Q_STEP_CHANGE && acc < 55 && li >= 1) {
    const step = "drop_one_level_topic_only";
    const copy = buildHebrewCopy(step, ctx);
    return { step, ...copy, currentMastery: acc, stability, confidence };
  }

  if (q >= MIN_Q_STEP_CHANGE && acc < 55 && levelKey == null) {
    const step = "remediate_same_level";
    const copy = buildHebrewCopy(step, ctx);
    return { step, ...copy, currentMastery: acc, stability, confidence };
  }

  if (q >= MIN_Q_STEP_CHANGE && acc < 52 && li === 0 && gi > 0) {
    const step = "drop_one_grade_topic_only";
    const copy = buildHebrewCopy(step, ctx);
    return { step, ...copy, currentMastery: acc, stability, confidence };
  }

  if (q >= MIN_Q_REMEDIATE && acc < 62 && acc >= 48) {
    const step = "remediate_same_level";
    const copy = buildHebrewCopy(step, ctx);
    return { step, ...copy, currentMastery: acc, stability, confidence };
  }

  const step = "maintain_and_strengthen";
  const copy = buildHebrewCopy(step, ctx);
  return { step, ...copy, currentMastery: acc, stability, confidence };
}

const MISTAKE_ANALYSIS_KEY = {
  math: "mathMistakesByOperation",
  geometry: "geometryMistakesByTopic",
  english: "englishMistakesByTopic",
  science: "scienceMistakesByTopic",
  hebrew: "hebrewMistakesByTopic",
  "moledet-geography": "moledetGeographyMistakesByTopic",
};

function rowBucketKeyForMistakes(row, mapKey) {
  const bk = row?.bucketKey;
  if (bk) return String(bk);
  return null;
}

/**
 * בונה רשומת המלצה לשורת נושא אחת ממפת הדוח.
 * @param {string} subjectId
 * @param {string} topicRowKey מפתח בשורת המפה (כולל מצב למתמטיקה)
 * @param {object} row
 * @param {Record<string, {count?: number}>} mistakesByBucket
 */
export function buildTopicRecommendationRecord(subjectId, topicRowKey, row, mistakesByBucket) {
  const bucketKey = rowBucketKeyForMistakes(row) || splitBucketModeRowKey(String(topicRowKey)).bucketKey;
  const mC = mistakeCountForMistakes(mistakesByBucket, bucketKey, subjectId, topicRowKey, row);
  const decision = decideTopicNextStep(row, mC);
  const q = Number(row?.questions) || 0;

  return {
    subject: subjectId,
    topicRowKey: String(topicRowKey),
    displayName: String(row?.displayName || bucketKey || topicRowKey),
    bucketKey: bucketKey || null,
    modeKey: row?.modeKey ?? null,
    questions: q,
    accuracy: Number(row?.accuracy) || 0,
    wrong: Number(row?.wrong) || 0,
    mistakeEventCount: mC,
    gradeKey: normGradeKey(row),
    levelKey: normLevelKey(row),
    currentMastery: decision.currentMastery,
    stability: decision.stability,
    confidence: decision.confidence,
    recommendedNextStep: decision.step,
    recommendedStepLabelHe: RECOMMENDED_STEP_LABEL_HE[decision.step] || decision.step,
    recommendedStepReasonHe: decision.reasonHe,
    recommendedParentActionHe: decision.parentHe,
    recommendedStudentActionHe: decision.studentHe,
  };
}

/**
 * טעינת ספירת טעויות: לרוב לפי bucketKey; ניסיון התאמה נוסף למפתח השורה.
 */
function mistakeCountForMistakes(mistakesByBucket, bucketKey, _subjectId, topicRowKey, row) {
  if (!mistakesByBucket || typeof mistakesByBucket !== "object") return 0;
  let n = mistakeCountForRow(mistakesByBucket, bucketKey);
  if (n > 0) return n;
  const alt = mistakeCountForRow(mistakesByBucket, String(topicRowKey));
  if (alt > 0) return alt;
  if (row?.displayName) {
    const d = mistakeCountForRow(mistakesByBucket, String(row.displayName));
    if (d > 0) return d;
  }
  return 0;
}

/**
 * כל ההמלצות לפי מקצוע, ממוינות לפי דחיפות ואז נפח.
 * @param {string} subjectId
 * @param {Record<string, object>} topicMap
 * @param {object} analysis analysis מ־generateParentReportV2
 */
export function buildTopicRecommendationsForSubject(subjectId, topicMap, analysis) {
  const aKey = MISTAKE_ANALYSIS_KEY[subjectId];
  const mistakesByBucket = (analysis && analysis[aKey]) || {};

  const rows = [];
  if (!topicMap || typeof topicMap !== "object") return rows;

  for (const [topicRowKey, row] of Object.entries(topicMap)) {
    if (!row || typeof row !== "object") continue;
    const q = Number(row.questions) || 0;
    if (q <= 0) continue;
    rows.push(buildTopicRecommendationRecord(subjectId, topicRowKey, row, mistakesByBucket));
  }

  const urgency = (s) => {
    const o = {
      drop_one_grade_topic_only: 0,
      drop_one_level_topic_only: 1,
      remediate_same_level: 2,
      maintain_and_strengthen: 3,
      advance_level: 4,
      advance_grade_topic_only: 5,
    };
    return o[s] ?? 9;
  };

  rows.sort((a, b) => {
    const u = urgency(a.recommendedNextStep) - urgency(b.recommendedNextStep);
    if (u !== 0) return u;
    return b.questions - a.questions;
  });

  return rows;
}
