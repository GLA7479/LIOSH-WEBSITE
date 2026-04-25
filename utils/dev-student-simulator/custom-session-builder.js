import { SUBJECTS, SUBJECT_BUCKETS, CUSTOM_APPLY_MODE } from "./constants";

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

export const DEFAULT_TOPIC_ROW = {
  enabled: false,
  targetQuestions: 0,
  targetAccuracyPct: 76,
  level: "medium",
  mode: "learning",
  avgSessionDurationSec: 900,
  topicTrend: "stable",
  repeatedMistakeStrengthPct: 40,
  responseMsBehavior: "balanced",
};

/**
 * Fills `topicSettings` from legacy `subjects[sid].topics` when missing.
 * Also syncs `sessionsCount` / `totalQuestions` from per-topic settings.
 * @param {object} spec
 * @returns {object} same reference (mutated) for convenience
 */
export function resolveCustomSpecTopicSettings(spec) {
  if (!spec || typeof spec !== "object") return spec;
  if (!spec.subjects || typeof spec.subjects !== "object") spec.subjects = {};
  if (!spec.topicSettings || typeof spec.topicSettings !== "object") {
    spec.topicSettings = {};
  }
  const ts = spec.topicSettings;
  for (const sid of SUBJECTS) {
    if (!ts[sid] || typeof ts[sid] !== "object") ts[sid] = {};
    const row = spec.subjects[sid] || {};
    const buckets = SUBJECT_BUCKETS[sid] || [];
    const topicList = Array.isArray(row.topics) ? row.topics : [];
    for (const topic of buckets) {
      if (ts[sid][topic] && typeof ts[sid][topic] === "object") continue;
      const on = row.enabled && topicList.includes(topic);
      ts[sid][topic] = {
        ...DEFAULT_TOPIC_ROW,
        enabled: on,
        targetQuestions: on ? 24 : 0,
        targetAccuracyPct: Number(row.targetAccuracyPct) || 76,
        level: row.level || "medium",
        mode: row.mode || "learning",
        avgSessionDurationSec: Number(row.avgSessionDurationSec) || 900,
        topicTrend: spec.customTrend || "stable",
        repeatedMistakeStrengthPct: Number(spec.repeatedMistakeStrengthPct) || 40,
        responseMsBehavior: spec.responseMsBehavior || "balanced",
      };
    }
  }
  for (const sid of SUBJECTS) {
    if (!spec.subjects?.[sid] || typeof spec.subjects[sid] !== "object") {
      spec.subjects = spec.subjects || {};
      spec.subjects[sid] = {
        enabled: false,
        weight: 1,
        targetAccuracyPct: 76,
        avgSessionDurationSec: 900,
        level: "medium",
        mode: "learning",
        topics: [],
      };
    }
  }
  let totalQ = 0;
  let totalS = 0;
  for (const sid of SUBJECTS) {
    for (const topic of SUBJECT_BUCKETS[sid] || []) {
      const trow = spec.topicSettings?.[sid]?.[topic];
      if (!trow || !trow.enabled) continue;
      const q = Math.max(0, Math.floor(Number(trow.targetQuestions) || 0));
      if (q <= 0) continue;
      totalQ += q;
      const sc = maxSessionsForQuestions(q);
      totalS += sc;
    }
  }
  if (totalQ > 0) {
    spec.totalQuestions = totalQ;
    spec.sessionsCount = totalS;
  } else {
    spec.totalQuestions = 0;
    spec.sessionsCount = 0;
  }
  if (!spec.customApplyMode) spec.customApplyMode = CUSTOM_APPLY_MODE.replaceSelectedTopics;
  for (const sid of SUBJECTS) {
    const enabledTopics = (SUBJECT_BUCKETS[sid] || []).filter(
      (t) =>
        spec.topicSettings?.[sid]?.[t]?.enabled &&
        Math.floor(Number(spec.topicSettings[sid][t].targetQuestions) || 0) > 0
    );
    spec.subjects[sid].topics = enabledTopics;
  }
  return spec;
}

function maxSessionsForQuestions(q) {
  const n = Math.max(1, Math.min(50, Math.ceil(q / 22)));
  return n;
}

