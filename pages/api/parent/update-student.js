import { getLearningSupabaseServerUserClient } from "../../../lib/learning-supabase/server";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Missing bearer token" });
  }

  const studentId = String(req.body?.studentId || "").trim();
  const fullName = String(req.body?.fullName || "").trim();
  const gradeLevel = String(req.body?.gradeLevel || "").trim();
  const isActiveRaw = req.body?.isActive;

  if (!studentId) {
    return res.status(400).json({ ok: false, error: "studentId is required" });
  }

  const patch = {};
  if (fullName) patch.full_name = fullName;
  if (gradeLevel) patch.grade_level = gradeLevel;
  if (typeof isActiveRaw === "boolean") patch.is_active = isActiveRaw;

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ ok: false, error: "No fields to update" });
  }

  try {
    const supabase = getLearningSupabaseServerUserClient(authHeader);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return res.status(401).json({ ok: false, error: "Invalid session" });
    }

    const { data, error } = await supabase
      .from("students")
      .update(patch)
      .eq("id", studentId)
      .eq("parent_id", userData.user.id)
      .select("id,full_name,grade_level,is_active,created_at")
      .single();

    if (error) {
      return res.status(403).json({ ok: false, error: "Could not update student" });
    }

    return res.status(200).json({ ok: true, student: data });
  } catch (_e) {
    return res.status(500).json({ ok: false, error: "Unexpected server error" });
  }
}
