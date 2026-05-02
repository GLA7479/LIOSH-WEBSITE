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
const {
  computeRowTrend,
  MIN_TREND_POINTS,
  sumQuestionsCorrectForSessions,
} = await importUtils("../utils/parent-report-row-trend.js");
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

// Phase 8 hardening: missing/invalid totals are excluded; missing correct is not imputed.
{
  const agg = sumQuestionsCorrectForSessions(
    [
      { total: undefined, correct: 1 },
      { total: 0, correct: 0 },
      { total: -2, correct: 0 },
      { total: 5 }, // missing correct: whole session excluded
      { total: 4, correct: 3 }, // valid
    ],
    { total: 100, correct: 100 } // must not be used for imputation
  );
  assert.deepEqual(agg, { questions: 4, correct: 3 });
}

// Valid rows keep previous behavior.
{
  const agg = sumQuestionsCorrectForSessions(
    [
      { total: 6, correct: 5 },
      { total: 6, correct: 5 },
    ],
    { total: 0, correct: 0 }
  );
  assert.deepEqual(agg, { questions: 12, correct: 10 });
}

// Trend minimum evidence gate: insufficient valid sessions => unknown trend + insufficient marker.
{
  const trendInsufficient = computeRowTrend({
    subjectId: "math",
    topicRowKey: "addition\u0001learning",
    row,
    sessionsCurrentPeriod: [{ timestamp: startMs + 1000, total: 4, correct: 3 }],
    prevPeriodSessions: [{ timestamp: startMs - 1000, total: 4, correct: 3 }],
    legacyProgress: { total: 0, correct: 0 },
    periodStartMs: startMs,
    periodEndMs: endMs,
    rawMistakesSubject: [],
  });
  assert.equal(trendInsufficient.trendEvidenceStatus, "insufficient");
  assert.equal(trendInsufficient.accuracyDirection, "unknown");
}
assert.ok(Number(MIN_TREND_POINTS) >= 3);

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

/** Phase 8 hardening: parent-report aggregation must not create fake question/correct from malformed sessions. */
{
  const store = new Map();
  const now = Date.now();
  const mathTracking = {
    operations: {
      addition: {
        sessions: [
          { timestamp: now - 5000, total: 4, correct: 3, mode: "learning", grade: "g1", level: "easy" },
          { timestamp: now - 4000, total: 5, mode: "learning", grade: "g1", level: "easy" }, // missing correct
          { timestamp: now - 3000, mode: "learning", grade: "g1", level: "easy" }, // missing total
          { timestamp: now - 2000, total: 0, correct: 0, mode: "learning", grade: "g1", level: "easy" }, // invalid total
        ],
      },
    },
  };
  const mathProgress = {
    progress: {
      addition: { total: 500, correct: 500 },
    },
  };
  const emptyTopics = JSON.stringify({ topics: {} });
  const emptyProgress = JSON.stringify({ progress: {} });
  store.set("mleo_time_tracking", JSON.stringify(mathTracking));
  store.set("mleo_math_master_progress", JSON.stringify(mathProgress));
  for (const [k, v] of [
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
    ["mleo_mistakes", "[]"],
    ["mleo_geometry_mistakes", "[]"],
    ["mleo_english_mistakes", "[]"],
    ["mleo_science_mistakes", "[]"],
    ["mleo_hebrew_mistakes", "[]"],
    ["mleo_moledet_geography_mistakes", "[]"],
  ]) {
    store.set(k, v);
  }
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
    const report = generateParentReportV2("AccuracyGuardQA", "week");
    assert.equal(report.summary.mathQuestions, 4);
    assert.equal(report.summary.mathCorrect, 3);
    assert.equal(report.summary.mathAccuracy, 75);
  } finally {
    globalThis.window = prevWindow;
    globalThis.localStorage = prevLS;
  }
}

