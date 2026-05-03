#!/usr/bin/env node
/**
 * Geometry enrichment review pack — aggregates geometry suggestions.
 * npm run qa:question-metadata:geometry-review-pack
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const GEOMETRY_ENRICHMENT_JSON = join(OUT_DIR, "geometry-enrichment-suggestions.json");
const OUT_JSON = join(OUT_DIR, "geometry-review-pack.json");
const OUT_MD = join(OUT_DIR, "geometry-review-pack.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const packMod = await import(
    new URL("../utils/question-metadata-qa/geometry-enrichment-review-pack.js", import.meta.url).href
  );
  const { buildGeometryReviewPack } = packMod;

  const sugMod = await import(
    new URL("../utils/question-metadata-qa/geometry-metadata-enrichment-suggestions.js", import.meta.url).href
  );
  const { generateGeometrySuggestions } = sugMod;

  let enrichmentPayload;
  let enrichmentSource = GEOMETRY_ENRICHMENT_JSON;

  if (existsSync(GEOMETRY_ENRICHMENT_JSON)) {
    const txt = await readFile(GEOMETRY_ENRICHMENT_JSON, "utf8");
    enrichmentPayload = JSON.parse(txt);
  } else {
    const { suggestions, geometryCount, fieldHistogram } = generateGeometrySuggestions();
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
      scope: {
        subjects: ["geometry"],
        geometryConceptualRowsAnalyzed: geometryCount,
      },
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

  const pack = buildGeometryReviewPack(enrichmentPayload);

  await writeFile(OUT_JSON, JSON.stringify(pack, null, 2), "utf8");

  const s = pack.summary;
  const md = [
    "# Geometry metadata — enrichment review pack",
    "",
    `_Generated: ${pack.generatedAt}_`,
    `_Enrichment source: ${mdEscape(enrichmentSource)}_`,
    "",
    "## Summary",
    "",
    `- **Geometry conceptual rows:** ${s.geometryRowCount}`,
    `- **Rows with non-empty prerequisite suggestions:** ${s.prerequisiteSuggestionCount ?? 0}`,
    `- **Confidence — high / medium / low:** ${s.confidenceBreakdown.high} / ${s.confidenceBreakdown.medium} / ${s.confidenceBreakdown.low}`,
    `- **Review priority — high / medium / low:** ${s.reviewPriorityBreakdown.high} / ${s.reviewPriorityBreakdown.medium} / ${s.reviewPriorityBreakdown.low}`,
    `- **Low confidence rows:** ${s.lowConfidenceCount}`,
    "",
    "## Checklist (human)",
    "",
    `- **Approve as-is:** ${pack.checklist.approveAsIs}`,
    `- **Edit metadata:** ${pack.checklist.editMetadata}`,
    `- **Reject suggestion:** ${pack.checklist.rejectSuggestion}`,
    `- **Needs curriculum expert:** ${pack.checklist.needsCurriculumExpert}`,
    "",
    "## Suggested difficulty (summary)",
    "",
    "| Value | Count |",
    "| --- | ---: |",
    ...(pack.suggestedDifficultySummary || []).map((x) => `| ${mdEscape(x.pattern)} | ${x.count} |`),
    "",
    "## Suggested cognitive level (summary)",
    "",
    "| Value | Count |",
    "| --- | ---: |",
    ...(pack.suggestedCognitiveLevelSummary || []).map((x) => `| ${mdEscape(x.pattern)} | ${x.count} |`),
    "",
    "## Suggested expected error types (summary)",
    "",
    "| Pattern | Count |",
    "| --- | ---: |",
    ...(pack.suggestedExpectedErrorTypesSummary || []).slice(0, 20).map((x) => `| ${mdEscape(x.pattern)} | ${x.count} |`),
    "",
    "## Prerequisite suggestions (summary)",
    "",
    "| Pattern | Count |",
    "| --- | ---: |",
    ...(pack.prerequisiteSuggestionSummary || []).map((x) => `| ${mdEscape(x.pattern)} | ${x.count} |`),
    "",
    "## Grouped by skillId",
    "",
    "| Skill | Count | Examples |",
    "| --- | ---: | --- |",
    ...Object.entries(pack.groupedBySkillId || {}).map(([k, v]) =>
      `| ${mdEscape(k)} | ${v.count} | ${mdEscape((v.exampleQuestionIds || []).join(", "))} |`
    ),
    "",
    "## Grouped by subskillId",
    "",
    "| Subskill | Count | Examples |",
    "| --- | ---: | --- |",
    ...Object.entries(pack.groupedBySubskillId || {}).map(([k, v]) =>
      `| ${mdEscape(k)} | ${v.count} | ${mdEscape((v.exampleQuestionIds || []).join(", "))} |`
    ),
    "",
    "## Outputs",
    "",
    "- `reports/question-metadata-qa/geometry-review-pack.json`",
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Geometry review pack — rows: ${s.geometryRowCount}`);
  console.log(
    `  Confidence H/M/L: ${s.confidenceBreakdown.high}/${s.confidenceBreakdown.medium}/${s.confidenceBreakdown.low}`
  );
  console.log(
    `  Review priority H/M/L: ${s.reviewPriorityBreakdown.high}/${s.reviewPriorityBreakdown.medium}/${s.reviewPriorityBreakdown.low}`
  );
  console.log(`  Prerequisite suggestions (non-empty rows): ${s.prerequisiteSuggestionCount ?? 0}`);
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
