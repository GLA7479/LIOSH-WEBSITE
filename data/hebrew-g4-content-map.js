/**
 * Source of truth — כיתה ד׳ (g4) בלבד.
 */

const ALL_MODES = ["learning", "challenge", "speed", "marathon", "practice"];

export const G4_FLAGS_DEFAULT = {
  scoring: "none",
  niqqud: "inherit",
  audio: "off",
  speaking: "off",
};

/** @type {Record<string, { subtopics: Array<{ id: string, weight: number, order: number, modesAllowed: string[], flags: Record<string, string> }> }>} */
export const HEBREW_G4_CONTENT_MAP = {
  reading: {
    subtopics: [
      { id: "g4.genre_mix", weight: 8, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
      { id: "g4.info_lit_intro", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
    ],
  },
  comprehension: {
    subtopics: [
      { id: "g4.summary_intro", weight: 8, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
      { id: "g4.text_structure", weight: 7, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
    ],
  },
  writing: {
    subtopics: [
      { id: "g4.intro_body_conclusion_choice", weight: 9, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
      { id: "g4.genre_appropriate_language", weight: 6, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
    ],
  },
  grammar: {
    subtopics: [
      { id: "g4.dictation_spot_error", weight: 6, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
      { id: "g4.root_pattern_intro", weight: 8, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
    ],
  },
  vocabulary: {
    subtopics: [
      { id: "g4.literary_lexicon_light", weight: 7, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
      { id: "g4.idiom_light", weight: 5, order: 2, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
    ],
  },
  speaking: {
    subtopics: [
      { id: "g4.present_text_based_choice", weight: 10, order: 1, modesAllowed: [...ALL_MODES], flags: { ...G4_FLAGS_DEFAULT } },
    ],
  },
};
