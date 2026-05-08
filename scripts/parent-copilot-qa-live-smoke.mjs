/**
 * Live smoke test for Parent Copilot async / Gemini path.
 *
 * Run with Gemini enabled:
 *   PARENT_COPILOT_LLM_ENABLED=true \
 *   PARENT_COPILOT_LLM_PROVIDER=gemini \
 *   PARENT_COPILOT_LLM_MODEL=gemini-2.5-flash \
 *   PARENT_COPILOT_LLM_EXPERIMENT=true \
 *   GEMINI_API_KEY=<key> \
 *   npx tsx scripts/parent-copilot-qa-live-smoke.mjs
 *
 * Without Gemini keys, tests still run but fall back to deterministic.
 */
import parentCopilotMod from "../utils/parent-copilot/index.js";

const { runParentCopilotTurnAsync } = parentCopilotMod;

const llmEnabled =
  process.env.PARENT_COPILOT_LLM_ENABLED === "true" &&
  process.env.PARENT_COPILOT_LLM_PROVIDER === "gemini" &&
  (process.env.GEMINI_API_KEY || "").trim().length > 0;

if (!llmEnabled) {
  console.warn(
    "\n⚠ GEMINI NOT CONFIGURED — running smoke test in deterministic-only mode.\n" +
      "  Set PARENT_COPILOT_LLM_ENABLED=true, PARENT_COPILOT_LLM_PROVIDER=gemini," +
      " PARENT_COPILOT_LLM_EXPERIMENT=true, and GEMINI_API_KEY to test the LLM path.\n",
  );
}

const payload = {
  version: 2,
  summary: { totalAnswers: 484 },
  overallSnapshot: { totalQuestions: 484, accuracyPct: 74 },
  subjectProfiles: [
    {
      subject: "math",
      topicRecommendations: [
        {
          topicRowKey: "geo",
          displayName: "גאומטריה",
          questions: 45,
          accuracy: 72,
          contractsV1: {
            narrative: {
              contractVersion: "v1", topicKey: "geo", subjectId: "math",
              wordingEnvelope: "WE2", hedgeLevel: "light", allowedTone: "parent_professional_warm",
              forbiddenPhrases: [], requiredHedges: [],
              allowedSections: ["summary", "finding", "recommendation", "limitations"],
              recommendationIntensityCap: "RI2",
              textSlots: {
                observation: "בגאומטריה נצפו 45 שאלות עם דיוק של כ-72%. נדרש חיזוק בזיהוי תכונות צורות.",
                interpretation: "גאומטריה מצריכה תרגול ממוקד בחישוב שטחים וזיהוי צורות.",
                action: "מומלץ לתרגל זיהוי צורות וחישוב שטחים פשוטים.",
                uncertainty: "",
              },
            },
            decision: { contractVersion: "v1", topicKey: "geo", subjectId: "math", decisionTier: 2, cannotConcludeYet: false },
            readiness: { contractVersion: "v1", topicKey: "geo", subjectId: "math", readiness: "emerging" },
            confidence: { contractVersion: "v1", topicKey: "geo", subjectId: "math", confidenceBand: "medium" },
            recommendation: { contractVersion: "v1", topicKey: "geo", subjectId: "math", eligible: true, intensity: "RI2", family: "general_practice", anchorEvidenceIds: [], rationaleCodes: [], forbiddenBecause: [] },
            evidence: { contractVersion: "v1", topicKey: "geo", subjectId: "math" },
          },
        },
        {
          topicRowKey: "frac",
          displayName: "שברים",
          questions: 60,
          accuracy: 68,
          contractsV1: {
            narrative: {
              contractVersion: "v1", topicKey: "frac", subjectId: "math",
              wordingEnvelope: "WE2", hedgeLevel: "light", allowedTone: "parent_professional_warm",
              forbiddenPhrases: [], requiredHedges: [],
              allowedSections: ["summary", "finding", "recommendation", "limitations"],
              recommendationIntensityCap: "RI2",
              textSlots: {
                observation: "בשברים נצפו 60 שאלות עם דיוק של כ-68%. שברים הם תחום שדורש תשומת לב.",
                interpretation: "שברים דורשים חיזוק בסיסי בהמרות ובחיבור.",
                action: "מומלץ לתרגל המרות שברים וחיבור שברים פשוטים.",
                uncertainty: "",
              },
            },
            decision: { contractVersion: "v1", topicKey: "frac", subjectId: "math", decisionTier: 2, cannotConcludeYet: false },
            readiness: { contractVersion: "v1", topicKey: "frac", subjectId: "math", readiness: "emerging" },
            confidence: { contractVersion: "v1", topicKey: "frac", subjectId: "math", confidenceBand: "high" },
            recommendation: { contractVersion: "v1", topicKey: "frac", subjectId: "math", eligible: true, intensity: "RI2", family: "general_practice", anchorEvidenceIds: [], rationaleCodes: [], forbiddenBecause: [] },
            evidence: { contractVersion: "v1", topicKey: "frac", subjectId: "math" },
          },
        },
      ],
    },
    {
      subject: "english",
      topicRecommendations: [
        {
          topicRowKey: "eng_vocab",
          displayName: "אוצר מילים",
          questions: 38,
          accuracy: 81,
          contractsV1: {
            narrative: {
              contractVersion: "v1", topicKey: "eng_vocab", subjectId: "english",
              wordingEnvelope: "WE1", hedgeLevel: "light", allowedTone: "parent_professional_warm",
              forbiddenPhrases: [], requiredHedges: [],
              allowedSections: ["summary", "finding"],
              recommendationIntensityCap: "RI2",
              textSlots: {
                observation: "באוצר מילים אנגלית נצפו 38 שאלות עם דיוק של כ-81%. ביצועים טובים.",
                interpretation: "אוצר מילים מתפתח בצורה טובה.",
                action: "המשיכו עם תרגול יומי קצר.",
                uncertainty: "",
              },
            },
            decision: { contractVersion: "v1", topicKey: "eng_vocab", subjectId: "english", decisionTier: 1, cannotConcludeYet: false },
            readiness: { contractVersion: "v1", topicKey: "eng_vocab", subjectId: "english", readiness: "ready" },
            confidence: { contractVersion: "v1", topicKey: "eng_vocab", subjectId: "english", confidenceBand: "high" },
            recommendation: { contractVersion: "v1", topicKey: "eng_vocab", subjectId: "english", eligible: true, intensity: "RI2", family: "vocabulary", anchorEvidenceIds: [], rationaleCodes: [], forbiddenBecause: [] },
            evidence: { contractVersion: "v1", topicKey: "eng_vocab", subjectId: "english" },
          },
        },
      ],
    },
  ],
  executiveSummary: {
    majorTrendsHe: [
      "בתקופה נצפו 484 שאלות עם דיוק ממוצע של 74%.",
      "תחומי הדגש: שברים וגאומטריה.",
      "אנגלית מראה ביצועים טובים יחסית.",
    ],
  },
};

