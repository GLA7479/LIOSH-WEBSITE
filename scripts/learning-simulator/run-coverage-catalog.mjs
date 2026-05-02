#!/usr/bin/env node
/**
 * Full matrix coverage catalog (819 cells) — JSON + MD artifacts.
 * npm run qa:learning-simulator:coverage
 *
 * Reads: reports/learning-simulator/coverage-matrix.json, fixture scenarios,
 *        reports/learning-simulator/questions/unsupported-cells.json (optional)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { buildCoverageCatalogPayload, ROOT } from "./lib/coverage-catalog-core.mjs";

const OUT_DIR = join(ROOT, "reports", "learning-simulator");
const OUT_JSON = join(OUT_DIR, "coverage-catalog.json");
const OUT_MD = join(OUT_DIR, "coverage-catalog.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

function buildMarkdown(payload) {
  const sc = payload.counts.statusCounts || {};
  const lines = [
    "# Coverage catalog (full matrix)",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Matrix snapshot: ${payload.matrixGeneratedAt || "—"}`,
    `- Matrix rows: ${payload.counts.matrixRows}`,
    `- Quick scenarios: ${payload.counts.quickScenarioCount} · Deep scenarios: ${payload.counts.deepScenarioCount}`,
    `- Unique cells touched (quick refs): ${payload.counts.uniqueCellsTouchedQuick}`,
    `- Unique cells touched (deep refs): ${payload.counts.uniqueCellsTouchedDeep}`,
    `- Unique cells touched (matrix smoke): ${payload.counts.uniqueCellsTouchedMatrixSmoke ?? 0}`,
    "",
    "## coverageStatus counts",
    "",
    "| Status | Count |",
    "| --- | ---: |",
  ];

  for (const k of [
    "covered",
    "sampled",
    "unsupported_expected",
    "unsupported_needs_content",
    "unsupported_needs_adapter",
    "unsupported_needs_generator",
    "uncovered",
  ]) {
    lines.push(`| ${mdEscape(k)} | ${sc[k] ?? 0} |`);
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- **covered** — cell is referenced by quick/deep fixtures **or** exercised by **matrix smoke** aggregate simulation, or both.",
    "- **sampled** — Phase 4 passed and cell is supported, but no fixture ref and no matrix-smoke touch yet.",
    "- **unsupported_*** — matrix flags and/or Phase 4 generator/bank classification.",
    "- **uncovered** — integrity failures or unclassified gaps (should be zero for a green gate).",
    "",
    "## Row sample (first 40 rows)",
    "",
    "| cellKey | coverageStatus | quick | deep | smoke | audit |",
    "| --- | --- | :---: | :---: | :---: | :---: |"
  );

  for (const r of payload.rows.slice(0, 40)) {
    lines.push(
      `| \`${mdEscape(r.cellKey)}\` | ${mdEscape(r.coverageStatus)} | ${r.coveredByQuick ? "y" : ""} | ${r.coveredByDeep ? "y" : ""} | ${r.coveredByMatrixSmoke ? "y" : ""} | ${r.coveredByQuestionAudit ? "y" : ""} |`
    );
  }

  lines.push("", `Full row-level data: \`${OUT_JSON.replace(/\\/g, "/")}\` (${payload.rows.length} rows).`, "");

  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const payload = await buildCoverageCatalogPayload();
  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown(payload), "utf8");

  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_MD}`);
  console.log("Coverage catalog: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
