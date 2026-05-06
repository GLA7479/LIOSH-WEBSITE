import fs from "node:fs";
import path from "node:path";
import { installBrowserGlobals } from "./browser-globals.mjs";
import { applyMassStudentSeed, buildMassStudentStorageSnapshot } from "./seed-engine.mjs";
import { exportProductParentReportPdfPack } from "./product-pdf-playwright.mjs";

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
  return lines.length ? lines : ["(סיכום מנהלים — ראה detailed.json למבנה מלא)"];
}

function shortReportPayload(student, detailed, lines, pdfMeta) {
  return {
    studentId: student.studentId,
    grade: student.grade,
    profileType: student.profileType,
    subjectsIncluded: student.subjects,
    dataVolume: student.generatedAnswers?.length ?? 0,
    strengths: student.strengths,
    weaknesses: student.weaknesses,
    executiveLines: lines,
    evidenceSnippets: lines.slice(0, 6),
    recommendations: lines.filter((l) => /תרגול|בית|שבוע|מיקוד/i.test(l)).slice(0, 5),
    trend: student.trendOverTime,
    cautionThinData: student.profileType === "thin_data",
    pdfExport: pdfMeta || null,
    generatedAt: new Date().toISOString(),
    detailedPayloadPresent: Boolean(detailed),
    reportPipeline: "generateDetailedParentReport",
  };
}

function detailedMarkdown(student, detailed) {
  const lines = execSummaryLines(detailed);
  return [
    `# דוח מפורט — ${student.displayName}`,
    "",
    `- מזהה: \`${student.studentId}\``,
    `- פרופיל: ${student.profileType}`,
    "",
    "## סיכום מנהלים (טקסטים עיקריים)",
    "",
    ...lines.map((l) => `- ${l}`),
    "",
    "## מטא־דאטה",
    "",
    "```json",
    JSON.stringify({ version: detailed?.version, narrativeContract: detailed?.narrativeContractVersion }, null, 2),
    "```",
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
  let pdfOk = 0;
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
    fs.writeFileSync(path.join(dir, "detailed.md"), detailedMarkdown(student, detailed), "utf8");

    const shortMd = [
      `# דוח קצר — ${student.displayName}`,
      "",
      ...summaryLines.map((l) => `- ${l}`),
      "",
      "## חוזקות",
      ...student.strengths.map((x) => `- ${x}`),
      "",
      "## חולשות",
      ...student.weaknesses.map((x) => `- ${x}`),
      "",
      `מגמה: ${student.trendOverTime}`,
      "",
    ].join("\n");
    fs.writeFileSync(path.join(dir, "short.md"), shortMd, "utf8");

    let pdfBundle = { short: null, detailed: null, error: null };
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
    }

    const shortPayload = shortReportPayload(student, detailed, summaryLines, {
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

    student.pdfFiles =
      student.pdfExportShortMeta && student.pdfExportDetailedMeta
        ? {
            short: student.pdfExportShortMeta.pdfPath,
            detailed: student.pdfExportDetailedMeta.pdfPath,
          }
        : {};
  }

  return { reportsWritten: reportStudents.length, pdfsWritten: pdfOk, pdfIndexEntries };
}
