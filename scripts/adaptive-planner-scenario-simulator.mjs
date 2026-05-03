#!/usr/bin/env node
/**
 * Phase 6 — Planner + Explainer scenario simulator (engineering / QA only).
 * npm run test:adaptive-planner:scenario-simulator
 *
 * Writes reports/adaptive-learning-planner/scenario-simulator.{json,md}.
 * Deterministic by default (no OpenAI key required). Optional live AI:
 *   ADAPTIVE_PLANNER_SCENARIO_SIMULATOR_USE_AI=1 plus API key envs.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "adaptive-learning-planner");
const OUT_JSON = join(OUT_DIR, "scenario-simulator.json");
const OUT_MD = join(OUT_DIR, "scenario-simulator.md");

const bridgeMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-runtime-bridge.js", import.meta.url).href
);
const metaCtxMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-metadata-context.js", import.meta.url).href
);
const validateMod = await import(
  new URL("../lib/learning-client/adaptive-planner-explanation-validate.js", import.meta.url).href
);
const explainerMod = await import(
  new URL("../utils/adaptive-learning-planner/adaptive-planner-ai-explainer.js", import.meta.url).href
);
const vmMod = await import(
  new URL("../lib/learning-client/adaptive-planner-recommendation-view-model.js", import.meta.url).href
);

const { buildRuntimePlannerRecommendationFromPracticeResult } = bridgeMod;
const { validateLightEntriesNoForbiddenFields } = metaCtxMod;
const { validateAdaptivePlannerExplanationText } = validateMod;
const { buildAdaptivePlannerAIExplanation, buildStrictPlannerExplainerInput } = explainerMod;

/** Extra leak patterns beyond shared validator (QA gate). */
const INTERNAL_LEAK_RE =
  /reasonCodes|mustNotSay|\bdiagnostics\b|\bmetadata\b|\bplanner\b|\balgorithm\b|\bAI\b|\bmodel\b|\bfallback\b|\bJSON\b|\bscore\b|נימוק[\s\S]{0,12}קוד|סיבות\s*פנימיות/u;

const WEAK_OR_JUDGMENTAL_HE =
  /חלש\s*מאוד|נכשל|נכשלת|מאובחן|מאוחר|לא\s*נורמלי|עיכוב\s*התפתחות|מפגר|טיפש|כישלון\s*חמור/u;

const SCARY_OR_ABSOLUTE_HE = /להיבהל|סכנת|אסון|נורא\s*מאוד|בוודאות\s*יתכון|תמיד\s*תצליח|מובטח\s*שתצליח/u;

const OVERCLAIM_HE = /בהחלט\s*נצליח|מובטח|ודאות\s*מלאה|בטוח\s*שיהיה\s*טוב/u;

const { mapPlannerNextActionToHebrew } = vmMod;

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
 * @param {string} nextAction
 * @param {string} text
 */
function explanationContradictsPlanner(nextAction, text) {
  const n = String(nextAction || "").trim();
  const t = String(text || "");
  if (!t) return false;
  const hasAdvance = /שלב הבא|להתקדם/u.test(t);
  const hasFoundation = /חזק את הבסיס/u.test(t);
  if (n === "advance_skill" && hasFoundation && !hasAdvance) return true;
  if ((n === "practice_current" || n === "review") && hasAdvance && !hasFoundation && !/מעבר רחוק/u.test(t)) return true;
  return false;
}

/**
 * Rough alignment: explanation should not invent routes outside strict input themes.
 * @param {string} text
 * @param {string} approvedLine
 */
function explanationInventsOutsideAllowlist(text, approvedLine) {
  const t = String(text || "");
  const a = String(approvedLine || "");
  if (!t || !a) return false;
  const suspiciousEnglish = /\b(tenant|reason|bucket|skillId)\b/i;
  if (suspiciousEnglish.test(t)) return true;
  return false;
}

/**
 * @param {object} p
 * @param {string} p.text
 * @param {string} p.nextAction
 * @param {string} p.approvedHebrewRecommendationLine
 */
