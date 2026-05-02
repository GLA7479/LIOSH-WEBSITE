import { inferNormalizedTags } from "../fast-diagnostic-engine/infer-tags.js";
import {
  PROBE_BY_ERROR_TAG,
  resolveProbeHintFromMap,
} from "../fast-diagnostic-engine/probe-map-he.js";
import { str } from "./str-utils.js";

/**
 * @typedef {object} PendingDiagnosticProbe
 * @property {string} subjectId
 * @property {string} topicId
 * @property {string|null} diagnosticSkillId
 * @property {string} suggestedQuestionType
 * @property {string} reasonHe
 * @property {string} sourceHypothesisId
 * @property {number} expiresAfterQuestions
 * @property {number} createdAt
 * @property {number} priority
 * @property {string|null} dominantTag
 * @property {string[]} probeAttemptIds
 * @property {string} gradeKey
 * @property {string} levelKey
 * @property {string|null} [patternFamily]
 * @property {string|null} [conceptTag]
 * @property {string} [wrongQuestionId]
 * @property {string} [wrongAvoidKey]
 */

/**
 * @param {import("../mistake-event.js").MistakeEventV1} normalized
 * @param {{ wrongQuestionId?: string, wrongAvoidKey?: string, fallbackTopicId?: string, fallbackGrade?: string, fallbackLevel?: string }} [ctx]
 * @param {string} subjectId
 * @returns {PendingDiagnosticProbe|null}
 */
export function buildPendingProbeFromMistake(normalized, ctx = {}, subjectId) {
  if (!normalized || typeof normalized !== "object") return null;
  const sidSubject = str(subjectId);
  const tags = inferNormalizedTags(
    /** @type {import("../mistake-event.js").MistakeEventV1} */ (normalized),
    sidSubject
  );
  let mappedTag = "";
  for (const t of tags) {
    if (PROBE_BY_ERROR_TAG[t]) {
      mappedTag = t;
      break;
    }
  }
  const sid = str(normalized.diagnosticSkillId);
  const hint = resolveProbeHintFromMap({
    dominantTag: mappedTag,
    dominantDiagnosticSkillId: mappedTag ? "" : sid,
  });
  if (!hint) return null;

  const topicId =
    str(normalized.bucketKey) ||
    str(normalized.topicOrOperation) ||
    str(ctx.fallbackTopicId) ||
    "";
  const gradeKey = str(normalized.grade) || str(ctx.fallbackGrade) || "";
  const levelKey = str(normalized.level) || str(ctx.fallbackLevel) || "";
  if (!topicId || !gradeKey || !levelKey) return null;

  const pf = str(normalized.patternFamily) || null;
  const ct = str(normalized.conceptTag) || null;
  const dominantTag = mappedTag || null;

  return {
    subjectId: sidSubject,
    topicId,
    diagnosticSkillId: sid || null,
    suggestedQuestionType: hint.suggestedQuestionType,
    reasonHe: hint.reasonHe,
    sourceHypothesisId: `fd_probe_${dominantTag || sid || sidSubject}`,
    expiresAfterQuestions: 1,
    createdAt: Date.now(),
    priority: 1,
    dominantTag,
    probeAttemptIds: [],
    gradeKey,
    levelKey,
    patternFamily: pf || null,
    conceptTag: ct || null,
    wrongQuestionId:
      ctx.wrongQuestionId != null ? String(ctx.wrongQuestionId) : undefined,
    wrongAvoidKey:
      ctx.wrongAvoidKey != null ? String(ctx.wrongAvoidKey) : undefined,
  };
}
