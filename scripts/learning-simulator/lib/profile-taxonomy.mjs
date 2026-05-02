/**
 * Internal QA taxonomy for learning-simulator student profiles (not user-facing copy).
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const TAXONOMY_VERSION = "1.0.0";

/** Canonical stress harness types (align with BASE_PROFILES mapping in profile-stress-lib). */
export const CANONICAL_PROFILE_TYPES = [
  "strong_all_subjects",
  "weak_all_subjects",
  "average_student",
  "thin_data",
  "random_guessing",
  "inconsistent",
  "fast_wrong",
  "slow_correct",
  "improving",
  "declining",
  "subject_specific_weak",
  "subject_specific_strong",
  "topic_specific_weak",
  "mixed_strengths",
];

/**
 * Rich metadata for docs / audit only.
 * @type {Record<string, { description: string, accuracyModel: string, paceModel: string, consistencyModel: string, trendModel: string, dataVolumeModel: string, expectedReportBehavior: string, expectedBehaviorSignals: string[], recommendedUse: string }>}
 */
export const PROFILE_TYPE_METADATA = {
  strong_all_subjects: {
    description: "High accuracy across balanced subject weights; heavy volume.",
    accuracyModel: "band ~0.91",
    paceModel: "normal ~28s",
    consistencyModel: "low variance session accuracy",
    trendModel: "flat",
    dataVolumeModel: "heavy",
    expectedReportBehavior: "Strong framing without false weakness; sufficient evidence.",
    expectedBehaviorSignals: ["high overallAccuracyPct", "per-subject metrics present"],
    recommendedUse: "Regression on confident summaries",
  },
  weak_all_subjects: {
    description: "Low band accuracy across subjects with mild topic weaknesses.",
    accuracyModel: "band ~0.51",
    paceModel: "normal slower",
    consistencyModel: "moderate",
    trendModel: "flat",
    dataVolumeModel: "normal",
    expectedReportBehavior: "Support/diagnostic tone; no false strength.",
    expectedBehaviorSignals: ["low per-subject accuracy", "weak topic ranks"],
    recommendedUse: "Multi-subject struggle paths",
  },
  average_student: {
    description: "Mid accuracy band; typical classroom variance.",
    accuracyModel: "band ~0.66",
    paceModel: "normal",
    consistencyModel: "moderate",
    trendModel: "flat",
    dataVolumeModel: "normal",
    expectedReportBehavior: "Balanced narrative; avoid extremes.",
    expectedBehaviorSignals: ["mid overallAccuracyPct"],
    recommendedUse: "Default sanity between strong/weak",
  },
  thin_data: {
    description: "Few sessions/questions; caution pathways.",
    accuracyModel: "point ~0.72",
    paceModel: "normal",
    consistencyModel: "n/a",
    trendModel: "flat",
    dataVolumeModel: "thin",
    expectedReportBehavior: "Cautious contract / thin evidence.",
    expectedBehaviorSignals: ["low qTot", "confidenceShouldBeCautious"],
    recommendedUse: "Insufficient-evidence gates",
  },
  random_guessing: {
    description: "High randomGuessRate; accuracy near chance.",
    accuracyModel: "point ~0.37",
    paceModel: "fast erratic",
    consistencyModel: "high noise",
    trendModel: "flat",
    dataVolumeModel: "normal",
    expectedReportBehavior: "No false precision / strong conclusions.",
    expectedBehaviorSignals: ["low overallAccuracyPct", "contract thin/downgrade"],
    recommendedUse: "Anti-overconfidence",
  },
  inconsistent: {
    description: "Volatile session accuracy without monotonic trend.",
    accuracyModel: "volatile mean ~0.61",
    paceModel: "normal",
    consistencyModel: "high session stdev",
    trendModel: "inconsistent",
    dataVolumeModel: "normal",
    expectedReportBehavior: "Avoid overconfident single-number summaries.",
    expectedBehaviorSignals: ["volatility.stdev", "trendOracle variable"],
    recommendedUse: "Instability narrative",
  },
  fast_wrong: {
    description:
      "Random-guess-like accuracy with accelerated RT policy vs slow_correct; high mistake density vs questions.",
    accuracyModel: "low band (~≤58% meta overall); mistakeRateApprox ≥ floor",
    paceModel: "normal RT mean ~9s (policy) → low aggregate meanSecondsPerQuestion vs slow_correct cohort",
    consistencyModel: "moderate",
    trendModel: "flat",
    dataVolumeModel: "normal",
    expectedReportBehavior:
      "Low structured accuracy + fast SPQ + mistake signal; must not present as slow/careful strong learner pattern.",
    expectedBehaviorSignals: [
      "evidence.overallAccuracyPct low",
      "paceOracle.meanSecondsPerQuestion ≤ FAST_WRONG_MAX_SPQ",
      "evidence.mistakeRateApprox ≥ FAST_WRONG_MIN_MISTAKE_RATE",
      "!(report overallAccuracy high ∧ SPQ ≥ slow cohort floor)",
    ],
    recommendedUse: "Anti-confusion with slow_correct; regression on pace-accuracy coupling",
  },
  slow_correct: {
    description: "High accuracy band with deliberately slow RT policy vs fast_wrong; bounded mistake density.",
    accuracyModel: "high band (~≥72% meta overall); mistakeRateApprox ≤ ceiling",
    paceModel: "normal RT mean ~66s (policy) → high aggregate meanSecondsPerQuestion vs fast_wrong cohort",
    consistencyModel: "moderate",
    trendModel: "flat",
    dataVolumeModel: "normal",
    expectedReportBehavior:
      "Strong structured accuracy + slow SPQ; must not present as weak/fast guess profile.",
    expectedBehaviorSignals: [
      "evidence.overallAccuracyPct high",
      "paceOracle.meanSecondsPerQuestion ≥ SLOW_CORRECT_MIN_SPQ",
      "evidence.mistakeRateApprox ≤ SLOW_CORRECT_MAX_MISTAKE_RATE",
      "!(report overallAccuracy low ∧ SPQ ≤ fast cohort ceiling)",
    ],
    recommendedUse: "Reflective learner proxy; cohort median SPQ gap vs fast_wrong",
  },
  improving: {
    description: "Monotonic accuracy improvement over sessions.",
    accuracyModel: "trend start→end",
    paceModel: "faster_over_time optional",
    consistencyModel: "moderate",
    trendModel: "improving",
    dataVolumeModel: "normal",
    expectedReportBehavior: "Trend up or insufficient — not marked declining.",
    expectedBehaviorSignals: ["trendOracle up", "lateMean > earlyMean"],
    recommendedUse: "Growth narrative",
  },
  declining: {
    description: "Monotonic decline over window.",
    accuracyModel: "trend start→end",
    paceModel: "stable",
    consistencyModel: "moderate",
    trendModel: "declining",
    dataVolumeModel: "normal",
    expectedReportBehavior: "Trend down or insufficient — not marked improving.",
    expectedBehaviorSignals: ["trendOracle down"],
    recommendedUse: "Risk / intervention framing",
  },
  subject_specific_weak: {
    description: "One subject weighted; topic weaknesses concentrated.",
    accuracyModel: "byTopic",
    paceModel: "topic-aware",
    consistencyModel: "moderate",
    trendModel: "flat",
    dataVolumeModel: "normal",
    expectedReportBehavior: "Weakness visible in subject/topic metrics.",
    expectedBehaviorSignals: ["topic rank / bucket alignment"],
    recommendedUse: "Subject drill-down",
  },
  subject_specific_strong: {
    description: "Single subject dominance with strengthened topic accuracy.",
    accuracyModel: "byTopic highs",
    paceModel: "normal",
    consistencyModel: "moderate",
    trendModel: "flat",
    dataVolumeModel: "normal",
    expectedReportBehavior: "Prominent strength signal for subject/topic cluster.",
    expectedBehaviorSignals: ["high topic/subject accuracy"],
    recommendedUse: "Talent / enrichment framing checks",
  },
  topic_specific_weak: {
    description: "Single topic weakness within one subject (matrix cell aligned).",
    accuracyModel: "byTopic low target",
    paceModel: "normal",
    consistencyModel: "moderate",
    trendModel: "flat",
    dataVolumeModel: "normal",
    expectedReportBehavior: "Target topic among weakest for subject.",
    expectedBehaviorSignals: ["worstRankAmongSubject"],
    recommendedUse: "Granular remediation signal",
  },
  mixed_strengths: {
    description: "Multiple subjects with intentional strength/weak split.",
    accuracyModel: "byTopic mixed",
    paceModel: "normal",
    consistencyModel: "moderate",
    trendModel: "flat",
    dataVolumeModel: "normal",
    expectedReportBehavior: "Non-flat summary; spread across subjects.",
    expectedBehaviorSignals: ["subject metric spread"],
    recommendedUse: "Avoid generic single-axis summary",
  },
};

