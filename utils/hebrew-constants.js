export const BLANK = "__";

export const LEVELS = {
  easy: {
    name: "קל",
  },
  medium: {
    name: "בינוני",
  },
  hard: {
    name: "קשה",
  },
};

// נושאים לשפה עברית
export const TOPICS = {
  reading: { name: "קריאה", description: "פיתוח מיומנויות קריאה" },
  comprehension: { name: "הבנת הנקרא", description: "הבנת טקסטים ושאלות" },
  writing: { name: "כתיבה והבעה", description: "כתיבה יצירתית ומבנית" },
  grammar: { name: "דקדוק ולשון", description: "חלקי דיבר ותחביר" },
  vocabulary: { name: "עושר שפתי", description: "אוצר מילים והרחבת השפה" },
  speaking: { name: "דיבור ושיח", description: "הבעה בעל פה ותקשורת" },
  mixed: { name: "ערבוב", description: "שילוב כל הנושאים" },
};

export const GRADE_LEVELS = {
  1: {
    name: "כיתה א׳",
    levels: {
      easy: {
        reading: { letters: true, nikud: true, simpleWords: true },
        comprehension: { shortTexts: true, basicDetails: true },
        writing: { letters: true, words: true, simpleSentences: true },
        grammar: { nouns: true, verbs: true },
        vocabulary: { basicWords: true, family: true, colors: true },
        speaking: { simpleConversation: true },
      },
      medium: {
        reading: { nikud: true, words: true, shortSentences: true },
        comprehension: { details: true, mainIdea: true },
        writing: { sentences: true, basicStructure: true },
        grammar: { nouns: true, verbs: true, adjectives: true },
        vocabulary: { expandedWords: true, dailyLife: true },
        speaking: { description: true, experience: true },
      },
      hard: {
        reading: { fluentReading: true, longerSentences: true },
        comprehension: { inference: true, comparison: true },
        writing: { paragraphs: true, creativeWriting: true },
        grammar: { tenses: true, connectors: true },
        vocabulary: { advancedWords: true, context: true },
        speaking: { presentation: true, discussion: true },
      },
    },
  },
  2: {
    name: "כיתה ב׳",
    levels: {
      easy: {
        reading: { fluentReading: true, shortTexts: true },
        comprehension: { details: true, mainIdea: true, simpleInference: true },
        writing: { paragraph: true, punctuation: true },
        grammar: { nouns: true, verbs: true, adjectives: true, basicTenses: true },
        vocabulary: { expandedVocabulary: true, synonyms: true },
        speaking: { oralExpression: true, description: true },
      },
      medium: {
        reading: { texts: true, fluency: true },
        comprehension: { comparison: true, conclusions: true },
        writing: { paragraphs: true, structure: true },
        grammar: { tenses: true, connectors: true, wordOrder: true },
        vocabulary: { context: true, wordFamilies: true },
        speaking: { presentation: true, experience: true },
      },
      hard: {
        reading: { longerTexts: true, differentGenres: true },
        comprehension: { deepUnderstanding: true, analysis: true },
        writing: { multipleParagraphs: true, creativeWriting: true },
        grammar: { complexStructures: true, verbConjugation: true },
        vocabulary: { advancedContext: true, roots: true },
        speaking: { debate: true, argumentation: true },
      },
    },
  },
  3: {
    name: "כיתה ג׳",
    levels: {
      easy: {
        reading: { fluentReading: true, longerTexts: true },
        comprehension: { comparison: true, basicConclusions: true, textTypes: true },
        writing: { paragraphs2_3: true, creativeWriting: true, structure: true },
        grammar: { tenses: true, connectors: true, verbForms: true },
        vocabulary: { expandedVocabulary: true, contextMeaning: true },
        speaking: { presentation: true, discussion: true },
      },
      medium: {
        reading: { criticalReading: true, differentGenres: true },
        comprehension: { analysis: true, conclusions: true, inference: true },
        writing: { structuredTexts: true, introduction: true, conclusion: true },
        grammar: { dictation: true, verbRoots: true, wordForms: true },
        vocabulary: { wordRoots: true, wordFamilies: true },
        speaking: { argumentation: true, persuasion: true },
      },
      hard: {
        reading: { literaryAnalysis: true, complexTexts: true },
        comprehension: { deepAnalysis: true, literaryDevices: true },
        writing: { essays: true, literaryWriting: true },
        grammar: { complexGrammar: true, syntax: true },
        vocabulary: { literaryVocabulary: true, figurative: true },
        speaking: { literaryDiscussion: true, critique: true },
      },
    },
  },
  4: {
    name: "כיתה ד׳",
    levels: {
      easy: {
        reading: { criticalReading: true, differentGenres: true, informational: true },
        comprehension: { summarization: true, textAnalysis: true },
        writing: { structuredTexts: true, introduction: true, body: true, conclusion: true },
        grammar: { dictation: true, verbRoots: true, wordForms: true },
        vocabulary: { advancedVocabulary: true, roots: true, families: true },
        speaking: { presentation: true, textAnalysis: true },
      },
      medium: {
        reading: { literaryTexts: true, poetry: true, stories: true },
        comprehension: { literaryAnalysis: true, themes: true, characters: true },
        writing: { essays: true, descriptions: true, explanations: true },
        grammar: { syntax: true, verbConjugation: true, partsOfSpeech: true },
        vocabulary: { literaryVocabulary: true, figurativeLanguage: true },
        speaking: { literaryDiscussion: true, analysis: true },
      },
      hard: {
        reading: { complexLiteraryTexts: true, multipleGenres: true },
        comprehension: { deepLiteraryAnalysis: true, criticalThinking: true },
        writing: { argumentativeEssays: true, opinion: true, reasoning: true },
        grammar: { complexSyntax: true, advancedGrammar: true },
        vocabulary: { advancedLiteraryVocabulary: true, academic: true },
        speaking: { debate: true, criticalAnalysis: true },
      },
    },
  },
  5: {
    name: "כיתה ה׳",
    levels: {
      easy: {
        reading: { multiDepthReading: true, comparison: true, conclusions: true, position: true },
        comprehension: { inference: true, conclusions: true, position: true },
        writing: { fullEssays: true, description: true, explanation: true, argument: true },
        grammar: { syntax: true, verbConjugation: true, partsOfSpeech: true },
        vocabulary: { roots: true, wordFamilies: true, semanticFields: true },
        speaking: { presentation: true, argumentation: true },
      },
      medium: {
        reading: { differentGenres: true, criticalAnalysis: true },
        comprehension: { complexAnalysis: true, multiplePerspectives: true },
        writing: { variousGenres: true, creative: true, structured: true },
        grammar: { complexSyntax: true, verbForms: true, agreement: true },
        vocabulary: { semanticFields: true, academic: true },
        speaking: { variousGenres: true, creative: true },
      },
      hard: {
        reading: { complexTexts: true, academic: true },
        comprehension: { academicAnalysis: true, research: true },
        writing: { academicWriting: true, research: true, citation: true },
        grammar: { academicGrammar: true, formalLanguage: true },
        vocabulary: { academicVocabulary: true, technical: true },
        speaking: { academicPresentation: true, research: true },
      },
    },
  },
  6: {
    name: "כיתה ו׳",
    levels: {
      easy: {
        reading: { complexTexts: true, analysis: true, multipleGenres: true },
        comprehension: { deepAnalysis: true, criticalThinking: true },
        writing: { argumentativeEssays: true, longWorks: true, complexSummaries: true },
        grammar: { possession: true, prepositions: true, verbSubjectAgreement: true },
        vocabulary: { academicVocabulary: true, middleSchool: true },
        speaking: { reasonedOpinion: true, debate: true },
      },
      medium: {
        reading: { middleSchoolLevel: true, academic: true },
        comprehension: { academicAnalysis: true, research: true },
        writing: { academicEssays: true, research: true, longForm: true },
        grammar: { middleSchoolGrammar: true, complexSyntax: true },
        vocabulary: { middleSchoolVocabulary: true, academic: true },
        speaking: { academicPresentation: true, research: true },
      },
      hard: {
        reading: { advancedMiddleSchool: true, preparation: true },
        comprehension: { advancedAnalysis: true, criticalEvaluation: true },
        writing: { advancedAcademic: true, research: true, publication: true },
        grammar: { advancedGrammar: true, complexStructures: true },
        vocabulary: { advancedAcademic: true, specialized: true },
        speaking: { advancedPresentation: true, research: true, conference: true },
      },
    },
  },
};

