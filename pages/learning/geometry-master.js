import { useState, useEffect, useRef } from "react";
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

export default function GeometryMaster() {
  useIOSViewportFix();
  const router = useRouter();
  const wrapRef = useRef(null);
  const headerRef = useRef(null);
  const gameRef = useRef(null);
  const controlsRef = useRef(null);
  const topicSelectRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [grade, setGrade] = useState("g5");
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
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [progress, setProgress] = useState({
    area: { total: 0, correct: 0 },
    perimeter: { total: 0, correct: 0 },
    volume: { total: 0, correct: 0 },
    angles: { total: 0, correct: 0 },
    pythagoras: { total: 0, correct: 0 },
  });
  const [dailyChallenge, setDailyChallenge] = useState({
    date: new Date().toDateString(),
    bestScore: 0,
    questions: 0,
  });
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
    setMounted(true);
  }, []);

  const generateNewQuestion = () => {
    // בדיקה שהכיתה קיימת
    if (!GRADES[grade]) {
      console.error("כיתה לא תקינה:", grade);
      return;
    }
    
    const allowedTopics = GRADES[grade].topics || [];
    
    // בדיקה שיש נושאים זמינים
    if (allowedTopics.length === 0) {
      console.error("אין נושאים זמינים לכיתה:", grade);
      setCurrentQuestion({
        question: "אין נושאים זמינים עבור הכיתה הזו. אנא בחר כיתה אחרת.",
        correctAnswer: 0,
        options: [0],
        params: { kind: "no_question" },
      });
      return;
    }
    
    // בדיקה שהנושא הנוכחי תקין, אם לא - נעצור
    let validTopic = topic;
    if (topic === "mixed") {
      const mixedAvailable = Object.keys(mixedTopics).filter(t => mixedTopics[t] && allowedTopics.includes(t));
      if (mixedAvailable.length === 0) {
        validTopic = allowedTopics.find(t => t !== "mixed") || allowedTopics[0];
      }
    } else if (!allowedTopics.includes(topic)) {
      // אם הנושא לא תקין, נעצור ולא ננסה ליצור שאלה
      // ה-onChange של הכיתה יעדכן את ה-topic
      setCurrentQuestion({
        question: "מעדכן נושא...",
        correctAnswer: 0,
        options: [0],
        params: { kind: "no_question" },
      });
      return; // נעצור כאן - ה-onChange יעדכן את ה-topic
    }
    
    // בדיקה סופית שהנושא תקין
    if (!validTopic || !allowedTopics.includes(validTopic)) {
      setCurrentQuestion({
        question: "אין נושאים זמינים. אנא בחר נושא אחר.",
        correctAnswer: 0,
        options: [0],
        params: { kind: "no_question" },
      });
      return;
    }
    
    const levelConfig = getLevelForGrade(level, grade);
    let question;
    let attempts = 0;
    const maxAttempts = 50;
    do {
      const selectedTopics = validTopic === "mixed" 
        ? Object.keys(mixedTopics).filter(t => mixedTopics[t] && allowedTopics.includes(t))
        : [validTopic];
      
      if (selectedTopics.length === 0) {
        question = {
          question: "אין נושאים זמינים. אנא בחר נושא אחר.",
          correctAnswer: 0,
          options: [0],
          params: { kind: "no_question" },
        };
        break;
      }
      
      const currentTopic = selectedTopics[0];
      question = generateQuestion(
        levelConfig,
        currentTopic,
        grade,
        validTopic === "mixed" ? mixedTopics : null
      );
      
      // אם אין שאלה זמינה, ננסה נושא אחר
      if (question.params?.kind === "no_question") {
        const nextTopic = allowedTopics.find(t => t !== "mixed" && t !== currentTopic);
        if (nextTopic) {
          question = generateQuestion(levelConfig, nextTopic, grade, null);
        } else {
          break; // אין נושאים אחרים לנסות
        }
      }
      
      attempts++;
      const questionKey = question.question;
      if (!recentQuestions.has(questionKey) && question.params?.kind !== "no_question") {
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
    setFeedback(null);
    setQuestionStartTime(Date.now());
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
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

      // מערכת XP ורמות
      const xpGain = hintUsed ? 5 : 10; // פחות XP אם השתמש ברמז
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

      // עדכון תחרות יומית
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
        dir="rtl"
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
            className="grid grid-cols-7 gap-0.5 mb-1 w-full max-w-md"
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
          </div>

          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md" dir="rtl">
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
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-sm font-bold placeholder:text-white/40 flex-1 min-w-[120px]"
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
                      <div className="text-xs font-bold text-purple-400">
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
                  שיא: {dailyChallenge.bestScore} • שאלות: {dailyChallenge.questions}
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
                    🧹 Reset
                  </button>
                )}
              </div>

              {/* כפתור "איך לומדים גאומטריה כאן?" */}
              <div className="mb-2 w-full max-w-md flex justify-center">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים גאומטריה כאן?
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
                  <li>בחר מצב משחק: למידה, אתגר עם טיימר וחיים, מרוץ מהירות או מרתון.</li>
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
        </div>
      </div>
    </Layout>
  );
}



