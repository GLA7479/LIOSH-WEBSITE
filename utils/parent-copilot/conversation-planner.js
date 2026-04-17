/**
 * Plans allowed answer blocks from canonical parent intent + TruthPacketV1 (contract-bound only).
 * @param {string} intent canonical intent (stage-a-freeform-interpretation.js)
 * @param {ReturnType<typeof import("./truth-packet-v1.js").buildTruthPacketV1>} truthPacket
 * @param {null|{
 *   continuityRepeat?: boolean;
 *   turnOrdinal?: number;
 *   scopeType?: string;
 *   interpretationScope?: string;
 * }} [hints]
 */
export function planConversation(intent, truthPacket, hints = null) {
  const limits = truthPacket?.derivedLimits || {};
  const eligible = !!limits.recommendationEligible;
  const cap = String(limits.recommendationIntensityCap || "RI0");
  const interpretationScope = String(
    truthPacket?.interpretationScope || hints?.interpretationScope || "executive",
  ).trim();
  const strengthFramingOk =
    interpretationScope === "strengths" &&
    !limits.cannotConcludeYet &&
    limits.readiness !== "insufficient" &&
    limits.confidenceBand !== "low";
  const continuityRepeat = !!(hints && hints.continuityRepeat);
  const turnOrdinal = Number(hints?.turnOrdinal) || 0;
  const rot = turnOrdinal % 3;

  /** @type {Array<"observation"|"meaning"|"next_step"|"caution"|"uncertainty_reason">} */
  const blocks = [];

  const probeHeavy = () => {
    if (continuityRepeat) blocks.push("uncertainty_reason", "meaning");
    else if (rot === 1) blocks.push("meaning", "uncertainty_reason", "observation");
    else if (rot === 2) blocks.push("observation", "meaning", "uncertainty_reason");
    else blocks.push("observation", "uncertainty_reason", "meaning");
  };

  const obsMean = () => {
    if (continuityRepeat) blocks.push("meaning", "observation");
    else blocks.push("observation", "meaning");
  };

  const obsMeanCaut = () => {
    if (continuityRepeat) blocks.push("meaning", "observation", "caution");
    else if (rot === 1) blocks.push("observation", "caution", "meaning");
    else if (rot === 2) blocks.push("meaning", "observation", "caution");
    else blocks.push("observation", "meaning", "caution");
  };

  const actionOrProbe = () => {
    if (eligible && cap !== "RI0") {
      if (continuityRepeat || rot % 2 === 1) blocks.push("caution", "next_step");
      else blocks.push("next_step", "caution");
    } else if (continuityRepeat || rot % 2 === 1) blocks.push("uncertainty_reason", "meaning");
    else blocks.push("meaning", "uncertainty_reason");
  };

  /** Action intents without recommendation framing → contract slots + uncertainty only (no next_step in plan). */
  const actionIntentWithoutRecScope = () => {
    if (continuityRepeat || rot % 2 === 1) blocks.push("meaning", "uncertainty_reason", "observation");
    else blocks.push("observation", "meaning", "uncertainty_reason");
  };

  switch (intent) {
    case "clinical_boundary":
      if (continuityRepeat) blocks.push("uncertainty_reason", "observation");
      else blocks.push("observation", "uncertainty_reason", "caution");
      break;
    case "explain_report":
    case "clarify_term":
      obsMeanCaut();
      break;
    case "what_is_most_important":
      if (continuityRepeat) blocks.push("meaning", "caution", "observation");
      else blocks.push("observation", "meaning", "caution");
      break;
    case "what_to_do_today":
    case "what_to_do_this_week":
      if (interpretationScope === "recommendation") actionOrProbe();
      else actionIntentWithoutRecScope();
      break;
    case "why_not_advance":
      if (interpretationScope === "blocked_advance") {
        if (continuityRepeat || rot % 2 === 1) blocks.push("uncertainty_reason", "meaning", "observation");
        else blocks.push("uncertainty_reason", "observation", "meaning");
      } else if (continuityRepeat || rot % 2 === 1) blocks.push("uncertainty_reason", "meaning");
      else blocks.push("meaning", "uncertainty_reason");
      break;
    case "what_is_going_well":
      if (strengthFramingOk) obsMeanCaut();
      else probeHeavy();
      break;
    case "strength_vs_weakness_summary":
      if (interpretationScope === "strengths") {
        if (strengthFramingOk) obsMeanCaut();
        else probeHeavy();
      } else if (interpretationScope === "weaknesses") {
        if (continuityRepeat || rot % 2 === 1) blocks.push("caution", "meaning", "observation");
        else blocks.push("observation", "meaning", "caution");
      } else {
        obsMeanCaut();
      }
      break;
    case "what_is_still_difficult":
      if (continuityRepeat || rot % 2 === 1) blocks.push("caution", "meaning", "observation");
      else blocks.push("observation", "meaning", "caution");
      break;
    case "what_not_to_do_now":
      if (continuityRepeat || rot % 2 === 1) blocks.push("uncertainty_reason", "caution", "observation");
      else blocks.push("observation", "uncertainty_reason", "caution");
      break;
    case "how_to_tell_child":
      obsMean();
      break;
    case "question_for_teacher":
      if (interpretationScope === "confidence_uncertainty") {
        if (continuityRepeat || rot % 2 === 1) blocks.push("uncertainty_reason", "meaning", "observation");
        else blocks.push("uncertainty_reason", "meaning");
      } else if (continuityRepeat || rot % 2 === 1) blocks.push("uncertainty_reason", "meaning");
      else blocks.push("meaning", "uncertainty_reason");
      break;
    case "is_intervention_needed":
      if (interpretationScope === "confidence_uncertainty") {
        if (continuityRepeat || rot % 2 === 1) blocks.push("uncertainty_reason", "meaning");
        else blocks.push("uncertainty_reason", "meaning", "observation");
      } else if (continuityRepeat || rot % 2 === 1) blocks.push("meaning", "uncertainty_reason");
      else blocks.push("uncertainty_reason", "meaning");
      break;
    case "unclear":
    default:
      probeHeavy();
      break;
  }

  if (!blocks.length) probeHeavy();

  return {
    intent,
    blockPlan: blocks,
    requireAnchor: true,
  };
}
