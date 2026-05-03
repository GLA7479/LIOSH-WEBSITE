# Parent narrative safety — real artifact validation

- Generated: 2026-05-03T13:55:56.123Z
- Status: **warnings_only**

> **Warnings** (for example `ambiguous_evidence` where the text is still vague on thin rows) are listed for review. They do not fail this script. **Info / caution** rows are *not* safety problems — they mark correctly cautious thin-data Hebrew copy.

## Scope

- Searched directories:
  - `reports/parent-report-persona-corpus/json`
  - `reports/learning-simulator/parent-report-review-pack/reports`
  - `reports/learning-simulator/reports/per-student`

## Counts

| Metric | Value |
| --- | --- |
| JSON files read | 84 |
| Narratives checked | 10398 |
| Clean pass (no info tags) | 10258 |
| Info / caution (safe thin-data framing) | 16 |
| Pass total (clean + info) | 10274 |
| Warning | 124 |
| Block | 0 |
| Missing engine context (heuristic) | 0 |

## Interpreting counts

- **Info / caution**: deterministic recognition of explicit limited-evidence / statistical-restraint Hebrew wording on thin engine rows. These narratives **passed** the guard; tags are for QA visibility only.
- **Warning**: review suggested — not a failure for this script unless you tighten policy.

## Top issue codes

| Code | Count |
| --- | --- |
| ambiguous_evidence | 124 |

## Top info / caution tags

| Tag | Count |
| --- | --- |
| cautionary_thin_data | 16 |

