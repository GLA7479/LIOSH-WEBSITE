import fs from "node:fs";
import path from "node:path";
import { PARENT_QUESTION_CATEGORIES } from "./parent-questions-catalog.mjs";

export function buildQuestionsIndex(questionStats, questionRows) {
  const topics = Object.keys(questionStats.byTopic);
  const lowCoverageCells = topics.filter((t) => questionStats.byTopic[t] < Math.max(5, questionRows.length * 0.002));

  return {
    totalQuestions: questionStats.total,
    byGrade: questionStats.byGrade,
    bySubject: questionStats.bySubject,
    byTopic: questionStats.byTopic,
    byDifficulty: questionStats.byDifficulty,
    correctIncorrectRatio: {
      correct: Math.round(questionStats.correctRatio * (questionStats.total || 0)),
      incorrect: (questionStats.total || 0) - Math.round(questionStats.correctRatio * (questionStats.total || 0)),
      ratio: questionStats.correctRatio,
    },
    mistakeTypes: questionStats.mistakeTypes,
    lowCoverageTopics: lowCoverageCells,
    realQuestionCount: questionStats.realQuestionCount ?? 0,
    generatedQuestionCount: questionStats.generatedQuestionCount ?? 0,
    placeholderQuestionCount: questionStats.placeholderQuestionCount ?? 0,
    byQuestionSource: questionStats.byQuestionSource ?? {},
    bySubjectQuestionSource: questionStats.bySubjectQuestionSource ?? {},
    questionQualityValidationScopeNote:
      "איכות שאלות נבחנת רק במקצועות עם שאלות real. מקצועות placeholder אינם מוכיחים איכות בנק שאלות.",
    questionRunsVsReportEvidenceNote:
      "question-runs/ הוא סימולציית QA נפרדת ולא מזין את generateParentReportV2. ראה EVIDENCE_SOURCES.md ו-report-evidence-runs/ לראיות שבדוח.",
  };
}

export function buildParentAiIndex(globalInteractions) {
  const byCategory = {};
  for (const c of PARENT_QUESTION_CATEGORIES) byCategory[c] = 0;
  for (const x of globalInteractions) {
    byCategory[x.questionCategory] = (byCategory[x.questionCategory] || 0) + 1;
  }
  const assertionFailures = globalInteractions.filter((x) => Array.isArray(x.qualityFlags) && x.qualityFlags.length > 0).length;
  return {
    totalInteractions: globalInteractions.length,
    byCategory,
    turnsWithQualityFlags: assertionFailures,
  };
}

export function buildReportsIndex(students, reportLimit) {
  const rows = students.slice(0, reportLimit).map((s) => ({
    studentId: s.studentId,
    displayName: s.displayName,
    grade: s.grade,
    profileType: s.profileType,
    files: s.reportFiles || {},
    pdfFiles: s.pdfFiles || {},
  }));
  return { reports: rows, reportLimit };
}

export function buildPdfIndex(students, pdfLimit) {
  const slice = students.slice(0, pdfLimit);
  /** @type {any[]} */
  const entries = [];
  for (const s of slice) {
    if (s.pdfExportShortMeta) entries.push(s.pdfExportShortMeta);
    if (s.pdfExportDetailedMeta) entries.push(s.pdfExportDetailedMeta);
  }
  const validReadable = entries.filter((e) => e.readableHebrew && e.visualValidationPassed && e.textExtractionPassed !== false);
  const invalid = entries.filter((e) => !e.readableHebrew || !e.visualValidationPassed);

  return {
    entries,
    shortPdfs: slice.map((s) => s.pdfExportShortMeta || { studentId: s.studentId, path: s.pdfFiles?.short || null }),
    detailedPdfs: slice.map((s) => s.pdfExportDetailedMeta || { studentId: s.studentId, path: s.pdfFiles?.detailed || null }),
    problemCasePdfs: [],
    totalPdfCount: entries.length,
    validReadablePdfCount: validReadable.length,
    invalidPdfCount: invalid.length,
    productPdfCount: entries.filter((e) => e.productPdf).length,
    simulationPdfCount: entries.filter((e) => e.simulationPdf).length,
  };
}

export function writeIndexes(outputRoot, data) {
  const writePair = (name, obj) => {
    fs.writeFileSync(path.join(outputRoot, `${name}.json`), JSON.stringify(obj, null, 2), "utf8");
    fs.writeFileSync(
      path.join(outputRoot, `${name}.md`),
      [`# ${name}`, "", "```json", JSON.stringify(obj, null, 2).slice(0, 120000), "```", ""].join("\n"),
      "utf8"
    );
  };

  writePair("QUESTIONS_INDEX", data.questionsIndex);
  writePair("PARENT_AI_QUESTIONS_INDEX", data.parentAiIndex);
  writePair("REPORTS_INDEX", data.reportsIndex);
  writePair("PDF_INDEX", data.pdfIndex);
  writePair("STUDENTS_INDEX", data.studentsIndex);
}

export function studentsIndexPayload(students) {
  return {
    totalStudents: students.length,
    byGrade: students.reduce((m, s) => {
      m[s.grade] = (m[s.grade] || 0) + 1;
      return m;
    }, {}),
    byProfile: students.reduce((m, s) => {
      m[s.profileType] = (m[s.profileType] || 0) + 1;
      return m;
    }, {}),
    students: students.map((s) => ({
      studentId: s.studentId,
      displayName: s.displayName,
      grade: s.grade,
      profileType: s.profileType,
      subjects: s.subjects,
      questionRunFiles: s.questionRunFiles,
      parentAiChatFiles: s.parentAiChatFiles,
      reportFiles: s.reportFiles,
      pdfFiles: s.pdfFiles,
      reportEvidenceFiles: s.reportEvidenceFiles ?? null,
      simulatedAnswers: s.generatedAnswers?.length ?? 0,
    })),
  };
}
