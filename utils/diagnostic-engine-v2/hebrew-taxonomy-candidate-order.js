/**
 * Phase 4-C2 — order Hebrew taxonomy candidates for conflict buckets only:
 * - `grammar`: H-02 vs H-06
 * - `writing`: H-03 vs H-07
 *
 * Uses wrong-event metadata (patternFamily, kind, params, etc.) plus row grade/level only.
 * Row bucket/topic display strings are excluded from the routing haystack so literal bucket names do not dominate.
 * Never removes candidates; only reorders when both conflict ids are present.
 */

/** Longer / more specific phrases first where possible to reduce double-counting. */
const H02_GRAMMAR_BASIC_INDICATORS = [
  "morphology_basic",
  "time_marker",
  "subject_verb",
  "function_word",
  "basic_rule",
  "grammar_basic",
  "verb_form",
  "agreement",
  "inflection",
  "tense",
  "gender",
  "number",
];

const H06_GRAMMAR_ADVANCED_INDICATORS = [
  "grammatical_analysis",
  "advanced_grammar",
  "complex_sentence",
  "sentence_relation",
  "relation_word",
  "formal_pattern",
  "root_pattern",
  "phrase_structure",
  "binyan",
  "connector",
  "syntax",
  "roots",
];

const H03_WRITING_BASIC_INDICATORS = [
  "writing_basic",
  "sentence_writing",
  "answer_phrasing",
  "short_response",
  "sentence_level",
  "written_answer",
  "handwriting",
  "punctuation",
  "spelling",
  "phrasing",
  "clarity",
  "edit_word",
];

const H07_WRITING_HIGHER_INDICATORS = [
  "writing_development",
  "formal_writing",
  "text_structure",
  "paragraph",
  "organization",
  "argument",
  "explanation",
  "evidence",
  "coherence",
  "cohesion",
  "revision",
  "editing",
  "structure",
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
 * @returns {{ h02Score: number; h06Score: number }}
 */
export function hebrewGrammarRoutingScores(wrongEvents, row) {
  const rowHay = rowGradeLevelHaystack(row);
  let h02Score = 0;
  let h06Score = 0;
  const list = Array.isArray(wrongEvents) ? wrongEvents : [];
  for (const ev of list) {
    if (!ev || typeof ev !== "object") continue;
    const wh = `${rowHay} ${haystackForWrong(ev)}`.trim().toLowerCase();
    h02Score += countIndicatorHits(wh, H02_GRAMMAR_BASIC_INDICATORS);
    h06Score += countIndicatorHits(wh, H06_GRAMMAR_ADVANCED_INDICATORS);
  }
  return { h02Score, h06Score };
}

/**
 * @param {unknown[]} wrongEvents
 * @param {unknown} [row]
 * @returns {{ h03Score: number; h07Score: number }}
 */
export function hebrewWritingRoutingScores(wrongEvents, row) {
  const rowHay = rowGradeLevelHaystack(row);
  let h03Score = 0;
  let h07Score = 0;
  const list = Array.isArray(wrongEvents) ? wrongEvents : [];
  for (const ev of list) {
    if (!ev || typeof ev !== "object") continue;
    const wh = `${rowHay} ${haystackForWrong(ev)}`.trim().toLowerCase();
    h03Score += countIndicatorHits(wh, H03_WRITING_BASIC_INDICATORS);
    h07Score += countIndicatorHits(wh, H07_WRITING_HIGHER_INDICATORS);
  }
  return { h03Score, h07Score };
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
 * Reorders H-02/H-06 on `grammar`, and H-03/H-07 on `writing`, when both appear.
 *
 * @param {string[]} candidateIds
 * @param {unknown[]} wrongEvents
 * @param {{ row?: unknown; bucketKey?: string }} [ctx]
 * @returns {string[]}
 */
export function orderHebrewTaxonomyCandidates(candidateIds, wrongEvents, ctx = {}) {
  if (!Array.isArray(candidateIds) || candidateIds.length === 0) return candidateIds ? [...candidateIds] : [];
  const bucketKey = String(ctx.bucketKey || "").trim().toLowerCase();

  if (bucketKey === "grammar") {
    const has2 = candidateIds.includes("H-02");
    const has6 = candidateIds.includes("H-06");
    if (has2 && has6) {
      const { h02Score, h06Score } = hebrewGrammarRoutingScores(wrongEvents, ctx.row);
      if (h02Score > h06Score) {
        return reorderConflictPair(candidateIds, "H-02", "H-06", true, false);
      }
      if (h06Score > h02Score) {
        return reorderConflictPair(candidateIds, "H-02", "H-06", false, true);
      }
      return [...candidateIds];
    }
  }

  if (bucketKey === "writing") {
    const has3 = candidateIds.includes("H-03");
    const has7 = candidateIds.includes("H-07");
    if (has3 && has7) {
      const { h03Score, h07Score } = hebrewWritingRoutingScores(wrongEvents, ctx.row);
      if (h03Score > h07Score) {
        return reorderConflictPair(candidateIds, "H-03", "H-07", true, false);
      }
      if (h07Score > h03Score) {
        return reorderConflictPair(candidateIds, "H-03", "H-07", false, true);
      }
      return [...candidateIds];
    }
  }

  return [...candidateIds];
}
