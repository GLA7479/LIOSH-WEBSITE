import assert from "node:assert/strict";
import parentCopilot from "../utils/parent-copilot/index.js";
import { syntheticPayload } from "./parent-copilot-test-fixtures.mjs";
import { pct, writeArtifact } from "./rollout-artifacts-lib.mjs";

const utterances = [
  "מה המשמעות בנושא שברים?",
  "מה כדאי לעשות השבוע?",
  "מה המקצוע החזק?",
  "מה לא כדאי לעשות עכשיו?",
  "איך להסביר לילד?",
  "מה הכי בולט בתקופה?",
];

const payload = syntheticPayload({ eligible: true });
const outputs = [];
for (let i = 0; i < 180; i++) {
  const utterance = utterances[i % utterances.length];
  const out = parentCopilot.runParentCopilotTurn({
    audience: "parent",
    payload,
    utterance,
    sessionId: `hebrew-drift-${i}`,
    selectedContextRef: null,
  });
  const text = Array.isArray(out?.answerBlocks) ? out.answerBlocks.map((b) => String(b?.textHe || "")).join(" ").trim() : "";
  const clarification = String(out?.clarificationQuestionHe || "").trim();
  outputs.push(text || clarification || "ללא טקסט");
}

const roboticCues = ["נכון לעכשיו", "בשלב זה", "כדאי להמשיך לעקוב", "ממשיכים לעקוב"];
const internalLeakRe = /\b(internal_|contractsV1|scopeReason|llmAttempt|reasonCodes|[A-Z]{4,})\b/;
const overAuthority = ["בוודאות", "חד משמעית", "בטוח לחלוטין"];

let roboticCount = 0;
let leakageCount = 0;
let authorityCount = 0;
for (const t of outputs) {
  const cueHits = roboticCues.filter((x) => t.includes(x)).length;
  if (cueHits >= 3) roboticCount += 1;
  if (internalLeakRe.test(t)) leakageCount += 1;
  if (overAuthority.some((x) => t.includes(x))) authorityCount += 1;
}

const roboticityRate = pct(roboticCount, outputs.length);
const leakagePer1000 = outputs.length > 0 ? (leakageCount / outputs.length) * 1000 : 0;
const authorityPer1000 = outputs.length > 0 ? (authorityCount / outputs.length) * 1000 : 0;

writeArtifact("hebrew-drift", {
  sampleSize: outputs.length,
  roboticityRate,
  leakagePer1000,
  authorityPer1000,
  pass: roboticityRate <= 6 && leakagePer1000 < 1 && authorityPer1000 <= 2,
});

assert.ok(outputs.length >= 120, "hebrew drift sample size too small");
assert.ok(roboticityRate <= 6, `roboticity rate too high: ${roboticityRate.toFixed(2)}%`);
assert.ok(leakagePer1000 < 1, `internal leakage detected: ${leakagePer1000.toFixed(2)} per 1000`);
assert.ok(authorityPer1000 <= 2, `over-authoritative rate too high: ${authorityPer1000.toFixed(2)} per 1000`);

console.log("parent-hebrew-drift-suite: OK");
