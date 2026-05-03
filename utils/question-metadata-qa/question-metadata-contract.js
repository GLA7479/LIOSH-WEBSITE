/**
 * Question metadata QA — shared vocabulary (English identifiers only).
 * Does not validate product Hebrew content.
 */

import {
  ALL_VALID_COGNITIVE_LEVELS,
  ALL_VALID_DIFFICULTY,
  TAXONOMY_ISSUE_CODES,
} from "./question-metadata-taxonomy.js";

/** @typedef {"low"|"medium"|"high"} RiskLevel */

/** Canonical + legacy difficulty labels (see `question-metadata-taxonomy.js`). */
export const COGNITIVE_LEVELS_VALID = ALL_VALID_COGNITIVE_LEVELS;

export const DIFFICULTY_VALID = ALL_VALID_DIFFICULTY;

/** Minimum questions per skillId to consider skill coverage adequate for diagnosis heuristics */
export const MIN_QUESTIONS_PER_SKILL_FOR_DIAGNOSIS = 5;

export const ISSUE_CODES = {
  implicit_id_only: "implicit_id_only",
  duplicate_id: "duplicate_id",
  missing_subject: "missing_subject",
  missing_skillId: "missing_skillId",
  missing_subskillId: "missing_subskillId",
  missing_difficulty: "missing_difficulty",
  missing_cognitiveLevel: "missing_cognitiveLevel",
  missing_expected_error_types: "missing_expected_error_types",
  expected_error_types_empty: "expected_error_types_empty",
  missing_prerequisite_skill_ids: "missing_prerequisite_skill_ids",
  prerequisite_skill_ids_empty: "prerequisite_skill_ids_empty",
  missing_correct_answer: "missing_correct_answer",
  missing_explanation: "missing_explanation",
  invalid_difficulty: "invalid_difficulty",
  invalid_cognitive_level: "invalid_cognitive_level",
  misconception_diagnosis_unsupported: "misconception_diagnosis_unsupported",
  prerequisite_diagnosis_unsupported: "prerequisite_diagnosis_unsupported",
  skill_low_volume: "skill_low_volume",
  ...TAXONOMY_ISSUE_CODES,
};

/** Weighted field keys for metadataCompletenessScore (sum weights = 1) */
export const COMPLETENESS_WEIGHTS = {
  id: 0.08,
  subject: 0.1,
  skillId: 0.14,
  subskillId: 0.1,
  difficulty: 0.1,
  cognitiveLevel: 0.1,
  expectedErrorTypes: 0.12,
  prerequisiteSkillIds: 0.08,
  correctAnswer: 0.1,
  explanation: 0.08,
};
