import { GRADES, TOPICS } from './moledet-geography-constants';
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

const questionsMap = {
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
};

/**
 * Questions for exact grade+level+topic only — no silent cross-grade fallback.
 * @param {string} gradeKey
 * @param {string} levelKey
 * @param {string} topic
 * @returns {Array<{ question: string, answers: string[], correct: number }>}
 */
function listTopicQuestionsForGradeLevel(gradeKey, levelKey, topic) {
  const key = `${String(gradeKey).toUpperCase()}_${String(levelKey).toUpperCase()}_QUESTIONS`;
  const questionsPool = questionsMap[key];
  if (!questionsPool || typeof questionsPool !== "object") {
    return [];
  }
  const arr = questionsPool[topic];
  return Array.isArray(arr) ? arr : [];
}

function shuffleAnswersAndBuild(randomQ, selectedTopic, gradeKey, levelKey, uiLevel, poolFallbackCode) {
  const shuffledAnswers = [...randomQ.answers];
  for (let i = shuffledAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
  }
  const correctAnswer = randomQ.answers[randomQ.correct];
  const newCorrectIndex = shuffledAnswers.findIndex((ans) => ans === correctAnswer);
  const contentPoolLevel = levelKey;
  return {
    question: randomQ.question,
    questionLabel: `שאלה בנושא: ${TOPICS[selectedTopic]?.name || selectedTopic}`,
    exerciseText: randomQ.question,
    answers: shuffledAnswers,
    correctAnswer,
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0,
    topic: selectedTopic,
    operation: selectedTopic,
    gradeKey,
    levelKey,
    a: null,
    b: null,
    params: {
      kind: selectedTopic,
      grade: gradeKey,
      gradeKey,
      levelKey,
      uiLevel,
      contentPoolLevel,
      poolFallbackCode,
    },
  };
}

/**
 * EMPTY POOL controlled state — no fabricated question, no grade switch.
 * @param {string} gradeKey
 * @param {string} uiLevel
 */
function buildEmptyPoolResult(gradeKey, uiLevel) {
  return {
    emptyPool: true,
    question: "",
    exerciseText: "",
    answers: [],
    correctAnswer: null,
    correctIndex: -1,
    topic: null,
    operation: null,
    gradeKey,
    levelKey: null,
    a: null,
    b: null,
    params: {
      gradeKey,
      levelKey: null,
      uiLevel,
      contentPoolLevel: null,
      poolFallbackCode: "empty_pool",
    },
  };
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

  const levelKey =
    levelConfig?.name === "קל"
      ? "easy"
      : levelConfig?.name === "בינוני"
        ? "medium"
        : levelConfig?.name === "קשה"
          ? "hard"
          : "easy";
  const uiLevel = levelKey;

  let topicQuestions = listTopicQuestionsForGradeLevel(gradeKey, levelKey, selectedTopic);
  let resolvedTopic = selectedTopic;
  let poolFallbackCode = "none";

  if (!topicQuestions.length && selectedTopic !== "homeland") {
    topicQuestions = listTopicQuestionsForGradeLevel(gradeKey, levelKey, "homeland");
    if (topicQuestions.length) {
      resolvedTopic = "homeland";
      poolFallbackCode = "topic_to_homeland";
    }
  }

  if (!topicQuestions.length) {
    const alreadyChecked = new Set([selectedTopic]);
    if (selectedTopic !== "homeland") {
      alreadyChecked.add("homeland");
    }
    for (const alt of allowedTopics) {
      if (alreadyChecked.has(alt)) continue;
      alreadyChecked.add(alt);
      const altPool = listTopicQuestionsForGradeLevel(gradeKey, levelKey, alt);
      if (altPool.length) {
        topicQuestions = altPool;
        resolvedTopic = alt;
        poolFallbackCode = "topic_fallback_same_grade_level";
        break;
      }
    }
  }

  if (!topicQuestions.length) {
    return buildEmptyPoolResult(gradeKey, uiLevel);
  }

  const randomQ = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
  return shuffleAnswersAndBuild(randomQ, resolvedTopic, gradeKey, levelKey, uiLevel, poolFallbackCode);
}
