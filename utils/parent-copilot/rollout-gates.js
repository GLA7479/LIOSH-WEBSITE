/**
 * Rollout and KPI gating for Parent Copilot advanced generation.
 */

function envNum(name, fallback) {
  const n = Number(process.env?.[name]);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(name) {
  return String(process.env?.[name] || "")
    .trim()
    .toLowerCase() === "true";
}

export const COPILOT_ROLLOUT_STAGE = String(process.env?.PARENT_COPILOT_ROLLOUT_STAGE || "internal").trim();

export function readKpiThresholds() {
  return {
    minFluency: envNum("PARENT_COPILOT_KPI_MIN_FLUENCY", 75),
    minGroundedness: envNum("PARENT_COPILOT_KPI_MIN_GROUNDEDNESS", 85),
    maxGenericness: envNum("PARENT_COPILOT_KPI_MAX_GENERICNESS", 42),
    maxFallbackRate: envNum("PARENT_COPILOT_KPI_MAX_FALLBACK_RATE", 0.2),
    minClarificationSuccess: envNum("PARENT_COPILOT_KPI_MIN_CLARIFICATION_SUCCESS", 0.6),
  };
}

/**
 * @param {{
 *  hebrewFluencyScore?: number;
 *  groundednessScore?: number;
 *  genericnessRate?: number;
 *  fallbackRate?: number;
 *  clarificationSuccessRate?: number;
 * }} stats
 */
export function evaluateKpiGate(stats) {
  const t = readKpiThresholds();
  const s = stats || {};
  const failures = [];
  if (Number.isFinite(s.hebrewFluencyScore) && s.hebrewFluencyScore < t.minFluency) failures.push("fluency_below_threshold");
  if (Number.isFinite(s.groundednessScore) && s.groundednessScore < t.minGroundedness) failures.push("groundedness_below_threshold");
  if (Number.isFinite(s.genericnessRate) && s.genericnessRate > t.maxGenericness) failures.push("genericness_above_threshold");
  if (Number.isFinite(s.fallbackRate) && s.fallbackRate > t.maxFallbackRate) failures.push("fallback_rate_above_threshold");
  if (Number.isFinite(s.clarificationSuccessRate) && s.clarificationSuccessRate < t.minClarificationSuccess) {
    failures.push("clarification_success_below_threshold");
  }
  return { pass: failures.length === 0, failures, thresholds: t };
}

export function canUseLlmPath() {
  if (envBool("PARENT_COPILOT_FORCE_DETERMINISTIC")) return false;
  if (!envBool("PARENT_COPILOT_LLM_ENABLED")) return false;
  return COPILOT_ROLLOUT_STAGE === "internal" || COPILOT_ROLLOUT_STAGE === "beta" || COPILOT_ROLLOUT_STAGE === "full";
}

export default {
  COPILOT_ROLLOUT_STAGE,
  readKpiThresholds,
  evaluateKpiGate,
  canUseLlmPath,
};
