/**
 * רכיבי פני שטח מהדוח המקיף — מופרדים ל-import בבדיקות SSR בלי Layout/router.
 */
import React, { useMemo } from "react";
import {
  buildSubjectParentLetter,
  buildSubjectParentLetterCompact,
  rewriteParentRecommendationForDetailedHe,
} from "../utils/detailed-report-parent-letter-he";
import {
  activeRiskFlagLabelsHe,
  behaviorDominantLabelHe,
  confidenceBadgeLabelHe,
  diagnosticTypeLabelHe,
  learningMemoryLineHe,
  freshnessLineHe,
  mistakePatternLineHe,
  phase8PracticeCalibrationLineHe,
  phase8TopicMetaChipsHe,
  recalibrationLineHe,
  responseToInterventionLineHe,
  reviewBeforeAdvanceLineHe,
  sanitizeEngineSnippetHe,
  subjectMajorRiskLabelsHe,
  sufficiencyBadgeLabelHe,
  supportAdjustmentLineHe,
  sequenceActionLineHe,
  topicRepetitionFatigueCompactLineHe,
  topicSupportSequenceOrReleaseLineHe,
  transferReadinessLineHe,
  truncateHe,
  recommendationMemoryLineHe,
  outcomeTrackingLineHe,
  continuationDecisionLineHe,
  freshEvidenceNeedLineHe,
  gateStateLineHe,
  evidenceTargetLineHe,
  decisionFocusLineHe,
  gateTriggerCompactLineHe,
  dependencyStateLineHe,
  interventionOrderingLineHe,
  foundationBeforeExpansionLineHe,
  downstreamSymptomLineHe,
} from "../utils/parent-report-ui-explain-he";

export function Bullets({ items, className = "" }) {
  if (!items?.length)
    return <p className={`pr-detailed-muted text-sm ${className}`.trim()}>אין נתונים להצגה.</p>;
  return (
    <ul
      className={`pr-detailed-body-text list-disc pr-5 space-y-1.5 text-sm md:text-base text-white/[0.88] leading-relaxed ${className}`.trim()}
    >
      {items.map((t, i) => (
        <li key={i} className="pr-detailed-bullet-li">
          {t}
        </li>
      ))}
    </ul>
  );
}

