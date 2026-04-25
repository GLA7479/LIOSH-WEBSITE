const DAY_MS = 24 * 60 * 60 * 1000;

function asDateTs(daysAgo, hour = 17) {
  const d = new Date(Date.now() - daysAgo * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mkSessions({
  totalSessions,
  spanDays,
  qMin,
  qMax,
  accStart,
  accEnd,
  durationMin,
  durationMax,
  grade = "g4",
  level = "medium",
  mode = "learning",
  topicOrOperation = "addition",
}) {
  const out = [];
  for (let i = 0; i < totalSessions; i += 1) {
    const t = totalSessions <= 1 ? 0 : i / (totalSessions - 1);
    const day = Math.max(0, Math.round(lerp(spanDays, 0, t)));
    const total = Math.round(lerp(qMin, qMax, (i % 3) / 2));
    const acc = lerp(accStart, accEnd, t);
    const correct = Math.max(0, Math.min(total, Math.round((total * acc) / 100)));
    const durationMinutes = Math.round(lerp(durationMin, durationMax, (i % 4) / 3));
    out.push({
      date: new Date(asDateTs(day)).toISOString().split("T")[0],
      duration: durationMinutes * 60,
      grade,
      level,
      topic: topicOrOperation,
      operation: topicOrOperation,
      timestamp: asDateTs(day, 15 + (i % 4)),
      mode,
      total,
      correct,
    });
  }
  return out.sort((a, b) => a.timestamp - b.timestamp);
}

function sessionsToTopicBucket(sessions, keyName) {
  const byGrade = {};
  const byLevel = {};
  let total = 0;
  for (const s of sessions) {
    total += Number(s.duration) || 0;
    byGrade[s.grade] = (byGrade[s.grade] || 0) + (Number(s.duration) || 0);
    byLevel[s.level] = (byLevel[s.level] || 0) + (Number(s.duration) || 0);
  }
  return {
    [keyName]: {
      total,
      sessions,
      byGrade,
      byLevel,
    },
  };
}

function mkDailyFromTopicMap(topicsOrOps, itemKey = "topics") {
  const daily = {};
  for (const entry of Object.values(topicsOrOps || {})) {
    const sessions = Array.isArray(entry?.sessions) ? entry.sessions : [];
    for (const s of sessions) {
      const d = s.date;
      if (!daily[d]) daily[d] = { total: 0, [itemKey]: {}, byGrade: {}, byLevel: {} };
      daily[d].total += Number(s.duration) || 0;
      const key = s.topic || s.operation || "unknown";
      daily[d][itemKey][key] = (daily[d][itemKey][key] || 0) + (Number(s.duration) || 0);
      daily[d].byGrade[s.grade] = (daily[d].byGrade[s.grade] || 0) + (Number(s.duration) || 0);
      daily[d].byLevel[s.level] = (daily[d].byLevel[s.level] || 0) + (Number(s.duration) || 0);
    }
  }
  return daily;
}

function mkProgressFromBuckets(buckets) {
  const progress = {};
  let totalAll = 0;
  let correctAll = 0;
  for (const [k, item] of Object.entries(buckets || {})) {
    const sessions = Array.isArray(item?.sessions) ? item.sessions : [];
    const total = sessions.reduce((a, s) => a + (Number(s.total) || 0), 0);
    const correct = sessions.reduce((a, s) => a + (Number(s.correct) || 0), 0);
    progress[k] = { total, correct };
    totalAll += total;
    correctAll += correct;
  }
  const level = Math.max(1, Math.min(12, Math.round(totalAll / 30)));
  return {
    progress,
    stars: Math.round((correctAll / Math.max(1, totalAll)) * 5),
    playerLevel: level,
    xp: totalAll * 5,
    badges: [],
  };
}

function mkMistakes(subject, key, sessions, weight = 0.6) {
  const out = [];
  for (const s of sessions) {
    const total = Number(s.total) || 0;
    const correct = Number(s.correct) || 0;
    const wrong = Math.max(0, total - correct);
    const n = Math.max(0, Math.round(wrong * weight));
    for (let i = 0; i < n; i += 1) {
      out.push({
        subject,
        topic: key,
        operation: key,
        bucketKey: key,
        timestamp: s.timestamp + i * 1000,
        isCorrect: false,
        exerciseText: `${key} simulated`,
        correctAnswer: 1,
        userAnswer: 0,
        patternFamily: `pf:${subject}:${key}`,
        hintUsed: i % 2 === 0,
        responseMs: 900 + i * 40,
      });
    }
  }
  return out;
}

function buildStorageForSimulation(sim) {
  const base = {
    mleo_player_name: sim.studentName,
    mleo_time_tracking: { operations: {}, daily: {} },
    mleo_math_master_progress: { progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] },
    mleo_geometry_time_tracking: { topics: {}, daily: {} },
    mleo_geometry_master_progress: { progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] },
    mleo_english_time_tracking: { topics: {}, daily: {} },
    mleo_english_master_progress: { progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] },
    mleo_science_time_tracking: { topics: {}, daily: {} },
    mleo_science_master_progress: { progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] },
    mleo_hebrew_time_tracking: { topics: {}, daily: {} },
    mleo_hebrew_master_progress: { progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] },
    mleo_moledet_geography_time_tracking: { topics: {}, daily: {} },
    mleo_moledet_geography_master_progress: { progress: {}, stars: 0, playerLevel: 1, xp: 0, badges: [] },
    mleo_mistakes: [],
    mleo_geometry_mistakes: [],
    mleo_english_mistakes: [],
    mleo_science_mistakes: [],
    mleo_hebrew_mistakes: [],
    mleo_moledet_geography_mistakes: [],
    mleo_daily_challenge: { questions: 0, correct: 0, bestScore: 0 },
    mleo_weekly_challenge: { current: 0, target: 100, completed: false },
    mleo_science_daily_challenge: { questions: 0, correct: 0, bestScore: 0 },
    mleo_science_weekly_challenge: { current: 0, target: 100, completed: false },
  };

  for (const subj of sim.subjectPlans || []) {
    const sessions = mkSessions(subj);
    if (subj.subject === "math") {
      const op = sessionsToTopicBucket(sessions, subj.key);
      base.mleo_time_tracking.operations = { ...base.mleo_time_tracking.operations, ...op };
      base.mleo_time_tracking.daily = {
        ...base.mleo_time_tracking.daily,
        ...mkDailyFromTopicMap(op, "operations"),
      };
      base.mleo_math_master_progress = mkProgressFromBuckets(base.mleo_time_tracking.operations);
      base.mleo_mistakes.push(...mkMistakes("math", subj.key, sessions, subj.mistakeWeight ?? 0.7));
    } else {
      const tk = `${subj.subject}_time_tracking`;
      const pk = `${subj.subject}_master_progress`;
      const mk = `${subj.subject}_mistakes`;
      const storageTimeKey = `mleo_${tk}`;
      const storageProgKey = `mleo_${pk}`;
      const storageMistakesKey = `mleo_${mk}`;
      const topicMap = sessionsToTopicBucket(sessions, subj.key);
      base[storageTimeKey].topics = { ...base[storageTimeKey].topics, ...topicMap };
      base[storageTimeKey].daily = {
        ...base[storageTimeKey].daily,
        ...mkDailyFromTopicMap(topicMap, "topics"),
      };
      base[storageProgKey] = mkProgressFromBuckets(base[storageTimeKey].topics);
      base[storageMistakesKey].push(
        ...mkMistakes(subj.subject, subj.key, sessions, subj.mistakeWeight ?? 0.7)
      );
    }
  }

  const totalQuestions = [
    ...Object.values(base.mleo_time_tracking.operations),
    ...Object.values(base.mleo_geometry_time_tracking.topics),
    ...Object.values(base.mleo_english_time_tracking.topics),
    ...Object.values(base.mleo_science_time_tracking.topics),
    ...Object.values(base.mleo_hebrew_time_tracking.topics),
    ...Object.values(base.mleo_moledet_geography_time_tracking.topics),
  ].reduce((acc, row) => {
    const sessions = Array.isArray(row?.sessions) ? row.sessions : [];
    return acc + sessions.reduce((a, s) => a + (Number(s.total) || 0), 0);
  }, 0);
  const totalCorrect = [
    ...Object.values(base.mleo_time_tracking.operations),
    ...Object.values(base.mleo_geometry_time_tracking.topics),
    ...Object.values(base.mleo_english_time_tracking.topics),
    ...Object.values(base.mleo_science_time_tracking.topics),
    ...Object.values(base.mleo_hebrew_time_tracking.topics),
    ...Object.values(base.mleo_moledet_geography_time_tracking.topics),
  ].reduce((acc, row) => {
    const sessions = Array.isArray(row?.sessions) ? row.sessions : [];
    return acc + sessions.reduce((a, s) => a + (Number(s.correct) || 0), 0);
  }, 0);
  base.mleo_daily_challenge = { questions: totalQuestions, correct: totalCorrect, bestScore: totalCorrect };
  base.mleo_weekly_challenge = {
    current: Math.min(100, Math.round((totalCorrect / Math.max(1, totalQuestions)) * 100)),
    target: 100,
    completed: totalQuestions > 120,
  };
  return base;
}

