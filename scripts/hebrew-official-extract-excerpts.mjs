/**
 * בונה את data/hebrew-official-excerpts.json מתוך hebrew-1-6.pdf + המטריצה.
 * חיתוך טקסט לפי הופעת מילה עברית מהיעד בשורה (או fallback לפי מילות מפתח כלליות).
 * Run: npx tsx scripts/hebrew-official-extract-excerpts.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PDF_PATH = path.join(ROOT, "hebrew-1-6.pdf");
const MATRIX_PATH = path.join(ROOT, "data", "hebrew-official-alignment-matrix.json");
const OUT_EXCERPTS = path.join(ROOT, "data", "hebrew-official-excerpts.json");
const OUT_VERSION = path.join(ROOT, "data", "hebrew-official-source-version.json");

const CANONICAL_URL = "https://meyda.education.gov.il/files/Curriculum/hebrew-1-6.pdf";

function hebrewTokens(s) {
  const m = String(s || "").match(/[\u0590-\u05FF]{2,}/g);
  if (!m) return [];
  return [...new Set(m)].sort((a, b) => b.length - a.length);
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error("hebrew-official-extract-excerpts: missing", PDF_PATH);
    process.exit(1);
  }
  const pdfBuf = fs.readFileSync(PDF_PATH);
  const pdfSha256 = crypto.createHash("sha256").update(pdfBuf).digest("hex");
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: pdfBuf });
  const textResult = await parser.getText();
  await parser.destroy();
  const full = String(textResult.text || "").replace(/\r\n/g, "\n");
  const numPages = textResult.total ?? textResult.pages?.length ?? null;
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, "utf8"));
  if (!Array.isArray(matrix)) throw new Error("matrix must be array");

  const fallbackNeedles = ["עברית", "יסודי", "כיתות", "הבנה", "הבעה", "לשון"];

  const excerpts = [];
  for (const row of matrix) {
    const words = hebrewTokens(row.official_objective);
    let idx = -1;
    let matchToken = null;
    for (const w of words) {
      const i = full.indexOf(w);
      if (i >= 0) {
        idx = i;
        matchToken = w;
        break;
      }
    }
    if (idx < 0) {
      for (const n of fallbackNeedles) {
        const i = full.indexOf(n);
        if (i >= 0) {
          idx = i;
          matchToken = n;
          break;
        }
      }
    }
    if (idx < 0) idx = Math.min(500, Math.floor(full.length / 3));

    const start = Math.max(0, idx - 100);
    const end = Math.min(full.length, idx + 280);
    let excerpt_text_he = full.slice(start, end).replace(/\s+/g, " ").trim();
    if (excerpt_text_he.length < 40) {
      excerpt_text_he = full.slice(0, Math.min(400, full.length)).replace(/\s+/g, " ").trim();
    }

    /** כולל runtime_topic כדי למנוע התנגשות כשאותו mapped_subtopic_id מופיע בשתי שורות (למשל comprehension מול vocabulary). */
    const id = `heb16.${row.grade}.${row.mapped_subtopic_id}.${row.runtime_topic}`;
    excerpts.push({
      id,
      grade: row.grade,
      mapped_subtopic_id: row.mapped_subtopic_id,
      runtime_topic: row.runtime_topic,
      char_start: start,
      char_end: end,
      match_token: matchToken,
      excerpt_text_he,
      excerpt_text_sha256: crypto.createHash("sha256").update(excerpt_text_he, "utf8").digest("hex"),
      extraction_tier: "heuristic_candidate",
    });
  }

  const bundle = {
    excerpts_version: 1,
    source_file: "hebrew-1-6.pdf",
    canonical_download_url: CANONICAL_URL,
    pdf_sha256: pdfSha256,
    pdf_num_pages: numPages,
    generated_at: new Date().toISOString().slice(0, 10),
    excerpts,
  };
  fs.writeFileSync(OUT_EXCERPTS, JSON.stringify(bundle, null, 2) + "\n", "utf8");

  const ver = {
    version: 1,
    primary_pdf_repo_path: "hebrew-1-6.pdf",
    canonical_download_url: CANONICAL_URL,
    expected_pdf_sha256: pdfSha256,
    recorded_at: bundle.generated_at,
    notes_he:
      "SHA256 מחושב על הקובץ המקומי; אם ה־PDF במקור עודכן בשרת — יש לעדכן expected_pdf_sha256 אחרי אימות מחדש.",
  };
  fs.writeFileSync(OUT_VERSION, JSON.stringify(ver, null, 2) + "\n", "utf8");

  console.log("hebrew-official-extract-excerpts: wrote", excerpts.length, "excerpts,", OUT_EXCERPTS);
  console.log("hebrew-official-extract-excerpts: wrote", OUT_VERSION);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