export const GRADES = {
  g1: {
    name: "כיתה א׳",
    topics: [
      "reading",
      "comprehension",
      "writing",
      "grammar",
      "vocabulary",
      "speaking",
      "mixed",
    ],
  },
  g2: {
    name: "כיתה ב׳",
    topics: [
      "reading",
      "comprehension",
      "writing",
      "grammar",
      "vocabulary",
      "speaking",
      "mixed",
    ],
  },
  g3: {
    name: "כיתה ג׳",
    topics: [
      "reading",
      "comprehension",
      "writing",
      "grammar",
      "vocabulary",
      "speaking",
      "mixed",
    ],
  },
  g4: {
    name: "כיתה ד׳",
    topics: [
      "reading",
      "comprehension",
      "writing",
      "grammar",
      "vocabulary",
      "speaking",
      "mixed",
    ],
  },
  g5: {
    name: "כיתה ה׳",
    topics: [
      "reading",
      "comprehension",
      "writing",
      "grammar",
      "vocabulary",
      "speaking",
      "mixed",
    ],
  },
  g6: {
    name: "כיתה ו׳",
    topics: [
      "reading",
      "comprehension",
      "writing",
      "grammar",
      "vocabulary",
      "speaking",
      "mixed",
    ],
  },
};

export const MODES = {
  learning: {
    name: "למידה",
    description: "ללא סיום משחק, תרגול בקצב שלך",
  },
  challenge: {
    name: "אתגר",
    description: "טיימר + חיים, מרוץ ניקוד גבוה",
  },
  speed: {
    name: "מהירות",
    description: "תשובות מהירות = יותר נקודות! ⚡",
  },
  marathon: {
    name: "מרתון",
    description: "כמה שאלות תוכל לפתור? 🏃",
  },
  practice: {
    name: "תרגול",
    description: "התמקד בנושא אחד 📚",
  },
};

export const STORAGE_KEY = "mleo_hebrew_master";

// פונקציה עזר לקבלת הגדרות רמה לכיתה
export function getLevelConfig(gradeNumber, level) {
  const gradeLevels = GRADE_LEVELS[gradeNumber];
  if (!gradeLevels) return null;
  return gradeLevels.levels[level] || null;
}

// פונקציה עזר לקבלת רמה לכיתה
export function getLevelForGrade(gradeNumber, topic) {
  // להחזיר את הרמה המתאימה לפי הנושא והכיתה
  return "easy"; // ברירת מחדל - נוכל להתאים בהמשך
}

