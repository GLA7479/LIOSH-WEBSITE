#!/usr/bin/env node
/**
 * Phase F — run all Parent AI simulation suites and write a combined summary.
 * npm run test:parent-ai:simulations
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { runParentAiAssistantQaSimulator } = await import(pathToFileURL(join(ROOT, "scripts/parent-ai-assistant-qa-simulator.mjs")).href);
const { runParentAiExternalQuestionSimulator } = await import(pathToFileURL(join(ROOT, "scripts/parent-ai-external-question-simulator.mjs")).href);
const { runParentAiBadPromptSimulator } = await import(pathToFileURL(join(ROOT, "scripts/parent-ai-bad-prompt-simulator.mjs")).href);
const { writePhaseFArtifacts } = await import(pathToFileURL(join(ROOT, "scripts/lib/parent-ai-phase-f-report.mjs")).href);

const a = runParentAiAssistantQaSimulator();
const e = runParentAiExternalQuestionSimulator();
const b = runParentAiBadPromptSimulator();

const combined = {
  suite: "all-simulations",
  summary: {
    assistantQa: a.summary,
    externalQuestion: e.summary,
    badPrompt: b.summary,
    totalScenarios: a.summary.total + e.summary.total + b.summary.total,
    totalPassed: a.summary.passed + e.summary.passed + b.summary.passed,
    totalFailed: a.summary.failed + e.summary.failed + b.summary.failed,
  },
  children: {
    assistantQa: { scenarios: a.scenarios },
    externalQuestion: { scenarios: e.scenarios },
    badPrompt: { scenarios: b.scenarios },
  },
};

writePhaseFArtifacts("all-simulations", combined);

const allOk = a.allPassed && e.allPassed && b.allPassed;
console.log(
  `parent-ai-simulations-all: ${combined.summary.totalPassed}/${combined.summary.totalScenarios} scenarios passed (${allOk ? "OK" : "FAIL"})`,
);

process.exit(allOk ? 0 : 1);
