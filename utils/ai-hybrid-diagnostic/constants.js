/** @type {"1.0"} */
export const HYBRID_RUNTIME_VERSION = "1.0";

/** Bumped when feature columns change (training/export lineage). */
export const FEATURE_SCHEMA_VERSION = "1.0.0";

/** Numeric gates aligned with approved master plan (offline / shadow SLOs). */
export const NUMERIC_GATES = {
  overclaimMaxOverall: 0.02,
  overclaimMaxPerSubject: 0.03,
  eceMaxOverall: 0.05,
  eceMaxPerSubject: 0.08,
  highSeverityDisagreementMax: 0.06,
  ndcgAt3MinLiftVsV2: 0.05,
  probeUtilityMinRelativeLift: 0.12,
  explanationForbiddenLeakageMax: 0,
  explanationEvidenceLinkPassMin: 0.995,
  ambiguityUncertaintyLineThreshold: 0.35,
  disagreementProbabilityGapMedium: 0.12,
  disagreementProbabilityGapHigh: 0.22,
  probabilitySumTolerance: 0.01,
};

export const STORAGE_KEYS = {
  consent: "mleo_ai_hybrid_consent_v1",
  learning: "mleo_ai_hybrid_learning_v1",
  shadowLog: "mleo_hybrid_shadow_log_v1",
  rolloutOverride: "mleo_ai_hybrid_rollout_override",
};

export const ROLLOUT_STAGES = /** @type {const} */ (["off", "shadow", "live"]);
