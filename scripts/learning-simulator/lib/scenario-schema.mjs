/**
 * Learning scenario schema and validation against coverage-matrix.json.
 */

import { validateExpectedAssertions } from "./assertion-schema.mjs";

export const SCENARIO_SCHEMA_VERSION = "1.0.0";

export const MODE_ENUM = new Set(["aggregate", "deep", "generator_backed"]);
export const TIER_ENUM = new Set(["quick", "deep", "full"]);
export const TIME_HORIZON_ENUM = new Set([1, 3, 7, 30, 90]);
export const LEVEL_ENUM = new Set(["easy", "medium", "hard"]);

const GRADE_RE = /^g[1-6]$/;

/**
 * @param {Array<{ grade: string, subjectCanonical: string, level: string, topic: string }>} rows
 * @returns {{
 *   subjects: Set<string>,
 *   grades: Set<string>,
 *   tripleKey: Set<string>,
 *   quadKey: Set<string>,
 * }}
 */
export function buildMatrixIndexes(rows) {
  const subjects = new Set();
  const grades = new Set();
  const tripleKey = new Set();
  const quadKey = new Set();

  for (const r of rows || []) {
    const g = r.grade;
    const s = r.subjectCanonical;
    const l = r.level;
    const t = r.topic;
    subjects.add(s);
    grades.add(g);
    tripleKey.add(`${g}|${s}|${t}`);
    quadKey.add(`${g}|${s}|${l}|${t}`);
  }

  return { subjects, grades, tripleKey, quadKey };
}

/**
 * @param {string} grade
 * @param {{ subjectCanonical: string, topic: string, level?: string, optional?: boolean }} ref
 * @param {ReturnType<buildMatrixIndexes>} idx
 * @returns {boolean}
 */
function matrixRefMatches(grade, ref, idx) {
  if (ref.optional) return true;
  const { subjectCanonical: sub, topic, level } = ref;
  if (level) {
    return idx.quadKey.has(`${grade}|${sub}|${level}|${topic}`);
  }
  return idx.tripleKey.has(`${grade}|${sub}|${topic}`);
}

