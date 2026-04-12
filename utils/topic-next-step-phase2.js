/**
 * Phase 2 — סיכונים, נגזרות מגמה, וחסימות המלצה (ללא UI).
 * נקרא מ־topic-next-step-engine.js בלבד.
 */

const AGGRESSIVE = new Set([
  "advance_level",
  "advance_grade_topic_only",
  "drop_one_level_topic_only",
  "drop_one_grade_topic_only",
]);

export function isAggressiveStep(step) {
  return AGGRESSIVE.has(step);
}

/**
 * @param {Record<string, unknown>|null|undefined} trend
 * @param {Record<string, unknown>} row
 */
export function buildTrendDerivedSignals(trend, row) {
  const t = trend && typeof trend === "object" ? trend : null;
  const ad = String(t?.accuracyDirection || "unknown");
  const id = String(t?.independenceDirection || "unknown");
  const fd = String(t?.fluencyDirection || "unknown");
  const tc = Number(t?.confidence);
  const trendConfOk = Number.isFinite(tc) && tc >= 0.38;

  const positiveAccuracy = ad === "up";
  const negativeAccuracy = ad === "down";
  const unclearTrend = ad === "unknown" || !trendConfOk;

  const fragileProgressPattern = ad === "up" && id === "down";
  const independenceDeteriorating = id === "down";
  const fluencySupportWithoutAccuracyDrop = fd === "up" && ad !== "down";

  const curAcc = t?.windows?.currentPeriod?.accuracy;
  const recentAcc = t?.windows?.recentShortWindow?.accuracy;
  const recentDifficultyIncrease =
    Number.isFinite(Number(curAcc)) &&
    Number.isFinite(Number(recentAcc)) &&
    Number(recentAcc) < Number(curAcc) - 10;

  const negativeTrendAfterRecentDifficultyIncrease = negativeAccuracy && !!recentDifficultyIncrease;

  const prevAcc = t?.windows?.previousComparablePeriod?.accuracy;
  const periodRegression =
    Number.isFinite(Number(prevAcc)) &&
    Number.isFinite(Number(curAcc)) &&
    Number(curAcc) < Number(prevAcc) - 12;

  const progressSupportsAdvance =
    (ad === "up" || ad === "flat") && !fragileProgressPattern && !independenceDeteriorating && trendConfOk;

  return {
    accuracyDirection: ad,
    independenceDirection: id,
    fluencyDirection: fd,
    trendConfidence01: Number.isFinite(tc) ? tc : null,
    trendConfOk,
    positiveAccuracy,
    negativeAccuracy,
    unclearTrend,
    fragileProgressPattern,
    independenceDeteriorating,
    fluencySupportWithoutAccuracyDrop,
    recentDifficultyIncrease,
    negativeTrendAfterRecentDifficultyIncrease,
    periodRegression,
    progressSupportsAdvance,
  };
}

/**
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown>|null|undefined} trend
 * @param {Record<string, unknown>|null|undefined} behaviorProfile
 * @param {ReturnType<typeof buildTrendDerivedSignals>} trendDer
 */
