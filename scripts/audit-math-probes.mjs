/**
 * Phase 19 — Math diagnostic probe harness (audit-only).
 * Forces pendingProbe paths in utils/math-question-generator.js; does not modify generator code or stems.
 *
 * Run: npx tsx scripts/audit-math-probes.mjs
 *    or: npm run audit:math-probes
 * (Use `tsx` like other repo audits; plain `node` may fail on extensionless imports in `utils/`.)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "reports", "math-probe-audit");

const { generateQuestion } = await import(
  pathToFileURL(path.join(ROOT, "utils", "math-question-generator.js")).href
);
const { getLevelConfig } = await import(
  pathToFileURL(path.join(ROOT, "utils", "math-storage.js")).href
);

function buildHarnessProbe({
  topicId,
  suggestedQuestionType,
  gradeKey,
  levelKey,
  diagnosticSkillId = null,
}) {
  return {
    subjectId: "math",
    topicId,
    diagnosticSkillId,
    suggestedQuestionType,
    reasonHe: "audit_math_probe_harness",
    sourceHypothesisId: "audit_math_probe_harness",
    expiresAfterQuestions: 1,
    createdAt: Date.now(),
    priority: 1,
    dominantTag: null,
    probeAttemptIds: [],
    gradeKey,
    levelKey,
    patternFamily: null,
    conceptTag: null,
  };
}

function hasNaNDeep(value, seen = new Set()) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isNaN(value);
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((v) => hasNaNDeep(v, seen));
  }
  return Object.values(value).some((v) => hasNaNDeep(v, seen));
}

function validateQuestionShape(q, expectMcqOptions) {
  const issues = [];
  const text = String(q.question ?? q.exerciseText ?? "").trim();
  if (!text) issues.push("missing_question_text");

  const ca = q.correctAnswer;
  if (ca === undefined || ca === null) issues.push("missing_correctAnswer");
  else if (typeof ca === "number" && Number.isNaN(ca)) issues.push("correctAnswer_NaN");

  const answers = q.answers;
  if (expectMcqOptions) {
    if (!Array.isArray(answers) || answers.length < 2) {
      issues.push("mcq_requires_answers_len>=2");
    } else {
      answers.forEach((a, i) => {
        if (typeof a === "number" && Number.isNaN(a)) issues.push(`answers[${i}]_NaN`);
      });
    }
  }

  if (hasNaNDeep(q.params)) issues.push("params_contains_NaN_cycle");
  return issues;
}

/** Grade number from g3 -> 3 */
function gradeNum(gk) {
  const n = parseInt(String(gk).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 3;
}

/**
 * Each entry: expectedKind, operation, gradeKey, levelKey, suggestedQuestionType,
 * diagnosticSkillId?, expectMcqOptions?
 */
const PROBE_CASES = [
  {
    id: "frac_lcd",
    expectedKind: "frac_probe_common_denominator_only",
    operation: "fractions",
    gradeKey: "g5",
    levelKey: "easy",
    suggestedQuestionType: "fraction_common_denominator_only",
    diagnosticSkillId: "math_frac_common_denominator",
    expectMcqOptions: true,
  },
  {
    id: "frac_gate",
    expectedKind: "math_probe_fraction_operation_gate",
    operation: "fractions",
    gradeKey: "g5",
    levelKey: "easy",
    suggestedQuestionType: "fraction_operation_gate",
    diagnosticSkillId: "math_frac_operation_gate",
    expectMcqOptions: true,
  },
  {
    id: "place_value",
    expectedKind: "math_probe_place_value",
    operation: "number_sense",
    gradeKey: "g3",
    levelKey: "easy",
    suggestedQuestionType: "place_value_digit_value",
    diagnosticSkillId: "math_place_value_digit",
    expectMcqOptions: true,
  },
  {
    id: "times_fact",
    expectedKind: "math_probe_times_fact",
    operation: "multiplication",
    gradeKey: "g3",
    levelKey: "easy",
    suggestedQuestionType: "multiplication_fact_check",
    diagnosticSkillId: "math_times_fact",
    expectMcqOptions: true,
  },
  {
    id: "wp_operation",
    expectedKind: "math_probe_operation_word_choice",
    operation: "word_problems",
    gradeKey: "g3",
    levelKey: "easy",
    suggestedQuestionType: "operation_choice_word_problem",
    diagnosticSkillId: "math_operation_choice_wp",
    expectMcqOptions: true,
  },
];

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  let allPass = true;

  for (const c of PROBE_CASES) {
    const gNum = gradeNum(c.gradeKey);
    const lc = getLevelConfig(gNum, c.levelKey);
    const pendingProbe = buildHarnessProbe({
      topicId: c.operation,
      suggestedQuestionType: c.suggestedQuestionType,
      gradeKey: c.gradeKey,
      levelKey: c.levelKey,
      diagnosticSkillId: c.diagnosticSkillId,
    });
    const probeMetaHolder = { current: null };

    let q = null;
    let error = null;
    try {
      q = generateQuestion(lc, c.operation, c.gradeKey, null, {
        pendingProbe,
        probeMetaHolder,
      });
    } catch (e) {
      error = String(e?.message || e);
      allPass = false;
    }

    const kindOk = q && q.params?.kind === c.expectedKind;
    const shapeIssues = q ? validateQuestionShape(q, c.expectMcqOptions) : ["no_question"];
    const pass =
      !error &&
      kindOk &&
      shapeIssues.length === 0 &&
      !!probeMetaHolder.current?.probeReason;

    if (!pass) allPass = false;

    results.push({
      id: c.id,
      expectedKind: c.expectedKind,
      operation: c.operation,
      gradeKey: c.gradeKey,
      levelKey: c.levelKey,
      actualKind: q?.params?.kind ?? null,
      kindMatch: !!kindOk,
      probeReason: probeMetaHolder.current?.probeReason ?? null,
      shapeIssues,
      error,
      pass,
      topicMatch: q?.operation === c.operation,
      hasCorrectAnswer: q?.correctAnswer !== undefined && q?.correctAnswer !== null,
      answersLen: Array.isArray(q?.answers) ? q.answers.length : 0,
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    script: "scripts/audit-math-probes.mjs",
    overallPass: allPass,
    probes: results,
  };

  const jsonPath = path.join(OUT_DIR, "summary.json");
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), "utf8");

  const mdLines = [
    "# Math probe audit (Phase 19)",
    "",
    `**Generated:** ${summary.generatedAt}`,
    "",
    `**Overall:** ${allPass ? "PASS" : "FAIL"}`,
    "",
    "| Probe id | Expected kind | Pass | Actual kind | Issues |",
    "|----------|---------------|------|-------------|--------|",
  ];
  for (const r of results) {
    const iss = r.shapeIssues.length ? r.shapeIssues.join("; ") : "—";
    mdLines.push(
      `| ${r.id} | \`${r.expectedKind}\` | **${r.pass ? "PASS" : "FAIL"}** | \`${r.actualKind ?? ""}\` | ${iss} |`,
    );
  }
  mdLines.push(
    "",
    "## Machine-readable output",
    "",
    "Full results: `reports/math-probe-audit/summary.json`.",
    "",
  );

  fs.writeFileSync(path.join(OUT_DIR, "summary.md"), mdLines.join("\n"), "utf8");

  console.log(`Wrote ${jsonPath}`);
  console.log(`Overall: ${allPass ? "PASS" : "FAIL"}`);
  for (const r of results) {
    console.log(`  ${r.id}: ${r.pass ? "PASS" : "FAIL"} kind=${r.actualKind}`);
  }

  process.exit(allPass ? 0 : 1);
}

run();
