#!/usr/bin/env node
/**
 * Re-run AI_RESPONSE_QUALITY_AUDIT (+ QUALITY_FLAGS warnings / MASS_SIMULATION_SUMMARY audit slice)
 * on an existing mass simulation output folder — no question simulation, no PDF regeneration.
 *
 * Usage:
 *   npx tsx scripts/parent-ai-mass-simulation/re-audit-mass-simulation-output.mjs --dir reports/parent-ai-mass-simulation/<timestamp>
 *   $env:MASS_REAUDIT_DIR="reports/parent-ai-mass-simulation/2026-05-10T17-52-24-352Z"; npm run qa:parent-ai:re-audit-mass-output
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  runAiResponseQualityAudit,
  writeAiResponseQualityAuditCsv,
  writeAiResponseQualityAuditMarkdown,
} from "./lib/ai-response-quality-audit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");

function parseArgs(argv) {
  let dir = process.env.MASS_REAUDIT_DIR || "";
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--dir" && argv[i + 1]) {
      dir = argv[++i];
    } else if (!String(argv[i] || "").startsWith("-") && !dir) {
      dir = argv[i];
    }
  }
  return { dir: String(dir || "").trim() };
}

function loadGlobalInteractions(outputRoot) {
  const chatsDir = path.join(outputRoot, "parent-ai-chats");
  if (!fs.existsSync(chatsDir)) throw new Error(`Missing parent-ai-chats: ${chatsDir}`);
  const rows = [];
  for (const name of fs.readdirSync(chatsDir)) {
    if (!name.endsWith(".json")) continue;
    const raw = fs.readFileSync(path.join(chatsDir, name), "utf8");
    const j = JSON.parse(raw);
    for (const t of j.turns || []) rows.push(t);
  }
  return rows;
}

async function main() {
  const { dir } = parseArgs(process.argv);
  if (!dir) {
    console.error("Usage: --dir <path-to-mass-output> or set MASS_REAUDIT_DIR");
    process.exit(2);
  }

  const outputRoot = path.isAbsolute(dir) ? dir : path.join(ROOT, dir.replace(/^\//, ""));
  if (!fs.existsSync(outputRoot)) {
    console.error(`Output folder not found: ${outputRoot}`);
    process.exit(2);
  }

  const studentsPath = path.join(outputRoot, "STUDENTS_INDEX.json");
  if (!fs.existsSync(studentsPath)) {
    console.error(`Missing STUDENTS_INDEX.json under ${outputRoot}`);
    process.exit(2);
  }

  const studentsIndex = JSON.parse(fs.readFileSync(studentsPath, "utf8"));
  const students = studentsIndex.students || [];

  const summaryPath = path.join(outputRoot, "MASS_SIMULATION_SUMMARY.json");
  const massSummary = fs.existsSync(summaryPath)
    ? JSON.parse(fs.readFileSync(summaryPath, "utf8"))
    : {};
  const pdfLimit = Number(massSummary?.environment?.MASS_PDF_LIMIT ?? 0);

  const globalInteractions = loadGlobalInteractions(outputRoot);
  const reportStudentIds = new Set(students.map((s) => s.studentId));

  const auditResult = await runAiResponseQualityAudit({
    outputRoot,
    students,
    globalInteractions,
    reportStudentIds,
    pdfLimit,
  });

  const expectedAnswers = massSummary?.counts?.parentAiInteractions ?? globalInteractions.length;
  if ((auditResult.auditPayload.summary.totalAnswersScanned ?? 0) !== expectedAnswers) {
    console.warn(
      `[re-audit] totalAnswersScanned=${auditResult.auditPayload.summary.totalAnswersScanned} vs expected ${expectedAnswers}`,
    );
  }

  fs.writeFileSync(
    path.join(outputRoot, "AI_RESPONSE_QUALITY_AUDIT.json"),
    JSON.stringify(auditResult.auditPayload, null, 2),
    "utf8",
  );
  writeAiResponseQualityAuditMarkdown(outputRoot, auditResult.auditPayload);
  writeAiResponseQualityAuditCsv(outputRoot, auditResult.auditPayload);

  const qPath = path.join(outputRoot, "QUALITY_FLAGS.json");
  let qualityFlags = fs.existsSync(qPath)
    ? JSON.parse(fs.readFileSync(qPath, "utf8"))
    : { totalChecks: 0, failedChecks: 0, issues: [], warnings: [] };

  const gateWarnings = auditResult.gateIssues.filter((g) => g.level === "warning");

  qualityFlags.warnings = gateWarnings.map((g) => ({
    code: g.code,
    detail: g.detail,
    file: g.file,
  }));
  qualityFlags.warningCount = qualityFlags.warnings.length;

  qualityFlags.aiResponseQualityAudit = {
    finalStatus: auditResult.auditPayload.summary.finalStatus,
    gateFailures: auditResult.gateFailureCount,
    totalAnswerFailures: auditResult.auditPayload.summary.totalFailures,
    totalWarnings: auditResult.auditPayload.summary.totalWarnings,
    nonBlockingFormatWarnings: auditResult.auditPayload.summary.nonBlockingFormatWarnings ?? 0,
    blockingWarningsTotal: auditResult.auditPayload.summary.blockingWarningsTotal ?? 0,
    advisoryOnlyWarningsTotal: auditResult.auditPayload.summary.advisoryOnlyWarningsTotal ?? 0,
  };

  fs.writeFileSync(qPath, JSON.stringify(qualityFlags, null, 2), "utf8");

  fs.writeFileSync(
    path.join(outputRoot, "QUALITY_FLAGS.md"),
    [
      "# Quality flags (re-audit)",
      "",
      `- totalChecks: ${qualityFlags.totalChecks}`,
      `- failedChecks: ${qualityFlags.failedChecks}`,
      `- warnings: ${qualityFlags.warningCount}`,
      "",
      "## AI_RESPONSE_QUALITY_AUDIT (embedded)",
      "",
      `- finalStatus: **${qualityFlags.aiResponseQualityAudit.finalStatus}**`,
      `- blockingWarningsTotal: ${qualityFlags.aiResponseQualityAudit.blockingWarningsTotal}`,
      `- advisoryOnlyWarningsTotal: ${qualityFlags.aiResponseQualityAudit.advisoryOnlyWarningsTotal}`,
      "",
    ].join("\n"),
    "utf8",
  );

  if (fs.existsSync(summaryPath)) {
    massSummary.quality = massSummary.quality || {};
    massSummary.quality.warningCount = qualityFlags.warningCount;
    massSummary.aiResponseQualityAudit = {
      finalStatus: auditResult.auditPayload.summary.finalStatus,
      totalAnswerIssueFailures: auditResult.auditPayload.summary.totalFailures,
      gateFailureRows: auditResult.gateFailureCount,
      totalWarnings: auditResult.auditPayload.summary.totalWarnings,
      nonBlockingFormatWarnings: auditResult.auditPayload.summary.nonBlockingFormatWarnings ?? 0,
      blockingWarningsTotal: auditResult.auditPayload.summary.blockingWarningsTotal ?? 0,
      advisoryOnlyWarningsTotal: auditResult.auditPayload.summary.advisoryOnlyWarningsTotal ?? 0,
      warningsFromReportGate: auditResult.auditPayload.summary.warningsFromReportGate ?? 0,
    };
    massSummary.generatedAt = new Date().toISOString();
    massSummary.reauditNote =
      "AI_RESPONSE_QUALITY_AUDIT / QUALITY_FLAGS warnings refreshed via re-audit-mass-simulation-output.mjs (no full simulation rerun).";
    fs.writeFileSync(summaryPath, JSON.stringify(massSummary, null, 2), "utf8");
  }

  console.log(`re-audit OK ${outputRoot}`);
  console.log(JSON.stringify(auditResult.auditPayload.summary, null, 2));
  process.exit(auditResult.gateFailureCount > 0 || auditResult.auditPayload.summary.finalStatus === "FAIL" ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
