/**
 * Parent Report V2 — date-filtered sessions, unified semantics, normalized daily activity.
 * Falls back to generateParentReport (V1) when no sessions fall in the selected range.
 */

import { STORAGE_KEY } from "./math-constants";
import {
  generateParentReport,
  generateRecommendations,
  getOperationName,
  getTopicName,
  getEnglishTopicName,
  getScienceTopicName,
  getHebrewTopicName,
  getMoledetGeographyTopicName,
} from "./math-report-generator";

const GRADE_LABELS = { g1: "א'", g2: "ב'", g3: "ג'", g4: "ד'", g5: "ה'", g6: "ו'" };
const LEVEL_LABELS = { easy: "קל", medium: "בינוני", hard: "קשה" };

const MODE_LABELS = {
  learning: "למידה",
  practice: "תרגול",
  challenge: "אתגר",
  speed: "מהירות",
  graded: "מדורג",
  normal: "רגיל",
  mistakes: "טעויות",
  practice_mistakes: "חזרה על שגיאות",
};

function modeLabel(m) {
  if (m == null || m === "") return "לא זמין";
  return MODE_LABELS[m] || String(m);
}

/** @returns {number|null} */
function parseSessionTime(session) {
  if (!session || typeof session !== "object") return null;
  const t1 = Number(session.timestamp);
  if (Number.isFinite(t1)) return t1;
  if (session.date == null || session.date === "") return null;
  const t2 = new Date(session.date).getTime();
  if (Number.isFinite(t2)) return t2;
  return null;
}

function sessionInRange(session, startMs, endMs) {
  const t = parseSessionTime(session);
  if (!Number.isFinite(t)) return false;
  return t >= startMs && t <= endMs;
}

/** Ensure sessions is always an array (never drop keys due to wrong shape). */
function normalizeSessionsArray(sessions) {
  if (Array.isArray(sessions)) return sessions;
  if (sessions && typeof sessions === "object") return Object.values(sessions);
  return [];
}

/**
 * Build per-key rows from a tracking bucket (operations/topics) without key overwrite.
 * Optional sessionField: if set, sessions may be re-grouped by session[sessionField] (migration / mis-bucket recovery).
 */
