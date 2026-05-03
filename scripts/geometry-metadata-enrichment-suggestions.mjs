#!/usr/bin/env node
/**
 * Geometry conceptual metadata enrichment proposals only — never writes question banks.
 * npm run qa:question-metadata:geometry-suggestions
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "geometry-enrichment-suggestions.json");
const OUT_MD = join(OUT_DIR, "geometry-enrichment-suggestions.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const mod = await import(
    new URL("../utils/question-metadata-qa/geometry-metadata-enrichment-suggestions.js", import.meta.url).href
  );
  const { generateGeometrySuggestions } = mod;

  const { suggestions, geometryCount, fieldHistogram } = generateGeometrySuggestions();

  /** @type {Record<string, number>} */
  const confidenceCounts = { high: 0, medium: 0, low: 0 };
  /** @type {Record<string, number>} */
  const reviewPriorityCounts = { high: 0, medium: 0, low: 0 };
  let prerequisiteSuggestionCount = 0;
  for (const s of suggestions) {
    const c = s.confidence;
    if (confidenceCounts[c] !== undefined) confidenceCounts[c] += 1;
    const rp = s.reviewPriority;
    if (reviewPriorityCounts[rp] !== undefined) reviewPriorityCounts[rp] += 1;
    if ((s.suggested?.prerequisiteSkillIds || []).length > 0) prerequisiteSuggestionCount += 1;
  }

  const sortedFields = Object.entries(fieldHistogram).sort((a, b) => b[1] - a[1]);

  const discoveryNote =
    "Static scan: utils/geometry-conceptual-bank.js → GEOMETRY_CONCEPTUAL_ITEMS. " +
    "Procedural source (not enumerated as static rows): utils/geometry-question-generator.js (see question-bank-discovery).";

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    scope: {
      subjects: ["geometry"],
      geometryConceptualRowsAnalyzed: geometryCount,
      sourcesDiscovered: [
        "utils/geometry-conceptual-bank.js (GEOMETRY_CONCEPTUAL_ITEMS)",
        "utils/geometry-question-generator.js (procedural — documented only)",
      ],
      note: discoveryNote,
    },
    summary: {
      totalSuggestions: suggestions.length,
      prerequisiteSuggestionCount,
      confidenceBreakdown: confidenceCounts,
      reviewPriorityBreakdown: reviewPriorityCounts,
      suggestedFieldChangeHistogram: Object.fromEntries(sortedFields),
      topSuggestedFields: sortedFields.slice(0, 6).map(([k]) => k),
    },
    suggestions,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Geometry metadata — enrichment suggestions (proposal only)",
    "",
    `_Generated: ${payload.generatedAt}_`,
    "",
    "## Scope",
    "",
    `- **Geometry conceptual rows analyzed:** ${geometryCount}`,
    `- **Suggestions emitted:** ${suggestions.length}`,
    `- **Prerequisite suggestions (non-empty):** ${prerequisiteSuggestionCount}`,
    `- **Sources:** ${payload.scope.sourcesDiscovered.map((x) => `\`${x}\``).join(", ")}`,
    "",
    "## Confidence distribution",
    "",
    "| Level | Count |",
    "| --- | ---: |",
    `| high | ${confidenceCounts.high} |`,
    `| medium | ${confidenceCounts.medium} |`,
    `| low | ${confidenceCounts.low} |`,
    "",
    "## Review priority (queue)",
    "",
    "| Priority | Count |",
    "| --- | ---: |",
    `| high | ${reviewPriorityCounts.high} |`,
    `| medium | ${reviewPriorityCounts.medium} |`,
    `| low | ${reviewPriorityCounts.low} |`,
    "",
    "## Fields most often changed vs current scanner snapshot",
    "",
    "| Field | Rows where suggestion differs |",
    "| --- | ---: |",
    ...sortedFields.map(([k, n]) => `| ${mdEscape(k)} | ${n} |`),
    "",
    "## Sample (first 15 ids)",
    "",
    "| questionId | confidence | suggested difficulty | cognitive | prerequisites |",
    "| --- | --- | --- | --- | --- |",
    ...suggestions.slice(0, 15).map(
      (s) =>
        `| ${mdEscape(s.questionId)} | ${mdEscape(s.confidence)} | ${mdEscape(s.suggested?.difficulty)} | ${mdEscape(
          s.suggested?.cognitiveLevel
        )} | ${mdEscape((s.suggested?.prerequisiteSkillIds || []).join(","))} |`
    ),
    "",
    "## Outputs",
    "",
    "- `reports/question-metadata-qa/geometry-enrichment-suggestions.json` — full payload",
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Geometry enrichment — conceptual rows:", geometryCount);
  console.log(`  Confidence — high: ${confidenceCounts.high}, medium: ${confidenceCounts.medium}, low: ${confidenceCounts.low}`);
  console.log(
    `  Review priority — high: ${reviewPriorityCounts.high}, medium: ${reviewPriorityCounts.medium}, low: ${reviewPriorityCounts.low}`
  );
  console.log(`  Prerequisite suggestions (non-empty): ${prerequisiteSuggestionCount}`);
  console.log(`  Reports: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
