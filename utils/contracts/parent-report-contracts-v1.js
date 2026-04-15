/**
 * Phase 1 (approved scope): EvidenceContract only.
 * Additive metadata layer - no decisioning or wording changes.
 */

export const EVIDENCE_CONTRACT_VERSION = "v1";

export const EVIDENCE_BANDS = Object.freeze(["E0", "E1", "E2", "E3", "E4"]);
export const EVIDENCE_STRENGTHS = Object.freeze(["low", "medium", "strong"]);
export const TREND_STATES = Object.freeze(["improving", "stable", "regressing", "mixed", "unknown"]);
export const VARIANCE_STATES = Object.freeze(["low", "medium", "high"]);
export const SIGNAL_QUALITY_STATES = Object.freeze(["clean", "noisy", "contradictory"]);
export const DATA_SUFFICIENCY_STATES = Object.freeze(["insufficient", "partial", "sufficient"]);

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return Math.round(n * 1000) / 1000;
}

function clamp100(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n * 1000) / 1000;
}

function toNonNegativeInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

function normalizeTrendState(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "up") return "improving";
  if (s === "down") return "regressing";
  if (s === "flat") return "stable";
  if (TREND_STATES.includes(s)) return s;
  return "unknown";
}

function deriveEvidenceBand(questionCount, evidenceStrength, dataSufficiency, signalQuality, stability01, confidence01) {
  const q = toNonNegativeInt(questionCount);
  if (q < 4) return "E0";
  if (q < 8) return "E1";
  if (signalQuality === "contradictory") return "E1";
  if (q >= 12 && evidenceStrength === "strong" && dataSufficiency === "sufficient" && stability01 >= 0.45 && confidence01 >= 0.35) {
    return "E4";
  }
  if (q >= 12 && (evidenceStrength === "strong" || evidenceStrength === "medium")) return "E3";
  return "E2";
}

function deriveSignalQuality(varianceState, trendState, confidence01) {
  if (varianceState === "high" && trendState === "mixed" && confidence01 < 0.35) return "contradictory";
  if (varianceState === "high" || trendState === "mixed") return "noisy";
  return "clean";
}

function deriveVarianceState(stability01) {
  if (stability01 < 0.3) return "high";
  if (stability01 < 0.6) return "medium";
  return "low";
}

function deriveDataSufficiency(questionCount, dataSufficiencyLevel) {
  const q = toNonNegativeInt(questionCount);
  const normalized = String(dataSufficiencyLevel ?? "").toLowerCase();
  if (normalized === "low") return "insufficient";
  if (normalized === "strong") return "sufficient";
  if (q < 4) return "insufficient";
  if (q < 12) return "partial";
  return "sufficient";
}

/**
 * @param {object} params
 */
export function buildEvidenceContractV1(params) {
  const {
    subjectId,
    topicKey,
    periodStartMs,
    periodEndMs,
    row,
    signals,
    trend,
    behaviorProfile,
    anchorEventIds,
    modeDiff,
    errorConcentration,
  } = params || {};

  const questionCount = toNonNegativeInt(row?.questions);
  const accuracyPct = clamp100(row?.accuracy);
  const wrongCount = toNonNegativeInt(row?.wrong ?? Math.max(0, questionCount - toNonNegativeInt(row?.correct)));
  const recencyScore01 = clamp01((Number(signals?.recencyScore) || 0) / 100);
  const stability01 = clamp01((Number(signals?.stabilityScore) || 0) / 100);
  const confidence01 = clamp01((Number(signals?.confidenceScore) || 0) / 100);
  const repetitionRate01 = clamp01(behaviorProfile?.repeatErrorRate01);
  const hintRate01 = clamp01(behaviorProfile?.hintRate01);
  const retryRate01 = clamp01(behaviorProfile?.retryRate01);
  const varianceState = deriveVarianceState(stability01);
  const trendState = normalizeTrendState(trend?.accuracyDirection);
  const signalQuality = deriveSignalQuality(varianceState, trendState, confidence01);
  const evidenceStrength = EVIDENCE_STRENGTHS.includes(signals?.evidenceStrength)
    ? signals.evidenceStrength
    : "low";
  const dataSufficiency = deriveDataSufficiency(questionCount, signals?.dataSufficiencyLevel);
  const evidenceBand = deriveEvidenceBand(
    questionCount,
    evidenceStrength,
    dataSufficiency,
    signalQuality,
    stability01,
    confidence01
  );

  const derivedAnchors = Array.isArray(anchorEventIds)
    ? anchorEventIds.map((x) => String(x)).filter(Boolean)
    : [];
  if (derivedAnchors.length === 0 && questionCount > 0) {
    derivedAnchors.push(
      `row:${String(subjectId ?? "")}:${String(topicKey ?? "")}:q:${questionCount}:acc:${Math.round(accuracyPct)}`
    );
  }

  const contract = {
    contractVersion: EVIDENCE_CONTRACT_VERSION,
    topicKey: String(topicKey ?? ""),
    subjectId: String(subjectId ?? ""),
    periodStartMs: Number.isFinite(Number(periodStartMs)) ? Number(periodStartMs) : 0,
    periodEndMs: Number.isFinite(Number(periodEndMs)) ? Number(periodEndMs) : 0,
    questionCount,
    accuracyPct,
    wrongCount,
    responseSpeedMsMedian: Number.isFinite(Number(behaviorProfile?.medianResponseMs))
      ? Number(behaviorProfile.medianResponseMs)
      : null,
    repetitionRate01,
    hintRate01,
    retryRate01,
    recencyScore01,
    stability01,
    confidence01,
    varianceState,
    trendState,
    evidenceStrength,
    evidenceBand,
    signalQuality,
    anchorEventIds: derivedAnchors,
    dataSufficiency,
    modeDiff: modeDiff ?? null,
    errorConcentration: errorConcentration ?? null,
  };

  return contract;
}

