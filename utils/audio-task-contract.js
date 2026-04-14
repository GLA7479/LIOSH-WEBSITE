/**
 * חוזה stem לאודיו — סכמה 1 (Build 1) + סכמה 2 (השלמת עברית / English-ready).
 * ולידציה קשיחה; ללא UI.
 */

/** @typedef {"listen_and_choose"|"oral_comprehension_mcq"|"guided_recording"|"phonological_discrimination_he"|"audio_grammar_choice_he"|"read_aloud_short_he"|"structured_spoken_response_he"} AudioTaskMode */

/** @typedef {"tts"|"static_url"} AudioPlaybackKind */

/** @typedef {"mcq_after_audio_auto"|"guided_record_manual_review"|"manual_review_required"|"borderline_transcript_assist"} AudioScoringPolicy */

/** @typedef {"none"|"manual_pending"} AudioReviewRoute */

/** @typedef {"degraded_skip"|"degraded_listen_only"} AudioFallbackMode */

/** @typedef {1|2} AudioSchemaVersion */

/**
 * @typedef {Object} AudioStem
 * @property {AudioSchemaVersion} schema_version
 * @property {string} audio_asset_id
 * @property {string} transcript
 * @property {string} locale
 * @property {AudioTaskMode} task_mode
 * @property {boolean} recording_required
 * @property {AudioPlaybackKind} playback_kind
 * @property {string|null} stem_audio_url
 * @property {string|null} tts_text
 * @property {number} max_replays
 * @property {number} max_duration_sec
 * @property {AudioScoringPolicy} scoring_policy
 * @property {AudioFallbackMode} fallback_mode
 * @property {AudioReviewRoute} review_route
 */

const TASK_MODES_V1 = new Set(["listen_and_choose", "oral_comprehension_mcq", "guided_recording"]);

const TASK_MODES_V2 = new Set([
  ...TASK_MODES_V1,
  "phonological_discrimination_he",
  "audio_grammar_choice_he",
  "read_aloud_short_he",
  "structured_spoken_response_he",
]);

const RECORDING_TASK_MODES = new Set([
  "guided_recording",
  "read_aloud_short_he",
  "structured_spoken_response_he",
]);

const PLAYBACK_KINDS = new Set(["tts", "static_url"]);
const SCORING_POLICIES = new Set([
  "mcq_after_audio_auto",
  "guided_record_manual_review",
  "manual_review_required",
  "borderline_transcript_assist",
]);
const REVIEW_ROUTES = new Set(["none", "manual_pending"]);
const FALLBACK_MODES = new Set(["degraded_skip", "degraded_listen_only"]);

function commonStemChecks(stem) {
  if (!stem || typeof stem !== "object") return false;
  if (typeof stem.audio_asset_id !== "string" || !stem.audio_asset_id.trim()) return false;
  if (typeof stem.transcript !== "string") return false;
  if (typeof stem.locale !== "string" || !stem.locale.trim()) return false;
  if (typeof stem.recording_required !== "boolean") return false;
  if (!PLAYBACK_KINDS.has(stem.playback_kind)) return false;
  if (stem.stem_audio_url != null && typeof stem.stem_audio_url !== "string") return false;
  if (stem.tts_text != null && typeof stem.tts_text !== "string") return false;
  if (stem.playback_kind === "static_url" && (!stem.stem_audio_url || !String(stem.stem_audio_url).trim())) {
    return false;
  }
  if (stem.playback_kind === "tts" && (!stem.tts_text || !String(stem.tts_text).trim())) return false;
  if (!Number.isFinite(stem.max_replays) || stem.max_replays < 0 || stem.max_replays > 20) return false;
  if (!Number.isFinite(stem.max_duration_sec) || stem.max_duration_sec < 3 || stem.max_duration_sec > 60) {
    return false;
  }
  if (!SCORING_POLICIES.has(stem.scoring_policy)) return false;
  if (!FALLBACK_MODES.has(stem.fallback_mode)) return false;
  if (!REVIEW_ROUTES.has(stem.review_route)) return false;
  return true;
}

/**
 * סכמה 1 — רק מצבי Build 1 (תאימות לאחור).
 * @param {unknown} stem
 * @returns {boolean}
 */
export function validateAudioStemV1(stem) {
  if (!commonStemChecks(stem)) return false;
  if (stem.schema_version !== 1) return false;
  if (!TASK_MODES_V1.has(stem.task_mode)) return false;
  if (stem.task_mode === "guided_recording") {
    if (!stem.recording_required) return false;
    if (stem.scoring_policy !== "guided_record_manual_review") return false;
    if (stem.review_route !== "manual_pending") return false;
  } else {
    if (stem.recording_required) return false;
    if (stem.scoring_policy !== "mcq_after_audio_auto") return false;
    if (stem.review_route !== "none") return false;
  }
  return true;
}

/**
 * סכמה 2 — כל משימות האודיו המאושרות לסגירת עברית.
 * @param {unknown} stem
 * @returns {boolean}
 */
export function validateAudioStemV2(stem) {
  if (!commonStemChecks(stem)) return false;
  if (stem.schema_version !== 2) return false;
  if (!TASK_MODES_V2.has(stem.task_mode)) return false;

  if (RECORDING_TASK_MODES.has(stem.task_mode)) {
    if (!stem.recording_required) return false;
    if (stem.review_route !== "manual_pending") return false;
    if (
      stem.scoring_policy !== "guided_record_manual_review" &&
      stem.scoring_policy !== "manual_review_required" &&
      stem.scoring_policy !== "borderline_transcript_assist"
    ) {
      return false;
    }
  } else {
    if (stem.recording_required) return false;
    if (stem.scoring_policy !== "mcq_after_audio_auto") return false;
    if (stem.review_route !== "none") return false;
  }
  return true;
}

/**
 * @param {unknown} stem
 */
export function validateAudioStem(stem) {
  return validateAudioStemV1(stem) || validateAudioStemV2(stem);
}

/**
 * ניתוב score-or-review — ללא pronunciation כציון מוצר.
 * @param {AudioStem} stem
 */
export function resolveScoreOrReviewRoute(stem) {
  if (!validateAudioStem(stem)) {
    return { autoScore: false, manualReview: true, reason: "invalid_stem" };
  }
  if (stem.scoring_policy === "mcq_after_audio_auto") {
    return { autoScore: true, manualReview: false, reason: "mcq_safe" };
  }
  if (stem.scoring_policy === "borderline_transcript_assist") {
    return { autoScore: false, manualReview: true, reason: "borderline_manual_first" };
  }
  return { autoScore: false, manualReview: true, reason: "recording_manual_review" };
}

export const AUDIO_STEM_SCHEMA_VERSION = 2;
export const AUDIO_STEM_SCHEMA_VERSION_LEGACY = 1;
