/**
 * Parent Copilot v1 — parent-only runtime. Single entry for a conversational turn.
 */

import { resolveScope } from "./scope-resolver.js";
import { buildTruthPacketV1 } from "./truth-packet-v1.js";
import { interpretFreeformStageA } from "./stage-a-freeform-interpretation.js";
import { planConversation } from "./conversation-planner.js";
import { composeAnswerDraft } from "./answer-composer.js";
import { detectAggregateQuestionClass } from "./semantic-question-class.js";
import { buildSemanticAggregateDraft } from "./semantic-aggregate-answers.js";
import { validateAnswerDraft, validateParentCopilotResponseV1 } from "./guardrail-validator.js";
import { buildDeterministicFallbackAnswer } from "./fallback-templates.js";
import { selectFollowUp } from "./followup-engine.js";
import { getConversationState, applyConversationStateDelta } from "./session-memory.js";
import {
  buildResolvedParentCopilotResponse,
  buildClarificationParentCopilotResponse,
  buildQuickActions,
} from "./render-adapter.js";
import { normalizeParentFacingHe } from "../parent-report-language/parent-facing-normalize-he.js";
import { normalizeFreeformParentUtteranceHe } from "./utterance-normalize-he.js";
import { buildTurnTelemetry } from "./turn-telemetry.js";
import { maybeGenerateGroundedLlmDraft } from "./llm-orchestrator.js";
import { appendTurnTelemetryTrace } from "./telemetry-store.js";

function normalizeAnswerBlocksHe(answerBlocks) {
  return (Array.isArray(answerBlocks) ? answerBlocks : []).map((b) => ({
    ...b,
    textHe: normalizeParentFacingHe(String(b?.textHe || "").trim()),
  }));
}

function ensureResponseTelemetry(response, context) {
  if (response?.telemetry && typeof response.telemetry === "object") return response;
  const metadata = response?.metadata && typeof response.metadata === "object" ? response.metadata : {};
  const fallbackUsed = !!response?.fallbackUsed;
  const validatorFailCodes = Array.isArray(response?.validatorFailCodes) ? response.validatorFailCodes : [];
  const telemetry = buildTurnTelemetry({
    intent: String(response?.intent || context.intent || "unknown"),
    intentConfidence: Number(metadata.intentConfidence || 0),
    intentReason: String(metadata.intentReason || "unknown_intent_reason"),
    scopeConfidence: Number(metadata.scopeConfidence || 0),
    scopeReason: String(metadata.scopeReason || "unknown_scope_reason"),
    answerBlocks: Array.isArray(response?.answerBlocks) ? response.answerBlocks : [],
    fallbackUsed,
    fallbackReasonCodes: fallbackUsed ? validatorFailCodes : [],
    validatorFailCodes,
    semanticAggregateSatisfied: false,
    generationPath: String(context.generationPath || "deterministic"),
    truthPacket: context.truthPacket || null,
    resolutionStatus: String(response?.resolutionStatus || "clarification_required"),
    scopeType: response?.scopeType ?? null,
    scopeId: response?.scopeId ?? null,
    llmAttempt: context.llmAttempt || null,
  });
  return { ...response, telemetry };
}

