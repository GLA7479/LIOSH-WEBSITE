import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import { trackEnglishTopicTime } from "../../utils/english-time-tracking";
import { applyLearningShellLayoutVars } from "../../utils/learning-shell-layout";
import { reportModeFromGameState } from "../../utils/report-track-meta";
import {
  addSessionProgress,
  loadMonthlyProgress,
  loadRewardChoice,
  saveRewardChoice,
  getCurrentYearMonth,
  hasRewardCelebrationShown,
  markRewardCelebrationShown,
} from "../../utils/progress-storage";
import {
  REWARD_OPTIONS,
  MONTHLY_MINUTES_TARGET,
  getRewardLabel,
} from "../../data/reward-options";
import { splitRewardAmountLabel } from "../../utils/dashboard-setup-ui";
import {
  loadDailyStreak,
  updateDailyStreak,
  getStreakReward,
} from "../../utils/daily-streak";
import { useSound } from "../../hooks/useSound";
import TrackingDebugPanel from "../../components/TrackingDebugPanel";
import {
  ENGLISH_GRADES,
  ENGLISH_GRADE_ORDER,
} from "../../data/english-curriculum";
import {
  WORD_LISTS,
  GRAMMAR_POOLS,
  SENTENCE_POOLS,
  TRANSLATION_POOLS,
} from "../../data/english-questions";

const LEVELS = {
  easy: { name: "קל", maxWords: 5, complexity: "basic" },
  medium: { name: "בינוני", maxWords: 10, complexity: "intermediate" },
  hard: { name: "קשה", maxWords: 15, complexity: "advanced" },
};

const TOPICS = {
  vocabulary: { name: "אוצר מילים", description: "Vocabulary practice", icon: "📚" },
  grammar: { name: "דקדוק", description: "Grammar focus", icon: "✏️" },
  translation: { name: "תרגום", description: "Sentence translation", icon: "🌐" },
  sentences: { name: "משפטים", description: "Sentence building", icon: "💬" },
  writing: { name: "כתיבה", description: "Free typing practice", icon: "✍️" },
  mixed: { name: "ערבוב", description: "Blend topics", icon: "🎲" },
};

const GRADES = ENGLISH_GRADES;
const GRADE_ORDER = ENGLISH_GRADE_ORDER;

const MODES = {
  learning: { name: "למידה", description: "ללא סיום משחק, תרגול בקצב שלך" },
  challenge: { name: "אתגר", description: "טיימר + חיים, מרוץ ניקוד גבוה" },
  speed: { name: "מהירות", description: "תשובות מהירות = יותר נקודות! ⚡" },
  marathon: { name: "מרתון", description: "כמה שאלות תוכל לפתור? 🏃" },
  practice: { name: "תרגול", description: "בוחר נושא/מצב אימון מדויק" },
};

const STORAGE_KEY = "mleo_english_master";

// Word lists for vocabulary questions (aligned with curriculum themes)

const PRACTICE_FOCUS_OPTIONS = [
  { value: "balanced", label: "📚 כל הנושאים" },
  { value: "vocab_core", label: "🔤 אוצר מילים בסיסי" },
  { value: "grammar_forms", label: "✏️ דקדוק ומבנים" },
  { value: "writing_lab", label: "📝 כתיבה ומשפטים" },
  { value: "translation_boost", label: "📖 תרגום והבנת קטע" },
];

const AVATAR_OPTIONS = [
  "👤",
  "🧑",
  "👦",
  "👧",
  "🦁",
  "🐱",
  "🐶",
  "🐰",
  "🐻",
  "🐼",
  "🦊",
  "🐸",
  "🦄",
  "🌟",
  "🎮",
  "🏆",
  "⭐",
  "💫",
];

const REFERENCE_CATEGORIES = {
  colors: { label: "צבעים", lists: ["colors"] },
  animals: { label: "חיות", lists: ["animals"] },
  actions: { label: "פעלים נפוצים", lists: ["actions"] },
  emotions: { label: "רגשות", lists: ["emotions"] },
  school: { label: "חיי בית ספר", lists: ["school", "family"] },
  technology: { label: "טכנולוגיה", lists: ["technology", "global_issues"] },
};

const REFERENCE_CATEGORY_KEYS = Object.keys(REFERENCE_CATEGORIES);

const GRADE_FACTORS = {
  g1: 0.5,
  g2: 0.7,
  g3: 1,
  g4: 1.1,
  g5: 1.3,
  g6: 1.5,
};




const WRITING_SENTENCES_BASIC = [
  { en: "Good morning", he: "בוקר טוב" },
  { en: "Good night", he: "לילה טוב" },
  { en: "I love my dog", he: "אני אוהב את הכלב שלי" },
  { en: "I am happy", he: "אני שמח" },
];

const WRITING_SENTENCES_ADVANCED = [
  { en: "I will visit my grandparents tomorrow", he: "אני אבקר את סבא וסבתא מחר" },
  { en: "We are going to start a science project", he: "אנחנו הולכים להתחיל פרויקט מדעים" },
  { en: "If it rains, we will stay at home", he: "אם ירד גשם, נישאר בבית" },
  { en: "I have already finished my homework", he: "כבר סיימתי את שיעורי הבית שלי" },
];

const WRITING_SENTENCES_MASTER = [
  { en: "We should protect the forest to keep animals safe", he: "אנחנו צריכים להגן על היער כדי לשמור על החיות" },
  { en: "By working together, we can solve difficult problems", he: "בעבודה משותפת נוכל לפתור בעיות קשות" },
  { en: "I have never forgotten the trip to the science park", he: "מעולם לא שכחתי את הטיול לפארק המדע" },
  { en: "If we recycle plastic, the beach stays beautiful", he: "אם נמחזר פלסטיק, החוף יישאר יפה" },
];

const DEFAULT_GRADE_PROFILE = {
  choiceCount: 4,
  translationPools: ["routines"],
  grammarPools: ["present_simple"],
  sentencePools: ["routine"],
  writingPools: ["word", "sentence_basic"],
  vocabDirections: ["en_to_he", "he_to_en"],
};

const GRADE_PROFILES = {
  g1: {
    ...DEFAULT_GRADE_PROFILE,
    choiceCount: 2,
    translationPools: ["classroom"],
    grammarPools: ["be_basic"],
    sentencePools: ["base"],
    writingPools: ["word"],
    vocabDirections: ["en_to_he", "en_to_he", "he_to_en"],
  },
  g2: {
    ...DEFAULT_GRADE_PROFILE,
    choiceCount: 3,
    translationPools: ["classroom", "routines"],
    grammarPools: ["be_basic", "question_frames"],
    sentencePools: ["base", "routine"],
    writingPools: ["word", "sentence_basic"],
  },
  g3: {
    ...DEFAULT_GRADE_PROFILE,
    translationPools: ["routines", "hobbies"],
    grammarPools: ["present_simple", "question_frames"],
    sentencePools: ["routine", "descriptive"],
    writingPools: ["word", "sentence_basic"],
  },
  g4: {
    ...DEFAULT_GRADE_PROFILE,
    translationPools: ["hobbies", "community"],
    grammarPools: ["present_simple", "progressive", "quantifiers"],
    sentencePools: ["descriptive", "narrative"],
    writingPools: ["word", "sentence_basic", "sentence_extended"],
  },
  g5: {
    ...DEFAULT_GRADE_PROFILE,
    translationPools: ["community", "technology"],
    grammarPools: ["past_simple", "modals", "comparatives", "future_forms"],
    sentencePools: ["narrative", "advanced"],
    writingPools: ["sentence_extended", "sentence_extended", "word"],
  },
  g6: {
    ...DEFAULT_GRADE_PROFILE,
    translationPools: ["technology", "global"],
    grammarPools: ["complex_tenses", "conditionals", "modals", "comparatives"],
    sentencePools: ["advanced"],
    writingPools: ["sentence_extended", "sentence_master"],
    vocabDirections: ["he_to_en", "en_to_he", "he_to_en"],
  },
};

