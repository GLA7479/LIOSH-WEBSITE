/**
 * Dev-only: safe identity snippets for API JSON (never PIN/hash/token).
 * Opt-in via NEXT_PUBLIC_DEBUG_STUDENT_IDENTITY=true (see student-identity-debug-flag.js).
 */

import { isStudentIdentityDebugEnabled } from "./student-identity-debug-flag";

export function devStudentIdentityPayload(source, student) {
  if (!isStudentIdentityDebugEnabled()) return null;
  if (!student?.id) return null;
  return {
    source,
    studentId: student.id,
    fullName: String(student.full_name || "").trim(),
    gradeLevel: student.grade_level != null ? String(student.grade_level) : "",
    timestamp: new Date().toISOString(),
  };
}
