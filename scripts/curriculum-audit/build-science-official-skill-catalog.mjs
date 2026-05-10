/**
 * Export Science official subsection catalog to reports (JSON + MD).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { SCIENCE_OFFICIAL_SUBSECTION_CATALOG } = await import(modUrl("utils/curriculum-audit/science-official-subsection-catalog.js"));
const { scienceRegistryRows, summarizeScienceRegistry } = await import(
  pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/science-catalog-source-compare.mjs")).href
);

function renderMd(payload) {
  const lines = [];
  lines.push("# Science official skill / subsection catalog");
  lines.push("");
  lines.push(`Generated: ${payload.generatedAt}`);
  lines.push("");
  lines.push("## Registry summary (Science rows)");
  lines.push("```json");
  lines.push(JSON.stringify(payload.registrySummary, null, 2));
  lines.push("```");
  lines.push("");
  for (let g = 1; g <= 6; g++) {
    const slot = payload.catalog[`grade_${g}`];
    if (!slot) continue;
    lines.push(`## Grade ${g}`);
    lines.push(`- **POP:** ${slot.sourcePortalUrl || "—"}`);
    if (slot.sourceDoc) lines.push(`- **Owner DOCX:** ${slot.sourceDoc}`);
    lines.push("");
    for (const s of slot.sections || []) {
      lines.push(`### ${s.labelHe} (\`${s.sectionKey}\`)`);
      lines.push(`- **Strand:** ${s.strand}`);
      lines.push(`- **Catalog confidence:** ${s.confidence}`);
      lines.push(`- **Normalized keys:** ${(s.mapsToNormalizedKeys || []).join(", ")}`);
      if (s.notes) lines.push(`- **Notes:** ${s.notes}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const registryRows = scienceRegistryRows();
  const registrySummary = summarizeScienceRegistry(registryRows);
  const payload = {
    generatedAt: new Date().toISOString(),
    registrySummary,
    catalog: SCIENCE_OFFICIAL_SUBSECTION_CATALOG,
    meta: {
      source:
        "utils/curriculum-audit/science-official-subsection-catalog.js + owner DOCX תוכנית משרד החינוך/science Curriculum2016.docx",
      disclaimer:
        "Structured audit catalog — not an automated extraction from the Ministry DOCX; owner verification required for full alignment claims.",
    },
  };
  await writeFile(join(OUT_DIR, "science-official-skill-catalog.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "science-official-skill-catalog.md"), renderMd(payload), "utf8");
  console.log("Wrote science-official-skill-catalog.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
