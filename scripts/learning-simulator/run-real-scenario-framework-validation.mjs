#!/usr/bin/env node
/**
 * Validates Professional Diagnostic Framework enrichment on real simulator-built parent reports.
 *
 * Prerequisites: coverage-matrix.json; for profile-stress clones also coverage-catalog.json (full QA).
 *
 * npm run qa:learning-simulator:framework-real-scenarios
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { buildStorageForScenario } from "./lib/aggregate-runner.mjs";
import { buildReportsFromAggregateStorage } from "./lib/report-runner.mjs";
import { buildStressScenarioForEngineTruth } from "./lib/profile-stress-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const MATRIX_PATH = join(ROOT, "reports", "learning-simulator", "coverage-matrix.json");
const OUT_DIR = join(ROOT, "reports", "learning-simulator", "engine-completion");
const OUT_JSON = join(OUT_DIR, "real-scenario-framework-validation.json");
const OUT_MD = join(OUT_DIR, "real-scenario-framework-validation.md");

const REQUIRED_STRUCTURED_KEYS = [
  "findingType",
  "subjectId",
  "topicId",
  "skillId",
  "evidenceLevel",
  "confidence",
  "basedOn",
  "reasoning",
  "doNotConclude",
  "nextAction",
  "frameworkMeta",
];

function assertShape(sf, label) {
  for (const k of REQUIRED_STRUCTURED_KEYS) {
    if (!(k in sf)) throw new Error(`${label}: missing ${k}`);
  }
  if (!sf.nextAction?.type) throw new Error(`${label}: nextAction.type required`);
  if (!Array.isArray(sf.reasoning)) throw new Error(`${label}: reasoning[]`);
  if (!Array.isArray(sf.doNotConclude) || sf.doNotConclude.length < 1) {
    throw new Error(`${label}: doNotConclude must be non-empty`);
  }
  if (!sf.frameworkMeta || typeof sf.frameworkMeta !== "object") throw new Error(`${label}: frameworkMeta`);
}

async function loadFixtureScenarios() {
  const quickUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "quick-scenarios.mjs")).href;
  const deepUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "scenarios", "deep-scenarios.mjs")).href;
  const profUrl = pathToFileURL(join(ROOT, "tests", "fixtures", "learning-simulator", "profiles", "base-profiles.mjs")).href;
  const [q, d, p] = await Promise.all([import(quickUrl), import(deepUrl), import(profUrl)]);
  const QUICK = q.QUICK_SCENARIOS || q.default;
  const DEEP = d.DEEP_SCENARIOS || d.default;
  const BASE_PROFILES = p.BASE_PROFILES || p.default;
  const byId = new Map();
  for (const s of [...QUICK, ...DEEP]) {
    if (!byId.has(s.scenarioId)) byId.set(s.scenarioId, s);
  }
  return { byId, BASE_PROFILES };
}

/** Core scenarios + stress clones (fast_wrong / slow_correct). */
const FIXTURE_SCENARIO_IDS = [
  "weak_math_fractions_g5_7d",
  "weak_hebrew_comprehension_g3_7d",
  "strong_all_subjects_g3_7d",
  "thin_data_g3_1d",
  "improving_student_g4_30d",
  "declining_student_g4_30d",
  "inconsistent_student_g5_30d",
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const fwUrl = pathToFileURL(join(ROOT, "utils", "learning-diagnostics", "diagnostic-framework-v1.js")).href;
  const { PROFESSIONAL_FRAMEWORK_V1 } = await import(fwUrl);

  let matrixRows = [];
  try {
    matrixRows = JSON.parse(await readFile(MATRIX_PATH, "utf8")).rows || [];
  } catch {
    console.error("Missing coverage-matrix.json — run npm run qa:learning-simulator:matrix");
    process.exit(1);
    return;
  }

  const { byId, BASE_PROFILES } = await loadFixtureScenarios();

  /** @type {object[]} */
  const runs = [];
  /** @type {string[]} */
  const errors = [];

  async function evaluateScenario(scenario, profile, tag) {
    const sid = scenario.scenarioId;
    const row = { scenarioId: sid, tag, pass: true, checks: [], notes: [] };

    if (!profile) {
      row.pass = false;
      row.checks.push({ name: "profile", ok: false, detail: "missing profile" });
      runs.push(row);
      return;
    }

    const built = await buildStorageForScenario(scenario, profile, matrixRows);
    if (!built.ok || !built.storage) {
      row.pass = false;
      row.checks.push({ name: "storage", ok: false, detail: built.errors || [] });
      runs.push(row);
      return;
    }

    const rb = await buildReportsFromAggregateStorage({ storage: built.storage, scenario });
    if (!rb.ok || !rb.baseReport) {
      row.pass = false;
      row.checks.push({ name: "report", ok: false, detail: rb.error || "no baseReport" });
      runs.push(row);
      return;
    }

    const eng = rb.baseReport.diagnosticEngineV2;
    const rollup = eng?.professionalFrameworkV1;
    const units = Array.isArray(eng?.units) ? eng.units : [];
    const summary = rb.baseReport.summary || {};

    try {
      const supported = new Set(PROFESSIONAL_FRAMEWORK_V1.supportedSubjectIds);

      for (const u of units) {
        const sub = String(u.subjectId || "");
        if (!supported.has(sub)) continue;
        const pf = u.professionalFrameworkV1;
        const trk = String(u.topicRowKey || "");
        const subjQKey = {
          math: "mathQuestions",
          hebrew: "hebrewQuestions",
          english: "englishQuestions",
          science: "scienceQuestions",
          geometry: "geometryQuestions",
          "moledet-geography": "moledetGeographyQuestions",
        }[sub];
        const subjQ = subjQKey ? Number(summary[subjQKey]) || 0 : 0;

        if (subjQ <= 0 && pf) {
          throw new Error(`Unit ${sub}/${trk}: subject has no data but professionalFrameworkV1 present`);
        }
        if (subjQ > 0 && pf?.structuredFinding) {
          assertShape(pf.structuredFinding, `${sid}/${sub}/${trk}`);
        }
      }

      if (rollup?.structuredFindings?.length) {
        for (const sf of rollup.structuredFindings) {
          assertShape(sf, `${sid}/rollup`);
        }
      }

      if (sid === "thin_data_g3_1d") {
        for (const sf of rollup?.structuredFindings || []) {
          if (sf.evidenceLevel === "strong" && sf.confidence === "high") {
            throw new Error("thin_data: must not produce strong evidence + high confidence together");
          }
        }
      }

      if (sid === "weak_math_fractions_g5_7d") {
        const mathUnits = units.filter((u) => u.subjectId === "math");
        const mathWithPf = mathUnits.filter((u) => u.professionalFrameworkV1?.structuredFinding);
        if (mathUnits.length > 0 && mathWithPf.length < 1) {
          throw new Error("weak_math_fractions: expected at least one math unit with structured finding when math units exist");
        }
      }

      if (sid === "weak_hebrew_comprehension_g3_7d") {
        const heUnits = units.filter((u) => u.subjectId === "hebrew");
        const heWithPf = heUnits.filter((u) => u.professionalFrameworkV1?.structuredFinding);
        if (heUnits.length > 0 && heWithPf.length < 1) {
          throw new Error("weak_hebrew: expected at least one Hebrew unit with structured finding when Hebrew units exist");
        }
      }

      if (scenario.profileStressType === "slow_correct") {
        for (const u of units) {
          const pf = u.professionalFrameworkV1?.structuredFinding;
          if (!pf) continue;
          if (Number(pf.basedOn?.accuracy) >= 75) {
            const r = (pf.reasoning || []).join(" ");
            if (r.includes("treat as a knowledge weakness") && r.includes("Speed-mode")) {
              /* pace-only guard present when speed mode + solid accuracy */
            }
          }
        }
      }

      row.checks.push({ name: "frameworkShape", ok: true });
    } catch (e) {
      row.pass = false;
      errors.push(`${sid}: ${e?.message || e}`);
      row.checks.push({ name: "frameworkRules", ok: false, detail: String(e?.message || e) });
    }

    runs.push(row);
  }

  for (const id of FIXTURE_SCENARIO_IDS) {
    const scenario = byId.get(id);
    if (!scenario) {
      runs.push({ scenarioId: id, pass: false, checks: [{ name: "fixture", ok: false, detail: "scenario not found" }] });
      errors.push(`missing fixture ${id}`);
      continue;
    }
    const profile = BASE_PROFILES[scenario.profileRef];
    await evaluateScenario(scenario, profile, "fixture");
  }

  for (const [type, slot] of [
    ["fast_wrong", 3],
    ["slow_correct", 2],
  ]) {
    const b = await buildStressScenarioForEngineTruth(ROOT, type, slot);
    if (b.ok && b.scenario && b.profile) {
      await evaluateScenario(b.scenario, b.profile, `stress_${type}_s${slot}`);
    } else {
      runs.push({
        scenarioId: `stress_${type}_${slot}`,
        pass: false,
        checks: [{ name: "stress_build", ok: false, detail: b.error || "unknown" }],
      });
      errors.push(`stress ${type} slot ${slot}: ${b.error || "failed"}`);
    }
  }

  const generatedAt = new Date().toISOString();
  const overallPass = errors.length === 0 && runs.every((r) => r.pass !== false);

  const payload = {
    generatedAt,
    overallPass,
    frameworkVersion: PROFESSIONAL_FRAMEWORK_V1.version,
    supportedSubjects: [...PROFESSIONAL_FRAMEWORK_V1.supportedSubjectIds],
    scenariosEvaluated: runs.length,
    runs,
    errors,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Real scenario — Professional Diagnostic Framework validation",
    "",
    `- Generated at: ${generatedAt}`,
    `- Overall: **${overallPass ? "PASS" : "FAIL"}**`,
    `- Framework version: ${PROFESSIONAL_FRAMEWORK_V1.version}`,
    "",
    "## Scenarios",
    "",
    ...runs.map((r) => `- \`${r.scenarioId}\`: ${r.pass === false ? "FAIL" : "PASS"} ${r.notes?.length ? `— ${r.notes.join("; ")}` : ""}`),
    "",
    ...(errors.length ? ["## Errors", "", ...errors.map((e) => `- ${e}`), ""] : []),
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  console.log(`Real scenario framework validation: ${overallPass ? "PASS" : "FAIL"}`);
  console.log(`Wrote ${OUT_JSON}`);

  const summaryUrl = pathToFileURL(join(__dirname, "run-engine-completion-summary.mjs")).href;
  try {
    const sumMod = await import(summaryUrl);
    if (typeof sumMod.writeEngineCompletionSummary === "function") {
      await sumMod.writeEngineCompletionSummary(ROOT);
    }
  } catch {
    /* optional */
  }

  process.exit(overallPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
