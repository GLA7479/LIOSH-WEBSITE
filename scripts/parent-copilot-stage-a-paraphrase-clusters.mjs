/**
 * Phase 2: Stage A paraphrase clusters + return-shape contract.
 * Run: npm run test:parent-copilot-stage-a-paraphrase
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { STAGE_A_PARAPHRASE_CLUSTERS, STAGE_A_REQUIRED_KEYS } = await import(
  pathToFileURL(join(ROOT, "tests/fixtures/parent-copilot-stage-a-paraphrase-bank.mjs")).href
);
const { interpretFreeformStageA } = await import(
  pathToFileURL(join(ROOT, "utils/parent-copilot/stage-a-freeform-interpretation.js")).href
);

function assertStageAShape(r, label) {
  for (const k of STAGE_A_REQUIRED_KEYS) {
    assert.ok(k in r, `${label}: missing Stage A key "${k}"`);
  }
  assert.ok(r.intentHitSignals && typeof r.intentHitSignals === "object", `${label}: intentHitSignals object`);
  assert.equal(typeof r.canonicalIntentScore, "number", `${label}: canonicalIntentScore number`);
  assert.equal(typeof r.shouldClarifyIntent, "boolean", `${label}: shouldClarifyIntent boolean`);
}

for (const [expectedIntent, phrases] of Object.entries(STAGE_A_PARAPHRASE_CLUSTERS)) {
  assert.ok(phrases.length >= 8, `${expectedIntent}: need >= 8 paraphrases`);
  for (const p of phrases) {
    const r = interpretFreeformStageA(p, null);
    assertStageAShape(r, p.slice(0, 48));
    assert.equal(
      r.canonicalIntent,
      expectedIntent,
      `Stage A cluster "${expectedIntent}" phrase: "${p.slice(0, 56)}…" → got ${r.canonicalIntent}`,
    );
  }
}

const empty = interpretFreeformStageA("", null);
assertStageAShape(empty, "empty");
assert.equal(empty.canonicalIntent, "unclear");
assert.equal(empty.shouldClarifyIntent, false);

const tie = interpretFreeformStageA("מה לעשות היום ומה לעשות השבוע?", null);
assertStageAShape(tie, "tie-utterance");
assert.equal(tie.ambiguityLevel, "high", "today + week action phrasing should tie at top score");
assert.equal(tie.shouldClarifyIntent, true);

console.log("parent-copilot-stage-a-paraphrase-clusters: OK");
