import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";

const LEVELS = {
  easy: {
    name: "קל",
    maxWords: 5,
    complexity: "basic",
  },
  medium: {
    name: "בינוני",
    maxWords: 10,
    complexity: "intermediate",
  },
  hard: {
    name: "קשה",
    maxWords: 15,
    complexity: "advanced",
  },
};

const TOPICS = {
  vocabulary: { name: "אוצר מילים", description: "אוצר מילים", icon: "📚" },
  grammar: { name: "דקדוק", description: "דקדוק", icon: "✏️" },
  translation: { name: "תרגום", description: "תרגום", icon: "🌐" },
  sentences: { name: "משפטים", description: "משפטים", icon: "💬" },
  writing: { name: "כתיבה", description: "כתיבה", icon: "✍️" },
  mixed: { name: "ערבוב", description: "ערבוב", icon: "🎲" },
};

const GRADES = {
  g1_2: {
    name: "כיתות א–ב",
    // קל – בלי דקדוק מורכב ובלי כתיבה חופשית
    topics: ["vocabulary", "translation", "mixed"],
    wordLists: ["animals", "colors", "numbers", "family", "body"],
  },
  g3_4: {
    name: "כיתות ג–ד",
    // מוסיפים דקדוק, משפטים וכתיבה
    topics: ["vocabulary", "grammar", "translation", "sentences", "writing", "mixed"],
    wordLists: [
      "animals",
      "colors",
      "numbers",
      "family",
      "body",
      "food",
      "school",
      "weather",
    ],
  },
  g5_6: {
    name: "כיתות ה–ו",
    // כיתות גבוהות – כל הנושאים
    topics: [
      "vocabulary",
      "grammar",
      "translation",
      "sentences",
      "writing",
      "mixed",
    ],
    wordLists: [
      "animals",
      "colors",
      "numbers",
      "family",
      "body",
      "food",
      "school",
      "weather",
      "sports",
      "travel",
      "emotions",
    ],
  },
};

const MODES = {
  learning: { name: "למידה", description: "ללא סיום משחק, תרגול בקצב שלך" },
  challenge: { name: "אתגר", description: "טיימר + חיים, מרוץ ניקוד גבוה" },
  speed: { name: "מרוץ מהירות", description: "תשובות מהירות = יותר נקודות! ⚡" },
  marathon: { name: "מרתון", description: "כמה שאלות תוכל לפתור? 🏃" },
};

const STORAGE_KEY = "mleo_english_master";

// Word lists for vocabulary questions
const WORD_LISTS = {
  animals: {
    dog: "כלב",
    cat: "חתול",
    bird: "ציפור",
    fish: "דג",
    rabbit: "ארנב",
    horse: "סוס",
    cow: "פרה",
    sheep: "כבשה",
  },
  colors: {
    red: "אדום",
    blue: "כחול",
    yellow: "צהוב",
    green: "ירוק",
    orange: "כתום",
    purple: "סגול",
    pink: "ורוד",
    black: "שחור",
    white: "לבן",
  },
  numbers: {
    one: "אחד",
    two: "שניים",
    three: "שלושה",
    four: "ארבעה",
    five: "חמישה",
    six: "שישה",
    seven: "שבעה",
    eight: "שמונה",
    nine: "תשעה",
    ten: "עשרה",
  },
  family: {
    mother: "אמא",
    father: "אבא",
    brother: "אח",
    sister: "אחות",
    grandmother: "סבתא",
    grandfather: "סבא",
    uncle: "דוד",
    aunt: "דודה",
  },
  body: {
    head: "ראש",
    eye: "עין",
    ear: "אוזן",
    nose: "אף",
    mouth: "פה",
    hand: "יד",
    foot: "רגל",
    leg: "רגל",
  },
  food: {
    apple: "תפוח",
    bread: "לחם",
    milk: "חלב",
    egg: "ביצה",
    cheese: "גבינה",
    banana: "בננה",
    water: "מים",
    cake: "עוגה",
  },
  school: {
    book: "ספר",
    pen: "עט",
    pencil: "עיפרון",
    desk: "שולחן",
    chair: "כיסא",
    teacher: "מורה",
    student: "תלמיד",
    classroom: "כיתה",
  },
  weather: {
    sun: "שמש",
    rain: "גשם",
    cloud: "ענן",
    wind: "רוח",
    snow: "שלג",
    hot: "חם",
    cold: "קר",
    warm: "חמים",
  },
  sports: {
    football: "כדורגל",
    basketball: "כדורסל",
    tennis: "טניס",
    swimming: "שחייה",
    running: "ריצה",
    cycling: "רכיבה על אופניים",
  },
  travel: {
    car: "מכונית",
    bus: "אוטובוס",
    train: "רכבת",
    plane: "מטוס",
    hotel: "מלון",
    beach: "חוף",
    mountain: "הר",
  },
  emotions: {
    happy: "שמח",
    sad: "עצוב",
    angry: "כעס",
    excited: "נרגש",
    tired: "עייף",
    scared: "מפחד",
  },
};

function getLevelForGrade(levelKey, gradeKey) {
  const base = LEVELS[levelKey];
  let factor = 1;
  switch (gradeKey) {
    case "g1_2": factor = 0.5; break;
    case "g3_4": factor = 1; break;
    case "g5_6": factor = 1.5; break;
    default: factor = 1;
  }
  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  return {
    name: base.name,
    maxWords: clamp(Math.round(base.maxWords * factor), 3, 20),
    complexity: base.complexity,
  };
}

function buildTop10ByScore(saved, level) {
  const allScores = [];
  Object.keys(TOPICS).forEach((topic) => {
    const key = `${level}_${topic}`;
    const levelData = saved[key] || [];
    if (Array.isArray(levelData)) {
      levelData.forEach((entry) => {
        const bestScore = entry.bestScore ?? entry.score ?? 0;
        const bestStreak = entry.bestStreak ?? entry.streak ?? 0;
        if (bestScore > 0) {
          allScores.push({
            name: entry.playerName || entry.name || "שחקן",
            bestScore,
            bestStreak,
            topic,
            timestamp: entry.timestamp || 0,
          });
        }
      });
    } else {
      Object.entries(levelData).forEach(([name, data]) => {
        const bestScore = data.bestScore ?? data.score ?? 0;
        const bestStreak = data.bestStreak ?? data.streak ?? 0;
        if (bestScore > 0) {
          allScores.push({
            name,
            bestScore,
            bestStreak,
            topic,
            timestamp: data.timestamp || 0,
          });
        }
      });
    }
  });
  const sorted = allScores
    .sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
      return (b.timestamp || 0) - (a.timestamp || 0);
    })
    .slice(0, 10);
  while (sorted.length < 10) {
    sorted.push({
      name: "-",
      bestScore: 0,
      bestStreak: 0,
      topic: "",
      timestamp: 0,
      placeholder: true,
    });
  }
  return sorted;
}

