/**
 * אימות credibility ל־Perfect Close — נכשל אם יש שורות לא מאושרות או איכות חלשה.
 * Run: npx tsx scripts/hebrew-official-credibility-verify.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function fail(msg) {
  console.error("hebrew-official-credibility-verify:", msg);
  process.exit(1);
}

function main() {
  const reviewPath = path.join(ROOT, "data", "hebrew-official-row-review.json");
  if (!fs.existsSync(reviewPath)) fail("missing data/hebrew-official-row-review.json");
  const doc = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
  if (!Array.isArray(doc.rows)) fail("review ledger missing rows[]");

  const matrix = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "hebrew-official-alignment-matrix.json"), "utf8"));
  const g12 = matrix.filter((row) => row.grade === "g1" || row.grade === "g2");
  if (g12.length !== doc.rows.length) {
    fail(`review row count ${doc.rows.length} != matrix g1/g2 rows ${g12.length}`);
  }

  const rationales = new Map();
  const matrixByKey = new Map(g12.map((row) => [`${row.grade}|${row.mapped_subtopic_id}|${row.runtime_topic}`, row]));

  for (const r of doc.rows) {
    if (!r.runtime_topic) fail(`row missing runtime_topic: ${r.grade}|${r.mapped_subtopic_id}`);
    const k = `${r.grade}|${r.mapped_subtopic_id}|${r.runtime_topic}`;
    if (r.review_status !== "approved") {
      fail(`row not approved: ${k} status=${r.review_status}`);
    }
    const required = [
      "support_type",
      "official_objective_source",
      "row_specific_rationale_he",
      "anchor_quality_class",
      "excerpt_quality_class",
      "runtime_coverage_adequacy_declared",
      "reviewer_id",
      "approved_at",
    ];
    for (const f of required) {
      if (r[f] === null || r[f] === undefined || r[f] === "") {
        fail(`row ${k} missing field: ${f}`);
      }
    }
    if (String(r.row_specific_rationale_he).length < 40) {
      fail(`row ${k} row_specific_rationale_he too short`);
    }
    if (r.anchor_quality_class === "weak_generic") {
      fail(`row ${k} anchor_quality_class weak_generic not allowed for perfect close`);
    }
    if (r.excerpt_quality_class === "weak_support") {
      fail(`row ${k} excerpt_quality_class weak_support not allowed for perfect close`);
    }
    if (r.official_objective_source === "ministry_excerpt_verbatim") {
      if (r.support_type !== "direct_verbatim" || r.excerpt_quality_class !== "direct") {
        fail(`row ${k} verbatim source requires direct_verbatim + excerpt_quality direct`);
      }
    }
    if (r.official_objective_source === "ministry_summary_verified") {
      if (r.support_type !== "summary_supported") {
        fail(`row ${k} summary source requires support_type summary_supported`);
      }
    }
    const norm = String(r.row_specific_rationale_he).replace(/\s+/g, " ").trim();
    rationales.set(norm, (rationales.get(norm) || 0) + 1);

    const row = matrixByKey.get(k);
    if (!row) fail(`missing matrix row ${k}`);
    const p = row.official_provenance;
    if (p.mapping_status !== "file_bound_excerpt_linked") {
      fail(`matrix row not linked: ${k}`);
    }
    const ref = r.approved_official_doc_excerpt_ref || r.proposed_official_doc_excerpt_ref;
    if (p.official_doc_excerpt_ref !== ref) fail(`matrix excerpt ref != review approved/proposed ${k}`);
    const cs = r.approved_char_start ?? r.proposed_char_start;
    const ce = r.approved_char_end ?? r.proposed_char_end;
    const anchor = `hebrew-1-6.pdf#chars=${cs}-${ce}`;
    if (p.official_section_anchor !== anchor) fail(`matrix anchor != review span ${k}`);
    if (r.official_objective_source === "ministry_summary_verified") {
      const j = p.summary_alignment_justification;
      if (typeof j !== "string" || j.length < 40) {
        fail(`matrix summary justification too short: ${k}`);
      }
      if (j !== r.row_specific_rationale_he) {
        fail(`matrix summary_alignment_justification must equal review row_specific_rationale_he ${k}`);
      }
    }
    if (r.runtime_coverage_adequacy_declared === true && row.coverage_status !== "adequate") {
      fail(`review declared adequate but matrix coverage is not adequate: ${k}`);
    }
    if (r.runtime_coverage_adequacy_declared === false && row.coverage_status === "adequate") {
      fail(`review did not declare adequate but matrix is adequate: ${k}`);
    }
  }

  for (const [text, count] of rationales) {
    if (count > 1) {
      fail(`duplicate row_specific_rationale_he used ${count} times (anti-boilerplate)`);
    }
  }

  console.log("hebrew-official-credibility-verify: OK", doc.rows.length, "approved rows");
}

main();
