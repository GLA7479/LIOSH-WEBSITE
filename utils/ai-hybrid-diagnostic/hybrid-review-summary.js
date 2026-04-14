/**
 * Local review-time aggregation over a hybridRuntime payload (no shadow log required).
 * Complements rollup on the payload and session shadow entries.
 */

const MODES = ["assist", "rank_only", "explain_only", "suppressed"];
const SEVERITIES = ["none", "low", "medium", "high"];

/**
 * @param {object|null|undefined} hr hybridRuntime payload (validated or best-effort)
 */
export function summarizeHybridRuntimeForReview(hr) {
  const out = {
    totalUnits: 0,
    modeCounts: /** @type {Record<string, number>} */ (Object.fromEntries(MODES.map((m) => [m, 0]))),
    disagreementCount: 0,
    /** Counts only units where disagreement.hasDisagreement is true */
    disagreementSeveritySplit: /** @type {Record<string, number>} */ ({
      low: 0,
      medium: 0,
      high: 0,
    }),
    /** All units by disagreement.severity (includes none) */
    disagreementSeverityAllUnits: /** @type {Record<string, number>} */ (
      Object.fromEntries(SEVERITIES.map((s) => [s, 0]))
    ),
    exposureMode: hr && typeof hr === "object" && typeof hr.exposureMode === "string" ? hr.exposureMode : null,
    hybridRuntimeVersion:
      hr && typeof hr === "object" && typeof hr.hybridRuntimeVersion === "string"
        ? hr.hybridRuntimeVersion
        : null,
    rollup:
      hr && typeof hr === "object" && hr.rollup && typeof hr.rollup === "object" ? { ...hr.rollup } : null,
    shadowEntriesSampled:
      hr && typeof hr === "object" && hr.shadow && typeof hr.shadow === "object"
        ? Number(hr.shadow.entriesSampled)
        : null,
  };

  if (!hr || typeof hr !== "object" || !Array.isArray(hr.units)) return out;

  out.totalUnits = hr.units.length;

  for (const u of hr.units) {
    const mode = u?.aiAssist?.mode;
    if (typeof mode === "string" && mode in out.modeCounts) {
      out.modeCounts[mode] += 1;
    }
    const sev = u?.disagreement?.severity;
    if (typeof sev === "string" && sev in out.disagreementSeverityAllUnits) {
      out.disagreementSeverityAllUnits[sev] += 1;
    }
    if (u?.disagreement?.hasDisagreement) {
      out.disagreementCount += 1;
      if (sev === "low" || sev === "medium" || sev === "high") {
        out.disagreementSeveritySplit[sev] += 1;
      }
    }
  }

  return out;
}
