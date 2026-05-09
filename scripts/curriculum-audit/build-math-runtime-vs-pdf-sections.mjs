/**
 * Compare runtime/UI topics (math-final-closure) + inventory candidates to PDF catalog.
 * Output: reports/curriculum-audit/math-runtime-vs-pdf-sections.{json,md}
 *
 * Requires math-final-closure.json (run audit:curriculum:math-final-closure first, or use closure gate order).
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildRuntimeVsPdfRows } from "./lib/math-catalog-pdf-compare.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const closurePath = join(OUT_DIR, "math-final-closure.json");
  const pdfCatPath = join(OUT_DIR, "math-pdf-section-catalog.json");
  const catalogVsPath = join(OUT_DIR, "math-catalog-vs-pdf-sections.json");

  if (!existsSync(closurePath)) {
    console.error(`Missing ${closurePath} — run npm run audit:curriculum:math-final-closure`);
    process.exit(1);
  }
  if (!existsSync(pdfCatPath) || !existsSync(catalogVsPath)) {
    console.error(`Missing PDF comparison inputs — run math-pdf-section-catalog and math-catalog-vs-pdf-sections`);
    process.exit(1);
  }

  const closure = JSON.parse(readFileSync(closurePath, "utf8"));
  const pdfCatalogPayload = JSON.parse(readFileSync(pdfCatPath, "utf8"));
  const catalogVsPdf = JSON.parse(readFileSync(catalogVsPath, "utf8"));

  let rowCandidatesSummary = null;
  const candPath = join(OUT_DIR, "math-row-subsection-candidates.json");
  if (existsSync(candPath)) {
    try {
      rowCandidatesSummary = JSON.parse(readFileSync(candPath, "utf8")).summary || null;
    } catch {
      rowCandidatesSummary = null;
    }
  }

  const payload = buildRuntimeVsPdfRows(
    { grades: closure.grades },
    catalogVsPdf,
    pdfCatalogPayload
  );
  payload.meta = {
    mathRowSubsectionCandidatesSummary: rowCandidatesSummary,
    inventoryNote:
      "שורות מלאות ראו math-row-subsection-candidates.json — כאן רק סיכום והצלבה לפי נושאי ממשק.",
  };

  await writeFile(join(OUT_DIR, "math-runtime-vs-pdf-sections.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = renderMd(payload);
  await writeFile(join(OUT_DIR, "math-runtime-vs-pdf-sections.md"), md, "utf8");
  console.log(`Wrote math-runtime-vs-pdf-sections.json`);
}

function renderMd(p) {
  const lines = [];
  lines.push("# Math runtime / UI topics vs PDF sections");
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push(`- Site topics missing PDF support: **${p.summary.siteTopicsMissingPdfSupport}**`);
  lines.push(`- Generated topics missing PDF support: **${p.summary.generatedTopicsMissingPdfSupport}**`);
  lines.push(`- Needs manual review: **${p.summary.needsManualReview}**`);
  lines.push("");
  for (const r of p.rows) {
    lines.push(
      `- **G${r.grade}** \`${r.operation}\` → ${r.normalizedKey} — **${r.status}** (PDF support: ${r.pdfNormKeySupport})`
    );
  }
  return lines.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
