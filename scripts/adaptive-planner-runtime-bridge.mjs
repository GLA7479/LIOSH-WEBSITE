#!/usr/bin/env node
/**
 * Focused tests for adaptive-planner-runtime-bridge (practice snapshot → planner JSON).
 * npm run test:adaptive-planner:runtime
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const bridgeMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-runtime-bridge.js", import.meta.url).href
);
const metaCtxMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-metadata-context.js", import.meta.url).href
);

const {
  buildRuntimePlannerRecommendationFromPracticeResult,
  isAdaptivePlannerRecommendationEnabled,
} = bridgeMod;
const { validateLightEntriesNoForbiddenFields } = metaCtxMod;

/**
 * @param {string} rootAbs
 */
async function tryLoadMetadataIndexFromSnapshot(rootAbs) {
  const p = join(rootAbs, "reports", "adaptive-learning-planner", "metadata-index-snapshot.json");
  try {
    const raw = JSON.parse(await readFile(p, "utf8"));
    const entries = raw.entries;
    if (!Array.isArray(entries) || entries.length === 0) return null;
    const leaks = validateLightEntriesNoForbiddenFields(entries);
    if (leaks.length) return null;
    return { entries, stats: raw.stats || {}, builtAt: raw.generatedAt || raw.builtAt || null, rootAbs };
  } catch {
    return null;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

const prevPublic = process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;
const prevSrv = process.env.ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;
delete process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;
delete process.env.ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;
assert(!isAdaptivePlannerRecommendationEnabled(process.env), "flag should default off");
process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION = "1";
assert(isAdaptivePlannerRecommendationEnabled(process.env), "flag should accept 1");
if (prevPublic !== undefined) process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION = prevPublic;
else delete process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;
if (prevSrv !== undefined) process.env.ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION = prevSrv;
else delete process.env.ENABLE_ADAPTIVE_PLANNER_RECOMMENDATION;

const index = await tryLoadMetadataIndexFromSnapshot(ROOT);
assert(index && index.entries.length, "metadata-index-snapshot.json required (run npm run build:adaptive-planner:metadata-index or artifact pipeline)");

/** @param {string} label */
function runCase(label, fn) {
  try {
    fn();
    console.log(`OK  ${label}`);
  } catch (e) {
    console.error(`FAIL ${label}:`, e?.message || e);
    process.exitCode = 1;
  }
}

runCase("Hebrew reading practice → ok + diagnostics", () => {
  const out = buildRuntimePlannerRecommendationFromPracticeResult(
    {
      subject: "hebrew",
      grade: "g4",
      topic: "reading",
      totalQuestions: 22,
      correctAnswers: 16,
      wrongAnswers: 6,
      accuracy: 73,
      durationSeconds: 600,
    },
    { metadataIndex: index }
  );
  assert(out.ok === true, `expected ok true got ${JSON.stringify(out)}`);
  assert(out.recommendation?.nextAction, "missing nextAction");
  assert(Array.isArray(out.recommendation?.reasonCodes) && out.recommendation.reasonCodes.length, "reasonCodes");
  assert(out.diagnostics?.subject === "hebrew", "diagnostics.subject");
});

runCase("Geometry perimeter (topic alignment path)", () => {
  const out = buildRuntimePlannerRecommendationFromPracticeResult(
    {
      subject: "geometry",
      grade: "g5",
      topic: "perimeter",
      totalQuestions: 18,
      correctAnswers: 14,
      wrongAnswers: 4,
      accuracy: 78,
      durationSeconds: 420,
    },
    { metadataIndex: index }
  );
  assert(out.ok === true, JSON.stringify(out));
  assert(
    out.diagnostics?.skillAlignmentSource === "topic_mapping" || out.diagnostics?.skillAlignmentSource === "unit_field",
    `expected topic_mapping or unit_field, got ${out.diagnostics?.skillAlignmentSource}`
  );
});

runCase("English grammar (safe metadata routing)", () => {
  const out = buildRuntimePlannerRecommendationFromPracticeResult(
    {
      subject: "english",
      grade: 5,
      topic: "grammar",
      totalQuestions: 20,
      correctAnswers: 17,
      wrongAnswers: 3,
      accuracy: 85,
      durationSeconds: 500,
    },
    { metadataIndex: index }
  );
  assert(out.ok === true, JSON.stringify(out));
});

runCase("Math multiplication row", () => {
  const out = buildRuntimePlannerRecommendationFromPracticeResult(
    {
      subject: "math",
      grade: "g3",
      topic: "multiplication",
      totalQuestions: 30,
      correctAnswers: 24,
      wrongAnswers: 6,
      accuracy: 80,
      durationSeconds: 900,
    },
    { metadataIndex: index }
  );
  assert(out.ok === true, JSON.stringify(out));
});

runCase("Missing metadata index → fail-safe (no throw)", () => {
  const out = buildRuntimePlannerRecommendationFromPracticeResult(
    {
      subject: "hebrew",
      grade: "g2",
      topic: "reading",
      totalQuestions: 10,
      correctAnswers: 8,
      wrongAnswers: 2,
      accuracy: 80,
      durationSeconds: 120,
    },
    { metadataIndex: { entries: [] } }
  );
  assert(out.ok === false, "expected ok false");
  assert(out.reason === "metadata_index_unavailable", out.reason);
});

runCase("Invalid payload (missing subject) → ok false", () => {
  const out = buildRuntimePlannerRecommendationFromPracticeResult(
    { grade: "g1", topic: "reading", totalQuestions: 5 },
    { metadataIndex: index }
  );
  assert(out.ok === false && out.reason === "missing_subject", JSON.stringify(out));
});

if (process.exitCode) {
  console.error("adaptive-planner-runtime-bridge.mjs: one or more checks failed");
  process.exit(1);
}
console.log("adaptive-planner-runtime-bridge.mjs: all checks passed");
