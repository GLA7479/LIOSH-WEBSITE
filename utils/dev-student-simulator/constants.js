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

/** Full topic/operation keys per subject — aligned with curriculum + report storage buckets. */
export { CANONICAL_SUBJECT_BUCKETS as SUBJECT_BUCKETS } from "./canonical-topic-keys.js";

/** Metadata presetId when sessions are built from the manual custom builder (not a DEV_STUDENT_PRESETS row). */
export const CUSTOM_SIMULATOR_PRESET_ID = "custom_manual_v1";

/** All generated simulator rows in storage must tag this `origin` (sessions + mistakes). */
export const SIMULATOR_ORIGIN = "dev-student-simulator";

/** Custom builder Apply: default replaces only selected subject/topic units; optional append / full replace. */
export const CUSTOM_APPLY_MODE = Object.freeze({
  replaceSelectedTopics: "replaceSelectedTopics",
  append: "append",
  fullSimulationReplace: "fullSimulationReplace",
});
