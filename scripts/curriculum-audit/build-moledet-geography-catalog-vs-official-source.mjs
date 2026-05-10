/**
 * Moledet/Geography catalog vs official source registry (POP + owner PDFs).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const { compareMoledetGeographyCatalogToOfficialSources } = await import(
  pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/moledet-geography-catalog-source-compare.mjs")).href
);

function renderMd(p) {
  const lines = [];
  lines.push("# Moledet / Geography catalog vs official source");
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Catalog section rows: **${p.summary.catalogSectionRows}**`);
  lines.push(`- Rows needing registry anchor: **${p.summary.rowsNeedingAnchor}**`);
  lines.push("");
  lines.push("## Registry");
  lines.push(JSON.stringify(p.meta.registrySummary, null, 2));
  lines.push("");
  lines.push("## Sections (sample)");
  for (const r of p.rows.slice(0, 80)) {
    lines.push(
      `- **G${r.grade}** \`${r.sectionKey}\` — ${r.status} — ${r.labelHe.slice(0, 72)}… *(conf: ${r.catalogConfidence})*`
    );
  }
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const p = compareMoledetGeographyCatalogToOfficialSources();
  await writeFile(join(OUT_DIR, "moledet-geography-catalog-vs-official-source.json"), JSON.stringify(p, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "moledet-geography-catalog-vs-official-source.md"), renderMd(p), "utf8");
  console.log("Wrote moledet-geography-catalog-vs-official-source.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
