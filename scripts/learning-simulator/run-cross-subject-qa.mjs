#!/usr/bin/env node
/** npm run qa:learning-simulator:cross-subject */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "cross-subject-engine-summary.json");
const OUT_MD = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "cross-subject-engine-summary.md");

async function main() {
  await mkdir(join(ROOT, "reports", "learning-simulator", "engine-professionalization"), { recursive: true });
  const { detectCrossSubjectPatternsV1 } = await import(
    pathToFileURL(join(ROOT, "utils/learning-diagnostics/cross-subject-engine-v1.js")).href
  );

  const maps = {
    math: {
      word_problems: { questions: 12, accuracy: 55, displayName: "word problems" },
    },
  };
  const summaryCounts = {
    mathQuestions: 30,
    hebrewQuestions: 30,
    mathAccuracy: 65,
    hebrewAccuracy: 65,
    totalQuestions: 120,
  };

  const oneSubjectOnly = detectCrossSubjectPatternsV1(
    { math: maps.math },
    { mathQuestions: 30, hebrewQuestions: 0, mathAccuracy: 55, totalQuestions: 30 }
  );
  if (oneSubjectOnly.patterns.length > 0) throw new Error("should not infer cross-subject from one stream alone");

  const r = detectCrossSubjectPatternsV1(maps, summaryCounts);
  if (!r.patterns.length) throw new Error("expected overlap pattern when both subjects have evidence");
  const p0 = r.patterns[0];
  if (!p0.doNotConclude?.length) throw new Error("doNotConclude required");
  if (!p0.nextProbe?.probeType) throw new Error("nextProbe required");

  const thinSummary = {
    mathQuestions: 4,
    hebrewQuestions: 4,
    mathAccuracy: 62,
    hebrewAccuracy: 58,
    totalQuestions: 12,
  };
  const rThin = detectCrossSubjectPatternsV1(maps, thinSummary);
  if (rThin.patterns.length > 0) throw new Error("thin per-subject volume should not emit cross-subject patterns");

  const txt = JSON.stringify(r).toLowerCase();
  if (txt.includes("dyslexia") || txt.includes("disability")) throw new Error("clinical");

  const summary = {
    status: "PASS",
    generatedAt: new Date().toISOString(),
    checks: [
      "one_subject_no_pattern",
      "two_subjects_can_emit_pattern",
      "doNotConclude_and_nextProbe",
      "thin_data_suppresses_patterns",
      "no_clinical",
    ],
    samples: { full: r, thin: rThin },
  };
  await writeFile(OUT, JSON.stringify(summary, null, 2), "utf8");
  await writeFile(OUT_MD, `# Cross-subject engine QA\n\nPASS\n`, "utf8");
  console.log("PASS: cross-subject-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
