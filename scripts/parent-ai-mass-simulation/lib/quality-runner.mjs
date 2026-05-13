import fs from "node:fs";
import path from "node:path";
import parentFacingNormalize from "../../../utils/parent-report-language/parent-facing-normalize-he.js";

/** Mirrors `utils/parent-report-language/subject-withhold-summary-he.js` (tsx resolves cross-root imports inconsistently). */
function isGenericCautiousPracticeLineHe(text) {
  const t = String(text || "");
  const hasPractice = /יש\s+נתוני\s+תרגול/.test(t);
  const hasCautious = /מה\s+שנראה\s+מהתרגולים\s+עדיין\s+זהיר/.test(t);
  return hasPractice && hasCautious;
}

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

function collectDetailedParentFacingBlob(detailed) {
  const parts = [];
  const push = (v) => {
    if (typeof v === "string" && v.trim()) parts.push(v);
  };
  const es = detailed?.executiveSummary;
  if (es && typeof es === "object") {
    push(es.mainHomeRecommendationHe);
    push(es.cautionNoteHe);
    push(es.homeFocusHe);
  }
  const ppc = detailed?.parentProductContractV1;
  if (ppc && typeof ppc === "object") {
    const top = ppc.top && typeof ppc.top === "object" ? ppc.top : {};
    push(top.mainStatusHe);
    push(top.whyHe);
    const subs = ppc.subjects && typeof ppc.subjects === "object" ? ppc.subjects : {};
    for (const row of Object.values(subs)) {
      if (row && typeof row === "object") {
        push(row.mainStatusHe);
        push(row.whyHe);
      }
    }
  }
  for (const sp of detailed?.subjectProfiles || []) {
    push(sp.summaryHe);
    push(sp.confidenceSummaryHe);
    for (const tr of sp.topicRecommendations || []) {
      if (tr && typeof tr === "object") {
        push(tr.whyThisRecommendationHe);
        push(tr.cautionLineHe);
      }
    }
  }
  return parts.join("\n");
}

/** Parent-facing copy must avoid internal/QA/meta phrasing (reports + PDF + JSON + Parent AI). */
const PARENT_LANGUAGE_RULES = /** @type {const} */ ([
  ["parent_facing_text_must_not_include_engine_word", /המנוע/u],
  ["parent_facing_text_must_not_include_numeric_anchor_jargon", /עוגן מספרי|מוקדים המעוגנים/u],
  ["parent_facing_text_must_not_include_weighted_jargon", /משוקלל/u],
  ["parent_ai_must_not_include_meta_fix_language", /בלי לפתוח|אין עדיין בסיס/u],
]);

