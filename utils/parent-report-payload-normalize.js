/**
 * נרמול payload לדוח מקיף — ל־UI ולבדיקות (שלב 6).
 * לא משנה מנוע; רק ברירות מחדל בטוחות כשחסרים שדות.
 */

export function normalizeExecutiveSummary(payload) {
  const es = payload?.executiveSummary;
  const d = es && typeof es === "object" ? es : {};
  return {
    topStrengthsAcrossHe: Array.isArray(d.topStrengthsAcrossHe) ? d.topStrengthsAcrossHe : [],
    topFocusAreasHe: Array.isArray(d.topFocusAreasHe) ? d.topFocusAreasHe : [],
    homeFocusHe: typeof d.homeFocusHe === "string" ? d.homeFocusHe : "",
    majorTrendsHe: Array.isArray(d.majorTrendsHe) ? d.majorTrendsHe : [],
    mainHomeRecommendationHe: typeof d.mainHomeRecommendationHe === "string" ? d.mainHomeRecommendationHe : "",
    cautionNoteHe: typeof d.cautionNoteHe === "string" ? d.cautionNoteHe : "",
    overallConfidenceHe: typeof d.overallConfidenceHe === "string" ? d.overallConfidenceHe : "",
    mixedSignalNoticeHe: d.mixedSignalNoticeHe ? String(d.mixedSignalNoticeHe) : "",
    reportReadinessHe: typeof d.reportReadinessHe === "string" ? d.reportReadinessHe : "",
    evidenceBalanceHe: typeof d.evidenceBalanceHe === "string" ? d.evidenceBalanceHe : "",
    dominantCrossSubjectRiskLabelHe:
      typeof d.dominantCrossSubjectRiskLabelHe === "string" ? d.dominantCrossSubjectRiskLabelHe : "",
    dominantCrossSubjectSuccessPatternLabelHe:
      typeof d.dominantCrossSubjectSuccessPatternLabelHe === "string"
        ? d.dominantCrossSubjectSuccessPatternLabelHe
        : "",
  };
}
