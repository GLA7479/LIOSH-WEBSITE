/**
 * Validates **question classes** (routing + grounded answers), not exact product strings.
 * Run: npm run test:parent-copilot-question-class-behavior
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { syntheticPayload } = await import(pathToFileURL(join(ROOT, "scripts/parent-copilot-test-fixtures.mjs")).href);
const { resolveScope } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/scope-resolver.js")).href);
const { buildTruthPacketV1 } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/truth-packet-v1.js")).href);
const parentMod = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/index.js")).href);
const runParentCopilotTurn = parentMod.default?.runParentCopilotTurn ?? parentMod.runParentCopilotTurn;

const UI_HELPER_SUBSTRINGS = ["שאלה על הדוח", "תשובה:"];

const payload = syntheticPayload({ eligible: true });

/** @param {string} canonicalIntent */
function executiveTruthSlotsForIntent(canonicalIntent) {
  const tp = buildTruthPacketV1(payload, {
    scopeType: "executive",
    scopeId: "executive",
    scopeLabel: "הדוח בתקופה הנבחרה",
    interpretationScope: "executive",
    scopeClass: "executive",
    canonicalIntent,
  });
  assert.ok(tp, `truthPacket for intent ${canonicalIntent}`);
  const slots = tp.contracts?.narrative?.textSlots || {};
  return { o: String(slots.observation || ""), i: String(slots.interpretation || "") };
}

/**
 * Each key is a **behavior class**. `paraphrases` is a small family (short / noisy / informal / typos).
 * @type {Record<string, { expect: { resolutionStatus?: string; scopeType: string; scopeId?: string }; paraphrases: string[] }>}
 */
const QUESTION_CLASS_FAMILIES = {
  broadReportExecutive: {
    expect: { resolutionStatus: "resolved", scopeType: "executive" },
    paraphrases: [
      "מה המשמעות של הדוח הזה בשבילי בפועל?",
      "מה עקרונית חשוב שאדע מתוך הדוח?",
      "תעזרו לי לעשות סדר במספרים של הדוח לא מבין את התמונה",
      "מה הדוח אומר בגדול על התקופה??",
      "איך להבין את המסקנות בלי להיתקע בפרטים קטנים",
      "מה לשים לב אליו בדוח בתקופה הזאת",
      "רוצה תמונה כללית של מה קורה אצלנו מהדוח",
      "לא הבנתי את המשמעות תסבירו בקצרה על מה מדובר פה",
      "מה כדאי שאזכור מזה בדוח",
      "משמעות כללית של הדוח נא בבקשה",
      "מה חשוב שאני אקח מהדוח הזה הביתה",
      "איך לקרוא את הדוח בצורה חכמה כשיש הרבה נתונים",
      "מה אומר הדוח בכללותו?",
    ],
  },
  subjectAnchored: {
    expect: { resolutionStatus: "resolved", scopeType: "subject", scopeId: "math" },
    paraphrases: [
      "מה קורה בחשבון?",
      "במקצוע חשבון האמת לא ברור לי",
      "אני רוצה להבין חשבון",
      "בחשבון איך המצב בדוח?",
    ],
  },
  topicAnchored: {
    expect: { resolutionStatus: "resolved", scopeType: "topic", scopeId: "t1" },
    paraphrases: [
      "מה עם השברים?",
      "השברים - מה המצב?",
      "מה המצב בנושא השברים בדוח?",
      "שברים???",
    ],
  },
  actionExecutive: {
    expect: { resolutionStatus: "resolved", scopeType: "executive" },
    paraphrases: [
      "מה לעשות היום בבית?",
      "מה כדאי לעשות בשבוע הקרוב?",
      "תכנון לשבוע - מה מתחילים ממנו?",
    ],
  },
  meaningConcernExecutive: {
    expect: { resolutionStatus: "resolved", scopeType: "executive" },
    paraphrases: [
      "האם צריך לדאוג מהדוח?",
      "לא ברור לי אם זה חמור או לא",
      "יש פה משהו מדאיג לפי הדוח?",
    ],
  },
  communicationChildExecutive: {
    expect: { resolutionStatus: "resolved", scopeType: "executive" },
    paraphrases: [
      "איך להסביר לילד בלי להלחיץ?",
      "מה לומר בבית על מה שרשום בדוח?",
    ],
  },
  communicationTeacherExecutive: {
    expect: { resolutionStatus: "resolved", scopeType: "executive" },
    paraphrases: ["מה לכתוב למורה על מה שראינו בדוח?", "ניסוח לשאול את המורה בבקשה"],
  },
  strengthWeaknessExecutive: {
    expect: { resolutionStatus: "resolved", scopeType: "executive" },
    paraphrases: [
      "מה החזק ומה החלש בדוח?",
      "חוזקות מול חולשות בדוח בבקשה",
      "סיכום מאוזן של מה טוב ומה פחות",
    ],
  },
  clarifyTermExecutive: {
    expect: { resolutionStatus: "resolved", scopeType: "executive" },
    paraphrases: ["מה המשמעות של המונח הזה בדוח?", "מהזה אומר פה בדוח?"],
  },
};

