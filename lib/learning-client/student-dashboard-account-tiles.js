/**
 * Shared helpers for the four middle dashboard tiles (best score, best streak,
 * account accuracy, challenge server keys) across subject masters.
 */

import { isStudentIdentityDiagnosticsEnabled } from "../dev-student-identity-client.js";

/**
 * @param {unknown} derived
 * @param {string} subjectKey
 * @returns {number | null} Integer percent, or null if not available
 */
export function accountAccuracyDisplayFromDerived(derived, subjectKey) {
  const sub = derived?.bySubject?.[subjectKey];
  const raw = sub?.accuracy;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return Math.round(raw);
}

/**
 * Max best score / streak for one scoresStore bucket key and player name.
 * @param {Record<string, unknown>} saved
 * @param {string} key e.g. `${level}_${operation}`
 * @param {string} playerName
 */
export function maxBestForPlayerInKey(saved, key, playerName) {
  const trimmed = String(playerName || "").trim();
  if (!trimmed || !key || !saved || typeof saved !== "object") {
    return { maxScore: 0, maxStreak: 0 };
  }
  const bucket = saved[key];
  if (!bucket) return { maxScore: 0, maxStreak: 0 };
  if (Array.isArray(bucket)) {
    const playerScores = bucket.filter((s) => s && s.playerName === trimmed);
    if (!playerScores.length) return { maxScore: 0, maxStreak: 0 };
    return {
      maxScore: Math.max(...playerScores.map((s) => s.bestScore ?? s.score ?? 0), 0),
      maxStreak: Math.max(...playerScores.map((s) => s.bestStreak ?? s.streak ?? 0), 0),
    };
  }
  const row = bucket[trimmed];
  if (!row || typeof row !== "object") return { maxScore: 0, maxStreak: 0 };
  return {
    maxScore: Number(row.bestScore ?? row.score ?? 0) || 0,
    maxStreak: Number(row.bestStreak ?? row.streak ?? 0) || 0,
  };
}

const CHALLENGE_DEF = {
  math: {
    daily: "mathDaily",
    weekly: "mathWeekly",
    dailyFallback: "globalDaily",
    weeklyFallback: "globalWeekly",
  },
  geometry: {
    daily: "geometryDaily",
    weekly: "geometryWeekly",
    dailyFallback: "globalDaily",
    weeklyFallback: "globalWeekly",
  },
  hebrew: {
    daily: "hebrewDaily",
    weekly: "hebrewWeekly",
    dailyFallback: "globalDaily",
    weeklyFallback: "globalWeekly",
  },
  english: {
    daily: "englishDaily",
    weekly: "englishWeekly",
    dailyFallback: "globalDaily",
    weeklyFallback: "globalWeekly",
  },
  science: {
    daily: "scienceDaily",
    weekly: "scienceWeekly",
    dailyFallback: null,
    weeklyFallback: null,
  },
  moledet_geography: {
    daily: "moledetGeographyDaily",
    weekly: "moledetGeographyWeekly",
    dailyFallback: "globalDaily",
    weeklyFallback: "globalWeekly",
  },
};

/**
 * Read subject-scoped daily/weekly blobs from server challenges, with legacy fallbacks.
 * @param {Record<string, unknown> | null | undefined} challenges
 * @param {string} subjectKey
 */
export function pickSubjectChallengeBlobs(challenges, subjectKey) {
  const def = CHALLENGE_DEF[subjectKey];
  const c = challenges && typeof challenges === "object" && !Array.isArray(challenges) ? challenges : {};
  if (!def) return { daily: null, weekly: null };
  const dailyPrimary = c[def.daily];
  const daily =
    dailyPrimary && typeof dailyPrimary === "object"
      ? dailyPrimary
      : def.dailyFallback && c[def.dailyFallback] && typeof c[def.dailyFallback] === "object"
        ? c[def.dailyFallback]
        : null;
  const weeklyPrimary = c[def.weekly];
  const weekly =
    weeklyPrimary && typeof weeklyPrimary === "object"
      ? weeklyPrimary
      : def.weeklyFallback && c[def.weeklyFallback] && typeof c[def.weeklyFallback] === "object"
        ? c[def.weeklyFallback]
        : null;
  return { daily, weekly };
}

/**
 * Patch fragment for challenges (deep-merged on server) — avoids cross-subject clobbering of globalDaily/globalWeekly.
 * @param {string} subjectKey
 * @param {unknown} dailyChallenge
 * @param {unknown} weeklyChallenge
 */
export function subjectChallengePatch(subjectKey, dailyChallenge, weeklyChallenge) {
  const def = CHALLENGE_DEF[subjectKey];
  if (!def) return {};
  return {
    [def.daily]: dailyChallenge,
    [def.weekly]: weeklyChallenge,
  };
}

/**
 * @param {string} subjectKey
 * @param {Record<string, unknown>} payload
 */
export function logAccountTileSync(subjectKey, payload) {
  if (!isStudentIdentityDiagnosticsEnabled()) return;
  if (typeof console === "undefined" || typeof console.info !== "function") return;
  console.info("[liosh-account-tiles]", subjectKey, payload);
}
