export const PRODUCT_DISPLAY_NAME = "LEOK";
export const INTERNAL_STORAGE_NAMESPACE = "mleo_*";

export const STORAGE_KEYS = Object.freeze([
  "mleo_player_name",
  "mleo_time_tracking",
  "mleo_math_master_progress",
  "mleo_mistakes",
  "mleo_geometry_time_tracking",
  "mleo_geometry_master_progress",
  "mleo_geometry_mistakes",
  "mleo_english_time_tracking",
  "mleo_english_master_progress",
  "mleo_english_mistakes",
  "mleo_science_time_tracking",
  "mleo_science_master_progress",
  "mleo_science_mistakes",
  "mleo_hebrew_time_tracking",
  "mleo_hebrew_master_progress",
  "mleo_hebrew_mistakes",
  "mleo_moledet_geography_time_tracking",
  "mleo_moledet_geography_master_progress",
  "mleo_moledet_geography_mistakes",
  "mleo_daily_challenge",
  "mleo_weekly_challenge",
]);

export const SUBJECTS = Object.freeze([
  "math",
  "geometry",
  "english",
  "science",
  "hebrew",
  "moledet-geography",
]);

export const SUBJECT_BUCKETS = Object.freeze({
  math: ["addition", "subtraction", "multiplication", "division", "fractions", "word_problems"],
  geometry: ["area", "perimeter", "angles", "shapes_basic", "volume"],
  english: ["vocabulary", "grammar", "translation", "sentences", "writing"],
  science: ["animals", "plants", "materials", "earth_space", "body", "environment"],
  hebrew: ["reading", "comprehension", "grammar", "vocabulary", "writing"],
  "moledet-geography": ["homeland", "community", "citizenship", "geography", "maps", "values"],
});
