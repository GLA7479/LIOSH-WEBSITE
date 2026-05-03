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
  /** Geometry conceptual bank — measurement / visual diagnostic tags */
  "shape_property_confusion",
  "formula_selection_error",
  "measurement_error",
  "unit_confusion",
  "visual_reasoning_error",
  "geometry_calculation_slip",
]);

/**
 * Per-skill subskill allowlist for `utils/geometry-conceptual-bank.js` scan results (`effectiveSubskillId`).
 */
function buildGeometrySubskillAllowlist() {
  /** @type {Record<string, Set<string>>} */
  const m = {};
  m["360_at_vertex"] = new Set(["angles_around_point"]);
  m["apex"] = new Set(["compare"]);
  m["apex_late"] = new Set(["compare_late"]);
  m["compare_area"] = new Set(["same_perimeter"]);
  m["congruent_def"] = new Set(["same_size_shape"]);
  m["corresponding"] = new Set(["concept_only"]);
  m["cube_faces"] = new Set(["cube"]);
  m["cube_faces_late"] = new Set(["cube_faces_late"]);
  m["d_2r"] = new Set(["relation"]);
  m["diag_equal_rect"] = new Set(["property"]);
  m["diag_equal_rect_late"] = new Set(["property_late"]);
  m["equilateral"] = new Set(["equal_sides"]);
  m["equilateral_late"] = new Set(["equal_sides_review"]);
  m["geo_angle_right_identify"] = new Set(["classification", "classification_late"]);
  m["geo_pv_area_vs_perimeter"] = new Set(["choose_measure", "choose_measure_floor", "fence", "fence_perimeter_project"]);
  m["geo_rect_area_plan"] = new Set(["area_rectangle", "area_rectangle_site"]);
  m["hyp_opposite_right"] = new Set(["hypotenuse_side"]);
  m["mirror"] = new Set(["meaning"]);
  m["mirror_flip"] = new Set(["reflection"]);
  m["mirror_late"] = new Set(["meaning_axis"]);
  m["not_always_both"] = new Set(["rhombus_rectangle"]);
  m["not_always_both_late"] = new Set(["rhombus_rectangle_late"]);
  m["one_obtuse_max"] = new Set(["obtuse_count"]);
  m["para_parallel"] = new Set(["parallelogram"]);
  m["para_parallel_late"] = new Set(["parallelogram_late"]);
  m["parallel_never_meet"] = new Set(["parallel_def"]);
  m["parallel_never_meet_late"] = new Set(["parallel_def_late"]);
  m["perim_to_side"] = new Set(["square_from_perimeter"]);
  m["perp_meeting"] = new Set(["definition"]);
  m["perp_meeting_late"] = new Set(["definition_late"]);
  m["perpendicular_to_base"] = new Set(["triangle"]);
  m["quarter_90"] = new Set(["degrees"]);
  m["rect_all_90"] = new Set(["rectangle_angles"]);
  m["rect_all_90_mid"] = new Set(["rectangle_angles_mid"]);
  m["slide"] = new Set(["translation"]);
  m["square_4_equal"] = new Set(["square_count"]);
  m["square_4_equal_mid"] = new Set(["square_count_mid"]);
  m["square_special"] = new Set(["square_rectangle"]);
  m["square_special_late"] = new Set(["square_rectangle_late"]);
  m["tri_sum_180"] = new Set(["inference"]);
  m["tri_sum_180_late"] = new Set(["inference_reasoning"]);
  m["unit_squares"] = new Set(["square_units"]);
  m["vol_box"] = new Set(["order_ops"]);
  m["volume_3d"] = new Set(["definition"]);
  m["volume_3d_late"] = new Set(["definition_capacity"]);
  m["wheel_rotation"] = new Set(["interpret"]);
  m["when_pyth"] = new Set(["first_step"]);
  return m;
}

export const GEOMETRY_SUBSKILL_ALLOWLIST_BY_SKILL = buildGeometrySubskillAllowlist();

/** Skill ids observed on geometry conceptual scan (`effectiveSkillId`). */
export const GEOMETRY_SKILL_IDS = new Set(Object.keys(GEOMETRY_SUBSKILL_ALLOWLIST_BY_SKILL));

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
 * Infer cognitive level for geometry conceptual rows (kind, pattern, optional probePower).
 * @param {Record<string, unknown>} raw
 * @param {string} difficultyNormalized
 */
export function inferGeometryCognitiveLevel(raw, difficultyNormalized) {
  const pp = String(raw.probePower || "").toLowerCase();
  if (pp === "high") return "analysis";
  if (pp === "medium") return "application";
  if (pp === "low") return "understanding";
  const kind = String(raw.kind || "");
  const pf = String(raw.patternFamily || "");
  if (kind.includes("compare") || pf.includes("shape_comparison")) return "analysis";
  if (kind.includes("multi_step")) return "application";
  if (kind.includes("reason")) return "understanding";
  if (pf.includes("triangle_angle_sum") || pf.includes("right_angle")) return "understanding";
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

  if (subject === "geometry") {
    if (skillId && !GEOMETRY_SKILL_IDS.has(skillId)) {
      issues.push(TAXONOMY_ISSUE_CODES.taxonomy_unknown_skillId);
    }
    if (skillId && subskillId) {
      const allow = GEOMETRY_SUBSKILL_ALLOWLIST_BY_SKILL[skillId];
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

  if (subject === "geometry" && Array.isArray(record.prerequisiteSkillIds)) {
    for (const p of record.prerequisiteSkillIds) {
      const id = String(p).trim();
      if (!id) continue;
      if (!GEOMETRY_SKILL_IDS.has(id)) {
        issues.push(TAXONOMY_ISSUE_CODES.taxonomy_unknown_prerequisite_skillId);
        break;
      }
    }
  }

  return [...new Set(issues)];
}
