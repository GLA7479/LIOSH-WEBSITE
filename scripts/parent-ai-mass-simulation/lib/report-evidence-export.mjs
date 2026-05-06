import fs from "node:fs";
import path from "node:path";

/**
 * Writes per-student artifacts describing **report pipeline evidence** (same path as product:
 * `applyMassStudentSeed` → `generateDetailedParentReport` / `generateParentReportV2`).
 * This is intentionally separate from `question-runs/*.json` (mass QA RNG simulation).
 */

function rankCoverageRows(coverage) {
  const rows = coverage.filter((r) => (Number(r.questionCount) || 0) > 0);
  if (!rows.length) return { weakest: null, strongest: null };
  const sorted = [...rows].sort((a, b) => (Number(a.accuracy) || 0) - (Number(b.accuracy) || 0));
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];
  return {
    weakest: {
      subject: weakest.subject,
      subjectLabelHe: weakest.subjectLabelHe,
      questionCount: Number(weakest.questionCount) || 0,
      accuracy: Number(weakest.accuracy) || 0,
    },
    strongest: {
      subject: strongest.subject,
      subjectLabelHe: strongest.subjectLabelHe,
      questionCount: Number(strongest.questionCount) || 0,
      accuracy: Number(strongest.accuracy) || 0,
    },
  };
}

function topicEvidenceFromDetailed(detailed) {
  const profiles = Array.isArray(detailed?.subjectProfiles) ? detailed.subjectProfiles : [];
  return profiles.map((p) => ({
    subject: p.subject,
    subjectLabelHe: String(p.subjectLabelHe || "").trim() || p.subject,
    summaryHe: p.summaryHe != null ? String(p.summaryHe).slice(0, 400) : null,
    topicRecommendations: (Array.isArray(p.topicRecommendations) ? p.topicRecommendations : [])
      .slice(0, 6)
      .map((t) => ({
        topicRowKey: t.topicRowKey || t.topicKey || "",
        displayName: t.displayName != null ? String(t.displayName) : "",
        questions: Number(t.questions) || 0,
        accuracy: Number(t.accuracy) || 0,
      })),
  }));
}

/**
 * @param {string} outputRoot
 * @param {import("./student-generator.mjs").Student | any} student
 * @param {Record<string, unknown>|null|undefined} detailed
 */
export function writeStudentReportEvidence(outputRoot, student, detailed) {
  const dir = path.join(outputRoot, "report-evidence-runs");
  fs.mkdirSync(dir, { recursive: true });

  const snap = detailed?.overallSnapshot && typeof detailed.overallSnapshot === "object" ? detailed.overallSnapshot : {};
  const coverage = Array.isArray(snap.subjectCoverage) ? snap.subjectCoverage : [];
  const { weakest, strongest } = rankCoverageRows(coverage);

  const payload = {
    studentId: student.studentId,
    profileType: student.profileType,
    grade: student.grade,
    subjects: Array.isArray(student.subjects) ? student.subjects : [],
    evidenceSourceForReport: {
      pipeline:
        "generateParentReportV2 (via generateDetailedParentReport) reads browser-like storage seeded by applyMassStudentSeed — same keys the product uses.",
      notUsedForReport:
        "question-runs/*.json is a separate mass-simulation QA artifact (its own RNG). It does not feed generateParentReportV2.",
    },
    totalAnswersUsedByReport: Number(snap.totalQuestions) || 0,
    overallAccuracy: Number(snap.overallAccuracy) || 0,
    accuracyBySubject: coverage.map((r) => ({
      subject: r.subject,
      subjectLabelHe: r.subjectLabelHe,
      questionCount: Number(r.questionCount) || 0,
      correctCount: Number(r.correctCount) || 0,
      accuracy: Number(r.accuracy) || 0,
      timeMinutes: Number(r.timeMinutes) || 0,
    })),
    weakestSubject: weakest,
    strongestSubject: strongest,
    topicEvidenceSummary: topicEvidenceFromDetailed(detailed),
    links: {
      parentReportsDirectory: `parent-reports/${student.studentId}/`,
      shortMd: `parent-reports/${student.studentId}/short.md`,
      detailedMd: `parent-reports/${student.studentId}/detailed.md`,
      shortHtml: `parent-reports/${student.studentId}/short.html`,
      detailedHtml: `parent-reports/${student.studentId}/detailed.html`,
      detailedJson: `parent-reports/${student.studentId}/detailed.json`,
      parentAiChatJson: `parent-ai-chats/${student.studentId}.json`,
      questionRunsSimulationArtifact: `question-runs/${student.studentId}.json`,
    },
  };

  fs.writeFileSync(path.join(dir, `${student.studentId}.json`), JSON.stringify(payload, null, 2), "utf8");

  const md = [
    `# נתוני ראיות לדוח (מקור דוח) — ${student.displayName || student.studentId}`,
    "",
    `- מזהה: \`${payload.studentId}\``,
    `- פרופיל: **${payload.profileType}**`,
    `- כיתה: **${payload.grade}**`,
    "",
    "## מקור הנתונים (חשוב לסקירה ידנית)",
    "",
    `- **דוח הורה**: נבנה מ־\`generateParentReportV2\` דרך \`generateDetailedParentReport\`, אחרי \`applyMassStudentSeed\` — אלו אותם מפתחות אחסון כמו באפליקציה.`,
    `- **question-runs/*.json**: סימולציית QA נפרדת (RNG משלה) לספירות/איכות שאלות — **לא** נכנסת ל־generateParentReportV2.`,
    "",
    "## סיכום כמותי לפי הדוח",
    "",
    `- סה״כ תשובות בשימוש הדוח (חלון דוח): **${payload.totalAnswersUsedByReport}**`,
    `- דיוק כולל בדוח: **${payload.overallAccuracy}%**`,
    "",
    "### חולשה / חוזק יחסיים (לפי aggregate בדוח)",
    "",
    weakest
      ? `- חולשה יחסית: **${weakest.subjectLabelHe}** — ${weakest.accuracy}% (${weakest.questionCount} תשובות)`
      : "- חולשה יחסית: —",
    strongest
      ? `- חוזק יחסי: **${strongest.subjectLabelHe}** — ${strongest.accuracy}% (${strongest.questionCount} תשובות)`
      : "- חוזק יחסי: —",
    "",
    "### דיוק לפי מקצוע (כפי שבדוח)",
    "",
    ...coverage.map(
      (r) =>
        `- **${r.subjectLabelHe || r.subject}**: ${Number(r.accuracy) || 0}% · ${Number(r.questionCount) || 0} תשובות`,
    ),
    "",
    "## קישורים",
    "",
    `- דוחות: \`${payload.links.parentReportsDirectory}\``,
    `- Parent AI: \`${payload.links.parentAiChatJson}\``,
    `- סימולציית שאלות (לא מקור דוח): \`${payload.links.questionRunsSimulationArtifact}\``,
    "",
  ].join("\n");

  fs.writeFileSync(path.join(dir, `${student.studentId}.md`), md, "utf8");

  student.reportEvidenceFiles = {
    json: `report-evidence-runs/${student.studentId}.json`,
    md: `report-evidence-runs/${student.studentId}.md`,
  };
}

