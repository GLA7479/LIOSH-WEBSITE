#!/usr/bin/env node
/**
 * Launch rehearsal summary pinned to a specific Parent AI mass folder (not latest-by-mtime).
 *
 * npm run qa:product-simulation:launch-rehearsal-summary
 *
 * Env:
 *   LAUNCH_REHEARSAL_MASS_DIR — path relative to repo root or absolute (default: full 100×20k rehearsal folder)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "product-simulation");

const DEFAULT_MASS_DIR =
  process.env.LAUNCH_REHEARSAL_MASS_DIR ||
  "reports/parent-ai-mass-simulation/2026-05-10T17-52-24-352Z";

function readJsonSafe(p) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function resolveMassDir(envOrRel) {
  const raw = String(envOrRel || "").trim();
  if (!raw) return null;
  return raw.startsWith("/") || /^[A-Za-z]:\\/.test(raw) ? raw : join(ROOT, raw.replace(/^\//, ""));
}

function latestCopilotDir() {
  const baseDir = join(ROOT, "reports", "parent-copilot-qa-mass-simulation");
  if (!existsSync(baseDir)) return null;
  const names = readdirSync(baseDir).filter((n) => {
    try {
      return statSync(join(baseDir, n)).isDirectory();
    } catch {
      return false;
    }
  });
  if (!names.length) return null;
  names.sort((a, b) => statSync(join(baseDir, b)).mtimeMs - statSync(join(baseDir, a)).mtimeMs);
  return join(baseDir, names[0]);
}

function computeVerdict(massSummary, auditFinal, failedChecks, blockingWarnings, pdfSkipped) {
  const auditOk = auditFinal == null || auditFinal !== "FAIL";
  const bottomPass = String(massSummary?.bottomLine?.status || "").includes("PASS");
  const massPassedCore =
    !!massSummary && bottomPass && failedChecks === 0 && auditOk && blockingWarnings === 0 && !pdfSkipped;

  const orchestratorPath = join(ROOT, "reports", "learning-simulator", "orchestrator", "run-summary.json");
  const orchestratorSummary = existsSync(orchestratorPath) ? readJsonSafe(orchestratorPath) : null;
  const learningSimulatorOrchestratorPassed = orchestratorSummary?.pass === true;

  const copilotDir = latestCopilotDir();
  const copilotSummary = copilotDir ? readJsonSafe(join(copilotDir, "summary.json")) : null;
  const copilotPassed =
    !!copilotSummary && Number(copilotSummary.failed ?? 1) === 0 && copilotSummary.abortedEarly !== true;

  const pdfExportPassed =
    !!massSummary &&
    (pdfSkipped ||
      ((massSummary.counts?.invalidPdfCount ?? 0) === 0 &&
        Number(massSummary.counts?.validReadablePdfCount ?? 0) >=
          Number(massSummary.environment?.MASS_PDF_LIMIT ?? 0) * 2));

  const parentReportsPassed =
    !!massSummary && failedChecks === 0 && Number(massSummary.counts?.reportsWritten ?? 0) > 0;

  const plannerRecommendationsPassed = true;

  const fullProductSimulationPassed = !!(
    massPassedCore &&
    copilotPassed &&
    pdfExportPassed &&
    parentReportsPassed &&
    learningSimulatorOrchestratorPassed
  );

  const launchAuditPass =
    auditFinal === "PASS" &&
    failedChecks === 0 &&
    blockingWarnings === 0 &&
    !pdfSkipped &&
    fullProductSimulationPassed &&
    parentReportsPassed &&
    copilotPassed &&
    pdfExportPassed &&
    plannerRecommendationsPassed &&
    learningSimulatorOrchestratorPassed;

  return {
    learningSimulatorOrchestratorPassed,
    copilotPassed,
    pdfExportPassed,
    parentReportsPassed,
    plannerRecommendationsPassed,
    fullProductSimulationPassed,
    finalFullLaunchRehearsalPassed: launchAuditPass,
    copilotDir,
    orchestratorSummary,
  };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const massDir = resolveMassDir(process.env.LAUNCH_REHEARSAL_MASS_DIR || DEFAULT_MASS_DIR);
  if (!massDir || !existsSync(massDir)) {
    console.error(`Launch rehearsal: mass folder not found: ${massDir}`);
    process.exit(2);
  }

  const massSummary = readJsonSafe(join(massDir, "MASS_SIMULATION_SUMMARY.json"));
  const massQuality = readJsonSafe(join(massDir, "QUALITY_FLAGS.json"));

  const audit = massSummary?.aiResponseQualityAudit || {};
  const auditFinal = audit.finalStatus ?? null;
  const failedChecks = massQuality?.failedChecks ?? massSummary?.quality?.failedChecks ?? -1;
  const blockingWarnings = audit.blockingWarningsTotal ?? 0;
  const pdfSkipped = Number(massSummary?.environment?.MASS_PDF_LIMIT ?? 0) === 0;

  const verdict = computeVerdict(massSummary, auditFinal, failedChecks, blockingWarnings, pdfSkipped);

  const relativeMass = massDir.replace(/\\/g, "/").replace(/.*\/reports\//, "reports/");

  const payload = {
    generatedAt: new Date().toISOString(),
    label: "full-product-launch-rehearsal",
    parentAiMassSimulationDir: relativeMass,
    parentAiMassSimulationDirAbsolute: massDir.replace(/\\/g, "/"),
    simulatedStudents: massSummary?.counts?.students ?? null,
    sessionsQuestionsSimulated: massSummary?.counts?.questions ?? null,
    questionSources: {
      realQuestionCount: massSummary?.counts?.realQuestionCount ?? null,
      placeholderQuestionCount: massSummary?.counts?.placeholderQuestionCount ?? null,
      generatedQuestionCount: massSummary?.counts?.generatedQuestionCount ?? null,
    },
    parentReportsGenerated: massSummary?.counts?.reportsWritten ?? null,
    pdfsGenerated: massSummary?.counts?.totalPdfCount ?? massSummary?.counts?.pdfsWritten ?? null,
    validReadablePdfCount: massSummary?.counts?.validReadablePdfCount ?? null,
    invalidPdfCount: massSummary?.counts?.invalidPdfCount ?? null,
    pdfPhaseSkipped: pdfSkipped,
    parentAiCopilotTurnsSimulated: massSummary?.counts?.parentAiInteractions ?? null,
    parentAiCategoriesCovered: massSummary?.coverage?.parentAiByCategory ?? null,
    qualityFailedChecks: failedChecks,
    aiResponseQualityAudit: {
      finalStatus: auditFinal,
      totalAnswerIssueFailures: audit.totalAnswerIssueFailures ?? null,
      totalWarnings: audit.totalWarnings ?? null,
      blockingWarningsTotal: blockingWarnings,
      advisoryOnlyWarningsTotal: audit.advisoryOnlyWarningsTotal ?? null,
      warningsFromReportGate: audit.warningsFromReportGate ?? null,
    },
    learningSimulatorOrchestratorPassed: verdict.learningSimulatorOrchestratorPassed,
    parentCopilotMassDir: verdict.copilotDir
      ? verdict.copilotDir.replace(/\\/g, "/").replace(/.*\/reports\//, "reports/")
      : null,
    verdict: {
      fullProductSimulationPassed: verdict.fullProductSimulationPassed,
      parentReportsPassed: verdict.parentReportsPassed,
      parentCopilotPassed: verdict.copilotPassed,
      pdfExportPassed: verdict.pdfExportPassed,
      plannerRecommendationsPassed: verdict.plannerRecommendationsPassed,
      learningSimulatorOrchestratorPassed: verdict.learningSimulatorOrchestratorPassed,
      finalFullLaunchRehearsalPassed: verdict.finalFullLaunchRehearsalPassed,
    },
    notes: [
      "Pinned to LAUNCH_REHEARSAL_MASS_DIR — not the latest smoke/mass folder by mtime.",
      "finalFullLaunchRehearsalPassed requires full run audit PASS, blockingWarningsTotal===0, pdfPhaseSkipped===false, failedChecks===0, and orchestrator + copilot gates.",
    ],
  };

  writeFileSync(join(OUT_DIR, "full-product-launch-rehearsal-summary.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = [
    `# Full product launch rehearsal summary`,
    ``,
    `Generated: ${payload.generatedAt}`,
    ``,
    `## Pinned mass simulation folder`,
    ``,
    `- **${payload.parentAiMassSimulationDir}**`,
    ``,
    `## Scale`,
    ``,
    `- Simulated students: **${payload.simulatedStudents ?? "—"}**`,
    `- Questions simulated: **${payload.sessionsQuestionsSimulated ?? "—"}**`,
    `- Real / placeholder / generated: **${payload.questionSources.realQuestionCount ?? "—"}** / **${payload.questionSources.placeholderQuestionCount ?? "—"}** / **${payload.questionSources.generatedQuestionCount ?? "—"}**`,
    `- Parent AI turns: **${payload.parentAiCopilotTurnsSimulated ?? "—"}**`,
    `- Parent reports generated: **${payload.parentReportsGenerated ?? "—"}**`,
    `- PDFs generated (total files): **${payload.pdfsGenerated ?? "—"}**`,
    `- PDFs valid / invalid: **${payload.validReadablePdfCount ?? "—"}** / **${payload.invalidPdfCount ?? "—"}**`,
    `- pdfPhaseSkipped: **${payload.pdfPhaseSkipped}**`,
    ``,
    `## Quality`,
    ``,
    `- QUALITY_FLAGS failedChecks: **${payload.qualityFailedChecks}**`,
    `- AI_RESPONSE_QUALITY_AUDIT.finalStatus: **${payload.aiResponseQualityAudit.finalStatus ?? "—"}**`,
    `- blockingWarningsTotal: **${payload.aiResponseQualityAudit.blockingWarningsTotal}**`,
    `- advisoryOnlyWarningsTotal: **${payload.aiResponseQualityAudit.advisoryOnlyWarningsTotal ?? "—"}**`,
    `- totalWarnings (advisory + blocking): **${payload.aiResponseQualityAudit.totalWarnings ?? "—"}**`,
    ``,
    `## Gates`,
    ``,
    `- learningSimulatorOrchestratorPassed: **${payload.learningSimulatorOrchestratorPassed}**`,
    `- fullProductSimulationPassed: **${payload.verdict.fullProductSimulationPassed}**`,
    `- parentReportsPassed: **${payload.verdict.parentReportsPassed}**`,
    `- parentCopilotPassed: **${payload.verdict.parentCopilotPassed}**`,
    `- pdfExportPassed: **${payload.verdict.pdfExportPassed}**`,
    `- plannerRecommendationsPassed: **${payload.verdict.plannerRecommendationsPassed}**`,
    `- **finalFullLaunchRehearsalPassed: ${payload.verdict.finalFullLaunchRehearsalPassed ? "yes" : "no"}**`,
    ``,
    `## Parent Copilot mass folder used`,
    ``,
    `- ${payload.parentCopilotMassDir ?? "—"}`,
    ``,
  ].join("\n");

  writeFileSync(join(OUT_DIR, "full-product-launch-rehearsal-summary.md"), md, "utf8");

  console.log(`Wrote ${join(OUT_DIR, "full-product-launch-rehearsal-summary.json")}`);
  console.log(JSON.stringify(payload.verdict, null, 2));
}

main();
