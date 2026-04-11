import {
  MIN_PATTERN_FAMILY_FOR_DIAGNOSIS,
  MIN_MISTAKES_FOR_STRONG_RECOMMENDATION,
  normalizeMistakeEvent,
  mistakePatternClusterKey,
} from "./mistake-event";
import {
  weaknessLabelHe,
  sessionRowLabelHe,
  GENERIC_WEAKNESS_HE,
} from "./diagnostic-labels-he";

const SUBJECT_IDS = [
  "math",
  "geometry",
  "english",
  "science",
  "hebrew",
  "moledet-geography",
];

const REPORT_ROWS_KEY = {
  math: "mathOperations",
  geometry: "geometryTopics",
  english: "englishTopics",
  science: "scienceTopics",
  hebrew: "hebrewTopics",
  "moledet-geography": "moledetGeographyTopics",
};

const SUBJECT_LABEL_HE = {
  math: "חשבון",
  geometry: "גאומטריה",
  english: "אנגלית",
  science: "מדעים",
  hebrew: "עברית",
  "moledet-geography": "מולדת וגאוגרפיה",
};

const MAX_WEAKNESSES = 2;
const MAX_STRENGTH_SLOTS = 2;
const MAX_MAINTAIN = 2;
const MAX_IMPROVING = 2;

function recStrength(mistakeCount) {
  if (mistakeCount >= MIN_MISTAKES_FOR_STRONG_RECOMMENDATION) return "strong";
  if (mistakeCount >= MIN_PATTERN_FAMILY_FOR_DIAGNOSIS) return "moderate";
  return "tentative";
}

function rowConfidenceFromSessions(row) {
  const q = Number(row?.questions) || 0;
  if (q >= 24) return "high";
  if (q >= 10) return "moderate";
  return "low";
}

function formatSessionBand(subjectId, row, rowKey) {
  return {
    id: `${subjectId}:${String(rowKey).slice(0, 120)}`,
    labelHe: sessionRowLabelHe(subjectId, row),
    questions: Number(row?.questions) || 0,
    accuracy: Number(row?.accuracy) || 0,
    confidence: rowConfidenceFromSessions(row),
    needsPractice: !!row?.needsPractice,
    excellent: !!row?.excellent,
  };
}

/**
 * מחלק שורות דוח ל־excellent / strengths / maintain / improving (ללא כפילויות לפי מפתח שורה).
 */
function buildSessionBands(subjectId, report) {
  const rowsKey = REPORT_ROWS_KEY[subjectId];
  const map = rowsKey && report[rowsKey] ? report[rowsKey] : {};
  const entries = Object.entries(map || {})
    .map(([rowKey, row]) => ({ rowKey, row }))
    .sort((a, b) => {
      const acc = (x) => Number(x.row?.accuracy) || 0;
      const q = (x) => Number(x.row?.questions) || 0;
      return acc(b) - acc(a) || q(b) - q(a);
    });

  const used = new Set();
  const take = (predicate, max) => {
    const out = [];
    for (const { rowKey, row } of entries) {
      if (out.length >= max) break;
      if (!row || typeof row !== "object") continue;
      const q = Number(row.questions) || 0;
      if (q < 5) continue;
      if (used.has(rowKey)) continue;
      if (!predicate(row, q)) continue;
      used.add(rowKey);
      out.push(formatSessionBand(subjectId, row, rowKey));
    }
    return out;
  };

  const excellent = take(
    (row, q) => row.excellent && q >= 10,
    MAX_STRENGTH_SLOTS
  );

  const strengths = take(
    (row, q) =>
      !row.excellent &&
      Number(row.accuracy) >= 87 &&
      q >= 8 &&
      !row.needsPractice,
    MAX_STRENGTH_SLOTS
  );

  const maintain = take(
    (row, q) => {
      const acc = Number(row.accuracy) || 0;
      return (
        !row.needsPractice &&
        acc >= 80 &&
        acc < 93 &&
        q >= 6
      );
    },
    MAX_MAINTAIN
  );

  const improving = take(
    (row, q) => {
      const acc = Number(row.accuracy) || 0;
      if (row.needsPractice && acc >= 55 && acc < 78) return true;
      if (!row.excellent && acc >= 68 && acc <= 82 && q >= 6) return true;
      return false;
    },
    MAX_IMPROVING
  );

  return { excellent, strengths, maintain, improving };
}

