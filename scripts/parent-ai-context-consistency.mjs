#!/usr/bin/env node
/**
 * Phase B.1 — Parent AI context consistency suite (focused).
 *
 * Verifies the new `verifyParentAiContextConsistency` layer (in
 * `utils/parent-ai-context/build-parent-ai-context.js`) so the Parent AI summary insight (strict
 * explainer input) and the Parent Copilot Q&A grounding (`TruthPacketV1`) cannot silently disagree
 * on the user-listed core grounding fields:
 *   - scope / subject
 *   - confidence / data sufficiency
 *   - recommendation eligibility / decision band
 *   - next-step / planner action meaning
 *   - strengths / needs source presence
 *
 * Why Option B (consistency layer + test) and not Option A (direct derivation):
 *   The strict explainer input has fields with no equivalent in TruthPacketV1
 *   (`grade`, `consistencyBand`, `mainStrengths`, `mainPracticeNeeds`, `plannerQuestionCount`,
 *    `plannerTargetDifficulty`), and the few overlapping fields (`accuracyBand`, `dataConfidence`,
 *    `plannerNextAction`) use materially different aggregations than the truth packet's
 *    anchored-row weighted rollup. Forcing pure derivation would either change Hebrew output
 *    on real fixtures (which Phase B's preserved-behavior contract forbids) or strip the summary
 *    insight to "no data" on payloads that legitimately have raw aggregates but no anchored
 *    contracts. Option B closes the silent-divergence risk by failing CI on disagreement instead.
 *
 * Run via: `npm run test:parent-ai-context:consistency`.
 */

const helperUrl = new URL("../utils/parent-ai-context/build-parent-ai-context.js", import.meta.url).href;
const adapterUrl = new URL("../utils/parent-report-ai/parent-report-ai-adapter.js", import.meta.url).href;
const truthPacketUrl = new URL("../utils/parent-copilot/truth-packet-v1.js", import.meta.url).href;

const helperMod = await import(helperUrl);
const adapterMod = await import(adapterUrl);
const truthPacketMod = await import(truthPacketUrl);

const {
  buildParentAiContext,
  verifyParentAiContextConsistency,
  deriveCoreGroundingFromTruthPacket,
  deriveCoreGroundingFromStrictExplainerInput,
} = helperMod;

const { buildStrictParentReportAIInputFromParentReportV2 } = adapterMod;
const { buildTruthPacketV1 } = truthPacketMod;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

function run(label, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === "function") {
      return r.then(
        () => console.log(`OK  ${label}`),
        (e) => {
          console.error(`FAIL ${label}:`, e?.message || e);
          process.exitCode = 1;
        },
      );
    }
    console.log(`OK  ${label}`);
  } catch (e) {
    console.error(`FAIL ${label}:`, e?.message || e);
    process.exitCode = 1;
  }
}

const projection = (p) =>
  buildStrictParentReportAIInputFromParentReportV2(/** @type {Record<string, unknown>} */ (p));

/* -------------------------------------------------------------------------- */
/*  Fixtures                                                                  */
/* -------------------------------------------------------------------------- */

/** Same shape as `scripts/parent-report-ai-integration.mjs`'s `mockV2Report`: no anchored data. */
const mockV2NoAnchored = {
  generatedAt: "2026-01-15T12:00:00.000Z",
  playerName: "Fixture",
  summary: {
    totalQuestions: 25,
    totalTimeMinutes: 40,
    overallAccuracy: 72,
    mathQuestions: 25,
    mathAccuracy: 72,
    geometryQuestions: 0,
    geometryAccuracy: 0,
    englishQuestions: 0,
    englishAccuracy: 0,
    scienceQuestions: 0,
    scienceAccuracy: 0,
    hebrewQuestions: 0,
    hebrewAccuracy: 0,
    moledetGeographyQuestions: 0,
    moledetGeographyAccuracy: 0,
    diagnosticOverviewHe: {
      strongestAreaLineHe: "חשבון: נראה סדר ותרגול עקבי בטווח",
      mainFocusAreaLineHe: "חשבון: כדאי לאחד דיוק בשאלות דומות",
      requiresAttentionPreviewHe: [],
    },
  },
  rawMetricStrengthsHe: ["חשבון: נוכחות טובה בפעילות בתקופה"],
  mathOperations: {
    row_fixture: { questions: 25, gradeKey: "g4", accuracy: 72, timeMinutes: 40 },
  },
  geometryTopics: {},
  englishTopics: {},
  scienceTopics: {},
  hebrewTopics: {},
  moledetGeographyTopics: {},
  hybridRuntime: null,
};

