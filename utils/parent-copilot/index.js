/**
 * Parent Copilot v1 — parent-only runtime. Single entry for a conversational turn.
 */

import { resolveScope } from "./scope-resolver.js";
import { buildTruthPacketV1 } from "./truth-packet-v1.js";
import { resolveIntent } from "./intent-resolver.js";
import { planConversation } from "./conversation-planner.js";
import { composeAnswerDraft } from "./answer-composer.js";
import { validateAnswerDraft, validateParentCopilotResponseV1 } from "./guardrail-validator.js";
import { buildDeterministicFallbackAnswer } from "./fallback-templates.js";
import { selectFollowUp } from "./followup-engine.js";
import { getConversationState, applyConversationStateDelta } from "./session-memory.js";
import {
  buildResolvedParentCopilotResponse,
  buildClarificationParentCopilotResponse,
  buildQuickActions,
} from "./render-adapter.js";

/**
 * @param {object} input
 * @param {"parent"|"teacher"} [input.audience]
 * @param {unknown} input.payload
 * @param {string} [input.utterance]
 * @param {string} [input.sessionId]
 * @param {null|{ scopeType?: string; scopeId?: string; subjectId?: string }} [input.selectedContextRef]
 * @param {string|null} [input.clickedFollowupFamily] quick-action chip → maps to session clickedFollowups
 */