function buildMapFromBucket({
  bucket,
  progressData,
  startMs,
  endMs,
  subject,
  displayNameFn,
  sessionField,
}) {
  const map = {};
  const raw = bucket && typeof bucket === "object" && !Array.isArray(bucket) ? bucket : {};

  for (const bucketKey of Object.keys(raw)) {
    const item = raw[bucketKey];
    if (!item || typeof item !== "object") continue;
    const list = normalizeSessionsArray(item.sessions);
    for (const s of list) {
      if (!sessionInRange(s, startMs, endMs)) continue;
      const key =
        sessionField && s[sessionField] != null && String(s[sessionField]) !== ""
          ? String(s[sessionField])
          : String(bucketKey);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
  }

  const out = {};
  for (const itemKey of Object.keys(map)) {
    const sessions = map[itemKey];
    if (!sessions.length) continue;
    const legacy = progressData[itemKey] || { total: 0, correct: 0 };
    out[itemKey] = buildRowSummary({
      subject,
      itemKey,
      sessions,
      legacyProgress: legacy,
      displayNameFn,
    });
  }
  return out;
}

/** Convert legacy daily array (math/geometry/english) to YYYY-MM-DD map */
export function normalizeDailyToDateMap(daily) {
  const out = {};
  if (!daily) return out;
  if (Array.isArray(daily)) {
    daily.forEach((row) => {
      if (row && row.date) {
        out[row.date] = {
          timeMinutes: Math.round((row.total || 0) / 60),
          raw: row,
        };
      }
    });
    return out;
  }
  if (typeof daily === "object") {
    Object.entries(daily).forEach(([date, row]) => {
      out[date] = {
        timeMinutes: Math.round(((row && row.total) || 0) / 60),
        raw: row,
      };
    });
  }
  return out;
}

function dominantKey(counts) {
  const keys = Object.keys(counts);
  if (keys.length === 0) return null;
  return keys.sort((a, b) => counts[b] - counts[a])[0];
}

function countDistribution(sessions, field) {
  const c = {};
  sessions.forEach((s) => {
    const v = s[field];
    if (v == null || v === "") return;
    c[v] = (c[v] || 0) + 1;
  });
  return c;
}

/**
 * Impute correct/total for sessions missing correct, using legacy progress ratio.
 */
function sumQuestionsCorrect(sessions, legacyProgress) {
  let q = 0;
  let correctKnown = 0;
  let unknownQ = 0;
  sessions.forEach((s) => {
    const t = s.total !== undefined && s.total !== null ? Number(s.total) : 1;
    q += t;
    if (typeof s.correct === "number" && !Number.isNaN(s.correct)) {
      correctKnown += s.correct;
    } else {
      unknownQ += t;
    }
  });
  const lt = legacyProgress?.total || 0;
  const lc = legacyProgress?.correct || 0;
  const ratio = lt > 0 ? lc / lt : 0;
  const imputed = unknownQ > 0 ? Math.round(unknownQ * ratio) : 0;
  return { questions: q, correct: correctKnown + imputed };
}

function buildRowSummary({
  subject,
  itemKey,
  sessions,
  legacyProgress,
  displayNameFn,
}) {
  const timeSeconds = sessions.reduce((s, x) => s + (Number(x.duration) || 0), 0);
  const timeMinutes = Math.round(timeSeconds / 60);
  const { questions, correct } = sumQuestionsCorrect(sessions, legacyProgress);
  const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
  const gradeDist = countDistribution(sessions, "grade");
  const levelDist = countDistribution(sessions, "level");
  const modeDist = countDistribution(sessions, "mode");
  const gradeKey = dominantKey(gradeDist);
  const levelKey = dominantKey(levelDist);
  const modeKey = dominantKey(modeDist) || "learning";
  const needsPractice = accuracy < 70;
  const excellent = accuracy >= 90 && questions >= 10;
  const base = {
    subject,
    questions,
    correct,
    wrong: questions - correct,
    accuracy,
    timeMinutes,
    timeHours: (timeMinutes / 60).toFixed(2),
    needsPractice,
    excellent,
    grade: gradeKey ? GRADE_LABELS[gradeKey] || gradeKey : "לא זמין",
    gradeKey,
    level: levelKey ? LEVEL_LABELS[levelKey] || levelKey : "לא זמין",
    levelKey,
    mode: modeLabel(modeKey),
    modeKey,
    displayName: displayNameFn(itemKey),
  };
  if (subject === "math") base.improvement = null;
  return base;
}

const SUBJECTS = [
  {
    id: "math",
    trackingKey: "mleo_time_tracking",
    container: "operations",
    progressStorage: () => STORAGE_KEY + "_progress",
    mistakesKey: "mleo_mistakes",
    mistakeKeyField: "operation",
    topicKey: (m) => m.operation,
    displayName: getOperationName,
  },
  {
    id: "geometry",
    trackingKey: "mleo_geometry_time_tracking",
    container: "topics",
    progressStorage: () => "mleo_geometry_master_progress",
    mistakesKey: "mleo_geometry_mistakes",
    mistakeKeyField: "topic",
    topicKey: (m) => m.topic,
    displayName: getTopicName,
  },
  {
    id: "english",
    trackingKey: "mleo_english_time_tracking",
    container: "topics",
    progressStorage: () => "mleo_english_master_progress",
    mistakesKey: "mleo_english_mistakes",
    mistakeKeyField: "topic",
    topicKey: (m) => m.topic,
    displayName: getEnglishTopicName,
  },
  {
    id: "science",
    trackingKey: "mleo_science_time_tracking",
    container: "topics",
    progressStorage: () => "mleo_science_master_progress",
    mistakesKey: "mleo_science_mistakes",
    mistakeKeyField: "topic",
    topicKey: (m) => m.topic,
    displayName: getScienceTopicName,
  },
  {
    id: "hebrew",
    trackingKey: "mleo_hebrew_time_tracking",
    container: "topics",
    progressStorage: () => "mleo_hebrew_master_progress",
    mistakesKey: "mleo_hebrew_mistakes",
    mistakeKeyField: "topic",
    topicKey: (m) => m.topic,
    displayName: getHebrewTopicName,
  },
  {
    id: "moledet-geography",
    trackingKey: "mleo_moledet_geography_time_tracking",
    container: "topics",
    progressStorage: () => "mleo_moledet_geography_master_progress",
    mistakesKey: "mleo_moledet_geography_mistakes",
    mistakeKeyField: "topic",
    topicKey: (m) => m.topic,
    displayName: getMoledetGeographyTopicName,
  },
];

function loadTracking(rawKey) {
  try {
    return JSON.parse(localStorage.getItem(rawKey) || "{}");
  } catch {
    return {};
  }
}

function loadProgress(path) {
  try {
    return JSON.parse(localStorage.getItem(path) || "{}");
  } catch {
    return {};
  }
}

function countFilteredSessions(startMs, endMs) {
  let n = 0;
  SUBJECTS.forEach((def) => {
    const saved = loadTracking(def.trackingKey);
    const bucket = saved[def.container] || {};
    Object.keys(bucket).forEach((key) => {
      const item = bucket[key];
      normalizeSessionsArray(item.sessions).forEach((s) => {
        if (sessionInRange(s, startMs, endMs)) n += 1;
      });
    });
  });
  return n;
}

function filterMistakes(mistakes, startMs, endMs, keyField) {
  const arr = Array.isArray(mistakes) ? mistakes : [];
  const byKey = {};
  arr.forEach((m) => {
    if (!m.timestamp) return;
    const t = Number(m.timestamp);
    if (t < startMs || t > endMs) return;
    const k = m[keyField];
    if (!k) return;
    if (!byKey[k]) byKey[k] = { count: 0, lastSeen: null };
    byKey[k].count += 1;
    if (!byKey[k].lastSeen || t > new Date(byKey[k].lastSeen).getTime()) {
      byKey[k].lastSeen = m.timestamp;
    }
  });
  return byKey;
}

function buildDailyActivityFromSessions(startMs, endMs) {
  const byDate = {};
  const ensure = (dateStr) => {
    if (!byDate[dateStr]) {
      byDate[dateStr] = {
        date: dateStr,
        timeMinutes: 0,
        questions: 0,
        mathKeys: new Set(),
        geometryKeys: new Set(),
        englishKeys: new Set(),
        scienceKeys: new Set(),
        hebrewKeys: new Set(),
        moledetKeys: new Set(),
      };
    }
    return byDate[dateStr];
  };
  SUBJECTS.forEach((def) => {
    const saved = loadTracking(def.trackingKey);
    const bucket = saved[def.container] || {};
    Object.keys(bucket).forEach((itemKey) => {
      const item = bucket[itemKey];
      normalizeSessionsArray(item.sessions).forEach((s) => {
        if (!sessionInRange(s, startMs, endMs)) return;
        const tMs = parseSessionTime(s);
        if (!Number.isFinite(tMs)) return;
        const d = new Date(tMs);
        const dateStr = d.toISOString().split("T")[0];
        const row = ensure(dateStr);
        const durMin = Math.round((Number(s.duration) || 0) / 60);
        row.timeMinutes += durMin;
        const tq = s.total !== undefined ? Number(s.total) : 1;
        row.questions += tq;
        if (def.id === "math") row.mathKeys.add(itemKey);
        if (def.id === "geometry") row.geometryKeys.add(itemKey);
        if (def.id === "english") row.englishKeys.add(itemKey);
        if (def.id === "science") row.scienceKeys.add(itemKey);
        if (def.id === "hebrew") row.hebrewKeys.add(itemKey);
        if (def.id === "moledet-geography") row.moledetKeys.add(itemKey);
      });
    });
  });
  return Object.values(byDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((r) => ({
      date: r.date,
      timeMinutes: r.timeMinutes,
      questions: r.questions,
      mathTopics: r.mathKeys.size,
      geometryTopics: r.geometryKeys.size,
      englishTopics: r.englishKeys.size,
      scienceTopics: r.scienceKeys.size,
      hebrewTopics: r.hebrewKeys.size,
      moledetGeographyTopics: r.moledetKeys.size,
    }));
}

/**
 * @param {string} playerName
 * @param {string} period 'week'|'month'|'custom'
 * @param {string|null} customStartDate YYYY-MM-DD
 * @param {string|null} customEndDate YYYY-MM-DD
 */
export function generateParentReportV2(
  playerName,
  period = "week",
  customStartDate = null,
  customEndDate = null
) {
  if (typeof window === "undefined") return null;

  const now = new Date();
  let startDate;
  let endDate;

  if (period === "custom" && customStartDate && customEndDate) {
    startDate = new Date(customStartDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(customEndDate);
    endDate.setHours(23, 59, 59, 999);
    if (endDate > now) endDate = now;
  } else {
    const days = period === "week" ? 7 : period === "month" ? 30 : 365;
    endDate = now;
    startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  }

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  if (countFilteredSessions(startMs, endMs) === 0) {
    return generateParentReport(playerName, period, customStartDate, customEndDate);
  }

  const mathOperations = {};
  const geometryTopics = {};
  const englishTopics = {};
  const scienceTopics = {};
  const hebrewTopics = {};
  const moledetGeographyTopics = {};

  const maps = {
    math: mathOperations,
    geometry: geometryTopics,
    english: englishTopics,
    science: scienceTopics,
    hebrew: hebrewTopics,
    "moledet-geography": moledetGeographyTopics,
  };

  let mathTotalQuestions = 0;
  let mathTotalCorrect = 0;
  let geometryTotalQuestions = 0;
  let geometryTotalCorrect = 0;
  let englishTotalQuestions = 0;
  let englishTotalCorrect = 0;
  let scienceTotalQuestions = 0;
  let scienceTotalCorrect = 0;
  let hebrewTotalQuestions = 0;
  let hebrewTotalCorrect = 0;
  let moledetGeographyTotalQuestions = 0;
  let moledetGeographyTotalCorrect = 0;

  SUBJECTS.forEach((def) => {
    const saved = loadTracking(def.trackingKey);
    const progress = loadProgress(def.progressStorage());
    const progressData = progress.progress || {};
    const bucket = saved[def.container] || {};
    const targetMap = maps[def.id];

    const sessionField = def.id === "math" ? "operation" : "topic";
    const built = buildMapFromBucket({
      bucket,
      progressData,
      startMs,
      endMs,
      subject: def.id === "moledet-geography" ? "moledet-geography" : def.id,
      displayNameFn: def.displayName,
      sessionField,
    });

    Object.assign(targetMap, built);

    Object.values(built).forEach((row) => {
      if (def.id === "math") {
        mathTotalQuestions += row.questions;
        mathTotalCorrect += row.correct;
      } else if (def.id === "geometry") {
        geometryTotalQuestions += row.questions;
        geometryTotalCorrect += row.correct;
      } else if (def.id === "english") {
        englishTotalQuestions += row.questions;
        englishTotalCorrect += row.correct;
      } else if (def.id === "science") {
        scienceTotalQuestions += row.questions;
        scienceTotalCorrect += row.correct;
      } else if (def.id === "hebrew") {
        hebrewTotalQuestions += row.questions;
        hebrewTotalCorrect += row.correct;
      } else if (def.id === "moledet-geography") {
        moledetGeographyTotalQuestions += row.questions;
        moledetGeographyTotalCorrect += row.correct;
      }
    });
  });

  const totalQuestions =
    mathTotalQuestions +
    geometryTotalQuestions +
    englishTotalQuestions +
    scienceTotalQuestions +
    hebrewTotalQuestions +
    moledetGeographyTotalQuestions;
  const totalCorrect =
    mathTotalCorrect +
    geometryTotalCorrect +
    englishTotalCorrect +
    scienceTotalCorrect +
    hebrewTotalCorrect +
    moledetGeographyTotalCorrect;
  const overallAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const mathProgress = loadProgress(STORAGE_KEY + "_progress");
  const geometryProgress = loadProgress("mleo_geometry_master_progress");
  const englishProgress = loadProgress("mleo_english_master_progress");
  const scienceProgress = loadProgress("mleo_science_master_progress");
  const hebrewProgress = loadProgress("mleo_hebrew_master_progress");
  const moledetGeographyProgress = loadProgress(
    "mleo_moledet_geography_master_progress"
  );

  const stars =
    (mathProgress.stars || 0) +
    (geometryProgress.stars || 0) +
    (englishProgress.stars || 0) +
    (scienceProgress.stars || 0) +
    (hebrewProgress.stars || 0) +
    (moledetGeographyProgress.stars || 0);
  const xp =
    (mathProgress.xp || 0) +
    (geometryProgress.xp || 0) +
    (englishProgress.xp || 0) +
    (scienceProgress.xp || 0) +
    (hebrewProgress.xp || 0) +
    (moledetGeographyProgress.xp || 0);
  const playerLevel = Math.max(
    mathProgress.playerLevel || 1,
    geometryProgress.playerLevel || 1,
    englishProgress.playerLevel || 1,
    scienceProgress.playerLevel || 1,
    hebrewProgress.playerLevel || 1,
    moledetGeographyProgress.playerLevel || 1
  );

  const mathAchievements = mathProgress.badges || [];
  const geometryAchievements = geometryProgress.badges || [];
  const englishAchievements = englishProgress.badges || [];
  const scienceAchievements = scienceProgress.badges || [];
  const hebrewAchievements = hebrewProgress.badges || [];
  const moledetGeographyAchievements = moledetGeographyProgress.badges || [];
  const achievements = [
    ...mathAchievements,
    ...geometryAchievements,
    ...englishAchievements,
    ...scienceAchievements,
    ...hebrewAchievements,
    ...moledetGeographyAchievements,
  ];

  const mathMistakesByOperation = filterMistakes(
    JSON.parse(localStorage.getItem("mleo_mistakes") || "[]"),
    startMs,
    endMs,
    "operation"
  );
  const geometryMistakesByTopic = filterMistakes(
    JSON.parse(localStorage.getItem("mleo_geometry_mistakes") || "[]"),
    startMs,
    endMs,
    "topic"
  );
  const englishMistakesByTopic = filterMistakes(
    JSON.parse(localStorage.getItem("mleo_english_mistakes") || "[]"),
    startMs,
    endMs,
    "topic"
  );
  const scienceMistakesByTopic = filterMistakes(
    JSON.parse(localStorage.getItem("mleo_science_mistakes") || "[]"),
    startMs,
    endMs,
    "topic"
  );
  const hebrewMistakesByTopic = filterMistakes(
    JSON.parse(localStorage.getItem("mleo_hebrew_mistakes") || "[]"),
    startMs,
    endMs,
    "topic"
  );
  const moledetGeographyMistakesByTopic = filterMistakes(
    JSON.parse(localStorage.getItem("mleo_moledet_geography_mistakes") || "[]"),
    startMs,
    endMs,
    "topic"
  );

  const mathRecommendations = generateRecommendations(
    mathOperations,
    mathMistakesByOperation
  );
  const geometryRecommendations = generateRecommendations(
    geometryTopics,
    geometryMistakesByTopic
  );
  const englishRecommendations = generateRecommendations(
    englishTopics,
    englishMistakesByTopic
  );
  const scienceRecommendations = generateRecommendations(
    scienceTopics,
    scienceMistakesByTopic
  );
  const hebrewRecommendations = generateRecommendations(
    hebrewTopics,
    hebrewMistakesByTopic
  );
  const moledetGeographyRecommendations = generateRecommendations(
    moledetGeographyTopics,
    moledetGeographyMistakesByTopic
  );
  const recommendations = [
    ...mathRecommendations,
    ...geometryRecommendations,
    ...englishRecommendations,
    ...scienceRecommendations,
    ...hebrewRecommendations,
    ...moledetGeographyRecommendations,
  ];

  let totalTimeMinutes = 0;
  [
    mathOperations,
    geometryTopics,
    englishTopics,
    scienceTopics,
    hebrewTopics,
    moledetGeographyTopics,
  ].forEach((m) => {
    Object.values(m).forEach((row) => {
      totalTimeMinutes += row.timeMinutes || 0;
    });
  });

  const dailyActivity = buildDailyActivityFromSessions(startMs, endMs);

  const needsPractice = [
    ...Object.entries(mathOperations)
      .filter(([_, d]) => d.needsPractice)
      .map(([op]) => `חשבון: ${getOperationName(op)}`),
    ...Object.entries(geometryTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(([t]) => `גאומטריה: ${getTopicName(t)}`),
    ...Object.entries(englishTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(([t]) => `אנגלית: ${getEnglishTopicName(t)}`),
    ...Object.entries(scienceTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(([t]) => `מדעים: ${getScienceTopicName(t)}`),
    ...Object.entries(hebrewTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(([t]) => `עברית: ${getHebrewTopicName(t)}`),
    ...Object.entries(moledetGeographyTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(([t]) => `מולדת וגאוגרפיה: ${getMoledetGeographyTopicName(t)}`),
  ];

  const excellent = [
    ...Object.entries(mathOperations)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([op]) => `חשבון: ${getOperationName(op)}`),
    ...Object.entries(geometryTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([t]) => `גאומטריה: ${getTopicName(t)}`),
    ...Object.entries(englishTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([t]) => `אנגלית: ${getEnglishTopicName(t)}`),
    ...Object.entries(scienceTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([t]) => `מדעים: ${getScienceTopicName(t)}`),
    ...Object.entries(hebrewTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([t]) => `עברית: ${getHebrewTopicName(t)}`),
    ...Object.entries(moledetGeographyTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([t]) => `מולדת וגאוגרפיה: ${getMoledetGeographyTopicName(t)}`),
  ];

  const dailyChallenge = JSON.parse(
    localStorage.getItem("mleo_daily_challenge") || "{}"
  );
  const weeklyChallenge = JSON.parse(
    localStorage.getItem("mleo_weekly_challenge") || "{}"
  );

  const allItems = {
    ...Object.fromEntries(
      Object.entries(mathOperations).map(([k, v]) => [`math_${k}`, v])
    ),
    ...Object.fromEntries(
      Object.entries(geometryTopics).map(([k, v]) => [`geometry_${k}`, v])
    ),
    ...Object.fromEntries(
      Object.entries(englishTopics).map(([k, v]) => [`english_${k}`, v])
    ),
    ...Object.fromEntries(
      Object.entries(scienceTopics).map(([k, v]) => [`science_${k}`, v])
    ),
    ...Object.fromEntries(
      Object.entries(hebrewTopics).map(([k, v]) => [`hebrew_${k}`, v])
    ),
    ...Object.fromEntries(
      Object.entries(moledetGeographyTopics).map(([k, v]) => [
        `moledet-geography_${k}`,
        v,
      ])
    ),
  };

  const mathAccuracy =
    mathTotalQuestions > 0
      ? Math.round((mathTotalCorrect / mathTotalQuestions) * 100)
      : 0;
  const geometryAccuracy =
    geometryTotalQuestions > 0
      ? Math.round((geometryTotalCorrect / geometryTotalQuestions) * 100)
      : 0;
  const englishAccuracy =
    englishTotalQuestions > 0
      ? Math.round((englishTotalCorrect / englishTotalQuestions) * 100)
      : 0;
  const scienceAccuracy =
    scienceTotalQuestions > 0
      ? Math.round((scienceTotalCorrect / scienceTotalQuestions) * 100)
      : 0;
  const hebrewAccuracy =
    hebrewTotalQuestions > 0
      ? Math.round((hebrewTotalCorrect / hebrewTotalQuestions) * 100)
      : 0;
  const moledetGeographyAccuracy =
    moledetGeographyTotalQuestions > 0
      ? Math.round(
          (moledetGeographyTotalCorrect / moledetGeographyTotalQuestions) * 100
        )
      : 0;

  return {
    playerName,
    reportVersion: 2,
    period: period === "custom" ? "custom" : period,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    generatedAt: now.toISOString(),
    summary: {
      totalTimeMinutes,
      totalTimeHours: (totalTimeMinutes / 60).toFixed(2),
      totalQuestions,
      totalCorrect,
      overallAccuracy,
      mathQuestions: mathTotalQuestions,
      mathCorrect: mathTotalCorrect,
      mathAccuracy,
      geometryQuestions: geometryTotalQuestions,
      geometryCorrect: geometryTotalCorrect,
      geometryAccuracy,
      englishQuestions: englishTotalQuestions,
      englishCorrect: englishTotalCorrect,
      englishAccuracy,
      scienceQuestions: scienceTotalQuestions,
      scienceCorrect: scienceTotalCorrect,
      scienceAccuracy,
      hebrewQuestions: hebrewTotalQuestions,
      hebrewCorrect: hebrewTotalCorrect,
      hebrewAccuracy,
      moledetGeographyQuestions: moledetGeographyTotalQuestions,
      moledetGeographyCorrect: moledetGeographyTotalCorrect,
      moledetGeographyAccuracy,
      stars,
      playerLevel,
      xp,
      achievements: achievements.length,
    },
    mathOperations,
    geometryTopics,
    englishTopics,
    scienceTopics,
    hebrewTopics,
    moledetGeographyTopics,
    allItems,
    dailyActivity,
    analysis: {
      needsPractice,
      excellent,
      mathMistakesByOperation,
      geometryMistakesByTopic,
      englishMistakesByTopic,
      scienceMistakesByTopic,
      hebrewMistakesByTopic,
      moledetGeographyMistakesByTopic,
      recommendations,
    },
    challenges: {
      daily: {
        questions: dailyChallenge.questions || 0,
        correct: dailyChallenge.correct || 0,
        bestScore: dailyChallenge.bestScore || 0,
      },
      weekly: {
        current: weeklyChallenge.current || 0,
        target: weeklyChallenge.target || 100,
        completed: weeklyChallenge.completed || false,
      },
      bySubject: {
        math: {
          questions: dailyChallenge.questions || 0,
          correct: dailyChallenge.correct || 0,
          bestScore: dailyChallenge.bestScore || 0,
        },
      },
    },
    achievements: achievements.map((name) => ({ name, earned: true })),
  };
}