/** סיכום מנהלים — שדות Phase 4 */
export function ExecutiveSummarySection({ es, compact }) {
  return (
    <div className="pr-detailed-exec-summary space-y-3 md:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div>
          <h4 className="pr-detailed-subheading text-emerald-200/95">חוזקות חוצות־מקצועות</h4>
          <Bullets items={es.topStrengthsAcrossHe} />
        </div>
        <div>
          <h4 className="pr-detailed-subheading text-amber-200/95">מיקוד חוצה־מקצועות</h4>
          <Bullets items={es.topFocusAreasHe} />
        </div>
      </div>
      {es.majorTrendsHe?.length ? (
        <div>
          <h4 className="pr-detailed-subheading text-cyan-200/95">מגמות מרכזיות</h4>
          <Bullets items={es.majorTrendsHe} />
        </div>
      ) : null}
      {(es.dominantCrossSubjectRiskLabelHe || es.dominantCrossSubjectSuccessPatternLabelHe) && !compact ? (
        <div className="flex flex-wrap gap-2 text-[11px] md:text-xs text-white/78">
          {es.dominantCrossSubjectRiskLabelHe ? (
            <span className="rounded border border-white/15 bg-white/[0.05] px-2 py-1">
              <span className="text-white/45 font-bold">דפוס קושי בולט: </span>
              {es.dominantCrossSubjectRiskLabelHe}
            </span>
          ) : null}
          {es.dominantCrossSubjectSuccessPatternLabelHe ? (
            <span className="rounded border border-white/15 bg-white/[0.05] px-2 py-1">
              <span className="text-white/45 font-bold">דפוס הצלחה בולט: </span>
              {es.dominantCrossSubjectSuccessPatternLabelHe}
            </span>
          ) : null}
        </div>
      ) : null}
      {es.mainHomeRecommendationHe ? (
        <div className="rounded-lg border border-amber-400/28 bg-amber-950/14 px-3 py-2.5">
          <h4 className="pr-detailed-subheading text-amber-100/95 mb-1 border-0 pb-0">פעולת בית מרכזית לתקופה</h4>
          <p className="pr-detailed-body-text text-sm m-0 leading-relaxed">{es.mainHomeRecommendationHe}</p>
        </div>
      ) : null}
      {(es.topImmediateParentActionHe ||
        es.secondPriorityActionHe ||
        (es.monitoringOnlyAreasHe && es.monitoringOnlyAreasHe.length) ||
        (es.deferForNowAreasHe && es.deferForNowAreasHe.length)) && (
        <div className="rounded-lg border border-sky-400/24 bg-sky-950/12 px-3 py-2.5 pr-detailed-avoid-split">
          <h4 className="pr-detailed-subheading text-sky-100/95 mb-1.5 border-0 pb-0">מה לעשות עכשיו — לפי סדר</h4>
          <div className="space-y-1.5 text-[11px] md:text-sm text-white/[0.86] leading-snug">
            {es.topImmediateParentActionHe ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">עדיפות ראשונה: </span>
                {es.topImmediateParentActionHe}
              </p>
            ) : (
              <p className="m-0 text-white/55">אין עדיפות מיידית מובחנת — מומלץ להישאר על שגרה קצרה.</p>
            )}
            {es.secondPriorityActionHe ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">עדיפות שנייה: </span>
                {es.secondPriorityActionHe}
              </p>
            ) : null}
            {es.monitoringOnlyAreasHe?.length ? (
              <div className="m-0">
                <span className="text-white/45 font-bold">מעקב בלבד: </span>
                <span className="text-white/[0.82]">{es.monitoringOnlyAreasHe.join(" · ")}</span>
              </div>
            ) : null}
            {es.deferForNowAreasHe?.length ? (
              <div className="m-0">
                <span className="text-white/45 font-bold">לדחות כרגע: </span>
                <span className="text-white/[0.82]">{es.deferForNowAreasHe.join(" · ")}</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
      {(es.dominantCrossSubjectMistakePatternLabelHe ||
        es.crossSubjectLearningStageLabelHe ||
        (es.reviewBeforeAdvanceAreasHe && es.reviewBeforeAdvanceAreasHe.length) ||
        (es.transferReadyAreasHe && es.transferReadyAreasHe.length)) && (
        <div className="rounded-lg border border-emerald-400/22 bg-emerald-950/10 px-3 py-2.5 pr-detailed-avoid-split">
          <h4 className="pr-detailed-subheading text-emerald-100/95 mb-1.5 border-0 pb-0">טעות חוזרת ושימור למידה</h4>
          <div className="space-y-1 text-[11px] md:text-sm text-white/[0.86] leading-snug">
            {es.dominantCrossSubjectMistakePatternLabelHe ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">דפוס בולט: </span>
                {es.dominantCrossSubjectMistakePatternLabelHe}
              </p>
            ) : null}
            {es.crossSubjectLearningStageLabelHe ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">מצב לאורך זמן: </span>
                {es.crossSubjectLearningStageLabelHe}
                {es.crossSubjectRetentionRisk
                  ? ` · סיכון שימור: ${
                      { low: "נמוך", moderate: "בינוני", high: "גבוה", unknown: "לא ברור" }[
                        String(es.crossSubjectRetentionRisk)
                      ] || es.crossSubjectRetentionRisk
                    }`
                  : ""}
                {es.crossSubjectTransferReadiness
                  ? ` · מוכנות להעברה: ${
                      {
                        not_ready: "לא עכשיו",
                        limited: "מוגבלת",
                        emerging: "מתחילה",
                        ready: "זהירה",
                      }[String(es.crossSubjectTransferReadiness)] || es.crossSubjectTransferReadiness
                    }`
                  : ""}
              </p>
            ) : null}
            {es.reviewBeforeAdvanceAreasHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">חזרה לפני קידום: </span>
                {es.reviewBeforeAdvanceAreasHe.join(" · ")}
              </p>
            ) : null}
            {es.transferReadyAreasHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">מוכנות להרחבה זהירה: </span>
                {es.transferReadyAreasHe.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
      )}
      {(es.crossSubjectResponseToInterventionLabelHe ||
        es.crossSubjectSupportAdjustmentNeedHe ||
        es.crossSubjectRecalibrationNeedHe ||
        (es.majorRecheckAreasHe && es.majorRecheckAreasHe.length) ||
        (es.areasWhereSupportCanBeReducedHe && es.areasWhereSupportCanBeReducedHe.length) ||
        (es.areasNeedingStrategyChangeHe && es.areasNeedingStrategyChangeHe.length)) && (
        <div className="rounded-lg border border-teal-400/22 bg-teal-950/10 px-3 py-2.5 pr-detailed-avoid-split">
          <h4 className="pr-detailed-subheading text-teal-100/95 mb-1.5 border-0 pb-0">תמיכה, תגובה והתאמה</h4>
          <div className="space-y-1 text-[11px] md:text-sm text-white/[0.86] leading-snug">
            {es.crossSubjectResponseToInterventionLabelHe ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">מה נראה שקורה: </span>
                {es.crossSubjectResponseToInterventionLabelHe}
              </p>
            ) : null}
            {es.crossSubjectSupportAdjustmentNeedHe ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">כיוון לשבוע הבא: </span>
                {es.crossSubjectSupportAdjustmentNeedHe}
              </p>
            ) : null}
            {es.crossSubjectRecalibrationNeedHe &&
            es.crossSubjectRecalibrationNeedHe !== "אין צורך מיוחד בריענון כרגע" ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">ריענון מסקנה: </span>
                {es.crossSubjectRecalibrationNeedHe}
              </p>
            ) : null}
            {es.majorRecheckAreasHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">אזורים לבדיקה מחדש: </span>
                {es.majorRecheckAreasHe.join(" · ")}
              </p>
            ) : null}
            {es.areasWhereSupportCanBeReducedHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">אפשר להפחית תמיכה בהדרגה: </span>
                {es.areasWhereSupportCanBeReducedHe.join(" · ")}
              </p>
            ) : null}
            {es.areasNeedingStrategyChangeHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">שינוי אסטרטגיה מוצדק: </span>
                {es.areasNeedingStrategyChangeHe.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
      )}
      {(String(es.crossSubjectSupportSequenceStateLabelHe || "").trim() ||
        String(es.crossSubjectNextBestSequenceStepHe || "").trim() ||
        (es.subjectsReadyForReleaseHe && es.subjectsReadyForReleaseHe.length) ||
        (es.subjectsAtRiskOfSupportRepetitionHe && es.subjectsAtRiskOfSupportRepetitionHe.length) ||
        (es.subjectsNeedingSupportResetHe && es.subjectsNeedingSupportResetHe.length)) && (
        <div className="rounded-lg border border-indigo-400/22 bg-indigo-950/10 px-3 py-2.5 pr-detailed-avoid-split">
          <h4 className="pr-detailed-subheading text-indigo-100/95 mb-1.5 border-0 pb-0">רצף תמיכה — מבט על התקופה</h4>
          <div className="space-y-1 text-[11px] md:text-sm text-white/[0.86] leading-snug">
            {String(es.crossSubjectSupportSequenceStateLabelHe || "").trim() ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">מצב כללי: </span>
                {truncateHe(String(es.crossSubjectSupportSequenceStateLabelHe), 220)}
              </p>
            ) : null}
            {String(es.crossSubjectNextBestSequenceStepHe || "").trim() ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">כיוון לרצף: </span>
                {truncateHe(String(es.crossSubjectNextBestSequenceStepHe), 220)}
              </p>
            ) : null}
            {es.subjectsReadyForReleaseHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">מוכנות לשחרור זהיר: </span>
                {truncateHe(es.subjectsReadyForReleaseHe.join(" · "), 260)}
              </p>
            ) : null}
            {es.subjectsAtRiskOfSupportRepetitionHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">סיכון לחזרתיות: </span>
                {truncateHe(es.subjectsAtRiskOfSupportRepetitionHe.join(" · "), 260)}
              </p>
            ) : null}
            {es.subjectsNeedingSupportResetHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">כדאי לעצור ולחדש כיוון: </span>
                {truncateHe(es.subjectsNeedingSupportResetHe.join(" · "), 260)}
              </p>
            ) : null}
          </div>
        </div>
      )}
      {(String(es.crossSubjectRecommendationMemoryStateLabelHe || "").trim() ||
        (es.subjectsWithClearCarryoverHe && es.subjectsWithClearCarryoverHe.length) ||
        (es.subjectsNeedingFreshEvidenceHe && es.subjectsNeedingFreshEvidenceHe.length) ||
        (es.subjectsWherePriorPathSeemsMisalignedHe && es.subjectsWherePriorPathSeemsMisalignedHe.length)) && (
        <div className="rounded-lg border border-slate-400/22 bg-slate-950/12 px-3 py-2.5 pr-detailed-avoid-split">
          <h4 className="pr-detailed-subheading text-slate-100/95 mb-1.5 border-0 pb-0">זיכרון המלצה ותוצאה</h4>
          <div className="space-y-1 text-[11px] md:text-sm text-white/[0.86] leading-snug">
            {String(es.crossSubjectRecommendationMemoryStateLabelHe || "").trim() ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">זיכרון תומך: </span>
                {truncateHe(String(es.crossSubjectRecommendationMemoryStateLabelHe), 220)}
                {String(es.crossSubjectSupportHistoryDepthLabelHe || "").trim()
                  ? ` · ${truncateHe(String(es.crossSubjectSupportHistoryDepthLabelHe), 120)}`
                  : ""}
              </p>
            ) : null}
            {String(es.crossSubjectExpectedVsObservedMatchHe || "").trim() ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">התאמה צפי־מול־נצפה: </span>
                {truncateHe(String(es.crossSubjectExpectedVsObservedMatchHe), 220)}
              </p>
            ) : null}
            {String(es.crossSubjectContinuationDecisionHe || "").trim() ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">כיוון המשך: </span>
                {truncateHe(String(es.crossSubjectContinuationDecisionHe), 220)}
              </p>
            ) : null}
            {es.subjectsWithClearCarryoverHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">עקביות טובה: </span>
                {truncateHe(es.subjectsWithClearCarryoverHe.join(" · "), 260)}
              </p>
            ) : null}
            {es.subjectsNeedingFreshEvidenceHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">צריך אות טרי: </span>
                {truncateHe(es.subjectsNeedingFreshEvidenceHe.join(" · "), 260)}
              </p>
            ) : null}
            {es.subjectsWherePriorPathSeemsMisalignedHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">מסלול קודם לא מתיישר: </span>
                {truncateHe(es.subjectsWherePriorPathSeemsMisalignedHe.join(" · "), 260)}
              </p>
            ) : null}
          </div>
        </div>
      )}
      {(String(es.crossSubjectGateStateLabelHe || "").trim() ||
        String(es.crossSubjectNextCycleDecisionFocusHe || "").trim() ||
        String(es.crossSubjectEvidenceTargetTypeLabelHe || "").trim() ||
        String(es.crossSubjectTargetObservationWindowLabelHe || "").trim() ||
        (es.subjectsNearReleaseButNotThereHe && es.subjectsNearReleaseButNotThereHe.length) ||
        (es.subjectsNeedingRecheckBeforeDecisionHe && es.subjectsNeedingRecheckBeforeDecisionHe.length) ||
        (es.subjectsWithVisiblePivotTriggerHe && es.subjectsWithVisiblePivotTriggerHe.length)) && (
        <div className="rounded-lg border border-fuchsia-400/22 bg-fuchsia-950/10 px-3 py-2.5 pr-detailed-avoid-split">
          <h4 className="pr-detailed-subheading text-fuchsia-100/95 mb-1.5 border-0 pb-0">לפני ההחלטה הבאה</h4>
          <div className="space-y-1 text-[11px] md:text-sm text-white/[0.86] leading-snug">
            {String(es.crossSubjectGateStateLabelHe || "").trim() ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">מצב שערים: </span>
                {truncateHe(String(es.crossSubjectGateStateLabelHe), 220)}
              </p>
            ) : null}
            {String(es.crossSubjectNextCycleDecisionFocusHe || "").trim() ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">מיקוד סבב: </span>
                {truncateHe(String(es.crossSubjectNextCycleDecisionFocusHe), 240)}
              </p>
            ) : null}
            {(String(es.crossSubjectEvidenceTargetTypeLabelHe || "").trim() ||
              String(es.crossSubjectTargetObservationWindowLabelHe || "").trim()) && (
              <p className="m-0">
                <span className="text-white/45 font-bold">מה לאסוף: </span>
                {truncateHe(
                  [es.crossSubjectEvidenceTargetTypeLabelHe, es.crossSubjectTargetObservationWindowLabelHe]
                    .filter(Boolean)
                    .join(" · "),
                  260
                )}
              </p>
            )}
            {es.subjectsNearReleaseButNotThereHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">קרובים לשחרור — עדיין לא: </span>
                {truncateHe(es.subjectsNearReleaseButNotThereHe.join(" · "), 260)}
              </p>
            ) : null}
            {es.subjectsNeedingRecheckBeforeDecisionHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">ריענון לפני החלטה: </span>
                {truncateHe(es.subjectsNeedingRecheckBeforeDecisionHe.join(" · "), 260)}
              </p>
            ) : null}
            {es.subjectsWithVisiblePivotTriggerHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">סימן לשינוי כיוון זהיר: </span>
                {truncateHe(es.subjectsWithVisiblePivotTriggerHe.join(" · "), 260)}
              </p>
            ) : null}
          </div>
        </div>
      )}
      {(String(es.crossSubjectDependencyStateLabelHe || "").trim() ||
        String(es.crossSubjectFoundationFirstPriorityHe || "").trim() ||
        (es.subjectsLikelyShowingDownstreamSymptomsHe && es.subjectsLikelyShowingDownstreamSymptomsHe.length) ||
        (es.subjectsNeedingFoundationFirstHe && es.subjectsNeedingFoundationFirstHe.length) ||
        (es.subjectsSafeForLocalInterventionHe && es.subjectsSafeForLocalInterventionHe.length)) && (
        <div className="rounded-lg border border-emerald-400/22 bg-emerald-950/10 px-3 py-2.5 pr-detailed-avoid-split">
          <h4 className="pr-detailed-subheading text-emerald-100/95 mb-1.5 border-0 pb-0">יסוד מול קושי מקומי</h4>
          <div className="space-y-1 text-[11px] md:text-sm text-white/[0.86] leading-snug">
            {String(es.crossSubjectDependencyStateLabelHe || "").trim() ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">תמונה כללית: </span>
                {truncateHe(String(es.crossSubjectDependencyStateLabelHe), 220)}
                {String(es.crossSubjectLikelyFoundationalBlockerLabelHe || "").trim()
                  ? ` · ${truncateHe(String(es.crossSubjectLikelyFoundationalBlockerLabelHe), 140)}`
                  : ""}
              </p>
            ) : null}
            {String(es.crossSubjectFoundationFirstPriorityHe || "").trim() ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">עדיפות סבב: </span>
                {truncateHe(String(es.crossSubjectFoundationFirstPriorityHe), 240)}
              </p>
            ) : null}
            {es.subjectsLikelyShowingDownstreamSymptomsHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">אולי תסמין משנה: </span>
                {truncateHe(es.subjectsLikelyShowingDownstreamSymptomsHe.join(" · "), 260)}
              </p>
            ) : null}
            {es.subjectsNeedingFoundationFirstHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">יסוד קודם: </span>
                {truncateHe(es.subjectsNeedingFoundationFirstHe.join(" · "), 260)}
              </p>
            ) : null}
            {es.subjectsSafeForLocalInterventionHe?.length ? (
              <p className="m-0">
                <span className="text-white/45 font-bold">מקומי בטוח יותר: </span>
                {truncateHe(es.subjectsSafeForLocalInterventionHe.join(" · "), 260)}
              </p>
            ) : null}
          </div>
        </div>
      )}
      {es.cautionNoteHe ? (
        <div className="rounded-lg border border-rose-400/28 bg-rose-950/12 px-3 py-2.5">
          <h4 className="pr-detailed-subheading text-rose-100/95 mb-1 border-0 pb-0">זהירות</h4>
          <p className="pr-detailed-body-text text-sm m-0 leading-relaxed">{es.cautionNoteHe}</p>
        </div>
      ) : null}
      {es.overallConfidenceHe ? (
        <div>
          <h4 className="pr-detailed-subheading text-sky-200/95">ביטחון בנתונים (חוצה־מקצועות)</h4>
          <p className="pr-detailed-body-text text-sm m-0 leading-relaxed">{es.overallConfidenceHe}</p>
        </div>
      ) : null}
      {es.mixedSignalNoticeHe ? (
        <div className="rounded-lg border border-violet-400/25 bg-violet-950/12 px-3 py-2">
          <p className="pr-detailed-body-text text-sm m-0 text-violet-100/95 leading-relaxed">{es.mixedSignalNoticeHe}</p>
        </div>
      ) : null}
      {!compact && (es.reportReadinessHe || es.evidenceBalanceHe) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-white/78">
          {es.reportReadinessHe ? (
            <p className="m-0 leading-relaxed">
              <span className="text-white/45 font-bold block text-[11px] mb-0.5">מוכנות הדוח</span>
              {es.reportReadinessHe}
            </p>
          ) : null}
          {es.evidenceBalanceHe ? (
            <p className="m-0 leading-relaxed">
              <span className="text-white/45 font-bold block text-[11px] mb-0.5">איזון ראיות</span>
              {es.evidenceBalanceHe}
            </p>
          ) : null}
        </div>
      ) : null}
      {es.homeFocusHe ? (
        <div>
          <h4 className="pr-detailed-subheading text-sky-200/95">מילה על הבית</h4>
          <p className="pr-detailed-body-text whitespace-pre-line leading-relaxed m-0">{es.homeFocusHe}</p>
        </div>
      ) : null}
    </div>
  );
}

