/**
 * Deterministic short hash for browser + Node (no crypto dependency).
 * @param {unknown} value
 */
export function stableJsonHash(value) {
  const keys = value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).sort() : null;
  const s = keys ? JSON.stringify(value, keys) : JSON.stringify(value);
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return `h${(h >>> 0).toString(16).padStart(8, "0")}`;
}
