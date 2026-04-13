/**
 * דוח סגירה g1/g2: שורות מטריצה עם weak / misleading / risk medium+.
 * Run: npx tsx scripts/hebrew-g12-closure-report.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const matrix = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "hebrew-official-alignment-matrix.json"), "utf8")
);
const queue = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "hebrew-g12-closure-queue.json"), "utf8")
);

const g12 = matrix.filter((r) => r.grade === "g1" || r.grade === "g2");
const hot = g12.filter(
  (r) =>
    r.coverage_status === "weak" ||
    r.coverage_status === "misleading_due_to_fallback" ||
    r.fallback_masking_risk === "high" ||
    r.fallback_masking_risk === "medium"
);

const out = {
  matrix_rows_g12: g12.length,
  hot_rows: hot.length,
  hot: hot.map((r) => ({
    grade: r.grade,
    subtopic: r.mapped_subtopic_id,
    topic: r.runtime_topic,
    coverage: r.coverage_status,
    risk: r.fallback_masking_risk,
    provenance: r.official_provenance?.mapping_status,
  })),
  closure_queue_priority_1: queue.priority_1?.length ?? 0,
  closure_queue_priority_2: queue.priority_2?.length ?? 0,
};
console.log(JSON.stringify(out, null, 2));
