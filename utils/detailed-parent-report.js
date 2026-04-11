/**
 * דוח מקיף לתקופה — payload נפרד מהדוח הרגיל (V2).
 * מקור נתונים: generateParentReportV2 + patternDiagnostics (לא העתקה עיוורת של אובייקט הדוח כפלט סופי).
 */

import { generateParentReportV2 } from "./parent-report-v2";
import { buildTopicRecommendationsForSubject } from "./topic-next-step-engine";
import { rewriteParentRecommendationForDetailedHe } from "./detailed-report-parent-letter-he";

const SUBJECT_IDS = [
  "math",
  "geometry",
  "english",
  "science",
  "hebrew",
  "moledet-geography",
];

const SUBJECT_LABEL_HE = {
  math: "חשבון",
  geometry: "גאומטריה",
  english: "אנגלית",
  science: "מדעים",
  hebrew: "עברית",
  "moledet-geography": "מולדת וגאוגרפיה",
};

const REPORT_MAP_KEY = {
  math: "mathOperations",
  geometry: "geometryTopics",
  english: "englishTopics",
  science: "scienceTopics",
  hebrew: "hebrewTopics",
  "moledet-geography": "moledetGeographyTopics",
};

const SUMMARY_Q = {
  math: ["mathQuestions", "mathCorrect", "mathAccuracy"],
  geometry: ["geometryQuestions", "geometryCorrect", "geometryAccuracy"],
  english: ["englishQuestions", "englishCorrect", "englishAccuracy"],
  science: ["scienceQuestions", "scienceCorrect", "scienceAccuracy"],
  hebrew: ["hebrewQuestions", "hebrewCorrect", "hebrewAccuracy"],
  "moledet-geography": [
    "moledetGeographyQuestions",
    "moledetGeographyCorrect",
    "moledetGeographyAccuracy",
  ],
};

function sumTopicMapMinutes(map) {
  if (!map || typeof map !== "object") return 0;
  return Object.values(map).reduce((s, row) => {
    const m = Number(row?.timeMinutes) || 0;
    return s + m;
  }, 0);
}

function formatDateLabelHe(isoDateStr) {
  if (!isoDateStr || typeof isoDateStr !== "string") return "";
  const p = isoDateStr.split("T")[0].split("-");
  if (p.length !== 3) return isoDateStr;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function collectStrengthRows(subjects) {
  const rows = [];
  for (const sid of SUBJECT_IDS) {
    const s = subjects?.[sid];
    if (!s) continue;
    const list = Array.isArray(s.topStrengths) ? s.topStrengths : [];
    for (const r of list) {
      rows.push({
        subjectId: sid,
        subjectLabelHe: SUBJECT_LABEL_HE[sid],
        labelHe: String(r.labelHe || "").trim(),
        questions: Number(r.questions) || 0,
        accuracy: Number(r.accuracy) || 0,
        excellent: !!r.excellent,
      });
    }
  }
  rows.sort((a, b) => {
    if (Number(b.excellent) !== Number(a.excellent)) return Number(b.excellent) - Number(a.excellent);
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.questions - a.questions;
  });
  return rows;
}

function collectWeaknessRows(subjects) {
  const rows = [];
  for (const sid of SUBJECT_IDS) {
    const s = subjects?.[sid];
    if (!s) continue;
    const list = Array.isArray(s.topWeaknesses) ? s.topWeaknesses : [];
    for (const w of list) {
      rows.push({
        subjectId: sid,
        subjectLabelHe: SUBJECT_LABEL_HE[sid],
        labelHe: String(w.labelHe || "").trim(),
        mistakeCount: Number(w.mistakeCount) || 0,
      });
    }
  }
  rows.sort((a, b) => b.mistakeCount - a.mistakeCount);
  return rows;
}

function uniqueTopLabels(rows, labelKey, max) {
  const out = [];
  const seen = new Set();
  for (const r of rows) {
    const lab = String(r[labelKey] || "").trim();
    if (!lab || seen.has(lab)) continue;
    seen.add(lab);
    out.push(`${lab} (${r.subjectLabelHe})`);
    if (out.length >= max) break;
  }
  return out;
}

function collectMaintainRows(subjects) {
  const rows = [];
  for (const sid of SUBJECT_IDS) {
    const s = subjects?.[sid];
    const list = Array.isArray(s?.maintain) ? s.maintain : [];
    for (const r of list) {
      rows.push({
        labelHe: String(r.labelHe || "").trim(),
        accuracy: Number(r.accuracy) || 0,
        questions: Number(r.questions) || 0,
        subjectLabelHe: SUBJECT_LABEL_HE[sid],
      });
    }
  }
  rows.sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.questions - a.questions;
  });
  return rows;
}

