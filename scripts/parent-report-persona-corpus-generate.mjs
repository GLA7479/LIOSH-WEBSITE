import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "parent-report-persona-corpus");
const JSON_DIR = join(OUT_DIR, "json");
const TEXT_DIR = join(OUT_DIR, "text");
const HTML_DIR = join(OUT_DIR, "html");
const SHOTS_DIR = join(OUT_DIR, "screenshots");
for (const dir of [OUT_DIR, JSON_DIR, TEXT_DIR, HTML_DIR, SHOTS_DIR]) mkdirSync(dir, { recursive: true });

const { buildDetailedParentReportFromBaseReport } = await import(
  pathToFileURL(join(ROOT, "utils", "detailed-parent-report.js")).href
);
const { normalizeExecutiveSummary } = await import(
  pathToFileURL(join(ROOT, "utils", "parent-report-payload-normalize.js")).href
);
const { PARENT_REPORT_PERSONA_CORPUS } = await import(
  pathToFileURL(join(ROOT, "tests", "fixtures", "parent-report-persona-corpus.mjs")).href
);

function cleanText(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}
function normalizeLine(v) {
  return cleanText(v).toLowerCase();
}
function dedupe(lines) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(lines) ? lines : []) {
    const t = cleanText(raw);
    if (!t) continue;
    const n = normalizeLine(t);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(t);
  }
  return out;
}
function sectionTxt(title, lines) {
  const body = (Array.isArray(lines) ? lines : []).map((x) => `- ${x}`).join("\n");
  return `## ${title}\n${body || "- אין נתונים להצגה."}\n`;
}
function sectionHtml(title, lines) {
  const items = (Array.isArray(lines) ? lines : []).map((line) => `<li>${String(line || "")}</li>`).join("");
  return `<section><h2>${title}</h2>${items ? `<ul>${items}</ul>` : "<p>אין נתונים להצגה.</p>"}</section>`;
}
function shortReportFromDetailed(detailed) {
  const top = detailed?.parentProductContractV1?.top || {};
  return {
    parentProductContractPreview: {
      mainStatusHe: cleanText(top?.mainStatusHe),
      mainPriorityHe: cleanText(top?.mainPriorityHe),
      doNowHe: cleanText(top?.doNowHe),
      avoidNowHe: cleanText(top?.avoidNowHe),
      confidenceHe: cleanText(top?.confidenceHe),
      evidenceSummaryHe: cleanText(top?.evidenceSummaryHe),
      nextCheckHe: cleanText(top?.nextCheckHe),
      trendEvidenceStatus: cleanText(top?.evidence?.trendEvidenceStatus),
      primaryFocusType: cleanText(top?.primaryFocusType),
    },
  };
}

const indexRows = [];
const reviewerRows = [];
const reviewerBlindRows = [];

