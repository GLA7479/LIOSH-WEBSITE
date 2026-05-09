/**
 * Export Hebrew official subsection/skill catalog to reports (JSON + MD).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { HEBREW_OFFICIAL_SUBSECTION_CATALOG } = await import(modUrl("utils/curriculum-audit/hebrew-official-subsection-catalog.js"));
const { hebrewRegistryRows, summarizeHebrewRegistry } = await import(
  pathToFileURL(join(ROOT, "scripts/curriculum-audit/lib/hebrew-catalog-source-compare.mjs")).href
);

function renderMd(payload) {
  const lines = [];
  lines.push("# Hebrew official skill / subsection catalog");
  lines.push("");
  lines.push(`Generated: ${payload.generatedAt}`);
  lines.push("");
  lines.push("## Registry summary (Hebrew rows only)");
  lines.push("```json");
  lines.push(JSON.stringify(payload.registrySummary, null, 2));
  lines.push("```");
  lines.push("");
  for (let g = 1; g <= 6; g++) {
    const slot = payload.catalog[`grade_${g}`];
    if (!slot) continue;
    lines.push(`## כיתה ${g}`);
    lines.push(`- **מקור עיגון (פורטל):** ${slot.sourcePortalUrl || "—"}`);
    if (slot.sourcePdf) lines.push(`- **PDF:** ${slot.sourcePdf}`);
    lines.push("");
    for (const s of slot.sections || []) {
      lines.push(`### ${s.labelHe} (\`${s.sectionKey}\`)`);
      lines.push(`- **מיתר:** ${s.strand}`);
      lines.push(`- **ביטחון קטלוג:** ${s.confidence}`);
      lines.push(`- **מפתחות מנורמלים:** ${(s.mapsToNormalizedKeys || []).join(", ")}`);
      if (s.notes) lines.push(`- **הערות:** ${s.notes}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const registryRows = hebrewRegistryRows();
  const registrySummary = summarizeHebrewRegistry(registryRows);
  const payload = {
    generatedAt: new Date().toISOString(),
    registrySummary,
    catalog: HEBREW_OFFICIAL_SUBSECTION_CATALOG,
    meta: {
      source:
        "utils/curriculum-audit/hebrew-official-subsection-catalog.js — POP anchors; אין טענה לכיסוי PDF כיתתי מלא.",
    },
  };
  await writeFile(join(OUT_DIR, "hebrew-official-skill-catalog.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "hebrew-official-skill-catalog.md"), renderMd(payload), "utf8");
  console.log("Wrote hebrew-official-skill-catalog.{json,md}");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
