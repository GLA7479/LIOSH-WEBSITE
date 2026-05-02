/**
 * @param {Record<string, unknown>} question
 * @param {object} opts
 * @param {import("./build-pending-probe.js").PendingDiagnosticProbe} opts.probeSnapshot
 * @param {string} opts.probeReason
 * @param {string[]|undefined} [opts.expectedErrorTags]
 */
export function attachProbeMetaToQuestion(question, {
  probeSnapshot,
  probeReason,
  expectedErrorTags,
}) {
  const tags =
    expectedErrorTags ??
    (Array.isArray(question.params?.expectedErrorTags)
      ? [...question.params.expectedErrorTags]
      : undefined);

  return {
    ...question,
    _diagnosticProbeAttempt: true,
    _probeMeta: {
      subjectId: probeSnapshot.subjectId,
      sourceHypothesisId: probeSnapshot.sourceHypothesisId,
      dominantTag: probeSnapshot.dominantTag ?? null,
      suggestedQuestionType: probeSnapshot.suggestedQuestionType,
      diagnosticSkillId: probeSnapshot.diagnosticSkillId ?? null,
      topicId: probeSnapshot.topicId,
      probeCreatedAt: probeSnapshot.createdAt,
      probeReason,
      expectedErrorTags: tags,
    },
  };
}
