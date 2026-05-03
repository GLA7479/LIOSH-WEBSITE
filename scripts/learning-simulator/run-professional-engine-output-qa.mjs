#!/usr/bin/env node
/** npm run qa:learning-simulator:professional-engine-output */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

async function main() {
  await mkdir(join(ROOT, "reports/learning-simulator/engine-professionalization"), { recursive: true });

  const { runDiagnosticEngineV2 } = await import(pathToFileURL(join(ROOT, "utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js")).href);
  const fw = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/diagnostic-framework-v1.js")).href);
  const pe = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/professional-engine-output-v1.js")).href);

  const startMs = Date.now() - 7 * 86400000;
  const endMs = Date.now();

  const maps = {
    math: {
      fractions: {
        questions: 15,
        correct: 10,
        wrong: 5,
        accuracy: 66,
        needsPractice: true,
        displayName: "fractions",
        behaviorProfile: { dominantType: "knowledge_gap" },
      },
    },
    hebrew: {},
    english: {},
    science: {},
    geometry: {},
    "moledet-geography": {},
  };

  const rawMistakesBySubject = {
    math: [
      {
        isCorrect: false,
        operation: "fractions",
        correctAnswer: "1/2",
        userAnswer: "1/3",
        timestamp: Date.now() - 10000,
        responseMs: 4000,
      },
    ],
    hebrew: [],
    english: [],
    science: [],
    geometry: [],
    "moledet-geography": [],
  };

  const summaryCounts = {
    mathQuestions: 15,
    hebrewQuestions: 0,
    englishQuestions: 0,
    scienceQuestions: 0,
    geometryQuestions: 0,
    moledetGeographyQuestions: 0,
    mathAccuracy: 66,
    totalQuestions: 15,
  };

  let diagnosticEngineV2 = runDiagnosticEngineV2({
    maps,
    rawMistakesBySubject,
    startMs,
    endMs,
  });

  fw.enrichDiagnosticEngineV2WithProfessionalFrameworkV1(diagnosticEngineV2, maps, summaryCounts);
  pe.enrichDiagnosticEngineV2WithProfessionalEngineV1(diagnosticEngineV2, maps, summaryCounts, {
    rawMistakesBySubject,
    startMs,
    endMs,
    studentGradeKey: null,
  });

  const p = diagnosticEngineV2.professionalEngineV1;
  if (!p || p.version !== pe.PROFESSIONAL_ENGINE_OUTPUT_V1) throw new Error("version");
  if (!p.mastery?.items) throw new Error("mastery");
  if (!p.misconceptions?.math) throw new Error("misconceptions");
  if (!Array.isArray(p.globalDoNotConclude) || p.globalDoNotConclude.length < 1) throw new Error("globalDoNotConclude");

  const blob = JSON.stringify(p).toLowerCase();
  const banned = ["dyslexia", "dyscalculia", "adhd", "clinical diagnosis"];
  for (const b of banned) {
    if (blob.includes(b)) throw new Error(`banned phrase: ${b}`);
  }

  await writeFile(
    join(ROOT, "reports/learning-simulator/engine-professionalization/professional-engine-output-selftest.json"),
    JSON.stringify({ status: "PASS", keys: Object.keys(p) }, null, 2),
    "utf8"
  );
  console.log("PASS: professional-engine-output QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
