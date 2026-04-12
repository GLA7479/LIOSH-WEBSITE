/**
 * אותות דיאגנוסטיים לשורת דוח V2 — מקור אחד ל־parent-report-v2 ול־topic-next-step-engine.
 * ללא תלות ב־parent-report-v2 (מניעת מעגל ייבוא).
 */

import { mathReportBaseOperationKey } from "./math-report-generator";
import { DEFAULT_TOPIC_NEXT_STEP_CONFIG } from "./topic-next-step-config";

const TRACK_ROW_MODE_SEP = "\u0001";

/** מפרק מפתח שורה bucket+mode — מיוצא לשימוש במנוע המלצות בלי לייבא את parent-report-v2 */
export function splitBucketModeRowKey(itemKey) {
  if (typeof itemKey !== "string") {
    return { bucketKey: String(itemKey), modeKey: null };
  }
  const i = itemKey.indexOf(TRACK_ROW_MODE_SEP);
  if (i === -1) return { bucketKey: itemKey, modeKey: null };
  return {
    bucketKey: itemKey.slice(0, i),
    modeKey: itemKey.slice(i + TRACK_ROW_MODE_SEP.length) || null,
  };
}

export function canonicalMistakeLookupKeyForDiagnostics(subjectId, rawKey) {
  const s = String(rawKey ?? "").trim();
  if (!s) return "";
  if (subjectId === "math") return mathReportBaseOperationKey(s);
  if (/^[a-z0-9_\-.]+$/i.test(s)) return s.toLowerCase();
  return s;
}

export function aggregateMistakeCountsByCanonicalKey(subjectId, mistakesByBucket) {
  const out = {};
  if (!mistakesByBucket || typeof mistakesByBucket !== "object") return out;
  for (const [k, v] of Object.entries(mistakesByBucket)) {
    const c = canonicalMistakeLookupKeyForDiagnostics(subjectId, k);
    if (!c) continue;
    const n = Number(v?.count) || 0;
    out[c] = (out[c] || 0) + n;
  }
  return out;
}

/**
 * ספירת אירועי טעות לשורה — תואם ל־resolveMistakeEventCount ב־topic-next-step-engine.
 */
export function rowMistakeEventCount(subjectId, mistakesByBucket, bucketKey, topicRowKey, row) {
  const byCanon = aggregateMistakeCountsByCanonicalKey(subjectId, mistakesByBucket);
  const candidates = new Set();
  if (bucketKey) candidates.add(canonicalMistakeLookupKeyForDiagnostics(subjectId, bucketKey));
  const split = splitBucketModeRowKey(String(topicRowKey || ""));
  if (split.bucketKey) candidates.add(canonicalMistakeLookupKeyForDiagnostics(subjectId, split.bucketKey));
  if (row?.displayName) candidates.add(canonicalMistakeLookupKeyForDiagnostics(subjectId, String(row.displayName)));
  if (subjectId === "math" && topicRowKey) {
    const noMode = String(topicRowKey).split(TRACK_ROW_MODE_SEP)[0];
    if (noMode) candidates.add(canonicalMistakeLookupKeyForDiagnostics(subjectId, noMode));
  }
  let total = 0;
  const seen = new Set();
  for (const c of candidates) {
    if (!c || seen.has(c)) continue;
    seen.add(c);
    total += byCanon[c] || 0;
  }
  return total;
}

/**
 * @param {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG} cfg
 */
export function computeStability01(row, mistakeEventCount, cfg) {
  const q = Number(row?.questions) || 0;
  if (q <= 0) return 0;
  const wrong = Math.max(0, Number(row?.wrong) ?? q - (Number(row?.correct) || 0));
  const wrongRatio = wrong / q;
  const volume = Math.min(1, q / cfg.stabilityVolumeDivisor);
  const mistakePressure = Math.min(
    cfg.stabilityMistakePressureMax,
    (mistakeEventCount || 0) / Math.max(q, cfg.stabilityMistakeQDivisor) +
      wrongRatio * cfg.stabilityWrongPenaltyCoef
  );
  const raw = volume * (1 - mistakePressure);
  return Math.round(Math.max(0, Math.min(1, raw)) * 100) / 100;
}

/**
 * @param {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG} cfg
 */
export function computeConfidence01(row, mistakeEventCount, cfg) {
  const q = Number(row?.questions) || 0;
  if (q <= 0) return 0;
  const base = 1 - Math.exp(-q / cfg.confidenceExpDivisor);
  const m = Number(mistakeEventCount) || 0;
  const noise =
    m > q * cfg.confidenceMistakeRatioHigh
      ? cfg.confidenceNoiseHigh
      : m > q * cfg.confidenceMistakeRatioMid
        ? cfg.confidenceNoiseMid
        : 1;
  return Math.round(Math.max(0, Math.min(1, base * noise)) * 100) / 100;
}

