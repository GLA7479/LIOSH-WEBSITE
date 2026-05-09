/**
 * Compare MATH_OFFICIAL_SUBSECTION_CATALOG sections to extracted PDF catalog — pure functions.
 */
import {
  classifyMatch,
  normalizeHebrewPdfText,
  scoreCatalogAgainstPdf,
} from "./math-pdf-text.mjs";

/**
 * @param {object} pdfCatalogPayload from build-math-pdf-section-catalog.mjs
 * @param {object} mathOfficialCatalog MATH_OFFICIAL_SUBSECTION_CATALOG
 */
export function compareOfficialCatalogToPdfSections(pdfCatalogPayload, mathOfficialCatalog) {
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

    const slot = mathOfficialCatalog[`grade_${grade}`];
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
      /** Strong scores driven only by frequent short tokens (not a long shared phrase) are downgraded. */
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
    phase: "math-catalog-vs-pdf-sections",
    meta: {
      disclaimerHe:
        "השוואה סטטיסטית לטקסט שחולץ מקובצי PDF אינה מחליפה מעבר ידני על כותרות וסעיפים במסמך המקורי.",
      technicalNotes:
        "חילוח עברית מ-PDF רווי רווחים; ניקוי מאחד תווים ומשווה תתי־מחרוזות לטקסט המצטבר לכיתה. ציון גבוה אינו מוכיח התאמה פרסומית מלאה למונח המשרד.",
    },
    summary,
    rows,
  };
}

/** Ops from GRADES / closure → normalized curriculum keys (matches build-math-final-closure OP_TO_NORM) */
export const OP_TO_NORM_DEFAULT = {
  addition: "math.addition_subtraction",
  subtraction: "math.addition_subtraction",
  multiplication: "math.multiplication_division",
  division: "math.multiplication_division",
  division_with_remainder: "math.multiplication_division",
  fractions: "math.fractions",
  percentages: "math.percentages",
  sequences: "math.patterns_sequences",
  decimals: "math.decimals",
  rounding: "math.estimation_rounding",
  divisibility: "math.divisibility_factors",
  prime_composite: "math.divisibility_factors",
  powers: "math.powers_and_scaling",
  ratio: "math.ratio_and_scale",
  order_of_operations: "math.equations_and_expressions",
  equations: "math.equations_and_expressions",
  compare: "math.number_sense",
  number_sense: "math.number_sense",
  factors_multiples: "math.divisibility_factors",
  estimation: "math.estimation_rounding",
  scale: "math.ratio_and_scale",
  word_problems: "math.word_problems",
  zero_one_properties: "math.equations_and_expressions",
  mixed: "math.mixed_operations",
};

/**
 * @param {object} closurePayload math-final-closure inner grades + topics structure
 * @param {object} catalogVsPdf from compareOfficialCatalogToPdfSections
 * @param {object} pdfCatalogPayload
 */
export function buildRuntimeVsPdfRows(closurePayload, catalogVsPdf, pdfCatalogPayload) {
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

    for (const op of g.uiTopics || []) {
      const nk = OP_TO_NORM_DEFAULT[op] || `math.${op}`;
      const sup = bestSupportForNormKey(nk);
      const topicStats = g.topics?.[op];
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
        operation: op,
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
    phase: "math-runtime-vs-pdf-sections",
    summary,
    rows,
  };
}
