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
  questionMetadataSummary: join(ROOT, "reports", "question-metadata-qa", "summary.json"),
  adaptivePlannerArtifactSummary: join(ROOT, "reports", "adaptive-learning-planner", "artifact-summary.json"),
  parentNarrativeSafetyArtifacts: join(ROOT, "reports", "parent-report-narrative-safety-artifacts", "summary.json"),
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
  "questionMetadataSummary",
  "adaptivePlannerArtifactSummary",
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
  const buildStep = byId.build;
  /** Tri-state: true/false when a build step exists (full gate); null when absent (e.g. quick-only orchestrator artifact). */
  const buildPass = buildStep == null ? null : buildStep.pass === true;
  const apStep = byId.adaptivePlannerArtifacts;
  const adaptivePlannerArtifactsPass = apStep == null ? null : apStep.pass === true;
  return {
    overallPass: orch?.pass === true,
    buildPass,
    renderReleaseGatePass: byId.renderReleaseGate?.pass === true,
    pdfExportGatePass: byId.pdfExportGate?.pass === true,
    deepPass: byId.deep?.pass === true,
    adaptivePlannerArtifactsPass,
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

  const qm = loaded.questionMetadataSummary;
  if (qm) {
    const g = qm.gate || {};
    const gd = g.gateDecision;
    const bc = Number(g.blockingIssueCount ?? 0);
    const so = g.scanOutcome;
    if (gd === "fail_blocking_metadata" || bc > 0) {
      failures.push(
        `Question metadata blocking gate: gateDecision=${gd}, blockingIssueCount=${bc} — see reports/question-metadata-qa/summary.md`
      );
    }
    if (so && so !== "ok") {
      failures.push(`Question metadata scanOutcome=${so} (parser/load failure or empty corpus)`);
    }
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
  /** Stale run-summary may reflect a prior failed step (e.g. engine layer gates fixed since). Ignore pass:false when the recorded failure is this script or an engine-layer step that was re-run. */
  const ignorableOrchestratorFailedStepIds = new Set([
    "releaseReadinessSummary",
    "engineCompletionSummary",
    "diagnosticFramework",
    "frameworkRealScenarios",
  ]);
  if (
    orch &&
    orch.pass !== true &&
    !ignorableOrchestratorFailedStepIds.has(orch.failedStep?.id)
  ) {
    failures.push("Orchestrator run-summary reports pass: false");
  }
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

  const questionMetadataGateSummary = qm
    ? {
        gateDecision: qm.gate?.gateDecision,
        scanOutcome: qm.gate?.scanOutcome,
        blockingIssueCount: qm.gate?.blockingIssueCount ?? 0,
        advisoryIssueCount: qm.gate?.advisoryIssueCount ?? 0,
        exemptedIssueCount: qm.gate?.exemptedIssueCount ?? 0,
        highRiskCount: qm.totals?.highRiskCount,
        summaryMdPath: "reports/question-metadata-qa/summary.md",
        knownExemptions: qm.gate?.knownExemptions?.catalog || [],
      }
    : null;

  if (qm && qm.gate?.gateDecision === "pass_with_advisory") {
    warnings.push(
      `Question metadata: pass_with_advisory — advisoryIssueCount=${qm.gate?.advisoryIssueCount ?? 0}, highRiskCount=${qm.totals?.highRiskCount ?? "n/a"}`
    );
  }

  const apArt = loaded.adaptivePlannerArtifactSummary;
  const adaptivePlannerSummary = apArt
    ? {
        plannerRuns: apArt.plannerInputsBuilt ?? apArt.candidatePayloads,
        safetyViolationCount: Number(apArt.safetyViolationCount ?? 0),
        inputsWithAvailableMetadata: apArt.inputsWithAvailableMetadata,
        availableQuestionMetadataMissing: apArt.afterAvailableQuestionMetadataMissingCount,
        metadataSubjectFallbackCount: apArt.metadataSubjectFallbackCount,
        metadataIndexSource: apArt.metadataIndexSource,
        englishSkillTaggingIncompleteCount: apArt.englishSkillTaggingIncompleteCount,
        needsHumanReviewCount: apArt.needsHumanReviewCount,
        byPlannerStatus: apArt.byPlannerStatus || {},
        byNextAction: apArt.byNextAction || {},
        summaryMdPath: "reports/adaptive-learning-planner/artifact-summary.md",
        summaryJsonPath: "reports/adaptive-learning-planner/artifact-summary.json",
      }
    : null;

  if (apArt && Number(apArt.safetyViolationCount ?? 0) > 0) {
    failures.push(
      `Adaptive planner artifacts: safetyViolationCount=${apArt.safetyViolationCount} — see reports/adaptive-learning-planner/artifact-summary.md`
    );
  }
  if (orchSum.adaptivePlannerArtifactsPass === false) {
    failures.push("Orchestrator adaptivePlannerArtifacts step did not pass (see orchestrator/run-summary.json)");
  }

  if (apArt) {
    const miss = Number(apArt.afterAvailableQuestionMetadataMissingCount ?? 0);
    const fb = Number(apArt.metadataSubjectFallbackCount ?? 0);
    const en = Number(apArt.englishSkillTaggingIncompleteCount ?? 0);
    const hr = Number(apArt.needsHumanReviewCount ?? 0);
    if (miss > 0) warnings.push(`Adaptive planner: availableQuestionMetadata_missing (after index)=${miss}`);
    if (fb > 0) warnings.push(`Adaptive planner: metadataSubjectFallbackCount=${fb}`);
    if (en > 0) warnings.push(`Adaptive planner: englishSkillTaggingIncompleteCount=${en}`);
    if (hr > 0) warnings.push(`Adaptive planner: needs_human_review outputs=${hr}`);
  }

  const gateStatus = {
    questionMetadata: qm
      ? qm.gate?.gateDecision === "fail_blocking_metadata" || (qm.gate?.blockingIssueCount ?? 0) > 0 || qm.gate?.scanOutcome !== "ok"
        ? "fail"
        : qm.gate?.gateDecision === "pass_with_advisory"
          ? "warn"
          : "pass"
      : "missing",
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
    adaptivePlanner: apArt
      ? Number(apArt.safetyViolationCount ?? 0) > 0
        ? "fail"
        : Number(apArt.afterAvailableQuestionMetadataMissingCount ?? 0) > 0 ||
            Number(apArt.metadataSubjectFallbackCount ?? 0) > 0 ||
            Number(apArt.englishSkillTaggingIncompleteCount ?? 0) > 0 ||
            Number(apArt.needsHumanReviewCount ?? 0) > 0
          ? "warn"
          : "pass"
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

  const pns = loaded.parentNarrativeSafetyArtifacts;
  const parentNarrativeSafetySummary = pns
    ? {
        status: pns.status,
        narrativesChecked: pns.narrativesChecked,
        artifactFileCount: pns.artifactFileCount,
        blockCount: pns.blockCount,
        warningCount: pns.warningCount,
        infoCautionCount: pns.infoCautionCount,
        cleanPassCount: pns.cleanPassCount,
        passTotalCount: pns.passTotalCount,
        topIssueCodes: Array.isArray(pns.topIssueCodes) ? pns.topIssueCodes.slice(0, 12) : [],
        summaryMdPath: "reports/parent-report-narrative-safety-artifacts/summary.md",
      }
    : null;

  if (pns && Number(pns.blockCount) > 0) {
    failures.push(
      `Parent narrative safety: blockCount=${pns.blockCount} — see reports/parent-report-narrative-safety-artifacts/summary.md`
    );
  }
  if (pns && pns.status === "no_artifacts_found") {
    failures.push(
      "Parent narrative safety: no_artifacts_found — no JSON matched configured artifact paths (full QA not ready)"
    );
  }

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
  const buildStatus =
    orchSum.buildPass === true ? "pass" : orchSum.buildPass === false ? "fail" : orch ? "skipped" : "unknown";

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
    parentNarrativeSafetySummary,
    adaptivePlannerSummary,
    questionMetadataGateSummary,
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
    "### Question metadata gate (static banks)",
    "",
    questionMetadataGateSummary
      ? [
          `| Field | Value |`,
          `| --- | --- |`,
          `| gateDecision | ${mdEscape(questionMetadataGateSummary.gateDecision)} |`,
          `| scanOutcome | ${mdEscape(questionMetadataGateSummary.scanOutcome)} |`,
          `| blockingIssueCount | ${questionMetadataGateSummary.blockingIssueCount} |`,
          `| advisoryIssueCount | ${questionMetadataGateSummary.advisoryIssueCount} |`,
          `| exemptedIssueCount | ${questionMetadataGateSummary.exemptedIssueCount} |`,
          `| highRiskCount | ${questionMetadataGateSummary.highRiskCount ?? "—"} |`,
          `| human report | \`${mdEscape(questionMetadataGateSummary.summaryMdPath)}\` |`,
          "",
        ].join("\n")
      : "_Missing `reports/question-metadata-qa/summary.json` — run `npm run qa:question-metadata` (full orchestrator includes this step)._",
    "",
    "### Adaptive planner (artifacts — non-live)",
    "",
    adaptivePlannerSummary
      ? [
          `| Field | Value |`,
          `| --- | --- |`,
          `| planner runs | ${adaptivePlannerSummary.plannerRuns ?? "—"} |`,
          `| safetyViolationCount | ${adaptivePlannerSummary.safetyViolationCount} |`,
          `| inputsWithAvailableMetadata | ${adaptivePlannerSummary.inputsWithAvailableMetadata ?? "—"} |`,
          `| availableQuestionMetadata_missing (after index) | ${adaptivePlannerSummary.availableQuestionMetadataMissing ?? "—"} |`,
          `| metadataSubjectFallbackCount | ${adaptivePlannerSummary.metadataSubjectFallbackCount ?? "—"} |`,
          `| englishSkillTaggingIncompleteCount | ${adaptivePlannerSummary.englishSkillTaggingIncompleteCount ?? "—"} |`,
          `| needs_human_review outputs | ${adaptivePlannerSummary.needsHumanReviewCount ?? "—"} |`,
          `| metadata index source | ${mdEscape(adaptivePlannerSummary.metadataIndexSource || "—")} |`,
          `| human report | \`${mdEscape(adaptivePlannerSummary.summaryMdPath)}\` |`,
          "",
          "**plannerStatus:** " +
            mdEscape(JSON.stringify(adaptivePlannerSummary.byPlannerStatus || {})),
          "",
          "**nextAction:** " + mdEscape(JSON.stringify(adaptivePlannerSummary.byNextAction || {})),
          "",
          "*Release fails if `safetyViolationCount > 0` or the orchestrator adaptive-planner step failed. Other rows are advisory until diagnostic units carry bank-aligned skill ids.*",
          "",
        ].join("\n")
      : "_Missing `reports/adaptive-learning-planner/artifact-summary.json` — run full QA (includes `test:adaptive-planner:artifacts`)._",
    "",
    "### Simulator gates",
    "",
    `| Gate | Status |`,
    `| --- | --- |`,
    `| question metadata | ${mdEscape(gateStatus.questionMetadata)} |`,
    `| adaptive planner artifacts | ${mdEscape(gateStatus.adaptivePlanner)} |`,
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
    "### Parent narrative safety (artifacts)",
    "",
    parentNarrativeSafetySummary
      ? [
          `| Field | Value |`,
          `| --- | --- |`,
          `| status | ${mdEscape(parentNarrativeSafetySummary.status)} |`,
          `| narrativesChecked | ${parentNarrativeSafetySummary.narrativesChecked ?? "—"} |`,
          `| artifactFileCount | ${parentNarrativeSafetySummary.artifactFileCount ?? "—"} |`,
          `| blockCount | ${parentNarrativeSafetySummary.blockCount ?? "—"} |`,
          `| warningCount | ${parentNarrativeSafetySummary.warningCount ?? "—"} |`,
          `| infoCautionCount | ${parentNarrativeSafetySummary.infoCautionCount ?? "—"} |`,
          `| human report | \`${mdEscape(parentNarrativeSafetySummary.summaryMdPath)}\` |`,
          "",
          parentNarrativeSafetySummary.topIssueCodes?.length
            ? `Top warning codes: ${parentNarrativeSafetySummary.topIssueCodes.map((r) => (Array.isArray(r) ? r.join(":") : r)).join(", ")}`
            : "",
          "",
        ].join("\n")
      : "*(parent-report-narrative-safety-artifacts/summary.json not found — run full QA or `npm run test:parent-report-narrative-safety-artifacts`)*",
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