function runExplanationChecks(p) {
  const text = String(p.text || "");
  const nextAction = String(p.nextAction || "");
  const approved = String(p.approvedHebrewRecommendationLine || "");

  const v = validateAdaptivePlannerExplanationText(text);
  const explanationSafe = v.ok === true;

  const noInternalLeak = !INTERNAL_LEAK_RE.test(text) && !/\bjavascript\b/i.test(text);
  const noReasonCodesLeak = !/reasonCodes?/i.test(text);
  const noMustNotSayLeak = !/mustNotSay/i.test(text);
  const noDiagnosticsLeak = !/\bdiagnostics\b/i.test(text) && !/דיאגנוסטיקה\s*טכנית/u.test(text);

  const childFriendlyTone = !WEAK_OR_JUDGMENTAL_HE.test(text);
  const noScaryLanguage = !SCARY_OR_ABSOLUTE_HE.test(text);
  const noOverclaiming = !OVERCLAIM_HE.test(text);

  let hebrewOnly = false;
  if (v.ok) hebrewOnly = true;
  else if (v.reason === "not_hebrewish") hebrewOnly = false;
  else hebrewOnly = false;

  const explanationGrounded =
    text.length > 0 &&
    !explanationContradictsPlanner(nextAction, text) &&
    !explanationInventsOutsideAllowlist(text, approved);

  return {
    explanationSafe,
    explanationGrounded,
    noInternalLeak,
    noReasonCodesLeak,
    noMustNotSayLeak,
    noDiagnosticsLeak,
    childFriendlyTone,
    noScaryLanguage,
    noOverclaiming,
    hebrewOnly,
  };
}

