import { getLearningSupabaseServiceRoleClient } from "../../../lib/learning-supabase/server";
import {
  clearStudentSessionCookie,
  getAuthenticatedStudentSession,
} from "../../../lib/learning-supabase/student-auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const auth = await getAuthenticatedStudentSession(req);
    if (!auth) {
      clearStudentSessionCookie(res);
      return res.status(401).json({ ok: false, error: "Student session expired" });
    }

    const supabase = getLearningSupabaseServiceRoleClient();
    const nowIso = new Date().toISOString();

    await supabase
      .from("student_sessions")
      .update({ last_seen_at: nowIso })
      .eq("id", auth.studentSessionId);

    const student = auth.student;
    const rel = student.student_coin_balances;
    const balance =
      Array.isArray(rel) ? rel[0]?.balance ?? 0 : rel?.balance ?? 0;

    return res.status(200).json({
      ok: true,
      student: {
        id: student.id,
        full_name: student.full_name,
        grade_level: student.grade_level,
        is_active: student.is_active,
        coin_balance: balance,
      },
    });
  } catch (_e) {
    clearStudentSessionCookie(res);
    return res.status(500).json({ ok: false, error: "שגיאת שרת" });
  }
}

