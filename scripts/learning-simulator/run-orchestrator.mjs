#!/usr/bin/env node
/**
 * Unified learning-simulator QA orchestrator.
 * Usage: tsx scripts/learning-simulator/run-orchestrator.mjs <quick|full>
 *
 * Env:
 *   LS_CONTINUE_ON_FAIL=1 — run all steps even after a failure (still exits non-zero if any failed).
 */
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "learning-simulator", "orchestrator");
const OUT_JSON = join(OUT_DIR, "run-summary.json");
const OUT_MD = join(OUT_DIR, "run-summary.md");

const ARTIFACTS = {
  coverageMatrix: "reports/learning-simulator/coverage-matrix.json",
  coverageMatrixMd: "reports/learning-simulator/coverage-matrix.md",
  schemaValidation: "reports/learning-simulator/schema-validation.json",
  schemaValidationMd: "reports/learning-simulator/schema-validation.md",
  aggregateSummary: "reports/learning-simulator/aggregate/run-summary.json",
  aggregateSummaryMd: "reports/learning-simulator/aggregate/run-summary.md",
  reportAssertions: "reports/learning-simulator/reports/run-summary.json",
  behaviorSummary: "reports/learning-simulator/behavior/run-summary.json",
  behaviorFailures: "reports/learning-simulator/behavior/failures.json",
  questionIntegrity: "reports/learning-simulator/questions/run-summary.json",
  questionFailures: "reports/learning-simulator/questions/failures.json",
  deepSummary: "reports/learning-simulator/deep/run-summary.json",
  deepFailures: "reports/learning-simulator/deep/failures.json",
};

/** Stages in order for quick gate */
const QUICK_STEPS = [
  { id: "matrix", script: "qa:learning-simulator:matrix", label: "Coverage matrix" },
  { id: "schema", script: "qa:learning-simulator:schema", label: "Schema validation (profiles + scenarios)" },
  { id: "aggregate", script: "qa:learning-simulator:aggregate", label: "Aggregate simulator (quick scenarios)" },
  { id: "reports", script: "qa:learning-simulator:reports", label: "Parent report assertions (Phase 3)" },
  { id: "behavior", script: "qa:learning-simulator:behavior", label: "Behavior checks (Phase 5)" },
  { id: "questions", script: "qa:learning-simulator:questions", label: "Question integrity (Phase 4)" },
];

const FULL_SUFFIX = [
  { id: "deep", script: "qa:learning-simulator:deep", label: "Deep longitudinal simulator" },
  { id: "build", script: "build", label: "Next.js production build" },
  { id: "parentReportPhase1", script: "test:parent-report-phase1", label: "Parent report phase1 selftest" },
  { id: "intelligenceUsage", script: "test:intelligence-layer-v1-usage", label: "Intelligence layer v1 usage selftest" },
];

