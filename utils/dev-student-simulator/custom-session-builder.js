import { SUBJECTS, SUBJECT_BUCKETS } from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSpecSeed(spec, anchorEndMs) {
  let h = 2166136261 ^ anchorEndMs;
  const s = JSON.stringify({
    g: spec.grade,
    t: spec.customTrend,
    sc: spec.sessionsCount,
    q: spec.totalQuestions,
    sp: spec.spanDays,
  });
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function allocateTotals(targetSessions, targetQuestions, rng) {
  const out = [];
  let rem = targetQuestions;
  for (let i = 0; i < targetSessions - 1; i += 1) {
    const rest = targetSessions - i;
    const base = rem / rest;
    const jitter = 0.55 + rng() * 0.55;
    const n = Math.max(1, Math.min(42, Math.round(base * jitter)));
    out.push(n);
    rem -= n;
  }
  out.push(Math.max(1, rem));
  return out;
}

function pickWeighted(items, weights, rng) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return items[0];
  let u = rng() * sum;
  for (let i = 0; i < items.length; i += 1) {
    u -= weights[i];
    if (u <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Build day index per session so we approach target unique active days.
 */
function buildDayIndices(spanDays, sessionCount, targetActiveDays, rng) {
  const span = Math.max(1, spanDays);
  const days = [];
  for (let i = 0; i < sessionCount; i += 1) {
    days.push(Math.floor(rng() * span));
  }
  const want = Math.max(1, Math.min(targetActiveDays, span));
  let guard = 0;
  while (guard++ < 8000) {
    const u = new Set(days).size;
    if (u >= want) break;
    const idx = Math.floor(rng() * sessionCount);
    days[idx] = Math.floor(rng() * span);
  }
  return days;
}

function accuracyForTrend(spec, subjectKey, phase, baseAcc, rng) {
  const noise = (rng() - 0.5) * 0.05;
  const mr = (Number(spec.mistakeRatePct) || 0) / 100;
  const trend = spec.customTrend;
  let mult = 1;
  if (trend === "stable") mult = 1;
  else if (trend === "improving") mult = 0.88 + 0.22 * phase;
  else if (trend === "declining") mult = 1.06 - 0.24 * phase;
  else if (trend === "jump_decline") mult = phase < 0.48 ? 1.04 : 0.82 - 0.2 * ((phase - 0.48) / 0.52);
  else if (trend === "fast_inattentive") mult = subjectKey === "math" ? 0.68 + rng() * 0.06 : 0.94 + rng() * 0.04;
  else if (trend === "slow_accurate") mult = subjectKey === "math" ? 0.92 : 0.97 + rng() * 0.02;
  let acc = baseAcc * mult - mr * 0.28 + noise;
  acc = Math.min(0.985, Math.max(0.04, acc));
  return acc;
}

function levelModeForTrend(spec, subjectKey, subRow, phase, rng) {
  const trend = spec.customTrend;
  let level = subRow.level;
  let mode = subRow.mode;
  if (trend === "fast_inattentive" && subjectKey === "math") {
    mode = "speed";
    level = "medium";
  }
  if (trend === "slow_accurate" && subjectKey !== "math") {
    mode = "learning";
    level = phase > 0.55 ? "medium" : "easy";
  }
  if (trend === "jump_decline" && subjectKey === "math" && phase > 0.5) {
    level = "hard";
  }
  return { level, mode };
}

function mapResponseProfile(spec) {
  const b = spec.responseMsBehavior;
  if (b === "fast_wrong") return "fast_wrong";
  if (b === "slow_accurate") return "slow_accurate";
  if (b === "slow_wrong") return "slow_wrong";
  return "balanced";
}

/**
 * @param {object} spec — validated custom panel spec (see CustomBuilderPanel)
 * @param {number} anchorEndMs
 * @returns {Array<object>} sessions compatible with buildStorageSnapshotFromSessions
 */
export function buildSessionsFromCustomSpec(spec, anchorEndMs = Date.now()) {
  const rng = mulberry32(hashSpecSeed(spec, anchorEndMs));
  const spanDays = Math.max(1, Math.floor(Number(spec.spanDays) || 1));
  const oldest = anchorEndMs - (spanDays - 1) * DAY_MS;
  const sessionCount = Math.max(1, Math.floor(Number(spec.sessionsCount) || 1));
  const totalQ = Math.max(sessionCount, Math.floor(Number(spec.totalQuestions) || sessionCount));
  const activeDaysTarget = Math.max(1, Math.min(spanDays, Math.floor(Number(spec.activeDays) || 1)));

  const enabled = SUBJECTS.filter((id) => spec.subjects?.[id]?.enabled);
  const weights = enabled.map((id) => Math.max(0.001, Number(spec.subjects[id].weight) || 1));
  const totals = allocateTotals(sessionCount, totalQ, rng);
  const dayIndices = buildDayIndices(spanDays, sessionCount, activeDaysTarget, rng);

  const sessions = [];
  for (let i = 0; i < sessionCount; i += 1) {
    const subject = pickWeighted(enabled, weights, rng);
    const subRow = spec.subjects[subject];
    const topicList = subRow.topics;
    const bucket = topicList[Math.floor(rng() * topicList.length)];
    const dayIndex = dayIndices[i];
    const phase = Math.max(0, Math.min(1, dayIndex / Math.max(1, spanDays - 1)));
    const ts = oldest + dayIndex * DAY_MS + Math.floor(rng() * 0.75 * DAY_MS);
    const date = new Date(ts).toISOString().split("T")[0];
    const baseAcc = (Number(subRow.targetAccuracyPct) || 70) / 100;
    const acc = accuracyForTrend(spec, subject, phase, baseAcc, rng);
    const total = totals[i];
    const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
    const duration = Math.round(Number(subRow.avgSessionDurationSec) || 900);
    const { level, mode } = levelModeForTrend(spec, subject, subRow, phase, rng);
    const grade = spec.grade;
    const mistakePatternRotate = (Number(spec.repeatedMistakeStrengthPct) || 0) >= 50;
    const responseMsProfile = mapResponseProfile(spec);

    sessions.push({
      subject,
      bucket,
      timestamp: ts,
      date,
      total,
      correct,
      duration,
      grade,
      level,
      mode,
      mistakePatternRotate,
      responseMsProfile,
    });
  }

  return sessions.sort((a, b) => a.timestamp - b.timestamp);
}

export function defaultCustomSpec() {
  const allTopics = (sid) => [...(SUBJECT_BUCKETS[sid] || [])];
  const row = (enabled, topics) => ({
    enabled,
    weight: 1,
    targetAccuracyPct: 76,
    avgSessionDurationSec: 900,
    level: "medium",
    mode: "learning",
    topics: topics.length ? topics : allTopics("math"),
  });
  const today = new Date().toISOString().slice(0, 10);
  return {
    studentName: "LEOK Custom Dev Student",
    grade: "g4",
    spanDays: 95,
    activeDays: 38,
    sessionsCount: 48,
    totalQuestions: 780,
    anchorDate: today,
    useNowAsAnchor: true,
    debugShortMode: true,
    customTrend: "stable",
    mistakeRatePct: 18,
    repeatedMistakeStrengthPct: 40,
    responseMsBehavior: "balanced",
    subjects: {
      math: row(true, allTopics("math")),
      geometry: row(true, allTopics("geometry").slice(0, 4)),
      english: row(true, allTopics("english")),
      science: row(false, allTopics("science")),
      hebrew: row(true, allTopics("hebrew")),
      "moledet-geography": row(false, allTopics("moledet-geography")),
    },
  };
}

export function anchorEndMsFromSpec(spec) {
  if (spec.useNowAsAnchor) return Date.now();
  const d = String(spec.anchorDate || "").trim();
  const t = Date.parse(`${d}T23:59:59`);
  return Number.isFinite(t) ? t : Date.now();
}

/** Canonical JSON for comparing staged custom preview vs current form (stable subject key order). */
export function serializeCustomSpecForStage(spec) {
  const subjects = Object.fromEntries(SUBJECTS.map((id) => [id, spec.subjects?.[id] || {}]));
  return JSON.stringify({ ...spec, subjects });
}
