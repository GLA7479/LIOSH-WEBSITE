/**
 * Unified decision table — pure function from inputs to actionState + recommendation.
 * Evaluation order: top-to-bottom, first match wins.
 */

/**
 * @param {object} inputs
 * @param {string} inputs.confidenceLevel
 * @param {boolean} inputs.taxonomyMatch
 * @param {boolean} inputs.recurrenceFull
 * @param {boolean} inputs.counterEvidenceStrong
 * @param {boolean} inputs.weakEvidence
 * @param {boolean} inputs.hintInvalidates
 * @param {boolean} inputs.stableMastery
 * @param {number} inputs.questions
 * @param {number} inputs.accuracy
 * @param {string} inputs.priorityLevel
 * @returns {{ actionState: string, readiness: string, cannotConcludeYet: boolean, recommendation: { family: string, allowed: boolean, intensityCap: string, reasonCodes: string[] }, hardDenyReason: string|null, taxonomyMismatchReason: string|null }}
 */
export function evaluateDecisionTable(inputs) {
  const {
    confidenceLevel,
    taxonomyMatch,
    recurrenceFull,
    counterEvidenceStrong,
    weakEvidence,
    hintInvalidates,
    stableMastery,
    questions,
    accuracy,
    priorityLevel,
  } = inputs;

  const C = confidenceLevel;
  const T = !!taxonomyMatch;
  const R = !!recurrenceFull;
  const CE = !!counterEvidenceStrong;
  const WE = !!weakEvidence;
  const HI = !!hintInvalidates;
  const SM = !!stableMastery;
  const Q = Number(questions) || 0;
  const A = Number(accuracy) || 0;
  const P = priorityLevel || "P1";

  const reasonCodes = [];

  // RULE 1 — HARD DENY
  const isHardDeny =
    C === "contradictory" ||
    C === "insufficient_data" ||
    CE ||
    WE ||
    (HI && C === "early_signal_only");

  if (isHardDeny) {
    let hardDenyReason = null;
    if (C === "contradictory") hardDenyReason = "contradictory";
    else if (CE) hardDenyReason = "counter_evidence";
    else if (WE) hardDenyReason = "weak_evidence";
    else if (C === "insufficient_data") hardDenyReason = "insufficient_data";
    else if (HI && C === "early_signal_only") hardDenyReason = "early_signal_invalidated";

    reasonCodes.push(`hard_deny:${hardDenyReason}`);
    return {
      actionState: "withhold",
      readiness: "insufficient",
      cannotConcludeYet: true,
      recommendation: { family: "withhold", allowed: false, intensityCap: "RI0", reasonCodes },
      hardDenyReason,
      taxonomyMismatchReason: null,
    };
  }

  // RULE 2 — NO TAXONOMY MATCH
  if (!T) {
    const taxonomyMismatchReason = "taxonomy_not_matched";
    reasonCodes.push(`no_taxonomy_match`);
    const readiness =
      C === "low" ? "insufficient" :
      C === "moderate" ? "forming" :
      C === "high" ? "emerging" :
      "insufficient";
    return {
      actionState: "probe_only",
      readiness,
      cannotConcludeYet: false,
      recommendation: { family: "probe_only", allowed: false, intensityCap: "RI0", reasonCodes },
      hardDenyReason: null,
      taxonomyMismatchReason,
    };
  }

  // RULE 3 — LOW CONFIDENCE
  if (C === "low") {
    reasonCodes.push("low_confidence");
    return {
      actionState: "probe_only",
      readiness: "insufficient",
      cannotConcludeYet: false,
      recommendation: { family: "probe_only", allowed: false, intensityCap: "RI0", reasonCodes },
      hardDenyReason: null,
      taxonomyMismatchReason: null,
    };
  }

  // RULE 4 — EARLY SIGNAL
  if (C === "early_signal_only") {
    reasonCodes.push("early_signal");
    return {
      actionState: "probe_only",
      readiness: "forming",
      cannotConcludeYet: false,
      recommendation: { family: "probe_only", allowed: false, intensityCap: "RI0", reasonCodes },
      hardDenyReason: null,
      taxonomyMismatchReason: null,
    };
  }

  // RULE 5 — POSITIVE STABLE (before intervention rules)
  if (SM && Q >= 10 && A >= 90 && (C === "moderate" || C === "high")) {
    if (C === "high" && Q >= 20 && A >= 95) {
      reasonCodes.push("expand_cautiously:stable_mastery_high_confidence_high_volume");
      return {
        actionState: "expand_cautiously",
        readiness: "ready",
        cannotConcludeYet: false,
        recommendation: { family: "expand_cautiously", allowed: true, intensityCap: "RI1", reasonCodes },
        hardDenyReason: null,
        taxonomyMismatchReason: null,
      };
    }
    const readiness = C === "high" ? "ready" : "emerging";
    reasonCodes.push("maintain:stable_mastery");
    return {
      actionState: "maintain",
      readiness,
      cannotConcludeYet: false,
      recommendation: { family: "maintain", allowed: true, intensityCap: "RI1", reasonCodes },
      hardDenyReason: null,
      taxonomyMismatchReason: null,
    };
  }

  // RULE 6 — MODERATE CONFIDENCE + DIAGNOSIS
  if (C === "moderate" && R && !CE) {
    if (P === "P3" || P === "P4") {
      reasonCodes.push("intervene:moderate_confidence_high_priority");
      return {
        actionState: "intervene",
        readiness: "emerging",
        cannotConcludeYet: false,
        recommendation: { family: "intervene", allowed: true, intensityCap: "RI2", reasonCodes },
        hardDenyReason: null,
        taxonomyMismatchReason: null,
      };
    }
    reasonCodes.push("diagnose_only:moderate_confidence_recurrence");
    return {
      actionState: "diagnose_only",
      readiness: "emerging",
      cannotConcludeYet: false,
      recommendation: { family: "diagnose_only", allowed: true, intensityCap: "RI2", reasonCodes },
      hardDenyReason: null,
      taxonomyMismatchReason: null,
    };
  }

  // RULE 7 — HIGH CONFIDENCE + FULL RECURRENCE
  if (C === "high" && R && !CE) {
    if (P === "P3" || P === "P4") {
      reasonCodes.push("intervene:high_confidence_high_priority");
      return {
        actionState: "intervene",
        readiness: "ready",
        cannotConcludeYet: false,
        recommendation: { family: "intervene", allowed: true, intensityCap: "RI3", reasonCodes },
        hardDenyReason: null,
        taxonomyMismatchReason: null,
      };
    }
    reasonCodes.push("diagnose_only:high_confidence_recurrence");
    return {
      actionState: "diagnose_only",
      readiness: "ready",
      cannotConcludeYet: false,
      recommendation: { family: "diagnose_only", allowed: true, intensityCap: "RI3", reasonCodes },
      hardDenyReason: null,
      taxonomyMismatchReason: null,
    };
  }

  // RULE 8 — FALLBACK
  reasonCodes.push("fallback:no_rule_matched");
  return {
    actionState: "probe_only",
    readiness: "insufficient",
    cannotConcludeYet: false,
    recommendation: { family: "probe_only", allowed: false, intensityCap: "RI0", reasonCodes },
    hardDenyReason: null,
    taxonomyMismatchReason: null,
  };
}
