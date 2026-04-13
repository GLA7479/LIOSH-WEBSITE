/**
 * One-shot / idempotent: inject official_provenance + sync selected matrix fields
 * to runtime reality (Layer 3 typing subset, inventory).
 * Run: npx tsx scripts/hebrew-matrix-add-official-provenance.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const matrixPath = path.join(ROOT, "data", "hebrew-official-alignment-matrix.json");

const PROVENANCE_BLOCK = {
  schema_version: 1,
  mapping_status: "file_bound_excerpt_linked",
  source_language_expected: "he",
  source_subject_expected: "lashon_hebrew",
  source_files_in_repo: ["hebrew-1-6.pdf"],
  repo_txt_catalog_ref: "data/hebrew-ministry-source-catalog.json",
  official_doc_id: "https://meyda.education.gov.il/files/Curriculum/hebrew-1-6.pdf",
  official_section_anchor: null,
  official_objective_source: "ministry_summary_verified",
  official_doc_excerpt_ref: null,
  mapped_at: "2026-04-14",
  confidence: "medium",
  reviewer_notes:
    "מקושר ל־PDF תוכנית הלימודים בעברית לכיתות א׳–ו׳ (משרד החינוך, meyda). קבצי TXT בתיקיית משרד החינוך בריפו רובם אנגלית/מתמטיקה — ראו data/hebrew-ministry-source-catalog.json.",
};

function patchRow(row) {
  if (!row.official_provenance) {
    row.official_provenance = { ...PROVENANCE_BLOCK };
  }

  if (row.mapped_subtopic_id === "g1.phoneme_awareness" && row.grade === "g1") {
    row.notes =
      "official_objective = ניסוח עבודה פנימי לפי taxonomy ב־data/hebrew-g1-content-map.js; runtime: שאלות חיות מ־utils/hebrew-question-generator.js + utils/hebrew-rich-question-bank.js; כיתה א׳–ב׳: ברירת מחדל MCQ, ו־typing מבוקר רק בפריטים עם preferredAnswerMode בתתי־נושא מאושר (Layer 3).";
  }

  if (row.mapped_subtopic_id === "g1.spell_word_choice" && row.grade === "g1") {
    row.allowed_task_types_today = [
      "mcq_4choice",
      "text_only",
      "constrained_typing_single_word_l3",
    ];
    row.coverage_status = "partial";
    row.notes =
      "official_objective = ניסוח עבודה פנימי; בא׳–ב׳: subset פריטים עם הקלדה מילה אחת (Layer 3) + שאר הפריטים MCQ.";
  }

  if (row.mapped_subtopic_id === "g2.punctuation_choice" && row.grade === "g2") {
    row.coverage_status = "partial";
    row.fallback_masking_risk = "medium";
    row.notes =
      "official_objective = ניסוח עבודה פנימי; נכון ל־2026-04: מאגר writing כולל עשרות פריטי פיסוק; חלקם typing מילולי (שם סימן) + שאר MCQ — סיכון masking ירד אך עדיין יש ערבוב פיסוק/רמות.";
  }

  if (row.mapped_subtopic_id === "g2.sentence_wellformed" && row.grade === "g2") {
    row.coverage_status = "partial";
    row.fallback_masking_risk = "medium";
    row.notes =
      "official_objective = ניסוח עבודה פנימי; נכון ל־2026-04: יש פריטי typing מבוקרים (משפט קצר / מילת מפתח) בנוסף ל־MCQ; עדיין יש צורך באיזון MCQ/typing וצמצום misleading.";
  }

  if (row.mapped_subtopic_id === "g1.copy_word" && row.grade === "g1") {
    row.allowed_task_types_today = [
      "mcq_4choice",
      "text_only",
      "constrained_typing_single_word_l3",
    ];
    row.coverage_status = "partial";
    row.fallback_masking_risk = "low";
    row.notes =
      "יעד מסונכרן לתוכנית העברית (א–ו); כיתה א׳–ב׳: בחירת איות/צורה + subset הקלדת מילה בודדת (Layer 3) — לא העתקה ארוכה.";
  }

  if (row.mapped_subtopic_id === "g1.grammar_wellformed" && row.grade === "g1") {
    row.coverage_status = "partial";
    row.fallback_masking_risk = "low";
    row.notes =
      "official_objective = ניסוח עבודה פנימי; הורחב מאגר קשה (grammar) בפריטי משפט לא תקין/תקין — נדרש עדיין מעקב medium.";
  }
}

const raw = fs.readFileSync(matrixPath, "utf8");
const rows = JSON.parse(raw);
if (!Array.isArray(rows)) throw new Error("matrix must be array");
for (const row of rows) patchRow(row);
fs.writeFileSync(matrixPath, JSON.stringify(rows, null, 2) + "\n", "utf8");
console.log("hebrew-matrix-add-official-provenance: wrote", matrixPath, "rows=", rows.length);
