#!/usr/bin/env node
/**
 * Classify unsupported / uncovered matrix cells (no generator fixes here).
 * npm run qa:learning-simulator:unsupported
 *
 * Gate (exit 1): coverageStatus **uncovered** > 0, or **unknown_needs_review** classification > 0.
 * Does not fail on unsupported_expected or other expected unsupported buckets by themselves.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  UNSUPPORTED_CLASS,
  buildCoverageCatalogPayload,
  buildUnsupportedPayload,
  ROOT,
} from "./lib/coverage-catalog-core.mjs";

const OUT_DIR = join(ROOT, "reports", "learning-simulator");
const OUT_JSON = join(OUT_DIR, "unsupported-cells.json");
const OUT_MD = join(OUT_DIR, "unsupported-cells.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

function recommendationForClass(c) {
  const map = {
    [UNSUPPORTED_CLASS.expected_runtime_gap]:
      "Treat as out-of-scope for runtime until product maps curriculum → engines; keep matrix row for documentation.",
    [UNSUPPORTED_CLASS.curriculum_only_not_runtime]:
      "Either wire subject/topic into runtime + generators, or narrow curriculum declarations to match reality.",
    [UNSUPPORTED_CLASS.missing_question_bank]:
      "Add or extend MCQ bank JSON / English pools for this grade · topic · level band.",
    [UNSUPPORTED_CLASS.missing_generator_adapter]:
      "Add or extend question-generator adapter coverage for this subject (or explicitly mark matrix row unsupported).",
    [UNSUPPORTED_CLASS.missing_topic_adapter]:
      "Align matrix topic with generator curriculum lists, or split matrix topics to match generator keys.",
    [UNSUPPORTED_CLASS.mixed_or_ui_only_topic]:
      "Keep out of single-cell integrity; rely on mixed-session flows / UI tests instead of per-cell audits.",
    [UNSUPPORTED_CLASS.unknown_needs_review]:
      "Manual triage: inspect Phase 4 reason + matrix row; extend classifier or fix data.",
  };
  return map[c] || map[UNSUPPORTED_CLASS.unknown_needs_review];
}

function buildMarkdown(payload) {
  const byC = payload.byClassification || {};
  const lines = [
    "# Unsupported / gap cells (classification)",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Cells in this report: ${payload.counts.needsAttentionTotal}`,
    `- coverageStatus **uncovered**: ${payload.counts.uncoveredCoverageStatus}`,
    `- Classification **unknown_needs_review**: ${payload.counts.unknownClassification}`,
    "",
    "## Counts by classification",
    "",
    "| Classification | Count |",
    "| --- | ---: |",
  ];

  for (const k of Object.values(UNSUPPORTED_CLASS)) {
    lines.push(`| ${mdEscape(k)} | ${payload.counts.byClassification[k] ?? 0} |`);
  }

  lines.push("", "## Examples per classification (up to 8 each)", "");

  for (const k of Object.values(UNSUPPORTED_CLASS)) {
    const block = byC[k];
    if (!block?.examples?.length) continue;
    lines.push(`### ${k}`, "", "| grade | subject | topic | level | coverageStatus |", "| --- | --- | --- | --- | --- |");
    for (const e of block.examples) {
      lines.push(
        `| ${mdEscape(e.grade)} | ${mdEscape(e.subject)} | ${mdEscape(e.topic)} | ${mdEscape(e.level)} | ${mdEscape(e.coverageStatus)} |`
      );
    }
    lines.push("", `*Recommendation:* ${recommendationForClass(k)}`, "");
  }

  lines.push("---", "", `Full list: \`${OUT_JSON.replace(/\\/g, "/")}\``, "");

  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const catalog = await buildCoverageCatalogPayload();
  const payload = buildUnsupportedPayload(catalog);

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown(payload), "utf8");

  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_MD}`);

  const failUncovered = payload.counts.uncoveredCoverageStatus > 0;
  const failUnknown = payload.counts.unknownClassification > 0;

  if (failUncovered || failUnknown) {
    console.error("");
    console.error("Unsupported cells gate: FAIL");
    if (failUncovered) console.error(`  - coverageStatus uncovered: ${payload.counts.uncoveredCoverageStatus}`);
    if (failUnknown) console.error(`  - unknown_needs_review: ${payload.counts.unknownClassification}`);
    console.error("");
    process.exit(1);
  }

  console.log("Unsupported cells gate: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
