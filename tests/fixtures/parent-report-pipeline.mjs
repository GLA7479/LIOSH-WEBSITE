/**
 * בוני דוחות V2 סינתטיים לבדיקות — מזינים את analyzeLearningPatterns ואז detailed.
 */
import * as learningPatternsMod from "../../utils/learning-patterns-analysis.js";

const learningPatterns =
  learningPatternsMod.default && typeof learningPatternsMod.default === "object"
    ? learningPatternsMod.default
    : learningPatternsMod;
const { analyzeLearningPatterns, EXAMPLE_PATTERN_DIAGNOSTICS_PAYLOAD } = learningPatterns;

const START = "2026-04-01";
const END = "2026-04-10";
const END_MS = Date.UTC(2026, 3, 10, 23, 59, 59, 999);

function defaultSummary(over = {}) {
  return {
    totalQuestions: 0,
    totalTimeMinutes: 0,
    overallAccuracy: 0,
    mathQuestions: 0,
    mathCorrect: 0,
    mathAccuracy: 0,
    geometryQuestions: 0,
    geometryCorrect: 0,
    geometryAccuracy: 0,
    englishQuestions: 0,
    englishCorrect: 0,
    englishAccuracy: 0,
    scienceQuestions: 0,
    scienceCorrect: 0,
    scienceAccuracy: 0,
    hebrewQuestions: 0,
    hebrewCorrect: 0,
    hebrewAccuracy: 0,
    moledetGeographyQuestions: 0,
    moledetGeographyCorrect: 0,
    moledetGeographyAccuracy: 0,
    ...over,
  };
}

function emptyAnalysis() {
  return {
    mathMistakesByOperation: {},
    geometryMistakesByTopic: {},
    englishMistakesByTopic: {},
    scienceMistakesByTopic: {},
    hebrewMistakesByTopic: {},
    moledetGeographyMistakesByTopic: {},
    needsPractice: {},
    excellent: {},
    recommendations: [],
  };
}

/** @param {Record<string, unknown>} partial */
export function buildSyntheticBaseReport(partial) {
  const summary = defaultSummary(partial.summary || {});
  const report = {
    startDate: START,
    endDate: END,
    period: "week",
    playerName: partial.playerName || "_fixture_",
    summary,
    mathOperations: partial.mathOperations || {},
    geometryTopics: partial.geometryTopics || {},
    englishTopics: partial.englishTopics || {},
    scienceTopics: partial.scienceTopics || {},
    hebrewTopics: partial.hebrewTopics || {},
    moledetGeographyTopics: partial.moledetGeographyTopics || {},
    analysis: { ...emptyAnalysis(), ...(partial.analysis || {}) },
    challenges: { daily: {}, weekly: {}, bySubject: {} },
    achievements: [],
    allItems: {},
    dailyActivity: [],
    dataIntegrityReport: partial.dataIntegrityReport ?? { version: 1, issues: [] },
  };
  const mistakes = partial.mistakes || {};
  if (partial.patternDiagnostics) {
    report.patternDiagnostics = partial.patternDiagnostics;
  } else {
    report.patternDiagnostics = analyzeLearningPatterns(report, mistakes);
  }
  return report;
}

/** דוח עם patternDiagnostics ידני (למשל JSON ישן) — בלי analyzeLearningPatterns */
export function buildBaseReportWithPatternDiagnosticsOnly(partial) {
  const summary = defaultSummary(partial.summary || {});
  return {
    startDate: START,
    endDate: END,
    period: "week",
    playerName: partial.playerName || "_fixture_",
    summary,
    mathOperations: partial.mathOperations || {},
    geometryTopics: partial.geometryTopics || {},
    englishTopics: partial.englishTopics || {},
    scienceTopics: partial.scienceTopics || {},
    hebrewTopics: partial.hebrewTopics || {},
    moledetGeographyTopics: partial.moledetGeographyTopics || {},
    analysis: { ...emptyAnalysis(), ...(partial.analysis || {}) },
    challenges: { daily: {}, weekly: {}, bySubject: {} },
    achievements: [],
    allItems: {},
    dailyActivity: [],
    dataIntegrityReport: partial.dataIntegrityReport ?? { version: 1, issues: [] },
    patternDiagnostics: partial.patternDiagnostics,
  };
}

/** טעויות חוזרות לאותו cluster (≥5) */
export function mathWrongCluster(n, patternFamily = "pf:fixture_gap") {
  const base = Date.UTC(2026, 3, 5, 10, 0, 0);
  return Array.from({ length: n }, (_, i) => ({
    subject: "math",
    operation: "addition",
    bucketKey: "addition",
    timestamp: base + i * 2000,
    isCorrect: false,
    exerciseText: `שאלת חיבור ${i}`,
    correctAnswer: 8,
    userAnswer: 3,
    patternFamily,
    hintUsed: true,
    responseMs: 600,
  }));
}

