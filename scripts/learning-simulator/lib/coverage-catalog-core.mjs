/**
 * Shared logic for coverage catalog + unsupported classification + scenario→matrix mapping.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import { ASSERTION_FIELD_KEYS } from "./assertion-schema.mjs";
import { SUPPORTED_SUBJECTS } from "./question-generator-adapters.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");

/** @enum {string} */
export const COVERAGE_STATUS = {
  covered: "covered",
  sampled: "sampled",
  unsupported_expected: "unsupported_expected",
  unsupported_needs_content: "unsupported_needs_content",
  unsupported_needs_adapter: "unsupported_needs_adapter",
  unsupported_needs_generator: "unsupported_needs_generator",
  uncovered: "uncovered",
};

/** @enum {string} */
export const UNSUPPORTED_CLASS = {
  expected_runtime_gap: "expected_runtime_gap",
  curriculum_only_not_runtime: "curriculum_only_not_runtime",
  missing_question_bank: "missing_question_bank",
  missing_generator_adapter: "missing_generator_adapter",
  missing_topic_adapter: "missing_topic_adapter",
  mixed_or_ui_only_topic: "mixed_or_ui_only_topic",
  unknown_needs_review: "unknown_needs_review",
};

/**
 * Must match question-integrity cellKey order.
 * @param {{ grade: string, subjectCanonical: string, level: string, topic: string }} row
 */
export function cellKey(row) {
  return `${row.grade}|${row.subjectCanonical}|${row.topic}|${row.level}`;
}

/**
 * @param {object} ref
 * @param {string} grade
 * @param {object[]} rows
 * @returns {Set<string>}
 */
export function expandRefToCellKeys(grade, ref, rows) {
  const keys = new Set();
  if (!ref || ref.optional) return keys;
  const sub = ref.subjectCanonical;
  const topic = ref.topic;
  const level = ref.level;
  for (const r of rows) {
    if (r.grade !== grade || r.subjectCanonical !== sub || r.topic !== topic) continue;
    if (level && r.level !== level) continue;
    keys.add(cellKey(r));
  }
  return keys;
}

/**
 * @param {object} scenario
 * @param {object[]} rows
 */
export function scenarioTouches(scenario, rows) {
  const keys = new Set();
  const g = scenario.grade;
  for (const ref of scenario.matrixCoverageRefs || []) {
    for (const k of expandRefToCellKeys(g, ref, rows)) keys.add(k);
  }
  for (const ref of scenario.topicTargets || []) {
    for (const k of expandRefToCellKeys(g, ref, rows)) keys.add(k);
  }
  return keys;
}

export async function loadMatrix(ROOT_OVERRIDE = ROOT) {
  const MATRIX_PATH = join(ROOT_OVERRIDE, "reports", "learning-simulator", "coverage-matrix.json");
  const raw = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
  return { matrixPath: MATRIX_PATH, rowCount: raw.rowCount ?? (raw.rows || []).length, rows: raw.rows || [], generatedAt: raw.generatedAt };
}

export async function loadFixtureScenarios(ROOT_OVERRIDE = ROOT) {
  const profilesUrl = pathToFileURL(join(ROOT_OVERRIDE, "tests", "fixtures", "learning-simulator", "profiles", "base-profiles.mjs")).href;
  const quickUrl = pathToFileURL(join(ROOT_OVERRIDE, "tests", "fixtures", "learning-simulator", "scenarios", "quick-scenarios.mjs")).href;
  const deepUrl = pathToFileURL(join(ROOT_OVERRIDE, "tests", "fixtures", "learning-simulator", "scenarios", "deep-scenarios.mjs")).href;

  await import(profilesUrl);
  const quickMod = await import(quickUrl);
  const deepMod = await import(deepUrl);

  const QUICK_SCENARIOS = quickMod.QUICK_SCENARIOS || quickMod.default || [];
  const DEEP_SCENARIOS = deepMod.DEEP_SCENARIOS || deepMod.default || [];

  return { QUICK_SCENARIOS, DEEP_SCENARIOS };
}

/**
 * Deduped cellKey -> representative reason from Phase 4 unsupported-cells.json
 */
