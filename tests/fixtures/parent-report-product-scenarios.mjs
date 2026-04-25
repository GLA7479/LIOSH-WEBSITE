import {
  PARENT_REPORT_SCENARIOS,
  FIXTURE_MATH_ROW_ADD_LEARN_G4_MED,
  buildSyntheticBaseReport,
  mathRowSession,
  mathWrongCluster,
} from "./parent-report-pipeline.mjs";
import { syntheticPayload as parentCopilotSyntheticPayload } from "../../scripts/parent-copilot-test-fixtures.mjs";

function emptyStorageSnapshot() {
  const emptyMath = JSON.stringify({ operations: {} });
  const emptyTopics = JSON.stringify({ topics: {} });
  const emptyProgress = JSON.stringify({ progress: {} });
  return {
    mleo_time_tracking: emptyMath,
    mleo_math_master_progress: emptyProgress,
    mleo_geometry_time_tracking: emptyTopics,
    mleo_geometry_master_progress: emptyProgress,
    mleo_english_time_tracking: emptyTopics,
    mleo_english_master_progress: emptyProgress,
    mleo_science_time_tracking: emptyTopics,
    mleo_science_master_progress: emptyProgress,
    mleo_hebrew_time_tracking: emptyTopics,
    mleo_hebrew_master_progress: emptyProgress,
    mleo_moledet_geography_time_tracking: emptyTopics,
    mleo_moledet_geography_master_progress: emptyProgress,
    mleo_mistakes: "[]",
    mleo_geometry_mistakes: "[]",
    mleo_english_mistakes: "[]",
    mleo_science_mistakes: "[]",
    mleo_hebrew_mistakes: "[]",
    mleo_moledet_geography_mistakes: "[]",
  };
}

function malformedStorageSnapshot() {
  return {
    ...emptyStorageSnapshot(),
    mleo_time_tracking: '{"operations":{"addition":{"sessions":[{"timestamp":1700}]}}',
    mleo_mistakes: "NOT_VALID_JSON",
    mleo_daily_challenge: "[1,2,3]",
    mleo_weekly_challenge: "null",
  };
}

function trendSufficientUpScenario() {
  return buildSyntheticBaseReport({
    summary: {
      totalQuestions: 48,
      mathQuestions: 48,
      mathCorrect: 38,
      mathAccuracy: 79,
      overallAccuracy: 79,
    },
    mathOperations: {
      [FIXTURE_MATH_ROW_ADD_LEARN_G4_MED]: mathRowSession({
        questions: 24,
        accuracy: 82,
        trend: {
          version: 1,
          accuracyDirection: "up",
          independenceDirection: "flat",
          fluencyDirection: "up",
          confidence: 0.72,
          trendEvidenceStatus: "sufficient",
          summaryHe: "מגמה חיובית עם נפח תקין.",
          evidence: { trendEvidencePoints: 4, minTrendPointsRequired: 3 },
          windows: {
            currentPeriod: { questions: 24, accuracy: 82, sessionCount: 3 },
            previousComparablePeriod: { questions: 24, accuracy: 70, sessionCount: 3 },
          },
        },
      }),
    },
    mistakes: { math: mathWrongCluster(4) },
    analysis: {
      mathMistakesByOperation: { [FIXTURE_MATH_ROW_ADD_LEARN_G4_MED]: { count: 4 } },
    },
  });
}

export const PARENT_REPORT_PRODUCT_SCENARIOS = [
  {
    id: "new_user_no_data",
    type: "storage_runtime",
    storage: emptyStorageSnapshot(),
    playerName: "",
    expectations: {
      requiresInsufficientLanguage: true,
      forbidsWeakDiagnosis: true,
      forbidsTrendDirectionWords: true,
    },
  },
  { id: "partial_data_only", type: "base_report", buildBaseReport: PARENT_REPORT_SCENARIOS.all_sparse },
  { id: "malformed_storage_session_data", type: "storage_runtime", storage: malformedStorageSnapshot(), playerName: "MalformedQA" },
  {
    id: "weak_enough_evidence",
    type: "base_report",
    buildBaseReport: PARENT_REPORT_SCENARIOS.knowledge_gap,
    expectations: {
      requiresClearPriority: true,
      requiresConcreteAction: true,
      forbidsCollectMoreOnly: true,
    },
  },
  {
    id: "weak_thin_evidence",
    type: "base_report",
    buildBaseReport: PARENT_REPORT_SCENARIOS.phase7_cross_subject_sparse_mixed,
    expectations: {
      requiresCautiousTone: true,
      forbidsStrongDiagnosis: true,
      forbidsAggressiveIntervention: true,
    },
  },
  { id: "improving_but_supported", type: "base_report", buildBaseReport: PARENT_REPORT_SCENARIOS.positive_trend_weak_independence },
  {
    id: "strong_stable_mastery",
    type: "base_report",
    buildBaseReport: PARENT_REPORT_SCENARIOS.stable_excellence,
    expectations: {
      requiresStrengthOrMaintain: true,
      forbidsInsufficientLanguageWhenEnoughEvidence: true,
      forbidsRemediation: true,
      maintainOnlyShouldStayConfident: true,
    },
  },
  {
    id: "strong_accuracy_fragile_success",
    type: "base_report",
    buildBaseReport: PARENT_REPORT_SCENARIOS.fragile_success,
    expectations: {
      mustMentionFragilityOrCaution: true,
    },
  },
  {
    id: "speed_issue_only_no_knowledge_gap",
    type: "base_report",
    buildBaseReport: PARENT_REPORT_SCENARIOS.speed_only_weakness,
    expectations: {
      forbidsKnowledgeGapLabel: true,
      requiresSpeedCaution: true,
    },
  },
  { id: "one_subject_active_others_empty", type: "base_report", buildBaseReport: PARENT_REPORT_SCENARIOS.one_dominant_subject },
  {
    id: "multiple_subjects_one_clear_priority",
    type: "base_report",
    buildBaseReport: PARENT_REPORT_SCENARIOS.mixed_signals_cross_subjects,
    expectations: {
      requiresGlobalPriorityAlignment: true,
    },
  },
  { id: "mixed_strength_and_weakness_same_subject", type: "base_report", buildBaseReport: PARENT_REPORT_SCENARIOS.high_risk_despite_strengths },
  {
    id: "trend_insufficient",
    type: "base_report",
    buildBaseReport: PARENT_REPORT_SCENARIOS.phase7_cross_subject_sparse_mixed,
    expectations: {
      forbidsTrendDirectionWords: true,
    },
  },
  {
    id: "trend_sufficient_down",
    type: "base_report",
    buildBaseReport: PARENT_REPORT_SCENARIOS.recent_transition_recent_difficulty_increase,
    expectations: {
      allowsTrendDownWhenSufficient: true,
    },
  },
  {
    id: "trend_sufficient_up",
    type: "base_report",
    buildBaseReport: trendSufficientUpScenario,
    expectations: {
      allowsTrendUpWhenSufficient: true,
    },
  },
  {
    id: "copilot_contract_alignment",
    type: "copilot_payload",
    buildCopilotPayload: () => parentCopilotSyntheticPayload({ eligible: true }),
    expectations: { requiresCopilotContractAlignment: true },
  },
];

export default { PARENT_REPORT_PRODUCT_SCENARIOS };

