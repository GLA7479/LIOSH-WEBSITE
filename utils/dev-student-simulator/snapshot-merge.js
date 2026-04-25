import { STORAGE_KEYS, SUBJECTS, SIMULATOR_ORIGIN, CUSTOM_APPLY_MODE } from "./constants";
import {
  buildStorageSnapshotFromSessions,
  emptyMathTracking,
  emptyTopicTracking,
  rebuildDailyMath,
  rebuildDailyTopic,
  toProgressMap,
} from "./snapshot-builder";

const SUBJECT_TO_TRACK = {
  math: { time: "mleo_time_tracking", isMath: true, mistakes: "mleo_mistakes" },
  geometry: { time: "mleo_geometry_time_tracking", isMath: false, mistakes: "mleo_geometry_mistakes" },
  english: { time: "mleo_english_time_tracking", isMath: false, mistakes: "mleo_english_mistakes" },
  science: { time: "mleo_science_time_tracking", isMath: false, mistakes: "mleo_science_mistakes" },
  hebrew: { time: "mleo_hebrew_time_tracking", isMath: false, mistakes: "mleo_hebrew_mistakes" },
  "moledet-geography": {
    time: "mleo_moledet_geography_time_tracking",
    isMath: false,
    mistakes: "mleo_moledet_geography_mistakes",
  },
};

const PROGRESS_KEY = {
  math: { key: "mleo_math_master_progress", container: "operations" },
  geometry: { key: "mleo_geometry_master_progress", container: "topics" },
  english: { key: "mleo_english_master_progress", container: "topics" },
  science: { key: "mleo_science_master_progress", container: "topics" },
  hebrew: { key: "mleo_hebrew_master_progress", container: "topics" },
  "moledet-geography": { key: "mleo_moledet_geography_master_progress", container: "topics" },
};

function unitKey(subj, topic) {
  return `${subj}\0${topic}`;
}

function deepClone(x) {
  if (x == null) return x;
  return JSON.parse(JSON.stringify(x));
}

/**
 * @param {Record<string, string | null | undefined>} existingStorageMap
 * @param {string} playerName
 */
function snapshotFromExistingMap(existingStorageMap, playerName) {
  const { snapshot: template } = buildStorageSnapshotFromSessions([], playerName);
  const out = {};
  for (const k of STORAGE_KEYS) {
    const raw = existingStorageMap[k];
    if (raw == null || raw === "") {
      out[k] = template[k] != null ? deepClone(template[k]) : null;
      continue;
    }
    try {
      out[k] = typeof raw === "string" ? JSON.parse(raw) : deepClone(raw);
    } catch {
      out[k] = template[k] != null ? deepClone(template[k]) : null;
    }
  }
  if (!out.mleo_time_tracking) out.mleo_time_tracking = emptyMathTracking();
  if (!out.mleo_time_tracking.operations) out.mleo_time_tracking.operations = {};
  if (!out.mleo_geometry_time_tracking) out.mleo_geometry_time_tracking = emptyTopicTracking();
  if (!out.mleo_english_time_tracking) out.mleo_english_time_tracking = emptyTopicTracking();
  if (!out.mleo_science_time_tracking) out.mleo_science_time_tracking = emptyTopicTracking();
  if (!out.mleo_hebrew_time_tracking) out.mleo_hebrew_time_tracking = emptyTopicTracking();
  if (!out.mleo_moledet_geography_time_tracking) out.mleo_moledet_geography_time_tracking = emptyTopicTracking();
  return out;
}

function isSimRowForUnit(row, subject, topic) {
  return (
    row?.origin === SIMULATOR_ORIGIN && row?.simulatorSubject === subject && row?.simulatorTopic === topic
  );
}

function recalcOpBucket(bucket) {
  if (!bucket) return { total: 0, sessions: [], byGrade: {}, byLevel: {} };
  const b = bucket;
  b.total = 0;
  b.byGrade = {};
  b.byLevel = {};
  for (const s of b.sessions || []) {
    const dur = Number(s.duration) || 0;
    b.total += dur;
    b.byGrade[s.grade] = (b.byGrade[s.grade] || 0) + dur;
    b.byLevel[s.level] = (b.byLevel[s.level] || 0) + dur;
  }
  return b;
}

function recalcTopicBucketObj(bucket) {
  return recalcOpBucket(bucket);
}

function mergeSessionRows(existingRows, newRows, mode, subject, topic) {
  const ex = Array.isArray(existingRows) ? existingRows : [];
  const ne = Array.isArray(newRows) ? newRows : [];
  if (mode === CUSTOM_APPLY_MODE.append) {
    return [...ex, ...ne];
  }
  const kept = ex.filter((r) => !isSimRowForUnit(r, subject, topic));
  return [...kept, ...ne];
}

/**
 * @param {object} targetSnapshot — mutated
 * @param {object} partialSnapshot
 * @param {string} subject
 * @param {string} topic
 * @param {string} mode
 */