/**
 * Anchored math row, eligible recommendation (RI2, high confidence, ready), with summary
 * counts that drive the strict projection toward `advance_skill` (n=30, acc=88).
 */
function buildAnchoredEligiblePayload() {
  return {
    generatedAt: "2026-01-15T12:00:00.000Z",
    playerName: "Fixture-Eligible",
    summary: {
      totalQuestions: 30,
      totalTimeMinutes: 50,
      overallAccuracy: 88,
      mathQuestions: 30,
      mathAccuracy: 88,
      geometryQuestions: 0,
      geometryAccuracy: 0,
      englishQuestions: 0,
      englishAccuracy: 0,
      scienceQuestions: 0,
      scienceAccuracy: 0,
      hebrewQuestions: 0,
      hebrewAccuracy: 0,
      moledetGeographyQuestions: 0,
      moledetGeographyAccuracy: 0,
      diagnosticOverviewHe: {
        strongestAreaLineHe: "חשבון: דיוק יציב בפעולות בסיסיות",
        mainFocusAreaLineHe: "חשבון: לחזק שאלות מורכבות יותר בהדרגה",
        requiresAttentionPreviewHe: ["שאלות מילוליות באורך בינוני"],
      },
    },
    rawMetricStrengthsHe: ["חשבון: התמדה בתרגולים"],
    mathOperations: {
      row_eligible: { questions: 30, gradeKey: "g4", accuracy: 88, timeMinutes: 50 },
    },
    geometryTopics: {},
    englishTopics: {},
    scienceTopics: {},
    hebrewTopics: {},
    moledetGeographyTopics: {},
    hybridRuntime: null,
    subjectProfiles: [
      {
        subject: "math",
        topicRecommendations: [
          {
            topicRowKey: "math:topic_eligible",
            displayName: "פעולות חשבון",
            questions: 30,
            accuracy: 88,
            contractsV1: {
              evidence: { contractVersion: "v1", topicKey: "math:topic_eligible", subjectId: "math" },
              decision: {
                contractVersion: "v1",
                topicKey: "math:topic_eligible",
                subjectId: "math",
                decisionTier: 2,
                cannotConcludeYet: false,
              },
              readiness: {
                contractVersion: "v1",
                topicKey: "math:topic_eligible",
                subjectId: "math",
                readiness: "ready",
              },
              confidence: {
                contractVersion: "v1",
                topicKey: "math:topic_eligible",
                subjectId: "math",
                confidenceBand: "high",
              },
              recommendation: {
                contractVersion: "v1",
                topicKey: "math:topic_eligible",
                subjectId: "math",
                eligible: true,
                intensity: "RI2",
                family: "general_practice",
                anchorEvidenceIds: ["ev_eligible"],
                forbiddenBecause: [],
              },
              narrative: {
                contractVersion: "v1",
                topicKey: "math:topic_eligible",
                subjectId: "math",
                wordingEnvelope: "WE2",
                hedgeLevel: "light",
                allowedTone: "parent_professional_warm",
                forbiddenPhrases: ["בטוח לחלוטין"],
                requiredHedges: ["נכון לעכשיו"],
                allowedSections: ["summary", "finding", "recommendation", "limitations"],
                recommendationIntensityCap: "RI2",
                textSlots: {
                  observation:
                    "נכון לעכשיו בפעולות חשבון נצפו 30 שאלות עם דיוק של כ־88% — תמונה יציבה לתקופה.",
                  interpretation:
                    "נכון לעכשיו ניתן לזהות בסיס איתן לפעולות חשבון, מה שמאפשר לבחון העלאה הדרגתית של רמת הקושי.",
                  action: "נכון לעכשיו אפשר להוסיף תרגול קצר ברמת קושי גבוהה יותר בשבוע הקרוב.",
                  uncertainty: "נכון לעכשיו כדאי להמשיך ולבדוק את היציבות בסבב התרגול הבא.",
                },
              },
            },
          },
        ],
      },
    ],
    executiveSummary: { majorTrendsHe: ["מגמה חיובית עקבית בחשבון בתקופה זו."] },
  };
}

/**
 * Anchored math row, ineligible (cannotConcludeYet=true, low confidence, RI0), with summary
 * counts that drive the strict projection toward a conservative "review" action.
 */
