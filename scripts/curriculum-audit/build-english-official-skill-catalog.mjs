/**
 * Export English official subsection/skill catalog to reports (JSON + MD).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { ENGLISH_OFFICIAL_SUBSECTION_CATALOG } = await import(modUrl("utils/curriculum-audit/english-official-subsection-catalog.js"));
const { englishRegistryRows, summarizeEnglishRegistry } = await import(
  pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/english-catalog-source-compare.mjs")).href
);

function renderMd(payload) {
  const lines = [];
  lines.push("# English official skill / subsection catalog");
  lines.push("");
  lines.push(`Generated: ${payload.generatedAt}`);
  lines.push("");
  lines.push("## Registry summary (English rows)");
  lines.push("```json");
  lines.push(JSON.stringify(payload.registrySummary, null, 2));
  lines.push("```");
  lines.push("");
  for (let g = 1; g <= 6; g++) {
    const slot = payload.catalog[`grade_${g}`];
    if (!slot) continue;
    lines.push(`## Grade ${g}`);
    lines.push(`- **POP:** ${slot.sourcePortalUrl || "—"}`);
    if (slot.sourcePdf) lines.push(`- **Owner PDF:** ${slot.sourcePdf}`);
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
  const registryRows = englishRegistryRows();
  const registrySummary = summarizeEnglishRegistry(registryRows);
  const payload = {
    generatedAt: new Date().toISOString(),
    registrySummary,
    catalog: ENGLISH_OFFICIAL_SUBSECTION_CATALOG,
    meta: {
      source:
        "utils/curriculum-audit/english-official-subsection-catalog.js + owner PDF תוכנית משרד החינוך/english Curriculum2020.pdf",
      disclaimer:
        "Structured audit catalog — not a line-by-line transcription of the Ministry PDF; owner verification required for full MoE alignment claims.",
    },
  };
  await writeFile(join(OUT_DIR, "english-official-skill-catalog.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "english-official-skill-catalog.md"), renderMd(payload), "utf8");
  console.log("Wrote english-official-skill-catalog.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
