/**
 * Adaptive Learning Planner — contract constants (English identifiers only).
 * Does not replace the diagnostic engine; consumes its outputs as hints.
 */

/** @typedef {"advance"|"maintain"|"remediate"|"review"|"insufficient_data"} EngineDecision */

/** @typedef {"ready"|"caution"|"insufficient_data"|"needs_human_review"} PlannerStatus */

/**
 * @typedef {"practice_current"|"review_prerequisite"|"probe_skill"|"advance_skill"|"maintain_skill"|"pause_collect_more_data"} NextAction
 */

/** @typedef {"thin"|"moderate"|"strong"} DataQuality */

export const ENGINE_DECISIONS = /** @type {const} */ ([
  "advance",
  "maintain",
  "remediate",
  "review",
  "insufficient_data",
]);

export const PLANNER_STATUSES = /** @type {const} */ ([
  "ready",
  "caution",
  "insufficient_data",
  "needs_human_review",
]);

export const NEXT_ACTIONS = /** @type {const} */ ([
  "practice_current",
  "review_prerequisite",
  "probe_skill",
  "advance_skill",
  "maintain_skill",
  "pause_collect_more_data",
]);

export const TARGET_DIFFICULTIES = /** @type {const} */ ([
  "intro",
  "basic",
  "standard",
  "advanced",
  "challenge",
]);

/** Canonical ascending order for deterministic tier moves */
export const DIFFICULTY_ORDER = ["intro", "basic", "standard", "advanced", "challenge"];

export const REASON_CODES = /** @type {const} */ ({
  THIN_DATA: "THIN_DATA",
  DO_NOT_CONCLUDE: "DO_NOT_CONCLUDE",
  REMEDIATE: "REMEDIATE",
  ADVANCE_STRONG_SIGNAL: "ADVANCE_STRONG_SIGNAL",
  MAINTAIN_STRONG_SIGNAL: "MAINTAIN_STRONG_SIGNAL",
  PREREQUISITE_REVIEW: "PREREQUISITE_REVIEW",
  PROBE_INCONSISTENCY: "PROBE_INCONSISTENCY",
  PROBE_GUESSING: "PROBE_GUESSING",
  MISSING_METADATA: "MISSING_METADATA",
  ENGLISH_SKILL_TAGGING_INCOMPLETE: "ENGLISH_SKILL_TAGGING_INCOMPLETE",
  ERROR_TYPES_TARGETED_PRACTICE: "ERROR_TYPES_TARGETED_PRACTICE",
  DEFAULT_MAINTAIN: "DEFAULT_MAINTAIN",
  ENGINE_INSUFFICIENT_DATA: "ENGINE_INSUFFICIENT_DATA",
});
