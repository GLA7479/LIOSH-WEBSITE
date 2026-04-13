/**
 * Source of truth — כיתה ה׳ (g5) בלבד.
 */

const ALL_MODES = ["learning", "challenge", "speed", "marathon", "practice"];

export const G5_FLAGS_DEFAULT = {
  scoring: "none",
  niqqud: "inherit",
  audio: "off",
  speaking: "off",
};

/** @type {Record<string, { subtopics: Array<{ id: string, weight: number, order: number, modesAllowed: string[], flags: Record<string, string> }> }>} */
export const HEBREW_G5_CONTENT_MAP = {
  reading: {
    subtopics: [
      { id: "g5.multi_layer_read", weight: 9, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
      { id: "g5.position_in_text", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
    ],
  },
  comprehension: {
    subtopics: [
      { id: "g5.inference", weight: 8, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
      { id: "g5.multiple_perspectives_light", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
    ],
  },
  writing: {
    subtopics: [
      { id: "g5.full_composition_scaffold_choice", weight: 9, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
      { id: "g5.genre_variety", weight: 6, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
    ],
  },
  grammar: {
    subtopics: [
      { id: "g5.syntax_agreement", weight: 8, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
      { id: "g5.verb_patterns", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
    ],
  },
  vocabulary: {
    subtopics: [
      { id: "g5.semantic_fields", weight: 7, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
      { id: "g5.academic_starter_words", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
    ],
  },
  speaking: {
    subtopics: [
      { id: "g5.argument_scaffold_choice", weight: 10, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G5_FLAGS_DEFAULT } },
    ],
  },
};
