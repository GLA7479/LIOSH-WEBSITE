/**
 * Skill-level mastery estimation (educational; not medical/clinical).
 */

import { SKILL_RESOLVER_BY_SUBJECT_ID } from "./diagnostic-framework-v1.js";
import { splitTopicRowKey } from "../parent-report-row-diagnostics.js";

export const MASTERY_ENGINE_V1 = "1.0.0";

const BANDS = ["unknown", "emerging", "developing", "near_mastery", "mastered", "retention_risk"];

/** @param {number} acc */
function bandFromAccuracy(acc, q, difficultySpread) {
  if (q <= 0) return "unknown";
  if (q < 5) return "emerging";
  const d = difficultySpread || 1;
  let score = acc;
  if (q < 12) score *= 0.85;
  if (d < 2) score *= 0.9;
  if (score >= 88 && q >= 25 && d >= 2) return "mastered";
  if (score >= 80 && q >= 15) return "near_mastery";
  if (score >= 65) return "developing";
  return "emerging";
}

const RETENTION_MS = 21 * 24 * 3600 * 1000;

/**
 * @param {Record<string, Record<string, unknown>>} maps
 * @param {Record<string, unknown>} summaryCounts
 */
export function computeMasteryRollupV1(maps, summaryCounts = {}) {
  /** @type {object[]} */
  const rows = [];
  const subs = ["math", "hebrew", "english", "science", "geometry", "moledet-geography"];

  for (const subjectId of subs) {
    const topicMap = maps?.[subjectId];
    if (!topicMap || typeof topicMap !== "object") continue;
    const resolver = SKILL_RESOLVER_BY_SUBJECT_ID[subjectId];
    if (!resolver) continue;

    /** @type {Record<string, { q: number, correct: number, lastMs: number, accSum: number }>} */
    const bySkill = {};

    for (const [rowKey, row] of Object.entries(topicMap)) {
      if (!row || typeof row !== "object") continue;
      const q = Number(row.questions) || 0;
      if (q <= 0) continue;
      const { bucketKey } = splitTopicRowKey(rowKey);
      const skillId = resolver(bucketKey);
      const correct = Number(row.correct) || 0;
      const acc = Number(row.accuracy);
      const lastMs = Number(row.lastSessionMs) || 0;
      if (!bySkill[skillId]) bySkill[skillId] = { q: 0, correct: 0, lastMs: 0, accSum: 0, n: 0 };
      bySkill[skillId].q += q;
      bySkill[skillId].correct += correct;
      bySkill[skillId].lastMs = Math.max(bySkill[skillId].lastMs, lastMs);
      bySkill[skillId].accSum += Number.isFinite(acc) ? acc : (correct / q) * 100;
      bySkill[skillId].n += 1;
    }

    for (const [skillId, agg] of Object.entries(bySkill)) {
      const q = agg.q;
      const acc = agg.q > 0 ? (agg.correct / agg.q) * 100 : 0;
      const recentAccuracy = agg.n > 0 ? agg.accSum / agg.n : acc;
      const difficultySpread = Math.min(3, agg.n);
      let masteryBand = bandFromAccuracy(recentAccuracy, q, difficultySpread);
      const now = Date.now();
      if (masteryBand === "mastered" || masteryBand === "near_mastery") {
        if (agg.lastMs > 0 && now - agg.lastMs > RETENTION_MS) masteryBand = "retention_risk";
      }

      let confidence = "medium";
      if (q < 8) confidence = "very_low";
      else if (q < 20) confidence = "low";
      else if (q >= 40) confidence = "high";

      let evidenceLevel = "limited";
      if (q < 5) evidenceLevel = "thin";
      else if (q >= 30) evidenceLevel = "strong";
      else if (q >= 15) evidenceLevel = "medium";

      const masteryScore = Math.max(0, Math.min(100, recentAccuracy * (0.7 + 0.1 * Math.min(difficultySpread, 3))));

      rows.push({
        subjectId,
        skillId,
        subskillId: "_rollup",
        masteryScore: Math.round(masteryScore * 10) / 10,
        masteryBand,
        confidence,
        evidenceLevel,
        questionCount: q,
        recentAccuracy: Math.round(recentAccuracy * 10) / 10,
        weightedAccuracy: Math.round(recentAccuracy * 10) / 10,
        trend: "unknown",
        consistency: agg.n >= 3 ? "moderate" : "low",
        lastPracticedAt: agg.lastMs ? new Date(agg.lastMs).toISOString() : null,
        retentionRisk: masteryBand === "retention_risk",
        recommendedState:
          masteryBand === "retention_risk"
            ? "review_and_reassess"
            : masteryBand === "mastered"
              ? "maintain_or_extend"
              : "practice_targeted",
      });
    }
  }

  return { version: MASTERY_ENGINE_V1, masteryBandsEnum: BANDS, items: rows };
}