function buildAnchoredIneligiblePayload() {
  return {
    generatedAt: "2026-01-15T12:00:00.000Z",
    playerName: "Fixture-Ineligible",
    summary: {
      totalQuestions: 4,
      totalTimeMinutes: 6,
      overallAccuracy: 50,
      mathQuestions: 4,
      mathAccuracy: 50,
      geometryQuestions: 0,
      geometryAccuracy: 0,
      englishQuestions: 0,
      englishAccuracy: 0,
      scienceQuestions: 0,
      scienceAccuracy: 0,
      hebrewQuestions: 0,
      hebrewAccuracy: 0,
      moledetGeographyQuestions: 0,
      moledetGeographyAccuracy: 0,
      diagnosticOverviewHe: {
        strongestAreaLineHe: "",
        mainFocusAreaLineHe: "חשבון: עדיין מוקדם לקבוע תמונה ברורה — דרושים עוד תרגולים",
        requiresAttentionPreviewHe: [],
      },
    },
    rawMetricStrengthsHe: [],
    mathOperations: {
      row_ineligible: { questions: 4, gradeKey: "g3", accuracy: 50, timeMinutes: 6 },
    },
    geometryTopics: {},
    englishTopics: {},
    scienceTopics: {},
    hebrewTopics: {},
    moledetGeographyTopics: {},
    hybridRuntime: null,
    subjectProfiles: [
      {
        subject: "math",
        topicRecommendations: [
          {
            topicRowKey: "math:topic_ineligible",
            displayName: "פעולות חשבון",
            questions: 4,
            accuracy: 50,
            contractsV1: {
              evidence: { contractVersion: "v1", topicKey: "math:topic_ineligible", subjectId: "math" },
              decision: {
                contractVersion: "v1",
                topicKey: "math:topic_ineligible",
                subjectId: "math",
                decisionTier: 0,
                cannotConcludeYet: true,
              },
              readiness: {
                contractVersion: "v1",
                topicKey: "math:topic_ineligible",
                subjectId: "math",
                readiness: "insufficient",
              },
              confidence: {
                contractVersion: "v1",
                topicKey: "math:topic_ineligible",
                subjectId: "math",
                confidenceBand: "low",
              },
              recommendation: {
                contractVersion: "v1",
                topicKey: "math:topic_ineligible",
                subjectId: "math",
                eligible: false,
                intensity: "RI0",
                family: null,
                anchorEvidenceIds: [],
                forbiddenBecause: ["cannot_conclude_yet"],
              },
              narrative: {
                contractVersion: "v1",
                topicKey: "math:topic_ineligible",
                subjectId: "math",
                wordingEnvelope: "WE0",
                hedgeLevel: "mandatory",
                allowedTone: "parent_professional_warm",
                forbiddenPhrases: ["בטוח לחלוטין"],
                requiredHedges: ["בשלב זה", "עדיין מוקדם לקבוע"],
                allowedSections: ["summary", "finding", "recommendation", "limitations"],
                recommendationIntensityCap: "RI0",
                textSlots: {
                  observation:
                    "נכון לעכשיו בפעולות חשבון נצפו 4 שאלות בלבד — מעט מדי כדי לקבוע תמונה.",
                  interpretation:
                    "נכון לעכשיו עוד מוקדם לקבוע מסקנות יציבות; כדאי להמשיך ולתרגל לפני קביעת המלצה.",
                  action: null,
                  uncertainty: "נכון לעכשיו עדיין מוקדם לקבוע מסקנות בסיסיות על המקצוע הזה.",
                },
              },
            },
          },
        ],
      },
    ],
    executiveSummary: { majorTrendsHe: [] },
  };
}

/* -------------------------------------------------------------------------- */
/*  Test cases                                                                */
/* -------------------------------------------------------------------------- */

run("TC1: secondary-source mode passes (no anchored data, raw aggregates legitimate)", () => {
  const ctx = buildParentAiContext({
    payload: mockV2NoAnchored,
    strictExplainerInputBuilder: projection,
  });
  assert(ctx.truthPacket, "truth packet expected even in fallback mode");
  assert(ctx.strictExplainerInput, "strict input expected from raw aggregates");

  const v = verifyParentAiContextConsistency(ctx);
  assert(v.secondarySource === true, "expected secondary-source mode (truth packet uses no-anchor fallback)");
  assert(
    v.ok === true,
    `expected ok=true in secondary-source mode (only info-severity notes); issues=${JSON.stringify(v.issues)}`,
  );
  const hardIssues = v.issues.filter((i) => i.severity === "issue");
  assert(hardIssues.length === 0, `no hard issues expected in secondary-source mode; got=${JSON.stringify(hardIssues)}`);
  assert(
    v.issues.some((i) => i.severity === "info"),
    "expected at least one info-severity note documenting the deferred comparison",
  );
});

