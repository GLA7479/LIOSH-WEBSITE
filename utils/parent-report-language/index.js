export { pickVariant } from "./variants.js";
export {
  FORBIDDEN_PARENT_REPORT_SUBSTRINGS,
  PARENT_READABILITY_LEAK_SUBSTRINGS,
  findForbiddenSubstringsInString,
  findReadabilityLeakSubstringsInString,
  scanValueForForbidden,
} from "./forbidden-terms.js";
export { confidenceLevelParentSummaryHe } from "./confidence-parent-he.js";
export { priorityLevelParentLabelHe } from "./priority-parent-he.js";
export {
  executiveV2HomeFocusHe,
  executiveV2MajorTrendsLinesHe,
  executiveV2MixedSignalNoticeHe,
  executiveV2OverallConfidenceHe,
  executiveV2EvidenceBalanceHe,
  executiveV2CautionNoteHe,
  executiveV2ReportReadinessHe,
  homePlanV2EmptyFallbackHe,
  nextPeriodGoalsV2EmptyFallbackHe,
  crossSubjectV2BulletsHe,
  crossSubjectV2DataQualityNoteHe,
  subjectV2TrendNarrativeHighPriorityHe,
  subjectV2TrendNarrativeStableHe,
  subjectV2RecalibrationNeedYesHe,
  subjectV2RecalibrationNeedNoHe,
  SUBJECT_V2_RECALIBRATION_NEED_NO_HE,
  topicRecommendationV2CautionGatedHe,
  subjectV2ConfidenceSummaryHe,
} from "./v2-parent-copy.js";
export { SUBJECT_PHASE3_ROW_LABEL_HE } from "./surface-row-labels-he.js";
export { diagnosticPrimarySourceParentLabelHe } from "./short-report-source-label-he.js";
export { normalizePedagogyForParentReportHe } from "./pedagogy-glossary-he.js";
export {
  normalizeParentFacingHe,
  normalizeSubjectParentLetterHe,
  glossTopicRecommendationHeFields,
} from "./parent-facing-normalize-he.js";
export {
  insufficientSubjectQuestionsLineHe,
  tierStableStrengthHe,
  tierWeaknessRecurringHe,
  tierWeaknessSupportHe,
  evidenceExampleTitleFallbackHe,
  evidenceExampleBodyFallbackHe,
  v2SubjectMemoryPartialEvidenceHe,
  v2SubjectDiagnosticRestraintHe,
} from "./short-report-v2-copy.js";
