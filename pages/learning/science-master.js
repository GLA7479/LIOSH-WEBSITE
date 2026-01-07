import { useState, useEffect, useRef, useCallback } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import { SCIENCE_QUESTIONS } from "../../data/science-questions";
import {
  SCIENCE_GRADES,
  SCIENCE_GRADE_ORDER,
} from "../../data/science-curriculum";
import { trackScienceTopicTime } from "../../utils/science-time-tracking";
import {
  loadDailyStreak,
  updateDailyStreak,
  getStreakReward,
} from "../../utils/daily-streak";
import { useSound } from "../../hooks/useSound";
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

// ================== CONFIG ==================

const STORAGE_KEY = "mleo_science_master";

const LEVELS = {
  easy: { name: "קל", difficulty: 1 },
  medium: { name: "בינוני", difficulty: 2 },
  hard: { name: "קשה", difficulty: 3 },
};

const MODES = {
  learning: { name: "למידה", description: "ללא סיום משחק, תרגול בקצב שלך" },
  challenge: { name: "אתגר", description: "טיימר + חיים, מרוץ ניקוד גבוה" },
  speed: { name: "מהירות", description: "תשובות מהירות = יותר נקודות! ⚡" },
  marathon: { name: "מרתון", description: "כמה שאלות תצליח ברצף? 🏃" },
  practice: { name: "תרגול", description: "בוחר נושא או מיקוד אימון ייעודי" },
};

const GRADES = SCIENCE_GRADES;
const GRADE_ORDER = SCIENCE_GRADE_ORDER;

const TOPICS = {
  body: { name: "גוף האדם", icon: "🫀" },
  animals: { name: "בעלי חיים", icon: "🐾" },
  plants: { name: "צמחים", icon: "🌿" },
  materials: { name: "חומרים", icon: "🧪" },
  earth_space: { name: "כדור הארץ והחלל", icon: "🌍" },
  environment: { name: "סביבה ואקולוגיה", icon: "🌱" },
  experiments: { name: "ניסויים ותהליכים", icon: "🔬" },
  mixed: { name: "ערבוב נושאים", icon: "🎲" },
};

const PRACTICE_FOCUS_OPTIONS = [
  { value: "balanced", label: "📚 כל הנושאים" },
  { value: "life_science", label: "🧬 מדעי החיים" },
  { value: "earth_space", label: "🌍 כדור הארץ והחלל" },
  { value: "materials_energy", label: "🧪 חומרים וניסויים" },
];

const PRACTICE_TOPIC_GROUPS = {
  balanced: null,
  life_science: ["body", "animals", "plants", "environment"],
  earth_space: ["earth_space", "environment"],
  materials_energy: ["materials", "experiments"],
};

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

const SCIENCE_MISTAKES_KEY = "mleo_science_mistakes";

const REFERENCE_SECTIONS = {
  life_science: {
    label: "מדעי החיים",
    entries: [
      { term: "מערכת הנשימה", desc: "מביאה חמצן לגוף ומוציאה פחמן דו־חמצני." },
      { term: "פוטוסינתזה", desc: "תהליך שבו הצמח מייצר מזון בעזרת אור." },
      { term: "מארג מזון", desc: "רשת של שרשראות מזון שמראות איך אנרגיה עוברת בטבע." },
      { term: "התאמות", desc: "שינויים בגוף או בהתנהגות שעוזרים לשרוד." },
    ],
  },
  earth_space: {
    label: "כדור הארץ והחלל",
    entries: [
      { term: "אטמוספרה", desc: "מעטפת הגזים שעוטפת את כדור הארץ." },
      { term: "מחזור המים", desc: "המסלול של המים בין ים, עננים ויבשה." },
      { term: "קרום כדור הארץ", desc: "השכבה החיצונית הבנויה מסלעים ולוחות טקטוניים." },
      { term: "כוכב לכת", desc: "גוף שמקיף שמש, למשל כדור הארץ או מאדים." },
    ],
  },
  materials_energy: {
    label: "חומרים ואנרגיה",
    entries: [
      { term: "מצבי צבירה", desc: "מוצק, נוזל וגז – צורות שונות של אותו חומר." },
      { term: "תערובת לעומת תרכובת", desc: "תערובת – ערבוב חומרים ללא קשר כימי, תרכובת – קשר חזק." },
      { term: "אנרגיה מתחדשת", desc: "מקורות כמו שמש ורוח שאינם נגמרים." },
      { term: "שינוי פיזיקלי", desc: "שינוי בצורה או מצב צבירה בלי יצירת חומר חדש." },
    ],
  },
};

const QUESTIONS = SCIENCE_QUESTIONS;

function getTopicLabel(key) {
  const t = TOPICS[key];
  if (!t) return key;
  return `${t.icon} ${t.name}`;
}

function loadScienceMistakesFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCIENCE_MISTAKES_KEY) || "[]";
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

// ================== QUESTION BANK ==================

// כל שאלה: נושא, כיתות מתאימות, רמת קושי, ניסוח, תשובות, הסבר, תיאוריה קצרה
// ================== QUESTION BANK ==================

// כל שאלה: נושא, כיתות מתאימות, רמת קושי, ניסוח, תשובות, הסבר, תיאוריה קצרה


// ================== HELPERS ==================

function levelAllowed(question, levelKey) {
  const order = { easy: 1, medium: 2, hard: 3 };
  const min = order[question.minLevel] || 1;
  const max = order[question.maxLevel] || 3;
  const cur = order[levelKey] || 1;
  return cur >= min && cur <= max;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTop10(saved) {
  const all = [];
  if (!saved) return [];
  Object.values(saved).forEach((arr) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((entry) => {
      if (!entry || !entry.playerName) return;
      all.push({
        name: entry.playerName,
        bestScore: entry.bestScore ?? entry.score ?? 0,
        bestStreak: entry.bestStreak ?? entry.streak ?? 0,
        timestamp: entry.timestamp || 0,
      });
    });
  });
  const sorted = all
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
      timestamp: 0,
      placeholder: true,
    });
  }
  return sorted;
}

function getHintForQuestion(q) {
  if (!q) return "";
  if (q.theoryLines && q.theoryLines.length > 0) {
    return q.theoryLines[0];
  }
  return "נסה להיזכר בהסבר שלמדת בנושא זה.";
}