function saveScoreEntry(saved, key, entry) {
  let levelData = saved[key];
  if (!levelData) {
    levelData = [];
  } else if (!Array.isArray(levelData)) {
    levelData = Object.entries(levelData).map(([name, data]) => ({
      playerName: name,
      bestScore: data.bestScore ?? data.score ?? 0,
      bestStreak: data.bestStreak ?? data.streak ?? 0,
      timestamp: data.timestamp || 0,
    }));
  }
  levelData.push(entry);
  if (levelData.length > 100) {
    levelData = levelData.slice(-100);
  }
  saved[key] = levelData;
}

function generateQuestion(level, topic, gradeKey, mixedOps = null) {
  const isMixed = topic === "mixed";
  let selectedTopic;
  
  if (isMixed) {
    let availableTopics;
    if (mixedOps) {
      availableTopics = Object.entries(mixedOps)
        .filter(([t, selected]) => selected && t !== "mixed")
        .map(([t]) => t);
    } else {
      availableTopics = GRADES[gradeKey].topics.filter((t) => t !== "mixed");
    }
    if (availableTopics.length === 0) {
      availableTopics = GRADES[gradeKey].topics.filter((t) => t !== "mixed");
    }
    selectedTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
  } else {
    selectedTopic = topic;
  }

  let question, correctAnswer, params = {};
  let qType = "choice"; // ברירת מחדל – שאלת בחירה
  const availableWordLists = GRADES[gradeKey].wordLists;
  const selectedList = availableWordLists[Math.floor(Math.random() * availableWordLists.length)];
  const words = WORD_LISTS[selectedList];
  const wordEntries = Object.entries(words);
  const randomWord = wordEntries[Math.floor(Math.random() * wordEntries.length)];

  switch (selectedTopic) {
    case "vocabulary": {
      // שאלה: מה פירוש המילה?
      const direction = Math.random() > 0.5; // true = אנגלית->עברית, false = עברית->אנגלית
      if (direction) {
        question = `מה פירוש המילה "${randomWord[0]}"\u200F?`;
        correctAnswer = randomWord[1];
        params = { word: randomWord[0], translation: randomWord[1], direction: "en_to_he" };
      } else {
        question = `מה פירוש המילה "${randomWord[1]}"\u200F?`;
        correctAnswer = randomWord[0];
        params = { word: randomWord[1], translation: randomWord[0], direction: "he_to_en" };
      }
      break;
    }

    case "grammar": {
      // דקדוק – מותאם לפי כיתה
      const basic = [
        {
          question: `מה הצורה הנכונה: "I ___ a student"`,
          options: ["am", "is", "are"],
          correct: "am",
          explanation: "עם I תמיד משתמשים ב-am: I am",
        },
        {
          question: `מה הצורה הנכונה: "She ___ happy"`,
          options: ["am", "is", "are"],
          correct: "is",
          explanation: "She/He/It לוקחים is",
        },
        {
          question: `מה הצורה הנכונה: "They ___ friends"`,
          options: ["am", "is", "are"],
          correct: "are",
          explanation: "You/We/They לוקחים are",
        },
      ];
      const midExtra = [
        {
          question: `בחר את הצורה הנכונה: "He ___ football on Sundays"`,
          options: ["play", "plays", "playing"],
          correct: "plays",
          explanation: "He/She/It מקבלים s: He plays",
        },
        {
          question: `בחר את הצורה הנכונה: "We ___ in class now"`,
          options: ["are", "is", "am"],
          correct: "are",
          explanation: "We = are",
        },
        {
          question: `בחר את הצורה הנכונה: "I have two ___" (כלבים)`,
          options: ["dog", "dogs", "doges"],
          correct: "dogs",
          explanation: "רבים רגילים – מוסיפים s: dogs",
        },
      ];
      const advancedExtra = [
        {
          question: `מה הצורה הנכונה: "Right now, they ___ English"`,
          options: ["study", "studies", "are studying"],
          correct: "are studying",
          explanation: "Right now → Present Continuous: are studying",
        },
        {
          question: `בחר את הצורה הנכונה: "She ___ to school every day"`,
          options: ["go", "goes", "is going"],
          correct: "goes",
          explanation: "Every day → Present Simple, He/She/It + s: goes",
        },
      ];
      let pool = basic;
      if (gradeKey === "g3_4") {
        pool = basic.concat(midExtra);
      } else if (gradeKey === "g5_6") {
        pool = basic.concat(midExtra, advancedExtra);
      }
      const grammarQ = pool[Math.floor(Math.random() * pool.length)];
      question = grammarQ.question;
      correctAnswer = grammarQ.correct;
      params = { explanation: grammarQ.explanation };
      break;
    }

    case "translation": {
      // משפטים פשוטים לתרגום
      const sentences = [
        { en: "I love you", he: "אני אוהב אותך" },
        { en: "How are you?", he: "מה שלומך?" },
        { en: "Thank you", he: "תודה" },
        { en: "Good morning", he: "בוקר טוב" },
        { en: "Good night", he: "לילה טוב" },
        { en: "What is your name?", he: "מה השם שלך?" },
        { en: "My name is", he: "השם שלי הוא" },
        { en: "I am happy", he: "אני שמח" },
        { en: "I am sad", he: "אני עצוב" },
        { en: "I like apples", he: "אני אוהב תפוחים" },
      ];
      const sentence = sentences[Math.floor(Math.random() * sentences.length)];
      const direction = Math.random() > 0.5;
      if (direction) {
        question = `תרגם: "${sentence.en}"`;
        correctAnswer = sentence.he;
        params = { sentence: sentence.en, translation: sentence.he, direction: "en_to_he" };
      } else {
        question = `תרגם: "${sentence.he}"`;
        correctAnswer = sentence.en;
        params = { sentence: sentence.he, translation: sentence.en, direction: "he_to_en" };
      }
      break;
    }

    case "sentences": {
      const baseTemplates = [
        {
          template: "I ___ a book",
          options: ["read", "reads", "reading"],
          correct: "read",
          explanation: "I read - אני קורא",
        },
        {
          template: "We ___ friends",
          options: ["am", "is", "are"],
          correct: "are",
          explanation: "We are - אנחנו",
        },
      ];
      const midTemplates = [
        {
          template: "She ___ to school",
          options: ["go", "goes", "going"],
          correct: "goes",
          explanation: "She goes - היא הולכת",
        },
        {
          template: "They ___ football on Sundays",
          options: ["play", "plays", "playing"],
          correct: "play",
          explanation: "They play - הם משחקים (ללא s)",
        },
      ];
      const advancedTemplates = [
        {
          template: "Right now, I ___ English",
          options: ["study", "studies", "am studying"],
          correct: "am studying",
          explanation: "Right now → am studying (Present Continuous)",
        },
        {
          template: "He ___ a car",
          options: ["have", "has", "having"],
          correct: "has",
          explanation: "He/She/It + has",
        },
      ];
      let pool = baseTemplates;
      if (gradeKey === "g3_4") {
        pool = baseTemplates.concat(midTemplates);
      } else if (gradeKey === "g5_6") {
        pool = baseTemplates.concat(midTemplates, advancedTemplates);
      }
      const template = pool[Math.floor(Math.random() * pool.length)];
      question = `השלם את המשפט: "${template.template}"`;
      correctAnswer = template.correct;
      params = { template: template.template, explanation: template.explanation };
      break;
    }

    case "writing": {
      // כתיבה – תמיד לכתוב באנגלית (spelling)
      // כיתות ג–ד: מילים בודדות; ה–ו: לפעמים גם משפט פשוט
      const useSentence =
        gradeKey === "g5_6" && Math.random() < 0.35; // בערך שליש מהשאלות – משפט

      if (useSentence) {
        const sentences = [
          { en: "Good morning", he: "בוקר טוב" },
          { en: "Good night", he: "לילה טוב" },
          { en: "I love my dog", he: "אני אוהב את הכלב שלי" },
          { en: "I am happy", he: "אני שמח" },
        ];
        const s = sentences[Math.floor(Math.random() * sentences.length)];
        question = `כתוב באנגלית: "${s.he}"`;
        correctAnswer = s.en;
        params = {
          type: "sentence",
          sentenceHe: s.he,
          sentenceEn: s.en,
          direction: "he_to_en",
        };
      } else {
        // מילים בודדות מהמילון שנבחר
        const [en, he] = randomWord; // [wordEN, wordHE]
        question = `כתוב באנגלית: "${he}"`;
        correctAnswer = en;
        params = {
          type: "word",
          wordHe: he,
          wordEn: en,
          direction: "he_to_en",
        };
      }
      qType = "typing"; // מצב כתיבה חופשית
      break;
    }

    case "mixed": {
      const availableTopics = GRADES[gradeKey].topics.filter((t) => t !== "mixed");
      const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      return generateQuestion(level, randomTopic, gradeKey);
    }
  }

  let allAnswers = [];
  if (qType === "choice") {
    // יצירת תשובות שגויות רק לשאלות בחירה
  const wrongAnswers = new Set();
  while (wrongAnswers.size < 3) {
    let wrong;
    if (selectedTopic === "vocabulary") {
      if (params.direction === "he_to_en") {
          const allEnglishWords = Object.values(WORD_LISTS).flatMap((list) =>
            Object.keys(list)
          );
          wrong =
            allEnglishWords[Math.floor(Math.random() * allEnglishWords.length)];
      } else {
          const allHebrewWords = Object.values(WORD_LISTS).flatMap((list) =>
            Object.values(list)
          );
          wrong =
            allHebrewWords[Math.floor(Math.random() * allHebrewWords.length)];
      }
    } else if (selectedTopic === "grammar" || selectedTopic === "sentences") {
        const allOptions = [
          "am",
          "is",
          "are",
          "go",
          "goes",
          "have",
          "has",
          "read",
          "reads",
          "play",
          "plays",
        ];
      wrong = allOptions[Math.floor(Math.random() * allOptions.length)];
    } else {
      if (params.direction === "he_to_en") {
          const allEnglishWords = Object.values(WORD_LISTS).flatMap((list) =>
            Object.keys(list)
          );
          wrong =
            allEnglishWords[Math.floor(Math.random() * allEnglishWords.length)];
      } else {
          const allHebrewWords = Object.values(WORD_LISTS).flatMap((list) =>
            Object.values(list)
          );
          wrong =
            allHebrewWords[Math.floor(Math.random() * allHebrewWords.length)];
      }
    }
    if (wrong !== correctAnswer && !wrongAnswers.has(wrong)) {
      wrongAnswers.add(wrong);
    }
  }
    allAnswers = [correctAnswer, ...Array.from(wrongAnswers)];
  for (let i = allAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
    }
  }

  return {
    question,
    correctAnswer,
    answers: allAnswers,
    topic: selectedTopic,
    params,
    qType,
  };
}

