/**
 * Phase C gate: coaching packs, script variants, in-session personalization (contract-bound).
 */
import assert from "node:assert/strict";
import { buildTruthPacketV1 } from "../utils/parent-copilot/truth-packet-v1.js";
import { planConversation } from "../utils/parent-copilot/conversation-planner.js";
import { composeAnswerDraft } from "../utils/parent-copilot/answer-composer.js";
import { validateAnswerDraft, validateParentCopilotResponseV1 } from "../utils/parent-copilot/guardrail-validator.js";
import { coachingVariantIndex, pickUncertaintyReasonScript } from "../utils/parent-copilot/parent-coaching-packs.js";
import parentCopilot from "../utils/parent-copilot/index.js";
import sessionMemory from "../utils/parent-copilot/session-memory.js";

function syntheticPayload() {
  const narrative = {
    contractVersion: "v1",
    topicKey: "t1",
    subjectId: "math",
    wordingEnvelope: "WE2",
    hedgeLevel: "light",
    allowedTone: "parent_professional_warm",
    forbiddenPhrases: ["בטוח לחלוטין"],
    requiredHedges: ["נכון לעכשיו"],
    allowedSections: ["summary", "finding", "recommendation", "limitations"],
    recommendationIntensityCap: "RI2",
    textSlots: {
      observation: "בשברים נצפו 12 שאלות, עם דיוק של כ־75%.",
      interpretation: "יש כיוון עבודה סביר, ועדיין נדרש אישור נוסף לפני מסקנה חזקה.",
      action: "מומלץ חיזוק ממוקד ובדיקת עצמאות קצרה לפני קידום.",
      uncertainty: "נכון לעכשיו כדאי להמשיך לעקוב ולאמת את הכיוון בסבב הקרוב.",
    },
  };
  const decision = {
    contractVersion: "v1",
    topicKey: "t1",
    subjectId: "math",
    decisionTier: 2,
    cannotConcludeYet: false,
  };
  const readiness = {
    contractVersion: "v1",
    topicKey: "t1",
    subjectId: "math",
    readiness: "emerging",
  };
  const confidence = {
    contractVersion: "v1",
    topicKey: "t1",
    subjectId: "math",
    confidenceBand: "medium",
  };
  const recommendation = {
    contractVersion: "v1",
    topicKey: "t1",
    subjectId: "math",
    eligible: true,
    intensity: "RI2",
    family: "general_practice",
    anchorEvidenceIds: ["ev1"],
    rationaleCodes: [],
    forbiddenBecause: [],
  };
  const tr = {
    topicRowKey: "t1",
    displayName: "שברים",
    questions: 12,
    accuracy: 75,
    contractsV1: {
      narrative,
      decision,
      readiness,
      confidence,
      recommendation,
      evidence: { contractVersion: "v1", topicKey: "t1", subjectId: "math" },
    },
  };
  return {
    version: 2,
    subjectProfiles: [{ subject: "math", topicRecommendations: [tr] }],
    executiveSummary: { majorTrendsHe: ["קו ראשון בתקופה"] },
  };
}

const payload = syntheticPayload();
const tp = buildTruthPacketV1(payload, {
  scopeType: "topic",
  scopeId: "t1",
  scopeLabel: "שברים",
});
assert.ok(tp);

const canonicalMeaningIntent = "what_is_most_important";
const plan = planConversation(canonicalMeaningIntent, tp, { continuityRepeat: false });
const draftPlain = composeAnswerDraft(plan, tp, null);
const draftC = composeAnswerDraft(plan, tp, {
  intent: canonicalMeaningIntent,
  continuityRepeat: false,
  conversationState: { priorIntents: [], repeatedPhraseHits: 0 },
});
const hasComposedMeaningCoach = draftC.answerBlocks.some(
  (b) => b.type === "meaning" && b.source === "composed",
);
assert.ok(hasComposedMeaningCoach, "expected composed meaning coaching for canonical meaning intent");
assert.ok(draftC.answerBlocks.length > draftPlain.answerBlocks.length);

const v = validateAnswerDraft(draftC, tp);
assert.ok(v.ok, v.failCodes.join(","));

const ixA = coachingVariantIndex({ priorIntents: [canonicalMeaningIntent], repeatedPhraseHits: 0 }, canonicalMeaningIntent);
const ixB = coachingVariantIndex({ priorIntents: ["what_to_do_today", "what_to_do_this_week"], repeatedPhraseHits: 0 }, canonicalMeaningIntent);
assert.notEqual(ixA, ixB);

const u0 = pickUncertaintyReasonScript({ cannotConcludeYet: false, confidenceBand: "high" }, canonicalMeaningIntent, 0);
const u1 = pickUncertaintyReasonScript({ cannotConcludeYet: false, confidenceBand: "high" }, canonicalMeaningIntent, 1);
assert.notEqual(u0, u1);

sessionMemory.resetParentCopilotSessionForTests("phaseC-e2e");
const r = parentCopilot.runParentCopilotTurn({
  audience: "parent",
  payload,
  utterance: "מה המשמעות של המספרים בשברים?",
  sessionId: "phaseC-e2e",
  selectedContextRef: null,
});
assert.ok(r.answerBlocks.length >= 2);
const ok = validateParentCopilotResponseV1(r);
assert.ok(ok.ok, ok.hardFails.join(","));

console.log("parent-copilot-phaseC-suite: OK");
