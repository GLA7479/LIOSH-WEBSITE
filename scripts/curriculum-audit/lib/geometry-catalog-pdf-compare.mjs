/**
 * Compare GEOMETRY_OFFICIAL_SUBSECTION_CATALOG sections to extracted PDF catalog — pure functions.
 */
import {
  classifyMatch,
  normalizeHebrewPdfText,
  scoreCatalogAgainstPdf,
} from "./math-pdf-text.mjs";

/**
 * @param {object} pdfCatalogPayload from build-geometry-pdf-section-catalog.mjs
 * @param {object} geometryOfficialCatalog GEOMETRY_OFFICIAL_SUBSECTION_CATALOG
 */
export function compareGeometryOfficialCatalogToPdfSections(pdfCatalogPayload, geometryOfficialCatalog) {
  /** @type {object[]} */
  const rows = [];

  for (let grade = 1; grade <= 6; grade++) {
    const gradePdf = pdfCatalogPayload.byGrade?.find((g) => g.grade === grade);
    const blob =
      gradePdf?.sections?.map((s) => s.exactTopicWording || "").join(" ") ||
      "";
    const pdfBlobNorm = normalizeHebrewPdfText(blob);
    const extraPhrases =
      gradePdf?.sections?.map((s) => s.exactTopicWording).filter(Boolean) || [];

    const slot = geometryOfficialCatalog[`grade_${grade}`];
    const sections = slot?.sections || [];

    for (const sec of sections) {
      const label = sec.labelHe || "";
      const base = scoreCatalogAgainstPdf(label, pdfBlobNorm, extraPhrases);
      const subScores = (sec.subsectionLabelsHe || []).map((sub) =>
        scoreCatalogAgainstPdf(sub, pdfBlobNorm, extraPhrases)
      );
      const score = Math.max(base.score, ...subScores.map((x) => x.score));
      const bestRunRatio = Math.max(
        base.runRatio ?? 0,
        ...subScores.map((x) => x.runRatio ?? 0)
      );

      const nearHits = extraPhrases.filter((ph) => {
        const sc = scoreCatalogAgainstPdf(label, normalizeHebrewPdfText(ph), [ph]);
        return sc.score >= 0.45;
      });
      const ambiguous = nearHits.length >= 3 && score < 0.9;

      let classification = classifyMatch(score, ambiguous);
      if (classification === "exact_pdf_match" && bestRunRatio < 0.2) {
        classification = score >= 0.55 ? "reasonable_grouping" : "broad_mapping";
      }
      if (classification === "reasonable_grouping" && bestRunRatio < 0.12) {
        classification = "broad_mapping";
      }

      rows.push({
        grade,
        sectionKey: sec.sectionKey,
        catalogLabelHe: label,
        subsectionLabelsHe: sec.subsectionLabelsHe || [],
        strand: sec.strand,
        mapsToNormalizedKeys: sec.mapsToNormalizedKeys || [],
        catalogConfidence: sec.confidence,
        matchScore: Math.round(score * 1000) / 1000,
        bestRunRatio: Math.round(bestRunRatio * 1000) / 1000,
        classification,
        matchedPdfPhrasesSample: nearHits.slice(0, 5),
        notes:
          gradePdf?.downloadOk === false
            ? "PDF לא הורד — לא ניתן להשוות."
            : pdfBlobNorm.length < 80
              ? "מעט מדי טקסט בקטלוג ה-PDF לכיתה זו לאחר חילוץ — ייתכן כשל חילוץ או עמודים ריקים."
              : "",
      });
    }
  }

  const summary = {
    totalCatalogSections: rows.length,
    exact_pdf_match: rows.filter((r) => r.classification === "exact_pdf_match").length,
    reasonable_grouping: rows.filter((r) => r.classification === "reasonable_grouping").length,
    broad_mapping: rows.filter((r) => r.classification === "broad_mapping").length,
    missing_pdf_support: rows.filter((r) => r.classification === "missing_pdf_support").length,
    needs_manual_review: rows.filter((r) => r.classification === "needs_manual_review").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    phase: "geometry-catalog-vs-pdf-sections",
    meta: {
      disclaimerHe:
        "השוואה סטטיסטית לטקסט שחולץ מקובצי PDF אינה מחליפה מעבר ידני על כותרות וסעיפים במסמך המקורי.",
      technicalNotes:
        "גאומטריה מוטמעת בתוכנית המתמטיקה היסודית — נעשה שימוש באותם קובצי kita{n}.pdf כמו במתמטיקה.",
    },
    summary,
    rows,
  };
}

