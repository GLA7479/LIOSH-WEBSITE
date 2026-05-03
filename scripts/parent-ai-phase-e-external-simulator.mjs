/**
 * Phase E — focused checks for external questions, practice-idea routing, and thin child evidence.
 * Run: npm run test:parent-ai-phase-e:external
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { runParentCopilotTurn } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/index.js")).href);
const { syntheticPayload } = await import(pathToFileURL(join(ROOT, "scripts/parent-copilot-test-fixtures.mjs")).href);
const { PHASE_E_GENERAL_DISCLAIMER_LINE } = await import(
  pathToFileURL(join(ROOT, "utils/parent-ai-topic-classifier/classifier.js")).href
);

function joinedAnswers(res) {
  const blocks = Array.isArray(res?.answerBlocks) ? res.answerBlocks : [];
  return blocks
    .map((b) => String(b.textHe || ""))
    .join("\n")
    .trim();
}

/** External-looking paste → Phase E resolved shortcut (deterministic). */
{
  const payload = syntheticPayload();
  const utterance = `פתור את זה בבקשה:\n3x + 7 = 22\nשאלה מהשיעורי בית\nמה ערך x?`;
  const res = runParentCopilotTurn({ payload, utterance, sessionId: "phase-e-ext-1" });
  assert.equal(res.resolutionStatus, "resolved", "external paste should resolve");
  const body = joinedAnswers(res);
  assert.match(body, /מאגר השאלות הרשמי|הודבק/u, "general explanation framing — not grounded report Q&A");
  assert.match(body, /הסבר חינוכי כללי|אינו נשען על מאגר/u, "external path stays general-education only");
  assert.ok(!/חולשה\s+במערכת\s+האבחון/u.test(body), "no child-specific diagnostic claim for pasted content");
}

/** Practice suggestion → labeled disclaimer line. */
{
  const payload = syntheticPayload();
  const res = runParentCopilotTurn({
    payload,
    utterance: "תן לי רעיון לתרגול דומה",
    sessionId: "phase-e-prac-1",
  });
  assert.equal(res.resolutionStatus, "resolved");
  const body = joinedAnswers(res);
  assert.ok(body.includes(PHASE_E_GENERAL_DISCLAIMER_LINE), "exact mandated practice-idea label");
}

/** Thin evidence (topic scope, 0 questions): caution about insufficient child evidence. */
{
  const base = syntheticPayload({ eligible: false });
  const sp = base.subjectProfiles[0];
  const tr = sp.topicRecommendations[0];
  tr.questions = 0;
  tr.q = 0;
  const payload = { ...base, subjectProfiles: [{ ...sp, topicRecommendations: [{ ...tr }] }] };
  const res = runParentCopilotTurn({
    payload,
    utterance: "מה קורה בשברים אצל הילד?",
    sessionId: "phase-e-thin-1",
  });
  assert.equal(res.resolutionStatus, "resolved");
  const body = joinedAnswers(res);
  assert.match(body, /אין בדוח מספיק ראיות/u, "thin evidence caution");
}

/** Clarification bypass: catalog topic exists but report row not anchored — general path. */
{
  const payload = {
    version: 2,
    subjectProfiles: [
      {
        subject: "math",
        topicRecommendations: [
          {
            topicRowKey: "unanchored-topic",
            displayName: "משוואות ריבועיות",
            questions: 0,
            accuracy: 0,
            contractsV1: {
              narrative: {
                contractVersion: "v1",
                topicKey: "unanchored-topic",
                subjectId: "math",
                textSlots: {
                  observation: "",
                  interpretation: "",
                  action: null,
                  uncertainty: "",
                },
              },
            },
          },
        ],
      },
    ],
  };
  const utterance =
    "אני צריכה הסבר קצר מה זה משוואות ריבועיות ואיך מתחילים לפתור בלי להיכנס לכל ההוכחות";
  const res = runParentCopilotTurn({ payload, utterance, sessionId: "phase-e-bypass-1" });
  assert.equal(res.resolutionStatus, "resolved");
  const body = joinedAnswers(res);
  assert.match(body, /מוכרת במבנה הנושאים|מאגר השאלות הרשמי/u, "catalog-without-anchor or bank framing");
}

/** Baseline: normal topic Q&A still resolves from anchored report (no Phase E shortcut). */
{
  const payload = syntheticPayload({ eligible: true });
  const res = runParentCopilotTurn({
    payload,
    utterance: "מה כתוב בדוח על שברים?",
    sessionId: "phase-e-baseline-1",
  });
  assert.equal(res.resolutionStatus, "resolved");
  const body = joinedAnswers(res);
  assert.match(body, /שברים|נצפו|דיוק/u, "anchored topic observation still surfaces");
  assert.ok(!body.includes(PHASE_E_GENERAL_DISCLAIMER_LINE), "baseline path is not Phase E practice disclaimer");
}

console.log("OK parent-ai-phase-e-external-simulator");
