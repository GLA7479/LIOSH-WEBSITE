/**
 * Broad free-form questions about the report as a whole → executive scope (class-level).
 * Run: npm run test:parent-copilot-broad-report-routing
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { syntheticPayload } = await import(pathToFileURL(join(ROOT, "scripts/parent-copilot-test-fixtures.mjs")).href);
const { resolveScope } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/scope-resolver.js")).href);
const parentMod = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/index.js")).href);
const runParentCopilotTurn = parentMod.default?.runParentCopilotTurn ?? parentMod.runParentCopilotTurn;

const UI_HELPER_SUBSTRINGS = ["שאלה על הדוח", "תשובה:"];

const payload = syntheticPayload({ eligible: true });

/** Paraphrase family: meaning, importance, overall read, synthesis, noisy / imperfect Hebrew — not canned product strings. */
const broadReportHebrewFamily = [
  "מה המשמעות של הדוח הזה בשבילי בפועל?",
  "מה עקרונית חשוב שאדע מתוך הדוח?",
  "תעזרו לי לעשות סדר בכל המספרים של הדוח, לא מבין את התמונה",
  "מה הדוח אומר בגדול על התקופה?",
  "איך להבין את המסקנות בלי להיתקע בפרטים קטנים",
  "מה לשים לב אליו בדוח בתקופה הזאת?",
  "רוצה תמונה כללית של מה קורה אצלנו מהדוח",
  "מה החוזקות והחולשות בדוח בקו גס?",
  "לא הבנתי את המשמעות — תסבירו בקצרה על מה מדובר פה",
  "מה כדאי שאזכור מזה בדוח?",
  "משמעות כללית של הדוח נא בבקשה",
  "מה חשוב שאני אקח מהדוח הזה הביתה?",
  "איך לקרוא את הדוח בצורה חכמה כשיש הרבה נתונים",
];

let i = 0;
for (const utterance of broadReportHebrewFamily) {
  const scope = resolveScope({ payload, utterance, selectedContextRef: null });
  assert.equal(scope.resolutionStatus, "resolved", `scope resolve: ${utterance.slice(0, 40)}`);
  assert.equal(scope.scope?.scopeType, "executive", `scopeType: ${utterance.slice(0, 40)}`);
  assert.ok(!scope.clarificationQuestionHe, `no clarification: ${utterance.slice(0, 40)}`);

  const res = runParentCopilotTurn({
    audience: "parent",
    payload,
    utterance,
    sessionId: `broad-report-routing-${i++}`,
    selectedContextRef: null,
  });
  assert.equal(res.resolutionStatus, "resolved", `turn: ${utterance.slice(0, 40)}`);
  assert.ok(Array.isArray(res.answerBlocks) && res.answerBlocks.length >= 1, `answerBlocks: ${utterance.slice(0, 40)}`);
  const joined = res.answerBlocks.map((b) => String(b.textHe || "")).join("\n");
  for (const bad of UI_HELPER_SUBSTRINGS) {
    assert.ok(!joined.includes(bad), `assistant blocks must not contain UI helper token "${bad}"`);
  }
}

// Negative: explicit subject anchor in utterance → not default executive (subject entity)
const subScope = resolveScope({
  payload,
  utterance: "מה הולך טוב באנגלית בדוח?",
  selectedContextRef: null,
});
assert.equal(subScope.resolutionStatus, "resolved");
assert.equal(subScope.scope?.scopeType, "subject");
assert.equal(subScope.scope?.scopeId, "english");

// Negative: explicit topic anchor in utterance → topic entity
const topicScope = resolveScope({
  payload,
  utterance: "מה המצב בנושא השברים בדוח?",
  selectedContextRef: null,
});
assert.equal(topicScope.resolutionStatus, "resolved");
assert.equal(topicScope.scope?.scopeType, "topic");
assert.equal(topicScope.scope?.scopeId, "t1");

console.log("parent-copilot-broad-report-routing-suite: OK");
