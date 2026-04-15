/**
 * Renders ParentCopilotResponseV1 from validated pipeline outputs.
 */

/**
 * @param {NonNullable<ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>>} truthPacket
 * @param {boolean} answerValidatorOk
 */
/**
 * advance_or_hold: enabled only when decision/readiness/confidence contracts allow a real fork (not always-on).
 * @param {object} truthPacket
 */
function gateAdvanceOrHoldFromContracts(truthPacket) {
  const dl = truthPacket?.derivedLimits || {};
  const d = truthPacket?.contracts?.decision && typeof truthPacket.contracts.decision === "object" ? truthPacket.contracts.decision : {};
  const tier = Number(d.decisionTier) || 0;
  if (dl.cannotConcludeYet === true) return false;
  if (tier < 2) return false;
  const r = String(dl.readiness || "");
  if (r === "insufficient") return false;
  const c = String(dl.confidenceBand || "");
  if (c === "low") return false;
  return tier >= 2;
}

export function buildQuickActions(truthPacket, answerValidatorOk) {
  const dl = truthPacket?.derivedLimits || {};
  const recOk = !!dl.recommendationEligible && dl.recommendationIntensityCap !== "RI0";
  const readiness = String(dl.readiness || "");
  const conf = String(dl.confidenceBand || "");

  /**
   * @param {object} def
   * @param {string} def.id
   * @param {string} def.labelHe
   * @param {string} def.sourceContract
   * @param {() => boolean} def.contractGate
   * @param {(contractOk: boolean, vOk: boolean) => string} def.disabledReason
   */
  function qa(def) {
    const contractOk = def.contractGate();
    const validatorCompatible = answerValidatorOk && contractOk;
    const enabled = validatorCompatible;
    const base = {
      id: def.id,
      labelHe: def.labelHe,
      enabled,
      sourceContract: def.sourceContract,
      validatorCompatible,
    };
    if (!enabled) {
      return { ...base, disabledReasonCode: def.disabledReason(contractOk, answerValidatorOk) };
    }
    return base;
  }

  return [
    qa({
      id: "qa_action_today",
      labelHe: "צעד קטן היום",
      sourceContract: "contractsV1.recommendation",
      contractGate: () => recOk,
      disabledReason: (cOk, vOk) => (!vOk ? "validator_blocked" : !cOk ? "ineligible_recommendation" : "cap_blocked"),
    }),
    qa({
      id: "qa_action_week",
      labelHe: "תוכנית לשבוע",
      sourceContract: "contractsV1.recommendation",
      contractGate: () => recOk,
      disabledReason: (cOk, vOk) => (!vOk ? "validator_blocked" : !cOk ? "ineligible_recommendation" : "cap_blocked"),
    }),
    qa({
      id: "qa_avoid_now",
      labelHe: "מה להימנע ממנו עכשיו",
      sourceContract: "contractsV1.readiness",
      contractGate: () =>
        readiness === "insufficient" || readiness === "forming" || readiness === "emerging",
      disabledReason: (cOk, vOk) => (!vOk ? "validator_blocked" : !cOk ? "readiness_blocked" : "readiness_blocked"),
    }),
    qa({
      id: "qa_advance_or_hold",
      labelHe: "להתקדם או להמתין",
      sourceContract: "contractsV1.decision",
      contractGate: () => gateAdvanceOrHoldFromContracts(truthPacket),
      disabledReason: (cOk, vOk) => (!vOk ? "validator_blocked" : !cOk ? "readiness_blocked" : "confidence_blocked"),
    }),
    qa({
      id: "qa_explain_to_child",
      labelHe: "ניסוח לילד",
      sourceContract: "contractsV1.narrative",
      contractGate: () => !!truthPacket?.contracts?.narrative,
      disabledReason: (cOk, vOk) => (!vOk ? "validator_blocked" : !cOk ? "scope_not_applicable" : "scope_not_applicable"),
    }),
    qa({
      id: "qa_ask_teacher",
      labelHe: "שאלה למורה",
      sourceContract: "contractsV1.confidence",
      contractGate: () => conf === "low" || conf === "medium",
      disabledReason: (cOk, vOk) => (!vOk ? "validator_blocked" : !cOk ? "confidence_blocked" : "confidence_blocked"),
    }),
  ];
}

/**
 * @param {object} parts
 */
export function buildResolvedParentCopilotResponse(parts) {
  const {
    truthPacket,
    intent,
    answerBlocks,
    suggestedFollowUp,
    validatorStatus,
    validatorFailCodes,
    fallbackUsed,
    contractSourcesUsed,
    priorRepeated,
    metadata,
  } = parts;

  const answerValidatorOk = validatorStatus === "pass";

  return {
    schemaVersion: "v1",
    audience: "parent",
    resolutionStatus: "resolved",
    scopeType: truthPacket.scopeType,
    scopeId: truthPacket.scopeId,
    scopeLabel: truthPacket.scopeLabel,
    intent,
    answerBlocks,
    suggestedFollowUp,
    quickActions: buildQuickActions(truthPacket, answerValidatorOk),
    validatorStatus,
    validatorFailCodes,
    fallbackUsed,
    contractSourcesUsed,
    conversationStateDelta: {
      addedIntent: intent,
      addedScope: `${truthPacket.scopeType}:${truthPacket.scopeId}`,
      ...(suggestedFollowUp ? { addedFollowUpFamily: suggestedFollowUp.family } : {}),
      repeatedPhraseHits: priorRepeated || 0,
    },
    metadata: metadata && typeof metadata === "object" ? metadata : undefined,
  };
}

/**
 * @param {object} parts
 */
export function buildClarificationParentCopilotResponse(parts) {
  const { clarificationQuestionHe, intent, priorRepeated, metadata } = parts;
  return {
    schemaVersion: "v1",
    audience: "parent",
    resolutionStatus: "clarification_required",
    clarificationQuestionHe,
    intent,
    answerBlocks: [],
    suggestedFollowUp: null,
    quickActions: [],
    validatorStatus: "pass",
    validatorFailCodes: [],
    fallbackUsed: false,
    contractSourcesUsed: [],
    conversationStateDelta: {
      addedIntent: intent,
      addedScope: "",
      repeatedPhraseHits: priorRepeated || 0,
    },
    metadata: metadata && typeof metadata === "object" ? metadata : undefined,
  };
}

export default { buildQuickActions, buildResolvedParentCopilotResponse, buildClarificationParentCopilotResponse };