function hashForTopicSeeding(spec, anchorEndMs, subject, topic) {
  let h = 2166136261 ^ anchorEndMs;
  const s = JSON.stringify({
    g: spec.grade,
    t: spec.customTopicOrderStamp || 0,
    a: spec.anchorDate,
    b: spec.studentName,
    sub: subject,
    top: topic,
  });
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  for (const sid of SUBJECTS) {
    for (const tk of SUBJECT_BUCKETS[sid] || []) {
      const r = spec.topicSettings?.[sid]?.[tk];
      if (r && r.enabled) {
        h = Math.imul(h ^ (0 | Number(r.targetQuestions) * 19), 16777619);
        h ^= h >>> 12;
        h ^= h >>> 1;
        h = Math.imul(h ^ 0x9e3779b9, 0x9e3779b9) >>> 0;
      }
    }
  }
  h ^= h >>> 0;
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

function buildDayIndices(spanDays, sessionCount, targetActiveDays, rng) {
  const span = Math.max(1, spanDays);
  const days = [];
  for (let i = 0; i < sessionCount; i += 1) {
    days.push(Math.floor(rng() * span));
  }
  const want = Math.max(1, Math.min(targetActiveDays, span));
  let guard = 0;
  while (guard++ < 8000) {
    if (new Set(days).size >= want) break;
    const idx = Math.floor(rng() * sessionCount);
    days[idx] = Math.floor(rng() * span);
  }
  return days;
}

function accuracyForTrend(spec, subjectKey, subRow, topicRow, phase, baseAcc, rng) {
  const trend = (topicRow && topicRow.topicTrend) || spec.customTrend;
  const noise = (rng() - 0.5) * 0.05;
  const mr = (Number(spec.mistakeRatePct) || 0) / 100;
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

function levelModeForTrend(spec, subjectKey, subRow, topicRow, phase, rng) {
  const trend = (topicRow && topicRow.topicTrend) || spec.customTrend;
  let level = topicRow?.level || subRow?.level || "medium";
  let mode = topicRow?.mode || subRow?.mode || "learning";
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

function mapResponseProfile(spec, topicRow) {
  const b = (topicRow && topicRow.responseMsBehavior) || spec.responseMsBehavior;
  if (b === "fast_wrong") return "fast_wrong";
  if (b === "slow_accurate") return "slow_accurate";
  if (b === "slow_wrong") return "slow_wrong";
  return "balanced";
}

/**
 * @returns {{ subject: string, topic: string }[]}
 */
export function listAffectedTopicUnits(spec) {
  const out = [];
  const s = spec && typeof spec === "object" ? spec : {};
  if (!s.topicSettings) return out;
  for (const sid of SUBJECTS) {
    for (const topic of SUBJECT_BUCKETS[sid] || []) {
      const trow = s.topicSettings?.[sid]?.[topic];
      if (trow?.enabled && Math.floor(Number(trow.targetQuestions) || 0) > 0) {
        out.push({ subject: sid, topic });
      }
    }
  }
  return out;
}

/**
 * @param {object} spec — resolved custom panel spec
 * @param {number} anchorEndMs
 * @param {{ simulatorRunId?: string }} [options]
 * @returns {Array<object>} sessions compatible with buildStorageSnapshotFromSessions
 */
export function buildSessionsFromCustomSpec(
  spec,
  anchorEndMs = Date.now(),
  options = {}
) {
  const runId = options.simulatorRunId || `sim-${anchorEndMs}-${Math.random().toString(36).slice(2, 10)}`;
  resolveCustomSpecTopicSettings(spec);
  const spanDays = Math.max(1, Math.floor(Number(spec.spanDays) || 1));
  const activeDaysTarget = Math.max(1, Math.min(spanDays, Math.floor(Number(spec.activeDays) || 1)));
  const oldest = anchorEndMs - (spanDays - 1) * DAY_MS;
  const sessions = [];

  for (const sid of SUBJECTS) {
    const subRow = spec.subjects?.[sid] && typeof spec.subjects[sid] === "object" ? spec.subjects[sid] : {};
    for (const topic of SUBJECT_BUCKETS[sid] || []) {
      const trow = spec.topicSettings?.[sid]?.[topic] || DEFAULT_TOPIC_ROW;
      if (!trow.enabled) continue;
      const targetQ = Math.max(0, Math.floor(Number(trow.targetQuestions) || 0));
      if (targetQ <= 0) continue;
      const rng = mulberry32(hashForTopicSeeding(spec, anchorEndMs, sid, topic));
      const sc = maxSessionsForQuestions(targetQ);
      const totals = allocateTotals(sc, targetQ, rng);
      const dayIndices = buildDayIndices(spanDays, sc, activeDaysTarget, rng);
      for (let i = 0; i < sc; i += 1) {
        const dayIndex = dayIndices[i];
        const phase = Math.max(0, Math.min(1, dayIndex / Math.max(1, spanDays - 1)));
        const ts = oldest + dayIndex * DAY_MS + Math.floor(rng() * 0.75 * DAY_MS);
        const date = new Date(ts).toISOString().split("T")[0];
        const baseAcc = (Number(trow.targetAccuracyPct) || 70) / 100;
        const acc = accuracyForTrend(spec, sid, subRow, trow, phase, baseAcc, rng);
        const total = totals[i];
        const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
        const duration = Math.round(Number(trow.avgSessionDurationSec) || 900);
        const { level, mode } = levelModeForTrend(spec, sid, subRow, trow, phase, rng);
        const grade = spec.grade;
        const mistakePatternRotate = (Number(trow.repeatedMistakeStrengthPct) || 0) >= 50;
        const responseMsProfile = mapResponseProfile(spec, trow);
        sessions.push({
          subject: sid,
          bucket: topic,
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
          simulatorRunId: runId,
        });
      }
    }
  }
  return sessions.sort((a, b) => a.timestamp - b.timestamp);
}

function emptyTopicSettingsFromBuckets() {
  const out = {};
  for (const sid of SUBJECTS) {
    out[sid] = {};
    for (const t of SUBJECT_BUCKETS[sid] || []) {
      out[sid][t] = { ...DEFAULT_TOPIC_ROW, enabled: false, targetQuestions: 0 };
    }
  }
  return out;
}

export function defaultCustomSpec() {
  const allTopics = (sid) => [...(SUBJECT_BUCKETS[sid] || [])];
  const row = (panelOpen, topics) => ({
    /** UI: section expanded. Apply selection is from topic rows only, not this flag. */
    enabled: panelOpen,
    weight: 1,
    targetAccuracyPct: 76,
    avgSessionDurationSec: 900,
    level: "medium",
    mode: "learning",
    topics: Array.isArray(topics) ? topics : [],
  });
  const today = new Date().toISOString().slice(0, 10);
  const mathB = allTopics("math");
  const topicSettings = emptyTopicSettingsFromBuckets();
  const oneTopic = mathB[0] || "addition";
  for (const t of mathB) {
    topicSettings.math[t] = { ...DEFAULT_TOPIC_ROW, enabled: false, targetQuestions: 0 };
  }
  topicSettings.math[oneTopic] = {
    ...DEFAULT_TOPIC_ROW,
    enabled: true,
    targetQuestions: 28,
    topicTrend: "stable",
  };
  const out = {
    studentName: "LEOK Custom Dev Student",
    grade: "g4",
    spanDays: 95,
    activeDays: 38,
    sessionsCount: 0,
    totalQuestions: 0,
    anchorDate: today,
    useNowAsAnchor: true,
    debugShortMode: true,
    customTrend: "stable",
    customApplyMode: CUSTOM_APPLY_MODE.replaceSelectedTopics,
    mistakeRatePct: 18,
    repeatedMistakeStrengthPct: 40,
    responseMsBehavior: "balanced",
    topicSettings,
    subjects: {
      math: row(true, [oneTopic]),
      geometry: row(false, []),
      english: row(false, []),
      science: row(false, []),
      hebrew: row(false, []),
      "moledet-geography": row(false, []),
    },
  };
  resolveCustomSpecTopicSettings(out);
  return out;
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
  const topicSettings = spec.topicSettings
    ? Object.fromEntries(
        SUBJECTS.map((sid) => {
          const m = spec.topicSettings[sid] && typeof spec.topicSettings[sid] === "object" ? spec.topicSettings[sid] : {};
          const keys = (SUBJECT_BUCKETS[sid] || []).map((tk) => [tk, m[tk] || {}]);
          return [sid, Object.fromEntries(keys)];
        })
      )
    : {};
  return JSON.stringify({ ...spec, subjects, topicSettings, customApplyMode: spec.customApplyMode || CUSTOM_APPLY_MODE.replaceSelectedTopics });
}

export function makeSimulatorRunId(anchorEndMs) {
  return `sim-${anchorEndMs || Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
