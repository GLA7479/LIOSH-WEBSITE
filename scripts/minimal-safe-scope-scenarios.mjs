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

const OVERSTATED_HE_REGEX = /בטוח|בוודאות|חד[- ]?משמעית|יציב לחלוטין|מוכח/giu;

function assertTopicContractsChain(detailed, scenarioId) {
  const profiles = Array.isArray(detailed?.subjectProfiles) ? detailed.subjectProfiles : [];
  for (const sp of profiles) {
    const trs = Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : [];
    for (const tr of trs) {
      const c = tr?.contractsV1;
      assert.ok(c && typeof c === "object", `${scenarioId}: missing contractsV1 on topic recommendation`);
      assert.ok(c.evidence && typeof c.evidence === "object", `${scenarioId}: missing contractsV1.evidence`);
      assert.ok(c.decision && typeof c.decision === "object", `${scenarioId}: missing contractsV1.decision`);
      assert.ok(c.readiness && typeof c.readiness === "object", `${scenarioId}: missing contractsV1.readiness`);
      assert.ok(c.confidence && typeof c.confidence === "object", `${scenarioId}: missing contractsV1.confidence`);
      assert.ok(c.recommendation && typeof c.recommendation === "object", `${scenarioId}: missing contractsV1.recommendation`);
      assert.ok(c.narrative && typeof c.narrative === "object", `${scenarioId}: missing contractsV1.narrative`);
      assert.ok(
        typeof c.readiness.readiness === "string",
        `${scenarioId}: non-canonical readiness path (contractsV1.readiness.readiness)`
      );
    }
  }
}

function assertCrossSurfaceContradictions(detailed, scenarioId) {
  const esText = [
    String(detailed?.executiveSummary?.mainHomeRecommendationHe || ""),
    String(detailed?.executiveSummary?.overallConfidenceHe || ""),
    String(detailed?.executiveSummary?.reportReadinessHe || ""),
  ].join(" ");
  const profiles = Array.isArray(detailed?.subjectProfiles) ? detailed.subjectProfiles : [];
  const hasRestrainedTopic = profiles.some((sp) =>
    (Array.isArray(sp?.topicRecommendations) ? sp.topicRecommendations : []).some((tr) => {
      const we = String(tr?.contractsV1?.narrative?.wordingEnvelope || "");
      return we === "WE0" || we === "WE1";
    })
  );
  if (hasRestrainedTopic && OVERSTATED_HE_REGEX.test(esText)) {
    throw new Error(`${scenarioId}: executive surface overstates while restrained topic narratives exist`);
  }
}

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
  try {
    assertTopicContractsChain(detailed, id);
    assertCrossSurfaceContradictions(detailed, id);
  } catch (e) {
    return {
      id,
      key,
      status: "FAIL",
      error: e instanceof Error ? e.message : String(e),
    };
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