/**
 * Run-root readme: question-runs vs report evidence.
 */
export function writeEvidenceSourcesReadme(outputRoot) {
  const text = `# מקורות ראיות בסימולציה

## A. האם question-runs/*.json הוא אותו ראיות כמו generateParentReportV2?

**לא.** קבצי \`question-runs/<studentId>.json\` נוצרים על ידי מנוע סימולציית שאלות נפרד (\`simulateQuestionRuns\`) עם RNG משלו. הם משמשים לספירות איכות שאלות (real/placeholder), לא להזנת דוח ההורה.

## B. איפה הראיות המדויקות שהדוח משתמש בהן?

1. **זרע לאחסון** — \`applyMassStudentSeed\` (\`scripts/parent-ai-mass-simulation/lib/seed-engine.mjs\`) כותב ל־localStorage-style keys (\`mleo_*\`) כמו במוצר.
2. **דוח** — \`generateDetailedParentReport\` → \`generateParentReportV2\` קורא את אותם נתונים ובונה \`detailed.json\` / ממשק הורה.

תמצית ראיות **לפי אותו צינור דוח** נשמרת לכל תלמיד תחת:

\`report-evidence-runs/<studentId>.json\` ו־\`.md\`.

## C. למה לא לבלבל עם question-runs?

\`question-runs\` הוא **ארטיפקט QA בלבד** (כיסוי נושאים/בנק שאלות). לכן התיעוד כאן וקבצי \`report-evidence-runs\` מפרידים במפורש.

## D. סיכום

| מה | תפקיד |
|----|--------|
| \`report-evidence-runs/*\` | תמונת הדוח (aggregates) + קישורים — **מקור להבנת הדוח** |
| \`question-runs/*\` | סימולציית תשובות להמונים — **לא** מזין את הדוח |
| \`parent-reports/*/detailed.json\` | Payload מלא של הדוח |

`;

  fs.writeFileSync(path.join(outputRoot, "EVIDENCE_SOURCES.md"), text, "utf8");
}

export function writeQuestionRunsReadme(outputRoot) {
  const p = path.join(outputRoot, "question-runs", "README.md");
  fs.writeFileSync(
    p,
    [
      "# תיקייה זו — סימולציית שאלות ל‑QA בלבד",
      "",
      "קבצי `<studentId>.json` כאן אינם הנתונים שהוזנו ל־`generateParentReportV2`.",
      "הדוח נבנה מנתוני אחסון אחרי `applyMassStudentSeed` — ראה `../EVIDENCE_SOURCES.md` ו־`../report-evidence-runs/`.",
      "",
    ].join("\n"),
    "utf8",
  );
}