function trendOverlapsDiagnosis(diagnosisHe, trendNarrativeHe) {
  const t = String(trendNarrativeHe || "").trim();
  const d = String(diagnosisHe || "").trim();
  if (!t || !d || t.length < 16) return false;
  return d.includes(t.slice(0, Math.min(28, t.length)));
}

/** שדות Phase 3 — מבנה תוויות; מצמצם חזרה על מגמה אם כבר במכתב */
export function SubjectPhase3Insights({ sp, compact }) {
  const letter = useMemo(() => (compact ? null : buildSubjectParentLetter(sp)), [sp, compact]);
  const trendHidden = letter && trendOverlapsDiagnosis(letter.diagnosisHe, sp?.trendNarrativeHe);
  const homeNorm = sp?.recommendedHomeMethodHe
    ? String(rewriteParentRecommendationForDetailedHe(String(sp.recommendedHomeMethodHe)))
        .replace(/\s+/g, " ")
        .trim()
    : "";
  const letterHomeNorm = letter?.homeAction ? String(letter.homeAction).replace(/\s+/g, " ").trim() : "";
  const hideStructuredHome =
    homeNorm && letterHomeNorm && (homeNorm === letterHomeNorm || letterHomeNorm.includes(homeNorm.slice(0, 50)));

  const rows = [];
  const dr = String(sp?.dominantLearningRiskLabelHe || "").trim();
  if (dr) rows.push({ k: "דפוס קושי דומיננטי", v: dr });
  const ds = String(sp?.dominantSuccessPatternLabelHe || "").trim();
  if (ds) rows.push({ k: "דפוס הצלחה", v: ds });
  if (sp?.trendNarrativeHe && String(sp.trendNarrativeHe).trim()) {
    rows.push({
      k: "מגמה",
      v: trendHidden ? "מפורט במשפט האבחה למטה." : truncateHe(String(sp.trendNarrativeHe), compact ? 120 : 220),
    });
  }
  const conf = String(sp?.confidenceSummaryHe || "").trim();
  if (conf) rows.push({ k: "ביטחון בנתונים", v: truncateHe(conf, compact ? 100 : 200) });
  const beh = sp?.dominantBehaviorProfileAcrossRows;
  if (beh && String(beh).trim() && String(beh) !== "undetermined") {
    rows.push({ k: "פרופיל התנהגות נפוף בשורות", v: behaviorDominantLabelHe(beh) });
  }
  const fr = Number(sp?.fragileSuccessRowCount) || 0;
  const stb = Number(sp?.stableMasteryRowCount) || 0;
  if (fr > 0 || stb > 0) {
    rows.push({ k: "שורות (מערכת)", v: `${stb} מאסטרי יציב · ${fr} הצלחה שבירה` });
  }
  const modeNote = String(sp?.modeConcentrationNoteHe || "").trim();
  if (modeNote) rows.push({ k: "מיקוד לפי מצב תרגול", v: modeNote });
  const risks = subjectMajorRiskLabelsHe(sp?.majorRiskFlagsAcrossRows, 5);
  if (risks.length) {
    rows.push({ k: "אזהרות מערכת", v: risks.join(" · ") });
  }
  if (sp?.recommendedHomeMethodHe && String(sp.recommendedHomeMethodHe).trim() && !hideStructuredHome) {
    rows.push({
      k: "דגש ביתי (מבנה)",
      v: truncateHe(rewriteParentRecommendationForDetailedHe(String(sp.recommendedHomeMethodHe)), compact ? 140 : 260),
    });
  }
  const wnt = String(sp?.whatNotToDoHe || "").trim();
  if (wnt && (!letter?.closing || !String(letter.closing).includes(wnt.slice(0, 24)))) {
    rows.push({ k: "מה להימנע ממנו", v: truncateHe(wnt, compact ? 120 : 220) });
  }
  const sdn = String(sp?.subjectDoNowHe || "").trim();
  if (sdn) rows.push({ k: "עכשיו (מקצוע)", v: truncateHe(sdn, compact ? 110 : 200) });
  const san = String(sp?.subjectAvoidNowHe || "").trim();
  if (san) rows.push({ k: "להימנע עכשיו (מקצוע)", v: truncateHe(san, compact ? 110 : 200) });
  const spr = String(sp?.subjectPriorityReasonHe || "").trim();
  if (spr && (!letter?.opening || !String(letter.opening).includes(spr.slice(0, 20)))) {
    rows.push({ k: "סולם עדיפות", v: truncateHe(spr, compact ? 120 : 220) });
  }
  const dmp = String(sp?.dominantMistakePatternLabelHe || "").trim();
  if (dmp) rows.push({ k: "דפוס טעות (מקצוע)", v: truncateHe(dmp, compact ? 100 : 180) });
  const sls = String(sp?.subjectLearningStageLabelHe || "").trim();
  if (sls) rows.push({ k: "שימור למידה", v: truncateHe(sls, compact ? 100 : 180) });
  const srb = String(sp?.subjectReviewBeforeAdvanceHe || "").trim();
  if (srb) rows.push({ k: "לפני קידום", v: truncateHe(srb, compact ? 110 : 200) });
  const str = String(sp?.subjectTransferReadiness || "").trim();
  if (str && str !== "unknown")
    rows.push({
      k: "מוכנות להעברה",
      v: truncateHe(transferReadinessLineHe(sp) || str, compact ? 90 : 160),
    });
  const effN = String(sp?.subjectEffectivenessNarrativeHe || "").trim();
  if (effN) rows.push({ k: "תמיכה והתקדמות", v: truncateHe(effN, compact ? 130 : 240) });
  const sAdj = String(sp?.subjectSupportAdjustmentNeedHe || "").trim();
  if (sAdj && (!effN || !effN.includes(sAdj.slice(0, 12)))) {
    rows.push({ k: "התאמה לשבוע הבא", v: truncateHe(sAdj, compact ? 100 : 200) });
  }
  const sRec = String(sp?.subjectRecalibrationNeedHe || "").trim();
  if (sRec && sRec !== "אין צורך מיוחד בריענון כרגע" && (!effN || !effN.includes(sRec.slice(0, 10)))) {
    rows.push({ k: "ריענון מסקנה", v: truncateHe(sRec, compact ? 100 : 200) });
  }
  const seqN = String(sp?.subjectSequenceNarrativeHe || "").trim();
  if (seqN && (!effN || !effN.includes(seqN.slice(0, 14)))) {
    rows.push({ k: "רצף תמיכה", v: truncateHe(seqN, compact ? 130 : 240) });
  }
  const outN = String(sp?.subjectOutcomeNarrativeHe || "").trim();
  if (outN && (!seqN || !seqN.includes(outN.slice(0, 12)))) {
    rows.push({ k: "זיכרון המלצה ותוצאה", v: truncateHe(outN, compact ? 130 : 240) });
  }
  const gateN = String(sp?.subjectGateNarrativeHe || "").trim();
  if (gateN && (!outN || !outN.includes(gateN.slice(0, 14)))) {
    rows.push({ k: "מה צריך לראות לפני ההחלטה הבאה", v: truncateHe(gateN, compact ? 130 : 240) });
  }
  const depSub = String(sp?.subjectDependencyNarrativeHe || "").trim();
  if (depSub && (!gateN || !gateN.includes(depSub.slice(0, 14)))) {
    rows.push({ k: "יסוד קודם או קושי מקומי?", v: truncateHe(depSub, compact ? 130 : 240) });
  }
  const ffp = String(sp?.subjectFoundationFirstPriorityHe || "").trim();
  if (ffp && sp?.subjectFoundationFirstPriority && (!depSub || !depSub.includes(ffp.slice(0, 12)))) {
    rows.push({ k: "עדיפות יסוד", v: truncateHe(ffp, compact ? 120 : 200) });
  }

  if (!rows.length) return null;

  return (
    <div className="pr-detailed-phase3-dl space-y-2 m-0 mb-2 pr-detailed-avoid-split">
      {rows.map(({ k, v }) => (
        <div key={k} className="min-w-0">
          <div className="text-white/50 font-bold text-[11px] md:text-xs m-0 mb-0.5">{k}</div>
          <div className="m-0 text-white/[0.88] leading-relaxed text-[11px] md:text-sm">{v}</div>
        </div>
      ))}
    </div>
  );
}

