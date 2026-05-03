#!/usr/bin/env node
/**
 * Build internal Adaptive Planner Preview Pack from artifact-summary.json.
 * npm run test:adaptive-planner:preview-pack
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ARTIFACT_SUMMARY = join(ROOT, "reports", "adaptive-learning-planner", "artifact-summary.json");
const OUT_JSON = join(ROOT, "reports", "adaptive-learning-planner", "preview-pack.json");
const OUT_MD = join(ROOT, "reports", "adaptive-learning-planner", "preview-pack.md");

const mod = await import(new URL("../utils/adaptive-learning-planner/adaptive-planner-preview-pack.js", import.meta.url).href);
const {
  buildAdaptivePlannerPreviewPack,
  assertPreviewPackLeakFree,
  validatePreviewPackSchema,
  validatePreviewMarkdownSections,
} = mod;

async function main() {
  let raw;
  try {
    raw = await readFile(ARTIFACT_SUMMARY, "utf8");
  } catch {
    console.error(`Missing ${ARTIFACT_SUMMARY} — run npm run test:adaptive-planner:artifacts first.`);
    process.exit(1);
  }

  /** @type {object} */
  const artifactSummary = JSON.parse(raw);
  const safety = Number(artifactSummary.safetyViolationCount ?? 0);
  if (safety > 0) {
    console.error(`Refusing preview pack: safetyViolationCount=${safety} (must be 0).`);
    process.exit(1);
  }

  const { pack, markdown } = buildAdaptivePlannerPreviewPack(artifactSummary, {
    sourcePath: "reports/adaptive-learning-planner/artifact-summary.json",
  });

  const schemaErrs = validatePreviewPackSchema(pack);
  if (schemaErrs.length) {
    console.error("Preview pack schema validation failed:", schemaErrs);
    process.exit(1);
  }

  const jsonStr = JSON.stringify(pack, null, 2);
  const mdSections = validatePreviewMarkdownSections(markdown);
  if (mdSections.length) {
    console.error("Preview markdown section check failed:", mdSections);
    process.exit(1);
  }

  const leak = assertPreviewPackLeakFree(jsonStr, markdown);
  if (!leak.ok) {
    console.error("Preview pack leak guard failed:", leak.hits);
    process.exit(1);
  }

  await mkdir(dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, jsonStr, "utf8");
  await writeFile(OUT_MD, markdown, "utf8");

  console.log(`OK — wrote ${OUT_JSON}`);
  console.log(`OK — wrote ${OUT_MD}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
