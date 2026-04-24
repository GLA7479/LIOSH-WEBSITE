/**
 * Unified answer comparison for learning masters (Phase 1 contract).
 * All subjects must route learner-facing correctness through compareAnswers — see plan.
 */

import { normalizeAnswerForSpellingNiqqudStrict } from "./hebrew-spelling-niqqud";

/**
 * English-style normalization: quotes, edge punctuation, collapse whitespace, ASCII lower.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeAnswerExactText(value) {
  return String(value ?? "")
    .replace(/[\u201c\u201d\u05f4]/g, '"')
    .replace(/[\u2018\u2019\u05f3]/g, "'")
    .replace(/^[\s"'`.,!?;:()[\]{}\-–—]+|[\s"'`.,!?;:()[\]{}\-–—]+$/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const HEBREW_NIQQUD_RE = /[\u0591-\u05C7]/g;
const SURROUNDING_PUNCT_RE =
  /^[\s"'`׳״“”‘’.,!?;:()[\]{}\-–—]+|[\s"'`׳״“”‘’.,!?;:()[\]{}\-–—]+$/g;

/**
 * Hebrew relaxed compare (matches hebrew-master strip + punct rules; no wording changes).
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeHebrewRelaxedAnswer(value) {
  return String(value ?? "")
    .replace(/[“”״]/g, '"')
    .replace(/[‘’׳]/g, "'")
    .replace(HEBREW_NIQQUD_RE, "")
    .replace(SURROUNDING_PUNCT_RE, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * @param {object} p
 * @param {"exact_text"|"mcq_index"|"exact_integer"|"trim_string_equal"|"numeric_absolute_tolerance"|"numeric_scale_relative_tolerance"|"hebrew_relaxed_text"|"hebrew_niqqud_strict"} p.mode
 * @param {unknown} p.user
 * @param {unknown} [p.expected] — for exact_text: canonical correct string; for exact_integer: numeric correct answer
 * @param {unknown[]} [p.acceptedList] — optional extra accepted strings (exact_text, hebrew_*)
 * @param {unknown} [p.expectedIndex] — for mcq_index
 * @param {number} [p.tolerance] — required for numeric_absolute_tolerance (caller supplies; e.g. math 0.01)
 * @param {number} [p.scaleFloor] — required for numeric_scale_relative_tolerance
 * @param {number} [p.relativeFactor] — required for numeric_scale_relative_tolerance
 * @param {number} [p.minTolerance] — required for numeric_scale_relative_tolerance
 * @returns {{ isCorrect: boolean }}
 */
export function compareAnswers(p) {
  const mode = String(p?.mode || "");
  if (mode === "mcq_index") {
    const a = Number(p.user);
    const b = Number(p.expectedIndex);
    return { isCorrect: Number.isFinite(a) && Number.isFinite(b) && a === b };
  }
  if (mode === "exact_integer") {
    const raw = String(p.user ?? "").trim();
    const u = raw === "" ? NaN : parseInt(raw, 10);
    const e = Number(p.expected);
    return {
      isCorrect: Number.isFinite(u) && Number.isFinite(e) && u === e,
    };
  }
  if (mode === "trim_string_equal") {
    const u = String(p.user ?? "").trim();
    const e = String(p.expected ?? "").trim();
    return { isCorrect: u === e };
  }
  if (mode === "numeric_absolute_tolerance") {
    const tol = Number(p.tolerance);
    if (!Number.isFinite(tol) || tol <= 0) {
      throw new Error(
        `compareAnswers: mode "${mode}" requires finite positive tolerance from caller`
      );
    }
    const a = p.user;
    const b = p.expected;
    if (a === b) {
      return { isCorrect: true };
    }
    if (
      typeof a === "number" &&
      typeof b === "number" &&
      !isNaN(a) &&
      !isNaN(b) &&
      Math.abs(a - b) < tol
    ) {
      return { isCorrect: true };
    }
    return { isCorrect: false };
  }
  if (mode === "numeric_scale_relative_tolerance") {
    const sf = Number(p.scaleFloor);
    const rf = Number(p.relativeFactor);
    const mt = Number(p.minTolerance);
    if (
      !Number.isFinite(sf) ||
      !Number.isFinite(rf) ||
      !Number.isFinite(mt) ||
      sf <= 0 ||
      rf <= 0 ||
      mt <= 0
    ) {
      throw new Error(
        `compareAnswers: mode "${mode}" requires finite positive scaleFloor, relativeFactor, minTolerance from caller`
      );
    }
    const a = Number(p.user);
    const b = Number(p.expected);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return { isCorrect: false };
    }
    const scale = Math.max(Math.abs(a), Math.abs(b), sf);
    const tol = Math.max(mt, scale * rf);
    return { isCorrect: Math.abs(a - b) <= tol };
  }
  if (mode === "hebrew_relaxed_text") {
    const norm = normalizeHebrewRelaxedAnswer;
    const baseList =
      Array.isArray(p.acceptedList) && p.acceptedList.length > 0
        ? p.acceptedList
        : p.expected != null
          ? [p.expected]
          : [];
    const u = norm(p.user);
    const ok = baseList.some((c) => norm(c) === u);
    return { isCorrect: ok };
  }
  if (mode === "hebrew_niqqud_strict") {
    const baseList =
      Array.isArray(p.acceptedList) && p.acceptedList.length > 0
        ? p.acceptedList
        : p.expected != null
          ? [p.expected]
          : [];
    const u = normalizeAnswerForSpellingNiqqudStrict(p.user);
    const ok = baseList.some(
      (c) => normalizeAnswerForSpellingNiqqudStrict(c) === u
    );
    return { isCorrect: ok };
  }
  if (mode === "exact_text") {
    const norm = normalizeAnswerExactText;
    const expected = p.expected;
    const baseList =
      Array.isArray(p.acceptedList) && p.acceptedList.length > 0
        ? p.acceptedList
        : expected != null
          ? [expected]
          : [];
    const u = norm(p.user);
    const ok = baseList.some((c) => norm(c) === u);
    return { isCorrect: ok };
  }
  throw new Error(`compareAnswers: unsupported mode "${mode}"`);
}

