export const DEV_STUDENT_PRESETS = Object.freeze([
  {
    id: "simDeep01_mixed_real_child",
    studentName: "LEOK Dev Mixed Child",
    spanDays: 120,
    targetSessions: 84,
    targetQuestions: 1500,
    subjectWeights: { math: 0.26, geometry: 0.18, hebrew: 0.22, english: 0.18, science: 0.16 },
    trendPattern: "mixed",
  },
  {
    id: "simDeep02_strong_stable_child",
    studentName: "LEOK Dev Strong Stable",
    spanDays: 105,
    targetSessions: 68,
    targetQuestions: 1120,
    subjectWeights: { math: 0.3, english: 0.28, hebrew: 0.24, science: 0.18 },
    trendPattern: "stable_strong",
  },
  {
    id: "simDeep03_weak_math_long_term",
    studentName: "LEOK Dev Weak Math Long-Term",
    spanDays: 135,
    targetSessions: 72,
    targetQuestions: 1020,
    subjectWeights: { math: 0.42, geometry: 0.18, hebrew: 0.22, english: 0.18 },
    trendPattern: "weak_math_persistent",
  },
  {
    id: "simDeep04_improving_child",
    studentName: "LEOK Dev Improving Child",
    spanDays: 120,
    targetSessions: 70,
    targetQuestions: 1160,
    subjectWeights: { math: 0.3, hebrew: 0.26, english: 0.2, geometry: 0.14, science: 0.1 },
    trendPattern: "improving",
  },
  {
    id: "simDeep05_declining_after_difficulty_jump",
    studentName: "LEOK Dev Declining After Jump",
    spanDays: 110,
    targetSessions: 62,
    targetQuestions: 920,
    subjectWeights: { math: 0.28, geometry: 0.2, english: 0.2, science: 0.17, hebrew: 0.15 },
    trendPattern: "decline_post_jump",
  },
  {
    id: "simDeep06_fast_careless_vs_slow_accurate_mix",
    studentName: "LEOK Dev Pace Mix",
    spanDays: 110,
    targetSessions: 58,
    targetQuestions: 860,
    subjectWeights: { math: 0.35, english: 0.22, geometry: 0.21, science: 0.22 },
    trendPattern: "pace_mixed",
  },
]);

export function getDevStudentPresetById(presetId) {
  return DEV_STUDENT_PRESETS.find((p) => p.id === presetId) || null;
}
