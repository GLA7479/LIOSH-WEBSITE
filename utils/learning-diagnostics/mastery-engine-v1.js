/**
 * Skill-level mastery estimation (educational; not medical/clinical).
 */

import { SKILL_RESOLVER_BY_SUBJECT_ID } from "./diagnostic-framework-v1.js";
import { splitTopicRowKey } from "../parent-report-row-diagnostics.js";

export const MASTERY_ENGINE_V1 = "1.0.0";

const BANDS = ["unknown", "emerging", "developing", "near_mastery", "mastered", "retention_risk"];

/** @type {Record<string, number>} */
const TIER_RANK = { easy: 1, medium: 2, hard: 3 };

function rowDifficultyTier(row) {
  const raw =
    row?.difficultyTier ?? row?.matrixDifficulty ?? row?.levelTier ?? row?.difficultyBand ?? null;
  const s = String(raw || "").toLowerCase();
  if (s === "easy" || s === "low") return "easy";
  if (s === "medium") return "medium";
  if (s === "hard" || s === "high") return "hard";
  return null;
}

/**
 * @param {number} acc
 * @param {number} distinctDifficultyTiers — unique tiers observed (1=easy only … up to 3)
 * @param {boolean} easyOnly — only easy-tier rows contributed
 */
function bandFromAccuracy(acc, q, distinctDifficultyTiers, easyOnly) {
  if (q <= 0) return "unknown";
  if (q < 5) return "emerging";
  const d = Math.max(1, Math.min(3, distinctDifficultyTiers || 1));
  let score = acc;
  if (q < 12) score *= 0.85;
  if (easyOnly) score *= 0.82;
  else if (d < 2) score *= 0.9;
  const canReachMastered = !easyOnly && d >= 2 && q >= 25 && score >= 88;
  if (canReachMastered && score >= 88) return "mastered";
  if (score >= 80 && q >= 15 && !easyOnly) return "near_mastery";
  if (score >= 80 && q >= 15 && easyOnly) return "developing";
  if (score >= 65) return "developing";
  return "emerging";
}

const RETENTION_MS = 21 * 24 * 3600 * 1000;

/**
 * @param {Record<string, Record<string, unknown>>} maps
 * @param {Record<string, unknown>} summaryCounts
 * @param {object} [opts]
 * @param {Record<string, Record<string, number>>} [opts.misconceptionErrorCountsBySubjectSkill] — e.g. { math: { fractions: 4 } }
 */
export function computeMasteryRollupV1(maps, summaryCounts = {}, opts = {}) {
  const miscCounts = opts.misconceptionErrorCountsBySubjectSkill || null;

  /** @type {object[]} */
  const rows = [];
  const subs = ["math", "hebrew", "english", "science", "geometry", "moledet-geography"];

  for (const subjectId of subs) {
    const topicMap = maps?.[subjectId];
    if (!topicMap || typeof topicMap !== "object") continue;
    const resolver = SKILL_RESOLVER_BY_SUBJECT_ID[subjectId];
    if (!resolver) continue;

    /** @type {Record<string, {
     *   q: number, correct: number, lastMs: number, accSum: number, n: number,
     *   tiers: Set<string>, easyOnly: boolean, trendUp: number, trendDown: number
     * }>} */
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
      const tier = rowDifficultyTier(row);
      const trend = row.trend && typeof row.trend === "object" ? String(row.trend.accuracyDirection || "") : "";

      if (!bySkill[skillId]) {
        bySkill[skillId] = {
          q: 0,
          correct: 0,
          lastMs: 0,
          accSum: 0,
          n: 0,
          tiers: new Set(),
          easyOnly: true,
          tierKnown: false,
          trendUp: 0,
          trendDown: 0,
        };
      }
      const agg = bySkill[skillId];
      agg.q += q;
      agg.correct += correct;
      agg.lastMs = Math.max(agg.lastMs, lastMs);
      agg.accSum += Number.isFinite(acc) ? acc : (correct / q) * 100;
      agg.n += 1;
      if (tier) {
        agg.tierKnown = true;
        agg.tiers.add(tier);
        if (tier !== "easy") agg.easyOnly = false;
      } else {
        agg.easyOnly = false;
      }
      if (trend === "up") agg.trendUp += 1;
      if (trend === "down") agg.trendDown += 1;
    }

    for (const [skillId, agg] of Object.entries(bySkill)) {
      const q = agg.q;
      const acc = agg.q > 0 ? (agg.correct / agg.q) * 100 : 0;
      const recentAccuracy = agg.n > 0 ? agg.accSum / agg.n : acc;
      const distinctDifficultyTiers = agg.tiers.size >= 1 ? agg.tiers.size : Math.min(3, agg.n);
      const easyOnly = agg.tierKnown && agg.easyOnly && agg.tiers.size === 1 && [...agg.tiers][0] === "easy";

      let masteryBand = bandFromAccuracy(recentAccuracy, q, distinctDifficultyTiers, easyOnly);
      const now = Date.now();
      if ((masteryBand === "mastered" || masteryBand === "near_mastery") && agg.lastMs > 0 && now - agg.lastMs > RETENTION_MS) {
        masteryBand = "retention_risk";
      }

      const miscN = miscCounts?.[subjectId]?.[skillId] || 0;
      if (miscN >= 4 && masteryBand === "mastered") masteryBand = "near_mastery";
      if (miscN >= 6) {
        if (["mastered", "near_mastery"].includes(masteryBand)) masteryBand = "developing";
      }

      let confidence = "medium";
      if (q < 8) confidence = "very_low";
      else if (q < 20) confidence = "low";
      else if (q >= 40) confidence = "high";
      if (agg.trendUp > 0 && agg.trendDown > 0) confidence = confidence === "high" ? "medium" : "low";

      let evidenceLevel = "limited";
      if (q < 5) evidenceLevel = "thin";
      else if (q >= 30) evidenceLevel = "strong";
      else if (q >= 15) evidenceLevel = "medium";

      let masteryScore = Math.max(
        0,
        Math.min(100, recentAccuracy * (0.7 + 0.1 * Math.min(distinctDifficultyTiers, 3)))
      );
      if (easyOnly) masteryScore *= 0.88;
      if (miscN >= 4) masteryScore *= 0.9;

      let trend = "unknown";
      if (agg.trendUp > agg.trendDown) trend = "improving";
      else if (agg.trendDown > agg.trendUp) trend = "declining";

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
        trend,
        consistency: agg.n >= 3 ? "moderate" : "low",
        lastPracticedAt: agg.lastMs ? new Date(agg.lastMs).toISOString() : null,
        retentionRisk: masteryBand === "retention_risk",
        easyOnlyProfile: easyOnly,
        difficultyTiersObserved: [...agg.tiers],
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
