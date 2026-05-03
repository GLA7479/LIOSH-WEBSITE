#!/usr/bin/env node
/**
 * Phase G — tests for parent-ai-feedback-aggregate.mjs (synthetic telemetry only).
 * npm run test:parent-ai:feedback-aggregate
 */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const {
  aggregateParentAiFeedback,
  loadTelemetryEvents,
  findForbiddenKeys,
  runParentAiFeedbackAggregate,
} = await import(pathToFileURL(join(ROOT, "scripts/parent-ai-feedback-aggregate.mjs")).href);

const FIXTURE = join(ROOT, "scripts/fixtures/parent-ai-synthetic-telemetry-events.json");

{
  const { events } = loadTelemetryEvents(FIXTURE);
  assert.ok(events.length >= 4, "fixture has events");
  const agg = aggregateParentAiFeedback(events);
  assert.equal(agg.turnsSummary.totalTurns, events.length);
  assert.ok(agg.turnsSummary.byIntent.explain_report >= 1);
  assert.ok(agg.fallbacksSummary.fallbackTurns >= 1);
  assert.ok(agg.validatorFailures.turnsWithValidatorFails >= 1);
  assert.ok(agg.lowConfidenceAndUnresolved.clarificationRequiredTurns >= 1);
  assert.ok(agg.repeatedUnansweredTopics.repeatedClarificationByScopeReason.length >= 1);
  assert.ok(agg.externalQuestionGaps.estimatedExternalOrGeneralEducationTurns >= 1);
  assert.ok(agg.practiceSuggestionsReview.practicePhaseETurns >= 1);
}

{
  const tmpFb = join(ROOT, "reports/parent-ai/feedback/_test_tmp_phase_g");
  const tmpIm = join(ROOT, "reports/parent-ai/improvement-suggestions/_test_tmp_phase_g");
  try {
    rmSync(tmpFb, { recursive: true, force: true });
    rmSync(tmpIm, { recursive: true, force: true });
  } catch {
    /* no-op */
  }
  mkdirSync(tmpFb, { recursive: true });
  mkdirSync(tmpIm, { recursive: true });

  const r = runParentAiFeedbackAggregate({
    fixturePath: FIXTURE,
    feedbackDir: tmpFb,
    improvementDir: tmpIm,
  });
  assert.ok(r.ok);

  const required = [
    ["turns-summary.json", tmpFb],
    ["fallbacks-summary.json", tmpFb],
    ["validator-failures.json", tmpFb],
    ["low-confidence.json", tmpFb],
    ["repeated-unanswered.json", tmpFb],
    ["external-question-gaps.json", tmpIm],
    ["practice-suggestions-review.json", tmpIm],
  ];
  for (const [name, dir] of required) {
    const p = join(dir, name);
    assert.ok(existsSync(p), `missing ${p}`);
    const raw = JSON.parse(readFileSync(p, "utf8"));
    const leaks = findForbiddenKeys(raw);
    assert.deepEqual(leaks, [], `forbidden keys in ${name}: ${leaks.join(",")}`);
    assert.equal(raw.reviewClass, "human_review_only");
    assert.ok(!Object.prototype.hasOwnProperty.call(raw, "utterance"));
    assert.ok(!Object.prototype.hasOwnProperty.call(raw, "utteranceText"));
  }

  rmSync(tmpFb, { recursive: true, force: true });
  rmSync(tmpIm, { recursive: true, force: true });
}

console.log("OK parent-ai-feedback-aggregate-test");
