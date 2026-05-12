/**
 * Shared server-only aggregation for parent learning report data (Supabase sessions + answers).
 * Extracted from `pages/api/parent/students/[studentId]/report-data.js` — same outputs, no behavior change.
 */

import {
  isMissingColumnError,
  normalizeLearningGameMode,
  LEARNING_GAME_MODE_ENUM,
} from "../learning-supabase/learning-activity.js";

export const REPORT_AGG_SUBJECTS = ["math", "geometry", "english", "hebrew", "science", "moledet_geography"];

/**
 * Fluency thresholds used by the additive aggregation layer for downstream Insight Packet
 * derivation. They are emitted in `meta.fluencyThresholds` so the Insight Packet can stay in
 * sync without hard-coding constants in two places.
 */
export const REPORT_AGG_FLUENCY_THRESHOLDS = Object.freeze({
  slowMs: 60_000,
  fastMs: 6_000,
  manyHints: 3,
});

const ALLOWED_MODE_VALUES = LEARNING_GAME_MODE_ENUM;
const ALLOWED_LEVEL_VALUES = Object.freeze(["easy", "medium", "hard"]);
const GRADE_LEVEL_PATTERN = /^g[1-9]$/;

function pickEnumString(value, allowed) {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "unknown";
  return allowed.includes(normalized) ? normalized : "unknown";
}

function readModeLevelFromObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { mode: "unknown", level: "unknown" };
  const modeNorm =
    normalizeLearningGameMode(obj.gameMode) || normalizeLearningGameMode(obj.mode);
  return {
    mode: modeNorm || "unknown",
    level: pickEnumString(obj.level, ALLOWED_LEVEL_VALUES),
  };
}

function normalizeFiniteNonNegativeNumber(value, max) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return typeof max === "number" && num > max ? max : num;
}

function emptyEnumCounts(allowed) {
  const out = { unknown: 0 };
  for (const key of allowed) out[key] = 0;
  return out;
}

function createTopicAccumulator() {
  return {
    answers: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
    durationSeconds: 0,
    hintsSum: 0,
    hintsCount: 0,
    timeMsSum: 0,
    timeMsCount: 0,
    correctSlowAnswers: 0,
    correctManyHintsAnswers: 0,
    wrongFastAnswers: 0,
    avgHintsPerQuestion: null,
    avgTimePerQuestionSec: null,
    modeCounts: emptyEnumCounts(ALLOWED_MODE_VALUES),
    levelCounts: emptyEnumCounts(ALLOWED_LEVEL_VALUES),
  };
}

export function isoDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export function parseIsoDateParam(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (isoDateOnly(parsed) !== trimmed) return null;
  return parsed;
}

function createSubjectAccumulator() {
  const out = {};
  for (const subject of REPORT_AGG_SUBJECTS) {
    out[subject] = {
      sessions: 0,
      answers: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      durationSeconds: 0,
      hintsSum: 0,
      hintsCount: 0,
      timeMsSum: 0,
      timeMsCount: 0,
      correctSlowAnswers: 0,
      correctManyHintsAnswers: 0,
      wrongFastAnswers: 0,
      avgHintsPerQuestion: null,
      avgTimePerQuestionSec: null,
      modeCounts: emptyEnumCounts(ALLOWED_MODE_VALUES),
      levelCounts: emptyEnumCounts(ALLOWED_LEVEL_VALUES),
      topics: {},
    };
  }
  return out;
}

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function safeString(value, maxLen = 2000) {
  if (value == null) return null;
  const str = String(value).trim();
  if (!str) return null;
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function toDateKey(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return isoDateOnly(d);
}

async function fetchSessionsInRange(supabase, studentId, fromIso, toIsoExclusive) {
  const selectCols = "id,student_id,subject,topic,started_at,created_at,ended_at,duration_seconds,status,metadata";
  const byStartedAt = await supabase
    .from("learning_sessions")
    .select(selectCols)
    .eq("student_id", studentId)
    .gte("started_at", fromIso)
    .lt("started_at", toIsoExclusive)
    .order("started_at", { ascending: false });

  if (!byStartedAt.error) {
    return { rows: byStartedAt.data || [], filterField: "started_at" };
  }
  if (!isMissingColumnError(byStartedAt.error)) {
    throw byStartedAt.error;
  }

  const byCreatedAt = await supabase
    .from("learning_sessions")
    .select(selectCols)
    .eq("student_id", studentId)
    .gte("created_at", fromIso)
    .lt("created_at", toIsoExclusive)
    .order("created_at", { ascending: false });

  if (byCreatedAt.error) throw byCreatedAt.error;
  return { rows: byCreatedAt.data || [], filterField: "created_at" };
}

async function fetchAnswersInRange(supabase, studentId, fromIso, toIsoExclusive) {
  const selectCols =
    "id,student_id,learning_session_id,question_id,is_correct,answer_payload,answered_at,created_at";
  const byAnsweredAt = await supabase
    .from("answers")
    .select(selectCols)
    .eq("student_id", studentId)
    .gte("answered_at", fromIso)
    .lt("answered_at", toIsoExclusive)
    .order("answered_at", { ascending: false });

  if (!byAnsweredAt.error) {
    return { rows: byAnsweredAt.data || [], filterField: "answered_at" };
  }
  if (!isMissingColumnError(byAnsweredAt.error)) {
    throw byAnsweredAt.error;
  }

  const byCreatedAt = await supabase
    .from("answers")
    .select(selectCols)
    .eq("student_id", studentId)
    .gte("created_at", fromIso)
    .lt("created_at", toIsoExclusive)
    .order("created_at", { ascending: false });

  if (byCreatedAt.error) throw byCreatedAt.error;
  return { rows: byCreatedAt.data || [], filterField: "created_at" };
}

const RECENT_MISTAKES_LIMIT = 20;

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} serviceClient
 * @param {{ id: string, full_name?: string|null, grade_level?: string|null, is_active?: boolean }} student
 * @param {Date} fromDate inclusive (calendar date in UTC terms per report-data API)
 * @param {Date} toDate inclusive
 * @returns {Promise<object>} Same JSON shape as successful GET report-data response (`ok: true`, student, range, summary, …)
 */
