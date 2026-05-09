/**
 * Download MoE kita1–kita6.pdf (same elementary math programme PDFs; geometry strand inside)
 * and extract a section catalog (per-page text + derived phrases).
 * Output: reports/curriculum-audit/geometry-pdf-section-catalog.{json,md}
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";
import { MATH_ELEMENTARY_GRADE_PDF_BASE } from "../../utils/curriculum-audit/official-curriculum-source-registry.js";
import {
  extractSemicolonPhrases,
  guessStrandCategory,
  normalizeHebrewPdfText,
} from "./lib/math-pdf-text.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const CACHE_DIR = join(OUT_DIR, ".cache", "moe-math-pdfs");

function pdfUrl(g) {
  return `${MATH_ELEMENTARY_GRADE_PDF_BASE}/kita${g}.pdf`;
}

async function fetchPdfBuffer(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const ab = await res.arrayBuffer();
  return new Uint8Array(ab);
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  /** @type {object[]} */
  const byGrade = [];
  let allOk = true;

  for (let grade = 1; grade <= 6; grade++) {
    const url = pdfUrl(grade);
    const cachePath = join(CACHE_DIR, `kita${grade}.pdf`);
    /** @type {boolean} */
    let downloadOk = false;
    /** @type {string} */
    let errorMessage = "";
    /** @type {Uint8Array | null} */
    let data = null;

    try {
      data = await fetchPdfBuffer(url);
      await writeFile(cachePath, data);
      downloadOk = true;
    } catch (e) {
      allOk = false;
      errorMessage = String(e?.message || e);
    }

    if (!data || !downloadOk) {
      byGrade.push({
        grade,
        pdfUrl: url,
        localCachePath: cachePath,
        downloadOk: false,
        error: errorMessage,
        pageCount: 0,
        outline: null,
        pages: [],
        sections: [],
        extractionNotes: ["Download failed — section extraction skipped."],
      });
      continue;
    }

    const parser = new PDFParse({ data });
    const info = await parser.getInfo();
    const textResult = await parser.getText();
    await parser.destroy();

    const outline = info.outline || null;
    const pages = (textResult.pages || []).map((p) => ({
      pageNumber: p.num ?? p.pageNumber,
      textRaw: p.text || "",
      textNormalized: normalizeHebrewPdfText(p.text || ""),
    }));

    const fullBlob = pages.map((p) => p.textNormalized).join("\n");

    /** @type {object[]} */
    const sections = [];
    const seen = new Set();

    for (const pg of pages) {
      const phrases = extractSemicolonPhrases(pg.textNormalized);
      for (const ph of phrases) {
        const key = `${pg.pageNumber}:${ph.slice(0, 120)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        sections.push({
          pageNumber: pg.pageNumber,
          sectionTitle: "",
          subsectionTitle: "",
          exactTopicWording: ph,
          strandCategory: guessStrandCategory(ph),
          notes:
            "נגזר מטקסט הדף באמצעות פיצול לפי נקודה-פסיק (מבנה נפוץ במסמכי מיידע); כותרות רשמיות עשויות להיות מפוצלות בחילוץ PDF.",
        });
      }
      if (phrases.length === 0 && pg.textNormalized.length > 40) {
        const head = pg.textNormalized.slice(0, 160);
        sections.push({
          pageNumber: pg.pageNumber,
          sectionTitle: "",
          subsectionTitle: "",
          exactTopicWording: head,
          strandCategory: guessStrandCategory(head),
          notes: "קטע ראשון מהדף — לא זוהו ביטויים מובחנים לפי פסיקים; דורש עיון ידני.",
        });
      }
    }

    byGrade.push({
      grade,
      pdfUrl: url,
      localCachePath: cachePath,
      downloadOk: true,
      pageCount: pages.length,
      outline,
      title: info.info?.Title || "",
      pages: pages.map((p) => ({
        pageNumber: p.pageNumber,
        textNormalizedLength: p.textNormalized.length,
        phraseCount: extractSemicolonPhrases(p.textNormalized).length,
      })),
      sections,
      fullTextNormalizedLength: fullBlob.length,
      extractionNotes: [
        outline && outline.length
          ? `PDF outline: ${outline.length} top-level entries (see meta.rawOutlineSample).`
          : "אין outline במסמך — הסתמכות על טקסט שורות ופיצול פסיקים.",
        "קטע גאומטריה ספציפי בתוך תוכנית המתמטיקה — לאמת חזותית מול PDF.",
      ],
      rawOutlineSample: outline
        ? JSON.parse(JSON.stringify(outline)).slice?.(0, 12) ?? outline
        : null,
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "geometry-pdf-section-catalog",
    meta: {
      pdfBase: MATH_ELEMENTARY_GRADE_PDF_BASE,
      subjectScope: "geometry_strand_within_math_programme_pdf",
      allGradesDownloaded: allOk,
      cacheDir: CACHE_DIR,
      extractionMethod:
        "pdf-parse getText per page; Hebrew spacing normalization; semicolon phrase split; strand keyword heuristic",
    },
    byGrade,
    summary: {
      grades: byGrade.length,
      totalSectionsExtracted: byGrade.reduce((a, g) => a + (g.sections?.length || 0), 0),
      pagesTotal: byGrade.reduce((a, g) => a + (g.pageCount || 0), 0),
    },
  };

  await writeFile(join(OUT_DIR, "geometry-pdf-section-catalog.json"), JSON.stringify(payload, null, 2), "utf8");

  const md = renderMarkdown(payload);
  await writeFile(join(OUT_DIR, "geometry-pdf-section-catalog.md"), md, "utf8");
  console.log(`Wrote ${join(OUT_DIR, "geometry-pdf-section-catalog.json")}`);
  console.log(`Wrote ${join(OUT_DIR, "geometry-pdf-section-catalog.md")}`);
  if (!allOk) {
    console.warn("Warning: one or more PDF downloads failed — see JSON byGrade entries.");
    process.exitCode = 1;
  }
}

function renderMarkdown(p) {
  const lines = [];
  lines.push("# Geometry PDF section catalog (MoE kita1–kita6 — math programme, geometry inside)");
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push(`- **All grades downloaded:** ${p.meta.allGradesDownloaded ? "yes" : "no"}`);
  lines.push(`- **Total pages:** ${p.summary.pagesTotal}`);
  lines.push(`- **Extracted section rows (phrase-derived):** ${p.summary.totalSectionsExtracted}`);
  lines.push("");
  for (const g of p.byGrade) {
    lines.push(`## Grade ${g.grade}`);
    lines.push(`- URL: ${g.pdfUrl}`);
    lines.push(`- Download: ${g.downloadOk ? "ok" : "FAIL"}`);
    if (g.error) lines.push(`- Error: \`${g.error}\``);
    lines.push(`- Pages: ${g.pageCount}`);
    lines.push(`- Section rows: ${g.sections?.length ?? 0}`);
    lines.push("");
  }
  return lines.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
