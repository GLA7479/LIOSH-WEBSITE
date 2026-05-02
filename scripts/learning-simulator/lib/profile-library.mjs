/**
 * Student profile definitions for the learning simulator (schema + validation only).
 */

export const PROFILE_SCHEMA_VERSION = "1.0.0";

export const TREND_POLICY_ENUM = new Set(["flat", "improving", "declining", "inconsistent"]);
export const DATA_VOLUME_ENUM = new Set(["thin", "normal", "heavy"]);

/**
 * @typedef {object} AccuracyPolicy
 * @property {string} [kind]
 * @property {number} [default]
 * @property {Record<string, number>} [bySubject]
 * @property {Record<string, Record<string, number>>} [bySubjectTopic]
 */

/**
 * @param {unknown} p
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateProfile(p) {
  const errors = [];
  const warnings = [];

  if (!p || typeof p !== "object" || Array.isArray(p)) {
    return { ok: false, errors: ["profile must be a non-array object"], warnings: [] };
  }

  const profileId = p.profileId;
  if (typeof profileId !== "string" || !profileId.trim()) {
    errors.push("profile.profileId must be a non-empty string");
  }

  if (typeof p.displayName !== "string" || !p.displayName.trim()) {
    errors.push("profile.displayName must be a non-empty string");
  }

  const hasGrades =
    Array.isArray(p.grades) && p.grades.length > 0 && p.grades.every((g) => typeof g === "string");
  const hasRange =
    p.gradeRange &&
    typeof p.gradeRange === "object" &&
    typeof p.gradeRange.min === "string" &&
    typeof p.gradeRange.max === "string";

  if (!hasGrades && !hasRange) {
    errors.push("profile must have either non-empty grades[] or gradeRange { min, max }");
  }

  if (p.subjectWeights !== undefined) {
    if (typeof p.subjectWeights !== "object" || Array.isArray(p.subjectWeights)) {
      errors.push("profile.subjectWeights must be an object");
    } else {
      for (const [k, v] of Object.entries(p.subjectWeights)) {
        if (typeof v !== "number" || v < 0 || v > 1) {
          errors.push(`profile.subjectWeights.${k} must be a number in [0,1]`);
        }
      }
    }
  }

  if (p.topicWeaknesses !== undefined && (typeof p.topicWeaknesses !== "object" || Array.isArray(p.topicWeaknesses))) {
    errors.push("profile.topicWeaknesses must be an object (subject -> topic -> weight or detail)");
  }

  if (p.topicStrengths !== undefined && (typeof p.topicStrengths !== "object" || Array.isArray(p.topicStrengths))) {
    errors.push("profile.topicStrengths must be an object");
  }

  if (p.accuracyPolicy !== undefined && (typeof p.accuracyPolicy !== "object" || Array.isArray(p.accuracyPolicy))) {
    errors.push("profile.accuracyPolicy must be an object");
  }

  if (p.responseTimePolicy !== undefined && (typeof p.responseTimePolicy !== "object" || Array.isArray(p.responseTimePolicy))) {
    errors.push("profile.responseTimePolicy must be an object");
  }

  if (p.hintUsagePolicy !== undefined && (typeof p.hintUsagePolicy !== "object" || Array.isArray(p.hintUsagePolicy))) {
    errors.push("profile.hintUsagePolicy must be an object");
  }

  if (p.trendPolicy !== undefined) {
    if (!TREND_POLICY_ENUM.has(p.trendPolicy)) {
      errors.push(`profile.trendPolicy must be one of: ${[...TREND_POLICY_ENUM].join(", ")}`);
    }
  }

  if (p.dataVolumePolicy !== undefined) {
    if (!DATA_VOLUME_ENUM.has(p.dataVolumePolicy)) {
      errors.push(`profile.dataVolumePolicy must be one of: ${[...DATA_VOLUME_ENUM].join(", ")}`);
    }
  }

  if (p.randomGuessRate !== undefined) {
    if (typeof p.randomGuessRate !== "number" || p.randomGuessRate < 0 || p.randomGuessRate > 1) {
      errors.push("profile.randomGuessRate must be a number in [0,1]");
    }
  }

  if (p.notes !== undefined && typeof p.notes !== "string") {
    errors.push("profile.notes must be a string");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * @param {Record<string, unknown>|object} profilesById
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateProfileSet(profilesById) {
  const errors = [];
  if (!profilesById || typeof profilesById !== "object") {
    return { ok: false, errors: ["profiles collection must be an object"] };
  }
  for (const [id, p] of Object.entries(profilesById)) {
    const r = validateProfile({ ...p, profileId: p.profileId || id });
    if (!r.ok) {
      errors.push(`profile "${id}": ${r.errors.join("; ")}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
