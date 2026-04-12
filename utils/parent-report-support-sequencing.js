/**
 * Phase 11 — רצף תמיכה (פרוקסי מחלונות מגמה + פרופיל התערבות נוכחי).
 * לא ממציא היסטוריית צעדים — רק מסיק מצב בטוח מהנתונים הקיימים.
 */

import {
  NEXT_BEST_SEQUENCE_STEP_LABEL_HE,
  PRIOR_SUPPORT_PATTERN_LABEL_HE,
  STRATEGY_FATIGUE_RISK_LABEL_HE,
  STRATEGY_REPETITION_RISK_LABEL_HE,
  SUPPORT_SEQUENCE_STATE_LABEL_HE,
} from "./parent-report-ui-explain-he.js";

/**
 * @param {object} ctx
 */
export function buildSupportSequencingPhase11(ctx) {
  const q = Number(ctx?.q) || 0;
  const acc = Math.round(Number(ctx?.accuracy) || 0);
  const ev = String(ctx?.evidenceStrength || "low");
  const suff = String(ctx?.dataSufficiencyLevel || "low");
  const cs = String(ctx?.conclusionStrength || "");
  const rpm = String(ctx?.recommendedPracticeMode || "");
  const intv = String(ctx?.recommendedInterventionType || "");
  const iff = String(ctx?.interventionFormat || "");
  const rti = String(ctx?.responseToIntervention || "");
  const ls = String(ctx?.learningStage || "");
  const indep = String(ctx?.independenceProgress || "");
  const mrec = String(ctx?.mistakeRecurrenceLevel || "");
  const td = ctx?.trendDer && typeof ctx.trendDer === "object" ? ctx.trendDer : {};
  const trend = ctx?.trend && typeof ctx.trend === "object" ? ctx.trend : null;
  const prevAcc = trend?.windows?.previousComparablePeriod?.accuracy;
  const curAccW = trend?.windows?.currentPeriod?.accuracy;
  const hasPeriod = Number.isFinite(Number(prevAcc)) && Number.isFinite(Number(curAccW));
  const accFlat = hasPeriod && Math.abs(Number(curAccW) - Number(prevAcc)) < 6;
  const indepUp = String(td.independenceDirection || "") === "up";
  const posAcc = !!td.positiveAccuracy;

  const guidedHeavy =
    rpm === "slow_guided_accuracy" ||
    rpm === "guided_release" ||
    rpm === "error_reduction_loop" ||
    iff === "guided_practice";
  const reviewHold = rpm === "review_and_hold";
  const observe = rpm === "observe_only";

  let priorSupportPattern = "unknown";
  if (q < 10 || ev === "low" || cs === "withheld") {
    priorSupportPattern = "unknown";
  } else if (guidedHeavy && (mrec === "persistent" || mrec === "repeating") && accFlat && q >= 14) {
    priorSupportPattern = "guided_repeat";
  } else if (guidedHeavy && (indepUp || indep === "improving")) {
    priorSupportPattern = "guided_then_release";
  } else if (reviewHold && accFlat && q >= 12) {
    priorSupportPattern = "review_hold_repeat";
  } else if (observe && q >= 8) {
    priorSupportPattern = "observe_then_retry";
  } else if (guidedHeavy || reviewHold) {
    priorSupportPattern = "mixed_support_history";
  }

  let strategyRepetitionRisk = "unknown";
  let strategyFatigueRisk = "unknown";
  if (q < 10 || ev === "low") {
    strategyRepetitionRisk = "unknown";
    strategyFatigueRisk = "unknown";
  } else if (guidedHeavy && mrec === "persistent" && accFlat && q >= 16) {
    strategyRepetitionRisk = "high";
    strategyFatigueRisk = !indepUp && indep !== "improving" ? "high" : "moderate";
  } else if (guidedHeavy && (mrec === "repeating" || mrec === "persistent")) {
    strategyRepetitionRisk = "moderate";
    strategyFatigueRisk = rti === "over_supported_progress" ? "high" : "moderate";
  } else if (rti === "over_supported_progress") {
    strategyRepetitionRisk = "moderate";
    strategyFatigueRisk = "high";
  } else {
    strategyRepetitionRisk = "low";
    strategyFatigueRisk = "low";
  }

  const seqWeak = q < 10 || (ev === "low" && q < 16) || cs === "withheld";

  let supportSequenceState = "insufficient_sequence_evidence";
  if (seqWeak) {
    supportSequenceState = "insufficient_sequence_evidence";
  } else if (
    rti === "stalled_response" &&
    (strategyRepetitionRisk === "high" || (priorSupportPattern === "review_hold_repeat" && mrec === "persistent"))
  ) {
    supportSequenceState = "sequence_exhausted";
  } else if (rti === "stalled_response" || (mrec === "persistent" && !posAcc && accFlat && q >= 12)) {
    supportSequenceState = "sequence_stalled";
  } else if (
    (rti === "early_positive_response" || rti === "independence_growing") &&
    (indepUp || indep === "improving")
  ) {
    supportSequenceState = "sequence_ready_for_release";
  } else if (rti === "over_supported_progress") {
    supportSequenceState = "sequence_ready_for_release";
  } else if (ls === "early_acquisition" && q < 14) {
    supportSequenceState = "new_support_cycle";
  } else if (q < 16 && rti === "early_positive_response") {
    supportSequenceState = "early_sequence";
  } else if (guidedHeavy && posAcc && rti !== "stalled_response" && rti !== "regression_under_support") {
    supportSequenceState = "continuing_sequence";
  } else {
    supportSequenceState = "continuing_sequence";
  }

  let nextBestSequenceStep = "observe_before_next_cycle";
  if (seqWeak) {
    nextBestSequenceStep = "observe_before_next_cycle";
  } else if (supportSequenceState === "sequence_exhausted") {
    nextBestSequenceStep = "switch_support_type";
  } else if (supportSequenceState === "sequence_ready_for_release" || rti === "over_supported_progress") {
    nextBestSequenceStep = "begin_release_step";
  } else if (supportSequenceState === "sequence_stalled") {
    nextBestSequenceStep = "tighten_same_goal";
  } else if (supportSequenceState === "insufficient_sequence_evidence") {
    nextBestSequenceStep = "observe_before_next_cycle";
  } else if (supportSequenceState === "new_support_cycle" || supportSequenceState === "early_sequence") {
    nextBestSequenceStep = "continue_current_sequence";
  } else {
    nextBestSequenceStep = "continue_current_sequence";
  }

  const displayName = String(ctx?.displayName || "הנושא").trim();
  const supportSequenceStateLabelHe =
    SUPPORT_SEQUENCE_STATE_LABEL_HE[supportSequenceState] ||
    SUPPORT_SEQUENCE_STATE_LABEL_HE.insufficient_sequence_evidence;
  const priorSupportPatternLabelHe =
    PRIOR_SUPPORT_PATTERN_LABEL_HE[priorSupportPattern] || PRIOR_SUPPORT_PATTERN_LABEL_HE.unknown;
  const strategyRepetitionRiskHe =
    STRATEGY_REPETITION_RISK_LABEL_HE[strategyRepetitionRisk] || STRATEGY_REPETITION_RISK_LABEL_HE.unknown;
  const strategyFatigueRiskHe =
    STRATEGY_FATIGUE_RISK_LABEL_HE[strategyFatigueRisk] || STRATEGY_FATIGUE_RISK_LABEL_HE.unknown;
  const nextBestSequenceStepHe =
    NEXT_BEST_SEQUENCE_STEP_LABEL_HE[nextBestSequenceStep] || NEXT_BEST_SEQUENCE_STEP_LABEL_HE.observe_before_next_cycle;

  const supportSequenceNarrativeHe = `ב«${displayName}»: ${supportSequenceStateLabelHe}. ${nextBestSequenceStepHe}`;

  const supportSequencing = {
    version: 1,
    supportSequenceState,
    priorSupportPattern,
    strategyRepetitionRisk,
    strategyFatigueRisk,
    nextBestSequenceStep,
  };

  return {
    supportSequencing,
    supportSequenceState,
    supportSequenceStateLabelHe,
    priorSupportPattern,
    priorSupportPatternLabelHe,
    strategyRepetitionRisk,
    strategyRepetitionRiskHe,
    strategyFatigueRisk,
    strategyFatigueRiskHe,
    nextBestSequenceStep,
    nextBestSequenceStepHe,
    supportSequenceNarrativeHe,
  };
}
