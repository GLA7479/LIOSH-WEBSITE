/**
 * Phase 4-B3 — order English taxonomy candidates for conflict buckets only:
 * - `vocabulary`: E-01 vs E-05
 * - `grammar`: E-02 vs E-04
 *
 * Uses wrong-event metadata (patternFamily, kind, params, etc.) plus row grade/level only.
 * Row bucket/topic keys are excluded from the routing haystack so literal bucket names do not dominate.
 * Never removes candidates; only reorders when both conflict ids are present.
 */

/** Longer / more specific phrases first where possible to reduce double-counting. */
const E05_VOCAB_CONTEXT_INDICATORS = [
  "meaning_from_context",
  "vocabulary_context",
  "word_in_context",
  "sentence_context",
  "false_friend",
  "misleading_word",
  "collocation",
  "word_combination",
  "choose_word",
  "usage",
  "in_context",
  "context_clue",
  "preposition_context",
];

const E01_VOCAB_BASIC_INDICATORS = [
  "word_to_picture",
  "picture_match",
  "match_word",
  "identify_word",
  "word_meaning",
  "word_bank",
  "known_word",
  "vocab_basic",
  "vocabulary",
  "translation",
  "recall",
];

const E04_GRAMMAR_STRUCTURE_INDICATORS = [
  "sentence_structure",
  "phrase_structure",
  "sentence_building",
  "building_sentence",
  "build_sentence",
  "grammar_context",
  "sentence_meaning",
  "word_order",
  "connectors",
  "connector",
  "structure",
];

const E02_GRAMMAR_BASIC_INDICATORS = [
  "grammar_basic",
  "sentence_grammar",
  "subject_verb",
  "verb_form",
  "he_she_it",
  "do_does",
  "has_have",
  "is_are_am",
  "pronoun",
  "agreement",
  "tense",
  "present",
  "past",
];

/**
 * @param {unknown} ev
 * @returns {string}
 */
function haystackForWrong(ev) {
  if (!ev || typeof ev !== "object") return "";
  const e = /** @type {Record<string, unknown>} */ (ev);
  const parts = [];
  for (const k of ["patternFamily", "kind", "conceptTag", "diagnosticSkillId", "topicOrOperation"]) {
    if (e[k] != null && String(e[k]).trim()) parts.push(String(e[k]));
  }
  const params = e.params;
  if (params && typeof params === "object") {
    const p = /** @type {Record<string, unknown>} */ (params);
    for (const k of ["kind", "patternFamily", "operation", "conceptTag", "diagnosticSkillId", "semanticFamily", "contract"]) {
      if (p[k] != null && String(p[k]).trim()) parts.push(String(p[k]));
    }
    try {
      parts.push(JSON.stringify(p).toLowerCase());
    } catch {
      /* ignore */
    }
    const contract = p.contract;
    if (contract && typeof contract === "object") {
      try {
        parts.push(JSON.stringify(contract).toLowerCase());
      } catch {
        /* ignore */
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

/**
 * Grade / level only — avoids bucket/topic literals skewing scores.
 *
 * @param {unknown} row
 * @returns {string}
 */
function rowGradeLevelHaystack(row) {
  const parts = [];
  if (row && typeof row === "object") {
    const r = /** @type {Record<string, unknown>} */ (row);
    for (const k of ["levelKey", "gradeKey"]) {
      if (r[k] != null && String(r[k]).trim()) parts.push(String(r[k]).toLowerCase());
    }
  }
  return parts.join(" ");
}

/**
 * @param {string} hay
 * @param {readonly string[]} phrases
 * @returns {number}
 */
function countIndicatorHits(hay, phrases) {
  let n = 0;
  for (const ph of phrases) {
    if (!ph) continue;
    if (hay.includes(ph)) n += 1;
  }
  return n;
}

/**
 * @param {unknown[]} wrongEvents
 * @param {unknown} [row]
 * @returns {{ e01Score: number; e05Score: number }}
 */
export function englishVocabularyRoutingScores(wrongEvents, row) {
  const rowHay = rowGradeLevelHaystack(row);
  let e01Score = 0;
  let e05Score = 0;
  const list = Array.isArray(wrongEvents) ? wrongEvents : [];
  for (const ev of list) {
    const wh = `${rowHay} ${haystackForWrong(ev)}`.trim().toLowerCase();
    e01Score += countIndicatorHits(wh, E01_VOCAB_BASIC_INDICATORS);
    e05Score += countIndicatorHits(wh, E05_VOCAB_CONTEXT_INDICATORS);
  }
  return { e01Score, e05Score };
}

/**
 * @param {unknown[]} wrongEvents
 * @param {unknown} [row]
 * @returns {{ e02Score: number; e04Score: number }}
 */
export function englishGrammarRoutingScores(wrongEvents, row) {
  const rowHay = rowGradeLevelHaystack(row);
  let e02Score = 0;
  let e04Score = 0;
  const list = Array.isArray(wrongEvents) ? wrongEvents : [];
  for (const ev of list) {
    const wh = `${rowHay} ${haystackForWrong(ev)}`.trim().toLowerCase();
    e02Score += countIndicatorHits(wh, E02_GRAMMAR_BASIC_INDICATORS);
    e04Score += countIndicatorHits(wh, E04_GRAMMAR_STRUCTURE_INDICATORS);
  }
  return { e02Score, e04Score };
}

/**
 * @param {string[]} candidateIds
 * @param {string} a
 * @param {string} b
 * @param {boolean} preferA
 * @param {boolean} preferB
 * @returns {string[]}
 */
function reorderConflictPair(candidateIds, a, b, preferA, preferB) {
  const rest = candidateIds.filter((id) => id !== a && id !== b);
  if (preferA && !preferB) return [a, b, ...rest];
  if (preferB && !preferA) return [b, a, ...rest];
  return [...candidateIds];
}

/**
 * Reorders E-01/E-05 on `vocabulary`, and E-02/E-04 on `grammar`, when both appear.
 *
 * @param {string[]} candidateIds
 * @param {unknown[]} wrongEvents
 * @param {{ row?: unknown; bucketKey?: string }} [ctx]
 * @returns {string[]}
 */
export function orderEnglishTaxonomyCandidates(candidateIds, wrongEvents, ctx = {}) {
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) return candidateIds ? [...candidateIds] : [];
  const bucketKey = String(ctx.bucketKey || "").trim().toLowerCase();

  if (bucketKey === "vocabulary") {
    const has1 = candidateIds.includes("E-01");
    const has5 = candidateIds.includes("E-05");
    if (has1 && has5) {
      const { e01Score, e05Score } = englishVocabularyRoutingScores(wrongEvents, ctx.row);
      if (e01Score > e05Score) {
        return reorderConflictPair(candidateIds, "E-01", "E-05", true, false);
      }
      if (e05Score > e01Score) {
        return reorderConflictPair(candidateIds, "E-01", "E-05", false, true);
      }
      return [...candidateIds];
    }
  }

  if (bucketKey === "grammar") {
    const has2 = candidateIds.includes("E-02");
    const has4 = candidateIds.includes("E-04");
    if (has2 && has4) {
      const { e02Score, e04Score } = englishGrammarRoutingScores(wrongEvents, ctx.row);
      if (e02Score > e04Score) {
        return reorderConflictPair(candidateIds, "E-02", "E-04", true, false);
      }
      if (e04Score > e02Score) {
        return reorderConflictPair(candidateIds, "E-02", "E-04", false, true);
      }
      return [...candidateIds];
    }
  }

  return [...candidateIds];
}
