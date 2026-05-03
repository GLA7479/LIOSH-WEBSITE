#!/usr/bin/env node
/**
 * Phase F — External / Phase E routing scenarios (paste, practice idea, thin catalog).
 * npm run test:parent-ai:external-question
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { runParentCopilotTurn } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/index.js")).href);
const { syntheticPayload } = await import(pathToFileURL(join(ROOT, "scripts/parent-copilot-test-fixtures.mjs")).href);
const { assertScenarioOutput, PHASE_E_GENERAL_DISCLAIMER_LINE } = await import(
  pathToFileURL(join(ROOT, "scripts/lib/parent-ai-phase-f-assertions.mjs")).href
);
const { writePhaseFArtifacts } = await import(pathToFileURL(join(ROOT, "scripts/lib/parent-ai-phase-f-report.mjs")).href);

function joinedAnswers(res) {
  return (Array.isArray(res?.answerBlocks) ? res.answerBlocks : [])
    .map((b) => String(b.textHe || ""))
    .join("\n")
    .trim();
}

export function runParentAiExternalQuestionSimulator() {
  /** @type {object[]} */
  const scenarios = [];

  /** Pasted homework-style (Phase E resolved shortcut). */
  {
    const payload = syntheticPayload();
    const utterance = `פתור את זה בבקשה:\n3x + 7 = 22\nשאלה מהשיעורי בית\nמה ערך x?`;
    const res = runParentCopilotTurn({ payload, utterance, sessionId: "pf-ext-paste" });
    const text = joinedAnswers(res);
    const check = assertScenarioOutput(text, { profile: "external" });
    scenarios.push({
      id: "external_paste_equation",
      utterance,
      resolutionStatus: res.resolutionStatus,
      pass: check.ok && res.resolutionStatus === "resolved",
      failures: [...(check.failures || []), ...(res.resolutionStatus === "resolved" ? [] : ["not_resolved"])],
      answerExcerpt: text.slice(0, 900),
    });
  }

  /** Practice idea — exact mandated label. */
  {
    const payload = syntheticPayload();
    const utterance = "תן לי רעיון לתרגול דומה";
    const res = runParentCopilotTurn({ payload, utterance, sessionId: "pf-ext-practice" });
    const text = joinedAnswers(res);
    const check = assertScenarioOutput(text, { profile: "practice" });
    scenarios.push({
      id: "similar_practice_idea",
      utterance,
      resolutionStatus: res.resolutionStatus,
      pass: check.ok && text.includes(PHASE_E_GENERAL_DISCLAIMER_LINE),
      failures: [
        ...(check.failures || []),
        ...(text.includes(PHASE_E_GENERAL_DISCLAIMER_LINE) ? [] : ["missing_exact_disclaimer"]),
      ],
      answerExcerpt: text.slice(0, 900),
    });
  }

  /** Thin child evidence on scoped topic. */
  {
    const base = syntheticPayload({ eligible: false });
    const sp = base.subjectProfiles[0];
    const tr = { ...sp.topicRecommendations[0], questions: 0, q: 0 };
    const payload = { ...base, subjectProfiles: [{ ...sp, topicRecommendations: [tr] }] };
    const utterance = "מה קורה בשברים אצל הילד?";
    const res = runParentCopilotTurn({ payload, utterance, sessionId: "pf-ext-thin" });
    const text = joinedAnswers(res);
    const check = assertScenarioOutput(text, { profile: "thin_evidence" });
    scenarios.push({
      id: "thin_topic_evidence",
      utterance,
      resolutionStatus: res.resolutionStatus,
      pass: check.ok && res.resolutionStatus === "resolved",
      failures: check.failures || [],
      answerExcerpt: text.slice(0, 900),
    });
  }

  /** Catalog topic without anchored narrative — clarification bypass / Phase E. */
  {
    const payload = {
      version: 2,
      subjectProfiles: [
        {
          subject: "math",
          topicRecommendations: [
            {
              topicRowKey: "unanchored-topic-f",
              displayName: "משוואות ריבועיות",
              questions: 0,
              accuracy: 0,
              contractsV1: {
                narrative: {
                  contractVersion: "v1",
                  topicKey: "unanchored-topic-f",
                  subjectId: "math",
                  textSlots: { observation: "", interpretation: "", action: null, uncertainty: "" },
                },
              },
            },
          ],
        },
      ],
    };
    const utterance =
      "אני צריכה הסבר קצר מה זה משוואות ריבועיות ואיך מתחילים לפתור בלי להיכנס לכל ההוכחות";
    const res = runParentCopilotTurn({ payload, utterance, sessionId: "pf-ext-catalog" });
    const text = joinedAnswers(res);
    const check = assertScenarioOutput(text, { profile: "external" });
    scenarios.push({
      id: "catalog_topic_no_anchor",
      utterance,
      resolutionStatus: res.resolutionStatus,
      pass: check.ok && res.resolutionStatus === "resolved",
      failures: check.failures || [],
      answerExcerpt: text.slice(0, 900),
    });
  }

  const passed = scenarios.filter((s) => s.pass).length;
  const summary = { total: scenarios.length, passed, failed: scenarios.length - passed };
  writePhaseFArtifacts("external-question", { suite: "external-question", summary, scenarios });

  return { scenarios, allPassed: summary.failed === 0, summary };
}

if (process.argv[1]?.includes("parent-ai-external-question-simulator.mjs")) {
  const { allPassed, summary } = runParentAiExternalQuestionSimulator();
  console.log(`parent-ai-external-question-simulator: ${summary.passed}/${summary.total} passed`);
  process.exit(allPassed ? 0 : 1);
}