export async function aggregateParentReportPayload(serviceClient, student, fromDate, toDate) {
  const fromIso = `${isoDateOnly(fromDate)}T00:00:00.000Z`;
  const toDateExclusive = new Date(toDate);
  toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);
  const toIsoExclusive = `${isoDateOnly(toDateExclusive)}T00:00:00.000Z`;

  const sessionsResult = await fetchSessionsInRange(serviceClient, student.id, fromIso, toIsoExclusive);
  const answersResult = await fetchAnswersInRange(serviceClient, student.id, fromIso, toIsoExclusive);
  const sessions = sessionsResult.rows;
  const answers = answersResult.rows;

  const subjects = createSubjectAccumulator();
  const daily = {};
  const sessionById = {};

  let totalDurationSeconds = 0;
  let completedSessions = 0;
  let overallHintsSum = 0;
  let overallHintsCount = 0;
  let overallTimeMsSum = 0;
  let overallTimeMsCount = 0;
  const overallModeCounts = emptyEnumCounts(ALLOWED_MODE_VALUES);
  const overallLevelCounts = emptyEnumCounts(ALLOWED_LEVEL_VALUES);

  for (const session of sessions) {
    if (!REPORT_AGG_SUBJECTS.includes(session.subject)) continue;
    const durationSeconds = Math.max(0, Math.floor(safeNumber(session.duration_seconds)));
    const subjectAgg = subjects[session.subject];
    subjectAgg.sessions += 1;
    subjectAgg.durationSeconds += durationSeconds;
    totalDurationSeconds += durationSeconds;
    if (session.status === "completed" || session.ended_at) completedSessions += 1;

    const topicKey = safeString(session.topic, 120) || "general";
    if (!subjectAgg.topics[topicKey]) {
      subjectAgg.topics[topicKey] = createTopicAccumulator();
    }
    subjectAgg.topics[topicKey].durationSeconds += durationSeconds;
    const sessionMetaModeLevel = readModeLevelFromObject(session.metadata);
    const sessionModeBucket = sessionMetaModeLevel.mode;
    if (sessionModeBucket && sessionModeBucket !== "unknown") {
      const topicAggForSession = subjectAgg.topics[topicKey];
      topicAggForSession.modeCounts[sessionModeBucket] =
        (topicAggForSession.modeCounts[sessionModeBucket] || 0) + 1;
      subjectAgg.modeCounts[sessionModeBucket] =
        (subjectAgg.modeCounts[sessionModeBucket] || 0) + 1;
      overallModeCounts[sessionModeBucket] =
        (overallModeCounts[sessionModeBucket] || 0) + 1;
    }
    sessionById[session.id] = {
      subject: session.subject,
      topic: topicKey,
      mode: sessionMetaModeLevel.mode,
      level: sessionMetaModeLevel.level,
    };

    const dayKey = toDateKey(session[sessionsResult.filterField] || session.started_at || session.created_at);
    if (dayKey) {
      if (!daily[dayKey]) {
        daily[dayKey] = { date: dayKey, sessions: 0, answers: 0, correct: 0, wrong: 0, durationSeconds: 0 };
      }
      daily[dayKey].sessions += 1;
      daily[dayKey].durationSeconds += durationSeconds;
    }
  }

  let correctAnswers = 0;
  let wrongAnswers = 0;
  const recentMistakes = [];

  for (const answer of answers) {
    const payload =
      answer.answer_payload && typeof answer.answer_payload === "object" && !Array.isArray(answer.answer_payload)
        ? answer.answer_payload
        : {};
    const sessionRef = sessionById[answer.learning_session_id] || null;
    const subject = safeString(payload.subject, 40) || sessionRef?.subject || null;
    if (!subject || !REPORT_AGG_SUBJECTS.includes(subject)) continue;
    const topic = safeString(payload.topic, 120) || sessionRef?.topic || "general";
    const subjectAgg = subjects[subject];
    subjectAgg.answers += 1;

    if (!subjectAgg.topics[topic]) {
      subjectAgg.topics[topic] = createTopicAccumulator();
    }
    const topicAgg = subjectAgg.topics[topic];
    topicAgg.answers += 1;

    const hintsUsed = normalizeFiniteNonNegativeNumber(payload.hintsUsed, 1000);
    if (hintsUsed != null) {
      topicAgg.hintsSum += hintsUsed;
      topicAgg.hintsCount += 1;
      subjectAgg.hintsSum += hintsUsed;
      subjectAgg.hintsCount += 1;
      overallHintsSum += hintsUsed;
      overallHintsCount += 1;
    }

    const timeMs = normalizeFiniteNonNegativeNumber(payload.timeSpentMs, 36_000_000);
    if (timeMs != null) {
      topicAgg.timeMsSum += timeMs;
      topicAgg.timeMsCount += 1;
      subjectAgg.timeMsSum += timeMs;
      subjectAgg.timeMsCount += 1;
      overallTimeMsSum += timeMs;
      overallTimeMsCount += 1;
    }

    const clientMetaObj =
      payload.clientMeta && typeof payload.clientMeta === "object" && !Array.isArray(payload.clientMeta)
        ? payload.clientMeta
        : null;
    const payloadModeLevel = readModeLevelFromObject(payload);
    const clientModeLevel = readModeLevelFromObject(clientMetaObj);
    const payloadModeNorm =
      normalizeLearningGameMode(payload.gameMode) || normalizeLearningGameMode(payload.mode);
    const clientModeNorm =
      normalizeLearningGameMode(clientMetaObj?.gameMode) ||
      normalizeLearningGameMode(clientMetaObj?.mode);
    const resolvedMode =
      payloadModeNorm ||
      clientModeNorm ||
      (sessionRef?.mode && sessionRef.mode !== "unknown" ? sessionRef.mode : null) ||
      "unknown";
    const resolvedLevel =
      payloadModeLevel.level !== "unknown"
        ? payloadModeLevel.level
        : clientModeLevel.level !== "unknown"
        ? clientModeLevel.level
        : sessionRef?.level || "unknown";
    topicAgg.modeCounts[resolvedMode] = (topicAgg.modeCounts[resolvedMode] || 0) + 1;
    topicAgg.levelCounts[resolvedLevel] = (topicAgg.levelCounts[resolvedLevel] || 0) + 1;
    subjectAgg.modeCounts[resolvedMode] = (subjectAgg.modeCounts[resolvedMode] || 0) + 1;
    subjectAgg.levelCounts[resolvedLevel] = (subjectAgg.levelCounts[resolvedLevel] || 0) + 1;
    overallModeCounts[resolvedMode] = (overallModeCounts[resolvedMode] || 0) + 1;
    overallLevelCounts[resolvedLevel] = (overallLevelCounts[resolvedLevel] || 0) + 1;

    const isCorrect = answer.is_correct === true;
    const isSlow = timeMs != null && timeMs > REPORT_AGG_FLUENCY_THRESHOLDS.slowMs;
    const isFast = timeMs != null && timeMs < REPORT_AGG_FLUENCY_THRESHOLDS.fastMs;
    const isManyHints = hintsUsed != null && hintsUsed >= REPORT_AGG_FLUENCY_THRESHOLDS.manyHints;

    if (isCorrect) {
      correctAnswers += 1;
      subjectAgg.correct += 1;
      topicAgg.correct += 1;
      if (isSlow) {
        topicAgg.correctSlowAnswers += 1;
        subjectAgg.correctSlowAnswers += 1;
      }
      if (isManyHints) {
        topicAgg.correctManyHintsAnswers += 1;
        subjectAgg.correctManyHintsAnswers += 1;
      }
    } else {
      wrongAnswers += 1;
      subjectAgg.wrong += 1;
      topicAgg.wrong += 1;
      if (isFast) {
        topicAgg.wrongFastAnswers += 1;
        subjectAgg.wrongFastAnswers += 1;
      }

      if (recentMistakes.length < RECENT_MISTAKES_LIMIT) {
        recentMistakes.push({
          subject,
          topic,
          questionId: safeString(answer.question_id, 180),
          prompt: safeString(payload.prompt, 500),
          expectedAnswer: safeString(payload.expectedAnswer, 300),
          userAnswer: safeString(payload.userAnswer, 300),
          hintsUsed: hintsUsed != null ? Math.round(hintsUsed) : null,
          timeSpentMs: timeMs != null ? Math.round(timeMs) : null,
          mode: resolvedMode,
          level: resolvedLevel,
          answeredAt: answer[answersResult.filterField] || answer.answered_at || answer.created_at || null,
        });
      }
    }

    const dayKey = toDateKey(answer[answersResult.filterField] || answer.answered_at || answer.created_at);
    if (dayKey) {
      if (!daily[dayKey]) {
        daily[dayKey] = { date: dayKey, sessions: 0, answers: 0, correct: 0, wrong: 0, durationSeconds: 0 };
      }
      daily[dayKey].answers += 1;
      if (isCorrect) daily[dayKey].correct += 1;
      else daily[dayKey].wrong += 1;
    }
  }

  for (const subject of REPORT_AGG_SUBJECTS) {
    const s = subjects[subject];
    s.accuracy = s.answers > 0 ? Number(((s.correct / s.answers) * 100).toFixed(2)) : 0;
    s.avgHintsPerQuestion =
      s.hintsCount > 0 ? Number((s.hintsSum / s.hintsCount).toFixed(2)) : null;
    s.avgTimePerQuestionSec =
      s.timeMsCount > 0 ? Number((s.timeMsSum / s.timeMsCount / 1000).toFixed(2)) : null;
    for (const topicKey of Object.keys(s.topics)) {
      const topic = s.topics[topicKey];
      topic.accuracy = topic.answers > 0 ? Number(((topic.correct / topic.answers) * 100).toFixed(2)) : 0;
      topic.avgHintsPerQuestion =
        topic.hintsCount > 0 ? Number((topic.hintsSum / topic.hintsCount).toFixed(2)) : null;
      topic.avgTimePerQuestionSec =
        topic.timeMsCount > 0
          ? Number((topic.timeMsSum / topic.timeMsCount / 1000).toFixed(2))
          : null;
    }
  }

  const totalAnswers = correctAnswers + wrongAnswers;
  const accuracy = totalAnswers > 0 ? Number(((correctAnswers / totalAnswers) * 100).toFixed(2)) : 0;
  const dailyActivity = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));

  const overallAvgHintsPerQuestion =
    overallHintsCount > 0 ? Number((overallHintsSum / overallHintsCount).toFixed(2)) : null;
  const overallAvgTimePerQuestionSec =
    overallTimeMsCount > 0
      ? Number((overallTimeMsSum / overallTimeMsCount / 1000).toFixed(2))
      : null;

  const rawGradeLevel =
    typeof student.grade_level === "string" ? student.grade_level.trim().toLowerCase() : "";
  const normalizedGradeLevel = GRADE_LEVEL_PATTERN.test(rawGradeLevel) ? rawGradeLevel : "unknown";

  return {
    ok: true,
    student: {
      id: student.id,
      full_name: student.full_name ?? null,
      grade_level: student.grade_level ?? null,
      is_active: student.is_active === true,
    },
    range: {
      from: isoDateOnly(fromDate),
      to: isoDateOnly(toDate),
    },
    summary: {
      totalSessions: sessions.length,
      completedSessions,
      totalAnswers,
      correctAnswers,
      wrongAnswers,
      accuracy,
      totalDurationSeconds,
      avgHintsPerQuestion: overallAvgHintsPerQuestion,
      avgTimePerQuestionSec: overallAvgTimePerQuestionSec,
      modeCounts: overallModeCounts,
      levelCounts: overallLevelCounts,
      normalizedGradeLevel,
    },
    subjects,
    dailyActivity,
    recentMistakes,
    meta: {
      source: "supabase",
      version: "phase-2d-c2",
      insightsVersion: "2026.05-insights",
      fallbackUsed:
        sessionsResult.filterField !== "started_at" || answersResult.filterField !== "answered_at",
      sessionDateField: sessionsResult.filterField,
      answerDateField: answersResult.filterField,
      fluencyThresholds: { ...REPORT_AGG_FLUENCY_THRESHOLDS },
    },
  };
}