export function mathRowSession(opts) {
  const q = opts.questions ?? 14;
  const acc = opts.accuracy ?? 72;
  const correct = Math.round((q * acc) / 100);
  return {
    bucketKey: opts.bucketKey || "addition",
    displayName: opts.displayName || "חיבור",
    questions: q,
    correct,
    wrong: q - correct,
    accuracy: acc,
    needsPractice: opts.needsPractice ?? true,
    excellent: opts.excellent ?? false,
    modeKey: opts.modeKey || "learning",
    lastSessionMs: opts.lastSessionMs ?? END_MS - 86400000,
    timeMinutes: opts.timeMinutes ?? 20,
    trend: opts.trend ?? null,
    behaviorProfile: opts.behaviorProfile ?? null,
    topicEngineRowSignals: opts.topicEngineRowSignals ?? null,
    ...(opts.levelKey ? { levelKey: opts.levelKey } : {}),
    ...(opts.gradeKey ? { gradeKey: opts.gradeKey } : {}),
  };
}

/** תרחישים לפי שם — מחזיר baseReport מוכן ל־buildDetailedParentReportFromBaseReport */
export const PARENT_REPORT_SCENARIOS = {
  all_sparse: () =>
    buildSyntheticBaseReport({
      summary: { totalQuestions: 2, totalTimeMinutes: 5, overallAccuracy: 0 },
    }),

  one_dominant_subject: () => {
    const q = 48;
    const acc = 76;
    const correct = Math.round((q * acc) / 100);
    return buildSyntheticBaseReport({
      summary: {
        totalQuestions: q,
        mathQuestions: q,
        mathCorrect: correct,
        mathAccuracy: acc,
        overallAccuracy: acc,
      },
      mathOperations: {
        "addition\u0001learning": mathRowSession({ questions: q, accuracy: acc, needsPractice: true }),
      },
      mistakes: { math: mathWrongCluster(5) },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 5 } },
      },
    });
  },

  stable_excellence: () =>
    buildSyntheticBaseReport({
      summary: {
        totalQuestions: 30,
        mathQuestions: 30,
        mathCorrect: 28,
        mathAccuracy: 93,
        overallAccuracy: 93,
      },
      mathOperations: {
        "addition\u0001learning": mathRowSession({
          questions: 24,
          accuracy: 93,
          needsPractice: false,
          excellent: true,
        }),
      },
      mistakes: {},
    }),

  fragile_success: () =>
    buildSyntheticBaseReport({
      summary: { totalQuestions: 40, mathQuestions: 40, mathCorrect: 30, mathAccuracy: 75, overallAccuracy: 75 },
      mathOperations: {
        "addition\u0001learning": mathRowSession({
          questions: 20,
          accuracy: 78,
          behaviorProfile: {
            version: 1,
            dominantType: "fragile_success",
            signals: { hintRate: 0.4, hintKnownCount: 6 },
            decisionTrace: [],
          },
          topicEngineRowSignals: {
            riskFlags: { falsePromotionRisk: true, hintDependenceRisk: true },
            confidenceBadge: "medium",
            sufficiencyBadge: "medium",
            diagnosticType: "fragile_success",
            whyThisRecommendationHe: "fragile_success — דיוק עולה אך עצמאות יורדת.",
          },
        }),
      },
      mistakes: { math: mathWrongCluster(5) },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 5 } },
      },
    }),

  knowledge_gap: () =>
    buildSyntheticBaseReport({
      summary: { totalQuestions: 35, mathQuestions: 35, mathCorrect: 18, mathAccuracy: 51, overallAccuracy: 51 },
      mathOperations: {
        "addition\u0001learning": mathRowSession({
          questions: 18,
          accuracy: 50,
          behaviorProfile: {
            version: 1,
            dominantType: "knowledge_gap",
            signals: {},
            decisionTrace: [],
          },
        }),
      },
      mistakes: { math: mathWrongCluster(8, "pf:gap_core") },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 8 } },
      },
    }),

  careless_pattern: () =>
    buildSyntheticBaseReport({
      summary: { totalQuestions: 28, mathQuestions: 28, mathCorrect: 22, mathAccuracy: 78, overallAccuracy: 78 },
      mathOperations: {
        "addition\u0001learning": mathRowSession({
          questions: 22,
          accuracy: 78,
          modeKey: "speed",
          behaviorProfile: {
            version: 1,
            dominantType: "careless_pattern",
            signals: {},
            decisionTrace: [],
          },
        }),
      },
      mistakes: { math: mathWrongCluster(5, "pf:careless_fixture") },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 5 } },
      },
    }),

  instruction_friction: () =>
    buildSyntheticBaseReport({
      summary: { totalQuestions: 30, mathQuestions: 30, mathCorrect: 20, mathAccuracy: 66, overallAccuracy: 66 },
      mathOperations: {
        "addition\u0001learning": mathRowSession({
          questions: 18,
          accuracy: 66,
          behaviorProfile: {
            version: 1,
            dominantType: "instruction_friction",
            signals: { hintRate: 0.45, hintKnownCount: 8 },
            decisionTrace: [],
          },
        }),
      },
      mistakes: { math: mathWrongCluster(6, "pf:instr_friction") },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 6 } },
      },
    }),

  speed_only_weakness: () =>
    buildSyntheticBaseReport({
      summary: { totalQuestions: 26, mathQuestions: 26, mathCorrect: 20, mathAccuracy: 77, overallAccuracy: 77 },
      mathOperations: {
        "addition\u0001marathon": mathRowSession({
          questions: 22,
          accuracy: 77,
          modeKey: "marathon",
          behaviorProfile: {
            version: 1,
            dominantType: "speed_pressure",
            signals: {},
            decisionTrace: [],
          },
        }),
      },
      mistakes: { math: mathWrongCluster(5, "pf:speed_only") },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 5 } },
      },
    }),

  positive_trend_weak_independence: () =>
    buildSyntheticBaseReport({
      summary: { totalQuestions: 32, mathQuestions: 32, mathCorrect: 26, mathAccuracy: 81, overallAccuracy: 81 },
      mathOperations: {
        "addition\u0001learning": mathRowSession({
          questions: 24,
          accuracy: 81,
          trend: {
            version: 1,
            accuracyDirection: "up",
            independenceDirection: "down",
            fluencyDirection: "flat",
            confidence: 0.55,
            summaryHe: "הדיוק עולה אך העצמאות יורדת בטווח.",
          },
        }),
      },
      mistakes: { math: mathWrongCluster(5) },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 5 } },
      },
    }),

  mixed_signals_cross_subjects: () =>
    buildSyntheticBaseReport({
      summary: {
        totalQuestions: 55,
        mathQuestions: 30,
        mathCorrect: 24,
        mathAccuracy: 80,
        geometryQuestions: 25,
        geometryCorrect: 10,
        geometryAccuracy: 40,
        overallAccuracy: 62,
      },
      mathOperations: {
        "addition\u0001learning": mathRowSession({ questions: 22, accuracy: 82, needsPractice: false }),
      },
      geometryTopics: {
        "perimeter\u0001learning": mathRowSession({
          questions: 16,
          accuracy: 38,
          needsPractice: true,
          displayName: "היקף",
        }),
      },
      mistakes: {
        math: mathWrongCluster(5),
        geometry: Array.from({ length: 6 }, (_, i) => ({
          subject: "geometry",
          topic: "perimeter",
          bucketKey: "perimeter",
          timestamp: Date.UTC(2026, 3, 6, 12, 0, 0) + i * 1000,
          isCorrect: false,
          exerciseText: "היקף מלבן",
          correctAnswer: 20,
          userAnswer: 12,
          patternFamily: "pf:geo_mix",
        })),
      },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 5 } },
        geometryMistakesByTopic: { perimeter: { count: 6 } },
      },
    }),

  high_risk_despite_strengths: () =>
    buildSyntheticBaseReport({
      summary: { totalQuestions: 42, mathQuestions: 42, mathCorrect: 36, mathAccuracy: 86, overallAccuracy: 86 },
      mathOperations: {
        "addition\u0001learning": mathRowSession({
          questions: 24,
          accuracy: 90,
          excellent: true,
          needsPractice: false,
          topicEngineRowSignals: {
            riskFlags: {
              falsePromotionRisk: true,
              hintDependenceRisk: true,
              insufficientEvidenceRisk: true,
              falseRemediationRisk: false,
              speedOnlyRisk: false,
              recentTransitionRisk: false,
            },
            confidenceBadge: "high",
            sufficiencyBadge: "low",
            diagnosticType: "fragile_success",
            whyThisRecommendationHe: "יש חוזקות אך גם דגלי סיכון מהמנוע.",
          },
        }),
      },
      mistakes: { math: mathWrongCluster(5) },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 5 } },
      },
    }),

  no_exec_richness: () =>
    buildSyntheticBaseReport({
      summary: { totalQuestions: 4, totalTimeMinutes: 3, overallAccuracy: 50 },
    }),

  strong_executive_case: () => {
    const ex = structuredClone(EXAMPLE_PATTERN_DIAGNOSTICS_PAYLOAD);
    return buildSyntheticBaseReport({
      patternDiagnostics: ex,
      summary: {
        totalQuestions: 120,
        totalTimeMinutes: 200,
        overallAccuracy: 82,
        mathQuestions: 60,
        mathCorrect: 55,
        mathAccuracy: 92,
        geometryQuestions: 60,
        geometryCorrect: 44,
        geometryAccuracy: 73,
      },
    });
  },

  /** patternDiagnostics מוכן מראש (JSON לגאסי) */
  legacy_json_pattern_diagnostics: () =>
    buildBaseReportWithPatternDiagnosticsOnly({
      patternDiagnostics: structuredClone(EXAMPLE_PATTERN_DIAGNOSTICS_PAYLOAD),
      summary: {
        totalQuestions: 90,
        mathQuestions: 45,
        mathCorrect: 40,
        mathAccuracy: 89,
        geometryQuestions: 45,
        geometryCorrect: 30,
        geometryAccuracy: 67,
        overallAccuracy: 78,
      },
    }),

  /**
   * Phase 6 hardening — מעבר לרמה קשה + מגמה שלילית + חלון קצר חלש משמעותית לעומת התקופה (מפעיל recentTransitionRisk ו־recentDifficultyIncrease).
   */
  recent_transition_recent_difficulty_increase: () =>
    buildSyntheticBaseReport({
      summary: {
        totalQuestions: 44,
        mathQuestions: 44,
        mathCorrect: 26,
        mathAccuracy: 59,
        overallAccuracy: 59,
      },
      mathOperations: {
        "addition\u0001learning": mathRowSession({
          questions: 22,
          accuracy: 58,
          levelKey: "hard",
          trend: {
            version: 1,
            accuracyDirection: "down",
            independenceDirection: "flat",
            fluencyDirection: "flat",
            confidence: 0.55,
            summaryHe: "ירידה בדיוק בחלון האחרון לעומת ריכוז טוב יותר בתקופה.",
            windows: {
              currentPeriod: { accuracy: 72 },
              recentShortWindow: { accuracy: 56 },
              previousComparablePeriod: { accuracy: 74 },
            },
          },
        }),
      },
      mistakes: { math: mathWrongCluster(9) },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 9 } },
      },
    }),

  /** Phase 6 — סיכום מנהלים: מקצוע דומיננטי אחד (מפנה לאותו בונה כמו one_dominant_subject). */
  exec_summary_one_dominant_subject: () => PARENT_REPORT_SCENARIOS.one_dominant_subject(),

  /** Phase 6 — חוזקות לצד סיכון גבוה (מפנה ל-high_risk_despite_strengths). */
  exec_summary_high_risk_and_strengths_coexist: () => PARENT_REPORT_SCENARIOS.high_risk_despite_strengths(),

  /** Phase 6 — אותות מעורבים חוצי־מקצועות (מפנה ל-mixed_signals_cross_subjects). */
  exec_summary_mixed_cross_subject_signals: () => PARENT_REPORT_SCENARIOS.mixed_signals_cross_subjects(),

  /**
   * Phase 6 — recommendedHomeMethodHe חסר במקצוע (בדיקת עמידות UI/מכתב; לא אמור לזרוק raw id לתווית).
   */
  exec_summary_no_recommended_home_method_he: () => {
    const base = buildSyntheticBaseReport({
      summary: {
        totalQuestions: 36,
        mathQuestions: 36,
        mathCorrect: 22,
        mathAccuracy: 61,
        overallAccuracy: 61,
      },
      mathOperations: {
        "addition\u0001learning": mathRowSession({
          questions: 20,
          accuracy: 60,
          behaviorProfile: {
            version: 1,
            dominantType: "knowledge_gap",
            signals: {},
            decisionTrace: [],
          },
        }),
      },
      mistakes: { math: mathWrongCluster(7, "pf:no_home_fixture") },
      analysis: {
        ...emptyAnalysis(),
        mathMistakesByOperation: { addition: { count: 7 } },
      },
    });
    const pd = structuredClone(base.patternDiagnostics);
    if (pd.subjects?.math) {
      delete pd.subjects.math.recommendedHomeMethodHe;
    }
    return { ...base, patternDiagnostics: pd };
  },
};
