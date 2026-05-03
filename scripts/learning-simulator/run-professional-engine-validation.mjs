#!/usr/bin/env node
/**
 * Professional engine validation — synthetic scenarios with concrete assertions.
 * npm run qa:learning-simulator:professional-engine
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_JSON = join(ROOT, "reports/learning-simulator/engine-professionalization/professional-engine-validation.json");
const OUT_MD = join(ROOT, "reports/learning-simulator/engine-professionalization/professional-engine-validation.md");

const SEP = "\u0001";

async function loadEngines() {
  const runDiagnosticEngineV2 = (await import(pathToFileURL(join(ROOT, "utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js")).href))
    .runDiagnosticEngineV2;
  const fw = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/diagnostic-framework-v1.js")).href);
  const pe = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/professional-engine-output-v1.js")).href);
  return { runDiagnosticEngineV2, fw, pe };
}

function emptySubs() {
  return {
    math: {},
    hebrew: {},
    english: {},
    science: {},
    geometry: {},
    "moledet-geography": {},
  };
}

/** Spread other subjects without overwriting named keys (omit math/hebrew/… keys). */
function subsExcept(...omitKeys) {
  return Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => !omitKeys.includes(k)));
}

/** @param {object} sc */
function runPipeline(sc, runDiagnosticEngineV2, fw, pe, startMs, endMs) {
  let engine = runDiagnosticEngineV2({
    maps: sc.maps,
    rawMistakesBySubject: sc.rawMistakesBySubject,
    startMs,
    endMs,
  });
  fw.enrichDiagnosticEngineV2WithProfessionalFrameworkV1(engine, sc.maps, sc.summaryCounts);
  pe.enrichDiagnosticEngineV2WithProfessionalEngineV1(engine, sc.maps, sc.summaryCounts, {
    rawMistakesBySubject: sc.rawMistakesBySubject,
    startMs,
    endMs,
    studentGradeKey: sc.studentGradeKey ?? null,
  });
  return engine.professionalEngineV1;
}

function mkSummary(over) {
  const base = {
    mathQuestions: 0,
    hebrewQuestions: 0,
    englishQuestions: 0,
    scienceQuestions: 0,
    geometryQuestions: 0,
    moledetGeographyQuestions: 0,
    mathAccuracy: NaN,
    hebrewAccuracy: NaN,
    englishAccuracy: NaN,
    scienceAccuracy: NaN,
    geometryAccuracy: NaN,
    moledetGeographyAccuracy: NaN,
    totalQuestions: 0,
  };
  return { ...base, ...over };
}

