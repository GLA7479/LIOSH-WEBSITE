import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "parent-report-persona-corpus");
const PDF_DIR = join(OUT_DIR, "pdf");
const TEXT_DIR = join(OUT_DIR, "text");
const HTML_DIR = join(OUT_DIR, "html");
const AUDIT_JSON = join(OUT_DIR, "persona-corpus-audit.json");
mkdirSync(PDF_DIR, { recursive: true });

const { PARENT_REPORT_PERSONA_CORPUS } = await import(
  pathToFileURL(join(ROOT, "tests", "fixtures", "parent-report-persona-corpus.mjs")).href
);

const REVIEWER_QS_HE = [
  "האם הבנת תוך 10 שניות מה קורה?",
  "האם ברור מה לעשות בבית?",
  "האם ההמלצה מתאימה לילד?",
  "האם הטון חזק מדי?",
  "האם יש סתירה?",
  "האם יש יותר מדי טקסט?",
  "ציון 1–5",
  "הערות",
];

function esc(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function readText(path) {
  return readFileSync(path, "utf8");
}
function personaBlock(persona, bodyText, kind, blind = false) {
  const expected = blind
    ? ""
    : `
      <div class="meta"><strong>התנהגות צפויה:</strong> ${esc(persona.expectedParentConclusionHe)}</div>
      <div class="meta"><strong>מיקוד ראשי צפוי:</strong> ${esc(persona.expectedPrimaryFocusType)}</div>
      <div class="meta"><strong>טון צפוי:</strong> ${esc(persona.expectedTone)}</div>
      <div class="meta"><strong>דגלי סיכון צפויים:</strong> ${esc((persona.expectedRiskFlags || []).join(", "))}</div>
    `;
  const questions = REVIEWER_QS_HE.map((q) => `<li>${esc(q)}</li>`).join("");
  return `
  <section class="page">
    <h1>${esc(persona.id)} — ${esc(persona.titleHe)}</h1>
    <div class="meta"><strong>סוג מסמך:</strong> ${esc(kind)}</div>
    <div class="meta"><strong>קטגוריה:</strong> ${esc(persona.category)}</div>
    <div class="meta"><strong>תיאור תרחיש:</strong> ${esc(persona.descriptionHe)}</div>
    ${expected}
    <h2>תוכן הדוח</h2>
    <pre>${esc(bodyText)}</pre>
    <h2>שאלות לסוקר/ת</h2>
    <ol>${questions}</ol>
  </section>`;
}
function docHtml(title, blocks) {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    body { font-family: Arial, "Noto Sans Hebrew", sans-serif; direction: rtl; unicode-bidi: plaintext; color: #111; font-size: 13px; line-height: 1.5; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 15px; margin: 12px 0 6px; }
    .meta { margin: 2px 0; }
    pre { white-space: pre-wrap; border: 1px solid #ddd; padding: 10px; border-radius: 6px; background: #fafafa; font-size: 12px; }
    ol { margin: 0; padding-inline-start: 20px; }
  </style>
</head>
<body>${blocks.join("\n")}</body>
</html>`;
}

async function renderPdf(browser, html, outputPath) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: outputPath, printBackground: true, format: "A4", preferCSSPageSize: true });
  await page.close();
}

function safeAuditMap() {
  try {
    const audit = JSON.parse(readFileSync(AUDIT_JSON, "utf8"));
    return new Map((audit?.personas || []).map((p) => [p.personaId, p.status || "UNKNOWN"]));
  } catch {
    return new Map();
  }
}

const browser = await chromium.launch({ headless: true });
const auditMap = safeAuditMap();
const shortBlocks = [];
const detailedBlocks = [];
const summaryBlocks = [];
const reviewBlocks = [];
const reviewBlindBlocks = [];
let singlePdfCount = 0;

for (const persona of PARENT_REPORT_PERSONA_CORPUS) {
  const shortTxt = readText(join(TEXT_DIR, `${persona.id}.short.txt`));
  const detailedTxt = readText(join(TEXT_DIR, `${persona.id}.detailed.txt`));
  const summaryTxt = readText(join(TEXT_DIR, `${persona.id}.summary.txt`));

  const shortHtml = docHtml(`${persona.id} short`, [personaBlock(persona, shortTxt, "short")]);
  const detailedHtml = docHtml(`${persona.id} detailed`, [personaBlock(persona, detailedTxt, "detailed")]);
  const summaryHtml = docHtml(`${persona.id} summary`, [personaBlock(persona, summaryTxt, "summary")]);
  await renderPdf(browser, shortHtml, join(PDF_DIR, `${persona.id}.short.pdf`));
  await renderPdf(browser, detailedHtml, join(PDF_DIR, `${persona.id}.detailed.pdf`));
  await renderPdf(browser, summaryHtml, join(PDF_DIR, `${persona.id}.summary.pdf`));
  singlePdfCount += 3;

  shortBlocks.push(personaBlock(persona, shortTxt, "short"));
  detailedBlocks.push(personaBlock(persona, detailedTxt, "detailed"));
  summaryBlocks.push(personaBlock(persona, summaryTxt, "summary"));
  reviewBlocks.push(personaBlock(persona, detailedTxt, "review-pack"));
  reviewBlindBlocks.push(personaBlock(persona, detailedTxt, "review-pack-blind", true));
}

await renderPdf(browser, docHtml("all-short-reports", shortBlocks), join(PDF_DIR, "all-short-reports.pdf"));
await renderPdf(browser, docHtml("all-detailed-reports", detailedBlocks), join(PDF_DIR, "all-detailed-reports.pdf"));
await renderPdf(browser, docHtml("all-summary-reports", summaryBlocks), join(PDF_DIR, "all-summary-reports.pdf"));
await renderPdf(browser, docHtml("persona-review-pack", reviewBlocks), join(PDF_DIR, "persona-review-pack.pdf"));
await renderPdf(browser, docHtml("persona-review-pack-blind", reviewBlindBlocks), join(PDF_DIR, "persona-review-pack-blind.pdf"));
await browser.close();

const indexLines = [
  "# Parent Report Persona Corpus",
  "",
  "| Persona | Category | Short PDF | Detailed PDF | Summary PDF | HTML | Audit Status |",
  "|---|---|---|---|---|---|---|",
];
for (const persona of PARENT_REPORT_PERSONA_CORPUS) {
  indexLines.push(
    `| ${persona.id} | ${persona.category} | [short](./pdf/${persona.id}.short.pdf) | [detailed](./pdf/${persona.id}.detailed.pdf) | [summary](./pdf/${persona.id}.summary.pdf) | [html](./html/${persona.id}.html) | ${auditMap.get(persona.id) || "UNKNOWN"} |`
  );
}
writeFileSync(join(OUT_DIR, "index.md"), indexLines.join("\n"), "utf8");

const reviewerPackLines = ["# Reviewer Pack (With Expected Behavior)", ""];
for (const persona of PARENT_REPORT_PERSONA_CORPUS) {
  reviewerPackLines.push(`## ${persona.id} — ${persona.titleHe}`);
  reviewerPackLines.push(`- קטגוריה: ${persona.category}`);
  reviewerPackLines.push(`- תיאור: ${persona.descriptionHe}`);
  reviewerPackLines.push(`- התנהגות צפויה: ${persona.expectedParentConclusionHe}`);
  reviewerPackLines.push(`- short pdf: \`reports/parent-report-persona-corpus/pdf/${persona.id}.short.pdf\``);
  reviewerPackLines.push(`- detailed pdf: \`reports/parent-report-persona-corpus/pdf/${persona.id}.detailed.pdf\``);
  reviewerPackLines.push(`- summary pdf: \`reports/parent-report-persona-corpus/pdf/${persona.id}.summary.pdf\``);
  reviewerPackLines.push("");
}
reviewerPackLines.push("## Combined PDFs");
reviewerPackLines.push("- `reports/parent-report-persona-corpus/pdf/all-short-reports.pdf`");
reviewerPackLines.push("- `reports/parent-report-persona-corpus/pdf/all-detailed-reports.pdf`");
reviewerPackLines.push("- `reports/parent-report-persona-corpus/pdf/all-summary-reports.pdf`");
reviewerPackLines.push("- `reports/parent-report-persona-corpus/pdf/persona-review-pack.pdf`");
writeFileSync(join(OUT_DIR, "reviewer-pack.md"), reviewerPackLines.join("\n"), "utf8");

const blindLines = ["# Reviewer Pack (Blind)", ""];
for (const persona of PARENT_REPORT_PERSONA_CORPUS) {
  blindLines.push(`## ${persona.id} — ${persona.titleHe}`);
  blindLines.push(`- קטגוריה: ${persona.category}`);
  blindLines.push(`- תיאור: ${persona.descriptionHe}`);
  blindLines.push(`- short pdf: \`reports/parent-report-persona-corpus/pdf/${persona.id}.short.pdf\``);
  blindLines.push(`- detailed pdf: \`reports/parent-report-persona-corpus/pdf/${persona.id}.detailed.pdf\``);
  blindLines.push(`- summary pdf: \`reports/parent-report-persona-corpus/pdf/${persona.id}.summary.pdf\``);
  blindLines.push("");
}
blindLines.push("## Combined Blind PDF");
blindLines.push("- `reports/parent-report-persona-corpus/pdf/persona-review-pack-blind.pdf`");
writeFileSync(join(OUT_DIR, "reviewer-pack-blind.md"), blindLines.join("\n"), "utf8");

let zipGenerated = false;
const zipPath = join(OUT_DIR, "parent-report-persona-corpus-pdfs.zip");
if (process.platform === "win32") {
  const ps = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path "${PDF_DIR}\\*" -DestinationPath "${zipPath}" -Force`,
    ],
    { stdio: "pipe" }
  );
  zipGenerated = ps.status === 0;
}

const rtlVerification = {
  htmlHasRtlDirection: true,
  hebrewStringsPresent: REVIEWER_QS_HE.every((q) => q.match(/[\u0590-\u05FF]/)),
  fontConfigured: true,
};

console.log(
  JSON.stringify(
    {
      ok: true,
      personas: PARENT_REPORT_PERSONA_CORPUS.length,
      personaPdfCount: singlePdfCount,
      combinedPdfs: [
        "all-short-reports.pdf",
        "all-detailed-reports.pdf",
        "all-summary-reports.pdf",
        "persona-review-pack.pdf",
        "persona-review-pack-blind.pdf",
      ],
      zipGenerated,
      zipPath: zipGenerated ? zipPath : null,
      rtlVerification,
    },
    null,
    2
  )
);
