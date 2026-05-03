#!/usr/bin/env node
/**
 * Adaptive Learning Planner — deterministic selftest (no product wiring).
 * npm run test:adaptive-planner
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "adaptive-learning-planner");
const OUT_JSON = join(OUT_DIR, "summary.json");
const OUT_MD = join(OUT_DIR, "summary.md");

const plannerMod = await import(new URL("../utils/adaptive-learning-planner/adaptive-planner.js", import.meta.url).href);
const fixturesMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-fixtures.js", import.meta.url).href
);
const summaryMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-summary.js", import.meta.url).href
);

const { planAdaptiveLearning } = plannerMod;
const { ADAPTIVE_PLANNER_FIXTURES } = fixturesMod;
const { buildPlannerSummaryPayload, buildPlannerSummaryMarkdown } = summaryMod;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** @type {{ name: string, pass: boolean, detail?: string, input?: object, output?: object }[]} */
const cases = [];

function runCase(name, input, check) {
  let out;
  try {
    out = planAdaptiveLearning(input);
    check(out);
    cases.push({ name, pass: true, input, output: out });
  } catch (e) {
    cases.push({
      name,
      pass: false,
      detail: String(e?.message || e),
      input,
      output: out,
    });
  }
}

runCase("strong_mastery_advance", ADAPTIVE_PLANNER_FIXTURES[0].input, (o) => {
  assert(o.nextAction === "advance_skill", "expected advance_skill");
  assert(o.plannerStatus === "ready", "expected ready");
  assert(o.targetDifficulty === "advanced", `expected advanced got ${o.targetDifficulty}`);
});

runCase("remediate_current_skill", ADAPTIVE_PLANNER_FIXTURES[1].input, (o) => {
  assert(o.nextAction === "practice_current", "expected practice_current");
  assert(o.questionCount === 5, "expected 5 questions");
  assert(o.targetDifficulty === "basic", `lowered difficulty expected basic got ${o.targetDifficulty}`);
  assert(o.reasonCodes.includes("REMEDIATE"), "reason REMEDIATE");
  assert(o.reasonCodes.includes("ERROR_TYPES_TARGETED_PRACTICE"), "error types in reasons");
});

runCase("thin_data_pause", ADAPTIVE_PLANNER_FIXTURES[2].input, (o) => {
  assert(o.plannerStatus === "caution", "caution");
  assert(o.nextAction === "pause_collect_more_data", "pause on thin");
});

runCase("do_not_conclude_caution", ADAPTIVE_PLANNER_FIXTURES[3].input, (o) => {
  assert(o.plannerStatus === "caution", "caution");
  assert(o.nextAction === "pause_collect_more_data", "pause when doNotConclude");
});

runCase("prerequisite_review", ADAPTIVE_PLANNER_FIXTURES[4].input, (o) => {
  assert(o.nextAction === "review_prerequisite", "review_prerequisite");
  assert(o.targetSkillId === "number_sense", "first prereq skill");
});

runCase("guessing_probe", ADAPTIVE_PLANNER_FIXTURES[5].input, (o) => {
  assert(o.nextAction === "probe_skill", "probe on guessing");
  assert(o.questionCount === 3, "small batch");
});

runCase("inconsistency_probe", ADAPTIVE_PLANNER_FIXTURES[6].input, (o) => {
  assert(o.nextAction === "probe_skill", "probe on inconsistency");
});

runCase("engine_insufficient_data", ADAPTIVE_PLANNER_FIXTURES[7].input, (o) => {
  assert(o.plannerStatus === "insufficient_data", "insufficient_data");
  assert(o.nextAction === "pause_collect_more_data", "pause");
});

runCase("missing_subject", ADAPTIVE_PLANNER_FIXTURES[8].input, (o) => {
  assert(o.plannerStatus === "insufficient_data", "insufficient_data");
});

runCase("missing_metadata_advance_blocked", ADAPTIVE_PLANNER_FIXTURES[9].input, (o) => {
  assert(o.plannerStatus === "needs_human_review", "needs_human_review");
  assert(o.requiresHumanReview === true, "requiresHumanReview");
});

runCase("english_missing_skill", ADAPTIVE_PLANNER_FIXTURES[10].input, (o) => {
  assert(o.plannerStatus === "needs_human_review", "english untagged");
  assert(o.reasonCodes.includes("ENGLISH_SKILL_TAGGING_INCOMPLETE"), "reason code");
});

runCase("english_skill_incomplete_flag", ADAPTIVE_PLANNER_FIXTURES[11].input, (o) => {
  assert(o.plannerStatus === "needs_human_review", "flag forces review");
});

runCase("maintain_strong", ADAPTIVE_PLANNER_FIXTURES[12].input, (o) => {
  assert(o.nextAction === "maintain_skill", "maintain_skill");
  assert(o.plannerStatus === "ready", "ready");
});

const generatedAt = new Date().toISOString();
const payload = buildPlannerSummaryPayload({ generatedAt, cases });
const md = buildPlannerSummaryMarkdown(payload);

await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
await writeFile(OUT_MD, md, "utf8");

const failed = cases.filter((c) => !c.pass);
console.log(
  JSON.stringify(
    {
      ok: failed.length === 0,
      cases: cases.length,
      passed: cases.filter((c) => c.pass).length,
      failed: failed.length,
      outJson: OUT_JSON,
    },
    null,
    2
  )
);

if (failed.length) {
  for (const f of failed) console.error("FAIL:", f.name, f.detail);
  process.exit(1);
}
