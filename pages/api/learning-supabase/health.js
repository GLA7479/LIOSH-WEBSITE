import { getLearningSupabaseServerClient } from "../../../lib/learning-supabase/server";

const REQUIRED_TABLES = [
  "parent_profiles",
  "students",
  "student_access_codes",
  "student_sessions",
  "learning_sessions",
  "answers",
  "parent_reports",
  "student_coin_balances",
  "coin_transactions",
  "coin_reward_rules",
  "coin_spend_rules",
  "shop_items",
  "student_inventory",
];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const supabase = getLearningSupabaseServerClient();
    const tableChecks = [];

    for (const tableName of REQUIRED_TABLES) {
      const { error } = await supabase.from(tableName).select("*", { head: true, count: "exact" }).limit(1);
      tableChecks.push({
        table: tableName,
        ok: !error,
        errorCode: error?.code || null,
      });
    }

    const allTablesReachable = tableChecks.every(check => check.ok);

    return res.status(allTablesReachable ? 200 : 503).json({
      ok: allTablesReachable,
      service: "learning-supabase",
      projectHost: "ajxwmlwbzxwffrtlfuoe.supabase.co",
      checks: tableChecks,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      service: "learning-supabase",
      projectHost: "ajxwmlwbzxwffrtlfuoe.supabase.co",
      error: "Learning Supabase health check failed",
      checkedAt: new Date().toISOString(),
    });
  }
}
