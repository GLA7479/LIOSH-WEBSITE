#!/usr/bin/env node
/**
 * Phase 5 — learning / diagnosis behavior checks on aggregate storage + slim reports.
 * npm run qa:learning-simulator:behavior
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { computeBehaviorOracle } from "./lib/behavior-oracle.mjs";
import { evaluateScenarioBehavior, summarizeFailureCauses } from "./lib/behavior-assertion-engine.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const AGG_DIR = join(ROOT, "reports", "learning-simulator", "aggregate", "per-student");
const REPORT_DIR = join(ROOT, "reports", "learning-simulator", "reports", "per-student");
const OUT_DIR = join(ROOT, "reports", "learning-simulator", "behavior");
const PER_STUDENT_OUT = join(OUT_DIR, "per-student");
const OUT_JSON = join(OUT_DIR, "run-summary.json");
const OUT_MD = join(OUT_DIR, "run-summary.md");
const FAILURES_JSON = join(OUT_DIR, "failures.json");

async function loadQuickScenarios() {
  const scenariosUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "quick-scenarios.mjs")).href;
  const scenariosMod = await import(scenariosUrl);
  return scenariosMod.QUICK_SCENARIOS || scenariosMod.default;
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

function buildMarkdown(payload) {
  const lines = [
    "# Learning simulator — behavior checks (Phase 5)",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Generator: ${payload.generator}`,
    `- Scenarios: ${payload.counts.scenarios}`,
    `- Scenarios passed: ${payload.counts.scenariosPassed} / ${payload.counts.scenarios}`,
    `- Assertions evaluated: ${payload.counts.totalAssertions}`,
    `- Assertions passed: ${payload.counts.assertionsPassed}`,
    "",
    "## Per scenario",
    "",
    "| Scenario | Pass | Assertions (pass/total) | Dominant failure cause |",
    "| --- | --- | ---: | --- |",
  ];

  for (const row of payload.perScenario) {
    const cause = row.failureCauseSummary?.dominantLikelyCause ?? "—";
    lines.push(
      `| ${mdEscape(row.scenarioId)} | ${row.pass ? "yes" : "no"} | ${row.assertionsPassed}/${row.assertionsTotal} | ${mdEscape(cause)} |`
    );
  }

  lines.push("", "## Failures", "");
  const bad = payload.perScenario.filter((r) => !r.pass);
  if (!bad.length) lines.push("- (none)", "");
  else {
    for (const r of bad) {
      lines.push(`### ${mdEscape(r.scenarioId)}`, "");
      for (const a of r.failedAssertions || []) {
        lines.push(
          `- **${mdEscape(a.assertionId)}** (${mdEscape(a.likelyCause)})`,
          `  - expected: \`${mdEscape(JSON.stringify(a.expected).slice(0, 400))}\``,
          `  - actual: \`${mdEscape(JSON.stringify(a.actual).slice(0, 400))}\``,
          ""
        );
      }
    }
  }

  return lines.join("\n");
}

async function main() {
  await mkdir(PER_STUDENT_OUT, { recursive: true });

  const scenarios = await loadQuickScenarios();
  /** @type {object[]} */
  const perScenario = [];
  let totalAssertions = 0;
  let assertionsPassed = 0;
  let scenariosPassed = 0;
  /** @type {object[]} */
  const failureRows = [];

  for (const scenario of scenarios) {
    const sid = scenario.scenarioId;
    const storagePath = join(AGG_DIR, `${sid}.storage.json`);
    const metaPath = join(AGG_DIR, `${sid}.meta.json`);
    const reportPath = join(REPORT_DIR, `${sid}.report.json`);

    let storage;
    let meta;
    let report = null;

    try {
      storage = JSON.parse(await readFile(storagePath, "utf8"));
      meta = JSON.parse(await readFile(metaPath, "utf8"));
    } catch (e) {
      perScenario.push({
        scenarioId: sid,
        profileId: scenario.profileRef ?? null,
        pass: false,
        error: String(e?.message || e),
        oracle: null,
        assertions: [],
        assertionsTotal: 0,
        assertionsPassed: 0,
        failedAssertions: [],
        failureCauseSummary: null,
      });
      failureRows.push({
        scenarioId: sid,
        phase: "behavior",
        error: `missing aggregate inputs: ${String(e?.message || e)}`,
        likelyCause: "simulator_data",
      });
      continue;
    }

    try {
      report = JSON.parse(await readFile(reportPath, "utf8"));
    } catch {
      report = null;
    }

    const oracle = computeBehaviorOracle(storage, meta, report);
    const evalResult = evaluateScenarioBehavior(scenario, oracle, report);

    const passedRows = evalResult.assertions.filter((a) => a.pass);
    const failedRows = evalResult.assertions.filter((a) => !a.pass);
    totalAssertions += evalResult.assertions.length;
    assertionsPassed += passedRows.length;

    const pass = evalResult.passed && !failedRows.length;
    if (pass) scenariosPassed += 1;
    else {
      const fc = summarizeFailureCauses(evalResult.assertions);
      failureRows.push({
        scenarioId: sid,
        phase: "behavior",
        profileId: scenario.profileRef ?? null,
        failedAssertions: failedRows.map((a) => ({
          assertionId: a.assertionId,
          likelyCause: a.likelyCause,
          expected: a.expected,
          actual: a.actual,
        })),
        dominantLikelyCause: fc.dominantLikelyCause,
      });
    }

    const behaviorPayload = {
      scenarioId: sid,
      profileId: scenario.profileRef ?? null,
      generator: "learning-simulator-behavior-phase5-v1",
      storagePath,
      metaPath,
      reportPath: report ? reportPath : null,
      oracle,
      expectedBehaviorNotes: scenario.expected ?? {},
      assertions: evalResult.assertions,
      pass: evalResult.passed,
      failureCauseSummary: summarizeFailureCauses(evalResult.assertions),
    };

    await writeFile(join(PER_STUDENT_OUT, `${sid}.behavior.json`), JSON.stringify(behaviorPayload, null, 2), "utf8");

    perScenario.push({
      scenarioId: sid,
      profileId: scenario.profileRef ?? null,
      pass: evalResult.passed,
      assertionsTotal: evalResult.assertions.length,
      assertionsPassed: passedRows.length,
      failedAssertions: failedRows,
      oracleSummary: {
        questionTotal: oracle.evidence.questionTotal,
        overallAccuracyPct: oracle.evidence.overallAccuracyPct,
        trendDirection: oracle.trendOracle.direction,
        trendDelta: oracle.trendOracle.delta,
        sessionSamples: oracle.trendOracle.sessionSamples,
      },
      failureCauseSummary: summarizeFailureCauses(evalResult.assertions),
    });
  }

  const generatedAt = new Date().toISOString();
  const summaryPayload = {
    generatedAt,
    generator: "learning-simulator-behavior-phase5-v1",
    counts: {
      scenarios: scenarios.length,
      scenariosPassed,
      totalAssertions,
      assertionsPassed,
    },
    perScenario,
  };

  await writeFile(OUT_JSON, JSON.stringify(summaryPayload, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown({ ...summaryPayload, counts: summaryPayload.counts }), "utf8");
  await writeFile(FAILURES_JSON, JSON.stringify({ failures: failureRows, generatedAt }, null, 2), "utf8");

  const ok = scenariosPassed === scenarios.length;
  console.log(
    JSON.stringify(
      {
        ok,
        scenarios: scenarios.length,
        scenariosPassed,
        assertionsEvaluated: totalAssertions,
        assertionsPassed,
        failures: failureRows.length,
      },
      null,
      2
    )
  );

  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
