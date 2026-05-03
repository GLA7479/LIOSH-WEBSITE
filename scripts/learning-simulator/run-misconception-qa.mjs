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
  if (!["very_low", "low"].includes(thin.confidence)) {
    throw new Error("unknown wrong answer should stay low-confidence (no strong misconception claim)");
  }

  const tagged = inferMisconceptionFromWrongAnswer({
    subjectId: "math",
    mistakeEvent: {
      isCorrect: false,
      expectedErrorTags: ["denominator_confusion"],
      userAnswer: 1,
      correctAnswer: 2,
    },
  });
  if (tagged.errorType !== "denominator_confusion") throw new Error("expected tag routing (math)");

  const tagHe = inferMisconceptionFromWrongAnswer({
    subjectId: "hebrew",
    mistakeEvent: {
      isCorrect: false,
      expectedErrorTags: ["weak_inference"],
      userAnswer: "x",
      correctAnswer: "y",
    },
  });
  if (tagHe.errorType !== "weak_inference") throw new Error("expected tag routing (hebrew)");

  const tagEn = inferMisconceptionFromWrongAnswer({
    subjectId: "english",
    mistakeEvent: {
      isCorrect: false,
      expectedErrorTags: ["grammar_pattern_error"],
      userAnswer: "a",
      correctAnswer: "b",
    },
  });
  if (tagEn.errorType !== "grammar_pattern_error") throw new Error("expected tag routing (english)");

  let crashed = false;
  try {
    inferMisconceptionFromWrongAnswer({ subjectId: "science", mistakeEvent: null });
  } catch {
    crashed = true;
  }
  if (crashed) throw new Error("should not throw on thin event");

  const repeated = aggregateMisconceptionsForSubject("math", [
    { isCorrect: false, expectedErrorTags: ["denominator_confusion"] },
    { isCorrect: false, expectedErrorTags: ["denominator_confusion"] },
    { isCorrect: false, expectedErrorTags: ["denominator_confusion"] },
  ]);
  if (!repeated.items.some((it) => it.confidence === "medium" || it.confidence === "high")) {
    throw new Error("repeated same tagged error should elevate confidence");
  }

  const mixedTypes = aggregateMisconceptionsForSubject("math", [
    { isCorrect: false, expectedErrorTags: ["denominator_confusion"] },
    { isCorrect: false, expectedErrorTags: ["denominator_confusion"] },
    { isCorrect: false, expectedErrorTags: ["denominator_confusion"] },
    { isCorrect: false, expectedErrorTags: ["denominator_confusion"] },
    { isCorrect: false, expectedErrorTags: ["denominator_confusion"] },
    { isCorrect: false, expectedErrorTags: ["denominator_confusion"] },
    { isCorrect: false, expectedErrorTags: ["calculation_error"] },
    { isCorrect: false, expectedErrorTags: ["conceptual_misunderstanding"] },
    { isCorrect: false, expectedErrorTags: ["operation_selection_error"] },
    { isCorrect: false, expectedErrorTags: ["place_value_error"] },
    { isCorrect: false, expectedErrorTags: ["skipped_step"] },
  ]);
  if (Object.keys(mixedTypes.typeHistogram).length <= 4) throw new Error("expected diverse error mix");
  const denomItems = mixedTypes.items.filter((it) => it.errorType === "denominator_confusion");
  if (!denomItems.length || !denomItems.every((it) => it.confidence === "medium")) {
    throw new Error("mixed-error histogram should cap denominator_confusion at medium (not high)");
  }

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
    checks: [
      "thin_evidence",
      "tag_routing_math_hebrew_english",
      "no_crash",
      "repeat_elevates_confidence",
      "mixed_types_cap_high_confidence",
      "no_clinical_leak",
    ],
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
