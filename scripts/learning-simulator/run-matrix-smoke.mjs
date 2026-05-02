#!/usr/bin/env node
/**
 * Matrix smoke — lightweight aggregate simulations so every previously-sampled matrix cell
 * gets real session/storage coverage (grouped by grade + subject).
 *
 * Requires Phase 4 artifacts: reports/learning-simulator/questions/unsupported-cells.json
 *
 * npm run qa:learning-simulator:matrix-smoke
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { buildStorageForScenario } from "./lib/aggregate-runner.mjs";
import {
  ROOT,
  classifyMatrixSmokeEligibility,
  cellKey,
  loadFixtureScenarios,
  loadMatrix,
  loadPhase4FailureKeys,
  loadPhase4UnsupportedMap,
  scenarioTouches,
} from "./lib/coverage-catalog-core.mjs";

const OUT_DIR = join(ROOT, "reports", "learning-simulator");
const OUT_JSON = join(OUT_DIR, "matrix-smoke.json");
const OUT_MD = join(OUT_DIR, "matrix-smoke.md");

const PROFILE_REF = "p_strong_all_subjects";
const ANCHOR_DATE = "2026-05-01T08:00:00.000Z";

/** @param {string} id */
function hashSeed(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

/**
 * @param {object} sess
 * @param {object} row matrix row
 */
function sessionHitsCell(sess, row) {
  return (
    sess.subject === row.subjectCanonical &&
    sess.bucket === row.topic &&
    sess.level === row.level &&
    sess.grade === row.grade
  );
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

/** Reasons counted as "unsupported / not smokeable" for metrics */
const UNSUPPORTED_SKIP_REASONS = new Set([
  "runtime_unsupported",
  "subject_not_in_phase4",
  "unsupported_needs_generator",
  "mixed_or_ui_only_topic",
  "phase4_unsupported",
  "integrity_failure",
]);

async function loadProfiles() {
  const url = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "profiles", "base-profiles.mjs")).href;
  const mod = await import(url);
  return mod.BASE_PROFILES || mod.default;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const runId = `matrix-smoke-${Date.now().toString(36)}`;
  const generatedAt = new Date().toISOString();

  const { rows } = await loadMatrix();
  const { byKey: unsupportedByKey } = await loadPhase4UnsupportedMap();
  const { keys: failureKeys } = await loadPhase4FailureKeys();
  const { QUICK_SCENARIOS, DEEP_SCENARIOS } = await loadFixtureScenarios();
  const BASE_PROFILES = await loadProfiles();
  const profile = BASE_PROFILES[PROFILE_REF];
  if (!profile) {
    console.error(`Missing profile ${PROFILE_REF} in base-profiles.mjs`);
    process.exit(1);
    return;
  }

  const quickTouch = new Set();
  for (const s of QUICK_SCENARIOS) {
    for (const k of scenarioTouches(s, rows)) quickTouch.add(k);
  }
  const deepTouch = new Set();
  for (const s of DEEP_SCENARIOS) {
    for (const k of scenarioTouches(s, rows)) deepTouch.add(k);
  }

  let skippedUnsupported = 0;
  let skippedAlreadyFixture = 0;
  let skippedOther = 0;

  for (const row of rows) {
    const { eligible, skipReason } = classifyMatrixSmokeEligibility(row, unsupportedByKey, failureKeys, quickTouch, deepTouch);
    if (eligible) continue;
    if (skipReason === "already_fixture_covered") skippedAlreadyFixture += 1;
    else if (skipReason && UNSUPPORTED_SKIP_REASONS.has(skipReason)) skippedUnsupported += 1;
    else skippedOther += 1;
  }

  /** @type {Map<string, object[]>} */
  const groups = new Map();
  for (const row of rows) {
    const { eligible } = classifyMatrixSmokeEligibility(row, unsupportedByKey, failureKeys, quickTouch, deepTouch);
    if (!eligible) continue;
    const gk = `${row.grade}|${row.subjectCanonical}`;
    if (!groups.has(gk)) groups.set(gk, []);
    groups.get(gk).push(row);
  }

  for (const [, list] of groups) {
    list.sort((a, b) =>
      `${a.topic}|${a.level}`.localeCompare(`${b.topic}|${b.level}`, undefined, { sensitivity: "base" })
    );
  }

  /** @type {object[]} */
  const scenariosOut = [];
  /** @type {object[]} */
  const failures = [];

  const groupKeys = [...groups.keys()].sort();

  for (const gk of groupKeys) {
    const list = groups.get(gk);
    const [grade, subjectCanonical] = gk.split("|");
    const scenarioId = `matrix_smoke_${grade}_${subjectCanonical}`;
    const levels = [...new Set(list.map((r) => r.level))].sort((a, b) => {
      const order = { easy: 0, medium: 1, hard: 2 };
      return (order[a] ?? 9) - (order[b] ?? 9);
    });

    const matrixCoverageRefs = list.map((r) => ({
      subjectCanonical: r.subjectCanonical,
      topic: r.topic,
      level: r.level,
    }));

    const topics = [...new Set(list.map((r) => r.topic))].sort();

    const scenario = {
      scenarioId,
      mode: "aggregate",
      tier: "quick",
      grade,
      subjects: [subjectCanonical],
      levels,
      topicTargets: [],
      profileRef: PROFILE_REF,
      timeHorizonDays: 7,
      sessionPlan: {
        targetSessions: Math.max(1, matrixCoverageRefs.length),
        spanDaysApprox: 7,
        notes: "Matrix smoke — one session per sampled matrix cell in this grade × subject slice.",
      },
      matrixCoverageRefs,
      expected: {},
      seed: hashSeed(scenarioId),
      anchorDate: ANCHOR_DATE,
      artifactOptions: {},
    };

    const built = await buildStorageForScenario(scenario, profile, rows);

    /** @type {object[]} */
    const cellsTouched = [];
    /** @type {string[]} */
    const errors = [...(built.errors || [])];

    if (!built.ok) {
      failures.push({ scenarioId, phase: "buildStorage", errors: built.errors });
      scenariosOut.push({
        scenarioId,
        grade,
        subject: subjectCanonical,
        subjects: scenario.subjects,
        levels,
        topics,
        profileRef: PROFILE_REF,
        mode: scenario.mode,
        tier: scenario.tier,
        timeHorizonDays: scenario.timeHorizonDays,
        matrixCoverageRefs,
        cellsTouched,
        matrixCellsTouched: [],
        sessionsCreated: 0,
        questionsOrRowsCreated: 0,
        status: "failed",
        errors,
      });
      continue;
    }

    let questionsOrRowsCreated = built.stats?.questionTotal ?? 0;

    for (const row of list) {
      const hit = built.sessions.some((sess) => sessionHitsCell(sess, row));
      if (!hit) {
        const msg = `No session matched cell ${cellKey(row)}`;
        errors.push(msg);
        failures.push({ scenarioId, cellKey: cellKey(row), phase: "session_coverage", message: msg });
      } else {
        cellsTouched.push({
          grade: row.grade,
          subject: row.subjectCanonical,
          level: row.level,
          topic: row.topic,
          cellKey: cellKey(row),
          sourceStatusBefore: "sampled",
          coveredByMatrixSmoke: true,
        });
      }
    }

    const status = errors.length ? "failed" : "ok";
    if (status === "failed") {
      failures.push({ scenarioId, phase: "validation", errors });
    }

    const matrixCellsTouched = cellsTouched.map((c) => c.cellKey).sort();

    scenariosOut.push({
      scenarioId,
      grade,
      subject: subjectCanonical,
      subjects: scenario.subjects,
      levels,
      topics,
      profileRef: PROFILE_REF,
      mode: scenario.mode,
      tier: scenario.tier,
      timeHorizonDays: scenario.timeHorizonDays,
      matrixCoverageRefs,
      cellsTouched,
      matrixCellsTouched,
      sessionsCreated: built.stats?.sessionCount ?? 0,
      questionsOrRowsCreated,
      status,
      errors,
    });
  }

  const okScenarios = scenariosOut.filter((s) => s.status === "ok");
  const touchedKeys = new Set();
  for (const s of okScenarios) {
    for (const c of s.cellsTouched || []) {
      if (c.cellKey) touchedKeys.add(c.cellKey);
    }
  }

  const candidateCells = [...groups.values()].reduce((n, list) => n + list.length, 0);

  const payload = {
    runId,
    generatedAt,
    generator: "matrix-smoke-v1",
    versions: { matrixSmoke: "1.0.0" },
    totalCandidateCells: candidateCells,
    totalSmokeScenarios: scenariosOut.length,
    totalCellsTouched: touchedKeys.size,
    totalCellsSkippedUnsupported: skippedUnsupported,
    skippedAlreadyFixtureCovered: skippedAlreadyFixture,
    skippedOther,
    failures,
    scenarios: scenariosOut.sort((a, b) => a.scenarioId.localeCompare(b.scenarioId)),
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Matrix smoke (aggregate simulation)",
    "",
    `- Run id: ${runId}`,
    `- Generated at: ${generatedAt}`,
    `- Candidate cells (smoke-eligible): ${payload.totalCandidateCells}`,
    `- Smoke scenarios executed: ${payload.totalSmokeScenarios}`,
    `- Cells touched (unique, ok scenarios): ${payload.totalCellsTouched}`,
    `- Skipped — unsupported / not smokeable: ${payload.totalCellsSkippedUnsupported}`,
    `- Skipped — already covered by quick/deep fixtures: ${payload.skippedAlreadyFixtureCovered}`,
    `- Failures recorded: ${payload.failures.length}`,
    "",
    "## Failures",
    "",
    ...(payload.failures.length
      ? payload.failures.slice(0, 40).map((f) => `- **${mdEscape(f.scenarioId)}** (${mdEscape(f.phase || "")}): ${mdEscape(JSON.stringify(f.errors || f.message || f))}`)
      : ["- (none)"]),
    "",
    "## Sample scenarios",
    "",
    "| scenarioId | status | sessions | questions | cells |",
    "| --- | --- | ---: | ---: | ---: |",
    ...payload.scenarios.slice(0, 25).map(
      (s) =>
        `| ${mdEscape(s.scenarioId)} | ${mdEscape(s.status)} | ${s.sessionsCreated} | ${s.questionsOrRowsCreated} | ${s.matrixCellsTouched?.length ?? 0} |`
    ),
    "",
    `Full JSON: \`${OUT_JSON.replace(/\\/g, "/")}\``,
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_MD}`);
  console.log(
    `Matrix smoke: ${payload.totalCellsTouched} cells touched / ${payload.totalCandidateCells} candidates · ${payload.failures.length} failure records`
  );

  if (failures.length > 0 || scenariosOut.some((s) => s.status !== "ok")) {
    console.error("Matrix smoke gate: FAIL");
    process.exit(1);
  }
  console.log("Matrix smoke gate: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