function getLevelForGrade(levelKey, gradeKey) {
  const base = LEVELS[levelKey] || LEVELS.easy;
  const factor = GRADE_FACTORS[gradeKey] || 1;
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

  let question,
    correctAnswer,
    params = {};
  let qType = "choice"; // ברירת מחדל – שאלת בחירה
  const gradeConfig = GRADES[gradeKey] || GRADES.g3;
  const gradeProfile = GRADE_PROFILES[gradeKey] || DEFAULT_GRADE_PROFILE;
  const gradeWordLists = (gradeConfig.wordLists || []).filter(
    (list) => WORD_LISTS[list]
  );
  const fallbackWordLists = gradeWordLists.length
    ? gradeWordLists
    : Object.keys(WORD_LISTS);
  const selectedList =
    fallbackWordLists[Math.floor(Math.random() * fallbackWordLists.length)];
  const words = WORD_LISTS[selectedList] || WORD_LISTS.colors;
  const wordEntries = Object.entries(words);
  const randomWord =
    wordEntries[Math.floor(Math.random() * wordEntries.length)] || [
      "sun",
      "שמש",
    ];

  switch (selectedTopic) {
    case "vocabulary": {
      const vocabDirections =
        gradeProfile.vocabDirections || ["en_to_he", "he_to_en"];
      const directionKey =
        vocabDirections[Math.floor(Math.random() * vocabDirections.length)];
      const directionIsEnglish = directionKey === "en_to_he";
      if (directionIsEnglish) {
        question = `מה פירוש המילה "${randomWord[0]}"\u200F?`;
        correctAnswer = randomWord[1];
        params = {
          word: randomWord[0],
          translation: randomWord[1],
          direction: "en_to_he",
        };
      } else {
        question = `מה פירוש המילה "${randomWord[1]}"\u200F?`;
        correctAnswer = randomWord[0];
        params = {
          word: randomWord[1],
          translation: randomWord[0],
          direction: "he_to_en",
        };
      }
      break;
    }

    case "grammar": {
      const grammarPools = gradeProfile.grammarPools || ["present_simple"];
      let pool = [];
      grammarPools.forEach((key) => {
        if (GRAMMAR_POOLS[key]) {
          pool = pool.concat(GRAMMAR_POOLS[key]);
        }
      });
      if (pool.length === 0) {
        pool = Object.values(GRAMMAR_POOLS).flat();
      }
      const grammarQ = pool[Math.floor(Math.random() * pool.length)];
      question = grammarQ.question;
      correctAnswer = grammarQ.correct;
      params = { explanation: grammarQ.explanation };
      break;
    }

    case "translation": {
      const translationPools = gradeProfile.translationPools || ["classroom"];
      let sentencesPool = [];
      translationPools.forEach((key) => {
        if (TRANSLATION_POOLS[key]) {
          sentencesPool = sentencesPool.concat(TRANSLATION_POOLS[key]);
        }
      });
      if (sentencesPool.length === 0) {
        sentencesPool = Object.values(TRANSLATION_POOLS).flat();
      }
      const sentence =
        sentencesPool[Math.floor(Math.random() * sentencesPool.length)];
      const direction = Math.random() > 0.5 ? "en_to_he" : "he_to_en";
      if (direction === "en_to_he") {
        question = `תרגם: "${sentence.en}"`;
        correctAnswer = sentence.he;
        params = {
          sentence: sentence.en,
          translation: sentence.he,
          direction: "en_to_he",
        };
      } else {
        question = `תרגם: "${sentence.he}"`;
        correctAnswer = sentence.en;
        params = {
          sentence: sentence.he,
          translation: sentence.en,
          direction: "he_to_en",
        };
      }
      break;
    }

    case "sentences": {
      const sentencePools = gradeProfile.sentencePools || ["routine"];
      let pool = [];
      sentencePools.forEach((key) => {
        if (SENTENCE_POOLS[key]) {
          pool = pool.concat(SENTENCE_POOLS[key]);
        }
      });
      if (pool.length === 0) {
        pool = SENTENCE_POOLS.base;
      }
      const template =
        pool[Math.floor(Math.random() * pool.length)] || SENTENCE_POOLS.base[0];
      question = `השלם את המשפט: "${template.template}"`;
      correctAnswer = template.correct;
      params = { template: template.template, explanation: template.explanation };
      break;
    }

    case "writing": {
      const writingPools = gradeProfile.writingPools || ["word"];
      const mode =
        writingPools[Math.floor(Math.random() * writingPools.length)] || "word";
      if (mode === "word") {
        const [en, he] = randomWord;
        question = `כתוב באנגלית: "${he}"`;
        correctAnswer = en;
        params = {
          type: "word",
          wordHe: he,
          wordEn: en,
          direction: "he_to_en",
        };
      } else {
        let pool = WRITING_SENTENCES_BASIC;
        if (mode === "sentence_extended") {
          pool = WRITING_SENTENCES_ADVANCED;
        } else if (mode === "sentence_master") {
          pool = WRITING_SENTENCES_MASTER;
        }
        const s = pool[Math.floor(Math.random() * pool.length)];
        question = `כתוב באנגלית: "${s.he}"`;
        correctAnswer = s.en;
        params = {
          type: "sentence",
          sentenceHe: s.he,
          sentenceEn: s.en,
          direction: "he_to_en",
        };
        qType = "typing";
        break;
      }
      qType = "typing";
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
  const targetChoices = Math.max(2, gradeProfile.choiceCount || 4);
  const wrongNeeded = Math.max(1, targetChoices - 1);
  const wrongAnswers = new Set();
  while (wrongAnswers.size < wrongNeeded) {
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
    allAnswers = [correctAnswer, ...Array.from(wrongAnswers)].slice(
      0,
      targetChoices
    );
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
  const sessionStartRef = useRef(null);
  const sessionSecondsRef = useRef(0);
  const solvedCountRef = useRef(0);
  const pendingEnglishTrackMetaRef = useRef(null);
  /** localStorage bucket key for the question currently being timed (same idea as geometry topic ref). */
  const englishTrackingTopicKeyRef = useRef(null);
  const yearMonthRef = useRef(getCurrentYearMonth());

  const [mounted, setMounted] = useState(false);
  const [grade, setGrade] = useState("g3");
  const [gradeNumber, setGradeNumber] = useState(() => {
    const idx = GRADE_ORDER.indexOf("g3");
    return idx >= 0 ? idx + 1 : 3;
  });
  const [mode, setMode] = useState("learning");
  const [practiceFocus, setPracticeFocus] = useState("balanced");
  const [focusedPracticeMode, setFocusedPracticeMode] = useState("normal");
  const [useStoryQuestions, setUseStoryQuestions] = useState(false);
  const [storyOnly, setStoryOnly] = useState(false);
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
  const [showPracticeOptions, setShowPracticeOptions] = useState(false);
  
  // Daily Streak
  const [dailyStreak, setDailyStreak] = useState(() => loadDailyStreak("mleo_english_daily_streak"));
  const [showStreakReward, setShowStreakReward] = useState(null);
  
  // Sound system
  const sound = useSound();
  
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
    correct: 0,
  });
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
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
    writing: false,
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardLevel, setLeaderboardLevel] = useState("easy");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showHowTo, setShowHowTo] = useState(false);
  const [mistakes, setMistakes] = useState([]);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [referenceCategory, setReferenceCategory] = useState(REFERENCE_CATEGORY_KEYS[0]);
  const [monthlyProgress, setMonthlyProgress] = useState({
    totalMinutes: 0,
    totalExercises: 0,
  });
  const [goalPercent, setGoalPercent] = useState(0);
  const [minutesRemaining, setMinutesRemaining] = useState(MONTHLY_MINUTES_TARGET);
  const [rewardChoice, setRewardChoice] = useState(null);
