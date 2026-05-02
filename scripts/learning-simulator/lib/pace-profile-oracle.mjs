/**
 * Deterministic thresholds for fast_wrong vs slow_correct pace oracle (simulator QA only).
 * Units: meanSecondsPerQuestion = sum(session.duration) / sum(session.total) across storage buckets
 * (same aggregation as behavior-oracle meanSecondsPerQuestionFromStorage).
 */
export const PACE_PROFILE_ORACLE_THRESHOLDS = {
  /** fast_wrong scenarios must have aggregate pace at or below this (lower = faster). */
  FAST_WRONG_MAX_SPQ: 118,
  /** slow_correct scenarios must have aggregate pace at or above this (higher = slower). */
  SLOW_CORRECT_MIN_SPQ: 96,
  /** Median(slow_correct SPQ) − median(fast_wrong SPQ) must be ≥ this (cohort separation). */
  MIN_COHORT_MEDIAN_SPQ_GAP: 24,
  /** Oracle/meta overall accuracy upper bound for fast_wrong (low accuracy). */
  FAST_WRONG_MAX_OVERALL_ACCURACY_PCT: 58,
  /** Oracle/meta overall accuracy lower bound for slow_correct (high accuracy). */
  SLOW_CORRECT_MIN_OVERALL_ACCURACY_PCT: 72,
  /** Minimum approximate mistake-event density for fast_wrong (mistake rows / questions). */
  FAST_WRONG_MIN_MISTAKE_RATE: 0.08,
  /** Maximum approximate mistake-event density for slow_correct. */
  SLOW_CORRECT_MAX_MISTAKE_RATE: 0.42,
};

/**
 * @param {number[]} arr
 */
export function medianNumeric(arr) {
  const a = arr.filter((x) => Number.isFinite(x)).slice().sort((x, y) => x - y);
  if (!a.length) return null;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

/**
 * @param {object} auditPayload
 * @param {string} outDir
 */
export async function writePaceProfileOracleAudit(outDir, auditPayload) {
  const { writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");

  const jsonPath = join(outDir, "pace-profile-oracle-audit.json");
  const mdPath = join(outDir, "pace-profile-oracle-audit.md");

  await writeFile(jsonPath, JSON.stringify(auditPayload, null, 2), "utf8");

  const th = auditPayload.thresholds || {};
  const fw = auditPayload.fastWrongCohort || {};
  const sc = auditPayload.slowCorrectCohort || {};
  const cohort = auditPayload.cohortAssertions || {};

  const md = [
    "# Pace profile oracle audit (simulator)",
    "",
    `- Generated at: ${auditPayload.generatedAt || ""}`,
    `- Source run id: ${auditPayload.sourceRunId || ""}`,
    "",
    "## How profiles are simulated",
    "",
    ...(auditPayload.simulationNotes || []),
    "",
    "## Evidence fields",
    "",
    ...(auditPayload.evidenceFields || []),
    "",
    "## Deterministic thresholds",
    "",
    "```json",
    JSON.stringify(th, null, 2),
    "```",
    "",
    "## Latest cohort statistics",
    "",
    `| Metric | fast_wrong | slow_correct |`,
    `| --- | ---: | ---: |`,
    `| Count | ${fw.n ?? "—"} | ${sc.n ?? "—"} |`,
    `| Median SPQ | ${fw.medianSpq ?? "—"} | ${sc.medianSpq ?? "—"} |`,
    `| Mean SPQ | ${fw.meanSpq ?? "—"} | ${sc.meanSpq ?? "—"} |`,
    `| Mean accuracy % | ${fw.meanAccuracyPct ?? "—"} | ${sc.meanAccuracyPct ?? "—"} |`,
    "",
    "### Cohort separation",
    "",
    `- Median SPQ gap (slow − fast): **${cohort.medianSpqGap ?? "—"}** (min required: **${th.MIN_COHORT_MEDIAN_SPQ_GAP ?? "—"}**)`,
    `- pace_accuracy_separation_ok (cohort): **${cohort.pace_accuracy_separation_ok === true ? "PASS" : cohort.pace_accuracy_separation_ok === false ? "FAIL" : "—"}**`,
    "",
    "## Oracle weaknesses addressed",
    "",
    ...(auditPayload.weaknessesAddressed || []),
    "",
    "## Recommended next steps",
    "",
    ...(auditPayload.recommendedNext || []),
    "",
    `JSON: \`${jsonPath.replace(/\\/g, "/")}\``,
    "",
  ].join("\n");

  await writeFile(mdPath, md, "utf8");
}
