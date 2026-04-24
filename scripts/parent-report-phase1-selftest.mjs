/**
 * בדיקות עצמאיות ל־Phase 1 (ללא Jest) — הרצה: npm run test:parent-report-phase1
 * תיעוד: docs/PARENT_REPORT.md
 */
import assert from "node:assert/strict";

/** @param {string} path */
async function importUtils(path) {
  const m = await import(path);
  return m.default && typeof m.default === "object" ? m.default : m;
}

const { computeRowDiagnosticSignals } = await importUtils("../utils/parent-report-row-diagnostics.js");
const { computeRowTrend } = await importUtils("../utils/parent-report-row-trend.js");
const { computeRowBehaviorProfile } = await importUtils("../utils/parent-report-row-behavior.js");
const { validateParentReportDataIntegrity } = await importUtils("../utils/parent-report-data-integrity.js");
const { buildTopicRecommendationRecord } = await importUtils("../utils/topic-next-step-engine.js");

const endMs = Date.UTC(2026, 3, 10, 23, 59, 59);
const startMs = Date.UTC(2026, 3, 3, 0, 0, 0);

const row = {
  bucketKey: "addition",
  displayName: "חיבור",
  questions: 12,
  correct: 10,
  wrong: 2,
  accuracy: 83,
  modeKey: "learning",
  lastSessionMs: endMs - 2 * 24 * 60 * 60 * 1000,
};

const mistakesByBucket = { addition: { count: 2 } };

const signals = computeRowDiagnosticSignals("math", "addition\u0001learning", row, mistakesByBucket, endMs);
assert.ok(Array.isArray(signals.decisionTrace));
assert.ok(signals.decisionTrace.length >= 6);
assert.equal(signals.decisionTrace[0].source, "diagnostics");
assert.equal(signals.decisionTrace[0].phase, "inputs");

const sessionsCurrent = [
  { timestamp: startMs + 2 * 24 * 3600 * 1000, total: 6, correct: 5, mode: "learning" },
  { timestamp: startMs + 4 * 24 * 3600 * 1000, total: 6, correct: 5, mode: "learning" },
];
const prevSessions = [
  { timestamp: startMs - 5 * 24 * 3600 * 1000, total: 8, correct: 4, mode: "learning" },
];

const trend = computeRowTrend({
  subjectId: "math",
  topicRowKey: "addition\u0001learning",
  row,
  sessionsCurrentPeriod: sessionsCurrent,
  prevPeriodSessions: prevSessions,
  legacyProgress: { total: 0, correct: 0 },
  periodStartMs: startMs,
  periodEndMs: endMs,
  rawMistakesSubject: [],
});

assert.ok(trend.version === 1);
assert.ok(["up", "down", "flat", "unknown"].includes(trend.accuracyDirection));
assert.ok(typeof trend.summaryHe === "string" && trend.summaryHe.length > 0);
assert.ok(Number.isFinite(trend.confidence));

const rawMistakes = [
  {
    subject: "math",
    operation: "addition",
    timestamp: startMs + 3 * 24 * 3600 * 1000,
    isCorrect: false,
    responseMs: 800,
    hintUsed: true,
    retryCount: 2,
    firstTryCorrect: false,
  },
  {
    subject: "math",
    operation: "addition",
    timestamp: startMs + 3 * 24 * 3600 * 1000 + 1000,
    isCorrect: false,
    responseMs: 900,
    hintUsed: true,
    retryCount: 1,
    firstTryCorrect: false,
  },
];

const behavior = computeRowBehaviorProfile("math", "addition\u0001learning", row, rawMistakes, startMs, endMs);
assert.ok(behavior.version === 1);
assert.ok(typeof behavior.dominantType === "string");
assert.ok(Array.isArray(behavior.decisionTrace));

const integrity = validateParentReportDataIntegrity({
  trackingSnapshots: {
    math: {
      addition: {
        sessions: [{ timestamp: startMs + 24 * 3600 * 1000, total: 1, correct: 1, mode: "learning", grade: "g3", level: "easy" }],
      },
    },
  },
  rawMistakesBySubject: { math: rawMistakes },
  maps: { math: { "addition\u0001learning": { ...row, bucketKey: "addition" } } },
  dailyActivity: [{ questions: 12, date: "2026-04-05" }],
  startMs,
  endMs,
});
assert.ok(integrity.version === 1);
assert.ok(Array.isArray(integrity.issues));

const rec = buildTopicRecommendationRecord("math", "addition\u0001learning", { ...row, ...signals }, mistakesByBucket, undefined, endMs);
assert.ok(Array.isArray(rec.decisionTrace));
assert.ok(rec.decisionTrace.length >= signals.decisionTrace.length);
assert.ok(rec.recommendationDecisionTrace.length >= 1);
assert.ok(rec.trend == null || typeof rec.trend === "object");

/** Phase 1: generateParentReportV2 must not throw on corrupt mistakes / challenge JSON. */
{
  const store = new Map();
  const emptyMath = JSON.stringify({ operations: {} });
  const emptyTopics = JSON.stringify({ topics: {} });
  const emptyProgress = JSON.stringify({ progress: {} });
  for (const [k, v] of [
    ["mleo_time_tracking", emptyMath],
    ["mleo_math_master_progress", emptyProgress],
    ["mleo_geometry_time_tracking", emptyTopics],
    ["mleo_geometry_master_progress", emptyProgress],
    ["mleo_english_time_tracking", emptyTopics],
    ["mleo_english_master_progress", emptyProgress],
    ["mleo_science_time_tracking", emptyTopics],
    ["mleo_science_master_progress", emptyProgress],
    ["mleo_hebrew_time_tracking", emptyTopics],
    ["mleo_hebrew_master_progress", emptyProgress],
    ["mleo_moledet_geography_time_tracking", emptyTopics],
    ["mleo_moledet_geography_master_progress", emptyProgress],
  ]) {
    store.set(k, v);
  }
  store.set("mleo_mistakes", "NOT_VALID_JSON[[[");
  store.set("mleo_geometry_mistakes", "{}");
  store.set("mleo_english_mistakes", "null");
  store.set("mleo_science_mistakes", "[}");
  store.set("mleo_hebrew_mistakes", "");
  store.set("mleo_moledet_geography_mistakes", "42");
  store.set("mleo_daily_challenge", "[1,2,3]");
  store.set("mleo_weekly_challenge", "null");
  const prevWindow = globalThis.window;
  const prevLS = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.window = globalThis;
  try {
    const { generateParentReportV2 } = await importUtils("../utils/parent-report-v2.js");
    const report = generateParentReportV2("ResilienceQA", "week");
    assert.ok(report && typeof report === "object");
    assert.equal(report.challenges.daily.questions, 0);
    assert.equal(report.challenges.daily.correct, 0);
    assert.equal(report.challenges.weekly.current, 0);
    assert.equal(report.challenges.weekly.completed, false);
    assert.ok(Array.isArray(report.analysis.recommendations));
  } finally {
    globalThis.window = prevWindow;
    globalThis.localStorage = prevLS;
  }
}

console.log("parent-report phase1 selftest: OK");
