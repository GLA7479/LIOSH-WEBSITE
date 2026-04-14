/**
 * תור סקירה — מודל מצבים (שרת + fallback לקוח).
 * pending_manual_review → review_in_progress → accepted | needs_retry | rejected
 */

/** @typedef {"pending_manual_review"|"review_in_progress"|"accepted"|"needs_retry"|"rejected"} HebrewAudioReviewState */

/** @typedef {"none"|"suspicious"|"unsafe_content"|"low_quality"} HebrewAudioModerationFlag */

/**
 * @param {object} row
 * @param {string} row.artifact_id
 * @param {string} row.audio_asset_id
 * @param {string} row.task_mode
 * @param {HebrewAudioReviewState} [row.state]
 * @param {HebrewAudioModerationFlag} [row.moderation_flag]
 */
export function normalizeReviewQueueRow(row) {
  return {
    ...row,
    state: row.state || "pending_manual_review",
    moderation_flag: row.moderation_flag || "none",
    queued_at: row.queued_at || new Date().toISOString(),
  };
}