function persistTelemetryBestEffort(response, context) {
  const telemetry = response?.telemetry && typeof response.telemetry === "object" ? response.telemetry : null;
  if (!telemetry) return;
  const trace = telemetry.trace && typeof telemetry.trace === "object" ? telemetry.trace : {};
  const branchOutcomes = trace.branchOutcomes && typeof trace.branchOutcomes === "object" ? trace.branchOutcomes : {};
  const llmAttempt = telemetry.llmAttempt || branchOutcomes.llmAttempt || null;
  appendTurnTelemetryTrace({
    schemaVersion: "v1",
    traceId: String(telemetry.traceId || ""),
    sessionId: String(context.sessionId || "default"),
    audience: String(response?.audience || context.audience || "parent"),
    resolutionStatus: String(response?.resolutionStatus || trace.resolutionStatus || "unknown"),
    intent: String(response?.intent || telemetry?.intent?.value || "unknown"),
    intentReason: String(telemetry?.intent?.reason || response?.metadata?.intentReason || "unknown_intent_reason"),
    scopeReason: String(telemetry?.scope?.reason || response?.metadata?.scopeReason || "unknown_scope_reason"),
    scopeType: response?.scopeType ?? trace.scopeType ?? null,
    scopeId: response?.scopeId ?? trace.scopeId ?? null,
    generationPath: String(telemetry.generationPath || branchOutcomes.generationPath || "deterministic"),
    fallbackUsed: !!(response?.fallbackUsed || telemetry.fallbackUsed),
    fallbackReasonCodes: Array.isArray(telemetry.fallbackReasonCodes) ? [...telemetry.fallbackReasonCodes] : [],
    validatorStatus: String(response?.validatorStatus || telemetry?.validator?.status || "unknown"),
    validatorFailCodes: Array.isArray(response?.validatorFailCodes)
      ? [...response.validatorFailCodes]
      : Array.isArray(telemetry?.validator?.failCodes)
        ? [...telemetry.validator.failCodes]
        : [],
    semanticAggregateSatisfied: !!telemetry.semanticAggregateSatisfied,
    llmAttempt:
      llmAttempt && typeof llmAttempt === "object"
        ? { ok: !!llmAttempt.ok, reason: String(llmAttempt.reason || ""), provider: llmAttempt.provider || undefined }
        : null,
    utteranceLength: Number(context.utteranceLength || 0),
    timestampMs: Number(telemetry.timestampMs || Date.now()),
  });
}

function finalizeTurnResponse(response, context) {
  const withTelemetry = ensureResponseTelemetry(response, context);
  persistTelemetryBestEffort(withTelemetry, context);
  return withTelemetry;
}

/**
 * Deterministic baseline path used by both sync and async runtimes.
 * @param {object} input
 */
