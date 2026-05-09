/**
 * Phase 4B-0b — Per-subject rollup of hardened registry entries for spine/compare tooling.
 */

import { OFFICIAL_CURRICULUM_SOURCE_REGISTRY } from "./official-curriculum-source-registry.js";

/**
 * True if registry lists an exact_grade_topic_source row whose grade span includes gradeNum.
 * @param {string} subjectKey
 * @param {number} gradeNum
 */
export function exactGradeTopicRegistryCovers(subjectKey, gradeNum) {
  return OFFICIAL_CURRICULUM_SOURCE_REGISTRY.some((r) => {
    if (r.subject !== subjectKey) return false;
    if (r.sourceQualityLevel !== "exact_grade_topic_source") return false;
    const g = r.appliesToGrades;
    if (g === "all") return true;
    if (Array.isArray(g)) return g.includes(gradeNum);
    return false;
  });
}

/** @typedef {'high' | 'medium' | 'low'} Tier */

/**
 * Curriculum anchors exclude RAMA homepage rows (assessment context, not syllabus map).
 * @param {string} subjectKey
 */
export function computeSubjectSourceProfile(subjectKey) {
  const rows = OFFICIAL_CURRICULUM_SOURCE_REGISTRY.filter((r) => r.subject === subjectKey);
  const curriculumAnchors = rows.filter(
    (r) =>
      r.sourceType !== "rama" &&
      r.sourceQualityLevel !== "broad_subject_portal"
  );

  const hasExactGradeTopic = rows.some(
    (r) => r.sourceQualityLevel === "exact_grade_topic_source"
  );
  const hasExactSubject = rows.some(
    (r) => r.sourceQualityLevel === "exact_subject_curriculum_source"
  );
  const hasInternalGap = rows.some((r) => r.sourceQualityLevel === "internal_gap");
  const hasBroadMinistry = rows.some(
    (r) => r.sourceQualityLevel === "broad_ministry_portal"
  );

  /** Conservative ceiling from POP/PDF rows only. */
  let confidenceCeiling = /** @type {Tier} */ ("high");
  if (!curriculumAnchors.length) confidenceCeiling = "low";
  else {
    for (const r of curriculumAnchors) {
      if (r.confidenceAfterAudit === "low") confidenceCeiling = "low";
      else if (r.confidenceAfterAudit === "medium" && confidenceCeiling === "high")
        confidenceCeiling = "medium";
    }
  }

  /**
   * Tier for reporting:
   * - high: at least one exact_grade_topic row with confidenceAfterAudit high (rare).
   * - medium: subject-level POP/PDF anchor exists or grade-topic at medium.
   * - low: only gaps / broad / assessment-only effective signal.
   */
  let sourceQuality = /** @type {Tier} */ ("low");
  const highGradeTopic = rows.some(
    (r) =>
      r.sourceQualityLevel === "exact_grade_topic_source" &&
      r.confidenceAfterAudit === "high"
  );
  if (highGradeTopic) sourceQuality = "high";
  else if (hasExactSubject || hasExactGradeTopic) sourceQuality = "medium";

  const needsPedagogyReviewBecauseSourceWeak =
    hasInternalGap ||
    sourceQuality !== "high" ||
    confidenceCeiling !== "high";

  return {
    subject: subjectKey,
    sourceQuality,
    confidenceAfterAuditCeiling: confidenceCeiling,
    hasExactGradeTopicAnchor: hasExactGradeTopic,
    hasExactSubjectCurriculumAnchor: hasExactSubject,
    hasInternalGapRows: hasInternalGap,
    hasOnlyBroadMinistryPortal:
      hasBroadMinistry && !hasExactSubject && !hasExactGradeTopic,
    supportingRamaAssessmentEntries: rows.filter((r) => r.sourceType === "rama")
      .length,
    needsPedagogyReviewBecauseSourceWeak,
    curriculumAnchorCount: curriculumAnchors.length,
  };
}

const DEFAULT_SUBJECTS = [
  "math",
  "geometry",
  "hebrew",
  "english",
  "science",
  "moledet-geography",
];

export const SUBJECT_SOURCE_PROFILES = Object.fromEntries(
  DEFAULT_SUBJECTS.map((s) => [s, computeSubjectSourceProfile(s)])
);

/** @param {string} subjectKey */
export function getSubjectSourceProfile(subjectKey) {
  return (
    SUBJECT_SOURCE_PROFILES[subjectKey] ||
    computeSubjectSourceProfile(subjectKey)
  );
}
