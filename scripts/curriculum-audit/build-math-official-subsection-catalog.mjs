/**
 * Phase 4B-3 — Export official Math subsection catalog to reports (JSON + MD).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { MATH_OFFICIAL_SUBSECTION_CATALOG } from "../../utils/curriculum-audit/math-official-subsection-catalog.js";
import { SOURCE_REGISTRY_CHECKED_AT } from "../../utils/curriculum-audit/official-curriculum-source-registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

function markdown(payload) {
  const lines = [
    `# Math official subsection catalog (Phase 4B-3)`,
    ``,
    `- Generated: ${payload.generatedAt}`,
    `- Catalog stamp: ${SOURCE_REGISTRY_CHECKED_AT}`,
    ``,
    `## Purpose`,
    ``,
    `- **Grade PDF** = whole programme document for the grade.`,
    `- **Subsection catalog** = manually encoded outline aligned to typical \`kita{n}.pdf\` structure — **not** OCR from PDF.`,
    `- **Exact row approval** still requires pedagogy cross-check; this catalog enables candidate mapping only.`,
    ``,
    `## Coverage summary`,
    ``,
    `| Grade | PDF | Sections | Uncertain areas (notes) |`,
    `|------:|-----|----------|-------------------------|`,
  ];

  for (let g = 1; g <= 6; g++) {
    const slot = payload.catalog[`grade_${g}`];
    lines.push(
      `| ${g} | [PDF](${slot.sourcePdf}) | ${slot.sections.length} | ${slot.missingUncertainAreas.length} bullets |`
    );
  }

  lines.push(``, `## Per-grade detail`, ``);

  for (let g = 1; g <= 6; g++) {
    const slot = payload.catalog[`grade_${g}`];
    lines.push(`### כיתה ${["", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"][g]}`, ``);
    lines.push(`- **PDF:** ${slot.sourcePdf}`);
    lines.push(`- **Missing / uncertain (planning notes):**`);
    for (const u of slot.missingUncertainAreas) lines.push(`  - ${u}`);
    lines.push(``, `| sectionKey | Strand | Label (HE) | Maps to normalized keys | Confidence | Page hint |`, `|---|---------|------------|-------------------------|------------|-----------|`);
    for (const sec of slot.sections) {
      const maps = (sec.mapsToNormalizedKeys || []).join(", ");
      lines.push(
        `| \`${sec.sectionKey}\` | ${sec.strand} | ${sec.labelHe.slice(0, 48)}… | ${maps} | ${sec.confidence} | ${(sec.sourcePageHint || "").slice(0, 40)}… |`
      );
    }
    lines.push(``);
  }

  lines.push(`---`, `Source module: \`utils/curriculum-audit/math-official-subsection-catalog.js\``, ``);
  return lines.join("\n");
}

export async function buildMathOfficialSubsectionCatalog(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4B-3-math-subsection-catalog",
    meta: {
      disclaimer:
        "Sections are manually encoded planning hooks — validate against Ministry PDF before treating as authoritative subsection titles.",
    },
    catalog: MATH_OFFICIAL_SUBSECTION_CATALOG,
    coverageByGrade: Object.fromEntries(
      [...Array(6)].map((_, i) => {
        const g = i + 1;
        const slot = MATH_OFFICIAL_SUBSECTION_CATALOG[`grade_${g}`];
        return [
          g,
          {
            sectionCount: slot.sections.length,
            sourcePdf: slot.sourcePdf,
            uncertainBullets: (slot.missingUncertainAreas || []).length,
          },
        ];
      })
    ),
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-official-subsection-catalog.json");
    const mdPath = join(OUT_DIR, "math-official-subsection-catalog.md");
    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(mdPath, markdown(payload), "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }
  return payload;
}

async function main() {
  await buildMathOfficialSubsectionCatalog({ writeFiles: true });
}

function isExecutedAsMainScript() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    const self = fileURLToPath(import.meta.url);
    return resolve(entry) === resolve(self);
  } catch {
    return false;
  }
}

if (isExecutedAsMainScript()) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
