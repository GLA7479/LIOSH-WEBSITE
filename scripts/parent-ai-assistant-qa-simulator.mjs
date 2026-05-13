#!/usr/bin/env node
/**
 * Phase F — Parent Copilot + deterministic Parent AI insight QA simulator.
 * npm run test:parent-ai:assistant-qa
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { runParentCopilotTurn } = await import(pathToFileURL(join(ROOT, "utils/parent-copilot/index.js")).href);
const { getDeterministicDetailedParentAiExplanation } = await import(
  pathToFileURL(join(ROOT, "utils/parent-report-ai/parent-report-ai-adapter.js")).href
);
const { assertScenarioOutput, phaseFParentFacingTextFromTurn, phaseFSimulationTurnComplete } = await import(
  pathToFileURL(join(ROOT, "scripts/lib/parent-ai-phase-f-assertions.mjs")).href
);
const { writePhaseFArtifacts } = await import(pathToFileURL(join(ROOT, "scripts/lib/parent-ai-phase-f-report.mjs")).href);
const {
  buildDetailedPayloadForParentAiInsight,
  payloadTopicEnoughData,
  payloadTopicThinData,
} = await import(pathToFileURL(join(ROOT, "scripts/lib/parent-ai-phase-f-fixtures.mjs")).href);

/**
 * @returns {{ scenarios: object[]; allPassed: boolean }}
 */
export function runParentAiAssistantQaSimulator() {
  /** @type {object[]} */
  const scenarios = [];

  const table = [
    {
      id: "practice_focus",
      utterance: "מה כדאי לתרגל?",
      payload: payloadTopicEnoughData(),
      profile: "normal",
      sessionId: "pf-assist-practice",
    },
    {
      id: "why_recommendation",
      utterance: "למה ההמלצה הזאת?",
      payload: payloadTopicEnoughData(),
      profile: "normal",
      sessionId: "pf-assist-why-rec",
    },
    {
      id: "what_not_now",
      utterance: "מה לא כדאי לעשות עכשיו?",
      payload: payloadTopicEnoughData(),
      profile: "normal",
      sessionId: "pf-assist-not-now",
    },
    {
      id: "is_child_weak",
      utterance: "האם הילד חלש?",
      payload: payloadTopicEnoughData(),
      profile: "weak_question",
      sessionId: "pf-assist-weak",
    },
    {
      id: "topic_enough_data",
      utterance: "מה המצב בשברים לפי הדוח?",
      payload: payloadTopicEnoughData(),
      profile: "normal",
      sessionId: "pf-assist-topic-ok",
    },
    {
      id: "topic_thin_data",
      utterance: "מה קורה בשברים אצל הילד?",
      payload: payloadTopicThinData(),
      profile: "thin_evidence",
      sessionId: "pf-assist-topic-thin",
    },
    {
      id: "off_topic_weather",
      utterance: "מה מזג האוויר מחר בתל אביב?",
      payload: payloadTopicEnoughData(),
      profile: "normal",
      sessionId: "pf-assist-offtopic",
    },
  ];

  for (const row of table) {
    const res = runParentCopilotTurn({
      payload: row.payload,
      utterance: row.utterance,
      sessionId: row.sessionId,
    });
    const text = phaseFParentFacingTextFromTurn(res);
    const check = assertScenarioOutput(text, { profile: row.profile });
    const turnOk = phaseFSimulationTurnComplete(res);
    scenarios.push({
      id: row.id,
      utterance: row.utterance,
      resolutionStatus: res.resolutionStatus,
      pass: check.ok && turnOk,
      failures: [...(check.ok ? [] : check.failures), ...(turnOk ? [] : ["not_resolved_or_empty_boundary"])],
      hebrewRatio: check.hebrewRatio,
      answerExcerpt: text.slice(0, 900),
    });
  }

  /** Deterministic Parent AI summary insight (Phase B/C path). */
  {
    const detailed = buildDetailedPayloadForParentAiInsight();
    const insight = getDeterministicDetailedParentAiExplanation(detailed);
    const text = insight?.text || "";
    const check = assertScenarioOutput(text, { profile: "normal", minHebrewRatio: 0.2 });
    scenarios.push({
      id: "parent_ai_summary_insight_deterministic",
      utterance: "(deterministic detailed payload → getDeterministicDetailedParentAiExplanation)",
      resolutionStatus: insight?.ok ? "resolved" : "clarification_required",
      pass: !!(insight?.ok && check.ok && text.length > 20),
      failures: insight?.ok ? (check.ok ? [] : check.failures) : ["no_insight"],
      hebrewRatio: check.hebrewRatio,
      answerExcerpt: text.slice(0, 900),
    });
  }

  const passed = scenarios.filter((s) => s.pass).length;
  const summary = { total: scenarios.length, passed, failed: scenarios.length - passed };

  writePhaseFArtifacts("assistant-qa", { suite: "assistant-qa", summary, scenarios });

  return { scenarios, allPassed: summary.failed === 0, summary };
}

if (process.argv[1]?.includes("parent-ai-assistant-qa-simulator.mjs")) {
  const { allPassed, summary } = runParentAiAssistantQaSimulator();
  console.log(`parent-ai-assistant-qa-simulator: ${summary.passed}/${summary.total} passed`);
  process.exit(allPassed ? 0 : 1);
}
