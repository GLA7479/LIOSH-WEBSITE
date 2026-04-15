/**
 * Phase 3 selftest for RecommendationContract v1 (no Jest).
 * Run: npx tsx scripts/recommendation-contract-v1-selftest.mjs
 */
import assert from "node:assert/strict";

async function importUtils(path) {
  const mod = await import(path);
  return mod.default && typeof mod.default === "object" ? mod.default : mod;
}

const {
  buildRecommendationContractV1,
  validateRecommendationContractV1,
  applyRecommendationContractToRecord,
} = await importUtils("../utils/contracts/recommendation-contract-v1.js");

const { applyGateToTextClampToTopicRecord } = await importUtils(
  "../utils/minimal-safe-scope-enforcement.js"
);

const rich = buildRecommendationContractV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  decisionTier: 4,
  readiness: "ready",
  confidenceBand: "high",
  cannotConcludeYet: false,
  interventionIntensity: "targeted",
  diagnosticType: "knowledge_gap",
  rootCause: "knowledge_gap",
  retentionRisk: "low",
  evidenceStrength: "strong",
  anchorEvidenceIds: ["row:math:addition:q:20:acc:95"],
});
assert.equal(rich.eligible, true);
assert.equal(rich.intensity, "RI3");
assert.ok(rich.family);
assert.equal(validateRecommendationContractV1(rich).ok, true);

const missingAnchors = buildRecommendationContractV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  q: 18,
  accuracy: 88,
  decisionTier: 4,
  readiness: "ready",
  confidenceBand: "high",
  cannotConcludeYet: false,
  interventionIntensity: "targeted",
  diagnosticType: "knowledge_gap",
  rootCause: "knowledge_gap",
  retentionRisk: "low",
  evidenceStrength: "strong",
  anchorEvidenceIds: [],
});
assert.equal(missingAnchors.eligible, true);
assert.ok(Array.isArray(missingAnchors.anchorEvidenceIds) && missingAnchors.anchorEvidenceIds.length >= 1);

const cannotConcludeContract = buildRecommendationContractV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  q: 18,
  accuracy: 88,
  decisionTier: 4,
  readiness: "ready",
  confidenceBand: "high",
  cannotConcludeYet: true,
  interventionIntensity: "targeted",
  diagnosticType: "knowledge_gap",
  rootCause: "knowledge_gap",
  retentionRisk: "low",
  evidenceStrength: "strong",
  anchorEvidenceIds: [],
});
assert.equal(cannotConcludeContract.eligible, false);
assert.equal(cannotConcludeContract.intensity, "RI0");
assert.ok(cannotConcludeContract.forbiddenBecause.includes("cannot_conclude_yet"));

const applied = applyRecommendationContractToRecord(
  { interventionIntensity: "targeted", recommendedInterventionType: "focused_practice" },
  cannotConcludeContract
);
assert.equal(applied.interventionIntensity, "light");
assert.equal(applied.recommendedInterventionType, null);
assert.equal(applied.recommendedEvidenceAction, "collect_more_evidence");
assert.ok(applied.contractsV1 && applied.contractsV1.recommendation);
assert.equal(applied.contractsV1.recommendation.intensity, "RI0");
assert.equal(applied.contractsV1.recommendationValidation.ok, true);

const clamped = applyGateToTextClampToTopicRecord({
  topicKey: "math:addition:learning",
  subjectId: "math",
  displayName: "חיבור",
  questions: 16,
  evidenceStrength: "strong",
  dataSufficiencyLevel: "strong",
  conclusionStrength: "strong",
  gateReadiness: "ready",
  gateState: "continue_gate_active",
  dev2ConfidenceLevel: "high",
  interventionIntensity: "targeted",
  parentHe: "כדאי לתרגל",
  reasonHe: "יש בסיס",
  whyThisRecommendationHe: "מתאים עכשיו",
  doNowHe: "תרגלו",
  interventionPlanHe: "תכנית",
  recommendationContractV1: cannotConcludeContract,
});
assert.equal(clamped.interventionIntensity, "light");
assert.equal(clamped.recommendationContractV1.eligible, false);
assert.ok(clamped.contractsV1 && clamped.contractsV1.recommendation);
assert.equal(clamped.contractsV1.recommendation.eligible, false);
assert.ok(clamped.contractsV1.recommendationValidation);

console.log("recommendation-contract-v1 selftest: OK");
