#!/usr/bin/env node
/**
 * Phase 8-B focused checks: thin vs rich thin_data wording, aggregate anchor path, audit regex.
 * Run: node scripts/parent-ai-mass-simulation/phase8b-thin-volume-noanchor-selftest.mjs
 */
import parentCopilot from "../../utils/parent-copilot/index.js";

const { runParentCopilotTurn } = parentCopilot;

const THIN_DATA_LANGUAGE =
  /מעט\s+נתונים|נתונים\s+דלים|לא\s+מספיק\s+נתונים|מוגבל(?!ת|ים|ות)|מצומצם|דליל|אין\s+מספיק\s+בסיס\s+לתמונה/u;

function joinAnswer(res) {
  const blocks = Array.isArray(res?.answerBlocks) ? res.answerBlocks : [];
  return blocks
    .map((b) => String(b?.textHe || ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** Rich report: topic rows lack narrative observation (no real anchors) but global + per-subject counts satisfy aggregate synthetic path. */
function richPayloadNoNarrativeObs() {
  return {
    version: 2,
    summary: { totalAnswers: 220 },
    overallSnapshot: { totalQuestions: 220, accuracyPct: 72 },
    parentProductContractV1: {
      primarySubjectId: "math",
      top: {
        mainStatusHe: "בטווח התקופה נראית תמונה מעורבת עם כמה נקודות חיזוק.",
        whyHe: "חלק מהמקצועות עם דיוק בינוני וחלק עם ניסוח זהיר יותר.",
      },
    },
    subjectProfiles: [
      {
        subject: "math",
        subjectQuestionCount: 120,
        subjectAccuracy: 70,
        topicRecommendations: [
          {
            topicRowKey: "mult_blank",
            displayName: "כפל",
            questions: 120,
            accuracy: 70,
            contractsV1: {
              narrative: {
                contractVersion: "v1",
                textSlots: { observation: "", interpretation: "" },
              },
              decision: { cannotConcludeYet: true },
              readiness: { readiness: "forming" },
              confidence: { confidenceBand: "medium" },
              recommendation: { eligible: false, intensity: "RI0" },
            },
          },
        ],
      },
    ],
    executiveSummary: {
      majorTrendsHe: ["בתקופה נצבר נפח תרגול משמעותי; כדאי לקרוא את הדוח כמגמה ולא כרגע בודד."],
    },
  };
}

/** Thin window: below COPILOT_MIN aggregate (20) when only snapshot counts. */
function thinPayload() {
  return {
    version: 2,
    summary: { totalAnswers: 8 },
    overallSnapshot: { totalQuestions: 8, accuracyPct: 60 },
    subjectProfiles: [
      {
        subject: "math",
        subjectQuestionCount: 8,
        subjectAccuracy: 60,
        topicRecommendations: [
          {
            topicRowKey: "tthin",
            displayName: "חיבור",
            questions: 8,
            accuracy: 60,
            contractsV1: {
              narrative: {
                contractVersion: "v1",
                textSlots: {
                  observation: "בחיבור נצפו מעט נקודות תרגול בטווח.",
                  interpretation: "עדיין מוקדם לסגור תמונה ברורה.",
                },
              },
              decision: { cannotConcludeYet: true },
              readiness: { readiness: "insufficient" },
              confidence: { confidenceBand: "low" },
              recommendation: { eligible: false, intensity: "RI0" },
            },
          },
        ],
      },
    ],
    executiveSummary: { majorTrendsHe: [] },
  };
}

const thinQ = "האם אפשר להסיק מסקנות?";

// 1) Rich + thin_data question — must not open with false global scarcity
const rich = richPayloadNoNarrativeObs();
const richRes = runParentCopilotTurn({
  audience: "parent",
  payload: rich,
  utterance: thinQ,
  sessionId: "phase8b-rich-thin",
});
const richBody = joinAnswer(richRes);
assert(
  !/יש\s+כרגע\s+מעט\s+נתוני\s+תרגול/u.test(richBody),
  `rich synthetic-anchor path must not emit global thin opener; got: ${richBody.slice(0, 200)}`,
);
assert(
  !/נפח\s+הנתונים\s+עדיין\s+מצומצם/u.test(richBody),
  `rich path must not claim מצומצם scarcity; got: ${richBody.slice(0, 200)}`,
);

// 2) Thin profile — still expect cautious / scarcity-appropriate language (at least one thin signal)
const thin = thinPayload();
const thinRes = runParentCopilotTurn({
  audience: "parent",
  payload: thin,
  utterance: thinQ,
  sessionId: "phase8b-thin",
});
const thinBody = joinAnswer(thinRes);
assert(
  /מעט|מצומצם|זהיר|מוקדם|חלקי|לא\s+מספיק|דליל/u.test(thinBody),
  `thin window should keep cautious language; got: ${thinBody.slice(0, 240)}`,
);

// 3) data_grounded — no global no-anchor block when aggregate exists
const dgRes = runParentCopilotTurn({
  audience: "parent",
  payload: rich,
  utterance: "באיזה מקצוע הילד הכי חלש?",
  sessionId: "phase8b-dg-weak",
});
const dgBody = joinAnswer(dgRes);
assert(
  !/כרגע אין מספיק נתוני תרגול מעוגנים/u.test(dgBody),
  `data_grounded on aggregate-rich payload must avoid global no-anchor opener; got: ${dgBody.slice(0, 220)}`,
);
assert(/\d/.test(dgBody) || /חשבון|עברית|אנגלית|מדעים|גאומטריה|מולדת/u.test(dgBody), "data_grounded should include subject or numeric cue");

// 4) Audit regex: מוגבלת must not match THIN_DATA_LANGUAGE
assert(!THIN_DATA_LANGUAGE.test("לכן התמונה מוגבלת למה שכבר הוכנס לטווח התקופה."), "מוגבלת false positive");
assert(THIN_DATA_LANGUAGE.test("היקף הנתונים עדיין מצומצם."), "מצומצם still thin signal");

process.stdout.write("phase8b-thin-volume-noanchor-selftest: OK\n");