/**
 * Write profile-taxonomy-audit artifacts from fixtures + matrix QA reports.
 * @param {string} root — repo root
 * @param {string} outDir — reports/learning-simulator
 */
export async function writeProfileTaxonomyAudit(root, outDir) {
  const profilesUrl = pathToFileURL(join(root, "tests", "fixtures", "learning-simulator", "profiles", "base-profiles.mjs")).href;
  const quickUrl = pathToFileURL(join(root, "tests", "fixtures", "learning-simulator", "scenarios", "quick-scenarios.mjs")).href;
  const deepUrl = pathToFileURL(join(root, "tests", "fixtures", "learning-simulator", "scenarios", "deep-scenarios.mjs")).href;

  const { BASE_PROFILES } = await import(profilesUrl);
  const quickMod = await import(quickUrl);
  const deepMod = await import(deepUrl);
  const QUICK_SCENARIOS = quickMod.QUICK_SCENARIOS || quickMod.default || [];
  const DEEP_SCENARIOS = deepMod.DEEP_SCENARIOS || deepMod.default || [];

  const profileIds = Object.keys(BASE_PROFILES || {});
  const behaviorDimensions = {
    accuracy_level: ["p_strong_all_subjects", "p_weak_all_subjects", "p_thin_data", "p_random_guessing_student"].filter((id) =>
      profileIds.includes(id)
    ),
    subject_specific_weakness: profileIds.filter((id) => id.startsWith("p_weak_") && id !== "p_weak_all_subjects"),
    topic_specific_weakness: ["p_weak_math_fractions", "p_weak_hebrew_comprehension", "p_weak_english_grammar", "p_weak_science_experiments", "p_weak_geometry_area", "p_weak_moledet_maps"].filter(
      (id) => profileIds.includes(id)
    ),
    thin_data: profileIds.includes("p_thin_data") ? ["p_thin_data"] : [],
    random_guessing: profileIds.includes("p_random_guessing_student") ? ["p_random_guessing_student"] : [],
    inconsistent_performance: profileIds.includes("p_inconsistent_student") ? ["p_inconsistent_student"] : [],
    fast_wrong: [],
    slow_correct: [],
    improving_trend: profileIds.includes("p_improving_student") ? ["p_improving_student"] : [],
    declining_trend: profileIds.includes("p_declining_student") ? ["p_declining_student"] : [],
    strong_all_subjects: profileIds.includes("p_strong_all_subjects") ? ["p_strong_all_subjects"] : [],
    weak_all_subjects: profileIds.includes("p_weak_all_subjects") ? ["p_weak_all_subjects"] : [],
    mixed_strong_weak: [],
  };

  const gradesCovered = new Set();
  const subjectsCovered = new Set();
  const modes = { quick: 0, deep: 0 };
  for (const s of QUICK_SCENARIOS) {
    modes.quick += 1;
    if (s.grade) gradesCovered.add(s.grade);
    for (const x of s.subjects || []) subjectsCovered.add(x);
  }
  for (const s of DEEP_SCENARIOS) {
    modes.deep += 1;
    if (s.grade) gradesCovered.add(s.grade);
    for (const x of s.subjects || []) subjectsCovered.add(x);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    versions: { profileTaxonomyAudit: "1.0.0" },
    existingBaseProfileIds: profileIds,
    scenarioCounts: { quickScenarios: QUICK_SCENARIOS.length, deepScenarios: DEEP_SCENARIOS.length },
    quickScenarioProfileRefs: [...new Set(QUICK_SCENARIOS.map((s) => s.profileRef).filter(Boolean))].sort(),
    deepScenarioProfileRefs: [...new Set(DEEP_SCENARIOS.map((s) => s.profileRef).filter(Boolean))].sort(),
    gradesTouchedInFixtures: [...gradesCovered].sort(),
    subjectsTouchedInFixtures: [...subjectsCovered].sort(),
    behaviorDimensionsObserved: behaviorDimensions,
    canonicalTypesDefined: CANONICAL_PROFILE_TYPES,
    synthesizedStressOnlyTypes: ["average_student", "fast_wrong", "slow_correct", "subject_specific_strong", "mixed_strengths"],
    duplicatedOrUnclearNotes:
      "Several p_weak_* profiles overlap on purpose (different subjects/topics). `p_improving_student` / `p_declining_student` share trend machinery with different weights.",
    importantProfileGaps: [
      "No explicit `average_student` base profile — synthesized in stress harness.",
      "No dedicated `fast_wrong` / `slow_correct` — derived by mutating RT policies.",
      "No `subject_specific_strong` base profile — synthesized via topicStrengths in stress harness.",
    ],
  };

  const md = [
    "# Profile taxonomy audit (simulator)",
    "",
    `- Generated: ${payload.generatedAt}`,
    "",
    "## Base profile IDs",
    "",
    profileIds.map((id) => `- \`${id}\``).join("\n"),
    "",
    "## Fixture scenarios",
    "",
    `- Quick: ${payload.scenarioCounts.quickScenarios} scenarios`,
    `- Deep: ${payload.scenarioCounts.deepScenarios} scenarios`,
    "",
    "## Grades / subjects touched (fixtures)",
    "",
    `- Grades: ${payload.gradesTouchedInFixtures.join(", ")}`,
    `- Subjects: ${payload.subjectsTouchedInFixtures.join(", ")}`,
    "",
    "## Gaps / synthetic types",
    "",
    ...payload.importantProfileGaps.map((x) => `- ${x}`),
    "",
    `Full JSON: \`${join(outDir, "profile-taxonomy-audit.json").replace(/\\/g, "/")}\``,
    "",
  ].join("\n");

  await writeFile(join(outDir, "profile-taxonomy-audit.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(outDir, "profile-taxonomy-audit.md"), md, "utf8");
}
