import { buildHypothesisKey } from "./hypothesis-key.js";
import { str } from "./str-utils.js";

/**
 * @param {unknown} prevLedger
 * @param {object} p
 * @param {boolean} p.isCorrect
 * @param {string[]} p.inferredTags
 * @param {Record<string, unknown>|null|undefined} p.probeMeta
 * @param {number} p.now
 */
export function applyProbeOutcome(prevLedger, { isCorrect, inferredTags, probeMeta, now }) {
  if (!probeMeta || typeof probeMeta !== "object") {
    return prevLedger ?? null;
  }

  const key = buildHypothesisKey(probeMeta);
  if (!key) {
    return prevLedger ?? null;
  }

  const inferred = Array.isArray(inferredTags)
    ? inferredTags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const subjectId =
    probeMeta.subjectId != null && str(probeMeta.subjectId)
      ? str(probeMeta.subjectId)
      : "science";

  /** @type {Record<string, unknown>} */
  let ledger =
    prevLedger &&
    typeof prevLedger === "object" &&
    prevLedger.hypothesisKey === key
      ? { ...prevLedger }
      : {
          hypothesisKey: key,
          subjectId,
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
