#!/usr/bin/env node
/**
 * Master Learning Simulator release readiness summary (reads existing QA artifacts only).
 * npm run qa:learning-simulator:release-summary
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const LS = join(ROOT, "reports", "learning-simulator");
const OUT_JSON = join(LS, "release-readiness-summary.json");
const OUT_MD = join(LS, "release-readiness-summary.md");

const PATHS = {
  coverageCatalog: join(LS, "coverage-catalog.json"),
  unsupportedCells: join(LS, "unsupported-cells.json"),
  contentGapAudit: join(LS, "content-gap-audit.json"),
  contentGapBacklog: join(LS, "content-gap-backlog.json"),
  matrixSmoke: join(LS, "matrix-smoke.json"),
  criticalMatrixDeep: join(LS, "critical-matrix-deep.json"),
  profileStress: join(LS, "profile-stress.json"),
  paceOracle: join(LS, "pace-profile-oracle-audit.json"),
  renderGate: join(LS, "render-release-gate.json"),
  pdfExportGate: join(LS, "pdf-export-gate.json"),
  pdfExportAudit: join(LS, "pdf-export-audit.json"),
  scenarioCoverage: join(LS, "scenario-coverage.json"),
  orchestratorSummary: join(LS, "orchestrator", "run-summary.json"),
};

/** Core artifacts — missing => runner fails */
const REQUIRED_CORE = ["coverageCatalog", "scenarioCoverage", "orchestratorSummary"];

/** Expected after full QA — missing => fail (inconsistent state) */
const STRONGLY_EXPECTED = [
  "unsupportedCells",
  "contentGapAudit",
  "contentGapBacklog",
  "matrixSmoke",
  "criticalMatrixDeep",
  "profileStress",
  "paceOracle",
  "renderGate",
  "pdfExportGate",
];

