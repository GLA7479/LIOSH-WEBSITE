#!/usr/bin/env node
/**
 * Scenario → matrix cell mapping + assertion types.
 * Writes reports/learning-simulator/scenario-coverage.json|.md
 *
 * npm run qa:learning-simulator:scenario-coverage
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { buildScenarioCoveragePayload, ROOT } from "./lib/coverage-catalog-core.mjs";

const OUT_DIR = join(ROOT, "reports", "learning-simulator");
const OUT_JSON = join(OUT_DIR, "scenario-coverage.json");
const OUT_MD = join(OUT_DIR, "scenario-coverage.md");

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

function buildMarkdown(payload) {
  const lines = [
    "# Scenario coverage (fixtures → matrix cells)",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Scenarios: ${payload.counts.scenarios}`,
    "",
    "| scenarioId | mode | suite | grade | matrixCellsTouched | assertionTypes |",
    "| --- | --- | --- | --- | ---: | --- |",
  ];

  for (const s of payload.scenarios) {
    const at = (s.assertionTypes || []).join(", ");
    lines.push(
      `| ${mdEscape(s.scenarioId)} | ${mdEscape(s.mode)} | ${mdEscape(s.suite)} | ${mdEscape(s.grade)} | ${s.matrixCellsTouchedCount} | ${mdEscape(at)} |`
    );
  }

  lines.push("", `Detail: \`${OUT_JSON.replace(/\\/g, "/")}\``, "");

  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const payload = await buildScenarioCoveragePayload();
  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown(payload), "utf8");

  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_MD}`);
  console.log("Scenario coverage: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
