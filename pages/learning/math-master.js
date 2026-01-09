import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import {
  BLANK,
  LEVELS,
  GRADE_LEVELS,
  GRADES,
  OPERATIONS,
  MODES,
  STORAGE_KEY,
} from "../../utils/math-constants";
import {
  getLevelConfig,
  getLevelForGrade,
  buildTop10ByScore,
  saveScoreEntry,
} from "../../utils/math-storage";
import { generateQuestion } from "../../utils/math-question-generator";
import {
  getHint,
  getSolutionSteps,
  getErrorExplanation,
  getAdditionStepsColumn,
  buildStepExplanation,
} from "../../utils/math-explanations";
import { trackOperationTime } from "../../utils/math-time-tracking";
import {
  buildVerticalOperation,
  convertMissingNumberEquation,
  buildAdditionOrSubtractionAnimation,
  buildAnimationForOperation,
} from "../../utils/math-animations";
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
import {
  loadDailyStreak,
  updateDailyStreak,
  getStreakReward,
} from "../../utils/daily-streak";
import { useSound } from "../../hooks/useSound";

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
  operations: { label: "פעולות חשבון", icon: "➕" },
  formulas: { label: "נוסחאות", icon: "📐" },
  terms: { label: "מונחים", icon: "📚" },
};

const REFERENCE_CATEGORY_KEYS = Object.keys(REFERENCE_CATEGORIES);

