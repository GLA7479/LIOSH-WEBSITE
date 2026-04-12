/**
 * Phase 6 — מערכת בדיקות רחבה לדוחות הורים (ללא Jest).
 * הרצה: npm run test:parent-report-phase6
 * (הסקריפט ב-package.json מריץ אחריו גם scripts/parent-report-pages-ssr.mjs — ראו docs/PARENT_REPORT.md)
 */
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

async function importUtils(rel) {
  const m = await import(pathToFileURL(join(ROOT, rel)).href);
  return m.default && typeof m.default === "object" ? m.default : m;
}

const { buildDetailedParentReportFromBaseReport } = await importUtils("utils/detailed-parent-report.js");
const { normalizeExecutiveSummary } = await importUtils("utils/parent-report-payload-normalize.js");
const { analyzeLearningPatterns, EXAMPLE_PATTERN_DIAGNOSTICS_PAYLOAD } = await importUtils(
  "utils/learning-patterns-analysis.js"
);
const { normalizeMistakeEvent } = await importUtils("utils/mistake-event.js");
const { computeRowDiagnosticSignals } = await importUtils("utils/parent-report-row-diagnostics.js");
const { confidenceBadgeFromScore, sufficiencyBadgeFromLevel } = await importUtils("utils/topic-next-step-phase2.js");
const {
  applyAggressiveEvidenceCap,
  buildTopicRecommendationRecord,
  DEFAULT_TOPIC_NEXT_STEP_CONFIG,
} = await importUtils("utils/topic-next-step-engine.js");
const {
  assertDetailedExecutiveLabels,
  assertSubjectProfileUiLabels,
} = await importUtils("utils/parent-report-label-contract.js");
const {
  activeRiskFlagLabelsHe,
  sanitizeEngineSnippetHe,
  truncateHe,
} = await importUtils("utils/parent-report-ui-explain-he.js");
const { PARENT_REPORT_SCENARIOS } = await import(pathToFileURL(join(ROOT, "tests/fixtures/parent-report-pipeline.mjs")).href);
const { generateQuestion: genMath } = await importUtils("utils/math-question-generator.js");
const { getLevelConfig } = await importUtils("utils/math-storage.js");
const { generateQuestion: genGeo } = await importUtils("utils/geometry-question-generator.js");
const { generateQuestion: genHe } = await importUtils("utils/hebrew-question-generator.js");
const { getLevelConfig: getHebrewLevelConfig } = await importUtils("utils/hebrew-storage.js");

const REQUIRED_DETAILED_TOP_KEYS = [
  "version",
  "generatedAt",
  "periodInfo",
  "executiveSummary",
  "overallSnapshot",
  "subjectProfiles",
  "crossSubjectInsights",
  "homePlan",
  "nextPeriodGoals",
  "dataIntegrityReport",
];

const REQUIRED_EXEC_KEYS = [
  "version",
  "topStrengthsAcrossHe",
  "topFocusAreasHe",
  "homeFocusHe",
  "majorTrendsHe",
  "mainHomeRecommendationHe",
  "cautionNoteHe",
  "overallConfidenceHe",
  "dominantCrossSubjectRisk",
  "dominantCrossSubjectRiskLabelHe",
  "dominantCrossSubjectSuccessPattern",
  "dominantCrossSubjectSuccessPatternLabelHe",
  "supportingSignals",
  "mixedSignalNoticeHe",
  "reportReadinessHe",
  "evidenceBalanceHe",
];

const REQUIRED_SUBJECT_PROFILE_KEYS = [
  "subject",
  "subjectLabelHe",
  "topStrengths",
  "topWeaknesses",
  "topicRecommendations",
  "dominantLearningRisk",
  "dominantSuccessPattern",
  "trendNarrativeHe",
  "confidenceSummaryHe",
  "recommendedHomeMethodHe",
  "whatNotToDoHe",
  "majorRiskFlagsAcrossRows",
];

