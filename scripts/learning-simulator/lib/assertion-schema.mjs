/**
 * Expected report / diagnosis assertion shape for learning-simulator scenarios.
 * @see tests/fixtures/learning-simulator/scenarios
 */

export const ASSERTION_SCHEMA_VERSION = "1.0.0";

/** All supported top-level keys (optional in any given scenario). */
export const ASSERTION_FIELD_KEYS = [
  "mustMention",
  "mustNotMention",
  "allowedTone",
  "forbiddenTone",
  "topWeaknessExpected",
  "topStrengthExpected",
  "trendExpected",
  "evidenceLevelExpected",
  "confidenceShouldBeCautious",
  "noContradiction",
  "noGenericOnlyReport",
  "noFalseStrongConclusion",
  "noFalseWeakConclusion",
];

const TREND_ENUM = new Set(["up", "down", "flat", "insufficient", "insufficient_data", "mixed", "any"]);
const EVIDENCE_ENUM = new Set(["thin", "low", "medium", "high", "any", "insufficient"]);

/**
 * @param {unknown} v
 * @param {string} path
 * @returns {string[]}
 */
function stringOrStringArray(v, path) {
  if (v === undefined || v === null) return [];
  if (typeof v === "string") return [];
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return [];
  return [`${path} must be string or string[]`];
}

/**
 * @param {unknown} v
 * @param {string} path
 * @returns {string[]}
 */
function booleanOrUndef(v, path) {
  if (v === undefined || v === null) return [];
  if (typeof v === "boolean") return [];
  return [`${path} must be boolean`];
}

/**
 * @param {Record<string, unknown> | null | undefined} expected
 * @param {string} [basePath]
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateExpectedAssertions(expected, basePath = "expected") {
  const errors = [];
  const warnings = [];

  if (expected === undefined || expected === null) {
    return { ok: true, errors: [], warnings: [] };
  }
  if (typeof expected !== "object" || Array.isArray(expected)) {
    return { ok: false, errors: [`${basePath} must be a plain object`], warnings: [] };
  }

  for (const k of Object.keys(expected)) {
    if (!ASSERTION_FIELD_KEYS.includes(k)) {
      warnings.push(`${basePath}: unknown key "${k}" (allowed: ${ASSERTION_FIELD_KEYS.join(", ")})`);
    }
  }

  errors.push(...stringOrStringArray(expected.mustMention, `${basePath}.mustMention`));
  errors.push(...stringOrStringArray(expected.mustNotMention, `${basePath}.mustNotMention`));
  errors.push(...stringOrStringArray(expected.allowedTone, `${basePath}.allowedTone`));
  errors.push(...stringOrStringArray(expected.forbiddenTone, `${basePath}.forbiddenTone`));
  errors.push(...stringOrStringArray(expected.topWeaknessExpected, `${basePath}.topWeaknessExpected`));
  errors.push(...stringOrStringArray(expected.topStrengthExpected, `${basePath}.topStrengthExpected`));
  errors.push(...stringOrStringArray(expected.trendExpected, `${basePath}.trendExpected`));
  errors.push(...stringOrStringArray(expected.evidenceLevelExpected, `${basePath}.evidenceLevelExpected`));

  if (expected.trendExpected !== undefined && expected.trendExpected !== null) {
    const vals = Array.isArray(expected.trendExpected)
      ? expected.trendExpected
      : [expected.trendExpected];
    for (const t of vals) {
      if (typeof t === "string" && !TREND_ENUM.has(t) && !t.startsWith("regex:")) {
        warnings.push(`${basePath}.trendExpected: value "${t}" not in known enum (allowed: ${[...TREND_ENUM].join(", ")})`);
      }
    }
  }

  if (expected.evidenceLevelExpected !== undefined && expected.evidenceLevelExpected !== null) {
    const vals = Array.isArray(expected.evidenceLevelExpected)
      ? expected.evidenceLevelExpected
      : [expected.evidenceLevelExpected];
    for (const t of vals) {
      if (typeof t === "string" && !EVIDENCE_ENUM.has(t)) {
        warnings.push(`${basePath}.evidenceLevelExpected: value "${t}" not in known enum`);
      }
    }
  }

  errors.push(...booleanOrUndef(expected.confidenceShouldBeCautious, `${basePath}.confidenceShouldBeCautious`));
  errors.push(...booleanOrUndef(expected.noContradiction, `${basePath}.noContradiction`));
  errors.push(...booleanOrUndef(expected.noGenericOnlyReport, `${basePath}.noGenericOnlyReport`));
  errors.push(...booleanOrUndef(expected.noFalseStrongConclusion, `${basePath}.noFalseStrongConclusion`));
  errors.push(...booleanOrUndef(expected.noFalseWeakConclusion, `${basePath}.noFalseWeakConclusion`));

  return { ok: errors.length === 0, errors, warnings };
}
