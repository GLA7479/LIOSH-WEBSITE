/**
 * Acceptance — שורות מתמטיקה scoped (פעולה+מצב+כיתה+רמה), ללא UI.
 * הרצה: npx tsx scripts/math-scoped-topic-rows-acceptance.mjs
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { buildSyntheticBaseReport, mathRowSession } = await import(
  pathToFileURL(join(ROOT, "tests/fixtures/parent-report-pipeline.mjs")).href
);
const { rowMistakeEventCount } = await import(
  pathToFileURL(join(ROOT, "utils/parent-report-row-diagnostics.js")).href
);

const SEP = "\u0001";
const kG2Easy = `addition${SEP}learning${SEP}g2${SEP}easy`;
const kG3Med = `addition${SEP}learning${SEP}g3${SEP}medium`;

function at1_twoScopedAdditionRows() {
  const base = buildSyntheticBaseReport({
    summary: {
      totalQuestions: 20,
      mathQuestions: 20,
      mathCorrect: 12,
      mathAccuracy: 60,
      overallAccuracy: 60,
    },
    mathOperations: {
      [kG2Easy]: mathRowSession({ questions: 10, accuracy: 80, needsPractice: false }),
      [kG3Med]: mathRowSession({ questions: 10, accuracy: 50, needsPractice: true }),
    },
    mistakes: { math: [] },
  });
  const keys = Object.keys(base.mathOperations || {}).filter((k) => k.startsWith("addition"));
  assert.equal(keys.length, 2, "AT1: two distinct scoped addition rows");
  assert.ok(keys.includes(kG2Easy) && keys.includes(kG3Med), "AT1: expected scoped keys");
}

function at2_mistakeCountsOnlyOnMatchingScope() {
  const rowG2 = mathRowSession({ questions: 12, accuracy: 55, needsPractice: true });
  const rowG3 = mathRowSession({ questions: 12, accuracy: 55, needsPractice: true });
  const mistakesOnlyG2 = { [kG2Easy]: { count: 6 } };
  assert.equal(rowMistakeEventCount("math", mistakesOnlyG2, "addition", kG2Easy, rowG2), 6);
  assert.equal(rowMistakeEventCount("math", mistakesOnlyG2, "addition", kG3Med, rowG3), 0);
}

function at3_unscopedMistakesDoNotForceTrueWeakness() {
  const base = buildSyntheticBaseReport({
    summary: {
      totalQuestions: 14,
      mathQuestions: 14,
      mathCorrect: 6,
      mathAccuracy: 43,
      overallAccuracy: 43,
    },
    mathOperations: {
      [kG2Easy]: mathRowSession({ questions: 14, accuracy: 43, needsPractice: true }),
    },
    mistakes: {
      math: Array.from({ length: 6 }, (_, i) => ({
        subject: "math",
        operation: "addition",
        isCorrect: false,
        patternFamily: "pf:unscoped_acceptance",
        timestamp: Date.UTC(2026, 3, 5, 10, 0, 0) + i * 1000,
        exerciseText: "x",
        correctAnswer: 1,
        userAnswer: 0,
      })),
    },
  });
  const tone = base.patternDiagnostics?.subjects?.math?.parentTopicToneByKey?.[kG2Easy];
  assert.ok(
    tone !== "true_weakness",
    `AT3: unscoped mistakes alone must not yield true_weakness (got ${tone})`
  );
}

at1_twoScopedAdditionRows();
at2_mistakeCountsOnlyOnMatchingScope();
at3_unscopedMistakesDoNotForceTrueWeakness();

console.log("math-scoped-topic-rows-acceptance: AT1–AT3 OK");
