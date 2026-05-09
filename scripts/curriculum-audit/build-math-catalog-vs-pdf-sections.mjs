/**
 * Compare utils math official subsection catalog to extracted PDF section catalog.
 * Output: reports/curriculum-audit/math-catalog-vs-pdf-sections.{json,md}
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MATH_OFFICIAL_SUBSECTION_CATALOG } from "../../utils/curriculum-audit/math-official-subsection-catalog.js";
import { compareOfficialCatalogToPdfSections } from "./lib/math-catalog-pdf-compare.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const PDF_CAT = join(OUT_DIR, "math-pdf-section-catalog.json");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  if (!existsSync(PDF_CAT)) {
    console.error(`Missing ${PDF_CAT} — run: npm run audit:curriculum:math-pdf-section-catalog`);
    process.exit(1);
  }
  const pdfCatalogPayload = JSON.parse(readFileSync(PDF_CAT, "utf8"));
  const payload = compareOfficialCatalogToPdfSections(pdfCatalogPayload, MATH_OFFICIAL_SUBSECTION_CATALOG);

  await writeFile(join(OUT_DIR, "math-catalog-vs-pdf-sections.json"), JSON.stringify(payload, null, 2), "utf8");
  const md = renderMd(payload);
  await writeFile(join(OUT_DIR, "math-catalog-vs-pdf-sections.md"), md, "utf8");
  console.log(`Wrote math-catalog-vs-pdf-sections.json`);
  console.log(`Wrote math-catalog-vs-pdf-sections.md`);
}

function renderMd(p) {
  const lines = [];
  lines.push("# Math official catalog vs PDF sections");
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push("| Classification | Count |");
  lines.push("|----------------|-------|");
  for (const k of [
    "exact_pdf_match",
    "reasonable_grouping",
    "broad_mapping",
    "missing_pdf_support",
    "needs_manual_review",
  ]) {
    lines.push(`| ${k} | ${p.summary[k] ?? 0} |`);
  }
  lines.push("");
  lines.push("## Rows (abbrev)");
  for (const r of p.rows) {
    lines.push(
      `- G${r.grade} \`${r.sectionKey}\` — ${r.classification} (score ${r.matchScore}) — ${r.catalogLabelHe.slice(0, 48)}…`
    );
  }
  return lines.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