/** 0–100 לפי מרחק בזמן מסוף תקופת הדוח (לא מ־"עכשיו") */
export function computeRecencyScore(lastSessionMs, periodEndMs) {
  if (!Number.isFinite(periodEndMs)) return 55;
  if (!Number.isFinite(lastSessionMs)) return 55;
  const days = Math.max(0, (periodEndMs - lastSessionMs) / (24 * 60 * 60 * 1000));
  if (days <= 3) return 100;
  if (days <= 10) return 85;
  if (days <= 21) return 68;
  if (days <= 45) return 48;
  if (days <= 90) return 30;
  return 15;
}

export function computeMasteryScore(row) {
  const a = Math.round(Number(row?.accuracy) || 0);
  return Math.max(0, Math.min(100, a));
}

/**
 * @returns {"strong" | "medium" | "low"}
 */
export function computeEvidenceStrength(q, stability01, confidence01, recencyScore, wrongRatio) {
  const vol = q >= 18 ? 1 : q >= 10 ? 0.75 : q >= 5 ? 0.5 : 0.25;
  const stab = stability01 ?? 0;
  const conf = confidence01 ?? 0;
  const rec = (recencyScore ?? 0) / 100;
  const wr = wrongRatio ?? 0;
  const score = vol * 0.35 + stab * 0.25 + conf * 0.25 + rec * 0.1 - Math.min(0.2, wr * 0.25);
  if (score >= 0.62 && q >= 8) return "strong";
  if (score >= 0.38 && q >= 4) return "medium";
  return "low";
}

/**
 * @returns {{ level: "strong"|"medium"|"low", labelHe: string, suppressAggressiveStep: boolean }}
 */
export function evaluateDataSufficiency(q, evidenceStrength, confidence01) {
  if (q <= 0) {
    return {
      level: "low",
      labelHe: "אין שאלות בטווח — אין בסיס נתונים לשורה זו.",
      suppressAggressiveStep: true,
    };
  }
  if (q < 4) {
    return {
      level: "low",
      labelHe: "מעט מדי שאלות בטווח — ההסקות לשורה זו חלקיות מאוד.",
      suppressAggressiveStep: true,
    };
  }
  if (q < 8 || evidenceStrength === "low" || (confidence01 ?? 0) < 0.22) {
    return {
      level: "medium",
      labelHe: "נפח בינוני או אות חלש — לא משנים כיתה/רמה אגרסיבית לפי שורה זו בלבד.",
      suppressAggressiveStep: true,
    };
  }
  if (evidenceStrength === "strong" && q >= 12) {
    return {
      level: "strong",
      labelHe: "נפח ואותות מספקים — ההסקות לשורה זו מהימנות יחסית.",
      suppressAggressiveStep: false,
    };
  }
  return {
    level: "medium",
    labelHe: "נתונים בינוניים — מומלץ שינויים זהירים בלבד.",
    suppressAggressiveStep: evidenceStrength === "low",
  };
}

/**
 * מסלול החלטה לביקורת JSON — ללא טקסט פדגוגי חדש מעבר לשדות הקיימים.
 * @param {object} ctx
 * @returns {Array<{ source: "diagnostics", phase: string, detailHe?: string, data: Record<string, unknown> }>}
 */
export function buildDiagnosticsDecisionTrace(ctx) {
  const {
    subjectId,
    topicRowKey,
    q,
    wrong,
    wrongRatio,
    mistakeEventCountResolved,
    stability01,
    confidence01,
    recencyScore,
    masteryScore,
    evidenceStrength,
    dataSufficiencyLevel,
    suppressAggressiveStep,
    isStablePattern,
    isEarlySignalOnly,
    cfgSnapshot,
  } = ctx;

  const data = (obj) => ({ source: "diagnostics", ...obj });

  return [
    data({
      phase: "inputs",
      detailHe: "קלטים לשורה לפני חישוב אותות.",
      data: {
        subjectId,
        topicRowKey: String(topicRowKey || ""),
        questions: q,
        wrong,
        wrongRatio: Math.round(wrongRatio * 1000) / 1000,
        mistakeEventCountResolved,
        periodEndMs: Number.isFinite(Number(ctx.periodEndMs)) ? ctx.periodEndMs : null,
        cfg: cfgSnapshot || null,
      },
    }),
    data({
      phase: "stability_01",
      data: { stability01, formula: "volume*(1-mistakePressure), mistakePressure from wrongRatio+mistake/q" },
    }),
    data({
      phase: "confidence_01",
      data: { confidence01, formula: "(1-exp(-q/divisor))*noise(mistakesVsQ)" },
    }),
    data({
      phase: "recency_score",
      data: { recencyScore, lastSessionMs: ctx.lastSessionMs ?? null },
    }),
    data({
      phase: "mastery_score",
      data: { masteryScore },
    }),
    data({
      phase: "evidence_strength",
      data: { evidenceStrength },
    }),
    data({
      phase: "data_sufficiency",
      detailHe: "מסקנת sufficiency משפיעה על suppressAggressiveStep במנוע המלצות.",
      data: {
        dataSufficiencyLevel,
        suppressAggressiveStep,
        labelHe: ctx.dataSufficiencyLabelHe ?? null,
      },
    }),
    data({
      phase: "pattern_flags",
      data: { isStablePattern, isEarlySignalOnly },
    }),
  ];
}

