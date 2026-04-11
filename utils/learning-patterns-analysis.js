import {
  MIN_PATTERN_FAMILY_FOR_DIAGNOSIS,
  MIN_MISTAKES_FOR_STRONG_RECOMMENDATION,
  normalizeMistakeEvent,
  mistakePatternClusterKey,
} from "./mistake-event";

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

function hebrewWeaknessLabel(subject, clusterKey, sampleEv) {
  const pf = sampleEv?.patternFamily || "";
  const k = sampleEv?.kind || "";
  const st = sampleEv?.subtype || "";
  const ct = sampleEv?.conceptTag || "";

  if (subject === "geometry") {
    const hay = `${pf} ${k} ${st} ${ct}`.toLowerCase();
    if (hay.includes("perimeter") && hay.includes("area"))
      return "בלבול חוזר בין היקף לשטח";
    if (hay.includes("perimeter")) return "קושי בהבחנה ובחישוב היקף";
    if (hay.includes("area") || hay.includes("שטח")) return "קושי בשטחים והבנת יחידות שטח";
    if (hay.includes("volume") || hay.includes("prism")) return "קושי בנפח ובתבניות תלת־ממד";
    if (hay.includes("angle")) return "קושי בזוויות וביחסים בין זוויות";
    if (pf) return `דפוס שגיאות: ${pf.replace(/_/g, " ")}`;
  }

  if (subject === "hebrew") {
    const h = `${pf} ${k} ${st} ${ct}`.toLowerCase();
    if (h.includes("preposition") || h.includes("מילות") || h.includes("יחס"))
      return "קושי במילות יחס ובמבנה משפט";
    if (h.includes("verb") || h.includes("פועל") || h.includes("tense"))
      return "קושי בפעלים וזמני פעולה";
    if (h.includes("syntax") || h.includes("sequence") || h.includes("רצף"))
      return "קושי ברצף לוגי ובניסוח";
    if (h.includes("clarity") || h.includes("rewrite") || h.includes("היר"))
      return "קושי בניסוח בהיר ובהבנה מדויקת של הניסוח";
    if (pf) return `דפוס בעברית: ${pf.replace(/_/g, " ")}`;
  }

  if (subject === "math") {
    const h = `${pf} ${k} ${st}`.toLowerCase();
    if (h.includes("remainder") || h.includes("שארית")) return "קושי בשארית ובחלוקה עם שארית";
    if (h.includes("compare") || h.includes("השוואה")) return "קושי בהשוואת כמויות/מספרים";
    if (h.includes("percent") || h.includes("אחוז") || h.includes("discount"))
      return "קושי באחוזים/הנחות";
    if (h.includes("fraction")) return "קושי בשברים";
    if (h.includes("decimal")) return "קושי בעשרוניים";
    if (k) return `דפוס בחשבון (${k})`;
  }

  if (pf) return `דפוס חוזר: ${pf.replace(/_/g, " ")}`;
  if (k && st) return `דפוס: ${k} — ${st}`;
  if (k) return `דפוס לפי סוג תרגיל: ${k}`;
  return `דפוס שגיאות (${clusterKey})`;
}

function recStrength(mistakeCount) {
  if (mistakeCount >= MIN_MISTAKES_FOR_STRONG_RECOMMENDATION) return "strong";
  if (mistakeCount >= MIN_PATTERN_FAMILY_FOR_DIAGNOSIS) return "moderate";
  return "tentative";
}

function buildEvidenceExample(ev, confidence) {
  if (!ev) return null;
  const ex = String(ev.exerciseText || "").trim();
  if (ex.length > 220) return null;
  if (!ex && ev.userAnswer == null) return null;
  return {
    patternKey: mistakePatternClusterKey(ev),
    exerciseText: ex || null,
    questionLabel: ev.questionLabel,
    correctAnswer: ev.correctAnswer,
    userAnswer: ev.userAnswer,
    confidence,
  };
}