export async function loadPhase4UnsupportedMap(ROOT_OVERRIDE = ROOT) {
  const p = join(ROOT_OVERRIDE, "reports", "learning-simulator", "questions", "unsupported-cells.json");
  /** @type {Map<string, string>} */
  const byKey = new Map();
  try {
    const raw = JSON.parse(await readFile(p, "utf8"));
    const list = raw.unsupportedCells || [];
    for (const u of list) {
      const k = u.cellKey || cellKey(u);
      if (!byKey.has(k)) byKey.set(k, String(u.reason || "unsupported"));
    }
  } catch {
    /* optional before first questions run */
  }
  return { path: p, byKey };
}

/**
 * cellKey -> true if integrity failures.json lists this cell
 */
export async function loadPhase4FailureKeys(ROOT_OVERRIDE = ROOT) {
  const p = join(ROOT_OVERRIDE, "reports", "learning-simulator", "questions", "failures.json");
  const keys = new Set();
  try {
    const raw = JSON.parse(await readFile(p, "utf8"));
    for (const f of raw.failures || []) {
      if (f.cellKey) keys.add(f.cellKey);
      else if (f.matrixRow) keys.add(cellKey(f.matrixRow));
    }
  } catch {
    /* missing */
  }
  return { path: p, keys };
}

/**
 * Map Phase 4 unsupported reason → catalog coverageStatus
 * @param {string} reason
 * @param {string} [topic] — matrix topic key (e.g. `mixed` is UI aggregate, not missing bank content)
 */
export function phase4ReasonToCoverageStatus(reason, topic = "") {
  const r = String(reason || "").toLowerCase();
  const t = String(topic || "").toLowerCase();
  /** `mixed` / multi-topic integrity skips are intentional — not a content gap */
  if (
    t === "mixed" ||
    r.includes("intentionally multi-topic") ||
    r.includes("not a single integrity cell") ||
    (r.includes("multi-topic") && r.includes("mixed"))
  ) {
    return COVERAGE_STATUS.unsupported_expected;
  }
  if (r.includes("mixed") || r.includes("multi-topic")) return COVERAGE_STATUS.unsupported_needs_content;
  if (r.includes("no mcq") || r.includes("bank items matched") || r.includes("pool rows")) return COVERAGE_STATUS.unsupported_needs_content;
  if (r.includes("not in curriculum operations") || r.includes("not listed for") || r.includes("not available for")) {
    return COVERAGE_STATUS.unsupported_needs_adapter;
  }
  if (r.includes("no adapter")) return COVERAGE_STATUS.unsupported_needs_adapter;
  return COVERAGE_STATUS.unsupported_needs_adapter;
}

/**
 * Unsupported classification bucket (matrix + optional phase4 reason)
 */
export function classifyUnsupportedBucket(row, phase4Reason) {
  const r = String(phase4Reason || "").toLowerCase();
  const topic = String(row.topic || "");

  if (row.isRuntimeSupported === false && row.isCurriculumDeclared === true) return UNSUPPORTED_CLASS.curriculum_only_not_runtime;
  if (row.isRuntimeSupported === false && !row.isCurriculumDeclared) return UNSUPPORTED_CLASS.expected_runtime_gap;

  if (topic === "mixed" || r.includes("multi-topic")) return UNSUPPORTED_CLASS.mixed_or_ui_only_topic;

  if (row.generatorBackedRaw === false) return UNSUPPORTED_CLASS.missing_generator_adapter;

  if (r.includes("no mcq-shaped english") || r.includes("no science mcq bank")) return UNSUPPORTED_CLASS.missing_question_bank;
  if (r.includes("bank items matched") || r.includes("pool rows")) return UNSUPPORTED_CLASS.missing_question_bank;

  if (r.includes("not in curriculum operations") || r.includes("not listed for") || r.includes("not available for")) {
    return UNSUPPORTED_CLASS.missing_topic_adapter;
  }
  if (r.includes("no adapter")) return UNSUPPORTED_CLASS.missing_generator_adapter;

  return UNSUPPORTED_CLASS.unknown_needs_review;
}

/**
 * @param {object} expected
 */
export function assertionTypesFromExpected(expected) {
  if (!expected || typeof expected !== "object") return [];
  return ASSERTION_FIELD_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(expected, k));
}

/**
 * Cell keys successfully exercised by matrix-smoke run (status ok).
 * @param {string} [root]
 * @returns {Promise<Set<string>>}
 */
export async function loadMatrixSmokeTouchSet(root = ROOT) {
  const p = join(root, "reports", "learning-simulator", "matrix-smoke.json");
  const touched = new Set();
  try {
    const raw = JSON.parse(await readFile(p, "utf8"));
    for (const s of raw.scenarios || []) {
      if (s.status !== "ok") continue;
      for (const c of s.cellsTouched || []) {
        if (c.cellKey) touched.add(c.cellKey);
      }
    }
  } catch {
    /* absent before first smoke run */
  }
  return touched;
}