function buildEvidenceMistakeFromEvent(ev, confidence) {
  if (!ev) return null;
  const ex = String(ev.exerciseText || "").trim();
  if (ex.length > 220) return null;
  if (!ex && ev.userAnswer == null) return null;
  if (confidence !== "high" && confidence !== "moderate") return null;
  return {
    exerciseText: ex || null,
    questionLabel: ev.questionLabel || null,
    correctAnswer: ev.correctAnswer ?? null,
    userAnswer: ev.userAnswer ?? null,
    confidence,
  };
}

function buildEvidenceSuccess(excellent, strengths) {
  const pick = excellent[0] || strengths[0];
  if (!pick) return null;
  if (pick.questions < 8) return null;
  const conf =
    pick.confidence === "high" || pick.questions >= 20 ? "high" : "moderate";
  return {
    titleHe: "חוזקה בתרגול",
    bodyHe: `בנושא "${pick.labelHe}" רואים ביצועים טובים: כ־${pick.accuracy}% נכון מתוך ${pick.questions} שאלות בטווח התאריכים.`,
    confidence: conf,
  };
}

/**
 * @param {Record<string, unknown>} report
 * @param {Record<string, unknown[]>} [rawMistakesBySubject]
 */
export function analyzeLearningPatterns(report, rawMistakesBySubject = {}) {
  const out = {
    version: 2,
    generatedAt: new Date().toISOString(),
    constants: {
      minMistakesPerPatternFamily: MIN_PATTERN_FAMILY_FOR_DIAGNOSIS,
      minMistakesForStrongRecommendation: MIN_MISTAKES_FOR_STRONG_RECOMMENDATION,
      maxWeaknesses: MAX_WEAKNESSES,
      maxStrengthRows: MAX_STRENGTH_SLOTS,
      maxMaintain: MAX_MAINTAIN,
      maxImproving: MAX_IMPROVING,
    },
    subjects: {},
  };

  if (!report || typeof report !== "object") return out;

  for (const sid of SUBJECT_IDS) {
    const rawList = Array.isArray(rawMistakesBySubject[sid])
      ? rawMistakesBySubject[sid]
      : [];
    const events = rawList.map((r) => normalizeMistakeEvent(r, sid));
    const wrong = events.filter((e) => !e.isCorrect);

    const clusters = {};
    wrong.forEach((ev) => {
      const key = mistakePatternClusterKey(ev);
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(ev);
    });

    const weaknessCandidates = [];
    const insufficientData = [];

    Object.entries(clusters).forEach(([, list]) => {
      const n = list.length;
      if (n < MIN_PATTERN_FAMILY_FOR_DIAGNOSIS) {
        if (insufficientData.length < 24) {
          insufficientData.push({
            mistakeCount: n,
            note: "פחות מ־5 טעויות באותו דפוס — לא מספיק לקביעת חולשה יציבה",
          });
        }
        return;
      }
      const sample = list[list.length - 1];
      const labelHe = weaknessLabelHe(sid, sample);
      const rs = recStrength(n);
      weaknessCandidates.push({
        labelHe,
        mistakeCount: n,
        confidence: rs === "strong" ? "high" : "moderate",
        sampleEvent: sample,
      });
    });

    weaknessCandidates.sort((a, b) => b.mistakeCount - a.mistakeCount);
    const weaknesses = weaknessCandidates.slice(0, MAX_WEAKNESSES).map((w, i) => ({
      id: `${sid}:w:${i}`,
      labelHe: w.labelHe || GENERIC_WEAKNESS_HE,
      mistakeCount: w.mistakeCount,
      confidence: w.confidence,
    }));

    const { excellent, strengths, maintain, improving } = buildSessionBands(
      sid,
      report
    );

    const studentRecommendationsImprove = [];
    const studentRecommendationsMaintain = [];
    const parentRecommendationsImprove = [];
    const parentRecommendationsMaintain = [];

    const w0 = weaknesses[0];
    if (w0) {
      const rs = recStrength(w0.mistakeCount);
      studentRecommendationsImprove.push({
        id: `stu-imp:${w0.id}`,
        textHe: `מומלץ להתמקד: ${w0.labelHe} (זוהו ${w0.mistakeCount} טעויות דומות בטווח התאריכים).`,
        strength: rs,
      });
      parentRecommendationsImprove.push({
        id: `par-imp:${w0.id}`,
        textHe:
          rs === "strong"
            ? `יש דפוס חוזר סביב הנושא ${w0.labelHe}. מומלץ לשבת יחד על דוגמה אחת ולבדוק את הלוגיקה צעד־אחר־צעד.`
            : `מתחיל להתגבש דפוס סביב הנושא ${w0.labelHe}. מומלץ מעקב קל אחרי שבוע נוסף של תרגול ממוקד.`,
        strength: rs,
      });
    }

    const topPositive = excellent[0] || strengths[0];
    if (topPositive) {
      const rs =
        topPositive.confidence === "high" || topPositive.questions >= 18
          ? "strong"
          : "moderate";
      studentRecommendationsMaintain.push({
        id: `stu-maint:${topPositive.id}`,
        textHe: `להמשיך לתרגל בנוחות ב"${topPositive.labelHe}" — יש כאן עקביות (דיוק כ־${topPositive.accuracy}%).`,
        strength: rs,
      });
      parentRecommendationsMaintain.push({
        id: `par-maint:${topPositive.id}`,
        textHe: `מומלץ לעודד על ההתמדה ב"${topPositive.labelHe}" — רואים הצלחה חוזרת; שימור הרגל חיובי חשוב לא פחות מתיקון טעויות.`,
        strength: rs,
      });
    }

    let diagnosticSparseNoteHe = null;
    if (!weaknesses.length && wrong.length > 0) {
      diagnosticSparseNoteHe =
        "יש טעויות בודדות אך בלי דפוס שחוזר מספיק פעמים — עדיין לא ניתן לקבוע חולשה יציבה.";
      if (!parentRecommendationsImprove.length) {
        parentRecommendationsImprove.push({
          id: `par-imp:${sid}:sparse`,
          textHe: diagnosticSparseNoteHe,
          strength: "tentative",
        });
      }
    }

    let evidenceMistake = null;
    const wTop = weaknessCandidates[0];
    if (wTop && wTop.sampleEvent) {
      evidenceMistake = buildEvidenceMistakeFromEvent(
        wTop.sampleEvent,
        wTop.confidence
      );
    }

    const evidenceSuccess = buildEvidenceSuccess(excellent, strengths);

    const hasAnySignal =
      weaknesses.length > 0 ||
      excellent.length > 0 ||
      strengths.length > 0 ||
      maintain.length > 0 ||
      improving.length > 0 ||
      studentRecommendationsImprove.length > 0 ||
      studentRecommendationsMaintain.length > 0 ||
      parentRecommendationsImprove.length > 0 ||
      parentRecommendationsMaintain.length > 0 ||
      evidenceMistake != null ||
      evidenceSuccess != null;

    out.subjects[sid] = {
      subject: sid,
      subjectLabelHe: SUBJECT_LABEL_HE[sid],
      mistakeEventCount: events.length,
      wrongCount: wrong.length,
      hasAnySignal,
      weaknesses,
      strengths,
      excellent,
      maintain,
      improving,
      studentRecommendationsImprove,
      studentRecommendationsMaintain,
      parentRecommendationsImprove,
      parentRecommendationsMaintain,
      evidenceMistake,
      evidenceSuccess,
      insufficientData,
      diagnosticSparseNoteHe,
    };
  }

  return out;
}