export default function MathMaster() {
  useIOSViewportFix();
  const router = useRouter();
  const wrapRef = useRef(null);
  const headerRef = useRef(null);
  const gameRef = useRef(null);
  const controlsRef = useRef(null);
  const operationSelectRef = useRef(null);
  const sessionStartRef = useRef(null);
  const solvedCountRef = useRef(0);
  const sessionSecondsRef = useRef(0);
  const yearMonthRef = useRef(getCurrentYearMonth());

  const [mounted, setMounted] = useState(false);

  // NEW: grade & mode
  const [gradeNumber, setGradeNumber] = useState(3); // 1 = כיתה א׳, 2 = ב׳, ... 6 = ו׳
  const [grade, setGrade] = useState("g3"); // g1, g2, g3, g4, g5, g6
  const [mode, setMode] = useState("learning");

  const [level, setLevel] = useState("easy");
  const [operation, setOperation] = useState("addition"); // לא mixed כברירת מחדל כדי שה-modal לא יפתח אוטומטית
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState(""); // תשובה בקלט טקסט למצבי למידה ותרגול
  const [feedback, setFeedback] = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // NEW: lives (for Challenge mode)
  const [lives, setLives] = useState(3);

  // Progress stats (אפשר להרחיב בעתיד)
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  // מניעת שאלות חוזרות
  const [recentQuestions, setRecentQuestions] = useState(new Set());

  // מצב תצוגה מאוזן/מאונך
  const [isVerticalDisplay, setIsVerticalDisplay] = useState(false);

  // מערכת כוכבים ותגים
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showBadge, setShowBadge] = useState(null);

  // מערכת רמות עם XP
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // אנימציות ומשוב חזותי
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);
  const [showWrongAnimation, setShowWrongAnimation] = useState(false);
  const [celebrationEmoji, setCelebrationEmoji] = useState("🎉");
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [playerAvatar, setPlayerAvatar] = useState("👤"); // אווטר ברירת מחדל
  const [playerAvatarImage, setPlayerAvatarImage] = useState(null); // תמונת אווטר מותאמת אישית
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

  // מערכת התקדמות אישית
  const progressLoadedRef = useRef(false); // עוקב אחרי טעינת progress
  const progressStringRef = useRef(""); // עוקב אחרי הגרסה האחרונה שנשמרה
  const [progress, setProgress] = useState({
    addition: { total: 0, correct: 0 },
    subtraction: { total: 0, correct: 0 },
    multiplication: { total: 0, correct: 0 },
    division: { total: 0, correct: 0 },
    fractions: { total: 0, correct: 0 },
    percentages: { total: 0, correct: 0 },
    sequences: { total: 0, correct: 0 },
    decimals: { total: 0, correct: 0 },
    rounding: { total: 0, correct: 0 },
    equations: { total: 0, correct: 0 },
    compare: { total: 0, correct: 0 },
    number_sense: { total: 0, correct: 0 },
    factors_multiples: { total: 0, correct: 0 },
    word_problems: { total: 0, correct: 0 },
  });

  // תחרויות יומיות
  // אתגר יומי - שאלות יומיות
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  };

  const [dailyChallenge, setDailyChallenge] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_daily_challenge") || "{}");
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
        const saved = JSON.parse(localStorage.getItem("mleo_weekly_challenge") || "{}");
        const today = new Date();
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
        if (saved.week === weekKey) {
          return saved;
        }
      } catch {}
    }
    return {
      week: getTodayKey().split('-').slice(0, 2).join('-'), // שבוע נוכחי
      target: 100, // יעד: 100 שאלות נכונות
      current: 0,
      completed: false,
    };
  });

  const [showDailyChallenge, setShowDailyChallenge] = useState(false);

  // Daily Streak
  const [dailyStreak, setDailyStreak] = useState(() => loadDailyStreak("mleo_math_daily_streak"));
  const [showStreakReward, setShowStreakReward] = useState(null);
  
  // Sound system
  const sound = useSound();
  
  // תרגול ממוקד - שמירת שגיאות ותרגול מדורג
  const [mistakes, setMistakes] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_mistakes") || "[]");
        return saved;
      } catch {}
    }
    return [];
  });
  const [focusedPracticeMode, setFocusedPracticeMode] = useState("normal"); // "normal", "mistakes", "graded"
  const [showPracticeOptions, setShowPracticeOptions] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [referenceCategory, setReferenceCategory] = useState(REFERENCE_CATEGORY_KEYS[0]);

  // רמזים
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  // הסבר מפורט לשאלה
  const [showSolution, setShowSolution] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  
  // Ref לשמירת timeouts לניקוי - מונע תקיעות
  const animationTimeoutsRef = useRef([]);
  
  // בדיקה אם התרגיל יכול להיות מאונך
  const canDisplayVertically = useMemo(() => {
    if (!currentQuestion) return false;
    const op = currentQuestion.operation;
    const params = currentQuestion.params || {};
    
    // בדיקה אם יש לנו את הנתונים הדרושים לתצוגה מאונכת
    if (op === "addition" || op === "subtraction") {
      return typeof currentQuestion.a === "number" && typeof currentQuestion.b === "number";
    }
    if (op === "multiplication") {
      return typeof currentQuestion.a === "number" && typeof currentQuestion.b === "number";
    }
    if (op === "division") {
      return (params.dividend && params.divisor) || (typeof currentQuestion.a === "number" && typeof currentQuestion.b === "number");
    }
    if (op === "decimals") {
      return params.a && params.b;
    }
    return false;
  }, [currentQuestion]);

  // פונקציה שבונה את התרגיל המאונך
  const getVerticalExercise = () => {
    if (!currentQuestion || !canDisplayVertically) return null;
    
    const op = currentQuestion.operation;
    const params = currentQuestion.params || {};
    
    if (op === "addition") {
      const a = currentQuestion.a;
      const b = currentQuestion.b;
      return buildVerticalOperation(a, b, "+");
    }
    if (op === "subtraction") {
      const a = currentQuestion.a;
      const b = currentQuestion.b;
      return buildVerticalOperation(a, b, "-");
    }
    if (op === "multiplication") {
      const a = currentQuestion.a;
      const b = currentQuestion.b;
      return buildVerticalOperation(a, b, "×");
    }
    if (op === "division") {
      const dividend = params.dividend || currentQuestion.a;
      const divisor = params.divisor || currentQuestion.b;
      return buildVerticalOperation(dividend, divisor, "÷");
    }
    if (op === "decimals") {
      const a = params.a;
      const b = params.b;
      // לעשרוניים נצטרך לוגיקה מיוחדת - בינתיים נחזיר null
      return null;
    }
    
    return null;
  };
  
  // Memoize explanation to avoid recalculating on every render
  const stepExplanation = useMemo(
    () => showSolution && currentQuestion ? buildStepExplanation(currentQuestion) : null,
    [showSolution, currentQuestion]
  );

  // בניית צעדי אנימציה
  const animationSteps = useMemo(() => {
    if (!showSolution || !currentQuestion) return null;
    
    const p = currentQuestion.params || {};
    const op = currentQuestion.operation;
    let effectiveOp = op;
    let top = p.a ?? currentQuestion.a;
    let bottom = p.b ?? currentQuestion.b;
    
    const answer = currentQuestion.correctAnswer !== undefined
      ? currentQuestion.correctAnswer
      : currentQuestion.answer;
    
    // טיפול כללי בתרגילי השלמה
    const missingConversion = convertMissingNumberEquation(op, p.kind, p);
    if (missingConversion) {
      effectiveOp = missingConversion.effectiveOp;
      top = missingConversion.top;
      bottom = missingConversion.bottom;
    }
    // טיפול במספר שלילי בחיבור (רק אם זה לא תרגיל השלמה)
    else if (op === "addition" && typeof bottom === "number" && bottom < 0) {
      effectiveOp = "subtraction";
      bottom = Math.abs(bottom);
    }
    
    // חיבור וחיסור - אנימציה מיוחדת עם תרגיל בעמודה (קוד מקורי - לא לשנות!)
    if ((effectiveOp === "addition" || effectiveOp === "subtraction") && 
        typeof top === "number" && typeof bottom === "number") {
      return buildAdditionOrSubtractionAnimation(top, bottom, answer, effectiveOp);
    }
    
    // שאר הנושאים - אנימציה כללית (רק אם זה לא חיבור/חיסור)
    return buildAnimationForOperation(currentQuestion, op, grade);
  }, [showSolution, currentQuestion, grade]);

  // אנימציה אוטומטית - עם ניקוי תקין של timeouts
  useEffect(() => {
    // ניקוי כל ה-timeouts הקודמים
    animationTimeoutsRef.current.forEach(clearTimeout);
    animationTimeoutsRef.current = [];
    
    if (!showSolution || !autoPlay || !animationSteps) return;
    if (animationStep >= animationSteps.length - 1) return;

    const id = setTimeout(() => {
      setAnimationStep((s) => s + 1);
    }, 2000); // 2 שניות בין שלבים
    
    animationTimeoutsRef.current.push(id);

    return () => {
      animationTimeoutsRef.current.forEach(clearTimeout);
      animationTimeoutsRef.current = [];
    };
  }, [showSolution, autoPlay, animationStep, animationSteps]);

  // איפוס צעד האנימציה כשפותחים את המודל או כשהשאלה משתנה
  useEffect(() => {
    // ניקוי timeouts כשסוגרים את המודל או משנים שאלה
    animationTimeoutsRef.current.forEach(clearTimeout);
    animationTimeoutsRef.current = [];
    
    if (showSolution && animationSteps && animationSteps.length > 0) {
      setAnimationStep(0);
      setAutoPlay(true);
    } else if (showSolution && (!animationSteps || animationSteps.length === 0)) {
      // אם אין אנימציה, נאפס את הצעד
      setAnimationStep(0);
    } else if (!showSolution) {
      // כשסוגרים את המודל - ניקוי מלא
      setAnimationStep(0);
      setAutoPlay(true);
    }
    
    // cleanup כשסוגרים את המודל או משנים שאלה
    return () => {
      animationTimeoutsRef.current.forEach(clearTimeout);
      animationTimeoutsRef.current = [];
    };
  }, [showSolution, animationSteps, currentQuestion]);

  useEffect(() => {
    refreshMonthlyProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // רק פעם אחת בטעינה

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

  // הסבר לטעות אחרונה
  const [errorExplanation, setErrorExplanation] = useState("");

  // תרגול ממוקד (רק במצב Practice)
  const [practiceFocus, setPracticeFocus] = useState("default"); // default | add_to_20 | times_6_8

  // מצב story questions
  const [useStoryQuestions, setUseStoryQuestions] = useState(false);
  const [storyOnly, setStoryOnly] = useState(false); // שאלות מילוליות בלבד

  // מעקב אחר עיגולים שעברו (רק לכיתה א')
  const [movedCirclesA, setMovedCirclesA] = useState(0); // כמה עיגולים עברו מ-a
  const [movedCirclesB, setMovedCirclesB] = useState(0); // כמה עיגולים עברו מ-b

  // בחירת פעולות למיקס
  const [showMixedSelector, setShowMixedSelector] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [mixedOperations, setMixedOperations] = useState({
    addition: true,
    subtraction: true,
    multiplication: false,
    division: false,
    fractions: false,
    percentages: false,
    sequences: false,
    decimals: false,
    rounding: false,
    equations: false,
    compare: false,
    number_sense: false,
    factors_multiples: false,
    word_problems: false,
  });

  const [showMultiplicationTable, setShowMultiplicationTable] = useState(false);
  const [practiceRow, setPracticeRow] = useState(null); // שורה לתרגול ממוקד
  const [practiceCol, setPracticeCol] = useState(null); // עמודה לתרגול ממוקד
  const [practiceMode, setPracticeMode] = useState(false); // מצב תרגול
  const [practiceQuestion, setPracticeQuestion] = useState(null); // שאלת תרגול
  const [practiceAnswer, setPracticeAnswer] = useState(""); // תשובת התרגול
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardLevel, setLeaderboardLevel] = useState("easy");
  const [leaderboardData, setLeaderboardData] = useState([]);
  useEffect(() => {
    if (!GRADES[grade].operations.includes("word_problems")) {
      setUseStoryQuestions(false);
      setStoryOnly(false);
    }
  }, [grade]);
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
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedCol, setSelectedCol] = useState(null);
  const [highlightedAnswer, setHighlightedAnswer] = useState(null);
  const [tableMode, setTableMode] = useState("multiplication"); // "multiplication" or "division"
  const [selectedResult, setSelectedResult] = useState(null); // For division mode
  const [selectedDivisor, setSelectedDivisor] = useState(null); // For division mode
  const [selectedCell, setSelectedCell] = useState(null); // {row, col, value}

  // טעינת אווטר מ-localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mleo_player_avatar");
      const savedImage = localStorage.getItem("mleo_player_avatar_image");
      
      if (savedImage) {
        setPlayerAvatarImage(savedImage);
        setPlayerAvatar(null);
      } else if (saved) {
        setPlayerAvatar(saved);
        setPlayerAvatarImage(null);
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
      if (typeof window !== "undefined") {
        localStorage.setItem("mleo_player_avatar_image", imageUrl);
        localStorage.removeItem("mleo_player_avatar"); // הסר אמוג'י אם נבחרה תמונה
      }
    };
    reader.readAsDataURL(file);
  };

  // טיפול במחיקת תמונת אווטר
  const handleRemoveAvatarImage = () => {
    setPlayerAvatarImage(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mleo_player_avatar_image");
      // החזר אמוג'י ברירת מחדל
      const defaultAvatar = "👤";
      setPlayerAvatar(defaultAvatar);
      localStorage.setItem("mleo_player_avatar", defaultAvatar);
    }
  };

  useEffect(() => {
    return () => {
      recordSessionProgress();
    };
  }, []);

  useEffect(() => {
    setMounted(true);

    // Load best scores for current player
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const key = `${level}_${operation}`;

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
  }, [level, operation, playerName]);

  // לוודא שהפעולה שתבחר קיימת לכיתה שנבחרה
  useEffect(() => {
    // אל תשנה אם ה-modal פתוח
    if (showMixedSelector) return;
    
    const allowed = GRADES[grade].operations;
    if (!allowed.includes(operation)) {
      // מצא את הפעולה הראשונה שזמינה (לא mixed)
      const firstAllowed = allowed.find(op => op !== "mixed") || allowed[0];
      setOperation(firstAllowed);
    }
  }, [grade]); // רק כשהכיתה משתנה, לא כשהפעולה משתנה

  // עדכון mixedOperations לפי הכיתה
  useEffect(() => {
    const availableOps = GRADES[grade].operations.filter(
      (op) => op !== "mixed"
    );
    const newMixedOps = {
      addition: availableOps.includes("addition"),
      subtraction: availableOps.includes("subtraction"),
      multiplication: availableOps.includes("multiplication"),
      division: availableOps.includes("division"),
      fractions: availableOps.includes("fractions"),
      percentages: availableOps.includes("percentages"),
      sequences: availableOps.includes("sequences"),
      decimals: availableOps.includes("decimals"),
      rounding: availableOps.includes("rounding"),
      equations: availableOps.includes("equations"),
      compare: availableOps.includes("compare"),
      number_sense: availableOps.includes("number_sense"),
      factors_multiples: availableOps.includes("factors_multiples"),
      word_problems: availableOps.includes("word_problems"),
    };
    setMixedOperations(newMixedOps);
  }, [grade]);

  // לא צריך useEffect - ה-modal נפתח ישירות ב-onChange

  // בדיקה אם זה יום חדש לתחרות יומית - רק פעם אחת בטעינה
  useEffect(() => {
    const today = new Date().toDateString();
    setDailyChallenge((prev) => {
      if (prev.date !== today) {
        return { date: today, bestScore: 0, questions: 0 };
    }
      return prev;
    });
  }, []); // רק פעם אחת בטעינה

  // לא צריך event listener - ה-modal נפתח רק ב-onChange או דרך כפתור ⚙️

  // טעינת נתונים מ-localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (progressLoadedRef.current) return; // אל תטען פעמיים
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
      if (saved.stars) setStars(saved.stars);
      if (saved.badges) setBadges(saved.badges);
      if (saved.playerLevel) setPlayerLevel(saved.playerLevel);
      if (saved.xp) setXp(saved.xp);
      if (saved.progress) {
        setProgress(saved.progress);
        // שמור את הגרסה הראשונית כדי למנוע שמירה מיותרת
        progressStringRef.current = JSON.stringify(saved.progress);
      }
      progressLoadedRef.current = true; // סמן שטענו את progress
    } catch {}
  }, []);

  // שמירת progress ל-localStorage בכל עדכון - רק אחרי טעינה ראשונית
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!progressLoadedRef.current) return; // אל תשמור לפני שהטעינה הראשונית הסתיימה
    
    const currentProgressStr = JSON.stringify(progress);
    // אם לא השתנה, אל תשמור - זה מונע לולאה אינסופית
    if (currentProgressStr === progressStringRef.current) return;
    progressStringRef.current = currentProgressStr;
    
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
      saved.progress = progress;
      localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
    } catch {}
  }, [progress]);

  // Load leaderboard data when modal opens or level changes
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

  // Dynamic layout calculation - optimized to prevent performance issues
  useEffect(() => {
    if (!wrapRef.current || !mounted) return;
    
    let resizeTimer = null;
    const calc = () => {
      // Debounce resize events to prevent excessive recalculations
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const rootH = window.innerHeight; // Use innerHeight instead of visualViewport
      const headH = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty("--head-h", headH + "px");

      const controlsH = controlsRef.current?.offsetHeight || 40;
        const used = headH + controlsH + 120 + 40;
      const freeH = Math.max(300, rootH - used);
      document.documentElement.style.setProperty("--game-h", freeH + "px");
      }, 150); // Debounce 150ms
    };
    
    // Initial calculation
    const timer = setTimeout(calc, 100);
    
    // Only listen to window resize, not visualViewport (causes too many events)
    window.addEventListener("resize", calc, { passive: true });
    
    return () => {
      clearTimeout(timer);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", calc);
    };
  }, [mounted]);

  // Timer countdown (רק במצב Challenge או Speed)
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

  // שמירת ריצה נוכחית ל־localStorage + עדכון Best & Leaderboard
  function saveRunToStorage() {
    if (typeof window === "undefined" || !playerName.trim()) return;

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const key = `${level}_${operation}`;

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
    // Stop background music when game ends
    sound.stopBackgroundMusic();
    setGameActive(false);
    setCurrentQuestion(null);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTimeLeft(20);
    setSelectedAnswer(null);
    setTextAnswer("");
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
    const levelConfig = getLevelConfig(gradeNumber, level);
    if (!levelConfig) {
      console.error("Invalid level config for grade", gradeNumber, "level", level);
      return;
    }

    let question;
    let attempts = 0;
    const maxAttempts = 50; // מקסימום ניסיונות למצוא שאלה חדשה

    const supportsWordProblems = GRADES[grade].operations.includes("word_problems");

    // ✅ התאמה לפי מצב תרגול ממוקד (Practice)
    let operationForState = operation;
    const levelConfigCopy = { ...levelConfig }; // עותק כדי לא לשנות את המקורי

    // תרגול ממוקד - חזרה על שגיאות
    if (focusedPracticeMode === "mistakes" && mistakes.length > 0) {
      // בחר שגיאה אקראית מהרשימה
      const randomMistake = mistakes[Math.floor(Math.random() * mistakes.length)];
      operationForState = randomMistake.operation;
      // נסה ליצור שאלה דומה
      if (randomMistake.grade) {
        const mistakeGrade = randomMistake.grade;
        const mistakeLevel = randomMistake.level || "easy";
        const mistakeLevelConfig = getLevelConfig(
          parseInt(mistakeGrade.replace("g", "")) || gradeNumber,
          mistakeLevel
        );
        if (mistakeLevelConfig) {
          Object.assign(levelConfigCopy, mistakeLevelConfig);
        }
      }
    }
    
    // תרגול מדורג - התחלה קל והתקדמות
    if (focusedPracticeMode === "graded") {
      // התחל עם רמה קלה יותר
      const gradedLevel = correct < 5 ? "easy" : correct < 15 ? "medium" : level;
      const gradedLevelConfig = getLevelConfig(gradeNumber, gradedLevel);
      if (gradedLevelConfig) {
        Object.assign(levelConfigCopy, gradedLevelConfig);
      }
    }

    if (mode === "practice") {
      if (practiceFocus === "add_to_20") {
        // תרגול חיבור עד 20 – מתאים בעיקר לקטנים
        operationForState = "addition";
        if (levelConfigCopy.addition) {
          levelConfigCopy.addition = {
            ...levelConfigCopy.addition,
            max: Math.min(levelConfigCopy.addition.max || 20, 20),
          };
        }
      } else if (practiceFocus === "times_6_8") {
        // תרגול טבלת כפל 6–8
        operationForState = "multiplication";
        if (levelConfigCopy.multiplication) {
          // מבטיחים שהטווח יכלול לפחות 8
          levelConfigCopy.multiplication = {
            ...levelConfigCopy.multiplication,
            max: Math.max(levelConfigCopy.multiplication.max || 8, 8),
          };
        }
      }
    }

    // עותק מקומי של recentQuestions כדי לא לעדכן state בתוך הלולאה
    const localRecentQuestions = new Set(recentQuestions);

    do {
      let opForQuestion = operationForState;
      if (supportsWordProblems) {
        if (storyOnly) {
          opForQuestion = "word_problems";
        } else if (useStoryQuestions && operation !== "word_problems") {
          opForQuestion =
            Math.random() < 0.5 ? "word_problems" : operation;
        }
      }

      question = generateQuestion(
        levelConfigCopy,
        opForQuestion,
        grade,
        opForQuestion === "mixed" ? mixedOperations : null
      );
      attempts++;

      // יצירת מפתח ייחודי לשאלה
      const questionKey = question.question;

      // אם השאלה לא הייתה לאחרונה, נשתמש בה
      if (!localRecentQuestions.has(questionKey)) {
        localRecentQuestions.add(questionKey);
        // שמירה רק על 60 שאלות אחרונות
        if (localRecentQuestions.size > 60) {
          const first = Array.from(localRecentQuestions)[0];
          localRecentQuestions.delete(first);
        }
        break;
      }
    } while (attempts < maxAttempts);

    // עדכון state רק פעם אחת אחרי הלולאה
    if (attempts >= maxAttempts) {
      console.warn(`Too many attempts (${attempts}) to generate new question, resetting recent questions`);
      // איפוס ההיסטוריה כדי לאפשר שאלות חוזרות
      setRecentQuestions(new Set());
    } else {
      setRecentQuestions(localRecentQuestions);
    }

    // מעקב זמן - סיום שאלה קודמת (אם יש)
    if (questionStartTime && currentQuestion) {
      const duration = (Date.now() - questionStartTime) / 1000; // שניות
      if (duration > 0 && duration < 300) { // רק אם זמן סביר (פחות מ-5 דקות)
        trackOperationTime(
          currentQuestion.operation,
          grade,
          level,
          duration
        );
      }
    }
    
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setTextAnswer("");
    setFeedback(null);
    setQuestionStartTime(Date.now());
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
    setIsVerticalDisplay(false); // איפוס למצב מאוזן בכל שאלה חדשה
    // איפוס עיגולים שעברו כשמשנים שאלה
    setMovedCirclesA(0);
    setMovedCirclesB(0);
  }

  function recordSessionProgress() {
    if (!sessionStartRef.current) return;
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
    const totalMinutes = Number((totalSeconds / 60000).toFixed(2));
    addSessionProgress(totalMinutes, answered, {
      subject: "math",
      topic: currentQuestion?.topic || operation,
      grade,
      mode,
      game: "MathMaster",
      date: new Date(),
    });
    refreshMonthlyProgress();
    sessionStartRef.current = null;
    solvedCountRef.current = 0;
    sessionSecondsRef.current = 0;
    setQuestionStartTime(null);
  }

  function startGame() {
    recordSessionProgress();
    sessionStartRef.current = Date.now();
    solvedCountRef.current = 0;
    sessionSecondsRef.current = 0;
    setRecentQuestions(new Set()); // איפוס ההיסטוריה
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
    setTextAnswer("");
    setLives(mode === "challenge" ? 3 : 0);
    setShowHint(false);
    setHintUsed(false);
    setShowBadge(null);
    setShowLevelUp(false);
    
    // Start background music and play game start sound
    sound.playBackgroundMusic();
    sound.playSound("game-start");
    setShowSolution(false);
    setErrorExplanation("");

    // הגדרת טיימר לפי מצב
    if (mode === "challenge") {
      setTimeLeft(20);
    } else if (mode === "speed") {
      setTimeLeft(10); // טיימר קצר יותר למצב מהירות
    } else {
      setTimeLeft(null);
    }

    generateNewQuestion();
  }

  function stopGame() {
    recordSessionProgress();
    setGameActive(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedAnswer(null);
    setTextAnswer("");
    
    // Stop background music when game stops
    sound.stopBackgroundMusic();
    
    saveRunToStorage();
  }

  function handleTimeUp() {
    // Time up – במצב Challenge או Speed
    recordSessionProgress();
    setWrong((prev) => prev + 1);
    setStreak(0);
      setFeedback("הזמן נגמר! המשחק נגמר! ⏰");
    sound.playSound("game-over");
    setGameActive(false);
    setCurrentQuestion(null);
    setTimeLeft(0);
    saveRunToStorage();

    setTimeout(() => {
      hardResetGame();
    }, 2000);
  }

  // פונקציה עזר לשמירת תג
  const saveBadge = (badge) => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
        saved.badges = [...badges, badge];
        localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
      } catch {}
    }
  };

  // פונקציות לתרגול ממוקד בלוח הכפל
  const generatePracticeQuestion = (row = null, col = null) => {
    let selectedRow = row || practiceRow;
    let selectedCol = col || practiceCol;
    
    if (selectedRow && !selectedCol) {
      // תרגול שורה - בחר עמודה אקראית
      selectedCol = Math.floor(Math.random() * 12) + 1;
    } else if (selectedCol && !selectedRow) {
      // תרגול עמודה - בחר שורה אקראית
      selectedRow = Math.floor(Math.random() * 12) + 1;
    } else if (!selectedRow && !selectedCol) {
      // תרגול אקראי
      selectedRow = Math.floor(Math.random() * 12) + 1;
      selectedCol = Math.floor(Math.random() * 12) + 1;
    }
    
    setPracticeQuestion({
      row: selectedRow,
      col: selectedCol,
      answer: selectedRow * selectedCol
    });
    setPracticeAnswer("");
  };

  const checkPracticeAnswer = () => {
    if (!practiceQuestion) return;
    
    const userAnswer = parseInt(practiceAnswer);
    const correctAnswer = practiceQuestion.answer;
    
    if (userAnswer === correctAnswer) {
      // תשובה נכונה - אנימציה והצגת שאלה חדשה
      setShowCorrectAnimation(true);
      setTimeout(() => setShowCorrectAnimation(false), 1000);
      setTimeout(() => {
        generatePracticeQuestion();
      }, 1500);
    } else {
      // תשובה שגויה - אנימציה
      setShowWrongAnimation(true);
      setTimeout(() => setShowWrongAnimation(false), 1000);
    }
  };

  function handleAnswer(answer) {
    if (selectedAnswer || !gameActive || !currentQuestion) return;

    // סטטיסטיקה – ספירת שאלה וזמן
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

    // התאמה לתשובה - טיפול במספרים ומחרוזות (כמו שברים)
    let numericAnswer;
    let isStringAnswer = false;
    
    // בדיקה אם התשובה היא מחרוזת שאינה מספר (כמו שברים: "3/4", "2 1/2")
    if (typeof answer === "string") {
      const trimmed = answer.trim();
      // אם המחרוזת מכילה שבר או תווים שאינם מספרים
      if (trimmed.includes("/") || trimmed.includes(" ") || isNaN(parseFloat(trimmed))) {
        isStringAnswer = true;
        numericAnswer = trimmed;
      } else {
        // מחרוזת מספרית - המר למספר
        const parsed = parseFloat(trimmed);
        if (isNaN(parsed)) {
          setFeedback("נא להזין מספר תקין");
          setTimeout(() => setFeedback(null), 2000);
          return;
        }
        numericAnswer = parsed;
      }
    } else {
      numericAnswer = answer;
    }
    
    // בדיקת שוויון
    let isCorrect;
    if (isStringAnswer || (typeof currentQuestion.correctAnswer === "string" && 
        (currentQuestion.correctAnswer.includes("/") || 
         currentQuestion.correctAnswer.includes(" ") || 
         isNaN(parseFloat(currentQuestion.correctAnswer))))) {
      // השוואה מחרוזת ישירה (לשברים ותשובות טקסט)
      isCorrect = String(numericAnswer).trim() === String(currentQuestion.correctAnswer).trim();
    } else {
      // השוואה מספרית
      const correctNumericAnswer = typeof currentQuestion.correctAnswer === "string" 
        ? parseFloat(currentQuestion.correctAnswer.trim()) 
        : currentQuestion.correctAnswer;
      
      isCorrect = numericAnswer === correctNumericAnswer || 
                  (typeof numericAnswer === "number" && typeof correctNumericAnswer === "number" &&
                   !isNaN(numericAnswer) && !isNaN(correctNumericAnswer) &&
                   Math.abs(numericAnswer - correctNumericAnswer) < 0.01);
    }

    setSelectedAnswer(numericAnswer);

    if (isCorrect) {
      // חישוב נקודות לפי מצב
      let points = 10 + streak;
      if (mode === "speed") {
        const timeBonus = timeLeft ? Math.floor(timeLeft * 2) : 0;
        points += timeBonus; // בונוס זמן במצב מהירות
      }
      
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      setCorrect((prev) => prev + 1);
      
      setErrorExplanation("");

      // עדכון התקדמות אישית
      const op = currentQuestion.operation;
      setProgress((prev) => ({
        ...prev,
        [op]: {
          total: (prev[op]?.total || 0) + 1,
          correct: (prev[op]?.correct || 0) + 1,
        },
      }));

      // משתנים משותפים למערכת תגים וכוכבים
      const newCorrect = correct + 1;
      const newStreak = streak + 1;
      const newScore = score + points;
      const opProgress = progress[op] || { total: 0, correct: 0 };
      const newOpCorrect = opProgress.correct + 1;

      // מערכת כוכבים - כוכב כל 5 תשובות נכונות
      if (newCorrect % 5 === 0) {
        setStars((prev) => {
          const newStars = prev + 1;
          // שמירה ל-localStorage
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

      // מערכת תגים משופרת
      
      // תגים לפי רצף
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
      } else if (newStreak === 50 && !badges.includes("🌟 מאסטר")) {
        const newBadge = "🌟 מאסטר";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      } else if (newStreak === 100 && !badges.includes("👑 מלך החשבון")) {
        const newBadge = "👑 מלך החשבון";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      }
      
      // תגים לפי פעולות ספציפיות
      const opName = getOperationName(op);
      if (newOpCorrect === 50 && !badges.includes(`🧮 מלך ה${opName}`)) {
        const newBadge = `🧮 מלך ה${opName}`;
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      } else if (newOpCorrect === 100 && !badges.includes(`🏆 גאון ה${opName}`)) {
        const newBadge = `🏆 גאון ה${opName}`;
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        sound.playSound("badge-earned");
        setTimeout(() => setShowBadge(null), 3000);
        saveBadge(newBadge);
      }
      
      // תגים לפי ניקוד
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
      
      // תגים לפי מספר תשובות נכונות
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

      // מערכת XP ורמות
      const xpGain = hintUsed ? 5 : 10; // פחות XP אם השתמש ברמז
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

      // עדכון תחרות יומית
      setDailyChallenge((prev) => ({
        ...prev,
        bestScore: Math.max(prev.bestScore, score + points),
        questions: prev.questions + 1,
      }));

      // אנימציה ותגובה חזותית לתשובה נכונה
      const emojis = ["🎉", "✨", "🌟", "💫", "⭐", "🔥", "💪", "🎊", "👏", "🏆"];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      setCelebrationEmoji(randomEmoji);
      setShowCorrectAnimation(true);
      setTimeout(() => setShowCorrectAnimation(false), 1000);
      
      // משוב דינמי לפי רצף
      let feedbackText = "נכון! ";
      if (streak + 1 >= 50) {
        feedbackText = `מדהים! רצף של ${streak + 1}! `;
      } else if (streak + 1 >= 25) {
        feedbackText = `מצוין! רצף של ${streak + 1}! `;
      } else if (streak + 1 >= 10) {
        feedbackText = `כל הכבוד! רצף של ${streak + 1}! `;
      } else if (streak + 1 >= 5) {
        feedbackText = `יופי! רצף של ${streak + 1}! `;
      }
      setFeedback(`${feedbackText}${randomEmoji}`);
      
      // Play sound - different sound for streak milestones
      if ((streak + 1) % 5 === 0 && streak + 1 >= 5) {
        sound.playSound("streak");
      } else {
        sound.playSound("correct");
      }
      
      // Update daily streak
      const updatedStreak = updateDailyStreak("mleo_math_daily_streak");
      setDailyStreak(updatedStreak);
      
      // Show streak reward if applicable
      const reward = getStreakReward(updatedStreak.streak);
      if (reward && updatedStreak.streak > (dailyStreak.streak || 0)) {
        setShowStreakReward(reward);
        setTimeout(() => setShowStreakReward(null), 3000);
      }
      
      if ("vibrate" in navigator) navigator.vibrate?.(50);
      
      // איפוס השדה הטקסט מיד אחרי תשובה נכונה
      if (mode === "learning" || mode === "practice") {
        setTextAnswer("");
      }

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
      
      // שמירת שגיאה לתרגול ממוקד
      const mistake = {
        operation: currentQuestion.operation,
        question: currentQuestion.exerciseText || `${currentQuestion.a} ${currentQuestion.operation === "addition" ? "+" : currentQuestion.operation === "subtraction" ? "-" : currentQuestion.operation === "multiplication" ? "×" : "÷"} ${currentQuestion.b}`,
        correctAnswer: currentQuestion.correctAnswer,
        wrongAnswer: numericAnswer,
        grade: grade,
        level: level,
        timestamp: Date.now(),
      };
      setMistakes((prev) => {
        const updated = [...prev, mistake].slice(-50); // שמור רק 50 שגיאות אחרונות
        if (typeof window !== "undefined") {
          localStorage.setItem("mleo_mistakes", JSON.stringify(updated));
        }
        return updated;
      });
      
      setErrorExplanation(
        getErrorExplanation(
          currentQuestion,
          currentQuestion.operation,
          numericAnswer,
          grade
        )
      );
      
      // עדכון התקדמות אישית
      const op = currentQuestion.operation;
      setProgress((prev) => ({
        ...prev,
        [op]: {
          total: (prev[op]?.total || 0) + 1,
          correct: prev[op]?.correct || 0,
        },
      }));
      
      // אנימציה ותגובה חזותית לתשובה שגויה
      setShowWrongAnimation(true);
      setTimeout(() => setShowWrongAnimation(false), 1000);
      
      // Play sound
      sound.playSound("wrong");
      
      if ("vibrate" in navigator) navigator.vibrate?.(200);

      if (mode === "learning") {
        // במצב למידה – אין Game Over, רק הצגת תשובה והמשך
        setFeedback(
          `לא נכון 😔 התשובה הנכונה: \u2066${currentQuestion.correctAnswer}\u2069 ✅`
        );
        setTimeout(() => {
          generateNewQuestion();
          setSelectedAnswer(null);
          setTextAnswer("");
          solvedCountRef.current += 1;
          setFeedback(null);
          setTimeLeft(null);
        }, 2000);
      } else {
        // מצב Challenge – עובדים עם חיים
        setFeedback(
          `לא נכון 😔 התשובה: \u2066${currentQuestion.correctAnswer}\u2069 ❌ (-1 ❤️)`
        );
        setLives((prevLives) => {
          const nextLives = prevLives - 1;

          if (nextLives <= 0) {
            // Game Over
            setFeedback("Game Over! 💔");
            sound.playSound("game-over");
            recordSessionProgress();
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
              setTextAnswer("");
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
        const key = `${level}_${operation}`;
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

  const getOperationName = (op) => {
    switch (op) {
      case "addition":
        return "חיבור";
      case "subtraction":
        return "חיסור";
      case "multiplication":
        return "כפל";
      case "division":
        return "חילוק";
      case "fractions":
        return "שברים";
      case "percentages":
        return "אחוזים";
      case "sequences":
        return "סדרות";
      case "decimals":
        return "עשרוניים";
      case "rounding":
        return "עיגול";
      case "divisibility":
        return "סימני התחלקות";
      case "prime_composite":
        return "מספרים ראשוניים ופריקים";
      case "powers":
        return "חזקות";
      case "ratio":
        return "יחס";
      case "equations":
        return "משוואות";
      case "order_of_operations":
        return "סדר פעולות";
      case "zero_one_properties":
        return "תכונות ה-0 וה-1";
      case "estimation":
        return "אומדן";
      case "scale":
        return "קנה מידה";
      case "compare":
        return "השוואה";
      case "number_sense":
        return "חוש מספרים";
      case "factors_multiples":
        return "גורמים וכפולות";
      case "word_problems":
        return "בעיות מילוליות";
      case "mixed":
        return "ערבוב";
      default:
        return op;
    }
  };

  if (!mounted)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const gradeSupportsWordProblems = GRADES[grade].operations.includes("word_problems");

  // ✅ טקסט רמז והסבר מלא לשאלה הנוכחית
  const hintText =
    currentQuestion && currentQuestion.operation
      ? getHint(currentQuestion, currentQuestion.operation, grade)
      : "";

  const solutionSteps =
    currentQuestion && currentQuestion.operation
      ? getSolutionSteps(currentQuestion, currentQuestion.params?.op || currentQuestion.operation, grade)
      : [];

  return (
    <Layout>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes celebrate {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
          100% { transform: scale(1) rotate(360deg); opacity: 0; }
        }
        .animate-celebrate {
          animation: celebrate 1s ease-out;
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928]" dir="rtl">
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
                onClick={() => router.push("/learning/curriculum?subject=math")}
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
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <h1 className="text-2xl font-extrabold text-white">
                🧮 Math Master
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
              {playerName || "שחקן"} • {GRADES[grade].name} •{" "}
              {LEVELS[level].name} • {getOperationName(operation)} •{" "}
              {MODES[mode].name}
            </p>
          </div>

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

          {/* בחירת מצב (Learning / Challenge) */}
          <div
            className="flex items-center justify-center gap-1.5 mb-2 w-full max-w-md flex-wrap px-1"
            dir="rtl"
          >
            {["learning", "challenge", "speed", "marathon", "practice"].map((m) => (
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

          {/* הודעות מיוחדות */}
          {showBadge && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none" dir="rtl">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-bounce">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-2xl font-bold">תג חדש!</div>
                <div className="text-xl">{showBadge}</div>
              </div>
            </div>
          )}

          {showStreakReward && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none" dir="rtl">
              <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-bounce">
                <div className="text-4xl mb-2">{showStreakReward.emoji}</div>
                <div className="text-xl font-bold">{showStreakReward.message}</div>
              </div>
            </div>
          )}

          {showLevelUp && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none" dir="rtl">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-pulse">
                <div className="text-4xl mb-2">🌟</div>
                <div className="text-2xl font-bold">עלית רמה!</div>
                <div className="text-base">עכשיו אתה ברמה {playerLevel}!</div>
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

          {/* פרופיל שחקן */}
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
                style={{ 
                  scrollbarGutter: "stable",
                  scrollbarWidth: "thin"
                }}
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

                {/* אווטר ונתונים בשורה */}
                <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-4xl">
                        {playerAvatarImage ? (
                          <img 
                            src={playerAvatarImage} 
                            alt="אווטר" 
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          playerAvatar
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white/60 mb-1">שם שחקן</div>
                        <div className="text-lg font-bold text-white">{playerName || "שחקן"}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/40 border border-white/10 rounded-lg p-2">
                        <div className="text-xs text-white/60 mb-1">ניקוד שיא</div>
                        <div className="text-lg font-bold text-emerald-400">{bestScore}</div>
                      </div>
                      <div className="bg-black/40 border border-white/10 rounded-lg p-2">
                        <div className="text-xs text-white/60 mb-1">רצף שיא</div>
                        <div className="text-lg font-bold text-amber-400">{bestStreak}</div>
                      </div>
                      <div className="bg-black/40 border border-white/10 rounded-lg p-2">
                        <div className="text-xs text-white/60 mb-1">כוכבים</div>
                        <div className="text-lg font-bold text-yellow-400">⭐ {stars}</div>
                      </div>
                      <div className="bg-black/40 border border-white/10 rounded-lg p-2">
                        <div className="text-xs text-white/60 mb-1">רמה</div>
                        <div className="text-lg font-bold text-purple-400">Lv.{playerLevel}</div>
                      </div>
                    </div>
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
                    <div className="mt-3">
                      <div className="text-xs text-white/60 mb-2">בחר אווטר:</div>
                      
                      {/* כפתור לבחירת תמונה */}
                      <div className="mb-3">
                        <label className="block w-full">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarImageUpload}
                            className="hidden"
                            id="avatar-image-upload"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById("avatar-image-upload").click()}
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
                      
                      <div className="grid grid-cols-6 gap-2">
                        {AVATAR_OPTIONS.map((avatar) => (
                          <button
                            key={avatar}
                            onClick={() => {
                              setPlayerAvatar(avatar);
                              setPlayerAvatarImage(null);
                              if (typeof window !== "undefined") {
                                localStorage.setItem("mleo_player_avatar", avatar);
                                localStorage.removeItem("mleo_player_avatar_image");
                              }
                            }}
                            className={`text-2xl p-1.5 rounded-lg transition-all ${
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

                  {/* התקדמות לפי פעולות */}
                  {Object.keys(progress).some(op => progress[op].total > 0) && (
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-sm text-white/60 mb-2">התקדמות לפי פעולות</div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {Object.entries(progress)
                          .filter(([_, data]) => data.total > 0)
                          .sort(([_, a], [__, b]) => b.total - a.total)
                          .map(([op, data]) => {
                            const opAccuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                            return (
                              <div key={op} className="flex items-center justify-between text-xs">
                                <span className="text-white/80">{getOperationName(op)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white/60">{data.correct}/{data.total}</span>
                                  <span className={`font-bold ${opAccuracy >= 80 ? "text-emerald-400" : opAccuracy >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                                    {opAccuracy}%
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  <div className="bg-black/30 border border-white/10 rounded-lg p-3">
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
                  className="w-full px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm mt-4"
                >
                  סגור
                </button>
              </div>
            </div>
          )}

          {/* מודל תרגול ממוקד */}
          {showPracticeOptions && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
              onClick={() => setShowPracticeOptions(false)}
              dir="rtl"
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-extrabold text-white mb-4 text-center">
                  🎯 תרגול ממוקד
                </h2>

                <div className="space-y-3 mb-4">
                  <button
                    onClick={() => {
                      setFocusedPracticeMode("mistakes");
                      setShowPracticeOptions(false);
                      if (mistakes.length > 0) {
                        setGameActive(true);
                        startGame();
                      }
                    }}
                    disabled={mistakes.length === 0}
                    className={`w-full p-4 rounded-lg border transition-all text-right ${
                      mistakes.length > 0
                        ? "bg-purple-500/20 border-purple-400/50 hover:bg-purple-500/30"
                        : "bg-gray-500/20 border-gray-400/30 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="text-lg font-bold text-white mb-1">
                      🔄 חזרה על שגיאות
                    </div>
                    <div className="text-sm text-white/70">
                      {mistakes.length > 0
                        ? `תרגל את ${mistakes.length} השגיאות שעשית`
                        : "אין שגיאות לתרגל"}
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setFocusedPracticeMode("graded");
                      setShowPracticeOptions(false);
                      setGameActive(true);
                      startGame();
                    }}
                    className="w-full p-4 rounded-lg bg-blue-500/20 border border-blue-400/50 hover:bg-blue-500/30 transition-all text-right"
                  >
                    <div className="text-lg font-bold text-white mb-1">
                      📈 תרגול מדורג
                    </div>
                    <div className="text-sm text-white/70">
                      התחל קל והתקדם לקשה יותר
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      setFocusedPracticeMode("normal");
                      setShowPracticeOptions(false);
                    }}
                    className="w-full p-4 rounded-lg bg-emerald-500/20 border border-emerald-400/50 hover:bg-emerald-500/30 transition-all text-right"
                  >
                    <div className="text-lg font-bold text-white mb-1">
                      🎮 תרגול רגיל
                    </div>
                    <div className="text-sm text-white/70">
                      חזור לתרגול רגיל
                    </div>
                  </button>
                </div>

                {mistakes.length > 0 && (
                  <div className="bg-black/30 border border-white/10 rounded-lg p-3 mb-4">
                    <div className="text-sm text-white/60 mb-2">שגיאות אחרונות:</div>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                      {mistakes.slice(-5).reverse().map((mistake, idx) => (
                        <div key={idx} className="text-xs text-white/80">
                          <span dir="ltr" style={{ display: 'inline-block' }}>{mistake.question} = {mistake.wrongAnswer}</span> ❌ (נכון: <span dir="ltr" style={{ display: 'inline-block' }}>{mistake.correctAnswer}</span>)
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setMistakes([]);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("mleo_mistakes", JSON.stringify([]));
                    }
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 font-bold text-sm mb-2"
                >
                  🗑️ נקה שגיאות
                </button>

                <button
                  onClick={() => setShowPracticeOptions(false)}
                  className="w-full px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm"
                >
                  סגור
                </button>
              </div>
            </div>
          )}

          {!gameActive ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md" dir="rtl">
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
                  className="h-9 px-2 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold placeholder:text-white/40 w-[55px]"
                  maxLength={15}
                  dir={playerName && /[\u0590-\u05FF]/.test(playerName) ? "rtl" : "ltr"}
                  style={{ textAlign: playerName && /[\u0590-\u05FF]/.test(playerName) ? "right" : "left" }}
                />
                <select
                  value={gradeNumber}
                  onChange={(e) => {
                    const newGradeNum = Number(e.target.value);
                    setGradeNumber(newGradeNum);
                    setGrade(`g${newGradeNum}`);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>
                      {`כיתה ${["א","ב","ג","ד","ה","ו"][g - 1]}`}
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
                <div className="flex items-center gap-1 min-w-[180px]">
                  <select
                    ref={operationSelectRef}
                    value={operation}
                    onChange={(e) => {
                      const newOp = e.target.value;
                      setGameActive(false);
                      if (newOp === "mixed") {
                        setOperation(newOp);
                        setShowMixedSelector(true);
                      } else {
                        setOperation(newOp);
                        setShowMixedSelector(false);
                      }
                    }}
                    className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold flex-1"
                  >
                    {GRADES[grade].operations.map((op) => (
                      <option key={op} value={op}>
                        {getOperationName(op)}
                      </option>
                    ))}
                  </select>
                  {operation === "mixed" && (
                    <button
                      onClick={() => setShowMixedSelector(true)}
                      className="h-9 w-9 rounded-lg bg-blue-500/80 hover:bg-blue-500 border border-white/20 text-white text-xs font-bold flex items-center justify-center"
                      title="ערוך פעולות למיקס"
                    >
                      ⚙️
                    </button>
                  )}
                </div>
              </div>

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
                  <div className="text-xs text-white/60">Accuracy</div>
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
              
              <div className="bg-white/5 border border-white/10 rounded-lg px-1.5 pt-1.5 pb-0 mb-1 w-full max-w-md">
                <div className="flex items-center justify-between text-[10px] text-white/70 mb-0.5">
                  <span>🎁 מסע פרס חודשי</span>
                  <span>
                    {Math.round(monthlyProgress.totalMinutes)} / {MONTHLY_MINUTES_TARGET} דק׳
                  </span>
                </div>
                <p className="text-[10px] text-white/70 mb-0.5 text-center">
                  {minutesRemaining > 0
                    ? `נותרו עוד ${Math.round(minutesRemaining)} דק׳ (~${Math.ceil(
                        Math.round(minutesRemaining) / 60
                      )} ש׳)`
                    : "🎉 יעד הושלם! בקשו מההורה לבחור פרס."}
                </p>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${goalPercent}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                  {REWARD_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        saveRewardChoice(yearMonthRef.current, option.key);
                        setRewardChoice(option.key);
                      }}
                      className={`rounded-lg border p-2.5 text-xs bg-black/30 flex flex-col items-center gap-1.5 transition-all hover:scale-105 ${
                        rewardChoice === option.key
                          ? "border-emerald-400 text-emerald-200 bg-emerald-500/20"
                          : "border-white/15 text-white/70 hover:border-white/30"
                      }`}
                      style={{ transform: "scaleY(0.85)", transformOrigin: "center" }}
                    >
                      <div className="text-2xl">{option.icon}</div>
                      <div className="font-bold leading-tight" dir="ltr">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-1.5 mb-2 w-full max-w-md flex-wrap px-1">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-9 px-4 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-xs"
                >
                  ▶️ התחל
                </button>
                <button
                  onClick={() => setShowMultiplicationTable(true)}
                  className="h-9 px-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-xs"
                >
                  📊 לוח כפל
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="h-9 px-3 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-xs"
                >
                  🏆 לוח תוצאות
                </button>
              </div>

              {/* כפתורים עזרה ותרגול ממוקד */}
              <div className="mb-2 w-full max-w-md flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים חשבון כאן?
                </button>
                <button
                  onClick={() => setShowReferenceModal(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 text-xs font-bold text-white shadow-sm"
                >
                  📚 לוח עזרה
                </button>
                <button
                  onClick={() => router.push("/learning/parent-report")}
                  className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
                >
                  📊 דוח להורים
                </button>
                {mistakes.length > 0 && (
                  <button
                    onClick={() => setShowPracticeOptions(true)}
                    className="px-4 py-2 rounded-lg bg-purple-500/80 hover:bg-purple-500 text-xs font-bold text-white shadow-sm"
                  >
                    🎯 תרגול ממוקד ({mistakes.length})
                  </button>
                )}
              </div>

              {!playerName.trim() && (
                <p className="text-xs text-white/60 text-center mb-2">
                  הכנס את שמך כדי להתחיל
                </p>
              )}
            </>
          ) : (
            <>
              {/* אנימציה לתשובה נכונה */}
              {showCorrectAnimation && (
                <div className="fixed inset-0 pointer-events-none z-[300] flex items-center justify-center">
                  <div className="text-8xl animate-bounce animate-pulse">
                    {celebrationEmoji}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl animate-ping opacity-75">
                      ✨
                    </div>
                  </div>
                </div>
              )}

              {/* אנימציה לתשובה שגויה */}
              {showWrongAnimation && (
                <div className="fixed inset-0 pointer-events-none z-[300] flex items-center justify-center">
                  <div className="text-6xl animate-shake">
                    😔
                  </div>
                </div>
              )}

              {feedback && (
                <div
                  className={`mb-2 px-4 py-2 rounded-lg text-sm font-semibold text-center transition-all duration-300 ${
                    showCorrectAnimation
                      ? "bg-emerald-500/40 text-emerald-100 scale-110 shadow-lg shadow-emerald-500/50"
                      : showWrongAnimation
                      ? "bg-red-500/40 text-red-100 scale-105 shadow-lg shadow-red-500/50"
                      : feedback.includes("נכון") ||
                        feedback.includes("∞") ||
                        feedback.includes("Start")
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  <div className="text-lg">{feedback}</div>
                  {errorExplanation && (
                    <div className="mt-1 text-xs text-red-100/90 font-normal">
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
                  {/* ויזואליזציה של מספרים (כיתות א'-ג') */}
                  {(grade === "g1" || grade === "g2" || grade === "g3") && (currentQuestion.operation === "addition" || currentQuestion.operation === "subtraction") && (
                    <div className="mb-4 flex gap-6 items-center justify-center flex-wrap" style={{ direction: "ltr" }}>
                      {/* הגדרת מגבלות לפי כיתה */}
                      {(() => {
                        const maxVisual = grade === "g1" ? 10 : grade === "g2" ? 20 : 30;
                        const showVisual = currentQuestion.a <= maxVisual && currentQuestion.b <= maxVisual;
                        if (!showVisual) return null;
                        
                        const maxA = Math.min(currentQuestion.a, maxVisual);
                        const maxB = Math.min(currentQuestion.b, maxVisual);
                        let remainingA;
                        
                        if (currentQuestion.operation === "subtraction") {
                          // בחיסור - העיגולים הכחולים שנותרו (לפני שעברו לאחר הסימן שווה)
                          if (movedCirclesB >= maxB) {
                            // כל ה-b הורדו, אז כל העיגולים הכחולים עברו לאחר הסימן שווה
                            remainingA = 0;
                          } else {
                            // עדיין יש עיגולים ירוקים, אז העיגולים הכחולים שנותרו = a - movedCirclesB
                            remainingA = Math.max(0, maxA - movedCirclesB);
                          }
                        } else {
                          // בחיבור - העיגולים שנותרו אחרי שעברו
                          remainingA = maxA - movedCirclesA;
                        }
                        
                        return (
                          <>
                            <div className="flex flex-wrap gap-3 justify-center max-w-[200px] min-w-[120px]">
                              {Array(remainingA)
                                .fill(0)
                                .map((_, i) => (
                                  <span
                                    key={`a-${i}`}
                                    onClick={() => {
                                      if (currentQuestion.operation === "addition") {
                                        // בחיבור - עיגול עובר לאחר הסימן שווה
                                        if (movedCirclesA < maxA) {
                                          setMovedCirclesA(prev => prev + 1);
                                        }
                                      } else {
                                        // בחיסור - לחיצה על עיגול מ-a מורידה עיגול מ-b (והעיגול הכחול עצמו נמחק)
                                        if (movedCirclesB < maxB) {
                                          setMovedCirclesB(prev => prev + 1);
                                        }
                                      }
                                    }}
                                    className="inline-block bg-blue-500 rounded-full cursor-pointer hover:bg-blue-400 active:bg-blue-600 transition-all duration-300 touch-manipulation hover:scale-110 active:scale-95 animate-pulse-glow ring-2 ring-blue-300 ring-opacity-75"
                                    style={{ 
                                      userSelect: "none", 
                                      width: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                      height: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                      minWidth: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                      minHeight: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                      animation: "none"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.animation = "bounce 0.3s ease";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.animation = "none";
                                    }}
                                  />
                                ))}
                            </div>
                            <span className="text-white text-3xl font-bold min-w-[40px] text-center">
                              {currentQuestion.operation === "addition" ? "+" : "−"}
                            </span>
                            <div className="flex flex-wrap gap-3 justify-center max-w-[200px] min-w-[120px]">
                              {Array(Math.min(currentQuestion.b, maxVisual) - movedCirclesB)
                                .fill(0)
                                .map((_, i) => (
                                  <span
                                    key={`b-${i}`}
                                    onClick={() => {
                                      if (currentQuestion.operation === "addition") {
                                        // בחיבור - עיגול עובר לאחר הסימן שווה
                                        if (movedCirclesB < Math.min(currentQuestion.b, maxVisual)) {
                                          setMovedCirclesB(prev => prev + 1);
                                        }
                                      }
                                      // בחיסור - לא ניתן ללחוץ על עיגולים מ-b
                                    }}
                                    className={`inline-block rounded-full ${
                                      currentQuestion.operation === "addition" 
                                        ? "bg-green-500 cursor-pointer hover:bg-green-400 active:bg-green-600 transition-all duration-300 hover:scale-110 active:scale-95 animate-pulse-glow-green ring-2 ring-green-300 ring-opacity-75" 
                                        : "bg-green-500"
                                    } touch-manipulation`}
                                    style={{ 
                                      userSelect: "none",
                                      width: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                      height: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                      minWidth: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                      minHeight: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                      animation: currentQuestion.operation === "addition" ? "none" : "none"
                                    }}
                                    onMouseEnter={(e) => {
                                      if (currentQuestion.operation === "addition") {
                                        e.currentTarget.style.animation = "bounce 0.3s ease";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.animation = "none";
                                    }}
                                  />
                                ))}
                            </div>
                            <span className="text-white text-3xl font-bold min-w-[40px] text-center">=</span>
                            {/* עיגולים שעברו מאחורי הסימן שווה */}
                            {(() => {
                              const maxVisual = grade === "g1" ? 10 : grade === "g2" ? 20 : 30;
                              const showResult = (movedCirclesA > 0 || movedCirclesB > 0 || (currentQuestion.operation === "subtraction" && movedCirclesB >= Math.min(currentQuestion.b, maxVisual)));
                              if (!showResult) return null;
                              
                              return (
                                <div className="flex flex-wrap gap-3 justify-center max-w-[200px] min-w-[120px]">
                                  {currentQuestion.operation === "addition" ? (
                                    // בחיבור - כל העיגולים שעברו
                                    Array(movedCirclesA + movedCirclesB)
                                      .fill(0)
                                      .map((_, i) => (
                                        <span
                                          key={`result-${i}`}
                                          className={`inline-block rounded-full transition-all duration-300 ${
                                            i < movedCirclesA ? "bg-blue-500" : "bg-green-500"
                                          }`}
                                          style={{ 
                                            width: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                            height: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                            minWidth: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                            minHeight: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                            animation: "fadeIn 0.5s ease-in"
                                          }}
                                        />
                                      ))
                                  ) : (
                                    // בחיסור - העיגולים שנותרו מ-a אחרי שהורידנו את כל ה-b
                                    movedCirclesB >= Math.min(currentQuestion.b, maxVisual) && 
                                    Array(Math.max(0, Math.min(currentQuestion.a, maxVisual) - movedCirclesB))
                                      .fill(0)
                                      .map((_, i) => (
                                        <span
                                          key={`result-${i}`}
                                          className="inline-block bg-blue-500 rounded-full transition-all duration-300"
                                          style={{ 
                                            width: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                            height: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                            minWidth: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                            minHeight: grade === "g1" ? "24px" : grade === "g2" ? "20px" : "18px",
                                            animation: "fadeIn 0.5s ease-in"
                                          }}
                                        />
                                      ))
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>
                  )}
                  
                  {/* הפרדה בין שורת השאלה לשורת התרגיל */}
                  {currentQuestion.exerciseText ? (
                    <div
                      className={`relative w-full mb-2 pr-2 ${
                        canDisplayVertically ? "pl-16 pt-8" : "pl-2 pt-0"
                      }`}
                    >
                      {canDisplayVertically && (
                        <button
                          onClick={() => setIsVerticalDisplay((prev) => !prev)}
                          className="absolute top-2 left-2 z-10 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/80 hover:bg-purple-500 text-white transition-all pointer-events-auto shadow-lg"
                          title={isVerticalDisplay ? "הצג מאוזן" : "הצג מאונך"}
                        >
                          {isVerticalDisplay ? "↔️ מאוזן" : "↕️ מאונך"}
                        </button>
                      )}

                      {currentQuestion.questionLabel && (
                        <p
                          className="text-2xl text-center text-white mb-2 break-words overflow-wrap-anywhere max-w-full"
                          style={{
                            direction: currentQuestion.isStory ? "rtl" : "rtl",
                            unicodeBidi: "plaintext",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                          }}
                        >
                          {currentQuestion.questionLabel}
                        </p>
                      )}

                      {/* תצוגת התרגיל - מאוזן או מאונך */}
                      {isVerticalDisplay && canDisplayVertically ? (
                        <div className="mb-4 flex justify-center w-full max-w-full px-2">
                          <pre
                            className="text-3xl text-center text-white font-bold font-mono whitespace-pre break-words overflow-wrap-anywhere max-w-full"
                            style={{
                              direction: "ltr",
                              unicodeBidi: "plaintext",
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                            }}
                          >
                            {getVerticalExercise() || currentQuestion.exerciseText}
                          </pre>
                        </div>
                      ) : (
                        <p
                          className={`text-4xl text-center text-white font-bold mb-4 break-words overflow-wrap-anywhere max-w-full px-2 ${
                            currentQuestion.operation === "sequences" ? "whitespace-normal" : ""
                          }`}
                          style={{
                            direction: "ltr",
                            unicodeBidi: "plaintext",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                          }}
                        >
                          {currentQuestion.exerciseText}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div
                      className="text-4xl font-black text-white mb-4 text-center break-words overflow-wrap-anywhere max-w-full px-2"
                      style={{
                        direction: currentQuestion.isStory ? "rtl" : "ltr",
                        unicodeBidi: "plaintext",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {currentQuestion.question}
                    </div>
                  )}
                  

                  {/* בדיקה אם צריך להציג כפתורי בחירה או שדה קלט */}
                  {(() => {
                    // נושאים שצריכים כפתורי בחירה: שברים, יחס, השוואה, קנה מידה, גורמים וכפולות
                    const needsChoiceButtons = 
                      currentQuestion.operation === "fractions" ||
                      currentQuestion.operation === "ratio" ||
                      currentQuestion.operation === "scale" ||
                      currentQuestion.operation === "compare" ||
                      currentQuestion.operation === "factors_multiples" ||
                      // בדיקה אם יש תשובות שאינן מספרים
                      (currentQuestion.answers && currentQuestion.answers.some(ans => {
                        if (typeof ans === "string") {
                          // בדיקה אם המחרוזת מכילה שבר או תווים שאינם מספרים
                          return ans.includes("/") || ans.includes(" ") || isNaN(parseFloat(ans));
                        }
                        return false;
                      })) ||
                      // בדיקה אם התשובה הנכונה היא מחרוזת שאינה מספר
                      (typeof currentQuestion.correctAnswer === "string" && 
                       (currentQuestion.correctAnswer.includes("/") || 
                        currentQuestion.correctAnswer.includes(" ") || 
                        isNaN(parseFloat(currentQuestion.correctAnswer))));

                    // מצבים שצריכים כפתורי בחירה: challenge, speed, marathon, או נושאים מיוחדים
                    const shouldShowChoiceButtons = 
                      mode === "challenge" || 
                      mode === "speed" || 
                      mode === "marathon" || 
                      needsChoiceButtons;

                    if (shouldShowChoiceButtons) {
                      // כפתורי בחירה
                      // בנושא השוואה - 3 עמודות, כפתורים קטנים יותר
                      const isCompare = currentQuestion.operation === "compare";
                      const gridCols = isCompare ? "grid-cols-3" : "grid-cols-2";
                      const buttonPadding = isCompare ? "px-3 py-3" : "px-6 py-6";
                      const buttonText = isCompare ? "text-lg" : "text-2xl";
                      
                      return (
                        <div className={`grid ${gridCols} gap-3 w-full mb-3`}>
                          {currentQuestion.answers.map((answer, idx) => {
                            const isSelected = selectedAnswer === answer;
                            const isCorrect = answer === currentQuestion.correctAnswer;
                            const isWrong = isSelected && !isCorrect;

                            return (
                              <button
                                key={idx}
                                onClick={() => handleAnswer(answer)}
                                disabled={!!selectedAnswer}
                                className={`rounded-xl border-2 ${buttonPadding} ${buttonText} font-bold transition-all active:scale-95 disabled:opacity-50 ${
                                  isCorrect && isSelected
                                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                                    : isWrong
                                    ? "bg-red-500/30 border-red-400 text-red-200"
                                    : selectedAnswer &&
                                      answer === currentQuestion.correctAnswer
                                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                                    : "bg-black/30 border-white/15 text-white hover:border-white/40"
                                }`}
                              >
                                {answer}
                              </button>
                            );
                          })}
                        </div>
                      );
                    } else if ((mode === "learning" || mode === "practice") && !practiceMode) {
                      // שדה קלט טקסט למצבי למידה ותרגול
                      return (
                        <div className="mb-4 p-4 rounded-lg bg-blue-500/20 border border-blue-400/50">
                          <div className="text-center mb-3">
                            <input
                              type="number"
                              value={textAnswer}
                              onChange={(e) => setTextAnswer(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !selectedAnswer && textAnswer.trim() !== "") {
                                  handleAnswer(textAnswer);
                                }
                              }}
                              placeholder="תשובה"
                              disabled={!!selectedAnswer}
                              className="w-full max-w-[300px] px-4 py-4 rounded-lg bg-black/40 border border-white/20 text-white text-2xl font-bold text-center disabled:opacity-50"
                              autoFocus
                            />
                          </div>
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => {
                                if (!selectedAnswer && textAnswer.trim() !== "") {
                                  handleAnswer(textAnswer);
                                }
                              }}
                              disabled={!!selectedAnswer || textAnswer.trim() === ""}
                              className="px-6 py-3 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              בדוק
                            </button>
                            {selectedAnswer && (
                              <button
                                onClick={() => {
                                  setSelectedAnswer(null);
                                  setTextAnswer("");
                                  setFeedback(null);
                                  generateNewQuestion();
                                }}
                                className="px-6 py-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-lg"
                              >
                                שאלה הבאה
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      // ברירת מחדל - כפתורי בחירה
                      // בנושא השוואה - 3 עמודות, כפתורים קטנים יותר
                      const isCompare = currentQuestion.operation === "compare";
                      const gridCols = isCompare ? "grid-cols-3" : "grid-cols-2";
                      const buttonPadding = isCompare ? "px-3 py-3" : "px-6 py-6";
                      const buttonText = isCompare ? "text-lg" : "text-2xl";
                      
                      return (
                        <div className={`grid ${gridCols} gap-3 w-full mb-3`}>
                          {currentQuestion.answers.map((answer, idx) => {
                            const isSelected = selectedAnswer === answer;
                            const isCorrect = answer === currentQuestion.correctAnswer;
                            const isWrong = isSelected && !isCorrect;

                            return (
                              <button
                                key={idx}
                                onClick={() => handleAnswer(answer)}
                                disabled={!!selectedAnswer}
                                className={`rounded-xl border-2 ${buttonPadding} ${buttonText} font-bold transition-all active:scale-95 disabled:opacity-50 ${
                                  isCorrect && isSelected
                                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                                    : isWrong
                                    ? "bg-red-500/30 border-red-400 text-red-200"
                                    : selectedAnswer &&
                                      answer === currentQuestion.correctAnswer
                                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                                    : "bg-black/30 border-white/15 text-white hover:border-white/40"
                                }`}
                              >
                                {answer}
                              </button>
                            );
                          })}
                        </div>
                      );
                    }
                  })()}

                  {/* רמז + הסבר + למה טעיתי */}
                  {currentQuestion && (
                    <div className="mt-3 flex flex-col gap-2 w-full">
                      {/* כפתורי רמז/הסבר */}
                      <div className="flex gap-2 justify-center flex-wrap" dir="rtl">
                        {mode === "learning" && (
                          <button
                            onClick={() => setShowSolution((prev) => !prev)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/80 hover:bg-emerald-500 text-white"
                          >
                            📖 הסבר צעד־אחר־צעד
                          </button>
                        )}
                        <button
                          onClick={() => setShowHint((prev) => !prev)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/80 hover:bg-blue-500 text-white"
                        >
                          💡 רמז
                        </button>
                  </div>

                  {/* כפתור חיבור לטבלת כפל/חילוק – רק במצב למידה */}
                  {mode === "learning" &&
                    (currentQuestion.operation === "multiplication" ||
                      currentQuestion.operation === "division") && (
                          <div className="flex justify-center">
                      <button
                        onClick={() => {
                          setShowMultiplicationTable(true);
                          setTableMode(
                            currentQuestion.operation === "multiplication"
                              ? "multiplication"
                              : "division"
                          );
                          if (currentQuestion.operation === "multiplication") {
                            const a = currentQuestion.a;
                            const b = currentQuestion.b;
                            if (a >= 1 && a <= 12 && b >= 1 && b <= 12) {
                              const value = a * b;
                              setSelectedCell({ row: a, col: b, value });
                              setSelectedRow(null);
                              setSelectedCol(null);
                              setSelectedResult(null);
                              setSelectedDivisor(null);
                            }
                          } else {
                            const { a, b } = currentQuestion;
                            const value = a;
                            if (b >= 1 && b <= 12) {
                              setSelectedCell({ row: 1, col: b, value });
                              setSelectedResult(value);
                              setSelectedDivisor(b);
                              setSelectedRow(null);
                              setSelectedCol(null);
                            }
                          }
                        }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/80 hover:bg-blue-500 text-white"
                      >
                              📊 הצג בטבלה
                      </button>
                          </div>
                        )}

                      {/* תיבת רמז */}
                      {showHint && hintText && (
                        <div className="w-full max-w-md mx-auto bg-blue-500/10 border border-blue-400/50 rounded-lg p-2 text-right">
                          <div className="text-[11px] text-blue-300 mb-1">רמז</div>
                          <div className="text-xs text-blue-100 leading-relaxed">{hintText}</div>
                        </div>
                      )}

                      {/* חלון הסבר מלא - Modal גדול ומרכזי - רק במצב למידה */}
                      {mode === "learning" && showSolution && currentQuestion && (() => {
                        const p = currentQuestion.params || {};
                        const op = currentQuestion.operation;
                        let effectiveOp = op;
                        let aEff = p.a ?? currentQuestion.a;
                        let bEff = p.b ?? currentQuestion.b;
                        
                        // טיפול כללי בתרגילי השלמה
                        const missingConversion = convertMissingNumberEquation(op, p.kind, p);
                        if (missingConversion) {
                          effectiveOp = missingConversion.effectiveOp;
                          aEff = missingConversion.top;
                          bEff = missingConversion.bottom;
                        }
                        // טיפול במספר שלילי בחיבור (רק אם זה לא תרגיל השלמה)
                        else if (op === "addition" && typeof bEff === "number" && bEff < 0) {
                          effectiveOp = "subtraction";
                          bEff = Math.abs(bEff);
                        }
                        
                        const answer = currentQuestion.correctAnswer !== undefined
                          ? currentQuestion.correctAnswer
                          : currentQuestion.answer;
                        
                        // בדיקה אם יש תצוגה מאונכת - חיבור, חיסור, כפל, חילוק, עשרוניים
                        const hasAnimation = (effectiveOp === "addition" || effectiveOp === "subtraction" || 
                                             effectiveOp === "multiplication" || effectiveOp === "division" ||
                                             op === "decimals") && 
                                            typeof aEff === "number" && typeof bEff === "number";
                        
                        // מודל עם אנימציה - בדיקה ראשונית
                        if (!animationSteps || !Array.isArray(animationSteps) || animationSteps.length === 0) {
                          // אין אנימציה - חזרה למודל הישן
                          const info = stepExplanation;
                          if (!info) return null;
                          
                          return (
                            <div
                              className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center px-4"
                              onClick={() => setShowSolution(false)}
                            >
                              <div
                                className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl w-[390px] h-[450px] shadow-2xl flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                                style={{ maxWidth: "90vw", maxHeight: "90vh" }}
                              >
                                {/* כותרת - קבועה */}
                                <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
                                  <h3 className="text-lg font-bold text-emerald-100" dir="rtl">
                                    {"\u200Fאיך פותרים את התרגיל?"}
                                  </h3>
                                  <button
                                    onClick={() => setShowSolution(false)}
                                    className="text-emerald-200 hover:text-white text-xl leading-none px-2"
                                  >
                                    ✖
                                  </button>
                                </div>
                                
                                {/* תוכן - גלילה */}
                                <div className="flex-1 overflow-y-auto px-4 pb-2 text-sm text-emerald-50" dir="rtl">
                                  <div
                                    className="mb-2 font-semibold text-base text-center text-white break-words overflow-wrap-anywhere max-w-full px-2"
                                    style={{ 
                                      direction: "ltr", 
                                      unicodeBidi: "plaintext",
                                      wordBreak: "break-word",
                                      overflowWrap: "break-word",
                                    }}
                                  >
                                    {info.exercise || currentQuestion.exerciseText || currentQuestion.question}
                                  </div>
                                  {info.vertical && (
                                    <div className="mb-3 rounded-lg bg-emerald-900/50 px-3 py-2">
                                      <pre
                                        dir="ltr"
                                        className="text-center font-mono text-base leading-relaxed whitespace-pre text-emerald-100"
                                      >
                                        {info.vertical}
                                      </pre>
                                    </div>
                                  )}
                                  <div className="space-y-1.5 text-sm" dir="rtl">
                                    {info.steps.map((step, idx) => (
                                      <div key={idx} className="text-emerald-50 leading-relaxed">
                                        {step}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* כפתורים - קבועים בתחתית */}
                                <div className="p-4 pt-2 flex justify-center flex-shrink-0 border-t border-emerald-400/20">
                                  <button
                                    onClick={() => setShowSolution(false)}
                                    className="px-6 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                                  >
                                    סגור
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // וודא ש-animationStep בטווח תקין
                        const safeStepIndex = Math.max(0, Math.min(animationStep || 0, animationSteps.length - 1));
                        const activeStep = animationSteps[safeStepIndex];
                        
                        if (!activeStep) {
                          return null;
                        }
                        
                        // תצוגה מאונכת - חיבור, חיסור, כפל, חילוק, עשרוניים
                        if (hasAnimation) {
                          // קביעת הערכים לפי סוג הפעולה
                          let aVal = aEff;
                          let bVal = bEff;
                          let answerVal = answer;
                          let opSymbol = effectiveOp === "addition" ? "+" : 
                                        effectiveOp === "subtraction" ? "−" : 
                                        effectiveOp === "multiplication" ? "×" : 
                                        effectiveOp === "division" ? "÷" : "";
                          
                          // טיפול בעשרוניים
                          if (op === "decimals" && currentQuestion.params) {
                            const p = currentQuestion.params;
                            aVal = p.a;
                            bVal = p.b;
                            answerVal = answer;
                            opSymbol = p.kind === "dec_add" ? "+" : "−";
                          }
                          
                          // טיפול בכפל
                          if (effectiveOp === "multiplication" && currentQuestion.params) {
                            aVal = currentQuestion.params.a;
                            bVal = currentQuestion.params.b;
                            answerVal = answer;
                            opSymbol = "×";
                          }
                          
                          // טיפול בחילוק
                          if (effectiveOp === "division" && currentQuestion.params) {
                            aVal = currentQuestion.params.dividend;
                            bVal = currentQuestion.params.divisor;
                            answerVal = currentQuestion.params.quotient || answer;
                            opSymbol = "÷";
                          }
                          
                          // פונקציה לפיצול ספרות עם padding
                          const splitDigits = (num, minLength = 1) => {
                            const s = String(Math.abs(num)).padStart(minLength, " ");
                            return s.split("");
                          };
                          
                          // טיפול בעשרוניים - צריך לטפל בנקודה העשרונית
                          const isDecimal = op === "decimals";
                          let aStr = isDecimal ? aVal.toFixed(2) : String(aVal);
                          let bStr = isDecimal ? bVal.toFixed(2) : String(bVal);
                          let answerStr = isDecimal ? answerVal.toFixed(2) : String(answerVal);
                          
                          // חישוב אורך מקסימלי (כולל נקודה עשרונית)
                          const maxLen = Math.max(
                            aStr.length,
                            bStr.length,
                            answerStr.length
                          );
                          
                          const aDigits = aStr.padStart(maxLen, " ").split("");
                          const bDigits = bStr.padStart(maxLen, " ").split("");
                          const resDigitsFull = answerStr.padStart(maxLen, " ").split("");
                          
                          // חישוב כמה ספרות לחשוף לפי הצעד הנוכחי
                          const revealCount = (activeStep && typeof activeStep.revealDigits === "number") 
                            ? activeStep.revealDigits 
                            : 0;
                          
                          // יצירת מערך ספרות תוצאה חלקי - רק הספרות החשופות
                          const visibleResultDigits = resDigitsFull.map((d, idx) => {
                            const fromRight = maxLen - 1 - idx; // 0 = ספרת אחדות (מימין)
                            if (fromRight < revealCount) {
                              return d.trim() || "\u00A0";
                            }
                            // ספרות לא חשופות - רווח
                            return "\u00A0";
                          });
                          
                          const isHighlighted = (key) => {
                            if (!activeStep || !activeStep.highlights || !Array.isArray(activeStep.highlights)) {
                              return false;
                            }
                            return activeStep.highlights.includes(key);
                          };
                          
                          // חיבור וחיסור - הקוד המקורי בדיוק כמו שהיה
                          return (
                            <div
                              className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center px-4"
                              onClick={() => setShowSolution(false)}
                              dir="rtl"
                            >
                              <div
                                className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl w-[390px] h-[450px] shadow-2xl flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                                style={{ maxWidth: "90vw", maxHeight: "90vh" }}
                              >
                                {/* כותרת - קבועה */}
                                <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
                                  <button
                                    onClick={() => setShowSolution(false)}
                                    className="text-emerald-200 hover:text-white text-xl leading-none px-2"
                                  >
                                    ✖
                                  </button>
                                  <h3 className="text-lg font-bold text-emerald-100">
                                    {"\u200Fאיך פותרים את התרגיל?"}
                                  </h3>
                                </div>
                                
                                {/* תוכן - גלילה */}
                                <div className="flex-1 overflow-y-auto px-4 pb-2">
                                  {/* תצוגת התרגיל המאונך עם הדגשות - טבלה */}
                                  <div className="mb-4 flex flex-col items-center font-mono text-2xl leading-[1.8]" style={{ direction: "ltr" }}>
                                    {/* שורה 1 – המספר הראשון (תא ריק במקום סימן הפעולה) */}
                                    <div 
                                      className="grid gap-x-1 mb-1"
                                      style={{ 
                                        gridTemplateColumns: `auto repeat(${maxLen}, 1.5ch)`
                                      }}
                                    >
                                      <span className="w-4" /> {/* תא ריק במקום סימן הפעולה */}
                                      {aDigits.map((d, idx) => {
                                        const pos = maxLen - idx - 1; // מיקום מהסוף (0 = אחדות, 1 = עשרות וכו')
                                        const highlightKey = pos === 0 ? "Units" : pos === 1 ? "Tens" : "Hundreds";
                                        const shouldHighlight = isHighlighted("aAll") || 
                                                              (pos === 0 && isHighlighted("aUnits")) ||
                                                              (pos === 1 && isHighlighted("aTens")) ||
                                                              (pos === 2 && isHighlighted("aHundreds"));
                                        return (
                                          <span
                                            key={`a-${idx}`}
                                            className={`text-center font-bold ${
                                              shouldHighlight ? "bg-yellow-500/30 rounded px-1 animate-pulse" : ""
                                            }`}
                                          >
                                            {d.trim() || "\u00A0"}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    
                                    {/* שורה 2 – סימן הפעולה והמספר השני */}
                                    <div 
                                      className="grid gap-x-1 mb-1"
                                      style={{ 
                                        gridTemplateColumns: `auto repeat(${maxLen}, 1.5ch)`
                                      }}
                                    >
                                      <span className="w-4 text-center text-2xl font-bold">
                                        {opSymbol}
                                      </span>
                                      {bDigits.map((d, idx) => {
                                        const pos = maxLen - idx - 1;
                                        const highlightKey = pos === 0 ? "Units" : pos === 1 ? "Tens" : "Hundreds";
                                        const shouldHighlight = isHighlighted("bAll") || 
                                                              (pos === 0 && isHighlighted("bUnits")) ||
                                                              (pos === 1 && isHighlighted("bTens")) ||
                                                              (pos === 2 && isHighlighted("bHundreds"));
                                        return (
                                          <span
                                            key={`b-${idx}`}
                                            className={`text-center font-bold ${
                                              shouldHighlight ? "bg-yellow-500/30 rounded px-1 animate-pulse" : ""
                                            }`}
                                          >
                                            {d.trim() || "\u00A0"}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    
                                    {/* קו תחתון */}
                                    <div 
                                      className="h-[2px] bg-white my-2"
                                      style={{ width: `${(maxLen + 1) * 1.5}ch` }}
                                    />
                                    
                                    {/* שורה 3 – התוצאה (חשיפה הדרגתית) */}
                                    <div 
                                      className="grid gap-x-1"
                                      style={{ 
                                        gridTemplateColumns: `auto repeat(${maxLen}, 1.5ch)`
                                      }}
                                    >
                                      <span className="w-4" /> {/* תא ריק */}
                                      {visibleResultDigits.map((d, idx) => {
                                        const pos = maxLen - idx - 1;
                                        const fromRight = pos; // 0 = אחדות, 1 = עשרות וכו'
                                        const isVisible = fromRight < revealCount;
                                        const highlightKey = pos === 0 ? "Units" : pos === 1 ? "Tens" : "Hundreds";
                                        const shouldHighlight = isVisible && (
                                          isHighlighted("resultAll") || 
                                          (pos === 0 && isHighlighted("resultUnits")) ||
                                          (pos === 1 && isHighlighted("resultTens")) ||
                                          (pos === 2 && isHighlighted("resultHundreds"))
                                        );
                                        return (
                                          <span
                                            key={`r-${idx}`}
                                            className={`text-center font-bold ${
                                              shouldHighlight ? "bg-yellow-500/30 rounded px-1 animate-pulse" : ""
                                            }`}
                                          >
                                            {d}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  
                                  {/* טקסט ההסבר */}
                                  <div className="mb-4 text-sm text-emerald-50" dir="rtl">
                                    <h4 className="font-bold text-base mb-1">{activeStep.title}</h4>
                                    <p className="leading-relaxed">{activeStep.text}</p>
                                  </div>
                                </div>
                                
                                {/* כפתורים ואינדיקטור - קבועים בתחתית */}
                                <div className="p-4 pt-2 flex flex-col gap-2 flex-shrink-0 border-t border-emerald-400/20">
                                  {/* שליטה באנימציה */}
                                  <div className="flex gap-2 justify-center items-center" dir="rtl">
                                    <button
                                      onClick={() => setAnimationStep((s) => (s > 0 ? s - 1 : 0))}
                                      disabled={animationStep === 0}
                                      className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                    >
                                      קודם
                                    </button>
                                    <button
                                      onClick={() => setAutoPlay((p) => !p)}
                                      className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-sm font-bold"
                                    >
                                      {autoPlay ? "עצור" : "נגן"}
                                    </button>
                                    <button
                                      onClick={() => setAnimationStep((s) => (s < animationSteps.length - 1 ? s + 1 : s))}
                                      disabled={animationStep >= animationSteps.length - 1}
                                      className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                    >
                                      הבא
                                    </button>
                                  </div>
                                  
                                  {/* אינדיקטור צעדים */}
                                  <div className="text-center text-xs text-emerald-300">
                                    צעד {animationStep + 1} מתוך {animationSteps.length}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // שאר הנושאים - אנימציה כללית עם כפתורי ניווט
                        return (
                          <div
                            className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center px-4"
                            onClick={() => setShowSolution(false)}
                            dir="rtl"
                          >
                            <div
                              className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl w-[390px] h-[450px] shadow-2xl flex flex-col"
                              onClick={(e) => e.stopPropagation()}
                              style={{ maxWidth: "90vw", maxHeight: "90vh" }}
                            >
                              {/* כותרת - קבועה */}
                              <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
                                <button
                                  onClick={() => setShowSolution(false)}
                                  className="text-emerald-200 hover:text-white text-xl leading-none px-2"
                                >
                                  ✖
                                </button>
                                <h3 className="text-lg font-bold text-emerald-100">
                                  {"\u200Fאיך פותרים את התרגיל?"}
                                </h3>
                              </div>
                              
                              {/* תוכן - גלילה */}
                              <div className="flex-1 overflow-y-auto px-4 pb-2">
                                {/* הצגת התרגיל/שאלה */}
                                <div className="mb-3 rounded-lg bg-emerald-900/50 px-3 py-2" dir="rtl">
                                  <div className="text-sm text-emerald-100 font-semibold mb-1 break-words overflow-wrap-anywhere max-w-full">
                                    {currentQuestion.exerciseText || currentQuestion.question}
                                  </div>
                                </div>
                                
                                {/* טקסט ההסבר */}
                                <div className="mb-4 text-sm text-emerald-50" dir="rtl">
                                  <h4 className="font-bold text-base mb-1">{activeStep.title || "הסבר"}</h4>
                                  <p className="leading-relaxed">{activeStep.text || ""}</p>
                                </div>
                              </div>
                              
                              {/* כפתורים ואינדיקטור - קבועים בתחתית */}
                              <div className="p-4 pt-2 flex flex-col gap-2 flex-shrink-0 border-t border-emerald-400/20">
                                {/* שליטה באנימציה */}
                                <div className="flex gap-2 justify-center items-center" dir="rtl">
                                  <button
                                    onClick={() => setAnimationStep((s) => (s > 0 ? s - 1 : 0))}
                                    disabled={animationStep === 0}
                                    className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                  >
                                    קודם
                                  </button>
                                  <button
                                    onClick={() => setAutoPlay((p) => !p)}
                                    className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-sm font-bold"
                                  >
                                    {autoPlay ? "עצור" : "נגן"}
                                  </button>
                                  <button
                                    onClick={() => setAnimationStep((s) => (s < animationSteps.length - 1 ? s + 1 : s))}
                                    disabled={animationStep >= animationSteps.length - 1}
                                    className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                  >
                                    הבא
                                  </button>
                                </div>
                                
                                {/* אינדיקטור צעדים */}
                                <div className="text-center text-xs text-emerald-300">
                                  צעד {animationStep + 1} מתוך {animationSteps.length}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* למה טעיתי? – רק אחרי טעות */}
                      {errorExplanation && (
                        <div className="w-full max-w-md mx-auto bg-rose-500/10 border border-rose-400/50 rounded-lg p-2 text-right">
                          <div className="text-[11px] text-rose-300 mb-1">למה הטעות קרתה?</div>
                          <div className="text-xs text-rose-100 leading-relaxed">
                            {errorExplanation}
                          </div>
                        </div>
                      )}
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

          {/* Multiplication Table Modal */}
          {showMultiplicationTable && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => {
                  setShowMultiplicationTable(false);
                  setSelectedRow(null);
                  setSelectedCol(null);
                  setHighlightedAnswer(null);
                  setTableMode("multiplication");
                  setSelectedResult(null);
                  setSelectedDivisor(null);
                  setSelectedCell(null);
                }}
              />
              <div className="relative w-full max-w-md max-h-[80svh] overflow-y-auto bg-gradient-to-b from-[#0a0f1d] to-[#141928] rounded-2xl border-2 border-white/20 shadow-2xl">
                <div className="sticky top-0 bg-gradient-to-b from-[#0a0f1d] to-[#141928] border-b border-white/10 px-4 py-3 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowMultiplicationTable(false);
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setTableMode("multiplication");
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                      }}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center"
                    >
                      ×
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                      }}
                      className="px-2 py-1 rounded text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
                    >
                      איפוס
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    📊 לוח הכפל
                  </h2>
                </div>
                <div className="p-4">
                  {/* Mode toggle */}
                  <div className="mb-4 flex gap-2 justify-center flex-wrap" dir="rtl">
                    <button
                      onClick={() => {
                        setTableMode("division");
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                        setPracticeMode(false);
                        setPracticeQuestion(null);
                        setPracticeAnswer("");
                      }}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        tableMode === "division"
                          ? "bg-purple-500/80 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      ÷ חילוק
                    </button>
                    <button
                      onClick={() => {
                        setTableMode("multiplication");
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                        setPracticeMode(false);
                        setPracticeQuestion(null);
                        setPracticeAnswer("");
                      }}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        tableMode === "multiplication"
                          ? "bg-blue-500/80 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      × כפל
                    </button>
                    <button
                      onClick={() => {
                        setPracticeMode(!practiceMode);
                        if (!practiceMode) {
                          generatePracticeQuestion();
                        } else {
                          setPracticeQuestion(null);
                          setPracticeAnswer("");
                          setPracticeRow(null);
                          setPracticeCol(null);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        practiceMode
                          ? "bg-emerald-500/80 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      🎯 תרגול
                    </button>
                  </div>

                  {/* מצב תרגול */}
                  {practiceMode && practiceQuestion && (
                    <div className="mb-4 p-4 rounded-lg bg-emerald-500/20 border border-emerald-400/50">
                      <div className="text-center mb-3">
                        <div className="text-2xl font-bold text-white mb-2">
                          {practiceQuestion.row} × {practiceQuestion.col} = ?
                        </div>
                        <input
                          type="number"
                          value={practiceAnswer}
                          onChange={(e) => setPracticeAnswer(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              checkPracticeAnswer();
                            }
                          }}
                          placeholder="הכנס תשובה"
                          className="w-full max-w-[200px] px-4 py-2 rounded-lg bg-black/40 border border-white/20 text-white text-xl font-bold text-center"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={checkPracticeAnswer}
                          className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm"
                        >
                          בדוק
                        </button>
                        <button
                          onClick={() => generatePracticeQuestion()}
                          className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                        >
                          שאלה חדשה
                        </button>
                      </div>
                    </div>
                  )}

                  {/* בחירת שורה/עמודה לתרגול ממוקד */}
                  {practiceMode && !practiceQuestion && (
                    <div className="mb-4 p-4 rounded-lg bg-blue-500/20 border border-blue-400/50">
                      <div className="text-center mb-3">
                        <div className="text-sm text-white/80 mb-2">בחר שורה או עמודה לתרגול:</div>
                        <div className="flex gap-2 justify-center flex-wrap">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                setPracticeRow(num);
                                setPracticeCol(null);
                                generatePracticeQuestion(num, null);
                              }}
                              className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                                practiceRow === num
                                  ? "bg-yellow-500/80 text-white"
                                  : "bg-white/10 text-white/70 hover:bg-white/20"
                              }`}
                            >
                              שורה {num}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 justify-center flex-wrap mt-2">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                setPracticeCol(num);
                                setPracticeRow(null);
                                generatePracticeQuestion(null, num);
                              }}
                              className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                                practiceCol === num
                                  ? "bg-yellow-500/80 text-white"
                                  : "bg-white/10 text-white/70 hover:bg-white/20"
                              }`}
                            >
                              עמודה {num}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            setPracticeRow(null);
                            setPracticeCol(null);
                            generatePracticeQuestion();
                          }}
                          className="mt-2 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm"
                        >
                          תרגול אקראי
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Result window */}
                  <div className="mb-3 min-h-[30px] w-full flex items-center justify-center">
                    {tableMode === "division" &&
                      selectedCell &&
                      (selectedRow || selectedCol) &&
                      selectedResult &&
                      selectedDivisor &&
                      selectedResult % selectedDivisor !== 0 && (
                        <div className="w-full px-4 py-1 rounded-lg bg-red-500/20 border border-red-400/50 text-center flex items-center justify-center gap-2">
                          <span className="text-sm text-red-200 font-semibold">
                            ⚠️ שגיאה: {selectedResult} ÷ {selectedDivisor} הוא
                            לא מספר שלם!
                          </span>
                          <span className="text-xs text-red-300">
                            (
                            {Math.floor(selectedResult / selectedDivisor)}{" "}
                            שארית {selectedResult % selectedDivisor})
                          </span>
                        </div>
                      )}

                    {tableMode === "multiplication" &&
                      selectedCell &&
                      (selectedRow || selectedCol) && (
                        <div
                          className={`w-full px-4 py-1 rounded-lg border text-center flex items-center justify-center gap-3 ${
                            (selectedRow || selectedCell.row) *
                              (selectedCol || selectedCell.col) ===
                            selectedCell.value
                              ? "bg-emerald-500/20 border-emerald-400/50"
                              : "bg-red-500/20 border-red-400/50"
                          }`}
                        >
                          <span className="text-base text-white/80">
                            {selectedRow || selectedCell.row} ×{" "}
                            {selectedCol || selectedCell.col} =
                          </span>
                          <span
                            className={`text-xl font-bold ${
                              (selectedRow || selectedCell.row) *
                                (selectedCol || selectedCell.col) ===
                              selectedCell.value
                                ? "text-emerald-300"
                                : "text-red-300"
                            }`}
                          >
                            {selectedCell.value}
                          </span>
                          {(selectedRow || selectedCell.row) *
                            (selectedCol || selectedCell.col) !==
                            selectedCell.value && (
                            <span className="text-xs text-red-300 font-semibold">
                              ⚠️ Should be{" "}
                              {(selectedRow || selectedCell.row) *
                                (selectedCol || selectedCell.col)}
                            </span>
                          )}
                        </div>
                      )}

                    {tableMode === "division" &&
                      selectedResult &&
                      selectedDivisor &&
                      selectedResult % selectedDivisor === 0 && (
                        <div className="w-full px-4 py-1 rounded-lg bg-purple-500/20 border border-purple-400/50 text-center flex items-center justify-center gap-3">
                          <span className="text-base text-white/80">
                            {selectedResult} ÷ {selectedDivisor} =
                          </span>
                          <span className="text-xl font-bold text-purple-300">
                            {selectedResult / selectedDivisor}
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-center">
                      <thead>
                        <tr>
                          <th className="font-bold text-white/80 p-2 bg-black/30 rounded">
                            ×
                          </th>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (num) => {
                              const isColSelected =
                                (tableMode === "multiplication" &&
                                  selectedCol &&
                                  num === selectedCol) ||
                                (tableMode === "multiplication" &&
                                  selectedCell &&
                                  selectedRow &&
                                  num === selectedCell.col);
                              const isColInvalid =
                                tableMode === "division" &&
                                selectedCell &&
                                selectedResult &&
                                selectedResult % num !== 0;
                              return (
                                <th
                                  key={num}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (tableMode === "multiplication") {
                                      if (selectedCol === num) {
                                        setSelectedCol(null);
                                      } else {
                                        setSelectedCol(num);
                                      }
                                    } else {
                                      if (selectedResult && selectedCell) {
                                        const quotient =
                                          selectedResult / num;
                                        if (
                                          quotient ===
                                            Math.floor(quotient) &&
                                          quotient > 0
                                        ) {
                                          if (selectedDivisor === num) {
                                            setSelectedDivisor(null);
                                            setSelectedCol(null);
                                          } else {
                                            setSelectedDivisor(num);
                                            setSelectedRow(null);
                                            setSelectedCol(num);
                                          }
                                        }
                                      }
                                    }
                                  }}
                                  className={`font-bold text-white/80 p-2 rounded min-w-[40px] cursor-pointer transition-all ${
                                    isColSelected
                                      ? tableMode === "multiplication"
                                        ? "bg-yellow-500/40 border-2 border-yellow-400"
                                        : "bg-purple-500/40 border-2 border-purple-400"
                                      : isColInvalid
                                      ? "bg-red-500/20 border border-red-400/30 opacity-50 cursor-not-allowed"
                                      : "bg-black/30 hover:bg-black/40"
                                  }`}
                                  style={{ pointerEvents: "auto", zIndex: 10 }}
                                >
                                  {num}
                                </th>
                              );
                            }
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (row) => (
                            <tr key={row}>
                              <td
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (tableMode === "multiplication") {
                                    if (selectedRow === row) {
                                      setSelectedRow(null);
                                    } else {
                                      setSelectedRow(row);
                                    }
                                  } else {
                                    if (selectedResult && selectedCell) {
                                      const quotient =
                                        selectedResult / row;
                                      if (
                                        quotient ===
                                          Math.floor(quotient) &&
                                        quotient > 0
                                      ) {
                                        if (selectedDivisor === row) {
                                          setSelectedDivisor(null);
                                          setSelectedRow(null);
                                        } else {
                                          setSelectedDivisor(row);
                                          setSelectedCol(null);
                                          setSelectedRow(row);
                                        }
                                      }
                                    }
                                  }
                                }}
                                className={`font-bold text-white/80 p-2 rounded cursor-pointer transition-all ${
                                  (tableMode === "multiplication" &&
                                    selectedRow &&
                                    row === selectedRow) ||
                                  (tableMode === "multiplication" &&
                                    selectedCell &&
                                    selectedCol &&
                                    row === selectedCell.row)
                                    ? "bg-yellow-500/40 border-2 border-yellow-400"
                                    : tableMode === "division" &&
                                      selectedCell &&
                                      selectedResult &&
                                      selectedResult % row !== 0
                                    ? "bg-red-500/20 border border-red-400/30 opacity-50 cursor-not-allowed"
                                    : "bg-black/30 hover:bg-black/40"
                                }`}
                                style={{ pointerEvents: "auto", zIndex: 10 }}
                              >
                                {row}
                              </td>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (col) => {
                                  const value = row * col;
                                  const isCellSelected =
                                    selectedCell &&
                                    selectedCell.row === row &&
                                    selectedCell.col === col;

                                  const isRowSelected =
                                    tableMode === "multiplication" &&
                                    selectedRow &&
                                    row === selectedRow;
                                  const isColSelected =
                                    tableMode === "multiplication" &&
                                    selectedCol &&
                                    col === selectedCol;

                                  const isAnswerCellMultiplication =
                                    tableMode === "multiplication" &&
                                    selectedRow &&
                                    selectedCol &&
                                    row === selectedRow &&
                                    col === selectedCol;

                                  const isDivisionIntersection =
                                    tableMode === "division" &&
                                    selectedCell &&
                                    selectedResult &&
                                    selectedDivisor &&
                                    ((selectedRow &&
                                      row === selectedRow &&
                                      col === selectedCell.col) ||
                                      (selectedCol &&
                                        row === selectedCell.row &&
                                        col === selectedCol));

                                  let isAnswerCell = false;
                                  if (
                                    tableMode === "division" &&
                                    selectedCell &&
                                    selectedResult &&
                                    selectedDivisor &&
                                    selectedResult % selectedDivisor === 0
                                  ) {
                                    const answer =
                                      selectedResult / selectedDivisor;
                                    if (answer >= 1 && answer <= 12) {
                                      if (
                                        selectedRow &&
                                        selectedRow === selectedDivisor &&
                                        row === selectedDivisor &&
                                        col === answer
                                      ) {
                                        isAnswerCell = true;
                                      }
                                      if (
                                        selectedCol &&
                                        selectedCol === selectedDivisor &&
                                        col === selectedDivisor &&
                                        row === answer
                                      ) {
                                        isAnswerCell = true;
                                      }
                                      if (
                                        value === answer &&
                                        ((selectedRow &&
                                          row === selectedDivisor) ||
                                          (selectedCol &&
                                            col === selectedDivisor))
                                      ) {
                                        isAnswerCell = true;
                                      }
                                    }
                                  }

                                  return (
                                    <td
                                      key={`${row}-${col}`}
                                      onClick={() => {
                                        if (practiceMode) {
                                          // במצב תרגול - לא ניתן ללחוץ על תאים
                                          return;
                                        }
                                        if (tableMode === "multiplication") {
                                          setSelectedCell({
                                            row,
                                            col,
                                            value,
                                          });
                                          setSelectedRow(null);
                                          setSelectedCol(null);
                                          setHighlightedAnswer(null);
                                        } else {
                                          setSelectedResult(value);
                                          setSelectedDivisor(null);
                                          setSelectedRow(null);
                                          setSelectedCol(null);
                                          setSelectedCell({
                                            row,
                                            col,
                                            value,
                                          });
                                        }
                                      }}
                                      className={`p-2 rounded border text-white text-sm min-w-[40px] transition-all ${
                                        practiceMode && practiceQuestion && 
                                        row === practiceQuestion.row && col === practiceQuestion.col
                                          ? "bg-yellow-500/60 border-2 border-yellow-400 animate-pulse cursor-default"
                                          : "cursor-pointer"
                                      } ${
                                        isCellSelected
                                          ? tableMode === "multiplication"
                                            ? "bg-emerald-500/40 border-2 border-emerald-400 text-emerald-200 font-bold text-base"
                                            : "bg-purple-500/40 border-2 border-purple-400 text-purple-200 font-bold text-base"
                                          : isAnswerCellMultiplication
                                          ? "bg-emerald-500/40 border-2 border-emerald-400 text-emerald-200 font-bold text-base"
                                          : isAnswerCell
                                          ? "bg-purple-500/40 border-2 border-purple-400 text-purple-200 font-bold text-base"
                                          : isRowSelected || isColSelected
                                          ? "bg-yellow-500/20 border border-yellow-400/30"
                                          : isDivisionIntersection &&
                                            !isCellSelected
                                          ? "bg-purple-500/30 border border-purple-400/50"
                                          : "bg-black/20 border border-white/5 hover:bg-black/30"
                                      }`}
                                      style={{ pointerEvents: "auto" }}
                                    >
                                      {value}
                                    </td>
                                  );
                                }
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-center space-y-2">
                    <div className="text-xs text-white/60 mb-2 text-center">
                      {tableMode === "multiplication"
                        ? "לחץ על מספר מהטבלה, ואז על מספר שורה או עמודה"
                        : "לחץ על מספר תוצאה, ואז על מספר שורה/עמודה כדי לראות את החילוק"}
                    </div>
                    <button
                      onClick={() => {
                        setShowMultiplicationTable(false);
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                      }}
                      className="px-6 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                    >
                      סגור
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Modal */}
          {showLeaderboard && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowLeaderboard(false)}
              dir="rtl"
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

                {/* Level Selection */}
                <div className="flex gap-2 mb-4 justify-center" dir="rtl">
                  {Object.keys(LEVELS).reverse().map((lvl) => (
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
                            console.error(
                              "שגיאה בטעינת לוח התוצאות:",
                              e
                            );
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

                {/* Leaderboard Table */}
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
                            עדיין אין תוצאות ברמה{" "}
                            {LEVELS[leaderboardLevel].name}
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

          {/* Mixed Operations Selector Modal */}
          {showMixedSelector && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
              onClick={() => {
                setShowMixedSelector(false);
                // אם לא נבחרו פעולות, חזור לפעולה הקודמת
                const hasSelected = Object.values(mixedOperations).some(
                  (selected) => selected
                );
                if (!hasSelected && operation === "mixed") {
                  const allowed = GRADES[grade].operations;
                  setOperation(allowed.find(op => op !== "mixed") || allowed[0]);
                }
              }}
              dir="rtl"
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-lg p-2 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                style={{ width: '130px', maxWidth: '130px', minWidth: '130px' }}
              >
                <div className="text-center mb-2 flex-shrink-0">
                  <h2 className="text-base font-extrabold text-white mb-0.5">
                    🎲 בחר פעולות
                  </h2>
                  <p className="text-white/70 text-[10px] leading-tight">
                    בחר פעולות
                  </p>
                </div>

                <div className="space-y-1.5 mb-2 overflow-y-auto flex-1 min-h-0">
                  {GRADES[grade].operations
                    .filter((op) => op !== "mixed")
                    .map((op) => (
                      <label
                        key={op}
                        className="flex items-center gap-1.5 p-1.5 rounded bg-black/30 border border-white/10 hover:bg-black/40 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={mixedOperations[op] || false}
                          onChange={(e) => {
                            setMixedOperations((prev) => ({
                              ...prev,
                              [op]: e.target.checked,
                            }));
                          }}
                          className="w-3.5 h-3.5 rounded flex-shrink-0"
                        />
                        <span className="text-white font-semibold text-xs leading-tight">
                          {getOperationName(op)}
                        </span>
                      </label>
                    ))}
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0" dir="rtl">
                  <button
                    onClick={() => {
                      // בדוק שיש לפחות פעולה אחת נבחרת
                      const hasSelected = Object.values(mixedOperations).some(
                        (selected) => selected
                      );
                      if (hasSelected) {
                        setShowMixedSelector(false);
                      } else {
                        alert("אנא בחר לפחות פעולה אחת");
                      }
                    }}
                    className="w-full px-2 py-1 rounded bg-emerald-500/80 hover:bg-emerald-500 font-bold text-[10px]"
                  >
                    שמור
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        // בטל הכל
                        const availableOps = GRADES[grade].operations.filter(
                          (op) => op !== "mixed"
                        );
                        const noneSelected = {};
                        availableOps.forEach((op) => {
                          noneSelected[op] = false;
                        });
                        setMixedOperations(noneSelected);
                      }}
                      className="flex-1 px-1.5 py-1 rounded bg-gray-500/80 hover:bg-gray-500 font-bold text-[10px]"
                    >
                      בטל
                    </button>
                    <button
                      onClick={() => {
                        // בחר הכל
                        const availableOps = GRADES[grade].operations.filter(
                          (op) => op !== "mixed"
                        );
                        const allSelected = {};
                        availableOps.forEach((op) => {
                          allSelected[op] = true;
                        });
                        setMixedOperations(allSelected);
                      }}
                      className="flex-1 px-1.5 py-1 rounded bg-blue-500/80 hover:bg-blue-500 font-bold text-[10px]"
                    >
                      הכל
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Challenge Modal */}
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
                  📘 איך לומדים חשבון כאן?
                </h2>

                <p className="text-white/80 text-xs mb-3 text-center">
                  המטרה היא לתרגל חשבון בצורה משחקית, עם התאמה לכיתה, פעולה ורמת קושי.
                </p>

                <ul className="list-disc pr-4 space-y-1 text-[13px] text-white/90">
                  <li>בחר כיתה, רמת קושי ופעולה (חיבור, חיסור, כפל, חילוק, שברים, אחוזים ועוד).</li>
                  <li>בחר מצב משחק: למידה, אתגר עם טיימר וחיים, מהירות או מרתון.</li>
                  <li>קרא היטב את השאלה – לפעמים יש תרגילי מילים שצריך להבין את הסיפור.</li>
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
          {/* Reference Modal - לוח עזרה */}
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
                  <h2 className="text-2xl font-extrabold">📚 לוח עזרה בחשבון</h2>
                  <button
                    onClick={() => setShowReferenceModal(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                <p className="text-sm text-white/70 mb-3">
                  בחר קטגוריה כדי לראות פעולות, נוסחאות ומונחים חשובים בחשבון.
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
                      {REFERENCE_CATEGORIES[key].icon} {REFERENCE_CATEGORIES[key].label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {referenceCategory === "operations" && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">➕ חיבור</div>
                        <div className="text-sm text-white/80">חיבור מספרים: <span style={{ direction: 'ltr', unicodeBidi: 'bidi-override', display: 'inline-block' }}>a + b = c</span></div>
                        <div className="text-xs text-white/60 mt-1">דוגמה: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>5 + 3 = 8</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">➖ חיסור</div>
                        <div className="text-sm text-white/80">חיסור מספרים: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>a - b = c</span></div>
                        <div className="text-xs text-white/60 mt-1">דוגמה: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>8 - 3 = 5</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">✖️ כפל</div>
                        <div className="text-sm text-white/80">כפל מספרים: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>a × b = c</span></div>
                        <div className="text-xs text-white/60 mt-1">דוגמה: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>4 × 3 = 12</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">➗ חילוק</div>
                        <div className="text-sm text-white/80">חילוק מספרים: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>a ÷ b = c</span></div>
                        <div className="text-xs text-white/60 mt-1">דוגמה: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>12 ÷ 3 = 4</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">🔢 שברים</div>
                        <div className="text-sm text-white/80">מספר המייצג חלק משלם: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>1/2, 3/4</span></div>
                        <div className="text-xs text-white/60 mt-1">דוגמה: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>1/2 = 0.5</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">% אחוזים</div>
                        <div className="text-sm text-white/80">חלק מתוך 100: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>% = חלק/שלם × 100</span></div>
                        <div className="text-xs text-white/60 mt-1">דוגמה: <span dir="ltr" style={{ display: 'inline-block', textAlign: 'left', unicodeBidi: 'isolate' }}>50% = 0.5</span></div>
                      </div>
                    </>
                  )}
                  {referenceCategory === "formulas" && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 שטח ריבוע</div>
                        <div className="text-sm text-white/80">צלע × צלע</div>
                        <div className="text-xs text-white/60 mt-1"><span dir="ltr" style={{ display: 'inline-block' }}>S = a²</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 שטח מלבן</div>
                        <div className="text-sm text-white/80">אורך × רוחב</div>
                        <div className="text-xs text-white/60 mt-1"><span dir="ltr" style={{ display: 'inline-block' }}>S = a × b</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 שטח משולש</div>
                        <div className="text-sm text-white/80">(בסיס × גובה) ÷ 2</div>
                        <div className="text-xs text-white/60 mt-1"><span dir="ltr" style={{ display: 'inline-block' }}>S = (b × h) ÷ 2</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">⭕ היקף מעגל</div>
                        <div className="text-sm text-white/80">2 × π × רדיוס</div>
                        <div className="text-xs text-white/60 mt-1"><span dir="ltr" style={{ display: 'inline-block' }}>P = 2πr</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">⭕ שטח מעגל</div>
                        <div className="text-sm text-white/80">π × רדיוס²</div>
                        <div className="text-xs text-white/60 mt-1"><span dir="ltr" style={{ display: 'inline-block' }}>S = πr²</span></div>
                      </div>
                    </>
                  )}
                  {referenceCategory === "terms" && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">➕ סכום</div>
                        <div className="text-sm text-white/80">תוצאת החיבור של מספרים</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">➖ הפרש</div>
                        <div className="text-sm text-white/80">תוצאת החיסור של מספרים</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">✖️ מכפלה</div>
                        <div className="text-sm text-white/80">תוצאת הכפל של מספרים</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">➗ מנה</div>
                        <div className="text-sm text-white/80">תוצאת החילוק של מספרים</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">🔢 מספר זוגי</div>
                        <div className="text-sm text-white/80">מספר המתחלק ב-2 ללא שארית (2, 4, 6, 8...)</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">🔢 מספר אי-זוגי</div>
                        <div className="text-sm text-white/80">מספר שלא מתחלק ב-2 ללא שארית (1, 3, 5, 7...)</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">🔢 מספר ראשוני</div>
                        <div className="text-sm text-white/80">מספר המתחלק רק ב-1 ובעצמו (2, 3, 5, 7, 11...)</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">🔢 מספר שלם</div>
                        <div className="text-sm text-white/80">מספר ללא שבר (0, 1, 2, 3, -1, -2...)</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">🔢 שבר</div>
                        <div className="text-sm text-white/80">מספר המייצג חלק משלם (1/2, 3/4, 2/3...)</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">% אחוז</div>
                        <div className="text-sm text-white/80">חלק מתוך 100 (50% = חצי, 25% = רבע)</div>
                      </div>
                    </>
                  )}
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