for (const persona of PARENT_REPORT_PERSONA_CORPUS) {
  const base = persona.buildBaseReport();
  const detailed = buildDetailedParentReportFromBaseReport(base, { period: "week" });
  const short = shortReportFromDetailed(detailed);
  const topContract = detailed?.parentProductContractV1?.top || {};
  const subjectContracts = detailed?.parentProductContractV1?.subjects || {};

  const normalizedExecutive = normalizeExecutiveSummary(detailed);
  const executiveLines = dedupe([
    ...(normalizedExecutive?.topStrengthsAcrossHe || []),
    ...(normalizedExecutive?.topFocusAreasHe || []),
    ...(normalizedExecutive?.majorTrendsHe || []),
    ...(normalizedExecutive?.monitoringOnlyAreasHe || []),
  ]);
  const topLines = dedupe([
    `מצב: ${topContract.mainStatusHe || ""}`,
    `מיקוד עיקרי: ${topContract.mainPriorityHe || ""}`,
    `מה עושים עכשיו: ${topContract.doNowHe || ""}`,
    `למה: ${topContract.whyHe || ""}`,
    `מה לא לעשות כרגע: ${topContract.avoidNowHe || ""}`,
    `רמת ודאות: ${topContract.confidenceHe || ""}`,
    `בסיס נתונים: ${topContract.evidenceSummaryHe || ""}`,
    `בדיקה הבאה: ${topContract.nextCheckHe || ""}`,
  ]);
  const subjectLines = [];
  for (const [sid, row] of Object.entries(subjectContracts)) {
    const lines = dedupe([
      `מקצוע: ${sid}`,
      `סיכום: ${row?.mainStatusHe || ""}`,
      `מיקוד: ${row?.mainPriorityHe || ""}`,
      `מה עושים עכשיו: ${row?.doNowHe || ""}`,
      `מה לא לעשות כרגע: ${row?.avoidNowHe || ""}`,
      `רמת ודאות: ${row?.confidenceHe || ""}`,
    ]);
    subjectLines.push(...lines);
  }
  const summaryLines = dedupe([
    `מסקנת הורה צפויה: ${persona.expectedParentConclusionHe}`,
    `מיקוד ראשי בפועל: ${cleanText(topContract.mainPriorityHe)}`,
    `פעולה מיידית בפועל: ${cleanText(topContract.doNowHe)}`,
    `מה לא לעשות בפועל: ${cleanText(topContract.avoidNowHe)}`,
  ]);

  const shortTxt = sectionTxt("סיכום קצר להורה", [
    `מצב: ${short.parentProductContractPreview.mainStatusHe}`,
    `מיקוד עיקרי: ${short.parentProductContractPreview.mainPriorityHe}`,
    `מה עושים עכשיו: ${short.parentProductContractPreview.doNowHe}`,
    `מה לא לעשות כרגע: ${short.parentProductContractPreview.avoidNowHe}`,
  ]);
  const detailedTxt = [
    sectionTxt("סיכום להורה", topLines),
    sectionTxt("סיכום לתקופה", executiveLines),
    sectionTxt("סיכום מקצועות להורה", subjectLines),
    sectionTxt("רעיונות קצרים לבית", detailed?.homePlan?.itemsHe || []),
    sectionTxt("כיוון לימים הבאים", detailed?.nextPeriodGoals?.itemsHe || []),
  ].join("\n");
  const summaryTxt = sectionTxt("תקציר לביקורת", summaryLines);

  const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${persona.id}</title></head><body>
<h1>${persona.titleHe}</h1>
<p>${persona.descriptionHe}</p>
<p><strong>Expected:</strong> ${persona.expectedParentConclusionHe}</p>
${sectionHtml("סיכום קצר להורה", [
  `מצב: ${short.parentProductContractPreview.mainStatusHe}`,
  `מיקוד עיקרי: ${short.parentProductContractPreview.mainPriorityHe}`,
  `מה עושים עכשיו: ${short.parentProductContractPreview.doNowHe}`,
  `מה לא לעשות כרגע: ${short.parentProductContractPreview.avoidNowHe}`,
])}
${sectionHtml("סיכום להורה", topLines)}
${sectionHtml("סיכום לתקופה", executiveLines)}
${sectionHtml("סיכום מקצועות להורה", subjectLines)}
</body></html>`;

  writeFileSync(join(JSON_DIR, `${persona.id}.short.json`), JSON.stringify(short, null, 2), "utf8");
  writeFileSync(join(JSON_DIR, `${persona.id}.detailed.json`), JSON.stringify(detailed, null, 2), "utf8");
  writeFileSync(join(TEXT_DIR, `${persona.id}.short.txt`), shortTxt, "utf8");
  writeFileSync(join(TEXT_DIR, `${persona.id}.detailed.txt`), detailedTxt, "utf8");
  writeFileSync(join(TEXT_DIR, `${persona.id}.summary.txt`), summaryTxt, "utf8");
  writeFileSync(join(HTML_DIR, `${persona.id}.html`), html, "utf8");

  indexRows.push(
    `| ${persona.id} | ${persona.category} | ${persona.expectedParentConclusionHe} | ` +
      `[short](./text/${persona.id}.short.txt) | [detailed](./text/${persona.id}.detailed.txt) | ` +
      `[html](./html/${persona.id}.html) | GENERATED |`
  );

  reviewerRows.push(`## ${persona.id} — ${persona.titleHe}`);
  reviewerRows.push(`- קטגוריה: ${persona.category}`);
  reviewerRows.push(`- סיכום מצב ילד/ה: ${persona.descriptionHe}`);
  reviewerRows.push(`- ציפייה/אורקל: ${persona.expectedParentConclusionHe}`);
  reviewerRows.push(`- short: \`reports/parent-report-persona-corpus/text/${persona.id}.short.txt\``);
  reviewerRows.push(`- detailed: \`reports/parent-report-persona-corpus/text/${persona.id}.detailed.txt\``);
  reviewerRows.push("- שאלות סקירה:");
  reviewerRows.push("  - Did you understand within 10 seconds what is happening?");
  reviewerRows.push("  - Does the recommendation match the child profile?");
  reviewerRows.push("  - Is the recommendation too strong / too weak / right?");
  reviewerRows.push("  - Is there any contradiction?");
  reviewerRows.push("  - Is there too much text?");
  reviewerRows.push("  - Is anything repetitive?");
  reviewerRows.push("  - Would a parent know what to do tonight?");
  reviewerRows.push("  - Score 1–5");
  reviewerRows.push("  - Notes");
  reviewerRows.push("");

  reviewerBlindRows.push(`## ${persona.id} — ${persona.titleHe}`);
  reviewerBlindRows.push(`- קטגוריה: ${persona.category}`);
  reviewerBlindRows.push(`- סיכום מצב ילד/ה: ${persona.descriptionHe}`);
  reviewerBlindRows.push(`- short: \`reports/parent-report-persona-corpus/text/${persona.id}.short.txt\``);
  reviewerBlindRows.push(`- detailed: \`reports/parent-report-persona-corpus/text/${persona.id}.detailed.txt\``);
  reviewerBlindRows.push("- שאלות סקירה:");
  reviewerBlindRows.push("  - Did you understand within 10 seconds what is happening?");
  reviewerBlindRows.push("  - Does the recommendation match the child profile?");
  reviewerBlindRows.push("  - Is the recommendation too strong / too weak / right?");
  reviewerBlindRows.push("  - Is there any contradiction?");
  reviewerBlindRows.push("  - Is there too much text?");
  reviewerBlindRows.push("  - Is anything repetitive?");
  reviewerBlindRows.push("  - Would a parent know what to do tonight?");
  reviewerBlindRows.push("  - Score 1–5");
  reviewerBlindRows.push("  - Notes");
  reviewerBlindRows.push("");
}

const indexMd = [
  "# Parent Report Persona Corpus",
  "",
  "| Persona | Category | Expected behavior | Short report file | Detailed report file | HTML review | Status |",
  "|---|---|---|---|---|---|---|",
  ...indexRows,
  "",
].join("\n");
writeFileSync(join(OUT_DIR, "index.md"), indexMd, "utf8");

writeFileSync(
  join(OUT_DIR, "reviewer-pack.md"),
  ["# Reviewer Pack (With Expected Behavior)", "", ...reviewerRows].join("\n"),
  "utf8"
);
writeFileSync(
  join(OUT_DIR, "reviewer-pack-blind.md"),
  ["# Reviewer Pack (Blind)", "", ...reviewerBlindRows].join("\n"),
  "utf8"
);

console.log(
  JSON.stringify(
    {
      ok: true,
      personas: PARENT_REPORT_PERSONA_CORPUS.length,
      out_dir: OUT_DIR,
      index: join(OUT_DIR, "index.md"),
      reviewer_pack: join(OUT_DIR, "reviewer-pack.md"),
      reviewer_pack_blind: join(OUT_DIR, "reviewer-pack-blind.md"),
    },
    null,
    2
  )
);
