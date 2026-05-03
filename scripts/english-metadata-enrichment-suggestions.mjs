#!/usr/bin/env node
/**
 * English static pools metadata enrichment proposals only.
 * npm run qa:question-metadata:english-suggestions
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "english-enrichment-suggestions.json");
const OUT_MD = join(OUT_DIR, "english-enrichment-suggestions.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const mod = await import(
    new URL("../utils/question-metadata-qa/english-metadata-enrichment-suggestions.js", import.meta.url).href
  );
  const { generateEnglishSuggestions } = mod;

  const { suggestions, englishRowCount, rowsBySourceFile, fieldHistogram } = generateEnglishSuggestions();

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
      subjects: ["english"],
      sources: [
        "data/english-questions/grammar-pools.js",
        "data/english-questions/translation-pools.js",
        "data/english-questions/sentence-pools.js",
      ],
      englishRowsAnalyzed: englishRowCount,
      rowsBySourceFile,
    },
    summary: {
      totalSuggestions: suggestions.length,
      prerequisiteSuggestionCount,
      confidenceBreakdown: confidenceCounts,
      reviewPriorityBreakdown: reviewPriorityCounts,
      suggestedFieldChangeHistogram: Object.fromEntries(sortedFields),
      topSuggestedFields: sortedFields.slice(0, 8).map(([k]) => k),
    },
    suggestions,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const rowsByFileMd = Object.entries(rowsBySourceFile)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([f, c]) => `- \`${mdEscape(f)}\`: **${c}**`)
    .join("\n");

  const md = [
    "# English pools — enrichment suggestions (proposal only)",
    "",
    `_Generated: ${payload.generatedAt}_`,
    "",
    "## Scope",
    "",
    `- **English rows analyzed:** ${englishRowCount}`,
    `- **Suggestions:** ${suggestions.length}`,
    `- **Non-empty prerequisite suggestions:** ${prerequisiteSuggestionCount}`,
    "",
    "### Rows by source file",
    "",
    rowsByFileMd,
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
    "## Field deltas vs scanner snapshot",
    "",
    ...sortedFields.map(([k, n]) => `- **${mdEscape(k)}:** ${n}`),
    "",
    "## Sample",
    "",
    "| questionId | confidence | difficulty | cognitive | skillId |",
    "| --- | --- | --- | --- | --- |",
    ...suggestions.slice(0, 12).map(
      (s) =>
        `| ${mdEscape(s.questionId)} | ${mdEscape(s.confidence)} | ${mdEscape(s.suggested?.difficulty)} | ${mdEscape(
          s.suggested?.cognitiveLevel
        )} | ${mdEscape(s.suggested?.skillId)} |`
    ),
    "",
    "## Output",
    "",
    `- \`reports/question-metadata-qa/english-enrichment-suggestions.json\``,
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  English enrichment — rows:", englishRowCount);
  console.log(`  Confidence — high: ${confidenceCounts.high}, medium: ${confidenceCounts.medium}, low: ${confidenceCounts.low}`);
  console.log(`  Prerequisite suggestions (non-empty): ${prerequisiteSuggestionCount}`);
  console.log(`  Reports: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
