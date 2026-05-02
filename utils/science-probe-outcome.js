/**
 * Phase 3D-B — session-local science probe outcome → hypothesis ledger (pure helpers).
 * No persistence, no parent report.
 */

/**
 * @typedef {object} ScienceProbeMetaForQuestion
 * @property {string} sourceHypothesisId
 * @property {string|null} dominantTag
 * @property {string} suggestedQuestionType
 * @property {string|null} diagnosticSkillId
 * @property {string} topicId
 * @property {number} probeCreatedAt
 * @property {string} probeReason
 * @property {string[]|undefined} [expectedErrorTags]
 */

/**
 * @typedef {object} ScienceHypothesisLedger
 * @property {string} hypothesisKey
 * @property {"science"} subjectId
 * @property {string} topicId
 * @property {string|null} diagnosticSkillId
 * @property {string|null} dominantTag
 * @property {"weak"|"supported"|"uncertain"|"weakened"} status
 * @property {number} supportCount
 * @property {number} weakenCount
 * @property {number|null} lastProbeAt
 * @property {"correct_probe"|"wrong_matching_tag"|"wrong_unrelated"|null} lastOutcome
 * @property {number|null} expiresAt
 */

/** @param {unknown} v */
function str(v) {
  if (v == null || v === "") return "";
  return String(v).trim();
}

/**
 * @param {ScienceProbeMetaForQuestion|Record<string, unknown>} probeMeta
 */
export function buildScienceHypothesisKey(probeMeta) {
  if (!probeMeta || typeof probeMeta !== "object") return "";
  const topic = str(probeMeta.topicId);
  const sid = str(probeMeta.diagnosticSkillId);
  const dom = probeMeta.dominantTag != null ? str(probeMeta.dominantTag) : "";
  return `${topic}|${sid}|${dom}`;
}

/**
 * @param {ScienceHypothesisLedger|null|undefined} prevLedger
 * @param {object} p
 * @param {boolean} p.isCorrect
 * @param {string[]} p.inferredTags
 * @param {ScienceProbeMetaForQuestion|Record<string, unknown>|null|undefined} p.probeMeta
 * @param {number} p.now
 * @returns {ScienceHypothesisLedger|null}
 */
export function applyScienceProbeOutcome(prevLedger, {
  isCorrect,
  inferredTags,
  probeMeta,
  now,
}) {
  if (!probeMeta || typeof probeMeta !== "object") {
    return prevLedger ?? null;
  }

  const key = buildScienceHypothesisKey(probeMeta);
  if (!key) {
    return prevLedger ?? null;
  }

  const inferred = Array.isArray(inferredTags)
    ? inferredTags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  /** @type {ScienceHypothesisLedger} */
  let ledger =
    prevLedger && prevLedger.hypothesisKey === key
      ? { ...prevLedger }
      : {
          hypothesisKey: key,
          subjectId: "science",
          topicId: str(probeMeta.topicId) || "",
          diagnosticSkillId:
            probeMeta.diagnosticSkillId != null && str(probeMeta.diagnosticSkillId)
              ? str(probeMeta.diagnosticSkillId)
              : null,
          dominantTag:
            probeMeta.dominantTag != null && str(probeMeta.dominantTag)
              ? str(probeMeta.dominantTag)
              : null,
          status: "weak",
          supportCount: 0,
          weakenCount: 0,
          lastProbeAt: null,
          lastOutcome: null,
          expiresAt: null,
        };

  if (isCorrect) {
    ledger.weakenCount = (ledger.weakenCount || 0) + 1;
    ledger.status = "weakened";
    ledger.lastOutcome = "correct_probe";
    ledger.lastProbeAt = now;
    return ledger;
  }

  const dom = probeMeta.dominantTag != null ? str(probeMeta.dominantTag) : "";
  const domMatch = Boolean(dom && inferred.includes(dom));
  const expected = Array.isArray(probeMeta.expectedErrorTags)
    ? probeMeta.expectedErrorTags.map((t) => String(t).trim()).filter(Boolean)
    : [];
  const overlap =
    expected.length > 0 && expected.some((t) => inferred.includes(t));

  if (domMatch || overlap) {
    ledger.supportCount = (ledger.supportCount || 0) + 1;
    ledger.status = "supported";
    ledger.lastOutcome = "wrong_matching_tag";
  } else {
    ledger.status = "uncertain";
    ledger.lastOutcome = "wrong_unrelated";
  }
  ledger.lastProbeAt = now;
  return ledger;
}
