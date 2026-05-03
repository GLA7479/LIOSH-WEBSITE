/**
 * Data trust / effort / inconsistency signals for diagnostic confidence adjustment.
 */

import { normalizeMistakeEvent } from "../mistake-event.js";

export const RELIABILITY_ENGINE_V1 = "1.0.0";

const FAST_WRONG = 6000;
const VERY_FAST = 3500;

/**
 * @param {Record<string, Record<string, unknown>>} maps
 * @param {Record<string, unknown[]>} rawMistakesBySubject
 * @param {number} startMs
 * @param {number} endMs
 */
export function assessReliabilityV1(maps, rawMistakesBySubject, startMs, endMs) {
  let totalQ = 0;
  const subjects = Object.keys(maps || {});
  for (const sid of subjects) {
    const tm = maps[sid];
    if (!tm) continue;
    for (const row of Object.values(tm)) {
      totalQ += Number(row?.questions) || 0;
    }
  }

  let fastWrong = 0;
  let slowCorrect = 0;
  let wrongTotal = 0;
  const subs = ["math", "hebrew", "english", "science", "geometry", "moledet-geography"];
  for (const sid of subs) {
    const raw = rawMistakesBySubject?.[sid] || [];
    for (const m of raw) {
      const ev = normalizeMistakeEvent(m, sid);
      const t = Number(ev.timestamp);
      if (!Number.isFinite(t) || t < startMs || t > endMs) continue;
      const ms = Number(ev.responseMs);
      if (!ev.isCorrect) {
        wrongTotal += 1;
        if (Number.isFinite(ms) && ms < FAST_WRONG) fastWrong += 1;
        if (Number.isFinite(ms) && ms < VERY_FAST) fastWrong += 0.5;
      } else if (ev.isCorrect && Number.isFinite(ms) && ms > 40000) {
        slowCorrect += 1;
      }
    }
  }

  const guessingLikelihood = wrongTotal > 0 ? Math.min(1, fastWrong / (wrongTotal * 1.2)) : 0;
  let inconsistencyLevel = "low";
  let reliabilityScore = 70;
  if (totalQ < 12) {
    reliabilityScore -= 25;
    inconsistencyLevel = "high";
  }
  if (guessingLikelihood > 0.45) {
    reliabilityScore -= 20;
    inconsistencyLevel = "medium";
  }

  const dataTrustLevel =
    reliabilityScore >= 65 ? "moderate" : reliabilityScore >= 45 ? "low" : "very_low";

  return {
    version: RELIABILITY_ENGINE_V1,
    reliabilityScore: Math.max(0, Math.min(100, reliabilityScore)),
    dataTrustLevel,
    effortSignal: fastWrong > 3 ? "fast_attempts_observed" : "neutral",
    guessingLikelihood: Math.round(guessingLikelihood * 100) / 100,
    inconsistencyLevel,
    pacePattern: fastWrong > slowCorrect ? "fast_errors_dominate" : "mixed",
    confidenceAdjustment: guessingLikelihood > 0.35 ? -0.15 : totalQ < 12 ? -0.2 : 0,
    reasoning: [
      totalQ < 12 ? "Thin volume lowers trust in diagnostic conclusions." : "Volume supports moderate reliability.",
      slowCorrect > fastWrong
        ? "Slow correct responses are not treated as weakness signals."
        : "Review pacing signals separately from knowledge gaps.",
    ],
  };
}
