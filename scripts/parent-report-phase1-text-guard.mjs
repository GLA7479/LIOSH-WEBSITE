/**
 * Phase 1 (A): parent-facing HTML must not contain known internal/demo leakage substrings.
 * Run: npx tsx scripts/parent-report-phase1-text-guard.mjs
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
const {
  PARENT_REPORT_FORBIDDEN_LEAKAGE_SUBSTRINGS,
  PARENT_REPORT_STANDALONE_ZERO_LEAK_RE,
} = await importFromRoot("utils/parent-data-presence.js");
const { PARENT_REPORT_SCENARIOS } = await import(
  pathToFileURL(join(ROOT, "tests/fixtures/parent-report-pipeline.mjs")).href
);
const { buildSyntheticBaseReport } = await import(
  pathToFileURL(join(ROOT, "tests/fixtures/parent-report-pipeline.mjs")).href
);

const detailedMod = await import(pathToFileURL(join(ROOT, "components/parent-report-detailed-surface.jsx")).href);
const { ExecutiveSummarySection } = detailedMod;

function assertNoForbiddenInHtml(html, label) {
  const s = String(html || "");
  for (const bad of PARENT_REPORT_FORBIDDEN_LEAKAGE_SUBSTRINGS) {
    assert.ok(!s.includes(bad), `${label}: forbidden substring "${bad}"`);
  }
  const textish = s.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  assert.ok(
    !PARENT_REPORT_STANDALONE_ZERO_LEAK_RE.test(textish),
    `${label}: standalone placeholder 00000 must not appear in visible text`
  );
}

function render(label, el) {
  let html;
  try {
    html = renderToStaticMarkup(el);
  } catch (e) {
    throw new Error(`${label}: ${e?.message || e}`);
  }
  assert.ok(typeof html === "string" && html.length > 0, `${label}: empty html`);
  return html;
}

const SCENARIO_KEYS = ["all_sparse", "knowledge_gap", "stable_excellence", "strong_executive_case"];

function englishStrengthBaseReport() {
  return buildSyntheticBaseReport({
    summary: {
      totalQuestions: 42,
      totalTimeMinutes: 30,
      overallAccuracy: 90,
      englishQuestions: 42,
      englishCorrect: 38,
      englishAccuracy: 90,
    },
    englishTopics: {
      fixture_topic: { questions: 42, correct: 38, accuracy: 90 },
    },
  });
}

for (const key of SCENARIO_KEYS) {
  const build = PARENT_REPORT_SCENARIOS[key];
  if (typeof build !== "function") continue;
  const base = build();
  if (!base) continue;
  const detailed = buildDetailedParentReportFromBaseReport(base, { period: "week" });
  if (!detailed) continue;
  const es = normalizeExecutiveSummary(detailed);
  const html = render(`exec-guard:${key}`, h(ExecutiveSummarySection, { es, compact: false }));
  assertNoForbiddenInHtml(html, "ExecutiveSummarySection");
}

{
  const detailed = buildDetailedParentReportFromBaseReport(englishStrengthBaseReport(), { period: "week" });
  assert.ok(detailed, "english fixture detailed");
  const es = normalizeExecutiveSummary(detailed);
  const html = render("exec-guard:english-strength", h(ExecutiveSummarySection, { es, compact: false }));
  assertNoForbiddenInHtml(html, "english-strength");
  assert.ok(
    html.includes("אנגלית") &&
      (html.includes("תוצאות טובות") || html.includes("יציבות") || html.includes("חוזקה")),
    "english-strength: expected strength wording in executive HTML"
  );
  const totalQ = Number(detailed.overallSnapshot?.totalQuestions) || 0;
  if (totalQ > 10) {
    assert.ok(
      !html.includes("אין נתונים להצגה"),
      "english-strength: must not show generic no-data bullets when window has volume"
    );
  }
}

console.log("parent-report-phase1-text-guard: OK");
