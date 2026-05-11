/**
 * Dev-only: for each student_id, revoke duplicate active credential rows,
 * keeping only the newest by created_at.
 *
 * Safe columns only in logs. Uses LEARNING_SUPABASE_SERVICE_ROLE_KEY.
 *
 *   node --env-file=.env.local scripts/dedupe-active-student-credentials.mjs
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

const { data: rows, error } = await supabase
  .from("student_access_codes")
  .select("id, student_id, created_at, is_active, revoked_at")
  .eq("is_active", true)
  .is("revoked_at", null)
  .order("created_at", { ascending: false });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const byStudent = new Map();
for (const r of rows || []) {
  const sid = r.student_id;
  if (!sid) continue;
  if (!byStudent.has(sid)) byStudent.set(sid, []);
  byStudent.get(sid).push(r);
}

const nowIso = new Date().toISOString();
let revokedCount = 0;

for (const [studentId, list] of byStudent) {
  if (list.length <= 1) continue;
  const [keep, ...drop] = list;
  console.info(`student ${studentId}: keeping ${keep.id}, revoking ${drop.length} duplicate(s)`);
  for (const row of drop) {
    const { error: upErr } = await supabase
      .from("student_access_codes")
      .update({
        is_active: false,
        revoked_at: nowIso,
      })
      .eq("id", row.id);
    if (upErr) {
      console.error(`Failed to revoke ${row.id}:`, upErr.message);
      process.exit(1);
    }
    revokedCount += 1;
  }
}

console.info(`Done. Revoked ${revokedCount} duplicate row(s).`);
