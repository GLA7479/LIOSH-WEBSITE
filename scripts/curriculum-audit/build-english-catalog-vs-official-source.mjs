/**
 * English catalog vs official source registry (POP + owner PDF).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const { compareEnglishCatalogToOfficialSources } = await import(
  pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/english-catalog-source-compare.mjs")).href
);

function renderMd(p) {
  const lines = [];
  lines.push("# English catalog vs official source");
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
  lines.push("## Sections");
  for (const r of p.rows) {
    lines.push(
      `- **G${r.grade}** \`${r.sectionKey}\` — ${r.status} — ${r.labelHe} *(conf: ${r.catalogConfidence})*`
    );
  }
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const p = compareEnglishCatalogToOfficialSources();
  await writeFile(join(OUT_DIR, "english-catalog-vs-official-source.json"), JSON.stringify(p, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "english-catalog-vs-official-source.md"), renderMd(p), "utf8");
  console.log("Wrote english-catalog-vs-official-source.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