/** שדות מלאים לרשומת המלצת נושא (מנוע topic-next-step) — חוזה רגרסיה */
const REQUIRED_TOPIC_RECOMMENDATION_KEYS = [
  "subject",
  "topicRowKey",
  "displayName",
  "bucketKey",
  "modeKey",
  "questions",
  "accuracy",
  "wrong",
  "mistakeEventCount",
  "gradeKey",
  "levelKey",
  "currentMastery",
  "stability",
  "confidence",
  "masteryScore",
  "stabilityScore",
  "confidenceScore",
  "recencyScore",
  "evidenceStrength",
  "dataSufficiencyLevel",
  "dataSufficiencyLabelHe",
  "recommendationContextHe",
  "patternStabilityHe",
  "decisionTrace",
  "recommendationDecisionTrace",
  "trend",
  "behaviorProfile",
  "recommendedNextStep",
  "recommendedStepLabelHe",
  "recommendedStepReasonHe",
  "recommendedParentActionHe",
  "recommendedStudentActionHe",
  "recommendedEvidenceLevelHe",
  "recommendedWhyNowHe",
  "recommendationStabilityNoteHe",
  "isEarlySignalOnly",
  "needsPractice",
  "excellent",
  "confidenceBadge",
  "sufficiencyBadge",
  "diagnosticType",
  "riskFlags",
  "whyThisRecommendationHe",
  "whatCouldChangeThisHe",
  "recommendationStructuredTrace",
];

const REQUIRED_CROSS_RISK_FLAG_KEYS = [
  "falsePromotionRisk",
  "falseRemediationRisk",
  "speedOnlyRisk",
  "hintDependenceRisk",
  "insufficientEvidenceRisk",
  "recentTransitionRisk",
];

function assertDetailedPayloadShape(detailed, label) {
  assert.ok(detailed && typeof detailed === "object", `${label}: detailed missing`);
  for (const k of REQUIRED_DETAILED_TOP_KEYS) {
    assert.ok(k in detailed, `${label}: missing top key ${k}`);
  }
  const es = detailed.executiveSummary;
  assert.ok(es && typeof es === "object", `${label}: executiveSummary`);
  for (const k of REQUIRED_EXEC_KEYS) {
    assert.ok(k in es, `${label}: executiveSummary missing ${k}`);
  }
  const sup = es.supportingSignals;
  assert.ok(sup && typeof sup === "object", `${label}: supportingSignals`);
  assert.ok("crossRiskFlags" in sup, `${label}: supportingSignals.crossRiskFlags`);
  const cr = sup.crossRiskFlags;
  assert.ok(cr && typeof cr === "object", `${label}: crossRiskFlags object`);
  for (const k of REQUIRED_CROSS_RISK_FLAG_KEYS) {
    assert.ok(k in cr, `${label}: crossRiskFlags missing ${k}`);
  }
  assert.ok(Array.isArray(detailed.subjectProfiles), `${label}: subjectProfiles`);
  for (const sp of detailed.subjectProfiles) {
    for (const k of REQUIRED_SUBJECT_PROFILE_KEYS) {
      assert.ok(k in sp, `${label}: subject ${sp.subject} missing ${k}`);
    }
    for (const tr of sp.topicRecommendations || []) {
      assert.ok("displayName" in tr && "recommendedNextStep" in tr, `${label}: topic rec shape`);
    }
  }
}

function collectSubjectProfileKeyUnion() {
  const u = new Set();
  for (const [, factory] of Object.entries(PARENT_REPORT_SCENARIOS)) {
    const d = buildDetailedParentReportFromBaseReport(factory(), { period: "week" });
    for (const sp of d.subjectProfiles || []) {
      for (const key of Object.keys(sp)) u.add(key);
    }
  }
  return [...u].sort();
}

function runSubjectProfileKeyUnionAcrossScenarios() {
  const keys = collectSubjectProfileKeyUnion();
  assert.ok(keys.length >= REQUIRED_SUBJECT_PROFILE_KEYS.length, "subject profile key union non-empty");
  for (const [name, factory] of Object.entries(PARENT_REPORT_SCENARIOS)) {
    const d = buildDetailedParentReportFromBaseReport(factory(), { period: "week" });
    for (const sp of d.subjectProfiles || []) {
      for (const k of keys) {
        assert.ok(k in sp, `subject key union ${name}/${sp.subject}: missing ${k}`);
      }
    }
  }
}

