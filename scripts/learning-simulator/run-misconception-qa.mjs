#!/usr/bin/env node
/** npm run qa:learning-simulator:misconceptions */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "misconception-engine-summary.json");
const OUT_MD = join(ROOT, "reports", "learning-simulator", "engine-professionalization", "misconception-engine-summary.md");

async function loadMod(rel) {
  return import(pathToFileURL(join(ROOT, rel)).href);
}

async function main() {
  await mkdir(join(ROOT, "reports", "learning-simulator", "engine-professionalization"), { recursive: true });
  const { inferMisconceptionFromWrongAnswer, aggregateMisconceptionsForSubject } = await loadMod(
    "utils/learning-diagnostics/misconception-engine-v1.js"
  );

  const thin = inferMisconceptionFromWrongAnswer({
    subjectId: "math",
    mistakeEvent: { isCorrect: false, userAnswer: 2, correctAnswer: 3 },
  });
  if (!thin.doNotConclude?.length) throw new Error("misconception: doNotConclude required");

  const tagged = inferMisconceptionFromWrongAnswer({
    subjectId: "math",
    mistakeEvent: {
      isCorrect: false,
      expectedErrorTags: ["denominator_confusion"],
      userAnswer: 1,
      correctAnswer: 2,
    },
  });
  if (tagged.errorType !== "denominator_confusion") throw new Error("expected tag routing");

  let crashed = false;
  try {
    inferMisconceptionFromWrongAnswer({ subjectId: "science", mistakeEvent: null });
  } catch {
    crashed = true;
  }
  if (crashed) throw new Error("should not throw on thin event");

  const agg = aggregateMisconceptionsForSubject("hebrew", [
    { isCorrect: false, expectedErrorTags: ["weak_inference"] },
    { isCorrect: false, expectedErrorTags: ["weak_inference"] },
    { isCorrect: false, expectedErrorTags: ["weak_inference"] },
  ]);
  if (agg.items.length !== 3) throw new Error("aggregate count");

  const bannedPhrases = ["dyslexia", "dyscalculia", "adhd", "learning disability"];
  const text = JSON.stringify(agg);
  const lower = text.toLowerCase();
  for (const b of bannedPhrases) {
    if (lower.includes(b)) throw new Error(`banned phrase: ${b}`);
  }

  const summary = {
    status: "PASS",
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    checks: ["thin_evidence", "tag_routing", "no_crash", "repeat_confidence", "no_clinical_leak"],
  };
  await writeFile(OUT, JSON.stringify(summary, null, 2), "utf8");
  await writeFile(
    OUT_MD,
    `# Misconception engine QA\n\n- **Status:** PASS\n- **Artifact:** ${OUT}\n`,
    "utf8"
  );
  console.log("PASS: misconception-engine QA");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
