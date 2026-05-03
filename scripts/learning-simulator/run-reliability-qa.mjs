#!/usr/bin/env node
/** npm run qa:learning-simulator:reliability */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "reliability-engine-summary.json");
const OUT_MD = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "reliability-engine-summary.md");

async function main() {
  await mkdir(join(ROOT, "reports", "learning-simulator", "engine-professionalization"), { recursive: true });
  const { assessReliabilityV1 } = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/reliability-engine-v1.js")).href);

  const now = Date.now();
  const startMs = now - 86400000;
  const endMs = now;

  const mapsFastWrong = { math: { a: { questions: 5 } } };
  const rawFast = {
    math: [
      { isCorrect: false, responseMs: 2000, timestamp: now - 1000, topic: "x", operation: "addition" },
      { isCorrect: false, responseMs: 1500, timestamp: now - 2000, topic: "x", operation: "addition" },
    ],
  };
  const rFast = assessReliabilityV1(mapsFastWrong, rawFast, startMs, endMs);
  if (rFast.guessingLikelihood <= 0) throw new Error("expected fast wrong signal");

  const mapsSpread = {
    math: {
      a: { questions: 10, accuracy: 40 },
      b: { questions: 10, accuracy: 88 },
      c: { questions: 10, accuracy: 92 },
    },
  };
  const rSpread = assessReliabilityV1(mapsSpread, { math: [] }, startMs, endMs);
  if (rSpread.inconsistencyLevel === "low") throw new Error("wide accuracy spread should raise inconsistency");

  const mapsThin = { math: { x: { questions: 4, accuracy: 70 } } };
  const rThin = assessReliabilityV1(mapsThin, { math: [] }, startMs, endMs);
  if (rThin.dataTrustLevel !== "very_low" && rThin.dataTrustLevel !== "low") {
    throw new Error("thin volume should lower data trust");
  }
  if (rThin.confidenceAdjustment >= 0) throw new Error("thin data should apply negative confidence adjustment");

  const mapsVol = {
    math: { a: { questions: 50, accuracy: 82 }, b: { questions: 45, accuracy: 84 } },
    hebrew: { c: { questions: 40, accuracy: 80 } },
  };
  const rVol = assessReliabilityV1(mapsVol, { math: [], hebrew: [] }, startMs, endMs);
  if (rVol.reliabilityScore < 65) throw new Error("high question volume should lift reliability score");

  const rawSlow = {
    math: [
      { isCorrect: true, responseMs: 52000, timestamp: now - 3000, topic: "x", operation: "addition" },
      { isCorrect: true, responseMs: 48000, timestamp: now - 4000, topic: "x", operation: "addition" },
    ],
  };
  const rSlow = assessReliabilityV1({ math: { a: { questions: 10 } } }, rawSlow, startMs, endMs);
  if (rSlow.guessingLikelihood > 0.15) throw new Error("slow correct work should not be read as high guessing");

  const clin = JSON.stringify(rFast).toLowerCase();
  if (clin.includes("dyslexia") || clin.includes("adhd")) throw new Error("clinical leak");

  const summary = {
    status: "PASS",
    generatedAt: new Date().toISOString(),
    checks: ["fast_wrong_guessing", "spread_inconsistency", "thin_trust_penalty", "volume_lift", "slow_correct_not_guessing", "no_clinical"],
    samples: { rFast, rSpread, rThin, rVol, rSlow },
  };
  await writeFile(OUT, JSON.stringify(summary, null, 2), "utf8");
  await writeFile(OUT_MD, `# Reliability engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: reliability-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
