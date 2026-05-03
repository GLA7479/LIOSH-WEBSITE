#!/usr/bin/env node
/** npm run qa:learning-simulator:reliability */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports/learning-simulator/engine-professionalization/reliability-engine-summary.json");
const OUT_MD = join(ROOT, "reports/learning-simulator/engine-professionalization/reliability-engine-summary.md");

async function main() {
  await mkdir(join(ROOT, "reports/learning-simulator/engine-professionalization"), { recursive: true });
  const { assessReliabilityV1 } = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/reliability-engine-v1.js")).href);

  const now = Date.now();
  const startMs = now - 86400000;
  const endMs = now;
  const maps = { math: { a: { questions: 5 } } };
  const raw = {
    math: [
      { isCorrect: false, responseMs: 2000, timestamp: now - 1000, topic: "x", operation: "addition" },
      { isCorrect: false, responseMs: 1500, timestamp: now - 2000, topic: "x", operation: "addition" },
    ],
  };
  const r = assessReliabilityV1(maps, raw, startMs, endMs);
  if (r.guessingLikelihood <= 0) throw new Error("expected fast wrong signal");

  const clin = JSON.stringify(r).toLowerCase();
  if (clin.includes("dyslexia") || clin.includes("adhd")) throw new Error("clinical leak");

  await writeFile(OUT, JSON.stringify({ status: "PASS", reliability: r }, null, 2), "utf8");
  await writeFile(OUT_MD, `# Reliability engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: reliability-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
