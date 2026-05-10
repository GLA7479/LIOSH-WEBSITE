/**
 * English inventory/runtime rows vs conservative curriculum map + catalog framing.
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const {
  buildEnglishRuntimeVsOfficialSummary,
  englishRegistryRows,
  summarizeEnglishRegistry,
} = await import(pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/english-catalog-source-compare.mjs")).href);

const INV_PATH = join(OUT_DIR, "question-inventory.json");

function renderMd(p, reg) {
  const lines = [];
  lines.push("# English runtime / inventory vs official source");
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push("## Registry (English)");
  lines.push("```json");
  lines.push(JSON.stringify(reg, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Inventory English rows: **${p.meta.inventoryEnglishRows}**`);
  lines.push(`- Rows OK: **${p.summary.rowsOk}**`);
  lines.push(`- Rows needing manual review: **${p.summary.rowsNeedingManualReview}**`);
  if (p.rowsTruncated) lines.push("- **Note:** row list truncated in JSON for size.");
  lines.push("");
  lines.push("## Sample mismatches (first 40)");
  const bad = (p.rows || []).filter((r) => r.status !== "ok").slice(0, 40);
  for (const r of bad) {
    lines.push(`- \`${r.normalizedTopicKey}\` grades ${r.minGrade}–${r.maxGrade}: ${(r.issues || []).join("; ")}`);
  }
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let inventory = [];
  if (existsSync(INV_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(INV_PATH, "utf8"));
      inventory = Array.isArray(raw) ? raw : raw?.records || raw?.rows || [];
    } catch {
      inventory = [];
    }
  }
  const base = buildEnglishRuntimeVsOfficialSummary(inventory);
  const reg = summarizeEnglishRegistry(englishRegistryRows());
  const payload = {
    ...base,
    registrySummary: reg,
    meta: {
      ...base.meta,
      inventoryPath: existsSync(INV_PATH) ? "reports/curriculum-audit/question-inventory.json" : "missing_run_audit_curriculum_inventory_first",
    },
  };
  await writeFile(join(OUT_DIR, "english-runtime-vs-official-source.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "english-runtime-vs-official-source.md"), renderMd(payload, reg), "utf8");
  console.log("Wrote english-runtime-vs-official-source.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