function scenarios() {
  const now = Date.now();
  const stale = now - 90 * 86400000;

  return [
    {
      label: "strong_all_subjects",
      maps: {
        math: { addition: { questions: 45, correct: 42, wrong: 3, accuracy: 93, needsPractice: false, displayName: "addition" } },
        hebrew: { comprehension: { questions: 45, correct: 41, wrong: 4, accuracy: 91, needsPractice: false, displayName: "comprehension" } },
        english: { grammar: { questions: 45, correct: 40, wrong: 5, accuracy: 89, needsPractice: false, displayName: "grammar" } },
        science: { experiments: { questions: 45, correct: 41, wrong: 4, accuracy: 91, needsPractice: false, displayName: "experiments" } },
        geometry: { area: { questions: 45, correct: 42, wrong: 3, accuracy: 93, needsPractice: false, displayName: "area" } },
        "moledet-geography": { maps: { questions: 45, correct: 41, wrong: 4, accuracy: 91, needsPractice: false, displayName: "maps" } },
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({
        mathQuestions: 45,
        hebrewQuestions: 45,
        englishQuestions: 45,
        scienceQuestions: 45,
        geometryQuestions: 45,
        moledetGeographyQuestions: 45,
        mathAccuracy: 93,
        hebrewAccuracy: 91,
        englishAccuracy: 89,
        scienceAccuracy: 91,
        geometryAccuracy: 93,
        moledetGeographyAccuracy: 91,
        totalQuestions: 270,
      }),
      assert: (p) => {
        const weakEmerging = (p.mastery?.items || []).filter((x) => x.masteryBand === "emerging" && x.questionCount >= 40);
        return (
          p.engineReadiness !== "needs_more_data" &&
          p.engineConfidence !== "low" &&
          weakEmerging.length === 0 &&
          (p.mastery?.items || []).length >= 4
        );
      },
      expectSummary: "High volume all subjects; no false emerging at volume; readiness not thin-data.",
    },
    {
      label: "weak_all_subjects",
      maps: {
        math: { addition: { questions: 30, correct: 12, wrong: 18, accuracy: 40, needsPractice: true, displayName: "addition" } },
        hebrew: { comprehension: { questions: 30, correct: 10, wrong: 20, accuracy: 33, needsPractice: true, displayName: "comprehension" } },
        english: { grammar: { questions: 30, correct: 11, wrong: 19, accuracy: 37, needsPractice: true, displayName: "grammar" } },
        science: { experiments: { questions: 30, correct: 10, wrong: 20, accuracy: 33, needsPractice: true, displayName: "experiments" } },
        geometry: { area: { questions: 30, correct: 12, wrong: 18, accuracy: 40, needsPractice: true, displayName: "area" } },
        "moledet-geography": { maps: { questions: 30, correct: 10, wrong: 20, accuracy: 33, needsPractice: true, displayName: "maps" } },
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({
        mathQuestions: 30,
        hebrewQuestions: 30,
        englishQuestions: 30,
        scienceQuestions: 30,
        geometryQuestions: 30,
        moledetGeographyQuestions: 30,
        mathAccuracy: 40,
        hebrewAccuracy: 33,
        englishAccuracy: 37,
        scienceAccuracy: 33,
        geometryAccuracy: 40,
        moledetGeographyAccuracy: 33,
        totalQuestions: 180,
      }),
      assert: (p) => (p.mastery?.items || []).filter((x) => ["emerging", "developing"].includes(x.masteryBand)).length >= 5,
      expectSummary: "Multiple weak skill bands across subjects.",
    },
    {
      label: "weak_math_fractions",
      maps: {
        math: {
          fractions: { questions: 28, correct: 9, wrong: 19, accuracy: 32, needsPractice: true, displayName: "fractions" },
        },
        ...subsExcept("math"),
      },
      rawMistakesBySubject: {
        math: [{ isCorrect: false, operation: "fractions", correctAnswer: 1, userAnswer: 0, timestamp: now - 1000, responseMs: 6000 }],
        hebrew: [],
        english: [],
        science: [],
        geometry: [],
        "moledet-geography": [],
      },
      summaryCounts: mkSummary({ mathQuestions: 28, totalQuestions: 28, mathAccuracy: 32 }),
      assert: (p) => {
        const fr = (p.mastery?.items || []).find((x) => x.subjectId === "math" && x.skillId === "fractions");
        return !!fr && ["emerging", "developing"].includes(fr.masteryBand);
      },
      expectSummary: "Fractions skill shows weakness band.",
    },
    {
      label: "weak_hebrew_comprehension",
      maps: {
        ...emptySubs(),
        hebrew: {
          comprehension: { questions: 22, correct: 8, wrong: 14, accuracy: 36, needsPractice: true, displayName: "comprehension" },
        },
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ hebrewQuestions: 22, totalQuestions: 22, hebrewAccuracy: 36 }),
      assert: (p) =>
        !!(p.mastery?.items || []).find((x) => x.subjectId === "hebrew" && x.skillId === "reading_comprehension" && x.masteryScore < 70),
      expectSummary: "Hebrew reading_comprehension mastery signal below threshold.",
    },
    {
      label: "weak_english_grammar",
      maps: {
        ...emptySubs(),
        english: { grammar: { questions: 22, correct: 9, wrong: 13, accuracy: 41, needsPractice: true, displayName: "grammar" } },
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ englishQuestions: 22, totalQuestions: 22, englishAccuracy: 41 }),
      assert: (p) => !!(p.mastery?.items || []).find((x) => x.subjectId === "english" && x.skillId === "grammar"),
      expectSummary: "English grammar skill row present with weak accuracy.",
    },
    {
      label: "weak_science_experiments",
      maps: {
        ...emptySubs(),
        science: {
          experiments: { questions: 24, correct: 9, wrong: 15, accuracy: 38, needsPractice: true, displayName: "experiments" },
        },
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ scienceQuestions: 24, totalQuestions: 24, scienceAccuracy: 38 }),
      assert: (p) => !!(p.mastery?.items || []).find((x) => x.subjectId === "science" && x.skillId === "experiments"),
      expectSummary: "Science experiments bucket mapped to experiments skill.",
    },
    {
      label: "weak_geometry_area",
      maps: {
        ...emptySubs(),
        geometry: { area: { questions: 26, correct: 10, wrong: 16, accuracy: 38, needsPractice: true, displayName: "area" } },
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ geometryQuestions: 26, totalQuestions: 26, geometryAccuracy: 38 }),
      assert: (p) => !!(p.mastery?.items || []).find((x) => x.subjectId === "geometry" && x.skillId === "area"),
      expectSummary: "Geometry area weakness captured.",
    },
    {
      label: "weak_moledet_geography_maps",
      maps: {
        ...emptySubs(),
        "moledet-geography": {
          maps: { questions: 26, correct: 9, wrong: 17, accuracy: 35, needsPractice: true, displayName: "maps" },
        },
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ moledetGeographyQuestions: 26, totalQuestions: 26, moledetGeographyAccuracy: 35 }),
      assert: (p) => !!(p.mastery?.items || []).find((x) => x.subjectId === "moledet-geography" && x.skillId === "maps"),
      expectSummary: "Moledet maps skill weakness.",
    },
    {
      label: "thin_data",
      maps: {
        math: { addition: { questions: 3, correct: 3, wrong: 0, accuracy: 100, needsPractice: false, displayName: "addition" } },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ mathQuestions: 3, totalQuestions: 3, mathAccuracy: 100 }),
      assert: (p) =>
        p.engineReadiness === "needs_more_data" &&
        p.engineConfidence === "low" &&
        !(p.mastery?.items || []).some((x) => x.masteryBand === "mastered"),
      expectSummary: "Thin total volume → needs_more_data, low confidence, no mastered band.",
    },
    {
      label: "random_guessing",
      maps: {
        math: { addition: { questions: 40, correct: 12, wrong: 28, accuracy: 30, needsPractice: true, displayName: "addition" } },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: {
        math: Array.from({ length: 20 }).map((_, i) => ({
          isCorrect: false,
          operation: "addition",
          correctAnswer: 10,
          userAnswer: i % 7,
          timestamp: now - i * 1000,
          responseMs: 2000 + (i % 3) * 100,
        })),
        hebrew: [],
        english: [],
        science: [],
        geometry: [],
        "moledet-geography": [],
      },
      summaryCounts: mkSummary({ mathQuestions: 40, totalQuestions: 40, mathAccuracy: 30 }),
      assert: (p) => p.reliability?.guessingLikelihood >= 0.2,
      expectSummary: "Fast wrong mistakes elevate guessing likelihood.",
    },
    {
      label: "inconsistent",
      maps: {
        math: {
          addition: { questions: 20, correct: 19, wrong: 1, accuracy: 95, displayName: "addition" },
          fractions: { questions: 20, correct: 6, wrong: 14, accuracy: 30, displayName: "fractions" },
        },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ mathQuestions: 40, totalQuestions: 40, mathAccuracy: 62 }),
      assert: (p) =>
        p.reliability?.inconsistencyLevel !== "low" && (p.reliability?.accuracySpreadAcrossRows ?? 0) >= 50,
      expectSummary: "Wide row accuracy spread triggers inconsistency signal.",
    },
    {
      label: "fast_wrong",
      maps: {
        math: { addition: { questions: 35, correct: 10, wrong: 25, accuracy: 29, needsPractice: true, displayName: "addition" } },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: {
        math: Array.from({ length: 15 }).map((_, i) => ({
          isCorrect: false,
          operation: "addition",
          correctAnswer: 5,
          userAnswer: 9,
          timestamp: now - i * 500,
          responseMs: 1500,
        })),
        hebrew: [],
        english: [],
        science: [],
        geometry: [],
        "moledet-geography": [],
      },
      summaryCounts: mkSummary({ mathQuestions: 35, totalQuestions: 35, mathAccuracy: 29 }),
      assert: (p) => p.reliability?.guessingLikelihood >= 0.25 && p.reliability?.effortSignal === "fast_attempts_observed",
      expectSummary: "Very fast wrong responses drive guessing / pace signal.",
    },
    {
      label: "slow_correct",
      maps: {
        math: { addition: { questions: 30, correct: 28, wrong: 2, accuracy: 93, needsPractice: false, displayName: "addition" } },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: {
        math: Array.from({ length: 12 }).map((_, i) => ({
          isCorrect: true,
          operation: "addition",
          correctAnswer: 8,
          userAnswer: 8,
          timestamp: now - i * 800,
          responseMs: 50000,
        })),
        hebrew: [],
        english: [],
        science: [],
        geometry: [],
        "moledet-geography": [],
      },
      summaryCounts: mkSummary({ mathQuestions: 30, totalQuestions: 30, mathAccuracy: 93 }),
      assert: (p) =>
        (p.reliability?.reasoning || []).some((r) => /not.*weakness|effortful success|slow correct/i.test(r)) ||
        p.reliability?.guessingLikelihood < 0.2,
      expectSummary: "Slow correct events must not be framed as weakness (reasoning includes safeguard).",
    },
    {
      label: "improving",
      maps: {
        math: {
          mixed: { questions: 20, correct: 14, wrong: 6, accuracy: 70, displayName: "addition", trend: { accuracyDirection: "up" } },
        },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ mathQuestions: 20, totalQuestions: 20, mathAccuracy: 70 }),
      assert: (p) => (p.mastery?.items || []).some((x) => x.trend === "improving"),
      expectSummary: "Up trend on row propagates to mastery trend improving.",
    },
    {
      label: "declining",
      maps: {
        math: {
          mixed: { questions: 20, correct: 8, wrong: 12, accuracy: 40, displayName: "addition", trend: { accuracyDirection: "down" } },
        },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ mathQuestions: 20, totalQuestions: 20, mathAccuracy: 40 }),
      assert: (p) => (p.mastery?.items || []).some((x) => x.trend === "declining"),
      expectSummary: "Down trend propagates.",
    },
    {
      label: "mixed_strengths",
      maps: {
        math: { addition: { questions: 40, correct: 38, wrong: 2, accuracy: 95, needsPractice: false, displayName: "addition" } },
        hebrew: { comprehension: { questions: 30, correct: 10, wrong: 20, accuracy: 33, needsPractice: true, displayName: "comprehension" } },
        english: {},
        science: {},
        geometry: {},
        "moledet-geography": {},
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({
        mathQuestions: 40,
        hebrewQuestions: 30,
        totalQuestions: 70,
        mathAccuracy: 95,
        hebrewAccuracy: 33,
      }),
      assert: (p) => {
        const m = (p.mastery?.items || []).find((x) => x.subjectId === "math");
        const h = (p.mastery?.items || []).find((x) => x.subjectId === "hebrew");
        return m && h && m.masteryScore > h.masteryScore + 15;
      },
      expectSummary: "Math strong vs Hebrew weak separation.",
    },
    {
      label: "cross_subject_instruction_overlap",
      maps: {
        math: {
          word_problems: {
            questions: 18,
            correct: 6,
            wrong: 12,
            accuracy: 33,
            needsPractice: true,
            displayName: "word problems",
          },
        },
        hebrew: { comprehension: { questions: 18, correct: 6, wrong: 12, accuracy: 33, needsPractice: true, displayName: "comprehension" } },
        english: {},
        science: {},
        geometry: {},
        "moledet-geography": {},
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({
        mathQuestions: 18,
        hebrewQuestions: 18,
        totalQuestions: 36,
        mathAccuracy: 33,
        hebrewAccuracy: 33,
      }),
      assert: (p) =>
        (p.crossSubjectPatterns?.patterns || []).length >= 1 &&
        (p.crossSubjectPatterns?.patterns || []).every((x) => (x.doNotConclude || []).length >= 1),
      expectSummary: "Cross-subject pattern only when both subjects have volume + weakness.",
    },
    {
      label: "prerequisite_gap",
      maps: {
        math: {
          [`fractions${SEP}learning${SEP}g4${SEP}easy`]: {
            questions: 22,
            correct: 7,
            wrong: 15,
            accuracy: 32,
            needsPractice: true,
            displayName: "fractions",
          },
          [`addition${SEP}learning${SEP}g4${SEP}easy`]: {
            questions: 18,
            correct: 6,
            wrong: 12,
            accuracy: 33,
            needsPractice: true,
            displayName: "addition",
          },
        },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ mathQuestions: 40, totalQuestions: 40, mathAccuracy: 32 }),
      assert: (p) =>
        (p.dependencies?.items || []).some((d) => d.suspectedPrerequisiteGap && d.nextBestPrerequisiteToCheck),
      expectSummary: "Weak fractions with weak arithmetic prerequisite → prerequisite gap + probe target.",
    },
    {
      label: "prerequisite_direct_skill_gap",
      maps: {
        math: {
          fractions: { questions: 24, correct: 8, wrong: 16, accuracy: 33, needsPractice: true, displayName: "fractions" },
          addition: { questions: 35, correct: 33, wrong: 2, accuracy: 94, needsPractice: false, displayName: "addition" },
          number_sense: { questions: 30, correct: 28, wrong: 2, accuracy: 93, needsPractice: false, displayName: "number_sense" },
        },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ mathQuestions: 89, totalQuestions: 89, mathAccuracy: 78 }),
      assert: (p) =>
        (p.dependencies?.items || []).some((d) => (d.skillId === "fractions" || d.blockedSkillId === "fractions") && d.suspectedDirectSkillGap),
      expectSummary: "Strong prerequisites + weak fractions → direct focal skill hypothesis.",
    },
    {
      label: "misconception_repeat",
      maps: {
        math: { fractions: { questions: 24, correct: 10, wrong: 14, accuracy: 42, needsPractice: true, displayName: "fractions" } },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: {
        math: Array.from({ length: 8 }).map(() => ({
          isCorrect: false,
          operation: "fractions",
          expectedErrorTags: ["denominator_confusion"],
          correctAnswer: "1/2",
          userAnswer: "2/3",
          timestamp: now - 3000,
          responseMs: 8000,
        })),
        hebrew: [],
        english: [],
        science: [],
        geometry: [],
        "moledet-geography": [],
      },
      summaryCounts: mkSummary({ mathQuestions: 24, totalQuestions: 24, mathAccuracy: 42 }),
      assert: (p) =>
        (p.misconceptions?.math?.items || []).some((x) => x.confidence === "medium" || x.confidence === "high") &&
        (p.probes?.probes || []).some((x) => x.probeType === "misconception_confirmation"),
      expectSummary: "Repeated tagged misconceptions lift confidence and trigger misconception probe.",
    },
    {
      label: "mastery_decay_retention",
      maps: {
        math: {
          addition: {
            questions: 28,
            correct: 26,
            wrong: 2,
            accuracy: 93,
            needsPractice: false,
            displayName: "addition",
            difficultyTier: "medium",
            lastSessionMs: stale,
          },
          subtraction: {
            questions: 28,
            correct: 26,
            wrong: 2,
            accuracy: 93,
            needsPractice: false,
            displayName: "subtraction",
            difficultyTier: "hard",
            lastSessionMs: stale,
          },
        },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ mathQuestions: 56, totalQuestions: 56, mathAccuracy: 93 }),
      assert: (p) => (p.mastery?.items || []).some((x) => x.retentionRisk || x.masteryBand === "retention_risk"),
      expectSummary: "Old lastSessionMs on strong skill → retention_risk band.",
    },
    {
      label: "difficulty_calibration_easy_only",
      maps: {
        math: {
          easyA: { questions: 30, correct: 29, wrong: 1, accuracy: 97, displayName: "e1", difficultyTier: "easy" },
          easyB: { questions: 30, correct: 29, wrong: 1, accuracy: 97, displayName: "e2", difficultyTier: "easy" },
        },
        ...Object.fromEntries(Object.entries(emptySubs()).filter(([k]) => k !== "math")),
      },
      rawMistakesBySubject: { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] },
      summaryCounts: mkSummary({ mathQuestions: 60, totalQuestions: 60, mathAccuracy: 97 }),
      assert: (p) => {
        const cal = (p.calibration?.subjects || []).find((s) => s.subjectId === "math");
        const mx = (p.mastery?.items || []).find((x) => x.subjectId === "math" && x.skillId === "arithmetic_operations");
        return cal?.flags?.easyOnlyHighAccuracy === true && mx && mx.masteryBand !== "mastered";
      },
      expectSummary: "Easy-only high accuracy does not grant full mastery; calibration flags easy-only profile.",
    },
  ];
}