function scanReportProfileConsistency(student, shortMd, detailedMd, pdfExtractedText = "") {
  const combined = `${shortMd}\n${detailedMd}\n${pdfExtractedText}`;
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
    !/מעט|מצומצם|דליל|לא\s+מספיק|מוגבל(?!ת|ים|ות)|אין\s+מוקד\s+ברור|0\s+מתוך\s+\d+|שלב\s+מוקדם|עדיין\s+אין\s+מסקנה\s+חדה|(?:^|\n)\s*[-•]\s*זהירות|מידע\s+חלקי|תמונה\s+חלקית|ניסוח\s+זהיר/u.test(
      combined,
    )
  ) {
    issues.push({ code: "thin_data_missing_language", detail: student.studentId });
  }
  const genericCautiousMd =
    isGenericCautiousPracticeLineHe(combined) ||
    /יש\s+נתוני\s+תרגול.+מה\s+שנראה\s+מהתרגולים\s+עדיין\s+זהיר.+עוד\s+תרגול/u.test(combined);
  if ((p === "strong_stable" || p === "rich_data") && genericCautiousMd) {
    issues.push({ code: "report_summary_should_vary_by_profile_type", detail: student.studentId });
    issues.push({
      code: "parent_facing_text_should_not_repeat_generic_cautious_line_for_all_profiles",
      detail: student.studentId,
    });
  }
  if (/מגמה\s+כללית\s+שאפשר\s+לשתף\s+בהירות/u.test(combined)) {
    issues.push({ code: "parent_facing_hebrew_should_not_include_awkward_phrase", detail: student.studentId });
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
 *   parentAiQuestionLimit?: number,
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

  const nInteractions = (ctx.globalInteractions || []).length;
  const budget = typeof ctx.parentAiQuestionLimit === "number" ? ctx.parentAiQuestionLimit : null;

  totalChecks += 1;
  if (nInteractions === 0) {
    fail(
      "parent_ai_zero_interactions",
      "לא נוצרו אינטראקציות Parent AI — בדרך כלל MASS_PARENT_AI_QUESTION_LIMIT=0 או הקצאה ריקה (ראה allocateFair)",
      "parent-ai-chats/",
    );
  }

  if (budget !== null && budget > 0) {
    totalChecks += 1;
    if (nInteractions !== budget) {
      fail(
        "parent_ai_interaction_count_mismatch",
        `לפי MASS_PARENT_AI_QUESTION_LIMIT צפוי ${budget} אינטראקציות, בפועל ${nInteractions}`,
        "MASS_SIMULATION_SUMMARY.json",
      );
    }
  }

  totalChecks += 1;
  if (ctx.categoryCoverage?.missing?.length) {
    fail(
      "parent_ai_category_gap",
      `חסרות קטגוריות: ${ctx.categoryCoverage.missing.join(", ")}`,
      "PARENT_AI_QUESTIONS_INDEX.json",
    );
  }

  totalChecks += 1;
  if (ctx.categoryCoverage?.budgetTooLow) {
    fail(
      "parent_ai_budget_low",
      "מספר תורות Parent AI כולל נמוך ממספר קטגוריות — לא ניתן לכסות את כל הקטגוריות; הגדל MASS_PARENT_AI_QUESTION_LIMIT או את מספר התלמידים עם תורות",
      "run env",
    );
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

    const shortMdNormalized = parentFacingNormalize.normalizeParentFacingHe(shortMd);
    const detailedMdNormalized = parentFacingNormalize.normalizeParentFacingHe(detailedMd);
    if (scanInternalLeak(shortMdNormalized) || scanInternalLeak(detailedMdNormalized)) {
      fail("internal_terms_in_report_md", student.studentId, `parent-reports/${student.studentId}/`);
    }
    const shortHtmlVisible = parentFacingNormalize.normalizeParentFacingHe(htmlVisibleText(shortHtml));
    const detailedHtmlVisible = parentFacingNormalize.normalizeParentFacingHe(htmlVisibleText(detailedHtml));
    if (scanInternalLeak(shortHtmlVisible) || scanInternalLeak(detailedHtmlVisible)) {
      fail("internal_terms_in_report_html", student.studentId, `parent-reports/${student.studentId}/`);
    }

    let pdfExtractedForStudent = "";
    const shortPdfQ = path.join(ctx.outputRoot, "pdfs", "short", `${student.studentId}.pdf`);
    const detailedPdfQ = path.join(ctx.outputRoot, "pdfs", "detailed", `${student.studentId}.pdf`);
    if (fs.existsSync(shortPdfQ)) pdfExtractedForStudent += `${await extractPdfText(shortPdfQ)}\n`;
    if (fs.existsSync(detailedPdfQ)) pdfExtractedForStudent += `${await extractPdfText(detailedPdfQ)}\n`;

    const profIssues = scanReportProfileConsistency(student, shortMd, detailedMd, pdfExtractedForStudent);
    for (const pi of profIssues) {
      totalChecks += 1;
      fail(pi.code, pi.detail, `parent-reports/${student.studentId}/short.md`);
    }

    const detailedJsonPath = path.join(ctx.outputRoot, "parent-reports", student.studentId, "detailed.json");
    const shortJsonPath = path.join(ctx.outputRoot, "parent-reports", student.studentId, "short.json");
    let detailedObj = null;
    let shortObj = null;
    try {
      if (fs.existsSync(detailedJsonPath)) {
        detailedObj = JSON.parse(fs.readFileSync(detailedJsonPath, "utf8"));
      }
    } catch {
      detailedObj = null;
    }
    try {
      if (fs.existsSync(shortJsonPath)) {
        shortObj = JSON.parse(fs.readFileSync(shortJsonPath, "utf8"));
      }
    } catch {
      shortObj = null;
    }

    const contractBlob = collectDetailedParentFacingBlob(detailedObj || {});
    const jsonBlob = `${contractBlob}\n${shortObj ? JSON.stringify(shortObj) : ""}\n${detailedObj ? JSON.stringify(detailedObj) : ""}`;
    const megaBlob = `${contractBlob}\n${shortMd}\n${detailedMd}\n${pdfExtractedForStudent}\n${jsonBlob}`;
    const overallQ = Number(detailedObj?.overallSnapshot?.totalQuestions) || 0;
    const p = student.profileType;

    for (const [code, re] of PARENT_LANGUAGE_RULES) {
      totalChecks += 1;
      if (re.test(megaBlob)) {
        fail(code, student.studentId, `parent-reports/${student.studentId}/`);
      }
    }
    totalChecks += 1;
    if (PARENT_LANGUAGE_RULES.some(([, re]) => re.test(megaBlob))) {
      fail(
        "parent_facing_text_should_use_plain_parent_language",
        student.studentId,
        `parent-reports/${student.studentId}/`,
      );
    }

    totalChecks += 5;
    if ((p === "strong_stable" || p === "rich_data") && overallQ >= 80 && isGenericCautiousPracticeLineHe(megaBlob)) {
      fail(
        "detailed_json_should_not_repeat_generic_cautious_subject_line_for_all_profiles",
        student.studentId,
        `parent-reports/${student.studentId}/`,
      );
    }

    if (
      (p === "strong_stable" || p === "rich_data") &&
      overallQ >= 80 &&
      /עדיין\s+לא\s+הצטבר\s+מספיק\s+מידע\s+לתמונה\s+רחבה/u.test(contractBlob)
    ) {
      fail(
        "rich_or_strong_contract_should_not_use_thin_data_language",
        student.studentId,
        `parent-reports/${student.studentId}/detailed.json`,
      );
    }

    const weakProfile = String(p || "").startsWith("weak_") || p === "weak_all_subjects";
    if (weakProfile && overallQ >= 25 && !/התמקד|ממוקד|חיזוק|קושי|חולש|פער|דיוק|טעות|שגיאות/i.test(contractBlob)) {
      fail(
        "weak_profile_contract_should_mention_focus_or_weakness",
        student.studentId,
        `parent-reports/${student.studentId}/detailed.json`,
      );
    }
  }

  const contractMainByProfile = new Map();
  for (const student of ctx.students) {
    if (!ctx.reportStudentIds.has(student.studentId)) continue;
    const detailedJsonPath = path.join(ctx.outputRoot, "parent-reports", student.studentId, "detailed.json");
    if (!fs.existsSync(detailedJsonPath)) continue;
    let d = null;
    try {
      d = JSON.parse(fs.readFileSync(detailedJsonPath, "utf8"));
    } catch {
      continue;
    }
    const q = Number(d?.overallSnapshot?.totalQuestions) || 0;
    if (q < 40) continue;
    const line = String(d?.parentProductContractV1?.top?.mainStatusHe || "").trim();
    if (!line) continue;
    const p = student.profileType;
    if (!contractMainByProfile.has(p)) contractMainByProfile.set(p, new Set());
    contractMainByProfile.get(p).add(line);
  }
  const strongLine = contractMainByProfile.get("strong_stable")?.size
    ? [...contractMainByProfile.get("strong_stable")][0]
    : "";
  const weakMathLine = contractMainByProfile.get("weak_math")?.size
    ? [...contractMainByProfile.get("weak_math")][0]
    : "";
  totalChecks += 1;
  if (strongLine && weakMathLine && strongLine === weakMathLine) {
    const strongStudent = ctx.students.find((s) => s.profileType === "strong_stable");
    const weakMathStudent = ctx.students.find((s) => s.profileType === "weak_math");
    let samePrimary = false;
    if (strongStudent && weakMathStudent) {
      try {
        const pStrong = path.join(
          ctx.outputRoot,
          "parent-reports",
          strongStudent.studentId,
          "detailed.json",
        );
        const pWeak = path.join(
          ctx.outputRoot,
          "parent-reports",
          weakMathStudent.studentId,
          "detailed.json",
        );
        if (fs.existsSync(pStrong) && fs.existsSync(pWeak)) {
          const dS = JSON.parse(fs.readFileSync(pStrong, "utf8"));
          const dW = JSON.parse(fs.readFileSync(pWeak, "utf8"));
          samePrimary =
            String(dS?.parentProductContractV1?.primarySubjectId || "") ===
            String(dW?.parentProductContractV1?.primarySubjectId || "");
        }
      } catch {
        samePrimary = false;
      }
    }
    if (!samePrimary) {
      fail(
        "parent_facing_contract_should_vary_by_profile_type",
        strongLine,
        "parent-reports/*/detailed.json",
      );
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
    for (const [code, re] of PARENT_LANGUAGE_RULES) {
      totalChecks += 1;
      if (re.test(a)) {
        fail(code, `${row.studentId} · ${row.questionCategory || "?"}`, `parent-ai-chats/${row.studentId}.json`);
      }
    }
    totalChecks += 1;
    if (PARENT_LANGUAGE_RULES.some(([, re]) => re.test(a))) {
      fail(
        "parent_facing_text_should_use_plain_parent_language",
        `${row.studentId} · parent-ai`,
        `parent-ai-chats/${row.studentId}.json`,
      );
    }
    if (scanInternalLeak(a)) {
      totalChecks += 1;
      fail("internal_terms_in_copilot", row.parentQuestionId, `parent-ai-chats/${row.studentId}.json`);
    }
    const pt = String(row.profileType || "");
    totalChecks += 1;
    if ((pt === "strong_stable" || pt === "rich_data") && isGenericCautiousPracticeLineHe(a)) {
      fail(
        "detailed_json_should_not_repeat_generic_cautious_subject_line_for_all_profiles",
        `${row.studentId} · parent-ai`,
        `parent-ai-chats/${row.studentId}.json`,
      );
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

  const personalizationCategories = new Set([
    "thin_data",
    "simple_explanation",
    "action_plan",
    "contradiction_challenge",
    "data_grounded",
  ]);
  const answersByCategory = new Map();
  for (const row of ctx.globalInteractions || []) {
    const cat = String(row.questionCategory || "");
    if (!personalizationCategories.has(cat)) continue;
    const ans = String(row.aiAnswer || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
    if (!ans) continue;
    if (!answersByCategory.has(cat)) answersByCategory.set(cat, []);
    answersByCategory.get(cat).push(ans);
  }
  const nStudents = (ctx.students && ctx.students.length) || 0;
  const minSamples = Math.max(8, Math.min(15, Math.ceil(nStudents * 0.35) || 8));
  for (const [cat, answers] of answersByCategory.entries()) {
    if (answers.length < minSamples) continue;
    const uniq = new Set(answers);
    totalChecks += 1;
    if (uniq.size <= 1) {
      fail(
        "repeated_exact_answer_across_students_by_category",
        `${cat} · identical_answers=${answers.length}`,
        "parent-ai-chats/",
      );
    }
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
