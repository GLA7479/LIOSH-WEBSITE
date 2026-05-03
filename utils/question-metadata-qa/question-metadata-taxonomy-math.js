/**
 * Math procedural metadata — permissive id patterns (kinds + diagnosticSkillId family).
 */

/**
 * @param {string} id
 */
export function isTaxonomyValidMathSkillId(id) {
  const s = String(id || "").trim();
  if (!s) return false;
  return /^math_[a-z0-9_]+$/i.test(s);
}

/**
 * @param {string} id
 */
export function isTaxonomyValidMathSubskillId(id) {
  const s = String(id || "").trim();
  if (!s) return false;
  return /^[a-z0-9_]+$/i.test(s);
}
