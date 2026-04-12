/**
 * Batch 1 — בדיקות acceptance ל-parentTopicTone (לוגיקה בלבד).
 * הרצה: npx tsx scripts/batch1-parent-topic-tone-selftest.mjs
 */
/** @param {string} path */
async function importUtils(path) {
  const m = await import(path);
  return m.default && typeof m.default === "object" ? m.default : m;
}

const { analyzeLearningPatterns } = await importUtils("../utils/learning-patterns-analysis.js");
const { buildTopicRecommendationsForSubject } = await importUtils("../utils/topic-next-step-engine.js");

const SEP = "\u0001";
/** שורת מתמטיקה scoped — תואם parent-report-v2 (פעולה+מצב+כיתה+רמה) */
const multKey = `multiplication${SEP}learning${SEP}g4${SEP}medium`;

function mkWrongMult(i) {
  return {
    operation: "multiplication",
    grade: "ד׳",
    level: "medium",
    mode: "learning",
    isCorrect: false,
    patternFamily: "multiplication",
    timestamp: Date.now() - i * 60_000,
    total: 1,
    correct: 0,
  };
}

function mkReportMultHigh() {
  return {
    mathOperations: {
      [multKey]: {
        subject: "math",
        bucketKey: "multiplication",
        questions: 50,
        correct: 47,
        wrong: 3,
        accuracy: 94,
        needsPractice: false,
        excellent: true,
        displayName: "כפל",
        modeKey: "learning",
        gradeKey: "g4",
        levelKey: "medium",
      },
    },
  };
}

function at1() {
  const report = mkReportMultHigh();
  const wrong = Array.from({ length: 10 }, (_, i) => mkWrongMult(i));
  const pd = analyzeLearningPatterns(report, { math: wrong });
  const m = pd.subjects.math;
  const tone = m.parentTopicToneByKey?.[multKey];
  const hasLines = Array.isArray(m.parentStrengthWithCautionLinesByKey?.[multKey]);
  const noMultWeakness = !(m.topWeaknesses || []).some((w) =>
    String(w.labelHe || "").includes("כפל")
  );
  if (tone !== "strength_with_caution") {
    console.error("AT1 FAIL tone", tone, m.topWeaknesses, m.parentTopicToneByKey);
    process.exit(1);
  }
  if (!hasLines || m.parentStrengthWithCautionLinesByKey[multKey].length < 3) {
    console.error("AT1 FAIL lines", m.parentStrengthWithCautionLinesByKey);
    process.exit(1);
  }
  if (!noMultWeakness) {
    console.error("AT1 FAIL weakness still lists כפל", m.topWeaknesses);
    process.exit(1);
  }
  const lines = m.parentStrengthWithCautionLinesByKey[multKey];
  if (!lines[0].includes("שליטה טובה") || !lines[1].includes("כשיש טעות")) {
    console.error("AT1 FAIL sentence order", lines);
    process.exit(1);
  }
  const tr = buildTopicRecommendationsForSubject(
    "math",
    report.mathOperations,
    { mathMistakesByOperation: { [multKey]: { count: 10 } } },
    undefined,
    Date.now(),
    {
      parentTopicToneByKey: m.parentTopicToneByKey,
      parentStrengthWithCautionLinesByKey: m.parentStrengthWithCautionLinesByKey,
    }
  );
  const row = tr.find((r) => r.topicRowKey === multKey);
  if (!row || row.parentTopicTone !== "strength_with_caution") {
    console.error("AT1 FAIL topic record", row);
    process.exit(1);
  }
  if (!String(row.whyThisRecommendationHe || "").includes("שליטה טובה")) {
    console.error("AT1 FAIL whyHe", row.whyThisRecommendationHe);
    process.exit(1);
  }
  console.log("AT1 OK");
}

function at2() {
  const report = {
    mathOperations: {
      [multKey]: {
        subject: "math",
        bucketKey: "multiplication",
        questions: 20,
        correct: 10,
        wrong: 10,
        accuracy: 50,
        needsPractice: true,
        excellent: false,
        displayName: "כפל",
        modeKey: "learning",
        gradeKey: "g4",
        levelKey: "medium",
      },
    },
  };
  const wrong = Array.from({ length: 10 }, (_, i) => mkWrongMult(i));
  const pd = analyzeLearningPatterns(report, { math: wrong });
  const m = pd.subjects.math;
  const tone = m.parentTopicToneByKey?.[multKey];
  const hasWeak = (m.topWeaknesses || []).some((w) => String(w.labelHe || "").includes("כפל"));
  if (tone !== "true_weakness") {
    console.error("AT2 FAIL tone", tone);
    process.exit(1);
  }
  if (!hasWeak) {
    console.error("AT2 FAIL expected weakness for כפל", m.topWeaknesses);
    process.exit(1);
  }
  console.log("AT2 OK");
}

function at3() {
  const report = mkReportMultHigh();
  const wrong = Array.from({ length: 3 }, (_, i) => mkWrongMult(i));
  const pd = analyzeLearningPatterns(report, { math: wrong });
  const m = pd.subjects.math;
  const tone = m.parentTopicToneByKey?.[multKey];
  const lines = m.parentStrengthWithCautionLinesByKey?.[multKey];
  const hasMultWeakness = (m.topWeaknesses || []).some((w) =>
    String(w.labelHe || "").includes("כפל")
  );
  if (tone !== "strength") {
    console.error("AT3 FAIL tone", tone, m.topWeaknesses);
    process.exit(1);
  }
  if (lines) {
    console.error("AT3 FAIL should not have caution lines", lines);
    process.exit(1);
  }
  if (hasMultWeakness) {
    console.error("AT3 FAIL no stable pattern should not list כפל weakness", m.topWeaknesses);
    process.exit(1);
  }
  console.log("AT3 OK");
}

at1();
at2();
at3();
console.log("batch1-parent-topic-tone-selftest: all passed");
