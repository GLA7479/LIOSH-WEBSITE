/**
 * קישור מסמך לשון/עברית רשמי (כיתות א–ו) + סנכרון סטטוסים (legacy).
 * אם כבר יש row-level binding (אחרי Perfection), לא דורסים anchor/excerpt/justification.
 * ל־Perfect Close מלא: הרץ `hebrew-official-extract-excerpts` ואז `hebrew-official-bind-rows`.
 * Run: npx tsx scripts/hebrew-matrix-bind-ministry-primary-and-sync.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const matrixPath = path.join(ROOT, "data", "hebrew-official-alignment-matrix.json");

const MINISTRY_PRIMARY_PDF = "hebrew-1-6.pdf";
const MINISTRY_CANONICAL_URL = "https://meyda.education.gov.il/files/Curriculum/hebrew-1-6.pdf";

const LINKED_PROVENANCE = {
  schema_version: 1,
  mapping_status: "file_bound_excerpt_linked",
  source_language_expected: "he",
  source_subject_expected: "lashon_hebrew",
  source_files_in_repo: [MINISTRY_PRIMARY_PDF],
  repo_txt_catalog_ref: "data/hebrew-ministry-source-catalog.json",
  official_doc_id: MINISTRY_CANONICAL_URL,
  official_section_anchor: null,
  official_objective_source: "ministry_summary_verified",
  official_doc_excerpt_ref: null,
  mapped_at: "2026-04-14",
  confidence: "medium",
  reviewer_notes:
    "מקושר ל־PDF תוכנית הלימודים בעברית לכיתות א׳–ו׳ (משרד החינוך, מאגר meyda). ניסוח היעד בשורה הוא סיכום פדגוגי מסונכרן — לא ציטוט עמוד־עמוד.",
};

/** מפתח: `${mapped_subtopic_id}|${grade}` */
const COVERAGE_SYNC = {
  "g1.grammar_cloze_deixis|g1": {
    coverage_status: "partial",
    fallback_masking_risk: "medium",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); ב־runtime יש פריטי השלמה הקשרית בקל/בינוני/קשה — בריכה מספקת; עדיין MCQ בלבד בא׳–ב׳.",
  },
  "g1.grammar_word_order|g1": {
    coverage_status: "partial",
    fallback_masking_risk: "medium",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); ב־runtime יש סדר מילים בקל ובינוני ובקשה — בריכה מספקת.",
  },
  "g1.grammar_odd_category|g1": {
    coverage_status: "partial",
    fallback_masking_risk: "medium",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); ב־runtime יש ׳לא שייך לקבוצה׳ בקל ובינוני ובקשה.",
  },
  "g1.grammar_connectors_time|g1": {
    coverage_status: "partial",
    fallback_masking_risk: "medium",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); ב־runtime יש זמן/מחברים בקל ובינוני ובקשה כולל רמת medium מורחבת.",
  },
  "g1.simple_instruction|g1": {
    coverage_status: "partial",
    fallback_masking_risk: "low",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); הוראות קצרות והתאמה לטקסט — כיסוי בקל ובינוני עם תת־נושא מפורש.",
  },
  "g1.word_picture|g1": {
    coverage_status: "partial",
    fallback_masking_risk: "low",
    notes:
      "שם התת־נושא היסטורית מרמז על תמונה; בפועל משימות ״תמונה מילולית״ בטקסט (MCQ) — מסומן במטריצה כחוזה מוצר בא׳–ב׳ ללא אודיו.",
  },
  "g1.phrase_appropriateness|g1": {
    coverage_status: "partial",
    fallback_masking_risk: "low",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); דיבור בא׳–ב׳ הוא בחירת ניסוח מצבית (MCQ) עם authenticity_pattern במקומות מובילים — לא הקלטה.",
  },
  "g1.copy_word|g1": {
    coverage_status: "partial",
    fallback_masking_risk: "low",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); כיתה א׳–ב׳: בנוסף לבחירת איות/צורה, יש subset הקלדת מילה בודדת (Layer 3, תת־נושא מאושר) — לא העתקה ארוכה.",
    allowed_task_types_today: ["mcq_4choice", "text_only", "constrained_typing_single_word_l3"],
  },
  "g2.describe_prompt_choice|g2": {
    coverage_status: "partial",
    fallback_masking_risk: "medium",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); תיאור מונחה במשפט קצר (MCQ) בקל ובינוני ובקשה — authenticity_pattern במקטעים מובילים.",
  },
  "g2.situation_register|g2": {
    coverage_status: "partial",
    fallback_masking_risk: "low",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); רגיסטר ונימוס בבחירת ניסוח (MCQ) עם authenticity_pattern — עקבי עם מגבלות א׳–ב׳.",
  },
  "g2.short_paragraph_choice|g2": {
    coverage_status: "partial",
    fallback_masking_risk: "medium",
    notes:
      "יעד מסונכרן לתוכנית העברית (א–ו); מבנה פסקה קצרה (2–3 משפטים) כבחירה מובנית — לא כתיבה חופשית ארוכה (מחוץ לטווח מוצר).",
  },
};

const rows = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
if (!Array.isArray(rows)) throw new Error("matrix must be array");

for (const row of rows) {
  const prev = row.official_provenance && typeof row.official_provenance === "object" ? row.official_provenance : {};
  const hasRowBinding =
    prev.official_section_anchor && prev.official_doc_excerpt_ref && prev.summary_alignment_justification;

  row.official_provenance = { ...LINKED_PROVENANCE, ...prev };
  row.official_provenance.source_files_in_repo = [...LINKED_PROVENANCE.source_files_in_repo];
  row.official_provenance.mapping_status = LINKED_PROVENANCE.mapping_status;
  row.official_provenance.official_doc_id = LINKED_PROVENANCE.official_doc_id;
  if (!hasRowBinding) {
    row.official_provenance.official_objective_source = LINKED_PROVENANCE.official_objective_source;
    row.official_provenance.confidence = LINKED_PROVENANCE.confidence;
    row.official_provenance.reviewer_notes = LINKED_PROVENANCE.reviewer_notes;
  }

  const k = `${row.mapped_subtopic_id}|${row.grade}`;
  const patch = COVERAGE_SYNC[k];
  if (patch && row.coverage_status !== "adequate") {
    Object.assign(row, patch);
  }
}

fs.writeFileSync(matrixPath, JSON.stringify(rows, null, 2) + "\n", "utf8");
console.log("hebrew-matrix-bind-ministry-primary-and-sync: wrote", rows.length, "rows");
