import assert from "node:assert/strict";
import parentCopilot from "../utils/parent-copilot/index.js";
import { syntheticPayload } from "./parent-copilot-test-fixtures.mjs";
import { pct, writeArtifact } from "./rollout-artifacts-lib.mjs";

const eligiblePayload = syntheticPayload({ eligible: true });
const insufficientPayload = syntheticPayload({ eligible: false });

const insufficientCue = /לא\s+ניתן|אין\s+מספיק\s+נתונים|מוקדם\s+לקבוע|כדאי\s+להמשיך\s+לעקוב/u;
const overAuthorityCue = /בוודאות|חד\s+משמעית|בטוח\s+לחלוטין/u;

let insufficientRequired = 0;
let insufficientPresent = 0;
let authorityViolations = 0;
let total = 0;

for (let i = 0; i < 80; i++) {
  const good = parentCopilot.runParentCopilotTurn({
    audience: "parent",
    payload: eligiblePayload,
    utterance: "מה המשמעות בנושא שברים?",
    sessionId: `auth-good-${i}`,
    selectedContextRef: null,
  });
  const bad = parentCopilot.runParentCopilotTurn({
    audience: "parent",
    payload: insufficientPayload,
    utterance: "מה המשמעות בנושא שברים?",
    sessionId: `auth-ins-${i}`,
    selectedContextRef: null,
  });

  const goodText = Array.isArray(good?.answerBlocks) ? good.answerBlocks.map((b) => String(b?.textHe || "")).join(" ") : "";
  const badText = Array.isArray(bad?.answerBlocks) ? bad.answerBlocks.map((b) => String(b?.textHe || "")).join(" ") : "";

  total += 2;
  if (overAuthorityCue.test(goodText)) authorityViolations += 1;
  if (overAuthorityCue.test(badText)) authorityViolations += 1;

  insufficientRequired += 1;
  if (insufficientCue.test(badText)) insufficientPresent += 1;
}

const insufficiencyRecall = pct(insufficientPresent, insufficientRequired);
const authorityPer1000 = total > 0 ? (authorityViolations / total) * 1000 : 0;

writeArtifact("hebrew-authority-insufficiency-balance", {
  sampleSize: total,
  insufficiencyRecall,
  authorityPer1000,
  pass: insufficiencyRecall >= 97 && authorityPer1000 <= 2,
});

assert.ok(total >= 120, "authority/insufficiency sample size too small");
assert.ok(insufficiencyRecall >= 97, `insufficiency recall below threshold: ${insufficiencyRecall.toFixed(2)}%`);
assert.ok(authorityPer1000 <= 2, `authority drift too high: ${authorityPer1000.toFixed(2)} per 1000`);

console.log("parent-hebrew-authority-insufficiency-balance-suite: OK");