// פונקציה ליצירת רמז
function getHint(question, topic, gradeKey) {
  if (!question || !question.params) return "";
  switch (topic) {
    case "vocabulary":
      if (question.params.direction === "en_to_he") {
        return `נסה לחשוב על המילה "${question.params.word}" - מה הפירוש שלה בעברית?`;
      } else {
        return `נסה לחשוב על המילה "${question.params.word}" - מה הפירוש שלה באנגלית?`;
      }
    case "grammar":
      return question.params.explanation || "זכור: I am, You/We/They are, He/She/It is";
    case "translation":
      if (question.params.direction === "en_to_he") {
        return `תרגם מילה אחר מילה: "${question.params.sentence}"`;
      } else {
        return `תרגם מילה אחר מילה: "${question.params.sentence}"`;
      }
    case "sentences":
      return question.params.explanation || "בדוק מה מתאים: I/You/We/They = are, He/She/It = is";
    case "writing":
      if (question.params?.type === "word" && question.params.wordHe) {
        return `כתוב באנגלית את המילה "${question.params.wordHe}". שים לב לאיות (spelling) של כל אות.`;
      }
      if (question.params?.type === "sentence" && question.params.sentenceHe) {
        return `נסה לפרק את המשפט "${question.params.sentenceHe}" למילים באנגלית. התחל באות גדולה בתחילת המשפט.`;
      }
      return "בדוק אות אחר אות באנגלית, בלי למהר.";
    default:
      return "נסה לחשוב על התשובה צעד אחר צעד";
  }
}

// פונקציית עזר למיספור צעדים
function makeStep(num, text) {
  return (
    <div
      key={num}
      dir="rtl"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.4rem",
      }}
    >
      {/* המספר – תמיד מיושר וכיווני LTR כדי שלא יברח לסוף */}
      <span
        dir="ltr"
        style={{
          minWidth: "1.5em",
          textAlign: "center",
          fontWeight: 700,
        }}
      >
        .{num}
      </span>
      {/* הטקסט – בעברית, RTL */}
      <span style={{ flex: 1 }}>{text}</span>
    </div>
  );
}

