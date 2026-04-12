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

/** להסרת "בנושא " מתחילת תווית כדי לא לכפול ניסוח ("דגש על הנושא חיבור"). */
function stripLeadingBenosheaHe(s) {
  return String(s || "")
    .replace(/^בנושא\/ים\s+/u, "")
    .replace(/^בנושא\s+/u, "")
    .trim();
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

const CROSS_RISK_LABEL_HE = {
  knowledge_gap: "פער ידע / בסיס",
  speed_pressure: "לחץ מהירות",
  instruction_friction: "חיכוך הוראה או רמזים",
  careless_pattern: "רשלנות / אי־יציבות",
  fragile_success: "הצלחה שבירה",
  mixed: "תמהיל קשיים",
  mixed_low_signal: "אות חלש בשורות",
  none_sparse: "דל נתון",
  none_observed: "ללא קושי דומיננטי בפרופיל",
};

function crossRiskLabelHe(riskId, subjects) {
  if (CROSS_RISK_LABEL_HE[riskId]) return CROSS_RISK_LABEL_HE[riskId];
  for (const sid of SUBJECT_IDS) {
    if (subjects?.[sid]?.dominantLearningRisk === riskId && subjects[sid].dominantLearningRiskLabelHe) {
      return String(subjects[sid].dominantLearningRiskLabelHe);
    }
  }
  return riskId;
}

function crossSuccessLabelHe(patId, subjects) {
  if (CROSS_SUCCESS_LABEL_HE[patId]) return CROSS_SUCCESS_LABEL_HE[patId];
  for (const sid of SUBJECT_IDS) {
    if (subjects?.[sid]?.dominantSuccessPattern === patId && subjects[sid].dominantSuccessPatternLabelHe) {
      return String(subjects[sid].dominantSuccessPatternLabelHe);
    }
  }
  return patId;
}

const CROSS_SUCCESS_LABEL_HE = {
  stable_mastery: "מאסטרי יציב",
  fragile_success_cluster: "הצלחה עם שבירות",
  mixed: "תמהיל הצלחות",
  none_sparse: "דל נתון",
};

function shortenHe(s, maxLen) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

function aggregateCrossSubjectRisks(subjects) {
  const or = {
    falsePromotionRisk: false,
    falseRemediationRisk: false,
    speedOnlyRisk: false,
    hintDependenceRisk: false,
    insufficientEvidenceRisk: false,
    recentTransitionRisk: false,
  };
  for (const sid of SUBJECT_IDS) {
    const r = subjects?.[sid]?.majorRiskFlagsAcrossRows;
    if (!r || typeof r !== "object") continue;
    for (const k of Object.keys(or)) {
      if (r[k]) or[k] = true;
    }
  }
  return or;
}

function dominantCrossSubjectField(subjects, field) {
  const counts = {};
  for (const sid of SUBJECT_IDS) {
    const v = String(subjects?.[sid]?.[field] || "").trim();
    if (!v || v === "none_sparse" || v === "undetermined") continue;
    counts[v] = (counts[v] || 0) + 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || "mixed";
}

function subjectQuestionTotal(subjects, sid, summary) {
  const s = subjects?.[sid];
  const [qk] = SUMMARY_Q[sid] || [];
  if (qk && summary && Number(summary[qk]) > 0) return Number(summary[qk]) || 0;
  let q = 0;
  const pools = [
    ...(Array.isArray(s?.topStrengths) ? s.topStrengths : []),
    ...(Array.isArray(s?.maintain) ? s.maintain : []),
    ...(Array.isArray(s?.improving) ? s.improving : []),
  ];
  for (const r of pools) q += Number(r?.questions) || 0;
  return q;
}

function dominantSubjectByVolume(subjectCoverage) {
  const arr = Array.isArray(subjectCoverage) ? [...subjectCoverage] : [];
  arr.sort((a, b) => (Number(b.questionCount) || 0) - (Number(a.questionCount) || 0));
  return arr[0] || null;
}

function buildMajorTrendsHe(subjects, subjectCoverage) {
  const scored = [];
  for (const sid of SUBJECT_IDS) {
    const s = subjects?.[sid];
    if (!s) continue;
    const cov = subjectCoverage?.find((c) => c.subject === sid);
    const w = (Number(cov?.questionCount) || 0) + 1;
    const tn = String(s.trendNarrativeHe || "").trim();
    if (tn.length > 24) {
      const parts = tn.split(/(?<=[.!?])\s+/).filter(Boolean);
      const head = parts[0] || shortenHe(tn, 130);
      scored.push({ text: shortenHe(head, 150), w, sid });
    }
    const ibs = String(s.improvingButSupportedHe || "").trim();
    if (ibs.length > 20) scored.push({ text: shortenHe(ibs, 150), w: w + 3, sid });
    const pos = String(s.strongestPositiveTrendRowHe || "").trim();
    const cau = String(s.strongestCautionTrendRowHe || "").trim();
    if (pos.length > 20) scored.push({ text: shortenHe(`חיזוק חוצה־מקצועות (${SUBJECT_LABEL_HE[sid]}): ${pos}`, 150), w: w - 1, sid });
    if (cau.length > 20) scored.push({ text: shortenHe(`זהירות (${SUBJECT_LABEL_HE[sid]}): ${cau}`, 150), w: w + 2, sid });
  }
  scored.sort((a, b) => b.w - a.w);
  const out = [];
  const seen = new Set();
  for (const x of scored) {
    const k = x.text.slice(0, 48);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x.text);
    if (out.length >= 2) break;
  }
  if (!out.length) {
    out.push("עדיין אין שתי מגמות חוצות־מקצועות ברורות — התמונה תתייצב כשיתווסף נפח בטווח.");
  }
  if (out.length === 1) {
    out.push("מגמה שנייה תתבהר אחרי עוד תרגול במקצועות עם נפח נמוך.");
  }
  return out.slice(0, 2);
}

function pickMainHomeRecommendationHe(subjects, subjectCoverage, summary, topFocusAreasHe, topStrengthsAcrossHe) {
  let bestSid = null;
  let bestScore = -1;
  for (const sid of SUBJECT_IDS) {
    const s = subjects?.[sid];
    if (!s) continue;
    const q = subjectQuestionTotal(subjects, sid, summary || {});
    const cov = subjectCoverage?.find((c) => c.subject === sid);
    const qc = Number(cov?.questionCount) || q;
    const hasW = Array.isArray(s.topWeaknesses) && s.topWeaknesses.length > 0;
    const risk = String(s.dominantLearningRisk || "");
    let score = qc;
    if (hasW) score += 40;
    if (risk === "knowledge_gap" || risk === "fragile_success") score += 25;
    if (s.recommendedHomeMethodHe) score += 15;
    if (score > bestScore) {
      bestScore = score;
      bestSid = sid;
    }
  }
  const pick = bestSid && subjects?.[bestSid] ? subjects[bestSid] : null;
  const home = pick?.recommendedHomeMethodHe && String(pick.recommendedHomeMethodHe).trim();
  if (home) return shortenHe(rewriteParentRecommendationForDetailedHe(home), 220);
  if (topFocusAreasHe[0]) {
    const core = stripLeadingBenosheaHe(topFocusAreasHe[0].replace(/\s*\([^)]*\)\s*$/u, "").trim());
    return shortenHe(
      `להתמקד השבוע ב${core} — שני מפגשים קצרים, קריאת משימה משותפת ותרגול ממוקד בלי קפיצת רמה.`,
      220
    );
  }
  if (topStrengthsAcrossHe[0]) {
    return shortenHe(
      `לשמור קצב רגוע סביב ${stripLeadingBenosheaHe(topStrengthsAcrossHe[0])} — תרגול קצר פעמיים בשבוע לשימור עקביות.`,
      220
    );
  }
  return "שני מפגשים קצרים בשבוע, דגש על קריאת המשימה לפני תשובה — עד שיתייצב נפח בטווח.";
}

