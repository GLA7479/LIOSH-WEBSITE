#!/usr/bin/env node
/**
 * English metadata review pack from enrichment JSON.
 * npm run qa:question-metadata:english-review-pack
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENRICH = join(ROOT, "reports", "question-metadata-qa", "english-enrichment-suggestions.json");
const OUT_JSON = join(ROOT, "reports", "question-metadata-qa", "english-review-pack.json");
const OUT_MD = join(ROOT, "reports", "question-metadata-qa", "english-review-pack.md");

async function main() {
  const raw = await readFile(ENRICH, "utf8");
  const enrichmentPayload = JSON.parse(raw);

  const mod = await import(new URL("../utils/question-metadata-qa/english-enrichment-review-pack.js", import.meta.url).href);
  const { buildEnglishReviewPack } = mod;

  const pack = buildEnglishReviewPack(enrichmentPayload);

  await mkdir(join(ROOT, "reports", "question-metadata-qa"), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(pack, null, 2), "utf8");

  const md = [
    "# English pools — enrichment review pack",
    "",
    `_Generated: ${pack.generatedAt}_`,
    "",
    "## Summary",
    "",
    `- **Rows:** ${pack.summary.englishRowCount}`,
    `- **Low confidence:** ${pack.summary.lowConfidenceCount}`,
    `- **High review priority:** ${pack.summary.highReviewPriorityCount}`,
    "",
    "### Rows by source file",
    "",
    ...Object.entries(pack.summary.rowsBySourceFile || {})
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, v]) => `- \`${k}\`: ${v}`),
    "",
    "## Checklist",
    "",
    `- **Approve as-is:** ${pack.checklist.approveAsIs}`,
    `- **Edit metadata:** ${pack.checklist.editMetadata}`,
    `- **Reject:** ${pack.checklist.rejectSuggestion}`,
    `- **Curriculum expert:** ${pack.checklist.needsCurriculumExpert}`,
    "",
    "## Output",
    "",
    `- \`reports/question-metadata-qa/english-review-pack.json\``,
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  English review pack — rows:", pack.summary.englishRowCount);
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