async function main() {
  await mkdir(join(ROOT, "reports/learning-simulator/engine-professionalization"), { recursive: true });
  const { runDiagnosticEngineV2, fw, pe } = await loadEngines();
  const t0 = Date.now();
  const startMs = t0 - 120 * 86400000;
  const endMs = t0 + 86400000;

  const list = scenarios();
  /** @type {object[]} */
  const results = [];

  for (const sc of list) {
    const prof = runPipeline(sc, runDiagnosticEngineV2, fw, pe, startMs, endMs);
    let pass = false;
    let err = null;
    try {
      pass = !!sc.assert(prof);
    } catch (e) {
      err = String(e?.message || e);
    }
    results.push({
      scenario: sc.label,
      pass: pass && !err,
      expected: sc.expectSummary,
      actual: {
        engineConfidence: prof?.engineConfidence,
        engineReadiness: prof?.engineReadiness,
        reliabilityGuessing: prof?.reliability?.guessingLikelihood,
        reliabilityInconsistency: prof?.reliability?.inconsistencyLevel,
        crossSubjectPatternCount: prof?.crossSubjectPatterns?.patterns?.length ?? 0,
        dependencyItems: prof?.dependencies?.items?.length ?? 0,
        masteryBandsSample: (prof?.mastery?.items || []).slice(0, 4).map((m) => `${m.subjectId}/${m.skillId}:${m.masteryBand}`),
      },
      error: err,
    });
  }

  const allPass = results.every((r) => r.pass);
  const payload = {
    status: allPass ? "PASS" : "FAIL",
    generatedAt: new Date().toISOString(),
    scenarioCount: results.length,
    scenarioList: results.map((r) => r.scenario),
    scenarios: results,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  let md = `# Professional engine validation\n\n- **Overall:** ${payload.status}\n- **Scenarios:** ${payload.scenarioCount}\n\n`;
  for (const r of results) {
    md += `## ${r.scenario}\n\n- **Result:** ${r.pass ? "PASS" : "FAIL"}\n- **Expected:** ${r.expected}\n- **Snapshot:** \`\`\`json\n${JSON.stringify(r.actual, null, 2)}\n\`\`\`\n\n`;
  }
  await writeFile(OUT_MD, md, "utf8");

  console.log(payload.status === "PASS" ? "PASS: professional-engine validation" : "FAIL: professional-engine validation");
  if (!allPass) {
    console.error("Failures:", results.filter((r) => !r.pass).map((r) => r.scenario));
  }
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
