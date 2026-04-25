import { SUBJECTS, SUBJECT_BUCKETS } from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

const GRADES = new Set(["g1", "g2", "g3", "g4", "g5", "g6"]);
const LEVELS = new Set(["easy", "medium", "hard"]);
const MODES = new Set(["learning", "practice", "challenge", "speed"]);
const TRENDS = new Set(["stable", "improving", "declining", "jump_decline", "fast_inattentive", "slow_accurate"]);
const RESPONSE_PROFILES = new Set(["fast_wrong", "slow_accurate", "slow_wrong", "balanced"]);

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

function sessionsInWindows(sessions, anchorMs) {
  const cur = sessions.filter((s) => s.timestamp >= anchorMs - 30 * DAY_MS);
  const prev = sessions.filter(
    (s) => s.timestamp >= anchorMs - 60 * DAY_MS && s.timestamp < anchorMs - 30 * DAY_MS
  );
  return { cur, prev };
}

function topicKeyCount(sessions) {
  const set = new Set();
  for (const s of sessions) set.add(`${s.subject}:${s.bucket}`);
  return set.size;
}

/**
 * Validates the custom spec before session generation (no sessions yet).
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateCustomSpecBeforeBuild(spec) {
  const errors = [];
  const warnings = [];

  if (!spec || typeof spec !== "object") {
    errors.push("missing spec");
    return { ok: false, errors, warnings };
  }

  if (!GRADES.has(spec.grade)) errors.push(`invalid grade: ${String(spec.grade)}`);

  const span = Number(spec.spanDays);
  const active = Number(spec.activeDays);
  const sess = Number(spec.sessionsCount);
  const qs = Number(spec.totalQuestions);

  if (!Number.isFinite(span) || span < 1) errors.push("spanDays must be >= 1");
  if (!Number.isFinite(active) || active < 1) errors.push("activeDays must be >= 1");
  if (Number.isFinite(span) && Number.isFinite(active) && active > span) errors.push("activeDays cannot exceed spanDays");
  if (!Number.isFinite(sess) || sess < 1) errors.push("sessionsCount must be >= 1");
  if (!Number.isFinite(qs) || qs < 1) errors.push("totalQuestions must be >= 1");
  if (Number.isFinite(sess) && Number.isFinite(qs) && qs < sess) errors.push("totalQuestions must be >= sessionsCount (at least one question per session)");

  if (!TRENDS.has(spec.customTrend)) errors.push(`invalid trend: ${String(spec.customTrend)}`);
  if (!RESPONSE_PROFILES.has(spec.responseMsBehavior)) {
    errors.push(`invalid responseMsBehavior: ${String(spec.responseMsBehavior)}`);
  }

  const mr = Number(spec.mistakeRatePct);
  const rs = Number(spec.repeatedMistakeStrengthPct);
  if (!Number.isFinite(mr) || mr < 0 || mr > 100) errors.push("mistakeRatePct must be 0–100");
  if (!Number.isFinite(rs) || rs < 0 || rs > 100) errors.push("repeatedMistakeStrengthPct must be 0–100");

  const enabledSubjects = SUBJECTS.filter((id) => spec.subjects?.[id]?.enabled);
  if (enabledSubjects.length < 1) errors.push("at least one subject must be enabled");

  for (const sid of SUBJECTS) {
    const row = spec.subjects?.[sid];
    if (!row?.enabled) continue;
    const topics = Array.isArray(row.topics) ? row.topics : [];
    if (topics.length < 1) errors.push(`subject ${sid}: select at least one topic`);
    const allowed = SUBJECT_BUCKETS[sid] || [];
    for (const t of topics) {
      if (!allowed.includes(t)) errors.push(`subject ${sid}: invalid topic key "${t}"`);
    }
    const acc = Number(row.targetAccuracyPct);
    if (!Number.isFinite(acc) || acc < 0 || acc > 100) errors.push(`subject ${sid}: targetAccuracyPct must be 0–100`);
    const dur = Number(row.avgSessionDurationSec);
    if (!Number.isFinite(dur) || dur < 30 || dur > 7200) errors.push(`subject ${sid}: avgSessionDurationSec out of range (30–7200)`);
    if (!LEVELS.has(row.level)) errors.push(`subject ${sid}: invalid level`);
    if (!MODES.has(row.mode)) errors.push(`subject ${sid}: invalid mode`);
    const w = Number(row.weight);
    if (!Number.isFinite(w) || w <= 0) errors.push(`subject ${sid}: weight must be > 0`);
  }

  if (spec.useNowAsAnchor !== true) {
    const d = String(spec.anchorDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) errors.push("anchorDate must be YYYY-MM-DD when not using current time");
    else {
      const t = Date.parse(`${d}T12:00:00`);
      if (!Number.isFinite(t)) errors.push("anchorDate is not a valid calendar date");
    }
  }

  const debug = !!spec.debugShortMode;
  if (!debug) {
    if (Number.isFinite(span) && span < 90) warnings.push("spanDays < 90: report-quality mode may be thin");
    if (Number.isFinite(sess) && sess < 40) warnings.push("sessions < 40: consider raising for report-quality");
    if (Number.isFinite(qs) && qs < 600) warnings.push("totalQuestions < 600: consider raising for report-quality");
    if (enabledSubjects.length > 0 && enabledSubjects.length < 4) warnings.push("subjects < 4: consider enabling more subjects for report-quality");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validates generated sessions for custom builder (after build).
 */