/** פירוט מקוצר למקצוע — רק שדות מה־payload הקיים (ללא מנוע נפרד) */
export function SubjectSummaryBlock({ sp }) {
  const L = useMemo(() => buildSubjectParentLetterCompact(sp), [sp]);
  const riskChips = useMemo(() => subjectMajorRiskLabelsHe(sp?.majorRiskFlagsAcrossRows, 4), [sp]);
  return (
    <div className="pr-detailed-summary-subject pr-detailed-subject-stack min-w-0">
      <div className="pr-detailed-subject-heading">
        <h3 className="pr-detailed-subject-title text-base md:text-lg font-bold text-white m-0 tracking-tight pb-2 border-b border-white/12">
          {sp.subjectLabelHe}
        </h3>
      </div>
      <div className="pr-detailed-subject-inner space-y-2.5 pt-3">
        <SubjectPhase3Insights sp={sp} compact />
        <p className="pr-detailed-body-text text-sm leading-relaxed m-0">{L.opening}</p>
        {L.middle ? (
          <p className="pr-detailed-body-text text-sm leading-relaxed m-0 text-white/[0.86]">{L.middle}</p>
        ) : null}
        {L.homeAction ? (
          <p className="pr-detailed-body-text text-sm leading-relaxed m-0 rounded-lg border border-amber-400/28 bg-amber-950/14 px-3 py-2.5">
            {L.homeAction}
          </p>
        ) : null}
        {riskChips.length ? (
          <div className="flex flex-wrap gap-1">
            {riskChips.map((lab) => (
              <span
                key={lab}
                className="inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-400/35 bg-rose-950/25 text-rose-100/95"
              >
                {lab}
              </span>
            ))}
          </div>
        ) : null}
        <p className="pr-detailed-body-text text-sm leading-relaxed m-0 text-white/82">{L.closing}</p>
      </div>
    </div>
  );
}

