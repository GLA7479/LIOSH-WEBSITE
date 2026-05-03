#!/usr/bin/env node
/**
 * Full professional engine validation scenarios (synthetic).
 * npm run qa:learning-simulator:professional-engine
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_JSON = join(ROOT, "reports/learning-simulator/engine-professionalization/professional-engine-validation.json");
const OUT_MD = join(ROOT, "reports/learning-simulator/engine-professionalization/professional-engine-validation.md");

async function loadEngines() {
  const runDiagnosticEngineV2 = (await import(pathToFileURL(join(ROOT, "utils/diagnostic-engine-v2/run-diagnostic-engine-v2.js")).href))
    .runDiagnosticEngineV2;
  const fw = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/diagnostic-framework-v1.js")).href);
  const pe = await import(pathToFileURL(join(ROOT, "utils/learning-diagnostics/professional-engine-output-v1.js")).href);
  return { runDiagnosticEngineV2, fw, pe };
}

function scenarioThinMathStrongAll() {
  const maps = {
    math: {
      addition: { questions: 4, correct: 4, wrong: 0, accuracy: 100, needsPractice: false, displayName: "addition" },
    },
    hebrew: {},
    english: {},
    science: {},
    geometry: {},
    "moledet-geography": {},
  };
  const raw = { math: [], hebrew: [], english: [], science: [], geometry: [], "moledet-geography": [] };
  const summaryCounts = {
    mathQuestions: 4,
    hebrewQuestions: 0,
    englishQuestions: 0,
    scienceQuestions: 0,
    geometryQuestions: 0,
    moledetGeographyQuestions: 0,
    mathAccuracy: 100,
    totalQuestions: 4,
  };
  return { maps, rawMistakesBySubject: raw, summaryCounts, label: "thin_data_math" };
}

function scenarioWeakFractions() {
  const maps = {
    math: {
      fractions: {
        questions: 24,
        correct: 8,
        wrong: 16,
        accuracy: 33,
        needsPractice: true,
        displayName: "fractions",
      },
    },
    hebrew: {},
    english: {},
    science: {},
    geometry: {},
    "moledet-geography": {},
  };
  const raw = {
    math: Array.from({ length: 10 }).map(() => ({
      isCorrect: false,
      operation: "fractions",
      correctAnswer: 1,
      userAnswer: 2,
      timestamp: Date.now() - 5000,
      responseMs: 5000,
    })),
    hebrew: [],
    english: [],
    science: [],
    geometry: [],
    "moledet-geography": [],
  };
  const summaryCounts = {
    mathQuestions: 24,
    hebrewQuestions: 0,
    englishQuestions: 0,
    scienceQuestions: 0,
    geometryQuestions: 0,
    moledetGeographyQuestions: 0,
    mathAccuracy: 33,
    totalQuestions: 24,
  };
  return { maps, rawMistakesBySubject: raw, summaryCounts, label: "weak_math_fractions" };
}

async function main() {
  await mkdir(join(ROOT, "reports/learning-simulator/engine-professionalization"), { recursive: true });
  const { runDiagnosticEngineV2, fw, pe } = await loadEngines();
  const startMs = Date.now() - 14 * 86400000;
  const endMs = Date.now();

  const scenarios = [scenarioThinMathStrongAll(), scenarioWeakFractions()];
  const results = [];

  for (const sc of scenarios) {
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
      studentGradeKey: null,
    });

    const prof = engine.professionalEngineV1;
    const thinOk =
      sc.label === "thin_data_math"
        ? prof.engineReadiness === "needs_more_data" || prof.engineConfidence !== "high"
        : true;
    const noStrongThin =
      sc.label === "thin_data_math" ? !prof.mastery?.items?.some((x) => x.masteryBand === "mastered") : true;

    results.push({
      scenario: sc.label,
      pass: !!(prof && thinOk && noStrongThin),
      engineConfidence: prof.engineConfidence,
      engineReadiness: prof.engineReadiness,
    });
  }

  const allPass = results.every((r) => r.pass);
  const payload = {
    status: allPass ? "PASS" : "FAIL",
    generatedAt: new Date().toISOString(),
    scenarios: results,
  };
  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(
    OUT_MD,
    `# Professional engine validation\n\n- **Overall:** ${payload.status}\n\n${results.map((r) => `- ${r.scenario}: ${r.pass ? "PASS" : "FAIL"}`).join("\n")}\n`,
    "utf8"
  );
  console.log(payload.status === "PASS" ? "PASS: professional-engine validation" : "FAIL: professional-engine validation");
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
