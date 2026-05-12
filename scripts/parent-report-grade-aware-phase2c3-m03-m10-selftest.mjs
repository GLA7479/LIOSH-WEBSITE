/**
 * Phase 2-C3 — M-03 / M-10 bucket-aware grade-aware templates + routing smoke.
 * Run: npx tsx scripts/parent-report-grade-aware-phase2c3-m03-m10-selftest.mjs
 */

import assert from "node:assert/strict";

const [templatesMod, resolverMod, detailedMod, parentReportV2Mod, multOrderMod, fracOrderMod] = await Promise.all([
  import("../utils/parent-report-language/grade-aware-recommendation-templates.js"),
  import("../utils/parent-report-language/grade-aware-recommendation-resolver.js"),
  import("../utils/detailed-parent-report.js"),
  import("../utils/parent-report-v2.js"),
  import(new URL("../utils/diagnostic-engine-v2/multiplication-taxonomy-candidate-order.js", import.meta.url).href),
  import(new URL("../utils/diagnostic-engine-v2/fraction-taxonomy-candidate-order.js", import.meta.url).href),
]);

const T = templatesMod.GRADE_AWARE_RECOMMENDATION_TEMPLATES.math;
const { resolveGradeAwareParentRecommendationHe } = resolverMod;
const { buildDetailedParentReportFromBaseReport } = detailedMod;
const { summarizeV2UnitsForSubjectForTests } = parentReportV2Mod;
const { orderMultiplicationTaxonomyCandidates } = multOrderMod;
const { orderFractionTaxonomyCandidates } = fracOrderMod;

const M03 = T["M-03"].bucketOverrides;
const M10 = T["M-10"].bucketOverrides;

const BANNED = [
  "אותם זוגות שגויים",
  "בחירת כפל לא מתאים לחילוק",
  "זמן כפול לאותו סט",
  "תרגול ממוקד זוג",
  "עם/בלי משפט כפל",
  "קישור כפל־חילוק",
];

function assertNoBanned(label, s) {
  const t = String(s || "");
  for (const b of BANNED) {
    assert.ok(!t.includes(b), `${label} must not contain raw taxonomy phrase: ${b}`);
  }
}

function r(input) {
  return resolveGradeAwareParentRecommendationHe(input);
}

