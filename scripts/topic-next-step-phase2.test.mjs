/**
 * Phase 2 — בדיקות מנוע המלצות (הרצה: npm run test:topic-next-step-phase2)
 * תיעוד: docs/PARENT_REPORT.md
 */
import assert from "node:assert/strict";

async function importEngine() {
  const m = await import("../utils/topic-next-step-engine.js");
  return m.default && typeof m.default === "object" ? m.default : m;
}

const { decideTopicNextStep, DEFAULT_TOPIC_NEXT_STEP_CONFIG } = await importEngine();
const { buildPracticeCalibration, buildPhase9RecommendationOverlay } = await import("../utils/topic-next-step-phase2.js");

function trendBase(overrides = {}) {
  return {
    version: 1,
    accuracyDirection: "flat",
    fluencyDirection: "flat",
    independenceDirection: "flat",
    confidence: 0.55,
    summaryHe: "",
    windows: {
      currentPeriod: { accuracy: 85, questions: 20 },
      previousComparablePeriod: { accuracy: 82, questions: 18 },
      recentShortWindow: { accuracy: 84, questions: 8 },
      lastSessionsInRow: { accuracy: 86, questions: 6 },
    },
    ...overrides,
  };
}

function behaviorBase(type, extra = {}) {
  return {
    version: 1,
    dominantType: type,
    strength01: 0.7,
    signals: {
      hintRate: 0.1,
      hintKnownCount: 4,
      wrongEventCount: 2,
      ...extra.signals,
    },
    summaryHe: "",
    decisionTrace: [],
    ...extra,
  };
}

/** שורה מינימלית + שדות דיאגנוסטיקה לטסט ישיר של decideTopicNextStep */
function rowAug(p) {
  const q = p.questions ?? 20;
  const acc = p.accuracy ?? 88;
  const wrong = p.wrong ?? Math.max(0, q - Math.round((q * acc) / 100));
  return {
    displayName: p.displayName || "נושא",
    bucketKey: p.bucketKey || "topic_a",
    modeKey: p.modeKey ?? "learning",
    questions: q,
    correct: q - wrong,
    wrong,
    accuracy: acc,
    gradeKey: p.gradeKey ?? "g3",
    levelKey: p.levelKey ?? "medium",
    grade: p.grade ?? "g3",
    level: p.level ?? "בינוני",
    recencyScore: p.recencyScore ?? 50,
    dataSufficiencyLevel: p.dataSufficiencyLevel ?? "strong",
    evidenceStrength: p.evidenceStrength ?? "strong",
    isEarlySignalOnly: p.isEarlySignalOnly ?? false,
    suppressAggressiveStep: p.suppressAggressiveStep ?? false,
    trend: p.trend ?? null,
    behaviorProfile: p.behaviorProfile ?? null,
    ...p.extra,
  };
}

