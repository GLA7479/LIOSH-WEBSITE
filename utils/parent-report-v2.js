/**
 * Parent Report — date-filtered sessions only (single pipeline).
 * One storage bucket (operations.* or topics.*) = one table row; no V1 fallback.
 */

import { STORAGE_KEY } from "./math-constants";
import {
  generateRecommendations,
  getMathReportBucketDisplayName,
  getTopicName,
  getEnglishTopicName,
  getScienceTopicName,
  getHebrewTopicName,
  getMoledetGeographyTopicName,
  mathReportBaseOperationKey,
  formatParentReportGradeLabel,
  canonicalParentReportGradeKey,
} from "./math-report-generator";
import { mistakeTimestampMs } from "./mistake-event";
import { analyzeLearningPatterns } from "./learning-patterns-analysis";
import { enrichTopicMapsWithRowDiagnostics } from "./parent-report-row-diagnostics";
import { enrichTopicMapsWithRowTrends } from "./parent-report-row-trend";
import { enrichTopicMapsWithRowBehaviorProfiles } from "./parent-report-row-behavior";
import { validateParentReportDataIntegrity } from "./parent-report-data-integrity";
import { enrichReportMapsWithTopicStepHints } from "./topic-next-step-engine";

const LEVEL_LABELS = { easy: "קל", medium: "בינוני", hard: "קשה" };

