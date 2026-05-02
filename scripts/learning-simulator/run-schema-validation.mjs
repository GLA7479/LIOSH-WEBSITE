#!/usr/bin/env node
/**
 * Phase 1 — validate profile + scenario fixtures against coverage matrix (definitions only).
 * npm run qa:learning-simulator:schema
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { PROFILE_SCHEMA_VERSION, validateProfileSet } from "./lib/profile-library.mjs";
import { ASSERTION_SCHEMA_VERSION } from "./lib/assertion-schema.mjs";
import { SCENARIO_SCHEMA_VERSION, buildMatrixIndexes, validateAllScenarios } from "./lib/scenario-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const MATRIX_PATH = join(ROOT, "reports", "learning-simulator", "coverage-matrix.json");
const OUT_DIR = join(ROOT, "reports", "learning-simulator");
const OUT_JSON = join(OUT_DIR, "schema-validation.json");
const OUT_MD = join(OUT_DIR, "schema-validation.md");

async function loadFixtures() {
  const profilesUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "profiles", "base-profiles.mjs")).href;
  const scenariosUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "quick-scenarios.mjs")).href;
  const deepUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "deep-scenarios.mjs")).href;

  const profilesMod = await import(profilesUrl);
  const scenariosMod = await import(scenariosUrl);
  const deepMod = await import(deepUrl);

  const BASE_PROFILES = profilesMod.BASE_PROFILES || profilesMod.default;
  const QUICK_SCENARIOS = scenariosMod.QUICK_SCENARIOS || scenariosMod.default;
  const DEEP_SCENARIOS = deepMod.DEEP_SCENARIOS || deepMod.default || [];
  const ALL_SCENARIOS = [...QUICK_SCENARIOS, ...DEEP_SCENARIOS];

  return { BASE_PROFILES, QUICK_SCENARIOS, DEEP_SCENARIOS, ALL_SCENARIOS };
}

function collectMatrixTouches(scenarios) {
  /** @type {Map<string, { scenarioIds: Set<string>, refs: object[] }>} */
  const byKey = new Map();

  function add(key, scenarioId, ref) {
    if (!byKey.has(key)) byKey.set(key, { scenarioIds: new Set(), refs: [] });
    const e = byKey.get(key);
    e.scenarioIds.add(scenarioId);
    e.refs.push(ref);
  }

  for (const s of scenarios) {
    const sid = s.scenarioId;
    for (const r of s.matrixCoverageRefs || []) {
      const lvl = r.level || "*";
      const key = `${s.grade}|${r.subjectCanonical}|${r.topic}|${lvl}`;
      add(key, sid, { kind: "matrixCoverageRefs", ...r });
    }
    for (const t of s.topicTargets || []) {
      if (t.optional) continue;
      const lvl = t.level || "*";
      const key = `${s.grade}|${t.subjectCanonical}|${t.topic}|${lvl}`;
      add(key, sid, { kind: "topicTargets", ...t });
    }
  }

  return [...byKey.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([matrixKey, v]) => ({
      matrixKey,
      scenarioIds: [...v.scenarioIds].sort(),
      sampleRef: v.refs[0],
    }));
}

function buildMarkdown(payload) {
  const lines = [
    "# Learning simulator schema validation",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Schema versions: profile ${payload.versions.profile}, scenario ${payload.versions.scenario}, assertion ${payload.versions.assertion}`,
    `- Profiles: ${payload.counts.profiles}`,
    `- Scenarios: ${payload.counts.scenarios}`,
    `- OK: ${payload.ok}`,
    "",
    "## Scenario IDs",
    "",
    ...payload.scenarioIds.map((id) => `- ${id}`),
    "",
    "## Validation errors",
    "",
    ...(payload.errors.length ? payload.errors.map((e) => `- ${e}`) : ["- (none)"]),
    "",
    "## Validation warnings",
    "",
    ...(payload.warnings.length ? payload.warnings.map((w) => `- ${w}`) : ["- (none)"]),
    "",
    "## Matrix coverage keys touched (scenario refs)",
    "",
    ...payload.matrixTouches.slice(0, 80).map((x) => `- \`${x.matrixKey}\` ← ${x.scenarioIds.join(", ")}`),
    payload.matrixTouches.length > 80 ? `\n… ${payload.matrixTouches.length - 80} more keys …` : "",
    "",
  ];
  return lines.filter(Boolean).join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let matrixRaw;
  try {
    matrixRaw = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
  } catch (e) {
    console.error(`Missing or invalid ${MATRIX_PATH}. Run npm run qa:learning-simulator:matrix first.`);
    console.error(e);
    process.exit(1);
  }

  const rows = matrixRaw.rows || [];
  const matrixIndexes = buildMatrixIndexes(rows);

  const { BASE_PROFILES, ALL_SCENARIOS } = await loadFixtures();

  const profileIds = Object.keys(BASE_PROFILES);
  const profileValidation = validateProfileSet(BASE_PROFILES);

  const scenarioCtx = {
    profilesById: BASE_PROFILES,
    matrixIndexes,
    matrixRowCount: rows.length,
  };

  const scenarioValidation = validateAllScenarios(ALL_SCENARIOS, scenarioCtx);

  const errors = [...profileValidation.errors, ...scenarioValidation.errors];
  const warnings = [...scenarioValidation.warnings];

  const matrixTouches = collectMatrixTouches(ALL_SCENARIOS);

  const payload = {
    generatedAt: new Date().toISOString(),
    ok: errors.length === 0,
    versions: {
      profile: PROFILE_SCHEMA_VERSION,
      scenario: SCENARIO_SCHEMA_VERSION,
      assertion: ASSERTION_SCHEMA_VERSION,
    },
    counts: {
      profiles: profileIds.length,
      scenarios: ALL_SCENARIOS.length,
      matrixRows: rows.length,
    },
    scenarioIds: ALL_SCENARIOS.map((s) => s.scenarioId).sort(),
    profileIds: profileIds.sort(),
    errors,
    warnings,
    matrixTouches,
    matrixCoverageSummary: {
      distinctTouchKeys: matrixTouches.length,
      scenarioCount: ALL_SCENARIOS.length,
    },
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, buildMarkdown(payload), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: payload.ok,
        profiles: payload.counts.profiles,
        scenarios: payload.counts.scenarios,
        errors: errors.length,
        warnings: warnings.length,
        outJson: OUT_JSON,
        outMd: OUT_MD,
      },
      null,
      2
    )
  );

  if (!payload.ok) {
    console.error("Schema validation failed:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
