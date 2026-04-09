/**
 * Helpers for the compact pre-game dashboard (learning masters).
 * Display-only: does not change persisted values or game logic.
 */

/**
 * Splits reward labels like "1000 ROBUX" for compact chips (amount + name lines).
 */
export function splitRewardAmountLabel(label) {
  const s = String(label || "").trim();
  const m = s.match(/^([\d,]+)\s+(.+)$/);
  if (m) return { amount: m[1], name: m[2], full: s };
  return { amount: null, name: s, full: s };
}
