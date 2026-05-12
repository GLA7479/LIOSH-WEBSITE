import { isStudentIdentityDiagnosticsEnabled } from "./dev-student-identity-client";

/**
 * Browser-only: keep localStorage aligned with the authenticated student session.
 * Legacy learning UI uses many `mleo_*` keys without embedding studentId — when the
 * logged-in child changes, those keys must be cleared so child B cannot inherit
 * child A's name, progress, avatars, or report seeds.
 */

export const LIOSH_ACTIVE_STUDENT_ID_KEY = "liosh_active_student_id";

export function clearMleoScopedLocalStorage() {
  if (typeof window === "undefined") return;
  const keys = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith("mleo_")) keys.push(k);
  }
  for (const k of keys) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/** Legacy global monthly / reward keys (not student-scoped). Remove on student switch. */
const LEO_LEGACY_GLOBAL_KEYS = [
  "LEO_MONTHLY_PROGRESS",
  "LEO_PROGRESS_LOG",
  "LEO_REWARD_CHOICE",
  "LEO_REWARD_CELEBRATION",
];

export function clearLeoLegacyGlobalKeys() {
  if (typeof window === "undefined") return;
  for (const k of LEO_LEGACY_GLOBAL_KEYS) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Remove namespaced learning-profile cache for one student (browser-only).
 * @param {string} studentId
 */
export function clearLioshScopedLearningProfileCache(studentId) {
  if (typeof window === "undefined" || !studentId) return;
  const prefix = `liosh_lp_${String(studentId).trim()}_`;
  const keys = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(prefix)) keys.push(k);
  }
  for (const k of keys) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {{ id: string, full_name?: string }} student — from GET /api/student/me or POST /api/student/login JSON (never contains PIN/hash).
 */
export function syncStudentLocalStorageIdentity(student, syncSource = "syncStudentLocalStorageIdentity") {
  if (typeof window === "undefined" || !student?.id) return;
  const nextId = String(student.id);

  let prevId = null;
  try {
    prevId = window.localStorage.getItem(LIOSH_ACTIVE_STUDENT_ID_KEY);
  } catch {
    prevId = null;
  }

  let clearedMleo = false;
  if (prevId && prevId !== nextId) {
    clearMleoScopedLocalStorage();
    clearLeoLegacyGlobalKeys();
    clearLioshScopedLearningProfileCache(prevId);
    clearedMleo = true;
  }

  try {
    window.localStorage.setItem(LIOSH_ACTIVE_STUDENT_ID_KEY, nextId);
    const fullName = String(student.full_name || "").trim();
    if (fullName) {
      window.localStorage.setItem("mleo_player_name", fullName);
    }
  } catch {
    /* ignore */
  }

  if (isStudentIdentityDiagnosticsEnabled()) {
    console.log("[syncStudentLocalStorageIdentity]", {
      syncSource,
      studentId: nextId,
      fullName: String(student.full_name || "").trim(),
      gradeLevel: student.grade_level != null ? String(student.grade_level) : "",
      prevStoredStudentId: prevId,
      clearedMleoKeys: clearedMleo,
    });
  }
}
