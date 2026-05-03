#!/usr/bin/env node
/**
 * Hebrew rich pool metadata enrichment proposals only.
 * npm run qa:question-metadata:hebrew-rich-suggestions
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "hebrew-rich-enrichment-suggestions.json");
const OUT_MD = join(OUT_DIR, "hebrew-rich-enrichment-suggestions.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const mod = await import(
    new URL("../utils/question-metadata-qa/hebrew-rich-metadata-enrichment-suggestions.js", import.meta.url).href
  );
  const { generateHebrewRichSuggestions } = mod;

  const { suggestions, hebrewRichCount, fieldHistogram } = generateHebrewRichSuggestions();

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
      subjects: ["hebrew"],
      source: "utils/hebrew-rich-question-bank.js (HEBREW_RICH_POOL only)",
      hebrewRichRowsAnalyzed: hebrewRichCount,
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
    "# Hebrew rich pool — enrichment suggestions (proposal only)",
    "",
    `_Generated: ${payload.generatedAt}_`,
    "",
    "## Scope",
    "",
    `- **HEBREW_RICH_POOL rows:** ${hebrewRichCount}`,
    `- **Suggestions:** ${suggestions.length}`,
    `- **Non-empty prerequisite suggestions:** ${prerequisiteSuggestionCount}`,
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
    "| questionId | confidence | difficulty | cognitive | prereq |",
    "| --- | --- | --- | --- | --- |",
    ...suggestions.slice(0, 12).map(
      (s) =>
        `| ${mdEscape(s.questionId)} | ${mdEscape(s.confidence)} | ${mdEscape(s.suggested?.difficulty)} | ${mdEscape(
          s.suggested?.cognitiveLevel
        )} | ${mdEscape((s.suggested?.prerequisiteSkillIds || []).join(","))} |`
    ),
    "",
    "## Output",
    "",
    `- \`reports/question-metadata-qa/hebrew-rich-enrichment-suggestions.json\``,
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Hebrew rich enrichment — rows:", hebrewRichCount);
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
