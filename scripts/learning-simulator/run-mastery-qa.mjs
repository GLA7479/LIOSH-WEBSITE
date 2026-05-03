#!/usr/bin/env node
/** npm run qa:learning-simulator:mastery */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "mastery-engine-summary.json");
const OUT_MD = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "mastery-engine-summary.md");

async function main() {
  await mkdir(join(ROOT, "reports", "learning-simulator", "engine-professionalization"), { recursive: true });
  const { computeMasteryRollupV1 } = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/mastery-engine-v1.js")).href);

  const maps = {
    math: {
      [`fractions${"\u0001"}learning${"\u0001"}g3${"\u0001"}easy`]: {
        questions: 3,
        correct: 2,
        accuracy: 66,
        wrong: 1,
        lastSessionMs: Date.now(),
      },
    },
  };
  const summaryCounts = { mathQuestions: 3, totalQuestions: 3 };
  const r = computeMasteryRollupV1(maps, summaryCounts);
  const m = r.items[0];
  if (!m || m.masteryBand === "mastered") throw new Error("thin data must not yield mastered");

  const mapsBig = {
    math: {
      [`addition${"\u0001"}learning${"\u0001"}g3${"\u0001"}easy`]: {
        questions: 45,
        correct: 44,
        accuracy: 98,
        wrong: 1,
        lastSessionMs: Date.now(),
      },
    },
  };
  const r2 = computeMasteryRollupV1(mapsBig, { mathQuestions: 45, totalQuestions: 45 });
  if (!r2.items.some((x) => x.masteryBand === "near_mastery" || x.masteryBand === "mastered")) {
    throw new Error("high volume strong accuracy should reach upper bands");
  }

  await writeFile(
    OUT,
    JSON.stringify({ status: "PASS", generatedAt: new Date().toISOString(), sample: r }, null, 2),
    "utf8"
  );
  await writeFile(OUT_MD, `# Mastery engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: mastery-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
