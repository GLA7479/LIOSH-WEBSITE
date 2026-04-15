import assert from "node:assert/strict";
import { readArtifact, writeArtifact } from "./rollout-artifacts-lib.mjs";

const drift = readArtifact("hebrew-drift");
const parity = readArtifact("hebrew-normalization-semantic-parity");
const repetition = readArtifact("hebrew-repetition-sequence");
const balance = readArtifact("hebrew-authority-insufficiency-balance");

const checks = {
  roboticityRate: Number(drift.roboticityRate ?? 100) <= 6,
  leakagePer1000: Number(drift.leakagePer1000 ?? 1000) < 1,
  authorityPer1000: Number(drift.authorityPer1000 ?? 1000) <= 2,
  normalizationSemanticPreservationRate: Number(parity.normalizationSemanticPreservationRate ?? 0) >= 99,
  repetitionRate: Number(repetition.sequenceRepetitionRate ?? 100) <= 8,
  insufficiencyRecall: Number(balance.insufficiencyRecall ?? 0) >= 97,
  authorityBalancePer1000: Number(balance.authorityPer1000 ?? 1000) <= 2,
};

const failed = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([k]) => k);
const pass = failed.length === 0;

writeArtifact("stage-s2-hebrew-gate", {
  checks,
  failed,
  pass,
});

assert.ok(pass, `S2 Hebrew drift gate failed: ${failed.join(", ")}`);
console.log("parent-rollout-stage-s2-hebrew-drift-gate: OK");
