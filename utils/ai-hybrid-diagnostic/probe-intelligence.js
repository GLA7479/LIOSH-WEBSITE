import { NUMERIC_GATES } from "./constants.js";

/**
 * Rule baseline: single structural probe utility estimate.
 * @param {number} ambiguity01
 */
function ruleBaselineReduction(ambiguity01) {
  return Math.max(0.05, Math.min(0.45, 0.2 + (1 - ambiguity01) * 0.15));
}

/**
 * @param {object} p
 * @param {object} p.unit
 * @param {object} p.ranking from rankHypotheses
 * @param {{ mode: string }} p.gate
 */
export function buildProbeIntelligence({ unit, ranking, gate }) {
  const probe = unit?.probe && typeof unit.probe === "object" ? unit.probe : null;
  const taxonomyId = unit?.taxonomy?.id || unit?.diagnosis?.taxonomyId || null;
  const suggestedProbeId = taxonomyId ? `taxonomy_probe:${taxonomyId}` : "structural_transfer";
  const ambiguity = Number(ranking?.ambiguityScore);
  const amb01 = Number.isFinite(ambiguity) ? Math.max(0, Math.min(1, ambiguity)) : 1;

  const ruleBase = ruleBaselineReduction(amb01);
  let uncertaintyReductionEstimate = ruleBase;
  if (gate.mode === "assist" && ranking.calibrationBand === "well_calibrated") {
    uncertaintyReductionEstimate = Math.min(0.55, ruleBase * 1.15);
  }

  const stoppingRuleMet = amb01 < 0.25;
  const pri = unit?.priority?.level;
  const escalationRuleTriggered = pri === "P4" || !!unit?.outputGating?.humanReviewRecommended;

  return {
    suggestedProbeId,
    uncertaintyReductionEstimate,
    stoppingRuleMet,
    escalationRuleTriggered,
    v2ProbeSummary: probe
      ? {
          probeType: probe.probeType || null,
          taxonomyId: probe.taxonomyId || null,
        }
      : null,
    ruleBaselineReduction: ruleBase,
    numericGateRef: NUMERIC_GATES.probeUtilityMinRelativeLift,
  };
}
