import {
  isTrackingDebugEnabled,
  trackingDebugRecordSession,
} from "./tracking-debug";
import { safeGetItem, safeSetJson, safeGetJsonArray } from "./safe-local-storage.js";

const PROGRESS_STORAGE_KEY = "LEO_MONTHLY_PROGRESS";
const PROGRESS_LOG_KEY = "LEO_PROGRESS_LOG";

function getYearMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function loadMonthlyProgress() {
  if (typeof window === "undefined") return {};
  const raw = safeGetItem(PROGRESS_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveMonthlyProgress(data) {
  if (typeof window === "undefined") return;
  safeSetJson(PROGRESS_STORAGE_KEY, data);
}

export function addSessionProgress(durationMinutes, exercisesSolved, meta = {}) {
  if (!durationMinutes || durationMinutes <= 0) return;
  if (typeof window === "undefined") return;

  if (isTrackingDebugEnabled()) {
    trackingDebugRecordSession(meta);
  }

  const sessionDate = meta.date ? new Date(meta.date) : new Date();
  const ym = getYearMonth(sessionDate);
  const allProgress = loadMonthlyProgress();
  const prev = allProgress[ym] || { totalMinutes: 0, totalExercises: 0 };

  allProgress[ym] = {
    totalMinutes: prev.totalMinutes + durationMinutes,
    totalExercises: prev.totalExercises + (exercisesSolved || 0),
  };

  saveMonthlyProgress(allProgress);
  appendProgressLog({
    id: Date.now(),
    date: sessionDate.toISOString(),
    minutes: durationMinutes,
    exercises: exercisesSolved || 0,
    subject: meta.subject || "general",
    topic: meta.topic || "",
    grade: meta.grade || "",
    mode: meta.mode || "",
    game: meta.game || "",
  });
}

const REWARD_CHOICE_KEY = "LEO_REWARD_CHOICE";
const REWARD_CELEBRATION_KEY = "LEO_REWARD_CELEBRATION";

export function loadRewardChoice(yearMonth) {
  if (typeof window === "undefined") return null;
  const raw = safeGetItem(REWARD_CHOICE_KEY);
  if (!raw) return null;
  try {
    const all = JSON.parse(raw);
    return all[yearMonth] || null;
  } catch {
    return null;
  }
}

export function saveRewardChoice(yearMonth, choiceKey) {
  if (typeof window === "undefined") return;
  const raw = safeGetItem(REWARD_CHOICE_KEY);
  let all = {};
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
        all = parsed;
      }
    } catch {
      /* keep {} */
    }
  }
  all[yearMonth] = choiceKey;
  safeSetJson(REWARD_CHOICE_KEY, all);
}

export function getCurrentYearMonth() {
  return getYearMonth();
}

export function loadProgressLog() {
  if (typeof window === "undefined") return [];
  const raw = safeGetItem(PROGRESS_LOG_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function appendProgressLog(entry) {
  if (typeof window === "undefined") return;
  try {
    const list = safeGetJsonArray(PROGRESS_LOG_KEY);
    list.push(entry);
    while (list.length > 1000) {
      list.shift();
    }
    safeSetJson(PROGRESS_LOG_KEY, list);
  } catch {
    /* ignore */
  }
}

export function hasRewardCelebrationShown(yearMonth) {
  if (typeof window === "undefined") return false;
  const raw = safeGetItem(REWARD_CELEBRATION_KEY);
  if (!raw) return false;
  try {
    const all = JSON.parse(raw);
    return Boolean(all[yearMonth]);
  } catch {
    return false;
  }
}

export function markRewardCelebrationShown(yearMonth) {
  if (typeof window === "undefined") return;
  const raw = safeGetItem(REWARD_CELEBRATION_KEY);
  let all = {};
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
        all = parsed;
      }
    } catch {
      /* keep {} */
    }
  }
  all[yearMonth] = true;
  safeSetJson(REWARD_CELEBRATION_KEY, all);
}
