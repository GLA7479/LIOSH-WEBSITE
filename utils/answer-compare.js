/**
 * Unified answer comparison for learning masters (Phase 1 contract).
 * All subjects must route learner-facing correctness through compareAnswers — see plan.
 */

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

/**
 * @param {object} p
 * @param {"exact_text"|"mcq_index"|"exact_integer"} p.mode
 * @param {unknown} p.user
 * @param {unknown} [p.expected] — for exact_text: canonical correct string; for exact_integer: numeric correct answer
 * @param {unknown[]} [p.acceptedList] — optional extra accepted strings (exact_text)
 * @param {unknown} [p.expectedIndex] — for mcq_index
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
 * MCQ SAFETY RULE (dev only): duplicate option strings break index-only semantics.
 * @param {string[]|undefined|null} options
 * @param {unknown} questionId
 */
export function warnDuplicateMcqOptionsDevOnly(options, questionId) {
  try {
    if (typeof process === "undefined" || !process.env || process.env.NODE_ENV !== "development") {
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
    console.warn("[science][mcq-safety] duplicate option strings", { id: questionId, options: arr });
  }
}