export function buildPhase2RiskFlags(row, trend, behaviorProfile, trendDer) {
  const suff = row?.dataSufficiencyLevel;
  const ev = row?.evidenceStrength;
  const behaviorType = String(behaviorProfile?.dominantType || "undetermined");
  const hintRate = behaviorProfile?.signals?.hintRate;
  const hintKnown = Number(behaviorProfile?.signals?.hintKnownCount) || 0;
  const modeKey = String(row?.modeKey || "").trim();
  const q = Number(row?.questions) || 0;
  const acc = Math.round(Number(row?.accuracy) || 0);
  const wrongRatio = q > 0 ? Math.max(0, Number(row?.wrong) || 0) / q : 0;

  const insufficientEvidenceRisk =
    suff !== "strong" || ev === "low" || row?.isEarlySignalOnly === true || q < 12;

  const hintDependenceRisk =
    behaviorType === "instruction_friction" ||
    (hintRate != null && hintRate >= 0.32 && hintKnown >= 3);

  const speedOnlyRisk =
    behaviorType === "speed_pressure" ||
    ((modeKey === "speed" || modeKey === "marathon") && acc >= 55 && wrongRatio < 0.32);

  const falsePromotionRisk =
    insufficientEvidenceRisk ||
    hintDependenceRisk ||
    trendDer.fragileProgressPattern ||
    (behaviorType === "fragile_success" && !trendDer.progressSupportsAdvance) ||
    (trendDer.independenceDeteriorating && trendDer.positiveAccuracy);

  const strongKnowledgeGapEvidence =
    behaviorType === "knowledge_gap" &&
    (ev === "strong" || ev === "medium") &&
    q >= 10 &&
    wrongRatio >= 0.28;

  const falseRemediationRisk =
    speedOnlyRisk ||
    (behaviorType === "careless_pattern" && acc >= 58) ||
    (trendDer.positiveAccuracy && behaviorType !== "knowledge_gap") ||
    (trendDer.fluencySupportWithoutAccuracyDrop && behaviorType === "speed_pressure");

  const recentTransitionRisk =
    (String(row?.levelKey) === "hard" &&
      trendDer.negativeAccuracy &&
      trendDer.recentDifficultyIncrease) ||
    (trendDer.periodRegression && trendDer.negativeAccuracy);

  return {
    falsePromotionRisk,
    falseRemediationRisk,
    speedOnlyRisk,
    hintDependenceRisk,
    insufficientEvidenceRisk,
    recentTransitionRisk,
    behaviorType,
    strongKnowledgeGapEvidence,
    trendDerSnapshot: {
      fragileProgressPattern: trendDer.fragileProgressPattern,
      progressSupportsAdvance: trendDer.progressSupportsAdvance,
      unclearTrend: trendDer.unclearTrend,
      negativeTrendAfterRecentDifficultyIncrease: trendDer.negativeTrendAfterRecentDifficultyIncrease,
    },
  };
}

/**
 * @param {string} proposed
 * @param {object} ctx
 * @returns {{ step: string, blockers: Array<{ id: string, detailHe: string }>, traceAdds: unknown[], phase2RuleId: string }}
 */