function buildCautionNoteHe(crossRisks, subjects, dominantRiskId) {
  const parts = [];
  if (crossRisks.hintDependenceRisk) parts.push("תלות ברמזים חוצה מקצועות — לא לדחוף קידום מהיר.");
  if (crossRisks.falsePromotionRisk) parts.push("סיכון לקידום שווא — לא לפרש הצלחה חלקית כמוכנות לקפיצה.");
  if (crossRisks.recentTransitionRisk) parts.push("מגמות אחרונות מצביעות על זהירות — לא לרדת מדרגה בכל המקצוע בבת אחת.");
  if (crossRisks.speedOnlyRisk) parts.push("מופיעה חולשה הקשורה למהירות — לא להכליל לפער ידע בכל התרגול.");
  if (parts.length) return shortenHe(parts.join(" "), 220);
  const wnts = SUBJECT_IDS.map((sid) => String(subjects?.[sid]?.whatNotToDoHe || "").trim()).filter(Boolean);
  if (wnts.length) return shortenHe(wnts.sort((a, b) => b.length - a.length)[0], 220);
  if (dominantRiskId === "none_sparse" || dominantRiskId === "none_observed") {
    return "עדיין מעט נתון — לא לקבוע שינוי דרמטי בבית לפני שמתייצב נפח.";
  }
  return "לעקוב אחרי הדפוסים בשורות לפני שינוי הגדרות חד.";
}

