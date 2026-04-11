/**
 * מנוע המלצות ברמת נושא/פעולה לדוח מקיף בלבד.
 * מבוסס על שורות דוח V2 + מפת טעויות (עם נירמול מפתחות מול אחסון אמיתי).
 */

import { splitBucketModeRowKey } from "./parent-report-row-diagnostics";
import { canonicalParentReportGradeKey, mathReportBaseOperationKey } from "./math-report-generator";
import { DEFAULT_TOPIC_NEXT_STEP_CONFIG } from "./topic-next-step-config";
import {
  computeConfidence01,
  computeRowDiagnosticSignals,
  computeStability01,
  rowMistakeEventCount,
} from "./parent-report-row-diagnostics";

/** @typedef {'advance_level'|'advance_grade_topic_only'|'maintain_and_strengthen'|'remediate_same_level'|'drop_one_level_topic_only'|'drop_one_grade_topic_only'} RecommendedNextStep */

export const RECOMMENDED_STEP_LABEL_HE = {
  advance_level: "העלאת רמת קושי — בנושא זה בלבד",
  advance_grade_topic_only: "העלאת כיתה — בנושא זה בלבד",
  maintain_and_strengthen: "לבסס באותה רמה",
  remediate_same_level: "חיזוק באותה רמה",
  drop_one_level_topic_only: "הורדת רמת קושי — בנושא זה בלבד",
  drop_one_grade_topic_only: "הורדת רמת קושי — בנושא זה בלבד",
};

const GRADE_ORDER = ["g1", "g2", "g3", "g4", "g5", "g6"];
const LEVEL_ORDER = ["easy", "medium", "hard"];

/**
 * @param {Record<string, unknown>} [partial]
 * @returns {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG}
 */
export function mergeTopicNextStepConfig(partial) {
  return {
    ...DEFAULT_TOPIC_NEXT_STEP_CONFIG,
    ...(partial && typeof partial === "object" ? partial : {}),
  };
}

/**
 * מפתח אחיד לחיפוש טעויות מול שורת דוח (מתאים ל־operation/topic ב־localStorage ול־bucket במתמטיקה).
 * @param {string} subjectId
 * @param {string|null|undefined} rawKey
 */
export function canonicalMistakeLookupKey(subjectId, rawKey) {
  const s = String(rawKey ?? "").trim();
  if (!s) return "";
  if (subjectId === "math") return mathReportBaseOperationKey(s);
  if (/^[a-z0-9_\-.]+$/i.test(s)) return s.toLowerCase();
  return s;
}

/**
 * מאגד ספירות טעויות לפי מפתח קנוני — כמה מפתחות גולמיים מצביעים על אותו נושא (למשל base אחרי :: במתמטיקה).
 * @param {string} subjectId
 * @param {Record<string, { count?: number }>} mistakesByBucket
 */
export function aggregateMistakeCountsByCanonical(subjectId, mistakesByBucket) {
  const out = {};
  if (!mistakesByBucket || typeof mistakesByBucket !== "object") return out;
  for (const [k, v] of Object.entries(mistakesByBucket)) {
    const c = canonicalMistakeLookupKey(subjectId, k);
    if (!c) continue;
    const n = Number(v?.count) || 0;
    out[c] = (out[c] || 0) + n;
  }
  return out;
}

/**
 * ספירת אירועי טעות לשורה: bucketKey, מפתח שורה מהמפה, שם תצוגה, ובמתמטיקה גם בסיס לפני מפריד מצב.
 */
export function resolveMistakeEventCount(subjectId, mistakesByBucket, bucketKey, topicRowKey, row) {
  return rowMistakeEventCount(subjectId, mistakesByBucket, bucketKey, topicRowKey, row);
}

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

function computeCurrentMastery(row) {
  return Math.max(0, Math.min(100, Math.round(Number(row?.accuracy) || 0)));
}

