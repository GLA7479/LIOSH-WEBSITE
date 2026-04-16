/**
 * Reply-class classification (Hebrew paraphrase families) + continuity composition smoke.
 * Run: npm run test:parent-copilot-reply-class-paraphrase
 */
import assert from "node:assert/strict";
import { syntheticPayload } from "./parent-copilot-test-fixtures.mjs";
import parentCopilot from "../utils/parent-copilot/index.js";
import sessionMemory from "../utils/parent-copilot/session-memory.js";
import {
  classifyShortParentReplyClassHe,
  normalizeParentFollowupForClassHe,
} from "../utils/parent-copilot/conversational-reply-class-he.js";

const runParentCopilotTurn = parentCopilot.runParentCopilotTurn;

/** @type {Record<string, string[]>} */
const PARAPHRASE_FAMILIES = {
  affirmation_continue: [
    "כן",
    "כן בטח",
    "בטח",
    "סבבה",
    "לגמרי",
    "נשמע טוב",
    "מסכים",
    "מסכימה לגמרי",
    "יאללה קדימה",
    "בסדר גמור",
    "ככה זה",
  ],
  rejection_not_now: [
    "לא",
    "לא עכשיו",
    "לא כרגע",
    "אחר כך",
    "עדיין לא",
    "מספיק לעכשיו",
    "לא היום",
    "לא מתאים לי עכשיו",
    "נעצור כאן",
  ],
  concern_reaction: [
    "זה לא טוב",
    "לא טוב",
    "זה ממש מדאיג",
    "אני דואגת",
    "חוששת שיש בעיה",
    "זה נשמע רע",
    "מלחיץ אותי",
  ],
  confusion_simpler: [
    "לא הבנתי",
    "לא מבין",
    "מה זאת אומרת",
    "מה זה אומר",
    "אפשר יותר פשוט",
    "תסביר שוב בקצרה",
    "לא ברור לי",
    "לא בטוח שהבנתי",
  ],
  clarify_previous: [
    "מה הכוונה",
    "מה שאמרת לפני רגע",
    "למה אמרת את זה",
    "מה הקשר לזה",
    "תחזור על החלק האחרון",
    "לא הבנתי את הקטע",
  ],
  brief_continue: [
    "אז?",
    "ואז",
    "מה עכשיו",
    "תמשיך",
    "עוד קצת",
    "מה הלאה",
    "נמשיך",
  ],
};

for (const [expectedClass, variants] of Object.entries(PARAPHRASE_FAMILIES)) {
  for (const v of variants) {
    const got = classifyShortParentReplyClassHe(v, {});
    assert.equal(
      got,
      expectedClass,
      `classify(${JSON.stringify(v)}) expected ${expectedClass}, got ${got}; normalized=${JSON.stringify(normalizeParentFollowupForClassHe(v))}`,
    );
  }
}

/** Light typo / messy spacing should still land in affirmation. */
assert.equal(classifyShortParentReplyClassHe("כנ", {}), "affirmation_continue");
assert.equal(classifyShortParentReplyClassHe("  כן!!  ", {}), "affirmation_continue");

/** Long utterances should not be treated as short reply classes. */
assert.equal(
  classifyShortParentReplyClassHe("מה דעתך על המצב בשברים ובדקדוק ובאנגלית ובחשבון השבוע", {}),
  null,
);

function seedTopicContinuity(sid) {
  sessionMemory.resetParentCopilotSessionForTests(sid);
  sessionMemory.applyConversationStateDelta(sid, {
    addedScopeKey: "topic:t1",
    addedIntent: "what_to_do_today",
    scopeLabelSnapshotHe: "שברים",
    plannerIntentSnapshot: "what_to_do_today",
    lastOfferedFollowupFamily: "action_today",
    assistantAnswerSummary: "נכון לעכשיו בשברים נצפו שאלות עם דיוק יחסי; מומלץ צעד קטן לפי הדוח.",
  });
}