// --- Resolver: M-03 / M-10 ---
{
  assert.equal(r({ subjectId: "math", gradeKey: "g2", taxonomyId: "M-03", bucketKey: "multiplication", slot: "action" }), null);
  assert.equal(r({ subjectId: "math", gradeKey: "g1", taxonomyId: "M-03", bucketKey: "multiplication", slot: "nextGoal" }), null);

  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-03", bucketKey: "multiplication", slot: "action" }),
    M03.multiplication.g3_g4.actionTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-03", bucketKey: "multiplication", slot: "nextGoal" }),
    M03.multiplication.g3_g4.goalTextHe
  );
  assert.ok(M03.multiplication.g3_g4.actionTextHe !== M03.multiplication.g3_g4.goalTextHe);

  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g6", taxonomyId: "M-03", bucketKey: "multiplication", slot: "action" }),
    M03.multiplication.g5_g6.actionTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g5", taxonomyId: "M-03", bucketKey: "multiplication", slot: "nextGoal" }),
    M03.multiplication.g5_g6.goalTextHe
  );

  assert.equal(r({ subjectId: "math", gradeKey: "g2", taxonomyId: "M-03", bucketKey: "factors_multiples", slot: "action" }), null);
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g3", taxonomyId: "M-03", bucketKey: "factors_multiples", slot: "action" }),
    M03.factors_multiples.g3_g4.actionTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-03", bucketKey: "factors_multiples", slot: "nextGoal" }),
    M03.factors_multiples.g3_g4.goalTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g6", taxonomyId: "M-03", bucketKey: "factors_multiples", slot: "action" }),
    M03.factors_multiples.g5_g6.actionTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g5", taxonomyId: "M-03", bucketKey: "factors_multiples", slot: "nextGoal" }),
    M03.factors_multiples.g5_g6.goalTextHe
  );

  assert.equal(r({ subjectId: "math", gradeKey: "g2", taxonomyId: "M-03", bucketKey: "powers", slot: "action" }), null);
  assert.equal(r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-03", bucketKey: "powers", slot: "action" }), null);
  assert.equal(r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-03", bucketKey: "powers", slot: "nextGoal" }), null);
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g6", taxonomyId: "M-03", bucketKey: "powers", slot: "action" }),
    M03.powers.g5_g6.actionTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g5", taxonomyId: "M-03", bucketKey: "powers", slot: "nextGoal" }),
    M03.powers.g5_g6.goalTextHe
  );

  assert.equal(r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-03", bucketKey: "mixed", slot: "action" }), null);

  assert.equal(r({ subjectId: "math", gradeKey: "g2", taxonomyId: "M-10", bucketKey: "multiplication", slot: "action" }), null);
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-10", bucketKey: "multiplication", slot: "action" }),
    M10.multiplication.g3_g4.actionTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g3", taxonomyId: "M-10", bucketKey: "multiplication", slot: "nextGoal" }),
    M10.multiplication.g3_g4.goalTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g6", taxonomyId: "M-10", bucketKey: "multiplication", slot: "action" }),
    M10.multiplication.g5_g6.actionTextHe
  );
  assert.ok(M10.multiplication.g5_g6.actionTextHe !== M10.multiplication.g5_g6.goalTextHe);

  assert.equal(r({ subjectId: "math", gradeKey: "g2", taxonomyId: "M-10", bucketKey: "division", slot: "action" }), null);
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-10", bucketKey: "division", slot: "action" }),
    M10.division.g3_g4.actionTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g3", taxonomyId: "M-10", bucketKey: "division", slot: "nextGoal" }),
    M10.division.g3_g4.goalTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g6", taxonomyId: "M-10", bucketKey: "division", slot: "action" }),
    M10.division.g5_g6.actionTextHe
  );

  assert.equal(r({ subjectId: "math", gradeKey: "g1", taxonomyId: "M-10", bucketKey: "division_with_remainder", slot: "action" }), null);
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-10", bucketKey: "division_with_remainder", slot: "action" }),
    M10.division_with_remainder.g3_g4.actionTextHe
  );
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g6", taxonomyId: "M-10", bucketKey: "division_with_remainder", slot: "nextGoal" }),
    M10.division_with_remainder.g5_g6.goalTextHe
  );

  assert.equal(r({ subjectId: "math", gradeKey: "g2", taxonomyId: "M-10", bucketKey: "ratio", slot: "action" }), null);
  assert.equal(r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-10", bucketKey: "ratio", slot: "action" }), null);
  assert.equal(r({ subjectId: "math", gradeKey: "g3", taxonomyId: "M-10", bucketKey: "ratio", slot: "nextGoal" }), null);
  assert.strictEqual(
    r({ subjectId: "math", gradeKey: "g6", taxonomyId: "M-10", bucketKey: "ratio", slot: "action" }),
    M10.ratio.g5_g6.actionTextHe
  );

  assert.equal(r({ subjectId: "math", gradeKey: "g9", taxonomyId: "M-03", bucketKey: "multiplication", slot: "action" }), null);
  assert.equal(r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-10", bucketKey: "addition", slot: "action" }), null);

}

// --- Routing + templates integration ---
{
  delete process.env.ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  delete process.env.NEXT_PUBLIC_ENABLE_GRADE_AWARE_RECOMMENDATIONS;
  assert.notEqual(
    r({ subjectId: "math", gradeKey: "g4", taxonomyId: "M-03", bucketKey: "multiplication", slot: "action" }),
    null
  );

  const factWrongs = [{ patternFamily: "equal_groups", kind: "mul", params: { kind: "mul" } }];
  assert.deepEqual(orderMultiplicationTaxonomyCandidates(["M-03", "M-10"], factWrongs, {}), ["M-03", "M-10"]);
  const divWrongs = [{ params: { operation: "division", inverse: true } }];
  assert.deepEqual(orderMultiplicationTaxonomyCandidates(["M-03", "M-10"], divWrongs, {}), ["M-10", "M-03"]);

  const topicKey = "multiplication\u0001learning\u0001g4\u0001easy";
  const base = {
    startDate: "2026-05-01",
    endDate: "2026-05-08",
    period: "week",
    playerName: "בדיקה",
    summary: { totalQuestions: 20 },
    mathOperations: {
      [topicKey]: {
        bucketKey: "multiplication",
        displayName: "כפל",
        questions: 12,
        correct: 8,
        wrong: 4,
        accuracy: 67,
        gradeKey: "g4",
        modeKey: "learning",
        levelKey: "easy",
        lastSessionMs: Date.UTC(2026, 4, 6, 12, 0, 0),
      },
    },
    diagnosticEngineV2: {
      units: [
        {
          blueprintRef: "test",
          engineVersion: "v2",
          unitKey: `math::${topicKey}`,
          subjectId: "math",
          topicRowKey: topicKey,
          bucketKey: "multiplication",
          displayName: "כפל",
          diagnosis: { allowed: true, taxonomyId: "M-03", lineHe: "מצביע על דפוס." },
          intervention: {
            immediateActionHe: "תרגול ממוקד זוג",
            shortPracticeHe: "זמן כפול לאותו סט",
            taxonomyId: "M-03",
          },
          taxonomy: { id: "M-03", patternHe: "אותם זוגות שגויים" },
          recurrence: { wrongCountForRules: 4, full: true, wrongEventCount: 4, rowWrongTotal: 4 },
          confidence: { level: "moderate" },
          priority: { level: "P3", breadth: "narrow" },
          competingHypotheses: { hypotheses: [], distinguishingEvidenceHe: [] },
          strengthProfile: { tags: [], dominantBehavior: null },
          outputGating: {
            interventionAllowed: true,
            diagnosisAllowed: true,
            probeOnly: false,
            cannotConcludeYet: false,
            additiveCautionAllowed: false,
            positiveAuthorityLevel: "none",
          },
          probe: { specificationHe: "בדיקה", objectiveHe: "מטרה" },
          explainability: { whyNotStrongerConclusionHe: [], cannotConcludeYetHe: [] },
          canonicalState: {
            actionState: "intervene",
            recommendation: { allowed: false, family: "remedial" },
            assessment: { readiness: "ready", confidenceLevel: "moderate", cannotConcludeYet: false },
            evidence: { positiveAuthorityLevel: "none" },
            topicStateId: "ts_m03",
            stateHash: "h1",
          },
        },
      ],
    },
  };
  const detailed = buildDetailedParentReportFromBaseReport(base, { period: "week" });
  const mp = detailed?.subjectProfiles?.find((p) => p.subject === "math");
  assert.strictEqual(mp?.parentActionHe, M03.multiplication.g3_g4.actionTextHe);
  assertNoBanned("detailed M-03 mult g4 parentActionHe", mp?.parentActionHe);
  const short = summarizeV2UnitsForSubjectForTests(base.diagnosticEngineV2.units, {
    subjectReportQuestions: 12,
    subjectLabelHe: "מתמטיקה",
    topicMap: base.mathOperations,
    reportTotalQuestions: 20,
  });
  assert.strictEqual(short.parentActionHe, M03.multiplication.g3_g4.actionTextHe);
  assertNoBanned("short parentActionHe", short.parentActionHe);

  assert.deepEqual(orderMultiplicationTaxonomyCandidates(["M-03", "M-10"], [], {}), ["M-03", "M-10"], "ambiguous preserves order");

}

// --- Fraction routing unchanged ---
{
  assert.deepEqual(
    orderFractionTaxonomyCandidates(
      ["M-04", "M-05"],
      [{ patternFamily: "fraction_same_denominator_add_sub" }],
      {}
    ),
    ["M-05", "M-04"]
  );
}

process.stdout.write("OK parent-report-grade-aware-phase2c3-m03-m10-selftest\n");
