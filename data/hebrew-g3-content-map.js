/**
 * Source of truth — כיתה ג׳ (g3) בלבד.
 */

const ALL_MODES = ["learning", "challenge", "speed", "marathon", "practice"];

export const G3_FLAGS_DEFAULT = {
  scoring: "none",
  niqqud: "inherit",
  audio: "off",
  speaking: "off",
};

/** @type {Record<string, { subtopics: Array<{ id: string, weight: number, order: number, modesAllowed: string[], flags: Record<string, string> }> }>} */
export const HEBREW_G3_CONTENT_MAP = {
  reading: {
    subtopics: [
      { id: "g3.multi_sentence", weight: 9, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
      { id: "g3.genre_tag_info_vs_story", weight: 6, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
    ],
  },
  comprehension: {
    subtopics: [
      { id: "g3.cause_effect", weight: 7, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
      { id: "g3.compare_light", weight: 6, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
      { id: "g3.explicit_only", weight: 8, order: 3, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
    ],
  },
  writing: {
    subtopics: [
      { id: "g3.two_three_sentences_structure", weight: 8, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
      { id: "g3.connector_use_choice", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
    ],
  },
  grammar: {
    subtopics: [
      { id: "g3.tense_system_intro", weight: 7, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
      { id: "g3.connectors", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
      { id: "g3.binyan_light", weight: 5, order: 3, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
    ],
  },
  vocabulary: {
    subtopics: [
      { id: "g3.word_families", weight: 8, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
      { id: "g3.context_meaning", weight: 8, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
    ],
  },
  speaking: {
    subtopics: [
      { id: "g3.discussion_prompt_choice", weight: 10, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G3_FLAGS_DEFAULT } },
    ],
  },
};
