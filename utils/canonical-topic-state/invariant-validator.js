/**
 * Invariant validator — enforces all 14 invariants at canonical state creation time.
 * Throws on any violation.
 */
import { ACTION_STATES, CONFIDENCE_LEVELS, READINESS_STATES, COMPOSITE_KEY_SEPARATOR } from "./schema.js";

/**
 * @param {import("./schema.js").CanonicalTopicState} state
 * @throws {Error} on any invariant violation
 */
export function validateCanonicalInvariants(state) {
  const errors = [];

  // Invariant 1: probe_only => recommendation.family === "probe_only" && !allowed
  if (state.actionState === "probe_only") {
    if (state.recommendation.family !== "probe_only") {
      errors.push(`INV-1: actionState=probe_only but recommendation.family=${state.recommendation.family}`);
    }
    if (state.recommendation.allowed !== false) {
      errors.push(`INV-1: actionState=probe_only but recommendation.allowed=true`);
    }
  }

  // Invariant 2: confidence=low => readiness !== ready
  if (state.assessment.confidenceLevel === "low" && state.assessment.readiness === "ready") {
    errors.push(`INV-2: confidenceLevel=low but readiness=ready`);
  }

  // Invariant 3: taxonomyMatch=false => actionState in [withhold, probe_only]
  if (state.evidence.taxonomyMatch === false) {
    if (state.actionState !== "withhold" && state.actionState !== "probe_only") {
      errors.push(`INV-3: taxonomyMatch=false but actionState=${state.actionState}`);
    }
  }

  // Invariant 4: cannotConcludeYet=true => actionState in [withhold, probe_only]
  if (state.assessment.cannotConcludeYet === true) {
    if (state.actionState !== "withhold" && state.actionState !== "probe_only") {
      errors.push(`INV-4: cannotConcludeYet=true but actionState=${state.actionState}`);
    }
  }

  // Invariant 5: recommendation.allowed=false => actionState in [withhold, probe_only]
  if (state.recommendation.allowed === false) {
    if (state.actionState !== "withhold" && state.actionState !== "probe_only") {
      errors.push(`INV-5: recommendation.allowed=false but actionState=${state.actionState}`);
    }
  }

  // Invariant 6: actionState=withhold => family=withhold && allowed=false
  if (state.actionState === "withhold") {
    if (state.recommendation.family !== "withhold") {
      errors.push(`INV-6: actionState=withhold but recommendation.family=${state.recommendation.family}`);
    }
    if (state.recommendation.allowed !== false) {
      errors.push(`INV-6: actionState=withhold but recommendation.allowed=true`);
    }
  }

  // Invariant 7: expand_cautiously => confidence in [high, moderate] && readiness in [ready, emerging]
  if (state.actionState === "expand_cautiously") {
    if (state.assessment.confidenceLevel !== "high" && state.assessment.confidenceLevel !== "moderate") {
      errors.push(`INV-7: actionState=expand_cautiously but confidenceLevel=${state.assessment.confidenceLevel}`);
    }
    if (state.assessment.readiness !== "ready" && state.assessment.readiness !== "emerging") {
      errors.push(`INV-7: actionState=expand_cautiously but readiness=${state.assessment.readiness}`);
    }
  }

  // Invariant 8: intervene => readiness in [ready, emerging, forming] AND cannotConcludeYet=false
  if (state.actionState === "intervene") {
    const validReadiness = ["ready", "emerging", "forming"];
    if (!validReadiness.includes(state.assessment.readiness)) {
      errors.push(`INV-8: actionState=intervene but readiness=${state.assessment.readiness}`);
    }
    if (state.assessment.cannotConcludeYet !== false) {
      errors.push(`INV-8: actionState=intervene but cannotConcludeYet=${state.assessment.cannotConcludeYet}`);
    }
  }

  // Invariant 9: stableMastery=true && confidence=low => actionState in [withhold, probe_only]
  if (state.evidence.stableMastery === true && state.assessment.confidenceLevel === "low") {
    if (state.actionState !== "withhold" && state.actionState !== "probe_only") {
      errors.push(`INV-9: stableMastery=true && confidenceLevel=low but actionState=${state.actionState}`);
    }
  }

  // Invariant 10: stateHash is a non-empty string
  if (typeof state.stateHash !== "string" || state.stateHash.length === 0) {
    errors.push(`INV-10: stateHash is empty or not a string`);
  }

  // Invariant 11: recommendation.family === actionState
  if (state.recommendation.family !== state.actionState) {
    errors.push(`INV-11: recommendation.family=${state.recommendation.family} !== actionState=${state.actionState}`);
  }

  // Invariant 12: no __unknown__ identities
  if (state.subjectId === "__unknown_subject__") {
    errors.push(`INV-12: subjectId is __unknown_subject__`);
  }
  if (state.topicKey === "__unknown_topic__") {
    errors.push(`INV-12: topicKey is __unknown_topic__`);
  }

  // Invariant 13: topicKey must not contain composite separator
  if (state.topicKey && state.topicKey.includes(COMPOSITE_KEY_SEPARATOR)) {
    errors.push(`INV-13: topicKey contains composite separator (\\u0001): "${state.topicKey}"`);
  }

  // Invariant 14 is checked after freeze in the builder

  // Validate enum membership
  if (!ACTION_STATES.includes(state.actionState)) {
    errors.push(`ENUM: actionState="${state.actionState}" not in ACTION_STATES`);
  }
  if (!CONFIDENCE_LEVELS.includes(state.assessment.confidenceLevel)) {
    errors.push(`ENUM: confidenceLevel="${state.assessment.confidenceLevel}" not in CONFIDENCE_LEVELS`);
  }
  if (!READINESS_STATES.includes(state.assessment.readiness)) {
    errors.push(`ENUM: readiness="${state.assessment.readiness}" not in READINESS_STATES`);
  }

  if (errors.length > 0) {
    throw new Error(
      `CanonicalTopicState invariant violation for ${state.topicStateId || "unknown"}:\n  ${errors.join("\n  ")}`
    );
  }
}