// הסבר מפורט צעד-אחר-צעד לפי נושא וכיתה
function getSolutionSteps(question, topic, gradeKey) {
  if (!question || !question.params) return [];
  const { correctAnswer } = question;

  switch (topic) {
    case "vocabulary": {
      if (question.params.direction === "en_to_he") {
        return [
          makeStep(1, `נבין שהמילה "${question.params.word}" היא באנגלית.`),
          makeStep(2, "נחפש את הפירוש של המילה בעברית."),
          makeStep(3, `הפירוש הנכון הוא: ${correctAnswer}.`),
          makeStep(4, "נבדוק שהפירוש הגיוני ונכון."),
        ];
      } else {
        return [
          makeStep(1, `נבין שהמילה "${question.params.word}" היא בעברית.`),
          makeStep(2, "נחפש את הפירוש של המילה באנגלית."),
          makeStep(3, `הפירוש הנכון הוא: ${correctAnswer}.`),
          makeStep(4, "נבדוק שהפירוש הגיוני ונכון."),
        ];
      }
    }

    case "grammar": {
      return [
        makeStep(1, "נבין את כללי הדקדוק באנגלית."),
        makeStep(
          2,
          "I (אני) = am, You/We/They (אתה/אנחנו/הם) = are, He/She/It (הוא/היא/זה) = is."
        ),
        makeStep(3, `התשובה הנכונה היא: ${correctAnswer}.`),
        makeStep(
          4,
          question.params.explanation ||
            "נבדוק שהתשובה מתאימה לנושא המשפט."
        ),
      ];
    }

    case "translation": {
      if (question.params.direction === "en_to_he") {
        return [
          makeStep(
            1,
            `נקרא את המשפט באנגלית: "${question.params.sentence}".`
          ),
          makeStep(2, "ננסה לתרגם כל מילה או חלק מהמשפט."),
          makeStep(3, "נחבר את המילים למשפט בעברית."),
          makeStep(4, `התרגום הנכון: ${correctAnswer}.`),
        ];
      } else {
        return [
          makeStep(
            1,
            `נקרא את המשפט בעברית: "${question.params.sentence}".`
          ),
          makeStep(2, "ננסה לתרגם כל מילה או חלק מהמשפט לאנגלית."),
          makeStep(3, "נחבר את המילים למשפט באנגלית."),
          makeStep(4, `התרגום הנכון: ${correctAnswer}.`),
        ];
      }
    }

    case "sentences": {
      return [
        makeStep(1, `נקרא את המשפט: "${question.params.template}".`),
        makeStep(
          2,
          "נבין מה חסר במשפט - איזו מילה או צורה דקדוקית."
        ),
        makeStep(
          3,
          "נבדוק מה מתאים לפי כללי הדקדוק: I/You/We/They = are, He/She/It = is."
        ),
        makeStep(
          4,
          `התשובה הנכונה: ${correctAnswer}. ${
            question.params.explanation || ""
          }`
        ),
      ];
    }

    case "writing": {
      if (question.params.type === "word") {
        return [
          makeStep(
            1,
            `נקרא את המילה בעברית: "${question.params.wordHe}".`
          ),
          makeStep(2, "נזכר בצורה שלה באנגלית שלמדנו קודם."),
          makeStep(
            3,
            "נכתוב אות-אחר-אות, ושמים לב לאיות (spelling)."
          ),
          makeStep(4, `התשובה הנכונה היא: ${correctAnswer}.`),
        ];
      }
      if (question.params.type === "sentence") {
        return [
          makeStep(
            1,
            `נקרא את המשפט בעברית: "${question.params.sentenceHe}".`
          ),
          makeStep(
            2,
            "נפרק את המשפט לחלקים ונחשוב איך אומרים כל חלק באנגלית."
          ),
          makeStep(
            3,
            "נבדוק סדר מילים נכון ואות גדולה בתחילת המשפט."
          ),
          makeStep(4, `המשפט הנכון באנגלית: ${correctAnswer}.`),
        ];
      }
      return [];
  }

    default:
  return [];
  }
}

// "למה טעיתי?" – הסבר קצר לטעות נפוצה
function getErrorExplanation(question, topic, wrongAnswer, gradeKey) {
  if (!question) return "";
  const userAns = String(wrongAnswer).toLowerCase();
  const correctAns = String(question.correctAnswer).toLowerCase();

  switch (topic) {
    case "vocabulary":
      return "בדוק שוב: האם הפירוש שאתה בחרת מתאים למילה? נסה לחשוב על המילה בעברית/אנגלית ולמצוא את הפירוש הנכון.";

    case "grammar":
      if (userAns === "is" && correctAns === "am") {
        return "זכור: I (אני) תמיד עם am, לא is. I am = אני.";
      }
      if (userAns === "am" && (correctAns === "is" || correctAns === "are")) {
        return "זכור: am משמש רק עם I (אני). He/She/It = is, You/We/They = are.";
      }
      return "בדוק שוב את כללי הדקדוק: I am, You/We/They are, He/She/It is.";

    case "translation":
      return "בדוק שוב: האם תרגמת את כל המילים נכון? נסה לחשוב על המשמעות של המשפט ולא רק על מילים בודדות.";

    case "sentences":
      return "בדוק שוב: האם המילה שבחרת מתאימה לנושא המשפט? זכור: I/You/We/They = are, He/She/It = is.";

    case "writing":
      return "כנראה שטעית באיות (spelling). בדוק שוב אות-אחר-אות, שים לב ל־th / sh / ch ולסיום המילה (s / ed / ing).";

    default:
      return "";
  }
}

