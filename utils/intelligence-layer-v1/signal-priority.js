/**
 * Passive priority ordering for intelligence signals (read-only; no decisioning).
 * Higher number = higher caution / attention weight in traces only until wired elsewhere.
 *
 * @param {{ confidenceBand?: string; weaknessLevel?: string; recurrence?: boolean }} signal
 * @returns {0|1|2|3}
 */
export function getIntelligencePriority(signal) {
  const s = signal && typeof signal === "object" ? signal : {};
  if (String(s.confidenceBand || "") === "low") return 3;
  if (String(s.weaknessLevel || "") === "tentative") return 2;
  if (s.recurrence === true) return 1;
  return 0;
}
