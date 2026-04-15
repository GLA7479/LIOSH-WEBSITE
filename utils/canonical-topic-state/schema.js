/**
 * CanonicalTopicState — unified enums and type definitions.
 * Single source of truth for all enum values across the entire parent-report system.
 */

export const ACTION_STATES = Object.freeze([
  "withhold",
  "probe_only",
  "diagnose_only",
  "intervene",
  "maintain",
  "expand_cautiously",
]);

export const REC_FAMILIES = ACTION_STATES;

export const CONFIDENCE_LEVELS = Object.freeze([
  "high",
  "moderate",
  "low",
  "early_signal_only",
  "insufficient_data",
  "contradictory",
]);

export const READINESS_STATES = Object.freeze([
  "ready",
  "emerging",
  "forming",
  "insufficient",
]);

export const INTENSITY_CAPS = Object.freeze(["RI0", "RI1", "RI2", "RI3"]);

export const CLAIM_CLASSES = Object.freeze([
  "no_claim",
  "descriptive_observation",
  "gentle_pattern",
  "stable_pattern",
  "actionable_guidance",
]);

export const POS_AUTH_LEVELS = Object.freeze([
  "none",
  "good",
  "very_good",
  "excellent",
]);

export const SUFFICIENCY = Object.freeze(["low", "medium", "strong"]);

export const PRIORITY_LEVELS = Object.freeze(["P1", "P2", "P3", "P4"]);

export const HARD_DENY_REASONS = Object.freeze([
  "contradictory",
  "counter_evidence",
  "weak_evidence",
  "insufficient_data",
  "early_signal_invalidated",
]);

export const TAXONOMY_MISMATCH_REASONS = Object.freeze([
  "taxonomy_not_matched",
  "weak_taxonomy_fallback_blocked",
]);

export const CLASSIFICATION_STATES = Object.freeze([
  "classified",
  "unclassified_no_taxonomy_match",
  "unclassified_weak_evidence",
]);

export const COMPOSITE_KEY_SEPARATOR = "\u0001";

/**
 * @typedef {Object} DecisionInputs
 * @property {string} priorityLevel
 * @property {string} breadth
 * @property {boolean} counterEvidenceStrong
 * @property {boolean} weakEvidence
 * @property {boolean} hintInvalidates
 * @property {boolean} narrowSample
 * @property {string|null} hardDenyReason
 * @property {string|null} taxonomyMismatchReason
 */

/**
 * @typedef {Object} CanonicalTopicState
 * @property {string} topicStateId
 * @property {string} stateHash
 * @property {string} subjectId
 * @property {string} topicKey
 * @property {string} bucketKey
 * @property {string} displayName
 * @property {Object} evidence
 * @property {DecisionInputs} decisionInputs
 * @property {Object} classification
 * @property {Object} assessment
 * @property {string} actionState
 * @property {Object} recommendation
 * @property {Object} narrativeConstraints
 * @property {Object} renderFlags
 * @property {boolean} _deprecated_positiveConclusionAllowed
 */
