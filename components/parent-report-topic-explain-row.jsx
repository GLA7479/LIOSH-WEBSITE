/**
 * הסברי נושא תחת הגרף בדוח ההורה — מופרד לבדיקות SSR בלי שאר הדף.
 */
import React from "react";
import {
  activeRiskFlagLabelsHe,
  behaviorDominantLabelHe,
  confidenceBadgeLabelHe,
  diagnosticTypeLabelHe,
  formatDecisionTraceBulletsHe,
  learningMemoryLineHe,
  mistakePatternLineHe,
  phase8PracticeCalibrationLineHe,
  phase8TopicMetaChipsHe,
  recalibrationLineHe,
  responseToInterventionLineHe,
  reviewBeforeAdvanceLineHe,
  sanitizeEngineSnippetHe,
  sufficiencyBadgeLabelHe,
  supportAdjustmentLineHe,
  transferReadinessLineHe,
  trendCompactLineHe,
  truncateHe,
  freshnessLineHe,
  sequenceActionLineHe,
  topicRepetitionFatigueCompactLineHe,
  topicSupportSequenceOrReleaseLineHe,
  recommendationMemoryLineHe,
  outcomeTrackingLineHe,
  continuationDecisionLineHe,
  gateStateLineHe,
  evidenceTargetLineHe,
  gateTriggerCompactLineHe,
  dependencyStateLineHe,
  interventionOrderingLineHe,
  foundationBeforeExpansionLineHe,
} from "../utils/parent-report-ui-explain-he";

/** תג קומפקטי — RTL, לא מגדיל את גובה השורה יתר על המידה */
export function PrMiniBadge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-white/15 bg-white/[0.06] text-white/75",
    ok: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100/90",
    warn: "border-amber-400/28 bg-amber-500/12 text-amber-100/90",
    risk: "border-rose-400/30 bg-rose-500/12 text-rose-100/90",
    sky: "border-sky-400/28 bg-sky-500/10 text-sky-100/90",
  };
  return (
    <span
      className={`inline-flex max-w-full items-center rounded px-1 py-0.5 text-[9px] md:text-[10px] font-semibold leading-tight border ${tones[tone] || tones.neutral}`}
    >
      {children}
    </span>
  );
}

/**
 * הסבר שורת נושא מתחת לגרף — שורה ראשית קומפקטית; פרטים ב־details.
 * @param {{ row: Record<string, unknown> }} props
 */
