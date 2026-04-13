/**
 * Validates official_provenance on every row of the alignment matrix + Perfection rules.
 * Run: npx tsx scripts/hebrew-official-provenance-validate.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const ALLOWED_STATUS = new Set([
  "pending_hebrew_ministry_primary",
  "file_bound_excerpt_pending",
  "file_bound_excerpt_linked",
  "superseded_internal_only",
]);
const ALLOWED_CONF = new Set([
  "none_until_hebrew_primary_linked",
  "low",
  "medium",
  "high",
]);
const ALLOWED_OBJ_SRC = new Set([
  "internal_working_statement",
  "ministry_excerpt_verbatim",
  "ministry_summary_verified",
]);

function fail(msg) {
  console.error("hebrew-official-provenance-validate:", msg);
  process.exit(1);
}

const matrixPath = path.join(ROOT, "data", "hebrew-official-alignment-matrix.json");
const catalogPath = path.join(ROOT, "data", "hebrew-ministry-source-catalog.json");
const schemaPath = path.join(ROOT, "data", "hebrew-official-provenance.schema.json");
const excerptsPath = path.join(ROOT, "data", "hebrew-official-excerpts.json");
const versionPath = path.join(ROOT, "data", "hebrew-official-source-version.json");

for (const p of [matrixPath, catalogPath, schemaPath, excerptsPath, versionPath]) {
  if (!fs.existsSync(p)) fail(`missing file: ${path.relative(ROOT, p)}`);
}

const excerptBundle = JSON.parse(fs.readFileSync(excerptsPath, "utf8"));
const excerptIds = new Set(excerptBundle.excerpts.map((e) => e.id));
const excerptById = new Map(excerptBundle.excerpts.map((e) => [e.id, e]));

const ver = JSON.parse(fs.readFileSync(versionPath, "utf8"));
const pdfPath = path.join(ROOT, "hebrew-1-6.pdf");
if (!fs.existsSync(pdfPath)) fail("missing hebrew-1-6.pdf");
const diskSha = crypto.createHash("sha256").update(fs.readFileSync(pdfPath)).digest("hex");
if (diskSha !== ver.expected_pdf_sha256) {
  fail(`PDF sha256 mismatch: disk=${diskSha} expected=${ver.expected_pdf_sha256}`);
}
if (excerptBundle.pdf_sha256 && excerptBundle.pdf_sha256 !== ver.expected_pdf_sha256) {
  fail("excerpts bundle pdf_sha256 != source-version expected_pdf_sha256");
}

const rows = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
let i = 0;
for (const row of rows) {
  const p = row.official_provenance;
  if (!p || typeof p !== "object") fail(`row ${i} missing official_provenance (${row.mapped_subtopic_id})`);
  if (p.schema_version !== 1) fail(`row ${i} schema_version`);
  if (!ALLOWED_STATUS.has(p.mapping_status)) fail(`row ${i} bad mapping_status`);
  if (!ALLOWED_CONF.has(p.confidence)) fail(`row ${i} bad confidence`);
  if (!ALLOWED_OBJ_SRC.has(p.official_objective_source)) fail(`row ${i} bad official_objective_source`);
  if (p.repo_txt_catalog_ref !== "data/hebrew-ministry-source-catalog.json") {
    fail(`row ${i} bad repo_txt_catalog_ref`);
  }
  if (!Array.isArray(p.source_files_in_repo)) fail(`row ${i} source_files_in_repo must be array`);
  for (const rel of p.source_files_in_repo) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) fail(`row ${i} missing source file: ${rel}`);
  }

  if (p.mapping_status === "file_bound_excerpt_pending") {
    if (!p.official_doc_id || typeof p.official_doc_id !== "string" || p.official_doc_id.length < 8) {
      fail(`row ${i} official_doc_id required when excerpt_pending`);
    }
    if (!p.source_language_expected || !p.source_subject_expected) {
      fail(`row ${i} source_language_expected and source_subject_expected required when excerpt_pending`);
    }
    if (p.official_objective_source !== "internal_working_statement") {
      fail(`row ${i} excerpt_pending requires internal_working_statement (${row.mapped_subtopic_id})`);
    }
    if (p.official_section_anchor != null || p.official_doc_excerpt_ref != null) {
      fail(`row ${i} excerpt_pending must have null anchor and excerpt ref (${row.mapped_subtopic_id})`);
    }
    if (p.summary_alignment_justification != null) {
      fail(`row ${i} excerpt_pending must have null summary_alignment_justification`);
    }
  } else if (p.mapping_status === "file_bound_excerpt_linked") {
    if (!p.official_doc_id || typeof p.official_doc_id !== "string" || p.official_doc_id.length < 8) {
      fail(`row ${i} official_doc_id required when file_bound`);
    }
    if (!p.source_language_expected || !p.source_subject_expected) {
      fail(`row ${i} source_language_expected and source_subject_expected required when file_bound`);
    }
    if (!p.official_section_anchor || typeof p.official_section_anchor !== "string" || p.official_section_anchor.length < 4) {
      fail(`row ${i} official_section_anchor required when file_bound (${row.mapped_subtopic_id})`);
    }
    if (!p.official_doc_excerpt_ref || typeof p.official_doc_excerpt_ref !== "string") {
      fail(`row ${i} official_doc_excerpt_ref required when file_bound (${row.mapped_subtopic_id})`);
    }
    if (!/^hebrew-1-6\.pdf#chars=\d+-\d+$/.test(p.official_section_anchor)) {
      fail(`row ${i} official_section_anchor format (${row.mapped_subtopic_id})`);
    }
    if (!excerptIds.has(p.official_doc_excerpt_ref)) {
      fail(`row ${i} excerpt ref not in registry: ${p.official_doc_excerpt_ref}`);
    }
    const ex = excerptById.get(p.official_doc_excerpt_ref);
    const m = p.official_section_anchor.match(/chars=(\d+)-(\d+)/);
    if (!m || Number(m[1]) !== ex.char_start || Number(m[2]) !== ex.char_end) {
      fail(`row ${i} anchor char span != excerpt registry (${row.mapped_subtopic_id})`);
    }
    if (p.official_objective_source === "ministry_summary_verified") {
      const j = p.summary_alignment_justification;
      if (typeof j !== "string" || j.length < 16) {
        fail(`row ${i} summary_alignment_justification required for ministry_summary_verified`);
      }
    }
  }

  i++;
}
console.log("hebrew-official-provenance-validate: OK", rows.length, "rows");
