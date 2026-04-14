import { FEATURE_SCHEMA_VERSION } from "./constants.js";
import { filterMistakesForRow } from "../parent-report-row-trend.js";

/**
 * @param {object} p
 * @param {object} p.unit diagnosticEngineV2 unit
 * @param {object|null} p.row enriched report row
 * @param {string} p.windowId coarse window id
 * @param {Record<string, unknown[]>} p.rawMistakesBySubject
 * @param {number} p.startMs
 * @param {number} p.endMs
 */
export function extractUnitFeatures({ unit, row, windowId, rawMistakesBySubject, startMs, endMs }) {
  const subjectId = String(unit?.subjectId || "");
  const topicRowKey = String(unit?.topicRowKey || "");
  const bucketKey = String(unit?.bucketKey || "");
  const g = unit?.outputGating && typeof unit.outputGating === "object" ? unit.outputGating : {};
  const conf = unit?.confidence?.level != null ? String(unit.confidence.level) : "";
  const pri = unit?.priority?.level != null ? String(unit.priority.level) : "";
  const rowObj = row && typeof row === "object" ? row : {};
  const questions = Number(rowObj.questions) || 0;
  const wrongAgg = Number(rowObj.wrong) || 0;
  const correct = Number(rowObj.correct) || 0;
  const acc = Number(rowObj.accuracy);
  const accuracy01 = Number.isFinite(acc) ? Math.max(0, Math.min(1, acc / 100)) : null;

  const raw = rawMistakesBySubject?.[subjectId] || [];
  const events = row ? filterMistakesForRow(subjectId, topicRowKey, rowObj, raw, startMs, endMs) : [];
  const wrongEvents = events.filter((e) => !e.isCorrect);
  const behaviorDom = rowObj?.behaviorProfile?.dominantType != null ? String(rowObj.behaviorProfile.dominantType) : "";
  const trendDir = rowObj?.trend?.accuracyDirection != null ? String(rowObj.trend.accuracyDirection) : "";
  const needsPractice = !!rowObj.needsPractice;
  const recurrenceFull = !!unit?.recurrence?.full;
  const weakEvidence = wrongEvents.length === 0 && wrongAgg > 0;
  const contradictoryConfidence = conf === "contradictory";

  return {
    featureSchemaVersion: FEATURE_SCHEMA_VERSION,
    windowId: String(windowId || ""),
    subjectId,
    topicRowKey,
    bucketKey,
    displayName: String(unit?.displayName || bucketKey),
    questions,
    wrongAggregate: wrongAgg,
    wrongEventCount: wrongEvents.length,
    eventCount: events.length,
    accuracy01,
    confidenceLevel: conf,
    priorityLevel: pri,
    cannotConcludeYet: !!g.cannotConcludeYet,
    diagnosisAllowed: !!g.diagnosisAllowed,
    confidenceOnly: !!g.confidenceOnly,
    probeOnly: !!g.probeOnly,
    interventionAllowed: !!g.interventionAllowed,
    humanReviewRecommended: !!g.humanReviewRecommended,
    weakEvidence,
    contradictoryConfidence,
    recurrenceFull,
    behaviorDominant: behaviorDom,
    trendAccuracyDirection: trendDir,
    needsPracticeRow: needsPractice,
    dataSufficiencyLevel: rowObj.dataSufficiencyLevel ?? null,
    isEarlySignalOnly: rowObj.isEarlySignalOnly ?? null,
    lastSessionMs: rowObj.lastSessionMs ?? null,
    modeKey: rowObj.modeKey != null ? String(rowObj.modeKey) : "",
    priorProbeOutcome: null,
    priorInterventionOutcome: null,
  };
}
