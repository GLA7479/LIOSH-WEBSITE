/**
 * Validates draft answers and final ParentCopilotResponseV1-shaped payloads.
 */

/** Filler-only closings (avoid substrings that appear inside approved narrative contract slots). */
const FILLER_BLACKLIST = ["נמשיך ונראה", "הכול תלוי בהמשך", "נראה בסדר באופן כללי"];

/**
 * @param {{ answerBlocks: Array<{ type: string; textHe: string; source: string }> }} draft
 * @param {NonNullable<ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>>} truthPacket
 */
export function validateAnswerDraft(draft, truthPacket) {
  /** @type {string[]} */
  const failCodes = [];
  const blocks = Array.isArray(draft?.answerBlocks) ? draft.answerBlocks : [];
  if (blocks.length < 2) failCodes.push("answer_too_short");

  const hasObs = blocks.some((b) => b.type === "observation");
  const hasMean = blocks.some((b) => b.type === "meaning");
  if (!hasObs && !hasMean) failCodes.push("missing_observation_or_meaning");

  const joined = blocks.map((b) => String(b.textHe || "")).join(" ");
  const nar = truthPacket?.contracts?.narrative;
  const slotText = [
    String(nar?.textSlots?.observation || ""),
    String(nar?.textSlots?.interpretation || ""),
    String(nar?.textSlots?.action || ""),
    String(nar?.textSlots?.uncertainty || ""),
  ].join(" ");

  for (const ph of truthPacket?.allowedClaimEnvelope?.forbiddenPhrases || []) {
    if (ph && joined.includes(String(ph))) failCodes.push("forbidden_phrase_contract");
  }
  for (const ph of FILLER_BLACKLIST) {
    if (joined.includes(ph)) failCodes.push("filler_blacklist");
  }
  const slotBundle = String(slotText + joined);
  for (const hedge of truthPacket?.allowedClaimEnvelope?.requiredHedges || []) {
    if (hedge && !slotBundle.includes(String(hedge))) failCodes.push("missing_required_hedge");
  }

  const hasNext = blocks.some((b) => b.type === "next_step");
  const dl = truthPacket?.derivedLimits || {};
  if (hasNext && (!dl.recommendationEligible || dl.recommendationIntensityCap === "RI0")) {
    failCodes.push("next_step_not_eligible");
  }

  for (const b of blocks) {
    if (b.source === "contract_slot" && String(b.textHe || "").trim()) {
      const t = String(b.textHe).trim();
      if (!slotText.includes(t) && b.type !== "observation") {
        failCodes.push("contract_slot_mismatch");
        break;
      }
    }
  }

  return {
    ok: failCodes.length === 0,
    failCodes,
    specificityScore: failCodes.length === 0 ? 80 : 40,
  };
}

/**
 * @param {object} response
 */
export function validateParentCopilotResponseV1(response) {
  /** @type {string[]} */
  const hardFails = [];
  const softFails = [];

  if (!response || typeof response !== "object") return { ok: false, hardFails: ["empty_response"] };

  if (response.schemaVersion !== "v1") hardFails.push("schema_version");
  if (response.audience !== "parent") hardFails.push("audience_lock");

  const rs = response.resolutionStatus;
  if (rs === "clarification_required") {
    if (!String(response.clarificationQuestionHe || "").trim()) hardFails.push("clarification_missing");
    if (response.answerBlocks?.length) hardFails.push("clarification_answer_blocks_non_empty");
    if (response.contractSourcesUsed?.length) hardFails.push("clarification_contract_sources_non_empty");
    if (response.suggestedFollowUp != null) hardFails.push("clarification_followup_non_null");
    if (response.quickActions?.length) hardFails.push("clarification_quick_actions_non_empty");
    if (response.fallbackUsed === true) hardFails.push("clarification_fallback_true");
  } else if (rs === "resolved") {
    if (!response.scopeType) hardFails.push("resolved_scope_type");
    if (!String(response.scopeId || "").trim()) hardFails.push("resolved_scope_id");
    if (!String(response.scopeLabel || "").trim()) hardFails.push("resolved_scope_label");
    const ab = Array.isArray(response.answerBlocks) ? response.answerBlocks : [];
    if (ab.length < 2) hardFails.push("resolved_answer_len");
    const hasObs = ab.some((b) => b.type === "observation");
    const hasMean = ab.some((b) => b.type === "meaning");
    if (!hasObs && !hasMean) hardFails.push("resolved_obs_meaning");
    const csu = Array.isArray(response.contractSourcesUsed) ? response.contractSourcesUsed : [];
    if (!csu.includes("contractsV1.narrative")) hardFails.push("resolved_missing_narrative_source");
    if (response.fallbackUsed === true) {
      for (const b of ab) {
        if (b.source !== "contract_slot") hardFails.push("fallback_non_slot_source");
      }
    }
    for (const qa of response.quickActions || []) {
      if (qa.enabled === true && qa.validatorCompatible !== true) hardFails.push("quick_action_enabled_incompatible");
      if (!qa.sourceContract) hardFails.push("quick_action_missing_source");
    }
  } else {
    hardFails.push("resolution_status");
  }

  const vf = Array.isArray(response.validatorFailCodes) ? response.validatorFailCodes : [];
  if (response.validatorStatus === "pass" && vf.length) hardFails.push("pass_with_fail_codes");

  const ok = hardFails.length === 0;
  return { ok, hardFails, softFails };
}
