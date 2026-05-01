import { requireArcadeStudent } from "../../../lib/arcade/server/arcade-auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireArcadeStudent(req, res);
  if (!auth) return;

  try {
    const { data: row, error } = await auth.supabase
      .from("student_coin_balances")
      .select("balance,lifetime_earned,lifetime_spent")
      .eq("student_id", auth.studentId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ ok: false, error: "לא ניתן לטעון יתרה", code: "db_error" });
    }

    const balance = row?.balance ?? 0;

    return res.status(200).json({
      ok: true,
      balance,
      lifetimeEarned: row?.lifetime_earned ?? 0,
      lifetimeSpent: row?.lifetime_spent ?? 0,
    });
  } catch (_e) {
    return res.status(500).json({ ok: false, error: "שגיאת שרת" });
  }
}
