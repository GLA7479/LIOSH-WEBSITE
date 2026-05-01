import {
  getLearningSupabaseServerUserClient,
  getLearningSupabaseServiceRoleClient,
} from "../../../../../lib/learning-supabase/server";
import { isMissingColumnError } from "../../../../../lib/learning-supabase/learning-activity";

const SUBJECTS = ["math", "geometry", "english", "hebrew", "science", "moledet_geography"];
const DEFAULT_RANGE_DAYS = 30;
const RECENT_MISTAKES_LIMIT = 20;

function isoDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function parseIsoDateParam(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (isoDateOnly(parsed) !== trimmed) return null;
  return parsed;
}

function buildDefaultRange() {
  const toDate = new Date();
  toDate.setUTCHours(0, 0, 0, 0);
  const fromDate = new Date(toDate);
  fromDate.setUTCDate(fromDate.getUTCDate() - (DEFAULT_RANGE_DAYS - 1));
  return {
    from: isoDateOnly(fromDate),
    to: isoDateOnly(toDate),
  };
}

function createSubjectAccumulator() {
  const out = {};
  for (const subject of SUBJECTS) {
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

function safeString(value, maxLen = 2000) {
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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Missing bearer token" });
  }

  const studentId = safeString(req.query?.studentId, 64);
  if (!studentId) {
    return res.status(400).json({ ok: false, error: "studentId is required" });
  }

  const defaultRange = buildDefaultRange();
  const fromRaw = safeString(req.query?.from, 10);
  const toRaw = safeString(req.query?.to, 10);

  const fromDate = fromRaw ? parseIsoDateParam(fromRaw) : parseIsoDateParam(defaultRange.from);
  const toDate = toRaw ? parseIsoDateParam(toRaw) : parseIsoDateParam(defaultRange.to);
  if (!fromDate || !toDate) {
    return res.status(400).json({ ok: false, error: "Invalid date params, expected YYYY-MM-DD" });
  }
  if (fromDate.getTime() > toDate.getTime()) {
    return res.status(400).json({ ok: false, error: "from must be <= to" });
  }

  const fromIso = `${isoDateOnly(fromDate)}T00:00:00.000Z`;
  const toDateExclusive = new Date(toDate);
  toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);
  const toIsoExclusive = `${isoDateOnly(toDateExclusive)}T00:00:00.000Z`;

  try {
    const parentClient = getLearningSupabaseServerUserClient(authHeader);
    const { data: userData, error: userErr } = await parentClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return res.status(401).json({ ok: false, error: "Invalid session" });
    }

    const { data: student, error: studentErr } = await parentClient
      .from("students")
      .select("id,full_name,grade_level,is_active,parent_id")
      .eq("id", studentId)
      .eq("parent_id", userData.user.id)
      .maybeSingle();

    if (studentErr) {
      return res.status(403).json({ ok: false, error: "Could not verify student ownership" });
    }
    if (!student?.id) {
      return res.status(404).json({ ok: false, error: "Student not found for this parent" });
    }

    const serviceClient = getLearningSupabaseServiceRoleClient();
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
      if (!SUBJECTS.includes(session.subject)) continue;
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
      if (!subject || !SUBJECTS.includes(subject)) continue;
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

    for (const subject of SUBJECTS) {
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

    return res.status(200).json({
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
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Unexpected server error" });
  }
}
