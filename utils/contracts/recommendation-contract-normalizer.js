/**
 * Phase 6: align recommendation contract intensity/eligible with decision.step only.
 * @param {object|null|undefined} contract
 * @param {string} decisionStep
 */
export function normalizeRecommendationContract(contract, decisionStep) {
  if (!contract || typeof contract !== "object") {
    return contract;
  }

  const step = String(decisionStep || "maintain_and_strengthen");

  const out = { ...contract };

  // HARD RULES — CONTRACT MUST MATCH STEP

  if (step === "maintain_and_strengthen") {
    out.intensity = "RI1";
    out.eligible = true;
  }

  if (step === "remediate_same_level") {
    out.intensity = "RI2";
    out.eligible = true;
  }

  if (step === "advance_level" || step === "advance_grade_topic_only") {
    out.intensity = "RI3";
    out.eligible = true;
  }

  if (step === "drop_one_level_topic_only" || step === "drop_one_grade_topic_only") {
    out.intensity = "RI2";
    out.eligible = true;
  }

  // SAFETY — if step is unknown
  const VALID_STEPS = [
    "maintain_and_strengthen",
    "remediate_same_level",
    "advance_level",
    "advance_grade_topic_only",
    "drop_one_level_topic_only",
    "drop_one_grade_topic_only",
  ];

  if (!VALID_STEPS.includes(step)) {
    out.intensity = "RI1";
    out.eligible = false;
  }

  if (out.eligible === true && (out.family == null || out.family === undefined)) {
    out.family = "general_practice";
  }

  return out;
}
