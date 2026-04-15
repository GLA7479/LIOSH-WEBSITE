/**
 * Phase 2 selftest for Decision/Readiness/Confidence contracts (no Jest).
 * Run: npx tsx scripts/decision-readiness-contract-v1-selftest.mjs
 */
import assert from "node:assert/strict";

async function importUtils(path) {
  const mod = await import(path);
  return mod.default && typeof mod.default === "object" ? mod.default : mod;
}

const {
  buildDecisionReadinessContractsBundleV1,
  buildDecisionContractV1,
  buildReadinessContractV1,
  buildConfidenceContractV1,
} = await importUtils("../utils/contracts/decision-readiness-contract-v1.js");

const decisionStrong = buildDecisionContractV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  q: 24,
  evidenceStrength: "strong",
  dataSufficiencyLevel: "strong",
  conclusionStrength: "strong",
  cannotConcludeYet: false,
  weak: false,
  gateReadiness: "high",
});
assert.equal(decisionStrong.decisionTier, 4);
assert.equal(decisionStrong.topicKey, "math:addition:learning");
assert.equal(decisionStrong.subjectId, "math");
assert.equal(decisionStrong.gateReadiness, "ready");
assert.ok(decisionStrong.allowedClaimClasses.includes("actionable_guidance"));

const decisionWithheld = buildDecisionContractV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  q: 6,
  evidenceStrength: "low",
  dataSufficiencyLevel: "low",
  conclusionStrength: "withheld",
  cannotConcludeYet: true,
  weak: true,
  gateReadiness: "insufficient",
  dev2ConfidenceLevel: "contradictory",
});
assert.ok(decisionWithheld.decisionTier <= 1);
assert.equal(decisionWithheld.gateReadiness, "insufficient");
assert.ok(decisionWithheld.denialReasons.includes("weak_evidence"));

const readinessReady = buildReadinessContractV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  gateReadiness: "high",
  gateState: "continue_gate_active",
  cannotConcludeYet: false,
});
assert.equal(readinessReady.readiness, "ready");
assert.equal(readinessReady.topicKey, "math:addition:learning");
assert.equal(readinessReady.subjectId, "math");
assert.equal(readinessReady.maxAllowedTier, 4);

const readinessInsufficient = buildReadinessContractV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  gateReadiness: "insufficient",
  gateState: "gates_not_ready",
  cannotConcludeYet: true,
});
assert.equal(readinessInsufficient.readiness, "insufficient");
assert.equal(readinessInsufficient.maxAllowedTier, 1);

const confidenceHigh = buildConfidenceContractV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  dev2ConfidenceLevel: "high",
});
assert.equal(confidenceHigh.confidenceBand, "high");

const confidenceLow = buildConfidenceContractV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  dev2ConfidenceLevel: "early_signal_only",
});
assert.equal(confidenceLow.confidenceBand, "low");

const bundle = buildDecisionReadinessContractsBundleV1({
  topicKey: "math:addition:learning",
  subjectId: "math",
  q: 14,
  evidenceStrength: "medium",
  dataSufficiencyLevel: "medium",
  conclusionStrength: "moderate",
  cannotConcludeYet: false,
  weak: false,
  gateReadiness: "moderate",
  gateState: "continue_gate_active",
  dev2ConfidenceLevel: "moderate",
  confidence: "moderate",
});
assert.equal(bundle.version, "v1");
assert.equal(bundle.sourceOfTruth, "decision-readiness-contract-v1");
assert.ok(bundle.decision && bundle.readiness && bundle.confidence);
assert.equal(bundle.decision.topicKey, "math:addition:learning");
assert.equal(bundle.decision.subjectId, "math");
assert.equal(bundle.readiness.readiness, "emerging");
assert.equal(bundle.confidence.confidenceBand, "medium");

console.log("decision-readiness-contract-v1 selftest: OK");