export function runParentCopilotTurn(input) {
  const audience = String(input?.audience || "parent");
  const sessionId = String(input?.sessionId || "default");
  const conv = getConversationState(sessionId);
  const priorRepeated = Number(conv.repeatedPhraseHits) || 0;

  if (audience !== "parent") {
    const r = buildClarificationParentCopilotResponse({
      clarificationQuestionHe: "מצב זה מיועד להורה בלבד.",
      intent: "uncertainty_boundary",
      priorRepeated,
    });
    validateParentCopilotResponseV1(r);
    return r;
  }

  const scopeRes = resolveScope({
    payload: input?.payload,
    utterance: String(input?.utterance || ""),
    selectedContextRef: input?.selectedContextRef ?? null,
  });

  if (scopeRes.resolutionStatus === "clarification_required") {
    const r = buildClarificationParentCopilotResponse({
      clarificationQuestionHe: scopeRes.clarificationQuestionHe || "נדרש הקשר נוסף.",
      intent: "uncertainty_boundary",
      priorRepeated,
    });
    validateParentCopilotResponseV1(r);
    return r;
  }

  const scope = scopeRes.scope;
  if (!scope) {
    const r = buildClarificationParentCopilotResponse({
      clarificationQuestionHe: "לא ניתן לזהות הקשר מהדוח.",
      intent: "uncertainty_boundary",
      priorRepeated,
    });
    validateParentCopilotResponseV1(r);
    return r;
  }

  const truthPacket = buildTruthPacketV1(input.payload, scope);
  if (!truthPacket) {
    const r = buildClarificationParentCopilotResponse({
      clarificationQuestionHe: "לא נמצאו חוזים תואמים לנושא שנבחר בדוח.",
      intent: "uncertainty_boundary",
      priorRepeated,
    });
    validateParentCopilotResponseV1(r);
    return r;
  }

  const intent = resolveIntent(String(input?.utterance || ""));
  const priorIntents = Array.isArray(conv.priorIntents) ? conv.priorIntents : [];
  const lastIntent = priorIntents.length ? String(priorIntents[priorIntents.length - 1] || "") : "";
  const continuityRepeat = lastIntent === intent && lastIntent.length > 0;
  const plan = planConversation(intent, truthPacket, { continuityRepeat });
  let draft = composeAnswerDraft(plan, truthPacket, {
    intent,
    continuityRepeat,
    conversationState: conv,
  });
  let vDraft = validateAnswerDraft(draft, truthPacket);
  let fallbackUsed = false;

  if (!vDraft.ok) {
    draft = buildDeterministicFallbackAnswer(truthPacket, vDraft.failCodes);
    fallbackUsed = true;
    vDraft = validateAnswerDraft(draft, truthPacket);
  }
  if (!vDraft.ok) {
    const nar = truthPacket.contracts?.narrative;
    const slots = nar?.textSlots || {};
    draft = {
      answerBlocks: [
        { type: "observation", textHe: String(slots.observation || "").trim(), source: "contract_slot" },
        { type: "meaning", textHe: String(slots.interpretation || "").trim(), source: "contract_slot" },
      ].filter((b) => b.textHe),
    };
    if (draft.answerBlocks.length < 2) {
      draft = buildDeterministicFallbackAnswer(truthPacket, ["emergency_fallback"]);
    }
    fallbackUsed = true;
    vDraft = validateAnswerDraft(draft, truthPacket);
  }

  const follow = selectFollowUp({
    audience: "parent",
    intent,
    scopeType: truthPacket.scopeType,
    scopeKey: `${truthPacket.scopeType}:${truthPacket.scopeId}`,
    clickedFollowupFamilyThisTurn: input?.clickedFollowupFamily ? String(input.clickedFollowupFamily).trim() : null,
    truthPacket: {
      cannotConcludeYet: truthPacket.derivedLimits.cannotConcludeYet,
      readiness: truthPacket.derivedLimits.readiness,
      confidenceBand: truthPacket.derivedLimits.confidenceBand,
      recommendationEligible: truthPacket.derivedLimits.recommendationEligible,
      recommendationIntensityCap: truthPacket.derivedLimits.recommendationIntensityCap,
      allowedFollowupFamilies: truthPacket.allowedFollowupFamilies,
    },
    conversationState: conv,
  });

  const suggestedFollowUp = follow.selected
    ? {
        kind: /** @type {const} */ ("question"),
        family: follow.selected.family,
        textHe: follow.selected.textHe,
        reasonCode: follow.selected.reasonCode,
      }
    : null;

  /** @type {Array<"contractsV1.evidence"|"contractsV1.decision"|"contractsV1.readiness"|"contractsV1.confidence"|"contractsV1.recommendation"|"contractsV1.narrative">} */
  const contractSourcesUsed = ["contractsV1.narrative"];
  if (intent !== "understand_observation") {
    contractSourcesUsed.push("contractsV1.decision", "contractsV1.readiness", "contractsV1.confidence");
  }
  if (draft.answerBlocks.some((b) => b.type === "next_step")) {
    contractSourcesUsed.push("contractsV1.recommendation");
  }
  if (intent === "understand_observation") {
    contractSourcesUsed.push("contractsV1.evidence");
  }

  const validatorFailCodes = vDraft.ok ? [] : [...vDraft.failCodes];
  const validatorStatus = vDraft.ok ? "pass" : "fail";

  let response = buildResolvedParentCopilotResponse({
    truthPacket,
    intent,
    answerBlocks: draft.answerBlocks,
    suggestedFollowUp,
    validatorStatus,
    validatorFailCodes,
    fallbackUsed,
    contractSourcesUsed: [...new Set(contractSourcesUsed)],
    priorRepeated,
  });

  const finalCheck = validateParentCopilotResponseV1(response);
  if (!finalCheck.ok && response.resolutionStatus === "resolved") {
    response = {
      ...response,
      validatorStatus: "fail",
      validatorFailCodes: [...new Set([...(response.validatorFailCodes || []), ...finalCheck.hardFails])],
      quickActions: buildQuickActions(truthPacket, false),
    };
  }

  const constraintParts = [vDraft.ok ? "turn:validator_pass" : "turn:validator_fail"];
  if (draft.answerBlocks.some((b) => b.type === "uncertainty_reason")) constraintParts.push("surface:uncertainty");
  if (draft.answerBlocks.some((b) => b.type === "caution")) constraintParts.push("surface:caution");

  const assistantAnswerSummary = draft.answerBlocks
    .map((b) => b.textHe)
    .join(" ")
    .trim()
    .slice(0, 480);

  applyConversationStateDelta(sessionId, {
    addedIntent: intent,
    addedFollowUpFamily: suggestedFollowUp?.family,
    ...(input?.clickedFollowupFamily
      ? { clickedFollowupFamily: String(input.clickedFollowupFamily).trim() }
      : {}),
    addedScopeKey: `${truthPacket.scopeType}:${truthPacket.scopeId}`,
    answeredConstraintTag: constraintParts.join(","),
    closingSnippet: draft.answerBlocks.map((b) => b.textHe).join(" ").slice(-48),
    ...(suggestedFollowUp?.textHe ? { suggestedFollowupTextHe: suggestedFollowUp.textHe } : {}),
    ...(assistantAnswerSummary ? { assistantAnswerSummary } : {}),
  });

  return response;
}

export { buildTruthPacketV1 } from "./truth-packet-v1.js";
export { readContractsSliceForScope } from "./contract-reader.js";

export default { runParentCopilotTurn };