function buildOverallConfidenceHe(subjectCoverage, crossRisks) {
  const cov = Array.isArray(subjectCoverage) ? subjectCoverage : [];
  const low = cov.filter((c) => c.questionCount > 0 && c.questionCount < 12).length;
  const active = cov.filter((c) => c.questionCount > 0).length;
  const uneven =
    active >= 2 &&
    cov.reduce((m, c) => Math.max(m, c.questionCount || 0), 0) >
      2 * (cov.reduce((s, c) => s + (c.questionCount || 0), 0) / Math.max(active, 1));
  let t = `בטווח: ${active} מקצועות עם פעילות; ${low} עם נפח נמוך יחסית — הביטחון בין המקצועות לא אחיד.`;
  if (crossRisks.insufficientEvidenceRisk) t += " חלק מהשורות עם ראיות חלקיות.";
  if (uneven) t += " רוב הנתונים מגיעים ממקצוע אחד בולט — לא מניחים התפלגות שווה.";
  return shortenHe(t, 280);
}

function buildReportReadinessHe(dataIntegrityReport, summary) {
  const issues = dataIntegrityReport?.issues;
  const n = Array.isArray(issues) ? issues.length : 0;
  const q = Number(summary?.totalQuestions) || 0;
  if (n === 0 && q >= 24) return "הדוח בשל לקריאה הורית — נפח סביר וללא בעיות שלמות קריטיות.";
  if (n > 0 && q >= 18) return `הדוח קריא, אך יש ${n} הערות שלמות נתונים — לקרוא מסקנות בעדינות.`;
  if (q < 18) return "הדוח חלקי — מומלץ להשלים עוד תרגול בטווח לפני החלטות גדולות.";
  return "הדוח בשלות בינונית — לשלב מסקנות עם תצפית הורית יומיומית.";
}

function buildEvidenceBalanceHe(subjects) {
  let frag = 0;
  let stab = 0;
  let str = 0;
  let weak = 0;
  for (const sid of SUBJECT_IDS) {
    const s = subjects?.[sid];
    if (!s) continue;
    frag += Number(s.fragileSuccessRowCount) || 0;
    stab += Number(s.stableMasteryRowCount) || 0;
    str += (Array.isArray(s.topStrengths) ? s.topStrengths.length : 0) + (Array.isArray(s.stableExcellence) ? s.stableExcellence.length : 0);
    weak += Array.isArray(s.topWeaknesses) ? s.topWeaknesses.length : 0;
  }
  return shortenHe(
    `איזון רמזים: כ־${stab} שורות עם פרופיל מאסטרי יציב מול ${frag} שבירות; ${str} כיווני חוזק מובחרים מול ${weak} מוקדי חולשה מובחרים.`,
    220
  );
}

function buildMixedSignalNoticeHe(subjects, crossRisks, topStrengthsAcrossHe) {
  const anyIbs = SUBJECT_IDS.some((sid) => String(subjects?.[sid]?.improvingButSupportedHe || "").trim());
  const strong = topStrengthsAcrossHe.length >= 2;
  const risky = crossRisks.falsePromotionRisk || crossRisks.hintDependenceRisk;
  if (strong && risky) {
    return "תמונה מעורבת: יש חוזקות, אך גם דגלי סיכון מהמנוע — לא לאחד את הכל כהצלחה מלאה.";
  }
  if (anyIbs) {
    return "מופיע שיפור לצד תלות בעזרה בעצמאות — ההתקדמות עדיין דורשת ליווי מדוד.";
  }
  const modeNotes = SUBJECT_IDS.map((sid) => subjects?.[sid]?.modeConcentrationNoteHe).filter(Boolean);
  if (modeNotes.length >= 2) {
    return "חולשות מרוכזות במצבי תרגול שונים — לא מכלילים אוטומטית לכל המקצוע.";
  }
  return null;
}

