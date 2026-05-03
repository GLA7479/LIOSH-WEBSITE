#!/usr/bin/env node
/**
 * Phase 7 — Parent report AI / narrative scenario simulator (engineering / QA only).
 * npm run test:parent-report-ai:scenario-simulator
 *
 * Writes reports/parent-report-ai/scenario-simulator.{json,md}.
 * Deterministic by default. Optional live AI: PARENT_REPORT_AI_SCENARIO_SIMULATOR_USE_AI=1 and API key.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "parent-report-ai");
const OUT_JSON = join(OUT_DIR, "scenario-simulator.json");
const OUT_MD = join(OUT_DIR, "scenario-simulator.md");

const bridgeMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-runtime-bridge.js", import.meta.url).href
);
const metaCtxMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-metadata-context.js", import.meta.url).href
);
const validateMod = await import(
  new URL("../lib/parent-report-ai/parent-report-ai-validate.js", import.meta.url).href
);
const explainerMod = await import(
  new URL("../utils/parent-report-ai/parent-report-ai-explainer.js", import.meta.url).href
);

const { buildRuntimePlannerRecommendationFromPracticeResult } = bridgeMod;
const { validateLightEntriesNoForbiddenFields } = metaCtxMod;
const { validateParentReportAIText, parentReportAiInputToNarrativeEngineSnapshot } = validateMod;
const {
  buildParentReportAIExplanation,
  buildStrictParentReportAIInput,
  recommendedNextStepHeFromPlannerAction,
} = explainerMod;

/**
 * @param {string} rootAbs
 */
async function tryLoadMetadataIndexFromSnapshot(rootAbs) {
  const p = join(rootAbs, "reports", "adaptive-learning-planner", "metadata-index-snapshot.json");
  try {
    const raw = JSON.parse(await readFile(p, "utf8"));
    const entries = raw.entries;
    if (!Array.isArray(entries) || entries.length === 0) return null;
    const leaks = validateLightEntriesNoForbiddenFields(entries);
    if (leaks.length) return null;
    return { entries };
  } catch {
    return null;
  }
}

/**
 * @param {number} acc
 * @param {number} n
 */
function accuracyBandFromStats(acc, n) {
  const a = Number(acc) || 0;
  if (a >= 85) return "high";
  if (a >= 70) return "moderate";
  if (a >= 50) return "mixed";
  return "low";
}

/**
 * @param {number} n
 */
function dataConfidenceFromCount(n) {
  const q = Number(n) || 0;
  if (q >= 40) return "strong";
  if (q >= 12) return "moderate";
  if (q >= 6) return "low";
  return "thin";
}

/**
 * @param {string} text
 * @param {string} recommendedNextStep
 */
function isGroundedInPlanner(text, recommendedNextStep) {
  const t = String(text || "");
  const r = String(recommendedNextStep || "").trim();
  if (!t || !r) return false;
  if (t.includes(r)) return true;
  const words = r.split(/\s+/).filter((w) => w.length >= 3);
  let hits = 0;
  for (const w of words) {
    if (t.includes(w)) hits += 1;
  }
  return hits >= 2;
}

/**
 * @param {string} text
 */
