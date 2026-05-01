import { getLearningSupabaseServiceRoleClient } from "../../../lib/learning-supabase/server";
import {
  clearStudentSessionCookie,
  getAuthenticatedStudentSession,
} from "../../../lib/learning-supabase/student-auth";
import {
  isMissingColumnError,
  normalizeClientMeta,
  normalizeOptionalInteger,
  normalizeOptionalString,
  normalizeSubject,
  readJsonBody,
} from "../../../lib/learning-supabase/learning-activity";

async function verifyLearningSessionOwnership(supabase, learningSessionId, studentId) {
  const { data, error } = await supabase
    .from("learning_sessions")
    .select("id,student_id")
    .eq("id", learningSessionId)
    .maybeSingle();
  if (error || !data?.id) return { ok: false, reason: "not_found" };
  if (data.student_id !== studentId) return { ok: false, reason: "forbidden" };
  return { ok: true };
}

async function insertAnswerRow(supabase, row) {
  const firstTry = await supabase
    .from("answers")
    .insert(row)
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!firstTry.error) return firstTry;
  if (!isMissingColumnError(firstTry.error)) return firstTry;

  const fallback = {
    student_id: row.student_id,
    learning_session_id: row.learning_session_id,
    question_id: row.question_id,
    answer_payload: row.answer_payload,
    is_correct: row.is_correct,
  };
  return supabase
    .from("answers")
    .insert(fallback)
    .select("id")
    .limit(1)
    .maybeSingle();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const auth = await getAuthenticatedStudentSession(req);
    if (!auth) {
      clearStudentSessionCookie(res);
      return res.status(401).json({ ok: false, error: "Not authenticated" });
    }

    const body = readJsonBody(req);
    if (typeof body.isCorrect !== "boolean") {
      return res.status(400).json({ ok: false, error: "isCorrect must be boolean" });
    }

    const learningSessionId = normalizeOptionalString(body.learningSessionId, 64);
    if (!learningSessionId) {
      return res.status(400).json({ ok: false, error: "learningSessionId is required" });
    }

    const questionId =
      normalizeOptionalString(body.questionId, 180) ||
      normalizeOptionalString(body.questionFingerprint, 180);
    if (!questionId) {
      return res.status(400).json({ ok: false, error: "questionId or questionFingerprint is required" });
    }

    const subject = normalizeSubject(body.subject);
    if (!subject) {
      return res.status(400).json({ ok: false, error: "Invalid subject" });
    }

    const supabase = getLearningSupabaseServiceRoleClient();
    const ownership = await verifyLearningSessionOwnership(
      supabase,
      learningSessionId,
      auth.studentId
    );
    if (!ownership.ok) {
      if (ownership.reason === "forbidden") {
        return res.status(403).json({ ok: false, error: "Session does not belong to student" });
      }
      return res.status(404).json({ ok: false, error: "Learning session not found" });
    }

    const answerPayload = {
      subject,
      topic: normalizeOptionalString(body.topic, 120),
      questionFingerprint: normalizeOptionalString(body.questionFingerprint, 300),
      prompt: normalizeOptionalString(body.prompt, 5000),
      expectedAnswer: normalizeOptionalString(body.expectedAnswer, 1000),
      userAnswer: normalizeOptionalString(body.userAnswer, 1000),
      hintsUsed: normalizeOptionalInteger(body.hintsUsed, 0, 1000) ?? 0,
      timeSpentMs: normalizeOptionalInteger(body.timeSpentMs, 0, 36000000),
      clientMeta: normalizeClientMeta(body.clientMeta),
    };

    const { data, error } = await insertAnswerRow(supabase, {
      student_id: auth.studentId,
      learning_session_id: learningSessionId,
      question_id: questionId,
      answer_payload: answerPayload,
      is_correct: body.isCorrect,
      answered_at: new Date().toISOString(),
    });
    if (error || !data?.id) {
      return res.status(500).json({ ok: false, error: "Failed to record answer" });
    }

    return res.status(200).json({
      ok: true,
      answerId: data.id,
    });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
