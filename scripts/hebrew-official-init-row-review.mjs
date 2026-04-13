/**
 * יוצר/מאתחל data/hebrew-official-row-review.json לפי המטריצה + רישום excerpts (הצעה בלבד).
 * כל שורה מתחילה ב־review_status: needs_review.
 * Run: npx tsx scripts/hebrew-official-init-row-review.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MATRIX_PATH = path.join(ROOT, "data", "hebrew-official-alignment-matrix.json");
const EXCERPTS_PATH = path.join(ROOT, "data", "hebrew-official-excerpts.json");
const OUT = path.join(ROOT, "data", "hebrew-official-row-review.json");

function excerptId(row) {
  return `heb16.${row.grade}.${row.mapped_subtopic_id}.${row.runtime_topic}`;
}

function main() {
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, "utf8"));
  const bundle = JSON.parse(fs.readFileSync(EXCERPTS_PATH, "utf8"));
  const byId = new Map(bundle.excerpts.map((e) => [e.id, e]));

  const rows = [];
  for (const row of matrix) {
    if (row.grade !== "g1" && row.grade !== "g2") continue;
    const id = excerptId(row);
    const ex = byId.get(id);
    if (!ex) {
      console.error("init-row-review: missing excerpt", id);
      process.exit(1);
    }
    rows.push({
      grade: row.grade,
      mapped_subtopic_id: row.mapped_subtopic_id,
      runtime_topic: row.runtime_topic,
      review_status: "needs_review",
      proposed_official_doc_excerpt_ref: id,
      proposed_char_start: ex.char_start,
      proposed_char_end: ex.char_end,
      approved_official_doc_excerpt_ref: null,
      approved_char_start: null,
      approved_char_end: null,
      support_type: null,
      official_objective_source: null,
      row_specific_rationale_he: null,
      anchor_quality_class: null,
      excerpt_quality_class: null,
      runtime_coverage_adequacy_declared: null,
      reviewer_id: null,
      approved_at: null,
    });
  }

  const out = {
    review_ledger_version: 1,
    description_he:
      "יומן אישור שורה־שורה: רק שורות approved מקבלות binding סופי במטריצה. הצעות heuristic מגיעות מ־proposed_* — חובה סקירה ידנית לפני perfect close.",
    rows,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("hebrew-official-init-row-review: wrote", rows.length, "rows to", path.relative(ROOT, OUT));
}

main();