function getErrorExplanationScience(question, wrongAnswer) {
  if (!question) return "";
  const correct = question.options?.[question.correctIndex];
  switch (question.topic) {
    case "body":
      return "בדוק שוב: מה תפקיד המערכת או האיבר? נסה לחשוב איך הוא עוזר לגוף.";
    case "animals":
      return "שאל את עצמך: היכן החיה חיה? מה היא אוכלת? אלו סימני זיהוי יש לה?";
    case "plants":
      return "זכור את חלקי הצמח ותפקידם: שורש, גבעול, עלים, פרחים.";
    case "materials":
      return "חשוב על מצב הצבירה ועל תכונות החומר (מוצק/נוזל/גז, מסיסות וכו').";
    case "earth_space":
      return "תזכור: לכדור הארץ יש תנועות קבועות (סיבוב סביב עצמו והקפה סביב השמש).";
    case "environment":
      return "חשב האם הפעולה עוזרת לסביבה או פוגעת בה (זיהום, בזבוז, מיחזור).";
    case "experiments":
      return "חשוב כמו מדען: מה קורה בניסוי? מי הגורם ומה התוצאה?";
    default:
      break;
  }
  return correct
    ? `נסה לחשוב שוב. רמז: התשובה הנכונה קשורה ל-"${correct}".`
    : "בדוק שוב את הנתונים ואת ההסבר שלמדת.";
}

function getSolutionStepsScience(question) {
  if (!question) return [];
  const lines = [];
  lines.push("1. קודם כל נבין את השאלה – על איזה נושא היא מדברת?");
  if (question.theoryLines && question.theoryLines.length > 0) {
    question.theoryLines.forEach((line, i) => {
      lines.push(`${i + 2}. ${line}`);
    });
  }
  const correctText =
    question.options && question.options[question.correctIndex]
      ? question.options[question.correctIndex]
      : "";
  if (correctText) {
    lines.push(
      `${lines.length + 1}. מתוך כל האפשרויות, רק "${correctText}" מתאים להסבר.`
    );
  }
  if (question.explanation) {
    lines.push(`${lines.length + 1}. סיכום: ${question.explanation}`);
  }
  return lines;
}

// ================== MAIN COMPONENT ==================

