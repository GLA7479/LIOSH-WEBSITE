/**
 * Phase 5: guardrail-validator hardening — invalid drafts blocked before render.
 * Run: npm run test:parent-copilot-phase5
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { syntheticPayload } = await import(pathToFileURL(join(ROOT, "scripts/parent-copilot-test-fixtures.mjs")).href);
const { buildTruthPacketV1 } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/truth-packet-v1.js")).href);
const { validateAnswerDraft, validateParentCopilotResponseV1 } = await import(
  pathToFileURL(join(ROOT, "utils/parent-copilot/guardrail-validator.js")).href
);
const { buildDeterministicFallbackAnswer } = await import(
  pathToFileURL(join(ROOT, "utils/parent-copilot/fallback-templates.js")).href
);
const parentCopilot = (await import(pathToFileURL(join(ROOT, "utils/parent-copilot/index.js")).href)).default;
const sessionMemory = (await import(pathToFileURL(join(ROOT, "utils/parent-copilot/session-memory.js")).href)).default;

const payload = syntheticPayload();
const tp = buildTruthPacketV1(payload, {
  scopeType: "topic",
  scopeId: "t1",
  scopeLabel: "שברים",
  interpretationScope: "executive",
  scopeClass: "executive",
});
assert.ok(tp);

const tpIneligible = buildTruthPacketV1(
  syntheticPayload({ eligible: false }),
  {
    scopeType: "topic",
    scopeId: "t1",
    scopeLabel: "שברים",
    interpretationScope: "recommendation",
    scopeClass: "recommendation",
  },
);
assert.ok(tpIneligible);

// --- Invalid drafts rejected (fail codes present) ---
const badNext = validateAnswerDraft(
  {
    answerBlocks: [
      { type: "observation", textHe: String(tp.contracts?.narrative?.textSlots?.observation || "x"), source: "contract_slot" },
      { type: "meaning", textHe: String(tp.contracts?.narrative?.textSlots?.interpretation || "y"), source: "contract_slot" },
      { type: "next_step", textHe: "מומלץ חיזוק ממוקד.", source: "contract_slot" },
    ],
  },
  tpIneligible,
  { intent: "what_to_do_today" },
);
assert.equal(badNext.ok, false);
assert.ok(badNext.failCodes.includes("next_step_not_eligible"));

const badContradiction = validateAnswerDraft(
  {
    answerBlocks: [
      { type: "observation", textHe: String(tpIneligible.contracts?.narrative?.textSlots?.observation || ""), source: "contract_slot" },
      { type: "meaning", textHe: String(tpIneligible.contracts?.narrative?.textSlots?.interpretation || ""), source: "contract_slot" },
      { type: "uncertainty_reason", textHe: "זה סופי שאין מה לדייק כאן.", source: "composed" },
    ],
  },
  tpIneligible,
  { intent: "what_to_do_today" },
);
assert.equal(badContradiction.ok, false);
assert.ok(badContradiction.failCodes.includes("truth_contradiction_premature_conclusion"));

const badRecWording = validateAnswerDraft(
  {
    answerBlocks: [
      { type: "observation", textHe: String(tpIneligible.contracts?.narrative?.textSlots?.observation || ""), source: "contract_slot" },
      { type: "meaning", textHe: String(tpIneligible.contracts?.narrative?.textSlots?.interpretation || ""), source: "contract_slot" },
      { type: "meaning", textHe: "מומלץ לכם לתרגל עשר דקות היום בבית.", source: "composed" },
    ],
  },
  tpIneligible,
  { intent: "what_to_do_today" },
);
assert.equal(badRecWording.ok, false);
assert.ok(badRecWording.failCodes.includes("ineligible_recommendation_wording"));

const badInternal = validateAnswerDraft(
  {
    answerBlocks: [
      { type: "observation", textHe: String(tp.contracts?.narrative?.textSlots?.observation || ""), source: "contract_slot" },
      { type: "meaning", textHe: "contractsV1.narrative", source: "composed" },
    ],
  },
  tp,
  {},
);
assert.equal(badInternal.ok, false);
assert.ok(
  badInternal.failCodes.includes("internal_surface_leak") || badInternal.failCodes.includes("forbidden_parent_surface_token"),
);

const badRi = validateAnswerDraft(
  {
    answerBlocks: [
      { type: "observation", textHe: String(tp.contracts?.narrative?.textSlots?.observation || ""), source: "contract_slot" },
      { type: "meaning", textHe: "עלו לרמה RI2 מיד.", source: "composed" },
    ],
  },
  tp,
  {},
);
assert.equal(badRi.ok, false);
assert.ok(badRi.failCodes.includes("raw_intensity_code_leak"));

const badStrength = validateAnswerDraft(
  {
    answerBlocks: [
      { type: "observation", textHe: String(tpIneligible.contracts?.narrative?.textSlots?.observation || ""), source: "contract_slot" },
      { type: "meaning", textHe: String(tpIneligible.contracts?.narrative?.textSlots?.interpretation || ""), source: "contract_slot" },
      { type: "meaning", textHe: "הילד מצטיין במקצוע וחוזק יוצא דופן.", source: "composed" },
    ],
  },
  tpIneligible,
  { intent: "explain_report" },
);
assert.equal(badStrength.ok, false);
assert.ok(badStrength.failCodes.includes("strength_framing_not_allowed"));

// --- Deterministic fallback still passes draft validator ---
const fb = buildDeterministicFallbackAnswer(tp, ["test"]);
const vFb = validateAnswerDraft(fb, tp, { intent: "explain_report" });
assert.equal(vFb.ok, true, vFb.failCodes.join(","));

// --- Full turn: fallback path stays response-valid + Hebrew surface clean ---
sessionMemory.resetParentCopilotSessionForTests("phase5-fb");
const r = parentCopilot.runParentCopilotTurn({
  audience: "parent",
  payload: syntheticPayload({ eligible: false }),
  utterance: "מה לעשות עכשיו",
  sessionId: "phase5-fb",
});
assert.equal(r.resolutionStatus, "resolved");
const vr = validateParentCopilotResponseV1(r);
assert.equal(vr.ok, true, vr.hardFails.join(","));
const body = r.answerBlocks.map((b) => b.textHe).join(" ");
assert.ok(!/\bRI[0-3]\b/i.test(body));
assert.ok(!/contractsV1|truthPacket|schemaVersion/i.test(body));
assert.ok(/[\u0590-\u05FF]{6,}/.test(body), "expected substantial Hebrew in parent-facing output");

console.log("parent-copilot-phase5-validator-suite: PASS");
