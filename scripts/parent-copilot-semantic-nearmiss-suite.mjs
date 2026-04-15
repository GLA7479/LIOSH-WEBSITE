import assert from "node:assert/strict";
import semanticClass from "../utils/parent-copilot/semantic-question-class.js";
import { pct, writeArtifact } from "./rollout-artifacts-lib.mjs";

const cases = [
  { utterance: "מה המקצוע הכי חזק?", expected: "strongest_subject" },
  { utterance: "מה מקצוע חזק מאוד עכשיו", expected: "none" },
  { utterance: "מה המקצוע הכי חלש", expected: "weakest_subject" },
  { utterance: "באיזה מקצוע קשת?", expected: "none" },
  { utterance: "מה הכי בוטל בתקופה?", expected: "none" },
  { utterance: "יש עוד נושאים?", expected: "subject_listing" },
  { utterance: "השוואה בין חשבון לאנגלית", expected: "none" },
  { utterance: "מה לעסות השבוה?", expected: "none" },
  { utterance: "להתקדם או להמתין", expected: "advance_or_hold_question" },
  { utterance: "לא הבנתי בכלל תסביר פשוט", expected: "clarify_reexplain" },
];

let pass = 0;
for (const tc of cases) {
  const got = semanticClass.detectAggregateQuestionClass(tc.utterance);
  if (got === tc.expected) pass += 1;
}

const nearmissAccuracy = pct(pass, cases.length);
writeArtifact("semantic-nearmiss", {
  nearmissAccuracy,
  sampleSize: cases.length,
  pass: nearmissAccuracy >= 94,
});

assert.ok(cases.length >= 10, "semantic near-miss sample size too small");
assert.ok(nearmissAccuracy >= 94, `semantic near-miss accuracy below threshold: ${nearmissAccuracy.toFixed(2)}%`);

console.log("parent-copilot-semantic-nearmiss-suite: OK");
