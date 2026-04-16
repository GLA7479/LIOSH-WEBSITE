/**
 * V2 detailed-report — parent-facing Hebrew only (params in, strings out).
 * No business rules: callers pass counts/flags already computed.
 */

import { confidenceLevelParentSummaryHe } from "./confidence-parent-he.js";

/**
 * @param {string[]} topFocusAreasHe
 */
export function executiveV2HomeFocusHe(topFocusAreasHe) {
  const areas = Array.isArray(topFocusAreasHe) ? topFocusAreasHe.filter(Boolean) : [];
  if (!areas.length) {
    return "עדיין אין מוקד ברור — השבוע כדאי לעשות סיבוב קצר בכמה נושאים ולראות מה נשמר.";
  }
  return `להתמקד קודם ב: ${areas.slice(0, 2).join(" · ")}`;
}

/**
 * @param {{ units: number, diagnosed: number, uncertain: number, stable: number }} p
 * @returns {string[]}
 */
export function executiveV2MajorTrendsLinesHe(p) {
  const units = Math.max(0, Number(p.units) || 0);
  const diagnosed = Math.max(0, Number(p.diagnosed) || 0);
  const uncertain = Math.max(0, Number(p.uncertain) || 0);
  const stable = Math.max(0, Number(p.stable) || 0);
  const actionable = Math.max(diagnosed, stable);
  if (units === 0) {
    return [
      "בטווח התקופה עדיין לא נאספו נושאים מספקים להשוואה.",
      "ממשיכים תרגול קצר ועקבי כדי לייצר תמונה שאפשר לסכם בצורה אמינה.",
    ];
  }
  if (units === 1 && stable > 0 && diagnosed === 0) {
    return [
      "בטווח התקופה נבדק נושא אחד.",
      "הכיוון באותו נושא חיובי ועקבי, ועדיין נשארים זהירים לפני הרחבה לנושאים נוספים.",
    ];
  }
  return [
    `בטווח התקופה נבדקו ${units} נושאים.`,
    `יש בסיס פעולה ב־${actionable} נושאים; ב־${uncertain} נושאים התמונה עדיין חלקית; מתוך זה ${stable} נושאים מראים חוזקה עקבית.`,
  ];
}

/** @param {boolean} hasUncertain */
export function executiveV2MixedSignalNoticeHe(hasUncertain) {
  if (!hasUncertain) return "";
  return "בכמה נושאים התוצאות עדיין קופצות — עוד קצת תרגול לפני מסקנה חדה.";
}

/**
 * @param {number} diagnosed
 * @param {number} units
 * @param {number} stable
 */
export function executiveV2OverallConfidenceHe(diagnosed, units, stable = 0) {
  const d = Math.max(0, Number(diagnosed) || 0);
  const u = Math.max(0, Number(units) || 0);
  const s = Math.max(0, Number(stable) || 0);
  const actionable = Math.max(d, s);
  if (u === 0) {
    return "מבט כולל: עדיין אין מספיק נושאים בטווח כדי לבנות כיוון ביתי יציב.";
  }
  if (u === 1 && actionable === 0) {
    return "מבט כולל: יש כרגע נושא יחיד בטווח, ולכן נשארים עם מסקנה זהירה וממשיכים לאסוף ראיות.";
  }
  return `מבט כולל: ב־${actionable} מתוך ${u} נושאים שנבדקו יש בסיס ראשוני לשיחה בבית על כיוון ממוקד.`;
}

/**
 * @param {number} stable
 * @param {number} diagnosed
 */
export function executiveV2EvidenceBalanceHe(stable, diagnosed) {
  const s = Math.max(0, Number(stable) || 0);
  const diag = Math.max(0, Number(diagnosed) || 0);
  const rest = Math.max(0, diag - s);
  return `נקודות חוזק שנשמרו לאורך זמן: ${s}; נושאים שצריך לחזק או לאסוף עוד תרגול לפני מסקנה חדה: ${rest}.`;
}

