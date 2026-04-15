/**
 * Shared fixture payloads for Parent Copilot rollout suites.
 */

/**
 * @param {{ eligible?: boolean }} [opts]
 */
export function syntheticPayload(opts = {}) {
  const eligible = opts.eligible !== false;
  const recommendation = eligible
    ? {
        contractVersion: "v1",
        topicKey: "t1",
        subjectId: "math",
        eligible: true,
        intensity: "RI2",
        family: "general_practice",
        anchorEvidenceIds: ["ev1"],
        forbiddenBecause: [],
      }
    : {
        contractVersion: "v1",
        topicKey: "t1",
        subjectId: "math",
        eligible: false,
        intensity: "RI0",
        family: null,
        anchorEvidenceIds: [],
        forbiddenBecause: ["cannot_conclude_yet"],
      };
  return {
    version: 2,
    subjectProfiles: [
      {
        subject: "math",
        topicRecommendations: [
          {
            topicRowKey: "t1",
            displayName: "שברים",
            questions: 14,
            accuracy: 78,
            contractsV1: {
              evidence: { contractVersion: "v1", topicKey: "t1", subjectId: "math" },
              decision: {
                contractVersion: "v1",
                topicKey: "t1",
                subjectId: "math",
                decisionTier: eligible ? 2 : 0,
                cannotConcludeYet: !eligible,
              },
              readiness: { contractVersion: "v1", topicKey: "t1", subjectId: "math", readiness: eligible ? "emerging" : "insufficient" },
              confidence: { contractVersion: "v1", topicKey: "t1", subjectId: "math", confidenceBand: eligible ? "medium" : "low" },
              recommendation,
              narrative: {
                contractVersion: "v1",
                topicKey: "t1",
                subjectId: "math",
                wordingEnvelope: eligible ? "WE2" : "WE0",
                hedgeLevel: eligible ? "light" : "mandatory",
                allowedTone: "parent_professional_warm",
                forbiddenPhrases: ["בטוח לחלוטין"],
                requiredHedges: ["נכון לעכשיו"],
                allowedSections: ["summary", "finding", "recommendation", "limitations"],
                recommendationIntensityCap: eligible ? "RI2" : "RI0",
                textSlots: {
                  observation: "נכון לעכשיו בשברים נצפו 14 שאלות עם דיוק של כ־78%.",
                  interpretation: "נכון לעכשיו יש כיוון עבודה טוב אך עדיין נדרש חיזוק עקבי.",
                  action: eligible ? "נכון לעכשיו מומלץ תרגול קצר ממוקד וחזרה מונחית." : null,
                  uncertainty: "נכון לעכשיו כדאי להמשיך לעקוב ולוודא יציבות בסבב הבא.",
                },
              },
            },
          },
        ],
      },
      {
        subject: "english",
        topicRecommendations: [
          {
            topicRowKey: "e1",
            displayName: "דקדוק",
            questions: 10,
            accuracy: 88,
            contractsV1: {
              evidence: { contractVersion: "v1", topicKey: "e1", subjectId: "english" },
              decision: { contractVersion: "v1", topicKey: "e1", subjectId: "english", decisionTier: 2, cannotConcludeYet: false },
              readiness: { contractVersion: "v1", topicKey: "e1", subjectId: "english", readiness: "ready" },
              confidence: { contractVersion: "v1", topicKey: "e1", subjectId: "english", confidenceBand: "high" },
              recommendation: {
                contractVersion: "v1",
                topicKey: "e1",
                subjectId: "english",
                eligible: true,
                intensity: "RI2",
                family: "general_practice",
                anchorEvidenceIds: ["ev2"],
                forbiddenBecause: [],
              },
              narrative: {
                contractVersion: "v1",
                topicKey: "e1",
                subjectId: "english",
                wordingEnvelope: "WE2",
                hedgeLevel: "light",
                allowedTone: "parent_professional_warm",
                forbiddenPhrases: ["בטוח לחלוטין"],
                requiredHedges: ["נכון לעכשיו"],
                allowedSections: ["summary", "finding", "recommendation", "limitations"],
                recommendationIntensityCap: "RI2",
                textSlots: {
                  observation: "נכון לעכשיו בדקדוק נצפה דיוק של כ־88%.",
                  interpretation: "נכון לעכשיו מתקבלת יציבות טובה יחסית לתקופה.",
                  action: "נכון לעכשיו מומלץ לשמר תרגול מדורג וקצר.",
                  uncertainty: "נכון לעכשיו ממשיכים במעקב קצר לפני העלאת רמת קושי.",
                },
              },
            },
          },
        ],
      },
    ],
    executiveSummary: { majorTrendsHe: ["קו ראשון בתקופה", "קו שני בתקופה"] },
  };
}

export default { syntheticPayload };
