import { STORAGE_KEYS } from "./constants.js";

function inBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * @returns {"off"|"shadow"|"live"}
 */
export function getAiHybridRolloutStage() {
  if (inBrowser()) {
    try {
      const o = window.localStorage.getItem(STORAGE_KEYS.rolloutOverride);
      if (o === "off" || o === "shadow" || o === "live") return o;
    } catch {
      /* ignore */
    }
  }
  if (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_AI_HYBRID_ROLLOUT) {
    const v = String(process.env.NEXT_PUBLIC_AI_HYBRID_ROLLOUT);
    if (v === "off" || v === "shadow" || v === "live") return v;
  }
  return "shadow";
}

/**
 * @returns {boolean}
 */
export function isAiHybridLiveUi() {
  return getAiHybridRolloutStage() === "live";
}
