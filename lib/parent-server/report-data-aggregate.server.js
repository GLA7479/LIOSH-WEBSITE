/**
 * Shared server-only aggregation for parent learning report data (Supabase sessions + answers).
 * Extracted from `pages/api/parent/students/[studentId]/report-data.js` — same outputs, no behavior change.
 */

import { isMissingColumnError } from "../learning-supabase/learning-activity.js";

export const REPORT_AGG_SUBJECTS = ["math", "geometry", "english", "hebrew", "science", "moledet_geography"];

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
      subjectAgg.topics[topicKey] = {
        answers: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        durationSeconds: 0,
      };
    }
    subjectAgg.topics[topicKey].durationSeconds += durationSeconds;
    sessionById[session.id] = {
      subject: session.subject,
      topic: topicKey,
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
      subjectAgg.topics[topic] = {
        answers: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        durationSeconds: 0,
      };
    }
    subjectAgg.topics[topic].answers += 1;

    const isCorrect = answer.is_correct === true;
    if (isCorrect) {
      correctAnswers += 1;
      subjectAgg.correct += 1;
      subjectAgg.topics[topic].correct += 1;
    } else {
      wrongAnswers += 1;
      subjectAgg.wrong += 1;
      subjectAgg.topics[topic].wrong += 1;

      if (recentMistakes.length < RECENT_MISTAKES_LIMIT) {
        recentMistakes.push({
          subject,
          topic,
          questionId: safeString(answer.question_id, 180),
          prompt: safeString(payload.prompt, 500),
          expectedAnswer: safeString(payload.expectedAnswer, 300),
          userAnswer: safeString(payload.userAnswer, 300),
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
    for (const topicKey of Object.keys(s.topics)) {
      const topic = s.topics[topicKey];
      topic.accuracy = topic.answers > 0 ? Number(((topic.correct / topic.answers) * 100).toFixed(2)) : 0;
    }
  }

  const totalAnswers = correctAnswers + wrongAnswers;
  const accuracy = totalAnswers > 0 ? Number(((correctAnswers / totalAnswers) * 100).toFixed(2)) : 0;
  const dailyActivity = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));

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
    },
    subjects,
    dailyActivity,
    recentMistakes,
    meta: {
      source: "supabase",
      version: "phase-2d-c2",
      fallbackUsed:
        sessionsResult.filterField !== "started_at" || answersResult.filterField !== "answered_at",
      sessionDateField: sessionsResult.filterField,
      answerDateField: answersResult.filterField,
    },
  };
}
