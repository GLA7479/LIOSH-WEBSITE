import { STORAGE_KEYS } from "./constants";

function emptyMathTracking() {
  return { operations: {}, daily: {} };
}

function emptyTopicTracking() {
  return { topics: {}, daily: {} };
}

function pushMistakes(target, session, subject, bucket, wrongCount) {
  const rotate = !!session.mistakePatternRotate;
  for (let i = 0; i < wrongCount; i += 1) {
    const patternFamily = rotate ? `pf:${subject}:${bucket}:v${i % 7}` : `pf:${subject}:${bucket}`;
    let responseMs;
    if (session.mode === "speed") {
      responseMs = 360 + i * 22;
    } else if (session.level === "hard") {
      responseMs = 5400 + i * 100;
    } else {
      responseMs = 2100 + i * 45;
    }
    target.push({
      subject,
      topic: bucket,
      operation: subject === "math" ? bucket : undefined,
      bucketKey: bucket,
      grade: session.grade,
      level: session.level,
      mode: session.mode,
      timestamp: session.timestamp + i,
      isCorrect: false,
      exerciseText: `${subject}:${bucket}`,
      correctAnswer: 1,
      userAnswer: 0,
      patternFamily,
      hintUsed: i % 3 === 0,
      responseMs,
    });
  }
}

function toProgressMap(map, containerKey) {
  const source = map[containerKey] || {};
  const progress = {};
  for (const [key, bucket] of Object.entries(source)) {
    let total = 0;
    let correct = 0;
    for (const s of bucket.sessions || []) {
      total += Number(s.total) || 0;
      correct += Number(s.correct) || 0;
    }
    if (total > 0) progress[key] = { total, correct };
  }
  const allQ = Object.values(progress).reduce((a, x) => a + x.total, 0);
  const allC = Object.values(progress).reduce((a, x) => a + x.correct, 0);
  return {
    progress,
    stars: Math.min(5, Math.max(1, Math.round((allC / Math.max(1, allQ)) * 5))),
    playerLevel: Math.max(1, Math.min(12, Math.round(allQ / 120))),
    xp: allQ * 5,
    badges: [],
  };
}

function addMathSession(track, session) {
  const op = session.bucket;
  if (!track.operations[op]) {
    track.operations[op] = { total: 0, sessions: [], byGrade: {}, byLevel: {} };
  }
  const b = track.operations[op];
  b.total += session.duration;
  b.byGrade[session.grade] = (b.byGrade[session.grade] || 0) + session.duration;
  b.byLevel[session.level] = (b.byLevel[session.level] || 0) + session.duration;
  b.sessions.push({
    date: session.date,
    duration: session.duration,
    grade: session.grade,
    level: session.level,
    operation: op,
    mathReportBucket: op,
    timestamp: session.timestamp,
    mode: session.mode,
    total: session.total,
    correct: session.correct,
  });
}

function addTopicSession(track, session) {
  const topic = session.bucket;
  if (!track.topics[topic]) {
    track.topics[topic] = { total: 0, sessions: [], byGrade: {}, byLevel: {} };
  }
  const b = track.topics[topic];
  b.total += session.duration;
  b.byGrade[session.grade] = (b.byGrade[session.grade] || 0) + session.duration;
  b.byLevel[session.level] = (b.byLevel[session.level] || 0) + session.duration;
  b.sessions.push({
    date: session.date,
    duration: session.duration,
    grade: session.grade,
    level: session.level,
    topic,
    timestamp: session.timestamp,
    mode: session.mode,
    total: session.total,
    correct: session.correct,
  });
}

function rebuildDailyMath(track) {
  track.daily = {};
  for (const [op, bucket] of Object.entries(track.operations || {})) {
    for (const s of bucket.sessions || []) {
      if (!track.daily[s.date]) {
        track.daily[s.date] = { total: 0, operations: {}, byGrade: {}, byLevel: {} };
      }
      const d = track.daily[s.date];
      d.total += Number(s.duration) || 0;
      d.operations[op] = (d.operations[op] || 0) + (Number(s.duration) || 0);
      d.byGrade[s.grade] = (d.byGrade[s.grade] || 0) + (Number(s.duration) || 0);
      d.byLevel[s.level] = (d.byLevel[s.level] || 0) + (Number(s.duration) || 0);
    }
  }
}

function rebuildDailyTopic(track) {
  track.daily = {};
  for (const [topic, bucket] of Object.entries(track.topics || {})) {
    for (const s of bucket.sessions || []) {
      if (!track.daily[s.date]) {
        track.daily[s.date] = { total: 0, topics: {}, byGrade: {}, byLevel: {} };
      }
      const d = track.daily[s.date];
      d.total += Number(s.duration) || 0;
      d.topics[topic] = (d.topics[topic] || 0) + (Number(s.duration) || 0);
      d.byGrade[s.grade] = (d.byGrade[s.grade] || 0) + (Number(s.duration) || 0);
      d.byLevel[s.level] = (d.byLevel[s.level] || 0) + (Number(s.duration) || 0);
    }
  }
}

