import assert from "node:assert/strict";
import { resolveIntentWithConfidence } from "../utils/parent-copilot/intent-resolver.js";
import { resolveScope } from "../utils/parent-copilot/scope-resolver.js";
import { syntheticPayload } from "./parent-copilot-test-fixtures.mjs";
import { pct, writeArtifact } from "./rollout-artifacts-lib.mjs";

const payload = syntheticPayload();

const classificationCases = [
  { utterance: "מהזה אומר", expectedIntent: "understand_meaning", expectedScopeStatus: "clarification_required" },
  { utterance: "מחר?", expectedIntent: "action_tomorrow", expectedScopeStatus: "clarification_required" },
  { utterance: "חשבון", expectedIntent: "understand_meaning", expectedScopeStatus: "resolved" },
  { utterance: "שברים?", expectedIntent: "understand_meaning", expectedScopeStatus: "resolved" },
  { utterance: "לא ברור", expectedIntent: "uncertainty_boundary", expectedScopeStatus: "clarification_required" },
  { utterance: "מה המקצוע החזק", expectedIntent: "understand_meaning", expectedScopeStatus: "resolved" },
];

let pass = 0;
let falseClarification = 0;
let ambiguousConfident = 0;
for (const tc of classificationCases) {
  const intent = resolveIntentWithConfidence(tc.utterance);
  const scope = resolveScope({ payload, utterance: tc.utterance, selectedContextRef: null });
  const ok = intent.intent === tc.expectedIntent && scope.resolutionStatus === tc.expectedScopeStatus;
  if (ok) pass += 1;
  if (tc.expectedScopeStatus === "resolved" && scope.resolutionStatus === "clarification_required") falseClarification += 1;
  if (tc.expectedScopeStatus === "clarification_required" && scope.resolutionStatus === "resolved" && scope.scopeConfidence >= 0.7) {
    ambiguousConfident += 1;
  }
}

const accuracy = pct(pass, classificationCases.length);
const falseClarificationRate = pct(falseClarification, classificationCases.length);
const falseConfidentRate = pct(ambiguousConfident, classificationCases.length);

writeArtifact("short-noisy-phrasing", {
  shortNoisyAccuracy: accuracy,
  falseClarificationRate,
  falseConfidentRate,
  sampleSize: classificationCases.length,
  pass: accuracy >= 93 && falseClarificationRate <= 8 && falseConfidentRate <= 3,
});

assert.ok(classificationCases.length >= 6, "short/noisy sample size too small");
assert.ok(accuracy >= 93, `short/noisy accuracy below threshold: ${accuracy.toFixed(2)}%`);
assert.ok(falseClarificationRate <= 8, `false clarification rate too high: ${falseClarificationRate.toFixed(2)}%`);
assert.ok(falseConfidentRate <= 6, `false confident classification too high: ${falseConfidentRate.toFixed(2)}%`);

console.log("parent-copilot-short-noisy-phrasing-suite: OK");
