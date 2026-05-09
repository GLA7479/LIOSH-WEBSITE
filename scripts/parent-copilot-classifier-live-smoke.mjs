/**
 * Live classifier smoke test — exercises the LLM classifier upgrade path (Gemini).
 *
 * Run with Gemini enabled:
 *   PARENT_COPILOT_LLM_ENABLED=true \
 *   PARENT_COPILOT_LLM_PROVIDER=gemini \
 *   PARENT_COPILOT_LLM_MODEL=gemini-2.5-flash \
 *   PARENT_COPILOT_LLM_EXPERIMENT=true \
 *   GEMINI_API_KEY=<key> \
 *   npm run test:parent-copilot-classifier:live-smoke
 *
 * Without Gemini keys: skips gracefully (exit 0). The deterministic-only
 * classifier path is covered by parent-copilot-classifier-selftest.mjs.
 *
 * Per question, prints one line:
 *   bucket=... confidence=0.xx source=deterministic|llm|fallback reportContextUsed=true|false
 *
 * Soft-asserts that diagnostic / clearly off-topic questions never become
 * report_related (would print FAIL but exit non-zero only on hard failures).
 */

import parentCopilotMod from "../utils/parent-copilot/index.js";

const { runParentCopilotTurnAsync } = parentCopilotMod;

const llmEnabled =
  process.env.PARENT_COPILOT_LLM_ENABLED === "true" &&
  process.env.PARENT_COPILOT_LLM_PROVIDER === "gemini" &&
  (process.env.GEMINI_API_KEY || process.env.PARENT_COPILOT_LLM_API_KEY || "").trim().length > 0;

if (!llmEnabled) {
  console.warn(
    "⚠ Gemini classifier not configured — live smoke test SKIPPED.\n" +
      "  Set PARENT_COPILOT_LLM_ENABLED=true, PARENT_COPILOT_LLM_PROVIDER=gemini,\n" +
      "  PARENT_COPILOT_LLM_EXPERIMENT=true, and GEMINI_API_KEY to run.",
  );
  process.exit(0);
}

// ── Minimal report payload (subjects: math/english/science) ────────────────────
const payload = {
  version: 2,
  summary: { totalAnswers: 484 },
  overallSnapshot: { totalQuestions: 484, accuracyPct: 74 },
  subjectProfiles: [
    {
      subject: "math",
      topicRecommendations: [
        {
          topicRowKey: "frac", displayName: "שברים", questions: 60, accuracy: 68,
          contractsV1: {
            narrative: {
              contractVersion: "v1", topicKey: "frac", subjectId: "math",
              wordingEnvelope: "WE2", hedgeLevel: "light", allowedTone: "parent_professional_warm",
              forbiddenPhrases: [], requiredHedges: [],
              allowedSections: ["summary", "finding", "recommendation", "limitations"],
              recommendationIntensityCap: "RI2",
              textSlots: {
                observation: "בשברים נצפו 60 שאלות עם דיוק 68%.",
                interpretation: "שברים דורשים חיזוק.", action: "תרגל שברים.", uncertainty: "",
              },
            },
            decision: { contractVersion: "v1", topicKey: "frac", subjectId: "math", decisionTier: 2, cannotConcludeYet: false },
            readiness: { contractVersion: "v1", topicKey: "frac", subjectId: "math", readiness: "emerging" },
            confidence: { contractVersion: "v1", topicKey: "frac", subjectId: "math", confidenceBand: "medium" },
            recommendation: { contractVersion: "v1", topicKey: "frac", subjectId: "math", eligible: true, intensity: "RI2", family: "general_practice", anchorEvidenceIds: [], rationaleCodes: [], forbiddenBecause: [] },
            evidence: { contractVersion: "v1", topicKey: "frac", subjectId: "math" },
          },
        },
      ],
    },
  ],
  executiveSummary: { majorTrendsHe: ["בתקופה נצפו 484 שאלות."] },
};

// ── Cases ──────────────────────────────────────────────────────────────────────
/** @type {Array<{ q: string; expectNot?: string; expect?: string; group: string }>} */
const CASES = [
  // Unrelated questions NOT pre-listed in the deterministic lexicon
  { group: "unrelated", q: "מה דעתך על הדגל הישראלי?", expectNot: "report_related" },
  { group: "unrelated", q: "איך מתקנים מקרר שמשמיע רעש?", expectNot: "report_related" },
  // Vague questions
  { group: "vague", q: "תסביר", expectNot: "report_related" },
  { group: "vague", q: "מה אתה חושב על זה?", expectNot: "report_related" },
  // Report-related questions
  { group: "report", q: "מה הכי חשוב לתרגל השבוע?", expect: "report_related" },
  { group: "report", q: "במה הוא חזק?", expect: "report_related" },
  // Diagnostic
  { group: "diagnostic", q: "האם יש לו ADHD?", expectNot: "report_related" },
  { group: "diagnostic", q: "הוא דיסלקסי?", expectNot: "report_related" },
];

let hardFailures = 0;
let softWarnings = 0;

console.log("=== Parent Q&A Classifier Live Smoke ===");
console.log("Provider: Gemini\n");

for (const c of CASES) {
  let res;
  try {
    res = await runParentCopilotTurnAsync({
      audience: "parent",
      payload,
      utterance: c.q,
      sessionId: `cls-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });
  } catch (e) {
    console.error(`[ERROR] "${c.q}" — ${String(e?.message || e)}`);
    hardFailures += 1;
    continue;
  }

  const bucket =
    res?.metadata?.classifierBucket ||
    (res?.resolutionStatus === "resolved" ? "report_related" : "unknown");
  const source = res?.metadata?.classifierSource || "deterministic";
  const confidence = Number(res?.metadata?.classifierConfidence || 0);
  const reportContextUsed = !!(res?.scopeType && res?.scopeId);

  // Hard-fail: diagnostic / clear off-topic must never become report_related
  let mark = "ok";
  if (c.expectNot && bucket === c.expectNot) {
    mark = "FAIL";
    hardFailures += 1;
  } else if (c.expect && bucket !== c.expect) {
    // Soft warning — LLM may classify a vague-but-report question as ambiguous
    mark = "warn";
    softWarnings += 1;
  }

  console.log(
    `[${mark}] [${c.group}] "${c.q}"\n` +
      `      bucket=${bucket} confidence=${confidence.toFixed(2)} source=${source} reportContextUsed=${reportContextUsed}`,
  );
}

console.log(`\nHard failures: ${hardFailures}, soft warnings: ${softWarnings}`);
if (hardFailures > 0) process.exit(1);
