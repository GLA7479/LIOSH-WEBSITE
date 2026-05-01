import { getLearningSupabaseServiceRoleClient } from "../../../lib/learning-supabase/server";
import {
  clearStudentSessionCookie,
  getStudentSessionCookie,
  hashStudentSecret,
} from "../../../lib/learning-supabase/student-auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = getStudentSessionCookie(req);
  if (!token) {
    return res.status(401).json({ ok: false, error: "No student session" });
  }

  try {
    const supabase = getLearningSupabaseServiceRoleClient();
    const tokenHash = hashStudentSecret(token);
    const nowIso = new Date().toISOString();

    const { data: sessionRow, error: sessErr } = await supabase
      .from("student_sessions")
      .select("id,student_id,expires_at,revoked_at,ended_at")
      .eq("session_token_hash", tokenHash)
      .is("revoked_at", null)
      .is("ended_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessErr || !sessionRow?.id) {
      clearStudentSessionCookie(res);
      return res.status(401).json({ ok: false, error: "Student session expired" });
    }

    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("id,full_name,grade_level,is_active,student_coin_balances(balance)")
      .eq("id", sessionRow.student_id)
      .maybeSingle();
    if (studentErr || !student?.id || student.is_active !== true) {
      clearStudentSessionCookie(res);
      return res.status(403).json({ ok: false, error: "התלמיד אינו פעיל" });
    }

    await supabase
      .from("student_sessions")
      .update({ last_seen_at: nowIso })
      .eq("id", sessionRow.id);

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

