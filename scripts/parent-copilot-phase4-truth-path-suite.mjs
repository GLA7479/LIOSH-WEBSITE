/**
 * Phase 4: report-truth answer path — Stage A → Stage B → TruthPacket → planner → composer.
 * Run: npm run test:parent-copilot-phase4
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { syntheticPayload } = await import(pathToFileURL(join(ROOT, "scripts/parent-copilot-test-fixtures.mjs")).href);
const { interpretFreeformStageA } = await import(
  pathToFileURL(join(ROOT, "utils/parent-copilot/stage-a-freeform-interpretation.js")).href
);
const { resolveScope } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/scope-resolver.js")).href);
const { buildTruthPacketV1 } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/truth-packet-v1.js")).href);
const { planConversation } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/conversation-planner.js")).href);
const { composeAnswerDraft } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/answer-composer.js")).href);
const { normalizeFreeformParentUtteranceHe } = await import(
  pathToFileURL(join(ROOT, "utils/parent-copilot/utterance-normalize-he.js")).href
);
const sessionMemory = (await import(pathToFileURL(join(ROOT, "utils/parent-copilot/session-memory.js")).href)).default;
const parentCopilot = (await import(pathToFileURL(join(ROOT, "utils/parent-copilot/index.js")).href)).default;

const ALLOWED_BLOCK_TYPES = new Set(["observation", "meaning", "next_step", "caution", "uncertainty_reason"]);

/** @param {unknown} payload */
function payloadIneligibleSingleSubject(payload) {
  const p = structuredClone(payload);
  p.subjectProfiles = [
    {
      subject: "math",
      topicRecommendations: [
        {
          topicRowKey: "t1",
          displayName: "שברים",
          questions: 14,
          accuracy: 78,
          contractsV1: {
            evidence: { contractVersion: "v1", topicKey: "t1", subjectId: "math" },
            decision: {
              contractVersion: "v1",
              topicKey: "t1",
              subjectId: "math",
              decisionTier: 0,
              cannotConcludeYet: true,
            },
            readiness: { contractVersion: "v1", topicKey: "t1", subjectId: "math", readiness: "insufficient" },
            confidence: { contractVersion: "v1", topicKey: "t1", subjectId: "math", confidenceBand: "low" },
            recommendation: {
              contractVersion: "v1",
              topicKey: "t1",
              subjectId: "math",
              eligible: false,
              intensity: "RI0",
              family: null,
              anchorEvidenceIds: [],
              forbiddenBecause: ["cannot_conclude_yet"],
            },
            narrative: {
              contractVersion: "v1",
              topicKey: "t1",
              subjectId: "math",
              wordingEnvelope: "WE0",
              hedgeLevel: "mandatory",
              allowedTone: "parent_professional_warm",
              forbiddenPhrases: ["בטוח לחלוטין"],
              requiredHedges: ["נכון לעכשיו"],
              allowedSections: ["summary", "finding", "recommendation", "limitations"],
              recommendationIntensityCap: "RI0",
              textSlots: {
                observation: "נכון לעכשיו בשברים נצפו 14 שאלות.",
                interpretation: "נכון לעכשיו נשמרת זהירות בגלל מגבלות בביטחון ובמוכנות.",
                action: null,
                uncertainty: "נכון לעכשיו כדאי להמשיך לעקוב ולאמת שוב.",
              },
            },
          },
        },
      ],
    },
  ];
  return p;
}

/**
 * @param {string} utterance
 * @param {unknown} payload
 * @param {null|object} selectedContextRef
 */
function manualDeterministicDraft(utterance, payload, selectedContextRef = null) {
  const utteranceStr = normalizeFreeformParentUtteranceHe(utterance);
  const stageA = interpretFreeformStageA(utterance, payload);
  const scopeRes = resolveScope({ payload, utterance: utteranceStr, selectedContextRef, stageA });
  assert.equal(scopeRes.resolutionStatus, "resolved", "manual path expects resolved scope");
  const truthPacket = buildTruthPacketV1(payload, /** @type {any} */ (scopeRes.scope));
  assert.ok(truthPacket);
  const intent = stageA.canonicalIntent;
  const plan = planConversation(intent, truthPacket, {
    continuityRepeat: false,
    turnOrdinal: 0,
    scopeType: truthPacket.scopeType,
    interpretationScope: truthPacket.interpretationScope,
  });
  return composeAnswerDraft(plan, truthPacket, {
    intent,
    continuityRepeat: false,
    conversationState: { priorIntents: [], repeatedPhraseHits: 0 },
    turnOrdinal: 0,
  });
}