export function applyPhase2GuardsToStep(proposed, ctx) {
  const {
    row,
    riskFlags,
    trendDer,
    behaviorType,
    sufficiencyStrong,
    strongKnowledgeGapEvidence,
  } = ctx;

  let step = proposed;
  const blockers = [];
  const traceAdds = [];
  let phase2RuleId = "phase2_pass_through";

  const pushTrace = (id, detailHe, fromStep, toStep) => {
    traceAdds.push({
      source: "recommendation",
      phase: "phase2_blocker",
      ruleId: id,
      data: { fromStep, toStep, detailHe },
    });
  };

  const apply = (id, detailHe, newStep) => {
    if (step === newStep) return;
    const fromStep = step;
    blockers.push({ id, detailHe });
    pushTrace(id, detailHe, fromStep, newStep);
    step = newStep;
    phase2RuleId = id;
  };

  const isDrop = step === "drop_one_level_topic_only" || step === "drop_one_grade_topic_only";
  const isAdvance = step === "advance_level" || step === "advance_grade_topic_only";

  if (hintDependenceRiskActive(riskFlags) && isAdvance) {
    apply(
      "hint_dependence_block_advance",
      "תלות ברמזים גבוהה — לא מקדמים רמה/כיתה אוטומטית.",
      "maintain_and_strengthen"
    );
  }

  if (behaviorType === "fragile_success" && isAdvance) {
    if (!trendDer.progressSupportsAdvance || hintDependenceRiskActive(riskFlags) || !sufficiencyStrong) {
      apply(
        "fragile_success_block_advance",
        "פרופיל הצלחה שבירה — לא מקדמים מהר בלי עצמאות ומגמה תומכות וראיות חזקות.",
        "maintain_and_strengthen"
      );
    }
  }

  if (behaviorType === "stable_mastery" && isAggressiveStep(step)) {
    if (riskFlags.insufficientEvidenceRisk || riskFlags.falsePromotionRisk || trendDer.unclearTrend) {
      apply(
        "stable_mastery_guard_advance",
        "מאסטרי יציב — קידום רק כשהראיות חזקות והסיכון לקידום שווא נמוך.",
        "maintain_and_strengthen"
      );
    }
  }

  if (riskFlags.falsePromotionRisk && isAggressiveStep(step)) {
    apply("false_promotion_guard", "סיכון לקידום שווא — לא מקדמים.", "maintain_and_strengthen");
  }

  if (trendDer.unclearTrend && isAggressiveStep(step)) {
    apply("unclear_trend_cap_aggressive", "מגמת דיוק לא ברורה או ביטחון מגמה נמוך — לא פועלים אגרסיבית.", "maintain_and_strengthen");
  }

  if (trendDer.fragileProgressPattern && isAdvance) {
    apply(
      "accuracy_up_independence_down",
      "דיוק עולה אך עצמאות יורדת — שביר, לא קידום מהיר.",
      "maintain_and_strengthen"
    );
  }

  if (riskFlags.speedOnlyRisk && isDropStep(step)) {
    apply("speed_only_block_drop", "חולשה במסלול מהירות/לחץ — לא מורידים רמה/כיתה רק מכך.", "maintain_and_strengthen");
  }

  if (behaviorType === "instruction_friction" && isDropStep(step) && !strongKnowledgeGapEvidence) {
    apply(
      "instruction_friction_soften_drop",
      "חיכוך הוראה/רמזים — לא יורדים אגרסיבית בלי פער ידע מתועד.",
      "remediate_same_level"
    );
  }

  if (behaviorType === "careless_pattern" && isDropStep(step)) {
    apply("careless_pattern_before_drop", "דפוס רשלנות — מעדיפים חיזוק ברמה לפני ירידה.", "remediate_same_level");
  }

  if (behaviorType === "knowledge_gap" && isDropStep(step)) {
    if (trendDer.positiveAccuracy && !trendDer.negativeTrendAfterRecentDifficultyIncrease) {
      apply(
        "knowledge_gap_respect_positive_trend",
        "פער ידע אך מגמת דיוק חיובית — מרככים לחיזוק לפני ירידה.",
        "remediate_same_level"
      );
    }
  }

  if (riskFlags.falseRemediationRisk && isDropStep(step)) {
    if (riskFlags.speedOnlyRisk || (trendDer.positiveAccuracy && behaviorType !== "knowledge_gap")) {
      apply("false_remediation_guard", "סיכון לטיפול יתר — מרככים לחיזוק.", "remediate_same_level");
    }
  }

  if (trendDer.negativeTrendAfterRecentDifficultyIncrease && step === "drop_one_grade_topic_only") {
    apply(
      "recent_transition_caution",
      "מגמה שלילית אחרי קושי אחרון — זהירות במקום ירידת כיתה מיידית.",
      "remediate_same_level"
    );
  }

  if (trendDer.fluencySupportWithoutAccuracyDrop && riskFlags.speedOnlyRisk && step === "drop_one_level_topic_only") {
    apply(
      "fluency_positive_speed_context",
      "שיפור זרימה ללא ירידת דיוק — הקשר מהירות; לא יורדים רמה.",
      "maintain_and_strengthen"
    );
  }

  if (riskFlags.insufficientEvidenceRisk && isAggressiveStep(step)) {
    apply("insufficient_evidence_cap_phase2", "ראיות לא מספקות לשינוי אגרסיבי בשלב 2.", "maintain_and_strengthen");
  }

  return { step, blockers, traceAdds, phase2RuleId };
}

function hintDependenceRiskActive(rf) {
  return !!rf?.hintDependenceRisk;
}