## Info / caution examples (trimmed)

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.english.summaryHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.english.summaryHe`)
  - Text: לגבי אנגלית: עדיין מעט נתון בתקופה — אחרי עוד קצת תרגול אפשר יהיה לנסח תמונה מלאה יותר.
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.confidenceSummaryHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.confidenceSummaryHe`)
  - Text: נתון דל — לא מסכמים ביטחון סטטיסטי ברמת המקצוע.
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.dominantMistakePatternLabelHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.dominantMistakePatternLabelHe`)
  - Text: עדיין אין מספיק דוגמאות כדי לראות טעות חוזרת ברורה
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.dominantRootCauseLabelHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.dominantRootCauseLabelHe`)
  - Text: עדיין לא ברור מה בדיוק מקשה כאן — צריך עוד כמה דוגמאות
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectAvoidNowHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectAvoidNowHe`)
  - Text: לא לבנות תוכנית ארוכה לפני שיש נתון.
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.summaryHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.summaryHe`)
  - Text: לגבי גאומטריה: עדיין מעט נתון בתקופה — אחרי עוד קצת תרגול אפשר יהיה לנסח תמונה מלאה יותר.
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.whatNotToDoHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.whatNotToDoHe`)
  - Text: לא לבנות תוכנית ארוכה לפני שיש עוד תרגול בטווח.
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.hebrew.summaryHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.hebrew.summaryHe`)
  - Text: לגבי עברית: עדיין מעט נתון בתקופה — אחרי עוד קצת תרגול אפשר יהיה לנסח תמונה מלאה יותר.
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectEffectivenessNarrativeHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectEffectivenessNarrativeHe`)
  - Text: בחשבון: עדיין אין מספיק ניסיון כדי לדעת אם מה שניסינו באמת עוזר. לצפות ולאסוף עוד מידע לפני החלטה
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectSupportAdjustmentNeedHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectSupportAdjustmentNeedHe`)
  - Text: לצפות ולאסוף עוד מידע לפני החלטה
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.math.trendNarrativeHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.math.trendNarrativeHe`)
  - Text: יש נתוני מגמה בשורות, אך אין עדיין סיפור מגמה אחיד ברמת המקצוע — כדאי לאסוף עוד תרגול.
  - Tags: cautionary_thin_data

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.moledet-geography.summaryHe** (`reportJson.baseReport.legacyPatternDiagnostics.subjects.moledet-geography.summaryHe`)
  - Text: לגבי מולדת וגאוגרפיה: עדיין מעט נתון בתקופה — אחרי עוד קצת תרגול אפשר יהיה לנסח תמונה מלאה יותר.
  - Tags: cautionary_thin_data

## Warning narrative ids

- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectDependencyNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectDependencyStateLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectDiagnosticRestraintHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectDoNowHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectEffectivenessNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectFoundationFirstPriorityHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectInterventionPriorityHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectLikelyFoundationalBlockerLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectMemoryNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectNextBestSequenceStepHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectOutcomeNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectPriorityReasonHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectRecalibrationNeedHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectSequenceNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.trendNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.confidenceSummaryHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.diagnosticSectionsHe.improveHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.dominantLearningRiskLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.dominantMistakePatternLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.dominantRootCauseLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.dominantSuccessPatternLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.improving[0].tierHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.nextWeekGoalHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.parentActionHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.parentRecommendationsImprove[0].textHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.recommendedHomeMethodHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectAvoidNowHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectContinuationDecisionHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectDeferredActionHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectDependencyStateLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectDiagnosticRestraintHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectDoNowHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectFoundationFirstPriorityHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectGateNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectGateStateLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectInterventionPriorityHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectLearningStageLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectMemoryNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectNextBestSequenceStepHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectNextCycleDecisionFocusHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectOutcomeNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectPriorityReasonHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectRecalibrationNeedHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectResponseToInterventionLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectReviewBeforeAdvanceHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectSequenceNarrativeHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.subjectSupportSequenceStateLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.summaryHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.legacyPatternDiagnostics.subjects.math.whatNotToDoHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.mathOperations.addition.behaviorProfile.summaryHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.mathOperations.addition.dataSufficiencyLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.mathOperations.addition.diagnosticRecommendedEvidenceHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.mathOperations.addition.diagnosticRecommendedStepLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.mathOperations.addition.displayName`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.mathOperations.addition.recommendationContextHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.mathOperations.addition.trend.summaryHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.english.subjectLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.geometry.subjectLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.hebrew.subjectLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.math.diagnosticCards[0].fastDiagnosis.hypothesisHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.math.diagnosticCards[0].fastDiagnosis.nextProbe.reasonHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.math.diagnosticCards[0].fastDiagnosis.parentSafeTextHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.math.diagnosticCards[0].labelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.math.nextWeekGoalHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.math.subjectLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.math.summaryHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.moledet-geography.subjectLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.patternDiagnostics.subjects.science.subjectLabelHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.summary.diagnosticOverviewHe.insufficientDataSubjectsHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.summary.diagnosticOverviewHe.insufficientDataSubjectsHe[1]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.summary.diagnosticOverviewHe.insufficientDataSubjectsHe[2]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.summary.diagnosticOverviewHe.insufficientDataSubjectsHe[3]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.summary.diagnosticOverviewHe.insufficientDataSubjectsHe[4]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.summary.diagnosticOverviewHe.mainFocusAreaLineHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.baseReport.summary.diagnosticOverviewHe.requiresAttentionPreviewHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.crossSubjectInsights.bulletsHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.crossSubjectInsights.bulletsHe[1]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.crossSubjectInsights.dataQualityNoteHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.executiveSummary.evidenceBalanceHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.executiveSummary.homeFocusHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.executiveSummary.mainHomeRecommendationHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.executiveSummary.majorDiagnosticCautionsHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.executiveSummary.majorTrendsHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.executiveSummary.majorTrendsHe[1]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.executiveSummary.monitoringOnlyAreasHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.executiveSummary.overallConfidenceHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.executiveSummary.reportReadinessHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.homePlan.itemsHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.nextPeriodGoals.itemsHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.overallSnapshot.lowExposureSubjectsHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.overallSnapshot.lowExposureSubjectsHe[1]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.overallSnapshot.lowExposureSubjectsHe[2]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.overallSnapshot.lowExposureSubjectsHe[3]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.overallSnapshot.lowExposureSubjectsHe[4]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.overallSnapshot.lowExposureSubjectsHe[5]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.overallSnapshot.notableSubjectsHe[0]`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.subjects.math.confidenceHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.subjects.math.doNowHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.subjects.math.evidenceSummaryHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.subjects.math.mainPriorityHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.subjects.math.nextCheckHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.subjects.math.whyHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.top.avoidNowHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.top.confidenceHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.top.doNowHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.top.evidenceSummaryHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.top.mainPriorityHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.parentProductContractV1.top.nextCheckHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.subjectProfiles[0].confidenceSummaryHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.subjectProfiles[0].subjectDeferredActionHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.subjectProfiles[0].subjectInterventionPriorityHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.subjectProfiles[0].subjectSupportAdjustmentNeedHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.subjectProfiles[0].summaryHe`
- `reports/learning-simulator/parent-report-review-pack/reports/thin_data_g3.json::reportJson.detailedReport.subjectProfiles[1].confidenceSummaryHe`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.analysisPreview.needsPracticeLines[0]`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.contract.topConfidenceHe`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.contract.topMainStatusHe`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.crossSubject.bulletsHe[0]`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.crossSubject.bulletsHe[1]`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.crossSubject.dataQualityNoteHe`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.executive.majorTrendsHe[0]`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.executive.majorTrendsHe[1]`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.executive.overallConfidenceHe`
- `reports/learning-simulator/reports/per-student/thin_data_g3_1d.report.json::facets.executive.reportReadinessHe`

## Warning examples (trimmed)

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectDependencyNarrativeHe**
  - Text: אין שורות דוח בטווח — לא מסכמים תלות יסוד.
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectDependencyStateLabelHe**
  - Text: אין מספיק בסיס לקבוע אם זה בסיס רחב או קושי נקודתי
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectDiagnosticRestraintHe**
  - Text: אין מספיק שורות דוח בטווח — לא מסיקים שורש קושי חוצה־נושאים ולא ממליצים על שינוי אגרסיבי.
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectDoNowHe**
  - Text: לאסוף מעט תרגול קצר לפני החלטות.
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectEffectivenessNarrativeHe**
  - Text: אין שורות דוח בטווח — לא מעריכים תגובה לתמיכה.
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectFoundationFirstPriorityHe**
  - Text: אין שורות דוח — לא מדרגים יסוד מול מקומי.
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectInterventionPriorityHe**
  - Text: עוד קצת תרגול מבוקר לפני שמחמירים
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectLikelyFoundationalBlockerLabelHe**
  - Text: לא נקבע סוג חוסר בסיס ספציפי
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectMemoryNarrativeHe**
  - Text: אין שורות דוח בטווח — לא מסכמים סוג טעות חוזר או מגמה לאורך זמן.
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectNextBestSequenceStepHe**
  - Text: לצפות ולאסוף מידע לפני מחזור חדש
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectOutcomeNarrativeHe**
  - Text: אין שורות דוח בטווח — לא מסכמים זיכרון המלצה או תוצאה.
  - Codes: ambiguous_evidence

- **reportJson.baseReport.legacyPatternDiagnostics.subjects.geometry.subjectPriorityReasonHe**
  - Text: אין שורות דוח בטווח — לא מדרגים עדיפות.
  - Codes: ambiguous_evidence

## Exit policy

- `no_artifacts_found` → exit 0 (nothing validated).
- Any **block** → exit 1.
- Warnings only → exit 0.
