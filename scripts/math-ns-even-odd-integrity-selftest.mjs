/**
 * Smoke test: ns_even_odd MCQ options are unique and pass Phase 4 integrity.
 * Run: npx tsx scripts/math-ns-even-odd-integrity-selftest.mjs
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { generateQuestion } = await import(pathToFileURL(join(ROOT, "utils", "math-question-generator.js")).href);
const { getLevelConfig } = await import(pathToFileURL(join(ROOT, "utils", "math-storage.js")).href);
const { normalizeQuestionPayload, runIntegrityChecks } = await import(
  pathToFileURL(join(ROOT, "scripts", "learning-simulator", "lib", "question-integrity-checks.mjs")).href
);

const lc = getLevelConfig(1, "easy");
let oddHits = 0;
let evenHits = 0;

for (let i = 0; i < 8000; i++) {
  const q = generateQuestion(lc, "number_sense", "g1", null, null);
  if (!q || q.params?.kind !== "ns_even_odd") continue;
  if (q.params.isEven) evenHits += 1;
  else oddHits += 1;

  const uniq = new Set(q.answers.map((x) => String(x).trim().toLowerCase()));
  assert.equal(uniq.size, q.answers.length, "duplicate choice strings");
  assert.ok(q.answers.includes(q.correctAnswer), "correctAnswer must be an option");

  const normalized = normalizeQuestionPayload(q);
  const { pass, failures } = runIntegrityChecks(normalized, {
    subject: "math",
    resolvedTopic: "number_sense",
    grade: "g1",
    level: "easy",
  });
  assert.ok(pass, failures?.map((f) => f.message).join("; "));
}

assert.ok(oddHits >= 20 && evenHits >= 20, "expected samples of both parities");

console.log("PASS: math ns_even_odd integrity selftest (" + (oddHits + evenHits) + " parity questions)");