/**
 * Whether this matrix row should receive a matrix-smoke simulation (currently: would have been **sampled**
 * before smoke — fixture-quick/deep already covered cells are skipped to avoid redundant work).
 */
export function classifyMatrixSmokeEligibility(row, unsupportedByKey, failureKeys, quickTouch, deepTouch) {
  const ck = cellKey(row);
  if (row.isRuntimeSupported === false) return { eligible: false, skipReason: "runtime_unsupported" };
  if (!SUPPORTED_SUBJECTS.includes(row.subjectCanonical)) return { eligible: false, skipReason: "subject_not_in_phase4" };
  if (row.isGeneratorBacked === false) return { eligible: false, skipReason: "unsupported_needs_generator" };
  if (String(row.topic) === "mixed") return { eligible: false, skipReason: "mixed_or_ui_only_topic" };
  if (unsupportedByKey.has(ck)) return { eligible: false, skipReason: "phase4_unsupported" };
  if (failureKeys.has(ck)) return { eligible: false, skipReason: "integrity_failure" };
  if (quickTouch.has(ck) || deepTouch.has(ck)) return { eligible: false, skipReason: "already_fixture_covered" };
  return { eligible: true };
}

/**
 * Build full catalog rows + summary counts
 */
export async function buildCoverageCatalogPayload(options = {}) {
  const root = options.root || ROOT;
  const { rows, generatedAt: matrixGeneratedAt } = await loadMatrix(root);
  const { QUICK_SCENARIOS, DEEP_SCENARIOS } = await loadFixtureScenarios(root);
  const { byKey: unsupportedByKey } = await loadPhase4UnsupportedMap(root);
  const { keys: failureKeys } = await loadPhase4FailureKeys(root);
  const matrixSmokeSet = await loadMatrixSmokeTouchSet(root);

  /** @type {Set<string>} */
  const quickTouch = new Set();
  for (const s of QUICK_SCENARIOS) {
    for (const k of scenarioTouches(s, rows)) quickTouch.add(k);
  }
  /** @type {Set<string>} */
  const deepTouch = new Set();
  for (const s of DEEP_SCENARIOS) {
    for (const k of scenarioTouches(s, rows)) deepTouch.add(k);
  }

  /** @type {object[]} */
  const catalogRows = [];
  /** @type {Record<string, number>} */
  const statusCounts = {};

  for (const row of rows) {
    const ck = cellKey(row);
    const phase4Reason = unsupportedByKey.get(ck) || null;
    const coveredByQuick = quickTouch.has(ck);
    const coveredByDeep = deepTouch.has(ck);
    const coveredByMatrixSmoke = matrixSmokeSet.has(ck);
    const coveredByFull = coveredByQuick || coveredByDeep || coveredByMatrixSmoke;
    const coveredByReportScenario = coveredByQuick;
    const coveredByBehaviorScenario = coveredByQuick;

    const inPhase4Subject = SUPPORTED_SUBJECTS.includes(row.subjectCanonical);
    const inPhase4RuntimeFilter = row.isRuntimeSupported !== false;
    const coveredByQuestionAudit = inPhase4RuntimeFilter && inPhase4Subject;

    const generatorBacked = row.isGeneratorBacked;
    const isGeneratorBackedBool =
      generatorBacked === true || generatorBacked === "inline_page" || generatorBacked === "bank";

    let coverageStatus;

    if (row.isRuntimeSupported === false) {
      coverageStatus = COVERAGE_STATUS.unsupported_expected;
    } else if (!inPhase4Subject) {
      coverageStatus = COVERAGE_STATUS.unsupported_expected;
    } else if (generatorBacked === false) {
      coverageStatus = COVERAGE_STATUS.unsupported_needs_generator;
    } else if (phase4Reason) {
      coverageStatus = phase4ReasonToCoverageStatus(phase4Reason, row.topic);
    } else if (failureKeys.has(ck)) {
      coverageStatus = COVERAGE_STATUS.uncovered;
    } else if (coveredByQuick || coveredByDeep || coveredByMatrixSmoke) {
      coverageStatus = COVERAGE_STATUS.covered;
    } else {
      coverageStatus = COVERAGE_STATUS.sampled;
    }

    statusCounts[coverageStatus] = (statusCounts[coverageStatus] || 0) + 1;

    catalogRows.push({
      cellKey: ck,
      grade: row.grade,
      subject: row.subjectCanonical,
      level: row.level,
      topic: row.topic,
      isRuntimeSupported: row.isRuntimeSupported !== false,
      isCurriculumDeclared: !!row.isCurriculumDeclared,
      isGeneratorBacked: isGeneratorBackedBool,
      generatorBackedRaw: row.isGeneratorBacked,
      coveredByQuick,
      coveredByDeep,
      coveredByMatrixSmoke,
      coveredByFull,
      coveredByQuestionAudit,
      coveredByReportScenario,
      coveredByBehaviorScenario,
      coverageStatus,
      phase4UnsupportedReason: phase4Reason,
    });
  }

  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    matrixGeneratedAt,
    versions: { catalog: "1.2.0" },
    counts: {
      matrixRows: rows.length,
      quickScenarioCount: QUICK_SCENARIOS.length,
      deepScenarioCount: DEEP_SCENARIOS.length,
      uniqueCellsTouchedQuick: quickTouch.size,
      uniqueCellsTouchedDeep: deepTouch.size,
      uniqueCellsTouchedMatrixSmoke: matrixSmokeSet.size,
      statusCounts,
    },
    rows: catalogRows,
  };
}