function assertStep(name, row, mC, expectedStep, forbiddenSteps = []) {
  const d = decideTopicNextStep(row, mC, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.equal(
    d.step,
    expectedStep,
    `${name}: expected ${expectedStep}, got ${d.step} (risk ${JSON.stringify(d.riskFlags)})`
  );
  for (const f of forbiddenSteps) {
    assert.notEqual(d.step, f, `${name}: should not be ${f}`);
  }
}

// 1) דיוק גבוה + תלות רמזים => לא advance אוטומטי
{
  const row = rowAug({
    questions: 20,
    accuracy: 90,
    wrong: 2,
    behaviorProfile: behaviorBase("instruction_friction", {
      signals: { hintRate: 0.55, hintKnownCount: 8, wrongEventCount: 4 },
    }),
    trend: trendBase({ accuracyDirection: "up", independenceDirection: "flat", confidence: 0.5 }),
  });
  assertStep("hint_dependence_blocks_advance", row, 2, "maintain_and_strengthen", ["advance_level", "advance_grade_topic_only"]);
}

// 2) חולשה במצב מהירות בלבד => לא drop
{
  const row = rowAug({
    questions: 20,
    accuracy: 62,
    wrong: 8,
    levelKey: "medium",
    modeKey: "speed",
    dataSufficiencyLevel: "strong",
    evidenceStrength: "medium",
    behaviorProfile: behaviorBase("speed_pressure"),
    trend: trendBase({ accuracyDirection: "flat", fluencyDirection: "down" }),
  });
  const d = decideTopicNextStep(row, 2, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.ok(
    d.step !== "drop_one_level_topic_only" && d.step !== "drop_one_grade_topic_only",
    `speed_only: got ${d.step}`
  );
  assert.equal(d.riskFlags.speedOnlyRisk, true);
}

// 3) מגמה חיובית + מאסטרי מספיק => advance או maintain (לא drop)
{
  const row = rowAug({
    questions: 20,
    accuracy: 90,
    wrong: 2,
    dataSufficiencyLevel: "strong",
    evidenceStrength: "strong",
    behaviorProfile: behaviorBase("stable_mastery", { signals: { hintRate: 0.05, hintKnownCount: 4 } }),
    trend: trendBase({
      accuracyDirection: "up",
      independenceDirection: "up",
      confidence: 0.55,
    }),
  });
  const d = decideTopicNextStep(row, 1, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.ok(
    d.step === "advance_level" || d.step === "maintain_and_strengthen",
    `positive_trend_mastery: got ${d.step}`
  );
  assert.notEqual(d.step, "drop_one_level_topic_only");
}

// 4) מגמה שלילית אחרי קושי אחרון => לא drop_one_grade (מרוכך)
{
  const row = rowAug({
    questions: 20,
    accuracy: 48,
    wrong: 11,
    levelKey: "hard",
    gradeKey: "g4",
    dataSufficiencyLevel: "strong",
    evidenceStrength: "strong",
    behaviorProfile: behaviorBase("knowledge_gap", { signals: { wrongRatio: 0.55 } }),
    trend: trendBase({
      accuracyDirection: "down",
      confidence: 0.45,
      windows: {
        currentPeriod: { accuracy: 48, questions: 20 },
        previousComparablePeriod: { accuracy: 70, questions: 18 },
        recentShortWindow: { accuracy: 40, questions: 6 },
        lastSessionsInRow: { accuracy: 42, questions: 4 },
      },
    }),
  });
  const d = decideTopicNextStep(row, 6, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.notEqual(
    d.step,
    "drop_one_grade_topic_only",
    `recent_difficulty: expected soften from drop grade, got ${d.step}`
  );
}

// 5) careless_pattern + דיוק בינוני => לא drop מהיר
{
  const row = rowAug({
    questions: 18,
    accuracy: 64,
    wrong: 6,
    dataSufficiencyLevel: "strong",
    evidenceStrength: "medium",
    behaviorProfile: behaviorBase("careless_pattern"),
    trend: trendBase({ accuracyDirection: "flat" }),
  });
  const d = decideTopicNextStep(row, 3, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.ok(d.step === "remediate_same_level" || d.step === "maintain_and_strengthen", `careless: ${d.step}`);
  assert.notEqual(d.step, "drop_one_level_topic_only");
}

// 6) knowledge_gap אמיתי — יורדים רמה כשהמגמה לא מפריכה (דיוק לא עולה)
{
  const row = rowAug({
    questions: 20,
    accuracy: 48,
    wrong: 11,
    levelKey: "medium",
    dataSufficiencyLevel: "strong",
    evidenceStrength: "strong",
    behaviorProfile: behaviorBase("knowledge_gap", { signals: { wrongRatio: 0.55 } }),
    trend: trendBase({ accuracyDirection: "down", independenceDirection: "flat" }),
  });
  const d = decideTopicNextStep(row, 8, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.ok(
    d.step === "drop_one_level_topic_only" || d.step === "remediate_same_level",
    `knowledge_gap: ${d.step}`
  );
}

// 7) ראיות חלקיות + צעד אגרסיבי מהלגאסי => cap
{
  const row = rowAug({
    questions: 20,
    accuracy: 90,
    wrong: 2,
    dataSufficiencyLevel: "medium",
    evidenceStrength: "medium",
    isEarlySignalOnly: true,
    suppressAggressiveStep: true,
    behaviorProfile: behaviorBase("stable_mastery"),
    trend: trendBase({ accuracyDirection: "up", confidence: 0.55 }),
  });
  const d = decideTopicNextStep(row, 1, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.equal(d.step, "maintain_and_strengthen", `insufficient_cap: ${d.step}`);
}

// 8) stable_mastery + מגמה תומכת + סיכון נמוך => advance מותר
{
  const row = rowAug({
    questions: 20,
    accuracy: 90,
    wrong: 2,
    dataSufficiencyLevel: "strong",
    evidenceStrength: "strong",
    behaviorProfile: behaviorBase("stable_mastery", { signals: { hintRate: 0.08, hintKnownCount: 5 } }),
    trend: trendBase({
      accuracyDirection: "up",
      independenceDirection: "flat",
      fluencyDirection: "up",
      confidence: 0.52,
    }),
  });
  const d = decideTopicNextStep(row, 1, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.equal(d.step, "advance_level", `stable_advance_allowed: ${d.step}`);
  assert.equal(d.riskFlags.falsePromotionRisk, false);
}

// מבנה trace
{
  const row = rowAug({ questions: 15, accuracy: 80, wrong: 3, dataSufficiencyLevel: "medium" });
  const d = decideTopicNextStep(row, 2, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.ok(Array.isArray(d.recommendationDecisionTrace));
  const st = d.recommendationDecisionTrace.find((e) => e.phase === "structured_trace");
  assert.ok(st?.sections?.version === 2);
  assert.ok(Array.isArray(st.sections.blockers));
  assert.ok(st.sections.chosenRule);
  assert.ok("phase7RuleId" in st.sections.chosenRule);
}

// 9) Phase 7 — מגנון מהירות מול «פער ידע»: לא ירידה אגרסיבית (מעורב + ריסון)
{
  const row = rowAug({
    questions: 22,
    accuracy: 48,
    wrong: 4,
    modeKey: "speed",
    levelKey: "medium",
    dataSufficiencyLevel: "strong",
    evidenceStrength: "strong",
    behaviorProfile: behaviorBase("knowledge_gap", {
      signals: { hintRate: 0.05, hintKnownCount: 6, wrongEventCount: 4 },
    }),
    trend: trendBase({ accuracyDirection: "unknown", confidence: 0.22 }),
  });
  const d = decideTopicNextStep(row, 6, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.notEqual(d.step, "drop_one_level_topic_only", `phase7 mixed speed vs gap: ${d.step}`);
  assert.notEqual(d.step, "drop_one_grade_topic_only");
  assert.ok(["remediate_same_level", "maintain_and_strengthen"].includes(d.step), d.step);
}

// 10) Phase 7 — מסלול מהיר: שורש לחץ מהירות
{
  const row = rowAug({
    questions: 20,
    accuracy: 60,
    wrong: 6,
    modeKey: "speed",
    dataSufficiencyLevel: "strong",
    evidenceStrength: "medium",
    behaviorProfile: behaviorBase("speed_pressure"),
    trend: trendBase({ accuracyDirection: "flat", confidence: 0.4 }),
  });
  const d = decideTopicNextStep(row, 2, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.equal(d.rootCause, "speed_pressure", `root ${d.rootCause}`);
}

// 11) Phase 7 — חיכוך הוראה: לא לאבחן כפער ידע כשורש ראשי
{
  const row = rowAug({
    questions: 18,
    accuracy: 48,
    wrong: 9,
    dataSufficiencyLevel: "medium",
    evidenceStrength: "medium",
    behaviorProfile: behaviorBase("instruction_friction", {
      signals: { hintRate: 0.5, hintKnownCount: 10, wrongEventCount: 6 },
    }),
    trend: trendBase({ accuracyDirection: "flat", confidence: 0.35 }),
  });
  const d = decideTopicNextStep(row, 3, DEFAULT_TOPIC_NEXT_STEP_CONFIG);
  assert.equal(d.rootCause, "instruction_friction", `root ${d.rootCause}`);
}

// 12) Phase 8 — כיול עומס ביתי: נתון דל / ריסון => עומס מינימלי
{
  const c = buildPracticeCalibration({
    rootCause: "insufficient_evidence",
    conclusionStrength: "tentative",
    shouldAvoidStrongConclusion: true,
    diagnosticRestraintLevel: "mixed",
    q: 6,
    accuracy: 72,
    evidenceStrength: "low",
    dataSufficiencyLevel: "low",
    interventionIntensity: "light",
  });
  assert.equal(c.recommendedPracticeLoad, "minimal");
  assert.ok(c.recommendedSessionCount <= 3);
}

// 13) Phase 9 — overlay מצב תרגול לפי דפוס טעות ושלב למידה
{
  const o1 = buildPhase9RecommendationOverlay({
    dominantMistakePattern: "insufficient_mistake_evidence",
    learningStage: "insufficient_longitudinal_evidence",
    retentionRisk: "unknown",
    transferReadiness: "not_ready",
    rootCause: "insufficient_evidence",
    finalStep: "maintain_and_strengthen",
    riskFlags: {},
  });
  assert.equal(o1.recommendedPracticeMode, "observe_only");

  const o2 = buildPhase9RecommendationOverlay({
    dominantMistakePattern: "speed_driven_error",
    learningStage: "partial_stabilization",
    retentionRisk: "low",
    transferReadiness: "limited",
    rootCause: "speed_pressure",
    finalStep: "maintain_and_strengthen",
    riskFlags: {},
  });
  assert.equal(o2.recommendedPracticeMode, "slow_guided_accuracy");
}

console.log("topic-next-step phase2 tests: OK");
