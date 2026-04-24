/**
 * Selftest for utils/answer-compare.js — run: npm run test:answer-compare
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const m = await import(pathToFileURL(join(ROOT, "utils", "answer-compare.js")).href);

const {
  compareAnswers,
  compareMathLearnerAnswer,
  compareGeometryLearnerAnswer,
  normalizeAnswerExactText,
  normalizeHebrewRelaxedAnswer,
} = m;

const TOL = 0.01;

// --- compareAnswers core ---
assert.equal(
  compareAnswers({ mode: "exact_text", user: "Hello", expected: "hello" })
    .isCorrect,
  true
);
assert.equal(
  compareAnswers({
    mode: "exact_integer",
    user: " 7 ",
    expected: 7,
  }).isCorrect,
  true
);
assert.equal(
  compareAnswers({ mode: "exact_integer", user: "8", expected: 7 }).isCorrect,
  false
);
assert.equal(
  compareAnswers({ mode: "mcq_index", user: 2, expectedIndex: 2 }).isCorrect,
  true
);

// --- trim_string_equal ---
assert.equal(
  compareAnswers({
    mode: "trim_string_equal",
    user: "  3/4  ",
    expected: "3/4",
  }).isCorrect,
  true
);

// --- numeric_absolute_tolerance (caller supplies tolerance) ---
assert.equal(
  compareAnswers({
    mode: "numeric_absolute_tolerance",
    user: 2,
    expected: 2,
    tolerance: TOL,
  }).isCorrect,
  true
);
assert.equal(
  compareAnswers({
    mode: "numeric_absolute_tolerance",
    user: 2.005,
    expected: 2,
    tolerance: TOL,
  }).isCorrect,
  true
);
assert.equal(
  compareAnswers({
    mode: "numeric_absolute_tolerance",
    user: 2.02,
    expected: 2,
    tolerance: TOL,
  }).isCorrect,
  false
);

assert.throws(() =>
  compareAnswers({
    mode: "numeric_absolute_tolerance",
    user: 1,
    expected: 1,
  })
);

// --- numeric_scale_relative_tolerance (caller supplies all) ---
const SF = 1e-6;
const RF = 1e-5;
const MT = 1e-9;
assert.equal(
  compareAnswers({
    mode: "numeric_scale_relative_tolerance",
    user: 1.5,
    expected: 1.5,
    scaleFloor: SF,
    relativeFactor: RF,
    minTolerance: MT,
  }).isCorrect,
  true
);
assert.equal(
  compareAnswers({
    mode: "numeric_scale_relative_tolerance",
    user: 1.5,
    expected: 1.50000000001,
    scaleFloor: SF,
    relativeFactor: RF,
    minTolerance: MT,
  }).isCorrect,
  true
);

assert.throws(() =>
  compareAnswers({
    mode: "numeric_scale_relative_tolerance",
    user: 1,
    expected: 1,
    scaleFloor: SF,
    relativeFactor: RF,
  })
);

// --- compareMathLearnerAnswer (parity with math-master) ---
assert.equal(
  compareMathLearnerAnswer({
    user: "3/4",
    correctAnswer: "3/4",
    numericTolerance: TOL,
  }).isCorrect,
  true
);
assert.equal(
  compareMathLearnerAnswer({
    user: "<",
    correctAnswer: "<",
    numericTolerance: TOL,
  }).isCorrect,
  true
);
assert.equal(
  compareMathLearnerAnswer({
    user: "2.005",
    correctAnswer: 2,
    numericTolerance: TOL,
  }).isCorrect,
  true
);
assert.equal(
  compareMathLearnerAnswer({
    user: "2.02",
    correctAnswer: 2,
    numericTolerance: TOL,
  }).isCorrect,
  false
);
assert.throws(() =>
  compareMathLearnerAnswer({ user: 1, correctAnswer: 1 })
);

// --- compareGeometryLearnerAnswer ---
assert.equal(
  compareGeometryLearnerAnswer({
    user: "1,5",
    correctAnswer: "1.5",
    scaleFloor: SF,
    relativeFactor: RF,
    minTolerance: MT,
  }).isCorrect,
  true
);
assert.equal(
  compareGeometryLearnerAnswer({
    user: "  hello ",
    correctAnswer: "hello",
    scaleFloor: SF,
    relativeFactor: RF,
    minTolerance: MT,
  }).isCorrect,
  true
);

// --- Hebrew modes ---
assert.equal(
  compareAnswers({
    mode: "hebrew_relaxed_text",
    user: "  שלום  ",
    acceptedList: ["שלום"],
  }).isCorrect,
  true
);

// normalizeHebrewRelaxedAnswer export parity
const n1 = normalizeHebrewRelaxedAnswer('  א  ');
assert.ok(typeof n1 === "string" && n1.length > 0);
assert.equal(normalizeAnswerExactText("  Hi  "), "hi");

console.log("answer-compare-selftest: OK");
