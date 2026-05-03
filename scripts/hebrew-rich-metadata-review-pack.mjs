#!/usr/bin/env node
/**
 * Hebrew rich enrichment review pack.
 * npm run qa:question-metadata:hebrew-rich-review-pack
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const ENRICHMENT_JSON = join(OUT_DIR, "hebrew-rich-enrichment-suggestions.json");
const OUT_JSON = join(OUT_DIR, "hebrew-rich-review-pack.json");
const OUT_MD = join(OUT_DIR, "hebrew-rich-review-pack.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const packMod = await import(
    new URL("../utils/question-metadata-qa/hebrew-rich-enrichment-review-pack.js", import.meta.url).href
  );
  const { buildHebrewRichReviewPack } = packMod;

  const sugMod = await import(
    new URL("../utils/question-metadata-qa/hebrew-rich-metadata-enrichment-suggestions.js", import.meta.url).href
  );
  const { generateHebrewRichSuggestions } = sugMod;

  let enrichmentPayload;
  let enrichmentSource = ENRICHMENT_JSON;

  if (existsSync(ENRICHMENT_JSON)) {
    enrichmentPayload = JSON.parse(await readFile(ENRICHMENT_JSON, "utf8"));
  } else {
    const { suggestions, hebrewRichCount, fieldHistogram } = generateHebrewRichSuggestions();
    const sortedFields = Object.entries(fieldHistogram).sort((a, b) => b[1] - a[1]);
    const confidenceCounts = { high: 0, medium: 0, low: 0 };
    const rpCounts = { high: 0, medium: 0, low: 0 };
    let prerequisiteSuggestionCount = 0;
    for (const s of suggestions) {
      if (confidenceCounts[s.confidence] !== undefined) confidenceCounts[s.confidence] += 1;
      if (rpCounts[s.reviewPriority] !== undefined) rpCounts[s.reviewPriority] += 1;
      if ((s.suggested?.prerequisiteSkillIds || []).length > 0) prerequisiteSuggestionCount += 1;
    }
    enrichmentPayload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      scope: { hebrewRichRowsAnalyzed: hebrewRichCount },
      summary: {
        totalSuggestions: suggestions.length,
        prerequisiteSuggestionCount,
        confidenceBreakdown: confidenceCounts,
        reviewPriorityBreakdown: rpCounts,
        suggestedFieldChangeHistogram: Object.fromEntries(sortedFields),
        topSuggestedFields: sortedFields.slice(0, 6).map(([k]) => k),
      },
      suggestions,
    };
    enrichmentSource = "(generated in-process)";
  }

  const pack = buildHebrewRichReviewPack(enrichmentPayload);
  await writeFile(OUT_JSON, JSON.stringify(pack, null, 2), "utf8");

  const s = pack.summary;
  const md = [
    "# Hebrew rich pool — review pack",
    "",
    `_Generated: ${pack.generatedAt}_`,
    `_Source: ${mdEscape(enrichmentSource)}_`,
    "",
    "## Summary",
    "",
    `- **Rows:** ${s.hebrewRichRowCount}`,
    `- **Non-empty prerequisite suggestions:** ${s.prerequisiteSuggestionCount ?? 0}`,
    `- **Confidence H/M/L:** ${s.confidenceBreakdown.high}/${s.confidenceBreakdown.medium}/${s.confidenceBreakdown.low}`,
    `- **Review priority H/M/L:** ${s.reviewPriorityBreakdown.high}/${s.reviewPriorityBreakdown.medium}/${s.reviewPriorityBreakdown.low}`,
    "",
    "## Checklist",
    "",
    `- **Approve as-is:** ${pack.checklist.approveAsIs}`,
    `- **Edit metadata:** ${pack.checklist.editMetadata}`,
    `- **Reject suggestion:** ${pack.checklist.rejectSuggestion}`,
    `- **Needs curriculum expert:** ${pack.checklist.needsCurriculumExpert}`,
    "",
    "## Grouped by skillId",
    "",
    "| Skill | Count | Examples |",
    "| --- | ---: | --- |",
    ...Object.entries(pack.groupedBySkillId || {}).map(([k, v]) =>
      `| ${mdEscape(k)} | ${v.count} | ${mdEscape((v.exampleQuestionIds || []).join(", "))} |`
    ),
    "",
    "## Outputs",
    "",
    `- \`reports/question-metadata-qa/hebrew-rich-review-pack.json\``,
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Hebrew rich review pack — rows: ${s.hebrewRichRowCount}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
