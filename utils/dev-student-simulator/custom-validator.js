import { SUBJECTS, SUBJECT_BUCKETS, CUSTOM_APPLY_MODE } from "./constants";
import { resolveCustomSpecTopicSettings, listAffectedTopicUnits } from "./custom-session-builder";

const DAY_MS = 24 * 60 * 60 * 1000;

const GRADES = new Set(["g1", "g2", "g3", "g4", "g5", "g6"]);
const LEVELS = new Set(["easy", "medium", "hard"]);
const MODES = new Set(["learning", "practice", "challenge", "speed"]);
const TRENDS = new Set(["stable", "improving", "declining", "jump_decline", "fast_inattentive", "slow_accurate"]);
const RESPONSE_PROFILES = new Set(["fast_wrong", "slow_accurate", "slow_wrong", "balanced"]);
const APPLY_MODES = new Set(Object.values(CUSTOM_APPLY_MODE));

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

  for (const sid of SUBJECTS) {
    const topicKeysListed = Array.isArray(spec.subjects?.[sid]?.topics) ? spec.subjects[sid].topics : [];
    const allowed = new Set(SUBJECT_BUCKETS[sid] || []);
    for (const t of topicKeysListed) {
      if (!allowed.has(t)) errors.push(`subject ${sid}: invalid topic key "${t}"`);
    }
  }

  resolveCustomSpecTopicSettings(spec);

  if (!GRADES.has(spec.grade)) errors.push(`invalid grade: ${String(spec.grade)}`);

  const span = Number(spec.spanDays);
  const active = Number(spec.activeDays);
  const units = listAffectedTopicUnits(spec);

  if (!Number.isFinite(span) || span < 1) errors.push("spanDays must be >= 1");
  if (!Number.isFinite(active) || active < 1) errors.push("activeDays must be >= 1");
  if (Number.isFinite(span) && Number.isFinite(active) && active > span) {
    errors.push("activeDays cannot exceed spanDays");
  }

  if (!TRENDS.has(spec.customTrend)) errors.push(`invalid trend: ${String(spec.customTrend)}`);
  if (!RESPONSE_PROFILES.has(spec.responseMsBehavior)) {
    errors.push(`invalid responseMsBehavior: ${String(spec.responseMsBehavior)}`);
  }

  const am = spec.customApplyMode || CUSTOM_APPLY_MODE.replaceSelectedTopics;
  if (!APPLY_MODES.has(am)) errors.push(`invalid customApplyMode: ${String(spec.customApplyMode)}`);

  const mr = Number(spec.mistakeRatePct);
  const rs = Number(spec.repeatedMistakeStrengthPct);
  if (!Number.isFinite(mr) || mr < 0 || mr > 100) errors.push("mistakeRatePct must be 0–100");
  if (!Number.isFinite(rs) || rs < 0 || rs > 100) errors.push("repeatedMistakeStrengthPct must be 0–100");

  if (units.length < 1) {
    errors.push("בחר לפחות נושא אחד לעדכון.");
  }

  for (const sid of SUBJECTS) {
    const activeTopicKeys = (SUBJECT_BUCKETS[sid] || []).filter(
      (t) =>
        spec.topicSettings?.[sid]?.[t]?.enabled &&
        Math.floor(Number(spec.topicSettings?.[sid]?.[t]?.targetQuestions) || 0) > 0
    );
    if (activeTopicKeys.length < 1) continue;
    const row = spec.subjects?.[sid];
    const topics = Array.isArray(row?.topics) ? row.topics : [];
    const allowed = new Set(SUBJECT_BUCKETS[sid] || []);
    for (const t of topics) {
      if (!allowed.has(t)) errors.push(`subject ${sid}: invalid topic key "${t}"`);
    }
    const w = Number(row?.weight);
    if (!Number.isFinite(w) || w <= 0) errors.push(`subject ${sid}: weight must be > 0`);
  }

  for (const sid of SUBJECTS) {
    for (const topic of SUBJECT_BUCKETS[sid] || []) {
      const trow = spec.topicSettings?.[sid]?.[topic];
      if (!trow) continue;
      if (trow.enabled && Math.floor(Number(trow.targetQuestions) || 0) <= 0) {
        errors.push(`נושא מופעל בלי שאלות: ${sid} / ${topic}`);
      }
      if (!trow.enabled) continue;
      const acc = Number(trow.targetAccuracyPct);
      if (!Number.isFinite(acc) || acc < 0 || acc > 100) {
        errors.push(`subject ${sid} topic ${topic}: targetAccuracyPct must be 0–100`);
      }
      const dur = Number(trow.avgSessionDurationSec);
      if (!Number.isFinite(dur) || dur < 30 || dur > 7200) {
        errors.push(`subject ${sid} topic ${topic}: avgSessionDurationSec out of range (30–7200)`);
      }
      if (!LEVELS.has(trow.level)) errors.push(`subject ${sid} topic ${topic}: invalid level`);
      if (!MODES.has(trow.mode)) errors.push(`subject ${sid} topic ${topic}: invalid mode`);
      const tr = trow.topicTrend != null ? trow.topicTrend : spec.customTrend;
      if (!TRENDS.has(tr)) errors.push(`subject ${sid} topic ${topic}: invalid topicTrend`);
      const rp = trow.responseMsBehavior || spec.responseMsBehavior;
      if (!RESPONSE_PROFILES.has(rp)) {
        errors.push(`subject ${sid} topic ${topic}: invalid responseMsBehavior`);
      }
    }
  }

  if (spec.useNowAsAnchor !== true) {
    const d = String(spec.anchorDate || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      errors.push("anchorDate must be YYYY-MM-DD when not using current time");
    } else {
      const t = Date.parse(`${d}T12:00:00`);
      if (!Number.isFinite(t)) errors.push("anchorDate is not a valid calendar date");
    }
  }

  const debug = !!spec.debugShortMode;
  if (units.length >= 1) {
    const tq = Number(spec.totalQuestions);
    const sc = Number(spec.sessionsCount);
    if (!Number.isFinite(tq) || tq < 1) errors.push("totalQuestions must be >= 1 (מחושב מנושאים)");
    if (!Number.isFinite(sc) || sc < 1) errors.push("sessionsCount must be >= 1 (מחושב מנושאים)");
    if (Number.isFinite(sc) && Number.isFinite(tq) && tq < sc) {
      errors.push("totalQuestions must be >= sessionsCount (לפחות שאלה אחת לכל סשן מחושב)");
    }
  }

  const subjectsWithActiveTopics = SUBJECTS.filter((sid) =>
    (SUBJECT_BUCKETS[sid] || []).some(
      (t) =>
        spec.topicSettings?.[sid]?.[t]?.enabled &&
        Math.floor(Number(spec.topicSettings?.[sid]?.[t]?.targetQuestions) || 0) > 0
    )
  );

  if (!debug) {
    const tq = Number(spec.totalQuestions);
    if (Number.isFinite(span) && span < 90) warnings.push("spanDays < 90: report-quality mode may be thin");
    if (Number.isFinite(tq) && tq < 600) warnings.push("totalQuestions < 600: consider raising for report-quality");
    if (subjectsWithActiveTopics.length > 0 && subjectsWithActiveTopics.length < 4) {
      warnings.push("subjects < 4: consider raising more subjects for report-quality");
    }
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

  const expectedUnits = listAffectedTopicUnits(spec);
  for (const u of expectedUnits) {
    if (!tps[u.subject] || tps[u.subject] < 1) {
      errors.push(`${u.subject}: missing expected topic in built sessions`);
    }
  }
  for (const u of expectedUnits) {
    const has = sessions.some((s) => s.subject === u.subject && s.bucket === u.topic);
    if (!has) errors.push(`missing sessions for ${u.subject} / ${u.topic}`);
  }

  // Incremental / topic-level builds stay small: do not require "full report" 600Q / 4 subjects.
  const reportQuality = !debug && totalQuestions >= 600;

  if (debug) {
    if (sessions.length < 3) errors.push(`(debug) sessions ${sessions.length} < 3`);
    if (totalQuestions < 15) errors.push(`(debug) totalQuestions ${totalQuestions} < 15`);
    if (spanDays < 3) errors.push(`(debug) spanDays ${spanDays} < 3`);
    if (dayCount < 2) errors.push(`(debug) activeDays ${dayCount} < 2`);
    if (subjectCount < 1) errors.push(`(debug) subjectCount ${subjectCount} < 1`);
  } else if (reportQuality) {
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
