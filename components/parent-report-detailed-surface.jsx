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
  sanitizeEngineSnippetHe,
  subjectMajorRiskLabelsHe,
  sufficiencyBadgeLabelHe,
  truncateHe,
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
  if (!why && !risks.length && !diag && !cBad && !sBad && !whatCh) return null;
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
    </div>
  );
}