export function buildUnsupportedPayload(catalogPayload) {
  /** @type {Record<string, { count: number, examples: object[] }>} */
  const byClass = {};
  for (const k of Object.values(UNSUPPORTED_CLASS)) {
    byClass[k] = { count: 0, examples: [] };
  }

  const needsAttention = [];

  for (const row of catalogPayload.rows) {
    const st = row.coverageStatus;
    const attention =
      st === COVERAGE_STATUS.uncovered ||
      st === COVERAGE_STATUS.unsupported_expected ||
      String(st || "").startsWith("unsupported_needs");

    if (!attention) continue;

    const bucket = classifyUnsupportedBucket(
      {
        grade: row.grade,
        topic: row.topic,
        isRuntimeSupported: row.isRuntimeSupported,
        isCurriculumDeclared: row.isCurriculumDeclared,
        generatorBackedRaw: row.generatorBackedRaw,
      },
      row.phase4UnsupportedReason
    );

    const entry = {
      cellKey: row.cellKey,
      grade: row.grade,
      subject: row.subject,
      level: row.level,
      topic: row.topic,
      coverageStatus: row.coverageStatus,
      unsupportedClassification: bucket,
      phase4UnsupportedReason: row.phase4UnsupportedReason,
    };

    needsAttention.push(entry);
    byClass[bucket].count += 1;
    if (byClass[bucket].examples.length < 8) byClass[bucket].examples.push(entry);
  }

  const unknownCount = needsAttention.filter((x) => x.unsupportedClassification === UNSUPPORTED_CLASS.unknown_needs_review).length;
  const uncoveredCount = catalogPayload.rows.filter((r) => r.coverageStatus === COVERAGE_STATUS.uncovered).length;

  return {
    generatedAt: new Date().toISOString(),
    versions: { unsupported: "1.0.0" },
    counts: {
      needsAttentionTotal: needsAttention.length,
      uncoveredCoverageStatus: uncoveredCount,
      unknownClassification: unknownCount,
      byClassification: Object.fromEntries(Object.entries(byClass).map(([k, v]) => [k, v.count])),
    },
    cells: needsAttention.sort((a, b) => a.cellKey.localeCompare(b.cellKey)),
    byClassification: byClass,
  };
}

const MATRIX_SMOKE_ASSERTION_TYPES = ["matrix_smoke", "storage_pipeline", "no_crash"];

const CRITICAL_DEEP_SCENARIO_TYPES = [
  "critical_matrix_deep",
  "report_build",
  "behavior_summary",
  "storage_pipeline",
  "no_crash",
];

const PROFILE_STRESS_SCENARIO_TYPES = [
  "profile_stress",
  "pace_profile_oracle",
  "report_build",
  "behavior_summary",
  "storage_pipeline",
  "no_crash",
  "profile_behavior_contract",
];

