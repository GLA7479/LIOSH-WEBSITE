// מעקב קל למתמטיקה — localStorage בלבד

const STORAGE_KEY = "mleo_math_learning_intel";
const VERSION = 1;
const TAIL_MAX = 28;

export function loadMathIntel() {
  if (typeof window === "undefined") {
    return { opStats: {}, recentTail: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { opStats: {}, recentTail: [] };
    const data = JSON.parse(raw);
    if (data.v !== VERSION) return { opStats: {}, recentTail: [] };
    return {
      opStats: data.opStats && typeof data.opStats === "object" ? data.opStats : {},
      recentTail: Array.isArray(data.recentTail)
        ? data.recentTail.slice(-TAIL_MAX)
        : [],
    };
  } catch {
    return { opStats: {}, recentTail: [] };
  }
}

export function persistMathIntel(intel) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: VERSION,
        opStats: intel.opStats || {},
        recentTail: (intel.recentTail || []).slice(-TAIL_MAX),
      })
    );
  } catch {
    /* ignore */
  }
}

export function recordMathAnswerIntel(intel, operation, isCorrect) {
  const op = operation || "unknown";
  const prev = intel.opStats[op] || { attempts: 0, wrong: 0 };
  const stats = {
    attempts: prev.attempts + 1,
    wrong: prev.wrong + (isCorrect ? 0 : 1),
  };
  const opStats = { ...intel.opStats, [op]: stats };
  const recentTail = [
    ...(intel.recentTail || []),
    { op, ok: !!isCorrect, at: Date.now() },
  ].slice(-TAIL_MAX);
  return { opStats, recentTail };
}

export function getMathOperationInsights(opStats) {
  const entries = Object.entries(opStats || {}).filter(
    ([, s]) => (s.attempts || 0) >= 2
  );
  if (entries.length === 0) {
    return { weakest: null, strongest: null };
  }
  const scored = entries.map(([operation, s]) => {
    const attempts = s.attempts || 0;
    const wrong = s.wrong || 0;
    return {
      operation,
      rate: attempts ? (attempts - wrong) / attempts : 0,
      attempts,
    };
  });
  scored.sort((a, b) => a.rate - b.rate);
  return {
    weakest: scored[0].operation,
    strongest: scored[scored.length - 1].operation,
  };
}

export function mathQuestionFingerprint(q) {
  if (!q || !q.operation) return "";
  const kind = q.params?.kind ?? "";
  const ca = String(q.correctAnswer ?? "");
  const p = { ...(q.params || {}) };
  delete p.answers;
  const keys = Object.keys(p).sort();
  const sig = keys.map((k) => `${k}:${JSON.stringify(p[k])}`).join("|");
  return `${q.operation}|${kind}|${ca}|${sig}`;
}

export function newMathMistakeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function buildMathQuestionSnapshot(q) {
  if (!q) return null;
  return {
    question: q.question,
    exerciseText: q.exerciseText,
    questionLabel: q.questionLabel,
    correctAnswer: q.correctAnswer,
    answers: Array.isArray(q.answers) ? [...q.answers] : [],
    operation: q.operation,
    params: q.params ? JSON.parse(JSON.stringify(q.params)) : {},
    a: q.a,
    b: q.b,
    isStory: q.isStory,
  };
}
