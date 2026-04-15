/**
 * Phase 3 (approved scope): RecommendationContract only.
 * Additive, deterministic contract used to enforce eligibility/intensity/anchors.
 */

export const RECOMMENDATION_CONTRACT_VERSION = "v1";

export const RECOMMENDATION_INTENSITY = Object.freeze(["RI0", "RI1", "RI2", "RI3"]);
export const RECOMMENDATION_FAMILIES = Object.freeze([
  "general_practice",
  "accuracy_focus",
  "speed_accuracy_balance",
  "recurrence_break",
  "independence_build",
  "retention_consolidation",
]);

const INT_RANK = { RI0: 0, RI1: 1, RI2: 2, RI3: 3 };
const INT_FROM_TEXT = { light: "RI1", focused: "RI2", targeted: "RI3" };
const TEXT_FROM_INT = { RI0: "light", RI1: "light", RI2: "focused", RI3: "targeted" };

function normalizeTopicKey(v) {
  const s = String(v ?? "").trim();
  return s || "__unknown_topic__";
}

function normalizeSubjectId(v) {
  const s = String(v ?? "").trim();
  return s || "__unknown_subject__";
}

function toIntensityRank(v) {
  const n = INT_RANK[String(v || "")];
  return Number.isFinite(n) ? n : 0;
}

function capIntensityByContracts(inputIntensity, ctx) {
  const decisionTier = Number(ctx?.decisionTier) || 0;
  const readiness = String(ctx?.readiness || "insufficient");
  const confidenceBand = String(ctx?.confidenceBand || "low");
  const cannotConcludeYet = !!ctx?.cannotConcludeYet;
  const hasAnchors = Array.isArray(ctx?.anchorEvidenceIds) && ctx.anchorEvidenceIds.length > 0;

  let cap = 1;
  if (cannotConcludeYet) cap = 0;
  else if (decisionTier >= 3 && confidenceBand !== "low" && readiness === "ready" && !cannotConcludeYet) cap = 3;
  else if (decisionTier >= 2 && readiness !== "insufficient" && !cannotConcludeYet) cap = 2;
  else cap = 1;

  if (!hasAnchors) cap = 0;
  const baseRank = toIntensityRank(inputIntensity);
  const finalRank = Math.max(0, Math.min(baseRank, cap));
  if (finalRank <= 0) return "RI0";
  if (finalRank === 1) return "RI1";
  if (finalRank === 2) return "RI2";
  return "RI3";
}

function deriveFamily(input) {
  const diagnosticType = String(input?.diagnosticType || "");
  const rootCause = String(input?.rootCause || "");
  const retentionRisk = String(input?.retentionRisk || "");
  const evidenceStrength = String(input?.evidenceStrength || "low");

  if (diagnosticType === "speed_pressure" || rootCause === "speed_pressure") return "speed_accuracy_balance";
  if (diagnosticType === "careless_pattern" || diagnosticType === "fragile_success") return "recurrence_break";
  if (rootCause === "weak_independence" || rootCause === "instruction_friction") return "independence_build";
  if (retentionRisk === "high" || retentionRisk === "moderate") return "retention_consolidation";
  if (diagnosticType === "knowledge_gap" || evidenceStrength === "low") return "accuracy_focus";
  return "general_practice";
}

/**
 * @param {object} input
 */
