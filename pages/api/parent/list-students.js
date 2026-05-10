import {
  getLearningSupabaseServerUserClient,
  getLearningSupabaseServiceRoleClient,
} from "../../../lib/learning-supabase/server";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Missing bearer token" });
  }

  try {
    const supabase = getLearningSupabaseServerUserClient(authHeader);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return res.status(401).json({ ok: false, error: "Invalid session" });
    }

    const { data, error } = await supabase
      .from("students")
      .select("id,full_name,grade_level,is_active,created_at,student_coin_balances(balance,lifetime_earned,lifetime_spent)")
      .eq("parent_id", userData.user.id)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(403).json({ ok: false, error: "Could not list students" });
    }

    const students = data || [];
    const ids = students.map((s) => s.id).filter(Boolean);
    const loginByStudentId = Object.create(null);
    const activeStudentIds = new Set();

    if (ids.length > 0) {
      // Service role + narrow projection only (never code_hash/pin_hash). IDs are limited to
      // students already verified as owned by this parent via the query above.
      const serviceClient = getLearningSupabaseServiceRoleClient();
      const { data: activeCodes, error: codesErr } = await serviceClient
        .from("student_access_codes")
        .select("student_id,login_username,is_active,revoked_at")
        .in("student_id", ids)
        .eq("is_active", true)
        .is("revoked_at", null);

      if (codesErr) {
        return res.status(403).json({ ok: false, error: "Could not load student credentials" });
      }

      for (const row of activeCodes || []) {
        const sid = row.student_id;
        if (!sid) continue;
        activeStudentIds.add(sid);
        const u =
          typeof row.login_username === "string" && row.login_username.trim()
            ? row.login_username.trim()
            : null;
        const prev = loginByStudentId[sid];
        if (prev === undefined) {
          loginByStudentId[sid] = u;
        } else if (!prev && u) {
          loginByStudentId[sid] = u;
        }
      }
    }

    const enriched = students.map((s) => {
      const login_username = loginByStudentId[s.id] ?? null;
      return {
        ...s,
        login_username,
        has_active_access_code: activeStudentIds.has(s.id),
      };
    });

    return res.status(200).json({ ok: true, students: enriched });
  } catch (_e) {
    return res.status(500).json({ ok: false, error: "Unexpected server error" });
  }
}