function runStep(cwd, npmScript) {
  const start = Date.now();
  const r = spawnSync("npm", ["run", npmScript], {
    cwd,
    encoding: "utf8",
    shell: true,
    stdio: "inherit",
  });
  const durationMs = Date.now() - start;
  const exitCode = typeof r.status === "number" ? r.status : 1;
  return { exitCode, durationMs, pass: exitCode === 0 };
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

function nextActionHint(failedStep) {
  if (!failedStep) return "—";
  const id = failedStep.id;
  const hints = {
    matrix: "Ensure curriculum/matrix sources resolve; run from repo root. See coverage-matrix artifacts.",
    schema: "Fix profile/scenario fixtures or matrix refs per schema-validation.json errors.",
    aggregate: "Check scenario/session builders and aggregate per-student artifacts under reports/learning-simulator/aggregate/per-student/.",
    reports: "Inspect reports/learning-simulator/reports/run-summary.json and per-student *.report.json / *.assertions.json.",
    behavior: "Inspect reports/learning-simulator/behavior/failures.json and per-student *.behavior.json.",
    questions: "Inspect reports/learning-simulator/questions/failures.json; fix generators or mark cells unsupported intentionally.",
    deep: "Inspect reports/learning-simulator/deep/failures.json and deep per-student artifacts.",
    build: "Fix TypeScript/lint/build errors reported above.",
    parentReportPhase1: "Fix parent-report phase1 selftest failures (scripts/parent-report-phase1-selftest.mjs).",
    intelligenceUsage: "Fix intelligence-layer usage contract (scripts/intelligence-layer-v1-usage-selftest.mjs).",
  };
  return hints[id] || `Review logs for stage "${id}" and related artifacts under reports/learning-simulator/.`;
}

function buildMarkdown(payload) {
  const lines = [
    "# Learning simulator orchestrator",
    "",
    `- **Mode:** ${payload.mode}`,
    `- **Overall:** ${payload.pass ? "**PASS**" : "**FAIL**"}`,
    `- **Started:** ${payload.startedAt}`,
    `- **Finished:** ${payload.finishedAt}`,
    `- **Total duration:** ${payload.totalDurationMs} ms`,
    "",
    "## Steps",
    "",
    "| # | Stage | Script | Duration (ms) | Result |",
    "| --- | --- | --- | ---: | --- |",
  ];

  let i = 1;
  for (const s of payload.steps) {
    lines.push(
      `| ${i++} | ${mdEscape(s.label)} | \`${mdEscape(s.script)}\` | ${s.durationMs} | ${s.pass ? "PASS" : "FAIL"} |`
    );
  }

  lines.push("", "## Key artifact paths (repo-relative)", "");
  for (const [k, v] of Object.entries(payload.artifactLinks || {})) {
    lines.push(`- **${k}:** \`${mdEscape(v)}\``);
  }

  if (!payload.pass && payload.failedStep) {
    lines.push(
      "",
      "## Failed stage",
      "",
      `- **Stage:** ${mdEscape(payload.failedStep.label)} (\`${mdEscape(payload.failedStep.script)}\`)`,
      "",
      "### Suggested next action",
      "",
      payload.nextAction || "",
      ""
    );
  }

  lines.push(
    "",
    "---",
    "",
    "See `docs/learning-simulator-qa.md` for what each gate proves and current limits.",
    ""
  );

  return lines.join("\n");
}

async function main() {
  const modeArg = (process.argv[2] || "full").toLowerCase();
  const mode = modeArg === "quick" ? "quick" : "full";
  const continueOnFail = process.env.LS_CONTINUE_ON_FAIL === "1";

  let steps = [...QUICK_STEPS];
  if (mode === "full") {
    steps = [...QUICK_STEPS, ...FULL_SUFFIX];
  }

  await mkdir(OUT_DIR, { recursive: true });

  const startedAt = new Date().toISOString();
  const t0All = Date.now();

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Learning simulator orchestrator — mode: ${mode.toUpperCase()}`);
  console.log(`  Steps: ${steps.length}${continueOnFail ? " (continue on failure)" : " (stop on first failure)"}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  /** @type {object[]} */
  const stepResults = [];
  let failedStep = null;

  for (const step of steps) {
    console.log(`▶ ${step.label}`);
    console.log(`  npm run ${step.script}`);
    const { exitCode, durationMs, pass } = runStep(ROOT, step.script);
    const row = {
      id: step.id,
      label: step.label,
      script: step.script,
      exitCode,
      durationMs,
      pass,
    };
    stepResults.push(row);
    console.log(`  → exit ${exitCode}, ${durationMs} ms ${pass ? "✓" : "✗"}`);
    console.log("");

    if (!pass && !failedStep) failedStep = row;

    if (!pass && !continueOnFail) {
      console.error(`Orchestrator: stopping after failure (${step.id}).`);
      break;
    }
  }

  const finishedAt = new Date().toISOString();
  const totalDurationMs = Date.now() - t0All;
  const anyFail = stepResults.some((s) => !s.pass);
  const pass = !anyFail;

  const artifactLinks =
    mode === "full"
      ? {
          ...ARTIFACTS,
          orchestratorSummary: "reports/learning-simulator/orchestrator/run-summary.json",
        }
      : {
          coverageMatrix: ARTIFACTS.coverageMatrix,
          schemaValidation: ARTIFACTS.schemaValidation,
          aggregateSummary: ARTIFACTS.aggregateSummary,
          reportAssertions: ARTIFACTS.reportAssertions,
          behaviorSummary: ARTIFACTS.behaviorSummary,
          questionIntegrity: ARTIFACTS.questionIntegrity,
          orchestratorSummary: "reports/learning-simulator/orchestrator/run-summary.json",
        };

  const payload = {
    mode,
    startedAt,
    finishedAt,
    totalDurationMs,
    pass,
    failedStep: failedStep
      ? { id: failedStep.id, label: failedStep.label, script: failedStep.script, exitCode: failedStep.exitCode }
      : null,
    steps: stepResults,
    artifactLinks,
    nextAction: failedStep ? nextActionHint(failedStep) : null,
    options: { continueOnFail },
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown(payload), "utf8");

  console.log("───────────────────────────────────────────────────────────────");
  console.log(`  Finished: ${pass ? "PASS" : "FAIL"}  |  ${totalDurationMs} ms total`);
  console.log(`  Summary: ${OUT_JSON}`);
  console.log("───────────────────────────────────────────────────────────────");
  console.log("");

  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
