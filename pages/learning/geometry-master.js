import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import {
  LEVELS,
  TOPICS,
  GRADES,
  getShapesForTopic,
  MODES,
  STORAGE_KEY,
} from "../../utils/geometry-constants";
import {
  getLevelForGrade,
  buildTop10ByScore,
  saveScoreEntry,
} from "../../utils/geometry-storage";
import { generateQuestion } from "../../utils/geometry-question-generator";
import {
  getHint,
  getSolutionSteps,
  getErrorExplanation,
  getTheorySummary,
} from "../../utils/geometry-explanations";
import { trackGeometryTopicTime } from "../../utils/math-time-tracking";
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

export default function GeometryMaster() {
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
  const yearMonthRef = useRef(getCurrentYearMonth());

  // פונקציה עזר לקבלת מפתח תאריך
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  };

  const [mounted, setMounted] = useState(false);
  
  // NEW: grade & mode
  const [gradeNumber, setGradeNumber] = useState(5); // 1 = כיתה א׳, 2 = ב׳, ... 6 = ו׳
  const [grade, setGrade] = useState("g5"); // g1, g2, g3, g4, g5, g6
  const [mode, setMode] = useState("learning");
  const [level, setLevel] = useState("easy");
  const [topic, setTopic] = useState("area");
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
  const [recentQuestions, setRecentQuestions] = useState(new Set());
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showBadge, setShowBadge] = useState(null);
  const [showCorrectAnimation, setShowCorrectAnimation] = useState(false);
  const [showWrongAnimation, setShowWrongAnimation] = useState(false);
  const [celebrationEmoji, setCelebrationEmoji] = useState("🎉");
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [playerAvatar, setPlayerAvatar] = useState("👤"); // אווטר ברירת מחדל
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // תרגול ממוקד
  const [focusedPracticeMode, setFocusedPracticeMode] = useState("normal"); // "normal", "mistakes", "graded"
  const [practiceFocus, setPracticeFocus] = useState("default");
  const [mistakes, setMistakes] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_geometry_mistakes") || "[]");
        return saved;
      } catch {
        return [];
      }
    }
    return [];
  });
  const [showPracticeOptions, setShowPracticeOptions] = useState(false);
  const [progress, setProgress] = useState({
    area: { total: 0, correct: 0 },
    perimeter: { total: 0, correct: 0 },
    volume: { total: 0, correct: 0 },
    angles: { total: 0, correct: 0 },
    pythagoras: { total: 0, correct: 0 },
  });
  const [dailyChallenge, setDailyChallenge] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem("mleo_geometry_daily_challenge") || "{}");
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
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [errorExplanation, setErrorExplanation] = useState("");
  const [showMixedSelector, setShowMixedSelector] = useState(false);
  const [mixedTopics, setMixedTopics] = useState({
    area: true,
    perimeter: true,
    volume: false,
    angles: false,
    pythagoras: false,
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardLevel, setLeaderboardLevel] = useState("easy");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [referenceCategory, setReferenceCategory] = useState("shapes");
  
  // Daily Streak
  const [dailyStreak, setDailyStreak] = useState(() => loadDailyStreak("mleo_geometry_daily_streak"));
  const [showStreakReward, setShowStreakReward] = useState(null);
  
  // Sound system
  const sound = useSound();
  
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



  // טעינת אווטר מ-localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mleo_player_avatar");
      if (saved) {
        setPlayerAvatar(saved);
      }
    }
  }, []);

  useEffect(() => {
    const todayKey = getTodayKey();
    if (dailyChallenge.date !== todayKey) {
      setDailyChallenge({ 
        date: todayKey, 
        bestScore: 0, 
        questions: 0, 
        correct: 0,
        completed: false 
      });
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
    return () => {
      recordSessionProgress();
    };
  }, []);

  const accumulateQuestionTime = useCallback(() => {
    if (!questionStartTime) return;
    const elapsed = Date.now() - questionStartTime;
    if (elapsed <= 0) return;
    sessionSecondsRef.current += Math.min(elapsed, 60000);
  }, [questionStartTime]);

  const generateNewQuestion = () => {
    accumulateQuestionTime();
    // בדיקה שהכיתה קיימת
    if (!GRADES[grade]) {
      console.error("כיתה לא תקינה:", grade);
      setCurrentQuestion({
        question: "כיתה לא תקינה. אנא בחר כיתה אחרת.",
        correctAnswer: 0,
        answers: [0],
        params: { kind: "no_question" },
      });
      return;
    }
    
    const allowedTopics = GRADES[grade].topics || [];
    
    // בדיקה שיש נושאים זמינים
    if (allowedTopics.length === 0) {
      console.error("אין נושאים זמינים לכיתה:", grade);
      setCurrentQuestion({
        question: "אין נושאים זמינים עבור הכיתה הזו. אנא בחר כיתה אחרת.",
        correctAnswer: 0,
        answers: [0],
        params: { kind: "no_question" },
      });
      return;
    }
    
    // בדיקה שהנושא הנוכחי תקין, אם לא - נבחר נושא תקין
    let validTopic = topic;
    if (topic === "mixed") {
      const mixedAvailable = Object.keys(mixedTopics).filter(t => mixedTopics[t] && allowedTopics.includes(t));
      if (mixedAvailable.length === 0) {
        validTopic = allowedTopics.find(t => t !== "mixed") || allowedTopics[0];
        if (validTopic) setTopic(validTopic); // עדכון הנושא
      }
    } else if (!allowedTopics.includes(topic)) {
      // אם הנושא לא תקין, נבחר נושא תקין
      validTopic = allowedTopics.find(t => t !== "mixed") || allowedTopics[0];
      if (validTopic) {
        setTopic(validTopic); // עדכון הנושא
      } else {
        setCurrentQuestion({
          question: "אין נושאים זמינים עבור הכיתה הזו. אנא בחר כיתה אחרת.",
          correctAnswer: 0,
          answers: [0],
          params: { kind: "no_question" },
        });
        return;
      }
    }
    
    // בדיקה סופית שהנושא תקין
    if (!validTopic || !allowedTopics.includes(validTopic)) {
      setCurrentQuestion({
        question: "אין נושאים זמינים. אנא בחר נושא אחר.",
        correctAnswer: 0,
        answers: [0],
        params: { kind: "no_question" },
      });
      return;
    }
    
    const levelConfig = getLevelForGrade(level, grade);
    let question;
    let attempts = 0;
    const maxAttempts = 50;
    
    // עותק מקומי של recentQuestions כדי לא לעדכן state בתוך הלולאה
    const localRecentQuestions = new Set(recentQuestions);
    
    do {
      const selectedTopics = validTopic === "mixed" 
        ? Object.keys(mixedTopics).filter(t => mixedTopics[t] && allowedTopics.includes(t))
        : [validTopic];
      
      if (selectedTopics.length === 0) {
        question = {
          question: "אין נושאים זמינים. אנא בחר נושא אחר.",
          correctAnswer: 0,
          answers: [0],
          params: { kind: "no_question" },
        };
        break;
      }
      
      const currentTopic = selectedTopics[Math.floor(Math.random() * selectedTopics.length)];
      question = generateQuestion(
        levelConfig,
        currentTopic,
        grade,
        validTopic === "mixed" ? mixedTopics : null
      );
      
      // אם אין שאלה זמינה, ננסה נושא אחר
      if (!question || question.params?.kind === "no_question") {
        const nextTopic = allowedTopics.find(t => t !== "mixed" && t !== currentTopic);
        if (nextTopic) {
          question = generateQuestion(levelConfig, nextTopic, grade, null);
        } else {
          // אם אין נושאים אחרים, נעצור
          question = {
            question: "אין שאלות זמינות עבור הנושא והכיתה שנבחרו.",
            correctAnswer: 0,
            answers: [0],
            params: { kind: "no_question" },
          };
          break;
        }
      }
      
      // בדיקה שהשאלה תקינה
      if (!question || !question.answers || question.answers.length === 0) {
        attempts++;
        continue; // ננסה שוב
      }
      
      attempts++;
      
      // בדיקה שהשאלה תקינה
      if (!question || !question.answers || question.answers.length === 0 || question.params?.kind === "no_question") {
        continue; // ננסה שוב
      }
      
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
      
      // אם הגענו למקסימום ניסיונות, נשתמש בשאלה האחרונה גם אם היא חוזרת
      if (attempts >= maxAttempts - 5) {
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
    
    // בדיקה שהשאלה תקינה לפני הצגתה
    if (!question || !question.answers || question.answers.length === 0) {
      console.error("Failed to generate valid question");
      setCurrentQuestion({
        question: "שגיאה ביצירת שאלה. אנא נסה שוב או בחר נושא אחר.",
        correctAnswer: 0,
        answers: [0],
        params: { kind: "no_question" },
      });
      return;
    }
    
    // מעקב זמן - סיום שאלה קודמת (אם יש)
    if (questionStartTime && currentQuestion) {
      const duration = (Date.now() - questionStartTime) / 1000; // שניות
      if (duration > 0 && duration < 300) { // רק אם זמן סביר (פחות מ-5 דקות)
        trackGeometryTopicTime(
          currentQuestion.topic,
          grade,
          level,
          duration
        );
      }
    }
    
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setFeedback(null);
    setQuestionStartTime(Date.now());
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
  };

  const recordSessionProgress = () => {
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
    const durationMinutes = Number((totalSeconds / 60000).toFixed(2));
    addSessionProgress(durationMinutes, answered, {
      subject: "geometry",
      topic,
      grade,
      mode,
      game: "GeometryMaster",
      date: new Date(),
    });
    refreshMonthlyProgress();
    sessionStartRef.current = null;
    solvedCountRef.current = 0;
    sessionSecondsRef.current = 0;
    setQuestionStartTime(null);
  };

  const handleAnswer = (answer) => {
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
    const isCorrect = answer === currentQuestion.correctAnswer;

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
      const top = currentQuestion.topic;
      setProgress((prev) => ({
        ...prev,
        [top]: {
          total: (prev[top]?.total || 0) + 1,
          correct: (prev[top]?.correct || 0) + 1,
        },
      }));

      // מערכת כוכבים - כוכב כל 5 תשובות נכונות
      const newCorrect = correct + 1;
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

      // מערכת תגים
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
      setDailyChallenge((prev) => {
        const updated = {
          ...prev,
          bestScore: Math.max(prev.bestScore, score + points),
          questions: prev.questions + 1,
          correct: (prev.correct || 0) + 1,
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("mleo_geometry_daily_challenge", JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });

      // עדכון תחרות שבועית
      setWeeklyChallenge((prev) => {
        const newCurrent = (prev.current || 0) + 1;
        const updated = {
          ...prev,
          current: newCurrent,
          completed: newCurrent >= prev.target,
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("mleo_weekly_challenge", JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });

      // אנימציה ותגובה חזותית לתשובה נכונה
      const emojis = ["🎉", "✨", "🌟", "💫", "⭐", "🔥", "💪", "🎊", "👏", "🏆"];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      setCelebrationEmoji(randomEmoji);
      setShowCorrectAnimation(true);
      setTimeout(() => setShowCorrectAnimation(false), 1000);

      setFeedback("Correct! 🎉");
      
      // Play sound - different sound for streak milestones
      if ((streak + 1) % 5 === 0 && streak + 1 >= 5) {
        sound.playSound("streak");
      } else {
        sound.playSound("correct");
      }
      
      // Update daily streak
      const updatedStreak = updateDailyStreak("mleo_geometry_daily_streak");
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
      
      setErrorExplanation(
        getErrorExplanation(
          currentQuestion,
          currentQuestion.topic,
          answer,
          grade
        )
      );
      
      // עדכון התקדמות אישית
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
        // במצב למידה – אין Game Over, רק הצגת תשובה והמשך
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
        // מצב Challenge – עובדים עם חיים
        setFeedback(
          `Wrong! Correct: ${currentQuestion.correctAnswer} ❌ (-1 ❤️)`
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
              setFeedback(null);
              setTimeLeft(20);
            }, 1500);
          }

          return nextLives;
        });
      }
    }
  };


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
    accumulateQuestionTime();
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
    setTotalQuestions(0);
    setAvgTime(0);
    setQuestionStartTime(null);
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
    setLives(mode === "challenge" ? 3 : 0);
    setShowHint(false);
    setHintUsed(false);
    setShowBadge(null);
    setShowLevelUp(false);
    setShowSolution(false);
    setErrorExplanation("");
    
    // Start background music and play game start sound
    sound.playBackgroundMusic();
    sound.playSound("game-start");
    
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
    recordSessionProgress();
    setGameActive(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedAnswer(null);
    saveRunToStorage();
  }

  function handleTimeUp() {
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
                onClick={() => router.push("/learning/geometry-curriculum")}
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
            <h1 className="text-2xl font-extrabold text-white mb-0.5">
              📐 Geometry Master
            </h1>
            <p className="text-white/70 text-xs">
              {playerName || "שחקן"} • {GRADES[grade]?.name || ""} • {LEVELS[level].name} • {getTopicName(topic)} • {MODES[mode].name}
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
              <div className="text-lg font-bold leading-tight">{playerAvatar}</div>
            </button>
          </div>

          <div
            className="flex items-center justify-center gap-1.5 mb-2 w-full max-w-md flex-wrap px-1"
            dir="rtl"
          >
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

          {showBadge && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none" dir="rtl">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-bounce">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-2xl font-bold">תג חדש!</div>
                <div className="text-xl">{showBadge}</div>
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

          {!gameActive ? (
            <>
              <div
                className="flex items-center justify-center gap-1.5 mb-2 w-full max-w-md flex-wrap px-1"
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
                  className="h-9 px-2 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold placeholder:text-white/40 w-[55px]"
                  maxLength={15}
                  dir={playerName && /[\u0590-\u05FF]/.test(playerName) ? "rtl" : "ltr"}
                  style={{ textAlign: playerName && /[\u0590-\u05FF]/.test(playerName) ? "right" : "left" }}
                />
                <select
                  value={grade}
                  onChange={(e) => {
                    const newGrade = e.target.value;

                    // מעדכנים כיתה ומפסיקים משחק
                    setGrade(newGrade);
                    setGameActive(false);
                    setCurrentQuestion(null);
                    setFeedback(null);
                    setSelectedAnswer(null);
                    setShowHint(false);
                    setHintUsed(false);
                    setShowSolution(false);

                    // בחירת נושא ברירת מחדל שמתאים לכיתה
                    const allowed = GRADES[newGrade]?.topics || [];
                    const firstAllowed = allowed.find((t) => t !== "mixed") || allowed[0] || "area";
                    if (firstAllowed) {
                      setTopic(firstAllowed);
                    }

                    // עדכון נושאים זמינים למיקס לפי הכיתה החדשה
                    const availableTopics = allowed.filter((t) => t !== "mixed");
                    const newMixedTopics = {
                      area: availableTopics.includes("area"),
                      perimeter: availableTopics.includes("perimeter"),
                      volume: availableTopics.includes("volume"),
                      angles: availableTopics.includes("angles"),
                      pythagoras: availableTopics.includes("pythagoras"),
                    };
                    setMixedTopics(newMixedTopics);

                    // מאפס את רשימת השאלות האחרונות כדי שלא תהיה לולאה בניסיון למצוא "שאלה חדשה"
                    setRecentQuestions(new Set());
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
                    {(GRADES[grade]?.topics || []).map((t) => (
                      <option key={t} value={t}>
                        {getTopicName(t)}
                      </option>
                    ))}
                  </select>
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
                  ▶️ התחל
                </button>
                <button
                  onClick={() => setShowReferenceModal(true)}
                  className="h-9 px-3 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-xs"
                >
                  📐 לוח צורות
                </button>
                {mistakes.length > 0 && (
                  <button
                    onClick={() => setShowPracticeOptions(true)}
                    className="h-9 px-3 rounded-lg bg-purple-500/80 hover:bg-purple-500 font-bold text-xs"
                  >
                    🎯 תרגול ממוקד ({mistakes.length})
                  </button>
                )}
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="h-9 px-3 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-xs"
                >
                  🏆 לוח תוצאות
                </button>
                {bestScore > 0 && (
                  <button
                    onClick={resetStats}
                    className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
                  >
                    🧹 Reset
                  </button>
                )}
              </div>

              {/* כפתורים עזרה ותרגול ממוקד */}
              <div className="mb-2 w-full max-w-md flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים גאומטריה כאן?
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
              {/* אנימציות חזותיות */}
              {showCorrectAnimation && (
                <div className="fixed inset-0 z-[190] flex items-center justify-center pointer-events-none">
                  <div className="text-8xl animate-celebrate">
                    {celebrationEmoji}
                  </div>
                </div>
              )}

              {showWrongAnimation && (
                <div className="fixed inset-0 z-[190] flex items-center justify-center pointer-events-none">
                  <div className="text-6xl animate-shake">
                    ❌
                  </div>
                </div>
              )}

              {feedback && (
                <div
                  className={`mb-2 px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                    feedback.includes("Correct") ||
                    feedback.includes("∞") ||
                    feedback.includes("Start") ||
                    feedback.includes("נכון")
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
                  {mode === "learning" && currentQuestion.params?.kind !== "no_question" && (
                    <div
                      className="mb-2 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white/80 max-w-md"
                      style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                    >
                      {getTheorySummary(currentQuestion, currentQuestion.topic, grade)}
                    </div>
                  )}

                  {/* בדיקה אם יש שאלה תקינה */}
                  {currentQuestion.params?.kind === "no_question" ? (
                    <div
                      className="text-xl font-bold text-red-400 mb-4 text-center p-4 bg-red-500/20 rounded-lg border border-red-400/50"
                      style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                    >
                      {currentQuestion.question}
                    </div>
                  ) : (
                    <>
                      {/* הפרדה בין שורת השאלה לשורת התרגיל */}
                      {currentQuestion.questionLabel && currentQuestion.exerciseText ? (
                        <>
                          <p
                            className="text-2xl text-center text-white mb-1"
                            style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                          >
                            {currentQuestion.questionLabel}
                          </p>
                          <p
                            className="text-4xl text-center text-white font-bold mb-4 whitespace-nowrap"
                            style={{ direction: "ltr", unicodeBidi: "plaintext" }}
                          >
                            {currentQuestion.exerciseText}
                          </p>
                        </>
                      ) : (
                        <div
                          className="text-4xl font-black text-white mb-4 text-center"
                          style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                        >
                          {currentQuestion.question}
                        </div>
                      )}
                    </>
                  )}

                  {!hintUsed && !selectedAnswer && currentQuestion.params?.kind !== "no_question" && (
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

                  {showHint && currentQuestion.params?.kind !== "no_question" && (
                    <div
                      className="mb-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-200 text-sm text-center max-w-md"
                      style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                    >
                      {getHint(currentQuestion, currentQuestion.topic, grade)}
                    </div>
                  )}

                  {/* כפתור הסבר מלא – רק במצב Learning */}
                  {mode === "learning" && currentQuestion && currentQuestion.params?.kind !== "no_question" && (
                    <>
                      <button
                        onClick={() => setShowSolution((prev) => !prev)}
                        className="mb-2 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                      >
                        📘 הסבר מלא
                      </button>

                      {/* חלון הסבר מלא - Modal גדול ומרכזי */}
                      {showSolution && currentQuestion && (
                        <div
                          className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center px-4"
                          onClick={() => setShowSolution(false)}
                          dir="rtl"
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
                                {"\u200Fאיך פותרים את התרגיל?"}
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
                              <div
                                className="mb-2 font-semibold text-base text-center text-white"
                                dir="ltr"
                              >
                                {currentQuestion.question}
                              </div>
                              {/* כאן הצעדים */}
                              <div className="space-y-1 text-sm" style={{ direction: "rtl", unicodeBidi: "plaintext" }}>
                          {getSolutionSteps(
                            currentQuestion,
                            currentQuestion.topic,
                            grade
                                ).map((step, idx) =>
                                  typeof step === "string" ? (
                                    <div key={idx}>{step}</div>
                                  ) : (
                                    <div key={idx}>{step}</div>
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

                  {currentQuestion.params?.kind !== "no_question" && currentQuestion.answers && (
                  <div className="grid grid-cols-2 gap-3 w-full mb-3">
                    {currentQuestion.answers.map((answer, idx) => {
                      const isSelected = selectedAnswer === answer;
                      const isCorrect = answer === currentQuestion.correctAnswer;
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

                <div className="flex gap-2 mb-4 justify-center" dir="rtl">
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
                            console.error("שגיאה בטעינת לוח התוצאות:", e);
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
                            עדיין אין תוצאות ברמה {LEVELS[leaderboardLevel].name}
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
                  const allowed = GRADES[grade]?.topics || [];
                  const firstAllowed = allowed.find((t) => t !== "mixed") || allowed[0];
                  if (firstAllowed) {
                    setTopic(firstAllowed);
                  }
                }
              }}
              dir="rtl"
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
                  {(GRADES[grade]?.topics || [])
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

                <div className="flex gap-2 flex-shrink-0" dir="rtl">
                  <button
                    onClick={() => {
                      const availableTopics = (GRADES[grade]?.topics || []).filter(
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
                      const availableTopics = (GRADES[grade]?.topics || []).filter(
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

          {/* Player Profile Modal */}
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

                {/* אווטר */}
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">{playerAvatar}</div>
                  <div className="text-sm text-white/60 mb-3">בחר אווטר:</div>
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => {
                          setPlayerAvatar(avatar);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("mleo_player_avatar", avatar);
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

                {/* סטטיסטיקות */}
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

                  {/* התקדמות לפי נושאים */}
                  {Object.keys(progress).some(topic => progress[topic].total > 0) && (
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3">
                      <div className="text-sm text-white/60 mb-2">התקדמות לפי נושאים</div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {Object.entries(progress)
                          .filter(([_, data]) => data.total > 0)
                          .sort(([_, a], [__, b]) => b.total - a.total)
                          .map(([topic, data]) => {
                            const topicAccuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                            return (
                              <div key={topic} className="flex items-center justify-between text-xs">
                                <span className="text-white/80">{getTopicName(topic)}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-white/60">{data.correct}/{data.total}</span>
                                  <span className={`font-bold ${topicAccuracy >= 80 ? "text-emerald-400" : topicAccuracy >= 60 ? "text-yellow-400" : "text-red-400"}`}>
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

                <div className="text-center">
                  <button
                    onClick={() => setShowPlayerProfile(false)}
                    className="px-6 py-2 rounded-lg bg-purple-500/80 hover:bg-purple-500 font-bold text-sm"
                  >
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Practice Options Modal */}
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
                          {mistake.question} = {mistake.wrongAnswer} ❌ (נכון: {mistake.correctAnswer})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setMistakes([]);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
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

          {showHowTo && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[180] p-4"
              onClick={() => setShowHowTo(false)}
              dir="rtl"
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-emerald-400/60 rounded-2xl p-4 max-w-md w-full text-sm text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-extrabold mb-2 text-center">
                  📘 איך לומדים גאומטריה כאן?
                </h2>

                <p className="text-white/80 text-xs mb-3 text-center">
                  המטרה היא לתרגל גאומטריה בצורה משחקית, עם התאמה לכיתה, נושא ורמת קושי.
                </p>

                <ul className="list-disc pr-4 space-y-1 text-[13px] text-white/90">
                  <li>בחר כיתה, רמת קושי ונושא (שטח, היקף, נפח, זוויות, פיתגורס ועוד).</li>
                  <li>בחר מצב משחק: למידה, אתגר עם טיימר וחיים, מהירות או מרתון.</li>
                  <li>קרא היטב את השאלה – לפעמים יש תרגילי מילים על גינות, גדרות וארגזים.</li>
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

          {/* לוח צורות ונוסחאות */}
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
                  <h2 className="text-2xl font-extrabold">📐 לוח צורות ונוסחאות</h2>
                  <button
                    onClick={() => setShowReferenceModal(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                <p className="text-sm text-white/70 mb-3">
                  בחר קטגוריה כדי לראות צורות, נוסחאות ומונחים חשובים בהנדסה.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { key: "shapes", label: "צורות" },
                    { key: "formulas", label: "נוסחאות" },
                    { key: "terms", label: "מונחים" },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setReferenceCategory(cat.key)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        referenceCategory === cat.key
                          ? "bg-blue-500/80 border-blue-300 text-white"
                          : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {referenceCategory === "shapes" && (
                    <>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">🔷 ריבוע</div>
                        <div className="text-sm text-white/80">4 צלעות שוות, 4 זוויות ישרות</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">⬜ מלבן</div>
                        <div className="text-sm text-white/80">2 זוגות של צלעות שוות, 4 זוויות ישרות</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">🔺 משולש</div>
                        <div className="text-sm text-white/80">3 צלעות, 3 זוויות</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">⭕ מעגל</div>
                        <div className="text-sm text-white/80">צורה עגולה, כל הנקודות במרחק שווה מהמרכז</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📦 תיבה</div>
                        <div className="text-sm text-white/80">גוף תלת-מימדי עם 6 פאות מלבניות</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">🔲 קובייה</div>
                        <div className="text-sm text-white/80">תיבה עם כל הצלעות שוות</div>
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
                        <div className="font-bold text-lg mb-2">📏 היקף ריבוע</div>
                        <div className="text-sm text-white/80">4 × צלע</div>
                        <div className="text-xs text-white/60 mt-1"><span dir="ltr" style={{ display: 'inline-block' }}>P = 4a</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📏 היקף מלבן</div>
                        <div className="text-sm text-white/80">2 × (אורך + רוחב)</div>
                        <div className="text-xs text-white/60 mt-1"><span dir="ltr" style={{ display: 'inline-block' }}>P = 2(a + b)</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📦 נפח תיבה</div>
                        <div className="text-sm text-white/80">אורך × רוחב × גובה</div>
                        <div className="text-xs text-white/60 mt-1"><span dir="ltr" style={{ display: 'inline-block' }}>V = a × b × c</span></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📦 נפח קובייה</div>
                        <div className="text-sm text-white/80">צלע × צלע × צלע</div>
                        <div className="text-xs text-white/60 mt-1"><span dir="ltr" style={{ display: 'inline-block' }}>V = a³</span></div>
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
                        <div className="font-bold text-lg mb-2">📐 שטח</div>
                        <div className="text-sm text-white/80">המקום שצורה תופסת במישור</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📏 היקף</div>
                        <div className="text-sm text-white/80">אורך הקו המקיף את הצורה</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📦 נפח</div>
                        <div className="text-sm text-white/80">המקום שגוף תופס במרחב</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 זווית</div>
                        <div className="text-sm text-white/80">המקום בין שתי קרניים היוצאות מאותה נקודה</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 זווית ישרה</div>
                        <div className="text-sm text-white/80">90 מעלות</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 זווית חדה</div>
                        <div className="text-sm text-white/80">פחות מ-90 מעלות</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 זווית קהה</div>
                        <div className="text-sm text-white/80">יותר מ-90 מעלות</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 מקבילות</div>
                        <div className="text-sm text-white/80">קווים שלא נפגשים לעולם</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 מאונכות</div>
                        <div className="text-sm text-white/80">קווים שנפגשים בזווית ישרה</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 אלכסון</div>
                        <div className="text-sm text-white/80">קו המחבר שני קודקודים לא סמוכים</div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="font-bold text-lg mb-2">📐 סימטרייה</div>
                        <div className="text-sm text-white/80">כאשר צורה נראית זהה משני צדדים</div>
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



