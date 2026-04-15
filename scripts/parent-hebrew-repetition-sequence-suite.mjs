import assert from "node:assert/strict";
import parentCopilot from "../utils/parent-copilot/index.js";
import { syntheticPayload } from "./parent-copilot-test-fixtures.mjs";
import { pct, writeArtifact } from "./rollout-artifacts-lib.mjs";

const payload = syntheticPayload({ eligible: true });
const utterances = [
  "מה המשמעות בנושא שברים?",
  "מה כדאי לעשות השבוע?",
  "מה הכי בולט בתקופה?",
  "איך להסביר לילד את זה?",
  "מה לא כדאי לעשות עכשיו?",
];

const outputs = [];
for (let i = 0; i < 180; i++) {
  const out = parentCopilot.runParentCopilotTurn({
    audience: "parent",
    payload,
    utterance: utterances[i % utterances.length],
    sessionId: `repetition-seq-${i}`,
    selectedContextRef: null,
  });
  const text = Array.isArray(out?.answerBlocks) ? out.answerBlocks.map((b) => String(b?.textHe || "")).join(" ").trim() : "";
  outputs.push(text);
}

let adjacentRepeats = 0;
for (let i = 1; i < outputs.length; i++) {
  if (outputs[i] && outputs[i] === outputs[i - 1]) adjacentRepeats += 1;
}
const repetitionRate = pct(adjacentRepeats, Math.max(1, outputs.length - 1));

writeArtifact("hebrew-repetition-sequence", {
  sampleSize: outputs.length,
  sequenceRepetitionRate: repetitionRate,
  pass: repetitionRate <= 8,
});

assert.ok(outputs.length >= 150, "sequence sample size too small");
assert.ok(repetitionRate <= 8, `sequence repetition drift too high: ${repetitionRate.toFixed(2)}%`);

console.log("parent-hebrew-repetition-sequence-suite: OK");