export function ParentReportTopicExplainRow({ row }) {
  const q = Number(row?.questions) || 0;
  if (q <= 0) return null;

  const sig = row.topicEngineRowSignals;
  const trend = row.trend;
  const bp = row.behaviorProfile;
  const whyRaw = sig?.whyThisRecommendationHe ? String(sig.whyThisRecommendationHe) : "";
  const whyOne = truncateHe(sanitizeEngineSnippetHe(whyRaw), 118);
  const trendLine = trendCompactLineHe(trend);
  const diag = sig?.diagnosticType ? diagnosticTypeLabelHe(sig.diagnosticType) : "";
  const beh = bp?.dominantType ? behaviorDominantLabelHe(bp.dominantType) : "";
  const confLab = sig?.confidenceBadge != null ? confidenceBadgeLabelHe(sig.confidenceBadge) : "";
  const suffLab = sig?.sufficiencyBadge != null ? sufficiencyBadgeLabelHe(sig.sufficiencyBadge) : "";
  const risks = activeRiskFlagLabelsHe(sig?.riskFlags, 4);
  const hasSignals = !!(sig || trendLine || beh);
  const mergedTrace = [
    ...(Array.isArray(row.decisionTrace) ? row.decisionTrace : []),
    ...(Array.isArray(row.recommendationDecisionTrace) ? row.recommendationDecisionTrace : []),
  ];
  const traceBullets = formatDecisionTraceBulletsHe(mergedTrace, 4);
  const whatChange = sig?.whatCouldChangeThisHe ? truncateHe(String(sig.whatCouldChangeThisHe), 140) : "";
  const ip = sig?.interventionPlanHe ? truncateHe(String(sig.interventionPlanHe), 130) : "";
  const dn = sig?.doNowHe ? truncateHe(String(sig.doNowHe), 100) : "";
  const av = sig?.avoidNowHe ? truncateHe(String(sig.avoidNowHe), 100) : "";
  const caut = sig?.cautionLineHe ? truncateHe(String(sig.cautionLineHe), 110) : "";
  const calLine = truncateHe(phase8PracticeCalibrationLineHe(row), 96);
  const p8chips = phase8TopicMetaChipsHe(row);
  const hasDetails = !!(traceBullets.length || whatChange || row.patternStabilityHe || row.dataSufficiencyLabelHe);

  return (
    <div className="parent-report-topic-explain-row border-b border-white/[0.07] last:border-b-0 py-1.5 px-1 md:px-2">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1 md:gap-1.5 min-w-0">
          <span className="text-[10px] md:text-xs font-semibold text-white/88 truncate max-w-[58%] md:max-w-[50%]">
            {row.label}
          </span>
          {confLab ? <PrMiniBadge tone="sky">{confLab}</PrMiniBadge> : null}
          {suffLab ? <PrMiniBadge tone="neutral">{suffLab}</PrMiniBadge> : null}
          {trendLine ? (
            <PrMiniBadge tone="warn" title={trendLine}>
              מגמה: {truncateHe(trendLine, 36)}
            </PrMiniBadge>
          ) : null}
          {diag ? <PrMiniBadge tone="neutral">אבחון: {diag}</PrMiniBadge> : null}
          {!diag && beh ? <PrMiniBadge tone="neutral">התנהגות: {beh}</PrMiniBadge> : null}
        </div>
        {whyOne ? (
          <p className="text-[10px] md:text-[11px] text-white/70 leading-snug m-0 pr-0.5">
            <span className="text-white/45 font-semibold">למה: </span>
            {whyOne}
          </p>
        ) : hasSignals ? (
          <p className="text-[10px] md:text-[11px] text-white/55 m-0">אין ניסוח «למה» מהמנוע לשורה זו.</p>
        ) : null}
        {risks.length ? (
          <div className="flex flex-wrap gap-1">
            {risks.map((lab) => (
              <PrMiniBadge key={lab} tone="risk">
                {lab}
              </PrMiniBadge>
            ))}
          </div>
        ) : null}
        {p8chips.length ? (
          <div className="flex flex-wrap gap-1">
            {p8chips.map((lab) => (
              <PrMiniBadge key={lab} tone="ok">
                {lab}
              </PrMiniBadge>
            ))}
          </div>
        ) : null}
        {ip || calLine ? (
          <div className="text-[9px] md:text-[10px] text-emerald-100/85 leading-snug space-y-0.5 m-0 pr-0.5">
            {ip ? (
              <p className="m-0">
                <span className="text-white/45 font-semibold">תוכנית: </span>
                {ip}
              </p>
            ) : null}
            {calLine ? (
              <p className="m-0 text-white/68">
                <span className="text-white/40 font-semibold">כיול: </span>
                {calLine}
              </p>
            ) : null}
          </div>
        ) : null}
        {dn || av ? (
          <div className="text-[9px] md:text-[10px] text-sky-100/88 leading-snug border border-sky-400/20 rounded px-1.5 py-1 bg-sky-950/12 space-y-0.5 m-0 pr-0.5">
            {dn ? (
              <p className="m-0">
                <span className="text-white/45 font-semibold">עכשיו: </span>
                {dn}
              </p>
            ) : null}
            {av ? (
              <p className="m-0">
                <span className="text-white/45 font-semibold">להימנע: </span>
                {av}
              </p>
            ) : null}
          </div>
        ) : null}
        {caut ? (
          <p className="text-[9px] md:text-[10px] text-amber-100/85 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">זהירות: </span>
            {caut}
          </p>
        ) : null}
        {mistakePatternLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-white/70 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">דפוס טעות: </span>
            {mistakePatternLineHe(row)}
          </p>
        ) : null}
        {learningMemoryLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-white/68 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">שימור: </span>
            {learningMemoryLineHe(row)}
          </p>
        ) : null}
        {reviewBeforeAdvanceLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-violet-100/85 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">לפני קידום: </span>
            {reviewBeforeAdvanceLineHe(row)}
          </p>
        ) : null}
        {transferReadinessLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-cyan-100/85 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">העברה: </span>
            {transferReadinessLineHe(row)}
          </p>
        ) : null}
        {responseToInterventionLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-teal-100/88 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">תגובה לתמיכה: </span>
            {truncateHe(responseToInterventionLineHe(row), 150)}
          </p>
        ) : null}
        {freshnessLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-white/66 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">עדכניות: </span>
            {truncateHe(freshnessLineHe(row), 150)}
          </p>
        ) : null}
        {supportAdjustmentLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-amber-100/82 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">צעד הבא: </span>
            {truncateHe(supportAdjustmentLineHe(row), 160)}
          </p>
        ) : null}
        {topicSupportSequenceOrReleaseLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-indigo-100/88 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">רצף תמיכה: </span>
            {truncateHe(topicSupportSequenceOrReleaseLineHe(row), 158)}
          </p>
        ) : null}
        {topicRepetitionFatigueCompactLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-indigo-100/82 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">חזרתיות: </span>
            {truncateHe(topicRepetitionFatigueCompactLineHe(row), 158)}
          </p>
        ) : null}
        {sequenceActionLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-indigo-100/85 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">צעד ברצף: </span>
            {truncateHe(sequenceActionLineHe(row), 158)}
          </p>
        ) : null}
        {recommendationMemoryLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-slate-100/86 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">זיכרון המלצה: </span>
            {truncateHe(recommendationMemoryLineHe(row), 158)}
          </p>
        ) : null}
        {outcomeTrackingLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-slate-100/84 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">צפי מול נצפה: </span>
            {truncateHe(outcomeTrackingLineHe(row), 158)}
          </p>
        ) : null}
        {continuationDecisionLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-slate-100/88 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">המשך: </span>
            {truncateHe(continuationDecisionLineHe(row), 158)}
          </p>
        ) : null}
        {gateStateLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-fuchsia-100/86 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">שער החלטה: </span>
            {truncateHe(gateStateLineHe(row), 158)}
          </p>
        ) : null}
        {evidenceTargetLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-fuchsia-100/82 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">מה לאסוף: </span>
            {truncateHe(evidenceTargetLineHe(row), 158)}
          </p>
        ) : null}
        {gateTriggerCompactLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-fuchsia-100/88 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">טריגר: </span>
            {truncateHe(gateTriggerCompactLineHe(row), 158)}
          </p>
        ) : null}
        {dependencyStateLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-emerald-100/86 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">יסוד/מקומי: </span>
            {truncateHe(dependencyStateLineHe(row), 158)}
          </p>
        ) : null}
        {interventionOrderingLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-emerald-100/84 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">סדר: </span>
            {truncateHe(interventionOrderingLineHe(row), 158)}
          </p>
        ) : null}
        {foundationBeforeExpansionLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-emerald-100/88 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">לפני הרחבה: </span>
            {truncateHe(foundationBeforeExpansionLineHe(row), 158)}
          </p>
        ) : null}
        {recalibrationLineHe(row) && !freshnessLineHe(row) ? (
          <p className="text-[9px] md:text-[10px] text-white/62 m-0 pr-0.5 leading-snug">
            <span className="text-white/45 font-semibold">ריענון: </span>
            {truncateHe(recalibrationLineHe(row), 140)}
          </p>
        ) : null}
        {hasDetails ? (
          <details className="parent-report-topic-explain-details group min-w-0">
            <summary className="cursor-pointer select-none text-[9px] md:text-[10px] font-bold text-sky-300/95 hover:text-sky-200 list-none [&::-webkit-details-marker]:hidden">
              <span className="underline-offset-2 group-open:no-underline">פרטים (מסלול החלטה)</span>
            </summary>
            <div className="mt-1 rounded border border-white/10 bg-black/30 px-2 py-1.5 space-y-1 text-[9px] md:text-[10px] text-white/72 leading-snug">
              {row.dataSufficiencyLabelHe ? (
                <p className="m-0">
                  <span className="text-white/45">נתונים: </span>
                  {row.dataSufficiencyLabelHe}
                </p>
              ) : null}
              {row.patternStabilityHe ? (
                <p className="m-0">
                  <span className="text-white/45">יציבות: </span>
                  {truncateHe(row.patternStabilityHe, 160)}
                </p>
              ) : null}
              {whatChange ? (
                <p className="m-0">
                  <span className="text-white/45">מה יכול לשנות: </span>
                  {whatChange}
                </p>
              ) : null}
              {traceBullets.length ? (
                <ul className="m-0 pr-3 list-disc space-y-0.5">
                  {traceBullets.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

/** רשימת הסברים קומפקטית מתחת לגרף נושאים */
export function ParentReportTopicExplainBlock({ rows }) {
  const withQ = (rows || []).filter((r) => Number(r?.questions) > 0);
  if (!withQ.length) return null;
  return (
    <div className="parent-report-topic-explain-block mt-2 rounded-lg border border-white/10 bg-black/25 overflow-hidden">
      <div className="px-2 py-1 text-[10px] md:text-[11px] font-bold text-white/55 border-b border-white/10">
        הסבר קצר לפי נושא (מהמערכת)
      </div>
      <div className="max-h-[min(42vh,320px)] overflow-y-auto overscroll-contain">
        {withQ.map((r) => (
          <ParentReportTopicExplainRow key={r.rowKey} row={r} />
        ))}
      </div>
    </div>
  );
}
