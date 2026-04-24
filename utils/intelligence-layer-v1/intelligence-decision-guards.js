/**
 * Intelligence v1 decision guards — step-only, fail-closed (no contract / wording changes here).
 */

const VALID_WEAKNESS = ["none", "tentative", "stable"];
const VALID_CONFIDENCE = ["low", "medium", "high"];

/**
 * @param {unknown} iv
 * @returns {{ weaknessLevel: string, confidenceBand: string, recurrence: boolean } | null}
 */
function normalizeIntelligenceV1(iv) {
  if (!iv || typeof iv !== "object") return null;

  let weaknessLevel = String(iv.weaknessLevel ?? iv.weakness?.level ?? "none").toLowerCase();
  let confidenceBand = String(iv.confidenceBand ?? iv.confidence?.band ?? "low").toLowerCase();
  if (confidenceBand === "moderate") confidenceBand = "medium";

  return {
    weaknessLevel,
    confidenceBand,
    recurrence: iv.recurrence === true || !!iv.patterns?.recurrenceFull,
  };
}

/**
 * @param {string} step
 * @param {{ intelligenceV1?: unknown }} ctx
 */
export function applyIntelligenceDecisionGuards(step, ctx) {
  const ivRaw = normalizeIntelligenceV1(ctx?.intelligenceV1);
  if (!ivRaw) {
    return { step: String(step || "maintain_and_strengthen"), blockers: [], applied: false };
  }

  let weaknessLevel = ivRaw.weaknessLevel;
  let confidenceBand = ivRaw.confidenceBand;
  if (!VALID_WEAKNESS.includes(weaknessLevel)) weaknessLevel = "none";
  if (!VALID_CONFIDENCE.includes(confidenceBand)) confidenceBand = "low";

  const weakness = weaknessLevel;
  const confidence = confidenceBand;
  const recurrence = ivRaw.recurrence;

  let out = String(step || "maintain_and_strengthen");
  /** @type {Array<{ id: string; from: string; to: string }>} */
  const blockers = [];

  let changed = true;
  while (changed) {
    changed = false;

    const isAdvance = out === "advance_level" || out === "advance_grade_topic_only";
    const isAggressive =
      isAdvance || out === "drop_one_level_topic_only" || out === "drop_one_grade_topic_only";

    if (confidence === "low" && isAggressive) {
      blockers.push({
        id: "low_confidence_block",
        from: out,
        to: "maintain_and_strengthen",
      });
      out = "maintain_and_strengthen";
      changed = true;
      continue;
    }

    if (weakness === "tentative" && isAdvance) {
      blockers.push({
        id: "tentative_block",
        from: out,
        to: "maintain_and_strengthen",
      });
      out = "maintain_and_strengthen";
      changed = true;
      continue;
    }

    if (recurrence && isAdvance) {
      blockers.push({
        id: "recurrence_block",
        from: out,
        to: "remediate_same_level",
      });
      out = "remediate_same_level";
      changed = true;
      continue;
    }

    if (weakness === "none" && out === "remediate_same_level") {
      blockers.push({
        id: "no_weakness_block",
        from: out,
        to: "maintain_and_strengthen",
      });
      out = "maintain_and_strengthen";
      changed = true;
      continue;
    }
  }

  return {
    step: out,
    blockers,
    applied: blockers.length > 0,
  };
}
