/**
 * Seeds browser globals localStorage for generateDetailedParentReport / Copilot.
 * Mirrors patterns from scripts/overnight-synthetic-e2e-scenarios.mjs with richer coverage.
 */
import { TOPICS_BY_SUBJECT } from "./constants.mjs";
import { createRng, randInt } from "./prng.mjs";

function set(store, k, v) {
  store.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
}

function emptyTopicTracking() {
  return { topics: {} };
}

function addSessions(topicTracking, topicKey, sessions) {
  if (!topicTracking.topics[topicKey]) topicTracking.topics[topicKey] = { sessions: [] };
  topicTracking.topics[topicKey].sessions.push(...sessions);
}

function sessionsFromSpec(rng, grade, count, correctRatio, levelMix, now) {
  const sessions = [];
  for (let i = 0; i < count; i++) {
    const total = randInt(rng, 6, 14);
    const correct = Math.round(total * correctRatio + (rng() - 0.5) * 2);
    const clamped = Math.max(0, Math.min(total, correct));
    const level = levelMix[i % levelMix.length];
    const duration = randInt(rng, 120, 520);
    sessions.push({
      timestamp: now - i * 3600000,
      total,
      correct: clamped,
      mode: i % 4 === 0 ? "practice" : "learning",
      grade,
      level,
      duration,
    });
  }
  return sessions;
}

function mathOperationsSessions(rng, grade, profileType, now) {
  if (profileType === "weak_math") {
    return sessionsFromSpec(rng, grade, 12, 0.26, ["easy", "medium", "hard", "mixed"], now);
  }
  let ratio = 0.72;
  let count = 5;
  if (profileType.includes("weak") || profileType === "thin_data") {
    ratio = 0.38;
    count = profileType === "thin_data" ? 1 : 3;
  }
  if (profileType === "strong_stable" || profileType === "rich_data") {
    ratio = 0.9;
    count = profileType === "rich_data" ? 12 : 7;
  }
  if (profileType === "improving_student") {
    return [
      ...sessionsFromSpec(rng, grade, 2, 0.4, ["easy", "medium"], now - 86400000 * 3),
      ...sessionsFromSpec(rng, grade, 4, 0.78, ["medium", "hard"], now),
    ];
  }
  if (profileType === "declining_student") {
    return [
      ...sessionsFromSpec(rng, grade, 3, 0.82, ["medium"], now - 86400000 * 5),
      ...sessionsFromSpec(rng, grade, 3, 0.42, ["medium"], now),
    ];
  }
  const levels = ["easy", "medium", "hard", "mixed"];
  return sessionsFromSpec(rng, grade, count, ratio, levels, now);
}

function topicPick(rng, subject) {
  const keys = TOPICS_BY_SUBJECT[subject] || ["general"];
  return keys[randInt(rng, 0, keys.length - 1)];
}

/**
 * Serializable localStorage snapshot for Playwright seeding (same keys as applyMassStudentSeed).
 */
export function buildMassStudentStorageSnapshot(student) {
  const acc = {};
  const adapter = {
    setItem(k, v) {
      acc[k] = typeof v === "string" ? v : JSON.stringify(v);
    },
    getItem() {
      return null;
    },
    removeItem() {},
  };
  applyMassStudentSeed(student, adapter);
  applyMassStudentStorageFromQuestionRows(student, student.generatedAnswers || [], adapter);
  return acc;
}

/**
 * @param {import("./student-generator.mjs").Student | any} student
 * @param {{ setItem: function }} [storage] defaults to `globalThis.localStorage`
 */
