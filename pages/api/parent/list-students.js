import { getLearningSupabaseServerUserClient } from "../../../lib/learning-supabase/server";

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

    return res.status(200).json({ ok: true, students: data || [] });
  } catch (_e) {
    return res.status(500).json({ ok: false, error: "Unexpected server error" });
  }
}