function runTopicRecommendationRecordContract() {
  const d = buildDetailedParentReportFromBaseReport(PARENT_REPORT_SCENARIOS.one_dominant_subject(), { period: "week" });
  const tr = d.subjectProfiles.find((s) => s.subject === "math")?.topicRecommendations?.[0];
  assert.ok(tr, "topic recommendation row");
  for (const k of REQUIRED_TOPIC_RECOMMENDATION_KEYS) {
    assert.ok(k in tr, `topicRec missing ${k}`);
  }
}

function runAggressiveEvidenceCapContract() {
  const ctx = {
    displayName: "חיבור",
    questions: 22,
    accuracy: 91,
    mistakeEventCount: 0,
    levelLabel: "easy",
    gradeLabel: "g3",
    wrongRatio: 0.09,
  };
  const out = applyAggressiveEvidenceCap(
    {
      step: "advance_level",
      reasonHe: "בדיקה",
      parentHe: "p",
      studentHe: "s",
      recommendationDecisionTrace: [],
    },
    { suppressAggressiveStep: true },
    ctx,
    DEFAULT_TOPIC_NEXT_STEP_CONFIG
  );
  assert.equal(out.step, "maintain_and_strengthen");
  assert.equal(out.postCapApplied, true);
}

function runLabelContractsForAllGoldens() {
  for (const [name, factory] of Object.entries(PARENT_REPORT_SCENARIOS)) {
    const detailed = buildDetailedParentReportFromBaseReport(factory(), { period: "week" });
    assertDetailedExecutiveLabels(detailed);
    for (const sp of detailed.subjectProfiles || []) {
      assertSubjectProfileUiLabels(sp, `golden:${name}/${sp.subject}`);
    }
  }
}

function runExplicitNamedPhase6Scenarios() {
  const recent = PARENT_REPORT_SCENARIOS.recent_transition_recent_difficulty_increase();
  const kMath = "addition\u0001learning";
  const endMs = new Date(`${recent.endDate}T23:59:59.999Z`).getTime();
  const rec = buildTopicRecommendationRecord(
    "math",
    kMath,
    recent.mathOperations[kMath],
    recent.analysis.mathMistakesByOperation || {},
    undefined,
    endMs
  );
  assert.equal(rec.riskFlags.recentTransitionRisk, true, "recent transition scenario: risk flag");

  const dom = buildDetailedParentReportFromBaseReport(PARENT_REPORT_SCENARIOS.exec_summary_one_dominant_subject(), {
    period: "week",
  });
  assert.ok(
    dom.subjectProfiles.some((s) => s.subject === "math" && (s.topicRecommendations?.length || 0) > 0),
    "exec one dominant: math topic recs"
  );

  const hr = buildDetailedParentReportFromBaseReport(
    PARENT_REPORT_SCENARIOS.exec_summary_high_risk_and_strengths_coexist(),
    { period: "week" }
  );
  assert.ok(hr.executiveSummary.topStrengthsAcrossHe.length >= 1, "exec high risk: strengths exist");
  assert.ok(hr.executiveSummary.cautionNoteHe.length > 2, "exec high risk: caution");

  const mix = buildDetailedParentReportFromBaseReport(
    PARENT_REPORT_SCENARIOS.exec_summary_mixed_cross_subject_signals(),
    { period: "week" }
  );
  assert.ok(
    (mix.executiveSummary.topStrengthsAcrossHe?.length || 0) + (mix.executiveSummary.topFocusAreasHe?.length || 0) > 0,
    "exec mixed cross-subject: lists"
  );

  const noHome = buildDetailedParentReportFromBaseReport(
    PARENT_REPORT_SCENARIOS.exec_summary_no_recommended_home_method_he(),
    { period: "week" }
  );
  const mathSp = noHome.subjectProfiles.find((s) => s.subject === "math");
  assert.ok(mathSp, "no home: math profile");
  assert.ok(
    mathSp.recommendedHomeMethodHe == null || String(mathSp.recommendedHomeMethodHe).trim() === "",
    "no home: field absent or empty"
  );
  assertSubjectProfileUiLabels(mathSp, "exec_no_home/math");
}