/**
 * מיקוד ביתי סינתטי: 1–2 חיזוקים, שימור אחד, משפט סיכום — לא העתקה של parentActionHe הראשון.
 */
function buildHomeFocusHe(subjects, topStrengthsAcrossHe, topFocusAreasHe, summary) {
  const reinforceLabels = topFocusAreasHe.slice(0, 2).filter(Boolean);
  const maintainRows = collectMaintainRows(subjects);
  let preservePhrase = null;
  if (maintainRows.length && maintainRows[0].labelHe) {
    const m = maintainRows[0];
    preservePhrase = `${m.labelHe} ב${m.subjectLabelHe}`;
  } else if (topStrengthsAcrossHe.length) {
    preservePhrase = topStrengthsAcrossHe[0].replace(/\s*\([^)]*\)\s*$/u, "").trim() || topStrengthsAcrossHe[0];
  }

  const parts = [];
  if (reinforceLabels.length) {
    parts.push(
      `אם מעוניינים להתמקד השבוע בנושא אחד או שניים: ${reinforceLabels.join(" · ")}. מומלץ תרגול קצר (כ־10–15 דקות); אחרי טעות — בירור קצר של הניסוח, בלי הרחבה ארוכה.`
    );
  } else {
    parts.push(
      "בטווח הזה עדיין לא מתגבשת חולשה אחת ברורה — מומלץ להמשיך על שגרת תרגול קבועה ורגועה, ולאסוף עוד נתון."
    );
  }

  if (preservePhrase) {
    parts.push(`במקביל מומלץ לשמור על תרגול עקבי בתחום שבו ניכרת יציבות — סביב ${preservePhrase}.`);
  } else {
    parts.push("במקביל מומלץ לשמור על שגרת תרגול קבועה — עקביות תורמת להמשך גם כשיש קשיים נקודתיים.");
  }

  const q = Number(summary?.totalQuestions) || 0;
  const acc = Number(summary?.overallAccuracy) || 0;
  let closing =
    "סיכום: חיזוק נקודתי לצד שמירה על מה שעובד — כיוון מעשי לבניית ביטחון.";
  if (q < 18) {
    closing =
      "סיכום: נפח התרגול בטווח מצומצם — אם אפשר להוסיף שני מפגשים קצרים בשבוע, התמונה בדוח הבא תהיה מדויקת יותר.";
  } else if (acc >= 78 && q >= 35) {
    closing =
      "סיכום: יש איזון סביר בין נפח לדיוק — אפשר להמשיך כך, ולהעמיק רק בנושאים שמופיעים למעלה בלי לעמיס על כל המקצועות.";
  } else if (acc < 62 && q >= 18) {
    closing =
      "סיכום: עדיף לייצב לאט — הבנת המשימה לפני תשובה, והערכה קצרה אחרי הצלחה קטנה. זה בונה יותר מסבב נוסף של שאלות.";
  }

  return parts.join("\n\n");
}

function buildExecutiveSummary(subjects, summary) {
  const strengths = collectStrengthRows(subjects);
  const weaknesses = collectWeaknessRows(subjects);
  const topStrengthsAcrossHe = uniqueTopLabels(strengths, "labelHe", 3);
  const topFocusAreasHe = uniqueTopLabels(weaknesses, "labelHe", 3);
  const homeFocusHe = buildHomeFocusHe(subjects, topStrengthsAcrossHe, topFocusAreasHe, summary);
  return { topStrengthsAcrossHe, topFocusAreasHe, homeFocusHe };
}

function buildSubjectCoverage(baseReport) {
  const sum = baseReport?.summary || {};
  return SUBJECT_IDS.map((sid) => {
    const [qk, ck, ak] = SUMMARY_Q[sid];
    const questions = Number(sum[qk]) || 0;
    const correct = Number(sum[ck]) || 0;
    const accuracy = Number(sum[ak]) || 0;
    const mapKey = REPORT_MAP_KEY[sid];
    const timeMinutes = sumTopicMapMinutes(baseReport?.[mapKey]);
    return {
      subject: sid,
      subjectLabelHe: SUBJECT_LABEL_HE[sid],
      questionCount: questions,
      correctCount: correct,
      accuracy,
      timeMinutes,
    };
  });
}

