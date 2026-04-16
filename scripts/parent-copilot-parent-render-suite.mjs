/**
 * Real SSR render probes for parent-facing surfaces (not source-string scanning).
 * Run: npm run test:parent-copilot-parent-render
 */
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

async function importFromRoot(rel) {
  const m = await import(pathToFileURL(join(ROOT, rel)).href);
  return m.default && typeof m.default === "object" ? m.default : m;
}

const { buildDetailedParentReportFromBaseReport } = await importFromRoot("utils/detailed-parent-report.js");
const { normalizeExecutiveSummary } = await importFromRoot("utils/parent-report-payload-normalize.js");
const { PARENT_REPORT_SCENARIOS } = await import(pathToFileURL(join(ROOT, "tests/fixtures/parent-report-pipeline.mjs")).href);
const detailedSurface = await import(pathToFileURL(join(ROOT, "components/parent-report-detailed-surface.jsx")).href);
const { ExecutiveSummarySection } = detailedSurface;
const ParentCopilotShell = (await import(pathToFileURL(join(ROOT, "components/parent-copilot/parent-copilot-shell.jsx")).href))
  .default;

const forbiddenTokens = [
  "AI Hybrid",
  "reviewHybrid",
  "Parent Copilot",
  "debug",
  "canonical",
  "AiHybridInternalReviewerPanel",
  "ai-hybrid-internal-reviewer",
];

/** Raw contract / engine tokens must not leak into parent HTML */
const rawEnumLeak = /\b(knowledge_gap|insufficient_evidence|advance_level|maintain_and_strengthen|WE\d+|RI\d+)\b/i;

function assertNoForbidden(html, label) {
  for (const token of forbiddenTokens) {
    assert.ok(!html.includes(token), `${label} must not include: ${token}`);
  }
  assert.ok(!rawEnumLeak.test(html), `${label} must not include raw enum-like tokens`);
}

/** Mirrors the parent detailed page no-pdf chrome + first visible report block (same components as the page). */
function ParentDetailedPageParentFacingChunk({ payload }) {
  return h(
    "div",
    { className: "max-w-4xl mx-auto w-full min-w-0", dir: "rtl" },
    h(
      "div",
      { className: "no-pdf rounded-lg border border-cyan-500/20 bg-cyan-950/15 px-3 py-2" },
      h(ParentCopilotShell, { payload }),
    ),
    h(
      "section",
      { className: "pr-detailed-section" },
      h("h2", { className: "pr-detailed-section-title" }, "סיכום לתקופה"),
      h(ExecutiveSummarySection, { es: normalizeExecutiveSummary(payload), compact: false }),
    ),
  );
}

const sparse = buildDetailedParentReportFromBaseReport(PARENT_REPORT_SCENARIOS.all_sparse(), { period: "week" });
assert.ok(sparse, "fixture payload");

const detailedHtml = renderToStaticMarkup(h(ParentDetailedPageParentFacingChunk, { payload: sparse }));
assertNoForbidden(detailedHtml, "parent detailed page (parent-facing chunk SSR)");

const copilotHtml = renderToStaticMarkup(h(ParentCopilotShell, { payload: sparse }));
assertNoForbidden(copilotHtml, "parent copilot shell (panel SSR)");

const mobileSnapshotHtml = renderToStaticMarkup(
  h("div", { style: { width: "390px" } }, h(ParentCopilotShell, { payload: sparse })),
);
assertNoForbidden(mobileSnapshotHtml, "mobile-sized copilot SSR snapshot");
assert.ok(
  mobileSnapshotHtml.includes("אפשר לשאול כאן בחופשיות על הדוח"),
  "mobile snapshot should include parent helper copy",
);

console.log("parent-copilot-parent-render-suite: OK");
