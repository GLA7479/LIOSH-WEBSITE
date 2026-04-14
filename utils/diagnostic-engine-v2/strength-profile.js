/**
 * פרופיל חוזק — stage1 §14 (ממוקד בשורה + behaviorProfile).
 * @param {Record<string, unknown>} row
 */
export function deriveStrengthProfile(row) {
  const bp = row?.behaviorProfile && typeof row.behaviorProfile === "object" ? row.behaviorProfile : null;
  const dom = bp?.dominantType ? String(bp.dominantType) : "undetermined";
  const acc = Number(row?.accuracy) || 0;
  const q = Number(row?.questions) || 0;

  /** @type {string[]} */
  const tags = [];
  if (dom === "stable_mastery" || (q >= 10 && acc >= 90)) tags.push("stable_mastery");
  if (dom === "fragile_success") tags.push("fragile_success");
  if (dom === "speed_pressure" && acc >= 70) tags.push("high_speed_low_stability_candidate");
  if (row?.excellent) tags.push("row_excellent_flag");
  if (dom === "knowledge_gap" && acc < 70) tags.push("emerging_or_weak_area");

  return {
    tags,
    dominantBehavior: dom,
    signals: bp?.signals || null,
  };
}
