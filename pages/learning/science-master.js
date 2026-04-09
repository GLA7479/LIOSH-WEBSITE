import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";
import { SCIENCE_QUESTIONS } from "../../data/science-questions";
import {
  SCIENCE_GRADES,
  SCIENCE_GRADE_ORDER,
} from "../../data/science-curriculum";
import { trackScienceTopicTime } from "../../utils/science-time-tracking";
import { reportModeFromGameState } from "../../utils/report-track-meta";
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
import { splitRewardAmountLabel } from "../../utils/dashboard-setup-ui";
import { learningMixedHebrewMathStyle } from "../../utils/learning-mixed-hebrew-math";
import {
  learningModalOverlay,
  learningModalPanel,
  learningModalHeader,
  learningModalCloseBtn,
  learningModalTitle,
  learningModalFooter,
  learningQuestionBox,
  learningQuestionText,
  learningExplBody,
  learningPrimaryCloseBtn,
  learningHintTriggerBtn,
  learningExplainOpenBtn,
} from "../../utils/learning-ui-classes";

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
const SCIENCE_MISTAKES_MAX = 80;
const SCIENCE_INTEL_KEY = "mleo_science_learning_intel";
const INTEL_FORMAT_VERSION = 2;
const INSIGHT_ANSWER_TAIL_MAX = 20;
const INSIGHT_TOPIC_TAIL_MAX = 8;
const INSIGHT_MIN_TOPIC_ATTEMPTS = 4;
const INTEL_RECENT_MAX = 28;
const RETRY_QUEUE_MAX = 28;
/** Max extra weight from mistake rate (1 + this). Lower = less topic lock-in. */
const TOPIC_WEIGHT_MAX_BOOST = 0.72;
const ADAPTIVE_LEVEL_ORDER = ["easy", "medium", "hard"];

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

function sanitizeTopicStats(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== "string" || k.length === 0 || k.length > 80) continue;
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    let attempts = Math.floor(Number(v.attempts));
    let wrong = Math.floor(Number(v.wrong));
    if (!Number.isFinite(attempts) || attempts < 0) attempts = 0;
    if (!Number.isFinite(wrong) || wrong < 0) wrong = 0;
    attempts = Math.min(attempts, 500000);
    wrong = Math.min(wrong, attempts);
    out[k] = { attempts, wrong };
  }
  return out;
}

function sanitizeRecentIds(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((id) => typeof id === "string" && id.length > 0 && id.length < 140)
    .slice(-INTEL_RECENT_MAX);
}

function sanitizeAnswerTail(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => x === true || x === 1 || x === "1")
    .slice(-INSIGHT_ANSWER_TAIL_MAX);
}

function sanitizeTopicAnswerTails(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (!TOPICS[k]) continue;
    if (!Array.isArray(v)) continue;
    out[k] = v
      .map((x) => x === true || x === 1 || x === "1")
      .slice(-INSIGHT_TOPIC_TAIL_MAX);
  }
  return out;
}

function loadScienceIntel() {
  if (typeof window === "undefined") {
    return {
      topicStats: {},
      recentIds: [],
      answerTail: [],
      topicAnswerTails: {},
    };
  }
  try {
    const raw = localStorage.getItem(SCIENCE_INTEL_KEY);
    if (!raw) {
      return {
        topicStats: {},
        recentIds: [],
        answerTail: [],
        topicAnswerTails: {},
      };
    }
    const p = JSON.parse(raw);
    if (p === null || typeof p !== "object" || Array.isArray(p)) {
      return {
        topicStats: {},
        recentIds: [],
        answerTail: [],
        topicAnswerTails: {},
      };
    }
    const topicStats = sanitizeTopicStats(p.topicStats);
    const recentIds = sanitizeRecentIds(p.recentIds);
    const answerTail = sanitizeAnswerTail(p.answerTail);
    const topicAnswerTails = sanitizeTopicAnswerTails(p.topicAnswerTails);
    return { topicStats, recentIds, answerTail, topicAnswerTails };
  } catch {
    return {
      topicStats: {},
      recentIds: [],
      answerTail: [],
      topicAnswerTails: {},
    };
  }
}

