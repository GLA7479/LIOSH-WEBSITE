#!/usr/bin/env node
/**
 * Math procedural generator — metadata mapping report.
 * npm run qa:question-metadata:math-map
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-metadata-qa");
const OUT_JSON = join(OUT_DIR, "math-generator-metadata-map.json");
const OUT_MD = join(OUT_DIR, "math-generator-metadata-map.md");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const mod = await import(
    new URL("../utils/question-metadata-qa/math-generator-metadata-map.js", import.meta.url).href
  );
  const payload = mod.buildMathGeneratorMetadataMap();

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Math generator metadata map",
    "",
    `_Generated: ${payload.generatedAt}_`,
    "",
    "## Generator",
    "",
    `- **Path:** \`${payload.generator.path}\``,
    `- **Kind literals found:** ${payload.discovery.kindLiteralCount}`,
    `- **Operations (union):** ${payload.discovery.operationUnion.length}`,
    "",
    "## Safe apply strategy",
    "",
    payload.safeApply.approach,
    "",
    `- **Risk:** ${payload.safeApply.riskLevel}`,
    "",
    "## proposedMappingSummary",
    "",
    "```json",
    JSON.stringify(payload.proposedMappingSummary, null, 2),
    "```",
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  Math metadata map — kinds:", payload.discovery.kindLiteralCount);
  console.log(`  Report: ${OUT_JSON}`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
