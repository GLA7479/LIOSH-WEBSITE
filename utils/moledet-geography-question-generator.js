import { GRADES, BLANK, TOPICS } from './moledet-geography-constants';

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

  // שאלות בסיסיות - נוכל להרחיב בהמשך
  const questions = {
    homeland: [
      { question: "מה היא בירת ישראל?", answers: ["ירושלים", "תל אביב", "חיפה", "באר שבע"], correct: 0 },
      { question: "איזה ים גובל בישראל ממערב?", answers: ["ים סוף", "ים המלח", "ים התיכון", "ים כנרת"], correct: 2 },
      { question: "מה הוא הנהר הארוך בישראל?", answers: ["ירדן", "קישון", "לכן", "ערבה"], correct: 0 },
    ],
    community: [
      { question: "מה תפקידה של המשפחה?", answers: ["לשחק", "לתמוך ולטפח", "ללכת לבית ספר", "לעבוד"], correct: 1 },
      { question: "מה הוא מקום ציבורי?", answers: ["בית פרטי", "גן ציבורי", "חדר שינה", "מטבח"], correct: 1 },
      { question: "מה תפקידה של הספרייה הציבורית?", answers: ["לאכול", "לקרוא ספרים", "לישון", "לשחק"], correct: 1 },
    ],
    citizenship: [
      { question: "מה היא דמוקרטיה?", answers: ["שלטון העם", "שלטון אחד", "שלטון צבא", "שלטון מלך"], correct: 0 },
      { question: "מה היא זכות אזרח?", answers: ["חובה", "זכות להצביע", "עבודה", "לימודים"], correct: 1 },
      { question: "מה היא חובת אזרח?", answers: ["לצפות בטלוויזיה", "לשמור על החוק", "לשחק", "לנוח"], correct: 1 },
    ],
    geography: [
      { question: "מה הוא מדבר?", answers: ["אזור יבש", "אזור לח", "אזור קר", "אזור חם מאוד"], correct: 0 },
      { question: "מה היא גבעה?", answers: ["שקע בקרקע", "גובה נמוך", "גובה גבוה", "מישור"], correct: 2 },
      { question: "מה הוא אקלים?", answers: ["מזג האוויר", "הטמפרטורה הממוצעת", "תנאי מזג האוויר לאורך זמן", "גשם"], correct: 2 },
    ],
    values: [
      { question: "מה הוא ערך חשוב בחברה?", answers: ["כוח", "כבוד", "עושר", "יופי"], correct: 1 },
      { question: "מה הוא ערך של שיתוף פעולה?", answers: ["עבודה יחד", "עבודה לבד", "עבודה בשקט", "עבודה מהר"], correct: 0 },
      { question: "מה הוא ערך של כבוד?", answers: ["לזלזל", "להעריך", "לשנוא", "להתעלם"], correct: 1 },
    ],
    maps: [
      { question: "מה פירושו של כיוון צפון במפה?", answers: ["למעלה", "למטה", "ימינה", "שמאלה"], correct: 0 },
      { question: "מה הוא קנה מידה במפה?", answers: ["הסבר של סמלים", "יחס בין המפה למציאות", "צבעים", "כיוונים"], correct: 1 },
      { question: "מה מסמלים סימנים במפה?", answers: ["צבעים", "מקומות ועצמים", "כיוונים", "טמפרטורה"], correct: 1 },
    ],
  };

  const topicQuestions = questions[selectedTopic] || questions.homeland;
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

