/**
 * Dev-only snapshot for active diagnosis (no UI; not for learners/parents).
 * Populated by learning masters in development builds.
 */

export function installLearningDiagnosticDebugOnce() {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;
  if (window.__learningDiagnosticDebugInstalled) return;
  window.__learningDiagnosticDebugInstalled = true;
  window.__learningDiagnosticDebug = {
    pendingProbe: {},
    hypothesisLedger: {},
    lastProbeSelectionResult: {},
    lastInferredTags: {},
    lastProbeOutcome: {},
  };
}

/**
 * @param {Record<string, unknown>} patch — shallow merge into __learningDiagnosticDebug
 */
export function patchLearningDiagnosticDebug(patch) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;
  installLearningDiagnosticDebugOnce();
  Object.assign(window.__learningDiagnosticDebug, patch);
}
