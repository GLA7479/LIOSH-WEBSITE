import { STORAGE_KEYS } from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

function avgAccuracy(sessions) {
  const q = sessions.reduce((a, s) => a + (Number(s.total) || 0), 0);
  const c = sessions.reduce((a, s) => a + (Number(s.correct) || 0), 0);
  return q > 0 ? c / q : 0;
}

function sessionsInWindows(sessions, anchorMs) {
  const cur = sessions.filter((s) => s.timestamp >= anchorMs - 30 * DAY_MS);
  const prev = sessions.filter(
    (s) => s.timestamp >= anchorMs - 60 * DAY_MS && s.timestamp < anchorMs - 30 * DAY_MS
  );
  return { cur, prev };
}

function uniqueDays(sessions) {
  return new Set(sessions.map((s) => s.date)).size;
}

function uniqueSubjects(sessions) {
  return new Set(sessions.map((s) => s.subject)).size;
}

function topicsPerSubject(sessions) {
  const map = {};
  for (const s of sessions) {
    map[s.subject] = map[s.subject] || new Set();
    map[s.subject].add(s.bucket);
  }
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.size]));
}

export function validatePresetSessions(preset, sessions) {
  const errors = [];
  const warnings = [];
  const totalQuestions = sessions.reduce((a, s) => a + (Number(s.total) || 0), 0);
  const minTs = Math.min(...sessions.map((s) => s.timestamp));
  const maxTs = Math.max(...sessions.map((s) => s.timestamp));
  const spanDays = Math.ceil((maxTs - minTs) / (24 * 60 * 60 * 1000));
  const dayCount = uniqueDays(sessions);
  const subjectCount = uniqueSubjects(sessions);
  const tps = topicsPerSubject(sessions);

  if (sessions.length < 40) errors.push(`sessions ${sessions.length} < 40`);
  if (totalQuestions < 600) errors.push(`totalQuestions ${totalQuestions} < 600`);
  if (spanDays < 90) errors.push(`spanDays ${spanDays} < 90`);
  if (subjectCount < 4) errors.push(`subjectCount ${subjectCount} < 4`);
  if (dayCount < Math.min(40, Math.ceil((preset.spanDays || 90) * 0.22))) {
    errors.push(`activeDays ${dayCount} too concentrated`);
  }

  for (const [subject, count] of Object.entries(tps)) {
    if (count < 3) warnings.push(`${subject} has low topic diversity (${count})`);
  }

  const anchorMs = maxTs;
  const { cur, prev } = sessionsInWindows(sessions, anchorMs);

  if (preset.id === "simDeep04_improving_child") {
    const spine = (list) =>
      list.filter((s) => s.subject === "math" && s.bucket === "addition" && s.mode === "learning");
    const cSp = spine(cur);
    const pSp = spine(prev);
    if (cSp.length < 5 || pSp.length < 5) {
      errors.push("improving preset: need >=5 spine math/addition/learning sessions in each 30d window");
    }
    if (avgAccuracy(cSp) - avgAccuracy(pSp) < 0.14) {
      errors.push("improving preset: spine accuracy lift from prev→current month too weak (<14pp)");
    }
  }

  if (preset.id === "simDeep05_declining_after_difficulty_jump") {
    const spine = (list) => list.filter((s) => s.subject === "math" && s.bucket === "multiplication");
    const cSp = spine(cur);
    const pSp = spine(prev);
    if (cSp.length < 5 || pSp.length < 5) {
      errors.push("declining preset: need >=5 spine math/multiplication sessions in each 30d window");
    }
    if (avgAccuracy(pSp) - avgAccuracy(cSp) < 0.16) {
      errors.push("declining preset: post-window accuracy drop too weak (<16pp vs prior window)");
    }
    if (cSp.filter((s) => s.level === "hard").length < 6) {
      errors.push("declining preset: current window should include >=6 hard-level spine sessions");
    }
  }

  if (preset.id === "simDeep06_fast_careless_vs_slow_accurate_mix") {
    const fast = cur.filter((s) => s.subject === "math" && s.mode === "speed");
    const slowAcc = cur.filter((s) => s.mode === "learning" && s.subject !== "math");
    if (fast.length < 8) errors.push("pace preset: need >=8 speed-mode math sessions in current month");
    if (slowAcc.length < 10) errors.push("pace preset: need >=10 slow/learning non-math sessions in current month");
    if (avgAccuracy(slowAcc) - avgAccuracy(fast) < 0.12) {
      errors.push("pace preset: slow-accurate vs fast-error accuracy gap too small (<12pp)");
    }
    if (avgAccuracy(fast) > 0.82) {
      errors.push("pace preset: fast track should stay below ~82% accuracy to retain error signal");
    }
    const addSp = fast.filter((s) => s.bucket === "addition").length;
    const mulSp = fast.filter((s) => s.bucket === "multiplication").length;
    if (addSp < 8 || mulSp < 8) {
      errors.push("pace preset: need >=8 speed sessions on addition and on multiplication in current month");
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      sessions: sessions.length,
      totalQuestions,
      spanDays,
      activeDays: dayCount,
      subjectCount,
      topicsPerSubject: tps,
    },
  };
}

export function validateSnapshotNamespace(snapshot) {
  const errors = [];
  const keys = Object.keys(snapshot);
  for (const key of keys) {
    if (key.startsWith("leok_")) errors.push(`forbidden key detected: ${key}`);
    if (key !== "mleo_player_name" && key.startsWith("mleo_") === false) {
      errors.push(`non-mleo storage key: ${key}`);
    }
  }
  for (const key of STORAGE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(snapshot, key)) {
      errors.push(`missing required key: ${key}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
