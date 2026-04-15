/**
 * Parent Copilot telemetry contract v1.
 * Shared runtime validator for trace persistence and rollout evidence scripts.
 */

export const TELEMETRY_TRACE_SCHEMA_VERSION = "v1";

export const REQUIRED_TRACE_FIELDS = [
  "schemaVersion",
  "traceId",
  "sessionId",
  "resolutionStatus",
  "intent",
  "intentReason",
  "scopeReason",
  "generationPath",
  "fallbackUsed",
  "validatorStatus",
  "timestampMs",
];

/**
 * @param {Record<string, unknown>} event
 */
export function validateTelemetryTraceEventV1(event) {
  const e = event && typeof event === "object" ? event : {};
  /** @type {string[]} */
  const missing = [];
  for (const k of REQUIRED_TRACE_FIELDS) {
    const v = e[k];
    if (v == null || (typeof v === "string" && !String(v).trim())) missing.push(k);
  }
  if (String(e.schemaVersion || "") !== TELEMETRY_TRACE_SCHEMA_VERSION) {
    missing.push("schemaVersion");
  }
  const ts = Number(e.timestampMs);
  if (!Number.isFinite(ts) || ts <= 0) missing.push("timestampMs");
  return { ok: missing.length === 0, missing };
}

export default {
  TELEMETRY_TRACE_SCHEMA_VERSION,
  REQUIRED_TRACE_FIELDS,
  validateTelemetryTraceEventV1,
};