/**
 * מיקוד ביתי — משפט אחד לפי מצב (חיזוק / שימור / דל נתון), בלי שכבות מרובות.
 */
function buildHomeFocusHe(subjects, topStrengthsAcrossHe, topFocusAreasHe, summary) {
  const focusLabels = topFocusAreasHe.slice(0, 2).filter(Boolean);
  const maintainRows = collectMaintainRows(subjects);
  let preservePhrase = null;
  if (maintainRows.length && maintainRows[0].labelHe) {
    const m = maintainRows[0];
    preservePhrase = `${m.labelHe} ב${m.subjectLabelHe}`;
  } else if (topStrengthsAcrossHe.length) {
    preservePhrase =
      topStrengthsAcrossHe[0].replace(/\s*\([^)]*\)\s*$/u, "").trim() || topStrengthsAcrossHe[0];
  }

  const q = Number(summary?.totalQuestions) || 0;
  const acc = Math.round(Number(summary?.overallAccuracy) || 0);

  if (focusLabels.length) {
    const cleaned = focusLabels.map(stripLeadingBenosheaHe).filter(Boolean);
    const joined = cleaned.join(" · ");
    const noun = cleaned.length > 1 ? "הנושאים" : "הנושא";
    return `השבוע מומלץ לשים דגש על ${noun} ${joined} — ההמלצה שלנו: תרגול משותף עם הילד. אחרי טעות, לקרוא שוב את השאלה, להיכנס לחלון התרגיל הקודם ולהבין ביחד איפה הטעות.`;
  }
  if (preservePhrase) {
    return `במקביל כדאי לשמור על תרגול רגוע סביב ${preservePhrase} — שם כבר יש בסיס טוב.`;
  }
  if (q < 18) {
    return "עדיין מעט חומר בטווח — שני מפגשים קצרים בשבוע יעזרו לחדד את התמונה בפעם הבאה.";
  }
  if (acc >= 78 && q >= 35) {
    return "הקצב הנוכחי נראה מאוזן — אפשר להמשיך כך ולהעמיק רק בנושאים שמופיעים למעלה ברשימת המיקוד.";
  }
  if (acc < 62 && q >= 18) {
    return "כדאי לייצב לאט: משימה ברורה לפני פתרון, ושבח קטן אחרי הצלחה קטנה.";
  }
  return "להמשיך על שגרת תרגול קבועה ורגועה, ולעקוב איך הדיוק והביטחון מתפתחים.";
}

