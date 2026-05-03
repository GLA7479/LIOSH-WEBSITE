#!/usr/bin/env node
/**
 * Phase 8 — Parent report AI wiring integration checks (focused).
 * npm run test:parent-report-ai:integration
 */
const validateMod = await import(
  new URL("../lib/parent-report-ai/parent-report-ai-validate.js", import.meta.url).href
);
const explainerMod = await import(
  new URL("../utils/parent-report-ai/parent-report-ai-explainer.js", import.meta.url).href
);
const adapterMod = await import(
  new URL("../utils/parent-report-ai/parent-report-ai-adapter.js", import.meta.url).href
);

const { validateParentReportAIText, parentReportAiInputToNarrativeEngineSnapshot } = validateMod;
const { buildParentReportAIExplanation, buildStrictParentReportAIInput } = explainerMod;
const {
  buildStrictParentReportAIInputFromParentReportV2,
  enrichParentReportWithParentAi,
} = adapterMod;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function run(label, fn) {
  try {
    fn();
    console.log(`OK  ${label}`);
  } catch (e) {
    console.error(`FAIL ${label}:`, e?.message || e);
    process.exitCode = 1;
  }
}

const mockV2Report = {
  generatedAt: "2026-01-15T12:00:00.000Z",
  playerName: "Fixture",
  summary: {
    totalQuestions: 25,
    totalTimeMinutes: 40,
    overallAccuracy: 72,
    mathQuestions: 25,
    mathAccuracy: 72,
    geometryQuestions: 0,
    geometryAccuracy: 0,
    englishQuestions: 0,
    englishAccuracy: 0,
    scienceQuestions: 0,
    scienceAccuracy: 0,
    hebrewQuestions: 0,
    hebrewAccuracy: 0,
    moledetGeographyQuestions: 0,
    moledetGeographyAccuracy: 0,
    diagnosticOverviewHe: {
      strongestAreaLineHe: "חשבון: נראה סדר ותרגול עקבי בטווח",
      mainFocusAreaLineHe: "חשבון: כדאי לאחד דיוק בשאלות דומות",
      requiresAttentionPreviewHe: [],
    },
  },
  rawMetricStrengthsHe: ["חשבון: נוכחות טובה בפעילות בתקופה"],
  mathOperations: {
    row_fixture: { questions: 25, gradeKey: "g4", accuracy: 72, timeMinutes: 40 },
  },
  geometryTopics: {},
  englishTopics: {},
  scienceTopics: {},
  hebrewTopics: {},
  moledetGeographyTopics: {},
  hybridRuntime: null,
};

run("strict adapter input uses only allowlisted keys", () => {
  const strict = buildStrictParentReportAIInputFromParentReportV2(mockV2Report);
  assert(strict, "strict input");
  const keys = Object.keys(strict).sort();
  assert(
    keys.join(",") ===
      "accuracyBand,consistencyBand,dataConfidence,grade,mainPracticeNeeds,mainStrengths,plannerNextAction,plannerQuestionCount,plannerTargetDifficulty,recommendedNextStep,subject",
    `unexpected keys: ${keys.join(",")}`
  );
  assert(!("reasonCodes" in strict), "no reasonCodes");
  assert(!("diagnosticEngineV2" in strict), "no diagnostic blob");
});

run("enrichParentReportWithParentAi returns safe explanation without API key", async () => {
  const prev = process.env.OPENAI_API_KEY;
  const prev2 = process.env.PARENT_REPORT_AI_EXPLAINER_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.PARENT_REPORT_AI_EXPLAINER_API_KEY;
  const { parentAiExplanation } = await enrichParentReportWithParentAi(mockV2Report, {});
  if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
  else delete process.env.OPENAI_API_KEY;
  if (prev2 !== undefined) process.env.PARENT_REPORT_AI_EXPLAINER_API_KEY = prev2;
  else delete process.env.PARENT_REPORT_AI_EXPLAINER_API_KEY;
  assert(parentAiExplanation && parentAiExplanation.ok === true, "expected ok explanation");
  assert(typeof parentAiExplanation.text === "string" && parentAiExplanation.text.length > 40, "text");
  const v = validateParentReportAIText(parentAiExplanation.text, {
    runNarrativeGuard: true,
    narrativeEngineSnapshot: parentReportAiInputToNarrativeEngineSnapshot(
      /** @type {any} */ (buildStrictParentReportAIInputFromParentReportV2(mockV2Report))
    ),
    narrativeReportContext: { surface: "detailed" },
  });
  assert(v.ok === true, "validator");
});

run("unsafe Hebrew fails validateParentReportAIText", () => {
  const bad = "הילד חלש ויש diagnostics במערכת.";
  assert(validateParentReportAIText(bad).ok === false, "expected reject");
});

run("unsafe model output rejected; deterministic fallback used", async () => {
  const strict = buildStrictParentReportAIInputFromParentReportV2(mockV2Report);
  assert(strict, "strict");
  const prevKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "sk-test-integration-invalid";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: '{"text":"הילד חלש ויש metadata פנימי"}' } }],
    }),
  });
  const out = await buildParentReportAIExplanation(strict, { env: process.env, preferDeterministicOnly: false });
  globalThis.fetch = originalFetch;
  if (prevKey !== undefined) process.env.OPENAI_API_KEY = prevKey;
  else delete process.env.OPENAI_API_KEY;
  assert(out.ok === true, "still ok via fallback");
  assert(out.source === "deterministic_fallback", "fallback path");
  assert(!String(out.text).toLowerCase().includes("metadata"), "no leak in shown text");
});

run("narrative guard blocks overconfident thin framing", () => {
  const strict = buildStrictParentReportAIInput({
    subject: "math",
    grade: "g3",
    plannerNextAction: "pause_collect_more_data",
    plannerTargetDifficulty: "standard",
    plannerQuestionCount: 2,
    accuracyBand: "mixed",
    consistencyBand: "stable",
    dataConfidence: "thin",
    mainStrengths: "",
    mainPracticeNeeds: "",
    recommendedNextStep: "המערכת מציעה להמשיך לתרגל בהתאם למה שמתאים לך עכשיו.",
  });
  assert(strict, "strict thin");
  const snap = parentReportAiInputToNarrativeEngineSnapshot(strict);
  const risky = "בוודאות הכל ברור ואפשר לסגור את הנושא לחלוטין בלי עוד תרגול.";
  const v = validateParentReportAIText(risky, {
    runNarrativeGuard: true,
    narrativeEngineSnapshot: snap,
    narrativeReportContext: { surface: "detailed" },
  });
  assert(v.ok === false, "expected narrative guard failure");
});

if (process.exitCode) {
  console.error("parent-report-ai-integration.mjs: one or more checks failed");
  process.exit(1);
}
console.log("parent-report-ai-integration.mjs: all checks passed");