function mergeOneTopicIntoSnapshot(targetSnapshot, partialSnapshot, subject, topic, mode) {
  const meta = SUBJECT_TO_TRACK[subject];
  if (!meta) return;
  const track = targetSnapshot[meta.time];
  const pTrack = partialSnapshot[meta.time];
  if (meta.isMath) {
    const bOld = (track && track.operations && track.operations[topic]) || {
      total: 0,
      sessions: [],
      byGrade: {},
      byLevel: {},
    };
    const bNew = (pTrack && pTrack.operations && pTrack.operations[topic]) || {
      total: 0,
      sessions: [],
      byGrade: {},
      byLevel: {},
    };
    if (!track.operations) track.operations = {};
    const mergedSess = mergeSessionRows(
      bOld.sessions,
      bNew.sessions,
      mode,
      subject,
      topic
    );
    const nb = { ...bOld, sessions: mergedSess };
    recalcOpBucket(nb);
    if (nb.sessions.length === 0) {
      delete track.operations[topic];
    } else {
      track.operations[topic] = nb;
    }
  } else {
    const bOld = (track && track.topics && track.topics[topic]) || {
      total: 0,
      sessions: [],
      byGrade: {},
      byLevel: {},
    };
    const bNew = (pTrack && pTrack.topics && pTrack.topics[topic]) || {
      total: 0,
      sessions: [],
      byGrade: {},
      byLevel: {},
    };
    if (!track.topics) track.topics = {};
    const mergedSess = mergeSessionRows(
      bOld.sessions,
      bNew.sessions,
      mode,
      subject,
      topic
    );
    const nb = { ...bOld, sessions: mergedSess };
    recalcTopicBucketObj(nb);
    if (nb.sessions.length === 0) {
      delete track.topics[topic];
    } else {
      track.topics[topic] = nb;
    }
  }
}

function mergeMistakeList(existingList, newList, mode, affectedSet) {
  const ex = Array.isArray(existingList) ? existingList : [];
  const ne = Array.isArray(newList) ? newList : [];
  if (mode === CUSTOM_APPLY_MODE.append) {
    return [...ex, ...ne];
  }
  const kept = ex.filter((m) => {
    if (m?.origin !== SIMULATOR_ORIGIN) return true;
    if (!m?.simulatorSubject || !m.simulatorTopic) return true;
    const k = unitKey(m.simulatorSubject, m.simulatorTopic);
    if (!affectedSet.has(k)) return true;
    return false;
  });
  return [...kept, ...ne];
}

function recomputeAllDailiesAndProgress(snapshot) {
  rebuildDailyMath(snapshot.mleo_time_tracking);
  for (const sid of [
    "geometry",
    "english",
    "science",
    "hebrew",
    "moledet-geography",
  ]) {
    const meta = SUBJECT_TO_TRACK[sid];
    if (meta) rebuildDailyTopic(snapshot[meta.time]);
  }
  for (const sid of SUBJECTS) {
    const pr = PROGRESS_KEY[sid];
    if (!pr) continue;
    const tkey = SUBJECT_TO_TRACK[sid].time;
    snapshot[pr.key] = toProgressMap(snapshot[tkey], pr.container);
  }
}

function recomputeChallenges(merged) {
  let q = 0;
  let c = 0;
  const add = (tr, isMath) => {
    const cont = isMath ? tr?.operations : tr?.topics;
    for (const b of Object.values(cont || {})) {
      for (const s of b.sessions || []) {
        q += Number(s.total) || 0;
        c += Number(s.correct) || 0;
      }
    }
  };
  add(merged.mleo_time_tracking, true);
  add(merged.mleo_geometry_time_tracking, false);
  add(merged.mleo_english_time_tracking, false);
  add(merged.mleo_science_time_tracking, false);
  add(merged.mleo_hebrew_time_tracking, false);
  add(merged.mleo_moledet_geography_time_tracking, false);
  merged.mleo_daily_challenge = {
    questions: q,
    correct: c,
    bestScore: c,
  };
  merged.mleo_weekly_challenge = {
    current: Math.min(100, Math.round((c / Math.max(1, q)) * 100)),
    target: 100,
    completed: q > 400,
  };
}

/**
 * Merges new generated sessions + mistakes into existing mleo snapshot state.
 * Default mode: replace simulator-tagged rows for each affected (subject, topic) only, then add new.
 *
 * @param {object} args
 * @returns {{ snapshot: object, touchedKeys: string[] }}
 */
export function mergeStorageSnapshotForCustomApply({
  existingStorageMap = {},
  newSessions,
  playerName,
  customApplyMode = CUSTOM_APPLY_MODE.replaceSelectedTopics,
  affectedUnits = [],
} = {}) {
  const name = (playerName || "").trim() || "Student";
  const mode = customApplyMode;
  const partial = buildStorageSnapshotFromSessions(newSessions, name).snapshot;
  const merged = snapshotFromExistingMap(existingStorageMap, name);
  merged.mleo_player_name = name;

  const affectedSet = new Set();
  for (const u of affectedUnits) {
    if (!u || !u.subject || !u.topic) continue;
    affectedSet.add(unitKey(u.subject, u.topic));
  }

  for (const u of affectedUnits) {
    if (!u || !u.subject || !u.topic) continue;
    mergeOneTopicIntoSnapshot(merged, partial, u.subject, u.topic, mode);
  }

  const MISTAKE_KEYS = [
    "mleo_mistakes",
    "mleo_geometry_mistakes",
    "mleo_english_mistakes",
    "mleo_science_mistakes",
    "mleo_hebrew_mistakes",
    "mleo_moledet_geography_mistakes",
  ];
  for (const mkey of MISTAKE_KEYS) {
    merged[mkey] = mergeMistakeList(
      merged[mkey] || [],
      partial[mkey] || [],
      mode,
      affectedSet
    );
  }
  recomputeAllDailiesAndProgress(merged);
  recomputeChallenges(merged);
  return {
    snapshot: merged,
    touchedKeys: [...STORAGE_KEYS],
  };
}

export { unitKey, isSimRowForUnit };