function assertBlocksShape(blocks, label) {
  for (const b of blocks) {
    assert.ok(ALLOWED_BLOCK_TYPES.has(b.type), `${label}: forbidden block type ${b.type}`);
  }
}

function stripBlocks(blocks) {
  return blocks.map((b) => ({
    type: b.type,
    source: b.source,
    textHe: String(b.textHe || "").trim(),
  }));
}

// --- Full pipeline: manual chain matches first resolved turn ---
const payload = syntheticPayload();
const sessionId = "phase4-full-pipe";
sessionMemory.resetParentCopilotSessionForTests(sessionId);
const uttPipe = "מה המצב בנושא השברים?";
const manualPipe = manualDeterministicDraft(uttPipe, payload, null);
assertBlocksShape(manualPipe.answerBlocks, "manual");

sessionMemory.resetParentCopilotSessionForTests(sessionId);
const rPipe = parentCopilot.runParentCopilotTurn({ audience: "parent", payload, utterance: uttPipe, sessionId });
assert.equal(rPipe.resolutionStatus, "resolved");
assertBlocksShape(rPipe.answerBlocks, "runParentCopilotTurn");
assert.deepEqual(stripBlocks(manualPipe.answerBlocks), stripBlocks(rPipe.answerBlocks));

// --- Executive truth (aggregate → executive scope) ---
const execRes = resolveScope({
  payload,
  utterance: normalizeFreeformParentUtteranceHe("מה הכי בולט בתקופה בדוח?"),
  selectedContextRef: null,
});
assert.equal(execRes.scope?.scopeType, "executive");
const tpExec = buildTruthPacketV1(payload, /** @type {any} */ (execRes.scope));
const obsExec = String(tpExec?.contracts?.narrative?.textSlots?.observation || "");
assert.ok(
  obsExec.includes("קו ראשון") || /חשבון|אנגלית|לפי הדוח/u.test(obsExec),
  "executive observation should reflect anchored report lines or (when volume allows) executive summary trends",
);

// --- Subject-scoped truth ---
const subRes = resolveScope({
  payload,
  utterance: normalizeFreeformParentUtteranceHe("מה המשמעות בחשבון?"),
  selectedContextRef: null,
});
assert.equal(subRes.scope?.scopeType, "subject");
const tpSub = buildTruthPacketV1(payload, /** @type {any} */ (subRes.scope));
assert.ok(
  String(tpSub?.contracts?.narrative?.textSlots?.observation || "").includes("שברים"),
  "subject slice uses anchored topic row for that subject",
);

// --- Topic-scoped truth ---
const topicRes = resolveScope({
  payload,
  utterance: normalizeFreeformParentUtteranceHe("מה המצב בנושא השברים?"),
  selectedContextRef: null,
});
assert.equal(topicRes.scope?.scopeType, "topic");
const tpTopic = buildTruthPacketV1(payload, /** @type {any} */ (topicRes.scope));
assert.ok(String(tpTopic?.contracts?.narrative?.textSlots?.observation || "").includes("שברים"));

// --- Recommendation-ineligible: no next_step, skip ineligible semantic aggregate ---
const badPayload = payloadIneligibleSingleSubject(payload);
sessionMemory.resetParentCopilotSessionForTests("phase4-rec");
const rRec = parentCopilot.runParentCopilotTurn({
  audience: "parent",
  payload: badPayload,
  utterance: "מה לעשות עכשיו",
  sessionId: "phase4-rec",
});
assert.equal(rRec.resolutionStatus, "resolved");
assert.ok(!rRec.answerBlocks.some((b) => b.type === "next_step"), "must not plan next_step when not recommendation-eligible");
assert.equal(rRec.telemetry?.semanticAggregateSatisfied, false);
const aggregateIneligiblePhrase = "הדוח לא מכוון כרגע להמלצת צעד מוגדרת מהבית";
assert.ok(
  !rRec.answerBlocks.some((b) => String(b.textHe || "").includes(aggregateIneligiblePhrase)),
  "ineligible recommendation_action should not use semantic aggregate composed copy",
);
assert.ok(rRec.answerBlocks.some((b) => b.source === "contract_slot"), "expect contract-slot grounded composition");
assert.equal(rRec.fallbackUsed, false);