function runGoldenFixtures() {
  for (const [name, factory] of Object.entries(PARENT_REPORT_SCENARIOS)) {
    const base = factory();
    const detailed = buildDetailedParentReportFromBaseReport(base, { playerName: base.playerName, period: "week" });
    assertDetailedPayloadShape(detailed, `golden:${name}`);
  }
}

function runExecutiveSummaryRules() {
  const high = PARENT_REPORT_SCENARIOS.high_risk_despite_strengths();
  const dHigh = buildDetailedParentReportFromBaseReport(high, { period: "week" });
  const esHigh = dHigh.executiveSummary;
  const cross = esHigh.supportingSignals?.crossRiskFlags;
  const heavy = !!(cross?.falsePromotionRisk || cross?.hintDependenceRisk || cross?.recentTransitionRisk);
  if (heavy && esHigh.topStrengthsAcrossHe.length > 1) {
    assert.ok(
      esHigh.topStrengthsAcrossHe.length <= 2,
      "executive: strengths capped under global risk heavy"
    );
  }

  const mixed = PARENT_REPORT_SCENARIOS.mixed_signals_cross_subjects();
  const dMix = buildDetailedParentReportFromBaseReport(mixed, { period: "week" });
  assert.ok(typeof dMix.executiveSummary.mainHomeRecommendationHe === "string", "main home string");
  assert.ok(dMix.executiveSummary.cautionNoteHe.length > 0, "caution non-empty");

  const sparse = PARENT_REPORT_SCENARIOS.all_sparse();
  const dSp = buildDetailedParentReportFromBaseReport(sparse, { period: "week" });
  assert.ok(
    String(dSp.executiveSummary.overallConfidenceHe || "").length > 0,
    "overall confidence for sparse"
  );
  const labels = dSp.executiveSummary.dominantCrossSubjectRiskLabelHe;
  assert.ok(typeof labels === "string", "dominant risk label resolves");
}

function runThresholdBoundaries() {
  const endMs = Date.UTC(2026, 3, 10, 23, 59, 59);
  const rowLow = {
    bucketKey: "addition",
    displayName: "חיבור",
    questions: 4,
    correct: 3,
    wrong: 1,
    accuracy: 75,
    modeKey: "learning",
    lastSessionMs: endMs - 86400000,
  };
  const sigLow = computeRowDiagnosticSignals("math", "addition\u0001learning", rowLow, {}, endMs);
  assert.ok(sigLow.dataSufficiencyLevel === "low" || sigLow.dataSufficiencyLevel === "medium");

  assert.equal(confidenceBadgeFromScore(100), "high");
  assert.equal(confidenceBadgeFromScore(72), "high");
  assert.equal(confidenceBadgeFromScore(42), "medium");
  assert.equal(confidenceBadgeFromScore(41), "low");

  assert.equal(sufficiencyBadgeFromLevel("strong"), "high");
  assert.equal(sufficiencyBadgeFromLevel("medium"), "medium");
  assert.equal(sufficiencyBadgeFromLevel("low"), "low");

  const rowMed = {
    ...rowLow,
    questions: 11,
    correct: 8,
    wrong: 3,
  };
  const sigMed = computeRowDiagnosticSignals("math", "addition\u0001learning", rowMed, { addition: { count: 3 } }, endMs);
  assert.ok(sigMed.dataSufficiencyLevel === "medium" || sigMed.dataSufficiencyLevel === "strong");
}

