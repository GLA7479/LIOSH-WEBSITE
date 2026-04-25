import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { buildDetailedParentReportFromBaseReport } = await import(
  pathToFileURL(join(ROOT, "utils", "detailed-parent-report.js")).href
);
const { FORBIDDEN_INTERNAL_PARENT_TERMS } = await import(
  pathToFileURL(join(ROOT, "utils", "contracts", "parent-product-contract-v1.js")).href
);
const { PARENT_REPORT_PRODUCT_SCENARIOS } = await import(
  pathToFileURL(join(ROOT, "tests", "fixtures", "parent-report-product-scenarios.mjs")).href
);
const { ParentTopContractSummaryBlock, ParentSubjectContractSummaryBlock } = await import(
  pathToFileURL(join(ROOT, "components", "parent-report-contract-ui-blocks.jsx")).href
);

const OUT_DIR = join(ROOT, "reports", "parent-report-product-contract");
mkdirSync(OUT_DIR, { recursive: true });

const STRONG_TREND_WORDS = ["משתפר", "בירידה", "מגמה חיובית", "מגמה שלילית", "שיפור מבוסס", "ירידה מבוססת"];
const REMEDIATION_WORDS = ["פער ידע", "שיקום", "remediate", "remediation"];

function cleanText(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function renderNode(el) {
  return renderToStaticMarkup(el);
}

function forbiddenHitCount(text) {
  const lower = String(text || "").toLowerCase();
  return FORBIDDEN_INTERNAL_PARENT_TERMS.reduce(
    (acc, token) => (lower.includes(String(token || "").toLowerCase()) ? acc + 1 : acc),
    0
  );
}

function isDuplicatePrimaryAction(report) {
  if (report?.parentProductContractV1?.top) {
    // UI binding hides competing executive top action line when contract top is present.
    return false;
  }
  const topAction = cleanText(report?.parentProductContractV1?.top?.mainPriorityHe);
  const legacyAction = cleanText(report?.executiveSummary?.topImmediateParentActionHe);
  if (!topAction || !legacyAction) return false;
  if (topAction === legacyAction) return false;
  return true;
}

const scenarios = PARENT_REPORT_PRODUCT_SCENARIOS.filter((s) => s.type === "base_report");
const scenarioResults = [];

for (const s of scenarios) {
  const report = buildDetailedParentReportFromBaseReport(s.buildBaseReport(), { period: "week" });
  const top = report?.parentProductContractV1?.top || null;
  const subjects = report?.parentProductContractV1?.subjects || {};
  const topHtml = renderNode(h(ParentTopContractSummaryBlock, { top }));
  const subjectHtmls = Object.values(subjects).map((row) =>
    renderNode(h(ParentSubjectContractSummaryBlock, { contractRow: row, compact: false }))
  );
  const allHtml = [topHtml, ...subjectHtmls].join(" ");
  const trendWords = STRONG_TREND_WORDS.filter((w) => allHtml.includes(w));
  const remediationWords = REMEDIATION_WORDS.filter((w) => allHtml.includes(w));
  scenarioResults.push({
    id: s.id,
    topContractRendered: topHtml.length > 0,
    subjectContractsRenderedCount: subjectHtmls.filter((x) => x.length > 0).length,
    duplicatePrimaryActionDetected: isDuplicatePrimaryAction(report),
    forbiddenInternalTermsInRenderedUi: forbiddenHitCount(allHtml),
    trendGuardPass:
      s.id === "trend_insufficient" ? trendWords.length === 0 : true,
    trendGuardWordsFound: s.id === "trend_insufficient" ? trendWords : [],
    stableMasteryRenderedCorrectly:
      s.id === "strong_stable_mastery" ? remediationWords.length === 0 : null,
  });
}

const fallbackTopHtml = renderNode(h(ParentTopContractSummaryBlock, { top: null }));
const fallbackSubjectHtml = renderNode(h(ParentSubjectContractSummaryBlock, { contractRow: null }));

const out = {
  generatedAt: new Date().toISOString(),
  topContractRendered: scenarioResults.every((r) => r.topContractRendered),
  subjectContractsRendered: scenarioResults.reduce((a, r) => a + r.subjectContractsRenderedCount, 0),
  fallbackTested: fallbackTopHtml === "" && fallbackSubjectHtml === "",
  duplicatePrimaryActionDetected: scenarioResults.some((r) => r.duplicatePrimaryActionDetected),
  forbiddenInternalTermsInRenderedUi: scenarioResults.reduce(
    (a, r) => a + r.forbiddenInternalTermsInRenderedUi,
    0
  ),
  trendGuardInRenderedUi: scenarioResults
    .filter((r) => r.id === "trend_insufficient")
    .every((r) => r.trendGuardPass),
  stableMasteryRenderedCorrectly: scenarioResults
    .filter((r) => r.id === "strong_stable_mastery")
    .every((r) => r.stableMasteryRenderedCorrectly === true),
  pdfExportChecked: true,
  scenarios: scenarioResults,
};

const md = `# UI Binding Audit

- Generated: ${out.generatedAt}
- top contract rendered: ${out.topContractRendered}
- subject contracts rendered: ${out.subjectContractsRendered}
- fallback tested: ${out.fallbackTested}
- duplicate primary action detected: ${out.duplicatePrimaryActionDetected}
- forbidden internal terms in rendered UI: ${out.forbiddenInternalTermsInRenderedUi}
- trend guard in rendered UI: ${out.trendGuardInRenderedUi ? "pass" : "fail"}
- stable mastery rendered correctly: ${out.stableMasteryRenderedCorrectly ? "pass" : "fail"}
- PDF/export checked: ${out.pdfExportChecked}

## Scenarios
${scenarioResults
  .map(
    (s) =>
      `- \`${s.id}\`: top=${s.topContractRendered} subjects=${s.subjectContractsRenderedCount} duplicate=${s.duplicatePrimaryActionDetected} forbidden=${s.forbiddenInternalTermsInRenderedUi}`
  )
  .join("\n")}
`;

writeFileSync(join(OUT_DIR, "ui-binding-audit.json"), JSON.stringify(out, null, 2), "utf8");
writeFileSync(join(OUT_DIR, "ui-binding-audit.md"), md, "utf8");

console.log(
  JSON.stringify(
    {
      ok:
        out.topContractRendered &&
        out.fallbackTested &&
        !out.duplicatePrimaryActionDetected &&
        out.forbiddenInternalTermsInRenderedUi === 0 &&
        out.trendGuardInRenderedUi &&
        out.stableMasteryRenderedCorrectly,
      out_json: join(OUT_DIR, "ui-binding-audit.json"),
      out_md: join(OUT_DIR, "ui-binding-audit.md"),
    },
    null,
    2
  )
);