export default function ScienceMaster() {
  useIOSViewportFix();
  const router = useRouter();
  const wrapRef = useRef(null);
  const headerRef = useRef(null);
  const controlsRef = useRef(null);
  const gameRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [grade, setGrade] = useState(GRADE_ORDER[0]);
  const [mode, setMode] = useState("learning");
  const [level, setLevel] = useState("easy");
  const [topic, setTopic] = useState("body");
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [errorExplanation, setErrorExplanation] = useState("");

  const questionPoolRef = useRef([]);
  const questionIndexRef = useRef(0);
  const sessionStartRef = useRef(null);
  const sessionSecondsRef = useRef(0);
  const solvedCountRef = useRef(0);
  const yearMonthRef = useRef(getCurrentYearMonth());

  const [playerName, setPlayerName] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem("mleo_player_name") || "";
    } catch {
      return "";
    }
  });
  const [playerAvatar, setPlayerAvatar] = useState(() => {
    if (typeof window === "undefined") return "👤";
    try {
      return localStorage.getItem("mleo_player_avatar") || "👤";
    } catch {
      return "👤";
    }
  });
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [practiceFocus, setPracticeFocus] = useState("balanced");
  const [focusedPracticeMode, setFocusedPracticeMode] = useState("normal");
  const [mistakes, setMistakes] = useState([]);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showPracticeOptions, setShowPracticeOptions] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [referenceCategory, setReferenceCategory] = useState("life_science");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardLevel, setLeaderboardLevel] = useState("easy");
  const [leaderboardData, setLeaderboardData] = useState([]);
  
  // Daily Streak
  const [dailyStreak, setDailyStreak] = useState(() => loadDailyStreak("mleo_science_daily_streak"));
  const [showStreakReward, setShowStreakReward] = useState(null);
  
  // Sound system
  const sound = useSound();
  
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showBadge, setShowBadge] = useState(null);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  // progress by topic
  const [progress, setProgress] = useState({
    body: { total: 0, correct: 0 },
    animals: { total: 0, correct: 0 },
    plants: { total: 0, correct: 0 },
    materials: { total: 0, correct: 0 },
    earth_space: { total: 0, correct: 0 },
    environment: { total: 0, correct: 0 },
    experiments: { total: 0, correct: 0 },
  });
  
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  };
  
  const [dailyChallenge, setDailyChallenge] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_science_daily_challenge") || "{}");
        const todayKey = getTodayKey();
        if (saved.date === todayKey) {
          return saved;
        }
      } catch {}
    }
    return {
      date: getTodayKey(),
    questions: 0,
      correct: 0,
      bestScore: 0,
      completed: false,
    };
  });
  
  const [weeklyChallenge, setWeeklyChallenge] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_science_weekly_challenge") || "{}");
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
        if (saved.week === weekKey) {
          return saved;
        }
      } catch {}
    }
    return {
      week: getTodayKey().split('-').slice(0, 2).join('-'),
      target: 100,
      current: 0,
      completed: false,
    };
  });
  
  const [showDailyChallenge, setShowDailyChallenge] = useState(false);
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

  // ----- MOUNT -----
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    refreshMonthlyProgress();
  }, [refreshMonthlyProgress]);

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

  useEffect(() => {
    refreshMistakesList();
  }, []);

  useEffect(() => {
    return () => {
      recordSessionProgress();
    };
  }, []);

  useEffect(() => {
    const allowed = GRADES[grade]?.topics || Object.keys(TOPICS);
    if (!allowed.includes(topic)) {
      const fallback = allowed[0] || "body";
      setTopic(fallback);
    }
  }, [grade, topic]);

  // ----- LAYOUT HEIGHT -----
  useEffect(() => {
    if (!wrapRef.current || !mounted) return;
    const calc = () => {
      const rootH = window.visualViewport?.height ?? window.innerHeight;
      const headH = headerRef.current?.offsetHeight || 0;
      const controlsH = controlsRef.current?.offsetHeight || 40;
      document.documentElement.style.setProperty("--head-h", headH + "px");
      const used = headH + controlsH + 160;
      const freeH = Math.max(260, rootH - used);
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

  // ----- LOAD LONG-TERM PROGRESS -----
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY + "_progress");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.stars) setStars(saved.stars);
      if (saved.badges) setBadges(saved.badges);
      if (saved.playerLevel) setPlayerLevel(saved.playerLevel);
      if (saved.xp) setXp(saved.xp);
      if (saved.progress) setProgress(saved.progress);
    } catch {
      // ignore
    }
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

  // ----- DAILY CHALLENGE RESET -----
  useEffect(() => {
    const todayKey = getTodayKey();
    if (dailyChallenge.date !== todayKey) {
      setDailyChallenge({ 
        date: todayKey, 
        bestScore: 0, 
        questions: 0,
        correct: 0,
        completed: false,
      });
    }
    
    // Check weekly challenge reset
    const today = new Date();
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
    const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
    if (weeklyChallenge.week !== weekKey) {
      setWeeklyChallenge({
        week: weekKey,
        target: 100,
        current: 0,
        completed: false,
      });
    }
  }, [dailyChallenge.date, weeklyChallenge.week]);

  // ----- TIMER -----
  useEffect(() => {
    if (!gameActive) return;
    if (mode !== "challenge" && mode !== "speed") return;
    if (timeLeft == null) return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    const t = setTimeout(() => {
      setTimeLeft((prev) => (prev != null ? prev - 1 : prev));
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameActive, mode]);

  // ----- BEST SCORES LOAD PER LEVEL+TOPIC -----
  useEffect(() => {
    if (typeof window === "undefined" || !playerName.trim()) {
      setBestScore(0);
      setBestStreak(0);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setBestScore(0);
        setBestStreak(0);
        return;
      }
      const saved = JSON.parse(raw);
      const key = `${level}_${topic}`;
      const items = saved[key];
      if (!Array.isArray(items)) {
        setBestScore(0);
        setBestStreak(0);
        return;
      }
      const playerItems = items.filter(
        (e) => e.playerName === playerName.trim()
      );
      if (playerItems.length === 0) {
        setBestScore(0);
        setBestStreak(0);
        return;
      }
      const maxScore = Math.max(
        ...playerItems.map((s) => s.bestScore ?? s.score ?? 0),
        0
      );
      const maxStreak = Math.max(
        ...playerItems.map((s) => s.bestStreak ?? s.streak ?? 0),
        0
      );
      setBestScore(maxScore);
      setBestStreak(maxStreak);
    } catch {
      setBestScore(0);
      setBestStreak(0);
    }
  }, [level, topic, playerName]);

  // ================== GAME LOGIC ==================

  function filterQuestionsForCurrentSettings() {
    const gradeKey = grade;
    const allowedTopicsForGrade =
      GRADES[gradeKey]?.topics || Object.keys(TOPICS);
    const levelForFilter =
      focusedPracticeMode === "graded"
        ? correct < 5
          ? "easy"
          : correct < 15
          ? "medium"
          : level
        : level;

    if (focusedPracticeMode === "mistakes" && mistakes.length > 0) {
      const ids = new Set(mistakes.map((m) => m.id));
      const mistakePool = QUESTIONS.filter(
        (q) => ids.has(q.id) && levelAllowed(q, levelForFilter)
      );
      if (mistakePool.length > 0) {
        return mistakePool;
      }
    }

    let topicsList;
    if (mode === "practice" && practiceFocus !== "balanced") {
      topicsList = (PRACTICE_TOPIC_GROUPS[practiceFocus] || []).filter((t) =>
        allowedTopicsForGrade.includes(t)
      );
    } else if (topic === "mixed") {
      topicsList = allowedTopicsForGrade.filter((t) => t !== "mixed");
    } else {
      topicsList = [topic];
    }
    if (!topicsList || topicsList.length === 0) {
      topicsList =
        topic === "mixed"
          ? allowedTopicsForGrade.filter((t) => t !== "mixed")
          : [allowedTopicsForGrade[0] || "body"];
      if (!topicsList || topicsList.length === 0) {
        topicsList = ["body"];
      }
    }
    const pool = QUESTIONS.filter(
      (q) =>
        topicsList.includes(q.topic) &&
        q.grades.includes(gradeKey) &&
        levelAllowed(q, levelForFilter)
    );
    return pool;
  }

  const refreshMistakesList = () => {
    const stored = loadScienceMistakesFromStorage();
    setMistakes(stored.slice(-50).reverse());
  };

  function trackCurrentQuestionTime() {
    if (!questionStartTime) return;
    const elapsedMs = Date.now() - questionStartTime;
    if (elapsedMs <= 0) return;
    const cappedMs = Math.min(elapsedMs, 60000);
    sessionSecondsRef.current += cappedMs;
    const duration = cappedMs / 1000;
    if (duration > 0 && duration <= 300 && currentQuestion) {
      const qGrade =
        currentQuestion.assignedGrade ||
        currentQuestion.gradeKey ||
        grade;
      const qLevel =
        currentQuestion.assignedLevel ||
        currentQuestion.levelKey ||
        level;
      trackScienceTopicTime(currentQuestion.topic, qGrade, qLevel, duration);
    }
    setQuestionStartTime(null);
  }

function recordSessionProgress() {
  if (!sessionStartRef.current) return;
  trackCurrentQuestionTime();
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
  const lastTopic = currentQuestion?.topic || topic;
  addSessionProgress(durationMinutes, answered, {
    subject: "science",
    topic: lastTopic,
    grade,
    mode,
    game: "ScienceMaster",
    date: new Date(),
  });
  refreshMonthlyProgress();
  sessionStartRef.current = null;
  solvedCountRef.current = 0;
  sessionSecondsRef.current = 0;
}

  function logScienceMistakeEntry(question, wrongAnswer) {
    if (typeof window === "undefined" || !question) return;
    try {
      const entry = {
        id: question.id,
        topic: question.topic,
        grade: question.assignedGrade || question.grades?.[0] || grade,
        level: question.assignedLevel || question.minLevel || level,
        stem: question.stem,
        correct: question.options?.[question.correctIndex],
        wrong: wrongAnswer,
        timestamp: Date.now(),
      };
      const stored = loadScienceMistakesFromStorage();
      stored.push(entry);
      const trimmed = stored.slice(-50);
      localStorage.setItem(SCIENCE_MISTAKES_KEY, JSON.stringify(trimmed));
      setMistakes(trimmed.slice().reverse());
    } catch {
      // ignore
    }
  }

  function clearScienceMistakes() {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(SCIENCE_MISTAKES_KEY);
    } catch {}
    setMistakes([]);
  }

  function handleMistakePractice(entry) {
    if (!entry) return;
    const targetGrade = entry.grade || grade;
    const targetLevel = entry.level || level;
    const targetTopic = entry.topic || topic;
    setGrade(targetGrade);
    setLevel(targetLevel);
    setTopic(targetTopic);
    setMode("learning");
    setGameActive(false);
    setShowPracticeModal(false);
    setShowPracticeOptions(false);
    setTimeout(() => {
      if (playerName.trim()) {
        startGame();
      }
    }, 200);
  }

  function generateNewQuestion(resetPool = false) {
    trackCurrentQuestionTime();
    const pool = filterQuestionsForCurrentSettings();

    if (pool.length === 0) {
      questionPoolRef.current = [];
      questionIndexRef.current = 0;
      setCurrentQuestion(null);
      setFeedback(
        "אין עדיין מספיק שאלות לנושא/כיתה/רמה שבחרת. נסה לשנות הגדרה."
      );
      return;
    }

    // אם צריך לבנות מאפס את המאגר (התחלת משחק / שינוי הגדרות)
    if (resetPool || questionPoolRef.current.length === 0) {
      questionPoolRef.current = shuffleArray(pool);
      questionIndexRef.current = 0;
    }

    // אם עברנו על כל השאלות – מערבבים מחדש לסיבוב הבא
    if (questionIndexRef.current >= questionPoolRef.current.length) {
      questionPoolRef.current = shuffleArray(questionPoolRef.current);
      questionIndexRef.current = 0;
    }

    const q = questionPoolRef.current[questionIndexRef.current];
    questionIndexRef.current += 1;

    // ערבוב התשובות (options) - Fisher-Yates shuffle
    let shuffledOptions = [...(q.options || [])];
    const originalCorrectIndex = q.correctIndex;
    
    // ערבוב התשובות
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    // מציאת המיקום החדש של התשובה הנכונה
    const originalCorrectAnswer = q.options?.[originalCorrectIndex];
    const newCorrectIndex = shuffledOptions.findIndex(opt => opt === originalCorrectAnswer);

    setCurrentQuestion({
      ...q,
      options: shuffledOptions,
      correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : originalCorrectIndex,
      assignedGrade: grade,
      assignedLevel: level,
    });
    setSelectedAnswer(null);
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
    setQuestionStartTime(Date.now());
  }

  function hardResetGame() {
    trackCurrentQuestionTime();
    // Stop background music when game resets
    sound.stopBackgroundMusic();
    setGameActive(false);
    setCurrentQuestion(null);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTimeLeft(20);
    setSelectedAnswer(null);
    setFeedback(null);
    setLives(3);

    // איפוס מאגר השאלות
    questionPoolRef.current = [];
    questionIndexRef.current = 0;
    setTotalQuestions(0);
    setAvgTime(0);
    setQuestionStartTime(null);
  }

  function saveRunToStorage() {
    if (typeof window === "undefined" || !playerName.trim()) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "{}";
      const saved = JSON.parse(raw);
      const key = `${level}_${topic}`;
      const arr = Array.isArray(saved[key]) ? saved[key] : [];
      arr.push({
        playerName: playerName.trim(),
        bestScore: score,
        bestStreak: streak,
        timestamp: Date.now(),
      });
      saved[key] = arr.slice(-100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      // update best
      const top = arr.reduce(
        (acc, item) => {
          const s = item.bestScore ?? item.score ?? 0;
          const st = item.bestStreak ?? item.streak ?? 0;
          return {
            bestScore: Math.max(acc.bestScore, s),
            bestStreak: Math.max(acc.bestStreak, st),
          };
        },
        { bestScore: 0, bestStreak: 0 }
      );
      setBestScore(top.bestScore);
      setBestStreak(top.bestStreak);
      if (showLeaderboard) {
        const all = buildTop10(saved);
        setLeaderboardData(all);
      }
    } catch {
      // ignore
    }
  }

  function startGame() {
    recordSessionProgress();
    sessionStartRef.current = Date.now();
    solvedCountRef.current = 0;
    sessionSecondsRef.current = 0;
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
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
    setLives(mode === "challenge" ? 3 : 0);
    if (mode === "challenge") setTimeLeft(25);
    else if (mode === "speed") setTimeLeft(12);
    else setTimeLeft(null);

    // מאתחל מאגר שאלות חדש לסשן הזה
    generateNewQuestion(true);
  }

  function stopGame() {
    // Stop background music when game stops
    sound.stopBackgroundMusic();
    recordSessionProgress();
    saveRunToStorage();
    setGameActive(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedAnswer(null);
  }

  function handleTimeUp() {
    trackCurrentQuestionTime();
    recordSessionProgress();
    setWrong((prev) => prev + 1);
    setStreak(0);
    setFeedback("הזמן נגמר! ⏰");
    setGameActive(false);
    setCurrentQuestion(null);
    saveRunToStorage();
    setTimeout(() => {
      hardResetGame();
    }, 1800);
  }

  function handleAnswer(idx) {
    trackCurrentQuestionTime();
    if (!gameActive || !currentQuestion || selectedAnswer != null) return;
    const answerText = currentQuestion.options?.[idx];
    // update time stats
    setTotalQuestions((prev) => {
      const newTotal = prev + 1;
      if (questionStartTime) {
        const elapsed = (Date.now() - questionStartTime) / 1000;
        setAvgTime((prevAvg) =>
          prev === 0 ? elapsed : (prevAvg * prev + elapsed) / newTotal
        );
      }
      return newTotal;
    });
    setSelectedAnswer(idx);
    solvedCountRef.current += 1;
    const isCorrect = idx === currentQuestion.correctIndex;
    if (isCorrect) {
      let points = 10 + streak;
      if (mode === "speed" && timeLeft != null) {
        points += Math.floor(timeLeft * 1.5);
      }
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      setCorrect((prev) => prev + 1);
      setErrorExplanation("");
      // progress by topic
      setProgress((prev) => {
        const key = currentQuestion.topic;
        const cur = prev[key] || { total: 0, correct: 0 };
        const next = {
          total: cur.total + 1,
          correct: cur.correct + 1,
        };
        const newAll = { ...prev, [key]: next };
        persistProgress(newAll);
        return newAll;
      });
      // stars
      const newCorrect = correct + 1;
      if (newCorrect % 5 === 0) {
        setStars((prev) => {
          const s = prev + 1;
          persistProgress(null, s, null, null);
          return s;
        });
      }
      // XP
      const xpGain = hintUsed ? 5 : 10;
      setXp((prev) => {
        let newXp = prev + xpGain;
        let lv = playerLevel;
        let changed = false;
        let xpNeeded = lv * 100;
        while (newXp >= xpNeeded) {
          newXp -= xpNeeded;
          lv += 1;
          changed = true;
          xpNeeded = lv * 100;
        }
        if (changed) {
          setPlayerLevel(lv);
          setShowLevelUp(true);
          sound.playSound("level-up");
          setTimeout(() => setShowLevelUp(false), 2500);
        }
        persistProgress(null, null, lv, newXp);
        return newXp;
      });
      
      // Badges
      const newStreak = streak + 1;
      if (newStreak === 10 && !badges.includes("🔥 רצף חם")) {
        const newBadge = "🔥 רצף חם";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      } else if (newStreak === 25 && !badges.includes("⚡ מהיר כברק")) {
        const newBadge = "⚡ מהיר כברק";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      } else if (newStreak === 50 && !badges.includes("🌟 מאסטר מדעים")) {
        const newBadge = "🌟 מאסטר מדעים";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      } else if (newStreak === 100 && !badges.includes("👑 מלך המדעים")) {
        const newBadge = "👑 מלך המדעים";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      }
      
      // Badges לפי נושא
      const topicKey = currentQuestion.topic;
      const topicProgress = progress[topicKey] || { total: 0, correct: 0 };
      const newTopicCorrect = topicProgress.correct + 1;
      const topicName = TOPICS[topicKey]?.name || topicKey;
      if (newTopicCorrect === 50 && !badges.includes(`🔬 מומחה ${topicName}`)) {
        const newBadge = `🔬 מומחה ${topicName}`;
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      } else if (newTopicCorrect === 100 && !badges.includes(`🏆 גאון ${topicName}`)) {
        const newBadge = `🏆 גאון ${topicName}`;
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      }
      
      // Badges לפי ניקוד
      const newScore = score + points;
      if (newScore >= 1000 && newScore - points < 1000 && !badges.includes("💎 אלף נקודות")) {
        const newBadge = "💎 אלף נקודות";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      } else if (newScore >= 5000 && newScore - points < 5000 && !badges.includes("🎯 חמשת אלפים")) {
        const newBadge = "🎯 חמשת אלפים";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      }
      
      // Badges לפי תשובות נכונות
      if (newCorrect === 100 && correct < 100 && !badges.includes("⭐ מאה תשובות נכונות")) {
        const newBadge = "⭐ מאה תשובות נכונות";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      } else if (newCorrect === 500 && correct < 500 && !badges.includes("🌟 חמש מאות תשובות")) {
        const newBadge = "🌟 חמש מאות תשובות";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      }
      
      // daily challenge
      const todayKey = getTodayKey();
      setDailyChallenge((prev) => {
        const updated = {
          date: prev.date === todayKey ? prev.date : todayKey,
          bestScore: prev.date === todayKey ? Math.max(prev.bestScore, score + points) : score + points,
          questions: prev.date === todayKey ? prev.questions + 1 : 1,
          correct: prev.date === todayKey ? (prev.correct || 0) + 1 : 1,
          completed: false,
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("mleo_science_daily_challenge", JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      
      // weekly challenge
      setWeeklyChallenge((prev) => {
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
        const updated = {
          week: prev.week === weekKey ? prev.week : weekKey,
          target: 100,
          current: prev.week === weekKey ? prev.current + 1 : 1,
          completed: prev.week === weekKey ? (prev.current + 1 >= 100) : false,
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("mleo_science_weekly_challenge", JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
      
      setFeedback("מצוין! ✅");
      
      // Play sound - different sound for streak milestones
      if ((streak + 1) % 5 === 0 && streak + 1 >= 5) {
        sound.playSound("streak");
      } else {
        sound.playSound("correct");
      }
      
      // Update daily streak
      const updatedStreak = updateDailyStreak("mleo_science_daily_streak");
      setDailyStreak(updatedStreak);
      
      // Show streak reward if applicable
      const reward = getStreakReward(updatedStreak.streak);
      if (reward && updatedStreak.streak > (dailyStreak.streak || 0)) {
        setShowStreakReward(reward);
        setTimeout(() => setShowStreakReward(null), 3000);
      }
      
      if ("vibrate" in navigator) navigator.vibrate?.(50);
      setTimeout(() => {
        if (!gameActive) return;
        generateNewQuestion();
        if (mode === "challenge") setTimeLeft(25);
        else if (mode === "speed") setTimeLeft(12);
      }, 900);
    } else {
      setWrong((prev) => prev + 1);
      setStreak(0);
      
      // Play sound for wrong answer
      sound.playSound("wrong");
      
      setErrorExplanation(getErrorExplanationScience(currentQuestion, answerText));
      logScienceMistakeEntry(currentQuestion, answerText);
      setProgress((prev) => {
        const key = currentQuestion.topic;
        const cur = prev[key] || { total: 0, correct: 0 };
        const next = {
          total: cur.total + 1,
          correct: cur.correct,
        };
        const newAll = { ...prev, [key]: next };
        persistProgress(newAll);
        return newAll;
      });
      if ("vibrate" in navigator) navigator.vibrate?.(200);
      if (mode === "learning") {
        setFeedback("לא מדויק... ❌");
        setTimeout(() => {
          generateNewQuestion();
          setSelectedAnswer(null);
          setFeedback(null);
        }, 1600);
      } else {
        setFeedback("טעות! ❌ (-1 ❤️)");
        setLives((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setFeedback("Game Over! 💔");
            sound.playSound("game-over");
            recordSessionProgress();
            saveRunToStorage();
            setGameActive(false);
            setCurrentQuestion(null);
            setTimeout(() => {
              hardResetGame();
            }, 2000);
          } else {
            setTimeout(() => {
              generateNewQuestion();
              setSelectedAnswer(null);
              setFeedback(null);
              if (mode === "challenge") setTimeLeft(25);
              else if (mode === "speed") setTimeLeft(12);
            }, 1600);
          }
          return next;
        });
      }
    }
  }

  const saveBadge = (badge) => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
      saved.badges = [...badges, badge];
      localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
    } catch {}
  };

  function persistProgress(newProgress, newStars, newLevel, newXp) {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY + "_progress") || "{}";
      const saved = JSON.parse(raw);
      if (newProgress) saved.progress = newProgress;
      if (typeof newStars === "number") saved.stars = newStars;
      if (typeof newLevel === "number") saved.playerLevel = newLevel;
      if (typeof newXp === "number") saved.xp = newXp;
      localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
    } catch {
      // ignore
    }
  }

  function resetStats() {
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setBestScore(0);
    setBestStreak(0);
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "{}";
      const saved = JSON.parse(raw);
      const key = `${level}_${topic}`;
      delete saved[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {
      // ignore
    }
  }

  function openLeaderboard() {
    setShowLeaderboard(true);
    if (typeof window === "undefined") {
      setLeaderboardData([]);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || "{}";
      const saved = JSON.parse(raw);
      const top = buildTop10(saved);
      setLeaderboardData(top);
    } catch {
      setLeaderboardData([]);
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

  if (!mounted) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-[#050816] to-[#0b1121] flex items-center justify-center">
          <div className="text-white text-xl">טוען מדעים...</div>
        </div>
      </Layout>
    );
  }

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const referenceSection =
    REFERENCE_SECTIONS[referenceCategory] || REFERENCE_SECTIONS.life_science;
  const referenceEntries = referenceSection.entries || [];
  const allowedTopics = GRADES[grade]?.topics || Object.keys(TOPICS);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-[#050816] to-[#0b1121]" dir="rtl">
        <div
          ref={wrapRef}
          className="relative overflow-hidden game-page-mobile"
          style={{
            minHeight: "100vh",
            height: "100dvh",
            maxWidth: "1200px",
            width: "min(1200px, 100vw)",
            padding: "clamp(12px, 3vw, 32px)",
            margin: "0 auto"
          }}
        >
        {/* רקע עדין */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
        </div>

        {/* HEADER */}
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
                onClick={() => router.push("/learning/curriculum?subject=science")}
                className="min-w-[110px] px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/30"
              >
                📋 תוכנית לימודים
              </button>
            </div>
            <div className="absolute left-2 top-2 pointer-events-auto flex gap-2">
              <button
                onClick={backSafe}
                className="min-w-[60px] px-3 py-1 rounded-lg text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10"
              >
                BACK
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="relative flex flex-col items-center justify-start px-4"
          style={{
            height: "100%",
            maxHeight: "100%",
            paddingTop: "calc(var(--head-h, 56px) + 8px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
          }}
        >
          {/* TITLE */}
          <div className="text-center mb-2">
            <h1 className="text-2xl font-extrabold text-white mb-1">
              🔬 Science Master
            </h1>
            <p className="text-white/70 text-xs">
              {playerName || "שחקן"} • {GRADES[grade].name} • {LEVELS[level].name} •{" "}
              {getTopicLabel(topic)} • {MODES[mode].name}
            </p>
          </div>

          {/* TOP STATS */}
          <div
            ref={controlsRef}
            className="grid grid-cols-8 gap-0.5 mb-1 w-full max-w-md"
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
                gameActive &&
                (mode === "challenge" || mode === "speed") &&
                timeLeft != null &&
                timeLeft <= 5
                  ? "bg-red-500/30 border-2 border-red-400 animate-pulse"
                  : "bg-black/30 border border-white/10"
              }`}
            >
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">⏰ טיימר</div>
              <div
                className={`text-sm font-black leading-tight ${
                  gameActive &&
                  (mode === "challenge" || mode === "speed") &&
                  timeLeft != null &&
                  timeLeft <= 5
                    ? "text-red-400"
                    : gameActive && (mode === "challenge" || mode === "speed")
                    ? "text-yellow-300"
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
              <div className="text-lg font-bold leading-tight">{playerAvatar}</div>
            </button>
          </div>

          {/* MODES */}
          <div className="flex items-center justify-center gap-2 mb-2 w-full max-w-md overflow-x-auto flex-nowrap px-1 whitespace-nowrap">
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
            <button
              onClick={() => {
                sound.toggleSounds();
                sound.toggleMusic();
              }}
              className={`h-8 w-8 rounded-lg border border-white/20 text-white text-lg font-bold flex items-center justify-center transition-all ${
                sound.soundsEnabled && sound.musicEnabled
                  ? "bg-green-500/80 hover:bg-green-500"
                  : "bg-red-500/80 hover:bg-red-500"
              }`}
              title={sound.soundsEnabled && sound.musicEnabled ? "השתק צלילים" : "הפעל צלילים"}
            >
              {sound.soundsEnabled && sound.musicEnabled ? "🔊" : "🔇"}
            </button>
          </div>

          {showStreakReward && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none" dir="rtl">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-bounce">
                <div className="text-4xl mb-2">{showStreakReward.emoji}</div>
                <div className="text-xl font-bold">{showStreakReward.message}</div>
              </div>
            </div>
          )}

          {/* LEVEL-UP POPUP */}
          {showLevelUp && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60">
              <div className="bg-gradient-to-br from-purple-600 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-2xl text-center animate-pulse max-w-xs">
                <div className="text-4xl mb-2">🌟</div>
                <div className="text-xl font-bold mb-1">עלית רמה במדעים!</div>
                <div className="text-sm">כעת אתה ברמה {playerLevel}</div>
              </div>
            </div>
          )}

          {showRewardCelebration && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[130] p-4" dir="rtl">
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

          {/* SETUP / GAME */}
          {!gameActive ? (
            <>
              {/* PLAYER & SETTINGS */}
              <div className="flex items-center justify-center gap-1.5 mb-2 w-full max-w-md flex-wrap px-1">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlayerName(val);
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem("mleo_player_name", val);
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  placeholder="שם שחקן"
                  className="h-9 px-2 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold placeholder:text-white/40 w-[55px]"
                  maxLength={15}
                  dir={playerName && /[\u0590-\u05FF]/.test(playerName) ? "rtl" : "ltr"}
                  style={{
                    textAlign:
                      playerName && /[\u0590-\u05FF]/.test(playerName) ? "right" : "left",
                  }}
                />
                <select
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {GRADE_ORDER.map((g) => (
                    <option key={g} value={g}>
                      {GRADES[g]?.name || g}
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
                  {Object.keys(LEVELS).map((l) => (
                    <option key={l} value={l}>
                      {LEVELS[l].name}
                    </option>
                  ))}
                </select>
                <select
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold flex-1 min-w-[130px]"
                >
                  {allowedTopics.map((t) => (
                    <option key={t} value={t}>
                      {getTopicLabel(t)}
                    </option>
                  ))}
                </select>
              </div>
              {/* BEST / ACCURACY */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2 w-full max-w-md">
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
                  <div className="text-xs text-white/60">דיוק</div>
                  <div className="text-lg font-bold text-blue-400">
                    {accuracy}%
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center flex flex-col items-center justify-center">
                  <div className="text-xs text-white/60 mb-1">אתגרים</div>
                  <button
                    onClick={() => setShowDailyChallenge(true)}
                    className="h-7 px-3 rounded bg-blue-500/80 hover:bg-blue-500 text-white text-xs font-bold"
                  >
                    פתיחה
                  </button>
                </div>
              </div>

              


              <div className="bg-white/5 border border-white/10 rounded-lg p-2 mb-2 w-full max-w-md">
                <div className="flex items-center justify-between text-[11px] text-white/70 mb-0.5">
                  <span>🎁 מסע פרס חודשי</span>
                  <span>
                    {monthlyProgress.totalMinutes} / {MONTHLY_MINUTES_TARGET} דק׳
                  </span>
                </div>
                <p className="text-[11px] text-white/70 mb-0.5 text-center">
                  {minutesRemaining > 0
                    ? `נותרו עוד ${minutesRemaining} דק׳ (~${Math.ceil(
                        minutesRemaining / 60
                      )} ש׳)`
                    : "🎉 יעד הושלם! בקשו מההורה לבחור פרס."}
                </p>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
                <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                  {REWARD_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        saveRewardChoice(yearMonthRef.current, option.key);
                        setRewardChoice(option.key);
                      }}
                      className={`rounded-lg border p-2 text-[11px] bg-black/30 flex flex-col items-center gap-1 transition-all hover:scale-105 ${
                        rewardChoice === option.key
                          ? "border-emerald-400 text-emerald-200 bg-emerald-500/20"
                          : "border-white/15 text-white/70 hover:border-white/30"
                      }`}
                      style={{ transform: "scaleY(0.75)", transformOrigin: "center" }}
                    >
                      <div className="text-xl">{option.icon}</div>
                      <div className="font-bold leading-tight" dir="ltr">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-10 px-6 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  ▶️ התחל מדעים
                </button>
                <button
                  onClick={() => setShowReferenceModal(true)}
                  className="h-9 px-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-xs"
                >
                  📚 לוח מונחים
                </button>
                {mistakes.length > 0 && (
                  <button
                    onClick={() => setShowPracticeOptions(true)}
                    className="h-9 px-3 rounded-lg bg-purple-500/80 hover:bg-purple-500 font-bold text-xs"
                  >
                    🎯 תרגול ({mistakes.length})
                  </button>
                )}
                <button
                  onClick={openLeaderboard}
                  className="h-9 px-3 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-xs"
                >
                  🏆 לוח תוצאות
                </button>
              </div>

              {!playerName.trim() && (
                <p className="text-xs text-white/60 text-center mb-2">
                  הכנס שם שחקן כדי להתחיל.
                </p>
              )}

              <div className="mb-2 w-full max-w-md flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים מדעים כאן?
                </button>
                <button
                  onClick={goToParentReport}
                  className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
                >
                  📊 דוח להורים
                </button>
                {mistakes.length > 0 && (
                  <button
                    onClick={() => setShowPracticeOptions(true)}
                    className="px-4 py-2 rounded-lg bg-purple-500/80 hover:bg-purple-500 text-xs font-bold text-white shadow-sm"
                  >
                    🎯 תרגול ({mistakes.length})
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* FEEDBACK */}
              {feedback && (
                <div
                  className={`mb-2 px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                    feedback.includes("מצוין") || feedback.includes("Game Over") === false
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  <div>{feedback}</div>
                  {errorExplanation && (
                    <div className="mt-1 text-xs text-red-100/90 font-normal">
                      {errorExplanation}
                    </div>
                  )}
                </div>
              )}

              {/* מה חשוב לזכור - מחוץ ל-container */}
              {mode === "learning" && currentQuestion && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white/80 text-right w-full max-w-md" dir="rtl">
                  <div className="font-bold mb-1">📘 מה חשוב לזכור?</div>
                  <ul className="list-disc pr-4 space-y-0.5">
                    {(currentQuestion.theoryLines || []).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* QUESTION AREA */}
              <div
                ref={gameRef}
                className="w-full max-w-md flex flex-col items-center justify-center mb-2 flex-1"
                style={{
                  height: "var(--game-h, 400px)",
                  minHeight: "300px",
                }}
              >
                {/* STEM */}
                <div
                  className="text-4xl font-black text-white mb-6 text-center -mt-12"
                  style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                >
                  {currentQuestion
                    ? currentQuestion.stem
                    : "אין שאלה זמינה להגדרה זו."}
                </div>

                {/* HINT + SOLUTION BUTTONS */}
                <div className="flex gap-2 mb-2">
                  {!hintUsed && !selectedAnswer && currentQuestion && (
                    <button
                      onClick={() => {
                        setShowHint(true);
                        setHintUsed(true);
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-sm font-bold"
                    >
                      💡 רמז
                    </button>
                  )}
                  {mode === "learning" && currentQuestion && (
                    <button
                      onClick={() => setShowSolution(true)}
                      className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                    >
                      📘 הסבר מלא
                    </button>
                  )}
                </div>

                {showHint && currentQuestion && (
                  <div className="mb-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-100 text-xs text-right w-full max-w-md">
                    {getHintForQuestion(currentQuestion)}
                  </div>
                )}

                {/* ANSWERS */}
                {currentQuestion && (
                  <div className="grid grid-cols-2 gap-3 w-full mb-3">
                    {currentQuestion.options?.map((opt, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === currentQuestion.correctIndex;
                      const isWrong = isSelected && !isCorrect;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          disabled={selectedAnswer != null}
                          className={`rounded-xl border-2 px-6 py-6 text-2xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
                            isCorrect && isSelected
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : isWrong
                              ? "bg-red-500/30 border-red-400 text-red-200"
                              : selectedAnswer != null && isCorrect
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : "bg-black/30 border-white/15 text-white hover:border-white/40"
                          }`}
                          style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={stopGame}
                className="h-9 px-4 rounded-lg bg-red-500/80 hover:bg-red-500 font-bold text-sm"
              >
                ⏹️ עצור
              </button>

              {/* SOLUTION MODAL */}
              {showSolution && currentQuestion && (
                <div
                  className="fixed inset-0 z-[130] bg-black/70 flex items-center justify-center px-4"
                  onClick={() => setShowSolution(false)}
                >
                  <div
                    className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl p-4 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-emerald-100" dir="rtl">
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
                      {/* מציגים שוב את התרגיל */}
                      <p
                        className="text-base font-bold text-white mb-3"
                        style={{ textAlign: "center", direction: "rtl", unicodeBidi: "plaintext" }}
                      >
                        {(() => {
                          const q = (currentQuestion.stem || "").trim().replace(/^\?+/, "");
                          return q.endsWith("?") ? q : q + "?";
                        })()}
                      </p>
                      {/* כאן הצעדים */}
                      <div className="space-y-1 text-sm" style={{ direction: "rtl" }}>
                        {getSolutionStepsScience(currentQuestion).map(
                          (line, idx) => (
                            <div key={idx}>{line}</div>
                          )
                        )}
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
            </>
          )}

          {/* LEADERBOARD MODAL */}
          {showLeaderboard && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[140] p-4"
              onClick={() => setShowLeaderboard(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-4 max-w-md w-full max-h-[85svh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-1">
                    🏆 לוח תוצאות – מדעים
                  </h2>
                  <p className="text-white/70 text-xs">שיאים מקומיים</p>
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
                          <td colSpan={4} className="text-white/60 p-4 text-sm">
                            עדיין אין תוצאות לשמירה.
                          </td>
                        </tr>
                      ) : (
                        leaderboardData.map((row, idx) => (
                          <tr
                            key={`${row.name}-${row.timestamp}-${idx}`}
                            className={`border-b border-white/10 ${
                              row.placeholder
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
                              {row.placeholder
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
                              {row.name}
                            </td>
                            <td className="text-emerald-400 p-2 text-sm font-bold">
                              {row.bestScore}
                            </td>
                            <td className="text-amber-400 p-2 text-sm font-bold">
                              🔥{row.bestStreak}
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

          {showReferenceModal && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[160] p-4"
              onClick={() => setShowReferenceModal(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-blue-400/60 rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-extrabold">📚 לוח המושגים במדעים</h2>
                  <button
                    onClick={() => setShowReferenceModal(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                <p className="text-sm text-white/70 mb-3">
                  בחר קטגוריה כדי לחזור במהירות על נקודות מפתח – כמו דפי העזר במשחקי החשבון וההנדסה.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(REFERENCE_SECTIONS).map(([key, section]) => (
                    <button
                      key={key}
                      onClick={() => setReferenceCategory(key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        referenceCategory === key
                          ? "bg-blue-500/80 border-blue-300 text-white"
                          : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" dir="rtl">
                  {referenceEntries.map((entry, idx) => (
                    <div
                      key={`${referenceCategory}-${idx}`}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                    >
                      <div className="text-sm font-semibold mb-1">{entry.term}</div>
                      <div className="text-xs text-white/80">{entry.desc}</div>
                    </div>
                  ))}
                  {referenceEntries.length === 0 && (
                    <div className="text-center text-white/60 py-4 col-span-full">
                      אין עדיין מושגים להצגה.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showPracticeModal && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] p-4"
              onClick={() => setShowPracticeModal(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-purple-400/60 rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-extrabold">🎯 תרגול טעויות</h2>
                  <button
                    onClick={() => setShowPracticeModal(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                {mistakes.length === 0 ? (
                  <p className="text-sm text-white/70 text-center py-4">
                    עדיין אין טעויות לשמור. תרגל, טעה ולחץ כאן כדי לחזור בדיוק על מה שצריך.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {mistakes.slice(0, 10).map((item, idx) => (
                      <div
                        key={`${item.id}-${item.timestamp}-${idx}`}
                        className="bg-white/5 border border-white/10 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                          <span>{getTopicLabel(item.topic)}</span>
                          <span>
                            {GRADES[item.grade]?.name || "כיתה"} • {LEVELS[item.level]?.name || ""}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-white mb-1">
                          {item.stem}
                        </p>
                        <p className="text-xs text-emerald-300 mb-1">
                          תשובה נכונה: {item.correct}
                        </p>
                        <p className="text-xs text-rose-300">
                          התשובה שלך: {item.wrong || "—"}
                        </p>
                        <button
                          onClick={() => handleMistakePractice(item)}
                          className="mt-2 w-full px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-xs font-bold"
                        >
                          תרגל שאלה זו
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowPracticeModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold"
                  >
                    סגור
                  </button>
                  {mistakes.length > 0 && (
                    <button
                      onClick={clearScienceMistakes}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-sm font-bold"
                    >
                      🧹 איפוס טעויות
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showPracticeOptions && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[155] p-4"
              onClick={() => setShowPracticeOptions(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-emerald-400/60 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-2xl font-extrabold">🎛️ הגדרות תרגול</h2>
                  <button
                    onClick={() => setShowPracticeOptions(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                <p className="text-sm text-white/70 mb-3">
                  שלוט באימון שלך: אפשר להתרכז בטעויות, לעבור רמות באופן מדורג או לבחור קטגוריה מדעית.
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-white/60 font-semibold">מצב תרגול</p>
                  {[
                    { value: "normal", label: "ברירת מחדל" },
                    { value: "mistakes", label: "חזרה על טעויות אחרונות" },
                    { value: "graded", label: "תרגול מדורג (קל → בינוני → רמתך)" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="science-focus-mode"
                        value={opt.value}
                        checked={focusedPracticeMode === opt.value}
                        onChange={(e) => setFocusedPracticeMode(e.target.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-white/80">
                  <div className="font-semibold mb-1">מצב נוכחי</div>
                  <p>מצב: {MODES[mode].name}</p>
                  <p>
                    מיקוד:{" "}
                    {PRACTICE_FOCUS_OPTIONS.find((o) => o.value === practiceFocus)?.label ||
                      PRACTICE_FOCUS_OPTIONS[0].label}
                  </p>
                  <p>
                    רגישות טעויות:{" "}
                    {focusedPracticeMode === "normal"
                      ? "רגיל"
                      : focusedPracticeMode === "mistakes"
                      ? "חזרה על טעויות"
                      : "מדורג"}
                  </p>
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
                  <div className="text-6xl mb-3">{playerAvatar}</div>
                  <div className="text-sm text-white/60 mb-3">בחר אווטר:</div>
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => {
                          setPlayerAvatar(avatar);
                          try {
                            localStorage.setItem("mleo_player_avatar", avatar);
                          } catch {
                            // ignore
                          }
                        }}
                        className={`text-3xl p-2 rounded-lg transition-all ${
                          playerAvatar === avatar
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
                      <div className="text-xs text-white/60 mb-1">רמת מדען</div>
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
                      <span>{monthlyProgress.totalMinutes} / {MONTHLY_MINUTES_TARGET} דק׳</span>
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
                        נותרו עוד {minutesRemaining} דק׳ (~{Math.ceil(minutesRemaining / 60)} שעות)
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
                                <span className="text-white/80">{getTopicLabel(topicKey)}</span>
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
                  📘 איך לומדים מדעים כאן?
                </h2>

                <p className="text-white/80 text-xs mb-3 text-center">
                  המטרה היא לתרגל מדעים בצורה משחקית, עם התאמה לכיתה, נושא ורמת קושי.
                </p>

                <ul className="list-disc pr-4 space-y-1 text-[13px] text-white/90">
                  <li>בחר כיתה, רמה ונושא (לדוגמה: גוף האדם, צמחים, בעלי חיים ועוד).</li>
                  <li>בחר מצב משחק: למידה, אתגר עם טיימר וחיים, מהירות או מרתון.</li>
                  <li>ענה על שאלות בחירה, נכון/לא נכון ותסריטי ניסוי.</li>
                  <li>לחץ על 💡 Hint להסבר קצר, ועל "📘 הסבר מלא" כדי לראות פתרון צעד־אחר־צעד.</li>
                  <li>נסה להגיע לרצף תשובות נכון ולקבל כוכבים ו־XP.</li>
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
    </Layout>
  );
}
