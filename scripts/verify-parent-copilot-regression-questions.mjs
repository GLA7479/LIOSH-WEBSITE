/**
 * One-off regression verification table (same pipeline as QA selftest).
 * Run: npx tsx scripts/verify-parent-copilot-regression-questions.mjs
 */
import parentCopilot from "../utils/parent-copilot/index.js";

function makeContract(topicKey, subjectId, obs, interp, act, unc, qCount = 12, acc = 75, recEligible = true) {
  return {
    topicRowKey: topicKey,
    displayName:
      topicKey === "geo"
        ? "גאומטריה"
        : topicKey === "frac"
          ? "שברים"
          : topicKey === "eng_vocab"
            ? "אוצר מילים"
            : "נושא כללי",
    questions: qCount,
    accuracy: acc,
    contractsV1: {
      narrative: {
        contractVersion: "v1",
        topicKey,
        subjectId,
        wordingEnvelope: "WE2",
        hedgeLevel: "light",
        allowedTone: "parent_professional_warm",
        forbiddenPhrases: [],
        requiredHedges: [],
        allowedSections: ["summary", "finding", "recommendation", "limitations"],
        recommendationIntensityCap: recEligible ? "RI2" : "RI0",
        textSlots: { observation: obs, interpretation: interp, action: act, uncertainty: unc },
      },
      decision: { contractVersion: "v1", topicKey, subjectId, decisionTier: 2, cannotConcludeYet: false },
      readiness: { contractVersion: "v1", topicKey, subjectId, readiness: "emerging" },
      confidence: { contractVersion: "v1", topicKey, subjectId, confidenceBand: "medium" },
      recommendation: {
        contractVersion: "v1",
        topicKey,
        subjectId,
        eligible: recEligible,
        intensity: recEligible ? "RI2" : "RI0",
        family: "general_practice",
        anchorEvidenceIds: [],
        rationaleCodes: [],
        forbiddenBecause: [],
      },
      evidence: { contractVersion: "v1", topicKey, subjectId },
    },
  };
}

function highDataPayload() {
  const mathGeo = makeContract(
    "geo",
    "math",
    "בגאומטריה נצפו 45 שאלות, עם דיוק של כ־72%.",
    "יש כיוון עבודה ברור בגאומטריה ונדרש חיזוק בזיהוי תכונות צורות.",
    "מומלץ לתרגל באופן ממוקד בזיהוי צורות וחישוב שטחים.",
    "כדאי לעקוב אחרי ההתקדמות בסבב הבא.",
  );
  const mathFrac = makeContract(
    "frac",
    "math",
    "בשברים נצפו 60 שאלות, עם דיוק של כ־68%.",
    "שברים מהווים אתגר ייחודי ודורשים חיזוק בסיסי בהמרות.",
    "מומלץ לתרגל המרות שברים וחיבור שברים פשוטים.",
    "כדאי לחזור לנושא אחרי עוד תרגול.",
  );
  const engVocab = makeContract(
    "eng_vocab",
    "english",
    "באוצר מילים אנגלית נצפו 38 שאלות, עם דיוק של כ־81%.",
    "אוצר מילים מתפתח בצורה טובה.",
    "המשך עם תרגול יומי קצר.",
    "",
  );
  return {
    version: 2,
    summary: { totalAnswers: 484 },
    overallSnapshot: { totalQuestions: 484, accuracyPct: 74 },
    subjectProfiles: [
      { subject: "math", topicRecommendations: [mathGeo, mathFrac] },
      { subject: "english", topicRecommendations: [engVocab] },
    ],
    executiveSummary: {
      majorTrendsHe: [
        "בתקופה הנבחרת נצפו 484 שאלות עם דיוק ממוצע של כ-74%.",
        "תחומי הדגש העיקריים הם שברים וגאומטריה.",
        "אנגלית מראה ביצועים טובים.",
      ],
    },
  };
}

const QUESTIONS = [
  "מה המקצוע החזק?",
  "איזה מקצוע הכי חזק?",
  "במה הוא טוב?",
  "איפה נראו התוצאות הכי טובות?",
  "מה נקודות החוזק?",
  "תסביר לי על הדוח",
  "מה הדוח אומר?",
  "מה המקצוע החלש?",
  "איזה מקצוע דורש חיזוק?",
];

let sid = 0;
const payload = highDataPayload();

process.stdout.write("Regression verification (highDataPayload, runParentCopilotTurn)\n\n");

for (const q of QUESTIONS) {
  const res = parentCopilot.runParentCopilotTurn({
    audience: "parent",
    payload,
    utterance: q,
    sessionId: `verify-${++sid}`,
    selectedContextRef: null,
  });

  const bucket = res.metadata?.classifierBucket ?? "(missing)";
  const semantic = res.metadata?.semanticIntent ?? "(missing)";
  const gp = res.telemetry?.generationPath ?? res.generationPath ?? "(missing)";
  const blocksText =
    res.resolutionStatus === "resolved"
      ? (Array.isArray(res.answerBlocks) ? res.answerBlocks : [])
          .map((b) => String(b?.textHe || "").trim())
          .filter(Boolean)
          .join("\n\n")
      : String(res.clarificationQuestionHe || "").trim();

  process.stdout.write(`--- ${q} ---\n`);
  process.stdout.write(`classifierBucket: ${bucket}\n`);
  process.stdout.write(`semanticIntent: ${semantic}\n`);
  process.stdout.write(`generationPath: ${gp}\n`);
  process.stdout.write(`final visible answer:\n${blocksText}\n\n`);
}
