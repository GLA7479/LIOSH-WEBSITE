#!/usr/bin/env node
/**
 * Mass simulation / pre-launch validation harness (reports only — no product UI).
 *
 * Env:
 *   MASS_STUDENT_COUNT (default 100)
 *   MASS_MIN_GRADE / MASS_MAX_GRADE (g1–g6)
 *   MASS_SEED
 *   MASS_SUBJECTS (comma)
 *   MASS_QUESTION_TARGET (default 20000)
 *   MASS_QUESTION_SOURCE — synthetic | hybrid | real (default hybrid)
 *   MASS_REPORT_LIMIT, MASS_PDF_LIMIT
 *   MASS_PARENT_AI_QUESTION_LIMIT — global budget distributed fairly across students
 *   MASS_PARENT_AI_CATEGORY_BALANCED=1
 *   MASS_PARENT_AI_CATEGORY_MIN (default 1)
 *   QA_BASE_URL / MASS_PDF_BASE_URL — required for PDF export (Next server), default http://localhost:3001 (Node fetch to 127.0.0.1 can be flaky on some Windows setups)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generateStudents, writeStudentFiles } from "./lib/student-generator.mjs";
import { simulateQuestionRuns, aggregateQuestionStats } from "./lib/question-simulator.mjs";
import { allocateFair } from "./lib/allocation.mjs";
import { runParentAiSimulation } from "./lib/copilot-runner.mjs";
import { writeParentReportsAndProductPdfs } from "./lib/report-export.mjs";
import {
  buildQuestionsIndex,
  buildParentAiIndex,
  buildReportsIndex,
  buildPdfIndex,
  studentsIndexPayload,
  writeIndexes,
} from "./lib/build-indexes.mjs";
import { runQualitySuite } from "./lib/quality-runner.mjs";
import {
  runAiResponseQualityAudit,
  writeAiResponseQualityAuditCsv,
  writeAiResponseQualityAuditMarkdown,
} from "./lib/ai-response-quality-audit.mjs";
import { buildManualReviewPack } from "./lib/manual-review-pack.mjs";
import { writeEvidenceSourcesReadme, writeQuestionRunsReadme } from "./lib/report-evidence-export.mjs";
import { GRADE_ORDER, SUBJECT_KEYS } from "./lib/constants.mjs";
import { assertPdfServerReachable } from "./lib/product-pdf-playwright.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");

function envInt(name, def) {
  const v = process.env[name];
  if (v === undefined || v === "") return def;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : def;
}

function envStr(name, def) {
  const v = process.env[name];
  return v === undefined || v === "" ? def : String(v);
}

function summaryHebrew(payload) {
  const {
    generatedAt,
    counts,
    coverage,
    quality,
    gradeSupportNote,
    bottomLine,
    outputRelative,
    pdfNarrative,
    questionSourceSummary,
    parentAiRollup,
  } = payload;

  return [
    "# סיכום סימולציית המונים — Parent AI / דוחות",
    "",
    `נוצר ב: ${generatedAt}`,
    "",
    "## מה נוצר",
    "",
    `- תלמידים סינתטיים: **${counts.students}**`,
    `- שאלות מענה בסימולציה: **${counts.questions}**`,
    `- שאלות ממאגר (real): **${counts.realQuestionCount ?? 0}**`,
    `- שאלות סינתטיות (synthetic): **${counts.generatedQuestionCount ?? 0}**`,
    `- מילוי חוסר בנק (placeholder): **${counts.placeholderQuestionCount ?? 0}**`,
    `- אינטראקציות Parent AI: **${counts.parentAiInteractions}**`,
    `- דוחות קצרים / מפורטים (קבצי מקור): **${counts.shortReports ?? counts.reportsWritten}** / **${counts.detailedReports ?? counts.reportsWritten}**`,
    `- PDF קצר / מפורט: **${counts.shortPdfCount ?? 0}** / **${counts.detailedPdfCount ?? 0}**`,
    `- סה״כ קבצי PDF: **${counts.totalPdfCount ?? 0}**`,
    `- PDF קריאים (עברית): **${counts.validReadablePdfCount ?? 0}**`,
    `- PDF לא תקינים: **${counts.invalidPdfCount ?? 0}**`,
    "",
    ...(pdfNarrative || []),
    "",
    ...(questionSourceSummary || []),
    "",
    ...(parentAiRollup || []),
    "",
    "### כיסוי לפי כיתה (שאלות)",
    "",
    Object.entries(coverage.byGrade)
      .map(([g, n]) => `- ${g}: ${n}`)
      .join("\n") || "- —",
    "",
    "### כיסוי לפי מקצוע (שאלות)",
    "",
    Object.entries(coverage.bySubject)
      .map(([s, n]) => `- ${s}: ${n}`)
      .join("\n") || "- —",
    "",
    "### כיסוי לפי פרופיל (תלמידים)",
    "",
    Object.entries(coverage.byProfile)
      .map(([p, n]) => `- ${p}: ${n}`)
      .join("\n") || "- —",
    "",
    "### קטגוריות שאלות הורה (Parent AI)",
    "",
    Object.entries(coverage.parentAiByCategory || {})
      .map(([c, n]) => `- ${c}: ${n}`)
      .join("\n") || "- —",
    "",
    "## איכות ובקרות",
    "",
    `- סה״כ בדיקות (בערך): **${quality.totalChecks}**`,
    `- כשלים: **${quality.failedChecks}**`,
    `- אזהרות: **${quality.warningCount}**`,
    "",
    "### כשלים חוזרים (דוגמה)",
    "",
    ...(quality.recurringIssueCodes.length
      ? quality.recurringIssueCodes.map((x) => `- \`${x.code}\`: ${x.count}`)
      : ["- אין"]),
    "",
    "## איפה הקבצים",
    "",
    `- תיקיית ריצה: \`${outputRelative}\``,
    "- אינדקסים: `STUDENTS_INDEX`, `QUESTIONS_INDEX`, `PARENT_AI_QUESTIONS_INDEX`, `REPORTS_INDEX`, `PDF_INDEX`, `QUALITY_FLAGS`, `AI_RESPONSE_QUALITY_AUDIT`",
    "- תיקיות משנה: `students/`, `question-runs/`, `parent-ai-chats/`, `parent-reports/` (כולל `short.html` / `detailed.html` כשמוצלח), `pdfs/`, `pdf-previews/`, `samples-for-manual-review/`",
    "",
    "## תמיכה בכיתות",
    "",
    gradeSupportNote,
    "",
    "## פערים לפני השקה (צ׳ק-ליסט)",
    "",
    "- תאי כיסוי נמוך בנושאים — ראה `QUESTIONS_INDEX.json` → `lowCoverageTopics`",
    "- כשלים ב-`QUALITY_FLAGS.md`",
    "- נקודות Parent AI עם `qualityFlags` בקבצי `parent-ai-chats/*.json`",
    "",
    "## משפט תחתון",
    "",
    `**${bottomLine.status}** — ${bottomLine.detail}`,
    "",
  ].join("\n");
}

async function main() {
  const studentCount = envInt("MASS_STUDENT_COUNT", 100);
  const minGrade = envStr("MASS_MIN_GRADE", "g1");
  const maxGrade = envStr("MASS_MAX_GRADE", "g6");
  const seed = envInt("MASS_SEED", 1337);
  const subjectsEnv = process.env.MASS_SUBJECTS;
  const questionTarget = envInt("MASS_QUESTION_TARGET", 20000);
  const reportLimit = envInt("MASS_REPORT_LIMIT", 100);
  const pdfLimit = envInt("MASS_PDF_LIMIT", 100);
  const parentAiGlobalLimit = envInt("MASS_PARENT_AI_QUESTION_LIMIT", 500);
  const questionSourceMode = envStr("MASS_QUESTION_SOURCE", "hybrid").toLowerCase();
  const categoryBalanced = process.env.MASS_PARENT_AI_CATEGORY_BALANCED === "1";
  const categoryMin = envInt("MASS_PARENT_AI_CATEGORY_MIN", 1);

  const baseUrl = envStr("QA_BASE_URL", envStr("MASS_PDF_BASE_URL", "http://localhost:3001"));

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputRoot = path.join(ROOT, "reports", "parent-ai-mass-simulation", stamp);
  fs.mkdirSync(outputRoot, { recursive: true });

  const subdirs = [
    "students",
    "question-runs",
    "parent-ai-chats",
    "parent-reports",
    "pdfs/short",
    "pdfs/detailed",
    "pdfs/problem-cases",
    "pdf-previews/short",
    "pdf-previews/detailed",
    "samples-for-manual-review",
    "report-evidence-runs",
  ];
  for (const d of subdirs) fs.mkdirSync(path.join(outputRoot, d), { recursive: true });
  writeEvidenceSourcesReadme(outputRoot);

  const { students, subjectsResolved } = generateStudents({
    studentCount,
    seed,
    minGrade,
    maxGrade,
    subjectsEnv,
  });

  if (pdfLimit > 0) {
    await assertPdfServerReachable(baseUrl);
  }

  const { rows: questionRows } = simulateQuestionRuns({
    students,
    questionTarget,
    outputRoot,
    questionSourceMode,
  });
  writeQuestionRunsReadme(outputRoot);

  const questionStats = aggregateQuestionStats(questionRows);
  const parentAiTurnsByStudent = allocateFair(parentAiGlobalLimit, students.length);

  const { generateDetailedParentReport } = await import(pathToFileURL(path.join(ROOT, "utils/detailed-parent-report.js")).href);
  const { runParentCopilotTurn } = await import(pathToFileURL(path.join(ROOT, "utils/parent-copilot/index.js")).href);
  const { syntheticPayload } = await import(pathToFileURL(path.join(ROOT, "scripts/parent-copilot-test-fixtures.mjs")).href);

  const { globalInteractions, interactionStats, categoryCoverage } = await runParentAiSimulation({
    students,
    parentAiTurnsByStudent,
    outputRoot,
    generateDetailedParentReport,
    runParentCopilotTurn,
    syntheticPayload,
    categoryBalanced,
    categoryMin,
  });

  const { reportsWritten, pdfsWritten, pdfIndexEntries } = await writeParentReportsAndProductPdfs({
    students,
    reportLimit,
    pdfLimit,
    outputRoot,
    generateDetailedParentReport,
    baseUrl,
  });

  writeStudentFiles(outputRoot, students);

  const questionsIndex = buildQuestionsIndex(questionStats, questionRows);
  const parentAiIndex = {
    ...buildParentAiIndex(globalInteractions),
    rollup: interactionStats,
    categoryCoverage,
  };
  const reportsIndex = buildReportsIndex(students, reportLimit);
  const pdfIndex = buildPdfIndex(students, pdfLimit);
  const studentsIndex = studentsIndexPayload(students);

  writeIndexes(outputRoot, {
    questionsIndex,
    parentAiIndex,
    reportsIndex,
    pdfIndex,
    studentsIndex,
  });

  const reportIds = new Set(students.slice(0, reportLimit).map((s) => s.studentId));

  let quality = await runQualitySuite({
    outputRoot,
    students,
    questionRows,
    globalInteractions,
    reportStudentIds: reportIds,
    pdfLimit,
    categoryCoverage,
  });

  const auditResult = await runAiResponseQualityAudit({
    outputRoot,
    students,
    globalInteractions,
    reportStudentIds: reportIds,
    pdfLimit,
  });

  fs.writeFileSync(
    path.join(outputRoot, "AI_RESPONSE_QUALITY_AUDIT.json"),
    JSON.stringify(auditResult.auditPayload, null, 2),
    "utf8",
  );
  writeAiResponseQualityAuditMarkdown(outputRoot, auditResult.auditPayload);
  writeAiResponseQualityAuditCsv(outputRoot, auditResult.auditPayload);

  const auditAnswers = auditResult.auditPayload.summary.totalAnswersScanned || 0;
  const auditReports = auditResult.auditPayload.summary.totalReportsScanned || 0;
  quality.totalChecks += auditAnswers + auditReports;
  quality.failedChecks += auditResult.gateFailureCount;

  for (const gi of auditResult.gateIssues || []) {
    if (gi.level === "fail") {
      quality.issues.push({ level: "fail", code: gi.code, detail: gi.detail, file: gi.file });
    } else {
      quality.warnings.push({ code: gi.code, detail: gi.detail, file: gi.file });
    }
  }

  const recurringMerged = {};
  for (const x of quality.issues) {
    recurringMerged[x.code] = (recurringMerged[x.code] || 0) + 1;
  }
  quality.recurringIssueCodes = Object.entries(recurringMerged)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([code, count]) => ({ code, count }));

  const warningCount = quality.warnings.length;

  const qualityPayload = {
    totalChecks: quality.totalChecks,
    failedChecks: quality.failedChecks,
    warningCount,
    issues: quality.issues.slice(0, 400),
    warnings: quality.warnings.slice(0, 400),
    topRecurring: quality.recurringIssueCodes,
    aiResponseQualityAudit: {
      finalStatus: auditResult.auditPayload.summary.finalStatus,
      gateFailures: auditResult.gateFailureCount,
      totalAnswerFailures: auditResult.auditPayload.summary.totalFailures,
    },
    note: "כולל בדיקות PDF מוצר (Playwright), דוחות, קטגוריות Parent AI, ו-AI_RESPONSE_QUALITY_AUDIT.",
  };

  fs.writeFileSync(path.join(outputRoot, "QUALITY_FLAGS.json"), JSON.stringify(qualityPayload, null, 2), "utf8");
  fs.writeFileSync(
    path.join(outputRoot, "QUALITY_FLAGS.md"),
    [
      "# Quality flags",
      "",
      `- totalChecks: ${quality.totalChecks}`,
      `- failedChecks: ${quality.failedChecks}`,
      `- warnings: ${warningCount}`,
      "",
      "## Top recurring",
      "",
      ...quality.recurringIssueCodes.map((x) => `- ${x.code}: ${x.count}`),
      "",
      "## Example failures",
      "",
      ...quality.issues.slice(0, 40).map((x) => `- **${x.code}** — ${x.detail} → \`${x.file}\``),
      "",
    ].join("\n"),
    "utf8"
  );

  buildManualReviewPack(outputRoot, students);

  const gradesWithZeroStudents = GRADE_ORDER.filter((g) => !students.some((s) => s.grade === g));

  const gradeSupportNote =
    gradesWithZeroStudents.length > 0
      ? `כיתות ללא תלמידים בסימולציה (בהתאם לטווח/מקרה): ${gradesWithZeroStudents.join(", ")}. אם נדרש כיסוי מלא g1–g6 הגדר MASS_MIN_GRADE=g1 ו-MASS_MAX_GRADE=g6 ומספר מספיק תלמידים.`
      : `כל הכיתות ${GRADE_ORDER.join(", ")} מיוצגות לפחות בתלמיד אחד.`;

  const invalidPdf = pdfIndex.invalidPdfCount || 0;
  const auditFail = auditResult.gateFailureCount > 0 || auditResult.auditPayload.summary.finalStatus === "FAIL";
  const bottomLine =
    quality.failedChecks === 0 && invalidPdf === 0 && !auditFail
      ? {
          status: "PASS (Harness)",
          detail: "אין כשלי איכות קריטיים — ניתן להמשיך לסקירה ידנית ואז ללילה ארוך.",
        }
      : {
          status: "NEEDS_REVIEW",
          detail:
            auditFail && invalidPdf === 0
              ? "כשלים ב-AI_RESPONSE_QUALITY_AUDIT או ב-QUALITY_FLAGS — יש לפתור לפני ריצת המונים."
              : "יש כשלי איכות או PDF לא קריא — יש לפתור לפני ריצת המונים.",
        };

  const relOut = path.relative(ROOT, outputRoot);

  const pdfNarrative = [
    "## מה לגבי ה-PDF?",
    "",
    `- **כן — אלו דוחות בסגנון המוצר**: רינדור דפי Next (\`/learning/parent-report\`, \`/learning/parent-report-detailed\`) והדפסה דרך Playwright (\`page.pdf\`), כמו \`scripts/qa-parent-pdf-export.mjs\`.`,
    `- **לא** משתמשים ב-jsPDF למסירת דוח להורה.`,
    `- **קריאות עברית**: נבדק טקסט מחולץ + גודל קובץ + תצוגה מקדימה PNG לכל דף ראשון — ראה \`PDF_INDEX.json\`.`,
    `- **שרת נדרש**: \`${baseUrl}\` חייב להיות זמין בזמן הריצה (\`npm run dev\` או \`npm run start\` עם פורט מתאים).`,
  ];

  const questionSourceSummary =
    questionSourceMode === "hybrid"
      ? [
          "## מקור שאלות",
          "",
          "- מצב **hybrid**: ניסיון למשוך שאלות אמיתיות ממאגרי מדעים ועברית כשניתן; אחרת synthetic/placeholder — ספירות בטבלה למעלה.",
        ]
      : questionSourceMode === "real"
        ? [
            "## מקור שאלות",
            "",
            "- מצב **real**: רק שאלות ממאגר; כשאין התאמה מסומן **placeholder** — אל תפרש כאימות איכות תוכן מלא.",
          ]
        : ["## מקור שאלות", "", "- מצב **synthetic**: כל השאלות נוצרות לסימולציה בלבד."];

  const placeholderOnlySubjects = Object.entries(questionStats.bySubjectQuestionSource || {})
    .filter(([, src]) => (Number(src?.real || 0) || 0) === 0 && (Number(src?.placeholder || 0) || 0) > 0)
    .map(([sid]) => sid);
  const realValidatedSubjects = Object.entries(questionStats.bySubjectQuestionSource || {})
    .filter(([, src]) => (Number(src?.real || 0) || 0) > 0)
    .map(([sid]) => sid);

  const parentAiRollup = [
    "## Parent AI — סיכום מהיר",
    "",
    `- תשובות data_grounded מבוססות (עוברות בדיקת איכות): **${interactionStats.groundedDataGroundedCount}**`,
    `- הזחות off-topic (עוברות): **${interactionStats.unrelatedRedirectCount}**`,
    `- מניעת חשיפה ב-prompt injection (עוברות): **${interactionStats.promptInjectionPassCount}**`,
    `- סירוב לבקשות זיוף (עוברות): **${interactionStats.badRequestRefusalPassCount}**`,
    `- מענה נכון לחוסר נתוני נושא: **${interactionStats.missingSubjectPassCount}**`,
    `- גבול רגיש חינוכי (education_adjacent_sensitive, עוברות): **${interactionStats.educationAdjacentSensitivePassCount ?? 0}**`,
    `- thin_data + data_grounded (סה״כ): **${interactionStats.thinDataDataGroundedCount ?? 0}**`,
    `- thin_data + caveat מוגבלות נתונים (עוברות): **${interactionStats.thinDataLimitedCautionPassCount ?? 0}**`,
    `- thin_data + caveat מוגבלות נתונים (נכשלות): **${interactionStats.thinDataLimitedCautionFailCount ?? 0}**`,
  ];

  const massPayload = {
    generatedAt: new Date().toISOString(),
    outputDirectory: relOut,
    environment: {
      MASS_STUDENT_COUNT: studentCount,
      MASS_MIN_GRADE: minGrade,
      MASS_MAX_GRADE: maxGrade,
      MASS_SEED: seed,
      MASS_SUBJECTS: subjectsEnv || "(default all)",
      MASS_QUESTION_TARGET: questionTarget,
      MASS_QUESTION_SOURCE: questionSourceMode,
      MASS_REPORT_LIMIT: reportLimit,
      MASS_PDF_LIMIT: pdfLimit,
      MASS_PARENT_AI_QUESTION_LIMIT: parentAiGlobalLimit,
      MASS_PARENT_AI_CATEGORY_BALANCED: categoryBalanced ? "1" : "0",
      MASS_PARENT_AI_CATEGORY_MIN: categoryMin,
      QA_BASE_URL: baseUrl,
    },
    subjectsResolved,
    supportedSubjectKeys: SUBJECT_KEYS,
    counts: {
      students: students.length,
      questions: questionRows.length,
      realQuestionCount: questionStats.realQuestionCount,
      generatedQuestionCount: questionStats.generatedQuestionCount,
      placeholderQuestionCount: questionStats.placeholderQuestionCount,
      parentAiInteractions: globalInteractions.length,
      reportsWritten,
      shortReports: reportsWritten,
      detailedReports: reportsWritten,
      pdfsWritten,
      shortPdfCount: pdfLimit > 0 ? pdfsWritten : 0,
      detailedPdfCount: pdfLimit > 0 ? pdfsWritten : 0,
      totalPdfCount: pdfIndex.totalPdfCount ?? (pdfLimit > 0 ? pdfsWritten * 2 : 0),
      validReadablePdfCount: pdfIndex.validReadablePdfCount ?? 0,
      invalidPdfCount: pdfIndex.invalidPdfCount ?? 0,
      productPdfCount: pdfIndex.productPdfCount ?? 0,
      simulationPdfCount: pdfIndex.simulationPdfCount ?? 0,
    },
    parentAiInteractionRollup: interactionStats,
    coverage: {
      byGrade: questionStats.byGrade,
      bySubject: questionStats.bySubject,
      byProfile: studentsIndex.byProfile,
      parentAiByCategory: parentAiIndex.byCategory,
    },
    quality: {
      totalChecks: quality.totalChecks,
      failedChecks: quality.failedChecks,
      warningCount,
      recurringIssueCodes: quality.recurringIssueCodes,
    },
    aiResponseQualityAudit: {
      finalStatus: auditResult.auditPayload.summary.finalStatus,
      totalAnswerIssueFailures: auditResult.auditPayload.summary.totalFailures,
      gateFailureRows: auditResult.gateFailureCount,
      warningsExtra: auditResult.auditPayload.summary.warningsFromReportHtmlMd ?? 0,
    },
    launchGaps: {
      questionQualityValidatedSubjects: realValidatedSubjects,
      placeholderOnlySubjects,
      note:
        "Question quality was validated only for subjects with real questions. Placeholder-only subjects need real question-bank coverage before launch readiness claims.",
    },
    bottomLine,
    gradeSupportNote,
    pdfMechanism: "product-html-playwright",
  };

  fs.writeFileSync(path.join(outputRoot, "MASS_SIMULATION_SUMMARY.json"), JSON.stringify(massPayload, null, 2), "utf8");

  fs.writeFileSync(
    path.join(outputRoot, "MASS_SIMULATION_SUMMARY.md"),
    summaryHebrew({
      generatedAt: massPayload.generatedAt,
      counts: massPayload.counts,
      coverage: massPayload.coverage,
      quality: {
        totalChecks: quality.totalChecks,
        failedChecks: quality.failedChecks,
        warningCount,
        recurringIssueCodes: quality.recurringIssueCodes,
      },
      gradeSupportNote,
      bottomLine,
      outputRelative: relOut,
      pdfNarrative,
      questionSourceSummary,
      parentAiRollup,
    }),
    "utf8"
  );

  console.log("parent-ai-mass-simulation OK", outputRoot);
  console.log(JSON.stringify(massPayload.counts, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