function assertContinuityNotGenericReport(sid, utterance, label) {
  seedTopicContinuity(sid);
  const r = runParentCopilotTurn({
    audience: "parent",
    payload: syntheticPayload({ eligible: true }),
    utterance,
    sessionId: sid,
  });
  assert.equal(r.resolutionStatus, "resolved", label);
  const first = String(r.answerBlocks?.[0]?.textHe || "").trim();
  assert.ok(!/^בקצרה:/u.test(first), `${label}: should not reopen like a fresh generic opener`);
  assert.ok(first.length >= 8 && first.length <= 700, `${label}: expected compact continuation lead`);
}

assertContinuityNotGenericReport("rc-e2e-aff-a", PARAPHRASE_FAMILIES.affirmation_continue[3], "affirmation variant A");
assertContinuityNotGenericReport("rc-e2e-aff-b", PARAPHRASE_FAMILIES.affirmation_continue[7], "affirmation variant B");

assertContinuityNotGenericReport("rc-e2e-rej-a", PARAPHRASE_FAMILIES.rejection_not_now[1], "rejection variant A");
assertContinuityNotGenericReport("rc-e2e-rej-b", PARAPHRASE_FAMILIES.rejection_not_now[4], "rejection variant B");

for (let ci = 0; ci < 2; ci += 1) {
  const u = PARAPHRASE_FAMILIES.concern_reaction[ci === 0 ? 2 : 4];
  const sid = `rc-e2e-conc-${ci}`;
  sessionMemory.resetParentCopilotSessionForTests(sid);
  sessionMemory.applyConversationStateDelta(sid, {
    addedScopeKey: "topic:t1",
    addedIntent: "explain_report",
    scopeLabelSnapshotHe: "שברים",
    plannerIntentSnapshot: "explain_report",
    lastOfferedFollowupFamily: "uncertainty_boundary",
    assistantAnswerSummary: "סיכום קצר על שברים לפי הדוח.",
  });
  const r = runParentCopilotTurn({
    audience: "parent",
    payload: syntheticPayload({ eligible: true }),
    utterance: u,
    sessionId: sid,
  });
  assert.equal(r.resolutionStatus, "resolved");
  const first = String(r.answerBlocks?.[0]?.textHe || "").trim();
  assert.ok(!/^בקצרה:/u.test(first), `concern ${u}`);
  assert.ok(/זה לא בהכרח|לפי מה שמופיע|תמונה/u.test(r.answerBlocks.map((b) => b.textHe).join(" ")));
}

assertContinuityNotGenericReport("rc-e2e-conf", PARAPHRASE_FAMILIES.confusion_simpler[2], "confusion");
assertContinuityNotGenericReport("rc-e2e-brief", PARAPHRASE_FAMILIES.brief_continue[2], "brief_continue");

sessionMemory.resetParentCopilotSessionForTests("rc-e2e-clar");
sessionMemory.applyConversationStateDelta("rc-e2e-clar", {
  addedScopeKey: "topic:t1",
  addedIntent: "explain_report",
  scopeLabelSnapshotHe: "שברים",
  plannerIntentSnapshot: "explain_report",
  lastOfferedFollowupFamily: "uncertainty_boundary",
  assistantAnswerSummary: "הדגשה קצרה על מה שמופיע בשברים לפי המדדים.",
});
const rClar = runParentCopilotTurn({
  audience: "parent",
  payload: syntheticPayload({ eligible: true }),
  utterance: PARAPHRASE_FAMILIES.clarify_previous[1],
  sessionId: "rc-e2e-clar",
});
assert.equal(rClar.resolutionStatus, "resolved");
assert.ok(!/^בקצרה:/u.test(String(rClar.answerBlocks?.[0]?.textHe || "").trim()));
assert.ok(String(rClar.answerBlocks?.[0]?.textHe || "").includes("שברים") || String(rClar.answerBlocks?.[0]?.textHe || "").includes("נשארים"));

console.log("parent-copilot-reply-class-paraphrase-suite: OK");