export const PARENT_REPORT_LEARNING_SIMULATIONS = [
  {
    id: "sim01_new_user_no_activity",
    studentName: "Sim 01",
    expectedBehavior: "no_data",
    expectedTopSignal: "insufficient",
    subjectPlans: [],
  },
  {
    id: "sim02_early_low_activity",
    studentName: "Sim 02",
    expectedBehavior: "cautious_low_activity",
    expectedTopSignal: "insufficient",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 3,
        spanDays: 10,
        qMin: 5,
        qMax: 8,
        accStart: 55,
        accEnd: 68,
        durationMin: 8,
        durationMax: 12,
      },
    ],
  },
  {
    id: "sim03_weak_math_real",
    studentName: "Sim 03",
    expectedBehavior: "weak_math_actionable",
    expectedTopSignal: "weakness",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 10,
        spanDays: 18,
        qMin: 12,
        qMax: 18,
        accStart: 58,
        accEnd: 45,
        durationMin: 16,
        durationMax: 28,
      },
    ],
  },
  {
    id: "sim04_weak_geometry_real",
    studentName: "Sim 04",
    expectedBehavior: "weak_geometry_actionable",
    expectedTopSignal: "weakness",
    subjectPlans: [
      {
        subject: "geometry",
        key: "perimeter",
        totalSessions: 9,
        spanDays: 17,
        qMin: 11,
        qMax: 16,
        accStart: 60,
        accEnd: 48,
        durationMin: 15,
        durationMax: 27,
      },
    ],
  },
  {
    id: "sim05_multi_subject_weak_real",
    studentName: "Sim 05",
    expectedBehavior: "multi_subject_one_priority",
    expectedTopSignal: "weakness",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 8,
        spanDays: 20,
        qMin: 14,
        qMax: 20,
        accStart: 55,
        accEnd: 47,
        durationMin: 16,
        durationMax: 30,
      },
      {
        subject: "geometry",
        key: "area",
        totalSessions: 6,
        spanDays: 18,
        qMin: 10,
        qMax: 15,
        accStart: 63,
        accEnd: 52,
        durationMin: 15,
        durationMax: 22,
      },
      {
        subject: "hebrew",
        key: "grammar",
        totalSessions: 6,
        spanDays: 16,
        qMin: 9,
        qMax: 14,
        accStart: 70,
        accEnd: 60,
        durationMin: 12,
        durationMax: 20,
      },
    ],
  },
  {
    id: "sim06_strong_math_stable",
    studentName: "Sim 06",
    expectedBehavior: "strong_maintain",
    expectedTopSignal: "strength",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 10,
        spanDays: 20,
        qMin: 14,
        qMax: 20,
        accStart: 90,
        accEnd: 93,
        durationMin: 14,
        durationMax: 24,
      },
    ],
  },
  {
    id: "sim07_strong_multi_subject",
    studentName: "Sim 07",
    expectedBehavior: "strong_multi_no_remediation",
    expectedTopSignal: "strength",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 8,
        spanDays: 19,
        qMin: 12,
        qMax: 18,
        accStart: 91,
        accEnd: 94,
        durationMin: 13,
        durationMax: 22,
      },
      {
        subject: "english",
        key: "vocabulary",
        totalSessions: 8,
        spanDays: 19,
        qMin: 11,
        qMax: 16,
        accStart: 88,
        accEnd: 92,
        durationMin: 12,
        durationMax: 20,
      },
      {
        subject: "science",
        key: "environment",
        totalSessions: 6,
        spanDays: 17,
        qMin: 10,
        qMax: 14,
        accStart: 87,
        accEnd: 90,
        durationMin: 12,
        durationMax: 18,
      },
    ],
  },
  {
    id: "sim08_slow_but_accurate",
    studentName: "Sim 08",
    expectedBehavior: "slow_fluency_focus",
    expectedTopSignal: "speed_or_fluency",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 9,
        spanDays: 18,
        qMin: 12,
        qMax: 16,
        accStart: 86,
        accEnd: 89,
        durationMin: 30,
        durationMax: 45,
      },
    ],
  },
  {
    id: "sim09_fast_careless",
    studentName: "Sim 09",
    expectedBehavior: "fast_careless_focus",
    expectedTopSignal: "speed_behavior",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 10,
        spanDays: 17,
        qMin: 13,
        qMax: 18,
        accStart: 76,
        accEnd: 66,
        durationMin: 8,
        durationMax: 12,
      },
    ],
  },
  {
    id: "sim10_improving_student",
    studentName: "Sim 10",
    expectedBehavior: "trend_up",
    expectedTopSignal: "improving",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 9,
        spanDays: 20,
        qMin: 13,
        qMax: 18,
        accStart: 45,
        accEnd: 74,
        durationMin: 14,
        durationMax: 24,
      },
    ],
  },
  {
    id: "sim11_declining_student",
    studentName: "Sim 11",
    expectedBehavior: "trend_down_stabilize",
    expectedTopSignal: "declining",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 9,
        spanDays: 20,
        qMin: 13,
        qMax: 18,
        accStart: 86,
        accEnd: 56,
        durationMin: 13,
        durationMax: 25,
        level: "hard",
      },
    ],
  },
  {
    id: "sim12_mixed_realistic_student",
    studentName: "Sim 12",
    expectedBehavior: "mixed_one_focus_preserve_strength",
    expectedTopSignal: "mixed",
    subjectPlans: [
      {
        subject: "math",
        key: "addition",
        totalSessions: 8,
        spanDays: 20,
        qMin: 14,
        qMax: 20,
        accStart: 90,
        accEnd: 92,
        durationMin: 14,
        durationMax: 24,
      },
      {
        subject: "geometry",
        key: "area",
        totalSessions: 8,
        spanDays: 20,
        qMin: 12,
        qMax: 18,
        accStart: 58,
        accEnd: 47,
        durationMin: 16,
        durationMax: 26,
      },
      {
        subject: "english",
        key: "vocabulary",
        totalSessions: 4,
        spanDays: 14,
        qMin: 6,
        qMax: 9,
        accStart: 76,
        accEnd: 71,
        durationMin: 10,
        durationMax: 14,
      },
    ],
  },
];

export function buildLearningSimulationStorage(sim) {
  return buildStorageForSimulation(sim);
}

export default { PARENT_REPORT_LEARNING_SIMULATIONS, buildLearningSimulationStorage };
