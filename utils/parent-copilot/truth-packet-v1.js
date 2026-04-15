/**
 * Canonical owner: TruthPacketV1 builder. Downstream modules consume this object only.
 */

import { readContractsSliceForScope, subjectLabelHe } from "./contract-reader.js";

/**
 * @param {unknown} readinessRaw
 * @returns {"insufficient"|"forming"|"ready"|"emerging"}
 */
function mapReadinessForTruthPacket(readinessRaw) {
  const x = String(readinessRaw || "")
    .trim()
    .toLowerCase();
  if (x === "ready") return "ready";
  if (x === "emerging") return "emerging";
  if (x === "unstable") return "forming";
  if (x === "forming" || x === "partial" || x === "moderate") return "forming";
  return "insufficient";
}

/**
 * @param {unknown} band
 * @returns {"low"|"medium"|"high"}
 */
function mapConfidenceBand(band) {
  const c = String(band || "")
    .trim()
    .toLowerCase();
  if (c === "high") return "high";
  if (c === "medium" || c === "moderate") return "medium";
  return "low";
}

/**
 * @param {unknown} narrative
 * @returns {keyof import("../contracts/narrative-contract-v1.js") extends never ? string : "WE0"|"WE1"|"WE2"|"WE3"|"WE4"}
 */
function wordingEnvelopeFromNarrative(narrative) {
  const w = String(narrative?.wordingEnvelope || "WE0").trim();
  if (["WE0", "WE1", "WE2", "WE3", "WE4"].includes(w)) return /** @type {const} */ (w);
  return "WE0";
}

/**
 * @param {unknown} payload
 * @param {{ scopeType: "topic"|"subject"|"executive"; scopeId: string; scopeLabel: string }} scope
 * @returns {object|null}
 */
export function buildTruthPacketV1(payload, scope) {
  const slice = readContractsSliceForScope(scope.scopeType, scope.scopeId, "", payload);
  if (!slice) return null;

  const { contracts, topicRow, subjectId } = slice;
  const narrative = contracts.narrative && typeof contracts.narrative === "object" ? contracts.narrative : {};
  const decision = contracts.decision && typeof contracts.decision === "object" ? contracts.decision : {};
  const readinessC = contracts.readiness && typeof contracts.readiness === "object" ? contracts.readiness : {};
  const confidenceC = contracts.confidence && typeof contracts.confidence === "object" ? contracts.confidence : {};
  const recommendation =
    contracts.recommendation && typeof contracts.recommendation === "object" ? contracts.recommendation : {};

  const cannotConcludeYet = decision.cannotConcludeYet === true;

  const recommendationEligible = recommendation.eligible === true;
  const capFromNarrative = String(narrative.recommendationIntensityCap || "RI0").toUpperCase();
  const recommendationIntensityCap =
    capFromNarrative === "RI1" || capFromNarrative === "RI2" || capFromNarrative === "RI3"
      ? capFromNarrative
      : "RI0";

  const readiness = mapReadinessForTruthPacket(readinessC.readiness);
  const confidenceBand = mapConfidenceBand(confidenceC.confidenceBand);

  const q = Math.max(0, Number(topicRow?.questions ?? topicRow?.q) || 0);
  const acc = Math.max(0, Math.min(100, Math.round(Number(topicRow?.accuracy) || 0)));
  const displayName = String(topicRow?.displayName || narrative?.topicKey || "הנושא").trim() || "הנושא";

  const es = payload?.executiveSummary && typeof payload.executiveSummary === "object" ? payload.executiveSummary : {};
  const trendLines = Array.isArray(es.majorTrendsHe) ? es.majorTrendsHe.map((x) => String(x || "").trim()).filter(Boolean) : [];
  const obsLine = String(narrative?.textSlots?.observation || "").trim();
  const relevantSummaryLines =
    scope.scopeType === "executive"
      ? (trendLines.length ? trendLines.slice(0, 4) : obsLine ? [obsLine] : [displayName])
      : obsLine
        ? [obsLine]
        : [displayName];

  const wordingEnvelope = wordingEnvelopeFromNarrative(narrative);
  const allowedSections = Array.isArray(narrative.allowedSections)
    ? narrative.allowedSections.filter((s) => ["summary", "finding", "recommendation", "limitations"].includes(String(s)))
    : ["summary", "finding", "recommendation", "limitations"];
  const forbiddenPhrases = Array.isArray(narrative.forbiddenPhrases) ? [...narrative.forbiddenPhrases] : [];
  const requiredHedges = Array.isArray(narrative.requiredHedges) ? [...narrative.requiredHedges] : [];

  /** @type {Array<"action_today"|"action_week"|"avoid_now"|"advance_or_hold"|"explain_to_child"|"ask_teacher"|"uncertainty_boundary">} */
  const allowedFollowupFamilies = [];
  if (cannotConcludeYet || confidenceBand === "low" || readiness === "insufficient") {
    allowedFollowupFamilies.push("uncertainty_boundary", "explain_to_child", "ask_teacher");
  }
  if (recommendationEligible && recommendationIntensityCap !== "RI0") {
    allowedFollowupFamilies.push("action_today", "action_week");
  }
  if (readiness === "forming" || readiness === "emerging" || readiness === "insufficient") {
    allowedFollowupFamilies.push("avoid_now");
  }
  allowedFollowupFamilies.push("advance_or_hold");
  const uniq = [...new Set(allowedFollowupFamilies)];

  return {
    schemaVersion: "v1",
    audience: "parent",
    scopeType: scope.scopeType,
    scopeId: scope.scopeId,
    scopeLabel: scope.scopeLabel,
    contracts,
    derivedLimits: {
      cannotConcludeYet,
      recommendationEligible,
      recommendationIntensityCap:
        recommendationIntensityCap === "RI0" ||
        recommendationIntensityCap === "RI1" ||
        recommendationIntensityCap === "RI2" ||
        recommendationIntensityCap === "RI3"
          ? recommendationIntensityCap
          : "RI0",
      readiness,
      confidenceBand,
    },
    surfaceFacts: {
      questions: q,
      accuracy: acc,
      displayName,
      subjectLabelHe: subjectLabelHe(subjectId),
      relevantSummaryLines: relevantSummaryLines.length ? relevantSummaryLines : [displayName],
    },
    allowedClaimEnvelope: {
      wordingEnvelope,
      allowedSections,
      forbiddenPhrases,
      requiredHedges,
    },
    allowedFollowupFamilies: uniq,
    forbiddenMoves: ["teacher_runtime", "non_contract_metrics", "cross_session_inference", "autonomous_planning"],
  };
}
