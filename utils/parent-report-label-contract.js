/**
 * בדיקות חוזה — מזהים פנימיים לא אמורים להופיע כטקסט UI במקום תוויות עבריות.
 * משמש סקריפטי בדיקה בלבד; לא משנה מנוע או דוח.
 */

/** מזהים שמוצגים לעיתים כערך גולמי כשחסר מיפוי תווית */
export const INTERNAL_DOMINANT_AND_DIAGNOSTIC_IDS = new Set([
  "knowledge_gap",
  "fragile_success",
  "careless_pattern",
  "instruction_friction",
  "speed_pressure",
  "stable_mastery",
  "mixed_low_signal",
  "none_sparse",
  "none_observed",
  "mixed",
  "undetermined",
  "fragile_success_cluster",
  "hint_dependence",
  "false_promotion",
]);

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * @param {string} s
 */
function looksLikeAsciiSnakeId(s) {
  const t = s.trim();
  return /^[a-z][a-z0-9_]*$/i.test(t) && t.includes("_");
}

/**
 * טקסט שאמור להיות תווית עברית למשתמש — לא מזהה פנימי ידוע ולא snake ASCII בלי עברית.
 * @param {string} fieldCtx
 * @param {unknown} value
 */
export function assertUiHebrewLabelField(fieldCtx, value) {
  if (!isNonEmptyString(value)) return;
  const s = String(value).trim();
  if (INTERNAL_DOMINANT_AND_DIAGNOSTIC_IDS.has(s)) {
    throw new Error(`${fieldCtx}: raw internal id leaked as label: "${s}"`);
  }
  if (looksLikeAsciiSnakeId(s) && !/[\u0590-\u05FF]/.test(s)) {
    throw new Error(`${fieldCtx}: snake_case ASCII without Hebrew (possible id leak): "${s}"`);
  }
}

/**
 * @param {Record<string, unknown>|null|undefined} detailed
 */
export function assertDetailedExecutiveLabels(detailed) {
  const es = detailed?.executiveSummary;
  if (!es || typeof es !== "object") return;
  assertUiHebrewLabelField("executiveSummary.dominantCrossSubjectRiskLabelHe", es.dominantCrossSubjectRiskLabelHe);
  assertUiHebrewLabelField(
    "executiveSummary.dominantCrossSubjectSuccessPatternLabelHe",
    es.dominantCrossSubjectSuccessPatternLabelHe
  );
  assertUiHebrewLabelField(
    "executiveSummary.dominantCrossSubjectRootCauseLabelHe",
    es.dominantCrossSubjectRootCauseLabelHe
  );
  assertUiHebrewLabelField("executiveSummary.topImmediateParentActionHe", es.topImmediateParentActionHe);
  assertUiHebrewLabelField("executiveSummary.secondPriorityActionHe", es.secondPriorityActionHe);
  assertUiHebrewLabelField(
    "executiveSummary.dominantCrossSubjectMistakePatternLabelHe",
    es.dominantCrossSubjectMistakePatternLabelHe
  );
  assertUiHebrewLabelField("executiveSummary.crossSubjectLearningStageLabelHe", es.crossSubjectLearningStageLabelHe);
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectResponseToInterventionLabelHe",
    es.crossSubjectResponseToInterventionLabelHe
  );
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectSupportAdjustmentNeedHe",
    es.crossSubjectSupportAdjustmentNeedHe
  );
  assertUiHebrewLabelField("executiveSummary.crossSubjectRecalibrationNeedHe", es.crossSubjectRecalibrationNeedHe);
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectSupportSequenceStateLabelHe",
    es.crossSubjectSupportSequenceStateLabelHe
  );
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectNextBestSequenceStepHe",
    es.crossSubjectNextBestSequenceStepHe
  );
  for (const [i, line] of (es.subjectsReadyForReleaseHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsReadyForReleaseHe[${i}]`, line);
  }
  for (const [i, line] of (es.subjectsAtRiskOfSupportRepetitionHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsAtRiskOfSupportRepetitionHe[${i}]`, line);
  }
  for (const [i, line] of (es.subjectsNeedingSupportResetHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsNeedingSupportResetHe[${i}]`, line);
  }
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectRecommendationMemoryStateLabelHe",
    es.crossSubjectRecommendationMemoryStateLabelHe
  );
  assertUiHebrewLabelField("executiveSummary.crossSubjectSupportHistoryDepthLabelHe", es.crossSubjectSupportHistoryDepthLabelHe);
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectExpectedVsObservedMatchHe",
    es.crossSubjectExpectedVsObservedMatchHe
  );
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectContinuationDecisionHe",
    es.crossSubjectContinuationDecisionHe
  );
  for (const [i, line] of (es.subjectsWithClearCarryoverHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsWithClearCarryoverHe[${i}]`, line);
  }
  for (const [i, line] of (es.subjectsNeedingFreshEvidenceHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsNeedingFreshEvidenceHe[${i}]`, line);
  }
  for (const [i, line] of (es.subjectsWherePriorPathSeemsMisalignedHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsWherePriorPathSeemsMisalignedHe[${i}]`, line);
  }
  assertUiHebrewLabelField("executiveSummary.crossSubjectGateStateLabelHe", es.crossSubjectGateStateLabelHe);
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectNextCycleDecisionFocusHe",
    es.crossSubjectNextCycleDecisionFocusHe
  );
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectEvidenceTargetTypeLabelHe",
    es.crossSubjectEvidenceTargetTypeLabelHe
  );
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectTargetObservationWindowLabelHe",
    es.crossSubjectTargetObservationWindowLabelHe
  );
  for (const [i, line] of (es.subjectsNearReleaseButNotThereHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsNearReleaseButNotThereHe[${i}]`, line);
  }
  for (const [i, line] of (es.subjectsNeedingRecheckBeforeDecisionHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsNeedingRecheckBeforeDecisionHe[${i}]`, line);
  }
  for (const [i, line] of (es.subjectsWithVisiblePivotTriggerHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsWithVisiblePivotTriggerHe[${i}]`, line);
  }
  assertUiHebrewLabelField("executiveSummary.crossSubjectDependencyStateLabelHe", es.crossSubjectDependencyStateLabelHe);
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectLikelyFoundationalBlockerLabelHe",
    es.crossSubjectLikelyFoundationalBlockerLabelHe
  );
  assertUiHebrewLabelField(
    "executiveSummary.crossSubjectFoundationFirstPriorityHe",
    es.crossSubjectFoundationFirstPriorityHe
  );
  for (const [i, line] of (es.subjectsLikelyShowingDownstreamSymptomsHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsLikelyShowingDownstreamSymptomsHe[${i}]`, line);
  }
  for (const [i, line] of (es.subjectsNeedingFoundationFirstHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsNeedingFoundationFirstHe[${i}]`, line);
  }
  for (const [i, line] of (es.subjectsSafeForLocalInterventionHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.subjectsSafeForLocalInterventionHe[${i}]`, line);
  }
  for (const [i, line] of (es.majorRecheckAreasHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.majorRecheckAreasHe[${i}]`, line);
  }
  for (const [i, line] of (es.areasWhereSupportCanBeReducedHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.areasWhereSupportCanBeReducedHe[${i}]`, line);
  }
  for (const [i, line] of (es.areasNeedingStrategyChangeHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.areasNeedingStrategyChangeHe[${i}]`, line);
  }
  for (const [i, line] of (es.reviewBeforeAdvanceAreasHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.reviewBeforeAdvanceAreasHe[${i}]`, line);
  }
  for (const [i, line] of (es.transferReadyAreasHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.transferReadyAreasHe[${i}]`, line);
  }
  for (const [i, line] of (es.topStrengthsAcrossHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.topStrengthsAcrossHe[${i}]`, line);
  }
  for (const [i, line] of (es.topFocusAreasHe || []).entries()) {
    assertUiHebrewLabelField(`executiveSummary.topFocusAreasHe[${i}]`, line);
  }
}