run("TC2: anchored eligible payload — both projections agree, zero issues", () => {
  const payload = buildAnchoredEligiblePayload();
  const ctx = buildParentAiContext({
    payload,
    strictExplainerInputBuilder: projection,
  });
  assert(ctx.truthPacket, "truth packet present");
  assert(ctx.strictExplainerInput, "strict input present");

  const v = verifyParentAiContextConsistency(ctx);
  assert(v.secondarySource === false, "expected non-secondary-source");
  assert(v.ok === true, `expected ok=true; issues=${JSON.stringify(v.issues)}`);
  assert(v.issues.length === 0, `expected zero issues on aligned eligible payload; got=${JSON.stringify(v.issues)}`);

  assert(v.truthGrounding?.recommendationEligible === true, "truth says eligible");
  assert(v.strictGrounding?.plannerNextActionBand === "advance", "strict says advance");
  assert(v.truthGrounding?.confidenceBand === "high", "truth confidence high");
});

run("TC3: anchored cannotConcludeYet payload — strict stays conservative", () => {
  const payload = buildAnchoredIneligiblePayload();
  const ctx = buildParentAiContext({
    payload,
    strictExplainerInputBuilder: projection,
  });
  assert(ctx.truthPacket, "truth packet present");
  assert(ctx.strictExplainerInput, "strict input present");

  const v = verifyParentAiContextConsistency(ctx);
  assert(v.secondarySource === false, "expected non-secondary-source");
  assert(v.ok === true, `expected ok=true; issues=${JSON.stringify(v.issues)}`);
  assert(v.truthGrounding?.cannotConcludeYet === true, "truth says cannotConcludeYet");
  assert(
    v.strictGrounding?.plannerNextActionBand === "review" || v.strictGrounding?.plannerNextActionBand === "no_data",
    `strict planner band should be conservative (review/no_data); got=${v.strictGrounding?.plannerNextActionBand}`,
  );
});

run("TC4: NEGATIVE — cannot-conclude truth vs advance strict is detected as hard issue", () => {
  const synthetic = {
    truthPacket: {
      schemaVersion: "v1",
      audience: "parent",
      scopeType: "topic",
      scopeId: "math:topic_x",
      contracts: { narrative: { subjectId: "math", topicKey: "math:topic_x" } },
      derivedLimits: {
        cannotConcludeYet: true,
        recommendationEligible: false,
        recommendationIntensityCap: "RI0",
        readiness: "insufficient",
        confidenceBand: "low",
      },
    },
    strictExplainerInput: {
      subject: "math",
      grade: "g4",
      plannerNextAction: "advance_skill",
      plannerTargetDifficulty: "advanced",
      plannerQuestionCount: 4,
      accuracyBand: "high",
      consistencyBand: "stable",
      dataConfidence: "strong",
      mainStrengths: "abc",
      mainPracticeNeeds: "def",
      recommendedNextStep: "אפשר להתקדם לשלב הבא",
    },
    scope: { scopeType: "topic", scopeId: "math:topic_x" },
  };
  const v = verifyParentAiContextConsistency(synthetic);
  assert(v.ok === false, "expected ok=false on injected cannot-conclude-vs-advance divergence");
  assert(
    v.issues.some((i) => i.rule === "cannot_conclude_blocks_advance_or_maintain" && i.severity === "issue"),
    `expected cannot_conclude_blocks_advance_or_maintain issue; got=${JSON.stringify(v.issues)}`,
  );
  assert(
    v.issues.some((i) => i.rule === "ineligible_should_not_advance" && i.severity === "issue"),
    "expected ineligible_should_not_advance issue",
  );
  assert(
    v.issues.some((i) => i.rule === "intensity_cap_ri0_should_not_advance" && i.severity === "issue"),
    "expected intensity_cap_ri0_should_not_advance issue",
  );
  assert(
    v.issues.some((i) => i.rule === "confidence_low_disagreement" && i.severity === "issue"),
    "expected confidence_low_disagreement issue",
  );
});

