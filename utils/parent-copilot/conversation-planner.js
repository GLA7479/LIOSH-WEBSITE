/**
 * Plans allowed answer blocks from intent + TruthPacketV1 (no independent truth).
 * Phase B: optional continuity hints rotate block order on repeated intent (same contract slots).
 * @param {string} intent
 * @param {ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>} truthPacket
 * @param {null|{ continuityRepeat?: boolean }} [hints]
 */
export function planConversation(intent, truthPacket, hints = null) {
  const limits = truthPacket?.derivedLimits || {};
  const eligible = !!limits.recommendationEligible;
  const cap = String(limits.recommendationIntensityCap || "RI0");
  const continuityRepeat = !!(hints && hints.continuityRepeat);

  /** @type {Array<"observation"|"meaning"|"next_step"|"caution"|"uncertainty_reason">} */
  const blocks = [];

  if (intent === "understand_observation") {
    if (continuityRepeat) blocks.push("meaning", "observation");
    else blocks.push("observation", "meaning");
  } else if (intent === "understand_meaning") {
    if (continuityRepeat) blocks.push("meaning", "observation", "caution");
    else blocks.push("observation", "meaning", "caution");
  } else if (intent === "action_today" || intent === "action_tomorrow" || intent === "action_week") {
    if (eligible && cap !== "RI0") {
      if (continuityRepeat) blocks.push("caution", "next_step");
      else blocks.push("next_step", "caution");
    } else if (continuityRepeat) blocks.push("uncertainty_reason", "meaning");
    else blocks.push("meaning", "uncertainty_reason");
  } else if (intent === "avoid_now") {
    if (continuityRepeat) blocks.push("uncertainty_reason", "caution");
    else blocks.push("caution", "uncertainty_reason");
  } else if (intent === "advance_or_hold") {
    if (continuityRepeat) blocks.push("uncertainty_reason", "meaning");
    else blocks.push("meaning", "uncertainty_reason");
  } else if (intent === "explain_to_child") {
    if (continuityRepeat) blocks.push("meaning", "observation");
    else blocks.push("observation", "meaning");
  } else if (intent === "ask_teacher") {
    if (continuityRepeat) blocks.push("uncertainty_reason", "meaning");
    else blocks.push("meaning", "uncertainty_reason");
  } else {
    if (continuityRepeat) blocks.push("meaning", "observation", "uncertainty_reason");
    else blocks.push("observation", "meaning", "uncertainty_reason");
  }

  return {
    intent,
    blockPlan: blocks,
    requireAnchor: true,
  };
}