/** Phase 1 diagnostic evidence cards + deterministic strength body (no engine rebuild). */
{
  const {
    buildDiagnosticCardsForSubjectForTests,
    v2PositiveStrengthBodyFromUnitForTests,
    collectDiagnosticEvidenceLinesForTests,
    generateParentReportV2,
  } = await importUtils("../utils/parent-report-v2.js");

  const minimalStrengthUnit = {
    unitKey: "math::addition|learning",
    topicRowKey: "addition\u0001learning",
    subjectId: "math",
    bucketKey: "addition",
    displayName: "חיבור",
    evidenceTrace: [
      { type: "volume", value: { questions: 14, accuracy: 86, correct: 12, wrong: 2 } },
    ],
    taxonomy: { id: "tax_demo", patternHe: "דפוס הדגמה" },
    diagnosis: { allowed: true, lineHe: "שורת אבחון" },
    confidence: { level: "medium" },
    priority: { level: "P3" },
    canonicalState: { assessment: { confidenceLevel: "medium" } },
  };
  const rowForUnit = {
    trend: { summaryHe: "מגמה יציבה בטווח" },
    decisionTrace: [{ detailHe: "חישוב יציבות: ערכים בטווח תקין" }],
    contractsV1: {
      evidence: { evidenceStrength: "medium", evidenceBand: "E2", questionCount: 14, accuracyPct: 86 },
    },
    _feedback: "improved",
    _priorityScore: 4,
  };
  const cards = buildDiagnosticCardsForSubjectForTests("math", [minimalStrengthUnit], {
    "addition\u0001learning": rowForUnit,
  });
  assert.equal(cards.length, 1);
  assert.ok(cards[0].evidence.length >= 1, "each card must include ≥1 evidence line");
  for (const line of cards[0].evidence) {
    const s = String(line);
    assert.ok(!/\b[a-z][a-z0-9_]{14,}\b/.test(s), "no long raw engine tokens in parent lines");
  }

  const body = v2PositiveStrengthBodyFromUnitForTests(minimalStrengthUnit);
  const genericOnly = "ביצועים גבוהים ועקביים — נראה שליטה טובה בנושא.";
  assert.ok(body.includes("14") && body.includes("86"), "strength body uses trace numbers when present");
  assert.notEqual(body.trim(), genericOnly.trim());

  const linesBare = collectDiagnosticEvidenceLinesForTests(
    { evidenceTrace: [], displayName: "ריק", bucketKey: "x", taxonomy: null },
    {}
  );
  assert.ok(linesBare.length >= 1);
  assert.ok(String(linesBare[0]).includes("מידע מועט"), "weak data uses cautious insufficient-data line");

  const store = new Map();
  const now = Date.now();
  store.set(
    "mleo_time_tracking",
    JSON.stringify({
      operations: {
        addition: {
          sessions: [
            {
              timestamp: now - 2 * 24 * 3600 * 1000,
              total: 14,
              correct: 12,
              mode: "learning",
              grade: "g3",
              level: "easy",
            },
          ],
        },
      },
    })
  );
  store.set("mleo_math_master_progress", JSON.stringify({ progress: {} }));
  const emptyTopics = JSON.stringify({ topics: {} });
  const emptyProgress = JSON.stringify({ progress: {} });
  for (const [k, v] of [
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
  for (const k of [
    "mleo_mistakes",
    "mleo_geometry_mistakes",
    "mleo_english_mistakes",
    "mleo_science_mistakes",
    "mleo_hebrew_mistakes",
    "mleo_moledet_geography_mistakes",
  ]) {
    store.set(k, "[]");
  }
  store.set("mleo_daily_challenge", "{}");
  store.set("mleo_weekly_challenge", "{}");
  const prevWindow = globalThis.window;
  const prevLS = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  globalThis.window = globalThis;
  try {
    const report = generateParentReportV2("DiagCardsQA", "week");
    assert.ok(report.patternDiagnostics?.version === 2);
    const mathCards = report.patternDiagnostics?.subjects?.math?.diagnosticCards;
    assert.ok(Array.isArray(mathCards) && mathCards.length >= 1, "V2 report exposes diagnosticCards when units exist");
    for (const c of mathCards) {
      assert.ok(Array.isArray(c.evidence) && c.evidence.length >= 1);
    }
  } finally {
    globalThis.window = prevWindow;
    globalThis.localStorage = prevLS;
  }
}

/** Phase 2: diagnosticOverviewHe post-V2 pass (priority order, no raw tokens in parent strings). */
{
  const { buildDiagnosticOverviewHeV2ForTests } = await importUtils("../utils/parent-report-v2.js");

  const fallback = {
    mainFocusAreaLineHe: "חשבון: נושא מהרשימה הישנה",
    strongestAreaLineHe: "עברית: חוזק ישן",
    readyForProgressPreviewHe: ["מדעים: ישן"],
    requiresAttentionPreviewHe: ["גאומטריה: ישן"],
  };

  const v2out = buildDiagnosticOverviewHeV2ForTests({
    diagnosticEngineV2: {
      units: [
        {
          subjectId: "math",
          displayName: "נושא ראשון במפה",
          topicRowKey: "k1",
          priority: { level: "P1" },
          diagnosis: { allowed: true, lineHe: "אבחון א׳" },
          evidenceTrace: [{ type: "volume", value: { questions: 5, accuracy: 50 } }],
          taxonomy: { patternHe: "רקע P1" },
          canonicalState: {
            evidence: { positiveAuthorityLevel: "none" },
            actionState: "withhold",
            assessment: {},
          },
        },
        {
          subjectId: "geometry",
          displayName: "נושא דחיפות",
          topicRowKey: "k2",
          priority: { level: "P4" },
          diagnosis: { allowed: true, lineHe: "אבחון ב׳" },
          evidenceTrace: [{ type: "volume", value: { questions: 12, accuracy: 62 } }],
          taxonomy: { patternHe: "דפוס עומק מהמנוע" },
          canonicalState: {
            evidence: { positiveAuthorityLevel: "good" },
            actionState: "maintain",
            assessment: {},
          },
        },
      ],
    },
    patternDiagnostics: { version: 2, subjects: {} },
    maps: {},
    fallbackOverview: fallback,
    insufficientDataSubjectsHe: [],
  });

  assert.ok(
    String(v2out.mainFocusAreaLineHe || "").includes("דפוס עומק") ||
      String(v2out.mainFocusAreaLineHe || "").includes("נושא דחיפות"),
    "main focus follows higher-priority V2 unit, not fallback map-order line"
  );
  assert.notEqual(String(v2out.mainFocusAreaLineHe || "").trim(), String(fallback.mainFocusAreaLineHe).trim());

  const txt = [
    v2out.mainFocusAreaLineHe,
    v2out.strongestAreaLineHe,
    ...(v2out.readyForProgressPreviewHe || []),
    ...(v2out.requiresAttentionPreviewHe || []),
  ]
    .filter(Boolean)
    .join(" ");
  assert.ok(!/\bP[1-4]\b/.test(txt), "no raw priority codes in overview text");
  assert.ok(!/::/.test(txt));
  assert.ok(!/\bdc:/i.test(txt));

  const noUnits = buildDiagnosticOverviewHeV2ForTests({
    diagnosticEngineV2: { units: [] },
    patternDiagnostics: null,
    maps: {},
    fallbackOverview: fallback,
    insufficientDataSubjectsHe: ["חשבון: מעט נתונים"],
  });
  assert.equal(noUnits.mainFocusAreaLineHe, fallback.mainFocusAreaLineHe);
  assert.deepEqual(noUnits.requiresAttentionPreviewHe, fallback.requiresAttentionPreviewHe);
  assert.deepEqual(noUnits.insufficientDataSubjectsHe, ["חשבון: מעט נתונים"]);

  const noAttentionSignal = buildDiagnosticOverviewHeV2ForTests({
    diagnosticEngineV2: {
      units: [
        {
          subjectId: "math",
          displayName: "נושא חזק בלבד",
          evidenceTrace: [{ type: "volume", value: { questions: 20, accuracy: 95 } }],
          diagnosis: { allowed: false },
          recurrence: { wrongCountForRules: 0 },
          canonicalState: {
            evidence: { positiveAuthorityLevel: "excellent" },
            actionState: "maintain",
            assessment: {},
          },
        },
      ],
    },
    patternDiagnostics: { version: 2, subjects: {} },
    maps: {},
    fallbackOverview: {
      mainFocusAreaLineHe: "מיקוד שמגיע מרשימת needsPractice",
      strongestAreaLineHe: "חוזק שמור",
      readyForProgressPreviewHe: [],
      requiresAttentionPreviewHe: ["מעקב משני א׳", "מעקב משני ב׳"],
    },
    insufficientDataSubjectsHe: [],
  });
  assert.equal(
    noAttentionSignal.mainFocusAreaLineHe,
    "מיקוד שמגיע מרשימת needsPractice",
    "no P/diagnosis/wrongs: main focus must not pick an arbitrary V2 unit"
  );
  assert.ok(
    !String(noAttentionSignal.mainFocusAreaLineHe || "").includes("נושא חזק בלבד"),
    "main focus must not be built from a non-attention V2 unit displayName"
  );
  assert.equal(noAttentionSignal.requiresAttentionPreviewHe[0], "מעקב משני א׳");
  assert.equal(noAttentionSignal.requiresAttentionPreviewHe[1], "מעקב משני ב׳");
}

// Fast Educational Diagnosis (deterministic): stages, probes, parent-safe copy.
{
  const { runFastDiagnosisForUnitForTests } = await importUtils("../utils/fast-diagnostic-engine/index.js");
  const { inferNormalizedTags } = await importUtils("../utils/fast-diagnostic-engine/infer-tags.js");

  const unitBase = {
    subjectId: "math",
    bucketKey: "fractions",
    displayName: "שברים",
  };

  /** @param {unknown[]} events @param {object} fd */
  function assertTagsDerivedFromEvents(events, subjectId, fd) {
    const wrongs = events.filter((e) => e && !e.isCorrect);
    /** @type {Set<string>} */
    const union = new Set();
    for (const e of wrongs) {
      for (const t of inferNormalizedTags(/** @type {Record<string, unknown>} */ (e), subjectId)) {
        union.add(t);
      }
    }
    for (const t of fd.suspectedErrorTags) {
      assert.ok(union.has(t), `suspectedErrorTags must be derivable from mistake fields: unexpected "${t}"`);
    }
  }

  /** @param {string} s */
  function assertParentHebrewSafe(s) {
    assert.ok(typeof s === "string");
    assert.ok(!/\bfd_/i.test(s), "parent-facing text must not expose hypothesis ids");
    assert.ok(!/::/.test(s));
    assert.ok(!/\bP[1-4]\b/.test(s));
  }

  const misconceptionWrong = {
    isCorrect: false,
    patternFamily: "fraction_add_same_denominator",
  };

  const fdEarly = runFastDiagnosisForUnitForTests({
    unit: unitBase,
    events: [misconceptionWrong],
    row: { questions: 8 },
  });
  assert.equal(fdEarly.diagnosisStage, "early_signal");
  assert.ok(fdEarly.suspectedErrorTags.includes("repeated_misconception") || fdEarly.suspectedErrorTags.includes("adds_denominators_directly"));
  assert.ok(fdEarly.nextProbe && typeof fdEarly.nextProbe.reasonHe === "string" && fdEarly.nextProbe.reasonHe.length > 0);
  assertTagsDerivedFromEvents([misconceptionWrong], "math", fdEarly);
  assertParentHebrewSafe(fdEarly.parentSafeTextHe);
  assertParentHebrewSafe(fdEarly.hypothesisHe);

  const repeatWrong = Array.from({ length: 4 }, () => ({
    isCorrect: false,
    patternFamily: "fraction_add_same_denominator",
  }));
  const fdWork = runFastDiagnosisForUnitForTests({
    unit: unitBase,
    events: repeatWrong,
    row: { questions: 12 },
  });
  assert.equal(fdWork.diagnosisStage, "working_hypothesis");
  assert.ok(fdWork.suspectedErrorTags.length > 0);
  assertTagsDerivedFromEvents(repeatWrong, "math", fdWork);

  const manyWrong = Array.from({ length: 8 }, () => ({
    isCorrect: false,
    patternFamily: "fraction_add_same_denominator",
  }));
  const fdStable = runFastDiagnosisForUnitForTests({
    unit: unitBase,
    events: manyWrong,
    row: { questions: 20 },
  });
  assert.equal(fdStable.diagnosisStage, "stable_diagnosis");
  assertTagsDerivedFromEvents(manyWrong, "math", fdStable);

  const fdThin = runFastDiagnosisForUnitForTests({
    unit: unitBase,
    events: [
      { isCorrect: false },
      { isCorrect: false },
    ],
    row: { questions: 4 },
  });
  assert.equal(fdThin.diagnosisStage, "insufficient_signal");
  assert.ok(fdThin.nextProbe?.reasonHe && fdThin.nextProbe.reasonHe.length > 0, "insufficient_signal still gets nextProbe");
  assertParentHebrewSafe(fdThin.parentSafeTextHe);
}

console.log("parent-report phase1 selftest: OK");
