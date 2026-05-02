/** @param {unknown} v */
export function str(v) {
  if (v == null || v === "") return "";
  return String(v).trim();
}
