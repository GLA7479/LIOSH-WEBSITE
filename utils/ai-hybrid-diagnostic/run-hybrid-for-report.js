import { HYBRID_RUNTIME_VERSION } from "./constants.js";
import { readAiHybridConsent } from "./governance.js";
import { readHybridLearningState } from "./learning-loop.js";
import { buildV2AuthoritySnapshot } from "./v2-authority-snapshot.js";
import { extractUnitFeatures } from "./extract-unit-features.js";
import { resolveAuthorityGate } from "./authority-gate.js";
import { rankHypotheses, buildDisagreement } from "./hypothesis-ranker.js";
import { buildProbeIntelligence } from "./probe-intelligence.js";
import { buildHybridExplanations } from "./explanation-layer.js";
import { getAiHybridRolloutStage } from "./rollout-config.js";
import { appendShadowHybridEntry } from "./shadow-store.js";

/**
 * @param {object} params
 * @param {object|null} params.diagnosticEngineV2
 * @param {Record<string, Record<string, object>>} params.maps
 * @param {Record<string, unknown[]>} params.rawMistakesBySubject
 * @param {number} params.startMs
 * @param {number} params.endMs
 */
export function buildHybridRuntimeForReport({ diagnosticEngineV2, maps, rawMistakesBySubject, startMs, endMs }) {
  const generatedAt = new Date().toISOString();
  const consent = readAiHybridConsent();
  const rolloutStage = getAiHybridRolloutStage();
  const learningState = readHybridLearningState();
  const windowId = `${startMs}_${endMs}`;

  const base = {
    hybridRuntimeVersion: HYBRID_RUNTIME_VERSION,
    generatedAt,
    exposureMode: rolloutStage,
    governance: {
      consentState: consent.state,
      policyVersion: consent.policyVersion,
    },
    units: /** @type {object[]} */ ([]),
    shadow: {
      logKey: "sessionStorage:mleo_hybrid_shadow_log_v1",
      entriesSampled: 0,
    },
  };

  const units = Array.isArray(diagnosticEngineV2?.units) ? diagnosticEngineV2.units : [];
  if (units.length === 0) {
    return {
      ...base,
      units: [],
      rollup: { unitCount: 0, suppressedCount: 0, disagreementCount: 0 },
    };
  }

  let suppressedCount = 0;
  let disagreementCount = 0;

  for (const unit of units) {
    const subjectId = String(unit.subjectId || "");
    const topicRowKey = String(unit.topicRowKey || "");
    const row = maps?.[subjectId]?.[topicRowKey] || null;
    const features = extractUnitFeatures({
      unit,
      row,
      windowId,
      rawMistakesBySubject: rawMistakesBySubject || {},
      startMs,
      endMs,
    });

    const v2AuthoritySnapshot = buildV2AuthoritySnapshot(unit);
    const gate = resolveAuthorityGate({
      unit,
      features,
      consent,
      rolloutStage,
    });

    const rawMistakes = rawMistakesBySubject?.[subjectId] || [];
    let ranking = rankHypotheses({
      unit,
      row,
      features,
      rawMistakes,
      startMs,
      endMs,
      learningState,
      mode: gate.mode,
    });

    /** @type {string[]} */
    const extraSuppression = [...gate.suppressionFlags];

    if ((gate.mode === "assist" || gate.mode === "rank_only") && ranking.candidates.length > 0) {
      const sum = ranking.candidates.reduce((a, c) => a + (Number(c.probability) || 0), 0);
      if (Math.abs(sum - 1) > 0.011) {
        extraSuppression.push("probability_invalid");
        ranking = {
          candidates: [],
          top1Id: "",
          top1Probability: 0,
          calibratedProbability: 0,
          calibrationBand: "uncalibrated",
          ambiguityScore: 1,
        };
      }
    }
    if (gate.mode === "assist" && ranking.calibrationBand === "uncalibrated") {
      extraSuppression.push("calibration_untrusted");
    }

    const effectiveMode =
      extraSuppression.includes("probability_invalid") || extraSuppression.includes("calibration_untrusted")
        ? "suppressed"
        : gate.mode;

    if (effectiveMode === "suppressed") suppressedCount += 1;

    const rankingForDisagreement =
      effectiveMode === "suppressed"
        ? {
            candidates: [],
            top1Id: "",
            top1Probability: 0,
            calibratedProbability: 0,
            calibrationBand: "uncalibrated",
            ambiguityScore: 1,
          }
        : ranking;

    const v2TaxonomyId = v2AuthoritySnapshot.taxonomyId || null;
    const disagreement = buildDisagreement({ ranking: rankingForDisagreement, v2TaxonomyId });
    if (disagreement.hasDisagreement) disagreementCount += 1;

    const probeIntel = buildProbeIntelligence({
      unit,
      ranking: rankingForDisagreement,
      gate: { mode: effectiveMode },
    });

    const explanations = buildHybridExplanations({
      snapshot: v2AuthoritySnapshot,
      ranking: rankingForDisagreement,
      probeIntel,
      gate: { mode: effectiveMode },
    });

    const mergedFlags = [...new Set([...gate.suppressionFlags, ...extraSuppression])];

    const hybridUnit = {
      unitKey: unit.unitKey,
      v2AuthoritySnapshot,
      aiAssist: {
        eligible: effectiveMode !== "suppressed",
        mode: effectiveMode,
        suppressionFlags: mergedFlags,
      },
      hypothesisRanking: {
        candidates: rankingForDisagreement.candidates,
        top1Id: rankingForDisagreement.top1Id,
        top1Probability: rankingForDisagreement.top1Probability,
        calibrationBand: rankingForDisagreement.calibrationBand,
        ambiguityScore: rankingForDisagreement.ambiguityScore,
      },
      disagreement,
      probeIntelligence: probeIntel,
      explanationContract: explanations.explanationContract,
      explanations: {
        parent: explanations.parent,
        teacher: explanations.teacher,
      },
      explanationValidator: explanations.validator,
      features,
    };

    base.units.push(hybridUnit);

    if (rolloutStage === "shadow" || rolloutStage === "live") {
      appendShadowHybridEntry({
        unitKey: unit.unitKey,
        mode: effectiveMode,
        hasDisagreement: disagreement.hasDisagreement,
        severity: disagreement.severity,
      });
      base.shadow.entriesSampled += 1;
    }
  }

  base.rollup = {
    unitCount: units.length,
    suppressedCount,
    disagreementCount,
  };

  return base;
}
