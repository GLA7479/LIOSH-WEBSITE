/**
 * Phase 3D-B — science re-exports of shared hypothesis ledger helpers (backward compatible imports).
 */

export {
  buildHypothesisKey as buildScienceHypothesisKey,
  applyProbeOutcome as applyScienceProbeOutcome,
} from "./active-diagnostic-runtime/index.js";
