import { GRADES, BLANK, TOPICS } from './hebrew-constants';

export function generateQuestion(levelConfig, topic, gradeKey, mixedTopics = null) {
  const gradeCfg = GRADES[gradeKey] || GRADES.g3;

  let allowedTopics = gradeCfg.topics.filter((t) => t !== "mixed");
  if (mixedTopics) {
    allowedTopics = allowedTopics.filter((t) => mixedTopics[t]);
  }
  if (allowedTopics.length === 0) {
    allowedTopics = ["reading", "comprehension", "writing", "grammar", "vocabulary", "speaking"];
  }

  const isMixed = topic === "mixed";
  let selectedTopic = topic;
  
  if (isMixed) {
    selectedTopic = allowedTopics[Math.floor(Math.random() * allowedTopics.length)];
  }

  if (!allowedTopics.includes(selectedTopic)) {
    selectedTopic = "reading";
  }

  // שאלות בסיסיות - נוכל להרחיב בהמשך
  const questions = {
    reading: [
      { question: "מה האות הראשונה במילה 'בית'?", answers: ["ב", "ת", "י", "ה"], correct: 0 },
      { question: "מה המילה הנכונה: ב___ת (בית/בת)?", answers: ["בית", "בת", "בתת", "ביתבית"], correct: 0 },
      { question: "איזה אות חסרה במילה 'כ_תב'?", answers: ["ת", "ב", "כ", "ל"], correct: 0 },
    ],
    comprehension: [
      { question: "מה המשמעות של המילה 'חכם'?", answers: ["צעיר", "חכם", "גדול", "קטן"], correct: 1 },
      { question: "מה ההפך של המילה 'שמח'?", answers: ["עצוב", "חכם", "גדול", "יפה"], correct: 0 },
      { question: "מה המשמעות של 'שמש זורחת'?", answers: ["השמש שוקעת", "השמש זורחת", "השמש נעלמת", "השמש כבויה"], correct: 1 },
    ],
    writing: [
      { question: "איך כותבים נכון: 'אני ה_כתי'?", answers: ["אני השכתי", "אני השכתי", "אני שכתי", "אני כתבתי"], correct: 3 },
      { question: "איזה משפט נכון?", answers: ["הכלב רץ", "הכלב רץו", "הכלב רצה", "הכלבים רץ"], correct: 0 },
      { question: "איזה סימן פיסוק מתאים בסוף משפט שאלה?", answers: [".", "!", "?", ","], correct: 2 },
    ],
    grammar: [
      { question: "מה חלק הדיבר של המילה 'רץ'?", answers: ["שם עצם", "פועל", "תואר", "מילת קישור"], correct: 1 },
      { question: "מה חלק הדיבר של המילה 'יפה'?", answers: ["שם עצם", "פועל", "תואר", "מילת קישור"], correct: 2 },
      { question: "מה חלק הדיבר של המילה 'בית'?", answers: ["שם עצם", "פועל", "תואר", "מילת קישור"], correct: 0 },
    ],
    vocabulary: [
      { question: "מה המשמעות של המילה 'שולחן'?", answers: ["כיסא", "שולחן", "חלון", "דלת"], correct: 1 },
      { question: "מה המשמעות של המילה 'חלון'?", answers: ["כיסא", "שולחן", "חלון", "דלת"], correct: 2 },
      { question: "מה המשמעות של המילה 'דלת'?", answers: ["כיסא", "שולחן", "חלון", "דלת"], correct: 3 },
    ],
    speaking: [
      { question: "איך אומרים 'שלום' באנגלית?", answers: ["Hello", "Goodbye", "Thank you", "Please"], correct: 0 },
      { question: "מה התשובה הנכונה לשאלה 'מה שלומך?'?", answers: ["טוב, תודה", "שלום", "להתראות", "בבקשה"], correct: 0 },
      { question: "איך אומרים 'תודה' באנגלית?", answers: ["Hello", "Goodbye", "Thank you", "Please"], correct: 2 },
    ],
  };

  const topicQuestions = questions[selectedTopic] || questions.reading;
  const randomQ = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];

  return {
    question: randomQ.question,
    questionLabel: `שאלה בנושא: ${TOPICS[selectedTopic]?.name || selectedTopic}`,
    exerciseText: randomQ.question,
    answers: randomQ.answers,
    correctAnswer: randomQ.answers[randomQ.correct],
    topic: selectedTopic,
    operation: selectedTopic, // לשמור תאימות
    a: null,
    b: null,
    params: {
      kind: selectedTopic,
      grade: gradeKey,
    },
  };
}