export function buildStorageSnapshotFromSessions(sessions, playerName) {
  const mleo_time_tracking = emptyMathTracking();
  const mleo_geometry_time_tracking = emptyTopicTracking();
  const mleo_english_time_tracking = emptyTopicTracking();
  const mleo_science_time_tracking = emptyTopicTracking();
  const mleo_hebrew_time_tracking = emptyTopicTracking();
  const mleo_moledet_geography_time_tracking = emptyTopicTracking();
  const mleo_mistakes = [];
  const mleo_geometry_mistakes = [];
  const mleo_english_mistakes = [];
  const mleo_science_mistakes = [];
  const mleo_hebrew_mistakes = [];
  const mleo_moledet_geography_mistakes = [];

  for (const s of sessions) {
    const wrong = Math.max(0, (Number(s.total) || 0) - (Number(s.correct) || 0));
    if (s.subject === "math") {
      addMathSession(mleo_time_tracking, s);
      pushMistakes(mleo_mistakes, s, "math", s.bucket, Math.min(wrong, Math.round(wrong * 0.65)));
      continue;
    }
    if (s.subject === "geometry") {
      addTopicSession(mleo_geometry_time_tracking, s);
      pushMistakes(mleo_geometry_mistakes, s, "geometry", s.bucket, Math.min(wrong, Math.round(wrong * 0.55)));
      continue;
    }
    if (s.subject === "english") {
      addTopicSession(mleo_english_time_tracking, s);
      pushMistakes(mleo_english_mistakes, s, "english", s.bucket, Math.min(wrong, Math.round(wrong * 0.55)));
      continue;
    }
    if (s.subject === "science") {
      addTopicSession(mleo_science_time_tracking, s);
      pushMistakes(mleo_science_mistakes, s, "science", s.bucket, Math.min(wrong, Math.round(wrong * 0.55)));
      continue;
    }
    if (s.subject === "hebrew") {
      addTopicSession(mleo_hebrew_time_tracking, s);
      pushMistakes(mleo_hebrew_mistakes, s, "hebrew", s.bucket, Math.min(wrong, Math.round(wrong * 0.55)));
      continue;
    }
    addTopicSession(mleo_moledet_geography_time_tracking, s);
    pushMistakes(
      mleo_moledet_geography_mistakes,
      s,
      "moledet-geography",
      s.bucket,
      Math.min(wrong, Math.round(wrong * 0.55))
    );
  }

  rebuildDailyMath(mleo_time_tracking);
  rebuildDailyTopic(mleo_geometry_time_tracking);
  rebuildDailyTopic(mleo_english_time_tracking);
  rebuildDailyTopic(mleo_science_time_tracking);
  rebuildDailyTopic(mleo_hebrew_time_tracking);
  rebuildDailyTopic(mleo_moledet_geography_time_tracking);

  const totalQuestions = sessions.reduce((a, s) => a + (Number(s.total) || 0), 0);
  const totalCorrect = sessions.reduce((a, s) => a + (Number(s.correct) || 0), 0);

  const snapshot = {
    mleo_player_name: playerName,
    mleo_time_tracking,
    mleo_math_master_progress: toProgressMap(mleo_time_tracking, "operations"),
    mleo_mistakes,
    mleo_geometry_time_tracking,
    mleo_geometry_master_progress: toProgressMap(mleo_geometry_time_tracking, "topics"),
    mleo_geometry_mistakes,
    mleo_english_time_tracking,
    mleo_english_master_progress: toProgressMap(mleo_english_time_tracking, "topics"),
    mleo_english_mistakes,
    mleo_science_time_tracking,
    mleo_science_master_progress: toProgressMap(mleo_science_time_tracking, "topics"),
    mleo_science_mistakes,
    mleo_hebrew_time_tracking,
    mleo_hebrew_master_progress: toProgressMap(mleo_hebrew_time_tracking, "topics"),
    mleo_hebrew_mistakes,
    mleo_moledet_geography_time_tracking,
    mleo_moledet_geography_master_progress: toProgressMap(mleo_moledet_geography_time_tracking, "topics"),
    mleo_moledet_geography_mistakes,
    mleo_daily_challenge: { questions: totalQuestions, correct: totalCorrect, bestScore: totalCorrect },
    mleo_weekly_challenge: {
      current: Math.min(100, Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100)),
      target: 100,
      completed: totalQuestions > 400,
    },
  };

  return {
    snapshot,
    touchedKeys: STORAGE_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(snapshot, k)),
  };
}