function buildExecutiveSummary(subjects, summary, subjectCoverage, dataIntegrityReport) {
  const strengths = collectStrengthRows(subjects);
  const weaknesses = collectWeaknessRows(subjects);
  const crossRisks = aggregateCrossSubjectRisks(subjects);
  const globalRiskHeavy =
    crossRisks.falsePromotionRisk ||
    crossRisks.hintDependenceRisk ||
    crossRisks.recentTransitionRisk;

  let topStrengthsAcrossHe = uniqueTopLabels(strengths, "labelHe", 3);
  if (globalRiskHeavy && topStrengthsAcrossHe.length > 1) {
    topStrengthsAcrossHe = topStrengthsAcrossHe.slice(0, 2);
  }
  const topFocusAreasHe = uniqueTopLabels(weaknesses, "labelHe", 3);

  const homeFocusHe = buildHomeFocusHe(subjects, topStrengthsAcrossHe, topFocusAreasHe, summary);
  const majorTrendsHe = buildMajorTrendsHe(subjects, subjectCoverage);
  const dominantCrossSubjectRisk = dominantCrossSubjectField(subjects, "dominantLearningRisk");
  const dominantCrossSubjectSuccessPattern = dominantCrossSubjectField(subjects, "dominantSuccessPattern");
  const domVol = dominantSubjectByVolume(subjectCoverage);
  const supportingSignals = {
    crossRiskFlags: crossRisks,
    dominantSubjectId: domVol?.subject ?? null,
    dominantSubjectLabelHe: domVol?.subjectLabelHe ?? null,
    dominantSubjectQuestionCount: Number(domVol?.questionCount) || 0,
    fragileSuccessRowsTotal: SUBJECT_IDS.reduce((s, sid) => s + (Number(subjects?.[sid]?.fragileSuccessRowCount) || 0), 0),
    stableMasteryRowsTotal: SUBJECT_IDS.reduce((s, sid) => s + (Number(subjects?.[sid]?.stableMasteryRowCount) || 0), 0),
    subjectsWithModeConcentrationNote: SUBJECT_IDS.filter((sid) => subjects?.[sid]?.modeConcentrationNoteHe).length,
    dataIntegrityIssueCount: Array.isArray(dataIntegrityReport?.issues) ? dataIntegrityReport.issues.length : 0,
  };

  const mainHomeRecommendationHe = pickMainHomeRecommendationHe(
    subjects,
    subjectCoverage,
    summary,
    topFocusAreasHe,
    topStrengthsAcrossHe
  );
  const cautionNoteHe = buildCautionNoteHe(crossRisks, subjects, dominantCrossSubjectRisk);
  const overallConfidenceHe = buildOverallConfidenceHe(subjectCoverage, crossRisks);
  const reportReadinessHe = buildReportReadinessHe(dataIntegrityReport, summary);
  const evidenceBalanceHe = buildEvidenceBalanceHe(subjects);
  const mixedSignalNoticeHe = buildMixedSignalNoticeHe(subjects, crossRisks, topStrengthsAcrossHe);

  return {
    version: 2,
    topStrengthsAcrossHe,
    topFocusAreasHe,
    homeFocusHe,
    majorTrendsHe,
    mainHomeRecommendationHe,
    cautionNoteHe,
    overallConfidenceHe,
    dominantCrossSubjectRisk,
    dominantCrossSubjectRiskLabelHe: crossRiskLabelHe(dominantCrossSubjectRisk, subjects),
    dominantCrossSubjectSuccessPattern,
    dominantCrossSubjectSuccessPatternLabelHe: crossSuccessLabelHe(dominantCrossSubjectSuccessPattern, subjects),
    supportingSignals,
    mixedSignalNoticeHe,
    reportReadinessHe,
    evidenceBalanceHe,
  };
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
        `${row.subjectLabelHe} — מספר שאלות נמוך (${row.questionCount} שאלות)`
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
      dominantLearningRisk: s.dominantLearningRisk ?? null,
      dominantSuccessPattern: s.dominantSuccessPattern ?? null,
      trendNarrativeHe: s.trendNarrativeHe ?? null,
      confidenceSummaryHe: s.confidenceSummaryHe ?? null,
      recommendedHomeMethodHe: s.recommendedHomeMethodHe ?? null,
      whatNotToDoHe: s.whatNotToDoHe ?? null,
      majorRiskFlagsAcrossRows: s.majorRiskFlagsAcrossRows ?? null,
      dominantBehaviorProfileAcrossRows: s.dominantBehaviorProfileAcrossRows ?? null,
      strongestPositiveTrendRowHe: s.strongestPositiveTrendRowHe ?? null,
      strongestCautionTrendRowHe: s.strongestCautionTrendRowHe ?? null,
      fragileSuccessRowCount: s.fragileSuccessRowCount ?? 0,
      stableMasteryRowCount: s.stableMasteryRowCount ?? 0,
      modeConcentrationNoteHe: s.modeConcentrationNoteHe ?? null,
      dominantLearningRiskLabelHe: s.dominantLearningRiskLabelHe ?? null,
      dominantSuccessPatternLabelHe: s.dominantSuccessPatternLabelHe ?? null,
      improvingButSupportedHe: s.improvingButSupportedHe ?? null,
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
  const executiveSummary = buildExecutiveSummary(
    subjects,
    base.summary || {},
    subjectCoverage,
    base.dataIntegrityReport ?? null
  );
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
    /** שלב 1 — שלמות נתונים כפי שחושב ב־V2 (לביקורת JSON) */
    dataIntegrityReport: base.dataIntegrityReport ?? null,
  };
}
