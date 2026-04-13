/**
 * מקשר מטריצה לפי data/hebrew-official-row-review.json בלבד.
 * - approved: file_bound_excerpt_linked + provenance מלא לפי הסקירה
 * - needs_review / rejected: file_bound_excerpt_pending + internal_working_statement (ללא excerpt)
 * כותב data/hebrew-official-row-binding.json.
 *
 * Run אחרי: hebrew-official-extract-excerpts + hebrew-official-init-row-review
 * Run: npx tsx scripts/hebrew-official-bind-rows.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MATRIX_PATH = path.join(ROOT, "data", "hebrew-official-alignment-matrix.json");
const EXCERPTS_PATH = path.join(ROOT, "data", "hebrew-official-excerpts.json");
const VERSION_PATH = path.join(ROOT, "data", "hebrew-official-source-version.json");
const REVIEW_PATH = path.join(ROOT, "data", "hebrew-official-row-review.json");
const OUT_BINDING = path.join(ROOT, "data", "hebrew-official-row-binding.json");

const CANONICAL_URL = "https://meyda.education.gov.il/files/Curriculum/hebrew-1-6.pdf";

function confidenceFromReview(rev) {
  if (rev.support_type === "direct_verbatim" && rev.excerpt_quality_class === "direct" && rev.anchor_quality_class === "exact_span") {
    return "high";
  }
  return "medium";
}

function main() {
  const bundle = JSON.parse(fs.readFileSync(EXCERPTS_PATH, "utf8"));
  const byId = new Map(bundle.excerpts.map((e) => [e.id, e]));
  const ver = JSON.parse(fs.readFileSync(VERSION_PATH, "utf8"));
  const reviewDoc = JSON.parse(fs.readFileSync(REVIEW_PATH, "utf8"));
  const reviewByKey = new Map(
    reviewDoc.rows.map((r) => [`${r.grade}|${r.mapped_subtopic_id}|${r.runtime_topic}`, r])
  );
  const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, "utf8"));
  if (!Array.isArray(matrix)) throw new Error("matrix must be array");

  const bindingRows = [];

  for (const row of matrix) {
    if (row.grade !== "g1" && row.grade !== "g2") continue;
    const k = `${row.grade}|${row.mapped_subtopic_id}|${row.runtime_topic}`;
    const rev = reviewByKey.get(k);
    if (!rev) {
      console.error("hebrew-official-bind-rows: missing review row", k);
      process.exit(1);
    }

    if (rev.review_status === "approved") {
      const ref = rev.approved_official_doc_excerpt_ref || rev.proposed_official_doc_excerpt_ref;
      const cs = rev.approved_char_start ?? rev.proposed_char_start;
      const ce = rev.approved_char_end ?? rev.proposed_char_end;
      if (!ref || cs == null || ce == null) {
        console.error("hebrew-official-bind-rows: approved row missing excerpt span", k);
        process.exit(1);
      }
      const ex = byId.get(ref);
      if (!ex || ex.char_start !== cs || ex.char_end !== ce) {
        console.error("hebrew-official-bind-rows: approved excerpt mismatch registry", k, ref);
        process.exit(1);
      }
      const anchor = `hebrew-1-6.pdf#chars=${cs}-${ce}`;
      const objSrc = rev.official_objective_source;
      if (objSrc !== "ministry_excerpt_verbatim" && objSrc !== "ministry_summary_verified") {
        console.error("hebrew-official-bind-rows: bad official_objective_source", k);
        process.exit(1);
      }
      const rationale = rev.row_specific_rationale_he;
      if (typeof rationale !== "string" || rationale.length < 40) {
        console.error("hebrew-official-bind-rows: approved needs row_specific_rationale_he (>=40)", k);
        process.exit(1);
      }

      row.official_provenance = {
        schema_version: 1,
        mapping_status: "file_bound_excerpt_linked",
        source_language_expected: "he",
        source_subject_expected: "lashon_hebrew",
        source_files_in_repo: ["hebrew-1-6.pdf"],
        repo_txt_catalog_ref: "data/hebrew-ministry-source-catalog.json",
        official_doc_id: CANONICAL_URL,
        official_section_anchor: anchor,
        official_objective_source: objSrc,
        official_doc_excerpt_ref: ref,
        summary_alignment_justification: objSrc === "ministry_summary_verified" ? rationale : null,
        mapped_at: rev.approved_at || row.official_provenance?.mapped_at || new Date().toISOString().slice(0, 10),
        confidence: confidenceFromReview(rev),
        reviewer_notes: rev.reviewer_id ? `reviewer:${rev.reviewer_id}` : null,
      };

      row.coverage_status = rev.runtime_coverage_adequacy_declared === true ? "adequate" : "partial";
      if (row.fallback_masking_risk === "high") row.fallback_masking_risk = "medium";

      bindingRows.push({
        grade: row.grade,
        mapped_subtopic_id: row.mapped_subtopic_id,
        runtime_topic: row.runtime_topic,
        binding_state: "linked",
        official_section_anchor: anchor,
        official_doc_excerpt_ref: ref,
        official_doc_id: CANONICAL_URL,
        expected_pdf_sha256: ver.expected_pdf_sha256,
        confidence: row.official_provenance.confidence,
      });
    } else {
      row.official_provenance = {
        schema_version: 1,
        mapping_status: "file_bound_excerpt_pending",
        source_language_expected: "he",
        source_subject_expected: "lashon_hebrew",
        source_files_in_repo: ["hebrew-1-6.pdf"],
        repo_txt_catalog_ref: "data/hebrew-ministry-source-catalog.json",
        official_doc_id: CANONICAL_URL,
        official_section_anchor: null,
        official_objective_source: "internal_working_statement",
        official_doc_excerpt_ref: null,
        summary_alignment_justification: null,
        mapped_at: row.official_provenance?.mapped_at || new Date().toISOString().slice(0, 10),
        confidence: "low",
        reviewer_notes:
          rev.review_status === "rejected"
            ? "row_review: rejected — awaiting curator decision"
            : "row_review: needs_review — heuristic excerpt is not binding",
      };
      row.coverage_status = "partial";

      bindingRows.push({
        grade: row.grade,
        mapped_subtopic_id: row.mapped_subtopic_id,
        runtime_topic: row.runtime_topic,
        binding_state: "pending_curation",
        official_section_anchor: null,
        official_doc_excerpt_ref: null,
        official_doc_id: CANONICAL_URL,
        expected_pdf_sha256: ver.expected_pdf_sha256,
        confidence: "low",
      });
    }
  }

  fs.writeFileSync(MATRIX_PATH, JSON.stringify(matrix, null, 2) + "\n", "utf8");
  const out = {
    binding_version: 2,
    generated_at: new Date().toISOString().slice(0, 10),
    excerpt_registry: "data/hebrew-official-excerpts.json",
    source_version: "data/hebrew-official-source-version.json",
    row_review: "data/hebrew-official-row-review.json",
    rows: bindingRows,
  };
  fs.writeFileSync(OUT_BINDING, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("hebrew-official-bind-rows: wrote matrix + binding, rows=", bindingRows.length);
}

main();