const REPORT_QUESTIONS = [
  { q: "מה הכי חשוב לתרגל השבוע?", wantLlm: true },
  { q: "במה הוא חזק?", wantLlm: true },
  { q: "איפה כדאי להתמקד?", wantLlm: true },
  { q: "מה לעשות בבית?", wantLlm: true },
  { q: "האם יש סיבה לדאגה?", wantLlm: true },
  { q: "מה עם גאומטריה?", wantLlm: true },
];

const BANNED_SYSTEM_PHRASES = [
  "לפי הדוח, מופיעים:",
  "המקצועות שמופיעים",
  "מוקדים עם ניסוח יציב יחסית",
  "אפשר לסדר מה חשוב קודם",
  "זה מה שהדוח נותן כרגע",
];

let passed = 0;
let failed = 0;

console.log("=== Parent Copilot Live Smoke Test ===\n");
console.log(`LLM mode: ${llmEnabled ? "GEMINI ENABLED" : "DETERMINISTIC FALLBACK"}\n`);

for (const { q, wantLlm } of REPORT_QUESTIONS) {
  let res;
  try {
    res = await runParentCopilotTurnAsync({
      audience: "parent",
      payload,
      utterance: q,
      sessionId: `smoke-${Date.now()}`,
    });
  } catch (err) {
    console.error(`[FAIL] "${q}" — threw error: ${err?.message}`);
    failed++;
    continue;
  }

  const text =
    res.resolutionStatus === "resolved"
      ? (res.answerBlocks || []).map((b) => b.textHe).join("\n")
      : res.clarificationQuestionHe || "(no text)";

  const genPath = res.telemetry?.generationPath || "unknown";
  const issues = [];

  // Check for banned system-like phrases
  for (const phrase of BANNED_SYSTEM_PHRASES) {
    if (text.includes(phrase)) {
      issues.push(`banned phrase found: "${phrase}"`);
    }
  }

  // Check generation path when LLM is enabled
  if (llmEnabled && wantLlm && genPath !== "llm_grounded") {
    // LLM fallback is acceptable as long as the answer is product-quality
    // (validator rejection is valid). Just report it.
    issues.push(`generation path: ${genPath} (expected llm_grounded — may be validator fallback)`);
  }

  // Check answer is not empty
  if (!text || text.trim().length < 10) {
    issues.push("answer is empty or too short");
  }

  const status = issues.length === 0 ? "PASS" : (issues.some(i => !i.includes("generation path")) ? "FAIL" : "WARN");
  const icon = status === "PASS" ? "✓" : status === "WARN" ? "~" : "✗";

  if (status === "FAIL") failed++;
  else passed++;

  console.log(`[${icon}] "${q}"`);
  console.log(`    generationPath: ${genPath}`);
  console.log(`    answer:\n${text.split("\n").map(l => "      " + l).join("\n")}`);
  if (issues.length > 0) console.log(`    notes: ${issues.join(", ")}`);
  console.log();
}

console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