export function applyMassStudentSeed(student, storage = globalThis.localStorage) {
  const store = storage;
  const rng = createRng((student.metadata?.rngSeedFragment ?? 1) ^ 0xcafebabe);
  const grade = student.grade;
  const now = Date.now();
  const pid = student.profileType;

  set(store, "mleo_player_name", student.displayName);

  const mathSessions = mathOperationsSessions(rng, grade, pid, now);
  const subCount =
    pid === "weak_math"
      ? Math.max(8, Math.floor(mathSessions.length / 2))
      : Math.max(1, Math.floor(mathSessions.length / 2));
  const subRatio = pid === "weak_math" ? 0.27 : 0.65;
  const subSessions = sessionsFromSpec(rng, grade, subCount, subRatio, ["easy", "medium"], now);
  set(store, "mleo_time_tracking", {
    operations: {
      addition: { sessions: mathSessions },
      subtraction: { sessions: subSessions },
    },
  });

  const mathTotals = mathSessions.reduce(
    (a, s) => {
      a.t += s.total;
      a.c += s.correct;
      return a;
    },
    { t: 0, c: 0 }
  );
  const subTotals = subSessions.reduce(
    (a, s) => {
      a.t += s.total;
      a.c += s.correct;
      return a;
    },
    { t: 0, c: 0 }
  );
  set(store, "mleo_math_master_progress", {
    progress: {
      addition: { total: mathTotals.t || 20, correct: mathTotals.c || 12 },
      subtraction: { total: subTotals.t || 40, correct: subTotals.c || 26 },
    },
  });

  const geoTopic = topicPick(rng, "geometry");
  const engTopic = topicPick(rng, "english");
  const sciTopic = topicPick(rng, "science");
  const heTopic = topicPick(rng, "hebrew");
  const molTopic = topicPick(rng, "moledet_geography");

  const geoTracking = emptyTopicTracking();
  const engTracking = emptyTopicTracking();
  const sciTracking = emptyTopicTracking();
  const heTracking = emptyTopicTracking();
  const molTracking = emptyTopicTracking();

  function isWeakSubject(subjectKey) {
    if (pid === "weak_all_subjects") return true;
    if (pid === "weak_math" && subjectKey === "math") return true;
    if (pid === "weak_hebrew" && subjectKey === "hebrew") return true;
    if (pid === "weak_english" && subjectKey === "english") return true;
    return false;
  }

  const sessionIntensity = () => {
    if (pid === "thin_data") return { n: 1, r: 0.45 };
    if (pid === "rich_data") return { n: 10, r: 0.78 };
    const weakBase = pid.startsWith("weak") || pid === "random_guessing" ? 0.42 : 0.72;
    /** Minimum volume so diagnosticEngineV2 produces anchored narrative rows for Copilot */
    return { n: Math.max(6, pid.startsWith("weak") ? 5 : 7), r: weakBase };
  };

  function fillTopic(subjectKey, tracking, topic) {
    const { n, r } = sessionIntensity();
    let ratio = r;
    let count = n;

    if (pid === "thin_data") {
      const sess = sessionsFromSpec(rng, grade, 1, 0.45, ["easy", "medium", "hard"], now);
      addSessions(tracking, topic, sess);
      return sess.reduce((a, s) => ({ t: a.t + s.total, c: a.c + s.correct }), { t: 0, c: 0 });
    }

    if (pid === "weak_math") {
      if (subjectKey === "math") {
        ratio = 0.26;
        count = Math.max(n, 10);
      } else {
        ratio = 0.69;
      }
    } else if (pid === "weak_hebrew") {
      if (subjectKey === "hebrew") {
        ratio = 0.27;
        count = Math.max(n, 10);
      } else {
        ratio = 0.68;
      }
    } else if (pid === "weak_english") {
      if (subjectKey === "english") {
        ratio = 0.27;
        count = Math.max(n, 10);
      } else {
        ratio = 0.68;
      }
    } else {
      if (isWeakSubject(subjectKey)) ratio = Math.min(ratio, 0.48);
      if (pid === "strong_stable") ratio = Math.max(ratio, 0.85);
    }

    const sess = sessionsFromSpec(rng, grade, count, ratio, ["easy", "medium", "hard"], now);
    addSessions(tracking, topic, sess);
    const sum = sess.reduce((a, s) => ({ t: a.t + s.total, c: a.c + s.correct }), { t: 0, c: 0 });
    return sum;
  }

  if (student.subjects.includes("geometry")) {
    const sum = fillTopic("geometry", geoTracking, geoTopic);
    set(store, "mleo_geometry_time_tracking", geoTracking);
    set(store, "mleo_geometry_master_progress", {
      progress: { [geoTopic]: { total: sum.t, correct: sum.c } },
    });
  } else {
    set(store, "mleo_geometry_time_tracking", emptyTopicTracking());
    set(store, "mleo_geometry_master_progress", { progress: {} });
  }

  if (student.subjects.includes("english")) {
    const sum = fillTopic("english", engTracking, engTopic);
    set(store, "mleo_english_time_tracking", engTracking);
    set(store, "mleo_english_master_progress", {
      progress: { [engTopic]: { total: sum.t, correct: sum.c } },
    });
  } else {
    set(store, "mleo_english_time_tracking", emptyTopicTracking());
    set(store, "mleo_english_master_progress", { progress: {} });
  }

  if (student.subjects.includes("science")) {
    const sum = fillTopic("science", sciTracking, sciTopic);
    set(store, "mleo_science_time_tracking", sciTracking);
    set(store, "mleo_science_master_progress", {
      progress: { [sciTopic]: { total: sum.t, correct: sum.c } },
    });
  } else {
    set(store, "mleo_science_time_tracking", emptyTopicTracking());
    set(store, "mleo_science_master_progress", { progress: {} });
  }

  if (student.subjects.includes("hebrew")) {
    const sum = fillTopic("hebrew", heTracking, heTopic);
    set(store, "mleo_hebrew_time_tracking", heTracking);
    set(store, "mleo_hebrew_master_progress", {
      progress: { [heTopic]: { total: sum.t, correct: sum.c } },
    });
  } else {
    set(store, "mleo_hebrew_time_tracking", emptyTopicTracking());
    set(store, "mleo_hebrew_master_progress", { progress: {} });
  }

  if (student.subjects.includes("moledet_geography")) {
    const sum = fillTopic("moledet_geography", molTracking, molTopic);
    set(store, "mleo_moledet_geography_time_tracking", molTracking);
    set(store, "mleo_moledet_geography_master_progress", {
      progress: { [molTopic]: { total: sum.t, correct: sum.c } },
    });
  } else {
    set(store, "mleo_moledet_geography_time_tracking", emptyTopicTracking());
    set(store, "mleo_moledet_geography_master_progress", { progress: {} });
  }

  set(store, "mleo_mistakes", []);
  set(store, "mleo_geometry_mistakes", []);
  set(store, "mleo_english_mistakes", []);
  set(store, "mleo_science_mistakes", []);
  set(store, "mleo_hebrew_mistakes", []);
  set(store, "mleo_moledet_geography_mistakes", []);
}

