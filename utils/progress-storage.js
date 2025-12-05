const PROGRESS_STORAGE_KEY = "LEO_MONTHLY_PROGRESS";

function getYearMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function loadMonthlyProgress() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveMonthlyProgress(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function addSessionProgress(durationMinutes, exercisesSolved, date = new Date()) {
  if (!durationMinutes || durationMinutes <= 0) return;
  if (typeof window === "undefined") return;

  const ym = getYearMonth(date);
  const allProgress = loadMonthlyProgress();
  const prev = allProgress[ym] || { totalMinutes: 0, totalExercises: 0 };

  allProgress[ym] = {
    totalMinutes: prev.totalMinutes + durationMinutes,
    totalExercises: prev.totalExercises + (exercisesSolved || 0),
  };

  saveMonthlyProgress(allProgress);
}

const REWARD_CHOICE_KEY = "LEO_REWARD_CHOICE";

export function loadRewardChoice(yearMonth) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REWARD_CHOICE_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    return all[yearMonth] || null;
  } catch {
    return null;
  }
}

export function saveRewardChoice(yearMonth, choiceKey) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(REWARD_CHOICE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[yearMonth] = choiceKey;
    localStorage.setItem(REWARD_CHOICE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getCurrentYearMonth() {
  return getYearMonth();
}

