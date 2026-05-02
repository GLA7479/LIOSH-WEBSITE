/**
 * Session-only refs cleanup (React refs or plain { current } holders).
 *
 * @param {{ current: unknown }|null|undefined} pendingRef
 * @param {{ current: unknown }|null|undefined} ledgerRef
 */
export function clearActiveDiagnosticState(pendingRef, ledgerRef) {
  if (pendingRef) pendingRef.current = null;
  if (ledgerRef) ledgerRef.current = null;
}
