/**
 * Build localStorage-shaped snapshots for deep parent-report simulations.
 * Schema aligned with utils/parent-report-v2.js + subject time-tracking writers.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** @typedef {{ subject: string, bucket: string, timestamp: number, date: string, total: number, correct: number, duration: number, grade: string, level: string, mode: string }} SimSession */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStringToSeed(s) {
  let h = 1779033703;
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function ymd(d) {
  return d.toISOString().split("T")[0];
}

function sessionDateFromTs(ts) {
  return ymd(new Date(ts));
}

function emptyMathTracking() {
  return { operations: {}, daily: {} };
}

function emptyTopicTracking() {
  return { topics: {}, daily: {} };
}

function ensureMathOp(track, op) {
  if (!track.operations[op]) {
    track.operations[op] = { total: 0, sessions: [], byGrade: {}, byLevel: {} };
  }
  return track.operations[op];
}

function ensureTopic(track, topic) {
  if (!track.topics[topic]) {
    track.topics[topic] = { total: 0, sessions: [], byGrade: {}, byLevel: {} };
  }
  return track.topics[topic];
}

function bumpDailyMath(track, dateStr, op, duration, grade, level) {
  if (!track.daily[dateStr]) {
    track.daily[dateStr] = { total: 0, operations: {}, byGrade: {}, byLevel: {} };
  }
  const d = track.daily[dateStr];
  d.total += duration;
  d.operations[op] = (d.operations[op] || 0) + duration;
  d.byGrade[grade] = (d.byGrade[grade] || 0) + duration;
  d.byLevel[level] = (d.byLevel[level] || 0) + duration;
}

function bumpDailyTopic(track, dateStr, topic, duration, grade, level) {
  if (!track.daily[dateStr]) {
    track.daily[dateStr] = { total: 0, topics: {}, byGrade: {}, byLevel: {} };
  }
  const d = track.daily[dateStr];
  d.total += duration;
  d.topics[topic] = (d.topics[topic] || 0) + duration;
  d.byGrade[grade] = (d.byGrade[grade] || 0) + duration;
  d.byLevel[level] = (d.byLevel[level] || 0) + duration;
}

function rebuildMathDaily(track) {
  track.daily = {};
  for (const [op, bucket] of Object.entries(track.operations || {})) {
    for (const s of bucket.sessions || []) {
      const dateStr = s.date || sessionDateFromTs(s.timestamp);
      bumpDailyMath(track, dateStr, op, Number(s.duration) || 0, s.grade, s.level);
    }
  }
}

function rebuildTopicDaily(track) {
  track.daily = {};
  for (const [topic, bucket] of Object.entries(track.topics || {})) {
    for (const s of bucket.sessions || []) {
      const dateStr = s.date || sessionDateFromTs(s.timestamp);
      bumpDailyTopic(track, dateStr, topic, Number(s.duration) || 0, s.grade, s.level);
    }
  }
}

function progressFromSessionsMath(operations) {
  const progress = {};
  for (const [op, b] of Object.entries(operations || {})) {
    let t = 0;
    let c = 0;
    for (const s of b.sessions || []) {
      const tot = Number(s.total);
      const cor = Number(s.correct);
      if (Number.isFinite(tot) && tot > 0 && Number.isFinite(cor) && cor >= 0 && cor <= tot) {
        t += tot;
        c += cor;
      }
    }
    if (t > 0) progress[op] = { total: t, correct: c };
  }
  const q = Object.values(progress).reduce((a, x) => a + x.total, 0);
  const cq = Object.values(progress).reduce((a, x) => a + x.correct, 0);
  return {
    progress,
    stars: Math.min(5, Math.max(1, Math.round((cq / Math.max(1, q)) * 5))),
    playerLevel: Math.max(1, Math.min(12, Math.round(q / 120))),
    xp: q * 6,
    badges: [],
  };
}

function progressFromTopicMap(topics) {
  const progress = {};
  for (const [topic, b] of Object.entries(topics || {})) {
    let t = 0;
    let c = 0;
    for (const s of b.sessions || []) {
      const tot = Number(s.total);
      const cor = Number(s.correct);
      if (Number.isFinite(tot) && tot > 0 && Number.isFinite(cor) && cor >= 0 && cor <= tot) {
        t += tot;
        c += cor;
      }
    }
    if (t > 0) progress[topic] = { total: t, correct: c };
  }
  const q = Object.values(progress).reduce((a, x) => a + x.total, 0);
  const cq = Object.values(progress).reduce((a, x) => a + x.correct, 0);
  return {
    progress,
    stars: Math.min(5, Math.max(1, Math.round((cq / Math.max(1, q)) * 5))),
    playerLevel: Math.max(1, Math.min(12, Math.round(q / 140))),
    xp: q * 5,
    badges: [],
  };
}

function pushMistakes(arr, { subject, bucket, grade, level, mode, timestamp, patternFamily, responseMs, n }) {
  for (let i = 0; i < n; i += 1) {
    arr.push({
      subject,
      topic: bucket,
      operation: subject === "math" ? bucket : undefined,
      bucketKey: bucket,
      grade,
      level,
      mode,
      timestamp: timestamp + i,
      isCorrect: false,
      exerciseText: `${subject}:${bucket}`,
      correctAnswer: 1,
      userAnswer: 0,
      patternFamily: patternFamily || `pf:${subject}:${bucket}`,
      hintUsed: i % 3 === 0,
      responseMs: responseMs != null ? responseMs + i * 20 : 800 + i * 15,
    });
  }
}

/**
 * @param {SimSession[]} sessions
 * @param {string} playerName
 */
export function buildStorageSnapshotFromSessions(sessions, playerName) {
  const mleo_time_tracking = emptyMathTracking();
  const mleo_geometry_time_tracking = emptyTopicTracking();
  const mleo_english_time_tracking = emptyTopicTracking();
  const mleo_science_time_tracking = emptyTopicTracking();
  const mleo_hebrew_time_tracking = emptyTopicTracking();
  const mleo_moledet_geography_time_tracking = emptyTopicTracking();

  const mistakes = {
    mleo_mistakes: [],
    mleo_geometry_mistakes: [],
    mleo_english_mistakes: [],
    mleo_science_mistakes: [],
    mleo_hebrew_mistakes: [],
    mleo_moledet_geography_mistakes: [],
  };

  const sorted = [...sessions].sort((a, b) => a.timestamp - b.timestamp);

  for (const s of sorted) {
    const dateStr = s.date || sessionDateFromTs(s.timestamp);
    const duration = Math.max(60, Number(s.duration) || 0);
    const total = Number(s.total);
    const correct = Number(s.correct);
    const wrong = Math.max(0, total - correct);

    if (s.subject === "math") {
      const b = ensureMathOp(mleo_time_tracking, s.bucket);
      b.total += duration;
      b.byGrade[s.grade] = (b.byGrade[s.grade] || 0) + duration;
      b.byLevel[s.level] = (b.byLevel[s.level] || 0) + duration;
      b.sessions.push({
        date: dateStr,
        duration,
        grade: s.grade,
        level: s.level,
        operation: s.bucket,
        mathReportBucket: s.bucket,
        timestamp: s.timestamp,
        mode: s.mode || "learning",
        total,
        correct,
      });
      const pf = `pf:math:${s.bucket}`;
      pushMistakes(mistakes.mleo_mistakes, {
        subject: "math",
        bucket: s.bucket,
        grade: s.grade,
        level: s.level,
        mode: s.mode,
        timestamp: s.timestamp,
        patternFamily: pf,
        responseMs:
          s.mode === "speed"
            ? 400 + (s.timestamp % 200)
            : 2200 + (s.timestamp % 800),
        n: Math.min(wrong, Math.max(0, Math.round(wrong * 0.65))),
      });
    } else {
      const trackKey =
        s.subject === "geometry"
          ? mleo_geometry_time_tracking
          : s.subject === "english"
            ? mleo_english_time_tracking
            : s.subject === "science"
              ? mleo_science_time_tracking
              : s.subject === "hebrew"
                ? mleo_hebrew_time_tracking
                : mleo_moledet_geography_time_tracking;
      const mk =
        s.subject === "geometry"
          ? mistakes.mleo_geometry_mistakes
          : s.subject === "english"
            ? mistakes.mleo_english_mistakes
            : s.subject === "science"
              ? mistakes.mleo_science_mistakes
              : s.subject === "hebrew"
                ? mistakes.mleo_hebrew_mistakes
                : mistakes.mleo_moledet_geography_mistakes;
      const b = ensureTopic(trackKey, s.bucket);
      b.total += duration;
      b.byGrade[s.grade] = (b.byGrade[s.grade] || 0) + duration;
      b.byLevel[s.level] = (b.byLevel[s.level] || 0) + duration;
      b.sessions.push({
        date: dateStr,
        duration,
        grade: s.grade,
        level: s.level,
        topic: s.bucket,
        timestamp: s.timestamp,
        mode: s.mode || "learning",
        total,
        correct,
      });
      pushMistakes(mk, {
        subject: s.subject,
        bucket: s.bucket,
        grade: s.grade,
        level: s.level,
        mode: s.mode,
        timestamp: s.timestamp,
        patternFamily: `pf:${s.subject}:${s.bucket}`,
        responseMs: s.mode === "speed" ? 450 : 2400,
        n: Math.min(wrong, Math.max(0, Math.round(wrong * 0.55))),
      });
    }
  }

  rebuildMathDaily(mleo_time_tracking);
  rebuildTopicDaily(mleo_geometry_time_tracking);
  rebuildTopicDaily(mleo_english_time_tracking);
  rebuildTopicDaily(mleo_science_time_tracking);
  rebuildTopicDaily(mleo_hebrew_time_tracking);
  rebuildTopicDaily(mleo_moledet_geography_time_tracking);

  const totalQ = sorted.reduce((a, s) => a + (Number.isFinite(Number(s.total)) ? Number(s.total) : 0), 0);
  const totalC = sorted.reduce((a, s) => a + (Number.isFinite(Number(s.correct)) ? Number(s.correct) : 0), 0);

  return {
    mleo_player_name: playerName,
    mleo_time_tracking,
    mleo_math_master_progress: progressFromSessionsMath(mleo_time_tracking.operations),
    mleo_mistakes: mistakes.mleo_mistakes,
    mleo_geometry_time_tracking,
    mleo_geometry_master_progress: progressFromTopicMap(mleo_geometry_time_tracking.topics),
    mleo_geometry_mistakes: mistakes.mleo_geometry_mistakes,
    mleo_english_time_tracking,
    mleo_english_master_progress: progressFromTopicMap(mleo_english_time_tracking.topics),
    mleo_english_mistakes: mistakes.mleo_english_mistakes,
    mleo_science_time_tracking,
    mleo_science_master_progress: progressFromTopicMap(mleo_science_time_tracking.topics),
    mleo_science_mistakes: mistakes.mleo_science_mistakes,
    mleo_hebrew_time_tracking,
    mleo_hebrew_master_progress: progressFromTopicMap(mleo_hebrew_time_tracking.topics),
    mleo_hebrew_mistakes: mistakes.mleo_hebrew_mistakes,
    mleo_moledet_geography_time_tracking,
    mleo_moledet_geography_master_progress: progressFromTopicMap(mleo_moledet_geography_time_tracking.topics),
    mleo_moledet_geography_mistakes: mistakes.mleo_moledet_geography_mistakes,
    mleo_daily_challenge: { questions: totalQ, correct: totalC, bestScore: totalC },
    mleo_weekly_challenge: {
      current: Math.min(100, Math.round((totalC / Math.max(1, totalQ)) * 100)),
      target: 100,
      completed: totalQ > 400,
    },
    mleo_science_daily_challenge: { questions: Math.floor(totalQ * 0.25), correct: Math.floor(totalC * 0.25), bestScore: 0 },
    mleo_science_weekly_challenge: { current: 40, target: 100, completed: false },
  };
}

export function pickDayIndex(spanDays, rng) {
  const span = Math.max(1, spanDays);
  const u = rng();
  /* Parent report "week" = rolling last 7 days from anchor "now" — bias heavily to recent indices. */
  if (u < 0.52) {
    const w = 8;
    const lo = Math.max(0, span - w);
    return lo + Math.floor(rng() * (span - lo));
  }
  if (u < 0.78) {
    const lo = Math.max(0, span - 38);
    const hi = Math.max(0, span - 9);
    if (hi <= lo) return Math.floor(rng() * span);
    return lo + Math.floor(rng() * (hi - lo + 1));
  }
  const hi2 = Math.max(0, span - 39);
  return Math.floor(rng() * (hi2 + 1));
}

export function tsFromDayIndex(anchorEndMs, spanDays, dayIndex, rng) {
  const oldest = anchorEndMs - (spanDays - 1) * DAY_MS;
  const base = oldest + dayIndex * DAY_MS;
  return base + Math.floor(rng() * 0.75 * DAY_MS);
}

export function summarizeSessions(sessions, anchorEndMs, spanDays) {
  const days = new Set();
  let q = 0;
  let c = 0;
  let durSec = 0;
  const bySubject = {};
  const topicSets = {};
  for (const s of sessions) {
    q += Number(s.total) || 0;
    c += Number(s.correct) || 0;
    durSec += Number(s.duration) || 0;
    const d = s.date || sessionDateFromTs(s.timestamp);
    days.add(d);
    bySubject[s.subject] = (bySubject[s.subject] || 0) + (Number(s.total) || 0);
    if (!topicSets[s.subject]) topicSets[s.subject] = new Set();
    topicSets[s.subject].add(s.bucket);
  }
  const acc = {};
  for (const s of sessions) {
    if (!acc[s.subject]) acc[s.subject] = { q: 0, c: 0 };
    acc[s.subject].q += Number(s.total) || 0;
    acc[s.subject].c += Number(s.correct) || 0;
  }
  const accPct = {};
  for (const [k, v] of Object.entries(acc)) {
    accPct[k] = v.q > 0 ? Math.round((v.c / v.q) * 100) : 0;
  }
  return {
    totalQuestions: q,
    totalCorrect: c,
    totalTimeMinutes: Math.round(durSec / 60),
    activeDays: days.size,
    subjects: Object.keys(bySubject),
    topicsPerSubject: Object.fromEntries(
      Object.entries(topicSets).map(([k, v]) => [k, [...v].sort()])
    ),
    accuracyBySubject: accPct,
  };
}