/**
 * @param {unknown} contract
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateEvidenceContractV1(contract) {
  const errors = [];
  const c = contract || {};

  if (c.contractVersion !== EVIDENCE_CONTRACT_VERSION) errors.push("contractVersion must be v1");
  if (!String(c.topicKey || "").trim()) errors.push("topicKey is required");
  if (!String(c.subjectId || "").trim()) errors.push("subjectId is required");
  if (!Number.isFinite(c.periodStartMs) || c.periodStartMs < 0) errors.push("periodStartMs must be non-negative number");
  if (!Number.isFinite(c.periodEndMs) || c.periodEndMs < 0) errors.push("periodEndMs must be non-negative number");
  if (!Number.isInteger(c.questionCount) || c.questionCount < 0) errors.push("questionCount must be non-negative integer");
  if (!Number.isFinite(c.accuracyPct) || c.accuracyPct < 0 || c.accuracyPct > 100) errors.push("accuracyPct must be 0..100");
  if (!Number.isInteger(c.wrongCount) || c.wrongCount < 0) errors.push("wrongCount must be non-negative integer");
  if (!(c.responseSpeedMsMedian === null || (Number.isFinite(c.responseSpeedMsMedian) && c.responseSpeedMsMedian >= 0))) {
    errors.push("responseSpeedMsMedian must be null or non-negative number");
  }

  const ratioFields = ["repetitionRate01", "hintRate01", "retryRate01", "recencyScore01", "stability01", "confidence01"];
  for (const key of ratioFields) {
    const v = c[key];
    if (!Number.isFinite(v) || v < 0 || v > 1) errors.push(`${key} must be 0..1`);
  }

  if (!VARIANCE_STATES.includes(c.varianceState)) errors.push("varianceState invalid");
  if (!TREND_STATES.includes(c.trendState)) errors.push("trendState invalid");
  if (!EVIDENCE_STRENGTHS.includes(c.evidenceStrength)) errors.push("evidenceStrength invalid");
  if (!EVIDENCE_BANDS.includes(c.evidenceBand)) errors.push("evidenceBand invalid");
  if (!SIGNAL_QUALITY_STATES.includes(c.signalQuality)) errors.push("signalQuality invalid");
  if (!Array.isArray(c.anchorEventIds)) errors.push("anchorEventIds must be array");
  if (!DATA_SUFFICIENCY_STATES.includes(c.dataSufficiency)) errors.push("dataSufficiency invalid");

  if (c.evidenceBand === "E4" && c.dataSufficiency !== "sufficient") {
    errors.push("E4 requires sufficient dataSufficiency");
  }
  if (c.signalQuality === "contradictory" && c.evidenceStrength === "strong") {
    errors.push("contradictory signalQuality cannot be strong evidenceStrength");
  }
  if (c.evidenceBand !== "E0" && Array.isArray(c.anchorEventIds) && c.anchorEventIds.length === 0) {
    errors.push("anchorEventIds cannot be empty when evidenceBand is above E0");
  }

  return { ok: errors.length === 0, errors };
}

export function assertEvidenceContractV1(contract, contextLabel = "evidence-contract-v1") {
  const result = validateEvidenceContractV1(contract);
  if (result.ok) return;
  throw new Error(`${contextLabel}: ${result.errors.join("; ")}`);
}
