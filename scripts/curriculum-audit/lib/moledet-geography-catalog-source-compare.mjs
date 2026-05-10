/**
 * Moledet/Geography catalog ↔ official registry; inventory helpers.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const registryMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/official-curriculum-source-registry.js")).href);
const catalogMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/moledet-geography-official-subsection-catalog.js")).href);
const normMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/curriculum-topic-normalizer.js")).href);
const mapMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/israeli-primary-curriculum-map.js")).href);

const { OFFICIAL_CURRICULUM_SOURCE_REGISTRY } = registryMod;
const { MOLEDET_GEOGRAPHY_OFFICIAL_SUBSECTION_CATALOG } = catalogMod;
const { normalizeInventoryTopic } = normMod;
const { findTopicPlacement } = mapMod;

const OWNER_MARKERS = ["homeland-curriculum.pdf", "tochnit-vav.pdf", "tohnit-geography-5-6.pdf"];

export function moledetGeographyRegistryRows() {
  return OFFICIAL_CURRICULUM_SOURCE_REGISTRY.filter((r) => r.subject === "moledet-geography");
}

export function summarizeMoledetGeographyRegistry(rows) {
  const internalGap = rows.filter((r) => r.sourceType === "internal_gap");
  const officialMoE = rows.filter((r) => r.sourceType === "official_moe");
  const pdfAnchors = rows.filter((r) => r.sourceType === "official_pdf");
  const ownerWorkspacePdfs = pdfAnchors.filter((r) => OWNER_MARKERS.some((m) => String(r.url || "").includes(m)));
  return {
    rowCount: rows.length,
    officialMoECount: officialMoE.length,
    officialPdfAnchorCount: pdfAnchors.length,
    ownerWorkspacePdfRows: ownerWorkspacePdfs.length,
    internalGapCount: internalGap.length,
    internalGapTitles: internalGap.map((r) => r.title),
    notes:
      "POP מגדיר מסגרת מולדת/חברה ואזרחות; קבצי PDF בתיקיית תוכנית משרד החינוך משמשים עיגון בעלים — לא טענה לכיסוי שורה־שורה.",
  };
}

export function compareMoledetGeographyCatalogToOfficialSources(
  catalog = MOLEDET_GEOGRAPHY_OFFICIAL_SUBSECTION_CATALOG,
  registryRows = moledetGeographyRegistryRows()
) {
  const regSummary = summarizeMoledetGeographyRegistry(registryRows);
  const rows = [];
  for (let g = 1; g <= 6; g++) {
    const slot = catalog[`grade_${g}`];
    if (!slot) continue;
    for (const section of slot.sections || []) {
      rows.push({
        grade: g,
        sectionKey: section.sectionKey,
        labelHe: section.labelHe,
        catalogConfidence: section.confidence,
        mapsToNormalizedKeys: section.mapsToNormalizedKeys || [],
        sourcePortalPresent: registryRows.some((r) => r.sourceType === "official_moe"),
        ownerPdfAnchorsPresent: regSummary.ownerWorkspacePdfRows > 0,
        status:
          regSummary.officialMoECount > 0 && regSummary.ownerWorkspacePdfRows > 0
            ? "registry_anchor_ok"
            : "needs_registry_anchor",
        notes: section.confidence === "low" ? "קטע קטלוג בביטחון נמוך — לאמת מול PDF בעלים." : "",
      });
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    meta: {
      purpose:
        "השוואת קטלוג פנימי מול רישום מקורות (POP + PDF בעלים) — לא מחליף ביקורת פדגוגית ידנית.",
      registrySummary: regSummary,
      primaryOwnerPdfs: OWNER_MARKERS.map((m) => `תוכנית משרד החינוך/${m}`),
    },
    summary: {
      catalogSectionRows: rows.length,
      rowsNeedingAnchor: rows.filter((r) => r.status !== "registry_anchor_ok").length,
    },
    rows,
  };
}

export function moledetGeographyRuntimeRowVsCatalog(row) {
  const norm = normalizeInventoryTopic({
    subject: "moledet-geography",
    topic: row.topic,
    subtopic: row.subtopic || "",
  });
  const nk = norm.normalizedTopicKey;

  const gmin = Number(row.minGrade ?? row.gradeMin);
  const gmax = Number(row.maxGrade ?? row.gradeMax);
  /** @type {string[]} */
  const issues = [];
  let worst = "ok";

  if (nk.includes("unknown.")) {
    issues.push("unmapped_normalized_key");
    worst = "needs_manual_review";
  }

  if (!Number.isFinite(gmin) || !Number.isFinite(gmax)) {
    issues.push("missing_or_invalid_grade_span");
    worst = "needs_manual_review";
  } else {
    for (let g = gmin; g <= gmax; g++) {
      const hit = findTopicPlacement("moledet-geography", g, nk);
      if (!hit) {
        issues.push(`no_curriculum_placement_grade_${g}:${nk}`);
        worst = "needs_manual_review";
      } else if (hit.bucket === "notExpectedYet") {
        issues.push(`strand_marked_not_expected_yet_grade_${g}:${nk}`);
        worst = "needs_manual_review";
      }
    }
  }

  return {
    rowId: row.rowId || row.spine_skill_id || row.poolKey || "",
    topic: row.topic,
    subtopic: row.subtopic,
    normalizedTopicKey: nk,
    minGrade: gmin,
    maxGrade: gmax,
    status: worst,
    issues,
  };
}

export function buildMoledetGeographyRuntimeVsOfficialSummary(inventoryRows) {
  const geoRows = (inventoryRows || []).filter(
    (r) => r.subject === "moledet-geography" || r.subject === "geography"
  );
  const mapped = geoRows.map((r) => moledetGeographyRuntimeRowVsCatalog(r));
  const needsReview = mapped.filter((m) => m.status !== "ok");
  return {
    generatedAt: new Date().toISOString(),
    meta: {
      inventoryGeographyRows: geoRows.length,
    },
    summary: {
      rowsTotal: mapped.length,
      rowsOk: mapped.filter((m) => m.status === "ok").length,
      rowsNeedingManualReview: needsReview.length,
    },
    rows: mapped.slice(0, 12000),
    rowsTruncated: mapped.length > 12000,
  };
}
