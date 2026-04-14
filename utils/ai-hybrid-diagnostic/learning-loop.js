import { STORAGE_KEYS } from "./constants.js";

function inBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * @typedef {{
 *   probeUtilityByKey: Record<string, { n: number; meanReduction: number }>,
 *   taxonomyLiftByKey: Record<string, { n: number; meanDelta: number }>,
 *   updatedAt: string
 * }} HybridLearningState
 */

/** @returns {HybridLearningState} */
export function readHybridLearningState() {
  if (!inBrowser()) return { probeUtilityByKey: {}, taxonomyLiftByKey: {}, updatedAt: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.learning);
    if (!raw) return { probeUtilityByKey: {}, taxonomyLiftByKey: {}, updatedAt: "" };
    const o = JSON.parse(raw);
    return {
      probeUtilityByKey: o?.probeUtilityByKey && typeof o.probeUtilityByKey === "object" ? o.probeUtilityByKey : {},
      taxonomyLiftByKey: o?.taxonomyLiftByKey && typeof o.taxonomyLiftByKey === "object" ? o.taxonomyLiftByKey : {},
      updatedAt: String(o?.updatedAt || ""),
    };
  } catch {
    return { probeUtilityByKey: {}, taxonomyLiftByKey: {}, updatedAt: "" };
  }
}

/**
 * @param {HybridLearningState} next
 */
export function writeHybridLearningState(next) {
  if (!inBrowser()) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.learning,
      JSON.stringify({ ...next, updatedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore */
  }
}

/**
 * Bounded prior adjustment for ranker (never overrides V2 gates).
 * @param {string} taxonomyId
 * @param {HybridLearningState} state
 * @returns {number} small boost in [-0.05, 0.05]
 */
export function taxonomyPriorBoost(taxonomyId, state) {
  if (!taxonomyId || !state?.taxonomyLiftByKey) return 0;
  const rec = state.taxonomyLiftByKey[taxonomyId];
  if (!rec || !Number.isFinite(rec.meanDelta) || !Number.isFinite(rec.n) || rec.n < 3) return 0;
  const v = Math.max(-1, Math.min(1, rec.meanDelta / 10));
  return Math.max(-0.05, Math.min(0.05, v));
}
