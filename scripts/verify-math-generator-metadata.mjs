#!/usr/bin/env node
/**
 * Verify procedural math metadata attachment + taxonomy validity.
 * npm run qa:math-metadata:verify
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "math-generator-metadata-verification.json");
const OUT_MD = join(OUT_DIR, "math-generator-metadata-verification.md");

function fingerprintStudent(q) {
  return JSON.stringify({
    question: String(q.question ?? ""),
    correctAnswer: q.correctAnswer,
    answers: Array.isArray(q.answers) ? q.answers.map(String) : null,
    exerciseText: q.exerciseText != null ? String(q.exerciseText) : null,
  });
}

async function main() {
  const attachMod = await import(new URL("../utils/math-question-metadata.js", import.meta.url).href);
  const { attachProfessionalMathMetadata } = attachMod;

  const synthetic = {
    question: "2 + 3 = __",
    correctAnswer: 5,
    answers: [4, 5, 6, 7],
    operation: "addition",
    params: { kind: "add_two", a: 2, b: 3 },
  };
  const beforeFp = fingerprintStudent(synthetic);
  const enriched = attachProfessionalMathMetadata(synthetic, {
    selectedOp: "addition",
    gradeKey: "g3",
    mathLevelKey: "medium",
  });
  const attachPreservesStudentFields = beforeFp === fingerprintStudent(enriched);

  const constMod = await import(new URL("../utils/math-constants.js", import.meta.url).href);
  const { GRADES, GRADE_LEVELS } = constMod;
  const genMod = await import(new URL("../utils/math-question-generator.js", import.meta.url).href);
  const { generateQuestion } = genMod;

  const scannerMod = await import(new URL("../utils/question-metadata-qa/question-metadata-scanner.js", import.meta.url).href);
  const { buildScanRecord } = scannerMod;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  let samplesOk = 0;
  const trials = 48;
  const gradeKeys = Object.keys(GRADES).filter((k) => k.startsWith("g"));

  for (let i = 0; i < trials; i++) {
    const gk = gradeKeys[i % gradeKeys.length];
    const gradeCfg = GRADES[gk];
    const ops = gradeCfg.operations || ["addition"];
    const selectedOp = ops[i % ops.length];

    const gradeNum = parseInt(String(gk).replace(/\D/g, ""), 10) || 3;
    const band = i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard";
    const nameHe = band === "easy" ? "קל" : band === "medium" ? "בינוני" : "קשה";
    const gl = GRADE_LEVELS[gradeNum]?.levels?.[band];
    if (!gl) {
      errors.push(`trial ${i}: missing GRADE_LEVELS for ${gradeNum}/${band}`);
      continue;
    }
    const levelConfig = { ...gl, name: nameHe };

    let q;
    try {
      q = generateQuestion(levelConfig, selectedOp, gk, null, null);
    } catch (e) {
      errors.push(`trial ${i}: generateQuestion threw: ${e}`);
      continue;
    }

    let trialOk = true;
    if (!q.subject || q.subject !== "math") {
      errors.push(`trial ${i}: missing subject math`);
      trialOk = false;
    }
    if (!q.skillId || !String(q.skillId).startsWith("math_")) {
      errors.push(`trial ${i}: missing math skillId`);
      trialOk = false;
    }
    if (!q.subskillId) {
      errors.push(`trial ${i}: missing subskillId`);
      trialOk = false;
    }
    if (!q.difficulty) {
      errors.push(`trial ${i}: missing difficulty`);
      trialOk = false;
    }
    if (!q.cognitiveLevel) {
      errors.push(`trial ${i}: missing cognitiveLevel`);
      trialOk = false;
    }
    if (!Array.isArray(q.expectedErrorTypes) || q.expectedErrorTypes.length === 0) {
      errors.push(`trial ${i}: missing expectedErrorTypes`);
      trialOk = false;
    }

    buildScanRecord(
      /** @type {Record<string, unknown>} */ (q),
      "utils/math-question-generator.js",
      `generateQuestion:trial_${i}`,
      "math",
      i
    );

    if (trialOk) samplesOk += 1;
  }

  const ok = errors.length === 0 && attachPreservesStudentFields;

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    ok,
    attachPreservesStudentFields,
    syntheticSkillId: enriched.skillId,
    trials,
    samplesStructurallyValid: samplesOk,
    errors,
    warnings,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  writeFileSync(
    OUT_MD,
    ["# Math generator metadata verification", "", ok ? "**PASS**" : "**FAIL**", "", ...errors.map((e) => `- ${e}`)].join("\n"),
    "utf8"
  );

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Math metadata verify: ${ok ? "PASS" : "FAIL"}`);
  console.log(`  Synthetic attach preserves student fields: ${attachPreservesStudentFields}`);
  console.log(`  Trials structurally valid: ${samplesOk}/${trials}`);
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
