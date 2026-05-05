#!/usr/bin/env node
/**
 * Phase 2 — aggregate learning simulator: scenario → storage-shaped snapshots (no parent reports).
 * npm run qa:learning-simulator:aggregate
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { buildStorageForScenario } from "./lib/aggregate-runner.mjs";
import { expandScenarios, defaultScenarioClone } from "../lib/overnight-soak-expand.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const MATRIX_PATH = join(ROOT, "reports", "learning-simulator", "coverage-matrix.json");
const OUT_DIR = join(ROOT, "reports", "learning-simulator", "aggregate");
const PER_STUDENT = join(OUT_DIR, "per-student");
const OUT_JSON = join(OUT_DIR, "run-summary.json");
const OUT_MD = join(OUT_DIR, "run-summary.md");

async function loadFixtures() {
  const profilesUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "profiles", "base-profiles.mjs")).href;
  const scenariosUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "quick-scenarios.mjs")).href;

  const profilesMod = await import(profilesUrl);
  const scenariosMod = await import(scenariosUrl);

  const BASE_PROFILES = profilesMod.BASE_PROFILES || profilesMod.default;
  const QUICK_SCENARIOS = scenariosMod.QUICK_SCENARIOS || scenariosMod.default;

  return { BASE_PROFILES, QUICK_SCENARIOS };
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

function buildMarkdown(payload) {
  const lines = [
    "# Learning simulator aggregate run",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Scenarios processed: ${payload.counts.scenarios}`,
    `- OK (no validation errors): ${payload.counts.okScenarios} / ${payload.counts.scenarios}`,
    "",
    "## Totals",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Total simulated sessions | ${payload.totals.sessions} |`,
    `| Total simulated questions | ${payload.totals.questions} |`,
    `| Total simulated mistake rows | ${payload.totals.mistakes} |`,
    `| Storage artifacts written | ${payload.totals.storageArtifacts} |`,
    "",
    "## Per scenario",
    "",
    "| Scenario | OK | Sessions | Questions | Mistake rows | Errors |",
    "| --- | --- | ---: | ---: | ---: | --- |",
  ];

  for (const row of payload.perScenario) {
    const err = row.errors.length ? mdEscape(row.errors.join("; ")) : "—";
    lines.push(
      `| ${mdEscape(row.scenarioId)} | ${row.ok ? "yes" : "no"} | ${row.sessionCount} | ${row.questionTotal} | ${row.mistakeEventCount} | ${err} |`
    );
  }

  lines.push("");
  if (payload.validationWarnings.length) {
    lines.push("## Warnings", "");
    for (const w of payload.validationWarnings) lines.push(`- ${w}`);
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  let matrixRaw;
  try {
    matrixRaw = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
  } catch (e) {
    console.error(`Missing or invalid ${MATRIX_PATH}. Run npm run qa:learning-simulator:matrix first.`);
    console.error(e);
    process.exit(1);
    return;
  }
  const matrixRows = matrixRaw.rows || [];

  const { BASE_PROFILES, QUICK_SCENARIOS } = await loadFixtures();
  const scenarios = expandScenarios(QUICK_SCENARIOS, defaultScenarioClone);

  await mkdir(PER_STUDENT, { recursive: true });

  /** @type {object[]} */
  const perScenario = [];
  let totalSessions = 0;
  let totalQuestions = 0;
  let totalMistakes = 0;
  let okScenarios = 0;
  const validationWarnings = [];

  for (const scenario of scenarios) {
    const profile = BASE_PROFILES[scenario.profileRef];
    if (!profile) {
      perScenario.push({
        scenarioId: scenario.scenarioId,
        ok: false,
        sessionCount: 0,
        questionTotal: 0,
        mistakeEventCount: 0,
        errors: [`missing profile: ${scenario.profileRef}`],
        warnings: [],
      });
      continue;
    }

    const result = await buildStorageForScenario(scenario, profile, matrixRows);

    const stats = result.stats || {
      scenarioId: scenario.scenarioId,
      sessionCount: 0,
      questionTotal: 0,
      mistakeEventCount: 0,
    };

    if (result.ok) okScenarios += 1;
    totalSessions += stats.sessionCount || 0;
    totalQuestions += stats.questionTotal || 0;
    totalMistakes += stats.mistakeEventCount || 0;

    for (const w of result.warnings || []) {
      validationWarnings.push(`${scenario.scenarioId}: ${w}`);
    }

    const scenarioErrors = [...(result.errors || [])];
    perScenario.push({
      scenarioId: scenario.scenarioId,
      ok: result.ok,
      sessionCount: stats.sessionCount,
      questionTotal: stats.questionTotal,
      correctTotal: stats.correctTotal,
      mistakeEventCount: stats.mistakeEventCount,
      subjectsTouched: stats.subjectsTouched,
      errors: scenarioErrors,
      warnings: result.warnings || [],
    });

    const storagePath = join(PER_STUDENT, `${scenario.scenarioId}.storage.json`);
    const metaPath = join(PER_STUDENT, `${scenario.scenarioId}.meta.json`);

    if (result.storage) {
      await writeFile(storagePath, JSON.stringify(result.storage, null, 2), "utf8");
    } else {
      await writeFile(storagePath, JSON.stringify({ _error: "no storage generated", errors: scenarioErrors }, null, 2), "utf8");
    }

    await writeFile(metaPath, JSON.stringify(result.meta || { scenarioId: scenario.scenarioId, errors: scenarioErrors }, null, 2), "utf8");
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    generator: "run-aggregate-v1",
    matrixRowCount: matrixRows.length,
    counts: {
      scenarios: scenarios.length,
      okScenarios,
      baseQuickScenarios: QUICK_SCENARIOS.length,
    },
    totals: {
      sessions: totalSessions,
      questions: totalQuestions,
      mistakes: totalMistakes,
      storageArtifacts: scenarios.length * 2,
    },
    perScenario,
    validationWarnings,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown(payload), "utf8");

  const failed = okScenarios !== scenarios.length;
  if (failed) {
    console.error(`Aggregate run finished with validation failures: ${scenarios.length - okScenarios} scenario(s).`);
    process.exitCode = 1;
  } else {
    console.log(
      `Aggregate OK: ${scenarios.length} scenarios (${QUICK_SCENARIOS.length} base), ${totalSessions} sessions, ${totalQuestions} questions, ${totalMistakes} mistake rows.`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