function runLegacyMistakeAndDiagnostics() {
  const legacyRaw = {
    operation: "addition",
    storedAt: "2026-04-05T10:00:00.000Z",
    wrong: 9,
    correct: 10,
    isCorrect: false,
  };
  const ev = normalizeMistakeEvent(legacyRaw, "math");
  assert.equal(ev.subject, "math");
  assert.ok(ev.bucketKey === "addition" || ev.topicOrOperation === "addition");

  const ex = EXAMPLE_PATTERN_DIAGNOSTICS_PAYLOAD;
  assert.equal(ex.version, 2);
  assert.ok(ex.subjects?.math?.topWeaknesses?.length >= 1);

  const v2 = analyzeLearningPatterns(
    {
      startDate: "2026-04-01",
      endDate: "2026-04-10",
      period: "week",
      playerName: "x",
      summary: {
        totalQuestions: 50,
        totalTimeMinutes: 60,
        overallAccuracy: 70,
        mathQuestions: 50,
        mathCorrect: 35,
        mathAccuracy: 70,
        geometryQuestions: 0,
        geometryCorrect: 0,
        geometryAccuracy: 0,
        englishQuestions: 0,
        englishCorrect: 0,
        englishAccuracy: 0,
        scienceQuestions: 0,
        scienceCorrect: 0,
        scienceAccuracy: 0,
        hebrewQuestions: 0,
        hebrewCorrect: 0,
        hebrewAccuracy: 0,
        moledetGeographyQuestions: 0,
        moledetGeographyCorrect: 0,
        moledetGeographyAccuracy: 0,
      },
      mathOperations: {
        "addition\u0001learning": {
          bucketKey: "addition",
          displayName: "חיבור",
          questions: 20,
          correct: 14,
          wrong: 6,
          accuracy: 70,
          needsPractice: true,
          modeKey: "learning",
          lastSessionMs: Date.UTC(2026, 3, 8),
          timeMinutes: 10,
        },
      },
      geometryTopics: {},
      englishTopics: {},
      scienceTopics: {},
      hebrewTopics: {},
      moledetGeographyTopics: {},
      analysis: {
        mathMistakesByOperation: { addition: { count: 6 } },
        geometryMistakesByTopic: {},
        englishMistakesByTopic: {},
        scienceMistakesByTopic: {},
        hebrewMistakesByTopic: {},
        moledetGeographyMistakesByTopic: {},
        needsPractice: {},
        excellent: {},
        recommendations: [],
      },
      challenges: { daily: {}, weekly: {}, bySubject: {} },
      achievements: [],
      allItems: {},
      dailyActivity: [],
    },
    { math: Array.from({ length: 6 }, (_, i) => ({ subject: "math", operation: "addition", isCorrect: false, timestamp: Date.UTC(2026, 3, 4) + i * 1000, patternFamily: "pf:leg", exerciseText: "x", correctAnswer: 1, userAnswer: 2 })) }
  );
  assert.ok(v2.subjects?.math?.hasAnySignal !== undefined);
}

function runGeneratorPropertyLoops() {
  const levelConfig = getLevelConfig("g3", "easy", "addition");
  for (let seed = 0; seed < 24; seed++) {
    const q = genMath(levelConfig, "addition", "g3", null);
    assert.ok(q && typeof q === "object", "math q object");
    assert.ok(String(q.question || q.text || "").trim().length > 0, "math non-empty stem");
    const ans = q.correctAnswer ?? q.answer;
    assert.ok(ans != null && String(ans).trim() !== "", "math has correct answer");
    if (Array.isArray(q.options) && q.options.length > 1) {
      const set = new Set(q.options.map((x) => String(x)));
      assert.ok(set.size === q.options.length, "math options unique");
    }
  }

  for (let i = 0; i < 16; i++) {
    const g = genGeo("g4", "medium", "perimeter");
    assert.ok(g && typeof g === "object");
    assert.ok(String(g.question || "").trim().length > 0);
    assert.ok(g.correctAnswer != null || g.answer != null);
  }

  const heLevel = getHebrewLevelConfig("g3", "easy");
  for (let i = 0; i < 16; i++) {
    const h = genHe(heLevel, "reading", "g3", null);
    assert.ok(h && typeof h === "object");
    assert.ok(String(h.question || "").trim().length > 0);
    assert.ok(h.correctAnswer != null || h.answer != null);
  }
}

function runContractAdditive() {
  const base = PARENT_REPORT_SCENARIOS.one_dominant_subject();
  const detailed = buildDetailedParentReportFromBaseReport(base, { period: "week" });
  assert.ok("summary" in base === false || base.summary, "base is v2-like");
  assert.ok(Array.isArray(detailed.subjectProfiles));
  const norm = normalizeExecutiveSummary({ executiveSummary: null });
  assert.equal(Array.isArray(norm.topStrengthsAcrossHe), true);
  assert.equal(norm.homeFocusHe, "");
}

