/**
 * Deterministic variant picker for parent-facing copy (anti-repetition without Math.random).
 * @param {number|string} seed
 * @param {readonly string[]} variants
 * @returns {string}
 */
export function pickVariant(seed, variants) {
  if (!variants || variants.length === 0) return "";
  const s = String(seed ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % variants.length;
  return variants[idx];
}
