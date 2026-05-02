/**
 * Decrement `expiresAfterQuestions` after one question-generation cycle when a probe
 * remains unconsumed. Clears the pending ref when expiry reaches 0.
 * Does not touch hypothesis ledger refs.
 *
 * @param {{ current: import("./build-pending-probe.js").PendingDiagnosticProbe | null } | null | undefined} pendingRef
 */
export function decrementPendingProbeExpiry(pendingRef) {
  if (!pendingRef) return;
  const p = pendingRef.current;
  if (!p || typeof p !== "object") return;
  const raw = p.expiresAfterQuestions;
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  const next = Math.max(0, Math.floor(n) - 1);
  p.expiresAfterQuestions = next;
  if (next <= 0) pendingRef.current = null;
}
