/**
 * Parent intent — delegated to Stage A canonical model (deterministic).
 * Kept as a module boundary for suites and legacy imports.
 */

import { interpretFreeformStageA } from "./stage-a-freeform-interpretation.js";

/**
 * @param {string} utterance
 */
export function resolveIntentWithConfidence(utterance) {
  const s = interpretFreeformStageA(utterance, null);
  return {
    intent: s.canonicalIntent,
    confidence: s.canonicalIntentScore,
    reason: s.intentReason,
    normalizedUtterance: s.normalizedUtterance,
    shouldClarify: s.shouldClarifyIntent,
    stageA: s,
  };
}

/**
 * @param {string} utterance
 */
export function resolveIntent(utterance) {
  return resolveIntentWithConfidence(utterance).intent;
}

export default { resolveIntent, resolveIntentWithConfidence };
