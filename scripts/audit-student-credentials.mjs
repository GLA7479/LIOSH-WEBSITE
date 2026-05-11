/**
 * Safe credential audit (no code_hash, pin_hash, PINs, or tokens).
 *
 * Usage (from repo root, with env loaded):
 *   node scripts/audit-student-credentials.mjs
 *
 * Requires: NEXT_PUBLIC_LEARNING_SUPABASE_URL, LEARNING_SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
const key = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_LEARNING_SUPABASE_URL or LEARNING_SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("student_access_codes")
  .select("id, student_id, login_username, is_active, revoked_at, expires_at, created_at")
  .order("created_at", { ascending: false });

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

const rows = data || [];
const studentIds = [...new Set(rows.map((r) => r.student_id).filter(Boolean))];
let studentById = {};
if (studentIds.length > 0) {
  const { data: studs, error: stErr } = await supabase
    .from("students")
    .select("id, full_name, grade_level")
    .in("id", studentIds);
  if (!stErr && studs) {
    studentById = Object.fromEntries(studs.map((s) => [s.id, s]));
  }
}

console.log("student_access_codes (newest first) — safe columns only:\n");
console.table(
  rows.map((row) => {
    const s = studentById[row.student_id];
    return {
      id: row.id,
      student_id: row.student_id,
      full_name: s?.full_name ?? "",
      grade_level: s?.grade_level ?? "",
      login_username: row.login_username ?? "",
      is_active: row.is_active,
      revoked_at: row.revoked_at,
      expires_at: row.expires_at,
      created_at: row.created_at,
    };
  })
);

const active = rows.filter((r) => r.is_active === true && !r.revoked_at);

const activeByStudent = new Map();
for (const r of active) {
  const sid = r.student_id;
  if (!sid) continue;
  if (!activeByStudent.has(sid)) activeByStudent.set(sid, []);
  activeByStudent.get(sid).push(r);
}
const dupActiveSameStudent = [...activeByStudent.entries()].filter(([, list]) => list.length > 1);
if (dupActiveSameStudent.length) {
  console.warn("\nWarning: multiple ACTIVE rows for the same student_id (should be at most one):");
  for (const [sid, list] of dupActiveSameStudent) {
    const s = studentById[sid];
    console.warn(
      `  ${sid} (${s?.full_name ?? "?"}) : ${list.length} rows — ids ${list.map((x) => x.id).join(", ")}`
    );
  }
}
const byUsername = new Map();
for (const r of active) {
  const u = String(r.login_username || "").toLowerCase().trim();
  if (!u) continue;
  if (!byUsername.has(u)) byUsername.set(u, []);
  byUsername.get(u).push(r);
}
const dupUsernames = [...byUsername.entries()].filter(([, rows]) => rows.length > 1);
if (dupUsernames.length) {
  console.warn("\nWarning: multiple ACTIVE rows share the same login_username (unexpected):");
  for (const [u, rows] of dupUsernames) {
    console.warn(`  ${u}: ${rows.map((x) => x.student_id).join(", ")}`);
  }
} else {
  console.log("\nNo duplicate active login_username values in this snapshot.");
}
