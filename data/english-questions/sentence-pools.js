// Metadata enrichment (safe pass): difficulty, cognitiveLevel, expectedErrorTypes, skillId (when no diagnostic), subtype (pool bucket when taxonomy-valid), prerequisiteSkillIds (gated). See reports/question-metadata-qa/english-metadata-apply-report.json.
export const SENTENCE_POOLS = {
  "base": [
    {
      "template": "I ___ a cat",
      "options": [
        "have",
        "has",
        "having"
      ],
      "correct": "have",
      "explanation": "I + have.",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "base_be_have_g1",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_have_g1",
      "subtype": "base"
    },
    {
      "template": "We ___ friends",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "We/They → are.",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "base_be_plural_g1",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_plural_g1",
      "subtype": "base"
    },
    {
      "template": "It ___ cold today",
      "options": [
        "is",
        "are",
        "am"
      ],
      "correct": "is",
      "explanation": "It → is.",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "base_be_it_g1",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_it_g1",
      "subtype": "base"
    },
    {
      "template": "She ___ my sister",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "is",
      "explanation": "She → is.",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "base_be_she_g1",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_she_g1",
      "subtype": "base"
    },
    {
      "template": "They ___ a new puppy",
      "options": [
        "have",
        "has",
        "having"
      ],
      "correct": "have",
      "explanation": "They + have.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "base_be_have_g2",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_have_g2",
      "subtype": "base"
    },
    {
      "template": "You and I ___ good friends",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "Compound subject → are.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "base_be_plural_g2",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_plural_g2",
      "subtype": "base"
    },
    {
      "template": "The sky ___ blue now",
      "options": [
        "is",
        "are",
        "am"
      ],
      "correct": "is",
      "explanation": "The sky → is.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "base_be_it_g2",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_it_g2",
      "subtype": "base"
    },
    {
      "template": "My mom ___ a doctor",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "is",
      "explanation": "She → is.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "base_be_she_g2",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_she_g2",
      "subtype": "base"
    },
    {
      "template": "You ___ a student",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "You → are.",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "base_be_you_g1",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_you_g1",
      "subtype": "base"
    },
    {
      "template": "They ___ in the classroom",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "They → are.",
      "minGrade": 1,
      "maxGrade": 1,
      "patternFamily": "base_be_they_g1",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_they_g1",
      "subtype": "base"
    },
    {
      "template": "You ___ my partner in class",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "You → are.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "base_be_you_g2",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_you_g2",
      "subtype": "base"
    },
    {
      "template": "They ___ at the playground",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "They → are.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "base_be_they_g2",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_they_g2",
      "subtype": "base"
    },
    {
      "template": "You ___ ready for the quiz",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "You → are.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "base_be_you_g3",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_you_g3",
      "subtype": "base"
    },
    {
      "template": "They ___ on the school bus",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "They → are.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "base_be_they_g3",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_they_g3",
      "subtype": "base"
    },
    {
      "template": "I ___ happy about the news",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "am",
      "explanation": "I → am.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "base_be_i_state_g3",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_i_state_g3",
      "subtype": "base"
    },
    {
      "template": "The dog ___ brown",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "is",
      "explanation": "The dog (it) → is.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "base_be_it_adj_g3",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_it_adj_g3",
      "subtype": "base"
    },
    {
      "template": "My friends ___ nice to me",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "My friends (they) → are.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "base_be_they_adj_g3",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_they_adj_g3",
      "subtype": "base"
    },
    {
      "template": "I ___ from Israel",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "am",
      "explanation": "I → am.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "base_be_i_from_g3",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_i_from_g3",
      "subtype": "base"
    },
    {
      "template": "I ___ glad we won",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "am",
      "explanation": "I → am.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "base_be_i_state_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_i_state_g4",
      "subtype": "base"
    },
    {
      "template": "The puppy ___ soft and small",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "is",
      "explanation": "The puppy (it) → is.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "base_be_it_adj_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_it_adj_g4",
      "subtype": "base"
    },
    {
      "template": "The students ___ helpful",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "The students (they) → are.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "base_be_they_adj_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_they_adj_g4",
      "subtype": "base"
    },
    {
      "template": "I ___ from Tel Aviv",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "am",
      "explanation": "I → am.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "base_be_i_from_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_i_from_g4",
      "subtype": "base"
    },
    {
      "template": "He ___ a science teacher",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "is",
      "explanation": "He → is.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "base_be_he_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_he_g5",
      "subtype": "base"
    },
    {
      "template": "We ___ in the same group",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "We → are.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "base_be_we_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_we_g5",
      "subtype": "base"
    },
    {
      "template": "The map ___ on the wall",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "is",
      "explanation": "The map (it) → is.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "base_be_it_place_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_it_place_g5",
      "subtype": "base"
    },
    {
      "template": "I ___ eleven years old",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "am",
      "explanation": "I → am.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "base_be_i_age_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_i_age_g5",
      "subtype": "base"
    },
    {
      "template": "You and I ___ on the same team",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "You and I = We → are.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "base_be_compound_subject_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_compound_subject_g5",
      "subtype": "base"
    },
    {
      "template": "He ___ our English teacher",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "is",
      "explanation": "He → is.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "base_be_he_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_he_g6",
      "subtype": "base"
    },
    {
      "template": "We ___ lab partners",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "We → are.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "base_be_we_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_we_g6",
      "subtype": "base"
    },
    {
      "template": "The laptop ___ on the desk",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "is",
      "explanation": "The laptop (it) → is.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "base_be_it_place_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_it_place_g6",
      "subtype": "base"
    },
    {
      "template": "I ___ twelve years old",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "am",
      "explanation": "I → am.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "base_be_i_age_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_i_age_g6",
      "subtype": "base"
    },
    {
      "template": "You and I ___ ready to present",
      "options": [
        "am",
        "is",
        "are"
      ],
      "correct": "are",
      "explanation": "You and I = We → are.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "base_be_compound_subject_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "base_be_compound_subject_g6",
      "subtype": "base"
    }
  ],
  "routine": [
    {
      "template": "She ___ her teeth every night",
      "options": [
        "brush",
        "brushes",
        "brushing"
      ],
      "correct": "brushes",
      "explanation": "She + ‎-es‎ בזמן הווה.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "routine_present_g2_brush",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g2_brush",
      "subtype": "routine"
    },
    {
      "template": "They ___ the bus to school",
      "options": [
        "take",
        "takes",
        "took"
      ],
      "correct": "take",
      "explanation": "They → take.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "routine_present_g2_bus",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g2_bus",
      "subtype": "routine"
    },
    {
      "template": "Do you ___ breakfast early?",
      "options": [
        "eat",
        "eats",
        "ate"
      ],
      "correct": "eat",
      "explanation": "Do + subject + base form.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "routine_present_g2_breakfast_q",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g2_breakfast_q",
      "subtype": "routine"
    },
    {
      "template": "I ___ up at seven every morning",
      "options": [
        "wake",
        "wakes",
        "waking"
      ],
      "correct": "wake",
      "explanation": "I → wake (base form).",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "routine_present_g2_wake",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g2_wake",
      "subtype": "routine"
    },
    {
      "template": "Tom ___ to school every day",
      "options": [
        "go",
        "goes",
        "going"
      ],
      "correct": "goes",
      "explanation": "Tom (he) → goes עם ‎-es.",
      "minGrade": 2,
      "maxGrade": 2,
      "patternFamily": "routine_present_g2_go",
      "difficulty": "basic",
      "cognitiveLevel": "recall",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g2_go",
      "subtype": "routine"
    },
    {
      "template": "Anna ___ her hair before school",
      "options": [
        "brush",
        "brushes",
        "brushing"
      ],
      "correct": "brushes",
      "explanation": "She + ‎-es‎ בזמן הווה.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_brush",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_brush",
      "subtype": "routine"
    },
    {
      "template": "We ___ the train on Tuesdays",
      "options": [
        "take",
        "takes",
        "took"
      ],
      "correct": "take",
      "explanation": "We → take.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_train",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_train",
      "subtype": "routine"
    },
    {
      "template": "Does your brother ___ lunch at noon?",
      "options": [
        "eat",
        "eats",
        "ate"
      ],
      "correct": "eat",
      "explanation": "Does + subject + base form.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_lunch_q",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_lunch_q",
      "subtype": "routine"
    },
    {
      "template": "I ___ up before school on weekdays",
      "options": [
        "wake",
        "wakes",
        "waking"
      ],
      "correct": "wake",
      "explanation": "I → wake (base form).",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_wake",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_wake",
      "subtype": "routine"
    },
    {
      "template": "My dad ___ to work by car",
      "options": [
        "go",
        "goes",
        "going"
      ],
      "correct": "goes",
      "explanation": "He → goes עם ‎-es.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_go",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_go",
      "subtype": "routine"
    },
    {
      "template": "We ___ our homework after school",
      "options": [
        "do",
        "does",
        "doing"
      ],
      "correct": "do",
      "explanation": "We → do.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_homework",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_homework",
      "subtype": "routine"
    },
    {
      "template": "She ___ lunch at one o'clock",
      "options": [
        "have",
        "has",
        "having"
      ],
      "correct": "has",
      "explanation": "She → has.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_lunch",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_lunch",
      "subtype": "routine"
    },
    {
      "template": "They ___ cartoons after dinner",
      "options": [
        "watch",
        "watches",
        "watching"
      ],
      "correct": "watch",
      "explanation": "They → watch.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_tv",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_tv",
      "subtype": "routine"
    },
    {
      "template": "I ___ math twice a week",
      "options": [
        "study",
        "studies",
        "studying"
      ],
      "correct": "study",
      "explanation": "I → study.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_study",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_study",
      "subtype": "routine"
    },
    {
      "template": "My father ___ pasta on Fridays",
      "options": [
        "cook",
        "cooks",
        "cooking"
      ],
      "correct": "cooks",
      "explanation": "My father (he) → cooks עם ‎-s.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "routine_present_g3_cook",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g3_cook",
      "subtype": "routine"
    },
    {
      "template": "We ___ our projects after class",
      "options": [
        "do",
        "does",
        "doing"
      ],
      "correct": "do",
      "explanation": "We → do.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "routine_present_g4_homework",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g4_homework",
      "subtype": "routine"
    },
    {
      "template": "The class ___ a short break at noon",
      "options": [
        "have",
        "has",
        "having"
      ],
      "correct": "has",
      "explanation": "The class (it) → has.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "routine_present_g4_break",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g4_break",
      "subtype": "routine"
    },
    {
      "template": "They ___ a documentary on Fridays",
      "options": [
        "watch",
        "watches",
        "watching"
      ],
      "correct": "watch",
      "explanation": "They → watch.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "routine_present_g4_tv",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g4_tv",
      "subtype": "routine"
    },
    {
      "template": "I ___ science in Room 12",
      "options": [
        "study",
        "studies",
        "studying"
      ],
      "correct": "study",
      "explanation": "I → study.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "routine_present_g4_study",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g4_study",
      "subtype": "routine"
    },
    {
      "template": "My aunt ___ soup on Fridays",
      "options": [
        "cook",
        "cooks",
        "cooking"
      ],
      "correct": "cooks",
      "explanation": "My aunt (she) → cooks עם ‎-s.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "routine_present_g4_cook",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g4_cook",
      "subtype": "routine"
    },
    {
      "template": "Do you ___ to music every day?",
      "options": [
        "listen",
        "listens",
        "listening"
      ],
      "correct": "listen",
      "explanation": "Do you + base form.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "routine_present_g4_music",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g4_music",
      "subtype": "routine"
    },
    {
      "template": "We ___ the news after dinner",
      "options": [
        "read",
        "reads",
        "reading"
      ],
      "correct": "read",
      "explanation": "We → read.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "routine_present_g4_read",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g4_read",
      "subtype": "routine"
    },
    {
      "template": "He ___ his desk on Fridays",
      "options": [
        "clean",
        "cleans",
        "cleaning"
      ],
      "correct": "cleans",
      "explanation": "He → cleans עם ‎-s.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "routine_present_g4_clean",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g4_clean",
      "subtype": "routine"
    },
    {
      "template": "Do you ___ to podcasts in the car?",
      "options": [
        "listen",
        "listens",
        "listening"
      ],
      "correct": "listen",
      "explanation": "Do you + base form.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "routine_present_g5_music",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g5_music",
      "subtype": "routine"
    },
    {
      "template": "We ___ articles online before bed",
      "options": [
        "read",
        "reads",
        "reading"
      ],
      "correct": "read",
      "explanation": "We → read.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "routine_present_g5_read",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g5_read",
      "subtype": "routine"
    },
    {
      "template": "He ___ the kitchen on Sundays",
      "options": [
        "clean",
        "cleans",
        "cleaning"
      ],
      "correct": "cleans",
      "explanation": "He → cleans עם ‎-s.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "routine_present_g5_clean",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g5_clean",
      "subtype": "routine"
    },
    {
      "template": "They ___ basketball after school",
      "options": [
        "play",
        "plays",
        "playing"
      ],
      "correct": "play",
      "explanation": "They → play.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "routine_present_g5_sports",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g5_sports",
      "subtype": "routine"
    },
    {
      "template": "I ___ cereal before class",
      "options": [
        "eat",
        "eats",
        "eating"
      ],
      "correct": "eat",
      "explanation": "I → eat.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "routine_present_g5_breakfast",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g5_breakfast",
      "subtype": "routine"
    },
    {
      "template": "She ___ her scooter to the park",
      "options": [
        "ride",
        "rides",
        "riding"
      ],
      "correct": "rides",
      "explanation": "She → rides עם ‎-s.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "routine_present_g5_ride",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g5_ride",
      "subtype": "routine"
    },
    {
      "template": "They ___ volleyball on Tuesdays",
      "options": [
        "play",
        "plays",
        "playing"
      ],
      "correct": "play",
      "explanation": "They → play.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "routine_present_g6_sports",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g6_sports",
      "subtype": "routine"
    },
    {
      "template": "I ___ lunch at the cafeteria",
      "options": [
        "eat",
        "eats",
        "eating"
      ],
      "correct": "eat",
      "explanation": "I → eat.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "routine_present_g6_lunch",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g6_lunch",
      "subtype": "routine"
    },
    {
      "template": "She ___ to the pool by bus",
      "options": [
        "ride",
        "rides",
        "riding"
      ],
      "correct": "rides",
      "explanation": "She → rides עם ‎-s.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "routine_present_g6_ride",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "routine_present_g6_ride",
      "subtype": "routine"
    }
  ],
  "descriptive": [
    {
      "template": "The library is ___ the park",
      "options": [
        "next to",
        "under",
        "between"
      ],
      "correct": "next to",
      "explanation": "תיאור מיקום שכיח לכיתה ג'.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "descriptive_place_g3",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g3",
      "subtype": "descriptive"
    },
    {
      "template": "This notebook is ___ than mine",
      "options": [
        "bigger",
        "biggest",
        "big"
      ],
      "correct": "bigger",
      "explanation": "השוואה → ‎-er‎.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "descriptive_compare_g3",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g3",
      "subtype": "descriptive"
    },
    {
      "template": "The cake smells ___",
      "options": [
        "delicious",
        "deliciously",
        "delish"
      ],
      "correct": "delicious",
      "explanation": "תארים מתארים שמות עצם.",
      "minGrade": 3,
      "maxGrade": 3,
      "patternFamily": "descriptive_sense_g3",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_sense_g3",
      "subtype": "descriptive"
    },
    {
      "template": "The school is ___ the river",
      "options": [
        "next to",
        "under",
        "between"
      ],
      "correct": "next to",
      "explanation": "תיאור מיקום.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "descriptive_place_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g4",
      "subtype": "descriptive"
    },
    {
      "template": "This ruler is ___ than that one",
      "options": [
        "bigger",
        "biggest",
        "big"
      ],
      "correct": "bigger",
      "explanation": "השוואה → ‎-er‎.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "descriptive_compare_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g4",
      "subtype": "descriptive"
    },
    {
      "template": "The soup smells ___",
      "options": [
        "delicious",
        "deliciously",
        "delish"
      ],
      "correct": "delicious",
      "explanation": "תארים מתארים שמות עצם.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "descriptive_sense_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_sense_g4",
      "subtype": "descriptive"
    },
    {
      "template": "The cat is ___ the table",
      "options": [
        "under",
        "over",
        "next to"
      ],
      "correct": "under",
      "explanation": "תיאור מיקום → under.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "descriptive_place_g4b",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g4b",
      "subtype": "descriptive"
    },
    {
      "template": "This bag is ___ than that one",
      "options": [
        "heavy",
        "heavier",
        "heaviest"
      ],
      "correct": "heavier",
      "explanation": "השוואה → heavier.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "descriptive_compare_g4b",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g4b",
      "subtype": "descriptive"
    },
    {
      "template": "The flowers look ___",
      "options": [
        "beautiful",
        "beautifully",
        "beauty"
      ],
      "correct": "beautiful",
      "explanation": "תואר → beautiful.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "descriptive_sense_g4b",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_sense_g4b",
      "subtype": "descriptive"
    },
    {
      "template": "The shoes are ___ the bed",
      "options": [
        "under",
        "over",
        "next to"
      ],
      "correct": "under",
      "explanation": "תיאור מיקום → under.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_place_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g5",
      "subtype": "descriptive"
    },
    {
      "template": "This suitcase is ___ than mine",
      "options": [
        "heavy",
        "heavier",
        "heaviest"
      ],
      "correct": "heavier",
      "explanation": "השוואה → heavier.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_compare_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g5",
      "subtype": "descriptive"
    },
    {
      "template": "The paintings look ___",
      "options": [
        "beautiful",
        "beautifully",
        "beauty"
      ],
      "correct": "beautiful",
      "explanation": "תואר → beautiful.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_sense_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_sense_g5",
      "subtype": "descriptive"
    },
    {
      "template": "My room is ___ than yours",
      "options": [
        "big",
        "bigger",
        "biggest"
      ],
      "correct": "bigger",
      "explanation": "השוואה → bigger.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_compare_g5b",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g5b",
      "subtype": "descriptive"
    },
    {
      "template": "The ball is ___ the box",
      "options": [
        "in",
        "on",
        "at"
      ],
      "correct": "in",
      "explanation": "תיאור מיקום → in.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_place_g5b",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g5b",
      "subtype": "descriptive"
    },
    {
      "template": "This test is the ___ one",
      "options": [
        "hard",
        "harder",
        "hardest"
      ],
      "correct": "hardest",
      "explanation": "Superlative → hardest.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_superlative_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_superlative_g5",
      "subtype": "descriptive"
    },
    {
      "template": "The food tastes ___",
      "options": [
        "good",
        "well",
        "goodly"
      ],
      "correct": "good",
      "explanation": "תואר → good.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_sense_g5c",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_sense_g5c",
      "subtype": "descriptive"
    },
    {
      "template": "She is ___ than her brother",
      "options": [
        "tall",
        "taller",
        "tallest"
      ],
      "correct": "taller",
      "explanation": "השוואה → taller.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_compare_g5c",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g5c",
      "subtype": "descriptive"
    },
    {
      "template": "The book is ___ the shelf",
      "options": [
        "on",
        "in",
        "at"
      ],
      "correct": "on",
      "explanation": "תיאור מיקום → on.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_place_g5c",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g5c",
      "subtype": "descriptive"
    },
    {
      "template": "This is the ___ day",
      "options": [
        "nice",
        "nicer",
        "nicest"
      ],
      "correct": "nicest",
      "explanation": "Superlative → nicest.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_superlative_g5b",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_superlative_g5b",
      "subtype": "descriptive"
    },
    {
      "template": "The music sounds ___",
      "options": [
        "loud",
        "loudly",
        "loudness"
      ],
      "correct": "loud",
      "explanation": "תואר → loud.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_sense_g5d",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_sense_g5d",
      "subtype": "descriptive"
    },
    {
      "template": "My pencil is ___ than yours",
      "options": [
        "short",
        "shorter",
        "shortest"
      ],
      "correct": "shorter",
      "explanation": "השוואה → shorter.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_compare_g5d",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g5d",
      "subtype": "descriptive"
    },
    {
      "template": "The bird is ___ the tree",
      "options": [
        "on",
        "in",
        "at"
      ],
      "correct": "in",
      "explanation": "תיאור מיקום → in.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "descriptive_place_g5d",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g5d",
      "subtype": "descriptive"
    },
    {
      "template": "Our classroom is ___ than last year",
      "options": [
        "big",
        "bigger",
        "biggest"
      ],
      "correct": "bigger",
      "explanation": "השוואה → bigger.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_compare_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g6",
      "subtype": "descriptive"
    },
    {
      "template": "The keys are ___ the bowl",
      "options": [
        "in",
        "on",
        "at"
      ],
      "correct": "in",
      "explanation": "תיאור מיקום → in.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_place_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g6",
      "subtype": "descriptive"
    },
    {
      "template": "This quiz was the ___ so far",
      "options": [
        "hard",
        "harder",
        "hardest"
      ],
      "correct": "hardest",
      "explanation": "Superlative → hardest.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_superlative_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_superlative_g6",
      "subtype": "descriptive"
    },
    {
      "template": "The soup tastes ___",
      "options": [
        "good",
        "well",
        "goodly"
      ],
      "correct": "good",
      "explanation": "תואר → good.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_sense_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_sense_g6",
      "subtype": "descriptive"
    },
    {
      "template": "He is ___ than his cousin",
      "options": [
        "tall",
        "taller",
        "tallest"
      ],
      "correct": "taller",
      "explanation": "השוואה → taller.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_compare_g6b",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g6b",
      "subtype": "descriptive"
    },
    {
      "template": "The map is ___ the wall",
      "options": [
        "on",
        "in",
        "at"
      ],
      "correct": "on",
      "explanation": "תיאור מיקום → on.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_place_g6b",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g6b",
      "subtype": "descriptive"
    },
    {
      "template": "This is the ___ week of camp",
      "options": [
        "nice",
        "nicer",
        "nicest"
      ],
      "correct": "nicest",
      "explanation": "Superlative → nicest.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_superlative_g6b",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_superlative_g6b",
      "subtype": "descriptive"
    },
    {
      "template": "The concert sounds ___",
      "options": [
        "loud",
        "loudly",
        "loudness"
      ],
      "correct": "loud",
      "explanation": "תואר → loud.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_sense_g6b",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_sense_g6b",
      "subtype": "descriptive"
    },
    {
      "template": "My ruler is ___ than hers",
      "options": [
        "short",
        "shorter",
        "shortest"
      ],
      "correct": "shorter",
      "explanation": "השוואה → shorter.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_compare_g6c",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_compare_g6c",
      "subtype": "descriptive"
    },
    {
      "template": "The nest is ___ the branches",
      "options": [
        "on",
        "in",
        "at"
      ],
      "correct": "in",
      "explanation": "תיאור מיקום → in.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "descriptive_place_g6c",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "descriptive_place_g6c",
      "subtype": "descriptive"
    }
  ],
  "narrative": [
    {
      "template": "Yesterday we ___ to the science museum",
      "options": [
        "go",
        "went",
        "gone"
      ],
      "correct": "went",
      "explanation": "Past Simple של go.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "narrative_past_simple_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g4",
      "subtype": "narrative"
    },
    {
      "template": "While I ___, my friend called",
      "options": [
        "study",
        "was studying",
        "studied"
      ],
      "correct": "was studying",
      "explanation": "פעולה נמשכת בעבר → was/were + verb-ing.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "narrative_past_continuous_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_continuous_g4",
      "subtype": "narrative"
    },
    {
      "template": "He ___ a robot for the fair",
      "options": [
        "built",
        "builds",
        "building"
      ],
      "correct": "built",
      "explanation": "עבר של build.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "narrative_past_simple_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g4",
      "subtype": "narrative"
    },
    {
      "template": "Last week I ___ a new book",
      "options": [
        "read",
        "reads",
        "reading"
      ],
      "correct": "read",
      "explanation": "Past Simple של read.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "narrative_past_simple_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g4",
      "subtype": "narrative"
    },
    {
      "template": "She ___ her homework yesterday",
      "options": [
        "finish",
        "finished",
        "finishing"
      ],
      "correct": "finished",
      "explanation": "Past Simple → finished.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "narrative_past_simple_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g4",
      "subtype": "narrative"
    },
    {
      "template": "They ___ football in the park",
      "options": [
        "play",
        "played",
        "playing"
      ],
      "correct": "played",
      "explanation": "Past Simple → played.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "narrative_past_simple_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g4",
      "subtype": "narrative"
    },
    {
      "template": "While she ___ dinner, the phone rang",
      "options": [
        "was cooking",
        "cooked",
        "cooks"
      ],
      "correct": "was cooking",
      "explanation": "Past Continuous → was cooking.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "narrative_past_continuous_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_continuous_g4",
      "subtype": "narrative"
    },
    {
      "template": "We ___ pizza for lunch",
      "options": [
        "eat",
        "ate",
        "eating"
      ],
      "correct": "ate",
      "explanation": "Past Simple של eat → ate.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "narrative_past_simple_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g4",
      "subtype": "narrative"
    },
    {
      "template": "He ___ to school early this morning",
      "options": [
        "come",
        "came",
        "coming"
      ],
      "correct": "came",
      "explanation": "Past Simple של come → came.",
      "minGrade": 4,
      "maxGrade": 4,
      "patternFamily": "narrative_past_simple_g4",
      "difficulty": "standard",
      "cognitiveLevel": "understanding",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g4",
      "subtype": "narrative"
    },
    {
      "template": "I ___ my keys when I was leaving",
      "options": [
        "lost",
        "lose",
        "losing"
      ],
      "correct": "lost",
      "explanation": "Past Simple של lose → lost.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "narrative_past_simple_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g5",
      "subtype": "narrative"
    },
    {
      "template": "The children ___ playing when it started raining",
      "options": [
        "was",
        "were",
        "are"
      ],
      "correct": "were",
      "explanation": "Past Continuous → were playing.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "narrative_past_continuous_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_continuous_g5",
      "subtype": "narrative"
    },
    {
      "template": "She ___ a beautiful picture",
      "options": [
        "draw",
        "drew",
        "drawing"
      ],
      "correct": "drew",
      "explanation": "Past Simple של draw → drew.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "narrative_past_simple_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g5",
      "subtype": "narrative"
    },
    {
      "template": "We ___ at the library all afternoon",
      "options": [
        "study",
        "studied",
        "studying"
      ],
      "correct": "studied",
      "explanation": "Past Simple → studied.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "narrative_past_simple_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g5",
      "subtype": "narrative"
    },
    {
      "template": "While they ___ TV, the power went out",
      "options": [
        "watched",
        "were watching",
        "watch"
      ],
      "correct": "were watching",
      "explanation": "Past Continuous → were watching.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "narrative_past_continuous_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_continuous_g5",
      "subtype": "narrative"
    },
    {
      "template": "I ___ my friend at the park yesterday",
      "options": [
        "meet",
        "met",
        "meeting"
      ],
      "correct": "met",
      "explanation": "Past Simple של meet → met.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "narrative_past_simple_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g5",
      "subtype": "narrative"
    },
    {
      "template": "He ___ home late last night",
      "options": [
        "come",
        "came",
        "coming"
      ],
      "correct": "came",
      "explanation": "Past Simple של come → came.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "narrative_past_simple_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "narrative_past_simple_g5",
      "subtype": "narrative"
    }
  ],
  "advanced": [
    {
      "template": "If we ___ plastic, the beach stays clean",
      "options": [
        "recycle",
        "recycled",
        "are recycling"
      ],
      "correct": "recycle",
      "explanation": "Zero conditional.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "advanced_conditional_zero_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_conditional_zero_g5",
      "subtype": "advanced"
    },
    {
      "template": "She ___ a presentation by tomorrow",
      "options": [
        "will finish",
        "finished",
        "finishes"
      ],
      "correct": "will finish",
      "explanation": "פעולה תושלם בעתיד → will + base.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "advanced_future_will_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_future_will_g5",
      "subtype": "advanced"
    },
    {
      "template": "They have ___ studied renewable energy",
      "options": [
        "already",
        "ever",
        "never"
      ],
      "correct": "already",
      "explanation": "Present Perfect עם already.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "advanced_present_perfect_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_present_perfect_g5",
      "subtype": "advanced"
    },
    {
      "template": "If it rains, we ___ at home",
      "options": [
        "stay",
        "stayed",
        "will stay"
      ],
      "correct": "will stay",
      "explanation": "First conditional → will stay.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "advanced_first_conditional_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_first_conditional_g5",
      "subtype": "advanced"
    },
    {
      "template": "I have ___ finished my project",
      "options": [
        "already",
        "ever",
        "never"
      ],
      "correct": "already",
      "explanation": "Present Perfect → already.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "advanced_present_perfect_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_present_perfect_g5",
      "subtype": "advanced"
    },
    {
      "template": "If you study hard, you ___ the test",
      "options": [
        "pass",
        "passed",
        "will pass"
      ],
      "correct": "will pass",
      "explanation": "First conditional → will pass.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "advanced_first_conditional_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_first_conditional_g5",
      "subtype": "advanced"
    },
    {
      "template": "She has ___ been to London",
      "options": [
        "never",
        "ever",
        "already"
      ],
      "correct": "never",
      "explanation": "Present Perfect → never.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "advanced_present_perfect_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_present_perfect_g5",
      "subtype": "advanced"
    },
    {
      "template": "If you heat water, it ___",
      "options": [
        "boils",
        "boiled",
        "will boil"
      ],
      "correct": "boils",
      "explanation": "Zero conditional → boils.",
      "minGrade": 5,
      "maxGrade": 5,
      "patternFamily": "advanced_conditional_zero_g5",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_conditional_zero_g5",
      "subtype": "advanced"
    },
    {
      "template": "We have ___ learned about space",
      "options": [
        "already",
        "ever",
        "never"
      ],
      "correct": "already",
      "explanation": "Present Perfect → already.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "advanced_present_perfect_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_present_perfect_g6",
      "subtype": "advanced"
    },
    {
      "template": "If I have time, I ___ help you",
      "options": [
        "help",
        "helped",
        "will help"
      ],
      "correct": "will help",
      "explanation": "First conditional → will help.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "advanced_first_conditional_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_first_conditional_g6",
      "subtype": "advanced"
    },
    {
      "template": "Have you ___ visited Paris?",
      "options": [
        "ever",
        "never",
        "already"
      ],
      "correct": "ever",
      "explanation": "שאלה ב-Present Perfect → ever.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "advanced_present_perfect_q_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_present_perfect_q_g6",
      "subtype": "advanced"
    },
    {
      "template": "If we don't hurry, we ___ late",
      "options": [
        "are",
        "were",
        "will be"
      ],
      "correct": "will be",
      "explanation": "First conditional → will be.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "advanced_first_conditional_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_first_conditional_g6",
      "subtype": "advanced"
    },
    {
      "template": "I have ___ seen that movie",
      "options": [
        "already",
        "ever",
        "never"
      ],
      "correct": "already",
      "explanation": "Present Perfect → already.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "advanced_present_perfect_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_present_perfect_g6",
      "subtype": "advanced"
    },
    {
      "template": "If she comes early, we ___ start on time",
      "options": [
        "start",
        "started",
        "will start"
      ],
      "correct": "will start",
      "explanation": "First conditional → will start.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "advanced_first_conditional_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_first_conditional_g6",
      "subtype": "advanced"
    },
    {
      "template": "They have ___ finished their homework",
      "options": [
        "already",
        "ever",
        "never"
      ],
      "correct": "already",
      "explanation": "Present Perfect → already.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "advanced_present_perfect_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_present_perfect_g6",
      "subtype": "advanced"
    },
    {
      "template": "If you don't study, you ___ pass",
      "options": [
        "don't",
        "didn't",
        "won't"
      ],
      "correct": "won't",
      "explanation": "First conditional שלילי → won't.",
      "minGrade": 6,
      "maxGrade": 6,
      "patternFamily": "advanced_first_conditional_neg_g6",
      "difficulty": "advanced",
      "cognitiveLevel": "analysis",
      "expectedErrorTypes": [
        "grammar_error",
        "sentence_order_error",
        "careless_error"
      ],
      "skillId": "advanced_first_conditional_neg_g6",
      "subtype": "advanced"
    }
  ]
};
