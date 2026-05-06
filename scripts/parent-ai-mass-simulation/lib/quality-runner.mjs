import fs from "node:fs";
import path from "node:path";

async function extractPdfText(filePath) {
  try {
    const mod = await import("pdf-parse");
    const PDFParseCtor = mod.PDFParse || mod.default?.PDFParse;
    if (PDFParseCtor) {
      const parser = new PDFParseCtor({ data: fs.readFileSync(filePath) });
      try {
        const textResult = await parser.getText();
        return String(textResult?.text || "");
      } finally {
        await parser.destroy?.();
      }
    }
  } catch {
    /* ignore */
  }
  return "";
}

function htmlVisibleText(html) {
  const src = String(html || "");
  const noScripts = src
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  return noScripts.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function hebrewLetterCount(t) {
  return (String(t || "").match(/[\u0590-\u05FF]/g) || []).length;
}

function scanReportProfileConsistency(student, shortMd, detailedMd) {
  const combined = `${shortMd}\n${detailedMd}`;
  const issues = [];
  const p = student.profileType;

  if (p === "strong_stable") {
    if (/כישלון חמור|קריסה מוחלטת|חלש מאוד בכל המקצועות/i.test(combined)) {
      issues.push({ code: "profile_strong_mismatch", detail: student.studentId });
    }
  }
  if (p === "weak_all_subjects") {
    if (/מצוין לחלוטין בכל התחומים|אין שום קושי/i.test(combined)) {
      issues.push({ code: "profile_weak_all_mismatch", detail: student.studentId });
    }
  }
  if (p === "weak_math" && !/חשבון|מתמטיקה|חישוב/i.test(combined)) {
    issues.push({ code: "weak_math_missing_signal", detail: student.studentId });
  }
  if (p === "weak_hebrew" && !/עברית|קריאה|הבנת הנקרא/i.test(combined)) {
    issues.push({ code: "weak_hebrew_missing_signal", detail: student.studentId });
  }
  if (p === "weak_english" && !/אנגלית/i.test(combined)) {
    issues.push({ code: "weak_english_missing_signal", detail: student.studentId });
  }
  if (
    p === "thin_data" &&
    !/מעט|מוגבל|לא מספיק|דליל|מצומצם/i.test(combined)
  ) {
    issues.push({ code: "thin_data_missing_language", detail: student.studentId });
  }
  return issues;
}

/**
 * @param {{
 *   outputRoot: string,
 *   students: any[],
 *   questionRows: any[],
 *   globalInteractions: any[],
 *   reportStudentIds: Set<string>,
 *   pdfLimit: number,
 *   categoryCoverage?: { missing: string[], budgetTooLow: boolean },
 * }} ctx
 */
export async function runQualitySuite(ctx) {
  /** @type {any[]} */
  const issues = [];
  /** @type {any[]} */
  const warnings = [];

  let totalChecks = 0;
  let failedChecks = 0;

  function fail(code, detail, fileLink) {
    failedChecks += 1;
    issues.push({ level: "fail", code, detail, file: fileLink });
  }

  function warn(code, detail, fileLink) {
    warnings.push({ code, detail, file: fileLink });
  }

  const pdfSlice = ctx.students.slice(0, ctx.pdfLimit || 0);

  for (const student of pdfSlice) {
    const sid = student.studentId;

    if (student.pdfExportError) {
      totalChecks += 1;
      fail("pdf_export_playwright_failed", student.pdfExportError, `pdfs/${sid}`);
    }

    const sm = student.pdfExportShortMeta;
    const dm = student.pdfExportDetailedMeta;

    if (ctx.pdfLimit > 0 && !student.pdfExportError) {
      totalChecks += 8;

      const shortPath = path.join(ctx.outputRoot, "pdfs", "short", `${sid}.pdf`);
      const detailedPath = path.join(ctx.outputRoot, "pdfs", "detailed", `${sid}.pdf`);

      if (!fs.existsSync(shortPath)) fail("pdf_short_missing", sid, `pdfs/short/${sid}.pdf`);
      if (!fs.existsSync(detailedPath)) fail("pdf_detailed_missing", sid, `pdfs/detailed/${sid}.pdf`);

      if (sm) {
        if (!sm.productPdf || sm.simulationPdf) fail("pdf_metadata_inconsistent", sid, "PDF_INDEX");
        if (!sm.readableHebrew || !sm.visualValidationPassed) fail("pdf_hebrew_not_readable", sid, sm.pdfPath);
        if (!sm.textExtractionPassed && !sm.textExtractionWarning) fail("pdf_text_extract_bad", sid, sm.pdfPath);
        if (sm.textExtractionWarning) warn("pdf_text_extract_warning", "חילוץ טקסט חלקי — וידוא ויזואלי ב-PNG", sm.previewPngPath);
        if ((sm.fileSizeBytes || 0) < 2500) fail("pdf_short_too_small_bytes", String(sm.fileSizeBytes), sm.pdfPath);
        if ((sm.pageCount || 0) < 1) fail("pdf_page_count_zero", sid, sm.pdfPath);
      } else if (!student.pdfExportError) {
        fail("pdf_short_meta_missing", sid, `PDF_INDEX`);
      }

      if (dm) {
        if (!dm.readableHebrew || !dm.visualValidationPassed) fail("pdf_detailed_hebrew_not_readable", sid, dm.pdfPath);
        if ((dm.fileSizeBytes || 0) < 2500) fail("pdf_detailed_too_small_bytes", String(dm.fileSizeBytes), dm.pdfPath);
      }

      const pngS = path.join(ctx.outputRoot, "pdf-previews", "short", `${sid}.png`);
      const pngD = path.join(ctx.outputRoot, "pdf-previews", "detailed", `${sid}.png`);
      if (!fs.existsSync(pngS)) fail("pdf_preview_short_missing", sid, `pdf-previews/short/${sid}.png`);
      if (!fs.existsSync(pngD)) fail("pdf_preview_detailed_missing", sid, `pdf-previews/detailed/${sid}.png`);

      if (sm && dm && fs.existsSync(shortPath) && fs.existsSync(detailedPath)) {
        const ts = await extractPdfText(shortPath);
        const td = await extractPdfText(detailedPath);
        const hs = hebrewLetterCount(ts);
        const hd = hebrewLetterCount(td);
        if (hd < hs * 0.85 && hd < hs - 40) {
          warn("pdf_detailed_not_longer", "הטקסט המחולץ מהמפורט לא ארוך מהקצר — בדוק ידנית", dm.pdfPath);
        }
      }
    }
  }

  for (const student of ctx.students) {
    if (!ctx.reportStudentIds.has(student.studentId)) continue;

    const shortMdPath = path.join(ctx.outputRoot, "parent-reports", student.studentId, "short.md");
    const detailedMdPath = path.join(ctx.outputRoot, "parent-reports", student.studentId, "detailed.md");
    const shortHtmlPath = path.join(ctx.outputRoot, "parent-reports", student.studentId, "short.html");
    const detailedHtmlPath = path.join(ctx.outputRoot, "parent-reports", student.studentId, "detailed.html");
    const shortMd = fs.existsSync(shortMdPath) ? fs.readFileSync(shortMdPath, "utf8") : "";
    const detailedMd = fs.existsSync(detailedMdPath) ? fs.readFileSync(detailedMdPath, "utf8") : "";
    const shortHtml = fs.existsSync(shortHtmlPath) ? fs.readFileSync(shortHtmlPath, "utf8") : "";
    const detailedHtml = fs.existsSync(detailedHtmlPath) ? fs.readFileSync(detailedHtmlPath, "utf8") : "";

    totalChecks += 2;
    if (!shortMd || shortMd.trim().length < 40) fail("report_short_empty", student.studentId, `parent-reports/${student.studentId}/short.md`);
    if (!detailedMd || detailedMd.trim().length < 40) fail("report_detailed_empty", student.studentId, `parent-reports/${student.studentId}/detailed.md`);

    if (scanInternalLeak(shortMd) || scanInternalLeak(detailedMd)) {
      fail("internal_terms_in_report_md", student.studentId, `parent-reports/${student.studentId}/`);
    }
    const shortHtmlVisible = htmlVisibleText(shortHtml);
    const detailedHtmlVisible = htmlVisibleText(detailedHtml);
    if (scanInternalLeak(shortHtmlVisible) || scanInternalLeak(detailedHtmlVisible)) {
      fail("internal_terms_in_report_html", student.studentId, `parent-reports/${student.studentId}/`);
    }

    const profIssues = scanReportProfileConsistency(student, shortMd, detailedMd);
    for (const pi of profIssues) {
      totalChecks += 1;
      fail(pi.code, pi.detail, `parent-reports/${student.studentId}/short.md`);
    }
  }

  for (const row of ctx.globalInteractions || []) {
    const asserts = row.assertionResults || [];
    for (const ar of asserts) {
      totalChecks += 1;
      if (!ar.pass) {
        failedChecks += 1;
        issues.push({
          level: "fail",
          code: `copilot_assert_${ar.id}`,
          detail: `${row.studentId} · ${row.questionCategory || "?"} · ${row.parentQuestionId || ""}`,
          file: `parent-ai-chats/${row.studentId}.json`,
        });
      }
    }
    const a = String(row.aiAnswer || "");
    if (scanInternalLeak(a)) {
      totalChecks += 1;
      fail("internal_terms_in_copilot", row.parentQuestionId, `parent-ai-chats/${row.studentId}.json`);
    }
  }

  const byStudent = new Map();
  for (const row of ctx.globalInteractions || []) {
    const sid = String(row.studentId || "");
    if (!byStudent.has(sid)) byStudent.set(sid, []);
    byStudent.get(sid).push(row);
  }
  for (const [sid, rows] of byStudent.entries()) {
    const normalized = new Map();
    for (const r of rows) {
      const ans = String(r.aiAnswer || "")
        .replace(/\s+/g, " ")
        .trim();
      if (!ans) continue;
      const key = ans.toLowerCase();
      if (!normalized.has(key)) normalized.set(key, new Set());
      normalized.get(key).add(String(r.questionCategory || ""));
    }
    for (const [answerKey, cats] of normalized.entries()) {
      totalChecks += 1;
      if (cats.size >= 4) {
        fail(
          "repeated_answer_across_categories",
          `${sid} · categories=${Array.from(cats).join(", ")}`,
          `parent-ai-chats/${sid}.json`,
        );
      }
    }
  }

  if (ctx.categoryCoverage?.missing?.length) {
    warn("parent_ai_category_gap", `חסרות קטגוריות: ${ctx.categoryCoverage.missing.join(", ")}`, "PARENT_AI_QUESTIONS_INDEX.json");
  }
  if (ctx.categoryCoverage?.budgetTooLow) {
    warn("parent_ai_budget_low", "מספר תורות נמוך ממספר הקטגוריות — לא נדרש כיסוי מלא", "run env");
  }

  const recurring = {};
  for (const x of issues) {
    recurring[x.code] = (recurring[x.code] || 0) + 1;
  }

  return {
    totalChecks,
    failedChecks,
    issues,
    warnings,
    recurringIssueCodes: Object.entries(recurring)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([code, count]) => ({ code, count })),
  };
}

function scanInternalLeak(text) {
  return /mleo_|skilltag|skillTag|contractslots|debug\s*:|validatorfailcodes|\bhebrew\b|\bmath\b|\benglish\b|\bscience\b|\bgeometry\b|\bmoledet[_-]geography\b/i.test(
    String(text || ""),
  );
}
