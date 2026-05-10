/**
 * English catalog ↔ official registry; inventory/runtime helpers.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const registryMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/official-curriculum-source-registry.js")).href);
const catalogMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/english-official-subsection-catalog.js")).href);
const normMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/curriculum-topic-normalizer.js")).href);
const mapMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/israeli-primary-curriculum-map.js")).href);
const topicNormMod = await import(pathToFileURL(join(ROOT, "utils/english-grade-topic-policy.js")).href);

const { OFFICIAL_CURRICULUM_SOURCE_REGISTRY } = registryMod;
const { ENGLISH_OFFICIAL_SUBSECTION_CATALOG } = catalogMod;
const { normalizeInventoryTopic } = normMod;
const { findTopicPlacement } = mapMod;

export const { ENGLISH_TOPIC_TO_REP_NORM } = topicNormMod;

export function englishRegistryRows() {
  return OFFICIAL_CURRICULUM_SOURCE_REGISTRY.filter((r) => r.subject === "english");
}

export function summarizeEnglishRegistry(rows) {
  const internalGap = rows.filter((r) => r.sourceType === "internal_gap");
  const officialMoE = rows.filter((r) => r.sourceType === "official_moe");
  const pdfAnchors = rows.filter((r) => r.sourceType === "official_pdf");
  const ownerLocalPdf = pdfAnchors.filter((r) =>
    String(r.url || "").includes("english Curriculum2020.pdf")
  );
  return {
    rowCount: rows.length,
    officialMoECount: officialMoE.length,
    officialPdfCount: pdfAnchors.length,
    ownerCurriculum2020PdfRows: ownerLocalPdf.length,
    internalGapCount: internalGap.length,
    internalGapTitles: internalGap.map((r) => r.title),
    notes:
      "POP מגדיר מסגרת; עותק PDF Curriculum2020 במאגר משמש עיגון בעלים — לא טענה לכיסוי שורה־שורה של כל פסקת PDF.",
  };
}

export function catalogNormalizedKeysForGrade(gradeNum) {
  const slot = ENGLISH_OFFICIAL_SUBSECTION_CATALOG[`grade_${gradeNum}`];
  if (!slot) return new Set();
  const keys = new Set();
  for (const s of slot.sections || []) {
    for (const k of s.mapsToNormalizedKeys || []) keys.add(k);
  }
  return keys;
}

export function compareEnglishCatalogToOfficialSources(
  catalog = ENGLISH_OFFICIAL_SUBSECTION_CATALOG,
  registryRows = englishRegistryRows()
) {
  const regSummary = summarizeEnglishRegistry(registryRows);
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
        sourcePdf: slot.sourcePdf || "",
        registryPortalPresent: registryRows.some((r) => r.sourceType === "official_moe"),
        ownerPdfRegistered: regSummary.ownerCurriculum2020PdfRows > 0,
        status:
          regSummary.officialMoECount > 0 && regSummary.ownerCurriculum2020PdfRows > 0
            ? "registry_anchor_ok"
            : "needs_registry_anchor",
        notes:
          section.confidence === "low"
            ? "קטע קטלוג בביטחון נמוך — לאמת מול עמודים ב־PDF בעלים."
            : "",
      });
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    meta: {
      purpose:
        "השוואת קטלוג מיומנויות פנימי מול רישום מקורות (POP + PDF בעלים) — לא החלפת ביקורת פדגוגית ידנית.",
      registrySummary: regSummary,
      primaryOwnerPdf: "תוכנית משרד החינוך/english Curriculum2020.pdf",
    },
    summary: {
      catalogSectionRows: rows.length,
      rowsNeedingAnchor: rows.filter((r) => r.status !== "registry_anchor_ok").length,
    },
    rows,
  };
}

/**
 * @returns {{ status: string, issues: string[], normalizedTopicKey: string, rowId?: string }}
 */
export function englishRuntimeRowVsCatalog(row) {
  const norm = normalizeInventoryTopic({
    subject: "english",
    topic: row.topic,
    subtopic: row.subtopic || row.subtype || "",
  });
  const nk = norm.normalizedTopicKey;
  const rawTopic = String(row.topic || "").trim();

  if (rawTopic === "mixed" || nk.includes("mixed_practice")) {
    return {
      rowId: row.rowId || row.spine_skill_id || row.id || "",
      topic: row.topic,
      subtopic: row.subtopic,
      normalizedTopicKey: nk,
      minGrade: Number(row.minGrade ?? row.gradeMin),
      maxGrade: Number(row.maxGrade ?? row.gradeMax),
      status: "ok",
      issues: ["skipped_mixed_bucket"],
    };
  }

  const gmin = Number(row.minGrade ?? row.gradeMin);
  const gmax = Number(row.maxGrade ?? row.gradeMax);
  /** @type {string[]} */
  const issues = [];
  let worst = "ok";

  if (nk.startsWith("english.unmapped")) {
    issues.push("unmapped_normalized_key");
    worst = "needs_manual_review";
  }

  if (!Number.isFinite(gmin) || !Number.isFinite(gmax)) {
    issues.push("missing_or_invalid_grade_span");
    worst = "needs_manual_review";
  } else {
    for (let g = gmin; g <= gmax; g++) {
      const hit = findTopicPlacement("english", g, nk);
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

export function buildEnglishRuntimeVsOfficialSummary(inventoryRows) {
  const enRows = (inventoryRows || []).filter((r) => r.subject === "english");
  const mapped = enRows.map((r) => englishRuntimeRowVsCatalog(r));
  const needsReview = mapped.filter((m) => m.status !== "ok");
  return {
    generatedAt: new Date().toISOString(),
    meta: {
      inventoryEnglishRows: enRows.length,
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
