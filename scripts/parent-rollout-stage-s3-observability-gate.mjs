import assert from "node:assert/strict";
import { readArtifact, writeArtifact } from "./rollout-artifacts-lib.mjs";

const obs = readArtifact("observability-contract");

const checks = {
  ingestSuccessRate: Number(obs.ingestSuccessRate ?? 0) >= 99.7,
  traceQueryP95Minutes: Number(obs.traceQueryP95Minutes ?? 999) <= 2,
  dashboardLagMinutes: Number(obs.dashboardLagMinutes ?? 999) <= 5,
  telemetryCompletenessRate: Number(obs.telemetryCompletenessRate ?? 0) === 100,
};

const failed = Object.entries(checks)
  .filter(([, ok]) => !ok)
  .map(([k]) => k);
const pass = failed.length === 0;

writeArtifact("stage-s3-observability-gate", {
  checks,
  failed,
  pass,
});

assert.ok(pass, `S3 observability gate failed: ${failed.join(", ")}`);
console.log("parent-rollout-stage-s3-observability-gate: OK");
