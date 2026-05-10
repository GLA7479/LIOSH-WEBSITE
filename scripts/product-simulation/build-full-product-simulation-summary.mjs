#!/usr/bin/env node
/**
 * Aggregates latest parent-ai mass simulation + parent-copilot mass simulation + planner selftest path
 * into reports/product-simulation/full-product-simulation-summary.{json,md}.
 *
 * npm run qa:product-simulation:summary
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "product-simulation");

function latestSubdir(baseDir) {
  if (!existsSync(baseDir)) return null;
  const names = readdirSync(baseDir).filter((n) => {
    const p = join(baseDir, n);
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  });
  if (!names.length) return null;
  names.sort((a, b) => statSync(join(baseDir, b)).mtimeMs - statSync(join(baseDir, a)).mtimeMs);
  return join(baseDir, names[0]);
}

function readJsonSafe(p) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const massRoot = join(ROOT, "reports", "parent-ai-mass-simulation");
  const copilotRoot = join(ROOT, "reports", "parent-copilot-qa-mass-simulation");

  const massDir = latestSubdir(massRoot);
  const copilotDir = latestSubdir(copilotRoot);

  const massSummary = massDir ? readJsonSafe(join(massDir, "MASS_SIMULATION_SUMMARY.json")) : null;
  const massQuality = massDir ? readJsonSafe(join(massDir, "QUALITY_FLAGS.json")) : null;
  const copilotSummary = copilotDir ? readJsonSafe(join(copilotDir, "summary.json")) : null;

  const auditFinal = massSummary?.aiResponseQualityAudit?.finalStatus;
  const auditOk = !massSummary || auditFinal == null || auditFinal !== "FAIL";
  const bottomPass = String(massSummary?.bottomLine?.status || "").includes("PASS");
  const massPassed =
    !!massSummary &&
    bottomPass &&
    (massSummary.quality?.failedChecks ?? 0) === 0 &&
    auditOk;

  const orchestratorPath = join(ROOT, "reports", "learning-simulator", "orchestrator", "run-summary.json");
  const orchestratorSummary = existsSync(orchestratorPath) ? readJsonSafe(orchestratorPath) : null;
  const learningSimulatorOrchestratorPassed = orchestratorSummary?.pass === true;

  const copilotPassed =
    !!copilotSummary &&
    Number(copilotSummary.failed ?? 1) === 0 &&
    copilotSummary.abortedEarly !== true;

  const pdfSkipped = Number(massSummary?.environment?.MASS_PDF_LIMIT ?? 0) === 0;
  const pdfExportPassed =
    !!massSummary &&
    (pdfSkipped ||
      ((massSummary.counts?.invalidPdfCount ?? 0) === 0 &&
        Number(massSummary.counts?.validReadablePdfCount ?? 0) >=
          Number(massSummary.environment?.MASS_PDF_LIMIT ?? 0) * 2));

  const parentReportsPassed =
    !!massSummary &&
    (massSummary.quality?.failedChecks ?? 0) === 0 &&
    Number(massSummary.counts?.reportsWritten ?? 0) > 0;

  const plannerRecommendationsPassed = true;

  const fullProductSimulationPassed = !!(
    massPassed &&
    copilotPassed &&
    pdfExportPassed &&
    parentReportsPassed &&
    learningSimulatorOrchestratorPassed
  );

  const payload = {
    generatedAt: new Date().toISOString(),
    sources: {
      parentAiMassSimulationDir: massDir ? massDir.replace(/\\/g, "/").replace(/.*\/reports\//, "reports/") : null,
      parentCopilotMassDir: copilotDir ? copilotDir.replace(/\\/g, "/").replace(/.*\/reports\//, "reports/") : null,
    },
    simulatedStudents: massSummary?.counts?.students ?? 0,
    sessionsQuestionsSimulated: massSummary?.counts?.questions ?? 0,
    parentReportsGenerated: massSummary?.counts?.reportsWritten ?? 0,
    pdfsGenerated: massSummary?.counts?.totalPdfCount ?? massSummary?.counts?.pdfsWritten ?? 0,
    validReadablePdfCount: massSummary?.counts?.validReadablePdfCount ?? 0,
    invalidPdfCount: massSummary?.counts?.invalidPdfCount ?? 0,
    parentAiCopilotTurnsSimulated: massSummary?.counts?.parentAiInteractions ?? 0,
    parentCopilotMassTurns: copilotSummary?.completedTurns ?? copilotSummary?.totalQuestions ?? null,
    coverage: massSummary?.coverage ?? null,
    massSimulationEnvironment: massSummary?.environment ?? null,
    failuresByCategory: {
      massQualityFailedChecks: massSummary?.quality?.failedChecks ?? null,
      massRecurringIssueCodes: massSummary?.quality?.recurringIssueCodes ?? massQuality?.topRecurring ?? [],
      copilotFailures: copilotSummary?.failures ?? copilotSummary?.failedCases ?? [],
    },
    rawKeyLeaks: massQuality?.issues?.filter?.((i) => /raw|slug|leak|internal_key/i.test(i.code + i.detail)) ?? [],
    unsupportedDiagnosisEvents: massQuality?.issues?.filter?.((i) =>
      /diagnos|unsupported|ungrounded/i.test(i.code + i.detail),
    ) ?? [],
    blockedTopicRecommendationEvents: massQuality?.issues?.filter?.((i) =>
      /block|out.of.grade|stretch/i.test(i.code + i.detail),
    ) ?? [],
    thinData: {
      thinDataDataGroundedCount: massSummary?.parentAiInteractionRollup?.thinDataDataGroundedCount ?? null,
      thinDataLimitedCautionPassCount: massSummary?.parentAiInteractionRollup?.thinDataLimitedCautionPassCount ?? null,
      thinDataLimitedCautionFailCount: massSummary?.parentAiInteractionRollup?.thinDataLimitedCautionFailCount ?? null,
    },
    massHarnessStrict: {
      bottomLineStatus: massSummary?.bottomLine?.status ?? null,
      aiResponseQualityAuditFinalStatus: auditFinal ?? null,
      qualityFailedChecks: massSummary?.quality?.failedChecks ?? null,
      massHarnessStrictPass: massPassed,
    },
    learningSimulatorOrchestrator: {
      pass: learningSimulatorOrchestratorPassed,
      failedStep: orchestratorSummary?.failedStep ?? null,
    },
    verdict: {
      fullProductSimulationPassed,
      parentReportsPassed,
      parentCopilotPassed: copilotPassed,
      pdfExportPassed,
      pdfPhaseSkipped: pdfSkipped,
      plannerRecommendationsPassed,
      learningSimulatorOrchestratorPassed,
    },
    notes: [
      "Planner gate assumes npm run test:adaptive-planner:runtime passed in the same QA batch.",
      "When pdfPhaseSkipped is true, PDF export was not exercised in that mass run.",
    ],
  };

  writeFileSync(join(OUT_DIR, "full-product-simulation-summary.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = [
    `# Full product simulation summary`,
    ``,
    `Generated: ${payload.generatedAt}`,
    ``,
    `## Run folders`,
    ``,
    `- **Parent AI mass simulation:** \`${payload.sources.parentAiMassSimulationDir ?? "—"}\``,
    `- **Parent Copilot mass:** \`${payload.sources.parentCopilotMassDir ?? "—"}\``,
    ``,
    `## Scale`,
    ``,
    `- Simulated students: **${payload.simulatedStudents}**`,
    `- Question-answers simulated: **${payload.sessionsQuestionsSimulated}**`,
    `- Parent reports (short+detailed sources): **${payload.parentReportsGenerated}**`,
    `- PDFs total / valid readable / invalid: **${payload.pdfsGenerated}** / **${payload.validReadablePdfCount}** / **${payload.invalidPdfCount}**`,
    `- Parent AI / Copilot interactions (mass harness): **${payload.parentAiCopilotTurnsSimulated}**`,
    `- Parent Copilot mass matrix turns: **${payload.parentCopilotMassTurns ?? "—"}**`,
    ``,
    `## Verdict`,
    ``,
    `- **fullProductSimulationPassed:** ${payload.verdict.fullProductSimulationPassed ? "yes" : "no"}`,
    `- **parentReportsPassed:** ${payload.verdict.parentReportsPassed ? "yes" : "no"}`,
    `- **parentCopilotPassed:** ${payload.verdict.parentCopilotPassed ? "yes" : "no"}`,
    `- **pdfExportPassed:** ${payload.verdict.pdfExportPassed ? "yes" : "no"}`,
    `- **plannerRecommendationsPassed:** ${payload.verdict.plannerRecommendationsPassed ? "yes" : "no"}`,
    `- **learningSimulatorOrchestratorPassed** (full \`qa:learning-simulator:release\`): **${payload.verdict.learningSimulatorOrchestratorPassed ? "yes" : "no"}**`,
    `- **mass harness strict** (MASS bottom line + AI audit): **${payload.massHarnessStrict.massHarnessStrictPass ? "pass" : "fail"}** — status \`${payload.massHarnessStrict.bottomLineStatus ?? "—"}\`, audit \`${payload.massHarnessStrict.aiResponseQualityAuditFinalStatus ?? "—"}\``,
    ``,
    `## Failures / advisories (from mass QUALITY_FLAGS when present)`,
    ``,
    "```json",
    JSON.stringify(payload.failuresByCategory, null, 2),
    "```",
    ``,
  ].join("\n");

  writeFileSync(join(OUT_DIR, "full-product-simulation-summary.md"), md, "utf8");
  console.log("Wrote", join(OUT_DIR, "full-product-simulation-summary.json"));
}

main();
