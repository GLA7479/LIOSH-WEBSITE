/**
 * Prerequisite / dependency reasoning between skills (educational heuristics).
 */

export const DEPENDENCY_ENGINE_V1 = "1.0.0";

/** Skill-level prerequisites (skillId → prerequisite skillIds). */
/** @type {Record<string, Record<string, string[]>>} */
export const PREREQUISITE_GRAPH_V1 = {
  math: {
    fractions: ["arithmetic_operations", "number_sense"],
    word_problems: ["arithmetic_operations", "fractions"],
    arithmetic_operations: [],
    number_sense: [],
  },
  hebrew: {
    reading_comprehension: ["language_grammar"],
    language_grammar: [],
  },
  science: {
    experiments: ["observation", "cause_and_effect"],
    scientific_reasoning: ["classification", "observation"],
    observation: [],
    cause_and_effect: [],
    classification: [],
  },
  geometry: {
    area: ["shapes", "spatial_reasoning"],
    shapes: [],
    spatial_reasoning: [],
    angles: ["shapes"],
  },
  "moledet-geography": {
    maps: ["directions"],
    directions: [],
    location_reasoning: ["maps"],
  },
  english: {
    reading_comprehension: ["vocabulary", "grammar"],
    grammar: ["vocabulary"],
    vocabulary: [],
    translation: ["vocabulary", "reading_comprehension"],
    sentence_understanding: ["vocabulary"],
  },
};

/**
 * @param {string} subjectId
 * @param {string} skillId
 */
export function getDependencyNode(subjectId, skillId) {
  const pre = PREREQUISITE_GRAPH_V1[subjectId]?.[skillId] ?? [];
  return {
    subjectId,
    skillId,
    subskillId: null,
    prerequisiteSkillIds: pre,
    blocks: pre,
    supports: [],
    diagnosticProbeIds: pre.map((p) => `probe_${p}`),
  };
}

/**
 * @param {object} params
 * @param {ReturnType<import('./mastery-engine-v1.js').computeMasteryRollupV1>} params.mastery
 * @param {string} params.subjectId
 * @param {string} params.skillId
 */
export function analyzePrerequisiteGap({ mastery, subjectId, skillId }) {
  const items = mastery?.items || [];
  const self = items.find((x) => x.subjectId === subjectId && x.skillId === skillId);
  const node = getDependencyNode(subjectId, skillId);
  const prereqStates = (node.prerequisiteSkillIds || []).map((pid) => ({
    id: pid,
    row: items.find((x) => x.subjectId === subjectId && x.skillId === pid),
  }));

  let suspectedPrerequisiteGap = false;
  const evidence = [];
  const weakSelf =
    self && (self.masteryBand === "emerging" || self.masteryBand === "developing" || Number(self.masteryScore) < 55);
  if (weakSelf) {
    for (const p of prereqStates) {
      if (!p.row || p.row.masteryScore < 50) {
        suspectedPrerequisiteGap = true;
        evidence.push(`Prerequisite ${p.id} appears weak or unmeasured.`);
      }
    }
  }

  return {
    blockedSkillId: skillId,
    suspectedPrerequisiteGap,
    confidence: evidence.length ? "low" : "very_low",
    evidence,
    reasoning: [
      "Dependencies are educational hypotheses—verify with targeted probes.",
      "A weak advanced skill with weak prerequisites may indicate foundation gaps.",
    ],
    nextBestPrerequisiteToCheck: node.prerequisiteSkillIds[0] || null,
    doNotConclude: [
      "Do not label subject-wide failure from a single dependency edge.",
      "No clinical or medical conclusions.",
    ],
  };
}