/**
 * @param {object} scenario
 * @param {{
 *   profilesById: Record<string, object>,
 *   matrixIndexes: ReturnType<buildMatrixIndexes>,
 *   matrixRowCount: number,
 * }} ctx
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateScenario(scenario, ctx) {
  const errors = [];
  const warnings = [];
  const { profilesById, matrixIndexes } = ctx;
  const id = scenario.scenarioId || "(missing scenarioId)";

  if (!scenario || typeof scenario !== "object") {
    return { ok: false, errors: ["scenario must be an object"], warnings: [] };
  }

  if (typeof scenario.scenarioId !== "string" || !scenario.scenarioId.trim()) {
    errors.push("scenario.scenarioId required");
  }

  if (!MODE_ENUM.has(scenario.mode)) {
    errors.push(`${id}: mode must be one of: ${[...MODE_ENUM].join(", ")}`);
  }

  if (!TIER_ENUM.has(scenario.tier)) {
    errors.push(`${id}: tier must be one of: ${[...TIER_ENUM].join(", ")}`);
  }

  if (typeof scenario.grade !== "string" || !GRADE_RE.test(scenario.grade)) {
    errors.push(`${id}: grade must be g1..g6`);
  } else if (!matrixIndexes.grades.has(scenario.grade)) {
    errors.push(`${id}: grade ${scenario.grade} not found in coverage matrix`);
  }

  if (!Array.isArray(scenario.subjects) || scenario.subjects.length === 0) {
    errors.push(`${id}: subjects must be a non-empty array`);
  } else {
    for (const s of scenario.subjects) {
      if (!matrixIndexes.subjects.has(s)) {
        errors.push(`${id}: subject "${s}" not in coverage matrix subject set`);
      }
    }
  }

  if (!Array.isArray(scenario.levels) || scenario.levels.length === 0) {
    errors.push(`${id}: levels must be a non-empty array`);
  } else {
    for (const l of scenario.levels) {
      if (!LEVEL_ENUM.has(l)) {
        errors.push(`${id}: invalid level "${l}"`);
      }
    }
  }

  if (!TIME_HORIZON_ENUM.has(scenario.timeHorizonDays)) {
    errors.push(`${id}: timeHorizonDays must be 1, 3, 7, 30, or 90`);
  }

  if (typeof scenario.profileRef !== "string" || !scenario.profileRef.trim()) {
    errors.push(`${id}: profileRef required`);
  } else if (!profilesById[scenario.profileRef]) {
    errors.push(`${id}: profileRef "${scenario.profileRef}" not found in profile library`);
  }

  if (scenario.sessionPlan !== undefined && (typeof scenario.sessionPlan !== "object" || Array.isArray(scenario.sessionPlan))) {
    errors.push(`${id}: sessionPlan must be a plain object`);
  }

  if (scenario.answerPolicy !== undefined && (typeof scenario.answerPolicy !== "object" || Array.isArray(scenario.answerPolicy))) {
    errors.push(`${id}: answerPolicy overrides must be a plain object`);
  }

  if (scenario.seed !== undefined && scenario.seed !== null && typeof scenario.seed !== "number" && typeof scenario.seed !== "string") {
    errors.push(`${id}: seed must be number or string if set`);
  }

  if (scenario.anchorDate !== undefined && scenario.anchorDate !== null && typeof scenario.anchorDate !== "string") {
    errors.push(`${id}: anchorDate must be ISO-like string if set`);
  }

  if (scenario.tier === "quick") {
    if (scenario.seed === undefined || scenario.seed === null) {
      errors.push(`${id}: tier quick requires deterministic seed`);
    }
    if (typeof scenario.anchorDate !== "string" || !scenario.anchorDate.trim()) {
      errors.push(`${id}: tier quick requires anchorDate string`);
    }
  }

  const assertResult = validateExpectedAssertions(scenario.expected, `${id}.expected`);
  errors.push(...assertResult.errors.map((e) => `${id}: ${e}`));
  warnings.push(...assertResult.warnings.map((w) => `${id}: ${w}`));

  const topicTargets = Array.isArray(scenario.topicTargets) ? scenario.topicTargets : [];
  for (let i = 0; i < topicTargets.length; i += 1) {
    const tt = topicTargets[i];
    if (!tt || typeof tt !== "object") {
      errors.push(`${id}: topicTargets[${i}] invalid`);
      continue;
    }
    if (typeof tt.subjectCanonical !== "string") {
      errors.push(`${id}: topicTargets[${i}].subjectCanonical required`);
    }
    if (typeof tt.topic !== "string") {
      errors.push(`${id}: topicTargets[${i}].topic required`);
    }
    const optional = tt.optional === true;
    if (!optional) {
      const ok = matrixRefMatches(scenario.grade, { subjectCanonical: tt.subjectCanonical, topic: tt.topic, level: tt.level, optional: false }, matrixIndexes);
      if (!ok) {
        errors.push(
          `${id}: topicTargets[${i}] (${scenario.grade}, ${tt.subjectCanonical}, ${tt.topic}${tt.level ? `, ${tt.level}` : ""}) not in coverage matrix`
        );
      }
    }
  }

  const matrixCoverageRefs = Array.isArray(scenario.matrixCoverageRefs) ? scenario.matrixCoverageRefs : [];
  for (let i = 0; i < matrixCoverageRefs.length; i += 1) {
    const ref = matrixCoverageRefs[i];
    if (!ref || typeof ref !== "object") {
      errors.push(`${id}: matrixCoverageRefs[${i}] invalid`);
      continue;
    }
    if (typeof ref.subjectCanonical !== "string" || typeof ref.topic !== "string") {
      errors.push(`${id}: matrixCoverageRefs[${i}] needs subjectCanonical and topic`);
      continue;
    }
    const optional = ref.optional === true;
    if (!optional) {
      const ok = matrixRefMatches(scenario.grade, { ...ref, optional: false }, matrixIndexes);
      if (!ok) {
        errors.push(
          `${id}: matrixCoverageRefs[${i}] (${scenario.grade}, ${ref.subjectCanonical}, ${ref.topic}${ref.level ? `, ${ref.level}` : ""}) not in matrix`
        );
      }
    }
  }

  if (scenario.artifactOptions !== undefined && (typeof scenario.artifactOptions !== "object" || Array.isArray(scenario.artifactOptions))) {
    errors.push(`${id}: artifactOptions must be a plain object`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * @param {object[]} scenarios
 * @param ctx
 */
export function validateAllScenarios(scenarios, ctx) {
  const errors = [];
  const warnings = [];
  for (const s of scenarios) {
    const r = validateScenario(s, ctx);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  return { ok: errors.length === 0, errors, warnings };
}