export function buildRecommendationContractV1(input) {
  const topicKey = normalizeTopicKey(input?.topicKey);
  const subjectId = normalizeSubjectId(input?.subjectId);
  const q = Math.max(0, Number(input?.q ?? input?.questions) || 0);
  const acc = Math.max(0, Math.min(100, Number(input?.accuracy) || 0));
  const anchorEvidenceIds = Array.isArray(input?.anchorEvidenceIds)
    ? input.anchorEvidenceIds.map((x) => String(x)).filter(Boolean)
    : [];
  if (anchorEvidenceIds.length === 0 && q > 0) {
    anchorEvidenceIds.push(`evidence:${subjectId}:${topicKey}:q:${q}:acc:${Math.round(acc)}`);
  }

  const decisionTier = Number(input?.decisionTier) || 0;
  const readiness = String(input?.readiness || "insufficient");
  const confidenceBand = String(input?.confidenceBand || "low");
  const cannotConcludeYet = !!input?.cannotConcludeYet;

  const requestedIntensity = INT_FROM_TEXT[String(input?.interventionIntensity || "").toLowerCase()] || "RI1";
  const intensity = capIntensityByContracts(requestedIntensity, {
    decisionTier,
    readiness,
    confidenceBand,
    cannotConcludeYet,
    anchorEvidenceIds,
  });

  const eligible = intensity !== "RI0" && anchorEvidenceIds.length > 0;
  const family = eligible ? deriveFamily(input) : null;

  /** @type {string[]} */
  const forbiddenBecause = [];
  if (anchorEvidenceIds.length === 0) forbiddenBecause.push("missing_anchor_evidence");
  if (cannotConcludeYet) forbiddenBecause.push("cannot_conclude_yet");
  if (decisionTier < 2) forbiddenBecause.push("decision_tier_too_low");
  if (readiness === "insufficient") forbiddenBecause.push("readiness_insufficient");
  if (confidenceBand === "low") forbiddenBecause.push("confidence_low");

  return {
    contractVersion: RECOMMENDATION_CONTRACT_VERSION,
    topicKey,
    subjectId,
    eligible,
    intensity,
    family,
    anchorEvidenceIds,
    rationaleCodes: [
      `decision_tier:${decisionTier}`,
      `readiness:${readiness}`,
      `confidence:${confidenceBand}`,
    ],
    forbiddenBecause: eligible ? [] : forbiddenBecause,
  };
}

/**
 * @param {unknown} contract
 */
export function validateRecommendationContractV1(contract) {
  const c = contract && typeof contract === "object" ? contract : {};
  const errors = [];

  if (c.contractVersion !== RECOMMENDATION_CONTRACT_VERSION) errors.push("contractVersion must be v1");
  if (!String(c.topicKey || "").trim()) errors.push("topicKey is required");
  if (!String(c.subjectId || "").trim()) errors.push("subjectId is required");
  if (!RECOMMENDATION_INTENSITY.includes(String(c.intensity || ""))) errors.push("intensity invalid");
  if (!(c.family === null || RECOMMENDATION_FAMILIES.includes(String(c.family)))) {
    errors.push("family invalid");
  }
  if (!Array.isArray(c.anchorEvidenceIds)) errors.push("anchorEvidenceIds must be array");
  if (!Array.isArray(c.rationaleCodes)) errors.push("rationaleCodes must be array");
  if (!Array.isArray(c.forbiddenBecause)) errors.push("forbiddenBecause must be array");
  if (c.eligible === true && (!Array.isArray(c.anchorEvidenceIds) || c.anchorEvidenceIds.length === 0)) {
    errors.push("eligible recommendation requires anchorEvidenceIds");
  }
  if (c.eligible === true && c.family == null) {
    errors.push("eligible recommendation requires family");
  }
  if (c.eligible === false && c.intensity !== "RI0") {
    errors.push("ineligible recommendation must be RI0");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * @param {object} rec
 * @param {object} contract
 * @param {{ ok: boolean, errors: string[] }} [validation]
 */
export function applyRecommendationContractToRecord(rec, contract, validation = null) {
  const c = contract || {};
  const nextTextIntensity = TEXT_FROM_INT[String(c.intensity || "RI0")] || "light";
  const v =
    validation && typeof validation === "object"
      ? { ok: !!validation.ok, errors: Array.isArray(validation.errors) ? validation.errors : [] }
      : { ok: true, errors: [] };
  const existingContracts =
    rec?.contractsV1 && typeof rec.contractsV1 === "object" ? rec.contractsV1 : {};
  return {
    ...rec,
    interventionIntensity: nextTextIntensity,
    contractsV1: {
      ...existingContracts,
      recommendation: c,
      recommendationValidation: v,
    },
    // Backward compatibility mirror only (temporary).
    recommendationContractV1: c,
    recommendedInterventionType: c.eligible ? rec?.recommendedInterventionType ?? null : null,
    recommendedEvidenceAction: c.eligible ? rec?.recommendedEvidenceAction ?? null : "collect_more_evidence",
  };
}