export function validateCustomSessionsAfterBuild(sessions, spec) {
  const errors = [];
  const warnings = [];
  const debug = !!spec?.debugShortMode;

  const totalQuestions = sessions.reduce((a, s) => a + (Number(s.total) || 0), 0);
  const minTs = Math.min(...sessions.map((s) => s.timestamp));
  const maxTs = Math.max(...sessions.map((s) => s.timestamp));
  const spanDays = Math.ceil((maxTs - minTs) / DAY_MS) || 1;
  const dayCount = uniqueDays(sessions);
  const subjectCount = uniqueSubjects(sessions);
  const tps = topicsPerSubject(sessions);
  const anchorMs = maxTs;
  const { cur, prev } = sessionsInWindows(sessions, anchorMs);

  if (sessions.length < 1) errors.push("no sessions");
  if (totalQuestions < 1) errors.push("no questions");

  for (const [subject, count] of Object.entries(tps)) {
    if (count < 1) errors.push(`${subject}: missing topics in built sessions`);
  }

  if (debug) {
    if (sessions.length < 3) errors.push(`(debug) sessions ${sessions.length} < 3`);
    if (totalQuestions < 15) errors.push(`(debug) totalQuestions ${totalQuestions} < 15`);
    if (spanDays < 3) errors.push(`(debug) spanDays ${spanDays} < 3`);
    if (dayCount < 2) errors.push(`(debug) activeDays ${dayCount} < 2`);
    if (subjectCount < 1) errors.push(`(debug) subjectCount ${subjectCount} < 1`);
  } else {
    if (sessions.length < 40) errors.push(`sessions ${sessions.length} < 40`);
    if (totalQuestions < 600) errors.push(`totalQuestions ${totalQuestions} < 600`);
    if (spanDays < 90) errors.push(`spanDays ${spanDays} < 90`);
    if (subjectCount < 4) errors.push(`subjectCount ${subjectCount} < 4`);
    const spanCfg = Math.max(1, Number(spec.spanDays) || 90);
    if (dayCount < Math.min(40, Math.ceil(spanCfg * 0.22))) {
      errors.push(`activeDays ${dayCount} too concentrated for span`);
    }
  }

  if (!debug) {
    if (cur.length < 1) warnings.push("no sessions in current 30d window (reports may lack recent signal)");
    if (prev.length < 1) warnings.push("no sessions in previous 30d window (trend vs prior may be weak)");
  }

  let topicWarn = false;
  for (const [subject, count] of Object.entries(tps)) {
    if (count < 3) topicWarn = true;
  }
  if (topicWarn) warnings.push("low topic diversity in some subjects (<3 topics)");

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
      topicKeyCount: topicKeyCount(sessions),
      topicsPerSubject: tps,
      currentWindowSessions: cur.length,
      previousWindowSessions: prev.length,
    },
  };
}
