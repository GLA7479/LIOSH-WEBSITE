/**
 * Source of truth — כיתה ו׳ (g6) בלבד.
 */

const ALL_MODES = ["learning", "challenge", "speed", "marathon", "practice"];

export const G6_FLAGS_DEFAULT = {
  scoring: "none",
  niqqud: "inherit",
  audio: "off",
  speaking: "off",
};

/** @type {Record<string, { subtopics: Array<{ id: string, weight: number, order: number, modesAllowed: string[], flags: Record<string, string> }> }>} */
export const HEBREW_G6_CONTENT_MAP = {
  reading: {
    subtopics: [
      { id: "g6.complex_text_analysis", weight: 9, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
      { id: "g6.compare_genres", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
    ],
  },
  comprehension: {
    subtopics: [
      { id: "g6.critical_evaluation_light", weight: 8, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
      { id: "g6.evidence_from_text", weight: 8, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
    ],
  },
  writing: {
    subtopics: [
      { id: "g6.argumentative_full_scaffold", weight: 9, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
      { id: "g6.research_literacy_choice", weight: 6, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
    ],
  },
  grammar: {
    subtopics: [
      { id: "g6.possession_prep", weight: 6, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
      { id: "g6.subject_verb_advanced", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
      { id: "g6.complex_syntax_spot", weight: 6, order: 3, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
    ],
  },
  vocabulary: {
    subtopics: [
      { id: "g6.academic_vocab", weight: 8, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
      { id: "g6.discipline_words_light", weight: 6, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
    ],
  },
  speaking: {
    subtopics: [
      { id: "g6.debate_scaffold_choice", weight: 10, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G6_FLAGS_DEFAULT } },
    ],
  },
};
