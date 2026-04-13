/**
 * Validates official_provenance on every row of the alignment matrix.
 * Run: npx tsx scripts/hebrew-official-provenance-validate.mjs
 */
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

for (const p of [matrixPath, catalogPath, schemaPath]) {
  if (!fs.existsSync(p)) fail(`missing file: ${path.relative(ROOT, p)}`);
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
  i++;
}
console.log("hebrew-official-provenance-validate: OK", rows.length, "rows");
