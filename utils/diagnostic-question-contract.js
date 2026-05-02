/**
 * Phase 3C — optional diagnostic metadata on questions / pool rows (additive contract).
 * Not every field is required. Consumers merge into `question.params` (and pool rows that feed params).
 *
 * @typedef {object} DiagnosticQuestionContract
 * @property {string} [diagnosticSkillId] — stable id for probe map + analytics
 * @property {string} [patternFamily]
 * @property {string} [conceptTag]
 * @property {string} [kind]
 * @property {string} [subtype]
 * @property {string} [distractorFamily]
 * @property {"low"|"medium"|"high"} [probePower]
 * @property {string[]} [expectedErrorTags] — normalized tag ids; merged into infer-tags for wrong events
 * @property {string} [nextProbeSkillId] — optional override hint for fast diagnosis
 * @property {string} [explanationHe] — short Hebrew note for maintainers / internal tooling (not parent-facing by default)
 */

/** @type {(keyof DiagnosticQuestionContract)[]} */
export const DIAGNOSTIC_CONTRACT_KEYS = [
  "diagnosticSkillId",
  "patternFamily",
  "conceptTag",
  "kind",
  "subtype",
  "distractorFamily",
  "probePower",
  "expectedErrorTags",
  "nextProbeSkillId",
  "explanationHe",
];

/**
 * Pick contract fields from a pool row / partial object.
 *
 * @param {Record<string, unknown>|null|undefined} row
 * @returns {Record<string, unknown>}
 */
export function pickDiagnosticContractFields(row) {
  if (!row || typeof row !== "object") return {};
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const key of DIAGNOSTIC_CONTRACT_KEYS) {
    if (!(key in row)) continue;
    const v = row[key];
    if (v === undefined || v === null) continue;
    if (key === "expectedErrorTags") {
      if (Array.isArray(v)) out[key] = v.map(String).filter(Boolean);
      continue;
    }
    out[key] = v;
  }
  return out;
}

/**
 * Merge diagnostic contract into existing `params` (additive).
 *
 * @param {Record<string, unknown>} params
 * @param {Record<string, unknown>|null|undefined} contractOrRow
 */
export function mergeDiagnosticContractIntoParams(params, contractOrRow) {
  const base = params && typeof params === "object" ? params : {};
  const patch = pickDiagnosticContractFields(contractOrRow);
  return Object.keys(patch).length ? { ...base, ...patch } : base;
}