const [showRewardCelebration, setShowRewardCelebration] = useState(false);
const [rewardCelebrationLabel, setRewardCelebrationLabel] = useState("");
const refreshMonthlyProgress = useCallback(() => {
  if (typeof window === "undefined") return;
  try {
    const all = loadMonthlyProgress();
    const current = all[yearMonthRef.current] || { totalMinutes: 0, totalExercises: 0 };
    setMonthlyProgress(current);
    const percent = MONTHLY_MINUTES_TARGET
      ? Math.min(100, Math.round((current.totalMinutes / MONTHLY_MINUTES_TARGET) * 100))
      : 0;
    setGoalPercent(percent);
    setMinutesRemaining(Math.max(0, MONTHLY_MINUTES_TARGET - current.totalMinutes));
    const choice = loadRewardChoice(yearMonthRef.current);
    setRewardChoice(choice);
  } catch {
    // ignore
  }
}, []);
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
  const [playerAvatar, setPlayerAvatar] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("mleo_player_avatar") || "👤";
      } catch {
        return "👤";
      }
    }
    return "👤";
  });
  const [playerAvatarImage, setPlayerAvatarImage] = useState(null); // תמונת אווטר מותאמת אישית
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const gradeLabels = ["א", "ב", "ג", "ד", "ה", "ו"];
  const [weeklyChallenge, setWeeklyChallenge] = useState({
    target: 50,
    current: 0,
    completed: false,
  });

  useEffect(() => {
    const idx = GRADE_ORDER.indexOf(grade);
    if (idx !== -1 && gradeNumber !== idx + 1) {
      setGradeNumber(idx + 1);
    }
  }, [grade, gradeNumber]);

  useEffect(() => {
    refreshMistakes();
  }, []);

  useEffect(() => {
    refreshMonthlyProgress();
  }, [refreshMonthlyProgress]);

  // טעינת תמונת אווטר מ-localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedImage = localStorage.getItem("mleo_player_avatar_image");
        if (savedImage) {
          setPlayerAvatarImage(savedImage);
          setPlayerAvatar(null);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // טיפול בהעלאת תמונת אווטר
  const handleAvatarImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // בדוק גודל קובץ (מקסימום 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("התמונה גדולה מדי. נא לבחור תמונה עד 5MB");
      return;
    }
    
    // בדוק סוג קובץ
    if (!file.type.startsWith("image/")) {
      alert("נא לבחור קובץ תמונה בלבד");
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result;
      setPlayerAvatarImage(imageUrl);
      setPlayerAvatar(null);
      try {
        localStorage.setItem("mleo_player_avatar_image", imageUrl);
        localStorage.removeItem("mleo_player_avatar"); // הסר אמוג'י אם נבחרה תמונה
      } catch {
        // ignore
      }
    };
    reader.readAsDataURL(file);
  };

  // טיפול במחיקת תמונת אווטר
  const handleRemoveAvatarImage = () => {
    setPlayerAvatarImage(null);
    try {
      localStorage.removeItem("mleo_player_avatar_image");
      // החזר אמוג'י ברירת מחדל
      const defaultAvatar = "👤";
      setPlayerAvatar(defaultAvatar);
      localStorage.setItem("mleo_player_avatar", defaultAvatar);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (monthlyProgress.totalMinutes < MONTHLY_MINUTES_TARGET) return;
    if (hasRewardCelebrationShown(yearMonthRef.current)) return;

    const label = rewardChoice ? getRewardLabel(rewardChoice) : "";
    setRewardCelebrationLabel(label);
    setShowRewardCelebration(true);
    markRewardCelebrationShown(yearMonthRef.current);
    sound.playSound("badge-earned");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyProgress.totalMinutes, rewardChoice]);

  const handleGradeNumberChange = (value) => {
    const numeric = Number(value);
    if (!numeric) return;
    const nextGradeKey = GRADE_ORDER[numeric - 1] || "g3";
    setGradeNumber(numeric);
    setGrade(nextGradeKey);
    setGameActive(false);
  };

  function persistProgressSnapshot(newProgress) {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY + "_progress") || "{}"
      );
      saved.progress = newProgress;
      localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
    } catch {}
  }

  function updateTopicProgress(topic, isCorrect) {
    if (!topic) return;
    setProgress((prev) => {
      const prevEntry = prev[topic] || { total: 0, correct: 0 };
      const updated = {
        ...prev,
        [topic]: {
          total: (prevEntry.total || 0) + 1,
          correct: (prevEntry.correct || 0) + (isCorrect ? 1 : 0),
        },
      };
      persistProgressSnapshot(updated);
      return updated;
    });
  }

  function refreshMistakes() {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem("mleo_english_mistakes") || "[]");
      setMistakes(saved.slice(-50).reverse());
    } catch {}
  }

  function clearMistakes() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("mleo_english_mistakes");
      setMistakes([]);
    } catch {}
  }

  function handleMistakePractice(entry) {
    if (!entry) return;
    const gradeKey = entry.grade || grade;
    const levelKey = entry.level || level;
    const topicKey = entry.topic || "vocabulary";
    const gradeIdx = GRADE_ORDER.indexOf(gradeKey);
    if (gradeIdx !== -1) {
      setGradeNumber(gradeIdx + 1);
    }
    setGrade(gradeKey);
    setLevel(levelKey);
    setTopic(topicKey);
    setMode("learning");
    setGameActive(false);
    setShowPracticeModal(false);
    setTimeout(() => {
      if (playerName.trim()) {
        startGame();
      } else {
        setFeedback("הכנס שם שחקן כדי לתרגל את הטעות שנבחרה");
      }
    }, 200);
  }

  function logEnglishMistakeEntry(entry) {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(
        localStorage.getItem("mleo_english_mistakes") || "[]"
      );
      saved.push({ ...entry, timestamp: Date.now() });
      if (saved.length > 200) saved.shift();
      localStorage.setItem("mleo_english_mistakes", JSON.stringify(saved));
      refreshMistakes();
    } catch {}
  }

  function trackCurrentQuestionTime() {
    if (!questionStartTime) return;
    const topicKey =
      englishTrackingTopicKeyRef.current ?? currentQuestion?.topic;
    if (!topicKey) return;
    const duration = (Date.now() - questionStartTime) / 1000;
    if (duration > 0 && duration < 300) {
      const qGrade = currentQuestion?.gradeKey || grade;
      const qLevel = currentQuestion?.levelKey || level;
      const meta = pendingEnglishTrackMetaRef.current;
      pendingEnglishTrackMetaRef.current = null;
      trackEnglishTopicTime(
        topicKey,
        qGrade,
        qLevel,
        duration,
        meta && meta.mode != null
          ? { mode: meta.mode, correct: meta.correct, total: meta.total }
          : {
              mode: reportModeFromGameState(mode, focusedPracticeMode),
              total: 1,
              correct: undefined,
            }
      );
    }
  }

  function recordSessionProgress() {
    if (!sessionStartRef.current) return;
    trackCurrentQuestionTime();
    accumulateQuestionTime();
    const elapsedMs = Date.now() - sessionStartRef.current;
    if (elapsedMs <= 0) {
      sessionStartRef.current = null;
      solvedCountRef.current = 0;
      sessionSecondsRef.current = 0;
      return;
    }
    const totalSeconds = sessionSecondsRef.current;
    if (totalSeconds <= 0) {
      sessionStartRef.current = null;
      solvedCountRef.current = 0;
      sessionSecondsRef.current = 0;
      return;
    }
    const answered = Math.max(solvedCountRef.current, totalQuestions);
    const durationMinutes = Number((totalSeconds / 60000).toFixed(2));
    addSessionProgress(durationMinutes, answered, {
      subject: "english",
      topic: englishTrackingTopicKeyRef.current ?? currentQuestion?.topic ?? "",
      grade: gradeNumber,
      mode,
      game: "EnglishMaster",
      date: new Date(),
    });
    refreshMonthlyProgress();
    sessionStartRef.current = null;
    solvedCountRef.current = 0;
    sessionSecondsRef.current = 0;
    setQuestionStartTime(null);
  }

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
    return () => {
      recordSessionProgress();
    };
  }, []);

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
      writing: availableTopics.includes("writing"),
    };
    setMixedTopics(newMixedTopics);
  }, [grade]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyChallenge.date !== today) {
      setDailyChallenge({ date: today, bestScore: 0, questions: 0, correct: 0 });
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
      if (saved.progress) {
        setProgress((prev) => ({
          ...prev,
          ...saved.progress,
        }));
      }
    } catch {}
  }, []);

  // שמירת progress ל-localStorage בכל עדכון
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
      saved.progress = progress;
      localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
    } catch {}
  }, [progress]);

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
    let resizeTimer = null;
    const calc = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        applyLearningShellLayoutVars({
          wrapRef,
          headerRef,
          controlsRef,
        });
      }, 150);
    };
    const timer = setTimeout(calc, 100);
    window.addEventListener("resize", calc, { passive: true });
    window.visualViewport?.addEventListener("resize", calc);
    return () => {
      clearTimeout(timer);
      if (resizeTimer) clearTimeout(resizeTimer);
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
    accumulateQuestionTime();
    // Stop background music when game resets
    sound.stopBackgroundMusic();
    setGameActive(false);
    englishTrackingTopicKeyRef.current = null;
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

  const accumulateQuestionTime = useCallback(() => {
    if (!questionStartTime) return;
    const elapsed = Date.now() - questionStartTime;
    if (elapsed <= 0) return;
    sessionSecondsRef.current += Math.min(elapsed, 60000);
  }, [questionStartTime]);

  function generateNewQuestion() {
    accumulateQuestionTime();
    let gradeForQuestion = grade;
    let levelForQuestion = level;
    let topicForState = topic;
    let mixedConfig = topic === "mixed" ? mixedTopics : null;

    if (focusedPracticeMode === "mistakes" && mistakes.length > 0) {
      const randomMistake =
        mistakes[Math.floor(Math.random() * mistakes.length)];
      if (randomMistake.grade) {
        gradeForQuestion = randomMistake.grade;
      }
      if (randomMistake.level) {
        levelForQuestion = randomMistake.level;
      }
      if (randomMistake.topic) {
        topicForState = randomMistake.topic;
      }
    }

    if (focusedPracticeMode === "graded") {
      levelForQuestion =
        correct < 5 ? "easy" : correct < 15 ? "medium" : level;
    }

    if (mode === "practice") {
      switch (practiceFocus) {
        case "vocab_core":
          topicForState = "vocabulary";
          break;
        case "grammar_forms":
          topicForState = "grammar";
          break;
        case "writing_lab":
          topicForState = "writing";
          break;
        case "translation_boost":
          topicForState = "translation";
          break;
        default:
          break;
      }
    }

    if (storyOnly) {
      topicForState = "translation";
    } else if (useStoryQuestions && topicForState !== "translation") {
      topicForState = Math.random() < 0.5 ? "translation" : topicForState;
    }

    const levelConfig = getLevelForGrade(levelForQuestion, gradeForQuestion);
    let question;
    let attempts = 0;
    const maxAttempts = 50;
    trackCurrentQuestionTime();
    do {
      question = generateQuestion(
        levelConfig,
        topicForState,
        gradeForQuestion,
        topicForState === "mixed" ? mixedConfig : null
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
    question.gradeKey = gradeForQuestion;
    question.levelKey = levelForQuestion;
    question.practiceFocus = mode === "practice" ? practiceFocus : "default";
    englishTrackingTopicKeyRef.current = question.topic;
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
    recordSessionProgress();
    sessionStartRef.current = Date.now();
    solvedCountRef.current = 0;
    sessionSecondsRef.current = 0;
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
    
    // Start background music and play game start sound
    sound.playBackgroundMusic();
    sound.playSound("game-start");
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
    // Stop background music when game stops
    sound.stopBackgroundMusic();
    pendingEnglishTrackMetaRef.current = {
      correct: undefined,
      total: 1,
      mode: reportModeFromGameState(mode, focusedPracticeMode),
    };
    trackCurrentQuestionTime();
    recordSessionProgress();
    setGameActive(false);
    englishTrackingTopicKeyRef.current = null;
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedAnswer(null);
    saveRunToStorage();
  }

  function handleTimeUp() {
    pendingEnglishTrackMetaRef.current = {
      correct: 0,
      total: 1,
      mode: reportModeFromGameState(mode, focusedPracticeMode),
    };
    trackCurrentQuestionTime();
    recordSessionProgress();
    setWrong((prev) => prev + 1);
    setStreak(0);
    setFeedback("הזמן נגמר! המשחק נגמר! ⏰");
    setGameActive(false);
    englishTrackingTopicKeyRef.current = null;
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
    solvedCountRef.current += 1;
    const normalize = (v) => String(v).trim().toLowerCase();
    const isCorrect =
      normalize(answer) === normalize(currentQuestion.correctAnswer);
    pendingEnglishTrackMetaRef.current = {
      correct: isCorrect ? 1 : 0,
      total: 1,
      mode: reportModeFromGameState(mode, focusedPracticeMode),
    };
    let awardedPoints = 0;
    if (isCorrect) {
      awardedPoints = 10 + streak;
      if (mode === "speed") {
        const timeBonus = timeLeft ? Math.floor(timeLeft * 2) : 0;
        awardedPoints += timeBonus;
      }
      setScore((prev) => prev + awardedPoints);
      setStreak((prev) => prev + 1);
      setCorrect((prev) => prev + 1);
      
      setErrorExplanation("");

      const top = currentQuestion.topic;
      updateTopicProgress(top, true);
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
        sound.playSound("badge-earned");
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
        sound.playSound("badge-earned");
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
        sound.playSound("badge-earned");
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
            sound.playSound("level-up");
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
      setFeedback("Correct! 🎉");
      
      // Play sound - different sound for streak milestones
      if ((streak + 1) % 5 === 0 && streak + 1 >= 5) {
        sound.playSound("streak");
      } else {
        sound.playSound("correct");
      }
      
      // Update daily streak
      const updatedStreak = updateDailyStreak("mleo_english_daily_streak");
      setDailyStreak(updatedStreak);
      
      // Show streak reward if applicable
      const reward = getStreakReward(updatedStreak.streak);
      if (reward && updatedStreak.streak > (dailyStreak.streak || 0)) {
        setShowStreakReward(reward);
        setTimeout(() => setShowStreakReward(null), 3000);
      }
      
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
      
      // Play sound for wrong answer
      sound.playSound("wrong");
      
      const questionGradeKey = currentQuestion.gradeKey || grade;
      setErrorExplanation(
        getErrorExplanation(
          currentQuestion,
          currentQuestion.topic,
          answer,
          questionGradeKey
        )
      );
      
      const top = currentQuestion.topic;
      updateTopicProgress(top, false);
      logEnglishMistakeEntry({
        topic: currentQuestion.topic,
        grade: questionGradeKey,
        level: currentQuestion.levelKey || level,
        question: currentQuestion.question,
        correctAnswer: currentQuestion.correctAnswer,
        wrongAnswer: answer,
      });
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
            pendingEnglishTrackMetaRef.current = {
              correct: 0,
              total: 1,
              mode: reportModeFromGameState(mode, focusedPracticeMode),
            };
            trackCurrentQuestionTime();
            setFeedback("Game Over! 💔");
            sound.playSound("game-over");
            recordSessionProgress();
            saveRunToStorage();
            setGameActive(false);
            englishTrackingTopicKeyRef.current = null;
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

    const potentialScore = isCorrect ? score + awardedPoints : score;
    setDailyChallenge((prev) => ({
      ...prev,
      bestScore: Math.max(prev.bestScore || 0, potentialScore),
      questions: (prev.questions || 0) + 1,
      correct: (prev.correct || 0) + (isCorrect ? 1 : 0),
    }));
    if (isCorrect) {
      setWeeklyChallenge((prev) => {
        if (prev.completed) return prev;
        const next = prev.current + 1;
        const completed = next >= prev.target;
        return {
          ...prev,
          current: next,
          completed,
        };
      });
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

  const goToParentReport = () => {
    router.push("/learning/parent-report");
  };

  const getTopicName = (t) => {
    return TOPICS[t]?.icon + " " + TOPICS[t]?.name || t;
  };

  const getGradeLabel = (gradeKey) => {
    const idx = GRADE_ORDER.indexOf(gradeKey);
    if (idx === -1) return "";
    return `כיתה ${gradeLabels[idx]}`;
  };

  if (!mounted)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const gradeInfo = GRADES[grade] || GRADES.g3;
  const dailySolved = dailyChallenge.correct || 0;
  const dailyProgress =
    dailyChallenge.questions > 0
      ? Math.min(1, dailySolved / dailyChallenge.questions)
      : 0;
  const dailyPercent = Math.round(dailyProgress * 100);
  const weeklyProgress = Math.min(
    1,
    (weeklyChallenge.current || 0) / (weeklyChallenge.target || 1)
  );
  const weeklyPercent = Math.round(weeklyProgress * 100);
  const referenceData =
    REFERENCE_CATEGORIES[referenceCategory] ||
    REFERENCE_CATEGORIES[REFERENCE_CATEGORY_KEYS[0]];
  const referenceEntries = referenceData.lists.flatMap((listKey) =>
    Object.entries(WORD_LISTS[listKey] || {})
  );

  return (
    <Layout>
      <div className="flex flex-col h-dvh max-h-dvh min-h-0 overflow-hidden bg-gradient-to-b from-[#0a0f1d] to-[#141928]" dir="rtl">
        <div
          ref={wrapRef}
          className="relative overflow-hidden game-page-mobile learning-master-fill flex flex-col flex-1 min-h-0 w-full max-md:pl-0 max-md:pr-0 md:pl-[clamp(8px,2vw,32px)] md:pr-[clamp(8px,2vw,32px)]"
          style={{
            maxWidth: "1200px",
            width: "min(1200px, 100vw)",
            paddingTop: "clamp(12px, 3vw, 32px)",
            paddingBottom: 0,
            margin: "0 auto"
          }}
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
            <div className="absolute right-2 top-2 flex gap-2 pointer-events-auto">
              <button
                onClick={() => router.push("/learning/curriculum?subject=english")}
                className="min-w-[100px] px-3 py-1 rounded-lg text-sm font-bold bg-emerald-500/20 border border-emerald-400/30 hover:bg-emerald-500/30 text-emerald-200"
              >
                📋 תוכנית לימודים
              </button>
            </div>
            <div className="absolute left-2 top-2 pointer-events-auto">
              <button
                onClick={backSafe}
                className="min-w-[60px] px-3 py-1 rounded-lg text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10"
              >
                BACK
              </button>
            </div>
          </div>
        </div>

        <div
          className="relative flex flex-1 min-h-0 flex-col items-center justify-start px-2 md:px-4 overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch]"
          style={{
            height: "100%",
            maxHeight: "100%",
            paddingTop: "calc(var(--head-h, 56px) + 8px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
          }}
        >
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <h1 className="text-2xl font-extrabold text-white">
                🇬🇧 English Master
              </h1>
              <button
                onClick={() => {
                  sound.toggleSounds();
                  sound.toggleMusic();
                }}
                className={`h-7 w-7 rounded-lg border border-white/20 text-white text-sm font-bold flex items-center justify-center transition-all flex-shrink-0 ${
                  sound.soundsEnabled && sound.musicEnabled
                    ? "bg-green-500/80 hover:bg-green-500"
                    : "bg-red-500/80 hover:bg-red-500"
                }`}
                title={sound.soundsEnabled && sound.musicEnabled ? "השתק צלילים" : "הפעל צלילים"}
              >
                {sound.soundsEnabled && sound.musicEnabled ? "🔊" : "🔇"}
              </button>
            </div>
            <p className="text-white/70 text-xs">
              {playerName || "שחקן"} • {gradeInfo.name} •{" "}
              {LEVELS[level].name} • {getTopicName(topic)} • {MODES[mode].name}
            </p>
          </div>

          <div
            ref={controlsRef}
            className="grid grid-cols-8 gap-0.5 mb-3 w-full max-w-lg"
          >
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">ניקוד</div>
              <div className="text-sm font-bold text-emerald-400 leading-tight">{score}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">רצף</div>
              <div className="text-sm font-bold text-amber-400 leading-tight">🔥{streak}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">כוכבים</div>
              <div className="text-sm font-bold text-yellow-400 leading-tight">⭐{stars}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">רמה</div>
              <div className="text-sm font-bold text-purple-400 leading-tight">Lv.{playerLevel}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">✅</div>
              <div className="text-sm font-bold text-green-400 leading-tight">{correct}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">חיים</div>
              <div className="text-sm font-bold text-rose-400 leading-tight">
                {mode === "challenge" ? `${lives} ❤️` : "∞"}
              </div>
            </div>
            <div
              className={`rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px] ${
                gameActive && (mode === "challenge" || mode === "speed") && timeLeft <= 5
                  ? "bg-red-500/30 border-2 border-red-400 animate-pulse"
                  : "bg-black/30 border border-white/10"
              }`}
            >
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">⏰ טיימר</div>
              <div
                className={`text-sm font-black leading-tight ${
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
            <button
              onClick={() => setShowPlayerProfile(true)}
              className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px] hover:bg-purple-500/20 transition-all cursor-pointer"
              title="פרופיל שחקן"
            >
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">אווטר</div>
              <div className="text-lg font-bold leading-tight">
                {playerAvatarImage ? (
                  <img 
                    src={playerAvatarImage} 
                    alt="אווטר" 
                    className="w-6 h-6 rounded-full object-cover mx-auto"
                  />
                ) : (
                  playerAvatar
                )}
              </div>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3 w-full max-w-lg flex-wrap px-1">
            {Object.keys(MODES).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setGameActive(false);
                  setFeedback(null);
                }}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                  mode === m
                    ? "bg-emerald-500/80 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {MODES[m].name}
              </button>
            ))}
          </div>

          {showStreakReward && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none" dir="rtl">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-bounce">
                <div className="text-4xl mb-2">{showStreakReward.emoji}</div>
                <div className="text-xl font-bold">{showStreakReward.message}</div>
              </div>
            </div>
          )}

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

          {showRewardCelebration && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[210] p-4" dir="rtl">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl p-6 w-full max-w-md text-center relative shadow-2xl">
                <div className="text-4xl mb-3">🎁</div>
                <div className="text-2xl font-bold mb-2">השלמת את מסע הפרס החודשי!</div>
                {rewardCelebrationLabel ? (
                  <p className="text-base mb-4">
                    הפרס שבחרת:{" "}
                    <span dir="ltr" className="font-bold">
                      {rewardCelebrationLabel}
                    </span>
                  </p>
                ) : (
                  <p className="text-base mb-4">בחרו עכשיו את הפרס שאתם רוצים לקבל החודש!</p>
                )}
                <button
                  onClick={() => setShowRewardCelebration(false)}
                  className="mt-2 px-5 py-2 rounded-lg bg-white/90 text-emerald-700 font-bold hover:bg-white"
                >
                  הבנתי, תודה!
                </button>
              </div>
            </div>
          )}

          {!gameActive ? (
            <div className="flex flex-col flex-1 min-h-0 w-full max-w-lg items-center justify-start">
              <div
                className="flex flex-nowrap items-center gap-2 mb-3 w-full max-w-lg px-0.5 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
                dir="rtl"
              >
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
                  className="h-10 shrink-0 w-[3.5rem] px-1.5 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold placeholder:text-white/40 box-border"
                  maxLength={15}
                  dir={playerName && /[\u0590-\u05FF]/.test(playerName) ? "rtl" : "ltr"}
                  style={{ textAlign: playerName && /[\u0590-\u05FF]/.test(playerName) ? "right" : "left" }}
                />
                <select
                  value={gradeNumber}
                  title={`כיתה ${gradeLabels[gradeNumber - 1]}`}
                  onChange={(e) => handleGradeNumberChange(e.target.value)}
                  className="h-10 shrink-0 min-w-0 w-[5.25rem] max-w-[5.5rem] rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold px-2 box-border overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {GRADE_ORDER.map((_, idx) => (
                    <option key={`grade-${idx + 1}`} value={idx + 1}>
                      {`כיתה ${gradeLabels[idx]}`}
                    </option>
                  ))}
                </select>
                <select
                  value={level}
                  title={LEVELS[level]?.name}
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-10 shrink-0 min-w-0 w-[5rem] max-w-[5.5rem] rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold px-2 box-border overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {Object.keys(LEVELS).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {LEVELS[lvl].name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-1 min-w-0 items-center gap-1.5 shrink">
                  <select
                    ref={topicSelectRef}
                    value={topic}
                    title={getTopicName(topic)}
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
                    className="h-10 min-w-0 flex-1 max-w-[18rem] rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold px-2 box-border overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {GRADES[grade].topics.map((t) => (
                      <option key={t} value={t}>
                        {getTopicName(t)}
                      </option>
                    ))}
                  </select>
                  {topic === "mixed" && (
                    <button
                      type="button"
                      onClick={() => setShowMixedSelector(true)}
                      className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/80 hover:bg-blue-500 border border-white/20 text-white text-sm font-bold flex items-center justify-center box-border"
                      title="ערוך נושאים למיקס"
                    >
                      ⚙️
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mb-3 w-full max-w-lg" dir="rtl">
                <div className="bg-black/25 border border-white/15 rounded-lg px-1 py-2 min-h-[4.5rem] flex flex-col items-center justify-center gap-1 min-w-0 shadow-sm">
                  <span className="text-[10px] text-white/60 text-center leading-tight max-w-full px-0.5 line-clamp-2">שיא ניקוד</span>
                  <span className="text-base font-bold text-emerald-400 tabular-nums leading-tight">{bestScore}</span>
                </div>
                <div className="bg-black/25 border border-white/15 rounded-lg px-1 py-2 min-h-[4.5rem] flex flex-col items-center justify-center gap-1 min-w-0 shadow-sm">
                  <span className="text-[10px] text-white/60 text-center leading-tight max-w-full px-0.5 line-clamp-2">שיא רצף</span>
                  <span className="text-base font-bold text-amber-400 tabular-nums leading-tight">{bestStreak}</span>
                </div>
                <div className="bg-black/25 border border-white/15 rounded-lg px-1 py-2 min-h-[4.5rem] flex flex-col items-center justify-center gap-1 min-w-0 shadow-sm">
                  <span className="text-[10px] text-white/60 text-center leading-tight max-w-full px-0.5 line-clamp-2">דיוק</span>
                  <span className="text-base font-bold text-blue-400 tabular-nums leading-tight">{accuracy}%</span>
                </div>
                <div className="bg-black/25 border border-white/15 rounded-lg px-1 py-2 min-h-[4.5rem] flex flex-col items-center justify-center gap-1.5 min-w-0 shadow-sm">
                  <span className="text-[10px] text-white/60 text-center leading-tight">אתגרים</span>
                  <button
                    type="button"
                    onClick={() => setShowDailyChallenge(true)}
                    className="h-8 w-full max-w-[4rem] px-2 rounded-md bg-blue-500/85 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    פתיחה
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-md px-1 pt-1 pb-1 mb-3 w-full max-w-lg opacity-90">
                <div className="flex items-center justify-between text-[9px] text-white/55 mb-0.5 leading-tight">
                  <span>🎁 מסע פרס חודשי</span>
                  <span>
                    {Math.round(monthlyProgress.totalMinutes)} / {MONTHLY_MINUTES_TARGET} דק׳
                  </span>
                </div>
                <p className="text-[9px] text-white/55 mb-0.5 text-center leading-tight">
                  {minutesRemaining > 0
                    ? `נותרו עוד ${Math.round(minutesRemaining)} דק׳ (~${Math.ceil(
                        Math.round(minutesRemaining) / 60
                      )} ש׳)`
                    : "🎉 יעד הושלם! בקשו מההורה לבחור פרס."}
                </p>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mb-2">
                  <div
                    className="h-1.5 bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-1.5 w-full">
                  {REWARD_OPTIONS.map((option) => {
                    const rewardParts = splitRewardAmountLabel(option.label);
                    return (
                    <button
                      type="button"
                      key={option.key}
                      onClick={() => {
                        saveRewardChoice(yearMonthRef.current, option.key);
                        setRewardChoice(option.key);
                      }}
                      className={`rounded-lg border py-2 px-1 min-h-[4.25rem] bg-black/35 flex flex-col items-center justify-center gap-1 min-w-0 transition-colors ${
                        rewardChoice === option.key
                          ? "border-emerald-400 text-emerald-200 bg-emerald-500/20"
                          : "border-white/15 text-white/70 hover:border-white/30"
                      }`}
                    >
                      <span className="text-lg leading-none shrink-0">{option.icon}</span>
                      {rewardParts.amount != null ? (
                        <>
                          <span className="text-xs font-extrabold tabular-nums leading-none text-emerald-100" dir="ltr">{rewardParts.amount}</span>
                          <span className="text-[9px] font-semibold leading-snug text-center text-white/90 px-0.5 line-clamp-2" dir="ltr">{rewardParts.name}</span>
                        </>
                      ) : (
                        <span className="text-[10px] font-semibold leading-snug text-center px-0.5" dir="ltr">{rewardParts.full}</span>
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto mb-2 w-full pt-3 flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-1.5 w-full max-w-lg flex-wrap px-1">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-9 px-4 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-xs"
                >
                  ▶️ התחל
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="h-9 px-3 rounded-lg bg-orange-500/80 hover:bg-orange-500 font-bold text-xs"
                >
                  🏆 לוח תוצאות
                </button>
              </div>

              {/* כפתורים עזרה ותרגול ממוקד */}
              <div className="w-full max-w-lg flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-cyan-500/80 hover:bg-cyan-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים אנגלית כאן?
                </button>
                <button
                  onClick={() => setShowReferenceModal(true)}
                  className="px-4 py-2 rounded-lg bg-purple-500/80 hover:bg-purple-500 text-xs font-bold text-white shadow-sm"
                >
                  📚 לוח עזרה
                </button>
                <button
                  onClick={goToParentReport}
                  className="px-4 py-2 rounded-lg bg-teal-500/80 hover:bg-teal-500 text-xs font-bold text-white shadow-sm"
                >
                  📊 דוח להורים
                </button>
                {mistakes.length > 0 && (
                  <button
                    onClick={() => setShowPracticeOptions(true)}
                    className="px-4 py-2 rounded-lg bg-pink-500/80 hover:bg-pink-500 text-xs font-bold text-white shadow-sm"
                  >
                    🎯 תרגול ממוקד ({mistakes.length})
                  </button>
                )}
              </div>

              {!playerName.trim() && (
                <p className="text-xs text-white/60 text-center mb-1">
                  הכנס את שמך כדי להתחיל
                </p>
              )}
              </div>
            </div>
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
                  className="w-full max-w-lg flex flex-col items-center justify-center mb-2 flex-1"
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
                    <div className="mb-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-200 text-sm text-center max-w-lg" dir="ltr">
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
                    <div className="w-full max-w-lg mb-3 flex flex-col items-center">
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

          {showPracticeModal && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[190] p-4"
              onClick={() => setShowPracticeModal(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-purple-400/60 rounded-2xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-1">
                    🎯 תרגול טעויות אחרונות
                  </h2>
                  <p className="text-white/70 text-sm">
                    בחר טעות אחרונה כדי לפתוח משחק ממוקד באותו נושא, כיתה ורמת קושי.
                  </p>
                </div>

                {mistakes.length === 0 ? (
                  <div className="text-center py-6 text-white/60">
                    אין טעויות פעילות כרגע. תתחיל משחק, אסוף נתונים ואז חזור לכאן.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mistakes.slice(0, 10).map((mistake, idx) => (
                      <div
                        key={`${mistake.timestamp || idx}-${idx}`}
                        className="bg-black/30 border border-white/10 rounded-xl p-3"
                        dir="rtl"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white font-semibold mb-1">
                          <span>{getTopicName(mistake.topic || "vocabulary")}</span>
                          <span className="text-white/70 text-xs">
                            {getGradeLabel(mistake.grade) || "כיתה נוכחית"} ·{" "}
                            {LEVELS[mistake.level || level]?.name || LEVELS[level].name}
                          </span>
                        </div>
                        {mistake.question && (
                          <p className="text-xs text-white/80 mb-1" dir="auto">
                            {mistake.question}
                          </p>
                        )}
                        {mistake.correctAnswer && (
                          <p className="text-xs text-emerald-300 mb-1" dir="auto">
                            תשובה נכונה: {mistake.correctAnswer}
                          </p>
                        )}
                        <button
                          onClick={() => handleMistakePractice(mistake)}
                          className="mt-2 w-full px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-xs font-bold text-white"
                        >
                          תרגל עכשיו
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowPracticeModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold text-white"
                  >
                    סגור
                  </button>
                  {mistakes.length > 0 && (
                    <button
                      onClick={clearMistakes}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-sm font-bold text-white"
                    >
                      🧹 איפוס טעויות
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showReferenceModal && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[185] p-4"
              onClick={() => setShowReferenceModal(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-blue-400/60 rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-extrabold">📚 לוח מילים אינטראקטיבי</h2>
                  <button
                    onClick={() => setShowReferenceModal(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                <p className="text-sm text-white/70 mb-3">
                  בחר קטגוריה כדי לראות מילים חשובות באנגלית ובעברית, בדיוק כמו בעזרי העזר של משחק החשבון.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {REFERENCE_CATEGORY_KEYS.map((key) => (
                    <button
                      key={key}
                      onClick={() => setReferenceCategory(key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        referenceCategory === key
                          ? "bg-blue-500/80 border-blue-300 text-white"
                          : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {REFERENCE_CATEGORIES[key].label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" dir="ltr">
                  {referenceEntries.map(([en, he]) => (
                    <div
                      key={`${referenceCategory}-${en}-${he}`}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between text-sm"
                    >
                      <span className="font-semibold">{en}</span>
                      <span className="text-white/50 mx-2">|</span>
                      <span className="text-right" dir="rtl">
                        {he}
                      </span>
                    </div>
                  ))}
                  {referenceEntries.length === 0 && (
                    <div className="text-center col-span-full text-white/60 py-4">
                      אין מילים להצגה בקטגוריה זו.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showPracticeOptions && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[188] p-4"
              onClick={() => setShowPracticeOptions(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-emerald-400/60 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-extrabold">🎛️ הגדרות תרגול חכם</h2>
                  <button
                    onClick={() => setShowPracticeOptions(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                <p className="text-sm text-white/70 mb-3">
                  כמו במשחקי החשבון והגאומטריה, ניתן לבחור כאן מצב אימון מיוחד, חיבור לשגיאות אחרונות או מעבר מדורג בין רמות.
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-white/60 font-semibold">מצב מיקוד</p>
                  {[
                    { value: "normal", label: "ברירת מחדל" },
                    { value: "mistakes", label: "חזרה על טעויות אחרונות" },
                    { value: "graded", label: "תרגול מדורג (קל → בינוני → רמתך)" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="focus-mode"
                        value={opt.value}
                        checked={focusedPracticeMode === opt.value}
                        onChange={(e) => setFocusedPracticeMode(e.target.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-white/60 font-semibold">שאלות תרגום/סיפור</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={useStoryQuestions}
                      onChange={(e) => {
                        setUseStoryQuestions(e.target.checked);
                        if (!e.target.checked) setStoryOnly(false);
                      }}
                    />
                    <span>שלב שאלות תרגום בתוך משחקי האוצר מילים/דקדוק</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={storyOnly}
                      disabled={!useStoryQuestions}
                      onChange={(e) => setStoryOnly(e.target.checked)}
                    />
                    <span>הצג רק שאלות תרגום/סיפור</span>
                  </label>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/80">
                  <div className="font-semibold mb-1">סיכום מצב נוכחי</div>
                  <p>מצב תרגול: {MODES[mode].name}</p>
                  <p>פוקוס: {PRACTICE_FOCUS_OPTIONS.find((o) => o.value === practiceFocus)?.label || ""}</p>
                  <p>מיקוד שגיאות: {focusedPracticeMode === "normal" ? "רגיל" : focusedPracticeMode === "mistakes" ? "טעויות אחרונות" : "מדורג"}</p>
                  <p>שאלות תרגום: {storyOnly ? "רק תרגום" : useStoryQuestions ? "מעורב" : "כבוי"}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowPracticeOptions(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                  >
                    סגור
                  </button>
                  <button
                    onClick={() => {
                      setFocusedPracticeMode("normal");
                      setUseStoryQuestions(false);
                      setStoryOnly(false);
                      setPracticeFocus("balanced");
                      setShowPracticeOptions(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold"
                  >
                    איפוס ברירות מחדל
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPlayerProfile && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
              onClick={() => setShowPlayerProfile(false)}
              dir="rtl"
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                style={{ scrollbarGutter: "stable" }}
              >
                <button
                  onClick={() => setShowPlayerProfile(false)}
                  className="absolute left-4 top-4 text-white/80 hover:text-white text-2xl font-bold z-10"
                  style={{ direction: "ltr" }}
                >
                  ✖
                </button>
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-2">
                    👤 פרופיל שחקן
                  </h2>
                </div>

                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">
                    {playerAvatarImage ? (
                      <img 
                        src={playerAvatarImage} 
                        alt="אווטר" 
                        className="w-24 h-24 rounded-full object-cover mx-auto"
                      />
                    ) : (
                      playerAvatar
                    )}
                  </div>
                  <div className="text-sm text-white/60 mb-3">בחר אווטר:</div>
                  
                  {/* כפתור לבחירת תמונה */}
                  <div className="mb-3">
                    <label className="block w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarImageUpload}
                        className="hidden"
                        id="avatar-image-upload-english"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById("avatar-image-upload-english").click()}
                          className="px-3 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white text-xs font-bold transition-all flex-1"
                        >
                          📷 בחר תמונה
                        </button>
                        {playerAvatarImage && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatarImage}
                            className="px-3 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold transition-all"
                          >
                            🗑️ מחק תמונה
                          </button>
                        )}
                      </div>
                    </label>
                    {playerAvatarImage && (
                      <div className="mt-2 text-xs text-white/60 text-center">
                        תמונה נבחרה ✓
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => {
                          setPlayerAvatar(avatar);
                          setPlayerAvatarImage(null);
                          try {
                            localStorage.setItem("mleo_player_avatar", avatar);
                            localStorage.removeItem("mleo_player_avatar_image");
                          } catch {
                            // ignore
                          }
                        }}
                        className={`text-3xl p-2 rounded-lg transition-all ${
                          !playerAvatarImage && playerAvatar === avatar
                            ? "bg-yellow-500/40 border-2 border-yellow-400 scale-110"
                            : "bg-black/30 border border-white/10 hover:bg-black/40"
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                    <div className="text-sm text-white/60 mb-1">שם שחקן</div>
                    <div className="text-lg font-bold text-white">{playerName || "שחקן"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">ניקוד שיא</div>
                      <div className="text-xl font-bold text-emerald-400">{bestScore}</div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">רצף שיא</div>
                      <div className="text-xl font-bold text-amber-400">{bestStreak}</div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">כוכבים</div>
                      <div className="text-xl font-bold text-yellow-400">⭐ {stars}</div>
                    </div>
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">רמה</div>
                      <div className="text-xl font-bold text-purple-400">Lv.{playerLevel}</div>
                      {/* XP Progress Bar */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                          <span>XP</span>
                          <span>{xp} / {playerLevel * 100}</span>
                        </div>
                        <div className="w-full bg-black/50 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (xp / (playerLevel * 100)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Daily Streak */}
                  <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                    <div className="text-sm text-white/60 mb-2">🔥 רצף יומי</div>
                    <div className="text-2xl font-bold text-orange-400">{dailyStreak.streak || 0} ימים</div>
                    {dailyStreak.streak >= 3 && (
                      <div className="text-xs text-white/60 mt-1">
                        {dailyStreak.streak >= 30 ? "👑 אלוף!" : dailyStreak.streak >= 14 ? "🌟 מצוין!" : dailyStreak.streak >= 7 ? "⭐ יופי!" : "🔥 המשך כך!"}
                      </div>
                    )}
                  </div>
                  
                  {/* Monthly Progress */}
                  <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                    <div className="text-sm text-white/60 mb-2">התקדמות חודשית</div>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>{Math.round(monthlyProgress.totalMinutes)} / {MONTHLY_MINUTES_TARGET} דק׳</span>
                      <span>{goalPercent}%</span>
                    </div>
                    <div className="w-full bg-black/50 rounded-full h-3 mb-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${goalPercent}%` }}
                      />
                    </div>
                    {minutesRemaining > 0 ? (
                      <div className="text-xs text-white/60">
                        נותרו עוד {Math.round(minutesRemaining)} דק׳ (~{Math.ceil(Math.round(minutesRemaining) / 60)} שעות)
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-400 font-bold">
                        🎉 השלמת את היעד החודשי!
                      </div>
                    )}
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                    <div className="text-sm text-white/60 mb-2">דיוק כללי</div>
                    <div className="text-2xl font-bold text-blue-400">{accuracy}%</div>
                    <div className="text-xs text-white/60 mt-1">
                      {correct} נכון מתוך {totalQuestions} שאלות
                    </div>
                  </div>

                  {Object.keys(progress).some((topicKey) => progress[topicKey]?.total > 0) && (
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-sm text-white/60 mb-2">התקדמות לפי נושאים</div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {Object.entries(progress)
                          .filter(([, data]) => (data?.total || 0) > 0)
                          .sort(([, a], [, b]) => (b?.total || 0) - (a?.total || 0))
                          .map(([topicKey, data]) => {
                            const topicAccuracy =
                              data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                            return (
                              <div
                                key={topicKey}
                                className="flex items-center justify-between text-xs"
                              >
                                <span className="text-white/80">{getTopicName(topicKey)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white/60">
                                    {data.correct}/{data.total}
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      topicAccuracy >= 80
                                        ? "text-emerald-400"
                                        : topicAccuracy >= 60
                                        ? "text-yellow-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {topicAccuracy}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-black/30 border border-white/10 rounded-lg p-3 mt-4">
                  <div className="text-sm text-white/60 mb-2">תגים</div>
                  {badges.length > 0 ? (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {badges.map((badge, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30"
                        >
                          <div className="text-3xl">{badge.split(" ")[0]}</div>
                          <div className="flex-1 text-white font-semibold text-lg">
                            {badge}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-white/60 text-sm py-4">
                      עדיין לא הרווחת תגים. המשך לתרגל!
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowPlayerProfile(false)}
                  className="w-full px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm"
                >
                  סגור
                </button>
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
                  <li>בחר מצב משחק: למידה, אתגר עם טיימר וחיים, מהירות או מרתון.</li>
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

          {showDailyChallenge && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
              onClick={() => setShowDailyChallenge(false)}
              dir="rtl"
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-blue-400/60 rounded-2xl p-6 max-w-md w-full text-sm text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-extrabold mb-4 text-center">
                  📅 אתגר יומי
                </h2>
                <div className="space-y-3 mb-4">
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-white/60 mb-1">שאלות היום</div>
                    <div className="text-2xl font-bold text-white">
                      {dailyChallenge.questions || 0}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-white/60 mb-1">תשובות נכונות</div>
                    <div className="text-2xl font-bold text-emerald-400">
                      {dailyChallenge.correct || 0}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-white/60 mb-1">ניקוד שיא</div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {dailyChallenge.bestScore || 0}
                    </div>
                  </div>
                  {(dailyChallenge.questions || 0) > 0 && (
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">דיוק</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {Math.round(((dailyChallenge.correct || 0) / (dailyChallenge.questions || 1)) * 100)}%
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <button
                    onClick={() => setShowDailyChallenge(false)}
                    className="px-6 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    <TrackingDebugPanel
      subjectId="english"
      uiSelection={`topic=${topic}`}
      currentQuestion={currentQuestion}
      trackingRef={englishTrackingTopicKeyRef}
    />
    </Layout>
  );
}