function practicalNextStepPresent(text) {
  return /(?:מומלץ|כדאי|אפשר|להמשיך|לתרגל|המלצת\s*המערכת|לעודד|שגרה)/u.test(String(text || ""));
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

/**
 * @typedef {object} ScenarioDef
 * @property {string} scenarioId
 * @property {string} subject
 * @property {string|number} grade
 * @property {Record<string, unknown>} practice
 * @property {string} [consistencyBandOverride]
 * @property {string} [mainStrengths]
 * @property {string} [mainPracticeNeeds]
 * @property {string} [notes]
 */

/** @type {ScenarioDef[]} */
const SCENARIOS = [
  {
    scenarioId: "parent_strong_student_ready_to_advance",
    subject: "math",
    grade: 4,
    practice: {
      scenarioSimulatorId: "qa_parent_strong_student_ready_to_advance_math_g4",
      topic: "numbers",
      totalQuestions: 120,
      correctAnswers: 108,
      wrongAnswers: 12,
      accuracy: 90,
      durationSeconds: 3600,
    },
    consistencyBandOverride: "stable",
    mainStrengths: "יציבות טובה ודיוק גבוה ביחס לרמת התרגול.",
    mainPracticeNeeds: "להמשיך לבסס את ההבנה לפני קפיצה גדולה יותר.",
    notes: "Strong signal + enough data; parent tone positive but bounded.",
  },
  {
    scenarioId: "parent_steady_student_same_level",
    subject: "hebrew",
    grade: "g3",
    practice: {
      scenarioSimulatorId: "qa_parent_steady_student_same_level_hebrew_g3",
      topic: "reading",
      totalQuestions: 40,
      correctAnswers: 31,
      wrongAnswers: 9,
      accuracy: 78,
      durationSeconds: 900,
    },
    consistencyBandOverride: "stable",
    mainStrengths: "התמדה בתרגול והבנה סבירה של הטקסטים שנבחרו.",
    mainPracticeNeeds: "להמשיך לחזק קריאה רציפה באותה רמה לפני שינוי קצב.",
    notes: "Maintain-style planner; calm practical parent copy.",
  },
  {
    scenarioId: "parent_struggling_student_foundation",
    subject: "science",
    grade: 3,
    practice: {
      scenarioSimulatorId: "qa_parent_struggling_student_foundation_science_g3",
      topic: "animals",
      totalQuestions: 12,
      correctAnswers: 4,
      wrongAnswers: 8,
      accuracy: 33,
      durationSeconds: 600,
    },
    consistencyBandOverride: "stable",
    mainStrengths: "ניכרת נכונות להתנסות ולנסות שוב גם כשהתשובה לא מדויקת.",
    mainPracticeNeeds: "לחזק בסיס מושגי בנושא דרך תרגול קצר וחוזר בלי לחץ.",
    notes: "Foundation path; careful non-judgmental wording.",
  },
  {
    scenarioId: "parent_short_session_low_confidence",
    subject: "math",
    grade: 2,
    practice: {
      scenarioSimulatorId: "qa_parent_short_session_low_confidence_math_g2",
      topic: "addition",
      totalQuestions: 1,
      correctAnswers: 1,
      wrongAnswers: 0,
      accuracy: 100,
      durationSeconds: 20,
    },
    consistencyBandOverride: "stable",
    mainStrengths: "",
    mainPracticeNeeds: "",
    notes: "Very little data; parent copy must stay cautious.",
  },
  {
    scenarioId: "parent_inconsistent_student",
    subject: "math",
    grade: 4,
    practice: {
      scenarioSimulatorId: "qa_parent_inconsistent_student_pattern_math_g4",
      topic: "fractions",
      totalQuestions: 25,
      correctAnswers: 18,
      wrongAnswers: 7,
      accuracy: 72,
      durationSeconds: 400,
    },
    consistencyBandOverride: "mixed",
    mainStrengths: "יש ניסיונות שבהם הבנה טובה של השאלה.",
    mainPracticeNeeds: "לחדד יציבות בין שאלות דומות באמצעות תרגול מדורג.",
    notes: "Mixed pattern; careful inconsistency wording.",
  },
  {
    scenarioId: "parent_fast_guessing_pattern",
    subject: "math",
    grade: 4,
    practice: {
      scenarioSimulatorId: "qa_parent_fast_guessing_pattern_math_g4",
      topic: "multiplication",
      totalQuestions: 25,
      correctAnswers: 23,
      wrongAnswers: 2,
      accuracy: 92,
      durationSeconds: 40,
    },
    consistencyBandOverride: "possibly_fast",
    mainStrengths: "בחלק מהשאלות ניכרת שליטה טובה בתוכן.",
    mainPracticeNeeds: "להאריך מעט את זמן החשיבה כדי לוודא הבנה ולא רק מהירות.",
    notes: "Fast pattern; no accusatory tone.",
  },
  {
    scenarioId: "parent_improving_student",
    subject: "hebrew",
    grade: "g4",
    practice: {
      scenarioSimulatorId: "qa_parent_improving_student_hebrew_g4",
      topic: "reading",
      totalQuestions: 35,
      correctAnswers: 28,
      wrongAnswers: 7,
      accuracy: 80,
      durationSeconds: 800,
    },
    consistencyBandOverride: "improving",
    mainStrengths: "נראית התקדמות בהשוואה לתחילת התקופה בתרגול הקריאה.",
    mainPracticeNeeds: "להמשיך באותו קצב עם טקסטים מתאימים לרמה.",
    notes: "Improvement without promising future outcomes.",
  },
  {
    scenarioId: "parent_declining_recent_performance",
    subject: "math",
    grade: 5,
    practice: {
      scenarioSimulatorId: "qa_parent_declining_recent_performance_math_g5",
      topic: "division",
      totalQuestions: 30,
      correctAnswers: 18,
      wrongAnswers: 12,
      accuracy: 60,
      durationSeconds: 650,
    },
    consistencyBandOverride: "declining_recent",
    mainStrengths: "עדיין יש בסיס מוכר מהשבועות הקודמים שניתן לבנות עליו.",
    mainPracticeNeeds: "בשבועות האחרונים נראתה ירידה יחסית בדיוק ולכן כדאי חזרה מסודרת.",
    notes: "Recent dip; calm review recommendation.",
  },
  {
    scenarioId: "parent_geometry_topic_need",
    subject: "geometry",
    grade: 4,
    practice: {
      scenarioSimulatorId: "qa_parent_geometry_topic_need_g4",
      topic: "perimeter",
      totalQuestions: 40,
      correctAnswers: 28,
      wrongAnswers: 12,
      accuracy: 70,
      durationSeconds: 720,
    },
    consistencyBandOverride: "stable",
    mainStrengths: "הבנה טובה של צורות בסיסיות בחלק מהתרגולים.",
    mainPracticeNeeds: "לחזק קישור בין מושג היקף לבין יישום מספרי בשאלות.",
    notes: "Geometry topic need without metadata jargon.",
  },
  {
    scenarioId: "parent_english_safe_metadata",
    subject: "english",
    grade: 5,
    practice: {
      scenarioSimulatorId: "qa_parent_english_safe_metadata_g5",
      topic: "grammar",
      totalQuestions: 20,
      correctAnswers: 17,
      wrongAnswers: 3,
      accuracy: 85,
      durationSeconds: 500,
    },
    consistencyBandOverride: "stable",
    mainStrengths: "דיוק טוב בשאלות דקדוק בסיסיות שנבדקו.",
    mainPracticeNeeds: "להרחיב מעט את מגוון המבנים בתרגול הרגיל.",
    notes: "English grammar safe metadata regression guard.",
  },
];

async function main() {
  const index = await tryLoadMetadataIndexFromSnapshot(ROOT);
  if (!index) {
    console.error(
      "Missing reports/adaptive-learning-planner/metadata-index-snapshot.json — run npm run build:adaptive-planner:metadata-index"
    );
    process.exitCode = 1;
    return;
  }

  const keyPresent =
    !!(process.env.PARENT_REPORT_AI_EXPLAINER_API_KEY || process.env.OPENAI_API_KEY);
  const useLiveAi =
    String(process.env.PARENT_REPORT_AI_SCENARIO_SIMULATOR_USE_AI || "").trim() === "1" && keyPresent;

  /** @type {object[]} */
  const rows = [];
  let anyFail = false;

  for (const sc of SCENARIOS) {
    const practicePayload = { ...sc.practice, subject: sc.subject, grade: sc.grade };
    const plannerOut = buildRuntimePlannerRecommendationFromPracticeResult(practicePayload, { metadataIndex: index });

    const plannerOk = plannerOut.ok === true;
    const nextAction =
      plannerOk && plannerOut.recommendation ? String(plannerOut.recommendation.nextAction || "") : "";
    const targetDifficulty =
      plannerOk && plannerOut.recommendation ? String(plannerOut.recommendation.targetDifficulty || "") : "";
    const questionCount =
      plannerOk && plannerOut.recommendation ? Number(plannerOut.recommendation.questionCount) || 0 : 0;

    const acc = Number(sc.practice.accuracy) || 0;
    const n = Number(sc.practice.totalQuestions) || 0;
    const accuracyBand = accuracyBandFromStats(acc, n);
    const dataConfidence = dataConfidenceFromCount(n);
    const consistencyBand = String(sc.consistencyBandOverride || "stable").toLowerCase();

    const recommendedNextStep = plannerOk ? recommendedNextStepHeFromPlannerAction(nextAction) : "";

    const parentInputRaw = {
      subject: sc.subject,
      grade: sc.grade,
      plannerNextAction: nextAction,
      plannerTargetDifficulty: targetDifficulty,
      plannerQuestionCount: questionCount,
      accuracyBand,
      consistencyBand,
      dataConfidence,
      mainStrengths: sc.mainStrengths || "",
      mainPracticeNeeds: sc.mainPracticeNeeds || "",
      recommendedNextStep,
    };

    const strict = buildStrictParentReportAIInput(parentInputRaw);
    let parentExplanation = { ok: false, text: "", source: /** @type {"ai"|"deterministic_fallback"|"none"} */ ("none") };

    if (strict && plannerOk) {
      const out = await buildParentReportAIExplanation(parentInputRaw, {
        env: process.env,
        preferDeterministicOnly: !useLiveAi,
      });
      if (out.ok) parentExplanation = { ok: true, text: out.text, source: out.source };
    }

    const text = parentExplanation.text || "";
    const narrativeSnapshot = strict ? parentReportAiInputToNarrativeEngineSnapshot(strict) : {};
    const v = text
      ? validateParentReportAIText(text, {
          runNarrativeGuard: true,
          narrativeEngineSnapshot: narrativeSnapshot,
          narrativeReportContext: { surface: "detailed" },
        })
      : { ok: false, reason: "empty" };

    const explanationSafe = v.ok === true;
    const groundedInPlanner = text ? isGroundedInPlanner(text, recommendedNextStep) : false;
    const parentFriendlyTone = explanationSafe;
    const noInternalLeak = explanationSafe;
    const noDiagnosticLanguage = explanationSafe;
    const noScaryLanguage = explanationSafe;
    const noBlameLanguage = explanationSafe;
    const noOverclaiming = explanationSafe;
    const noPromise = explanationSafe;
    const practicalNextStep = text ? practicalNextStepPresent(text) : false;

    let pass = true;
    if (!plannerOk) pass = false;
    if (!parentExplanation.ok || !text) pass = false;
    if (!explanationSafe) pass = false;
    if (!groundedInPlanner) pass = false;
    if (!practicalNextStep) pass = false;

    if (sc.scenarioId === "parent_geometry_topic_need" && plannerOk) {
      const diag = plannerOut.diagnostics && typeof plannerOut.diagnostics === "object" ? plannerOut.diagnostics : {};
      if (String(diag.skillAlignmentSource || "") !== "topic_mapping" || diag.metadataSubjectFallback === true) {
        pass = false;
      }
    }
    if (sc.scenarioId === "parent_english_safe_metadata" && plannerOk) {
      const diag = plannerOut.diagnostics && typeof plannerOut.diagnostics === "object" ? plannerOut.diagnostics : {};
      if (diag.metadataSubjectFallback === true) pass = false;
    }

    if (!pass) anyFail = true;

    rows.push({
      scenarioId: sc.scenarioId,
      subject: sc.subject,
      grade: sc.grade,
      inputSummary: {
        totalQuestions: sc.practice.totalQuestions,
        accuracy: sc.practice.accuracy,
        topic: sc.practice.topic,
        scenarioSimulatorId: sc.practice.scenarioSimulatorId,
      },
      plannerSummary: {
        nextAction,
        targetDifficulty,
        questionCount,
        dataConfidence,
      },
      parentExplanation,
      checks: {
        explanationSafe,
        groundedInPlanner,
        parentFriendlyTone,
        noInternalLeak,
        noDiagnosticLanguage,
        noScaryLanguage,
        noBlameLanguage,
        noOverclaiming,
        noPromise,
        practicalNextStep,
        pass,
      },
      plannerDiagnostics:
        plannerOk && (sc.scenarioId === "parent_geometry_topic_need" || sc.scenarioId === "parent_english_safe_metadata")
          ? {
              skillAlignmentSource: plannerOut.diagnostics?.skillAlignmentSource ?? null,
              metadataSubjectFallback: plannerOut.diagnostics?.metadataSubjectFallback === true,
            }
          : null,
      notes: sc.notes || "",
    });
  }

  await mkdir(OUT_DIR, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    liveAiRequested: String(process.env.PARENT_REPORT_AI_SCENARIO_SIMULATOR_USE_AI || "").trim() === "1",
    liveAiUsed: useLiveAi,
    liveAiKeyPresent: keyPresent,
    scenarioCount: rows.length,
    allPassed: !anyFail,
    scenarios: rows,
  };

  await writeFile(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  const mdLines = [
    `# Parent report AI scenario simulator`,
    ``,
    `- Generated: ${report.generatedAt}`,
    `- Live AI used: ${report.liveAiUsed}`,
    `- All passed: ${report.allPassed}`,
    ``,
    `| Scenario | Pass | nextAction | Source |`,
    `| --- | --- | --- | --- |`,
  ];
  for (const r of rows) {
    mdLines.push(
      `| ${r.scenarioId} | ${r.checks.pass} | ${r.plannerSummary.nextAction || "—"} | ${r.parentExplanation.source} |`
    );
  }
  mdLines.push("", `See ${OUT_JSON.replace(/\\/g, "/")}.`);
  await writeFile(OUT_MD, mdLines.join("\n"), "utf8");

  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_MD}`);

  assert(rows.length === SCENARIOS.length, "row count");

  const unsafe = "הילד חלש ויש לו בעיה רפואית לפי diagnostics של המערכת.";
  assert(validateParentReportAIText(unsafe).ok === false, "unsafe parent sample must fail");

  for (const r of rows) {
    assert(r.checks.pass === true, `scenario ${r.scenarioId} checks.pass`);
  }

  console.log(`All scenarios passed: ${!anyFail} (live AI: ${useLiveAi})`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
