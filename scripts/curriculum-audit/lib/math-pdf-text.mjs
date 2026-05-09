/**
 * Hebrew curriculum PDF text helpers — MoE kita PDFs often split glyphs with spaces.
 */

/** @param {string} s */
export function normalizeHebrewPdfText(s) {
  let t = String(s || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ");
  for (let i = 0; i < 8; i++) {
    t = t.replace(/([\u0590-\u05FF])\s+([\u0590-\u05FF])/g, "$1$2");
  }
  return t.replace(/\s+/g, " ").trim();
}

/** @param {string} t */
export function guessStrandCategory(t) {
  const n = normalizeHebrewPdfText(t);
  if (/גאומטר|צורות|מלבן|ריבוע|מצולע|זווית|סימטריה/.test(n)) return "geometry_measurement";
  if (/מדידות|אורך|נפח|משקל|שטח|קנה מידה/.test(n)) return "geometry_measurement";
  if (/נתונים|טבלה|גרף|סטטיסטיק|חקר נתונים/.test(n)) return "data_investigation";
  if (/דפוס|סדרה|משוואה|ביטוי|שוויון/.test(n)) return "patterns_early_algebra";
  return "numbers_operations";
}

/**
 * Split page text into candidate topic phrases (semicolon-delimited blocks typical in MoE tables).
 * @param {string} pageNorm
 * @returns {string[]}
 */
export function extractSemicolonPhrases(pageNorm) {
  const parts = pageNorm.split(";").map((p) => p.trim()).filter((p) => p.length >= 8);
  /** @type {string[]} */
  const out = [];
  for (const p of parts) {
    const cleaned = p.replace(/^\d+\s*\.\s*/, "").replace(/\s+\d+\s*$/, "").trim();
    if (cleaned.length >= 8 && /[\u0590-\u05FF]/.test(cleaned)) out.push(cleaned.slice(0, 220));
  }
  return [...new Set(out)];
}

/**
 * Longest contiguous substring of `label` found inside `pdfBlobNorm`, as ratio of label length.
 * @param {string} labelNorm
 * @param {string} pdfBlobNorm
 */
export function bestSubstringCoverageRatio(labelNorm, pdfBlobNorm) {
  const a = String(labelNorm || "");
  if (!a.length || !pdfBlobNorm.length) return 0;
  if (pdfBlobNorm.includes(a)) return 1;
  let best = 0;
  const maxLen = Math.min(90, a.length);
  for (let len = maxLen; len >= 10; len--) {
    for (let i = 0; i + len <= a.length; i++) {
      const sub = a.slice(i, i + len);
      if (pdfBlobNorm.includes(sub)) {
        best = Math.max(best, len / a.length);
        break;
      }
    }
  }
  return best;
}

/**
 * @param {string} catalogLabel
 * @param {string} pdfBlobNorm
 * @param {string[]} extraPhrases
 */
export function scoreCatalogAgainstPdf(catalogLabel, pdfBlobNorm, extraPhrases = []) {
  const a = normalizeHebrewPdfText(catalogLabel);
  if (!a.length) return { score: 0, reason: "empty" };
  if (pdfBlobNorm.includes(a)) return { score: 1, reason: "substring_full" };

  let phraseBoost = 0;
  for (const ph of extraPhrases) {
    const pn = normalizeHebrewPdfText(ph);
    if (pn.length >= 8) phraseBoost = Math.max(phraseBoost, bestSubstringCoverageRatio(pn, pdfBlobNorm));
  }

  const runRatio = Math.max(bestSubstringCoverageRatio(a, pdfBlobNorm), phraseBoost);

  const words = a.split(/\s+/).filter((w) => w.replace(/[^\u0590-\u05FF]/g, "").length >= 2);
  let hits = 0;
  for (const w of words) {
    const core = w.replace(/[^\u0590-\u05FF]/g, "");
    if (core.length >= 2 && pdfBlobNorm.includes(core)) hits++;
  }
  const tokenScore = words.length ? hits / words.length : 0;

  /** Token-only matches are weak (common words repeat across PDFs); require contiguous evidence for high scores. */
  const combined =
    runRatio > 0
      ? Math.min(1, 0.12 + runRatio * 0.88 + tokenScore * 0.1)
      : Math.min(0.52, tokenScore * 0.48);

  return {
    score: combined,
    reason: runRatio > 0 ? "substring_partial+tokens" : "tokens_only",
    runRatio,
    tokenScore,
  };
}

/**
 * @param {'exact_pdf_match'|'reasonable_grouping'|'broad_mapping'|'missing_pdf_support'|'needs_manual_review'} c
 */
export function classifyMatch(score, ambiguous) {
  if (ambiguous) return "needs_manual_review";
  if (score >= 0.78) return "exact_pdf_match";
  if (score >= 0.48) return "reasonable_grouping";
  if (score >= 0.22) return "broad_mapping";
  return "missing_pdf_support";
}
