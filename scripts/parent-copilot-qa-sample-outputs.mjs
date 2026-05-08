/**
 * Generates manual sample outputs for the 7 required questions.
 * Run: npx tsx scripts/parent-copilot-qa-sample-outputs.mjs
 */
import parentCopilot from "../utils/parent-copilot/index.js";

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
                observation: "בגאומטריה נצפו 45 שאלות עם דיוק של כ-72%. יש כיוון עבודה ברור; נדרש חיזוק בזיהוי תכונות צורות.",
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

const questions = [
  "מה מזג אויר?",
  "מה הכי חשוב לתרגל השבוע?",
  "במה הוא חזק?",
  "איפה כדאי להתמקד?",
  "מה לעשות בבית?",
  "האם יש סיבה לדאגה?",
  "מה עם גאומטריה?",
];

let sid = 0;
for (const q of questions) {
  const res = parentCopilot.runParentCopilotTurn({
    audience: "parent",
    payload,
    utterance: q,
    sessionId: `sample-${++sid}`,
  });
  const text =
    res.resolutionStatus === "resolved"
      ? (res.answerBlocks || []).map((b) => b.textHe).join("\n\n")
      : res.clarificationQuestionHe;
  process.stdout.write(`--- שאלה: ${q} ---\n${text}\n\n`);
}
