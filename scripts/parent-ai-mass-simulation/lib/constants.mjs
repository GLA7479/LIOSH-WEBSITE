/** @type {readonly string[]} */
export const PROFILE_TYPES = [
  "strong_stable",
  "weak_all_subjects",
  "weak_math",
  "weak_hebrew",
  "weak_english",
  "improving_student",
  "declining_student",
  "inconsistent_student",
  "random_guessing",
  "fast_wrong",
  "slow_correct",
  "repeated_misconception",
  "prerequisite_gap",
  "thin_data",
  "rich_data",
  "mixed_strengths",
  "reading_comprehension_gap",
  "calculation_errors",
  "word_problem_gap",
  "topic_specific_gap",
  "external_question_flow",
  "six_subject_mixed_profile",
];

/** Canonical subjects aligned with engine / metadata naming */
export const SUBJECT_KEYS = ["hebrew", "math", "english", "science", "geometry", "moledet_geography"];

/** Topic buckets per subject (labels for simulation + indexes) */
export const TOPICS_BY_SUBJECT = {
  hebrew: [
    "reading_comprehension",
    "vocabulary",
    "fact_vs_opinion",
    "sequence",
    "main_idea",
    "inference",
  ],
  math: [
    "addition",
    "subtraction",
    "multiplication",
    "division",
    "fractions",
    "word_problems",
    "place_value",
    "comparison",
    "patterns",
  ],
  english: ["vocabulary", "sentence_understanding", "matching", "reading_comprehension", "grammar_basics"],
  science: ["animals_plants", "body", "materials", "environment", "basic_experiments"],
  geometry: ["shapes", "angles", "perimeter", "area", "symmetry"],
  moledet_geography: ["map_reading", "places", "directions", "community", "basic_geography"],
};

export const DIFFICULTIES = ["easy", "medium", "hard", "mixed"];

export const GRADE_ORDER = ["g1", "g2", "g3", "g4", "g5", "g6"];
