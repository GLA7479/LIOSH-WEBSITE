/**
 * Phase 3D-A — session-local science diagnostic probe selection (no persistence, no report UI).
 */

import { inferNormalizedTags } from "./fast-diagnostic-engine/infer-tags.js";
import {
  PROBE_BY_ERROR_TAG,
  resolveProbeHintFromMap,
} from "./fast-diagnostic-engine/probe-map-he.js";

/**
 * @typedef {object} SciencePendingDiagnosticProbe
 * @property {"science"} subjectId
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
 */

/** @param {unknown} v */
function str(v) {
  if (v == null || v === "") return "";
  return String(v).trim();
}

/**
 * @param {import("./mistake-event.js").MistakeEventV1} normalized
 * @param {{ wrongQuestionId?: string, fallbackTopicId?: string, fallbackGrade?: string, fallbackLevel?: string }} [ctx]
 * @returns {SciencePendingDiagnosticProbe|null}
 */
export function buildSciencePendingDiagnosticProbe(normalized, ctx = {}) {
  if (!normalized || typeof normalized !== "object") return null;
  const tags = inferNormalizedTags(
    /** @type {import("./mistake-event.js").MistakeEventV1} */ (normalized),
    "science"
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
    subjectId: "science",
    topicId,
    diagnosticSkillId: sid || null,
    suggestedQuestionType: hint.suggestedQuestionType,
    reasonHe: hint.reasonHe,
    sourceHypothesisId: `fd_probe_${dominantTag || sid || "science"}`,
    expiresAfterQuestions: 1,
    createdAt: Date.now(),
    priority: 1,
    dominantTag,
    probeAttemptIds: [],
    gradeKey,
    levelKey,
    patternFamily: pf || null,
    conceptTag: ct || null,
    wrongQuestionId: ctx.wrongQuestionId != null ? String(ctx.wrongQuestionId) : undefined,
  };
}

/**
 * @param {Record<string, unknown>} bankQuestion — raw row from SCIENCE_QUESTIONS
 * @param {SciencePendingDiagnosticProbe} probe
 * @returns {{ matches: boolean, reason: string }}
 */
export function scienceQuestionProbeMatch(bankQuestion, probe) {
  const p =
    bankQuestion?.params && typeof bankQuestion.params === "object"
      ? bankQuestion.params
      : {};
  const skill = str(p.diagnosticSkillId);
  if (probe.diagnosticSkillId && skill === probe.diagnosticSkillId) {
    return { matches: true, reason: "matched_diagnosticSkillId" };
  }
  const dom = probe.dominantTag;
  if (dom && Array.isArray(p.expectedErrorTags) && p.expectedErrorTags.includes(dom)) {
    return { matches: true, reason: "matched_expectedErrorTags" };
  }
  if (probe.patternFamily && str(p.patternFamily) === probe.patternFamily) {
    return { matches: true, reason: "matched_patternFamily" };
  }
  if (probe.conceptTag && str(p.conceptTag) === probe.conceptTag) {
    return { matches: true, reason: "matched_conceptTag" };
  }
  return { matches: false, reason: "no_match" };
}

/**
 * @param {SciencePendingDiagnosticProbe|null|undefined} probe
 * @param {string} gradeKey
 * @param {string} levelKey
 * @param {string} topic — UI topic (may be "mixed")
 */
export function scienceProbeMatchesSession(probe, gradeKey, levelKey, topic) {
  if (!probe || probe.expiresAfterQuestions <= 0) return false;
  if (str(probe.gradeKey) !== str(gradeKey) || str(probe.levelKey) !== str(levelKey)) {
    return false;
  }
  if (topic !== "mixed" && str(probe.topicId) !== str(topic)) return false;
  return true;
}

/**
 * @param {object} p
 * @param {Record<string, unknown>[]} p.questions — eligible pool (already topic/grade/level filtered)
 * @param {SciencePendingDiagnosticProbe|null} p.pendingProbe
 * @param {Set<string>|string[]} p.recentIds
 * @param {string} p.currentTopic — "mixed" or concrete topic id
 * @param {() => Record<string, unknown>|null|undefined} p.fallbackPick
 * @param {() => number} [p.randomFn]
 */
export function selectScienceQuestionWithProbe({
  questions,
  pendingProbe,
  recentIds,
  currentTopic,
  fallbackPick,
  randomFn = Math.random,
}) {
  const recentSet =
    recentIds instanceof Set ? recentIds : new Set(Array.isArray(recentIds) ? recentIds : []);

  if (!pendingProbe || pendingProbe.expiresAfterQuestions <= 0) {
    const fb = fallbackPick();
    return {
      question: fb,
      usedProbe: false,
      reason: "no_active_probe",
    };
  }

  const inTopicScope = (q) => {
    if (currentTopic !== "mixed") return true;
    return str(q.topic) === str(pendingProbe.topicId);
  };

  /** @type {{ q: Record<string, unknown>, reason: string }[]} */
  const matched = [];
  for (const q of questions || []) {
    if (!inTopicScope(q)) continue;
    const m = scienceQuestionProbeMatch(q, pendingProbe);
    if (m.matches) matched.push({ q, reason: m.reason });
  }

  if (matched.length === 0) {
    const fb = fallbackPick();
    return { question: fb, usedProbe: false, reason: "fallback_no_match" };
  }

  let candidates = matched.map((x) => x.q);
  const wid = pendingProbe.wrongQuestionId;
  if (wid) {
    const nonWrong = candidates.filter((q) => str(q.id) !== str(wid));
    if (nonWrong.length > 0) candidates = nonWrong;
  }

  let pickPool = candidates.filter((q) => !recentSet.has(str(q.id)));
  if (pickPool.length === 0) pickPool = candidates;

  const idx = Math.floor(randomFn() * pickPool.length);
  const question = pickPool[idx];
  const reasonRow = matched.find((x) => str(x.q.id) === str(question.id));
  return {
    question,
    usedProbe: true,
    reason: reasonRow?.reason || "matched",
  };
}
