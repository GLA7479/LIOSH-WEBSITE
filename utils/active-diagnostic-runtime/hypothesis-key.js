import { str } from "./str-utils.js";

/**
 * Stable ledger key; science omits subject prefix for backward compatibility with Phase 3D-B keys.
 *
 * @param {Record<string, unknown>} probeMeta
 */
export function buildHypothesisKey(probeMeta) {
  if (!probeMeta || typeof probeMeta !== "object") return "";
  const topic = str(probeMeta.topicId);
  const sid = str(probeMeta.diagnosticSkillId);
  const dom = probeMeta.dominantTag != null ? str(probeMeta.dominantTag) : "";
  const subj = str(probeMeta.subjectId);
  if (!subj || subj === "science") {
    return `${topic}|${sid}|${dom}`;
  }
  return `${subj}|${topic}|${sid}|${dom}`;
}