function buildOverallSnapshot(baseReport, subjectCoverage) {
  const sum = baseReport?.summary || {};
  const lowExposureSubjectsHe = [];
  const notableSubjectsHe = [];
  for (const row of subjectCoverage) {
    if (row.questionCount === 0) {
      lowExposureSubjectsHe.push(`${row.subjectLabelHe} — אין שאלות בטווח`);
    } else if (row.questionCount < 15) {
      lowExposureSubjectsHe.push(
        `${row.subjectLabelHe} — חשיפה מועטת (${row.questionCount} שאלות)`
      );
    }
    if (row.questionCount >= 40 && row.accuracy >= 85) {
      notableSubjectsHe.push(
        `${row.subjectLabelHe} — נפח גבוה ודיוק טוב (${row.accuracy}%, ${row.questionCount} שאלות)`
      );
    }
  }
  if (!notableSubjectsHe.length) {
    notableSubjectsHe.push("אין עדיין מקצוע בולט לפי סף הנפח/דיוק — המשך תרגול יעשה את ההבדל.");
  }
  return {
    /** סה״כ זמן למידה בדקות (כמו ב־V2 summary.totalTimeMinutes) */
    totalTime: Number(sum.totalTimeMinutes) || 0,
    totalQuestions: Number(sum.totalQuestions) || 0,
    overallAccuracy: Number(sum.overallAccuracy) || 0,
    subjectCoverage,
    lowExposureSubjectsHe,
    notableSubjectsHe,
  };
}

function buildCrossSubjectInsights(baseReport, subjects) {
  const bulletsHe = [];
  const coverage = buildSubjectCoverage(baseReport);
  const zeroSubjects = coverage.filter((c) => c.questionCount === 0).map((c) => c.subjectLabelHe);
  if (zeroSubjects.length) {
    bulletsHe.push(
      `במקצועות ${zeroSubjects.join(", ")} נאספו מעט מאוד שאלות בטווח — ההערות שם יתייצבו כשייגדל נפח התרגול.`
    );
  }
  const sparse = coverage.filter((c) => c.questionCount > 0 && c.questionCount < 10);
  if (sparse.length) {
    bulletsHe.push(
      `ב${sparse.map((s) => s.subjectLabelHe).join(", ")} עדיין יש מעט נתון — התמונה תתבהר כשיימלא נפח התרגול.`
    );
  }
  const wRows = collectWeaknessRows(subjects);
  const instr = wRows.filter((w) => /הוראות|ניסוח|קריאה/i.test(w.labelHe));
  if (instr.length >= 2) {
    bulletsHe.push(
      "בכמה מקצועות חוזרת אותה תמונה: קריאה זהירה של ניסוח המשימה לפני כתיבת התשובה. מומלץ לקבע בבית רגע קצר קבוע לזה."
    );
  }
  if (!bulletsHe.length) {
    bulletsHe.push("כרגע אין דפוס חוצה־מקצועות בולט — כשיתווסף חומר, יתעדכן גם הסעיף הזה.");
  }
  return {
    bulletsHe,
    dataQualityNoteHe:
      (baseReport?.summary?.totalQuestions || 0) < 30
        ? "מספר השאלות בטווח נמוך — יש לקרוא את המסקנות הכלליות בעדינות."
        : null,
  };
}

function buildHomePlan(subjects) {
  const itemsHe = [];
  for (const sid of SUBJECT_IDS) {
    const pa = subjects?.[sid]?.parentActionHe;
    if (pa && String(pa).trim()) {
      itemsHe.push(
        `ב${SUBJECT_LABEL_HE[sid]}: ${rewriteParentRecommendationForDetailedHe(String(pa).trim())}`
      );
    }
    if (itemsHe.length >= 6) break;
  }
  if (!itemsHe.length) {
    itemsHe.push("עדיין אין המלצות ממוקדות מהמערכת — מומלץ להמשיך על שגרת תרגול קבועה.");
  }
  return { itemsHe };
}

