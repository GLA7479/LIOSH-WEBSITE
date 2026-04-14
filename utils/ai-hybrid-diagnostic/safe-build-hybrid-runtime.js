import { buildHybridRuntimeForReport } from "./run-hybrid-for-report.js";
import { isValidHybridRuntimePayload } from "./validate-hybrid-runtime.js";

/**
 * Best-effort hybrid runtime: never throws; returns null if build/validation fails.
 * V2 / parent report generation must not depend on hybrid succeeding.
 *
 * @param {object} params
 * @param {object|null} params.diagnosticEngineV2
 * @param {Record<string, Record<string, object>>} params.maps
 * @param {Record<string, unknown[]>} params.rawMistakesBySubject
 * @param {number} params.startMs
 * @param {number} params.endMs
 * @returns {object|null}
 */
export function safeBuildHybridRuntimeForReport(params) {
  try {
    const out = buildHybridRuntimeForReport(params);
    const expectedUnitCount = Array.isArray(params?.diagnosticEngineV2?.units)
      ? params.diagnosticEngineV2.units.length
      : 0;
    if (!isValidHybridRuntimePayload(out, { expectedUnitCount })) {
      return null;
    }
    return out;
  } catch {
    return null;
  }
}
