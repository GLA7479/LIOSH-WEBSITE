/**
 * Deterministic rule helpers — no I/O, no randomness.
 */
import { DIFFICULTY_ORDER } from "./adaptive-planner-contract.js";

const RISK_GUESSING = new Set(["guessing", "guess_heavy", "rapid_guessing"]);
const RISK_INCONSISTENT = new Set(["inconsistency", "inconsistent_performance", "pattern_inconsistent"]);

/** @param {unknown} v */
export function normalizeRiskFlags(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || "").toLowerCase()).filter(Boolean);
}

/** @param {unknown} v */
export function normalizeDoNotConclude(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || "").trim()).filter(Boolean);
}

/** @param {string} d */
export function normalizeDifficulty(d) {
  const x = String(d || "standard").toLowerCase();
  return DIFFICULTY_ORDER.includes(x) ? x : "standard";
}

/** One step down; floor at intro */
export function lowerDifficulty(d) {
  const cur = normalizeDifficulty(d);
  const i = DIFFICULTY_ORDER.indexOf(cur);
  if (i <= 0) return "intro";
  return DIFFICULTY_ORDER[i - 1];
}

/** One step up; cap at challenge */
export function raiseDifficulty(d) {
  const cur = normalizeDifficulty(d);
  const i = DIFFICULTY_ORDER.indexOf(cur);
  if (i < 0 || i >= DIFFICULTY_ORDER.length - 1) return "challenge";
  return DIFFICULTY_ORDER[i + 1];
}

/**
 * @param {number} mastery 0..1
 * @param {number} confidenceNumeric 0..1
 */
export function isStrongAdvanceSignal(mastery, confidenceNumeric) {
  return mastery >= 0.72 && confidenceNumeric >= 0.7;
}

/**
 * @param {number} mastery
 * @param {number} confidenceNumeric
 */
export function isStrongMaintainSignal(mastery, confidenceNumeric) {
  return mastery >= 0.55 && confidenceNumeric >= 0.55;
}

/**
 * @param {number} confidenceNumeric
 * @param {string[]} prerequisiteSkillIds
 */
export function canUsePrerequisite(confidenceNumeric, prerequisiteSkillIds) {
  return (
    confidenceNumeric >= 0.55 &&
    Array.isArray(prerequisiteSkillIds) &&
    prerequisiteSkillIds.length > 0 &&
    Boolean(String(prerequisiteSkillIds[0] || "").trim())
  );
}

/**
 * @param {string[]} flags
 */
export function hasGuessingOrInconsistency(flags) {
  for (const f of flags) {
    if (RISK_GUESSING.has(f) || RISK_INCONSISTENT.has(f)) return true;
  }
  return false;
}

/**
 * @param {string} dataQuality
 * @param {string[]} doNotConclude
 */
export function isThinOrCautioned(dataQuality, doNotConclude) {
  const dq = String(dataQuality || "").toLowerCase();
  if (dq === "thin") return true;
  if (doNotConclude.length > 0) return true;
  return false;
}