function persistScienceIntel(intel) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      v: INTEL_FORMAT_VERSION,
      topicStats: sanitizeTopicStats(intel.topicStats),
      recentIds: sanitizeRecentIds(intel.recentIds),
      answerTail: sanitizeAnswerTail(intel.answerTail),
      topicAnswerTails: sanitizeTopicAnswerTails(intel.topicAnswerTails),
    };
    localStorage.setItem(SCIENCE_INTEL_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function topicMistakeWeight(topicKey, topicStats) {
  const s = topicStats[topicKey];
  if (!s || typeof s !== "object") return 1;
  const attempts = Math.max(Number(s.attempts) || 0, 1);
  const wrong = Math.min(Number(s.wrong) || 0, attempts);
  const rate = wrong / attempts;
  return 1 + Math.min(TOPIC_WEIGHT_MAX_BOOST, rate * 1.85);
}

function weightedPickQuestions(eligible, topicStats) {
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0];
  let total = 0;
  const weights = eligible.map((q) => {
    const w = topicMistakeWeight(q.topic, topicStats);
    total += w;
    return w;
  });
  let r = Math.random() * total;
  for (let i = 0; i < eligible.length; i++) {
    r -= weights[i];
    if (r <= 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}

/** Drops due, ineligible retries; returns first due question still in pool, or null. */
function dequeueEligibleRetry(queue, pool, askCounter) {
  if (!queue.length || !pool.length) return null;
  queue.sort((a, b) => a.dueAt - b.dueAt);
  const maxSteps = queue.length + 3;
  for (let step = 0; step < maxSteps; step++) {
    const dueIdx = queue.findIndex((r) => r.dueAt <= askCounter);
    if (dueIdx < 0) return null;
    const item = queue.splice(dueIdx, 1)[0];
    const candidate = QUESTIONS.find((q) => q.id === item.id);
    if (candidate && pool.some((p) => p.id === item.id)) {
      return candidate;
    }
  }
  return null;
}

function stepAdaptiveLevel(curKey, delta) {
  const idx = ADAPTIVE_LEVEL_ORDER.indexOf(curKey);
  const base = idx >= 0 ? idx : 0;
  const next = Math.max(0, Math.min(ADAPTIVE_LEVEL_ORDER.length - 1, base + delta));
  return ADAPTIVE_LEVEL_ORDER[next];
}

function computeScienceProgressInsights(topicStats, answerTail) {
  const rows = [];
  let totalAttempts = 0;
  let totalWrong = 0;
  for (const [key, s] of Object.entries(topicStats || {})) {
    const att = Number(s.attempts) || 0;
    const wr = Math.min(Number(s.wrong) || 0, att);
    totalAttempts += att;
    totalWrong += wr;
    const acc = att > 0 ? (att - wr) / att : 0;
    rows.push({ key, attempts: att, acc });
  }
  const totalCorrect = totalAttempts - totalWrong;
  const overallPct =
    totalAttempts > 0
      ? Math.round((totalCorrect / totalAttempts) * 100)
      : null;

  const eligible = rows.filter(
    (r) => r.attempts >= INSIGHT_MIN_TOPIC_ATTEMPTS
  );
  const eligibleTopicCount = eligible.length;
  let strongest = null;
  let weakest = null;
  if (eligibleTopicCount >= 1) {
    const byAcc = [...eligible].sort((a, b) => a.acc - b.acc);
    weakest = byAcc[0];
    strongest = byAcc[byAcc.length - 1];
    if (eligibleTopicCount === 1) {
      weakest = null;
    } else if (strongest && weakest && strongest.key === weakest.key) {
      weakest = null;
    }
  }

  const tail = Array.isArray(answerTail) ? answerTail : [];
  let trend = null;
  if (tail.length >= 10) {
    const mid = Math.floor(tail.length / 2);
    const first = tail.slice(0, mid);
    const second = tail.slice(mid);
    const r1 = first.filter(Boolean).length / first.length;
    const r2 = second.filter(Boolean).length / second.length;
    const d = r2 - r1;
    if (d >= 0.2) trend = "up";
    else if (d <= -0.2) trend = "down";
    else trend = "stable";
  }

  const recentN = tail.length;
  const recentPct =
    recentN > 0
      ? Math.round((tail.filter(Boolean).length / recentN) * 100)
      : null;

  return {
    totalAttempts,
    totalCorrect,
    totalWrong,
    overallPct,
    strongest,
    weakest,
    eligibleTopicCount,
    trend,
    recentN,
    recentPct,
  };
}

function buildInsightFeedbackLines(insights, topicAnswerTails) {
  const lines = [];
  const tailMap =
    topicAnswerTails && typeof topicAnswerTails === "object"
      ? topicAnswerTails
      : {};

  if (!insights || (insights.totalAttempts || 0) < 1) return lines;

  const w = insights.weakest;
  if (
    w &&
    w.attempts >= INSIGHT_MIN_TOPIC_ATTEMPTS &&
    w.acc <= 0.55 &&
    TOPICS[w.key]
  ) {
    lines.push(
      `כדאי חיזוק בנושא ${TOPICS[w.key].name} (דיוק ~${Math.round(
        w.acc * 100
      )}%).`
    );
  }

  const s = insights.strongest;
  if (
    s &&
    insights.eligibleTopicCount >= 2 &&
    s.attempts >= INSIGHT_MIN_TOPIC_ATTEMPTS &&
    s.acc >= 0.72 &&
    TOPICS[s.key] &&
    (!w || s.key !== w.key)
  ) {
    const t = `חוזק יחסי בנושא ${TOPICS[s.key].name}.`;
    if (!lines.includes(t)) lines.push(t);
  }

  for (const key of Object.keys(tailMap)) {
    const t = tailMap[key];
    if (!Array.isArray(t) || t.length < 6 || !TOPICS[key]) continue;
    const mid = Math.floor(t.length / 2);
    if (mid < 1) continue;
    const first = t.slice(0, mid);
    const second = t.slice(mid);
    const a = first.filter(Boolean).length / first.length;
    const b = second.filter(Boolean).length / second.length;
    if (b - a >= 0.25) {
      const t2 = `יש שיפור יפה בנושא ${TOPICS[key].name}.`;
      if (!lines.includes(t2)) lines.push(t2);
      break;
    }
  }

  if (insights.trend === "up") {
    const t3 = "מגמת הדיוק ברצף האחרון עולה.";
    if (!lines.includes(t3)) lines.push(t3);
  } else if (insights.trend === "down") {
    const t4 =
      "מגמת הדיוק ברצף האחרון יורדת — כדאי לחזור על החומר.";
    if (!lines.includes(t4)) lines.push(t4);
  }

  return lines.slice(0, 3);
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
    ? 'נסה לחשוב שוב לפי ניסוח השאלה והנקודות ברשימה "מה חשוב לזכור?" למעלה — בלי לנחש מהר מדי.'
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
    const quoted = `\u2066${correctText}\u2069`;
    lines.push(
      `${lines.length + 1}. מתוך כל האפשרויות, רק "${quoted}" מתאים להסבר.`
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
  const correctRef = useRef(0);
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
  const scienceIntelRef = useRef({
    topicStats: {},
    recentIds: [],
    answerTail: [],
    topicAnswerTails: {},
  });
  const adaptiveLevelRef = useRef("easy");
  const correctAdaptiveStreakRef = useRef(0);
  const wrongAdaptiveStreakRef = useRef(0);
  const askCounterRef = useRef(0);
  /** @type {React.MutableRefObject<{ id: string; dueAt: number }[]>} */
  const retryQueueRef = useRef([]);
  const sessionStartRef = useRef(null);
  const sessionSecondsRef = useRef(0);
  const solvedCountRef = useRef(0);
  const pendingScienceTrackMetaRef = useRef(null);
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
  const [playerAvatarImage, setPlayerAvatarImage] = useState(null); // תמונת אווטר מותאמת אישית
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [practiceFocus, setPracticeFocus] = useState("balanced");
  const [focusedPracticeMode, setFocusedPracticeMode] = useState("normal");
  const [mistakes, setMistakes] = useState([]);
  const [insightRevision, setInsightRevision] = useState(0);
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

  useEffect(() => {
    correctRef.current = correct;
  }, [correct]);

  useEffect(() => {
    refreshMistakesList();
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const loaded = loadScienceIntel();
    scienceIntelRef.current = {
      topicStats: { ...loaded.topicStats },
      recentIds: [...loaded.recentIds],
      answerTail: [...loaded.answerTail],
      topicAnswerTails: { ...loaded.topicAnswerTails },
    };
    setInsightRevision((n) => n + 1);
  }, [mounted]);

  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
      return undefined;
    }
    window.__SCIENCE_INTEL_DEBUG = () => ({
      adaptiveLevel: adaptiveLevelRef.current,
      correctStreak: correctAdaptiveStreakRef.current,
      wrongStreak: wrongAdaptiveStreakRef.current,
      retryQueueLength: retryQueueRef.current.length,
      retryQueue: retryQueueRef.current.map((r) => ({ ...r })),
      recentIdsLength: scienceIntelRef.current.recentIds.length,
      insightTailLength: (scienceIntelRef.current.answerTail || []).length,
      askCounter: askCounterRef.current,
      topicStatsSummary: Object.fromEntries(
        Object.entries(scienceIntelRef.current.topicStats).map(([k, v]) => [
          k,
          {
            wrong: v.wrong,
            attempts: v.attempts,
            rate:
              v.attempts > 0
                ? Number((v.wrong / v.attempts).toFixed(3))
                : 0,
          },
        ])
      ),
    });
    return () => {
      try {
        delete window.__SCIENCE_INTEL_DEBUG;
      } catch {
        window.__SCIENCE_INTEL_DEBUG = undefined;
      }
    };
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

  function filterQuestionsForCurrentSettings(levelOverride) {
    const gradeKey = grade;
    const allowedTopicsForGrade =
      GRADES[gradeKey]?.topics || Object.keys(TOPICS);
    const baseLevel =
      levelOverride !== undefined && levelOverride !== null
        ? levelOverride
        : level;
    const sessionCorrect = correctRef.current;
    const levelForFilter =
      focusedPracticeMode === "graded"
        ? sessionCorrect < 5
          ? "easy"
          : sessionCorrect < 15
          ? "medium"
          : level
        : baseLevel;

    if (focusedPracticeMode === "mistakes" && mistakes.length > 0) {
      const ids = new Set(mistakes.map((m) => m.id));
      const byLevel = QUESTIONS.filter(
        (q) => ids.has(q.id) && levelAllowed(q, levelForFilter)
      );
      if (byLevel.length > 0) return byLevel;
      const anyLevel = QUESTIONS.filter((q) => ids.has(q.id));
      if (anyLevel.length > 0) return anyLevel;
      return [];
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

  function getLevelOverrideForFilter() {
    if (
      !gameActive ||
      focusedPracticeMode === "mistakes" ||
      focusedPracticeMode === "graded"
    ) {
      return undefined;
    }
    return adaptiveLevelRef.current;
  }

  function getAssignedLevelForQuestion() {
    if (
      gameActive &&
      focusedPracticeMode !== "mistakes" &&
      focusedPracticeMode !== "graded"
    ) {
      return adaptiveLevelRef.current;
    }
    return level;
  }

  function bumpTopicIntel(topicKey, isWrong) {
    const intel = scienceIntelRef.current;
    const prev = intel.topicStats[topicKey];
    const cur =
      prev && typeof prev === "object"
        ? {
            attempts: Number(prev.attempts) || 0,
            wrong: Number(prev.wrong) || 0,
          }
        : { attempts: 0, wrong: 0 };
    cur.attempts += 1;
    if (isWrong) cur.wrong += 1;
    intel.topicStats = { ...intel.topicStats, [topicKey]: cur };
    const ok = !isWrong;
    intel.answerTail = [...(intel.answerTail || []), ok].slice(
      -INSIGHT_ANSWER_TAIL_MAX
    );
    intel.topicAnswerTails = { ...(intel.topicAnswerTails || {}) };
    if (TOPICS[topicKey]) {
      const tPrev = intel.topicAnswerTails[topicKey] || [];
      intel.topicAnswerTails[topicKey] = [...tPrev, ok].slice(
        -INSIGHT_TOPIC_TAIL_MAX
      );
    }
    persistScienceIntel(intel);
    setInsightRevision((n) => n + 1);
  }

  function pushRecentQuestionId(qid) {
    if (!qid) return;
    const intel = scienceIntelRef.current;
    const next = [...intel.recentIds.filter((x) => x !== qid), qid].slice(
      -INTEL_RECENT_MAX
    );
    intel.recentIds = next;
    persistScienceIntel(intel);
  }

  const progressInsights = useMemo(() => {
    if (!mounted) {
      return {
        base: null,
        feedback: [],
        currentLevelLabel: LEVELS[level]?.name ?? level,
        mistakeLogCount: 0,
      };
    }
    const intel = scienceIntelRef.current;
    const base = computeScienceProgressInsights(
      intel.topicStats,
      intel.answerTail
    );
    const feedback = buildInsightFeedbackLines(base, intel.topicAnswerTails);
    return {
      base,
      feedback,
      currentLevelLabel: LEVELS[level]?.name ?? level,
      mistakeLogCount: mistakes.length,
    };
  }, [mounted, level, mistakes.length, insightRevision]);

  function applyAdaptiveDifficulty(isCorrect, questionId) {
    if (!gameActive) return;

    const canShiftLevel =
      focusedPracticeMode !== "mistakes" &&
      focusedPracticeMode !== "graded";

    if (canShiftLevel) {
      if (isCorrect) {
        wrongAdaptiveStreakRef.current = 0;
        correctAdaptiveStreakRef.current += 1;
        if (correctAdaptiveStreakRef.current >= 3) {
          correctAdaptiveStreakRef.current = 0;
          const cur = adaptiveLevelRef.current;
          const next = stepAdaptiveLevel(cur, 1);
          if (next !== cur) {
            adaptiveLevelRef.current = next;
            setLevel(next);
          }
        }
      } else {
        correctAdaptiveStreakRef.current = 0;
        wrongAdaptiveStreakRef.current += 1;
        if (wrongAdaptiveStreakRef.current >= 2) {
          wrongAdaptiveStreakRef.current = 0;
          const cur = adaptiveLevelRef.current;
          const next = stepAdaptiveLevel(cur, -1);
          if (next !== cur) {
            adaptiveLevelRef.current = next;
            setLevel(next);
          }
        }
      }
    }

    if (!isCorrect && questionId) {
      const delay = 3 + Math.floor(Math.random() * 3);
      retryQueueRef.current.push({
        id: questionId,
        dueAt: askCounterRef.current + delay,
      });
      if (retryQueueRef.current.length > RETRY_QUEUE_MAX) {
        retryQueueRef.current.sort((a, b) => a.dueAt - b.dueAt);
        retryQueueRef.current = retryQueueRef.current.slice(0, RETRY_QUEUE_MAX);
      }
    }
  }

  const refreshMistakesList = () => {
    const stored = loadScienceMistakesFromStorage();
    setMistakes(stored.slice(-SCIENCE_MISTAKES_MAX).reverse());
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
      const meta = pendingScienceTrackMetaRef.current;
      pendingScienceTrackMetaRef.current = null;
      trackScienceTopicTime(
        currentQuestion.topic,
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
      const trimmed = stored.slice(-SCIENCE_MISTAKES_MAX);
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

    if (resetPool) {
      askCounterRef.current = 0;
      retryQueueRef.current = [];
    }
    askCounterRef.current += 1;
    const askCounter = askCounterRef.current;

    const levelForPool = getLevelOverrideForFilter();
    const pool = filterQuestionsForCurrentSettings(levelForPool);

    if (pool.length === 0) {
      questionPoolRef.current = [];
      questionIndexRef.current = 0;
      setCurrentQuestion(null);
      setFeedback(
        "אין עדיין מספיק שאלות לנושא/כיתה/רמה שבחרת. נסה לשנות הגדרה."
      );
      return;
    }

    const intel = scienceIntelRef.current;
    const recentSet = new Set(intel.recentIds);
    const smartPicking = focusedPracticeMode !== "mistakes";

    let q = dequeueEligibleRetry(retryQueueRef.current, pool, askCounter);

    if (!q) {
      const avoidRecent = pool.filter((item) => !recentSet.has(item.id));
      const usedRecentFallback = avoidRecent.length === 0;
      const eligible = usedRecentFallback ? pool : avoidRecent;

      if (smartPicking && !usedRecentFallback) {
        q = weightedPickQuestions(eligible, intel.topicStats);
      } else {
        q = randomItem(eligible);
      }
    }

    if (!q) {
      q = randomItem(pool);
    }

    pushRecentQuestionId(q.id);

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
      assignedLevel: getAssignedLevelForQuestion(),
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
    correctRef.current = 0;
    setWrong(0);
    setTimeLeft(20);
    setSelectedAnswer(null);
    setFeedback(null);
    setLives(3);

    // איפוס מאגר השאלות
    questionPoolRef.current = [];
    questionIndexRef.current = 0;
    retryQueueRef.current = [];
    askCounterRef.current = 0;
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
    adaptiveLevelRef.current = level;
    correctAdaptiveStreakRef.current = 0;
    wrongAdaptiveStreakRef.current = 0;
    setGameActive(true);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    correctRef.current = 0;
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
    pendingScienceTrackMetaRef.current = {
      correct: undefined,
      total: 1,
      mode: reportModeFromGameState(mode, focusedPracticeMode),
    };
    recordSessionProgress();
    saveRunToStorage();
    setGameActive(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedAnswer(null);
  }

  function handleTimeUp() {
    pendingScienceTrackMetaRef.current = {
      correct: 0,
      total: 1,
      mode: reportModeFromGameState(mode, focusedPracticeMode),
    };
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
    pendingScienceTrackMetaRef.current = {
      correct: isCorrect ? 1 : 0,
      total: 1,
      mode: reportModeFromGameState(mode, focusedPracticeMode),
    };
    trackCurrentQuestionTime();
    bumpTopicIntel(currentQuestion.topic, !isCorrect);
    applyAdaptiveDifficulty(isCorrect, isCorrect ? null : currentQuestion.id);
    if (isCorrect) {
      let points = 10 + streak;
      if (mode === "speed" && timeLeft != null) {
        points += Math.floor(timeLeft * 1.5);
      }
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      setCorrect((prev) => {
        const next = prev + 1;
        correctRef.current = next;
        return next;
      });
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
    correctRef.current = 0;
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
          className="relative overflow-hidden game-page-mobile flex flex-col"
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
          className={`relative flex flex-1 min-h-0 flex-col items-center justify-start px-4 min-w-0 ${
            gameActive ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
          }`}
          style={{
            height: "100%",
            maxHeight: "100%",
            paddingTop: "calc(var(--head-h, 56px) + 8px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
          }}
        >
          {/* TITLE */}
          <div className="text-center mb-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-white">
                🔬 Science Master
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

          {/* MODES */}
          <div className="flex items-center justify-center gap-2 mb-2 w-full max-w-md flex-wrap px-1">
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
            <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full max-w-md items-center self-stretch">
              <div
                className="flex flex-nowrap shrink-0 items-center gap-1.5 sm:gap-2 mb-2.5 w-full max-w-md min-w-0 px-1 py-0.5 overflow-x-auto pb-1.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
                dir="rtl"
              >
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
                  className="h-10 shrink-0 w-[3.25rem] px-1.5 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold placeholder:text-white/40 box-border"
                  maxLength={15}
                  dir={playerName && /[\u0590-\u05FF]/.test(playerName) ? "rtl" : "ltr"}
                  style={{
                    textAlign:
                      playerName && /[\u0590-\u05FF]/.test(playerName) ? "right" : "left",
                  }}
                />
                <select
                  value={grade}
                  title={GRADES[grade]?.name || grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-10 shrink-0 min-w-0 w-[5.25rem] max-w-[5.5rem] rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold px-2 box-border overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {GRADE_ORDER.map((g) => (
                    <option key={g} value={g}>
                      {GRADES[g]?.name || g}
                    </option>
                  ))}
                </select>
                <select
                  value={level}
                  disabled={gameActive}
                  title={
                    gameActive
                      ? "רמת קושי מתעדכנת אוטומטית במהלך המשחק"
                      : LEVELS[level]?.name
                  }
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-10 shrink-0 min-w-0 w-[5.25rem] max-w-[5.5rem] rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold px-2 box-border overflow-hidden text-ellipsis whitespace-nowrap disabled:opacity-50"
                >
                  {Object.keys(LEVELS).map((l) => (
                    <option key={l} value={l}>
                      {LEVELS[l].name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-1 min-w-0 items-center gap-1.5 shrink">
                  <select
                    value={topic}
                    title={getTopicLabel(topic)}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      setGameActive(false);
                    }}
                    className="h-10 min-w-0 flex-1 max-w-[12rem] rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold px-2 box-border overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {allowedTopics.map((t) => (
                      <option key={t} value={t}>
                        {getTopicLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* BEST / ACCURACY */}
              <div className="grid grid-cols-4 gap-1.5 mb-2 w-full max-w-md shrink-0" dir="rtl">
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

              <div className="bg-white/5 border border-white/10 rounded-md px-1 pt-1 pb-1 mb-2 w-full max-w-md opacity-90 shrink-0">
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

              {/* סיכום התקדמות — נתונים מקומיים בלבד */}
              <div
                className="w-full max-w-md mb-2 rounded-md border border-white/10 bg-black/20 px-1.5 py-1 text-[8px] sm:text-[9px] leading-tight text-white/85 shrink-0"
                dir="rtl"
              >
                <div className="font-semibold text-emerald-200/90 mb-0.5 flex justify-between gap-2 items-baseline">
                  <span>📊 סיכום למידה (שמור מקומית)</span>
                  {progressInsights.base &&
                    progressInsights.base.totalAttempts > 0 && (
                      <span className="text-white/50 font-normal shrink-0">
                        {progressInsights.base.totalAttempts} תשובות
                      </span>
                    )}
                </div>
                {!progressInsights.base ||
                progressInsights.base.totalAttempts < 1 ? (
                  <p className="text-white/55 leading-tight">
                    אחרי מענה על שאלות: דיוק מעקב, נושאים חזקים/חלשים ומגמה לפי הרצף האחרון.
                  </p>
                ) : (
                  <>
                    <p className="text-white/82 leading-tight mb-0.5">
                      רמה:{" "}
                      <span className="font-bold text-amber-200">
                        {progressInsights.currentLevelLabel}
                      </span>
                      {" · "}
                      יומן שגיאות:{" "}
                      <span className="font-bold text-rose-300">
                        {progressInsights.mistakeLogCount}
                      </span>
                      {" · "}
                      שגויים במעקב:{" "}
                      <span className="font-bold text-white/90">
                        {progressInsights.base.totalWrong}
                      </span>
                    </p>
                    <p className="text-white/82 leading-tight mb-0.5">
                      דיוק במעקב:{" "}
                      <span className="font-bold text-emerald-300">
                        {progressInsights.base.overallPct}%
                      </span>
                      {progressInsights.base.recentN > 0 ? (
                        <>
                          {" · "}
                          {progressInsights.base.recentN} אחרונות:{" "}
                          <span className="font-bold text-sky-200">
                            {progressInsights.base.recentPct}%
                          </span>
                          {progressInsights.base.recentN >= 10 &&
                            progressInsights.base.trend && (
                              <>
                                {" · "}
                                <span className="text-white/65">
                                  {progressInsights.base.trend === "up" && "מגמה ↑"}
                                  {progressInsights.base.trend === "down" && "מגמה ↓"}
                                  {progressInsights.base.trend === "stable" && "מגמה →"}
                                </span>
                              </>
                            )}
                        </>
                      ) : (
                        <span className="text-white/45"> · אין רצף אחרון</span>
                      )}
                    </p>
                    {(progressInsights.base.strongest &&
                      TOPICS[progressInsights.base.strongest.key]) ||
                    (progressInsights.base.weakest &&
                      TOPICS[progressInsights.base.weakest.key]) ? (
                      <p className="text-white/75 leading-tight mb-0.5">
                        {progressInsights.base.strongest &&
                          TOPICS[progressInsights.base.strongest.key] && (
                            <>
                              חזק:{" "}
                              <span className="text-white/90 font-semibold">
                                {TOPICS[progressInsights.base.strongest.key].name}
                              </span>
                            </>
                          )}
                        {progressInsights.base.strongest &&
                          TOPICS[progressInsights.base.strongest.key] &&
                          progressInsights.base.weakest &&
                          TOPICS[progressInsights.base.weakest.key] &&
                          " · "}
                        {progressInsights.base.weakest &&
                          TOPICS[progressInsights.base.weakest.key] && (
                            <>
                              לחזק:{" "}
                              <span className="text-white/90 font-semibold">
                                {TOPICS[progressInsights.base.weakest.key].name}
                              </span>
                            </>
                          )}
                      </p>
                    ) : null}
                    <p className="text-[8px] text-white/48 leading-tight mb-0.5">
                      מינ׳ {INSIGHT_MIN_TOPIC_ATTEMPTS} ניסיונות/נושא · נשמר מקומית בלבד
                    </p>
                    {progressInsights.feedback.length > 0 && (
                      <ul className="list-disc list-inside space-y-0 text-white/76 leading-tight border-t border-white/10 pt-0.5 mt-0.5">
                        {progressInsights.feedback.map((line, i) => (
                          <li
                            key={`${i}-${line.slice(0, 32)}`}
                            style={learningMixedHebrewMathStyle}
                          >
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div className="flex-1 min-h-[36px] w-full shrink-0" aria-hidden />

              <div className="w-full border-t border-white/10 pt-6 mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-1.5 w-full max-w-md flex-wrap px-1">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-9 px-4 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-xs"
                >
                  ▶️ התחל
                </button>
                <button
                  onClick={openLeaderboard}
                  className="h-9 px-3 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-xs"
                >
                  🏆 לוח תוצאות
                </button>
              </div>

              {/* כפתורים עזרה ותרגול ממוקד */}
              <div className="w-full max-w-md flex justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים מדעים כאן?
                </button>
                <button
                  onClick={() => setShowReferenceModal(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-500/80 hover:bg-indigo-500 text-xs font-bold text-white shadow-sm"
                >
                  📚 לוח עזרה
                </button>
                <button
                  onClick={goToParentReport}
                  className="px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm"
                >
                  📊 דוח להורים
                </button>
                <button
                  onClick={() => setShowPracticeOptions(true)}
                  className="px-4 py-2 rounded-lg bg-purple-500/80 hover:bg-purple-500 text-xs font-bold text-white shadow-sm"
                >
                  🎯 תרגול ממוקד
                  {mistakes.length > 0 ? ` (${mistakes.length})` : ""}
                </button>
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
              {/* FEEDBACK */}
              {feedback && (
                <div
                  className={`mb-2 px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                    feedback.includes("מצוין") || feedback.includes("Game Over") === false
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  <div style={learningMixedHebrewMathStyle}>{feedback}</div>
                  {errorExplanation && (
                    <div
                      className="mt-2 text-sm text-red-100/95 font-normal leading-relaxed max-w-prose mx-auto"
                      style={learningMixedHebrewMathStyle}
                    >
                      {errorExplanation}
                    </div>
                  )}
                </div>
              )}

              {/* מה חשוב לזכור - מחוץ ל-container */}
              {mode === "learning" && currentQuestion && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white/80 text-right w-full max-w-xl sm:max-w-2xl" dir="rtl">
                  <div className="font-bold mb-1">📘 מה חשוב לזכור?</div>
                  <ul className="list-disc pr-4 space-y-0.5">
                    {(currentQuestion.theoryLines || []).map((line, i) => (
                      <li key={i} style={learningMixedHebrewMathStyle}>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* QUESTION AREA */}
              <div
                ref={gameRef}
                className="w-full max-w-xl sm:max-w-2xl flex flex-col items-center justify-center mb-2 flex-1 px-1"
                style={{
                  height: "var(--game-h, 400px)",
                  minHeight: "300px",
                }}
              >
                {/* STEM */}
                <div
                  className="text-base sm:text-lg md:text-xl font-bold text-white mb-4 sm:mb-5 text-center leading-snug max-w-xl mx-auto -mt-8 sm:-mt-10"
                  style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                >
                  {currentQuestion
                    ? currentQuestion.stem
                    : "אין שאלה זמינה להגדרה זו."}
                </div>

                {/* HINT + SOLUTION BUTTONS */}
                <div className="flex flex-wrap gap-2 justify-center mb-2" dir="rtl">
                  {!hintUsed && !selectedAnswer && currentQuestion && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowHint(true);
                        setHintUsed(true);
                      }}
                      className={learningHintTriggerBtn}
                    >
                      💡 רמז
                    </button>
                  )}
                  {mode === "learning" && currentQuestion && (
                    <button
                      type="button"
                      onClick={() => setShowSolution(true)}
                      className={learningExplainOpenBtn}
                    >
                      📘 הסבר מלא
                    </button>
                  )}
                </div>

                {showHint && currentQuestion && (
                  <div
                    className="mb-2 px-4 py-3 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-100/95 text-sm text-right w-full max-w-xl sm:max-w-2xl leading-relaxed"
                    style={learningMixedHebrewMathStyle}
                  >
                    {getHintForQuestion(currentQuestion)}
                  </div>
                )}

                {/* ANSWERS */}
                {currentQuestion && (
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full max-w-xl mb-3 auto-rows-fr">
                    {currentQuestion.options?.map((opt, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === currentQuestion.correctIndex;
                      const isWrong = isSelected && !isCorrect;
                      const showResult = selectedAnswer != null;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          disabled={showResult}
                          className={`rounded-xl border-2 px-2.5 py-2.5 sm:px-3 sm:py-3 text-sm font-semibold leading-snug min-h-[5.25rem] sm:min-h-[5.5rem] h-full w-full flex items-center justify-center text-center transition-all duration-150 shadow-sm active:scale-[0.98] disabled:active:scale-100 disabled:cursor-default ${
                            isCorrect && isSelected
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-100 ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-[#0b1121]"
                              : isWrong
                              ? "bg-red-500/30 border-red-400 text-red-100 ring-2 ring-red-400/50 ring-offset-2 ring-offset-[#0b1121]"
                              : showResult && isCorrect
                              ? "bg-emerald-500/25 border-emerald-400/80 text-emerald-100"
                              : !showResult
                              ? "bg-black/30 border-white/15 text-white hover:border-white/40 hover:bg-white/5 hover:shadow"
                              : "bg-black/25 border-white/10 text-white/80"
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
                  className={learningModalOverlay}
                  onClick={() => setShowSolution(false)}
                  dir="rtl"
                >
                  <div
                    className={`${learningModalPanel} overflow-hidden`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={learningModalHeader}>
                      <button
                        type="button"
                        onClick={() => setShowSolution(false)}
                        className={learningModalCloseBtn}
                        aria-label="סגור"
                      >
                        ✖
                      </button>
                      <h3 className={learningModalTitle}>
                        {"\u200Fאיך פותרים את השאלה?"}
                      </h3>
                      <span className="w-10 shrink-0" aria-hidden />
                    </div>
                    <div
                      className="flex-1 min-h-0 overflow-y-auto px-4 pb-3"
                      dir="rtl"
                    >
                      <div className={`mb-3 ${learningQuestionBox}`}>
                        <p
                          className={`${learningQuestionText} text-center`}
                          style={{
                            direction: "rtl",
                            unicodeBidi: "plaintext",
                          }}
                        >
                          {(() => {
                            const q = (currentQuestion.stem || "")
                              .trim()
                              .replace(/^\?+/, "");
                            return q.endsWith("?") ? q : `${q}?`;
                          })()}
                        </p>
                      </div>
                      <div
                        className="space-y-2.5"
                        style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                      >
                        {getSolutionStepsScience(currentQuestion).map(
                          (line, idx) => (
                            <div key={idx} className={learningExplBody}>
                              {line}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className={learningModalFooter}>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setShowSolution(false)}
                          className={learningPrimaryCloseBtn}
                          dir="rtl"
                        >
                          {"\u200Fסגור"}
                        </button>
                      </div>
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
                  <h2 className="text-2xl font-extrabold">🎯 חזרה על שגיאות</h2>
                  <button
                    onClick={() => setShowPracticeModal(false)}
                    className="text-white/80 hover:text-white text-xl px-2"
                  >
                    ✖
                  </button>
                </div>
                {mistakes.length === 0 ? (
                  <p className="text-sm text-white/70 text-center py-4">
                    עדיין אין שגיאות לשמור. תרגל, טעה ולחץ כאן כדי לחזור בדיוק על מה שצריך.
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
                      🧹 נקה שגיאות
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
                  שלוט באימון שלך: חזרה על שגיאות אחרונות, תרגול מדורג (קל ואז מתקדם לרמה שבחרת), או בחירת קטגוריה מדעית.
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-white/60 font-semibold">מצב תרגול</p>
                  {[
                    { value: "normal", label: "תרגול רגיל" },
                    { value: "mistakes", label: "חזרה על שגיאות" },
                    { value: "graded", label: "תרגול מדורג" },
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
                    מצב תרגול ממוקד:{" "}
                    {focusedPracticeMode === "normal"
                      ? "רגיל"
                      : focusedPracticeMode === "mistakes"
                      ? "חזרה על שגיאות"
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
                        id="avatar-image-upload-science"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById("avatar-image-upload-science").click()}
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
                  <li>לחץ על 💡 רמז לקבלת רמז קצר, ועל "📘 הסבר מלא" לפתרון צעד־אחר־צעד.</li>
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
