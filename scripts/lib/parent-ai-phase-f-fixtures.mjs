/**
 * Phase F — fixtures bridging Copilot synthetic payload ↔ Parent AI detailed snapshot.
 */

import { syntheticPayload } from "../parent-copilot-test-fixtures.mjs";

/**
 * Minimal detailed-report-shaped payload for deterministic Parent AI insight (adapter).
 */
export function buildDetailedPayloadForParentAiInsight() {
  const sp = syntheticPayload({ eligible: true });
  return {
    version: sp.version ?? 2,
    generatedAt: new Date().toISOString(),
    periodInfo: { playerName: "סימולציה", period: "week" },
    subjectProfiles: sp.subjectProfiles,
    executiveSummary: {
      majorTrendsHe: ["קו ראשון בתקופה"],
      topStrengthsAcrossHe: ["חשבון: יציבות יחסית בתרגול"],
      topFocusAreasHe: ["חשבון: דיוק בחזרות קצרות"],
    },
    overallSnapshot: {
      totalQuestions: 24,
      totalTime: 45,
      overallAccuracy: 82,
      subjectCoverage: [
        { subject: "math", questionCount: 14, accuracy: 78 },
        { subject: "english", questionCount: 10, accuracy: 88 },
      ],
    },
    diagnosticEngineV2: null,
  };
}

/** Topic with sufficient anchored data (default synthetic). */
export function payloadTopicEnoughData() {
  return syntheticPayload({ eligible: true });
}

/** Topic row with questions=0 for thin-evidence path. */
export function payloadTopicThinData() {
  const base = syntheticPayload({ eligible: false });
  const sp = base.subjectProfiles[0];
  const tr = { ...sp.topicRecommendations[0], questions: 0, q: 0 };
  return { ...base, subjectProfiles: [{ ...sp, topicRecommendations: [tr] }] };
}
