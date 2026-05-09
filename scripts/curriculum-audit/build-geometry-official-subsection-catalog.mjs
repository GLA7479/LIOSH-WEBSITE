/**
 * Phase 4G — Export official Geometry subsection catalog to reports (JSON + MD).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { GEOMETRY_OFFICIAL_SUBSECTION_CATALOG } from "../../utils/curriculum-audit/geometry-official-subsection-catalog.js";
import { SOURCE_REGISTRY_CHECKED_AT } from "../../utils/curriculum-audit/official-curriculum-source-registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

function markdown(payload) {
  const lines = [
    `# Geometry official subsection catalog (Phase 4G)`,
    ``,
    `- Generated: ${payload.generatedAt}`,
    `- Catalog stamp: ${SOURCE_REGISTRY_CHECKED_AT}`,
    ``,
    `## Purpose`,
    ``,
    `- Geometry is encoded as a separate audit strand but aligns with the MoE **math** programme geometry thread (POP).`,
    `- **Exact subsection approval** still requires pedagogy cross-check against \`kita{n}.pdf\` / school documents.`,
    ``,
    `## Coverage summary`,
    ``,
    `| Grade | Sections | Uncertain areas (notes) |`,
    `|------:|----------|-------------------------|`,
  ];

  for (let g = 1; g <= 6; g++) {
    const slot = payload.catalog[`grade_${g}`];
    lines.push(
      `| ${g} | ${slot.sections.length} | ${slot.missingUncertainAreas.length} bullets |`
    );
  }

  lines.push(``, `## Per-grade detail`, ``);

  for (let g = 1; g <= 6; g++) {
    const slot = payload.catalog[`grade_${g}`];
    lines.push(`### כיתה ${["", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"][g]}`, ``);
    lines.push(`- **POP anchor:** ${slot.sourcePdf}`);
    lines.push(`- **Missing / uncertain:**`);
    for (const u of slot.missingUncertainAreas) lines.push(`  - ${u}`);
    lines.push(
      ``,
      `| sectionKey | Strand | Label (HE) | Maps to normalized keys | Confidence |`,
      `|---|---------|------------|-------------------------|------------|`
    );
    for (const sec of slot.sections) {
      const maps = (sec.mapsToNormalizedKeys || []).join(", ");
      lines.push(
        `| \`${sec.sectionKey}\` | ${sec.strand} | ${sec.labelHe.slice(0, 48)}… | ${maps} | ${sec.confidence} |`
      );
    }
    lines.push(``);
  }

  lines.push(`---`, `Source module: \`utils/curriculum-audit/geometry-official-subsection-catalog.js\``, ``);
  return lines.join("\n");
}

export async function buildGeometryOfficialSubsectionCatalog(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "4G-geometry-subsection-catalog",
    meta: {
      disclaimer:
        "Sections are manually encoded planning hooks — validate against Ministry PDF before treating as authoritative subsection titles.",
    },
    catalog: GEOMETRY_OFFICIAL_SUBSECTION_CATALOG,
    coverageByGrade: Object.fromEntries(
      [...Array(6)].map((_, i) => {
        const g = i + 1;
        const slot = GEOMETRY_OFFICIAL_SUBSECTION_CATALOG[`grade_${g}`];
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
    const jsonPath = join(OUT_DIR, "geometry-official-subsection-catalog.json");
    const mdPath = join(OUT_DIR, "geometry-official-subsection-catalog.md");
    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(mdPath, markdown(payload), "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }
  return payload;
}

async function main() {
  await buildGeometryOfficialSubsectionCatalog({ writeFiles: true });
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
