#!/usr/bin/env node
/**
 * Engine Truth Audit — aggregation ↔ diagnostic engine V2 ↔ decision layer ↔ report model.
 * npm run qa:learning-simulator:engine
 *
 * Prerequisites: reports/learning-simulator/coverage-matrix.json (npm run qa:learning-simulator:matrix).
 * Optional stress clones need coverage-catalog.json (npm run qa:learning-simulator:coverage).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { buildStorageForScenario } from "./lib/aggregate-runner.mjs";
import { buildReportsFromAggregateStorage } from "./lib/report-runner.mjs";
import { computeBehaviorOracle } from "./lib/behavior-oracle.mjs";
import { validateDeepHorizonEvidence } from "./lib/deep-runner.mjs";
import { ENGINE_GOLDEN_BY_SCENARIO_ID, ENGINE_GOLDEN_BY_KIND_DEFAULT } from "./lib/engine-truth-golden.mjs";
import { buildStressScenarioForEngineTruth } from "./lib/profile-stress-lib.mjs";
import {
  assertSummarySubjectsSumToGlobal,
  assertSubjectRollupsMatchSummary,
  assertRowAccuracyArithmetic,
  assertZeroQuestionRowsNotScoredAsFailures,
  assertEngineReportSubjectSync,
  assertTrendVsStorageOracle,
  assertNoFalseStrongConclusion,
  assertThinProfileStaysCautious,
  assertNoCorpusLeaks,
  assertNoDebugKeysInReportPayload,
  assertEvidenceContractConsistent,
  assertFastWrongVsSlowCorrectPace,
  assertPracticeMinutesAligned,
  assertNoDataSubjectsNotFailed,
  evaluateScenarioIntent,
} from "./lib/engine-truth-checks.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const MATRIX_PATH = join(ROOT, "reports", "learning-simulator", "coverage-matrix.json");
const OUT_DIR = join(ROOT, "reports", "learning-simulator", "engine-truth");
const SUMMARY_JSON = join(OUT_DIR, "engine-truth-summary.json");
const SUMMARY_MD = join(OUT_DIR, "engine-truth-summary.md");
const FAILED_JSON = join(OUT_DIR, "failed-scenarios.json");
const COMPARISON_MD = join(OUT_DIR, "scenario-comparison.md");

const CAUTIOUS_MARKERS = ["עדיין לא", "אין מספיק", "מעט מידע", "צריך עוד תרגול", "זהיר"];

function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function cautiousText(facets) {
  const parts = [
    facets?.contract?.topConfidenceHe,
    facets?.contract?.topMainStatusHe,
    facets?.executive?.overallConfidenceHe,
    facets?.executive?.cautionNoteHe,
  ]
    .filter(Boolean)
    .join(" ");
  return norm(parts);
}

function hasCautiousTone(facets) {
  const t = cautiousText(facets);
  return CAUTIOUS_MARKERS.some((m) => t.includes(norm(m)));
}

function slimForOracle(scenarioId, built) {
  const base = built.baseReport;
  return {
    scenarioId,
    facets: built.facets,
    summary: base?.summary
      ? {
          totalQuestions: base.summary.totalQuestions,
          overallAccuracy: base.summary.overallAccuracy,
        }
      : null,
  };
}

function evaluateGoldenScenario(scenarioId, golden, built, storage, facets) {
  const rows = [];
  const summaryQ = Number(built.baseReport?.summary?.totalQuestions) || 0;
  const diagnosed = Number(facets?.diagnostic?.diagnosedCount) || 0;
  const units = Array.isArray(built.baseReport?.diagnosticEngineV2?.units)
    ? built.baseReport.diagnosticEngineV2.units
    : [];

  if (golden.minTotalQuestions != null && summaryQ < golden.minTotalQuestions) {
    rows.push({ check: "minTotalQuestions", expected: golden.minTotalQuestions, actual: summaryQ });
  }
  if (golden.maxTotalQuestions != null && summaryQ > golden.maxTotalQuestions) {
    rows.push({ check: "maxTotalQuestions", expected: golden.maxTotalQuestions, actual: summaryQ });
  }
  if (golden.minDiagnosedUnits != null && diagnosed < golden.minDiagnosedUnits) {
    rows.push({ check: "minDiagnosedUnits", expected: golden.minDiagnosedUnits, actual: diagnosed });
  }

  if (golden.evidenceExpected === "thin" && summaryQ >= 120) {
    rows.push({ check: "evidenceExpectedThin", note: "high volume contradicts thin profile", summaryQ });
  }
  if (golden.evidenceExpected === "high" && summaryQ < 200) {
    rows.push({ check: "evidenceExpectedHigh_soft", note: "lower than ideal volume", summaryQ, severity: "warn" });
  }

  if (golden.expectCautiousOrThin && summaryQ < 90 && !hasCautiousTone(facets) && !facets?.contract?.topThinDowngraded) {
    rows.push({ check: "expectCautiousOrThin", summaryQ });
  }

  if (golden.expectNoContradiction) {
    const n = Number(facets?.diagnostic?.contradictoryConfidenceCount) || 0;
    if (n > 0) {
      rows.push({ check: "expectNoContradiction", contradictoryUnits: n });
    }
  }

  if (golden.expectCautiousOrContradictory) {
    const hasContrad = units.some((u) => String(u?.confidence?.level || "").toLowerCase() === "contradictory");
    const cautious = hasCautiousTone(facets);
    if (!hasContrad && !cautious && summaryQ > 80) {
      rows.push({
        check: "expectCautiousOrContradictory_soft",
        note: "oracle informational",
        severity: "warn",
      });
    }
  }

  if (golden.subjectFocus && golden.kind?.includes("weak")) {
    const sid = golden.subjectFocus;
    const qk = `${sid.replace("-", "")}Questions`;
    const alt = {
      math: "mathQuestions",
      geometry: "geometryQuestions",
      english: "englishQuestions",
      science: "scienceQuestions",
      hebrew: "hebrewQuestions",
      "moledet-geography": "moledetGeographyQuestions",
    };
    const qField = alt[sid] || qk;
    const n = Number(built.baseReport?.summary?.[qField]) || 0;
    if (n < 8) {
      rows.push({ check: "subject_volume_soft", subject: sid, questions: n, severity: "warn" });
    }
  }

  const hardFails = rows.filter((r) => r.severity !== "warn");
  return { pass: hardFails.length === 0, rows };
}

async function loadScenarios() {
  const quickUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "quick-scenarios.mjs")).href;
  const deepUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "deep-scenarios.mjs")).href;
  const profilesUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "profiles", "base-profiles.mjs")).href;

  const [quickMod, deepMod, profMod] = await Promise.all([import(quickUrl), import(deepUrl), import(profilesUrl)]);

  const QUICK = quickMod.QUICK_SCENARIOS || quickMod.default;
  const DEEP = deepMod.DEEP_SCENARIOS || deepMod.default;
  const BASE_PROFILES = profMod.BASE_PROFILES || profMod.default;

  const byId = new Map();
  for (const s of [...QUICK, ...DEEP]) {
    if (!byId.has(s.scenarioId)) byId.set(s.scenarioId, s);
  }
  return { scenarios: [...byId.values()], BASE_PROFILES };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let matrixRows;
  try {
    const matrixRaw = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
    matrixRows = matrixRaw.rows || [];
  } catch (e) {
    console.error("Engine truth audit: missing coverage-matrix.json — run npm run qa:learning-simulator:matrix");
    console.error(e);
    process.exit(1);
    return;
  }

  const { scenarios: fixtureScenarios, BASE_PROFILES } = await loadScenarios();

  /** @type {object[]} */
  const extraStress = [];
  for (const t of ["fast_wrong", "slow_correct", "mixed_strengths"]) {
    const b = await buildStressScenarioForEngineTruth(ROOT, t, 0);
    if (b.ok && b.scenario && b.profile) {
      extraStress.push({ scenario: b.scenario, profile: b.profile, prebuilt: true });
    }
  }

  const allRuns = [];
  for (const scenario of fixtureScenarios) {
    const profile = BASE_PROFILES[scenario.profileRef];
    if (!profile) {
      allRuns.push({
        scenarioId: scenario.scenarioId,
        phase: "profile",
        pass: false,
        errors: [`missing profile ${scenario.profileRef}`],
      });
      continue;
    }
    allRuns.push({ scenario, profile, prebuilt: false });
  }
  for (const x of extraStress) {
    allRuns.push({ scenario: x.scenario, profile: x.profile, prebuilt: true });
  }

  /** @type {object[]} */
  const failures = [];
  /** @type {object[]} */
  const comparisons = [];

  let paceFast = null;
  let paceSlow = null;

  for (const run of allRuns) {
    if (run.phase === "profile") {
      failures.push(run);
      comparisons.push({
        scenarioId: run.scenarioId,
        expected: ENGINE_GOLDEN_BY_SCENARIO_ID[run.scenarioId] || null,
        actual: { error: run.errors },
        pass: false,
      });
      continue;
    }

    const { scenario, profile } = run;
    const sid = scenario.scenarioId;

    const built = await buildStorageForScenario(scenario, profile, matrixRows);
    const deepVal = validateDeepHorizonEvidence(scenario, built.stats || {});
    if (!built.ok || !built.storage || !deepVal.ok) {
      const err = [...(built.errors || []), ...(deepVal.ok ? [] : deepVal.errors || [])];
      failures.push({ scenarioId: sid, phase: "storage", errors: err });
      comparisons.push({
        scenarioId: sid,
        expected: ENGINE_GOLDEN_BY_SCENARIO_ID[sid] || ENGINE_GOLDEN_BY_KIND_DEFAULT[scenario.engineTruthKind] || null,
        actual: { storageError: err },
        pass: false,
      });
      continue;
    }

    const reportBuilt = await buildReportsFromAggregateStorage({ storage: built.storage, scenario });
    if (!reportBuilt.ok || !reportBuilt.baseReport || !reportBuilt.detailedReport) {
      failures.push({ scenarioId: sid, phase: "report", error: reportBuilt.error || "build failed" });
      comparisons.push({
        scenarioId: sid,
        expected: ENGINE_GOLDEN_BY_SCENARIO_ID[sid] || null,
        actual: { error: reportBuilt.error },
        pass: false,
      });
      continue;
    }

    const { baseReport, detailedReport, facets, corpus } = reportBuilt;
    const slim = slimForOracle(sid, reportBuilt);
    const behaviorOracle = computeBehaviorOracle(built.storage, built.meta || {}, slim);

    const goldenFile = ENGINE_GOLDEN_BY_SCENARIO_ID[sid];
    const kindDef = scenario.engineTruthKind ? ENGINE_GOLDEN_BY_KIND_DEFAULT[scenario.engineTruthKind] : {};
    const golden =
      goldenFile != null
        ? { ...kindDef, ...goldenFile }
        : scenario.engineTruthKind && Object.keys(kindDef).length
          ? { ...kindDef }
          : null;

    let trendResult = { pass: true, skipped: true };
    if (golden?.trendExpected && golden.trendExpected !== "any") {
      trendResult = assertTrendVsStorageOracle(facets, built.storage, golden.trendExpected);
    } else if (scenario.expected?.trendExpected?.length) {
      const te = scenario.expected.trendExpected[0];
      trendResult = assertTrendVsStorageOracle(facets, built.storage, te);
    }

    const goldenEval = golden
      ? evaluateGoldenScenario(sid, golden, reportBuilt, built.storage, facets)
      : { pass: true, rows: [] };

    const intentEval = golden
      ? evaluateScenarioIntent({
          scenario,
          golden,
          stats: built.stats,
          baseReport,
          detailedReport,
          facets,
        })
      : { pass: true, fails: [] };

    const checks = {
      summaryGlobal: assertSummarySubjectsSumToGlobal(baseReport.summary),
      subjectRollups: assertSubjectRollupsMatchSummary(baseReport),
      rowArithmetic: assertRowAccuracyArithmetic(baseReport),
      zeroRows: assertZeroQuestionRowsNotScoredAsFailures(baseReport),
      practiceMinutes: assertPracticeMinutesAligned(baseReport),
      engineReportSync: assertEngineReportSubjectSync(baseReport, detailedReport),
      noFalseStrong: assertNoFalseStrongConclusion(baseReport),
      thinCautious: assertThinProfileStaysCautious(baseReport, {}),
      corpusLeak: assertNoCorpusLeaks(corpus),
      debugKeys: assertNoDebugKeysInReportPayload(baseReport, detailedReport),
      evidenceContract: assertEvidenceContractConsistent(facets, baseReport),
      noDataSubjects: assertNoDataSubjectsNotFailed(detailedReport, baseReport.summary),
      scenarioIntent: intentEval,
    };

    const stressKind = scenario.profileStressType || scenario.engineTruthKind;
    if (stressKind === "fast_wrong") paceFast = behaviorOracle.paceOracle;
    if (stressKind === "slow_correct") paceSlow = behaviorOracle.paceOracle;

    const checkFailures = Object.entries(checks)
      .filter(([, v]) => !v.pass)
      .map(([k, v]) => ({ name: k, detail: v }));

    const trendFail = !trendResult.pass;
    const goldenFail = golden ? !goldenEval.pass : false;

    const pass = checkFailures.length === 0 && !trendFail && !goldenFail;

    if (!pass) {
      failures.push({
        scenarioId: sid,
        checksFailed: checkFailures,
        trend: trendFail ? trendResult : null,
        golden: goldenEval.rows.length ? goldenEval : null,
        intent: intentEval.fails?.length ? intentEval : null,
      });
    }

    const units = baseReport?.diagnosticEngineV2?.units || [];
    comparisons.push({
      scenarioId: sid,
      kind: golden?.kind || scenario.engineTruthKind || null,
      expected: golden || null,
      actual: {
        totalQuestions: baseReport.summary?.totalQuestions,
        overallAccuracy: baseReport.summary?.overallAccuracy,
        diagnosedCount: facets?.diagnostic?.diagnosedCount,
        unitCount: facets?.diagnostic?.unitCount,
        contradictoryConfidenceCount: facets?.diagnostic?.contradictoryConfidenceCount,
        dominantActions: [...new Set(units.map((u) => u?.canonicalState?.actionState).filter(Boolean))].slice(0, 12),
        trendOracle: behaviorOracle.trendOracle,
        pace: behaviorOracle.paceOracle,
      },
      pass,
    });
  }

  const paceSep = assertFastWrongVsSlowCorrectPace(
    { meanSessionDurationSec: paceFast?.meanSessionDurationSec },
    { meanSessionDurationSec: paceSlow?.meanSessionDurationSec }
  );

  if (!paceSep.pass && !paceSep.skipped) {
    failures.push({
      scenarioId: "_pace_fast_wrong_vs_slow_correct",
      phase: "pace_separation",
      errors: [paceSep],
    });
  }

  const overallPass = failures.length === 0;
  const generatedAt = new Date().toISOString();

  const summaryPayload = {
    generatedAt,
    overallPass: overallPass ? "PASS" : "FAIL",
    scenarioCount: allRuns.filter((r) => !r.phase).length,
    failuresCount: failures.length,
    paceSeparation: paceSep.skipped ? "skipped" : paceSep.pass ? "PASS" : "FAIL",
    failures: failures.slice(0, 50),
  };

  await writeFile(SUMMARY_JSON, JSON.stringify(summaryPayload, null, 2), "utf8");
  await writeFile(
    FAILED_JSON,
    JSON.stringify(failures.length ? failures : { note: "none" }, null, 2),
    "utf8"
  );

  const mdLines = [
    "# Engine truth audit",
    "",
    `- **Result:** ${overallPass ? "**PASS**" : "**FAIL**"}`,
    `- Generated: ${generatedAt}`,
    `- Scenarios exercised: ${summaryPayload.scenarioCount}`,
    `- Pace fast_wrong vs slow_correct: ${paceSep.skipped ? "skipped (missing pair)" : paceSep.pass ? "PASS" : "FAIL"}`,
    "",
    "## Checks applied",
    "",
    "- Summary: subject totals sum to global totals; overall accuracy matches `totalCorrect/totalQuestions`",
    "- Topic-map rollups vs per-subject totals on summary",
    "- Row accuracy arithmetic + zero-question rows not flagged as failure",
    "- Practice minutes sum vs `summary.totalTimeMinutes`",
    "- Engine ↔ detailed report: `topWeaknesses` / `topStrengths` trace to V2 units",
    "- Thin-data / false-strong guards",
    "- Corpus leak / debug key scan",
    "- Evidence contract consistency",
    "- No-data subjects must not show weaknesses",
    "- Golden scenario expectations (see `lib/engine-truth-golden.mjs`)",
    "- **Scenario intent:** report included volume vs simulator (`minRetentionRatio`); per-subject/topic minimum questions; thin-data evidence cap; weak/strength signals; `expected.topWeaknessExpected` present in model",
    "",
  ];
  await writeFile(SUMMARY_MD, mdLines.join("\n"), "utf8");

  const cmpLines = [
    "# Scenario comparison (expected vs actual)",
    "",
    "| Scenario | Golden kind | Pass | Total Q | Diagnosed | Units | Actions (sample) |",
    "| --- | --- | --- | ---: | ---: | ---: | --- |",
  ];
  for (const c of comparisons) {
    const a = c.actual || {};
    const gk = c.kind || (ENGINE_GOLDEN_BY_SCENARIO_ID[c.scenarioId]?.kind ?? "—");
    cmpLines.push(
      `| ${c.scenarioId} | ${gk} | ${c.pass ? "yes" : "no"} | ${a.totalQuestions ?? "—"} | ${a.diagnosedCount ?? "—"} | ${a.unitCount ?? "—"} | ${(a.dominantActions || []).join(", ") || "—"} |`
    );
  }
  cmpLines.push(
    "",
    "## Golden expectation notes",
    "",
    "Row **Golden kind** maps to `ENGINE_GOLDEN_BY_SCENARIO_ID` / stress `engineTruthKind`. Full expected fields: `scripts/learning-simulator/lib/engine-truth-golden.mjs`.",
    ""
  );
  await writeFile(COMPARISON_MD, cmpLines.join("\n"), "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Engine truth audit: ${summaryPayload.overallPass}`);
  console.log(`  Summary: ${SUMMARY_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");

  process.exit(overallPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
