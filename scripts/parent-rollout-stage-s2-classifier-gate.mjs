import assert from "node:assert/strict";
import { readArtifact, writeArtifact } from "./rollout-artifacts-lib.mjs";

const edge = readArtifact("classifier-edge-matrix");
const collision = readArtifact("scope-collision");
const nearmiss = readArtifact("semantic-nearmiss");
const shortNoisy = readArtifact("short-noisy-phrasing");

const checks = {
  intentAccuracy: Number(edge.intentAccuracy ?? 0) >= 97,
  semanticAccuracy: Number(edge.semanticAccuracy ?? 0) >= 96,
  collisionAccuracy: Number(collision.collisionAccuracy ?? 0) >= 95,
  nearmissAccuracy: Number(nearmiss.nearmissAccuracy ?? 0) >= 94,
  shortNoisyAccuracy: Number(shortNoisy.shortNoisyAccuracy ?? 0) >= 93,
  falseClarificationRate: Number(shortNoisy.falseClarificationRate ?? 100) <= 8,
  falseConfidentRate: Number(shortNoisy.falseConfidentRate ?? 100) <= 6,
};

const failed = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([k]) => k);
const pass = failed.length === 0;

writeArtifact("stage-s2-classifier-gate", {
  checks,
  failed,
  pass,
});

assert.ok(pass, `S2 classifier gate failed: ${failed.join(", ")}`);
console.log("parent-rollout-stage-s2-classifier-gate: OK");
