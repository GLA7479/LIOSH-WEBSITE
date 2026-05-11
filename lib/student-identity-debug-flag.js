/**
 * Opt-in student identity tracing (dev only).
 * Set in .env.local: NEXT_PUBLIC_DEBUG_STUDENT_IDENTITY=true
 * Restart `next dev` after changing. Stripped / inert in production.
 */
export function isStudentIdentityDebugEnabled() {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_DEBUG_STUDENT_IDENTITY === "true";
}
