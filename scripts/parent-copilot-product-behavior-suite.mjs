/**
 * Stage A + scope + withhold + parent detailed forbidden surfaces.
 * Run: npm run test:parent-copilot-product-behavior
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { interpretFreeformStageA, CANONICAL_PARENT_INTENTS } = await import(
  pathToFileURL(join(ROOT, "utils/parent-copilot/stage-a-freeform-interpretation.js")).href
);
const { resolveScope } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/scope-resolver.js")).href);
const { buildTruthPacketV1 } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/truth-packet-v1.js")).href);
const { planConversation } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/conversation-planner.js")).href);
const parentCopilot = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/index.js")).href);
const runTurn = parentCopilot.default?.runParentCopilotTurn ?? parentCopilot.runParentCopilotTurn;

const PARAPHRASE_BANK = {
  explain_report: [
    "מה רואים בדוח?",
    "מה כתוב בדוח בפועל?",
    "איך נראית תמונת המצב לפי הדוח?",
    "מה הנתונים אומרים כאן?",
    "מה המצב בדוח?",
    "מה מספרים אומרים?",
    "תן לי סיכום קצר של הדוח",
    "מה למדנו מהדוח?",
  ],
  what_to_do_today: [
    "מה לעשות היום?",
    "מה עושים היום בבית?",
    "מה הצעד להיום?",
    "משימה קטנה להיום",
    "מה לתרגל היום?",
    "מה מומלץ לעשות היום?",
    "פעולה להיום אחד",
    "מה לעשות מיד אחרי הבית ספר",
  ],
  what_is_going_well: [
    "מה הולך טוב?",
    "מה חזק בדוח?",
    "איפה יש הצלחה?",
    "מה עובד טוב?",
    "מה מצוין לפי הדוח?",
    "מה החוזקות?",
    "מה התקדמות חיובית?",
    "מה בולט לטובה?",
  ],
};

for (const [intent, phrases] of Object.entries(PARAPHRASE_BANK)) {
  assert.ok(phrases.length >= 8, `${intent}: need >=8 paraphrases`);
  for (const p of phrases) {
    const r = interpretFreeformStageA(p, null);
    assert.equal(
      r.canonicalIntent,
      intent,
      `paraphrase cluster: "${p.slice(0, 40)}..." -> expected ${intent}, got ${r.canonicalIntent}`
    );
  }
}

const EQUIVALENCE = [
  ["מה רואים בנתונים?", "מה כתוב בדוח?", "מה המצב בדוח?"],
  ["מה לעשות היום בבית?", "מה עושים היום?", "צעד קטן להיום"],
];
for (const cluster of EQUIVALENCE) {
  const intents = new Set(cluster.map((u) => interpretFreeformStageA(u, null).canonicalIntent));
  assert.equal(intents.size, 1, `equivalence cluster should map to one intent: ${[...intents].join(",")}`);
}

/** Withhold next_step: narrative allows action but recommendation ineligible */
function payloadIneligibleRec() {
  const narrative = {
    contractVersion: "v1",
    topicKey: "t1",
    subjectId: "math",
    wordingEnvelope: "WE2",
    hedgeLevel: "light",
    allowedTone: "parent_professional_warm",
    forbiddenPhrases: [],
    requiredHedges: ["נכון לעכשיו"],
    allowedSections: ["summary", "finding", "recommendation", "limitations"],
    recommendationIntensityCap: "RI0",
    textSlots: {
      observation: "בנושא נצפו 6 שאלות.",
      interpretation: "נכון לעכשיו התמונה עדיין רכה.",
      action: "להמשיך בתרגול קצר ומדוד.",
      uncertainty: "נכון לעכשיו כדאי לאסוף עוד תרגול לפני מסקנה חזקה.",
    },
  };
  const tr = {
    topicRowKey: "t1",
    displayName: "שברים",
    questions: 6,
    accuracy: 70,
    contractsV1: {
      narrative,
      decision: { contractVersion: "v1", topicKey: "t1", subjectId: "math", decisionTier: 1, cannotConcludeYet: true },
      readiness: { contractVersion: "v1", topicKey: "t1", subjectId: "math", readiness: "insufficient" },
      confidence: { contractVersion: "v1", topicKey: "t1", subjectId: "math", confidenceBand: "low" },
      recommendation: {
        contractVersion: "v1",
        topicKey: "t1",
        subjectId: "math",
        eligible: false,
        intensity: "RI0",
        family: "none",
        anchorEvidenceIds: [],
        rationaleCodes: [],
        forbiddenBecause: [],
      },
      evidence: { contractVersion: "v1", topicKey: "t1", subjectId: "math" },
    },
  };
  return { version: 2, subjectProfiles: [{ subject: "math", topicRecommendations: [tr] }] };
}

const pInel = payloadIneligibleRec();
const scope = { scopeType: "topic", scopeId: "t1", scopeLabel: "שברים", scopeClass: "recommendation" };
const tp = buildTruthPacketV1(pInel, scope);
assert.ok(tp && tp.derivedLimits.recommendationEligible === false);
const plan = planConversation("what_to_do_today", tp, { continuityRepeat: false, turnOrdinal: 0, scopeType: "topic" });
assert.ok(
  !plan.blockPlan.includes("next_step") || tp.derivedLimits.recommendationEligible,
  "withhold: planner must not schedule next_step when recommendation ineligible"
);

const detailedSrc = readFileSync(join(ROOT, "pages/learning/parent-report-detailed.js"), "utf8");
const forbiddenSubstrings = [
  "AiHybridInternalReviewerPanel",
  "reviewHybrid",
  "ai-hybrid-internal-reviewer",
  "mleo_internal_hybrid_reviewer",
  "ביקורת פנימית",
];
for (const s of forbiddenSubstrings) {
  assert.ok(
    !detailedSrc.includes(s),
    `parent-report-detailed.js must not contain parent-facing internal surface token: ${s}`
  );
}

const hybridPanelSrc = readFileSync(join(ROOT, "components/ai-hybrid-internal-reviewer-panel.jsx"), "utf8");
assert.ok(
  /NEXT_PUBLIC_INTERNAL_HYBRID_REVIEWER/.test(hybridPanelSrc),
  "internal reviewer panel must be gated by NEXT_PUBLIC_INTERNAL_HYBRID_REVIEWER"
);
assert.ok(
  /INTERNAL_HYBRID_REVIEWER_UI/.test(hybridPanelSrc) && /return null/.test(hybridPanelSrc),
  "internal reviewer panel must return null when gate is off"
);

const mobileSnapshotHeuristic = detailedSrc.includes("max-w-4xl") && !detailedSrc.includes("ai-hybrid-internal-reviewer");
assert.ok(mobileSnapshotHeuristic, "detailed page source must not wire internal hybrid reviewer class");

assert.ok(CANONICAL_PARENT_INTENTS.includes("explain_report"), "canonical intent list must include explain_report");

const res = runTurn({
  audience: "parent",
  payload: pInel,
  utterance: "מה לעשות היום בשברים?",
  sessionId: "product-behavior-withhold",
});
assert.equal(res.resolutionStatus, "resolved");
assert.ok(
  !(res.answerBlocks || []).some((b) => b.type === "next_step" && /תרגול קצר ומדוד/u.test(String(b.textHe || ""))),
  "withhold: parent answer blocks should not push contract action as next_step when ineligible"
);

console.log("parent-copilot-product-behavior-suite: OK");
