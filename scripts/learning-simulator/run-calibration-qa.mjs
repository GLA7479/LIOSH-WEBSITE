#!/usr/bin/env node
/** npm run qa:learning-simulator:calibration */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "calibration-engine-summary.json");
const OUT_MD = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "calibration-engine-summary.md");

const SEP = "\u0001";

async function main() {
  await mkdir(join(ROOT, "reports", "learning-simulator", "engine-professionalization"), { recursive: true });
  const { buildCalibrationV1 } = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/calibration-engine-v1.js")).href);

  const mapsEasyOnly = {
    math: {
      a: { questions: 10, accuracy: 95, difficultyTier: "easy" },
      b: { questions: 12, accuracy: 92, difficultyTier: "easy" },
    },
  };
  const summaryEasy = {
    mathQuestions: 22,
    mathAccuracy: 93,
    totalQuestions: 22,
  };
  const easyCal = buildCalibrationV1(mapsEasyOnly, summaryEasy, "g3");
  const mathEasy = easyCal.subjects.find((s) => s.subjectId === "math");
  if (!mathEasy?.flags?.easyOnlyHighAccuracy) throw new Error("easy-only profile should be flagged");

  const mapsMixed = {
    math: {
      a: { questions: 20, accuracy: 91, difficultyTier: "easy" },
      b: { questions: 18, accuracy: 85, difficultyTier: "hard" },
    },
  };
  const summaryMixed = { mathQuestions: 38, mathAccuracy: 88, totalQuestions: 38 };
  const mixCal = buildCalibrationV1(mapsMixed, summaryMixed, "g3");
  const mathMix = mixCal.subjects.find((s) => s.subjectId === "math");
  if (!mathMix?.flags?.hardQuestionSignal) throw new Error("hard tier rows should set hardQuestionSignal");
  if (mathMix.challengeReadiness === "low") throw new Error("hard success should not leave challenge at low when accuracy holds");

  const mapsGradeMismatch = {
    math: {
      [`addition${SEP}learning${SEP}g3${SEP}easy`]: { questions: 10, accuracy: 80 },
      [`addition${SEP}learning${SEP}g4${SEP}easy`]: { questions: 10, accuracy: 82 },
      [`addition${SEP}learning${SEP}g4${SEP}medium`]: { questions: 8, accuracy: 75 },
    },
  };
  const mm = buildCalibrationV1(mapsGradeMismatch, { mathQuestions: 28, mathAccuracy: 79, totalQuestions: 28 }, "g3");
  const mathG = mm.subjects.find((s) => s.subjectId === "math");
  if (!mathG?.flags?.gradeMismatch) throw new Error("grade-scoped row keys should surface mismatch vs student grade");

  const mapsNoMeta = {
    hebrew: {
      reading: { questions: 20, accuracy: 78 },
    },
  };
  const noMeta = buildCalibrationV1(mapsNoMeta, { hebrewQuestions: 20, hebrewAccuracy: 78, totalQuestions: 20 }, "g3");
  const he = noMeta.subjects.find((s) => s.subjectId === "hebrew");
  if (!he?.flags?.missingDifficultyMetadata) throw new Error("missing difficulty tier metadata should be reported");

  const r = buildCalibrationV1(
    { math: { op: { questions: 10, accuracy: 95, dataSufficiencyLevel: "high" } } },
    { mathQuestions: 10, mathAccuracy: 95, totalQuestions: 10 },
    "g3"
  );
  const math = r.subjects.find((s) => s.subjectId === "math");
  if (!math) throw new Error("math row");

  const summary = {
    status: "PASS",
    generatedAt: new Date().toISOString(),
    checks: [
      "easy_only_flagged",
      "hard_row_challenge_readiness",
      "grade_mismatch",
      "missing_difficulty_metadata",
      "baseline_math_row",
    ],
    samples: { easyOnly: mathEasy, mixed: mathMix, gradeMismatch: mathG, noMeta: he, baseline: math },
  };
  await writeFile(OUT, JSON.stringify(summary, null, 2), "utf8");
  await writeFile(OUT_MD, `# Calibration engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: calibration-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