export default function EnglishMaster() {
  useIOSViewportFix();
  const router = useRouter();
  const wrapRef = useRef(null);
  const headerRef = useRef(null);
  const gameRef = useRef(null);
  const controlsRef = useRef(null);
  const topicSelectRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [grade, setGrade] = useState("g3_4");
  const [mode, setMode] = useState("learning");
  const [level, setLevel] = useState("easy");
  const [topic, setTopic] = useState("vocabulary");
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [recentQuestions, setRecentQuestions] = useState(new Set());
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showBadge, setShowBadge] = useState(null);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [progress, setProgress] = useState({
    vocabulary: { total: 0, correct: 0 },
    grammar: { total: 0, correct: 0 },
    translation: { total: 0, correct: 0 },
    sentences: { total: 0, correct: 0 },
    writing: { total: 0, correct: 0 },
  });
  const [dailyChallenge, setDailyChallenge] = useState({
    date: new Date().toDateString(),
    bestScore: 0,
    questions: 0,
  });
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  // הסבר מפורט לשאלה
  const [showSolution, setShowSolution] = useState(false);

  // הסבר לטעות אחרונה
  const [errorExplanation, setErrorExplanation] = useState("");

  const [showMixedSelector, setShowMixedSelector] = useState(false);
  const [mixedTopics, setMixedTopics] = useState({
    vocabulary: true,
    grammar: false,
    translation: true,
    sentences: false,
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardLevel, setLeaderboardLevel] = useState("easy");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showHowTo, setShowHowTo] = useState(false);
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("mleo_player_name") || "";
      } catch {
        return "";
      }
    }
    return "";
  });

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const key = `${level}_${topic}`;
        if (saved[key] && playerName.trim()) {
          if (Array.isArray(saved[key])) {
            const playerScores = saved[key].filter(
              (s) => s.playerName === playerName.trim()
            );
            if (playerScores.length > 0) {
              const maxScore = Math.max(
                ...playerScores.map((s) => s.bestScore || 0),
                0
              );
              const maxStreak = Math.max(
                ...playerScores.map((s) => s.bestStreak || 0),
                0
              );
              setBestScore(maxScore);
              setBestStreak(maxStreak);
            } else {
              setBestScore(0);
              setBestStreak(0);
            }
          } else {
            if (saved[key][playerName.trim()]) {
              setBestScore(saved[key][playerName.trim()].bestScore || 0);
              setBestStreak(saved[key][playerName.trim()].bestStreak || 0);
            } else {
              setBestScore(0);
              setBestStreak(0);
            }
          }
        } else {
          setBestScore(0);
          setBestStreak(0);
        }
      } catch {}
    }
  }, [level, topic, playerName]);

  useEffect(() => {
    if (showMixedSelector) return;
    const allowed = GRADES[grade].topics;
    if (!allowed.includes(topic)) {
      const firstAllowed = allowed.find((t) => t !== "mixed") || allowed[0];
      setTopic(firstAllowed);
    }
  }, [grade]);

  useEffect(() => {
    const availableTopics = GRADES[grade].topics.filter((t) => t !== "mixed");
    const newMixedTopics = {
      vocabulary: availableTopics.includes("vocabulary"),
      grammar: availableTopics.includes("grammar"),
      translation: availableTopics.includes("translation"),
      sentences: availableTopics.includes("sentences"),
    };
    setMixedTopics(newMixedTopics);
  }, [grade]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyChallenge.date !== today) {
      setDailyChallenge({ date: today, bestScore: 0, questions: 0 });
    }
  }, [dailyChallenge.date]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
      if (saved.stars) setStars(saved.stars);
      if (saved.badges) setBadges(saved.badges);
      if (saved.playerLevel) setPlayerLevel(saved.playerLevel);
      if (saved.xp) setXp(saved.xp);
      if (saved.progress) setProgress(saved.progress);
    } catch {}
  }, []);

  useEffect(() => {
    if (showLeaderboard && typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const topScores = buildTop10ByScore(saved, leaderboardLevel);
        setLeaderboardData(topScores);
      } catch (e) {
        console.error("Error loading leaderboard:", e);
        setLeaderboardData([]);
      }
    }
  }, [showLeaderboard, leaderboardLevel]);

  useEffect(() => {
    if (!wrapRef.current || !mounted) return;
    const calc = () => {
      const rootH = window.visualViewport?.height ?? window.innerHeight;
      const headH = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty("--head-h", headH + "px");
      const controlsH = controlsRef.current?.offsetHeight || 40;
      // Use more conservative calculation to ensure content doesn't get cut
      const used = headH + controlsH + 120 + 40;
      const freeH = Math.max(300, rootH - used);
      document.documentElement.style.setProperty("--game-h", freeH + "px");
    };
    const timer = setTimeout(calc, 100);
    window.addEventListener("resize", calc);
    window.visualViewport?.addEventListener("resize", calc);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calc);
      window.visualViewport?.removeEventListener("resize", calc);
    };
  }, [mounted]);

  useEffect(() => {
    if (!gameActive || (mode !== "challenge" && mode !== "speed")) return;
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((prev) => (prev != null ? prev - 1 : prev));
    }, 1000);
    return () => clearTimeout(timer);
  }, [gameActive, mode, timeLeft]);

  function saveRunToStorage() {
    if (typeof window === "undefined" || !playerName.trim()) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const key = `${level}_${topic}`;
      saveScoreEntry(saved, key, {
        playerName: playerName.trim(),
        bestScore: score,
        bestStreak: streak,
        timestamp: Date.now(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      const playerScores = (saved[key] || []).filter(
        (s) => s.playerName === playerName.trim()
      );
      const maxScore = Math.max(
        ...playerScores.map((s) => s.bestScore || 0),
        0
      );
      const maxStreak = Math.max(
        ...playerScores.map((s) => s.bestStreak || 0),
        0
      );
      setBestScore(maxScore);
      setBestStreak(maxStreak);
      if (showLeaderboard) {
        const topScores = buildTop10ByScore(saved, leaderboardLevel);
        setLeaderboardData(topScores);
      }
    } catch {}
  }

  function hardResetGame() {
    setGameActive(false);
    setCurrentQuestion(null);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTimeLeft(20);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setFeedback(null);
    setLives(3);
    setTotalQuestions(0);
    setAvgTime(0);
    setQuestionStartTime(null);
  }

  function generateNewQuestion() {
    const levelConfig = getLevelForGrade(level, grade);
    let question;
    let attempts = 0;
    const maxAttempts = 50;
    do {
      question = generateQuestion(
        levelConfig,
        topic,
        grade,
        topic === "mixed" ? mixedTopics : null
      );
      attempts++;
      const questionKey = question.question;
      if (!recentQuestions.has(questionKey)) {
        setRecentQuestions((prev) => {
          const newSet = new Set(prev);
          newSet.add(questionKey);
          if (newSet.size > 20) {
            const first = Array.from(newSet)[0];
            newSet.delete(first);
          }
          return newSet;
        });
        break;
      }
    } while (attempts < maxAttempts);
    if (attempts >= maxAttempts) {
      setRecentQuestions(new Set());
    }
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setFeedback(null);
    setQuestionStartTime(Date.now());
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
  }

  function startGame() {
    setRecentQuestions(new Set());
    setGameActive(true);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTotalQuestions(0);
    setAvgTime(0);
    setQuestionStartTime(null);
    setFeedback(null);
    setSelectedAnswer(null);
    setTypedAnswer("");
    setLives(mode === "challenge" ? 3 : 0);
    setShowHint(false);
    setHintUsed(false);
    setShowBadge(null);
    setShowLevelUp(false);
    setShowSolution(false);
    setErrorExplanation("");
    if (mode === "challenge") {
      setTimeLeft(20);
    } else if (mode === "speed") {
      setTimeLeft(10);
    } else {
      setTimeLeft(null);
    }
    generateNewQuestion();
  }

  function stopGame() {
    setGameActive(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedAnswer(null);
    saveRunToStorage();
  }

  function handleTimeUp() {
    setWrong((prev) => prev + 1);
    setStreak(0);
    setFeedback("הזמן נגמר! המשחק נגמר! ⏰");
    setGameActive(false);
    setCurrentQuestion(null);
    setTimeLeft(0);
    saveRunToStorage();
    setTimeout(() => {
      hardResetGame();
    }, 2000);
  }

  function handleAnswer(answer) {
    if (selectedAnswer || !gameActive || !currentQuestion) return;
    setTotalQuestions((prevCount) => {
      const newCount = prevCount + 1;
      if (questionStartTime) {
        const elapsed = (Date.now() - questionStartTime) / 1000;
        setAvgTime((prevAvg) =>
          prevCount === 0 ? elapsed : (prevAvg * prevCount + elapsed) / newCount
        );
      }
      return newCount;
    });
    setSelectedAnswer(answer);
    const normalize = (v) => String(v).trim().toLowerCase();
    const isCorrect =
      normalize(answer) === normalize(currentQuestion.correctAnswer);
    if (isCorrect) {
      let points = 10 + streak;
      if (mode === "speed") {
        const timeBonus = timeLeft ? Math.floor(timeLeft * 2) : 0;
        points += timeBonus;
      }
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      setCorrect((prev) => prev + 1);
      
      setErrorExplanation("");

      const top = currentQuestion.topic;
      setProgress((prev) => ({
        ...prev,
        [top]: {
          total: (prev[top]?.total || 0) + 1,
          correct: (prev[top]?.correct || 0) + 1,
        },
      }));
      const newCorrect = correct + 1;
      if (newCorrect % 5 === 0) {
        setStars((prev) => {
          const newStars = prev + 1;
          if (typeof window !== "undefined") {
            try {
              const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
              saved.stars = newStars;
              localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
            } catch {}
          }
          return newStars;
        });
      }
      const newStreak = streak + 1;
      if (newStreak === 10 && !badges.includes("🔥 Hot Streak")) {
        const newBadge = "🔥 Hot Streak";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.badges = [...badges, newBadge];
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
      } else if (newStreak === 25 && !badges.includes("⚡ Lightning Fast")) {
        const newBadge = "⚡ Lightning Fast";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.badges = [...badges, newBadge];
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
      } else if (newStreak === 50 && !badges.includes("🌟 Master")) {
        const newBadge = "🌟 Master";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.badges = [...badges, newBadge];
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
      }
      const xpGain = hintUsed ? 5 : 10;
      setXp((prev) => {
        const newXp = prev + xpGain;
        const xpNeeded = playerLevel * 100;
        if (newXp >= xpNeeded) {
          setPlayerLevel((prevLevel) => {
            const newLevel = prevLevel + 1;
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 3000);
            if (typeof window !== "undefined") {
              try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
                saved.playerLevel = newLevel;
                saved.xp = newXp - xpNeeded;
                localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
              } catch {}
            }
            return newLevel;
          });
          return newXp - xpNeeded;
        }
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.xp = newXp;
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
        return newXp;
      });
      setDailyChallenge((prev) => ({
        ...prev,
        bestScore: Math.max(prev.bestScore, score + points),
        questions: prev.questions + 1,
      }));
      setFeedback("Correct! 🎉");
      if ("vibrate" in navigator) navigator.vibrate?.(50);
      setTimeout(() => {
        generateNewQuestion();
        if (mode === "challenge") {
          setTimeLeft(20);
        } else if (mode === "speed") {
          setTimeLeft(10);
        } else {
          setTimeLeft(null);
        }
      }, 1000);
    } else {
      setWrong((prev) => prev + 1);
      setStreak(0);
      
      setErrorExplanation(
        getErrorExplanation(
          currentQuestion,
          currentQuestion.topic,
          answer,
          grade
        )
      );
      
      const top = currentQuestion.topic;
      setProgress((prev) => ({
        ...prev,
        [top]: {
          total: (prev[top]?.total || 0) + 1,
          correct: prev[top]?.correct || 0,
        },
      }));
      if ("vibrate" in navigator) navigator.vibrate?.(200);
      if (mode === "learning") {
        setFeedback(
          `Wrong! Correct answer: ${currentQuestion.correctAnswer} ❌`
        );
        setTimeout(() => {
          generateNewQuestion();
          setSelectedAnswer(null);
          setFeedback(null);
          setTimeLeft(null);
        }, 1500);
      } else {
        setFeedback(
          `Wrong! Correct: ${currentQuestion.correctAnswer} ❌ (-1 ❤️)`
        );
        setLives((prevLives) => {
          const nextLives = prevLives - 1;
          if (nextLives <= 0) {
            setFeedback("Game Over! 💔");
            saveRunToStorage();
            setGameActive(false);
            setCurrentQuestion(null);
            setTimeLeft(0);
            setTimeout(() => {
              hardResetGame();
            }, 2000);
          } else {
            setTimeout(() => {
              generateNewQuestion();
              setSelectedAnswer(null);
              setFeedback(null);
              setTimeLeft(20);
            }, 1500);
          }
          return nextLives;
        });
      }
    }
  }

  function resetStats() {
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setBestScore(0);
    setBestStreak(0);
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const key = `${level}_${topic}`;
        delete saved[key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch {}
    }
  }

  const backSafe = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/learning");
    }
  };

  const getTopicName = (t) => {
    return TOPICS[t]?.icon + " " + TOPICS[t]?.name || t;
  };

  if (!mounted)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

  return (
    <Layout>
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden bg-gradient-to-b from-[#0a0f1d] to-[#141928] game-page-mobile"
        style={{ height: "100vh", height: "100dvh" }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
        </div>

        <div
          ref={headerRef}
          className="absolute top-0 left-0 right-0 z-50 pointer-events-none"
        >
          <div
            className="relative px-2 py-3"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
          >
            <div className="absolute left-2 top-2 flex gap-2 pointer-events-auto">
              <button
                onClick={backSafe}
                className="min-w-[60px] px-3 py-1 rounded-lg text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10"
              >
                BACK
              </button>
            </div>
            <div className="absolute right-2 top-2 pointer-events-auto">
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                Local
              </span>
            </div>
          </div>
        </div>

        <div
          className="relative flex flex-col items-center justify-start px-4 overflow-hidden"
          style={{
            height: "100%",
            maxHeight: "100%",
            paddingTop: "calc(var(--head-h, 56px) + 8px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
            overflow: "hidden"
          }}
        >
          <div className="text-center mb-1">
            <h1 className="text-2xl font-extrabold text-white mb-0.5">
              🇬🇧 English Master
            </h1>
            <p className="text-white/70 text-xs">
              {playerName || "שחקן"} • {GRADES[grade].name} •{" "}
              {LEVELS[level].name} • {getTopicName(topic)} • {MODES[mode].name}
            </p>
          </div>

          <div
            ref={controlsRef}
            className={`grid gap-1 mb-1 w-full max-w-md ${
              stars > 0 || playerLevel > 1 ? "grid-cols-6" : "grid-cols-5"
            }`}
          >
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">ניקוד</div>
              <div className="text-sm font-bold text-emerald-400">{score}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">רצף</div>
              <div className="text-sm font-bold text-amber-400">🔥{streak}</div>
            </div>
            {stars > 0 && (
              <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
                <div className="text-[10px] text-white/60">כוכבים</div>
                <div className="text-sm font-bold text-yellow-400">⭐{stars}</div>
              </div>
            )}
            {playerLevel > 1 && (
              <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
                <div className="text-[10px] text-white/60">רמה</div>
                <div className="text-sm font-bold text-purple-400">Lv.{playerLevel}</div>
              </div>
            )}
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">✅</div>
              <div className="text-sm font-bold text-green-400">{correct}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">חיים</div>
              <div className="text-sm font-bold text-rose-400">
                {mode === "challenge" ? `${lives} ❤️` : "∞"}
              </div>
            </div>
            <div
              className={`rounded-lg p-1 text-center ${
                gameActive && (mode === "challenge" || mode === "speed") && timeLeft <= 5
                  ? "bg-red-500/30 border-2 border-red-400 animate-pulse"
                  : "bg-black/30 border border-white/10"
              }`}
            >
              <div className="text-[10px] text-white/60">⏰ טיימר</div>
              <div
                className={`text-lg font-black ${
                  gameActive && (mode === "challenge" || mode === "speed") && timeLeft <= 5
                    ? "text-red-400"
                    : gameActive && (mode === "challenge" || mode === "speed")
                    ? "text-yellow-400"
                    : "text-white/60"
                }`}
              >
                {gameActive
                  ? mode === "challenge" || mode === "speed"
                    ? timeLeft ?? "--"
                    : "∞"
                  : "--"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
            {Object.keys(MODES).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setGameActive(false);
                  setFeedback(null);
                }}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === m
                    ? "bg-emerald-500/80 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {MODES[m].name}
              </button>
            ))}
          </div>

          {showBadge && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-bounce">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-2xl font-bold">תג חדש!</div>
                <div className="text-xl">{showBadge}</div>
              </div>
            </div>
          )}

          {showLevelUp && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-pulse">
                <div className="text-4xl mb-2">🌟</div>
                <div className="text-2xl font-bold">עלית רמה!</div>
                <div className="text-xl">אתה עכשיו ברמה {playerLevel}!</div>
              </div>
            </div>
          )}

          {!gameActive ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setPlayerName(newName);
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem("mleo_player_name", newName);
                      } catch {}
                    }
                  }}
                  placeholder="שם שחקן"
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-sm font-bold placeholder:text-white/40 flex-1 min-w-[120px]"
                  maxLength={15}
                />
                <select
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {Object.keys(GRADES).map((g) => (
                    <option key={g} value={g}>
                      {GRADES[g].name}
                    </option>
                  ))}
                </select>
                <select
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {Object.keys(LEVELS).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {LEVELS[lvl].name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <select
                    ref={topicSelectRef}
                    value={topic}
                    onChange={(e) => {
                      const newTopic = e.target.value;
                      setGameActive(false);
                      if (newTopic === "mixed") {
                        setTopic(newTopic);
                        setShowMixedSelector(true);
                      } else {
                        setTopic(newTopic);
                        setShowMixedSelector(false);
                      }
                    }}
                    className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold flex-1"
                  >
                    {GRADES[grade].topics.map((t) => (
                      <option key={t} value={t}>
                        {getTopicName(t)}
                      </option>
                    ))}
                  </select>
                  {topic === "mixed" && (
                    <button
                      onClick={() => {
                        setShowMixedSelector(true);
                      }}
                      className="h-9 w-9 rounded-lg bg-blue-500/80 hover:bg-blue-500 border border-white/20 text-white text-xs font-bold flex items-center justify-center"
                      title="ערוך נושאים למיקס"
                    >
                      ⚙️
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2 w-full max-w-md">
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">שיא ניקוד</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {bestScore}
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">שיא רצף</div>
                  <div className="text-lg font-bold text-amber-400">
                    {bestStreak}
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">Accuracy</div>
                  <div className="text-lg font-bold text-blue-400">
                    {accuracy}%
                  </div>
                </div>
              </div>

              {(stars > 0 || playerLevel > 1 || badges.length > 0) && (
                <div className="grid grid-cols-3 gap-2 mb-2 w-full max-w-md">
                  {stars > 0 && (
                    <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/60">Stars</div>
                      <div className="text-lg font-bold text-yellow-400">
                        ⭐ {stars}
                      </div>
                    </div>
                  )}
                  {playerLevel > 1 && (
                    <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/60">Level</div>
                      <div className="text-lg font-bold text-purple-400">
                        Lv.{playerLevel} ({xp}/{playerLevel * 100} XP)
                      </div>
                    </div>
                  )}
                  {badges.length > 0 && (
                    <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/60">Badges</div>
                      <div className="text-sm font-bold text-orange-400">
                        {badges.length} 🏅
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-black/20 border border-white/10 rounded-lg p-2 mb-2 w-full max-w-md text-center">
                <div className="text-xs text-white/60 mb-1">אתגר יומי</div>
                <div className="text-sm text-white">
                  Best: {dailyChallenge.bestScore} • Questions: {dailyChallenge.questions}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-10 px-6 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  ▶️ התחל
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="h-10 px-4 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-sm"
                >
                  🏆 לוח תוצאות
                </button>
                {bestScore > 0 && (
                  <button
                    onClick={resetStats}
                    className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
                  >
                    🧹 איפוס
                  </button>
                )}
              </div>

              {/* כפתור "איך לומדים אנגלית כאן?" */}
              <div className="mb-2 w-full max-w-md flex justify-center">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים אנגלית כאן?
                </button>
              </div>

              {!playerName.trim() && (
                <p className="text-xs text-white/60 text-center mb-2">
                  הכנס את שמך כדי להתחיל
                </p>
              )}
            </>
          ) : (
            <>
              {feedback && (
                <div
                  className={`mb-2 px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                    feedback.includes("Correct") ||
                    feedback.includes("∞") ||
                    feedback.includes("Start")
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  <div>{feedback}</div>
                  {errorExplanation && (
                    <div className="mt-1 text-xs text-red-100/90 font-normal" dir="ltr">
                      {errorExplanation}
                    </div>
                  )}
                </div>
              )}

              {currentQuestion && (
                <div
                  ref={gameRef}
                  className="w-full max-w-md flex flex-col items-center justify-center mb-2 flex-1"
                  style={{ height: "var(--game-h, 400px)", minHeight: "300px" }}
                >
                  <div className="text-4xl font-black text-white mb-4 text-center" dir="auto">
                    {currentQuestion.question}
                  </div>

                  {!hintUsed && !selectedAnswer && (
                    <button
                      onClick={() => {
                        setShowHint(true);
                        setHintUsed(true);
                      }}
                      className="mb-2 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-sm font-bold"
                    >
                      💡 Hint
                    </button>
                  )}

                  {showHint && (
                    <div className="mb-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-200 text-sm text-center max-w-md" dir="ltr">
                      {getHint(currentQuestion, currentQuestion.topic, grade)}
                    </div>
                  )}

                  {/* כפתור הסבר מלא – רק במצב Learning */}
                  {mode === "learning" && currentQuestion && (
                    <>
                      <button
                        onClick={() => setShowSolution(true)}
                        className="mb-2 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                      >
                        📘 הסבר מלא
                      </button>
                    </>
                  )}

                  {currentQuestion.qType === "typing" ? (
                    <div className="w-full max-w-md mb-3 flex flex-col items-center">
                      <input
                        dir="ltr"
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        disabled={!!selectedAnswer || !gameActive}
                        placeholder="כתוב את התשובה שלך כאן..."
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/30 text-white text-lg text-center"
                      />
                      <button
                        onClick={() => {
                          if (!typedAnswer.trim()) return;
                          handleAnswer(typedAnswer);
                        }}
                        disabled={!!selectedAnswer || !gameActive || !typedAnswer.trim()}
                        className="mt-2 px-6 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/60 font-bold text-sm"
                      >
                        ✅ בדוק תשובה
                      </button>
                    </div>
                  ) : (
                  <div className="grid grid-cols-2 gap-3 w-full mb-3">
                    {currentQuestion.answers.map((answer, idx) => {
                      const isSelected = selectedAnswer === answer;
                        const isCorrect =
                          String(answer).trim().toLowerCase() ===
                          String(currentQuestion.correctAnswer).trim().toLowerCase();
                      const isWrong = isSelected && !isCorrect;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(answer)}
                          disabled={!!selectedAnswer}
                          className={`rounded-xl border-2 px-6 py-6 text-2xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
                            isCorrect && isSelected
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : isWrong
                              ? "bg-red-500/30 border-red-400 text-red-200"
                              : selectedAnswer &&
                                  String(answer).trim().toLowerCase() ===
                                    String(currentQuestion.correctAnswer)
                                      .trim()
                                      .toLowerCase()
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : "bg-black/30 border-white/15 text-white hover:border-white/40"
                          }`}
                        >
                          {answer}
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              )}

              <button
                onClick={stopGame}
                className="h-9 px-4 rounded-lg bg-red-500/80 hover:bg-red-500 font-bold text-sm"
              >
                ⏹️ עצור
              </button>
            </>
          )}

          {showLeaderboard && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowLeaderboard(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-4 max-w-md w-full max-h-[85svh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-1">
                    🏆 לוח תוצאות
                  </h2>
                  <p className="text-white/70 text-xs">שיאים מקומיים</p>
                </div>

                <div className="flex gap-2 mb-4 justify-center">
                  {Object.keys(LEVELS).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setLeaderboardLevel(lvl);
                        if (typeof window !== "undefined") {
                          try {
                            const saved = JSON.parse(
                              localStorage.getItem(STORAGE_KEY) || "{}"
                            );
                            const topScores = buildTop10ByScore(saved, lvl);
                            setLeaderboardData(topScores);
                          } catch (e) {
                            console.error("Error loading leaderboard:", e);
                          }
                        }
                      }}
                      className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                        leaderboardLevel === lvl
                          ? "bg-amber-500/80 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {LEVELS[lvl].name}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-center">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-white/80 p-2 font-bold text-xs">
                          דירוג
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          שחקן
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          ניקוד
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          רצף
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-white/60 p-4 text-sm"
                          >
                            עדיין אין תוצאות עבור רמה {LEVELS[leaderboardLevel].name}
                          </td>
                        </tr>
                      ) : (
                        leaderboardData.map((score, idx) => (
                          <tr
                            key={`${score.name}-${score.timestamp}-${idx}`}
                            className={`border-b border-white/10 ${
                              score.placeholder
                                ? "opacity-40"
                                : idx === 0
                                ? "bg-amber-500/20"
                                : idx === 1
                                ? "bg-gray-500/20"
                                : idx === 2
                                ? "bg-amber-900/20"
                                : ""
                            }`}
                          >
                            <td className="text-white/80 p-2 text-sm font-bold">
                              {score.placeholder
                                ? `#${idx + 1}`
                                : idx === 0
                                ? "🥇"
                                : idx === 1
                                ? "🥈"
                                : idx === 2
                                ? "🥉"
                                : `#${idx + 1}`}
                            </td>
                            <td className="text-white p-2 text-sm font-semibold">
                              {score.name}
                            </td>
                            <td className="text-emerald-400 p-2 text-sm font-bold">
                              {score.bestScore}
                            </td>
                            <td className="text-amber-400 p-2 text-sm font-bold">
                              🔥{score.bestStreak}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="px-6 py-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-sm"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}

          {showMixedSelector && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
              onClick={() => {
                setShowMixedSelector(false);
                const hasSelected = Object.values(mixedTopics).some(
                  (selected) => selected
                );
                if (!hasSelected && topic === "mixed") {
                  const allowed = GRADES[grade].topics;
                  setTopic(allowed.find((t) => t !== "mixed") || allowed[0]);
                }
              }}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4 flex-shrink-0">
                  <h2 className="text-2xl font-extrabold text-white mb-2">
                    🎲 בחר נושאים למיקס
                  </h2>
                  <p className="text-white/70 text-sm">
                    בחר אילו נושאים לכלול במיקס
                  </p>
                </div>

                <div className="space-y-3 mb-4 overflow-y-auto flex-1 min-h-0">
                  {GRADES[grade].topics
                    .filter((t) => t !== "mixed")
                    .map((t) => (
                      <label
                        key={t}
                        className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/10 hover:bg-black/40 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={mixedTopics[t] || false}
                          onChange={(e) => {
                            setMixedTopics((prev) => ({
                              ...prev,
                              [t]: e.target.checked,
                            }));
                          }}
                          className="w-5 h-5 rounded"
                        />
                        <span className="text-white font-semibold text-lg">
                          {getTopicName(t)}
                        </span>
                      </label>
                    ))}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      const availableTopics = GRADES[grade].topics.filter(
                        (t) => t !== "mixed"
                      );
                      const allSelected = {};
                      availableTopics.forEach((t) => {
                        allSelected[t] = true;
                      });
                      setMixedTopics(allSelected);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                  >
                    הכל
                  </button>
                  <button
                    onClick={() => {
                      const availableTopics = GRADES[grade].topics.filter(
                        (t) => t !== "mixed"
                      );
                      const noneSelected = {};
                      availableTopics.forEach((t) => {
                        noneSelected[t] = false;
                      });
                      setMixedTopics(noneSelected);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-500/80 hover:bg-gray-500 font-bold text-sm"
                  >
                    בטל הכל
                  </button>
                  <button
                    onClick={() => {
                      const hasSelected = Object.values(mixedTopics).some(
                        (selected) => selected
                      );
                      if (hasSelected) {
                        setShowMixedSelector(false);
                      } else {
                        alert("אנא בחר לפחות נושא אחד");
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm"
                  >
                    שמור
                  </button>
                </div>
              </div>
            </div>
          )}

          {showHowTo && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[180] p-4"
              onClick={() => setShowHowTo(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-emerald-400/60 rounded-2xl p-4 max-w-md w-full text-sm text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-extrabold mb-2 text-center">
                  📘 איך לומדים אנגלית כאן?
                </h2>

                <p className="text-white/80 text-xs mb-3 text-center">
                  המטרה היא לתרגל אנגלית בצורה משחקית, עם התאמה לכיתה, נושא ורמת קושי.
                </p>

                <ul className="list-disc pr-4 space-y-1 text-[13px] text-white/90">
                  <li>בחר כיתה, רמת קושי ונושא (אוצר מילים, דקדוק, תרגום, כתיבה ועוד).</li>
                  <li>בחר מצב משחק: למידה, אתגר עם טיימר וחיים, מרוץ מהירות או מרתון.</li>
                  <li>קרא היטב את השאלה – לפעמים צריך לבחור תשובה, ולפעמים לכתוב באנגלית.</li>
                  <li>לחץ על 💡 Hint כדי לקבל רמז, ועל "📘 הסבר מלא" כדי לראות פתרון צעד־אחר־צעד.</li>
                  <li>ניקוד גבוה, רצף תשובות נכון, כוכבים ו־Badges עוזרים לך לעלות רמה כשחקן.</li>
                </ul>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowHowTo(false)}
                    className="px-5 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* חלון הסבר מלא - Modal גדול ומרכזי */}
          {showSolution && currentQuestion && (
            <div
              className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center px-4"
              onClick={() => setShowSolution(false)}
            >
              <div
                className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl p-4 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className="text-lg font-bold text-emerald-100"
                    dir="rtl"
                  >
                    {"\u200Fאיך פותרים את השאלה?"}
                  </h3>
                  <button
                    onClick={() => setShowSolution(false)}
                    className="text-emerald-200 hover:text-white text-xl leading-none px-2"
                  >
                    ✖
                  </button>
                </div>
                <div className="mb-2 text-sm text-emerald-50" dir="rtl">
                  {/* מציגים שוב את השאלה */}
                  <p
                    className="text-base font-bold text-white mb-3 text-center"
                    style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                  >
                    {currentQuestion.stem || currentQuestion.question}
                  </p>
                  {/* כאן הצעדים */}
                  <div className="space-y-1 text-sm" style={{ direction: "rtl" }}>
                    {getSolutionSteps(
                      currentQuestion,
                      currentQuestion.topic,
                      grade
                    ).map((step, idx) => (
                      <div key={idx}>{step}</div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => setShowSolution(false)}
                    className="px-6 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                    dir="rtl"
                  >
                    {"\u200Fסגור"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

