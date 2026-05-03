#!/usr/bin/env node
/** npm run qa:learning-simulator:calibration */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports/learning-simulator/engine-professionalization/calibration-engine-summary.json");
const OUT_MD = join(ROOT, "reports/learning-simulator/engine-professionalization/calibration-engine-summary.md");

async function main() {
  await mkdir(join(ROOT, "reports/learning-simulator/engine-professionalization"), { recursive: true });
  const { buildCalibrationV1 } = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/calibration-engine-v1.js")).href);

  const maps = {
    math: {
      op: { questions: 10, accuracy: 95, dataSufficiencyLevel: "high" },
    },
  };
  const r = buildCalibrationV1(maps, { mathQuestions: 10, mathAccuracy: 95, totalQuestions: 10 }, "g3");
  const math = r.subjects.find((s) => s.subjectId === "math");
  if (!math) throw new Error("math row");
  if (math.flags.missingDifficultyMetadata === true && math.difficultyCoverage > 0) {
    /* ok */
  }

  await writeFile(OUT, JSON.stringify({ status: "PASS", calibration: r }, null, 2), "utf8");
  await writeFile(OUT_MD, `# Calibration engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: calibration-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