/**
 * @param {Record<string, unknown>|null|undefined} sp
 * @param {string} subjectCtx
 */
export function assertSubjectProfileUiLabels(sp, subjectCtx) {
  if (!sp || typeof sp !== "object") return;
  assertUiHebrewLabelField(`${subjectCtx}.dominantLearningRiskLabelHe`, sp.dominantLearningRiskLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.dominantSuccessPatternLabelHe`, sp.dominantSuccessPatternLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.recommendedHomeMethodHe`, sp.recommendedHomeMethodHe);
  assertUiHebrewLabelField(`${subjectCtx}.dominantRootCauseLabelHe`, sp.dominantRootCauseLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectInterventionPriorityHe`, sp.subjectInterventionPriorityHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectDiagnosticRestraintHe`, sp.subjectDiagnosticRestraintHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectPriorityReasonHe`, sp.subjectPriorityReasonHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectImmediateActionHe`, sp.subjectImmediateActionHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectDeferredActionHe`, sp.subjectDeferredActionHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectDoNowHe`, sp.subjectDoNowHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectAvoidNowHe`, sp.subjectAvoidNowHe);
  assertUiHebrewLabelField(`${subjectCtx}.dominantMistakePatternLabelHe`, sp.dominantMistakePatternLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectLearningStageLabelHe`, sp.subjectLearningStageLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectMemoryNarrativeHe`, sp.subjectMemoryNarrativeHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectReviewBeforeAdvanceHe`, sp.subjectReviewBeforeAdvanceHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectResponseToInterventionLabelHe`, sp.subjectResponseToInterventionLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectSupportAdjustmentNeedHe`, sp.subjectSupportAdjustmentNeedHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectRecalibrationNeedHe`, sp.subjectRecalibrationNeedHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectEffectivenessNarrativeHe`, sp.subjectEffectivenessNarrativeHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectSupportSequenceStateLabelHe`, sp.subjectSupportSequenceStateLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectNextBestSequenceStepHe`, sp.subjectNextBestSequenceStepHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectSequenceNarrativeHe`, sp.subjectSequenceNarrativeHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectContinuationDecisionHe`, sp.subjectContinuationDecisionHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectOutcomeNarrativeHe`, sp.subjectOutcomeNarrativeHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectGateStateLabelHe`, sp.subjectGateStateLabelHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectNextCycleDecisionFocusHe`, sp.subjectNextCycleDecisionFocusHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectGateNarrativeHe`, sp.subjectGateNarrativeHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectDependencyStateLabelHe`, sp.subjectDependencyStateLabelHe);
  assertUiHebrewLabelField(
    `${subjectCtx}.subjectLikelyFoundationalBlockerLabelHe`,
    sp.subjectLikelyFoundationalBlockerLabelHe
  );
  assertUiHebrewLabelField(`${subjectCtx}.subjectFoundationFirstPriorityHe`, sp.subjectFoundationFirstPriorityHe);
  assertUiHebrewLabelField(`${subjectCtx}.subjectDependencyNarrativeHe`, sp.subjectDependencyNarrativeHe);
}
