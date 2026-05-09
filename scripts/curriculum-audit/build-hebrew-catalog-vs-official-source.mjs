/**
 * Hebrew catalog vs official source registry (POP + internal_gap honesty).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const { compareHebrewCatalogToOfficialSources } = await import(
  pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/hebrew-catalog-source-compare.mjs")).href
);

function renderMd(p) {
  const lines = [];
  lines.push("# Hebrew catalog vs official source");
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Catalog section rows: **${p.summary.catalogSectionRows}**`);
  lines.push(`- Rows flagged \`needs_manual_pdf_or_meyda_anchor\`: **${p.summary.rowsNeedingManualAnchor}**`);
  lines.push("");
  lines.push("## Registry");
  lines.push(JSON.stringify(p.meta.registrySummary, null, 2));
  lines.push("");
  lines.push("## Sections");
  for (const r of p.rows) {
    lines.push(
      `- **G${r.grade}** \`${r.sectionKey}\` — ${r.status} — ${r.labelHe} *(catalog conf: ${r.catalogConfidence})*`
    );
  }
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const p = compareHebrewCatalogToOfficialSources();
  await writeFile(join(OUT_DIR, "hebrew-catalog-vs-official-source.json"), JSON.stringify(p, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "hebrew-catalog-vs-official-source.md"), renderMd(p), "utf8");
  console.log("Wrote hebrew-catalog-vs-official-source.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
