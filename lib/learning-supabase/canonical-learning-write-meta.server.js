import { normalizeGradeLevelToKey } from "../learning-student-defaults.js";
import { isStudentIdentityDebugEnabled } from "../student-identity-debug-flag.js";

/**
 * Canonical g1–g6 key from authenticated student row (DB is source of truth).
 * @param {{ student?: { grade_level?: string|null } } | null} auth
 * @returns {string|null}
 */
export function canonicalGradeLevelKeyFromAuth(auth) {
  const raw = auth?.student?.grade_level;
  const key = normalizeGradeLevelToKey(raw);
  return key || null;
}

/**
 * @param {string} tag
 * @param {Record<string, unknown>} payload
 */
export function logLearningPipelineDebug(tag, payload) {
  if (!isStudentIdentityDebugEnabled()) return;
  try {
    console.info("[LIOSH learning-pipeline]", tag, payload);
  } catch {
    /* ignore */
  }
}
