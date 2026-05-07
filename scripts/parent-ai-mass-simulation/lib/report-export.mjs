import fs from "node:fs";
import path from "node:path";
import { installBrowserGlobals } from "./browser-globals.mjs";
import { applyMassStudentSeed, buildMassStudentStorageSnapshot } from "./seed-engine.mjs";
import { exportProductParentReportPdfPack } from "./product-pdf-playwright.mjs";
import { writeStudentReportEvidence } from "./report-evidence-export.mjs";

function envCheckpointEvery() {
  const raw = process.env.MASS_RUN_CHECKPOINT_EVERY;
  if (raw === undefined || raw === "") return 5;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 1 ? n : 5;
}

/**
 * @param {string} outputRoot
 * @param {Record<string, unknown>} payload
 */
function writeRunProgress(outputRoot, payload) {
  fs.writeFileSync(
    path.join(outputRoot, "RUN_PROGRESS.json"),
    JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

function htmlToParentFacingLines(html) {
  const src = String(html || "");
  if (!src.trim()) return [];
  const noScripts = src
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const withBreaks = noScripts.replace(/<\/(p|div|li|tr|h1|h2|h3|h4|section|article)>/gi, "\n");
  const plain = withBreaks
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, "");
  return plain
    .split("\n")
    .map((x) => x.replace(/\s+/g, " ").trim())
    .filter((x) => x.length >= 2);
}

function execSummaryLines(detailed) {
  const es = detailed?.executiveSummary && typeof detailed.executiveSummary === "object" ? detailed.executiveSummary : {};
  const lines = [];
  const push = (label, v) => {
    if (v == null) return;
    if (typeof v === "string" && v.trim()) lines.push(`${label}: ${v.trim()}`);
    else if (Array.isArray(v)) v.forEach((x) => push(label, x));
  };
  push("מיקוד בית", es.homeFocusHe);
  push("מגמות", es.majorTrendsHe);
  push("זהירות", es.cautionNoteHe);
  push("ביטחון כולל", es.overallConfidenceHe);
  push("מוכנות דוח", es.reportReadinessHe);
  push("איזון ראיות", es.evidenceBalanceHe);
  push("אות מעורבב", es.mixedSignalNoticeHe);
  return lines;
}

function buildSubjectCardsSnapshot(detailed) {
  const cards = Array.isArray(detailed?.subjectCards) ? detailed.subjectCards : [];
  return cards.map((c) => ({
    subjectLabelHe: String(c?.subjectLabelHe || "").trim(),
    questionCount: Number(c?.questionCount) || 0,
    accuracy: Number(c?.accuracy) || 0,
    timeMinutes: Number(c?.timeMinutes) || 0,
  }));
}

function shortReportPayload(student, detailed, lines, shortHtmlLines, pdfMeta) {
  const overall = detailed?.overallSnapshot && typeof detailed.overallSnapshot === "object" ? detailed.overallSnapshot : {};
  const subjectCards = buildSubjectCardsSnapshot(detailed);
  return {
    studentId: student.studentId,
    grade: student.grade,
    profileType: student.profileType,
    reportDataAlignment: "product_payload_and_product_html",
    overallSnapshot: {
      totalQuestions: Number(overall.totalQuestions) || 0,
      totalTime: Number(overall.totalTime) || 0,
      overallAccuracy: Number(overall.overallAccuracy) || 0,
      periodLabelHe: String(overall.periodLabelHe || "").trim(),
    },
    subjectCards,
    executiveLines: shortHtmlLines.length ? shortHtmlLines.slice(0, 20) : lines,
    textSnapshotFromShortHtml: shortHtmlLines.slice(0, 60),
    evidenceSnippets: shortHtmlLines.slice(0, 20),
    recommendations: lines.filter((l) => /תרגול|בית|שבוע|מיקוד|צעדי/i.test(l)).slice(0, 8),
    cautionThinData: student.profileType === "thin_data" || (Number(overall.totalQuestions) || 0) <= 12,
    pdfExport: pdfMeta || null,
    generatedAt: new Date().toISOString(),
    detailedPayloadPresent: Boolean(detailed),
    reportPipeline: "product_html_payload_aligned",
  };
}

function markdownFromProductLines(title, student, lines, maxLines = 180) {
  const clipped = lines.slice(0, maxLines);
  return [
    `# ${title} — ${student.displayName}`,
    "",
    `- מזהה: \`${student.studentId}\``,
    `- פרופיל: ${student.profileType}`,
    "",
    "## תצלום טקסט מהתצוגה המוצרית",
    "",
    ...clipped.map((l) => `- ${l}`),
    clipped.length < lines.length ? `- ... ועוד ${lines.length - clipped.length} שורות` : "",
    "",
  ].join("\n");
}

/**
 * @param {{ students: any[], reportLimit: number, pdfLimit: number, outputRoot: string, generateDetailedParentReport: Function, baseUrl: string }} opts
 */
export async function writeParentReportsAndProductPdfs(opts) {
  const baseReports = path.join(opts.outputRoot, "parent-reports");
  fs.mkdirSync(baseReports, { recursive: true });

  const reportStudents = opts.students.slice(0, opts.reportLimit);
  const runStartedAt = Date.now();
  const checkpointEvery = envCheckpointEvery();
  let pdfOk = 0;
  let failedPdfExports = 0;
  let shortPdfFiles = 0;
  let detailedPdfFiles = 0;
  /** @type {any[]} */
  const pdfIndexEntries = [];

  for (let i = 0; i < reportStudents.length; i++) {
    const student = reportStudents[i];
    installBrowserGlobals();
    applyMassStudentSeed(student);
    const detailed = opts.generateDetailedParentReport(student.displayName, "week", null, null);
    const summaryLines = execSummaryLines(detailed);

    const dir = path.join(baseReports, student.studentId);
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, "detailed.json"), JSON.stringify(detailed || { error: "null_detailed" }, null, 2), "utf8");

    let pdfBundle = { short: null, detailed: null, error: null };
    let shortHtmlLines = [];
    let detailedHtmlLines = [];
    if (i < opts.pdfLimit) {
      const snap = buildMassStudentStorageSnapshot(student);
      pdfBundle = await exportProductParentReportPdfPack({
        baseUrl: opts.baseUrl,
        storageSnapshot: snap,
        studentId: student.studentId,
        outputRoot: opts.outputRoot,
      });
      student.pdfExportShortMeta = pdfBundle.short;
      student.pdfExportDetailedMeta = pdfBundle.detailed;
      student.pdfExportError = pdfBundle.error || null;
      if (!pdfBundle.error && pdfBundle.short && pdfBundle.detailed) {
        pdfOk += 1;
        pdfIndexEntries.push(pdfBundle.short, pdfBundle.detailed);
      }
      const shortPdfDisk = path.join(opts.outputRoot, "pdfs", "short", `${student.studentId}.pdf`);
      const detailedPdfDisk = path.join(opts.outputRoot, "pdfs", "detailed", `${student.studentId}.pdf`);
      if (fs.existsSync(shortPdfDisk)) shortPdfFiles += 1;
      if (fs.existsSync(detailedPdfDisk)) detailedPdfFiles += 1;

      const pdfExportFailed =
        Boolean(pdfBundle.error) ||
        !pdfBundle.short ||
        !pdfBundle.detailed ||
        !String(pdfBundle.short?.htmlPath || "").trim() ||
        !String(pdfBundle.detailed?.htmlPath || "").trim();
      if (pdfExportFailed) {
        failedPdfExports += 1;
        if (!pdfBundle.error) {
          if (!pdfBundle.short || !pdfBundle.detailed) {
            student.pdfExportError = student.pdfExportError || "incomplete_pdf_pack_missing_side";
          } else if (!String(pdfBundle.short?.htmlPath || "").trim()) {
            student.pdfExportError = student.pdfExportError || "short_pdf_meta_missing_htmlPath";
          } else if (!String(pdfBundle.detailed?.htmlPath || "").trim()) {
            student.pdfExportError = student.pdfExportError || "detailed_pdf_meta_missing_htmlPath";
          }
        }
      }

      const relShortHtml = String(pdfBundle?.short?.htmlPath || "").trim();
      const relDetailedHtml = String(pdfBundle?.detailed?.htmlPath || "").trim();
      const shortHtmlAbs = relShortHtml ? path.join(opts.outputRoot, relShortHtml) : "";
      const detailedHtmlAbs = relDetailedHtml ? path.join(opts.outputRoot, relDetailedHtml) : "";
      if (shortHtmlAbs && fs.existsSync(shortHtmlAbs)) {
        shortHtmlLines = htmlToParentFacingLines(fs.readFileSync(shortHtmlAbs, "utf8"));
      }
      if (detailedHtmlAbs && fs.existsSync(detailedHtmlAbs)) {
        detailedHtmlLines = htmlToParentFacingLines(fs.readFileSync(detailedHtmlAbs, "utf8"));
      }
    }

    if (!shortHtmlLines.length) {
      const p = path.join(dir, "short.html");
      if (fs.existsSync(p)) shortHtmlLines = htmlToParentFacingLines(fs.readFileSync(p, "utf8"));
    }
    if (!detailedHtmlLines.length) {
      const p = path.join(dir, "detailed.html");
      if (fs.existsSync(p)) detailedHtmlLines = htmlToParentFacingLines(fs.readFileSync(p, "utf8"));
    }

    const shortMd = markdownFromProductLines("דוח קצר", student, shortHtmlLines.length ? shortHtmlLines : summaryLines, 140);
    fs.writeFileSync(path.join(dir, "short.md"), shortMd, "utf8");
    const detailedMd = markdownFromProductLines(
      "דוח מפורט",
      student,
      detailedHtmlLines.length ? detailedHtmlLines : summaryLines,
      260,
    );
    fs.writeFileSync(path.join(dir, "detailed.md"), detailedMd, "utf8");

    const shortPayload = shortReportPayload(student, detailed, summaryLines, shortHtmlLines, {
      short: student.pdfExportShortMeta,
      detailed: student.pdfExportDetailedMeta,
      error: student.pdfExportError,
    });
    fs.writeFileSync(path.join(dir, "short.json"), JSON.stringify(shortPayload, null, 2), "utf8");

    student.reportFiles = {
      shortJson: `parent-reports/${student.studentId}/short.json`,
      shortMd: `parent-reports/${student.studentId}/short.md`,
      shortHtml: `parent-reports/${student.studentId}/short.html`,
      detailedJson: `parent-reports/${student.studentId}/detailed.json`,
      detailedMd: `parent-reports/${student.studentId}/detailed.md`,
      detailedHtml: `parent-reports/${student.studentId}/detailed.html`,
    };

    writeStudentReportEvidence(opts.outputRoot, student, detailed);

    student.pdfFiles =
      student.pdfExportShortMeta && student.pdfExportDetailedMeta
        ? {
            short: student.pdfExportShortMeta.pdfPath,
            detailed: student.pdfExportDetailedMeta.pdfPath,
          }
        : {};
    const elapsedMs = Date.now() - runStartedAt;
    const idx = i + 1;
    const total = reportStudents.length;
    console.error(
      `[mass-sim] student ${idx}/${total} reports=${idx}/${total} pdfPairs=${pdfOk}/${opts.pdfLimit} pdfShort=${shortPdfFiles}/${opts.pdfLimit} pdfDetailed=${detailedPdfFiles}/${opts.pdfLimit} current=${student.studentId} elapsedSec=${Math.round(elapsedMs / 1000)}`,
    );
    const shouldCheckpoint = idx % checkpointEvery === 0 || idx === total;
    if (shouldCheckpoint) {
      writeRunProgress(opts.outputRoot, {
        phase: "reports_and_pdfs",
        completedStudents: idx,
        completedReports: idx,
        completedPdfPairs: pdfOk,
        completedPdfs: pdfOk * 2,
        pdfShortFiles: shortPdfFiles,
        pdfDetailedFiles: detailedPdfFiles,
        failedPdfExports,
        lastStudentId: student.studentId,
        elapsedMs,
        reportTotal: total,
        pdfLimit: opts.pdfLimit,
      });
    }
  }

  return { reportsWritten: reportStudents.length, pdfsWritten: pdfOk, pdfIndexEntries };
}
