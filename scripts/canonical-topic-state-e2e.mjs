/**
 * End-to-end integration test harness for CanonicalTopicState.
 * Run: npx tsx scripts/canonical-topic-state-e2e.mjs
 */
import assert from "node:assert/strict";
import * as canonicalMod from "../utils/canonical-topic-state/index.js";
import * as contractsMod from "../utils/contracts/decision-readiness-contract-v1.js";
import * as scenariosMod from "../tests/fixtures/canonical-topic-state-scenarios.mjs";

const buildCanonicalState = canonicalMod.buildCanonicalState || canonicalMod.default?.buildCanonicalState;
const validateCanonicalInvariants = canonicalMod.validateCanonicalInvariants || canonicalMod.default?.validateCanonicalInvariants;
const ACTION_STATES = canonicalMod.ACTION_STATES || canonicalMod.default?.ACTION_STATES;
const READINESS_STATES = canonicalMod.READINESS_STATES || canonicalMod.default?.READINESS_STATES;
const CONFIDENCE_LEVELS = canonicalMod.CONFIDENCE_LEVELS || canonicalMod.default?.CONFIDENCE_LEVELS;
const buildContractsFromCanonicalState = contractsMod.buildContractsFromCanonicalState || contractsMod.default?.buildContractsFromCanonicalState;
const SCENARIOS = scenariosMod.SCENARIOS || scenariosMod.default?.SCENARIOS;

assert.ok(typeof buildCanonicalState === "function", "buildCanonicalState import failed");
assert.ok(typeof validateCanonicalInvariants === "function", "validateCanonicalInvariants import failed");
assert.ok(Array.isArray(ACTION_STATES), "ACTION_STATES import failed");
assert.ok(typeof buildContractsFromCanonicalState === "function", "buildContractsFromCanonicalState import failed");
assert.ok(Array.isArray(SCENARIOS), "SCENARIOS import failed");

let passed = 0;
let failed = 0;
const failures = [];

function runScenario(scenario) {
  const { id, description, params, expected } = scenario;

  if (expected.stubOnly) {
    console.log(`  [SKIP] ${id}: ${description} (stub-only scenario, no canonical state to test)`);
    passed += 1;
    return;
  }

  try {
    const state = buildCanonicalState(params);

    // Invariant 14: frozen
    assert.ok(Object.isFrozen(state), `${id}: canonical state is not frozen`);

    // Validate all invariants pass
    try {
      validateCanonicalInvariants(state);
    } catch (e) {
      throw new Error(`${id}: invariant validation failed: ${e.message}`);
    }

    // Invariant 11: family === actionState
    assert.equal(state.recommendation.family, state.actionState, `${id}: family !== actionState`);

    // Invariant 12: no __unknown__
    assert.notEqual(state.subjectId, "__unknown_subject__", `${id}: subjectId is __unknown__`);
    assert.notEqual(state.topicKey, "__unknown_topic__", `${id}: topicKey is __unknown__`);

    // Invariant 13: no composite
    assert.ok(!state.topicKey.includes("\u0001"), `${id}: topicKey contains composite separator`);

    // Invariant 10: stateHash
    assert.ok(typeof state.stateHash === "string" && state.stateHash.length > 0, `${id}: stateHash is empty`);

    // topicStateId
    assert.equal(state.topicStateId, `${params.subjectId}::${params.topicKey}`, `${id}: topicStateId mismatch`);

    // Enum membership
    assert.ok(ACTION_STATES.includes(state.actionState), `${id}: actionState not in enum`);
    assert.ok(READINESS_STATES.includes(state.assessment.readiness), `${id}: readiness not in enum`);
    assert.ok(CONFIDENCE_LEVELS.includes(state.assessment.confidenceLevel), `${id}: confidenceLevel not in enum`);

    // decisionInputs present
    assert.ok(state.decisionInputs, `${id}: decisionInputs missing`);
    assert.ok(typeof state.decisionInputs.priorityLevel === "string", `${id}: priorityLevel missing`);

    // Check expected values
    for (const [key, expectedVal] of Object.entries(expected)) {
      if (key === "stubOnly" || key === "singleTopicStateId") continue;
      const path = key.split(".");
      let actual = state;
      for (const p of path) actual = actual?.[p];
      assert.deepStrictEqual(actual, expectedVal, `${id}: ${key} expected=${expectedVal}, got=${actual}`);
    }

    // Test contracts mirror
    const contracts = buildContractsFromCanonicalState(state);
    assert.equal(contracts.sourceOfTruth, "canonical-topic-state", `${id}: contracts sourceOfTruth`);
    assert.equal(contracts.canonicalStateId, state.topicStateId, `${id}: contracts canonicalStateId`);
    assert.equal(contracts.canonicalStateHash, state.stateHash, `${id}: contracts canonicalStateHash`);
    assert.equal(contracts.readiness.readiness, state.assessment.readiness, `${id}: contracts readiness`);

    // Deterministic hash: building again produces same hash
    const state2 = buildCanonicalState(params);
    assert.equal(state.stateHash, state2.stateHash, `${id}: stateHash not deterministic`);

    console.log(`  [PASS] ${id}: ${description}`);
    passed += 1;
  } catch (err) {
    console.error(`  [FAIL] ${id}: ${description}`);
    console.error(`         ${err.message}`);
    failed += 1;
    failures.push({ id, description, error: err.message });
  }
}

console.log("\n=== CanonicalTopicState E2E Test Suite ===\n");

for (const scenario of SCENARIOS) {
  runScenario(scenario);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

if (failures.length > 0) {
  console.error("FAILURES:");
  for (const f of failures) {
    console.error(`  ${f.id}: ${f.error}`);
  }
  process.exit(1);
}

console.log("All scenarios passed.");
process.exit(0);
