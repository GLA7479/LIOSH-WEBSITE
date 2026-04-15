/**
 * Phase 1 selftest for EvidenceContract v1 (no Jest).
 * Run: npx tsx scripts/contracts-v1-selftest.mjs
 */
import assert from "node:assert/strict";

async function importUtils(path) {
  const mod = await import(path);
  return mod.default && typeof mod.default === "object" ? mod.default : mod;
}

const {
  buildEvidenceContractV1,
  validateEvidenceContractV1,
  assertEvidenceContractV1,
} = await importUtils("../utils/contracts/parent-report-contracts-v1.js");

const {
  enrichTopicMapsWithRowDiagnostics,
  attachEvidenceContractsV1ToTopicMaps,
} = await importUtils("../utils/parent-report-row-diagnostics.js");

const periodStartMs = Date.UTC(2026, 3, 1, 0, 0, 0);
const periodEndMs = Date.UTC(2026, 3, 30, 23, 59, 59);

const baseRow = {
  questions: 14,
  correct: 12,
  wrong: 2,
  accuracy: 86,
  modeKey: "learning",
  customHe: "טקסט קיים שלא אמור להשתנות",
  lastSessionMs: periodEndMs - 2 * 24 * 60 * 60 * 1000,
};

const signals = {
  recencyScore: 85,
  stabilityScore: 67,
  confidenceScore: 58,
  evidenceStrength: "strong",
  dataSufficiencyLevel: "strong",
};

const contract = buildEvidenceContractV1({
  subjectId: "math",
  topicKey: "addition\u0001learning\u0001g3\u0001easy",
  periodStartMs,
  periodEndMs,
  row: baseRow,
  signals,
  trend: { accuracyDirection: "up" },
  behaviorProfile: {
    repeatErrorRate01: 0.19,
    hintRate01: 0.08,
    retryRate01: 0.15,
    medianResponseMs: 950,
  },
});

const valid = validateEvidenceContractV1(contract);
assert.equal(valid.ok, true);
assert.equal(valid.errors.length, 0);
assert.equal(contract.contractVersion, "v1");
assert.equal(contract.subjectId, "math");
assert.equal(contract.questionCount, 14);
assert.ok(Array.isArray(contract.anchorEventIds));
assert.ok(contract.anchorEventIds.length >= 1);
assertEvidenceContractV1(contract, "selftest-positive");

const invalid = {
  ...contract,
  evidenceBand: "E4",
  dataSufficiency: "partial",
};
const invalidRes = validateEvidenceContractV1(invalid);
assert.equal(invalidRes.ok, false);
assert.ok(invalidRes.errors.some((e) => e.includes("E4 requires sufficient")));

const maps = {
  math: {
    "addition\u0001learning\u0001g3\u0001easy": { ...baseRow },
  },
};
const mistakesBySubject = {
  math: {
    "addition\u0001learning\u0001g3\u0001easy": { count: 2 },
  },
};

const beforeHe = maps.math["addition\u0001learning\u0001g3\u0001easy"].customHe;
maps.math["addition\u0001learning\u0001g3\u0001easy"].trend = { accuracyDirection: "up" };
maps.math["addition\u0001learning\u0001g3\u0001easy"].behaviorProfile = {
  repeatErrorRate01: 0.1,
  hintRate01: 0.1,
  retryRate01: 0.2,
  medianResponseMs: 1100,
};

enrichTopicMapsWithRowDiagnostics(maps, mistakesBySubject, periodEndMs);
attachEvidenceContractsV1ToTopicMaps(maps, periodStartMs, periodEndMs);

const enriched = maps.math["addition\u0001learning\u0001g3\u0001easy"];
assert.equal(enriched.customHe, beforeHe);
assert.ok(enriched.contractsV1 && enriched.contractsV1.evidence);
assert.equal(enriched.contractsV1.evidenceValidation?.ok, true);
assertEvidenceContractV1(enriched.contractsV1.evidence, "selftest-enriched-row");

console.log("contracts-v1 selftest: OK");
