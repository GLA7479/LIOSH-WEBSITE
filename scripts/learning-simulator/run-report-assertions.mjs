#!/usr/bin/env node
/**
 * Phase 3 — build parent reports from aggregate storage + evaluate scenario.expected assertions.
 * npm run qa:learning-simulator:reports
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { buildReportsFromAggregateStorage } from "./lib/report-runner.mjs";
import { evaluateAssertions } from "./lib/report-assertion-engine.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const AGG_DIR = join(ROOT, "reports", "learning-simulator", "aggregate", "per-student");
const OUT_DIR = join(ROOT, "reports", "learning-simulator", "reports");
const PER_STUDENT = join(OUT_DIR, "per-student");
const OUT_JSON = join(OUT_DIR, "run-summary.json");
const OUT_MD = join(OUT_DIR, "run-summary.md");

async function loadQuickScenarios() {
  const scenariosUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "quick-scenarios.mjs")).href;
  const scenariosMod = await import(scenariosUrl);
  return scenariosMod.QUICK_SCENARIOS || scenariosMod.default;
}

function slimReportPayload(scenarioId, built, storagePath, metaPath) {
  const base = built.baseReport;
  return {
    scenarioId,
    generator: "learning-simulator-report-phase3-v1",
    storageInputPath: storagePath,
    metaInputPath: metaPath,
    playerName: built.playerName,
    period: built.period,
    diagnosticPrimarySource: base?.diagnosticPrimarySource ?? null,
    summary: base?.summary
      ? {
          totalQuestions: base.summary.totalQuestions,
          overallAccuracy: base.summary.overallAccuracy,
          totalTimeMinutes: base.summary.totalTimeMinutes,
        }
      : null,
    facets: built.facets,
    corpusStats: { charLength: (built.corpus || "").length },
  };
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

function buildMarkdown(payload) {
  const lines = [
    "# Learning simulator — report assertions",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Scenarios: ${payload.counts.scenarios}`,
    `- Reports generated: ${payload.counts.reportsGenerated}`,
    `- Assertions evaluated (total rows): ${payload.counts.totalAssertions}`,
    `- Scenarios passed: ${payload.counts.scenariosPassed} / ${payload.counts.scenarios}`,
    "",
    "## Per scenario",
    "",
    "| Scenario | Report OK | Assertions pass | Failed (names) |",
    "| --- | --- | --- | --- |",
  ];

  for (const row of payload.perScenario) {
    const failed = row.failedAssertions.length ? mdEscape(row.failedAssertions.join(", ")) : "—";
    lines.push(
      `| ${mdEscape(row.scenarioId)} | ${row.reportBuildOk ? "yes" : "no"} | ${row.assertionOverallPass ? "yes" : "no"} | ${failed} |`
    );
  }

  lines.push("", "## Failures detail", "");
  const bad = payload.perScenario.filter((r) => !r.assertionOverallPass || !r.reportBuildOk);
  if (!bad.length) lines.push("- (none)", "");
  else {
    for (const r of bad) {
      lines.push(`### ${r.scenarioId}`, "");
      if (!r.reportBuildOk) lines.push(`- Report build: ${mdEscape(r.reportError || "?")}`, "");
      for (const ar of r.assertionResults || []) {
        if (!ar.pass) {
          lines.push(`- **${ar.assertion}**: fail`, `  - Evidence: \`${mdEscape(JSON.stringify(ar.evidence).slice(0, 400))}\``, "");
        }
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

async function main() {
  await mkdir(PER_STUDENT, { recursive: true });

  const scenarios = await loadQuickScenarios();
  /** @type {object[]} */
  const perScenario = [];
  let totalAssertions = 0;
  let scenariosPassed = 0;
  let reportsGenerated = 0;

  for (const scenario of scenarios) {
    const sid = scenario.scenarioId;
    const storagePath = join(AGG_DIR, `${sid}.storage.json`);
    const metaPath = join(AGG_DIR, `${sid}.meta.json`);

    let storage;
    let meta;
    try {
      storage = JSON.parse(await readFile(storagePath, "utf8"));
      meta = JSON.parse(await readFile(metaPath, "utf8"));
    } catch (e) {
      perScenario.push({
        scenarioId: sid,
        reportBuildOk: false,
        reportError: `missing aggregate artifacts: ${String(e?.message || e)}`,
        storagePath,
        metaPath,
        reportPath: null,
        assertionsPath: null,
        assertionOverallPass: false,
        assertionResults: [],
        failedAssertions: ["_storage_load"],
      });
      continue;
    }

    if (storage?._error) {
      perScenario.push({
        scenarioId: sid,
        reportBuildOk: false,
        reportError: "aggregate storage has _error",
        storagePath,
        metaPath,
        reportPath: null,
        assertionsPath: null,
        assertionOverallPass: false,
        assertionResults: [],
        failedAssertions: ["_aggregate_storage"],
      });
      continue;
    }

    const built = await buildReportsFromAggregateStorage({ storage, scenario });
    reportsGenerated += 1;

    if (!built.ok || !built.facets) {
      perScenario.push({
        scenarioId: sid,
        reportBuildOk: false,
        reportError: built.error || "build failed",
        storagePath,
        metaPath,
        reportPath: null,
        assertionsPath: null,
        assertionOverallPass: false,
        assertionResults: [],
        failedAssertions: ["_report_build"],
      });
      continue;
    }

    const assertionOutcome = evaluateAssertions(scenario.expected || {}, built.facets, built.corpus, built.baseReport, storage);
    totalAssertions += assertionOutcome.counts.assertionsRun;

    const failedAssertions = assertionOutcome.results.filter((r) => !r.pass).map((r) => r.assertion);
    const scenarioOk = assertionOutcome.overallPass;

    const reportPayload = slimReportPayload(sid, built, storagePath, metaPath);
    const assertionsPayload = {
      scenarioId: sid,
      profileRef: scenario.profileRef,
      expected: scenario.expected || {},
      counts: assertionOutcome.counts,
      overallPass: assertionOutcome.overallPass,
      results: assertionOutcome.results,
      interpretationNotes: [
        "Failures may indicate simulator fidelity, assertion tuning, or report-engine behavior — triage before changing production logic.",
      ],
    };

    const reportPath = join(PER_STUDENT, `${sid}.report.json`);
    const assertionsPath = join(PER_STUDENT, `${sid}.assertions.json`);
    await writeFile(reportPath, JSON.stringify(reportPayload, null, 2), "utf8");
    await writeFile(assertionsPath, JSON.stringify(assertionsPayload, null, 2), "utf8");

    if (scenarioOk) scenariosPassed += 1;

    perScenario.push({
      scenarioId: sid,
      reportBuildOk: true,
      reportError: null,
      storagePath,
      metaPath,
      reportPath,
      assertionsPath,
      assertionOverallPass: scenarioOk,
      assertionResults: assertionOutcome.results,
      failedAssertions,
      metaSummary: meta?.stats ?? null,
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    generator: "run-report-assertions-v1",
    counts: {
      scenarios: scenarios.length,
      scenariosPassed,
      reportsGenerated,
      totalAssertions,
    },
    perScenario,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown(payload), "utf8");

  console.log(
    JSON.stringify(
      {
        scenarios: payload.counts.scenarios,
        passed: payload.counts.scenariosPassed,
        assertions: payload.counts.totalAssertions,
        outJson: OUT_JSON,
      },
      null,
      2
    )
  );

  if (scenariosPassed !== scenarios.length) {
    console.error("Report assertions: one or more scenarios failed.");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
