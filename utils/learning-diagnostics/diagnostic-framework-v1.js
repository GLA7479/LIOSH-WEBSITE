/**
 * Professional Diagnostic Framework V1 (internal, educational support only).
 * Subjects: math, hebrew only. Does not replace diagnosticEngineV2.
 *
 * No clinical or medical claims. Language is educational and cautious.
 */
import { mathReportBaseOperationKey } from "../math-report-generator.js";

export const PROFESSIONAL_FRAMEWORK_V1 = {
  version: "1.0.0",
  name: "Professional Diagnostic Framework V1",
  supportedSubjectIds: /** @type {const} */ (["math", "hebrew"]),
  evidenceLevelEnum: /** @type {const} */ (["none", "thin", "limited", "medium", "strong"]),
  confidenceEnum: /** @type {const} */ (["very_low", "low", "medium", "high"]),
  recommendationTypeEnum: /** @type {const} */ ([
    "continue_current_level",
    "advance_cautiously",
    "targeted_practice",
    "review_foundation",
    "collect_more_data",
    "slow_down_and_check",
    "teacher_review_recommended",
    "professional_review_consideration",
  ]),
  /** Banned in generated reasoning (English + Hebrew common clinical terms) */
  bannedConclusionPhrases: [
    "dyslexia",
    "dyscalculia",
    "adhd",
    "learning disability",
    "קושי למידה קליני",
    "אבחון רפואי",
    "אבחון קליני",
  ],
};

/** Math skill taxonomy (internal ids). */
export const MATH_SKILLS_V1 = {
  arithmetic_operations: {
    label: "Arithmetic / operations",
    subskills: ["addition", "subtraction", "multiplication", "division", "order_of_operations"],
  },
  fractions: {
    label: "Fractions",
    subskills: [
      "numerator_denominator_understanding",
      "compare_fractions",
      "unlike_denominators",
      "equivalent_fractions",
      "add_fractions",
      "subtract_fractions",
      "simplify_fractions",
      "mixed_numbers",
      "fraction_word_problems",
    ],
  },
  word_problems: {
    label: "Word problems",
    subskills: [
      "identify_operation_from_text",
      "translate_text_to_equation",
      "multi_step_reasoning",
      "irrelevant_information",
      "reading_the_question",
    ],
  },
  number_sense: {
    label: "Place value / number sense",
    subskills: ["place_value", "rounding", "estimation", "number_line_reasoning"],
  },
};

export const MATH_ERROR_TYPES_V1 = [
  "calculation_error",
  "conceptual_misunderstanding",
  "denominator_confusion",
  "numerator_denominator_confusion",
  "operation_selection_error",
  "place_value_error",
  "skipped_step",
  "reading_instruction_error",
  "careless_error",
  "fast_guessing_pattern",
  "insufficient_evidence",
];

/** Hebrew skill taxonomy (internal ids). */
export const HEBREW_SKILLS_V1 = {
  reading_comprehension: {
    label: "Reading comprehension",
    subskills: [
      "explicit_information",
      "inference",
      "main_idea",
      "sequence_of_events",
      "cause_and_effect",
      "vocabulary_in_context",
      "fact_vs_opinion",
      "understanding_instructions",
      "character_or_text_intent",
    ],
  },
  language_grammar: {
    label: "Language / grammar",
    subskills: ["sentence_structure", "verb_tense_recognition", "word_meaning", "spelling_morphology"],
  },
};

export const HEBREW_ERROR_TYPES_V1 = [
  "missed_explicit_information",
  "weak_inference",
  "sequence_confusion",
  "vocabulary_context_error",
  "main_idea_confusion",
  "cause_effect_confusion",
  "instruction_misread",
  "careless_error",
  "guessing_pattern",
  "insufficient_evidence",
];

