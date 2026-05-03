#!/usr/bin/env node
/**
 * Science enrichment review pack — aggregates suggestions + unknown error tokens.
 * npm run qa:question-metadata:science-review-pack
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const ENRICHMENT_JSON = join(OUT_DIR, "enrichment-suggestions.json");
const QUESTIONS_ISSUES = join(OUT_DIR, "questions-with-issues.json");
const QA_SUMMARY_JSON = join(OUT_DIR, "summary.json");
const OUT_JSON = join(OUT_DIR, "science-review-pack.json");
const OUT_MD = join(OUT_DIR, "science-review-pack.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

function histogramReasons(lowSuggestions) {
  /** @type {Map<string, number>} */
  const m = new Map();
  for (const s of lowSuggestions) {
    for (const r of s.confidenceReasons || []) {
      const k = String(r).slice(0, 120);
      m.set(k, (m.get(k) || 0) + 1);
    }
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([reason, count]) => ({ reason, count }));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const packMod = await import(
    new URL("../utils/question-metadata-qa/science-enrichment-review-pack.js", import.meta.url).href
  );
  const {
    loadEnrichmentSuggestionsJson,
    extractUnknownExpectedErrorTokens,
    countTaxonomyUnknownExpectedErrorRows,
    buildScienceReviewPack,
  } = packMod;

  let enrichmentPayload;
  let enrichmentSource = ENRICHMENT_JSON;

  if (existsSync(ENRICHMENT_JSON)) {
    enrichmentPayload = await loadEnrichmentSuggestionsJson(ENRICHMENT_JSON);
  } else {
    const sugMod = await import(
      new URL("../utils/question-metadata-qa/question-metadata-enrichment-suggestions.js", import.meta.url).href
    );
    const { generateScienceSuggestions } = sugMod;
    const { suggestions, scienceCount, fieldHistogram } = generateScienceSuggestions();
    const sortedFields = Object.entries(fieldHistogram).sort((a, b) => b[1] - a[1]);
    const confidenceCounts = { high: 0, medium: 0, low: 0 };
    const rpCounts = { high: 0, medium: 0, low: 0 };
    for (const s of suggestions) {
      if (confidenceCounts[s.confidence] !== undefined) confidenceCounts[s.confidence] += 1;
      if (rpCounts[s.reviewPriority] !== undefined) rpCounts[s.reviewPriority] += 1;
    }
    enrichmentPayload = {
      version: 1,
      generatedAt: new Date().toISOString(),
      scope: {
        detailedSubjects: ["science"],
        scienceQuestionsAnalyzed: scienceCount,
        note: "Regenerated in-process — enrichment-suggestions.json was missing.",
      },
      summary: {
        totalSuggestions: suggestions.length,
        confidenceBreakdown: confidenceCounts,
        reviewPriorityBreakdown: rpCounts,
        suggestedFieldChangeHistogram: Object.fromEntries(sortedFields),
        topSuggestedFields: sortedFields.slice(0, 6).map(([k]) => k),
      },
      suggestions,
    };
    enrichmentSource = "(generated in-process)";
  }

  let unknownTokens = [];
  let taxonomyUnknownIssueRowCount = null;
  if (existsSync(QUESTIONS_ISSUES)) {
    const qj = JSON.parse(await readFile(QUESTIONS_ISSUES, "utf8"));
    unknownTokens = extractUnknownExpectedErrorTokens(qj);
    taxonomyUnknownIssueRowCount = countTaxonomyUnknownExpectedErrorRows(qj);
  }

  /** Authoritative global count from QA summary (full scan); JSON sample may truncate rows. */
  let taxonomyUnknownIssueGlobalCount = null;
  if (existsSync(QA_SUMMARY_JSON)) {
    const sj = JSON.parse(await readFile(QA_SUMMARY_JSON, "utf8"));
    const top = sj.topMissingMetadataFields || [];
    const hit = top.find((/** @type {[string, number]} */ row) => row[0] === "taxonomy_unknown_expected_error_type");
    if (hit) taxonomyUnknownIssueGlobalCount = hit[1];
  }

  const pack = buildScienceReviewPack(enrichmentPayload, unknownTokens, {
    taxonomyUnknownIssueRowCount,
    taxonomyUnknownIssueGlobalCount,
  });
  const lowSuggestions = (enrichmentPayload.suggestions || []).filter((s) => s.confidence === "low");
  pack.summary.topLowConfidenceReasonHistogram = histogramReasons(lowSuggestions);

  await writeFile(OUT_JSON, JSON.stringify(pack, null, 2), "utf8");

  const s = pack.summary;
  const md = [
    "# Science metadata — enrichment review pack",
    "",
    `_Generated: ${pack.generatedAt}_`,
    `_Enrichment source: ${mdEscape(enrichmentSource)}_`,
    "",
    "## Summary",
    "",
    `- **Science suggestions:** ${s.scienceSuggestionCount}`,
    `- **Confidence — high / medium / low:** ${s.confidenceBreakdown.high} / ${s.confidenceBreakdown.medium} / ${s.confidenceBreakdown.low}`,
    `- **Review priority — high / medium / low:** ${s.reviewPriorityBreakdown.high} / ${s.reviewPriorityBreakdown.medium} / ${s.reviewPriorityBreakdown.low}`,
    `- **Sequential prerequisite heuristic rows:** ${s.sequentialPrereqHeuristicCount}`,
    `- **Low confidence rows:** ${s.lowConfidenceCount}`,
    "",
    "## Checklist (human)",
    "",
    `- **Approve as-is:** ${pack.checklist.approveAsIs}`,
    `- **Edit metadata:** ${pack.checklist.editMetadata}`,
    `- **Reject suggestion:** ${pack.checklist.rejectSuggestion}`,
    `- **Needs curriculum expert:** ${pack.checklist.needsCurriculumExpert}`,
    "",
    "## Top reasons among low-confidence suggestions",
    "",
    "| Reason (truncated) | Count |",
    "| --- | ---: |",
    ...(pack.summary.topLowConfidenceReasonHistogram || []).map(
      (x) => `| ${mdEscape(x.reason)} | ${x.count} |`
    ),
    "",
    "## Grouped by skillId",
    "",
    "| Skill | Count | Examples |",
    "| --- | ---: | --- |",
    ...Object.entries(pack.groupedBySkillId || {}).map(([k, v]) =>
      `| ${mdEscape(k)} | ${v.count} | ${mdEscape((v.exampleQuestionIds || []).join(", "))} |`
    ),
    "",
    "## Grouped by topic",
    "",
    "| Topic | Count | Examples |",
    "| --- | ---: | --- |",
    ...Object.entries(pack.groupedByTopic || {}).map(([k, v]) =>
      `| ${mdEscape(k)} | ${v.count} | ${mdEscape((v.exampleQuestionIds || []).join(", "))} |`
    ),
    "",
    "## Taxonomy unknown expected-error tokens (global QA)",
    "",
    `_Rows in questions-with-issues.json sample with taxonomy_unknown_expected_error_type: ${pack.taxonomyUnknownExpectedErrorIssueRowCount ?? "n/a"}._`,
    `_Global QA count (summary.json top issues): ${pack.taxonomyUnknownExpectedErrorIssueGlobalCount ?? "n/a"}._`,
    `_Unique unknown token values listed below: ${unknownTokens.length}._`,
    "",
    unknownTokens.length
      ? [
          "| Token | Occurrences | Example questionIds |",
          "| --- | ---: | --- |",
          ...unknownTokens.map(
            (t) =>
              `| ${mdEscape(t.token)} | ${t.count} | ${mdEscape(
                (t.examples || []).map((e) => e.questionId || e.declaredId).slice(0, 4).join(", ")
              )} |`
          ),
        ].join("\n")
      : "_None parsed (run `npm run qa:question-metadata` first or questions-with-issues.json missing)._",
    "",
    "## Outputs",
    "",
    "- `reports/question-metadata-qa/science-review-pack.json`",
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Science review pack — suggestions: ${s.scienceSuggestionCount}`);
  console.log(
    `  Confidence H/M/L: ${s.confidenceBreakdown.high}/${s.confidenceBreakdown.medium}/${s.confidenceBreakdown.low}`
  );
  console.log(
    `  Review priority H/M/L: ${s.reviewPriorityBreakdown.high}/${s.reviewPriorityBreakdown.medium}/${s.reviewPriorityBreakdown.low}`
  );
  console.log(
    `  Unknown error tokens (unique): ${unknownTokens.length}; rows in sample JSON: ${taxonomyUnknownIssueRowCount ?? "n/a"}; global QA count: ${pack.taxonomyUnknownExpectedErrorIssueGlobalCount ?? "n/a"}`
  );
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