let sessionSeq = 0;
for (const [className, def] of Object.entries(QUESTION_CLASS_FAMILIES)) {
  for (const utterance of def.paraphrases) {
    const sc = resolveScope({ payload, utterance, selectedContextRef: null });
    if (def.expect.resolutionStatus) {
      assert.equal(sc.resolutionStatus, def.expect.resolutionStatus, `${className}: ${utterance.slice(0, 36)}`);
    }
    assert.equal(sc.scope?.scopeType, def.expect.scopeType, `${className} scopeType: ${utterance.slice(0, 36)}`);
    if (def.expect.scopeId) {
      assert.equal(sc.scope?.scopeId, def.expect.scopeId, `${className} scopeId: ${utterance.slice(0, 36)}`);
    }
    if (def.expect.resolutionStatus === "resolved") {
      const res = runParentCopilotTurn({
        audience: "parent",
        payload,
        utterance,
        sessionId: `qclass-${className}-${sessionSeq++}`,
        selectedContextRef: null,
      });
      assert.equal(res.resolutionStatus, "resolved", `${className} turn: ${utterance.slice(0, 36)}`);
      assert.ok(Array.isArray(res.answerBlocks) && res.answerBlocks.length >= 1, `${className} blocks`);
      const joined = res.answerBlocks.map((b) => String(b.textHe || "")).join("\n");
      for (const bad of UI_HELPER_SUBSTRINGS) {
        assert.ok(!joined.includes(bad), `${className}: no UI helper leak "${bad}"`);
      }
    }
  }
}

// Same entity scope (executive): **intent classes** must yield distinct grounded narrative slots (not coaching overlap).
const intentClassesForSlotParity = [
  "explain_report",
  "what_is_most_important",
  "strength_vs_weakness_summary",
  "what_is_going_well",
  "is_intervention_needed",
  "how_to_tell_child",
  "question_for_teacher",
  "clarify_term",
  "what_to_do_this_week",
  "why_not_advance",
];
const slotSnapshots = intentClassesForSlotParity.map((canonicalIntent) => ({
  canonicalIntent,
  ...executiveTruthSlotsForIntent(canonicalIntent),
}));
for (let a = 0; a < slotSnapshots.length; a += 1) {
  for (let b = a + 1; b < slotSnapshots.length; b += 1) {
    const sameO = slotSnapshots[a].o === slotSnapshots[b].o;
    const sameI = slotSnapshots[a].i === slotSnapshots[b].i;
    assert.ok(
      !(sameO && sameI),
      `executive narrative slots must not fully collapse between intent ${slotSnapshots[a].canonicalIntent} and ${slotSnapshots[b].canonicalIntent}`,
    );
  }
}

console.log("parent-copilot-question-class-behavior-suite: OK");
