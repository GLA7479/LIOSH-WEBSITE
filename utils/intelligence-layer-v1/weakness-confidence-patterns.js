/**
 * Intelligence layer v1 — read-only aggregation of existing signals.
 * No decisions, no Hebrew, no UI. Does not modify or replace canonicalState.
 */

export const INTELLIGENCE_V1_VERSION = "1.0.0";

/** Minimum answered questions on the row to allow non-none weakness (fail-closed). */
const MIN_QUESTIONS_FOR_WEAKNESS = 4;

/** Minimum wrong events (rules count) for "stable" weakness (with recurrence). */
const MIN_WRONG_FOR_STABLE_WEAKNESS = 3;

/** Minimum questions for "stable" weakness (with recurrence). */
const MIN_QUESTIONS_FOR_STABLE_WEAKNESS = 8;

/** Below this question count, confidence band is capped to low. */
const MIN_QUESTIONS_FOR_MEDIUM_CONFIDENCE = 4;

/** Below this question count, high confidence from DE is downgraded to medium. */
const MIN_QUESTIONS_FOR_HIGH_CONFIDENCE = 8;

/**
 * Pure deterministic read-only summary.
 *
 * @param {object} p
 * @param {Record<string, unknown>|null|undefined} p.row — enriched report row (same as maps[subjectId][topicRowKey])
 * @param {object[]} p.mistakes — normalized mistake events for this row/window (caller filters)
 * @param {object|null|undefined} p.unit — diagnosticEngineV2 unit (includes recurrence, confidence, classification, taxonomy, canonicalState)
 * @returns {{
 *   version: string,
 *   weakness: { level: "none"|"tentative"|"stable", rationaleCodes: string[] },
 *   confidence: { band: "low"|"medium"|"high", rationaleCodes: string[] },
 *   patterns: {
 *     taxonomyId: string|null,
 *     recurrenceFull: boolean,
 *     patternFamilies: string[],
 *     taxonomyBlocked: boolean,
 *     noPatternClaims: boolean,
 *   },
 *   gates: { canonicalWithhold: boolean, insufficientVolume: boolean },
 * }}
 */
