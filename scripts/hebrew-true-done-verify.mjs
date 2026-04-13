/**
 * Hebrew True Done — אצווה חוסמת חלקית (אין שרת Next כאן).
 * Run: npx tsx scripts/hebrew-true-done-verify.mjs
 *
 * 1) official_provenance על כל שורות המטריצה
 * 2) audit-hebrew-g1-g2-hard
 * 3) hebrew-subtopic-coverage-audit — zeroCoverage ריק
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function run(scriptRel) {
  /** נתיבים יחסיים ל־cwd כדי למנוע שבירה על רווחים בנתיב מוחלט (Windows). */
  const r = spawnSync(npx, ["--yes", "tsx", scriptRel], {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    console.error(r.stdout || "");
    console.error(r.stderr || "");
    process.exit(r.status ?? 1);
  }
  return r.stdout || "";
}

console.log("== 1) official provenance ==");
run("scripts/hebrew-official-provenance-validate.mjs");

console.log("== 1b) official row binding divergence ==");
run("scripts/hebrew-official-divergence-audit.mjs");

console.log("== 2) audit-hebrew-g1-g2-hard ==");
run("scripts/audit-hebrew-g1-g2-hard.mjs");

console.log("== 3) subtopic coverage (zeroCoverage must be empty) ==");
const r3 = spawnSync(npx, ["--yes", "tsx", "scripts/hebrew-subtopic-coverage-audit.mjs"], {
  cwd: ROOT,
  encoding: "utf8",
  shell: true,
});
if (r3.status !== 0) {
  console.error(r3.stdout, r3.stderr);
  process.exit(r3.status ?? 1);
}
const cov = JSON.parse(r3.stdout);
if (!Array.isArray(cov.zeroCoverage) || cov.zeroCoverage.length > 0) {
  console.error("hebrew-true-done-verify: zeroCoverage must be empty", cov.zeroCoverage);
  process.exit(1);
}

const matrix = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "hebrew-official-alignment-matrix.json"), "utf8")
);
const pending = matrix.filter(
  (row) => row.official_provenance?.mapping_status === "pending_hebrew_ministry_primary"
);
if (pending.length > 0) {
  console.error(
    "hebrew-true-done-verify: FAIL — pending_hebrew_ministry_primary rows:",
    pending.map((r) => `${r.grade}:${r.mapped_subtopic_id}`).join(", ")
  );
  process.exit(1);
}

const queuePath = path.join(ROOT, "data", "hebrew-g12-closure-queue.json");
const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
const openClosure = [...(queue.priority_1 || []), ...(queue.priority_2 || [])];
if (openClosure.length > 0) {
  console.error(
    "hebrew-true-done-verify: FAIL — g12 closure queue has open items:",
    openClosure.map((x) => x.mapped_subtopic_id).join(", ")
  );
  process.exit(1);
}

const g12 = matrix.filter((row) => row.grade === "g1" || row.grade === "g2");
const criticalBad = g12.filter(
  (row) =>
    row.coverage_status === "misleading_due_to_fallback" ||
    (row.coverage_status === "weak" && row.fallback_masking_risk === "high")
);
if (criticalBad.length > 0) {
  console.error(
    "hebrew-true-done-verify: FAIL — critical matrix rows (misleading or weak+high fallback):",
    criticalBad.map((r) => `${r.grade}:${r.mapped_subtopic_id}:${r.coverage_status}`).join("; ")
  );
  process.exit(1);
}

/** `internal_working_statement` מותר רק כשהמיפוי ממתין לסקירה (לא heuristic כ־binding סופי). */
const internalOnly = g12.filter(
  (row) =>
    row.official_provenance?.official_objective_source === "internal_working_statement" &&
    row.official_provenance?.mapping_status !== "file_bound_excerpt_pending"
);
if (internalOnly.length > 0) {
  console.error(
    "hebrew-true-done-verify: FAIL — internal_working_statement without pending curation:",
    internalOnly.map((r) => `${r.grade}:${r.mapped_subtopic_id}`).join(", ")
  );
  process.exit(1);
}

const badCoverage = g12.filter((row) =>
  ["weak", "misleading_due_to_fallback", "missing"].includes(row.coverage_status)
);
if (badCoverage.length > 0) {
  console.error(
    "hebrew-true-done-verify: FAIL — g1/g2 coverage_status must not be weak/misleading/missing:",
    badCoverage.map((r) => `${r.mapped_subtopic_id}:${r.coverage_status}`).join("; ")
  );
  process.exit(1);
}

const linkedG12 = g12.filter((row) => row.official_provenance?.mapping_status === "file_bound_excerpt_linked");
const missingAnchor = linkedG12.filter(
  (row) => !row.official_provenance?.official_section_anchor || !row.official_provenance?.official_doc_excerpt_ref
);
if (missingAnchor.length > 0) {
  console.error(
    "hebrew-true-done-verify: FAIL — linked rows missing anchor or excerpt ref:",
    missingAnchor.map((r) => r.mapped_subtopic_id).join(", ")
  );
  process.exit(1);
}

const missingJustification = linkedG12.filter(
  (row) =>
    row.official_provenance?.official_objective_source === "ministry_summary_verified" &&
    (!row.official_provenance?.summary_alignment_justification ||
      String(row.official_provenance.summary_alignment_justification).length < 16)
);
if (missingJustification.length > 0) {
  console.error(
    "hebrew-true-done-verify: FAIL — linked ministry_summary_verified without summary_alignment_justification:",
    missingJustification.map((r) => r.mapped_subtopic_id).join(", ")
  );
  process.exit(1);
}

console.log("== 4) ministry + closure + matrix + perfection gates: OK");

console.log("\nhebrew-true-done-verify: ALL CHECKS PASSED");