export async function buildScenarioCoveragePayload(options = {}) {
  const root = options.root || ROOT;
  const { rows } = await loadMatrix(root);
  const { QUICK_SCENARIOS, DEEP_SCENARIOS } = await loadFixtureScenarios(root);

  /** @type {object[]} */
  const scenariosOut = [];

  function pushScenario(s, tierLabel) {
    const touched = [...scenarioTouches(s, rows)].sort();
    const topics = new Set();
    for (const ref of s.matrixCoverageRefs || []) {
      if (ref?.topic) topics.add(ref.topic);
    }
    for (const ref of s.topicTargets || []) {
      if (ref?.topic) topics.add(ref.topic);
    }
    scenariosOut.push({
      scenarioId: s.scenarioId,
      mode: s.mode,
      tier: s.tier,
      suite: tierLabel,
      profile: s.profileRef,
      grade: s.grade,
      subjects: s.subjects || [],
      levels: s.levels || [],
      topics: [...topics].sort(),
      timeHorizonDays: s.timeHorizonDays,
      matrixCellsTouched: touched,
      matrixCellsTouchedCount: touched.length,
      assertionTypes: assertionTypesFromExpected(s.expected),
    });
  }

  for (const s of QUICK_SCENARIOS) pushScenario(s, "quick_fixtures");
  for (const s of DEEP_SCENARIOS) pushScenario(s, "deep_fixtures");

  try {
    const smokePath = join(root, "reports", "learning-simulator", "matrix-smoke.json");
    const smokeRaw = JSON.parse(await readFile(smokePath, "utf8"));
    for (const s of smokeRaw.scenarios || []) {
      const touched = (s.matrixCellsTouched || (s.cellsTouched || []).map((c) => c.cellKey) || []).slice().sort();
      const topics = new Set(s.topics || []);
      scenariosOut.push({
        scenarioId: s.scenarioId,
        mode: s.mode || "aggregate",
        tier: s.tier || "quick",
        suite: "matrix_smoke",
        profile: s.profileRef || "p_strong_all_subjects",
        grade: s.grade,
        subjects: s.subjects || (s.subject ? [s.subject] : []),
        levels: s.levels || [],
        topics: topics.size ? [...topics].sort() : [],
        timeHorizonDays: s.timeHorizonDays ?? 7,
        matrixCellsTouched: touched,
        matrixCellsTouchedCount: touched.length,
        assertionTypes: MATRIX_SMOKE_ASSERTION_TYPES,
        matrixSmokeStatus: s.status,
      });
    }
  } catch {
    /* matrix-smoke.json optional until runner executes */
  }

  try {
    const critPath = join(root, "reports", "learning-simulator", "critical-matrix-deep.json");
    const critRaw = JSON.parse(await readFile(critPath, "utf8"));
    for (const s of critRaw.scenarios || []) {
      const touched = (s.cellsTouched || []).slice().sort();
      scenariosOut.push({
        scenarioId: s.scenarioId,
        mode: "aggregate",
        tier: "quick",
        suite: "critical_matrix_deep",
        profile: s.profileType || "synthetic",
        grade: s.grade,
        subjects: s.subject ? [s.subject] : [],
        levels: s.levels || [],
        topics: s.topics || [],
        timeHorizonDays: 14,
        matrixCellsTouched: touched,
        matrixCellsTouchedCount: touched.length,
        assertionTypes: CRITICAL_DEEP_SCENARIO_TYPES,
        criticalDeepStatus: s.status,
      });
    }
  } catch {
    /* optional until critical-deep runner executes */
  }

  try {
    const psPath = join(root, "reports", "learning-simulator", "profile-stress.json");
    const psRaw = JSON.parse(await readFile(psPath, "utf8"));
    for (const s of psRaw.scenarios || []) {
      const touched = (s.cellsTouched || []).slice().sort();
      const subjParts = String(s.subject || "")
        .split("+")
        .map((x) => x.trim())
        .filter(Boolean);
      scenariosOut.push({
        scenarioId: s.scenarioId,
        mode: "aggregate",
        tier: "quick",
        suite: "profile_stress",
        profile: s.profileType || "synthetic",
        grade: s.grade,
        subjects: subjParts.length ? subjParts : [],
        levels: s.levels || [],
        topics: s.topics || [],
        timeHorizonDays: 14,
        matrixCellsTouched: touched,
        matrixCellsTouchedCount: touched.length,
        assertionTypes: PROFILE_STRESS_SCENARIO_TYPES,
        profileStressStatus: s.status,
      });
    }
  } catch {
    /* optional until profile-stress runner executes */
  }

  return {
    generatedAt: new Date().toISOString(),
    versions: { scenarioCoverage: "1.3.1" },
    counts: { scenarios: scenariosOut.length },
    scenarios: scenariosOut,
  };
}

export { ROOT };
