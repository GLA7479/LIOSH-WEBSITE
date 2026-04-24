/**
 * Selftest: intelligence layer v1 (read-only). Run: npm run test:intelligence-layer-v1
 */
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const { buildWeaknessConfidencePatternsV1 } = await import(
  pathToFileURL(join(ROOT, "utils", "intelligence-layer-v1", "weakness-confidence-patterns.js")).href
);

function unitBase(over = {}) {
  return {
    recurrence: { full: false, wrongCountForRules: 0 },
    confidence: { level: "moderate" },
    classification: { state: "classified", weakFallbackBlocked: false },
    taxonomy: { id: "tax_demo" },
    canonicalState: {
      actionState: "probe_only",
      decisionInputs: { counterEvidenceStrong: false },
      assessment: { confidenceLevel: "moderate" },
    },
    ...over,
  };
}

// Low data → no weakness
{
  const out = buildWeaknessConfidencePatternsV1({
    row: { questions: 2, wrong: 0, correct: 2, needsPractice: false },
    mistakes: [],
    unit: unitBase({ recurrence: { full: false, wrongCountForRules: 0 } }),
  });
  assert.equal(out.weakness.level, "none");
  assert.equal(out.gates.insufficientVolume, true);
  assert.equal(out.patterns.noPatternClaims, true);
}

// No recurrence → not stable (even with wrongs)
{
  const out = buildWeaknessConfidencePatternsV1({
    row: { questions: 12, wrong: 5, correct: 7, needsPractice: true },
    mistakes: [{ isCorrect: false, patternFamily: "pf:a" }],
    unit: unitBase({
      recurrence: { full: false, wrongCountForRules: 5 },
    }),
  });
  assert.notEqual(out.weakness.level, "stable");
  assert.equal(out.weakness.level, "tentative");
}

// Recurrence + volume → stable (when not blocked)
{
  const out = buildWeaknessConfidencePatternsV1({
    row: { questions: 12, wrong: 4, correct: 8, needsPractice: true },
    mistakes: [
      { isCorrect: false, patternFamily: "pf:x" },
      { isCorrect: false, patternFamily: "pf:y" },
    ],
    unit: unitBase({
      recurrence: { full: true, wrongCountForRules: 4 },
    }),
  });
  assert.equal(out.weakness.level, "stable");
  assert.equal(out.patterns.recurrenceFull, true);
  assert.ok(out.patterns.patternFamilies.length >= 1);
}

// Conflicting signals → medium confidence (volume sufficient)
{
  const out = buildWeaknessConfidencePatternsV1({
    row: { questions: 10, wrong: 4, correct: 6, confidence01: 0.9 },
    mistakes: [],
    unit: unitBase({
      confidence: { level: "contradictory" },
      canonicalState: {
        actionState: "diagnose_only",
        decisionInputs: { counterEvidenceStrong: false },
        assessment: { confidenceLevel: "contradictory" },
      },
    }),
  });
  assert.equal(out.confidence.band, "medium");
  assert.ok(out.confidence.rationaleCodes.includes("de_contradictory"));
}

// Withhold → no weakness conclusions, no pattern claims
{
  const out = buildWeaknessConfidencePatternsV1({
    row: { questions: 20, wrong: 6, correct: 14, needsPractice: true },
    mistakes: [{ isCorrect: false, patternFamily: "pf:z" }],
    unit: unitBase({
      recurrence: { full: true, wrongCountForRules: 6 },
      canonicalState: {
        actionState: "withhold",
        decisionInputs: { counterEvidenceStrong: false },
        assessment: { confidenceLevel: "insufficient_data" },
      },
    }),
  });
  assert.equal(out.weakness.level, "none");
  assert.equal(out.gates.canonicalWithhold, true);
  assert.equal(out.patterns.noPatternClaims, true);
  assert.equal(out.patterns.taxonomyId, null);
}

// Taxonomy blocked → no pattern taxonomy id, weakness capped tentative
{
  const out = buildWeaknessConfidencePatternsV1({
    row: { questions: 12, wrong: 4, correct: 8, needsPractice: true },
    mistakes: [{ isCorrect: false }],
    unit: unitBase({
      recurrence: { full: true, wrongCountForRules: 4 },
      classification: { state: "unclassified_weak_evidence", weakFallbackBlocked: true },
    }),
  });
  assert.equal(out.weakness.level, "tentative");
  assert.equal(out.patterns.taxonomyId, null);
  assert.equal(out.patterns.noPatternClaims, true);
}

console.log("intelligence-layer-v1-selftest: OK");
