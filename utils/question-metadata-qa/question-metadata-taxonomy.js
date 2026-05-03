/**
 * Controlled metadata taxonomy: canonical English ids for code fields.
 * User-facing copy stays Hebrew in banks; this module is for validation and enrichment planning only.
 */

export const TAXONOMY_VERSION = 1;

/** Ordered topic domains used in `data/science-questions.js` (topic + derived skillId). */
export const SCIENCE_TOPIC_ORDER = [
  "body",
  "animals",
  "plants",
  "materials",
  "earth_space",
  "environment",
  "experiments",
];

/**
 * Science skillIds observed in static bank (topic-as-skill + explicit diagnostic ids).
 * Keep in sync with scanner `effectiveSkillId` results for this file.
 */
export const SCIENCE_SKILL_IDS = new Set([
  ...SCIENCE_TOPIC_ORDER,
  "sci_body_fact_recall",
  "sci_respiration_concept",
]);

/**
 * Subskill allowlist by skillId. Empty set = only "missing" checks apply, not "unknown".
 * Includes template ids we suggest in enrichment and legacy patternFamily rows.
 */
function buildScienceSubskillAllowlist() {
  /** @type {Record<string, Set<string>>} */
  const m = {};
  for (const t of SCIENCE_TOPIC_ORDER) {
    m[t] = new Set([`sci_${t}_general`]);
  }
  m.sci_body_fact_recall = new Set(["science_body_heart_location", "science_body_sense_organs"]);
  m.sci_respiration_concept = new Set(["science_respiratory_gas_exchange", "sci_respiration_general"]);
  return m;
}

export const SCIENCE_SUBSKILL_ALLOWLIST_BY_SKILL = buildScienceSubskillAllowlist();

/** Recommended base difficulty (extendable). */
export const CANONICAL_DIFFICULTY = new Set([
  "intro",
  "basic",
  "standard",
  "advanced",
  "challenge",
]);

/** Legacy / in-repo normalizations still accepted. */
export const LEGACY_DIFFICULTY = new Set(["easy", "medium", "hard", "low", "high"]);

/** Union used by scanner validation. */
export const ALL_VALID_DIFFICULTY = new Set([...CANONICAL_DIFFICULTY, ...LEGACY_DIFFICULTY]);

export const CANONICAL_COGNITIVE_LEVELS = new Set([
  "recall",
  "understanding",
  "application",
  "analysis",
]);

/** Legacy values still present in data / heuristics. */
export const LEGACY_COGNITIVE_LEVELS = new Set(["reasoning", "multi_step"]);

export const ALL_VALID_COGNITIVE_LEVELS = new Set([
  ...CANONICAL_COGNITIVE_LEVELS,
  ...LEGACY_COGNITIVE_LEVELS,
]);

/**
 * Core generic error families (diagnostic engine).
 * @type {string[]}
 */
export const GENERIC_EXPECTED_ERROR_TYPES = [
  "misconception",
  "calculation_error",
  "vocabulary_confusion",
  "reading_comprehension_error",
  "grammar_error",
  "concept_confusion",
  "prerequisite_gap",
  "careless_error",
  "strategy_error",
  "incomplete_answer",
];

/**
 * Bank-specific / existing tags in science pool (do not require human rename before taxonomy match).
 */
export const EXTENDED_EXPECTED_ERROR_TYPES = new Set([
  ...GENERIC_EXPECTED_ERROR_TYPES,
  "fact_recall_gap",
  "classification_error",
  "cause_effect_gap",
  "system_confusion",
  "terminology_mixup",
  "procedural_error",
  "data_reading_error",
  "model_misuse",
  "overgeneralization",
  "unit_or_scale_error",
  /** Hebrew rich pool / comprehension tagging */
  "comprehension_gap",
  "detail_recall_error",
]);

export const TAXONOMY_ISSUE_CODES = {
  taxonomy_unknown_skillId: "taxonomy_unknown_skillId",
  taxonomy_unknown_subskillId: "taxonomy_unknown_subskillId",
  taxonomy_unknown_expected_error_type: "taxonomy_unknown_expected_error_type",
  taxonomy_unknown_prerequisite_skillId: "taxonomy_unknown_prerequisite_skillId",
};

/**
 * Readiness rubric metadata (documentation / reporting helpers — advisory).
 */
export const READINESS_RULES = {
  strong: "Skill ≥85% coverage, subskill ≥50%, avg completeness ≥0.65, high-risk share <8%.",
  medium: "Skill coverage usable but substantial gaps in cognitive/errors/prereqs.",
  weak: "Large missing skill or inconsistent tagging.",
  missing: "Skill id largely absent — diagnosis routing unreliable.",
};

/**
 * Map legacy difficulty to canonical suggestion labels (enrichment).
 * @param {string} d
 */
export function mapDifficultyToCanonical(d) {
  const x = String(d || "").toLowerCase();
  if (x === "easy" || x === "low" || x === "intro") return "basic";
  if (x === "medium" || x === "standard") return "standard";
  if (x === "hard" || x === "high") return "advanced";
  if (CANONICAL_DIFFICULTY.has(x)) return x;
  return "standard";
}

/**
 * Infer cognitive level for science rows from probePower / difficulty heuristics.
 * @param {Record<string, unknown>} params
 * @param {string} difficultyNormalized easy|medium|hard or canonical
 */
export function inferScienceCognitiveLevel(params, difficultyNormalized) {
  const pp = String(params.probePower || "").toLowerCase();
  if (pp === "high") return "application";
  if (pp === "medium") return "understanding";
  if (pp === "low") return "recall";
  const d = String(difficultyNormalized || "").toLowerCase();
  if (d === "easy" || d === "basic" || d === "intro") return "recall";
  if (d === "hard" || d === "advanced" || d === "challenge") return "analysis";
  return "understanding";
}

/**
 * @param {object} record — scan record from buildScanRecord
 * @returns {string[]} additional issue codes
 */
export function validateTaxonomyForRecord(record) {
  /** @type {string[]} */
  const issues = [];

  const subject = record.subject || "";
  if (!subject) return issues;

  const skillId = record.skillId || "";
  const subskillId = record.subskillId || "";

  if (subject === "science") {
    if (skillId && !SCIENCE_SKILL_IDS.has(skillId)) {
      issues.push(TAXONOMY_ISSUE_CODES.taxonomy_unknown_skillId);
    }
    if (skillId && subskillId) {
      const allow = SCIENCE_SUBSKILL_ALLOWLIST_BY_SKILL[skillId];
      if (allow && !allow.has(subskillId)) {
        issues.push(TAXONOMY_ISSUE_CODES.taxonomy_unknown_subskillId);
      }
    }
  }

  const errs = record.expectedErrorTypes || [];
  for (const e of errs) {
    const t = String(e).trim();
    if (t && !EXTENDED_EXPECTED_ERROR_TYPES.has(t)) {
      issues.push(TAXONOMY_ISSUE_CODES.taxonomy_unknown_expected_error_type);
      break;
    }
  }

  if (subject === "science" && Array.isArray(record.prerequisiteSkillIds)) {
    for (const p of record.prerequisiteSkillIds) {
      const id = String(p).trim();
      if (!id) continue;
      if (!SCIENCE_SKILL_IDS.has(id)) {
        issues.push(TAXONOMY_ISSUE_CODES.taxonomy_unknown_prerequisite_skillId);
        break;
      }
    }
  }

  return [...new Set(issues)];
}