// --- Blocked-advance interpretation shapes planning ---
const tpBlocked = buildTruthPacketV1(payload, {
  scopeType: "topic",
  scopeId: "t1",
  scopeLabel: "שברים",
  interpretationScope: "blocked_advance",
  scopeClass: "blocked_advance",
});
const planBlocked = planConversation("why_not_advance", /** @type {any} */ (tpBlocked), {
  continuityRepeat: false,
  turnOrdinal: 0,
});
assert.equal(planBlocked.blockPlan[0], "uncertainty_reason");

// --- Confidence / uncertainty interpretation for teacher question ---
const tpCU = buildTruthPacketV1(payload, {
  scopeType: "topic",
  scopeId: "t1",
  scopeLabel: "שברים",
  interpretationScope: "confidence_uncertainty",
  scopeClass: "confidence_uncertainty",
});
const planTeacher = planConversation("question_for_teacher", /** @type {any} */ (tpCU), {
  continuityRepeat: false,
  turnOrdinal: 0,
});
assert.equal(planTeacher.blockPlan[0], "uncertainty_reason");
assert.equal(planTeacher.blockPlan[1], "meaning");

// --- Strengths: low readiness / confidence → probe-heavy plan (no strength-only framing) ---
const tpStrengthWeak = buildTruthPacketV1(badPayload, {
  scopeType: "topic",
  scopeId: "t1",
  scopeLabel: "שברים",
  interpretationScope: "strengths",
  scopeClass: "strengths",
});
const planWell = planConversation("what_is_going_well", /** @type {any} */ (tpStrengthWeak), {
  continuityRepeat: false,
  turnOrdinal: 0,
});
assert.ok(planWell.blockPlan.includes("uncertainty_reason"));
assert.ok(!planWell.blockPlan.includes("next_step"));

// --- Strength vs weakness summary: weaknesses scope → caution-first family order ---
const tpSVWeak = buildTruthPacketV1(payload, {
  scopeType: "topic",
  scopeId: "t1",
  scopeLabel: "שברים",
  interpretationScope: "weaknesses",
  scopeClass: "weaknesses",
});
const planSV = planConversation("strength_vs_weakness_summary", /** @type {any} */ (tpSVWeak), {
  continuityRepeat: false,
  turnOrdinal: 0,
});
assert.equal(planSV.blockPlan[0], "observation");
assert.equal(planSV.blockPlan[1], "meaning");
assert.equal(planSV.blockPlan[2], "caution");

// --- Stage A: balanced strength-vs phrasing → executive interpretation scope ---
const aBalanced = interpretFreeformStageA("מה חזק ומה חלש בדוח?", payload);
assert.equal(aBalanced.canonicalIntent, "strength_vs_weakness_summary");
assert.equal(aBalanced.scopeClass, "executive");

// --- Phase 2: no anchored topic rows → safe generic TruthPacket (option 4b) ---
const emptyAnchorsPayload = {
  subjectProfiles: [{ subject: "math", topicRecommendations: [] }],
  executiveSummary: {},
  diagnosticEngineV2: { units: [] },
};
const tpNoAnchorExec = buildTruthPacketV1(emptyAnchorsPayload, {
  scopeType: "executive",
  scopeId: "exec",
  scopeLabel: "הדוח",
  interpretationScope: "executive",
  scopeClass: "executive",
});
assert.ok(tpNoAnchorExec, "no-anchor executive must return fallback truth packet");
const obsNa = String(tpNoAnchorExec.contracts?.narrative?.textSlots?.observation || "");
assert.ok(
  /אין\s+כרגע\s+ניסוח\s+מעוגן|מעוגן\s+משורות|נתוני\s+תרגול\s+מעוגנים/u.test(obsNa),
  "no-anchor observation must stay generic (no topic-level claims)"
);
assert.equal(tpNoAnchorExec.surfaceFacts?.questions, 0);
const tpNoAnchorTopic = buildTruthPacketV1(emptyAnchorsPayload, {
  scopeType: "topic",
  scopeId: "missing",
  scopeLabel: "נושא",
  interpretationScope: "recommendation",
  scopeClass: "recommendation",
});
assert.ok(tpNoAnchorTopic);
assert.equal(tpNoAnchorTopic.surfaceFacts?.questions, 0);

console.log("parent-copilot-phase4-truth-path-suite: PASS");
