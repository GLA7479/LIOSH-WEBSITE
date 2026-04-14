/**
 * מטריצת תרחישים S1–S12 — בדיקת Minimal Safe Scope על פלט buildDetailedParentReportFromBaseReport.
 */
import assert from "node:assert";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

async function importUtils(rel) {
  const m = await import(pathToFileURL(join(ROOT, rel)).href);
  return m.default && typeof m.default === "object" ? m.default : m;
}

const { PARENT_REPORT_SCENARIOS } = await importUtils("tests/fixtures/parent-report-pipeline.mjs");
const { buildDetailedParentReportFromBaseReport } = await importUtils("utils/detailed-parent-report.js");
const { scanDetailedReportForContractViolations } = await importUtils("utils/minimal-safe-scope-enforcement.js");

const SCENARIO_IDS = [
  ["S1", "all_sparse"],
  ["S2", "one_dominant_subject"],
  ["S3", "mixed_signals_cross_subjects"],
  ["S4", "recent_transition_recent_difficulty_increase"],
  ["S5", "high_risk_despite_strengths"],
  ["S6", "stable_excellence"],
  ["S7", "fragile_success"],
  ["S8", "knowledge_gap"],
  ["S9", "speed_only_weakness"],
  ["S10", "positive_trend_weak_independence"],
  ["S11", "phase7_cross_subject_sparse_mixed"],
  ["S12", "strong_executive_case"],
];

function runOne(id, key) {
  const builder = PARENT_REPORT_SCENARIOS[key];
  if (typeof builder !== "function") {
    return { id, key, status: "FAIL", error: "missing fixture builder" };
  }
  const base = builder();
  const detailed = buildDetailedParentReportFromBaseReport(base, { playerName: "_mss_", period: "week" });
  if (!detailed) {
    return { id, key, status: "FAIL", error: "null detailed report" };
  }
  const { fails } = scanDetailedReportForContractViolations(detailed, base);
  if (fails.length) {
    return { id, key, status: "FAIL", fails };
  }
  return { id, key, status: "PASS" };
}

const rows = [];
let anyFail = false;
for (const [id, key] of SCENARIO_IDS) {
  const r = runOne(id, key);
  rows.push(r);
  if (r.status !== "PASS") anyFail = true;
}

console.log("minimal-safe-scope scenarios S1–S12");
for (const r of rows) {
  if (r.status === "PASS") {
    console.log(`${r.id}\t${r.key}\tPASS`);
  } else {
    console.log(`${r.id}\t${r.key}\tFAIL\t${JSON.stringify(r.fails || r.error)}`);
  }
}

assert.ok(!anyFail, "one or more scenarios failed contract scan");