function computeStability(row, mistakeEventCount, cfg) {
  return computeStability01(row, mistakeEventCount, cfg);
}

function computeConfidence(row, mistakeEventCount, cfg) {
  return computeConfidence01(row, mistakeEventCount, cfg);
}

/**
 * @param {string} step
 * @param {object} ctx
 * @param {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG} cfg
 */
function buildHebrewCopy(step, ctx, cfg) {
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
    mC >= cfg.copyMentionMistakesMin
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
 * @param {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG} cfg
 */
function applyAggressiveEvidenceCap(result, row, ctx, cfg) {
  if (!result?.step || !row?.suppressAggressiveStep) return result;
  const aggressive = new Set([
    "advance_level",
    "advance_grade_topic_only",
    "drop_one_level_topic_only",
    "drop_one_grade_topic_only",
  ]);
  if (!aggressive.has(result.step)) return result;
  const step = "maintain_and_strengthen";
  const copy = buildHebrewCopy(step, ctx, cfg);
  const note =
    " (לפי חוזק הנתונים בטווח — לא משנים כיתה או רמת קושי כרגע; מומלץ לבסס באותה הגדרה ולאסוף עוד תרגול.)";
  return {
    ...result,
    step,
    reasonHe: (result.reasonHe || copy.reasonHe) + note,
    parentHe: copy.parentHe,
    studentHe: copy.studentHe,
  };
}

function decideTopicNextStep(row, mistakeEventCount, cfg) {
  const q = Number(row?.questions) || 0;
  const acc = computeCurrentMastery(row);
  const wrong = Math.max(0, Number(row?.wrong) ?? 0);
  const wrongRatio = q > 0 ? wrong / q : 0;
  const levelKey = normLevelKey(row);
  const gradeKey = normGradeKey(row);
  const li = levelIndex(levelKey);
  const gi = gradeIndex(gradeKey);
  const displayName = String(row?.displayName || row?.bucketKey || "נושא").trim();

  const stability = computeStability(row, mistakeEventCount, cfg);
  const confidence = computeConfidence(row, mistakeEventCount, cfg);
  const recencyScore = Number.isFinite(Number(row?.recencyScore))
    ? Number(row.recencyScore)
    : 55;

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
    q >= cfg.minQuestionsStepChange &&
    acc < cfg.repeatedStruggleAccMax &&
    (mistakeEventCount >= cfg.repeatedStruggleMistakesMin ||
      wrongRatio >= cfg.repeatedStruggleWrongRatio);
  const highVolumeStrong =
    q >= cfg.minQuestionsAdvanceLevel &&
    acc >= cfg.advanceLevelAccMin &&
    stability >= cfg.advanceLevelStabilityMin &&
    confidence >= cfg.advanceLevelConfidenceMin &&
    recencyScore >= 36;
  const mistakeDrag =
    mistakeEventCount >= cfg.mistakeDragMistakesMin && acc < cfg.mistakeDragAccMax;

  if (q < cfg.minQuestionsLowConfidence && q > 0) {
    const step = "maintain_and_strengthen";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap(
      {
        step,
        ...copy,
        currentMastery: acc,
        stability,
        confidence,
        reasonHe: `יש רק ${q} שאלות ב«${displayName}» בטווח — מוקדם מדי לשנות כיתה או רמת קושי. עדיף עוד מפגשים קצרים באותה הגדרה ואז נבחן מחדש.`,
        parentHe: `ב«${displayName}» יש עדיין מעט נתונים (${q} שאלות). נשארים על אותה כיתה ורמה, ומוסיפים 2–3 סשנים קצרים כדי שההמלצה הבאה תהיה מדויקת יותר.`,
        studentHe: `נמשיך עוד קצת באותה רמה ב«${displayName}» — ואז נדע טוב יותר מה הלאה.`,
      },
      row,
      ctx,
      cfg
    );
  }

  if (repeatedStruggle && li >= 1) {
    const step = "drop_one_level_topic_only";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
  }

  if (repeatedStruggle && li === 0 && gi > 0) {
    const step = "drop_one_grade_topic_only";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
  }

  if (
    q >= cfg.minQuestionsRemediate &&
    acc >= cfg.remediateAccLo &&
    acc <= cfg.remediateAccHi &&
    !mistakeDrag
  ) {
    const step = "remediate_same_level";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
  }

  if (
    q >= cfg.minQuestionsAdvanceGrade &&
    levelKey === "hard" &&
    gi >= 0 &&
    gi < GRADE_ORDER.length - 1 &&
    acc >= cfg.advanceGradeAccMin &&
    stability >= cfg.advanceGradeStabilityMin &&
    confidence >= cfg.advanceGradeConfidenceMin &&
    recencyScore >= 42 &&
    !mistakeDrag
  ) {
    const step = "advance_grade_topic_only";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
  }

  if (
    highVolumeStrong &&
    levelKey &&
    li >= 0 &&
    li < LEVEL_ORDER.length - 1 &&
    !mistakeDrag
  ) {
    const step = "advance_level";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
  }

  if (q >= cfg.minQuestionsStepChange && acc < cfg.dropLevelAccMax && li >= 1) {
    const step = "drop_one_level_topic_only";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
  }

  if (q >= cfg.minQuestionsStepChange && acc < cfg.dropLevelAccMax && levelKey == null) {
    const step = "remediate_same_level";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
  }

  if (q >= cfg.minQuestionsStepChange && acc < cfg.dropGradeAccMax && li === 0 && gi > 0) {
    const step = "drop_one_grade_topic_only";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
  }

  if (q >= cfg.minQuestionsRemediate && acc < cfg.remediateBandAccHi && acc >= cfg.remediateBandAccLo) {
    const step = "remediate_same_level";
    const copy = buildHebrewCopy(step, ctx, cfg);
    return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
  }

  const step = "maintain_and_strengthen";
  const copy = buildHebrewCopy(step, ctx, cfg);
  return applyAggressiveEvidenceCap({ step, ...copy, currentMastery: acc, stability, confidence }, row, ctx, cfg);
}

const MISTAKE_ANALYSIS_KEY = {
  math: "mathMistakesByOperation",
  geometry: "geometryMistakesByTopic",
  english: "englishMistakesByTopic",
  science: "scienceMistakesByTopic",
  hebrew: "hebrewMistakesByTopic",
  "moledet-geography": "moledetGeographyMistakesByTopic",
};

/**
 * @param {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG} [cfg]
 */
export function buildTopicRecommendationRecord(
  subjectId,
  topicRowKey,
  row,
  mistakesByBucket,
  cfg = DEFAULT_TOPIC_NEXT_STEP_CONFIG,
  periodEndMs = null
) {
  const bucketKey =
    row?.bucketKey || splitBucketModeRowKey(String(topicRowKey)).bucketKey || null;
  const mC = resolveMistakeEventCount(subjectId, mistakesByBucket, bucketKey, topicRowKey, row);
  const endMs = Number.isFinite(periodEndMs) ? periodEndMs : Date.now();
  const signals = computeRowDiagnosticSignals(subjectId, topicRowKey, row, mistakesByBucket, endMs, cfg);
  const rowAug = { ...row, ...signals };
  const decision = decideTopicNextStep(rowAug, mC, cfg);
  const q = Number(row?.questions) || 0;

  return {
    subject: subjectId,
    topicRowKey: String(topicRowKey),
    displayName: String(row?.displayName || bucketKey || topicRowKey),
    bucketKey: bucketKey ? String(bucketKey) : null,
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
    masteryScore: signals.masteryScore,
    stabilityScore: signals.stabilityScore,
    confidenceScore: signals.confidenceScore,
    recencyScore: signals.recencyScore,
    evidenceStrength: signals.evidenceStrength,
    dataSufficiencyLevel: signals.dataSufficiencyLevel,
    dataSufficiencyLabelHe: signals.dataSufficiencyLabelHe,
    recommendationContextHe: signals.recommendationContextHe,
    patternStabilityHe: signals.patternStabilityHe,
    recommendedNextStep: decision.step,
    recommendedStepLabelHe:
      RECOMMENDED_STEP_LABEL_HE[decision.step] || RECOMMENDED_STEP_LABEL_HE.maintain_and_strengthen,
    recommendedStepReasonHe: decision.reasonHe,
    recommendedParentActionHe: decision.parentHe,
    recommendedStudentActionHe: decision.studentHe,
    recommendedEvidenceLevelHe:
      signals.evidenceStrength === "strong"
        ? "איכות ראיות גבוהה"
        : signals.evidenceStrength === "medium"
          ? "איכות ראיות בינונית"
          : "איכות ראיות נמוכה",
    recommendedWhyNowHe: signals.recommendationContextHe,
    recommendationStabilityNoteHe: signals.patternStabilityHe,
    isEarlySignalOnly: !!signals.isEarlySignalOnly,
    needsPractice: !!row?.needsPractice,
    excellent: !!row?.excellent,
  };
}

/**
 * מוסיף לכל שורת נושא בדוח תוויות המלצה קצרות בעברית (ל־UI הדוח הרגיל).
 * @param {Record<string, Record<string, unknown>>} maps
 * @param {Record<string, Record<string, { count?: number }>>} mistakesBySubject
 * @param {number} periodEndMs
 * @param {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG} [cfg]
 */
export function enrichReportMapsWithTopicStepHints(
  maps,
  mistakesBySubject,
  periodEndMs,
  cfg = DEFAULT_TOPIC_NEXT_STEP_CONFIG
) {
  const endMs = Number.isFinite(periodEndMs) ? periodEndMs : Date.now();
  for (const [subjectId, topicMap] of Object.entries(maps || {})) {
    if (!topicMap || typeof topicMap !== "object") continue;
    const mistakesByBucket = mistakesBySubject?.[subjectId] || {};
    for (const [topicRowKey, row] of Object.entries(topicMap)) {
      if (!row || typeof row !== "object") continue;
      const q = Number(row.questions) || 0;
      if (q <= 0) continue;
      const rec = buildTopicRecommendationRecord(
        subjectId,
        topicRowKey,
        row,
        mistakesByBucket,
        cfg,
        endMs
      );
      row.diagnosticRecommendedStepLabelHe = rec.recommendedStepLabelHe;
      row.diagnosticRecommendedEvidenceHe = rec.recommendedEvidenceLevelHe;
      row.diagnosticWhyNowHe = rec.recommendedWhyNowHe;
      row.diagnosticStabilityNoteHe = rec.recommendationStabilityNoteHe;
      row.diagnosticIsEarlySignalOnly = rec.isEarlySignalOnly;
      row.diagnosticRecommendedNextStep = rec.recommendedNextStep;
    }
  }
}

/**
 * @param {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG} [cfg]
 */
export function buildTopicRecommendationsForSubject(
  subjectId,
  topicMap,
  analysis,
  cfg = DEFAULT_TOPIC_NEXT_STEP_CONFIG,
  periodEndMs = null
) {
  const aKey = MISTAKE_ANALYSIS_KEY[subjectId];
  const mistakesByBucket = (analysis && analysis[aKey]) || {};

  const rows = [];
  if (!topicMap || typeof topicMap !== "object") return rows;

  for (const [topicRowKey, row] of Object.entries(topicMap)) {
    if (!row || typeof row !== "object") continue;
    const q = Number(row.questions) || 0;
    if (q <= 0) continue;
    rows.push(buildTopicRecommendationRecord(subjectId, topicRowKey, row, mistakesByBucket, cfg, periodEndMs));
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

  return rows.slice(0, cfg.maxTopicRecommendationsPerSubject);
}
