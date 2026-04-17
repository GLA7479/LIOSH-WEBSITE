import { validateFeatureVector } from "./feature-schema.js";

/**
 * @typedef {"assist"|"rank_only"|"explain_only"|"suppressed"} AiAssistMode
 */

/**
 * @param {object} p
 * @param {object} p.unit
 * @param {Record<string, unknown>} p.features
 * @param {{ state: string }} p.consent
 * @param {string} p.rolloutStage
 */
export function resolveAuthorityGate({ unit, features, consent, rolloutStage }) {
  /** @type {string[]} */
  const suppressionFlags = [];

  if (consent?.state === "opted_out") {
    suppressionFlags.push("policy_blocked");
    return { mode: /** @type {AiAssistMode} */ ("suppressed"), suppressionFlags, eligible: false };
  }
  if (rolloutStage === "off") {
    suppressionFlags.push("policy_blocked");
    return { mode: "suppressed", suppressionFlags, eligible: false };
  }

  const cs = unit?.canonicalState;
  if (!cs) {
    suppressionFlags.push("canonical_missing");
    return { mode: "suppressed", suppressionFlags, eligible: false };
  }
  const action = cs.actionState;
  if (action === "withhold" || action === "probe_only") {
    if (cs.evidence?.positiveAuthorityLevel && cs.evidence.positiveAuthorityLevel !== "none") {
      suppressionFlags.push("incoherent_canonical_state");
    }
    suppressionFlags.push("canonical_action_blocked");
    return { mode: "suppressed", suppressionFlags, eligible: false };
  }

  const g = unit?.outputGating && typeof unit.outputGating === "object" ? unit.outputGating : {};
  const fv = validateFeatureVector(features, { strictAssist: true });
  if (!fv.complete) suppressionFlags.push("feature_incomplete");

  if (g.cannotConcludeYet) suppressionFlags.push("v2_cannot_conclude");
  if (String(unit?.confidence?.level || "") === "contradictory") suppressionFlags.push("contradictory_evidence");
  if (unit?.diagnosis?.humanBoundaryStripped) suppressionFlags.push("human_boundary_risk");

  if (suppressionFlags.length) {
    return { mode: "suppressed", suppressionFlags, eligible: false };
  }

  const conf = String(unit?.confidence?.level || "");
  const diagnosisAllowed = !!g.diagnosisAllowed && !!unit?.diagnosis?.allowed;
  const recurrenceFull = !!unit?.recurrence?.full;

  if (g.confidenceOnly || g.probeOnly) {
    return { mode: "explain_only", suppressionFlags: [], eligible: true };
  }

  if (!diagnosisAllowed) {
    suppressionFlags.push("v2_cannot_conclude");
    return { mode: "suppressed", suppressionFlags, eligible: false };
  }

  if (conf === "high" && recurrenceFull) {
    return { mode: "assist", suppressionFlags: [], eligible: true };
  }

  if (conf === "moderate" || conf === "high") {
    return { mode: "rank_only", suppressionFlags: [], eligible: true };
  }

  suppressionFlags.push("v2_cannot_conclude");
  return { mode: "suppressed", suppressionFlags, eligible: false };
}