function buildNextPeriodGoals(subjects) {
  const itemsHe = [];
  for (const sid of SUBJECT_IDS) {
    const g = subjects?.[sid]?.nextWeekGoalHe;
    if (g && String(g).trim()) {
      itemsHe.push(
        `ב${SUBJECT_LABEL_HE[sid]}: ${rewriteParentRecommendationForDetailedHe(String(g).trim())}`
      );
    }
    if (itemsHe.length >= 6) break;
  }
  if (!itemsHe.length) {
    itemsHe.push("כשיימלא נתון בטווח, יתווסף כאן כיוון קונקרטי — עד אז עדיף לא לעמיס יעדים מלאכותיים.");
  }
  return { itemsHe };
}

function buildSubjectProfiles(baseReport) {
  const subjects = baseReport?.patternDiagnostics?.subjects;
  const analysis = baseReport?.analysis || {};
  const periodEndMs = baseReport?.endDate
    ? new Date(`${baseReport.endDate}T23:59:59.999`).getTime()
    : Date.now();
  const out = [];
  for (const sid of SUBJECT_IDS) {
    const s = subjects?.[sid];
    if (!s) continue;
    const stable = Array.isArray(s.stableExcellence) ? s.stableExcellence : [];
    const topicMap = baseReport?.[REPORT_MAP_KEY[sid]] || {};
    const topicRecommendations = buildTopicRecommendationsForSubject(
      sid,
      topicMap,
      analysis,
      undefined,
      periodEndMs
    );
    out.push({
      subject: sid,
      subjectLabelHe: SUBJECT_LABEL_HE[sid],
      summaryHe: s.summaryHe ?? null,
      topStrengths: Array.isArray(s.topStrengths) ? s.topStrengths : [],
      topWeaknesses: Array.isArray(s.topWeaknesses) ? s.topWeaknesses : [],
      maintain: Array.isArray(s.maintain) ? s.maintain : [],
      improving: Array.isArray(s.improving) ? s.improving : [],
      excellence: stable,
      diagnosticSectionsHe: s.diagnosticSectionsHe ?? null,
      subSkillInsightsHe: Array.isArray(s.subSkillInsightsHe) ? s.subSkillInsightsHe : [],
      parentActionHe: s.parentActionHe ?? null,
      nextWeekGoalHe: s.nextWeekGoalHe ?? null,
      evidenceExamples: Array.isArray(s.evidenceExamples) ? s.evidenceExamples : [],
      /** כשתהיה השוואת תקופות אמיתית — ימולא; לא שולחים placeholder ל־UI */
      trendVsPreviousPeriod: null,
      /** המלצות צעד הבא ברמת נושא — מנוע נפרד, מבוסס שורות V2 + טעויות */
      topicRecommendations,
    });
  }
  return out;
}

/**
 * בונה דוח מקיף לתקופה (מבנה נפרד מדוח V2).
 * @param {string} playerName
 * @param {string} period 'week'|'month'|'custom'
 * @param {string|null} customStartDate YYYY-MM-DD
 * @param {string|null} customEndDate YYYY-MM-DD
 * @returns {object|null}
 */
export function generateDetailedParentReport(
  playerName,
  period = "week",
  customStartDate = null,
  customEndDate = null
) {
  const base = generateParentReportV2(playerName, period, customStartDate, customEndDate);
  if (!base) return null;

  const subjects = base.patternDiagnostics?.subjects || {};
  const subjectCoverage = buildSubjectCoverage(base);
  const overallSnapshot = buildOverallSnapshot(base, subjectCoverage);
  const executiveSummary = buildExecutiveSummary(subjects, base.summary || {});
  const crossSubjectInsights = buildCrossSubjectInsights(base, subjects);
  const homePlan = buildHomePlan(subjects);
  const nextPeriodGoals = buildNextPeriodGoals(subjects);
  const subjectProfiles = buildSubjectProfiles(base);

  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    periodInfo: {
      period: base.period === "custom" ? "custom" : period,
      startDate: base.startDate,
      endDate: base.endDate,
      startDateLabelHe: formatDateLabelHe(base.startDate),
      endDateLabelHe: formatDateLabelHe(base.endDate),
      playerName: base.playerName || playerName,
    },
    executiveSummary,
    overallSnapshot,
    subjectProfiles,
    crossSubjectInsights,
    homePlan,
    nextPeriodGoals,
  };
}