/** Map bucketKey -> primary framework skill id for Math */
export function mathSkillIdFromBucketKey(bucketKeyRaw) {
  const base = mathReportBaseOperationKey(String(bucketKeyRaw || ""));
  if (["fractions", "decimals", "percentages", "rounding"].includes(base)) return "fractions";
  if (["word_problems", "sequences", "equations", "mixed"].includes(base)) return "word_problems";
  if (
    ["addition", "subtraction", "multiplication", "division", "division_with_remainder", "order_of_operations"].includes(
      base
    )
  )
    return "arithmetic_operations";
  if (["number_sense", "compare", "scale", "estimation", "prime_composite", "zero_one_properties"].includes(base))
    return "number_sense";
  return "arithmetic_operations";
}

/** Map bucketKey -> primary framework skill id for Hebrew */
export function hebrewSkillIdFromBucketKey(bucketKeyRaw) {
  const b = String(bucketKeyRaw || "").trim();
  if (["comprehension", "reading"].includes(b)) return "reading_comprehension";
  if (["grammar", "vocabulary", "writing", "speaking"].includes(b)) return "language_grammar";
  return "reading_comprehension";
}

/**
 * Derive internal evidence level from row + subject volume (does not override engine confidence strings).
 */
export function deriveEvidenceLevelV1({ rowQuestions, subjectQuestionTotal, accuracy, dataSufficiencyLevel }) {
  const q = Number(rowQuestions) || 0;
  const sub = Number(subjectQuestionTotal) || 0;
  const acc = Number(accuracy);
  const dsl = String(dataSufficiencyLevel || "").toLowerCase();

  if (q <= 0 && sub <= 0) return "none";
  if (q < 5 || dsl === "low") return "thin";
  if (q < 12 || sub < 20) return "limited";
  if (q >= 40 && sub >= 60) return "strong";
  if (q >= 25 && sub >= 40 && Number.isFinite(acc)) return "medium";
  return "limited";
}

/**
 * Map canonical action + signals to structured recommendation type (educational only).
 */
export function recommendationTypeFromSignals({
  actionState,
  evidenceLevel,
  dominantBehavior,
  counterEvidenceStrong,
  narrowSample,
}) {
  const a = String(actionState || "withhold");
  const ev = String(evidenceLevel || "thin");
  const dom = String(dominantBehavior || "");

  if (ev === "none" || ev === "thin") return "collect_more_data";
  if (a === "withhold" || a === "probe_only") {
    if (narrowSample) return "collect_more_data";
    return "targeted_practice";
  }
  if (a === "maintain") return "continue_current_level";
  if (a === "expand_cautiously") return "advance_cautiously";
  if (counterEvidenceStrong && dom === "speed_pressure") return "slow_down_and_check";
  if (a === "diagnose_only") return "teacher_review_recommended";
  if (a === "intervene") return "targeted_practice";
  return "collect_more_data";
}

function inferErrorTypesV1(subjectId, row, behaviorDom) {
  const acc = Number(row?.accuracy);
  const wrong = Number(row?.wrong) || 0;
  const rowQ = Number(row?.questions) || 0;
  const dom = String(behaviorDom || "");
  const out = [];
  if (subjectId === "math") {
    if (dom === "knowledge_gap") out.push("conceptual_misunderstanding");
    if (dom === "careless_pattern") out.push("careless_error");
    if (dom === "speed_pressure" && wrong > 0) out.push("fast_guessing_pattern");
    if (wrong === 0 && Number.isFinite(acc) && acc < 70) out.push("insufficient_evidence");
    if (out.length === 0 && wrong > 0) out.push("calculation_error");
  } else if (subjectId === "hebrew") {
    if (dom === "knowledge_gap") out.push("weak_inference");
    if (dom === "instruction_friction") out.push("instruction_misread");
    if (dom === "speed_pressure") out.push("guessing_pattern");
    if (rowQ > 0 && rowQ < 8 && wrong === 0) out.push("insufficient_evidence");
    if (out.length === 0 && wrong > 0) out.push("missed_explicit_information");
  }
  return [...new Set(out)].slice(0, 6);
}

