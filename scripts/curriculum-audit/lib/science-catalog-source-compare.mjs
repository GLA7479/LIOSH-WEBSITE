/**
 * Science catalog ↔ official registry; inventory/runtime helpers.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const registryMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/official-curriculum-source-registry.js")).href);
const catalogMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/science-official-subsection-catalog.js")).href);
const normMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/curriculum-topic-normalizer.js")).href);
const mapMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/israeli-primary-curriculum-map.js")).href);

const { OFFICIAL_CURRICULUM_SOURCE_REGISTRY } = registryMod;
const { SCIENCE_OFFICIAL_SUBSECTION_CATALOG } = catalogMod;
const { normalizeInventoryTopic } = normMod;
const { findTopicPlacement } = mapMod;

export function scienceRegistryRows() {
  return OFFICIAL_CURRICULUM_SOURCE_REGISTRY.filter((r) => r.subject === "science");
}

export function summarizeScienceRegistry(rows) {
  const internalGap = rows.filter((r) => r.sourceType === "internal_gap");
  const officialMoE = rows.filter((r) => r.sourceType === "official_moe");
  const pdfAnchors = rows.filter((r) => r.sourceType === "official_pdf");
  const ownerDocx = pdfAnchors.filter((r) =>
    String(r.url || "").includes("science Curriculum2016.docx")
  );
  return {
    rowCount: rows.length,
    officialMoECount: officialMoE.length,
    officialPdfOrDocAnchorCount: pdfAnchors.length,
    ownerScienceCurriculum2016Rows: ownerDocx.length,
    internalGapCount: internalGap.length,
    internalGapTitles: internalGap.map((r) => r.title),
    notes:
      "POP מגדיר מסגרת מדע וטכנולוגיה; עותק DOCX בעלים משמש עיגון ידני — לא טענה לכיסוי שורה־שורה.",
  };
}

export function compareScienceCatalogToOfficialSources(
  catalog = SCIENCE_OFFICIAL_SUBSECTION_CATALOG,
  registryRows = scienceRegistryRows()
) {
  const regSummary = summarizeScienceRegistry(registryRows);
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
        sourceDoc: slot.sourceDoc || "",
        registryPortalPresent: registryRows.some((r) => r.sourceType === "official_moe"),
        ownerDocxRegistered: regSummary.ownerScienceCurriculum2016Rows > 0,
        status:
          regSummary.officialMoECount > 0 && regSummary.ownerScienceCurriculum2016Rows > 0
            ? "registry_anchor_ok"
            : "needs_registry_anchor",
        notes: section.confidence === "low" ? "קטע קטלוג בביטחון נמוך — לאמת מול DOCX בעלים." : "",
      });
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    meta: {
      purpose:
        "השוואת קטלוג מיומנויות פנימי מול רישום מקורות (POP + DOCX בעלים) — לא החלפת ביקורת פדגוגית ידנית.",
      registrySummary: regSummary,
      primaryOwnerDoc: "תוכנית משרד החינוך/science Curriculum2016.docx",
    },
    summary: {
      catalogSectionRows: rows.length,
      rowsNeedingAnchor: rows.filter((r) => r.status !== "registry_anchor_ok").length,
    },
    rows,
  };
}

export function scienceRuntimeRowVsCatalog(row) {
  const norm = normalizeInventoryTopic({
    subject: "science",
    topic: row.topic,
    subtopic: row.subtopic || row.subtype || "",
  });
  const nk = norm.normalizedTopicKey;

  const gmin = Number(row.minGrade ?? row.gradeMin);
  const gmax = Number(row.maxGrade ?? row.gradeMax);
  /** @type {string[]} */
  const issues = [];
  let worst = "ok";

  if (nk.startsWith("science.unmapped")) {
    issues.push("unmapped_normalized_key");
    worst = "needs_manual_review";
  }

  if (!Number.isFinite(gmin) || !Number.isFinite(gmax)) {
    issues.push("missing_or_invalid_grade_span");
    worst = "needs_manual_review";
  } else {
    for (let g = gmin; g <= gmax; g++) {
      const hit = findTopicPlacement("science", g, nk);
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
    rowId: row.rowId || row.spine_skill_id || row.id || "",
    topic: row.topic,
    subtopic: row.subtopic,
    normalizedTopicKey: nk,
    minGrade: gmin,
    maxGrade: gmax,
    status: worst,
    issues,
  };
}

export function buildScienceRuntimeVsOfficialSummary(inventoryRows) {
  const sciRows = (inventoryRows || []).filter((r) => r.subject === "science");
  const mapped = sciRows.map((r) => scienceRuntimeRowVsCatalog(r));
  const needsReview = mapped.filter((m) => m.status !== "ok");
  return {
    generatedAt: new Date().toISOString(),
    meta: {
      inventoryScienceRows: sciRows.length,
    },
    summary: {
      rowsTotal: mapped.length,
      rowsOk: mapped.filter((m) => m.status === "ok").length,
      rowsNeedingManualReview: needsReview.length,
    },
    rows: mapped.slice(0, 8000),
    rowsTruncated: mapped.length > 8000,
  };
}
