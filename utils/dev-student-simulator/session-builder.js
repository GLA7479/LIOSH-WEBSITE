import { SUBJECT_BUCKETS } from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(input) {
  let h = 1779033703;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function pickDayIndex(spanDays, rng) {
  const span = Math.max(1, spanDays);
  const u = rng();
  if (u < 0.52) {
    const lo = Math.max(0, span - 8);
    return lo + Math.floor(rng() * (span - lo));
  }
  if (u < 0.78) {
    const lo = Math.max(0, span - 38);
    const hi = Math.max(0, span - 9);
    if (hi <= lo) return Math.floor(rng() * span);
    return lo + Math.floor(rng() * (hi - lo + 1));
  }
  const hi = Math.max(0, span - 39);
  return Math.floor(rng() * (hi + 1));
}

/** Pick day index so session timestamp falls in [windowStartMs, windowEndMs] relative to anchor. */
function pickDayIndexInWindow(anchorEndMs, spanDays, oldestMs, windowStartMs, windowEndMs, rng) {
  const span = Math.max(1, spanDays);
  let lo = Math.max(0, Math.floor((windowStartMs - oldestMs) / DAY_MS));
  let hi = Math.min(span - 1, Math.ceil((windowEndMs - oldestMs) / DAY_MS));
  if (hi < lo) {
    lo = Math.max(0, span - 45);
    hi = span - 1;
  }
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/** Keep session timestamp strictly inside [minMs, maxMs] (random intraday jitter leaks across day boundaries). */
function clampTimestampInWindow(ts, minMs, maxMs, rng) {
  const lo = Number(minMs);
  const hi = Number(maxMs);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return ts;
  let t = Number(ts);
  if (!Number.isFinite(t)) return lo + Math.floor(rng() * Math.min(DAY_MS * 0.85, hi - lo));
  if (t < lo) t = lo + Math.floor(rng() * Math.min(DAY_MS * 0.85, hi - lo));
  if (t > hi) t = hi - Math.floor(rng() * Math.min(DAY_MS * 0.85, hi - lo));
  if (t < lo) t = lo;
  if (t > hi) t = hi;
  return t;
}

function pickWeighted(items, weights, rng) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let u = rng() * sum;
  for (let i = 0; i < items.length; i += 1) {
    u -= weights[i];
    if (u <= 0) return items[i];
  }
  return items[items.length - 1];
}

function allocateTotals(targetSessions, targetQuestions, rng) {
  const out = [];
  let rem = targetQuestions;
  for (let i = 0; i < targetSessions - 1; i += 1) {
    const rest = targetSessions - i;
    const base = rem / rest;
    const jitter = 0.55 + rng() * 0.55;
    const n = Math.max(5, Math.min(42, Math.round(base * jitter)));
    out.push(n);
    rem -= n;
  }
  out.push(Math.max(10, rem));
  return out;
}

function levelModeForPreset(preset, subject, bucket, phase, rng) {
  if (preset.id === "simDeep05_declining_after_difficulty_jump") {
    return {
      grade: "g5",
      level: phase < 0.58 ? (rng() < 0.7 ? "medium" : "easy") : "hard",
      mode: phase < 0.58 ? "learning" : rng() < 0.4 ? "challenge" : "learning",
    };
  }
  if (preset.id === "simDeep06_fast_careless_vs_slow_accurate_mix") {
    const fastMath = subject === "math" && (bucket === "addition" || bucket === "subtraction");
    return { grade: "g4", level: "medium", mode: fastMath ? "speed" : "learning" };
  }
  if (preset.id === "simDeep02_strong_stable_child") {
    return { grade: "g5", level: rng() < 0.7 ? "medium" : "hard", mode: "learning" };
  }
  return { grade: "g4", level: "medium", mode: rng() < 0.8 ? "learning" : "practice" };
}

function accuracyForPreset(preset, subject, bucket, phase, rng) {
  if (preset.id === "simDeep01_mixed_real_child") {
    if (subject === "math") return 0.48 + rng() * 0.08;
    if (subject === "english") return 0.9 + rng() * 0.04;
    if (subject === "hebrew") return Math.min(0.92, 0.52 + phase * 0.28 + rng() * 0.05);
    if (subject === "geometry") return 0.55 + rng() * 0.1;
    return 0.7 + rng() * 0.08;
  }
  if (preset.id === "simDeep02_strong_stable_child") {
    if (subject === "math") return 0.78 + rng() * 0.09;
    if (subject === "english") return 0.9 + rng() * 0.05;
    return 0.86 + rng() * 0.08;
  }
  if (preset.id === "simDeep03_weak_math_long_term") {
    if (subject === "math") {
      const weak = bucket === "fractions" || bucket === "division" || bucket === "word_problems";
      return (weak ? 0.38 : 0.5) + rng() * 0.1;
    }
    if (subject === "geometry") return 0.72 + rng() * 0.08;
    return 0.68 + rng() * 0.1;
  }
  if (preset.id === "simDeep04_improving_child") {
    const base = 0.46 + phase * 0.34;
    return Math.min(0.88, base + rng() * 0.06);
  }
  if (preset.id === "simDeep05_declining_after_difficulty_jump") {
    if (phase < 0.58) return 0.82 + rng() * 0.08;
    return 0.54 + rng() * 0.12;
  }
  const fastMath = subject === "math" && (bucket === "addition" || bucket === "subtraction");
  return fastMath ? 0.62 + rng() * 0.1 : 0.88 + rng() * 0.06;
}

/**
 * Spine + filler for improving narrative: same math bucket/mode across months with clear accuracy lift.
 */
function buildSimDeep04Sessions(preset, anchorEndMs, rng) {
  const spanDays = preset.spanDays;
  const oldest = anchorEndMs - (spanDays - 1) * DAY_MS;
  const totals = allocateTotals(preset.targetSessions, preset.targetQuestions, rng);
  const sessions = [];
  let ti = 0;
  const spineCount = Math.min(preset.targetSessions - 18, Math.max(36, Math.floor(preset.targetSessions * 0.58)));
  const spineBucket = "addition";
  const prevStart = anchorEndMs - 60 * DAY_MS;
  const prevEnd = anchorEndMs - 30 * DAY_MS - 1;
  const curStart = anchorEndMs - 30 * DAY_MS;

  for (let k = 0; k < spineCount; k += 1) {
    const inPrev = k < spineCount * 0.42;
    const dayIndex = inPrev
      ? pickDayIndexInWindow(anchorEndMs, spanDays, oldest, prevStart, prevEnd, rng)
      : pickDayIndexInWindow(anchorEndMs, spanDays, oldest, curStart, anchorEndMs, rng);
    const acc = inPrev ? 0.4 + rng() * 0.1 : 0.8 + rng() * 0.09;
    const total = totals[ti++];
    const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
    const rawTs = oldest + dayIndex * DAY_MS + Math.floor(rng() * 0.7 * DAY_MS);
    const ts = inPrev
      ? clampTimestampInWindow(rawTs, prevStart, prevEnd, rng)
      : clampTimestampInWindow(rawTs, curStart, anchorEndMs, rng);
    sessions.push({
      subject: "math",
      bucket: spineBucket,
      timestamp: ts,
      date: new Date(ts).toISOString().split("T")[0],
      total,
      correct,
      duration: Math.round((14 + rng() * 14) * 60),
      grade: "g4",
      level: "medium",
      mode: "learning",
      mistakePatternRotate: true,
    });
  }

  const fillerSubjects = ["hebrew", "english", "geometry", "science"];
  const fillerWeights = fillerSubjects.map((s) => Math.max(0.06, Number(preset.subjectWeights[s]) || 0.12));
  const rr = { hebrew: 0, english: 0, geometry: 0, science: 0 };
  let fillerOrdinal = 0;
  while (ti < preset.targetSessions) {
    const subject =
      fillerOrdinal < fillerSubjects.length
        ? fillerSubjects[fillerOrdinal++]
        : pickWeighted(fillerSubjects, fillerWeights, rng);
    const buckets = SUBJECT_BUCKETS[subject] || [];
    const bucket = buckets[rr[subject] % buckets.length];
    rr[subject] += 1;
    const dayIndex = pickDayIndex(spanDays, rng);
    const phase = Math.max(0, Math.min(1, dayIndex / Math.max(1, spanDays - 1)));
    const { grade, level, mode } = levelModeForPreset(preset, subject, bucket, phase, rng);
    const acc = Math.min(0.9, 0.5 + phase * 0.28 + rng() * 0.08);
    const total = totals[ti];
    const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
    const ts = oldest + dayIndex * DAY_MS + Math.floor(rng() * 0.75 * DAY_MS);
    sessions.push({
      subject,
      bucket,
      timestamp: ts,
      date: new Date(ts).toISOString().split("T")[0],
      total,
      correct,
      duration: Math.round((14 + rng() * 16) * 60),
      grade,
      level,
      mode,
    });
    ti += 1;
  }
  const sorted = sessions.sort((a, b) => a.timestamp - b.timestamp);
  if (sorted.length >= 2) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    first.timestamp = oldest + Math.floor(rng() * 4) * 60 * 60 * 1000;
    first.date = new Date(first.timestamp).toISOString().split("T")[0];
    last.timestamp = anchorEndMs - 1500 - Math.floor(rng() * 4) * 60 * 60 * 1000;
    last.date = new Date(last.timestamp).toISOString().split("T")[0];
  }
  return sorted.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Decline after harder stretch: heavy volume on one math bucket; stable prev month vs weak current month.
 */
function buildSimDeep05Sessions(preset, anchorEndMs, rng) {
  const spanDays = preset.spanDays;
  const oldest = anchorEndMs - (spanDays - 1) * DAY_MS;
  const totals = allocateTotals(preset.targetSessions, preset.targetQuestions, rng);
  const sessions = [];
  let ti = 0;
  const spineBucket = "multiplication";
  const spineCount = Math.min(preset.targetSessions - 14, Math.max(34, Math.floor(preset.targetSessions * 0.55)));
  const prevStart = anchorEndMs - 60 * DAY_MS;
  const prevEnd = anchorEndMs - 30 * DAY_MS - 1;
  const curStart = anchorEndMs - 30 * DAY_MS;

  for (let k = 0; k < spineCount; k += 1) {
    const inPrev = k < spineCount * 0.48;
    const dayIndex = inPrev
      ? pickDayIndexInWindow(anchorEndMs, spanDays, oldest, prevStart, prevEnd, rng)
      : pickDayIndexInWindow(anchorEndMs, spanDays, oldest, curStart, anchorEndMs, rng);
    const phase = Math.max(0, Math.min(1, dayIndex / Math.max(1, spanDays - 1)));
    const level = inPrev ? (rng() < 0.75 ? "medium" : "easy") : "hard";
    const mode = inPrev ? "learning" : rng() < 0.35 ? "challenge" : "learning";
    const acc = inPrev ? 0.84 + rng() * 0.08 : 0.48 + rng() * 0.1;
    const total = totals[ti++];
    const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
    const rawTs = oldest + dayIndex * DAY_MS + Math.floor(rng() * 0.65 * DAY_MS);
    const ts = inPrev
      ? clampTimestampInWindow(rawTs, prevStart, prevEnd, rng)
      : clampTimestampInWindow(rawTs, curStart, anchorEndMs, rng);
    sessions.push({
      subject: "math",
      bucket: spineBucket,
      timestamp: ts,
      date: new Date(ts).toISOString().split("T")[0],
      total,
      correct,
      duration: Math.round((mode === "challenge" ? 10 : 14 + rng() * 14) * 60),
      grade: "g5",
      level,
      mode,
      mistakePatternRotate: true,
    });
  }

  const subjects = Object.keys(preset.subjectWeights).filter((s) => s !== "math");
  const weights = subjects.map((s) => preset.subjectWeights[s]);
  const rr = { geometry: 0, english: 0, science: 0, hebrew: 0 };
  while (ti < preset.targetSessions) {
    const subject = pickWeighted(subjects, weights, rng);
    const buckets = SUBJECT_BUCKETS[subject] || [];
    rr[subject] = rr[subject] || 0;
    const bucket = buckets[rr[subject] % buckets.length];
    rr[subject] += 1;
    const dayIndex = pickDayIndex(spanDays, rng);
    const phase = Math.max(0, Math.min(1, dayIndex / Math.max(1, spanDays - 1)));
    const { grade, level, mode } = levelModeForPreset(preset, subject, bucket, phase, rng);
    const acc = accuracyForPreset(preset, subject, bucket, phase, rng);
    const total = totals[ti];
    const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
    const ts = oldest + dayIndex * DAY_MS + Math.floor(rng() * 0.75 * DAY_MS);
    sessions.push({
      subject,
      bucket,
      timestamp: ts,
      date: new Date(ts).toISOString().split("T")[0],
      total,
      correct,
      duration: Math.round((14 + rng() * 16) * 60),
      grade,
      level,
      mode,
    });
    ti += 1;
  }
  const sorted05 = sessions.sort((a, b) => a.timestamp - b.timestamp);
  if (sorted05.length >= 2) {
    const first = sorted05[0];
    const last = sorted05[sorted05.length - 1];
    first.timestamp = oldest + Math.floor(rng() * 4) * 60 * 60 * 1000;
    first.date = new Date(first.timestamp).toISOString().split("T")[0];
    last.timestamp = anchorEndMs - 1500 - Math.floor(rng() * 4) * 60 * 60 * 1000;
    last.date = new Date(last.timestamp).toISOString().split("T")[0];
  }
  return sorted05.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Fast careless math (speed + short wrong RT) vs slow accurate non-math topics.
 */
function buildSimDeep06Sessions(preset, anchorEndMs, rng) {
  const spanDays = preset.spanDays;
  const oldest = anchorEndMs - (spanDays - 1) * DAY_MS;
  const sessions = [];
  const spineCount = Math.min(preset.targetSessions - 8, Math.max(36, Math.floor(preset.targetSessions * 0.62)));
  const fillerCount = preset.targetSessions - spineCount;
  const spineBudget = Math.floor(preset.targetQuestions * 0.82);
  const fillerBudget = Math.max(1, preset.targetQuestions - spineBudget);
  const spineTotals = allocateTotals(spineCount, spineBudget, rng);
  const fillerTotals = allocateTotals(fillerCount, fillerBudget, rng);

  for (let k = 0; k < spineCount; k += 1) {
    const bucket = k % 2 === 0 ? "addition" : "multiplication";
    const dayIndex = pickDayIndex(spanDays, rng);
    const acc = 0.78 + rng() * 0.07;
    const total = spineTotals[k];
    const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
    const ts = oldest + dayIndex * DAY_MS + Math.floor(rng() * 0.72 * DAY_MS);
    sessions.push({
      subject: "math",
      bucket,
      timestamp: ts,
      date: new Date(ts).toISOString().split("T")[0],
      total,
      correct,
      duration: Math.round((7 + rng() * 6) * 60),
      grade: "g4",
      level: "medium",
      mode: "speed",
      mistakePatternRotate: true,
    });
  }

  const slowSubjects = ["english", "geometry", "science"];
  const sw = slowSubjects.map((s) => (preset.subjectWeights[s] != null ? preset.subjectWeights[s] : 0.18));
  for (let fi = 0; fi < fillerCount; fi += 1) {
    const subject = pickWeighted(slowSubjects, sw, rng);
    const buckets = SUBJECT_BUCKETS[subject] || [];
    const bucket = buckets[Math.floor(rng() * buckets.length)];
    const dayIndex = pickDayIndex(spanDays, rng);
    const acc = 0.9 + rng() * 0.06;
    const total = fillerTotals[fi];
    const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
    const ts = oldest + dayIndex * DAY_MS + Math.floor(rng() * 0.75 * DAY_MS);
    sessions.push({
      subject,
      bucket,
      timestamp: ts,
      date: new Date(ts).toISOString().split("T")[0],
      total,
      correct,
      duration: Math.round((18 + rng() * 18) * 60),
      grade: "g4",
      level: "medium",
      mode: "learning",
    });
  }
  const sorted = sessions.sort((a, b) => a.timestamp - b.timestamp);
  if (sorted.length >= 2) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    first.timestamp = oldest + Math.floor(rng() * 3) * 60 * 60 * 1000;
    first.date = new Date(first.timestamp).toISOString().split("T")[0];
    last.timestamp = anchorEndMs - 2000 - Math.floor(rng() * 3) * 60 * 60 * 1000;
    last.date = new Date(last.timestamp).toISOString().split("T")[0];
  }
  return sorted.sort((a, b) => a.timestamp - b.timestamp);
}

export function buildSessionsFromPreset(preset, anchorEndMs = Date.now()) {
  const rng = mulberry32(hashStringToSeed(`${preset.id}:${anchorEndMs}`));

  if (preset.id === "simDeep04_improving_child") {
    return buildSimDeep04Sessions(preset, anchorEndMs, rng);
  }
  if (preset.id === "simDeep05_declining_after_difficulty_jump") {
    return buildSimDeep05Sessions(preset, anchorEndMs, rng);
  }
  if (preset.id === "simDeep06_fast_careless_vs_slow_accurate_mix") {
    return buildSimDeep06Sessions(preset, anchorEndMs, rng);
  }

  const subjects = Object.keys(preset.subjectWeights);
  const weights = subjects.map((s) => preset.subjectWeights[s]);
  const totals = allocateTotals(preset.targetSessions, preset.targetQuestions, rng);
  const rr = {};
  const sessions = [];
  const oldest = anchorEndMs - (preset.spanDays - 1) * DAY_MS;

  for (let i = 0; i < preset.targetSessions; i += 1) {
    const subject = pickWeighted(subjects, weights, rng);
    const buckets = SUBJECT_BUCKETS[subject] || [];
    rr[subject] = rr[subject] || 0;
    const bucket = buckets[rr[subject] % buckets.length];
    rr[subject] += 1;

    const dayIndex = pickDayIndex(preset.spanDays, rng);
    const ts = oldest + dayIndex * DAY_MS + Math.floor(rng() * 0.75 * DAY_MS);
    const phase = Math.max(0, Math.min(1, dayIndex / Math.max(1, preset.spanDays - 1)));
    const { grade, level, mode } = levelModeForPreset(preset, subject, bucket, phase, rng);
    const acc = accuracyForPreset(preset, subject, bucket, phase, rng);
    const total = totals[i];
    const correct = Math.max(0, Math.min(total, Math.round(total * acc)));
    const duration = mode === "speed" ? Math.round((8 + rng() * 7) * 60) : Math.round((14 + rng() * 16) * 60);

    sessions.push({
      subject,
      bucket,
      timestamp: ts,
      date: new Date(ts).toISOString().split("T")[0],
      total,
      correct,
      duration,
      grade,
      level,
      mode,
    });
  }

  const sortedGen = sessions.sort((a, b) => a.timestamp - b.timestamp);
  if (sortedGen.length >= 2 && preset.spanDays >= 90) {
    const oldestG = anchorEndMs - (preset.spanDays - 1) * DAY_MS;
    const first = sortedGen[0];
    const last = sortedGen[sortedGen.length - 1];
    first.timestamp = oldestG + Math.floor(rng() * 4) * 60 * 60 * 1000;
    first.date = new Date(first.timestamp).toISOString().split("T")[0];
    last.timestamp = anchorEndMs - 1500 - Math.floor(rng() * 4) * 60 * 60 * 1000;
    last.date = new Date(last.timestamp).toISOString().split("T")[0];
  }
  return sortedGen.sort((a, b) => a.timestamp - b.timestamp);
}
