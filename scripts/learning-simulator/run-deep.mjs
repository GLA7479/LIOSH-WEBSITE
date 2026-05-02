#!/usr/bin/env node
/**
 * Deep longitudinal learning simulator v1.
 * npm run qa:learning-simulator:deep
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { buildStorageForScenario } from "./lib/aggregate-runner.mjs";
import { validateDeepHorizonEvidence } from "./lib/deep-runner.mjs";
import { buildReportsFromAggregateStorage } from "./lib/report-runner.mjs";
import { evaluateAssertions } from "./lib/report-assertion-engine.mjs";
import { computeBehaviorOracle } from "./lib/behavior-oracle.mjs";
import { evaluateScenarioBehavior, summarizeFailureCauses } from "./lib/behavior-assertion-engine.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const MATRIX_PATH = join(ROOT, "reports", "learning-simulator", "coverage-matrix.json");
const OUT_DIR = join(ROOT, "reports", "learning-simulator", "deep");
const PER_STUDENT = join(OUT_DIR, "per-student");
const OUT_JSON = join(OUT_DIR, "run-summary.json");
const OUT_MD = join(OUT_DIR, "run-summary.md");
const FAILURES_JSON = join(OUT_DIR, "failures.json");

async function loadDeepSuite() {
  const profilesUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "profiles", "base-profiles.mjs")).href;
  const scenariosUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "deep-scenarios.mjs")).href;

  const profilesMod = await import(profilesUrl);
  const scenariosMod = await import(scenariosUrl);

  const BASE_PROFILES = profilesMod.BASE_PROFILES || profilesMod.default;
  const DEEP_SCENARIOS = scenariosMod.DEEP_SCENARIOS || scenariosMod.default;

  return { BASE_PROFILES, DEEP_SCENARIOS };
}

function slimReportPayload(scenarioId, built, storagePath, metaPath) {
  const base = built.baseReport;
  return {
    scenarioId,
    generator: "learning-simulator-deep-v1",
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
    "# Learning simulator — deep longitudinal v1",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Wall clock (ms): ${payload.runtimeMs}`,
    `- Scenarios: ${payload.counts.scenarios}`,
    `- Passed: ${payload.counts.scenariosPassed} / ${payload.counts.scenarios}`,
    `- Total sessions / questions / mistakes: ${payload.totals.sessions} / ${payload.totals.questions} / ${payload.totals.mistakes}`,
    "",
    "## Per scenario",
    "",
    "| Scenario | OK | Sessions | Questions | Report assertions | Behavior pass |",
    "| --- | --- | ---: | ---: | --- | --- |",
  ];

  for (const r of payload.perScenario) {
    lines.push(
      `| ${mdEscape(r.scenarioId)} | ${r.pass ? "yes" : "no"} | ${r.sessionCount} | ${r.questionTotal} | ${r.reportAssertionsPass ? "yes" : "no"} | ${r.behaviorPass ? "yes" : "no"} |`
    );
  }

  lines.push("", "## Failures", "");
  if (!payload.failures.length) lines.push("- (none)", "");
  else {
    for (const f of payload.failures) {
      lines.push(`### ${mdEscape(f.scenarioId)}`, "", "```json", JSON.stringify(f, null, 2), "```", "");
    }
  }

  lines.push(
    "",
    "## Runtime note",
    "",
    "- Deep v1 uses full parent-report generation per scenario; for CI, prefer `qa:learning-simulator:aggregate` (quick) as a fast gate and run deep on a schedule if needed.",
    ""
  );

  return lines.join("\n");
}

async function main() {
  const t0 = Date.now();
  await mkdir(PER_STUDENT, { recursive: true });

  let matrixRows;
  try {
    const matrixRaw = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
    matrixRows = matrixRaw.rows || [];
  } catch (e) {
    console.error("Missing coverage matrix. Run npm run qa:learning-simulator:matrix first.");
    console.error(e);
    process.exit(1);
  }

  const { BASE_PROFILES, DEEP_SCENARIOS } = await loadDeepSuite();

  /** @type {object[]} */
  const perScenario = [];
  /** @type {object[]} */
  const failures = [];
  let scenariosPassed = 0;
  let totals = { sessions: 0, questions: 0, mistakes: 0 };
  let totalReportAssertions = 0;
  let totalBehaviorAssertions = 0;

  for (const scenario of DEEP_SCENARIOS) {
    const sid = scenario.scenarioId;
    const profile = BASE_PROFILES[scenario.profileRef];
    if (!profile) {
      failures.push({ scenarioId: sid, phase: "profile", error: `missing profile ${scenario.profileRef}` });
      perScenario.push({
        scenarioId: sid,
        pass: false,
        sessionCount: 0,
        questionTotal: 0,
        reportAssertionsPass: false,
        behaviorPass: false,
        errors: [`missing profile ${scenario.profileRef}`],
      });
      continue;
    }

    const built = await buildStorageForScenario(scenario, profile, matrixRows);
    const deepVal = validateDeepHorizonEvidence(scenario, built.stats || {});
    const meta = {
      ...(built.meta || {}),
      generator: "deep-runner-v1",
      deepHorizonValidation: deepVal,
      errors: [...(built.meta?.errors || []), ...(deepVal.ok ? [] : deepVal.errors)],
    };

    const storagePath = join(PER_STUDENT, `${sid}.storage.json`);
    const metaPath = join(PER_STUDENT, `${sid}.meta.json`);

    const storageOk = built.ok && built.storage && deepVal.ok;
    if (!storageOk) {
      const errMsg = [...(built.errors || []), ...(deepVal.errors || [])].join("; ") || "storage build failed";
      await writeFile(storagePath, JSON.stringify(built.storage || { _error: errMsg }, null, 2), "utf8");
      await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");
      failures.push({
        scenarioId: sid,
        phase: "storage_or_deep_validation",
        error: errMsg,
        likelyCause: "simulator_data",
      });
      perScenario.push({
        scenarioId: sid,
        pass: false,
        sessionCount: built.stats?.sessionCount ?? 0,
        questionTotal: built.stats?.questionTotal ?? 0,
        reportAssertionsPass: false,
        behaviorPass: false,
        errors: [errMsg],
      });
      continue;
    }

    totals.sessions += built.stats.sessionCount;
    totals.questions += built.stats.questionTotal;
    totals.mistakes += built.stats.mistakeEventCount || 0;

    await writeFile(storagePath, JSON.stringify(built.storage, null, 2), "utf8");
    await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");

    const reportBuilt = await buildReportsFromAggregateStorage({ storage: built.storage, scenario });
    const slimReport = slimReportPayload(sid, reportBuilt, storagePath, metaPath);
    const oracle = computeBehaviorOracle(built.storage, meta, slimReport);

    let reportAssertionsPass = false;
    let behaviorPass = false;
    let assertionOutcome = null;
    let behaviorOutcome = null;

    const reportPath = join(PER_STUDENT, `${sid}.report.json`);
    const assertionsPath = join(PER_STUDENT, `${sid}.assertions.json`);
    const behaviorPath = join(PER_STUDENT, `${sid}.behavior.json`);

    if (!reportBuilt.ok || !reportBuilt.facets) {
      await writeFile(reportPath, JSON.stringify({ scenarioId: sid, ok: false, error: reportBuilt.error }, null, 2), "utf8");
      failures.push({
        scenarioId: sid,
        phase: "report",
        error: reportBuilt.error || "report build failed",
        likelyCause: "engine_report",
      });
    } else {
      await writeFile(reportPath, JSON.stringify(slimReport, null, 2), "utf8");

      assertionOutcome = evaluateAssertions(
        scenario.expected || {},
        reportBuilt.facets,
        reportBuilt.corpus,
        reportBuilt.baseReport,
        built.storage
      );
      totalReportAssertions += assertionOutcome.counts.assertionsRun;
      reportAssertionsPass = assertionOutcome.overallPass;

      const assertionsPayload = {
        scenarioId: sid,
        profileRef: scenario.profileRef,
        expected: scenario.expected || {},
        counts: assertionOutcome.counts,
        overallPass: assertionOutcome.overallPass,
        results: assertionOutcome.results,
      };
      await writeFile(assertionsPath, JSON.stringify(assertionsPayload, null, 2), "utf8");

      behaviorOutcome = evaluateScenarioBehavior(scenario, oracle, slimReport);
      totalBehaviorAssertions += behaviorOutcome.assertions.length;
      behaviorPass = behaviorOutcome.passed;

      const behaviorPayload = {
        scenarioId: sid,
        profileRef: scenario.profileRef,
        generator: "learning-simulator-deep-behavior-v1",
        oracle,
        assertions: behaviorOutcome.assertions,
        pass: behaviorOutcome.passed,
        failureCauseSummary: summarizeFailureCauses(behaviorOutcome.assertions),
      };
      await writeFile(behaviorPath, JSON.stringify(behaviorPayload, null, 2), "utf8");
    }

    const rowPass = storageOk && reportAssertionsPass && behaviorPass;
    if (rowPass) scenariosPassed += 1;
    else if (storageOk && reportBuilt.ok) {
      const bits = [];
      if (!reportAssertionsPass) bits.push("report_assertions");
      if (!behaviorPass) bits.push("behavior");
      failures.push({
        scenarioId: sid,
        phase: bits.join("+") || "unknown",
        reportAssertionsPass,
        behaviorPass,
        likelyCause: !behaviorPass ? summarizeFailureCauses(behaviorOutcome?.assertions || []).dominantLikelyCause : "engine_report",
      });
    }

    perScenario.push({
      scenarioId: sid,
      pass: rowPass,
      sessionCount: built.stats.sessionCount,
      questionTotal: built.stats.questionTotal,
      mistakeEventCount: built.stats.mistakeEventCount,
      reportAssertionsPass,
      behaviorPass,
      errors: [],
    });
  }

  const runtimeMs = Date.now() - t0;
  const payload = {
    generatedAt: new Date().toISOString(),
    runtimeMs,
    generator: "learning-simulator-deep-v1",
    counts: {
      scenarios: DEEP_SCENARIOS.length,
      scenariosPassed,
      totalReportAssertions,
      totalBehaviorAssertions,
    },
    totals,
    perScenario,
    failures,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown(payload), "utf8");
  await writeFile(FAILURES_JSON, JSON.stringify({ failures, generatedAt: payload.generatedAt, runtimeMs }, null, 2), "utf8");

  const ok = scenariosPassed === DEEP_SCENARIOS.length;
  console.log(
    JSON.stringify(
      {
        ok,
        scenarios: DEEP_SCENARIOS.length,
        scenariosPassed,
        totals,
        runtimeMs,
        outJson: OUT_JSON,
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
