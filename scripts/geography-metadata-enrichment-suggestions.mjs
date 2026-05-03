#!/usr/bin/env node
/**
 * Moledet / geography metadata enrichment proposals.
 * npm run qa:question-metadata:geography-suggestions
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "geography-enrichment-suggestions.json");
const OUT_MD = join(OUT_DIR, "geography-enrichment-suggestions.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const mod = await import(
    new URL("../utils/question-metadata-qa/geography-metadata-enrichment-suggestions.js", import.meta.url).href
  );
  const { generateMoledetGeographySuggestions } = mod;

  const { suggestions, rowCountByFile, geographyRowTotal, fieldHistogram } = await generateMoledetGeographySuggestions(ROOT);

  const confidenceCounts = { high: 0, medium: 0, low: 0 };
  const reviewPriorityCounts = { high: 0, medium: 0, low: 0 };
  let prerequisiteSuggestionCount = 0;
  for (const s of suggestions) {
    if (confidenceCounts[s.confidence] !== undefined) confidenceCounts[s.confidence] += 1;
    if (reviewPriorityCounts[s.reviewPriority] !== undefined) reviewPriorityCounts[s.reviewPriority] += 1;
    if ((s.suggested?.prerequisiteSkillIds || []).length > 0) prerequisiteSuggestionCount += 1;
  }

  const sortedFields = Object.entries(fieldHistogram).sort((a, b) => b[1] - a[1]);

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    scope: {
      subject: "moledet-geography",
      sources: [
        "data/geography-questions/g1.js",
        "data/geography-questions/g2.js",
        "data/geography-questions/g3.js",
        "data/geography-questions/g4.js",
        "data/geography-questions/g5.js",
        "data/geography-questions/g6.js",
      ],
      rowCountByFile,
      geographyRowTotal,
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
    "# Moledet / geography — enrichment suggestions (proposal only)",
    "",
    `_Generated: ${payload.generatedAt}_`,
    "",
    "## Scope",
    "",
    `- **Total rows:** ${geographyRowTotal}`,
    ...Object.entries(rowCountByFile).map(([f, n]) => `- **${mdEscape(f)}:** ${n} rows`),
    "",
    "## Confidence",
    "",
    "| Level | Count |",
    "| --- | ---: |",
    `| high | ${confidenceCounts.high} |`,
    `| medium | ${confidenceCounts.medium} |`,
    `| low | ${confidenceCounts.low} |`,
    "",
    "## Review priority",
    "",
    "| Priority | Count |",
    "| --- | ---: |",
    `| high | ${reviewPriorityCounts.high} |`,
    `| medium | ${reviewPriorityCounts.medium} |`,
    `| low | ${reviewPriorityCounts.low} |`,
    "",
    "## Field deltas vs current",
    "",
    ...sortedFields.map(([k, n]) => `- **${mdEscape(k)}:** ${n}`),
    "",
    "## Sample",
    "",
    "| objectPath | grade | confidence | difficulty | skillId |",
    "| --- | --- | --- | --- | --- |",
    ...suggestions.slice(0, 14).map(
      (s) =>
        `| ${mdEscape(s.objectPath)} | ${mdEscape(s.grade)} | ${mdEscape(s.confidence)} | ${mdEscape(
          s.suggested?.difficulty
        )} | ${mdEscape(s.suggested?.skillId)} |`
    ),
    "",
    "## Output",
    "",
    `- \`reports/question-metadata-qa/geography-enrichment-suggestions.json\``,
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Moledet/geography enrichment — total rows:", geographyRowTotal);
  console.log(
    `  Confidence — high: ${confidenceCounts.high}, medium: ${confidenceCounts.medium}, low: ${confidenceCounts.low}`
  );
  console.log(`  Prerequisite suggestions (non-empty): ${prerequisiteSuggestionCount}`);
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
