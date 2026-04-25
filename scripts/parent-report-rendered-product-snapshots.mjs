import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "parent-report-product-contract", "rendered-snapshots");
mkdirSync(OUT_DIR, { recursive: true });

const { buildDetailedParentReportFromBaseReport } = await import(
  pathToFileURL(join(ROOT, "utils", "detailed-parent-report.js")).href
);
const { normalizeExecutiveSummary } = await import(
  pathToFileURL(join(ROOT, "utils", "parent-report-payload-normalize.js")).href
);
const { PARENT_REPORT_PRODUCT_SCENARIOS } = await import(
  pathToFileURL(join(ROOT, "tests", "fixtures", "parent-report-product-scenarios.mjs")).href
);
const SCENARIO_IDS = [
  "new_user_no_data",
  "weak_enough_evidence",
  "weak_thin_evidence",
  "strong_stable_mastery",
  "strong_accuracy_fragile_success",
  "speed_issue_only_no_knowledge_gap",
  "multiple_subjects_one_clear_priority",
  "trend_insufficient",
  "trend_sufficient_up",
  "trend_sufficient_down",
];

function cleanText(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function normalizeLine(value) {
  return cleanText(value).toLowerCase();
}

function dedupeParentVisibleLines(lines, options = {}) {
  const { keep = [] } = options;
  const seen = new Set((Array.isArray(keep) ? keep : []).map((x) => normalizeLine(x)).filter(Boolean));
  const out = [];
  for (const raw of Array.isArray(lines) ? lines : []) {
    const t = cleanText(raw);
    if (!t) continue;
    const n = normalizeLine(t);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(t);
  }
  return out;
}

function filterStrongTrendWords(lines, strongTrendWords) {
  return (Array.isArray(lines) ? lines : []).filter((line) => {
    const t = String(line || "");
    return !strongTrendWords.some((w) => t.includes(w));
  });
}

function sectionHtml(title, lines) {
  const items = (Array.isArray(lines) ? lines : []).map((line) => `<li>${String(line || "")}</li>`).join("");
  return `<section><h2>${title}</h2>${items ? `<ul>${items}</ul>` : "<p>אין נתונים להצגה.</p>"}</section>`;
}

function sectionTxt(title, lines) {
  const body = (Array.isArray(lines) ? lines : []).map((x) => `- ${x}`).join("\n");
  return `## ${title}\n${body || "- אין נתונים להצגה."}\n`;
}

function scenarioBaseReport(s) {
  if (s.type === "base_report") return s.buildBaseReport();
  return {
    playerName: "SnapshotQA",
    period: "week",
    summary: {
      totalQuestions: 0,
      totalCorrect: 0,
      totalTimeMinutes: 0,
      overallAccuracy: 0,
      mathQuestions: 0,
      mathCorrect: 0,
      mathAccuracy: 0,
      geometryQuestions: 0,
      geometryCorrect: 0,
      geometryAccuracy: 0,
      englishQuestions: 0,
      englishCorrect: 0,
      englishAccuracy: 0,
      scienceQuestions: 0,
      scienceCorrect: 0,
      scienceAccuracy: 0,
      hebrewQuestions: 0,
      hebrewCorrect: 0,
      hebrewAccuracy: 0,
      moledetGeographyQuestions: 0,
      moledetGeographyCorrect: 0,
      moledetGeographyAccuracy: 0,
    },
    mathOperations: {},
    geometryTopics: {},
    englishTopics: {},
    scienceTopics: {},
    hebrewTopics: {},
    moledetGeographyTopics: {},
    mistakes: [],
    analysis: {},
  };
}

const rows = [];
for (const id of SCENARIO_IDS) {
  const scenario = PARENT_REPORT_PRODUCT_SCENARIOS.find((s) => s.id === id);
  if (!scenario) continue;
  const detailed = buildDetailedParentReportFromBaseReport(scenarioBaseReport(scenario), { period: "week" });
  const topContract = detailed?.parentProductContractV1?.top || null;
  const subjects = detailed?.parentProductContractV1?.subjects || {};
  const strongTrendWords = [
    "משתפר",
    "בירידה",
    "מגמה חיובית",
    "מגמה שלילית",
    "שיפור מבוסס",
    "ירידה מבוססת",
  ];
  const isTopTrendInsufficient =
    String(topContract?.evidence?.trendEvidenceStatus || "") === "insufficient";
  const normalizedExecutive = normalizeExecutiveSummary(detailed);
  const executiveForUiBase = topContract
    ? {
        ...normalizedExecutive,
        topImmediateParentActionHe: "",
        secondPriorityActionHe: "",
        majorTrendsHe:
          String(topContract?.evidence?.trendEvidenceStatus || "") === "insufficient"
            ? []
            : normalizedExecutive?.majorTrendsHe,
      }
    : normalizedExecutive;
  const topLines = [
    `מצב: ${topContract?.mainStatusHe || ""}`,
    `מיקוד עיקרי: ${topContract?.mainPriorityHe || ""}`,
    `מה עושים עכשיו: ${topContract?.doNowHe || ""}`,
    `למה: ${topContract?.whyHe || ""}`,
    `מה לא לעשות כרגע: ${topContract?.avoidNowHe || ""}`,
    `רמת ודאות: ${topContract?.confidenceHe || ""}`,
    `בסיס הנתונים: ${topContract?.evidenceSummaryHe || ""}`,
    `בדיקה הבאה: ${topContract?.nextCheckHe || ""}`,
  ]
    .map(cleanText)
    .filter((x) => x && !x.endsWith(":"));
  const topKeepLines = [
    topContract?.mainPriorityHe || "",
    topContract?.doNowHe || "",
    topContract?.mainStatusHe || "",
  ].filter(Boolean);

  let executiveLines = dedupeParentVisibleLines(
    [
      ...(Array.isArray(executiveForUiBase?.topStrengthsAcrossHe) ? executiveForUiBase.topStrengthsAcrossHe : []),
      ...(Array.isArray(executiveForUiBase?.topFocusAreasHe) ? executiveForUiBase.topFocusAreasHe : []),
      ...(Array.isArray(executiveForUiBase?.majorTrendsHe) ? executiveForUiBase.majorTrendsHe : []),
      ...(Array.isArray(executiveForUiBase?.monitoringOnlyAreasHe) ? executiveForUiBase.monitoringOnlyAreasHe : []),
      ...(Array.isArray(executiveForUiBase?.deferForNowAreasHe) ? executiveForUiBase.deferForNowAreasHe : []),
    ],
    { keep: topKeepLines }
  );
  if (isTopTrendInsufficient) {
    executiveLines = filterStrongTrendWords(executiveLines, strongTrendWords);
  }

  const crossSubjectLines = dedupeParentVisibleLines(detailed?.crossSubjectInsights?.bulletsHe, {
    keep: [...topKeepLines, ...executiveLines],
  });
  const crossLinesForUi = isTopTrendInsufficient
    ? filterStrongTrendWords(crossSubjectLines, strongTrendWords)
    : crossSubjectLines;

  const subjectLines = [];
  for (const [sid, row] of Object.entries(subjects)) {
    const mainPriority =
      cleanText(row?.mainPriorityHe) === cleanText(topContract?.mainPriorityHe) ? "" : row?.mainPriorityHe;
    const doNow = cleanText(row?.doNowHe) === cleanText(topContract?.doNowHe) ? "" : row?.doNowHe;
    const lines = [
      `מקצוע: ${sid}`,
      `סיכום להורה: ${row?.mainStatusHe || ""}`,
      mainPriority ? `מיקוד: ${mainPriority}` : "",
      doNow ? `מה עושים עכשיו: ${doNow}` : "",
      `מה לא לעשות כרגע: ${row?.avoidNowHe || ""}`,
      `רמת ודאות: ${row?.confidenceHe || ""}`,
    ]
      .map(cleanText)
      .filter(Boolean);
    subjectLines.push(...lines);
  }

  const homePlanLines = dedupeParentVisibleLines(detailed?.homePlan?.itemsHe, {
    keep: topKeepLines,
  });
  const goalsLines = dedupeParentVisibleLines(detailed?.nextPeriodGoals?.itemsHe, {
    keep: [...topKeepLines, ...homePlanLines],
  });

  const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${id}</title></head><body>
${sectionHtml("סיכום להורה", topLines)}
${sectionHtml("סיכום לתקופה", executiveLines)}
${sectionHtml("מה שחוזר בכמה מקצועות", crossLinesForUi)}
${sectionHtml("סיכום מקצועות להורה", subjectLines)}
${sectionHtml("רעיונות קצרים לבית", homePlanLines)}
${sectionHtml("כיוון לימים הבאים", goalsLines)}
</body></html>`;

  const txt = [
    sectionTxt("סיכום להורה", topLines),
    sectionTxt("סיכום לתקופה", executiveLines),
    sectionTxt("מה שחוזר בכמה מקצועות", crossLinesForUi),
    sectionTxt("סיכום מקצועות להורה", subjectLines),
    sectionTxt("רעיונות קצרים לבית", homePlanLines),
    sectionTxt("כיוון לימים הבאים", goalsLines),
  ].join("\n");
  writeFileSync(join(OUT_DIR, `${id}.html`), html, "utf8");
  writeFileSync(join(OUT_DIR, `${id}.txt`), txt, "utf8");
  rows.push(`- \`${id}\` — [html](./${id}.html) | [txt](./${id}.txt)`);
}

const md = `# Rendered Product Snapshots

${rows.join("\n")}
`;
writeFileSync(join(OUT_DIR, "index.md"), md, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      out_dir: OUT_DIR,
      count: rows.length,
      index: join(OUT_DIR, "index.md"),
    },
    null,
    2
  )
);