async function readJsonSafe(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

function countCatalogByStatus(rows) {
  const m = {};
  for (const r of rows || []) {
    const s = r.coverageStatus || "unknown";
    m[s] = (m[s] || 0) + 1;
  }
  return m;
}

function summarizeOrchestratorSteps(orch) {
  const steps = orch?.steps || [];
  const byId = Object.fromEntries(steps.map((s) => [s.id, s]));
  return {
    overallPass: orch?.pass === true,
    buildPass: byId.build?.pass === true,
    renderReleaseGatePass: byId.renderReleaseGate?.pass === true,
    pdfExportGatePass: byId.pdfExportGate?.pass === true,
    deepPass: byId.deep?.pass === true,
    stepIds: steps.map((s) => s.id),
  };
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(LS, { recursive: true });

  const runId = `release-summary-${Date.now().toString(36)}`;
  const generatedAt = new Date().toISOString();

  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const warnings = [];

  const loaded = {};
  for (const [key, p] of Object.entries(PATHS)) {
    loaded[key] = await readJsonSafe(p);
  }

  for (const key of REQUIRED_CORE) {
    if (!loaded[key]) failures.push(`Missing required artifact: ${PATHS[key]}`);
  }

  for (const key of STRONGLY_EXPECTED) {
    if (!loaded[key]) failures.push(`Missing expected QA artifact: ${PATHS[key]}`);
  }

  const catalog = loaded.coverageCatalog;
  const rows = catalog?.rows || [];
  const statusFromRows = countCatalogByStatus(rows);
  const matrixRows = catalog?.counts?.matrixRows ?? rows.length ?? 0;

  const uncovered =
    statusFromRows.uncovered ??
    rows.filter((r) => r.coverageStatus === "uncovered").length;
  const unknownCells =
    statusFromRows.unknown_needs_review ??
    rows.filter((r) => r.coverageStatus === "unknown_needs_review").length;

  const unsupported = loaded.unsupportedCells;
  const unknownClassification = unsupported?.counts?.unknownClassification ?? 0;
  const uncoveredFromUnsupported = unsupported?.counts?.uncoveredCoverageStatus ?? 0;

  if (uncovered > 0) failures.push(`Coverage catalog has uncovered cells: ${uncovered}`);
  if (unknownCells > 0) failures.push(`Coverage catalog has unknown_needs_review cells: ${unknownCells}`);
  if (unknownClassification > 0) failures.push(`Unsupported cells report unknown_needs_review: ${unknownClassification}`);
  if (uncoveredFromUnsupported > 0) failures.push(`Unsupported cells uncoveredCoverageStatus: ${uncoveredFromUnsupported}`);

  const orch = loaded.orchestratorSummary;
  const orchSum = summarizeOrchestratorSteps(orch);
  if (orch && orch.pass !== true) failures.push("Orchestrator run-summary reports pass: false");
  if (orch && orchSum.buildPass === false) failures.push("Orchestrator build step did not pass");

  const matrixSmoke = loaded.matrixSmoke;
  const msFailures = matrixSmoke?.failures?.length ?? -1;
  if (matrixSmoke && msFailures !== 0) failures.push(`Matrix smoke failures: ${matrixSmoke.failures?.length ?? "unknown"}`);

  const criticalDeep = loaded.criticalMatrixDeep;
  if (criticalDeep && (criticalDeep.failures?.length ?? 0) > 0) {
    failures.push(`Critical matrix deep failures: ${criticalDeep.failures.length}`);
  }

  const profileStress = loaded.profileStress;
  if (profileStress && (profileStress.failures?.length ?? 0) > 0) {
    failures.push(`Profile stress failures: ${profileStress.failures.length}`);
  }

  const pace = loaded.paceOracle;
  const paceOk = pace?.cohortAssertions?.pace_accuracy_separation_ok === true;
  if (pace && !paceOk) failures.push("Pace profile oracle cohortAssertions.pace_accuracy_separation_ok is not true");

  const render = loaded.renderGate;
  if (render) {
    const cf = render.checksFailed ?? 0;
    const fe = render.fatalErrorsTotal ?? 0;
    if (cf > 0 || fe > 0) failures.push(`Render release gate: checksFailed=${cf}, fatalErrorsTotal=${fe}`);
  }

  const pdfGate = loaded.pdfExportGate;
  if (pdfGate && pdfGate.status === "fail") {
    failures.push(
      `PDF export gate failed: ${(pdfGate.failures || []).slice(0, 3).join("; ") || "see pdf-export-gate.json"}`
    );
  }

  const backlog = loaded.contentGapBacklog;
  const backlogTotal = backlog?.totalBacklogItems ?? 0;

  const gateStatus = {
    orchestrator: orch?.pass === true ? "pass" : orch ? "fail" : "unknown",
    matrixSmoke: matrixSmoke && msFailures === 0 ? "pass" : matrixSmoke ? "fail" : "missing",
    criticalDeep:
      criticalDeep && (criticalDeep.failures?.length ?? 0) === 0 ? "pass" : criticalDeep ? "fail" : "missing",
    profileStress:
      profileStress && (profileStress.failures?.length ?? 0) === 0 ? "pass" : profileStress ? "fail" : "missing",
    paceOracle: pace ? (paceOk ? "pass" : "fail") : "missing",
    scenarioCoverage: loaded.scenarioCoverage ? "pass" : "missing",
    renderGate:
      render && (render.checksFailed ?? 0) === 0 && (render.fatalErrorsTotal ?? 0) === 0 ? "pass" : render ? "fail" : "missing",
    pdfExportGate: pdfGate
      ? pdfGate.status === "pass"
        ? "pass"
        : pdfGate.status === "deferred"
          ? "deferred"
          : "fail"
      : "missing",
  };

  const coverageSummary = {
    totalCells: matrixRows,
    statusCounts: catalog?.counts?.statusCounts || {},
    statusCountsFromRows: statusFromRows,
    sampled: statusFromRows.sampled ?? 0,
    uncovered,
    unknown_needs_review: unknownCells,
    note: "Counts align with coverage-catalog rows and counts.statusCounts where present.",
  };

  const unsupportedSummary = unsupported
    ? {
        needsAttentionTotal: unsupported.counts?.needsAttentionTotal,
        uncoveredCoverageStatus: unsupported.counts?.uncoveredCoverageStatus,
        unknownClassification: unsupported.counts?.unknownClassification,
        byClassification: unsupported.counts?.byClassification || {},
      }
    : null;

  const contentBacklogSummary = backlog
    ? {
        totalItems: backlogTotal,
        bySubject: backlog.countsBySubject || {},
        byGrade: backlog.countsByGrade || {},
        byTopic: backlog.countsByTopic || {},
        byReleaseRisk: backlog.countsByReleaseRisk || {},
        note: "Documented content gaps — known backlog, not classification failures.",
      }
    : null;

  const matrixSmokeSummary = matrixSmoke
    ? {
        status: msFailures === 0 ? "pass" : "fail",
        totalSmokeScenarios: matrixSmoke.totalSmokeScenarios,
        totalCellsTouched: matrixSmoke.totalCellsTouched,
        failuresCount: matrixSmoke.failures?.length ?? 0,
      }
    : null;

  const criticalDeepSummary = criticalDeep
    ? {
        status: (criticalDeep.failures?.length ?? 0) === 0 ? "pass" : "fail",
        selectedCellsTotal: criticalDeep.selectedCellsTotal,
        scenarioCount: criticalDeep.scenarioCount,
        failuresCount: criticalDeep.failures?.length ?? 0,
      }
    : null;

  const profileStressSummary = profileStress
    ? {
        status: (profileStress.failures?.length ?? 0) === 0 ? "pass" : "fail",
        scenarioCount: profileStress.scenarioCount,
        profileTypesTested: profileStress.profileTypesTested?.length,
        failuresCount: profileStress.failures?.length ?? 0,
      }
    : null;

  const paceOracleSummary = pace
    ? {
        status: paceOk ? "pass" : "fail",
        pace_accuracy_separation_ok: paceOk,
        cohortMedianSpqGap: pace.cohortAssertions?.medianSpqGap,
        sourceRunId: pace.sourceRunId,
      }
    : null;

  const renderGateSummary = render
    ? {
        status:
          (render.checksFailed ?? 0) === 0 && (render.fatalErrorsTotal ?? 0) === 0 ? "pass" : "fail",
        browserMode: render.browserMode,
        checksTotal: render.checksTotal,
        checksPassed: render.checksPassed,
        checksFailed: render.checksFailed,
        consoleErrorsTotal: render.consoleErrorsTotal,
        fatalErrorsTotal: render.fatalErrorsTotal,
        deferredPdfExport:
          Array.isArray(render.deferredSurfaces) &&
          render.deferredSurfaces.some((d) => String(d.id || "").includes("pdf")),
      }
    : null;

  const pdfExportGateSummary = pdfGate
    ? {
        status: pdfGate.status,
        checkedRoute: pdfGate.checkedRoute,
        browserMode: pdfGate.browserMode,
        downloadSucceeded: pdfGate.downloadSucceeded,
        downloadPath: pdfGate.downloadPath,
        fileSizeBytes: pdfGate.fileSizeBytes,
        pdfHeaderOk: pdfGate.pdfHeaderOk,
        consoleErrorsTotal: pdfGate.consoleErrorsTotal,
        fatalErrorsTotal: pdfGate.fatalErrorsTotal,
        deferredReason: pdfGate.deferredReason,
        minPdfBytesThreshold: pdfGate.minPdfBytesThreshold,
      }
    : null;

  const pdfExportAuditSummary = loaded.pdfExportAudit
    ? {
        pdfLibraryDetected: loaded.pdfExportAudit.pdfLibraryDetected,
        exportIsClientSide: loaded.pdfExportAudit.exportIsClientSide,
        hasDedicatedPdfRoute: loaded.pdfExportAudit.hasDedicatedPdfRoute,
        generatedAt: loaded.pdfExportAudit.generatedAt,
      }
    : null;

  const scenarioCoverageSummary = loaded.scenarioCoverage
    ? {
        scenarios: loaded.scenarioCoverage.counts?.scenarios,
        generatedAt: loaded.scenarioCoverage.generatedAt,
      }
    : null;

  const deferredItems = {
    pdfBinaryExportInPage:
      pdfGate?.status === "pass"
        ? "Validated by pdf-export-gate (canvas download under ?qa_pdf=file)."
        : pdfGate?.status === "deferred"
          ? `PDF export gate deferred: ${pdfGate.deferredReason || "see pdf-export-gate.json"}.`
          : "See pdf-export-gate.json — client html2pdf path or gate failure.",
    optionalArtifactsMissing: STRONGLY_EXPECTED.filter((k) => !loaded[k]).map((k) => PATHS[k]),
  };

  const pdfGatePassed = pdfGate?.status === "pass";

  const knownRemainingWork = [
    {
      group: "content_backlog",
      detail: backlogTotal > 0 ? `${backlogTotal} tracked items in content-gap-backlog.json` : "none",
    },
    ...(pdfGatePassed
      ? []
      : [
          {
            group: "pdf_export_gate",
            detail:
              pdfGate?.status === "deferred"
                ? `Deferred: ${pdfGate?.deferredReason || "see pdf-export-gate.json"}`
                : pdfGate?.status === "fail"
                  ? "PDF export gate failed — see pdf-export-gate.json"
                  : "PDF export gate missing or not run — run qa:learning-simulator:pdf-export",
          },
        ]),
    {
      group: "optional_render_expansion",
      detail: "Additional routes/surfaces can be added to render gate without product changes",
    },
    {
      group: "optional_ci_runtime_optimization",
      detail: "Use RENDER_GATE_AUTO_SERVER=0 with dev server up to shorten CI wall time",
    },
  ];

  const blockingFailure = failures.length > 0;
  const buildStatus = orchSum.buildPass ? "pass" : orch ? "fail" : "unknown";

  let overallStatus = "pass";
  let releaseDecision = "ready_for_next_dev_phase";

  if (blockingFailure) {
    overallStatus = "fail";
    releaseDecision = "blocked";
  } else if (backlogTotal > 0 || (statusFromRows.unsupported_needs_content ?? 0) > 0) {
    overallStatus = "pass_with_known_backlog";
    releaseDecision = "ready_except_content_backlog";
  }

  const payload = {
    runId,
    generatedAt,
    overallStatus,
    gateStatus,
    buildStatus,
    coverageSummary,
    unsupportedSummary,
    contentBacklogSummary,
    matrixSmokeSummary,
    criticalDeepSummary,
    profileStressSummary,
    paceOracleSummary,
    renderGateSummary,
    pdfExportGateSummary,
    pdfExportAuditSummary,
    scenarioCoverageSummary,
    deferredItems,
    knownRemainingWork,
    releaseDecision,
    failures,
    warnings,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Learning Simulator — Release readiness summary",
    "",
    `- **runId:** ${runId}`,
    `- **generatedAt:** ${generatedAt}`,
    "",
    "## Overall",
    "",
    `| Field | Value |`,
    `| --- | --- |`,
    `| **overallStatus** | ${mdEscape(overallStatus)} |`,
    `| **releaseDecision** | ${mdEscape(releaseDecision)} |`,
    `| **buildStatus** (from orchestrator) | ${mdEscape(buildStatus)} |`,
    `| **orchestrator pass** | ${orch?.pass === true ? "yes" : "no"} |`,
    "",
    "### Coverage (catalog)",
    "",
    `| Metric | Count |`,
    `| --- | ---: |`,
    `| total cells | ${coverageSummary.totalCells} |`,
    `| covered | ${coverageSummary.statusCounts.covered ?? statusFromRows.covered ?? "—"} |`,
    `| unsupported_expected | ${coverageSummary.statusCounts.unsupported_expected ?? statusFromRows.unsupported_expected ?? "—"} |`,
    `| unsupported_needs_content | ${coverageSummary.statusCounts.unsupported_needs_content ?? statusFromRows.unsupported_needs_content ?? "—"} |`,
    `| sampled | ${coverageSummary.sampled} |`,
    `| uncovered | ${uncovered} |`,
    `| unknown_needs_review (catalog rows) | ${unknownCells} |`,
    "",
    "### Content backlog",
    "",
    backlog
      ? [
          `**Total backlog items:** ${backlogTotal}`,
          "",
          "*פירוט לפי נושא / כיתה / נושא מטריצה / סיכון שחרור — ראה JSON (`countsBySubject`, …).*",
          "",
        ].join("\n")
      : "(no backlog file)",
    "",
    "### Simulator gates",
    "",
    `| Gate | Status |`,
    `| --- | --- |`,
    `| matrix smoke | ${mdEscape(matrixSmokeSummary?.status || "—")} |`,
    `| critical deep | ${mdEscape(criticalDeepSummary?.status || "—")} |`,
    `| profile stress | ${mdEscape(profileStressSummary?.status || "—")} |`,
    `| pace oracle | ${mdEscape(paceOracleSummary?.status || "—")} |`,
    `| scenario coverage | ${loaded.scenarioCoverage ? "present" : "missing"} |`,
    `| pdf export | ${mdEscape(gateStatus.pdfExportGate)} |`,
    "",
    "### Render gate",
    "",
    render
      ? [
          `| Field | Value |`,
          `| --- | --- |`,
          `| browserMode | ${render.browserMode} |`,
          `| checks passed / total | ${render.checksPassed} / ${render.checksTotal} |`,
          `| consoleErrorsTotal | ${render.consoleErrorsTotal} |`,
          `| fatalErrorsTotal | ${render.fatalErrorsTotal} |`,
          `| PDF/export (render gate doc) | deferred surfaces / informational |`,
          "",
        ].join("\n")
      : "(missing render-release-gate.json)",
    "",
    "### PDF export gate",
    "",
    pdfGate
      ? [
          `| Field | Value |`,
          `| --- | --- |`,
          `| status | ${mdEscape(pdfGate.status)} |`,
          `| checkedRoute | ${mdEscape(pdfGate.checkedRoute)} |`,
          `| downloadSucceeded | ${pdfGate.downloadSucceeded} |`,
          `| fileSizeBytes | ${pdfGate.fileSizeBytes ?? "—"} |`,
          `| pdfHeaderOk | ${pdfGate.pdfHeaderOk ?? "—"} |`,
          `| deferredReason | ${mdEscape(pdfGate.deferredReason || "—")} |`,
          "",
        ].join("\n")
      : "(missing pdf-export-gate.json)",
    "",
    "### Known remaining work (groups)",
    "",
    ...knownRemainingWork.map((w) => `- **${w.group}:** ${mdEscape(w.detail)}`),
    "",
    "### failures / warnings",
    "",
    failures.length ? failures.map((f) => `- **failure:** ${mdEscape(f)}`).join("\n") : "- (none)",
    "",
    warnings.length ? warnings.map((w) => `- **warning:** ${mdEscape(w)}`).join("\n") : "",
    "",
    `Full JSON: \`${OUT_JSON.replace(/\\/g, "/")}\``,
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log(JSON.stringify({ ok: !blockingFailure, overallStatus, releaseDecision, outJson: OUT_JSON }, null, 2));
  process.exit(blockingFailure ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
