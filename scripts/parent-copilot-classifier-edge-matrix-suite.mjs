import assert from "node:assert/strict";
import { resolveIntentWithConfidence } from "../utils/parent-copilot/intent-resolver.js";
import { detectAggregateQuestionClass } from "../utils/parent-copilot/semantic-question-class.js";
import { pct, writeArtifact } from "./rollout-artifacts-lib.mjs";

const intentCases = [
  { utterance: "מה לעשות היום בנושא הזה?", expected: "action_today" },
  { utterance: "מה כדאי לעשות בשבוע הקרוב?", expected: "action_week" },
  { utterance: "מה לא כדאי לעשות עכשיו?", expected: "avoid_now" },
  { utterance: "להתקדם או להמתין כרגע?", expected: "advance_or_hold" },
  { utterance: "איך להסביר לילד את זה?", expected: "explain_to_child" },
  { utterance: "מה לשאול את המורה?", expected: "ask_teacher" },
  { utterance: "מה רואים בנתונים?", expected: "understand_observation" },
  { utterance: "מה המשמעות של הנתונים?", expected: "understand_observation" },
  { utterance: "לא ברור לי, יש חוסר ודאות", expected: "uncertainty_boundary" },
  { utterance: "מה המשמעותת של המספרים", expected: "understand_meaning" },
];

const semanticCases = [
  { utterance: "מה המקצוע החזק?", expected: "strongest_subject" },
  { utterance: "באיזה מקצוע הכי קשה?", expected: "hardest_subject" },
  { utterance: "מה הכי בולט בתקופה?", expected: "period_highlight" },
  { utterance: "יש עוד מקצועות?", expected: "subject_listing" },
  { utterance: "מה ההמלצות להמשך?", expected: "recommendation_action" },
  { utterance: "לא הבנתי, תסביר פשוט", expected: "clarify_reexplain" },
  { utterance: "להתקדם או להמתין?", expected: "advance_or_hold_question" },
  { utterance: "חשבון מול אנגלית מה עדיף?", expected: "comparison" },
];

let intentPass = 0;
for (const c of intentCases) {
  const got = resolveIntentWithConfidence(c.utterance).intent;
  if (got === c.expected) intentPass += 1;
}
let semanticPass = 0;
for (const c of semanticCases) {
  const got = detectAggregateQuestionClass(c.utterance);
  if (got === c.expected) semanticPass += 1;
}

const intentAccuracy = pct(intentPass, intentCases.length);
const semanticAccuracy = pct(semanticPass, semanticCases.length);
const summary = {
  intentAccuracy,
  semanticAccuracy,
  intentSampleSize: intentCases.length,
  semanticSampleSize: semanticCases.length,
  pass: intentAccuracy >= 97 && semanticAccuracy >= 96,
};

writeArtifact("classifier-edge-matrix", summary);

assert.ok(intentCases.length >= 10, "intent sample size too small");
assert.ok(semanticCases.length >= 8, "semantic sample size too small");
assert.ok(intentAccuracy >= 97, `intent accuracy below threshold: ${intentAccuracy.toFixed(2)}%`);
assert.ok(semanticAccuracy >= 96, `semantic accuracy below threshold: ${semanticAccuracy.toFixed(2)}%`);

console.log("parent-copilot-classifier-edge-matrix-suite: OK");