/** Max questions bundled into one tracking session (parent-report counts total/correct per session). */
const ROWS_TO_STORAGE_BATCH = 12;

const SUBJECT_ROW_BRIDGE = [
  {
    rowSubject: "math",
    trackingKey: "mleo_time_tracking",
    container: "operations",
    progressKey: "mleo_math_master_progress",
    mistakesKey: "mleo_mistakes",
    isMath: true,
  },
  {
    rowSubject: "geometry",
    trackingKey: "mleo_geometry_time_tracking",
    container: "topics",
    progressKey: "mleo_geometry_master_progress",
    mistakesKey: "mleo_geometry_mistakes",
    isMath: false,
  },
  {
    rowSubject: "english",
    trackingKey: "mleo_english_time_tracking",
    container: "topics",
    progressKey: "mleo_english_master_progress",
    mistakesKey: "mleo_english_mistakes",
    isMath: false,
  },
  {
    rowSubject: "science",
    trackingKey: "mleo_science_time_tracking",
    container: "topics",
    progressKey: "mleo_science_master_progress",
    mistakesKey: "mleo_science_mistakes",
    isMath: false,
  },
  {
    rowSubject: "hebrew",
    trackingKey: "mleo_hebrew_time_tracking",
    container: "topics",
    progressKey: "mleo_hebrew_master_progress",
    mistakesKey: "mleo_hebrew_mistakes",
    isMath: false,
  },
  {
    rowSubject: "moledet_geography",
    trackingKey: "mleo_moledet_geography_time_tracking",
    container: "topics",
    progressKey: "mleo_moledet_geography_master_progress",
    mistakesKey: "mleo_moledet_geography_mistakes",
    isMath: false,
  },
];

function orderRowsForArchetype(rows, profileType) {
  const out = rows.slice();
  if (profileType === "improving_student") {
    out.sort((a, b) => Number(!!a.isCorrect) - Number(!!b.isCorrect));
  } else if (profileType === "declining_student") {
    out.sort((a, b) => Number(!!b.isCorrect) - Number(!!a.isCorrect));
  }
  return out;
}

function weekEvidenceWindowMs() {
  const endMs = Date.now() - 90 * 1000;
  const startMs = endMs - 6 * 24 * 60 * 60 * 1000;
  return { startMs, endMs };
}

/**
 * Overwrites per-subject `mleo_*_time_tracking`, `*_master_progress`, and mistake arrays from
 * simulated `questionRows` / `generatedAnswers` so reports and Copilot see the same evidence as the mass JSON.
 *
 * Subjects with no rows for this student keep whatever `applyMassStudentSeed` wrote.
 *
 * @param {import("./student-generator.mjs").Student | any} student
 * @param {any[]} rows
 * @param {{ setItem: function }} [storage]
 */