/** @type {{ scenarioId: string, subject: string, grade: number|string, practice: Record<string, unknown>, notes: string, expectPlannerOk?: boolean }[]} */
const SCENARIOS = [
  {
    scenarioId: "strong_student_ready_to_advance",
    subject: "math",
    grade: 4,
    practice: {
      scenarioSimulatorId: "qa_strong_student_ready_to_advance_math_g4",
      topic: "numbers",
      totalQuestions: 120,
      correctAnswers: 108,
      wrongAnswers: 12,
      accuracy: 90,
      durationSeconds: 3600,
    },
    notes: "High accuracy, enough evidence; expect advance-style planner path when confidence thresholds align.",
    expectPlannerOk: true,
  },
  {
    scenarioId: "steady_student_continue_same_level",
    subject: "hebrew",
    grade: "g3",
    practice: {
      scenarioSimulatorId: "qa_steady_student_continue_same_level_hebrew_g3",
      topic: "reading",
      totalQuestions: 40,
      correctAnswers: 31,
      wrongAnswers: 9,
      accuracy: 78,
      durationSeconds: 900,
    },
    notes: "Maintain band accuracy with moderate evidence batch.",
    expectPlannerOk: true,
  },
  {
    scenarioId: "struggling_student_needs_foundation",
    subject: "science",
    grade: 3,
    practice: {
      scenarioSimulatorId: "qa_struggling_student_needs_foundation_science_g3",
      topic: "animals",
      totalQuestions: 12,
      correctAnswers: 4,
      wrongAnswers: 8,
      accuracy: 33,
      durationSeconds: 600,
    },
    notes: "Low accuracy with enough attempts → remediate-style engine inference.",
    expectPlannerOk: true,
  },
  {
    scenarioId: "short_session_not_enough_data",
    subject: "math",
    grade: 2,
    practice: {
      scenarioSimulatorId: "qa_short_session_not_enough_data_math_g2",
      topic: "addition",
      totalQuestions: 1,
      correctAnswers: 1,
      wrongAnswers: 0,
      accuracy: 100,
      durationSeconds: 20,
    },
    notes: "Very few items → insufficient_data / cautious pacing.",
    expectPlannerOk: true,
  },
  {
    scenarioId: "inconsistent_student",
    subject: "math",
    grade: 4,
    practice: {
      scenarioSimulatorId: "qa_inconsistent_student_pattern_math_g4",
      topic: "fractions",
      totalQuestions: 25,
      correctAnswers: 18,
      wrongAnswers: 7,
      accuracy: 72,
      durationSeconds: 400,
    },
    notes: "Scenario id includes inconsistent → probe/caution path.",
    expectPlannerOk: true,
  },
  {
    scenarioId: "fast_guessing_pattern",
    subject: "math",
    grade: 4,
    practice: {
      scenarioSimulatorId: "qa_fast_guessing_pattern_math_g4",
      topic: "multiplication",
      totalQuestions: 25,
      correctAnswers: 23,
      wrongAnswers: 2,
      accuracy: 92,
      durationSeconds: 40,
    },
    notes: "Scenario id includes guessing → cautious probe despite high accuracy.",
    expectPlannerOk: true,
  },
  {
    scenarioId: "geometry_topic_mapped_student",
    subject: "geometry",
    grade: 4,
    practice: {
      scenarioSimulatorId: "qa_geometry_topic_mapped_student_g4",
      topic: "perimeter",
      totalQuestions: 40,
      correctAnswers: 32,
      wrongAnswers: 8,
      accuracy: 80,
      durationSeconds: 700,
    },
    notes: "Geometry topic key present → topic_mapping alignment expected (no metadata fallback).",
    expectPlannerOk: true,
  },
  {
    scenarioId: "english_safe_metadata_student",
    subject: "english",
    grade: 5,
    practice: {
      scenarioSimulatorId: "qa_english_safe_metadata_student_g5",
      topic: "grammar",
      totalQuestions: 20,
      correctAnswers: 17,
      wrongAnswers: 3,
      accuracy: 85,
      durationSeconds: 500,
    },
    notes: "English grammar + index → safe routing regression guard.",
    expectPlannerOk: true,
  },
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

async function main() {
  const prevExplainer = process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;

  const index = await tryLoadMetadataIndexFromSnapshot(ROOT);
  if (!index) {
    console.error(
      "Missing or invalid reports/adaptive-learning-planner/metadata-index-snapshot.json — run npm run build:adaptive-planner:metadata-index"
    );
    process.exitCode = 1;
    return;
  }

  const keyPresent =
    !!(process.env.ADAPTIVE_PLANNER_AI_EXPLAINER_API_KEY || process.env.OPENAI_API_KEY);
  const useLiveAi =
    String(process.env.ADAPTIVE_PLANNER_SCENARIO_SIMULATOR_USE_AI || "").trim() === "1" && keyPresent;

  process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = "1";

  /** @type {object[]} */
  const rows = [];
  let anyFail = false;

  for (const sc of SCENARIOS) {
    const practicePayload = { ...sc.practice, subject: sc.subject, grade: sc.grade };
    const plannerOut = buildRuntimePlannerRecommendationFromPracticeResult(practicePayload, { metadataIndex: index });

    const plannerOk = plannerOut.ok === true;
    const nextAction =
      plannerOut.ok && plannerOut.recommendation ? String(plannerOut.recommendation.nextAction || "") : "";
    const targetDifficulty =
      plannerOut.ok && plannerOut.recommendation ? String(plannerOut.recommendation.targetDifficulty || "") : "";
    const questionCount =
      plannerOut.ok && plannerOut.recommendation ? Number(plannerOut.recommendation.questionCount) || 0 : 0;

    const approvedLine = nextAction ? mapPlannerNextActionToHebrew(nextAction) : "";

    const explainerRaw = {
      subject: sc.subject,
      grade: sc.grade,
      nextAction,
      targetDifficulty,
      questionCount,
      approvedHebrewRecommendationLine: approvedLine,
    };

    let explanation = { ok: false, text: "", source: /** @type {"ai"|"deterministic_fallback"|"none"} */ ("none") };

    if (plannerOk && approvedLine && buildStrictPlannerExplainerInput(explainerRaw)) {
      const ex = await buildAdaptivePlannerAIExplanation(explainerRaw, {
        env: process.env,
        preferDeterministicOnly: !useLiveAi,
      });
      if (ex.ok) {
        explanation = { ok: true, text: ex.text, source: ex.source };
      } else {
        explanation = { ok: false, text: "", source: "none" };
      }
    }

    const explanationChecks =
      plannerOk && explanation.ok && explanation.text
        ? runExplanationChecks({
            text: explanation.text,
            nextAction,
            approvedHebrewRecommendationLine: approvedLine,
          })
        : {
            explanationSafe: false,
            explanationGrounded: false,
            noInternalLeak: true,
            noReasonCodesLeak: true,
            noMustNotSayLeak: true,
            noDiagnosticsLeak: true,
            childFriendlyTone: true,
            noScaryLanguage: true,
            noOverclaiming: true,
            hebrewOnly: false,
          };

    let checks = { plannerOk, ...explanationChecks, pass: true };

    if (!plannerOk && sc.expectPlannerOk) checks.pass = false;
    if (!explanation.ok && plannerOk) checks.pass = false;
    if (explanationChecks.explanationSafe === false && plannerOk) checks.pass = false;
    if (explanationChecks.explanationGrounded === false && plannerOk && explanation.ok) checks.pass = false;
    if (explanationChecks.noInternalLeak === false) checks.pass = false;
    if (explanationChecks.childFriendlyTone === false) checks.pass = false;
    if (explanationChecks.noScaryLanguage === false) checks.pass = false;
    if (explanationChecks.noOverclaiming === false) checks.pass = false;
    if (explanationChecks.hebrewOnly === false && plannerOk && explanation.ok) checks.pass = false;

    /** Geometry / English regression signals */
    let notes = sc.notes;
    const diag = plannerOut.diagnostics && typeof plannerOut.diagnostics === "object" ? plannerOut.diagnostics : {};
    if (sc.scenarioId === "geometry_topic_mapped_student" && plannerOk) {
      const src = diag.skillAlignmentSource != null ? String(diag.skillAlignmentSource) : "";
      if (src !== "topic_mapping") {
        checks.pass = false;
        notes += ` [FAIL: expected skillAlignmentSource topic_mapping, got ${src || "null"}]`;
      }
      if (diag.metadataSubjectFallback === true) {
        checks.pass = false;
        notes += " [FAIL: metadataSubjectFallback should be false]";
      }
    }
    if (sc.scenarioId === "english_safe_metadata_student" && plannerOk) {
      if (diag.metadataSubjectFallback === true) {
        checks.pass = false;
        notes += " [FAIL: English safe path should not subject-fallback]";
      }
    }

    if (!checks.pass) anyFail = true;

    rows.push({
      scenarioId: sc.scenarioId,
      subject: sc.subject,
      grade: sc.grade,
      inputSummary: {
        totalQuestions: sc.practice.totalQuestions,
        accuracy: sc.practice.accuracy,
        topic: sc.practice.topic,
        durationSeconds: sc.practice.durationSeconds,
        scenarioSimulatorId: sc.practice.scenarioSimulatorId,
      },
      planner: {
        ok: plannerOk,
        nextAction,
        targetDifficulty,
        questionCount,
        reason: plannerOk ? null : plannerOut.reason || null,
      },
      explanation,
      checks,
      diagnostics: plannerOk
        ? {
            skillAlignmentSource: diag.skillAlignmentSource ?? null,
            metadataSubjectFallback: diag.metadataSubjectFallback === true,
            metadataExactMatch: diag.metadataExactMatch === true,
          }
        : null,
      notes,
    });
  }

  if (prevExplainer !== undefined) process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER = prevExplainer;
  else delete process.env.ENABLE_ADAPTIVE_PLANNER_AI_EXPLAINER;

  await mkdir(OUT_DIR, { recursive: true });

  const report = {
    generatedAt: new Date().toISOString(),
    liveAiRequested: String(process.env.ADAPTIVE_PLANNER_SCENARIO_SIMULATOR_USE_AI || "").trim() === "1",
    liveAiUsed: useLiveAi,
    liveAiKeyPresent: keyPresent,
    scenarioCount: rows.length,
    allPassed: !anyFail,
    scenarios: rows,
  };

  await writeFile(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  const mdLines = [
    `# Adaptive Planner scenario simulator`,
    ``,
    `- Generated: ${report.generatedAt}`,
    `- Live AI requested: ${report.liveAiRequested}`,
    `- Live AI used: ${report.liveAiUsed}`,
    `- API key present: ${report.liveAiKeyPresent}`,
    `- All scenarios passed: ${report.allPassed}`,
    ``,
    `| Scenario | Planner OK | nextAction | Explanation source | Pass |`,
    `| --- | --- | --- | --- | --- |`,
  ];
  for (const r of rows) {
    mdLines.push(
      `| ${r.scenarioId} | ${r.planner.ok} | ${r.planner.nextAction || "—"} | ${r.explanation.source} | ${r.checks.pass} |`
    );
  }
  mdLines.push(``, `Details: see ${OUT_JSON.replace(/\\/g, "/")}.`);
  await writeFile(OUT_MD, mdLines.join("\n"), "utf8");

  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_MD}`);

  /** Focused assertions (exit non-zero on failure); reports already written for inspection. */
  assert(rows.length === SCENARIOS.length, "row count");
  for (const r of rows) {
    assert(r.checks.pass === true, `scenario ${r.scenarioId} checks.pass`);
  }

  const unsafeSamples = [
    "נשתמש ב-reasonCodes הפנימיים כדי להחליט.",
    "לפי diagnostics המערכת אתה חלש מאוד ולא תצליח.",
    "המודל AI אמר להשתמש ב-metadata מהשרת.",
  ];
  for (const s of unsafeSamples) {
    assert(validateAdaptivePlannerExplanationText(s).ok === false, `unsafe sample should fail validator: ${s.slice(0, 40)}`);
    assert(INTERNAL_LEAK_RE.test(s) || WEAK_OR_JUDGMENTAL_HE.test(s), "unsafe sample should trip QA leak or tone gate");
  }

  console.log(`All scenarios passed: ${!anyFail} (live AI: ${useLiveAi})`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