/** geometry-constants topic keys → normalized curriculum keys */
export const GEOMETRY_TOPIC_TO_NORM = {
  shapes_basic: "geometry.shape_recognition_plane_figures",
  area: "geometry.area",
  perimeter: "geometry.perimeter",
  volume: "geometry.volume",
  angles: "geometry.angles",
  parallel_perpendicular: "geometry.parallel_perpendicular_spatial",
  triangles: "geometry.triangles",
  quadrilaterals: "geometry.polygons_quadrilaterals",
  transformations: "geometry.transformations_symmetry",
  rotation: "geometry.transformations_symmetry",
  symmetry: "geometry.transformations_symmetry",
  diagonal: "geometry.diagonals_properties",
  heights: "geometry.heights_area_links",
  tiling: "geometry.tiling_covering",
  circles: "geometry.circle_basic",
  solids: "geometry.solids_3d",
  pythagoras: "geometry.pythagoras_right_triangles",
  mixed: "geometry.mixed_review",
};

/**
 * @param {object} closurePayload geometry-final-closure inner grades + topics structure
 * @param {object} catalogVsPdf from compareGeometryOfficialCatalogToPdfSections
 * @param {object} pdfCatalogPayload
 */
export function buildGeometryRuntimeVsPdfRows(closurePayload, catalogVsPdf, pdfCatalogPayload) {
  /** @type {object[]} */
  const rows = [];

  const catalogRowsByNorm = new Map();
  for (const r of catalogVsPdf.rows || []) {
    for (const nk of r.mapsToNormalizedKeys || []) {
      if (!catalogRowsByNorm.has(nk)) catalogRowsByNorm.set(nk, []);
      catalogRowsByNorm.get(nk).push(r);
    }
  }

  function bestSupportForNormKey(nk) {
    const hits = catalogRowsByNorm.get(nk) || [];
    if (!hits.length) return { support: "unknown", worst: null };
    const order = [
      "exact_pdf_match",
      "reasonable_grouping",
      "broad_mapping",
      "needs_manual_review",
      "missing_pdf_support",
    ];
    let worstIdx = -1;
    for (const h of hits) {
      const idx = order.indexOf(h.classification);
      if (idx > worstIdx) worstIdx = idx;
    }
    const worst = order[worstIdx] || "missing_pdf_support";
    return { support: worst === "missing_pdf_support" ? "missing" : "pdf_backed", worst };
  }

  const grades = closurePayload.grades || [];
  for (const g of grades) {
    const grade = g.grade;
    const pdfGrade = pdfCatalogPayload?.byGrade?.find((x) => x.grade === grade);
    const pdfOk = pdfGrade?.downloadOk !== false && (pdfGrade?.fullTextNormalizedLength || 0) > 50;

    for (const topic of g.uiTopics || []) {
      const nk = GEOMETRY_TOPIC_TO_NORM[topic] || `geometry.${topic}`;
      const sup = bestSupportForNormKey(nk);
      const topicStats = g.topics?.[topic];
      const hasSamples =
        topicStats &&
        ["easy", "medium", "hard"].every(
          (lev) => (topicStats.byDifficulty?.[lev]?.samples || 0) > 0
        );

      let status = "allowed";
      if (!pdfOk) status = "not_supported";
      else if (sup.worst === "missing_pdf_support") status = "missing";
      else if (sup.worst === "needs_manual_review") status = "needs_manual_review";
      else if (sup.worst === "broad_mapping") status = "intro";
      else if (sup.worst === "reasonable_grouping") status = "allowed";

      rows.push({
        grade,
        topic,
        normalizedKey: nk,
        appearsInSite: true,
        appearsInGenerator: !!hasSamples,
        appearsInPdfCatalogText: pdfOk,
        pdfNormKeySupport: sup.worst,
        status,
        difficultyNotes: topicStats
          ? Object.fromEntries(
              ["easy", "medium", "hard"].map((lev) => {
                const v = topicStats.byDifficulty?.[lev]?.variety;
                return [
                  lev,
                  {
                    uniqueKinds: v?.uniqueKinds,
                    stemPatternRatio: v?.stemPatternRatio,
                    weakKindVariety: v?.weakKindVariety,
                  },
                ];
              })
            )
          : {},
        actionNeeded:
          status === "missing"
            ? "אין התאמה מספקת בין מפתח מנורמל לטקסט ה-PDF — לאמת כותרת בקטלוג או להחמיר ניסוח קטלוג."
            : status === "needs_manual_review"
              ? "כמה התאמות אפשריות לקטעי PDF — החלטת בעלים."
              : status === "not_supported"
                ? "כיתה לא נטענה מה-PDF או טקסט חסר."
                : pdfOk && sup.worst === "broad_mapping"
                  ? "מיפוי רחב — מומלץ אימות ידני קצר."
                  : "",
      });
    }
  }

  const summary = {
    topicRows: rows.length,
    siteTopicsMissingPdfSupport: rows.filter((r) => r.status === "missing").length,
    generatedTopicsMissingPdfSupport: rows.filter(
      (r) => r.appearsInGenerator && r.status === "missing"
    ).length,
    needsManualReview: rows.filter((r) => r.status === "needs_manual_review").length,
  };

  return {
    generatedAt: new Date().toISOString(),
    phase: "geometry-runtime-vs-pdf-sections",
    summary,
    rows,
  };
}