/**
 * Math learner answer (same rules as math-master handleAnswer): fractions, comparison signs, numeric tolerance.
 * Caller must pass numericTolerance (e.g. 0.01 from math-master); no default inside.
 * @param {{ user: unknown, correctAnswer: unknown, numericTolerance: number }} p
 * @returns {{ isCorrect: boolean, rejectInvalidNumber: boolean, selectedValue: unknown }}
 */
export function compareMathLearnerAnswer(p) {
  const tol = Number(p.numericTolerance);
  if (!Number.isFinite(tol) || tol <= 0) {
    throw new Error(
      "compareMathLearnerAnswer: numericTolerance must be a finite positive number from caller"
    );
  }
  const user = p.user;
  const correctAnswer = p.correctAnswer;

  let numericAnswer;
  let isStringAnswer = false;

  if (typeof user === "string") {
    const trimmed = user.trim();
    if (trimmed === "<" || trimmed === ">" || trimmed === "=") {
      isStringAnswer = true;
      numericAnswer = trimmed;
    } else if (
      trimmed.includes("/") ||
      trimmed.includes(" ") ||
      isNaN(parseFloat(trimmed))
    ) {
      isStringAnswer = true;
      numericAnswer = trimmed;
    } else {
      const parsed = parseFloat(trimmed);
      if (isNaN(parsed)) {
        return {
          isCorrect: false,
          rejectInvalidNumber: true,
          selectedValue: trimmed,
        };
      }
      numericAnswer = parsed;
    }
  } else {
    numericAnswer = user;
  }

  const correctAnswerStr = String(correctAnswer).trim();
  const isComparisonAnswer =
    correctAnswerStr === "<" ||
    correctAnswerStr === ">" ||
    correctAnswerStr === "=";

  let isCorrect;
  if (
    isStringAnswer ||
    isComparisonAnswer ||
    (typeof correctAnswer === "string" &&
      (correctAnswer.includes("/") ||
        correctAnswer.includes(" ") ||
        isNaN(parseFloat(correctAnswer))))
  ) {
    isCorrect =
      String(numericAnswer).trim() === String(correctAnswer).trim();
  } else {
    const correctNumericAnswer =
      typeof correctAnswer === "string"
        ? parseFloat(correctAnswer.trim())
        : correctAnswer;
    isCorrect =
      numericAnswer === correctNumericAnswer ||
      (typeof numericAnswer === "number" &&
        typeof correctNumericAnswer === "number" &&
        !isNaN(numericAnswer) &&
        !isNaN(correctNumericAnswer) &&
        Math.abs(numericAnswer - correctNumericAnswer) < tol);
  }

  return {
    isCorrect,
    rejectInvalidNumber: false,
    selectedValue: numericAnswer,
  };
}

/**
 * Geometry learner answer (same rules as geometry-master handleAnswer).
 * Caller passes scaleFloor, relativeFactor, minTolerance (e.g. 1e-6, 1e-5, 1e-9); no defaults inside.
 * @param {{ user: unknown, correctAnswer: unknown, scaleFloor: number, relativeFactor: number, minTolerance: number }} p
 * @returns {{ isCorrect: boolean }}
 */
export function compareGeometryLearnerAnswer(p) {
  const sf = Number(p.scaleFloor);
  const rf = Number(p.relativeFactor);
  const mt = Number(p.minTolerance);
  if (
    !Number.isFinite(sf) ||
    !Number.isFinite(rf) ||
    !Number.isFinite(mt) ||
    sf <= 0 ||
    rf <= 0 ||
    mt <= 0
  ) {
    throw new Error(
      "compareGeometryLearnerAnswer: scaleFloor, relativeFactor, minTolerance must be finite positive numbers from caller"
    );
  }
  const user = p.user;
  const correctAnswer = p.correctAnswer;

  const toNumeric = (v) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v !== "string") return null;
    const cleaned = v.trim().replace(",", ".");
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const answerNum = toNumeric(user);
  const correctNum = toNumeric(correctAnswer);
  if (answerNum != null && correctNum != null) {
    const a = answerNum;
    const b = correctNum;
    const scale = Math.max(Math.abs(a), Math.abs(b), sf);
    const tol = Math.max(mt, scale * rf);
    return { isCorrect: Math.abs(a - b) <= tol };
  }
  return {
    isCorrect:
      String(user ?? "").trim() === String(correctAnswer ?? "").trim(),
  };
}

/**
 * MCQ SAFETY RULE (dev only): duplicate option strings break index-only semantics.
 * @param {string[]|undefined|null} options
 * @param {unknown} questionId
 */
export function warnDuplicateMcqOptionsDevOnly(options, questionId) {
  try {
    if (
      typeof process === "undefined" ||
      !process.env ||
      process.env.NODE_ENV !== "development"
    ) {
      return;
    }
  } catch {
    return;
  }
  const arr = Array.isArray(options) ? options.map((x) => String(x ?? "")) : [];
  if (arr.length === 0) return;
  const uniq = new Set(arr);
  if (uniq.size < arr.length) {
    // eslint-disable-next-line no-console
    console.warn("[science][mcq-safety] duplicate option strings", {
      id: questionId,
      options: arr,
    });
  }
}
