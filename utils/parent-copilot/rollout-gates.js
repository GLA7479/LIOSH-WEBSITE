/**
 * Rollout and KPI gating for Parent Copilot advanced generation.
 */

/** Browser bundles may not define `process`; bare `process.env` throws ReferenceError. */
function envRaw(name) {
  try {
    if (typeof process !== "undefined" && process?.env) return process.env[name];
  } catch {
    /* ignore */
  }
  return undefined;
}

function envNum(name, fallback) {
  const n = Number(envRaw(name));
  return Number.isFinite(n) ? n : fallback;
}

function envBool(name) {
  return String(envRaw(name) || "")
    .trim()
    .toLowerCase() === "true";
}

export const COPILOT_ROLLOUT_STAGE = String(envRaw("PARENT_COPILOT_ROLLOUT_STAGE") || "internal").trim();

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
  return getLlmGateDecision().enabled;
}

export function getLlmGateDecision() {
  /** @type {string[]} */
  const reasonCodes = [];
  if (envBool("PARENT_COPILOT_FORCE_DETERMINISTIC")) {
    reasonCodes.push("force_deterministic");
  }
  if (!envBool("PARENT_COPILOT_LLM_ENABLED")) {
    reasonCodes.push("llm_env_disabled");
  }
  // P0 policy: keep LLM OFF in practice unless explicit experiment opt-in exists.
  if (!envBool("PARENT_COPILOT_LLM_EXPERIMENT")) {
    reasonCodes.push("llm_experiment_flag_missing");
  }
  if (!(COPILOT_ROLLOUT_STAGE === "internal" || COPILOT_ROLLOUT_STAGE === "beta" || COPILOT_ROLLOUT_STAGE === "full")) {
    reasonCodes.push("rollout_stage_not_allowed");
  }
  return {
    enabled: reasonCodes.length === 0,
    reasonCodes,
    stage: COPILOT_ROLLOUT_STAGE,
  };
}

export default {
  COPILOT_ROLLOUT_STAGE,
  readKpiThresholds,
  evaluateKpiGate,
  canUseLlmPath,
  getLlmGateDecision,
};
