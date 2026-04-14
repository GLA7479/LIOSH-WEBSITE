import { FEATURE_SCHEMA_VERSION } from "./constants.js";

/** Minimum keys required for hybrid assist (not rank-only). */
const REQUIRED_ASSIST_KEYS = [
  "featureSchemaVersion",
  "subjectId",
  "topicRowKey",
  "bucketKey",
  "questions",
  "wrongAggregate",
  "accuracy01",
  "confidenceLevel",
  "priorityLevel",
  "cannotConcludeYet",
  "weakEvidence",
  "contradictoryConfidence",
];

/**
 * @param {Record<string, unknown>} features
 * @param {{ strictAssist: boolean }} opts
 * @returns {{ complete: boolean, completeness01: number, missing: string[] }}
 */
export function validateFeatureVector(features, opts = { strictAssist: true }) {
  const f = features && typeof features === "object" ? features : {};
  const keys = opts.strictAssist ? REQUIRED_ASSIST_KEYS : ["featureSchemaVersion", "subjectId", "topicRowKey"];
  const missing = [];
  for (const k of keys) {
    if (f[k] === undefined || f[k] === null || f[k] === "") missing.push(k);
  }
  const completeness01 = keys.length ? (keys.length - missing.length) / keys.length : 0;
  return {
    complete: missing.length === 0,
    completeness01,
    missing,
  };
}

/**
 * @param {object} params
 * @returns {Record<string, unknown>}
 */
export function buildFeatureVectorStub(params) {
  return {
    featureSchemaVersion: FEATURE_SCHEMA_VERSION,
    ...params,
  };
}
