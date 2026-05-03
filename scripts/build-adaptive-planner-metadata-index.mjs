#!/usr/bin/env node
/**
 * Writes a lightweight metadata index snapshot for Adaptive Planner (offline cache shape).
 * npm run build:adaptive-planner:metadata-index
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "adaptive-learning-planner");
const OUT_JSON = join(OUT_DIR, "metadata-index-snapshot.json");
const OUT_MD = join(OUT_DIR, "metadata-index-snapshot.md");

const metaMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-metadata-context.js", import.meta.url).href
);

const {
  buildPlannerQuestionMetadataIndex,
  validateLightEntriesNoForbiddenFields,
  assertSerializedMetadataLeakFree,
} = metaMod;

async function main() {
  const generatedAt = new Date().toISOString();
  const index = await buildPlannerQuestionMetadataIndex({ rootAbs: ROOT });

  const leaks = validateLightEntriesNoForbiddenFields(index.entries);
  if (leaks.length) {
    console.error("Snapshot leak/shape validation failed:", leaks.slice(0, 30));
    process.exit(1);
  }

  const payload = {
    version: 1,
    generatedAt,
    stats: index.stats,
    entryCount: index.entries.length,
    entries: index.entries,
  };

  const json = JSON.stringify(payload, null, 2);
  if (!assertSerializedMetadataLeakFree(json)) {
    console.error("Serialized snapshot failed leak guard (forbidden question-content keys detected).");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_JSON, json, "utf8");

  const bySub = index.stats?.bySubject || {};
  const md = [
    "# Adaptive planner — metadata index snapshot",
    "",
    `- **generatedAt:** ${generatedAt}`,
    `- **entryCount:** ${index.entries.length}`,
    "",
    "## By subject (index stats)",
    "",
    "| subject | count |",
    "| --- | ---: |",
    ...Object.entries(bySub)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Files",
    "",
    `- JSON: \`reports/adaptive-learning-planner/metadata-index-snapshot.json\` (lightweight fields only; no stems)`,
    "",
    "## Leak guard",
    "",
    "- Per-row shape and forbidden-key scan: **PASS**",
    "- Serialized JSON pattern scan: **PASS**",
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");
  console.log(JSON.stringify({ ok: true, outJson: OUT_JSON, outMd: OUT_MD, entryCount: index.entries.length }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