function isDropStep(s) {
  return s === "drop_one_level_topic_only" || s === "drop_one_grade_topic_only";
}

/**
 * @param {string} sufficiencyLevel
 */
export function sufficiencyBadgeFromLevel(sufficiencyLevel) {
  const s = String(sufficiencyLevel || "");
  if (s === "strong") return "high";
  if (s === "medium") return "medium";
  return "low";
}

/**
 * @param {number} confidenceScore 0–100
 */
export function confidenceBadgeFromScore(confidenceScore) {
  const n = Number(confidenceScore);
  if (!Number.isFinite(n)) return "medium";
  if (n >= 72) return "high";
  if (n >= 42) return "medium";
  return "low";
}

export function buildRecommendationStructuredTrace(p) {
  const { inputs, derivedFlags, blockers, appliedRules, chosenRule, postCapAdjustments } = p;
  return {
    version: 2,
    inputs: inputs || {},
    derivedFlags: derivedFlags || {},
    blockers: blockers || [],
    appliedRules: appliedRules || [],
    chosenRule: chosenRule || {},
    postCapAdjustments: postCapAdjustments || [],
  };
}

export function buildWhyThisRecommendationHe(p) {
  const { displayName, finalStep, riskFlags, trendDer, behaviorType, legacyRuleId } = p;
  const parts = [];
  parts.push(`החלטה ל«${displayName}»: ${stepLabelHe(finalStep)}.`);
  parts.push(`פרופיל התנהגות דומיננטי: ${behaviorType}.`);
  if (legacyRuleId) parts.push(`כלל בסיס במנוע: ${legacyRuleId}.`);
  const rf = [];
  if (riskFlags.falsePromotionRisk) rf.push("סיכון קידום שווא");
  if (riskFlags.falseRemediationRisk) rf.push("סיכון טיפול יתר");
  if (riskFlags.speedOnlyRisk) rf.push("הקשר מהירות");
  if (riskFlags.hintDependenceRisk) rf.push("תלות ברמזים");
  if (riskFlags.insufficientEvidenceRisk) rf.push("ראיות חלקיות");
  if (riskFlags.recentTransitionRisk) rf.push("מעבר/קושי אחרון");
  if (rf.length) parts.push(`דגלי סיכון פעילים: ${rf.join(", ")}.`);
  if (trendDer.unclearTrend) parts.push("מגמת דיוק לא חדה — הוטל כיסוי זהירות.");
  if (trendDer.fragileProgressPattern) parts.push("דיוק עולה אך עצמאות יורדת — נחשב שביר, לא קידום מהיר.");
  if (trendDer.progressSupportsAdvance) parts.push("מגמה ועצמאות תומכות בקידום זהיר כשהראיות מאפשרות.");
  return parts.join(" ");
}

export function buildWhatCouldChangeThisHe(p) {
  const { q, behaviorType } = p;
  const parts = [];
  parts.push(`איסוף יותר מ־${Math.max(12, Number(q) || 0)} שאלות בטווח,`);
  parts.push("אירועי טעות עם responseMs/retry/hint כדי לחדד פרופיל,");
  parts.push("ומגמת דיוק ברורה בין תקופה נוכחית לקודמת — יכולים לשנות את הצעד.");
  if (behaviorType === "undetermined") parts.push("הפרופיל ההתנהגותי עדיין לא מסויג — נתונים נוספים יצמצמו אי־ודאות.");
  return parts.join(" ");
}

function stepLabelHe(step) {
  const m = {
    advance_level: "העלאת רמת קושי בנושא",
    advance_grade_topic_only: "העלאת כיתה בנושא",
    maintain_and_strengthen: "ביסוס באותה רמה",
    remediate_same_level: "חיזוק באותה רמה",
    drop_one_level_topic_only: "ירידת רמת קושי בנושא",
    drop_one_grade_topic_only: "ירידת כיתה בנושא",
  };
  return m[step] || String(step);
}
