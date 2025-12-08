import { GRADES, BLANK, TOPICS, GRADE_LEVELS } from './moledet-geography-constants';
import {
  G1_EASY_QUESTIONS,
  G1_MEDIUM_QUESTIONS,
  G1_HARD_QUESTIONS,
  G2_EASY_QUESTIONS,
  G2_MEDIUM_QUESTIONS,
  G2_HARD_QUESTIONS,
  G3_EASY_QUESTIONS,
  G3_MEDIUM_QUESTIONS,
  G3_HARD_QUESTIONS,
  G4_EASY_QUESTIONS,
  G4_MEDIUM_QUESTIONS,
  G4_HARD_QUESTIONS,
  G5_EASY_QUESTIONS,
  G5_MEDIUM_QUESTIONS,
  G5_HARD_QUESTIONS,
  G6_EASY_QUESTIONS,
  G6_MEDIUM_QUESTIONS,
  G6_HARD_QUESTIONS,
} from '../data/geography-questions';

// ========== מאגר שאלות לפי כיתה ורמה ==========
// השאלות מיובאות מהקבצים הנפרדים לכל כיתה

// ========== פונקציה לקבלת שאלות לפי כיתה ורמה ==========
function getQuestionsForGradeAndLevel(gradeKey, levelKey, topic) {
  const key = `${gradeKey.toUpperCase()}_${levelKey.toUpperCase()}_QUESTIONS`;
  
  // מיפוי של כיתות ורמות למאגרי השאלות
  const questionsMap = {
    'G1_EASY_QUESTIONS': G1_EASY_QUESTIONS,
    'G1_MEDIUM_QUESTIONS': G1_MEDIUM_QUESTIONS,
    'G1_HARD_QUESTIONS': G1_HARD_QUESTIONS,
    'G2_EASY_QUESTIONS': G2_EASY_QUESTIONS,
    'G2_MEDIUM_QUESTIONS': G2_MEDIUM_QUESTIONS,
    'G2_HARD_QUESTIONS': G2_HARD_QUESTIONS,
    'G3_EASY_QUESTIONS': G3_EASY_QUESTIONS,
    'G3_MEDIUM_QUESTIONS': G3_MEDIUM_QUESTIONS,
    'G3_HARD_QUESTIONS': G3_HARD_QUESTIONS,
    'G4_EASY_QUESTIONS': G4_EASY_QUESTIONS,
    'G4_MEDIUM_QUESTIONS': G4_MEDIUM_QUESTIONS,
    'G4_HARD_QUESTIONS': G4_HARD_QUESTIONS,
    'G5_EASY_QUESTIONS': G5_EASY_QUESTIONS,
    'G5_MEDIUM_QUESTIONS': G5_MEDIUM_QUESTIONS,
    'G5_HARD_QUESTIONS': G5_HARD_QUESTIONS,
    'G6_EASY_QUESTIONS': G6_EASY_QUESTIONS,
    'G6_MEDIUM_QUESTIONS': G6_MEDIUM_QUESTIONS,
    'G6_HARD_QUESTIONS': G6_HARD_QUESTIONS,
  };
  
  const questionsPool = questionsMap[key] || G1_EASY_QUESTIONS;
  return questionsPool[topic] || questionsPool.homeland || [];
}

// ========== פונקציה עיקרית ליצירת שאלה ==========
export function generateQuestion(levelConfig, topic, gradeKey, mixedTopics = null) {
  const gradeCfg = GRADES[gradeKey] || GRADES.g3;

  let allowedTopics = gradeCfg.topics.filter((t) => t !== "mixed");
  if (mixedTopics) {
    allowedTopics = allowedTopics.filter((t) => mixedTopics[t]);
  }
  if (allowedTopics.length === 0) {
    allowedTopics = ["homeland", "community", "citizenship", "geography", "values", "maps"];
  }

  const isMixed = topic === "mixed";
  let selectedTopic = topic;
  
  if (isMixed) {
    selectedTopic = allowedTopics[Math.floor(Math.random() * allowedTopics.length)];
  }

  if (!allowedTopics.includes(selectedTopic)) {
    selectedTopic = "homeland";
  }

  // קבלת רמת הקושי מ-levelConfig
  const levelKey = levelConfig?.name === "קל" ? "easy" : 
                   levelConfig?.name === "בינוני" ? "medium" : 
                   levelConfig?.name === "קשה" ? "hard" : "easy";

  // קבלת שאלות מהמאגר המתאים
  const topicQuestions = getQuestionsForGradeAndLevel(gradeKey, levelKey, selectedTopic);
  
  if (!topicQuestions || topicQuestions.length === 0) {
    // נסיגה למאגר בסיסי אם אין שאלות
    const fallbackQuestions = G1_EASY_QUESTIONS[selectedTopic] || G1_EASY_QUESTIONS.homeland;
    const randomQ = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    
    // ערבוב התשובות - Fisher-Yates shuffle
    const shuffledAnswers = [...randomQ.answers];
    for (let i = shuffledAnswers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
    }

    // מציאת המיקום החדש של התשובה הנכונה
    const correctAnswer = randomQ.answers[randomQ.correct];
    const newCorrectIndex = shuffledAnswers.findIndex(ans => ans === correctAnswer);
    
    return {
      question: randomQ.question,
      questionLabel: `שאלה בנושא: ${TOPICS[selectedTopic]?.name || selectedTopic}`,
      exerciseText: randomQ.question,
      answers: shuffledAnswers,
      correctAnswer: correctAnswer,
      correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
      topic: selectedTopic,
      operation: selectedTopic,
      a: null,
      b: null,
      params: {
        kind: selectedTopic,
        grade: gradeKey,
        gradeKey: gradeKey,
        levelKey: levelKey,
      },
    };
  }
  
  const randomQ = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];

  // ערבוב התשובות - Fisher-Yates shuffle
  const shuffledAnswers = [...randomQ.answers];
  for (let i = shuffledAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
  }

  // מציאת המיקום החדש של התשובה הנכונה
  const correctAnswer = randomQ.answers[randomQ.correct];
  const newCorrectIndex = shuffledAnswers.findIndex(ans => ans === correctAnswer);

  return {
    question: randomQ.question,
    questionLabel: `שאלה בנושא: ${TOPICS[selectedTopic]?.name || selectedTopic}`,
    exerciseText: randomQ.question,
    answers: shuffledAnswers,
    correctAnswer: correctAnswer,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
    topic: selectedTopic,
    operation: selectedTopic,
    a: null,
    b: null,
    params: {
      kind: selectedTopic,
      grade: gradeKey,
      gradeKey: gradeKey,
      levelKey: levelKey,
    },
  };
}