/**
 * @param {Record<string, unknown>} report Output of generateParentReportV2 (or compatible).
 * @param {Record<string, unknown[]>} [rawMistakesBySubject] subjectId -> raw localStorage rows (date-filtered).
 */
export function analyzeLearningPatterns(report, rawMistakesBySubject = {}) {
  const out = {
    version: 1,
    generatedAt: new Date().toISOString(),
    constants: {
      minMistakesPerPatternFamily: MIN_PATTERN_FAMILY_FOR_DIAGNOSIS,
      minMistakesForStrongRecommendation: MIN_MISTAKES_FOR_STRONG_RECOMMENDATION,
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

    const stableWeaknesses = [];
    const insufficientData = [];
    const evidenceExamples = [];

    Object.entries(clusters).forEach(([clusterKey, list]) => {
      const n = list.length;
      if (n < MIN_PATTERN_FAMILY_FOR_DIAGNOSIS) {
        if (insufficientData.length < 24) {
          insufficientData.push({
            clusterKey,
            mistakeCount: n,
            note: "פחות מ־5 טעויות באותו דפוס — לא מספיק לקביעת חולשה יציבה",
          });
        }
        return;
      }
      const sample = list[list.length - 1];
      const label = hebrewWeaknessLabel(sid, clusterKey, sample);
      const strength = recStrength(n);
      stableWeaknesses.push({
        id: `${sid}:${clusterKey}`,
        clusterKey,
        label,
        mistakeCount: n,
        patternFamily: sample.patternFamily,
        kind: sample.kind,
        subtype: sample.subtype,
        conceptTag: sample.conceptTag,
        topicOrOperation: sample.topicOrOperation,
        confidence: strength === "strong" ? "high" : "moderate",
      });
      const ev = buildEvidenceExample(sample, strength === "strong" ? "high" : "moderate");
      if (ev) evidenceExamples.push(ev);
    });

    const rowsKey = REPORT_ROWS_KEY[sid];
    const rows = rowsKey && report[rowsKey] ? report[rowsKey] : {};
    const stableStrengths = [];
    Object.entries(rows).forEach(([rowKey, row]) => {
      if (!row || typeof row !== "object") return;
      if (row.excellent && row.questions >= 10) {
        stableStrengths.push({
          id: `${sid}:${rowKey}`,
          rowKey,
          label: `${SUBJECT_LABEL_HE[sid]}: ${row.displayName || row.bucketKey || ""}`.trim(),
          basis: "session_row_excellent",
          questions: row.questions,
          accuracy: row.accuracy,
          confidence: row.questions >= 24 ? "high" : "moderate",
        });
      }
    });

    const studentRecommendations = [];
    const parentRecommendations = [];

    stableWeaknesses.forEach((w) => {
      const rs = recStrength(w.mistakeCount);
      studentRecommendations.push({
        id: `stu:${w.id}`,
        text: `לתרגל בממוקד את הדפוס: ${w.label} (זוהה ${w.mistakeCount} טעויות דומות בטווח התאריכים).`,
        relatedWeaknessId: w.id,
        strength: rs,
      });
      parentRecommendations.push({
        id: `par:${w.id}`,
        text:
          rs === "strong"
            ? `יש דפוס חוזר (${w.label}). כדאי לשבת 10–15 דקות יחד על דוגמה אחת, לבדוק את הלוגיקה ולא את הזיכרון בלבד.`
            : `מתחיל להתגבש דפוס (${w.label}). מומלץ מעקב קצר אחרי שבוע נוסף של תרגול.`,
        relatedWeaknessId: w.id,
        strength: rs,
      });
    });

    if (!stableWeaknesses.length && wrong.length > 0) {
      parentRecommendations.push({
        id: `par:${sid}:sparse`,
        text: "יש טעויות בודדות אך בלי דפוס שחוזר על עצמו מספיק פעמים — עדיין לא ניתן לאבחן חולשה יציבה.",
        relatedWeaknessId: null,
        strength: "tentative",
      });
    }

    out.subjects[sid] = {
      subject: sid,
      subjectLabelHe: SUBJECT_LABEL_HE[sid],
      mistakeEventCount: events.length,
      wrongCount: wrong.length,
      stableWeaknesses,
      stableStrengths,
      studentRecommendations,
      parentRecommendations,
      evidenceExamples,
      insufficientData,
    };
  }

  return out;
}

/**
 * Example diagnostic payload (static) — for contracts / UI later; not tied to live storage.
 */
export const EXAMPLE_PATTERN_DIAGNOSTICS_PAYLOAD = {
  version: 1,
  generatedAt: "2026-04-11T12:00:00.000Z",
  constants: {
    minMistakesPerPatternFamily: 5,
    minMistakesForStrongRecommendation: 10,
  },
  subjects: {
    math: {
      subject: "math",
      subjectLabelHe: "חשבון",
      mistakeEventCount: 12,
      wrongCount: 12,
      stableWeaknesses: [
        {
          id: "math:pf:word_compare_remainder_easy",
          clusterKey: "pf:word_compare_remainder_easy",
          label: "קושי בהשוואת כמויות/מספרים",
          mistakeCount: 7,
          patternFamily: "word_compare_remainder_easy",
          kind: "word_problem",
          subtype: "compare_remainder",
          conceptTag: null,
          topicOrOperation: "word_problems",
          confidence: "moderate",
        },
      ],
      stableStrengths: [
        {
          id: "math:addition\u0001learning",
          rowKey: "addition\u0001learning",
          label: "חשבון: חיבור",
          basis: "session_row_excellent",
          questions: 42,
          accuracy: 93,
          confidence: "high",
        },
      ],
      studentRecommendations: [
        {
          id: "stu:math:pf:word_compare_remainder_easy",
          text: "לתרגל בממוקד את הדפוס: קושי בהשוואת כמויות/מספרים (זוהה 7 טעויות דומות בטווח התאריכים).",
          relatedWeaknessId: "math:pf:word_compare_remainder_easy",
          strength: "moderate",
        },
      ],
      parentRecommendations: [
        {
          id: "par:math:pf:word_compare_remainder_easy",
          text: "מתחיל להתגבש דפוס (קושי בהשוואת כמויות/מספרים). מומלץ מעקב קצר אחרי שבוע נוסף של תרגול.",
          relatedWeaknessId: "math:pf:word_compare_remainder_easy",
          strength: "moderate",
        },
      ],
      evidenceExamples: [
        {
          patternKey: "pf:word_compare_remainder_easy",
          exerciseText: "בכמה שקים המחיר של המחשב גבוה יותר?",
          questionLabel: null,
          correctAnswer: 120,
          userAnswer: 102,
          confidence: "moderate",
        },
      ],
      insufficientData: [
        {
          clusterKey: "k:vertical_subtraction|st:borrow_once",
          mistakeCount: 2,
          note: "פחות מ־5 טעויות באותו דפוס — לא מספיק לקביעת חולשה יציבה",
        },
      ],
    },
    geometry: {
      subject: "geometry",
      subjectLabelHe: "גאומטריה",
      mistakeEventCount: 9,
      wrongCount: 9,
      stableWeaknesses: [
        {
          id: "geometry:pf:rectangle_perimeter_vs_area_grade3",
          clusterKey: "pf:rectangle_perimeter_vs_area_grade3",
          label: "בלבול חוזר בין היקף לשטח",
          mistakeCount: 6,
          patternFamily: "rectangle_perimeter_vs_area_grade3",
          kind: "mcq",
          subtype: "choose_measure",
          conceptTag: "perimeter_area_distinction",
          topicOrOperation: "rectangles",
          confidence: "moderate",
        },
      ],
      stableStrengths: [],
      studentRecommendations: [
        {
          id: "stu:geometry:pf:rectangle_perimeter_vs_area_grade3",
          text: "לתרגל בממוקד את הדפוס: בלבול חוזר בין היקף לשטח (זוהה 6 טעויות דומות בטווח התאריכים).",
          relatedWeaknessId: "geometry:pf:rectangle_perimeter_vs_area_grade3",
          strength: "moderate",
        },
      ],
      parentRecommendations: [
        {
          id: "par:geometry:pf:rectangle_perimeter_vs_area_grade3",
          text: "מתחיל להתגבש דפוס (בלבול חוזר בין היקף לשטח). מומלץ מעקב קצר אחרי שבוע נוסף של תרגול.",
          relatedWeaknessId: "geometry:pf:rectangle_perimeter_vs_area_grade3",
          strength: "moderate",
        },
      ],
      evidenceExamples: [
        {
          patternKey: "pf:rectangle_perimeter_vs_area_grade3",
          exerciseText: "מה ההיקף של מלבן 5×3 ס״מ?",
          questionLabel: null,
          correctAnswer: "16 ס״מ",
          userAnswer: "15 ס״מ",
          confidence: "moderate",
        },
      ],
      insufficientData: [],
    },
    english: {
      subject: "english",
      subjectLabelHe: "אנגלית",
      mistakeEventCount: 0,
      wrongCount: 0,
      stableWeaknesses: [],
      stableStrengths: [],
      studentRecommendations: [],
      parentRecommendations: [],
      evidenceExamples: [],
      insufficientData: [],
    },
    science: {
      subject: "science",
      subjectLabelHe: "מדעים",
      mistakeEventCount: 0,
      wrongCount: 0,
      stableWeaknesses: [],
      stableStrengths: [],
      studentRecommendations: [],
      parentRecommendations: [],
      evidenceExamples: [],
      insufficientData: [],
    },
    hebrew: {
      subject: "hebrew",
      subjectLabelHe: "עברית",
      mistakeEventCount: 11,
      wrongCount: 11,
      stableWeaknesses: [
        {
          id: "hebrew:pf:hebrew_prepositions_in_context",
          clusterKey: "pf:hebrew_prepositions_in_context",
          label: "קושי במילות יחס ובמבנה משפט",
          mistakeCount: 6,
          patternFamily: "hebrew_prepositions_in_context",
          kind: "cloze",
          subtype: "preposition_choice",
          conceptTag: "prepositions",
          topicOrOperation: "grammar",
          confidence: "moderate",
        },
      ],
      stableStrengths: [],
      studentRecommendations: [
        {
          id: "stu:hebrew:pf:hebrew_prepositions_in_context",
          text: "לתרגל בממוקד את הדפוס: קושי במילות יחס ובמבנה משפט (זוהה 6 טעויות דומות בטווח התאריכים).",
          relatedWeaknessId: "hebrew:pf:hebrew_prepositions_in_context",
          strength: "moderate",
        },
      ],
      parentRecommendations: [
        {
          id: "par:hebrew:pf:hebrew_prepositions_in_context",
          text: "מתחיל להתגבש דפוס (קושי במילות יחס ובמבנה משפט). מומלץ מעקב קצר אחרי שבוע נוסף של תרגול.",
          relatedWeaknessId: "hebrew:pf:hebrew_prepositions_in_context",
          strength: "moderate",
        },
      ],
      evidenceExamples: [
        {
          patternKey: "pf:hebrew_prepositions_in_context",
          exerciseText: "השלימו: הילדים שיחקו ___ הזמן בגן.",
          questionLabel: null,
          correctAnswer: "בְּ",
          userAnswer: "לְ",
          confidence: "moderate",
        },
      ],
      insufficientData: [
        {
          clusterKey: "pf:hebrew_logical_sequence",
          mistakeCount: 3,
          note: "פחות מ־5 טעויות באותו דפוס — לא מספיק לקביעת חולשה יציבה",
        },
      ],
    },
    "moledet-geography": {
      subject: "moledet-geography",
      subjectLabelHe: "מולדת וגאוגרפיה",
      mistakeEventCount: 0,
      wrongCount: 0,
      stableWeaknesses: [],
      stableStrengths: [],
      studentRecommendations: [],
      parentRecommendations: [],
      evidenceExamples: [],
      insufficientData: [],
    },
  },
};
