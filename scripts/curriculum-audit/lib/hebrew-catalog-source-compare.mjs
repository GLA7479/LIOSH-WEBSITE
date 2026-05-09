/**
 * Compare Hebrew subsection catalog ↔ official source registry; inventory/runtime helpers.
 * Imports use repo-root paths so tsx resolves consistently from scripts/curriculum-audit/lib/.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const registryMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/official-curriculum-source-registry.js")).href);
const catalogMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/hebrew-official-subsection-catalog.js")).href);
const normMod = await import(pathToFileURL(join(ROOT, "utils/curriculum-audit/curriculum-topic-normalizer.js")).href);

const { OFFICIAL_CURRICULUM_SOURCE_REGISTRY } = registryMod;
const HEBREW_OFFICIAL_SUBSECTION_CATALOG = catalogMod.HEBREW_OFFICIAL_SUBSECTION_CATALOG;
const { normalizeInventoryTopic } = normMod;

export const HEBREW_TOPIC_TO_NORM = {
  reading: "hebrew.decoding_reading_fluency",
  comprehension: "hebrew.reading_comprehension",
  writing: "hebrew.writing",
  grammar: "hebrew.grammar_language_knowledge",
  vocabulary: "hebrew.vocabulary",
  speaking: "hebrew.oral_expression",
  mixed: "hebrew.mixed_bucket",
};

export function hebrewRegistryRows() {
  return OFFICIAL_CURRICULUM_SOURCE_REGISTRY.filter((r) => r.subject === "hebrew");
}

export function catalogNormalizedKeysForGrade(gradeNum) {
  const slot = HEBREW_OFFICIAL_SUBSECTION_CATALOG[`grade_${gradeNum}`];
  if (!slot) return new Set();
  const keys = new Set();
  for (const s of slot.sections || []) {
    for (const k of s.mapsToNormalizedKeys || []) keys.add(k);
  }
  return keys;
}

/**
 * Registry summary for Hebrew — highlights POP anchors vs internal_gap.
 */
export function summarizeHebrewRegistry(rows) {
  const internalGap = rows.filter((r) => r.sourceType === "internal_gap");
  const officialMoE = rows.filter((r) => r.sourceType === "official_moe");
  const pdfAnchors = rows.filter((r) => r.sourceType === "official_pdf");
  return {
    rowCount: rows.length,
    officialMoECount: officialMoE.length,
    officialPdfCount: pdfAnchors.length,
    internalGapCount: internalGap.length,
    internalGapTitles: internalGap.map((r) => r.title),
    gradeSpecificTeachingPages: officialMoE.filter((r) =>
      String(r.url || "").includes("teaching-hebrew-grade1")
    ).length,
    notes:
      "Full grade-level PDF tables (כמו מתמטיקה kita*.pdf) אינן רשומות במאגר זה — ראו שורות internal_gap לפני טענת יישור מלא.",
  };
}

/**
 * Each catalog section lists expected normalized keys; registry must still provide POP anchor.
 */
export function compareHebrewCatalogToOfficialSources(catalog = HEBREW_OFFICIAL_SUBSECTION_CATALOG, registryRows = hebrewRegistryRows()) {
  const regSummary = summarizeHebrewRegistry(registryRows);
  const hasInternalGap = regSummary.internalGapCount > 0;
  const rows = [];
  for (let g = 1; g <= 6; g++) {
    const slot = catalog[`grade_${g}`];
    if (!slot) continue;
    for (const section of slot.sections || []) {
      const missingOfficialPdfAnchor = hasInternalGap;
      rows.push({
        grade: g,
        sectionKey: section.sectionKey,
        labelHe: section.labelHe,
        catalogConfidence: section.confidence,
        mapsToNormalizedKeys: section.mapsToNormalizedKeys || [],
        registryPortalPresent: registryRows.some((r) => r.sourceType === "official_moe"),
        gradeSpecificPopPage:
          g === 1
            ? registryRows.some((r) => String(r.url || "").includes("teaching-hebrew-grade1"))
            : false,
        status: missingOfficialPdfAnchor ? "needs_manual_pdf_or_meyda_anchor" : "registry_anchor_ok",
        notes:
          g === 1
            ? "כיתה א׳: דף הוראה POP ייעודי קיים."
            : "אין דף כיתה נפרד ברישום — עיגון מול מסמכי מיידע נדרש לפני סגירה מלאה.",
      });
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    meta: {
      purpose:
        "השוואת קטלוג מיומנויות פנימי מול מקורות POP/registry — לא החלפת PDF רשמי לכל כיתה.",
      registrySummary: regSummary,
    },
    summary: {
      catalogSectionRows: rows.length,
      rowsNeedingManualAnchor: rows.filter((r) => r.status === "needs_manual_pdf_or_meyda_anchor").length,
      gradesWithDedicatedPopTeachingPage: 1,
    },
    rows,
  };
}

/**
 * Map inventory row → normalized topic; compare to catalog keys for representative grade (minGrade..maxGrade).
 */
export function runtimeRowVsCatalog(row) {
  const norm = normalizeInventoryTopic({
    subject: "hebrew",
    topic: row.topic,
    subtopic: row.subtopic || row.subtype || "",
  });
  const gmin = Number(row.minGrade ?? row.gradeMin);
  const gmax = Number(row.maxGrade ?? row.gradeMax);
  const nk = norm.normalizedTopicKey;
  const rawTopic = String(row.topic || "").trim();

  /** @type {string[]} */
  const issues = [];
  let worst = "ok";

  if (rawTopic === "mixed" || nk === "hebrew.mixed_bucket") {
    return {
      rowId: row.rowId || row.spine_skill_id || row.id || "",
      topic: row.topic,
      subtopic: row.subtopic,
      normalizedTopicKey: nk,
      minGrade: gmin,
      maxGrade: gmax,
      status: "ok",
      issues: ["skipped_mixed_bucket"],
    };
  }

  if (!Number.isFinite(gmin) || !Number.isFinite(gmax)) {
    issues.push("missing_or_invalid_grade_span");
    worst = "needs_manual_review";
  } else {
    for (let g = gmin; g <= gmax; g++) {
      const allowed = catalogNormalizedKeysForGrade(g);
      if (allowed.size === 0) continue;
      if (nk.startsWith("hebrew.unmapped")) {
        issues.push(`unmapped_normalized_key_grade_${g}`);
        worst = "needs_manual_review";
        continue;
      }
      if (!allowed.has(nk)) {
        issues.push(`normalized_key_not_listed_in_catalog_grade_${g}:${nk}`);
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

export function buildHebrewRuntimeVsOfficialSummary(inventoryRows, catalog = HEBREW_OFFICIAL_SUBSECTION_CATALOG) {
  const heRows = (inventoryRows || []).filter((r) => r.subject === "hebrew");
  const mapped = heRows.map((r) => runtimeRowVsCatalog(r));
  const needsReview = mapped.filter((m) => m.status !== "ok");
  return {
    generatedAt: new Date().toISOString(),
    meta: {
      inventoryHebrewRows: heRows.length,
      catalogGrades: Object.keys(catalog).length,
    },
    summary: {
      rowsTotal: mapped.length,
      rowsOk: mapped.filter((m) => m.status === "ok").length,
      rowsNeedingManualReview: needsReview.length,
    },
    rows: mapped.slice(0, 5000),
    rowsTruncated: mapped.length > 5000,
  };
}
