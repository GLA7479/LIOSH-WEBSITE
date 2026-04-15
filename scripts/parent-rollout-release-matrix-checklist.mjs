import assert from "node:assert/strict";
import { readArtifact, writeArtifact } from "./rollout-artifacts-lib.mjs";

const stage = String(process.env.PARENT_RELEASE_STAGE || "s2").trim().toLowerCase();

const stageRequirements = {
  s1: {
    artifacts: ["stage-s2-classifier-gate"],
    signers: ["eng", "qa", "product"],
  },
  s2: {
    artifacts: ["stage-s2-classifier-gate", "stage-s2-hebrew-gate"],
    signers: ["eng", "qa", "product", "lang"],
  },
  s3: {
    artifacts: ["stage-s2-classifier-gate", "stage-s2-hebrew-gate", "stage-s3-observability-gate"],
    signers: ["eng", "qa", "product", "lang", "ops"],
  },
  s4: {
    artifacts: ["stage-s2-classifier-gate", "stage-s2-hebrew-gate", "stage-s3-observability-gate"],
    signers: ["eng", "qa", "product", "lang", "ops", "safety"],
  },
  s5: {
    artifacts: ["stage-s2-classifier-gate", "stage-s2-hebrew-gate", "stage-s3-observability-gate"],
    signers: ["eng", "qa", "product", "lang", "ops", "safety"],
  },
  s6: {
    artifacts: ["stage-s2-classifier-gate", "stage-s2-hebrew-gate", "stage-s3-observability-gate"],
    signers: ["eng", "qa", "product", "lang", "ops", "safety", "exec"],
  },
};

const cfg = stageRequirements[stage];
assert.ok(cfg, `unsupported stage: ${stage}`);

/** @type {string[]} */
const missingArtifacts = [];
for (const a of cfg.artifacts) {
  try {
    const r = readArtifact(a);
    if (!r?.pass) missingArtifacts.push(`${a}:not_passed`);
  } catch {
    missingArtifacts.push(`${a}:missing`);
  }
}

const envForSigner = (id) => `PARENT_SIGNOFF_${String(id).toUpperCase()}`;
const signerState = Object.fromEntries(
  cfg.signers.map((id) => [id, String(process.env[envForSigner(id)] || "").trim().toLowerCase() === "true"]),
);
const missingSigners = Object.entries(signerState)
  .filter(([, ok]) => !ok)
  .map(([id]) => id);

const pass = missingArtifacts.length === 0 && missingSigners.length === 0;
const decision = pass ? "GO" : "NO-GO";

writeArtifact("release-matrix-checklist", {
  stage,
  requiredArtifacts: cfg.artifacts,
  requiredSigners: cfg.signers,
  missingArtifacts,
  missingSigners,
  signerState,
  decision,
  pass,
});

assert.ok(pass, `release matrix checklist failed (${stage}): artifacts=${missingArtifacts.join(",")} signers=${missingSigners.join(",")}`);
console.log(`parent-rollout-release-matrix-checklist (${stage}): ${decision}`);