run("TC5: NEGATIVE — eligible+confident truth vs pause/thin strict is detected", () => {
  const synthetic = {
    truthPacket: {
      schemaVersion: "v1",
      audience: "parent",
      scopeType: "executive",
      scopeId: "executive",
      contracts: { narrative: { subjectId: "math", topicKey: "executive" } },
      derivedLimits: {
        cannotConcludeYet: false,
        recommendationEligible: true,
        recommendationIntensityCap: "RI2",
        readiness: "ready",
        confidenceBand: "high",
      },
    },
    strictExplainerInput: {
      subject: "math",
      grade: "g4",
      plannerNextAction: "pause_collect_more_data",
      plannerTargetDifficulty: "standard",
      plannerQuestionCount: 3,
      accuracyBand: "low",
      consistencyBand: "stable",
      dataConfidence: "thin",
      mainStrengths: "",
      mainPracticeNeeds: "",
      recommendedNextStep: "המערכת מציעה להמשיך לתרגל בהתאם למה שמתאים לך עכשיו",
    },
    scope: { scopeType: "executive", scopeId: "executive" },
  };
  const v = verifyParentAiContextConsistency(synthetic);
  assert(v.ok === false, "expected ok=false on injected eligible-vs-pause divergence");
  assert(
    v.issues.some((i) => i.rule === "eligible_should_not_be_pause" && i.severity === "issue"),
    "expected eligible_should_not_be_pause issue",
  );
  assert(
    v.issues.some((i) => i.rule === "confidence_high_disagreement" && i.severity === "issue"),
    "expected confidence_high_disagreement issue",
  );
  assert(
    v.issues.some(
      (i) => i.rule === "strengths_or_needs_required_when_eligible" && i.severity === "issue",
    ),
    "expected strengths_or_needs_required_when_eligible issue",
  );
});

run("TC6: NEGATIVE — non-executive scope subject mismatch is detected", () => {
  const synthetic = {
    truthPacket: {
      schemaVersion: "v1",
      audience: "parent",
      scopeType: "topic",
      scopeId: "math:topic_x",
      contracts: { narrative: { subjectId: "math", topicKey: "math:topic_x" } },
      derivedLimits: {
        cannotConcludeYet: false,
        recommendationEligible: true,
        recommendationIntensityCap: "RI2",
        readiness: "ready",
        confidenceBand: "high",
      },
    },
    strictExplainerInput: {
      subject: "english",
      grade: "g4",
      plannerNextAction: "advance_skill",
      plannerTargetDifficulty: "advanced",
      plannerQuestionCount: 4,
      accuracyBand: "high",
      consistencyBand: "stable",
      dataConfidence: "strong",
      mainStrengths: "abc",
      mainPracticeNeeds: "def",
      recommendedNextStep: "אפשר להתקדם לשלב הבא",
    },
    scope: { scopeType: "topic", scopeId: "math:topic_x" },
  };
  const v = verifyParentAiContextConsistency(synthetic);
  assert(v.ok === false, "expected ok=false on subject mismatch");
  assert(
    v.issues.some((i) => i.rule === "subject_alignment" && i.severity === "issue"),
    `expected subject_alignment issue; got=${JSON.stringify(v.issues)}`,
  );
});

run("TC7: degenerate inputs are safe", () => {
  assert(deriveCoreGroundingFromTruthPacket(null) === null, "null truth → null grounding");
  assert(deriveCoreGroundingFromStrictExplainerInput(null) === null, "null strict → null grounding");

  const v0 = verifyParentAiContextConsistency(null);
  assert(v0.ok === true, "null context safe");
  assert(v0.secondarySource === false, "no truth packet ⇒ no secondary-source claim");
  assert(v0.issues.length === 0, "no comparison made, no issues");

  const v1 = verifyParentAiContextConsistency({ truthPacket: null, strictExplainerInput: null });
  assert(v1.ok === true, "both null safe");

  const v2 = verifyParentAiContextConsistency({
    truthPacket: { contracts: { narrative: {} }, derivedLimits: {} },
    strictExplainerInput: null,
  });
  assert(v2.ok === true, "missing strict input ⇒ nothing to compare ⇒ ok");
});

run("TC8: real fixtures both round-trip through buildTruthPacketV1 (sanity)", () => {
  const eligible = buildAnchoredEligiblePayload();
  const ineligible = buildAnchoredIneligiblePayload();
  const tp1 = buildTruthPacketV1(eligible, { scopeType: "executive", scopeId: "executive", scopeLabel: "סיכום" });
  const tp2 = buildTruthPacketV1(ineligible, { scopeType: "executive", scopeId: "executive", scopeLabel: "סיכום" });
  assert(tp1?.derivedLimits?.recommendationEligible === true, "eligible fixture should produce eligible truth packet");
  assert(tp2?.derivedLimits?.cannotConcludeYet === true, "ineligible fixture should produce cannotConcludeYet truth packet");
});

if (process.exitCode) {
  console.error("parent-ai-context-consistency.mjs: one or more checks failed");
  process.exit(1);
}
console.log("parent-ai-context-consistency.mjs: all checks passed");
