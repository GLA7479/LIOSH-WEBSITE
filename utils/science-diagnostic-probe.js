/**
 * Phase 3D-A — science wrappers around shared active diagnostic runtime (backward compatible imports).
 */

import { buildPendingProbeFromMistake } from "./active-diagnostic-runtime/build-pending-probe.js";
import { bankQuestionProbeMatch } from "./active-diagnostic-runtime/probe-match.js";
import { probeMatchesSession } from "./active-diagnostic-runtime/session-match.js";
import { selectQuestionWithProbe } from "./active-diagnostic-runtime/select-with-probe.js";

export const scienceQuestionProbeMatch = bankQuestionProbeMatch;
export const scienceProbeMatchesSession = probeMatchesSession;

/**
 * @param {import("./mistake-event.js").MistakeEventV1} normalized
 * @param {{ wrongQuestionId?: string, wrongAvoidKey?: string, fallbackTopicId?: string, fallbackGrade?: string, fallbackLevel?: string }} [ctx]
 */
export function buildSciencePendingDiagnosticProbe(normalized, ctx = {}) {
  return buildPendingProbeFromMistake(normalized, ctx, "science");
}

/**
 * @param {object} p
 * @param {Record<string, unknown>[]} p.questions — eligible pool (already topic/grade/level filtered)
 */
export function selectScienceQuestionWithProbe({
  questions,
  pendingProbe,
  recentIds,
  currentTopic,
  fallbackPick,
  randomFn,
}) {
  return selectQuestionWithProbe({
    items: questions,
    pendingProbe,
    recentIds,
    currentTopic,
    fallbackPick,
    randomFn,
  });
}