function runUiResilienceHelpers() {
  const longWhy =
    "knowledge_gap " + "word ".repeat(80) + " fragile_success instruction_friction falsePromotionRisk";
  const s = sanitizeEngineSnippetHe(longWhy);
  assert.ok(!/\bknowledge_gap\b/.test(s), "sanitized ids");
  const t = truncateHe("א".repeat(200), 40);
  assert.ok(t.length <= 42, "truncate");
  const rf = { falsePromotionRisk: true, hintDependenceRisk: false, speedOnlyRisk: true };
  const labs = activeRiskFlagLabelsHe(rf, 10);
  assert.ok(labs.every((x) => typeof x === "string"));
  assert.ok(!labs.some((x) => /falsePromotionRisk/i.test(x)), "no raw keys in chips");
}

function runReactServerSmoke() {
  const base = PARENT_REPORT_SCENARIOS.strong_executive_case();
  const detailed = buildDetailedParentReportFromBaseReport(base, { period: "week" });
  const es = detailed.executiveSummary;
  const long = "א".repeat(400);
  const html = renderToStaticMarkup(
    createElement(
      "div",
      { dir: "rtl", "data-testid": "exec-smoke" },
      createElement("p", null, es.mainHomeRecommendationHe || "—"),
      createElement("p", null, long),
      createElement(
        "ul",
        null,
        (es.topStrengthsAcrossHe || []).slice(0, 3).map((t, i) => createElement("li", { key: i }, t))
      )
    )
  );
  assert.ok(html.includes("data-testid") || html.includes("exec-smoke"));
  assert.ok(html.length > 50);
}

function runTopicRecGoldenRow() {
  const endMs = Date.UTC(2026, 3, 10, 23, 59, 59);
  const row = {
    bucketKey: "addition",
    displayName: "חיבור",
    questions: 16,
    correct: 12,
    wrong: 4,
    accuracy: 75,
    modeKey: "learning",
    lastSessionMs: endMs - 86400000,
  };
  const signals = computeRowDiagnosticSignals("math", "addition\u0001learning", row, { addition: { count: 4 } }, endMs);
  const rec = buildTopicRecommendationRecord(
    "math",
    "addition\u0001learning",
    { ...row, ...signals },
    { addition: { count: 4 } },
    undefined,
    endMs
  );
  assert.ok(typeof rec.whyThisRecommendationHe === "string");
  assert.ok(rec.riskFlags && typeof rec.riskFlags === "object");
  assert.ok(Array.isArray(rec.decisionTrace));
}

function main() {
  runGoldenFixtures();
  runSubjectProfileKeyUnionAcrossScenarios();
  runTopicRecommendationRecordContract();
  runAggressiveEvidenceCapContract();
  runLabelContractsForAllGoldens();
  runExplicitNamedPhase6Scenarios();
  runExecutiveSummaryRules();
  runThresholdBoundaries();
  runLegacyMistakeAndDiagnostics();
  runGeneratorPropertyLoops();
  runContractAdditive();
  runUiResilienceHelpers();
  runTopicRecGoldenRow();
  runReactServerSmoke();

  const reportDir = join(ROOT, "reports", "parent-report-phase6");
  try {
    mkdirSync(reportDir, { recursive: true });
  } catch {
    /* exists */
  }
  const snapshot = {};
  for (const [name, factory] of Object.entries(PARENT_REPORT_SCENARIOS)) {
    const base = factory();
    const detailed = buildDetailedParentReportFromBaseReport(base, { period: "week" });
    snapshot[name] = {
      executiveKeys: Object.keys(detailed.executiveSummary || {}).sort(),
      subjectCount: detailed.subjectProfiles.length,
      totalQuestions: detailed.overallSnapshot?.totalQuestions,
    };
  }
  writeFileSync(join(reportDir, "golden-snapshot.json"), JSON.stringify(snapshot, null, 2), "utf8");

  console.log("parent-report phase6 suite: OK");
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
