import { getLearningSupabaseServiceRoleClient } from "../../../../lib/learning-supabase/server";
import {
  clearStudentSessionCookie,
  getAuthenticatedStudentSession,
} from "../../../../lib/learning-supabase/student-auth";
import {
  isMissingColumnError,
  mergeJsonObjects,
  normalizeClientMeta,
  normalizeOptionalInteger,
  normalizeOptionalNumber,
  normalizeOptionalString,
  readJsonBody,
} from "../../../../lib/learning-supabase/learning-activity";

async function loadLearningSession(supabase, learningSessionId) {
  const { data, error } = await supabase
    .from("learning_sessions")
    .select("id,student_id,metadata")
    .eq("id", learningSessionId)
    .maybeSingle();
  if (error || !data?.id) return null;
  return data;
}

async function updateLearningSessionWithFallback(supabase, learningSessionId, fullPatch, fallbackPatch) {
  const firstTry = await supabase
    .from("learning_sessions")
    .update(fullPatch)
    .eq("id", learningSessionId);
  if (!firstTry.error) return firstTry;
  if (!isMissingColumnError(firstTry.error)) return firstTry;
  return supabase
    .from("learning_sessions")
    .update(fallbackPatch)
    .eq("id", learningSessionId);
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
    const learningSessionId = normalizeOptionalString(body.learningSessionId, 64);
    if (!learningSessionId) {
      return res.status(400).json({ ok: false, error: "learningSessionId is required" });
    }

    const supabase = getLearningSupabaseServiceRoleClient();
    const sessionRow = await loadLearningSession(supabase, learningSessionId);
    if (!sessionRow) {
      return res.status(404).json({ ok: false, error: "Learning session not found" });
    }
    if (sessionRow.student_id !== auth.studentId) {
      return res.status(403).json({ ok: false, error: "Session does not belong to student" });
    }

    const summary = {
      totalQuestions: normalizeOptionalInteger(body.totalQuestions, 0, 1000000),
      correctAnswers: normalizeOptionalInteger(body.correctAnswers, 0, 1000000),
      wrongAnswers: normalizeOptionalInteger(body.wrongAnswers, 0, 1000000),
      score: normalizeOptionalNumber(body.score, 0, 1000000000),
      accuracy: normalizeOptionalNumber(body.accuracy, 0, 100),
      clientMeta: normalizeClientMeta(body.clientMeta),
    };

    const metadata = mergeJsonObjects(
      sessionRow.metadata && typeof sessionRow.metadata === "object" ? sessionRow.metadata : {},
      { summary }
    );

    const patch = {
      ended_at: new Date().toISOString(),
      duration_seconds: normalizeOptionalInteger(body.durationSeconds, 0, 8640000) ?? 0,
      status: "completed",
      metadata,
    };
    const fallbackPatch = {
      ended_at: patch.ended_at,
      duration_seconds: patch.duration_seconds,
    };

    const { error } = await updateLearningSessionWithFallback(
      supabase,
      learningSessionId,
      patch,
      fallbackPatch
    );
    if (error) {
      return res.status(500).json({ ok: false, error: "Failed to finish learning session" });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