/**
 * @param {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG} [cfg]
 */
export function computeRowDiagnosticSignals(subjectId, topicRowKey, row, mistakesByBucket, periodEndMs, cfg = DEFAULT_TOPIC_NEXT_STEP_CONFIG) {
  const q = Number(row?.questions) || 0;
  const wrong = Math.max(0, Number(row?.wrong) ?? (q > 0 ? q - (Number(row?.correct) || 0) : 0));
  const wrongRatio = q > 0 ? wrong / q : 0;
  const bucketKey = row?.bucketKey || splitBucketModeRowKey(String(topicRowKey || "")).bucketKey || null;
  const mC = rowMistakeEventCount(subjectId, mistakesByBucket, bucketKey, topicRowKey, row);
  const stability01 = computeStability01(row, mC, cfg);
  const confidence01 = computeConfidence01(row, mC, cfg);
  const lastMs = Number(row?.lastSessionMs);
  const recencyScore = computeRecencyScore(lastMs, periodEndMs);
  const masteryScore = computeMasteryScore(row);
  const stabilityScore = Math.round(stability01 * 100);
  const confidenceScore = Math.round(confidence01 * 100);
  const evidenceStrength = computeEvidenceStrength(q, stability01, confidence01, recencyScore, wrongRatio);
  const sufficiency = evaluateDataSufficiency(q, evidenceStrength, confidence01);

  const isStablePattern =
    evidenceStrength === "strong" && q >= 14 && stability01 >= 0.45 && confidence01 >= 0.35;
  const isEarlySignalOnly = sufficiency.level !== "strong" || evidenceStrength === "low";

  let patternStabilityHe = "דפוס מוקדם — עדיין לא ניתן לקבוע יציבות ארוכת טווח לפי הנתונים בלבד.";
  if (isStablePattern) {
    patternStabilityHe = "דפוס יחסית יציב בטווח — התמונה משקפת מגמה ולא רק מפגש בודד.";
  } else if (sufficiency.level === "medium") {
    patternStabilityHe = "אות בינוני — כדאי לאסוף עוד תרגול לפני מסקנות חזקות.";
  }

  const decisionTrace = buildDiagnosticsDecisionTrace({
    subjectId,
    topicRowKey,
    q,
    wrong,
    wrongRatio,
    mistakeEventCountResolved: mC,
    stability01,
    confidence01,
    recencyScore,
    masteryScore,
    evidenceStrength,
    dataSufficiencyLevel: sufficiency.level,
    dataSufficiencyLabelHe: sufficiency.labelHe,
    suppressAggressiveStep: sufficiency.suppressAggressiveStep,
    isStablePattern,
    isEarlySignalOnly,
    lastSessionMs: Number.isFinite(lastMs) ? lastMs : null,
    periodEndMs,
    cfgSnapshot: {
      stabilityVolumeDivisor: cfg.stabilityVolumeDivisor,
      confidenceExpDivisor: cfg.confidenceExpDivisor,
    },
  });

  return {
    mistakeEventCountResolved: mC,
    masteryScore,
    stabilityScore,
    confidenceScore,
    recencyScore,
    evidenceStrength,
    dataSufficiencyLevel: sufficiency.level,
    dataSufficiencyLabelHe: sufficiency.labelHe,
    suppressAggressiveStep: sufficiency.suppressAggressiveStep,
    patternStabilityHe,
    isEarlySignalOnly,
    recommendationContextHe: isEarlySignalOnly
      ? "ההמלצה מבוססת על נתונים חלקיים; עדיף לא ליישם שינוי דרמטי בלי מעקב נוסף."
      : "ההמלצה מבוססת על שילוב דיוק, נפח, טעויות ועדכניות בטווח.",
    decisionTrace,
  };
}

/**
 * מעשיר אובייקטי שורות במפות נושאים (mathOperations וכו').
 * @param {Record<string, Record<string, unknown>>} maps
 * @param {Record<string, Record<string, { count?: number }>>} mistakesBySubject
 * @param {number} periodEndMs
 * @param {typeof DEFAULT_TOPIC_NEXT_STEP_CONFIG} [cfg]
 */
export function enrichTopicMapsWithRowDiagnostics(maps, mistakesBySubject, periodEndMs, cfg = DEFAULT_TOPIC_NEXT_STEP_CONFIG) {
  const entries = Object.entries(maps || {});
  for (const [subjectId, topicMap] of entries) {
    if (!topicMap || typeof topicMap !== "object") continue;
    const mistakesByBucket = mistakesBySubject?.[subjectId] || {};
    for (const [topicRowKey, row] of Object.entries(topicMap)) {
      if (!row || typeof row !== "object") continue;
      const signals = computeRowDiagnosticSignals(
        subjectId,
        topicRowKey,
        row,
        mistakesByBucket,
        periodEndMs,
        cfg
      );
      Object.assign(row, signals);
    }
  }
}
