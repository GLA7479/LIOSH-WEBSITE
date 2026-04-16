/**
 * Free-form parent utterance normalization (Hebrew-first, deterministic).
 * Used before intent, aggregate detection, and scope resolution — not a copy rewrite layer.
 */

/** Zero-width / BOM / word joiner */
const INVISIBLE_CHARS = /[\uFEFF\u200B-\u200D\u2060\u2061\u2062\u2063]/g;

/** Unicode spaces → regular space */
const WEIRD_SPACES = /[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g;

/**
 * @param {string|null|undefined} raw
 * @returns {string}
 */
export function normalizeFreeformParentUtteranceHe(raw) {
  let s = String(raw ?? "");
  s = s.normalize("NFKC");
  s = s.replace(INVISIBLE_CHARS, "");
  s = s.replace(/\u201C|\u201D|\u201E|\u00AB|\u00BB/g, '"');
  s = s.replace(/\u2018|\u2019|\u02BC/g, "'");
  s = s.replace(WEIRD_SPACES, " ").trim();
  return s;
}

/**
 * Fold for substring matching against anchored topic display names (strip cantillation only here).
 * @param {string|null|undefined} raw
 * @returns {string}
 */
export function foldUtteranceForHeMatch(raw) {
  const n = normalizeFreeformParentUtteranceHe(raw);
  return String(n)
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default { normalizeFreeformParentUtteranceHe, foldUtteranceForHeMatch };