export function applyMassStudentStorageFromQuestionRows(student, rows, storage = globalThis.localStorage) {
  const store = storage;
  const sid = student.studentId;
  const mine = (Array.isArray(rows) ? rows : []).filter((r) => r && r.studentId === sid);
  if (!mine.length) return;

  for (const def of SUBJECT_ROW_BRIDGE) {
    set(store, def.trackingKey, def.isMath ? { operations: {} } : { topics: {} });
    set(store, def.progressKey, { stars: 0, xp: 0, playerLevel: 1, badges: [], progress: {} });
    set(store, def.mistakesKey, []);
  }

  const grade = student.grade || "g4";
  const pid = student.profileType || "";
  const { startMs, endMs } = weekEvidenceWindowMs();
  const span = Math.max(1, endMs - startMs - 10_000);
  let slot = 0;
  let mistakeSeq = 0;

  const bySubject = new Map();
  for (const r of mine) {
    const s = String(r.subject || "").trim();
    if (!bySubject.has(s)) bySubject.set(s, []);
    bySubject.get(s).push(r);
  }

  for (const def of SUBJECT_ROW_BRIDGE) {
    const list = bySubject.get(def.rowSubject);
    if (!list || !list.length) continue;

    const byTopic = new Map();
    for (const r of list) {
      const tk = String(r.topic || "general").trim() || "general";
      if (!byTopic.has(tk)) byTopic.set(tk, []);
      byTopic.get(tk).push(r);
    }

    const tracking = def.isMath ? { operations: {} } : { topics: {} };
    const progressShell = { stars: 0, xp: 0, playerLevel: 1, badges: [], progress: {} };
    /** @type {any[]} */
    const mistakes = [];
    let subjectTotalQ = 0;

    for (const [topicKey, topicRowsRaw] of byTopic) {
      const topicRows = orderRowsForArchetype(topicRowsRaw, pid);
      const bucket = def.isMath ? tracking.operations : tracking.topics;
      if (!bucket[topicKey]) bucket[topicKey] = { sessions: [] };

      let tQ = 0;
      let tC = 0;
      for (let i = 0; i < topicRows.length; i += ROWS_TO_STORAGE_BATCH) {
        const batch = topicRows.slice(i, i + ROWS_TO_STORAGE_BATCH);
        if (!batch.length) continue;
        const total = batch.length;
        const correct = batch.filter((x) => x.isCorrect).length;
        tQ += total;
        tC += correct;
        subjectTotalQ += total;
        const frac = ++slot / Math.max(20, Math.ceil(mine.length / ROWS_TO_STORAGE_BATCH) + 5);
        const timestamp = Math.min(endMs - 1000, Math.floor(startMs + frac * span));
        const row0 = batch[0];
        const level = String(row0?.difficulty || "medium").toLowerCase();
        bucket[topicKey].sessions.push({
          timestamp,
          total,
          correct,
          mode: "practice",
          grade,
          level: level === "easy" || level === "hard" ? level : "medium",
          duration: Math.max(60, total * 32),
        });
        for (let wi = 0; wi < batch.length; wi++) {
          const r = batch[wi];
          if (r.isCorrect) continue;
          mistakeSeq += 1;
          const mt = Math.min(endMs - 1, timestamp + wi * 3 + (mistakeSeq % 97));
          mistakes.push({
            subject: def.rowSubject === "moledet_geography" ? "moledet-geography" : def.rowSubject,
            topic: topicKey,
            operation: def.isMath ? topicKey : undefined,
            timestamp: mt,
            exerciseText: String(r.questionText || "").slice(0, 200),
            isCorrect: false,
            grade,
            mistakeType: r.mistakeType || "conceptual",
          });
        }
      }
      progressShell.progress[topicKey] = { total: tQ, correct: tC };
    }

    progressShell.xp = Math.min(500_000, subjectTotalQ * 18);
    progressShell.stars = Math.min(120, Math.floor(subjectTotalQ / 35));
    progressShell.playerLevel = Math.min(24, 2 + Math.floor(subjectTotalQ / 120));

    set(store, def.trackingKey, tracking);
    set(store, def.progressKey, progressShell);
    set(store, def.mistakesKey, mistakes);
  }
}

/**
 * Seed profile defaults, then overlay storage from `student.generatedAnswers` when present.
 * @param {import("./student-generator.mjs").Student | any} student
 * @param {{ setItem: function }} [storage]
 */
export function applyMassStudentSeedAndQuestionRows(student, storage = globalThis.localStorage) {
  applyMassStudentSeed(student, storage);
  applyMassStudentStorageFromQuestionRows(student, student.generatedAnswers || [], storage);
}