/**
 * @param {{ p4Length: number, uncertainLength: number }} p
 */
export function executiveV2CautionNoteHe(p) {
  const p4 = Math.max(0, Number(p.p4Length) || 0);
  const u = Math.max(0, Number(p.uncertainLength) || 0);
  if (p4 > 0) return "יש נושאים שדורשים תשומת לב גבוהה השבוע — כדאי לתאם עם המורה או המטפל.";
  if (u > 0) return "בחלק מהנושאים עדיין אין מסקנה ברורה — עוד קצת תרגול יבהיר את התמונה.";
  return "";
}

/** @param {number} unitsLength */
export function executiveV2ReportReadinessHe(unitsLength) {
  const n = Math.max(0, Number(unitsLength) || 0);
  return n >= 8
    ? "יש מספיק תרגול בתקופה כדי לדבר על מגמות בבית."
    : "התרגול בתקופה עדיין מצומצם — כדאי לקרוא את הסיכום בזהירות ולהמשיך לאסוף תרגול.";
}

export function homePlanV2EmptyFallbackHe() {
  return "אין כרגע פעולה ביתית חד-משמעית — השבוע כדאי תרגול קצר וממוקד כדי להבהיר את הכיוון.";
}

export function nextPeriodGoalsV2EmptyFallbackHe() {
  return "היעד לשבוע הקרוב: יותר תרגול עקבי ורגוע, ואז אפשר לקבוע יעד קידום ברור.";
}

/**
 * @param {{ unitsLength: number, highPriorityCount: number, contradictoryCount: number }} p
 * @returns {string[]}
 */
export function crossSubjectV2BulletsHe(p) {
  const units = Math.max(0, Number(p.unitsLength) || 0);
  const hi = Math.max(0, Number(p.highPriorityCount) || 0);
  const c = Math.max(0, Number(p.contradictoryCount) || 0);
  const bullets = [
    `בסיכום חוצה־מקצועות: ${units} נושאים בטווח התקופה.`,
    `מתוכם ${hi} נושאים דורשים תשומת לב גבוהה בשבוע הקרוב.`,
  ];
  if (c > 0) {
    bullets.push(
      `ב־${c} נושאים התשובות לא מסתדרות זו עם זו — עוד סיבוב תרגול קצר יראה אם הדפוס נשמר.`
    );
  }
  return bullets;
}

export function crossSubjectV2DataQualityNoteHe(unitsLength) {
  const n = Math.max(0, Number(unitsLength) || 0);
  return n < 8 ? "מספר הנושאים שנבדקו נמוך יחסית — התמונה תתחדד ככל שיצטבר עוד תרגול." : null;
}

export function subjectV2TrendNarrativeHighPriorityHe() {
  return "יש נושאים ששווה לעקוב אחריהם השבוע.";
}

export function subjectV2TrendNarrativeStableHe() {
  return "הדפוסים בטווח הזה נשמרים יחסית לאורך זמן.";
}

export function subjectV2RecalibrationNeedYesHe() {
  return "לפני שינוי מסקנה או רמת קושי — עוד סיבוב תרגול קצר.";
}

/** Canonical “no recalibration” — keep in sync with `SubjectPhase3Insights` visibility filter */
export const SUBJECT_V2_RECALIBRATION_NEED_NO_HE = "אין צורך לשנות כיוון דחוף כרגע.";

export function subjectV2RecalibrationNeedNoHe() {
  return SUBJECT_V2_RECALIBRATION_NEED_NO_HE;
}

/** When output gating blocks a firm conclusion */
export function topicRecommendationV2CautionGatedHe() {
  return "בנושא הזה עדיין לא קובעים כיוון חזק — קודם עוד תרגול ממוקד באותו נושא.";
}

/**
 * @param {string|null|undefined} confidenceLevel
 */
export function subjectV2ConfidenceSummaryHe(confidenceLevel) {
  return confidenceLevelParentSummaryHe(confidenceLevel);
}
