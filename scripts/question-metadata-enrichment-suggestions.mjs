#!/usr/bin/env node
/**
 * Generates enrichment proposals only — never writes question banks.
 * npm run qa:question-metadata:suggestions
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "enrichment-suggestions.json");
const OUT_MD = join(OUT_DIR, "enrichment-suggestions.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const mod = await import(
    new URL("../utils/question-metadata-qa/question-metadata-enrichment-suggestions.js", import.meta.url).href
  );
  const { generateScienceSuggestions } = mod;

  const { suggestions, scienceCount, fieldHistogram } = generateScienceSuggestions();

  /** @type {Record<string, number>} */
  const confidenceCounts = { high: 0, medium: 0, low: 0 };
  /** @type {Record<string, number>} */
  const reviewPriorityCounts = { high: 0, medium: 0, low: 0 };
  let sequentialPrereq = 0;
  for (const s of suggestions) {
    const c = s.confidence;
    if (confidenceCounts[c] !== undefined) confidenceCounts[c] += 1;
    const rp = s.reviewPriority;
    if (reviewPriorityCounts[rp] !== undefined) reviewPriorityCounts[rp] += 1;
    if (s.sequentialPrereqHeuristic) sequentialPrereq += 1;
  }

  const sortedFields = Object.entries(fieldHistogram).sort((a, b) => b[1] - a[1]);

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    scope: {
      detailedSubjects: ["science"],
      scienceQuestionsAnalyzed: scienceCount,
      note: "Detailed per-question suggestions are science-only in this phase; other subjects use metadata QA summary.",
    },
    summary: {
      totalSuggestions: suggestions.length,
      confidenceBreakdown: confidenceCounts,
      reviewPriorityBreakdown: reviewPriorityCounts,
      sequentialPrereqHeuristicCount: sequentialPrereq,
      suggestedFieldChangeHistogram: Object.fromEntries(sortedFields),
      topSuggestedFields: sortedFields.slice(0, 6).map(([k]) => k),
    },
    suggestions,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Question metadata — enrichment suggestions (proposal only)",
    "",
    `_Generated: ${payload.generatedAt}_`,
    "",
    "## Scope",
    "",
    `- **Science questions analyzed:** ${scienceCount}`,
    `- **Suggestions emitted:** ${suggestions.length} (one row per science question)`,
    `- **Do not bulk-apply:** review each suggestion; semantics stay authoritative in Hebrew stems.`,
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
    `_Sequential prerequisite heuristic rows: ${sequentialPrereq}_`,
    "",
    "## Fields most often changed vs current scanner snapshot",
    "",
    "| Field | Questions where suggestion differs |",
    "| --- | ---: |",
    ...sortedFields.map(([k, n]) => `| ${mdEscape(k)} | ${n} |`),
    "",
    "## Sample (first 15 ids)",
    "",
    "| questionId | confidence | suggested subskillId | cognitive | prerequisites |",
    "| --- | --- | --- | --- | --- |",
    ...suggestions.slice(0, 15).map(
      (s) =>
        `| ${mdEscape(s.questionId)} | ${mdEscape(s.confidence)} | ${mdEscape(s.suggested?.subskillId)} | ${mdEscape(
          s.suggested?.cognitiveLevel
        )} | ${mdEscape((s.suggested?.prerequisiteSkillIds || []).join(","))} |`
    ),
    "",
    "## Outputs",
    "",
    "- `reports/question-metadata-qa/enrichment-suggestions.json` — full payload",
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Enrichment suggestions — science rows:", scienceCount);
  console.log(`  Confidence — high: ${confidenceCounts.high}, medium: ${confidenceCounts.medium}, low: ${confidenceCounts.low}`);
  console.log(
    `  Review priority — high: ${reviewPriorityCounts.high}, medium: ${reviewPriorityCounts.medium}, low: ${reviewPriorityCounts.low}`
  );
  console.log(`  Reports: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