/** דוגמה סטטית לפי מבנה גרסה 2 */
export const EXAMPLE_PATTERN_DIAGNOSTICS_PAYLOAD = {
  version: 2,
  generatedAt: "2026-04-11T12:00:00.000Z",
  constants: {
    minMistakesPerPatternFamily: 5,
    minMistakesForStrongRecommendation: 10,
    maxWeaknesses: 2,
    maxStrengthRows: 2,
    maxMaintain: 2,
    maxImproving: 2,
  },
  subjects: {
    math: {
      subject: "math",
      subjectLabelHe: "חשבון",
      mistakeEventCount: 12,
      wrongCount: 12,
      hasAnySignal: true,
      weaknesses: [
        {
          id: "math:w:0",
          labelHe: "קושי בהשוואת כמויות או מספרים",
          mistakeCount: 7,
          confidence: "moderate",
        },
      ],
      strengths: [
        {
          id: "math:subtraction:learning",
          labelHe: "חיבור",
          questions: 24,
          accuracy: 88,
          confidence: "moderate",
          needsPractice: false,
          excellent: false,
        },
      ],
      excellent: [
        {
          id: "math:addition:learning",
          labelHe: "חיבור",
          questions: 42,
          accuracy: 93,
          confidence: "high",
          needsPractice: false,
          excellent: true,
        },
      ],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [
        {
          id: "stu-imp:math:w:0",
          textHe:
            "מומלץ להתמקד: קושי בהשוואת כמויות או מספרים (זוהו 7 טעויות דומות בטווח התאריכים).",
          strength: "moderate",
        },
      ],
      studentRecommendationsMaintain: [
        {
          id: "stu-maint:math:addition:learning",
          textHe:
            'להמשיך לתרגל בנוחות ב"חיבור" — יש כאן עקביות (דיוק כ־93%).',
          strength: "strong",
        },
      ],
      parentRecommendationsImprove: [
        {
          id: "par-imp:math:w:0",
          textHe:
            "מתחיל להתגבש דפוס סביב הנושא קושי בהשוואת כמויות או מספרים. מומלץ מעקב קל אחרי שבוע נוסף של תרגול ממוקד.",
          strength: "moderate",
        },
      ],
      parentRecommendationsMaintain: [
        {
          id: "par-maint:math:addition:learning",
          textHe:
            'מומלץ לעודד על ההתמדה ב"חיבור" — רואים הצלחה חוזרת; שימור הרגל חיובי חשוב לא פחות מתיקון טעויות.',
          strength: "strong",
        },
      ],
      evidenceMistake: {
        exerciseText: "בכמה שקים המחיר של המחשב גבוה יותר?",
        questionLabel: null,
        correctAnswer: 120,
        userAnswer: 102,
        confidence: "moderate",
      },
      evidenceSuccess: {
        titleHe: "חוזקה בתרגול",
        bodyHe:
          'בנושא "חיבור" רואים ביצועים טובים: כ־93% נכון מתוך 42 שאלות בטווח התאריכים.',
        confidence: "high",
      },
      insufficientData: [
        { mistakeCount: 2, note: "פחות מ־5 טעויות באותו דפוס — לא מספיק לקביעת חולשה יציבה" },
      ],
      diagnosticSparseNoteHe: null,
    },
    geometry: {
      subject: "geometry",
      subjectLabelHe: "גאומטריה",
      mistakeEventCount: 9,
      wrongCount: 9,
      hasAnySignal: true,
      weaknesses: [
        {
          id: "geometry:w:0",
          labelHe: "בלבול חוזר בין היקף לשטח",
          mistakeCount: 6,
          confidence: "moderate",
        },
      ],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [
        {
          id: "stu-imp:geometry:w:0",
          textHe:
            "מומלץ להתמקד: בלבול חוזר בין היקף לשטח (זוהו 6 טעויות דומות בטווח התאריכים).",
          strength: "moderate",
        },
      ],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [
        {
          id: "par-imp:geometry:w:0",
          textHe:
            "מתחיל להתגבש דפוס סביב הנושא בלבול חוזר בין היקף לשטח. מומלץ מעקב קל אחרי שבוע נוסף של תרגול ממוקד.",
          strength: "moderate",
        },
      ],
      parentRecommendationsMaintain: [],
      evidenceMistake: {
        exerciseText: "מה ההיקף של מלבן 5×3 ס״מ?",
        questionLabel: null,
        correctAnswer: "16 ס״מ",
        userAnswer: "15 ס״מ",
        confidence: "moderate",
      },
      evidenceSuccess: null,
      insufficientData: [],
      diagnosticSparseNoteHe: null,
    },
    english: {
      subject: "english",
      subjectLabelHe: "אנגלית",
      mistakeEventCount: 0,
      wrongCount: 0,
      hasAnySignal: false,
      weaknesses: [],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [],
      parentRecommendationsMaintain: [],
      evidenceMistake: null,
      evidenceSuccess: null,
      insufficientData: [],
      diagnosticSparseNoteHe: null,
    },
    science: {
      subject: "science",
      subjectLabelHe: "מדעים",
      mistakeEventCount: 0,
      wrongCount: 0,
      hasAnySignal: false,
      weaknesses: [],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [],
      parentRecommendationsMaintain: [],
      evidenceMistake: null,
      evidenceSuccess: null,
      insufficientData: [],
      diagnosticSparseNoteHe: null,
    },
    hebrew: {
      subject: "hebrew",
      subjectLabelHe: "עברית",
      mistakeEventCount: 11,
      wrongCount: 11,
      hasAnySignal: true,
      weaknesses: [
        {
          id: "hebrew:w:0",
          labelHe: "קושי במילות יחס ובמבנה משפט",
          mistakeCount: 6,
          confidence: "moderate",
        },
      ],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [
        {
          id: "stu-imp:hebrew:w:0",
          textHe:
            "מומלץ להתמקד: קושי במילות יחס ובמבנה משפט (זוהו 6 טעויות דומות בטווח התאריכים).",
          strength: "moderate",
        },
      ],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [
        {
          id: "par-imp:hebrew:w:0",
          textHe:
            "מתחיל להתגבש דפוס סביב הנושא קושי במילות יחס ובמבנה משפט. מומלץ מעקב קל אחרי שבוע נוסף של תרגול ממוקד.",
          strength: "moderate",
        },
      ],
      parentRecommendationsMaintain: [],
      evidenceMistake: {
        exerciseText: "השלימו: הילדים שיחקו ___ הזמן בגן.",
        questionLabel: null,
        correctAnswer: "בְּ",
        userAnswer: "לְ",
        confidence: "moderate",
      },
      evidenceSuccess: null,
      insufficientData: [
        { mistakeCount: 3, note: "פחות מ־5 טעויות באותו דפוס — לא מספיק לקביעת חולשה יציבה" },
      ],
      diagnosticSparseNoteHe: null,
    },
    "moledet-geography": {
      subject: "moledet-geography",
      subjectLabelHe: "מולדת וגאוגרפיה",
      mistakeEventCount: 0,
      wrongCount: 0,
      hasAnySignal: false,
      weaknesses: [],
      strengths: [],
      excellent: [],
      maintain: [],
      improving: [],
      studentRecommendationsImprove: [],
      studentRecommendationsMaintain: [],
      parentRecommendationsImprove: [],
      parentRecommendationsMaintain: [],
      evidenceMistake: null,
      evidenceSuccess: null,
      insufficientData: [],
      diagnosticSparseNoteHe: null,
    },
  },
};