/** פס Phase 2 על המלצת נושא */
export function TopicRecommendationExplainStrip({ tr }) {
  const sig = tr?.topicEngineRowSignals && typeof tr.topicEngineRowSignals === "object" ? tr.topicEngineRowSignals : null;
  const why = truncateHe(
    sanitizeEngineSnippetHe(String(tr?.whyThisRecommendationHe || sig?.whyThisRecommendationHe || "")),
    130
  );
  const whatCh = truncateHe(String(tr?.whatCouldChangeThisHe || sig?.whatCouldChangeThisHe || ""), 100);
  const risks = activeRiskFlagLabelsHe(tr?.riskFlags ?? sig?.riskFlags, 4);
  const diagRaw = tr?.diagnosticType ?? sig?.diagnosticType;
  const diag = diagRaw ? diagnosticTypeLabelHe(diagRaw) : "";
  const cRaw = tr?.confidenceBadge ?? sig?.confidenceBadge;
  const sRaw = tr?.sufficiencyBadge ?? sig?.sufficiencyBadge;
  const cBad = cRaw != null ? confidenceBadgeLabelHe(cRaw) : "";
  const sBad = sRaw != null ? sufficiencyBadgeLabelHe(sRaw) : "";
  const ip = truncateHe(String(tr?.interventionPlanHe || sig?.interventionPlanHe || ""), 132);
  const dn = truncateHe(String(tr?.doNowHe || sig?.doNowHe || ""), 96);
  const av = truncateHe(String(tr?.avoidNowHe || sig?.avoidNowHe || ""), 96);
  const caut = truncateHe(String(tr?.cautionLineHe || sig?.cautionLineHe || ""), 118);
  const calLine = truncateHe(phase8PracticeCalibrationLineHe(tr || sig), 100);
  const p8chips = phase8TopicMetaChipsHe(tr || {});
  const mpLine = truncateHe(mistakePatternLineHe(tr || sig), 118);
  const lmLine = truncateHe(learningMemoryLineHe(tr || sig), 118);
  const rbaLine = truncateHe(reviewBeforeAdvanceLineHe(tr || sig), 100);
  const trLine = truncateHe(transferReadinessLineHe(tr || sig), 100);
  const rtiLine = truncateHe(responseToInterventionLineHe(tr || sig), 118);
  const frLine = truncateHe(freshnessLineHe(tr || sig), 118);
  const adjLine = truncateHe(supportAdjustmentLineHe(tr || sig), 120);
  const recLine = truncateHe(recalibrationLineHe(tr || sig), 110);
  const seqTopicLine = truncateHe(topicSupportSequenceOrReleaseLineHe(tr || sig), 118);
  const repFatLine = truncateHe(topicRepetitionFatigueCompactLineHe(tr || sig), 118);
  const seqActLine = truncateHe(sequenceActionLineHe(tr || sig), 118);
  const memLine = truncateHe(recommendationMemoryLineHe(tr || sig), 118);
  const outLine = truncateHe(outcomeTrackingLineHe(tr || sig), 118);
  const contLine = truncateHe(continuationDecisionLineHe(tr || sig), 118);
  const freshLine = truncateHe(freshEvidenceNeedLineHe(tr || sig), 110);
  const gateLine = truncateHe(gateStateLineHe(tr || sig), 118);
  const evTargetLine = truncateHe(evidenceTargetLineHe(tr || sig), 118);
  const decFocusLine = truncateHe(decisionFocusLineHe(tr || sig), 118);
  const gateTrigLine = truncateHe(gateTriggerCompactLineHe(tr || sig), 118);
  const depLine = truncateHe(dependencyStateLineHe(tr || sig), 118);
  const ordLine = truncateHe(interventionOrderingLineHe(tr || sig), 118);
  const fbeLine = truncateHe(foundationBeforeExpansionLineHe(tr || sig), 118);
  const dssLine = truncateHe(downstreamSymptomLineHe(tr || sig), 118);
  const hasPhase8 = !!(
    ip ||
    dn ||
    av ||
    caut ||
    calLine ||
    p8chips.length ||
    mpLine ||
    lmLine ||
    rbaLine ||
    trLine ||
    rtiLine ||
    frLine ||
    adjLine ||
    recLine ||
    seqTopicLine ||
    repFatLine ||
    seqActLine ||
    memLine ||
    outLine ||
    contLine ||
    freshLine ||
    gateLine ||
    evTargetLine ||
    decFocusLine ||
    gateTrigLine ||
    depLine ||
    ordLine ||
    fbeLine ||
    dssLine
  );
  if (!why && !risks.length && !diag && !cBad && !sBad && !whatCh && !hasPhase8) return null;
  return (
    <div className="pr-detailed-topic-phase2 mt-2 space-y-1.5 border-t border-white/10 pt-2">
      <div className="flex flex-wrap gap-1">
        {cBad ? (
          <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border border-sky-400/35 text-sky-100/95 bg-sky-950/20">
            {cBad}
          </span>
        ) : null}
        {sBad ? (
          <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-400/35 text-slate-100/90 bg-slate-900/25">
            {sBad}
          </span>
        ) : null}
        {diag ? (
          <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/15 text-white/80">
            {diag}
          </span>
        ) : null}
        {risks.map((lab) => (
          <span
            key={lab}
            className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-400/35 text-rose-100/95 bg-rose-950/20"
          >
            {lab}
          </span>
        ))}
        {p8chips.map((lab) => (
          <span
            key={lab}
            className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-400/28 text-emerald-100/90 bg-emerald-950/15"
          >
            {lab}
          </span>
        ))}
      </div>
      {why ? (
        <p className="pr-detailed-body-text text-[11px] md:text-xs m-0 text-white/78 leading-snug">
          <span className="text-white/45 font-bold">למה: </span>
          {why}
        </p>
      ) : null}
      {whatCh ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-white/60 leading-snug">
          <span className="text-white/40 font-bold">מה יכול לשנות: </span>
          {whatCh}
        </p>
      ) : null}
      {ip ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-emerald-100/88 leading-snug">
          <span className="text-white/45 font-bold">תוכנית קצרה: </span>
          {ip}
        </p>
      ) : null}
      {calLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-white/65 leading-snug">
          <span className="text-white/40 font-bold">כיול תרגול: </span>
          {calLine}
        </p>
      ) : null}
      {dn || av ? (
        <div className="text-[10px] md:text-[11px] text-sky-100/88 leading-snug space-y-0.5 border border-sky-400/18 rounded px-2 py-1 bg-sky-950/10">
          {dn ? (
            <p className="m-0">
              <span className="text-white/45 font-bold">עכשיו: </span>
              {dn}
            </p>
          ) : null}
          {av ? (
            <p className="m-0">
              <span className="text-white/45 font-bold">להימנע: </span>
              {av}
            </p>
          ) : null}
        </div>
      ) : null}
      {caut ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-amber-100/85 leading-snug">
          <span className="text-white/45 font-bold">זהירות: </span>
          {caut}
        </p>
      ) : null}
      {mpLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-white/72 leading-snug">
          <span className="text-white/45 font-bold">דפוס טעות: </span>
          {mpLine}
        </p>
      ) : null}
      {lmLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-white/72 leading-snug">
          <span className="text-white/45 font-bold">שימור: </span>
          {lmLine}
        </p>
      ) : null}
      {rbaLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-violet-100/88 leading-snug">
          <span className="text-white/45 font-bold">לפני קידום: </span>
          {rbaLine}
        </p>
      ) : null}
      {trLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-cyan-100/85 leading-snug">
          <span className="text-white/45 font-bold">העברה: </span>
          {trLine}
        </p>
      ) : null}
      {rtiLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-teal-100/88 leading-snug">
          <span className="text-white/45 font-bold">תגובה לתמיכה: </span>
          {rtiLine}
        </p>
      ) : null}
      {frLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-white/68 leading-snug">
          <span className="text-white/45 font-bold">עדכניות: </span>
          {frLine}
        </p>
      ) : null}
      {adjLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-amber-100/82 leading-snug">
          <span className="text-white/45 font-bold">צעד הבא: </span>
          {adjLine}
        </p>
      ) : null}
      {recLine && !frLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-white/64 leading-snug">
          <span className="text-white/45 font-bold">ריענון: </span>
          {recLine}
        </p>
      ) : null}
      {seqTopicLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-indigo-100/88 leading-snug">
          <span className="text-white/45 font-bold">רצף תמיכה: </span>
          {seqTopicLine}
        </p>
      ) : null}
      {repFatLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-indigo-100/82 leading-snug">
          <span className="text-white/45 font-bold">חזרתיות: </span>
          {repFatLine}
        </p>
      ) : null}
      {seqActLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-indigo-100/85 leading-snug">
          <span className="text-white/45 font-bold">צעד ברצף: </span>
          {seqActLine}
        </p>
      ) : null}
      {memLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-slate-100/85 leading-snug">
          <span className="text-white/45 font-bold">זיכרון המלצה: </span>
          {memLine}
        </p>
      ) : null}
      {outLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-slate-100/82 leading-snug">
          <span className="text-white/45 font-bold">צפי מול נצפה: </span>
          {outLine}
        </p>
      ) : null}
      {contLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-slate-100/88 leading-snug">
          <span className="text-white/45 font-bold">המשך: </span>
          {contLine}
        </p>
      ) : null}
      {freshLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-amber-100/82 leading-snug">
          <span className="text-white/45 font-bold">ראיה טרייה: </span>
          {freshLine}
        </p>
      ) : null}
      {gateLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-fuchsia-100/86 leading-snug">
          <span className="text-white/45 font-bold">שער החלטה: </span>
          {gateLine}
        </p>
      ) : null}
      {evTargetLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-fuchsia-100/84 leading-snug">
          <span className="text-white/45 font-bold">מה לאסוף: </span>
          {evTargetLine}
        </p>
      ) : null}
      {decFocusLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-fuchsia-100/82 leading-snug">
          <span className="text-white/45 font-bold">מיקוד סבב: </span>
          {decFocusLine}
        </p>
      ) : null}
      {gateTrigLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-fuchsia-100/88 leading-snug">
          <span className="text-white/45 font-bold">טריגר: </span>
          {gateTrigLine}
        </p>
      ) : null}
      {depLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-emerald-100/86 leading-snug">
          <span className="text-white/45 font-bold">יסוד/מקומי: </span>
          {depLine}
        </p>
      ) : null}
      {ordLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-emerald-100/84 leading-snug">
          <span className="text-white/45 font-bold">סדר: </span>
          {ordLine}
        </p>
      ) : null}
      {fbeLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-emerald-100/88 leading-snug">
          <span className="text-white/45 font-bold">לפני הרחבה: </span>
          {fbeLine}
        </p>
      ) : null}
      {dssLine ? (
        <p className="pr-detailed-body-text text-[10px] md:text-[11px] m-0 text-emerald-100/82 leading-snug">
          <span className="text-white/45 font-bold">תסמין משנה: </span>
          {dssLine}
        </p>
      ) : null}
    </div>
  );
}