function subjectWideWeaknessBlockedReasoning(subjectId, maps, summaryCounts) {
  const m = maps?.[subjectId];
  if (!m || typeof m !== "object") {
    return ["Subject map unavailable—do not infer subject-wide patterns without topic rows."];
  }
  const rows = Object.values(m).filter((r) => (Number(r?.questions) || 0) > 0);
  const weakRows = rows.filter((r) => Number(r.accuracy) < 70 || r.needsPractice);
  return [
    weakRows.length <= 1
      ? "Subject-wide weakness is not asserted from a single weak topic; other topics in this subject should show weakness across multiple skills."
      : "Multiple weak topic rows exist—subject-level concern may be considered only when breadth criteria are met.",
  ];
}

/**
 * Attach professionalFrameworkV1 to each math/hebrew unit and add rollup on diagnosticEngineV2 root.
 * @param {object} diagnosticEngineV2 — output of runDiagnosticEngineV2
 * @param {Record<string, Record<string, unknown>>} maps — subject -> topicRowKey -> row
 * @param {object} summaryCounts — mathQuestions, hebrewQuestions, mathAccuracy, hebrewAccuracy, totalQuestions
 */
export function enrichDiagnosticEngineV2WithProfessionalFrameworkV1(diagnosticEngineV2, maps, summaryCounts = {}) {
  if (!diagnosticEngineV2 || typeof diagnosticEngineV2 !== "object") return diagnosticEngineV2;

  const mathQ = Number(summaryCounts.mathQuestions) || 0;
  const hebrewQ = Number(summaryCounts.hebrewQuestions) || 0;
  const units = Array.isArray(diagnosticEngineV2.units) ? diagnosticEngineV2.units : [];

  const globalDoNotConclude = [
    "Do not infer clinical or medical conditions from practice patterns.",
    "Do not conclude subject-wide weakness from a single weak topic without breadth evidence.",
    "Do not conclude mastery from high accuracy on very few questions.",
    "Do not treat slow response time as weakness when accuracy remains strong.",
    "Do not treat subjects with no activity as failed.",
  ];

  /** @type {object[]} */
  const structuredFindings = [];

  for (const u of units) {
    if (!u || typeof u !== "object") continue;
    const sid = String(u.subjectId || "");
    if (sid !== "math" && sid !== "hebrew") continue;

    const trk = String(u.topicRowKey || "");
    const row = maps[sid]?.[trk];
    const bucketKey = String(u.bucketKey || "");
    const skillPack = sid === "math" ? MATH_SKILLS_V1 : HEBREW_SKILLS_V1;
    const skillId = sid === "math" ? mathSkillIdFromBucketKey(bucketKey) : hebrewSkillIdFromBucketKey(bucketKey);
    const subjQ = sid === "math" ? mathQ : hebrewQ;

    const rowQ = Number(row?.questions) || Number(u.evidenceTrace?.[0]?.value?.questions) || 0;
    const acc = Number(row?.accuracy);
    const evidenceLevel = deriveEvidenceLevelV1({
      rowQuestions: rowQ,
      subjectQuestionTotal: subjQ,
      accuracy: acc,
      dataSufficiencyLevel: row?.dataSufficiencyLevel,
    });

    const cs = u.canonicalState;
    const actionState = cs?.actionState || "withhold";
    const narrowSample = rowQ > 0 && rowQ < 10;

    const confidence =
      evidenceLevel === "strong" && !narrowSample ? "high" : evidenceLevel === "medium" ? "medium" : evidenceLevel === "limited" ? "low" : "very_low";

    const behaviorDom = row?.behaviorProfile?.dominantType || u.strengthProfile?.dominantBehavior || "";
    const counterEvidenceStrong =
      Number(row?.accuracy) >= 88 && (Number(row?.wrong) || 0) >= 4;

    const nextType = recommendationTypeFromSignals({
      actionState,
      evidenceLevel,
      dominantBehavior: behaviorDom,
      counterEvidenceStrong: !!counterEvidenceStrong,
      narrowSample,
    });

    const errorTypes = inferErrorTypesV1(sid, row, behaviorDom);

    const reasoning = [];
    if (Number.isFinite(acc)) reasoning.push(`Observed topic accuracy is approximately ${Math.round(acc)}% over ${rowQ} questions in-window.`);
    if (subjQ > 0) reasoning.push(`Subject-level question volume in-window is approximately ${subjQ}.`);
    if (behaviorDom) reasoning.push(`Dominant behavior signal on the row: ${behaviorDom} (informational, not a diagnosis).`);
    if (evidenceLevel === "thin" || evidenceLevel === "limited") {
      reasoning.push("Evidence is limited—interpretation should stay cautious.");
    }
    if (row?.modeKey === "speed" && Number(row?.accuracy) >= 75) {
      reasoning.push(
        "Speed-mode performance with solid accuracy should not be treated as a knowledge weakness by itself."
      );
    }
    if (nextType === "teacher_review_recommended" || nextType === "professional_review_consideration") {
      reasoning.push(
        "If this pattern persists across multiple weeks, consider discussing with a teacher or qualified professional."
      );
    }

    const doNotConclude = [
      ...(u.diagnosis?.forbiddenInferencesHe || []).slice(0, 4).map((x) => String(x)),
      ...subjectWideWeaknessBlockedReasoning(sid, maps, summaryCounts).slice(0, 2),
    ];
    if (evidenceLevel === "thin" || evidenceLevel === "limited") {
      doNotConclude.push("Do not draw strong conclusions until more practice data is collected.");
    }
    if (mathQ === 0 && sid === "math") {
      doNotConclude.push("No math activity in window—do not infer math weakness.");
    }
    if (hebrewQ === 0 && sid === "hebrew") {
      doNotConclude.push("No Hebrew activity in window—do not infer Hebrew weakness.");
    }

    let findingType = "topic_signal";
    if (actionState === "intervene" || actionState === "diagnose_only") findingType = "topic_weakness_candidate";
    if (actionState === "maintain" || actionState === "expand_cautiously") findingType = "topic_strength_signal";
    if (evidenceLevel === "none" || evidenceLevel === "thin") findingType = "insufficient_evidence_signal";

    const subjAvg =
      sid === "math"
        ? Number(summaryCounts.mathAccuracy)
        : Number(summaryCounts.hebrewAccuracy);
    const subjAvgN = Number.isFinite(subjAvg) ? subjAvg : null;
    const structuredFinding = {
      findingType,
      subjectId: sid,
      topicId: bucketKey || null,
      skillId,
      evidenceLevel,
      confidence,
      basedOn: {
        questionCount: rowQ,
        accuracy: Number.isFinite(acc) ? Math.round(acc * 10) / 10 : null,
        sessionsApprox: null,
        trend: row?.trend?.accuracyDirection || "unknown",
        comparedToSubjectAverage:
          Number.isFinite(acc) && subjQ > 0 && subjAvgN !== null
            ? Math.round((acc - subjAvgN) * 10) / 10
            : null,
      },
      reasoning,
      doNotConclude: [...new Set(doNotConclude)].slice(0, 12),
      nextAction: {
        type: nextType,
      },
      frameworkMeta: {
        frameworkVersion: PROFESSIONAL_FRAMEWORK_V1.version,
        skillPackKey: skillId,
        subskillsAvailable: skillPack[skillId]?.subskills || [],
        errorTypesConsidered: errorTypes,
      },
    };

    u.professionalFrameworkV1 = {
      structuredFinding,
      errorTypesV1: sid === "math" ? MATH_ERROR_TYPES_V1 : HEBREW_ERROR_TYPES_V1,
    };
    structuredFindings.push(structuredFinding);
  }

  diagnosticEngineV2.professionalFrameworkV1 = {
    frameworkVersion: PROFESSIONAL_FRAMEWORK_V1.version,
    subjectsCoveredThisPass: ["math", "hebrew"],
    structuredFindings,
    globalDoNotConclude,
    clinicalLanguageGuard: PROFESSIONAL_FRAMEWORK_V1.bannedConclusionPhrases,
  };

  return diagnosticEngineV2;
}
