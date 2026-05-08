/**
 * Focused Parent Copilot Q&A checks (no live LLM).
 * Run: node scripts/parent-copilot-qa-selftest.mjs
 */

import { interpretFreeformStageA } from "../utils/parent-copilot/stage-a-freeform-interpretation.js";
import { validateAnswerDraft } from "../utils/parent-copilot/guardrail-validator.js";
import { maxGlobalReportQuestionCount, STRONG_GLOBAL_QUESTION_FLOOR } from "../utils/parent-copilot/report-volume-context.js";

let failures = 0;
let runs = 0;

function check(name, ok, detail) {
  runs += 1;
  if (!ok) {
    failures += 1;
    process.stderr.write(`FAIL ${name}${detail ? ` :: ${detail}` : ""}\n`);
  }
}

function minimalTruthPacket(overrides = {}) {
  const base = {
    surfaceFacts: {
      questions: 30,
      reportQuestionTotalGlobal: 30,
      accuracy: 80,
      displayName: "מבט על התקופה",
      subjectLabelHe: "",
      weakFocusSubjectLabelHe: "",
      weakFocusTopicDisplayNameHe: "",
      relevantSummaryLines: [],
    },
    derivedLimits: {
      cannotConcludeYet: false,
      recommendationEligible: true,
      recommendationIntensityCap: "RI2",
      readiness: "ready",
      confidenceBand: "high",
    },
    contracts: {
      narrative: {
        textSlots: { observation: "x".repeat(20), interpretation: "y".repeat(20), uncertainty: "" },
      },
    },
    interpretationScope: "executive",
    allowedClaimEnvelope: { requiredHedges: [], forbiddenPhrases: [], wordingEnvelope: "WE1", allowedSections: ["summary"] },
  };
  return { ...base, ...overrides, surfaceFacts: { ...base.surfaceFacts, ...overrides.surfaceFacts } };
}

// A — off-topic intents
for (const q of ["מה מזג האוויר?", "מה השעה?", "תספר בדיחה"]) {
  const st = interpretFreeformStageA(q, {});
  check(`offtopic intent :: ${q}`, st.canonicalIntent === "off_topic_redirect", st.canonicalIntent);
}

// B — high volume: composed scarcity glue contradicts
const highVol = minimalTruthPacket({
  surfaceFacts: {
    questions: 400,
    reportQuestionTotalGlobal: 484,
    accuracy: 82,
  },
});
const badDraft = {
  answerBlocks: [
    { type: "observation", textHe: "יש כרגע מעט נתוני תרגול, ולכן אין עדיין מספיק מידע למסקנה חזקה. זה תירוץ.", source: "composed" },
    { type: "meaning", textHe: "המשך טקסט ארוך מספיק כדי לעבור חוקים בסיסיים של מבנה כאן.", source: "composed" },
  ],
};
const vHigh = validateAnswerDraft(badDraft, highVol, { intent: "explain_report" });
check(
  "high volume rejects global scarcity composed glue",
  !vHigh.ok && vHigh.failCodes.includes("truth_contradiction_global_thin_language_high_volume"),
  vHigh.failCodes?.join(","),
);

// C — emotional confidence blocked
const emoDraft = {
  answerBlocks: [
    { type: "observation", textHe: "נראה שכדאי לחזק את הביטחון בתרגול.", source: "composed" },
    { type: "meaning", textHe: "עוד משפט ארוך כדי למלא את דרישות האורך למשפט שני כאן בעברית.", source: "composed" },
  ],
};
const vEmo = validateAnswerDraft(emoDraft, minimalTruthPacket(), { intent: "explain_report" });
check("emotional confidence rejected", !vEmo.ok && vEmo.failCodes.includes("emotional_confidence_language"), vEmo.failCodes?.join(","));

// D — volume helper
check(
  "maxGlobalReportQuestionCount",
  maxGlobalReportQuestionCount({ summary: { totalAnswers: 300 }, overallSnapshot: { totalQuestions: 280 } }) === 300,
  String(maxGlobalReportQuestionCount({ summary: { totalAnswers: 300 }, overallSnapshot: { totalQuestions: 280 } })),
);

check("STRONG_GLOBAL_QUESTION_FLOOR sane", STRONG_GLOBAL_QUESTION_FLOOR === 120, String(STRONG_GLOBAL_QUESTION_FLOOR));

process.stdout.write(`\nparent-copilot-qa selftest :: ${runs - failures}/${runs} passed\n`);
if (failures) process.exit(1);
