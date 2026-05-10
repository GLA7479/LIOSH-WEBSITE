/**
 * Geography inventory rows vs conservative curriculum map (moledet.bank.*).
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const { buildMoledetGeographyRuntimeVsOfficialSummary } = await import(
  pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/moledet-geography-catalog-source-compare.mjs")).href
);

function loadInventoryRecords() {
  const p = join(OUT_DIR, "question-inventory.json");
  if (!existsSync(p)) return { records: [], path: null };
  try {
    const raw = JSON.parse(readFileSync(p, "utf8"));
    const records = Array.isArray(raw) ? raw : raw?.records || [];
    return { records, path: p };
  } catch {
    return { records: [], path: p };
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const inv = loadInventoryRecords();
  const payload = buildMoledetGeographyRuntimeVsOfficialSummary(inv.records);
  await writeFile(join(OUT_DIR, "moledet-geography-runtime-vs-official-source.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Moledet / Geography runtime vs curriculum map",
    "",
    `_Generated: ${payload.generatedAt}_`,
    "",
    "## Summary",
    "",
    `- Inventory geography rows: **${payload.meta.inventoryGeographyRows}**`,
    `- Rows OK: **${payload.summary.rowsOk}**`,
    `- Rows needing manual review: **${payload.summary.rowsNeedingManualReview}**`,
    "",
    "_See JSON for row-level detail._",
    "",
  ].join("\n");
  await writeFile(join(OUT_DIR, "moledet-geography-runtime-vs-official-source.md"), md, "utf8");
  console.log("Wrote moledet-geography-runtime-vs-official-source.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