function runDeterministicCore(input) {
  const audience = String(input?.audience || "parent");
  const sessionId = String(input?.sessionId || "default");
  const conv = getConversationState(sessionId);
  const priorRepeated = Number(conv.repeatedPhraseHits) || 0;

  if (audience !== "parent") {
    const r = buildClarificationParentCopilotResponse({
      clarificationQuestionHe: "מצב זה מיועד להורה בלבד.",
      intent: "uncertainty_boundary",
      priorRepeated,
      metadata: { intentConfidence: 1, intentReason: "audience_guard", scopeConfidence: 1, scopeReason: "audience_guard" },
    });
    validateParentCopilotResponseV1(r);
    return { response: r, audience, sessionId, conv, truthPacket: null, intent: "uncertainty_boundary", scopeMeta: null, utteranceStr: "" };
  }

  const utteranceStr = normalizeFreeformParentUtteranceHe(String(input?.utterance || ""));
  const aggregateQuestionClass = detectAggregateQuestionClass(utteranceStr);
  const stageA = interpretFreeformStageA(String(input?.utterance || ""), input?.payload);
  const intent = stageA.canonicalIntent;
  const intentResolution = {
    intent,
    confidence: stageA.canonicalIntentScore,
    reason: stageA.intentReason,
    normalizedUtterance: stageA.normalizedUtterance,
    shouldClarify: stageA.shouldClarifyIntent,
    stageA,
  };

  const scopeRes = resolveScope({
    payload: input?.payload,
    utterance: utteranceStr,
    selectedContextRef: input?.selectedContextRef ?? null,
    stageA,
  });

  const scopeMeta = {
    scopeConfidence: Number(scopeRes?.scopeConfidence || 0),
    scopeReason: String(scopeRes?.scopeReason || "unknown_scope_reason"),
    intentConfidence: Number(intentResolution.confidence || 0),
    intentReason: String(intentResolution.reason || "unknown_intent_reason"),
  };

  if (scopeRes.resolutionStatus === "clarification_required") {
    const r = buildClarificationParentCopilotResponse({
      clarificationQuestionHe: scopeRes.clarificationQuestionHe || "נדרש הקשר נוסף.",
      intent,
      priorRepeated,
      metadata: scopeMeta,
    });
    validateParentCopilotResponseV1(r);
    return { response: r, audience, sessionId, conv, truthPacket: null, intent, scopeMeta, utteranceStr };
  }

  const scope = scopeRes.scope;
  if (!scope) {
    const r = buildClarificationParentCopilotResponse({
      clarificationQuestionHe: "לא ניתן לזהות הקשר מהדוח.",
      intent,
      priorRepeated,
      metadata: scopeMeta,
    });
    validateParentCopilotResponseV1(r);
    return { response: r, audience, sessionId, conv, truthPacket: null, intent, scopeMeta, utteranceStr };
  }

  const truthPacket = buildTruthPacketV1(input.payload, scope);
  if (!truthPacket) {
    const r = buildClarificationParentCopilotResponse({
      clarificationQuestionHe: "לא נמצאו חוזים תואמים לנושא שנבחר בדוח.",
      intent,
      priorRepeated,
      metadata: scopeMeta,
    });
    validateParentCopilotResponseV1(r);
    return { response: r, audience, sessionId, conv, truthPacket: null, intent, scopeMeta, utteranceStr };
  }

  const priorIntents = Array.isArray(conv.priorIntents) ? conv.priorIntents : [];
  const lastIntent = priorIntents.length ? String(priorIntents[priorIntents.length - 1] || "") : "";
  const continuityRepeat = lastIntent === intent && lastIntent.length > 0;

  let draft;
  let semanticAggregateSatisfied = false;
  const dlForAgg = truthPacket.derivedLimits || {};
  const skipSemanticAggregateForIneligibleRec =
    aggregateQuestionClass === "recommendation_action" &&
    (!dlForAgg.recommendationEligible || dlForAgg.recommendationIntensityCap === "RI0");
  /** When aggregate asks for recommendations but contracts forbid them, plan as action intent (truth slots + uncertainty), not unrelated Stage A labels. */
  const plannerIntent =
    skipSemanticAggregateForIneligibleRec &&
    /השבוע|בשבוע|שבוע\s*הקרוב|המלצות|להמשך|מה\s*ההמלצות/.test(utteranceStr)
      ? "what_to_do_this_week"
      : skipSemanticAggregateForIneligibleRec
        ? "what_to_do_today"
        : intent;
  if (aggregateQuestionClass !== "none" && !skipSemanticAggregateForIneligibleRec) {
    const aggDraft = buildSemanticAggregateDraft({
      questionClass: aggregateQuestionClass,
      utterance: utteranceStr,
      payload: input.payload,
      truthPacket,
    });
    if (aggDraft) {
      const vAgg = validateAnswerDraft(aggDraft, truthPacket, { intent: plannerIntent });
      if (vAgg.ok) {
        draft = aggDraft;
        semanticAggregateSatisfied = true;
      }
    }
  }

  if (!draft) {
    const plan = planConversation(plannerIntent, truthPacket, {
      continuityRepeat,
      turnOrdinal: priorIntents.length,
      scopeType: truthPacket.scopeType,
      interpretationScope: truthPacket.interpretationScope,
    });
    draft = composeAnswerDraft(plan, truthPacket, {
      intent: plannerIntent,
      continuityRepeat,
      conversationState: conv,
      turnOrdinal: priorIntents.length,
    });
  }

  draft = { ...draft, answerBlocks: normalizeAnswerBlocksHe(draft.answerBlocks) };
  let vDraft = validateAnswerDraft(draft, truthPacket, { intent: plannerIntent });
  let fallbackUsed = false;
  /** @type {string[]} */
  const fallbackReasonCodes = [];

  if (!vDraft.ok) {
    fallbackReasonCodes.push(...vDraft.failCodes);
    semanticAggregateSatisfied = false;
    draft = buildDeterministicFallbackAnswer(truthPacket, vDraft.failCodes);
    fallbackUsed = true;
    draft = { ...draft, answerBlocks: normalizeAnswerBlocksHe(draft.answerBlocks) };
    vDraft = validateAnswerDraft(draft, truthPacket, { intent: plannerIntent });
  }
  if (!vDraft.ok) {
    fallbackReasonCodes.push(...vDraft.failCodes);
    semanticAggregateSatisfied = false;
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
    draft = { ...draft, answerBlocks: normalizeAnswerBlocksHe(draft.answerBlocks) };
    vDraft = validateAnswerDraft(draft, truthPacket, { intent: plannerIntent });
  }

  const answerBlockTypes = draft.answerBlocks.map((b) => b.type);
  const answerBodyTextHe = draft.answerBlocks.map((b) => b.textHe).join(" ").trim();

  const follow = selectFollowUp({
    audience: "parent",
    intent: plannerIntent,
    scopeType: truthPacket.scopeType,
    scopeKey: `${truthPacket.scopeType}:${truthPacket.scopeId}`,
    scopeLabelHe: truthPacket.scopeLabel || "",
    answerBodyTextHe,
    answerBlockTypes,
    clickedFollowupFamilyThisTurn: input?.clickedFollowupFamily ? String(input.clickedFollowupFamily).trim() : null,
    omitFollowUpEntirely: aggregateQuestionClass !== "none" || (semanticAggregateSatisfied && vDraft.ok),
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
        textHe: normalizeParentFacingHe(follow.selected.textHe),
        reasonCode: follow.selected.reasonCode,
      }
    : null;

  /** @type {Array<"contractsV1.evidence"|"contractsV1.decision"|"contractsV1.readiness"|"contractsV1.confidence"|"contractsV1.recommendation"|"contractsV1.narrative">} */
  const contractSourcesUsed = ["contractsV1.narrative"];
  if (plannerIntent !== "explain_report") {
    contractSourcesUsed.push("contractsV1.decision", "contractsV1.readiness", "contractsV1.confidence");
  }
  if (draft.answerBlocks.some((b) => b.type === "next_step")) {
    contractSourcesUsed.push("contractsV1.recommendation");
  }
  if (plannerIntent === "explain_report") {
    contractSourcesUsed.push("contractsV1.evidence");
  }

  const validatorFailCodes = vDraft.ok ? [] : [...vDraft.failCodes];
  const validatorStatus = vDraft.ok ? "pass" : "fail";

  let response = buildResolvedParentCopilotResponse({
    truthPacket,
    intent: plannerIntent,
    answerBlocks: draft.answerBlocks,
    suggestedFollowUp,
    validatorStatus,
    validatorFailCodes,
    fallbackUsed,
    contractSourcesUsed: [...new Set(contractSourcesUsed)],
    priorRepeated,
    metadata: scopeMeta,
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

  const telemetry = buildTurnTelemetry({
    intent: plannerIntent,
    intentConfidence: scopeMeta.intentConfidence,
    intentReason: scopeMeta.intentReason,
    scopeConfidence: scopeMeta.scopeConfidence,
    scopeReason: scopeMeta.scopeReason,
    answerBlocks: draft.answerBlocks,
    fallbackUsed,
    fallbackReasonCodes,
    validatorFailCodes,
    semanticAggregateSatisfied,
    generationPath: "deterministic",
    truthPacket,
    resolutionStatus: "resolved",
    scopeType: truthPacket.scopeType,
    scopeId: truthPacket.scopeId,
  });
  response = { ...response, telemetry };

  const constraintParts = [vDraft.ok ? "turn:validator_pass" : "turn:validator_fail"];
  if (draft.answerBlocks.some((b) => b.type === "uncertainty_reason")) constraintParts.push("surface:uncertainty");
  if (draft.answerBlocks.some((b) => b.type === "caution")) constraintParts.push("surface:caution");

  const assistantAnswerSummary = draft.answerBlocks
    .map((b) => b.textHe)
    .join(" ")
    .trim()
    .slice(0, 480);

  applyConversationStateDelta(sessionId, {
    addedIntent: plannerIntent,
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

  return { response, audience, sessionId, conv, truthPacket, intent: plannerIntent, scopeMeta, utteranceStr, draft, validatorFailCodes };
}

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
  const core = runDeterministicCore(input);
  return finalizeTurnResponse(core.response, {
    audience: core.audience,
    sessionId: core.sessionId,
    truthPacket: core.truthPacket,
    intent: core.intent,
    utteranceLength: String(core.utteranceStr || "").trim().length,
    generationPath: "deterministic",
  });
}

/**
 * Async path with optional grounded LLM override and deterministic fallback.
 * Sync API stays available via `runParentCopilotTurn`.
 * @param {object} input
 */
export async function runParentCopilotTurnAsync(input) {
  const core = runDeterministicCore(input);
  const baseResponse = core.response;
  if (baseResponse?.resolutionStatus !== "resolved" || !core.truthPacket || !core.utteranceStr) {
    return finalizeTurnResponse(baseResponse, {
      audience: core.audience,
      sessionId: core.sessionId,
      truthPacket: core.truthPacket,
      intent: core.intent,
      utteranceLength: String(core.utteranceStr || "").trim().length,
      generationPath: "deterministic",
    });
  }

  const llmResult = await maybeGenerateGroundedLlmDraft({
    utterance: core.utteranceStr,
    truthPacket: core.truthPacket,
  });
  if (!llmResult.ok || !llmResult.draft) {
    return finalizeTurnResponse({
      ...baseResponse,
      telemetry: {
        ...(baseResponse.telemetry || {}),
        llmAttempt: {
          ok: false,
          reason: llmResult.reason || "llm_unavailable",
          ...(Array.isArray(llmResult.gateReasonCodes) ? { gateReasonCodes: llmResult.gateReasonCodes } : {}),
        },
      },
    }, {
      audience: core.audience,
      sessionId: core.sessionId,
      truthPacket: core.truthPacket,
      intent: core.intent,
      utteranceLength: String(core.utteranceStr || "").trim().length,
      generationPath: "deterministic",
      llmAttempt: { ok: false, reason: llmResult.reason || "llm_unavailable" },
    });
  }

  const llmDraft = {
    ...llmResult.draft,
    answerBlocks: normalizeAnswerBlocksHe(llmResult.draft.answerBlocks),
  };
  const vLlm = validateAnswerDraft(llmDraft, core.truthPacket, { intent: core.intent });
  if (!vLlm.ok) {
    return finalizeTurnResponse({
      ...baseResponse,
      telemetry: {
        ...(baseResponse.telemetry || {}),
        llmAttempt: { ok: false, reason: "llm_draft_validator_fail", failCodes: vLlm.failCodes },
      },
    }, {
      audience: core.audience,
      sessionId: core.sessionId,
      truthPacket: core.truthPacket,
      intent: core.intent,
      utteranceLength: String(core.utteranceStr || "").trim().length,
      generationPath: "deterministic",
      llmAttempt: { ok: false, reason: "llm_draft_validator_fail" },
    });
  }

  let llmResponse = buildResolvedParentCopilotResponse({
    truthPacket: core.truthPacket,
    intent: core.intent,
    answerBlocks: llmDraft.answerBlocks,
    suggestedFollowUp: baseResponse.suggestedFollowUp || null,
    validatorStatus: "pass",
    validatorFailCodes: [],
    fallbackUsed: false,
    contractSourcesUsed: baseResponse.contractSourcesUsed || ["contractsV1.narrative"],
    priorRepeated: Number(core?.conv?.repeatedPhraseHits || 0),
    metadata: core.scopeMeta,
  });
  const llmFinalCheck = validateParentCopilotResponseV1(llmResponse);
  if (!llmFinalCheck.ok) {
    return finalizeTurnResponse(baseResponse, {
      audience: core.audience,
      sessionId: core.sessionId,
      truthPacket: core.truthPacket,
      intent: core.intent,
      utteranceLength: String(core.utteranceStr || "").trim().length,
      generationPath: "deterministic",
      llmAttempt: { ok: false, reason: "llm_final_response_validator_fail" },
    });
  }

  llmResponse = {
    ...llmResponse,
    telemetry: buildTurnTelemetry({
      intent: core.intent,
      intentConfidence: Number(core.scopeMeta?.intentConfidence || 0),
      intentReason: String(core.scopeMeta?.intentReason || "unknown"),
      scopeConfidence: Number(core.scopeMeta?.scopeConfidence || 0),
      scopeReason: String(core.scopeMeta?.scopeReason || "unknown"),
      answerBlocks: llmDraft.answerBlocks,
      fallbackUsed: false,
      validatorFailCodes: [],
      semanticAggregateSatisfied: false,
      generationPath: "llm_grounded",
      truthPacket: core.truthPacket,
      resolutionStatus: "resolved",
      scopeType: core.truthPacket.scopeType,
      scopeId: core.truthPacket.scopeId,
      llmAttempt: { ok: true, reason: "llm_draft_accepted" },
    }),
  };
  llmResponse.telemetry.llmAttempt = { ok: true, provider: llmResult.provider || "unknown" };
  return finalizeTurnResponse(llmResponse, {
    audience: core.audience,
    sessionId: core.sessionId,
    truthPacket: core.truthPacket,
    intent: core.intent,
    utteranceLength: String(core.utteranceStr || "").trim().length,
    generationPath: "llm_grounded",
    llmAttempt: { ok: true, reason: "llm_draft_accepted" },
  });
}

export { buildTruthPacketV1 } from "./truth-packet-v1.js";
export { readContractsSliceForScope } from "./contract-reader.js";

export default { runParentCopilotTurn, runParentCopilotTurnAsync };