const MODE_LABELS = {
  learning: "למידה",
  practice: "תרגול",
  challenge: "אתגר",
  speed: "מהירות",
  marathon: "מרתון",
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

/** Latest session timestamp in a row's sessions (for תאריך אחרון). */
function latestSessionMs(sessions) {
  let max = null;
  if (!Array.isArray(sessions)) return max;
  for (const s of sessions) {
    const t = parseSessionTime(s);
    if (!Number.isFinite(t)) continue;
    if (max === null || t > max) max = t;
  }
  return max;
}

/** DD/MM/YYYY HH:mm (local), matches report date style + time when available. */
function formatLastSessionAt(ms) {
  if (!Number.isFinite(ms)) return "לא זמין";
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

/** Ensure sessions is always an array (never drop keys due to wrong shape). */
function normalizeSessionsArray(sessions) {
  if (Array.isArray(sessions)) return sessions;
  if (sessions && typeof sessions === "object") return Object.values(sessions);
  return [];
}

/**
 * Duration in seconds for aggregation. Uses session.duration when present; if duration is
 * undefined/null, estimates (session.total || 0) * 30 seconds per question (geometry/math trackers store seconds).
 */
function sessionDurationSeconds(session) {
  if (!session || typeof session !== "object") return 0;
  if (session.duration !== undefined && session.duration !== null) {
    const n = Number(session.duration);
    if (Number.isFinite(n) && n >= 0) return n;
    return 0;
  }
  const total = session.total !== undefined && session.total !== null ? Number(session.total) : 0;
  const t = Number.isFinite(total) ? total : 0;
  return t * 30;
}

/**
 * Build rows from a tracking bucket — same rule as geometry: row key = storage bucket id only.
 * Sessions are grouped under the bucket they were saved in; date is the only session filter.
 */
function buildMapFromBucket({
  bucket,
  progressData,
  startMs,
  endMs,
  subject,
  displayNameFn,
}) {
  const map = {};
  const raw = bucket && typeof bucket === "object" && !Array.isArray(bucket) ? bucket : {};

  for (const bucketKey of Object.keys(raw)) {
    const item = raw[bucketKey];
    if (!item || typeof item !== "object") continue;
    const list = normalizeSessionsArray(item.sessions);
    const storageKey = String(bucketKey);
    const rowBucketKey =
      subject === "math" ? mathReportBaseOperationKey(storageKey) : storageKey;
    for (const s of list) {
      if (!sessionInRange(s, startMs, endMs)) continue;
      const modeNorm = normalizeSessionMode(s);
      const compositeKey = `${rowBucketKey}${TRACK_ROW_MODE_SEP}${modeNorm}`;
      if (!map[compositeKey]) map[compositeKey] = [];
      map[compositeKey].push(s);
    }
  }

  const out = {};
  for (const itemKey of Object.keys(map)) {
    const sessions = map[itemKey];
    if (!sessions.length) continue;
    const { bucketKey } = splitBucketModeRowKey(itemKey);
    const progressLookupKey = bucketKey;
    const legacy = progressData[progressLookupKey] || { total: 0, correct: 0 };
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

/** Composite report row key = storage bucket id + mode (Option A: one row per bucket+mode). */
const TRACK_ROW_MODE_SEP = "\u0001";

function normalizeSessionMode(s) {
  if (!s || typeof s !== "object") return "learning";
  const m = s.mode;
  if (m == null || m === "") return "learning";
  const t = String(m).trim();
  return t || "learning";
}

export function splitBucketModeRowKey(itemKey) {
  if (typeof itemKey !== "string") {
    return { bucketKey: String(itemKey), modeKey: null };
  }
  const i = itemKey.indexOf(TRACK_ROW_MODE_SEP);
  if (i === -1) return { bucketKey: itemKey, modeKey: null };
  return {
    bucketKey: itemKey.slice(0, i),
    modeKey: itemKey.slice(i + TRACK_ROW_MODE_SEP.length) || null,
  };
}

function dominantKey(counts) {
  const keys = Object.keys(counts);
  if (keys.length === 0) return null;
  return keys.sort((a, b) => counts[b] - counts[a])[0];
}

/** כיתה/רמה לתצוגה: הערך מהסשן העדכני ביותר בטווח (לא שכיחות היסטורית). */
function latestSessionFieldValue(sessions, field) {
  let bestT = -Infinity;
  let bestVal = null;
  if (!Array.isArray(sessions)) return null;
  for (const s of sessions) {
    const t = parseSessionTime(s);
    if (!Number.isFinite(t)) continue;
    const v = s[field];
    if (v == null || v === "") continue;
    if (t >= bestT) {
      bestT = t;
      bestVal = v;
    }
  }
  return bestVal;
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
  const { bucketKey, modeKey: modeFromKey } = splitBucketModeRowKey(itemKey);
  const timeSeconds = sessions.reduce((s, x) => s + sessionDurationSeconds(x), 0);
  const timeMinutes = Math.round(timeSeconds / 60);
  const { questions, correct } = sumQuestionsCorrect(sessions, legacyProgress);
  const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;
  const gradeDist = countDistribution(sessions, "grade");
  const levelDist = countDistribution(sessions, "level");
  const modeDist = countDistribution(sessions, "mode");
  const gradeKeyLatest = latestSessionFieldValue(sessions, "grade");
  const levelKeyLatest = latestSessionFieldValue(sessions, "level");
  const gradeKeyRaw =
    gradeKeyLatest != null && gradeKeyLatest !== ""
      ? gradeKeyLatest
      : dominantKey(gradeDist);
  const gradeKey = canonicalParentReportGradeKey(gradeKeyRaw);
  const levelKey =
    levelKeyLatest != null && levelKeyLatest !== ""
      ? levelKeyLatest
      : dominantKey(levelDist);
  const modeKey =
    modeFromKey && modeFromKey !== ""
      ? modeFromKey
      : dominantKey(modeDist) || "learning";
  const needsPractice = accuracy < 70;
  const excellent = accuracy >= 90 && questions >= 10;
  const topicOpLabel = displayNameFn(bucketKey);
  const modeStr = modeLabel(modeKey);
  const lastMs = latestSessionMs(sessions);
  const lastSessionAt = formatLastSessionAt(lastMs);
  const base = {
    subject,
    bucketKey,
    lastSessionAt,
    lastSessionMs: Number.isFinite(lastMs) ? lastMs : null,
    questions,
    correct,
    wrong: questions - correct,
    accuracy,
    timeMinutes,
    timeHours: (timeMinutes / 60).toFixed(2),
    needsPractice,
    excellent,
    grade: formatParentReportGradeLabel(gradeKeyRaw),
    gradeKey,
    level: levelKey ? LEVEL_LABELS[levelKey] || levelKey : "לא זמין",
    levelKey,
    mode: modeStr,
    modeKey,
    // Topic/op only — mode appears in the dedicated מצב column in parent-report UI.
    displayName: topicOpLabel,
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
    displayName: getMathReportBucketDisplayName,
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

/**
 * Aggregate mistake counts by topic/op key. Supports legacy rows (storedAt, topic in snapshot, operation-only Hebrew/Moledet).
 * @param {unknown[]} mistakes
 * @param {number} startMs
 * @param {number} endMs
 * @param {(m: Record<string, unknown>) => string|undefined|null} getKey
 */
function filterMistakes(mistakes, startMs, endMs, getKey) {
  const arr = Array.isArray(mistakes) ? mistakes : [];
  const byKey = {};
  arr.forEach((m) => {
    if (!m || typeof m !== "object") return;
    const t = mistakeTimestampMs(m);
    if (t === null || t < startMs || t > endMs) return;
    const k = getKey(m);
    if (!k) return;
    if (!byKey[k]) byKey[k] = { count: 0, lastSeen: null };
    byKey[k].count += 1;
    if (!byKey[k].lastSeen || t > new Date(byKey[k].lastSeen).getTime()) {
      byKey[k].lastSeen = m.timestamp ?? m.storedAt;
    }
  });
  return byKey;
}

function mistakesInDateRange(mistakes, startMs, endMs) {
  const arr = Array.isArray(mistakes) ? mistakes : [];
  return arr.filter((m) => {
    if (!m || typeof m !== "object") return false;
    const t = mistakeTimestampMs(m);
    return t !== null && t >= startMs && t <= endMs;
  });
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
        const durMin = Math.round(sessionDurationSeconds(s) / 60);
        row.timeMinutes += durMin;
        const tq = s.total !== undefined ? Number(s.total) : 1;
        row.questions += tq;
        if (def.id === "math")
          row.mathKeys.add(mathReportBaseOperationKey(String(itemKey)));
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

    const built = buildMapFromBucket({
      bucket,
      progressData,
      startMs,
      endMs,
      subject: def.id === "moledet-geography" ? "moledet-geography" : def.id,
      displayNameFn: def.displayName,
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

  const mathMistakesRaw = JSON.parse(localStorage.getItem("mleo_mistakes") || "[]");
  const geometryMistakesRaw = JSON.parse(
    localStorage.getItem("mleo_geometry_mistakes") || "[]"
  );
  const englishMistakesRaw = JSON.parse(
    localStorage.getItem("mleo_english_mistakes") || "[]"
  );
  const scienceMistakesRaw = JSON.parse(
    localStorage.getItem("mleo_science_mistakes") || "[]"
  );
  const hebrewMistakesRaw = JSON.parse(
    localStorage.getItem("mleo_hebrew_mistakes") || "[]"
  );
  const moledetGeographyMistakesRaw = JSON.parse(
    localStorage.getItem("mleo_moledet_geography_mistakes") || "[]"
  );

  const mathMistakesByOperation = filterMistakes(
    mathMistakesRaw,
    startMs,
    endMs,
    (m) => m.operation
  );
  const geometryMistakesByTopic = filterMistakes(
    geometryMistakesRaw,
    startMs,
    endMs,
    (m) => m.topic || (m.snapshot && m.snapshot.topic)
  );
  const englishMistakesByTopic = filterMistakes(
    englishMistakesRaw,
    startMs,
    endMs,
    (m) => m.topic
  );
  const scienceMistakesByTopic = filterMistakes(
    scienceMistakesRaw,
    startMs,
    endMs,
    (m) => m.topic
  );
  const hebrewMistakesByTopic = filterMistakes(
    hebrewMistakesRaw,
    startMs,
    endMs,
    (m) => m.topic || m.operation
  );
  const moledetGeographyMistakesByTopic = filterMistakes(
    moledetGeographyMistakesRaw,
    startMs,
    endMs,
    (m) => m.topic || m.operation
  );

  const rawMistakesBySubject = {
    math: mistakesInDateRange(mathMistakesRaw, startMs, endMs),
    geometry: mistakesInDateRange(geometryMistakesRaw, startMs, endMs),
    english: mistakesInDateRange(englishMistakesRaw, startMs, endMs),
    science: mistakesInDateRange(scienceMistakesRaw, startMs, endMs),
    hebrew: mistakesInDateRange(hebrewMistakesRaw, startMs, endMs),
    "moledet-geography": mistakesInDateRange(
      moledetGeographyMistakesRaw,
      startMs,
      endMs
    ),
  };

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
      .map(
        ([_, d]) =>
          `חשבון: ${d.displayName || getMathReportBucketDisplayName(d.bucketKey)}`
      ),
    ...Object.entries(geometryTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(([_, d]) => `גאומטריה: ${d.displayName || getTopicName(d.bucketKey)}`),
    ...Object.entries(englishTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(([_, d]) => `אנגלית: ${d.displayName || getEnglishTopicName(d.bucketKey)}`),
    ...Object.entries(scienceTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(([_, d]) => `מדעים: ${d.displayName || getScienceTopicName(d.bucketKey)}`),
    ...Object.entries(hebrewTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(([_, d]) => `עברית: ${d.displayName || getHebrewTopicName(d.bucketKey)}`),
    ...Object.entries(moledetGeographyTopics)
      .filter(([_, d]) => d.needsPractice)
      .map(
        ([_, d]) =>
          `מולדת וגאוגרפיה: ${d.displayName || getMoledetGeographyTopicName(d.bucketKey)}`
      ),
  ];

  const excellent = [
    ...Object.entries(mathOperations)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(
        ([_, d]) =>
          `חשבון: ${d.displayName || getMathReportBucketDisplayName(d.bucketKey)}`
      ),
    ...Object.entries(geometryTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([_, d]) => `גאומטריה: ${d.displayName || getTopicName(d.bucketKey)}`),
    ...Object.entries(englishTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([_, d]) => `אנגלית: ${d.displayName || getEnglishTopicName(d.bucketKey)}`),
    ...Object.entries(scienceTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([_, d]) => `מדעים: ${d.displayName || getScienceTopicName(d.bucketKey)}`),
    ...Object.entries(hebrewTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(([_, d]) => `עברית: ${d.displayName || getHebrewTopicName(d.bucketKey)}`),
    ...Object.entries(moledetGeographyTopics)
      .filter(([_, d]) => d.excellent && d.questions >= 10)
      .map(
        ([_, d]) =>
          `מולדת וגאוגרפיה: ${d.displayName || getMoledetGeographyTopicName(d.bucketKey)}`
      ),
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

  const mistakesBySubjectMaps = {
    math: mathMistakesByOperation,
    geometry: geometryMistakesByTopic,
    english: englishMistakesByTopic,
    science: scienceMistakesByTopic,
    hebrew: hebrewMistakesByTopic,
    "moledet-geography": moledetGeographyMistakesByTopic,
  };
  const trackingSnapshots = {};
  SUBJECTS.forEach((def) => {
    const saved = loadTracking(def.trackingKey);
    trackingSnapshots[def.id] = saved[def.container] || {};
  });

  enrichTopicMapsWithRowDiagnostics(maps, mistakesBySubjectMaps, endMs);
  enrichTopicMapsWithRowTrends(maps, trackingSnapshots, rawMistakesBySubject, startMs, endMs);
  enrichTopicMapsWithRowBehaviorProfiles(maps, rawMistakesBySubject, startMs, endMs);
  enrichReportMapsWithTopicStepHints(maps, mistakesBySubjectMaps, endMs);

  const dataIntegrityReport = validateParentReportDataIntegrity({
    trackingSnapshots,
    rawMistakesBySubject,
    maps,
    dailyActivity,
    startMs,
    endMs,
  });

  const patternDiagnostics = analyzeLearningPatterns(
    {
      mathOperations,
      geometryTopics,
      englishTopics,
      scienceTopics,
      hebrewTopics,
      moledetGeographyTopics,
    },
    rawMistakesBySubject
  );

  const INSUFFICIENT_SUBJECT_Q = 8;
  const insufficientDataSubjectsHe = [];
  if ((mathTotalQuestions || 0) < INSUFFICIENT_SUBJECT_Q) {
    insufficientDataSubjectsHe.push(`חשבון (${mathTotalQuestions} שאלות בטווח)`);
  }
  if ((geometryTotalQuestions || 0) < INSUFFICIENT_SUBJECT_Q) {
    insufficientDataSubjectsHe.push(`גאומטריה (${geometryTotalQuestions} שאלות בטווח)`);
  }
  if ((englishTotalQuestions || 0) < INSUFFICIENT_SUBJECT_Q) {
    insufficientDataSubjectsHe.push(`אנגלית (${englishTotalQuestions} שאלות בטווח)`);
  }
  if ((scienceTotalQuestions || 0) < INSUFFICIENT_SUBJECT_Q) {
    insufficientDataSubjectsHe.push(`מדעים (${scienceTotalQuestions} שאלות בטווח)`);
  }
  if ((hebrewTotalQuestions || 0) < INSUFFICIENT_SUBJECT_Q) {
    insufficientDataSubjectsHe.push(`עברית (${hebrewTotalQuestions} שאלות בטווח)`);
  }
  if ((moledetGeographyTotalQuestions || 0) < INSUFFICIENT_SUBJECT_Q) {
    insufficientDataSubjectsHe.push(`מולדת וגאוגרפיה (${moledetGeographyTotalQuestions} שאלות בטווח)`);
  }

  const diagnosticOverviewHe = {
    strongestAreaLineHe: excellent[0] || null,
    mainFocusAreaLineHe: needsPractice[0] || null,
    readyForProgressPreviewHe: excellent.filter(Boolean).slice(1, 4),
    requiresAttentionPreviewHe: needsPractice.slice(0, 5),
    insufficientDataSubjectsHe,
  };

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
      diagnosticOverviewHe,
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
    /** Data-driven diagnostics (JSON-only in phase 1); UI unchanged. */
    patternDiagnostics,
    /** שלמות נתונים — לבדיקה; לא מוצג ב־UI בשלב 1 */
    dataIntegrityReport,
  };
}
