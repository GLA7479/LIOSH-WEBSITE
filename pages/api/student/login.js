import { getLearningSupabaseServiceRoleClient } from "../../../lib/learning-supabase/server";
import {
  clearStudentSessionCookie,
  generateStudentSessionToken,
  hashStudentSecret,
  normalizeStudentCode,
  normalizeStudentUsername,
  normalizeStudentPin,
  sessionExpiryIsoFromNow,
  setStudentSessionCookie,
} from "../../../lib/learning-supabase/student-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const username = normalizeStudentUsername(req.body?.username);
  const codeFallback = normalizeStudentCode(req.body?.code);
  const pin = normalizeStudentPin(req.body?.pin);
  const credential = username || codeFallback;
  if (!credential || pin.length !== 4) {
    return res.status(400).json({ ok: false, error: "שם משתמש או PIN לא תקינים" });
  }

  try {
    const supabase = getLearningSupabaseServiceRoleClient();
    const nowIso = new Date().toISOString();
    const codeHash = hashStudentSecret(credential);
    const pinHash = hashStudentSecret(pin);

    const { data: accessCode, error: codeErr } = await supabase
      .from("student_access_codes")
      .select("id,student_id,is_active,revoked_at,expires_at")
      .eq("code_hash", codeHash)
      .eq("pin_hash", pinHash)
      .eq("is_active", true)
      .is("revoked_at", null)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (codeErr || !accessCode?.id) {
      clearStudentSessionCookie(res);
      return res.status(401).json({ ok: false, error: "שם משתמש או PIN שגויים" });
    }

    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("id,full_name,grade_level,is_active")
      .eq("id", accessCode.student_id)
      .maybeSingle();
    if (studentErr || !student?.id || student.is_active !== true) {
      clearStudentSessionCookie(res);
      return res.status(403).json({ ok: false, error: "התלמיד אינו פעיל" });
    }

    const token = generateStudentSessionToken();
    const tokenHash = hashStudentSecret(token);
    const expiresAt = sessionExpiryIsoFromNow();

    const { error: sessErr } = await supabase.from("student_sessions").insert({
      student_id: accessCode.student_id,
      access_code_id: accessCode.id,
      session_token_hash: tokenHash,
      started_at: nowIso,
      last_seen_at: nowIso,
      expires_at: expiresAt,
      ended_at: null,
      revoked_at: null,
      client_meta: {},
    });
    if (sessErr) {
      clearStudentSessionCookie(res);
      return res.status(500).json({ ok: false, error: "יצירת סשן תלמיד נכשלה" });
    }

    setStudentSessionCookie(res, token);
    return res.status(200).json({ ok: true, student });
  } catch (_e) {
    clearStudentSessionCookie(res);
    return res.status(500).json({ ok: false, error: "שגיאת שרת" });
  }
}

