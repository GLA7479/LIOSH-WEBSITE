/**
 * בודק התאמה בין המטריצה ל־data/hebrew-official-row-binding.json ולרישום excerpts.
 * שורות pending_curation: אין excerpt — רק מצב מטריצה מול binding_state.
 * Run: npx tsx scripts/hebrew-official-divergence-audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function fail(msg) {
  console.error("hebrew-official-divergence-audit:", msg);
  process.exit(1);
}

function main() {
  const matrix = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "hebrew-official-alignment-matrix.json"), "utf8"));
  const binding = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "hebrew-official-row-binding.json"), "utf8"));
  const excerpts = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "hebrew-official-excerpts.json"), "utf8"));
  const byId = new Map(excerpts.excerpts.map((e) => [e.id, e]));

  const bindByKey = new Map(
    binding.rows.map((r) => [`${r.grade}|${r.mapped_subtopic_id}|${r.runtime_topic}`, r])
  );

  for (const row of matrix) {
    if (row.grade !== "g1" && row.grade !== "g2") continue;
    const k = `${row.grade}|${row.mapped_subtopic_id}|${row.runtime_topic}`;
    const b = bindByKey.get(k);
    if (!b) fail(`missing binding row for ${k}`);
    const p = row.official_provenance;

    if (b.binding_state === "linked") {
      if (p.official_section_anchor !== b.official_section_anchor) fail(`anchor mismatch ${k}`);
      if (p.official_doc_excerpt_ref !== b.official_doc_excerpt_ref) fail(`excerpt ref mismatch ${k}`);
      if (p.official_doc_id !== b.official_doc_id) fail(`doc id mismatch ${k}`);
      const ex = byId.get(p.official_doc_excerpt_ref);
      if (!ex) fail(`excerpt id not in registry ${p.official_doc_excerpt_ref}`);
      const m = String(p.official_section_anchor).match(/chars=(\d+)-(\d+)/);
      if (!m) fail(`bad anchor format ${k}`);
      if (ex.char_start !== Number(m[1]) || ex.char_end !== Number(m[2])) fail(`char span mismatch ${k}`);
    } else if (b.binding_state === "pending_curation") {
      if (p.mapping_status !== "file_bound_excerpt_pending") fail(`expected excerpt_pending matrix ${k}`);
      if (p.official_section_anchor != null || p.official_doc_excerpt_ref != null) {
        fail(`pending row must have null anchor/excerpt ${k}`);
      }
    } else {
      fail(`unknown binding_state ${b.binding_state}`);
    }
  }

  if (binding.rows.length !== matrix.filter((r) => r.grade === "g1" || r.grade === "g2").length) {
    fail("binding row count != matrix g1/g2 length");
  }

  console.log("hebrew-official-divergence-audit: OK", binding.rows.length, "rows");
}

main();
