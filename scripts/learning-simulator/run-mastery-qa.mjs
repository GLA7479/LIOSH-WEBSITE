#!/usr/bin/env node
/** npm run qa:learning-simulator:mastery */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "mastery-engine-summary.json");
const OUT_MD = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "mastery-engine-summary.md");

const SEP = "\u0001";

async function main() {
  await mkdir(join(ROOT, "reports", "learning-simulator", "engine-professionalization"), { recursive: true });
  const { computeMasteryRollupV1 } = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/mastery-engine-v1.js")).href);

  const mapsThin = {
    math: {
      [`fractions${SEP}learning${SEP}g3${SEP}easy`]: {
        questions: 3,
        correct: 2,
        accuracy: 66,
        wrong: 1,
        lastSessionMs: Date.now(),
        difficultyTier: "easy",
      },
    },
  };
  const rThin = computeMasteryRollupV1(mapsThin, { mathQuestions: 3, totalQuestions: 3 });
  const mThin = rThin.items.find((x) => x.skillId === "fractions");
  if (!mThin || mThin.masteryBand === "mastered") throw new Error("thin data must not yield mastered");

  const mapsEasyOnly = {
    math: {
      [`addition${SEP}learning${SEP}g3${SEP}easy`]: {
        questions: 30,
        correct: 29,
        accuracy: 97,
        wrong: 1,
        lastSessionMs: Date.now(),
        difficultyTier: "easy",
      },
      [`subtraction${SEP}learning${SEP}g3${SEP}easy`]: {
        questions: 28,
        correct: 27,
        accuracy: 96,
        wrong: 1,
        lastSessionMs: Date.now(),
        difficultyTier: "easy",
      },
    },
  };
  const rEasy = computeMasteryRollupV1(mapsEasyOnly, { mathQuestions: 58, totalQuestions: 58 });
  const arith = rEasy.items.find((x) => x.skillId === "arithmetic_operations");
  if (!arith || arith.masteryBand === "mastered") throw new Error("easy-only high accuracy must not reach mastered");

  const mapsTiered = {
    math: {
      [`fractions${SEP}learning${SEP}g3${SEP}easy`]: {
        questions: 30,
        correct: 28,
        accuracy: 93,
        wrong: 2,
        lastSessionMs: Date.now(),
        difficultyTier: "easy",
      },
      [`fractions${SEP}learning${SEP}g3${SEP}hard`]: {
        questions: 25,
        correct: 22,
        accuracy: 88,
        wrong: 3,
        lastSessionMs: Date.now(),
        difficultyTier: "hard",
      },
    },
  };
  const rTier = computeMasteryRollupV1(mapsTiered, { mathQuestions: 55, totalQuestions: 55 });
  const fr = rTier.items.find((x) => x.skillId === "fractions");
  if (!fr || !["near_mastery", "mastered"].includes(fr.masteryBand)) {
    throw new Error("easy+hard volume should allow upper mastery bands when accuracy holds");
  }

  const staleMs = Date.now() - 90 * 86400000;
  const mapsStale = {
    math: {
      [`addition${SEP}learning${SEP}g3${SEP}easy`]: {
        questions: 40,
        correct: 38,
        accuracy: 95,
        wrong: 2,
        lastSessionMs: staleMs,
        difficultyTier: "easy",
      },
      [`subtraction${SEP}learning${SEP}g3${SEP}medium`]: {
        questions: 35,
        correct: 32,
        accuracy: 91,
        wrong: 3,
        lastSessionMs: staleMs,
        difficultyTier: "medium",
      },
    },
  };
  const rStale = computeMasteryRollupV1(mapsStale, { mathQuestions: 75, totalQuestions: 75 });
  const arStale = rStale.items.find((x) => x.skillId === "arithmetic_operations");
  if (!arStale || arStale.masteryBand !== "retention_risk") throw new Error("stale lastPractice should flag retention risk");

  const mapsMisc = {
    math: {
      [`fractions${SEP}learning${SEP}g3${SEP}easy`]: {
        questions: 40,
        correct: 38,
        accuracy: 95,
        wrong: 2,
        lastSessionMs: Date.now(),
        difficultyTier: "easy",
      },
      [`fractions${SEP}learning${SEP}g3${SEP}medium`]: {
        questions: 35,
        correct: 33,
        accuracy: 94,
        wrong: 2,
        lastSessionMs: Date.now(),
        difficultyTier: "medium",
      },
    },
  };
  const rMisc = computeMasteryRollupV1(mapsMisc, { mathQuestions: 75, totalQuestions: 75 }, {
    misconceptionErrorCountsBySubjectSkill: { math: { fractions: 7 } },
  });
  const frMisc = rMisc.items.find((x) => x.skillId === "fractions");
  if (!frMisc || !["developing", "emerging"].includes(frMisc.masteryBand)) {
    throw new Error("heavy misconception count should block mastered/near_mastery");
  }

  const mapsInconsistent = {
    math: {
      [`addition${SEP}learning${SEP}g3${SEP}easy`]: {
        questions: 20,
        correct: 18,
        accuracy: 90,
        wrong: 2,
        lastSessionMs: Date.now(),
        difficultyTier: "easy",
        trend: { accuracyDirection: "up" },
      },
      [`subtraction${SEP}learning${SEP}g3${SEP}easy`]: {
        questions: 20,
        correct: 14,
        accuracy: 70,
        wrong: 6,
        lastSessionMs: Date.now(),
        difficultyTier: "easy",
        trend: { accuracyDirection: "down" },
      },
    },
  };
  const rInc = computeMasteryRollupV1(mapsInconsistent, { mathQuestions: 40, totalQuestions: 40 });
  const arInc = rInc.items.find((x) => x.skillId === "arithmetic_operations");
  if (!arInc || arInc.confidence !== "medium") throw new Error("conflicting row trends should reduce mastery confidence");

  const mapsBig = {
    math: {
      [`addition${SEP}learning${SEP}g3${SEP}easy`]: {
        questions: 45,
        correct: 44,
        accuracy: 98,
        wrong: 1,
        lastSessionMs: Date.now(),
        difficultyTier: "easy",
      },
      [`subtraction${SEP}learning${SEP}g3${SEP}medium`]: {
        questions: 40,
        correct: 38,
        accuracy: 95,
        wrong: 2,
        lastSessionMs: Date.now(),
        difficultyTier: "medium",
      },
    },
  };
  const r2 = computeMasteryRollupV1(mapsBig, { mathQuestions: 85, totalQuestions: 85 });
  if (!r2.items.some((x) => x.masteryBand === "near_mastery" || x.masteryBand === "mastered")) {
    throw new Error("high volume strong accuracy across tiers should reach upper bands");
  }

  await writeFile(
    OUT,
    JSON.stringify(
      {
        status: "PASS",
        generatedAt: new Date().toISOString(),
        checks: [
          "thin_no_master",
          "easy_only_caps_band",
          "hard_row_enables_upper_band",
          "retention_risk_stale",
          "misconception_count_penalty",
          "inconsistent_trend_confidence",
          "high_volume_strong",
        ],
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(OUT_MD, `# Mastery engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: mastery-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
