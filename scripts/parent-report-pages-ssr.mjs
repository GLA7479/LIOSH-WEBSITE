/**
 * רינדור SSR לרכיבים שמוצגים בדפי הדוח (לא E2E מלא) — עמידות לפני שינויי payload.
 * הרצה: npm run test:parent-report-phase6 (שרשרת ב-package.json), או ישירות: npx tsx scripts/parent-report-pages-ssr.mjs
 * תיעוד: docs/PARENT_REPORT.md
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

const detailedMod = await import(pathToFileURL(join(ROOT, "components/parent-report-detailed-surface.jsx")).href);
const {
  ExecutiveSummarySection,
  SubjectPhase3Insights,
  SubjectSummaryBlock,
  TopicRecommendationExplainStrip,
} = detailedMod;

const parentMod = await import(pathToFileURL(join(ROOT, "components/parent-report-topic-explain-row.jsx")).href);
const { ParentReportTopicExplainRow, ParentReportTopicExplainBlock } = parentMod;

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

function runDetailedPageChunks() {
  const longHe = "כותרת־ארוכה־".repeat(40);
  const longWhy = "למה ".repeat(120) + "knowledge_gap — הסבר ארוך ללא קריסה.";

  const sparse = buildDetailedParentReportFromBaseReport(PARENT_REPORT_SCENARIOS.all_sparse(), { period: "week" });
  assert.ok(sparse);

  render("exec:missing-executiveSummary", h(ExecutiveSummarySection, { es: normalizeExecutiveSummary({}), compact: false }));
  render("exec:sparse-normalized", h(ExecutiveSummarySection, { es: normalizeExecutiveSummary(sparse), compact: true }));
  render("exec:sparse-full", h(ExecutiveSummarySection, { es: normalizeExecutiveSummary(sparse), compact: false }));

  const partialPayload = { ...sparse, executiveSummary: undefined };
  render("exec:undefined-executiveSummary", h(ExecutiveSummarySection, { es: normalizeExecutiveSummary(partialPayload), compact: false }));

  const strong = buildDetailedParentReportFromBaseReport(PARENT_REPORT_SCENARIOS.strong_executive_case(), { period: "week" });
  const spMath = strong.subjectProfiles.find((s) => s.subject === "math") || strong.subjectProfiles[0];
  const spStress = {
    ...spMath,
    subjectLabelHe: longHe,
    dominantLearningRiskLabelHe: longHe,
    trendNarrativeHe: longHe,
    recommendedHomeMethodHe: longHe,
    whatNotToDoHe: longHe,
  };
  render("phase3:long-labels-compact", h(SubjectPhase3Insights, { sp: spStress, compact: true }));
  render("phase3:long-labels-full", h(SubjectPhase3Insights, { sp: spStress, compact: false }));

  const spPartial = {
    subject: "math",
    subjectLabelHe: "חשבון",
    topStrengths: [],
    topWeaknesses: [],
    topicRecommendations: [],
    dominantLearningRisk: "knowledge_gap",
    dominantSuccessPattern: null,
    dominantLearningRiskLabelHe: "פער ידע",
    dominantSuccessPatternLabelHe: null,
    trendNarrativeHe: null,
    confidenceSummaryHe: null,
    recommendedHomeMethodHe: null,
    whatNotToDoHe: null,
    majorRiskFlagsAcrossRows: { recentTransitionRisk: true },
    dominantBehaviorProfileAcrossRows: null,
    fragileSuccessRowCount: 0,
    stableMasteryRowCount: 0,
    modeConcentrationNoteHe: null,
  };
  render("phase3:partial-fields", h(SubjectPhase3Insights, { sp: spPartial, compact: true }));
  render("summary-block:sparse", h(SubjectSummaryBlock, { sp: sparse.subjectProfiles[0] }));

  const oneDom = buildDetailedParentReportFromBaseReport(PARENT_REPORT_SCENARIOS.one_dominant_subject(), { period: "week" });
  const tr = oneDom.subjectProfiles[0]?.topicRecommendations?.[0];
  assert.ok(tr, "topic rec for strip");
  render("topic-strip:golden", h(TopicRecommendationExplainStrip, { tr }));

  const trSparseSignals = {
    ...tr,
    whyThisRecommendationHe: longWhy,
    topicEngineRowSignals: {
      riskFlags: { hintDependenceRisk: true },
      whyThisRecommendationHe: longWhy,
      diagnosticType: "knowledge_gap",
    },
  };
  render("topic-strip:long-why-partial-sig", h(TopicRecommendationExplainStrip, { tr: trSparseSignals }));
}

function runParentReportPageChunks() {
  const longLabel = "שם־נושא־ארוך־" + "א".repeat(200);
  const longWhy = "ב".repeat(500);
  const row = {
    rowKey: "k1",
    label: longLabel,
    questions: 12,
    topicEngineRowSignals: {
      whyThisRecommendationHe: longWhy,
      riskFlags: { falsePromotionRisk: true, recentTransitionRisk: true },
      diagnosticType: "fragile_success",
      confidenceBadge: "medium",
      sufficiencyBadge: "low",
    },
    trend: { version: 1, accuracyDirection: "down", independenceDirection: "up", fluencyDirection: "flat", confidence: 0.5, summaryHe: "מגמה קצרה." },
    behaviorProfile: { version: 1, dominantType: "instruction_friction", signals: {}, decisionTrace: [] },
    decisionTrace: [],
    recommendationDecisionTrace: [],
  };
  render("parent-report:explain-row-stress", h(ParentReportTopicExplainRow, { row }));
  render("parent-report:explain-block", h(ParentReportTopicExplainBlock, { rows: [row] }));

  const rowMinimal = {
    rowKey: "k2",
    label: "חיבור",
    questions: 8,
    topicEngineRowSignals: null,
    trend: null,
    behaviorProfile: null,
  };
  render("parent-report:explain-row-minimal", h(ParentReportTopicExplainRow, { row: rowMinimal }));
}

function main() {
  runDetailedPageChunks();
  runParentReportPageChunks();
  console.log("parent-report pages SSR smoke: OK");
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