export function buildWeaknessConfidencePatternsV1(p) {
  const row = p?.row && typeof p.row === "object" ? p.row : {};
  const mistakes = Array.isArray(p?.mistakes) ? p.mistakes : [];
  const unit = p?.unit && typeof p.unit === "object" ? p.unit : {};

  const questions = Math.max(0, Number(row.questions) || 0);
  const rowWrong = Math.max(0, Number(row.wrong) || 0);
  const wrongs = mistakes.filter((e) => e && typeof e === "object" && !e.isCorrect);
  const wrongFromEvents = wrongs.length;
  const wrongCountForRules = Math.max(
    wrongFromEvents,
    rowWrong,
    Math.max(0, Number(unit?.recurrence?.wrongCountForRules) || 0)
  );

  const recurrenceFull = !!unit?.recurrence?.full;
  const taxonomyBlocked =
    !!unit?.classification?.weakFallbackBlocked ||
    String(unit?.classification?.state || "") === "unclassified_weak_evidence";

  const cs = unit?.canonicalState && typeof unit.canonicalState === "object" ? unit.canonicalState : null;
  const actionState = String(cs?.actionState || "");
  const canonicalWithhold = actionState === "withhold";

  const counterEvidenceStrong = !!cs?.decisionInputs?.counterEvidenceStrong;
  const deConfidence = String(unit?.confidence?.level || "insufficient_data").trim();

  const insufficientVolume = questions < MIN_QUESTIONS_FOR_WEAKNESS;

  /** @type {string[]} */
  const weaknessCodes = [];
  /** @type {"none"|"tentative"|"stable"} */
  let weaknessLevel = "none";

  if (canonicalWithhold) {
    weaknessCodes.push("canonical_withhold");
    weaknessLevel = "none";
  } else if (insufficientVolume) {
    weaknessCodes.push("insufficient_volume");
    weaknessLevel = "none";
  } else if (wrongCountForRules < 1 && !row.needsPractice) {
    weaknessCodes.push("no_wrong_signal");
    weaknessLevel = "none";
  } else if (taxonomyBlocked) {
    weaknessCodes.push("taxonomy_blocked_caps_tentative");
    weaknessLevel = "tentative";
  } else if (
    recurrenceFull &&
    wrongCountForRules >= MIN_WRONG_FOR_STABLE_WEAKNESS &&
    questions >= MIN_QUESTIONS_FOR_STABLE_WEAKNESS
  ) {
    weaknessCodes.push("recurrence_and_volume");
    weaknessLevel = "stable";
  } else {
    weaknessCodes.push("wrong_without_full_recurrence_or_volume");
    weaknessLevel = "tentative";
  }

  if (weaknessLevel === "stable" && !recurrenceFull) {
    weaknessLevel = "tentative";
    weaknessCodes.push("no_recurrence_not_stable");
  }

  /** @type {string[]} */
  const confidenceCodes = [];

  /** @type {"low"|"medium"|"high"} */
  let band = "low";
  if (deConfidence === "high") {
    band = "high";
  } else if (deConfidence === "moderate") {
    band = "medium";
  } else if (
    deConfidence === "low" ||
    deConfidence === "early_signal_only" ||
    deConfidence === "insufficient_data" ||
    deConfidence === "contradictory"
  ) {
    band = "low";
  } else {
    band = "low";
    confidenceCodes.push("unknown_de_confidence_treated_low");
  }

  if (questions < MIN_QUESTIONS_FOR_MEDIUM_CONFIDENCE) {
    band = "low";
    confidenceCodes.push("low_volume_caps_low");
  } else if (questions < MIN_QUESTIONS_FOR_HIGH_CONFIDENCE && band === "high") {
    band = "medium";
    confidenceCodes.push("moderate_volume_downgrades_high");
  }

  if (deConfidence === "contradictory") {
    if (questions >= MIN_QUESTIONS_FOR_MEDIUM_CONFIDENCE) {
      if (band === "low" || band === "high") band = "medium";
    }
    confidenceCodes.push("de_contradictory");
  }

  if (counterEvidenceStrong) {
    if (questions >= MIN_QUESTIONS_FOR_MEDIUM_CONFIDENCE) {
      if (band === "low" || band === "high") band = "medium";
    }
    confidenceCodes.push("counter_evidence_strong");
  }

  const c01 = row.confidence01;
  if (c01 != null && Number.isFinite(Number(c01)) && questions >= MIN_QUESTIONS_FOR_HIGH_CONFIDENCE) {
    const x = Number(c01);
    if (x < 0.35 && band === "high") {
      band = "medium";
      confidenceCodes.push("row_confidence01_conflict");
    }
  }

  const patternFamilies = [];
  const seen = new Set();
  for (const ev of wrongs) {
    const pf = ev?.patternFamily;
    if (pf == null || String(pf).trim() === "") continue;
    const key = String(pf).trim();
    if (seen.has(key)) continue;
    seen.add(key);
    patternFamilies.push(key);
  }

  const taxonomyId =
    taxonomyBlocked || canonicalWithhold || insufficientVolume
      ? null
      : unit?.taxonomy?.id != null
        ? String(unit.taxonomy.id)
        : null;

  const noPatternClaims =
    canonicalWithhold || insufficientVolume || taxonomyBlocked;

  return {
    version: INTELLIGENCE_V1_VERSION,
    weakness: { level: weaknessLevel, rationaleCodes: weaknessCodes },
    confidence: { band, rationaleCodes: confidenceCodes },
    patterns: {
      taxonomyId,
      recurrenceFull,
      patternFamilies,
      taxonomyBlocked,
      noPatternClaims,
    },
    gates: {
      canonicalWithhold,
      insufficientVolume,
    },
  };
}
