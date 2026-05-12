#!/usr/bin/env node
/**
 * Compare student_learning_state account fields with parent report-data accountSnapshot.
 * Usage: node scripts/verify-student-account-sync.mjs <studentId> [subjectKey]
 * Env: NEXT_PUBLIC_LEARNING_SUPABASE_URL + LEARNING_SUPABASE_SERVICE_ROLE_KEY (from .env.local)
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnvLocal() {
  const p = join(ROOT, ".env.local");
  if (!existsSync(p)) return {};
  const raw = readFileSync(p, "utf8");
  const out = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

async function loadModules() {
  const snapUrl = pathToFileURL(join(ROOT, "lib/learning-shared/student-account-state-view.js")).href;
  const profUrl = pathToFileURL(join(ROOT, "lib/learning-supabase/student-learning-profile.server.js")).href;
  const [snapMod, profMod] = await Promise.all([import(snapUrl), import(profUrl)]);
  return { snapMod, profMod };
}

async function main() {
  const studentId = String(process.argv[2] || "").trim();
  const subject = String(process.argv[3] || "math").trim().toLowerCase();
  if (!studentId) {
    console.error("Usage: node scripts/verify-student-account-sync.mjs <studentId> [subject]");
    process.exit(2);
  }

  const env = { ...process.env, ...loadEnvLocal() };
  const url = env.NEXT_PUBLIC_LEARNING_SUPABASE_URL || env.LEARNING_SUPABASE_URL;
  const key = env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_LEARNING_SUPABASE_URL or LEARNING_SUPABASE_SERVICE_ROLE_KEY in env / .env.local");
    process.exit(2);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { snapMod, profMod } = await loadModules();
  const { mapSubjectAccountView, buildAccountSnapshotForParentReport } = snapMod;
  const { computeStudentLearningDerived, normalizeLearningProfileRow } = profMod;

  const { data: student, error: stErr } = await supabase
    .from("students")
    .select("id,full_name,grade_level")
    .eq("id", studentId)
    .maybeSingle();
  if (stErr || !student?.id) {
    console.error("Student not found:", stErr?.message || studentId);
    process.exit(1);
  }

  const { data: sls, error: slsErr } = await supabase
    .from("student_learning_state")
    .select("subjects,challenges,monthly")
    .eq("student_id", studentId)
    .maybeSingle();
  if (slsErr) {
    console.error(slsErr.message);
    process.exit(1);
  }

  const derived = await computeStudentLearningDerived(supabase, studentId);
  const name = String(student.full_name || "").trim() || "Student";
  const rowNorm = normalizeLearningProfileRow(sls || {});
  const perSubject = mapSubjectAccountView(sls, subject, name, derived);
  const snap = buildAccountSnapshotForParentReport(sls, derived, name);
  const hasRow = !!(sls && Object.keys(sls).length);

  const reportAccuracy = derived?.bySubject?.[subject]?.accuracy ?? null;

  const rows = [
    ["Field", "student_learning_state (mapper)", "parent snapshot (summary/bySubject)", "notes"],
    [
      "playerLevel (subject)",
      String(perSubject.playerLevel),
      String(snap.bySubject[subject]?.playerLevel ?? ""),
      "account / gamification",
    ],
    ["stars (subject)", String(perSubject.stars), String(snap.bySubject[subject]?.stars ?? ""), "account"],
    ["bestScore (subject)", String(perSubject.bestScore), String(snap.bySubject[subject]?.bestScore ?? ""), "account"],
    ["bestStreak (subject)", String(perSubject.bestStreak), String(snap.bySubject[subject]?.bestStreak ?? ""), "account"],
    ["accountAccuracyPct", String(perSubject.accountAccuracyPct ?? ""), String(snap.bySubject[subject]?.accountAccuracyPct ?? ""), "analytics-derived (all-time)"],
    ["report period accuracy", "N/A in this script", String(reportAccuracy ?? ""), "from answers aggregate"],
    ["summaryPlayerLevel (max)", String(snap.summaryPlayerLevel), "", "parent header Lv.*"],
    ["summaryStars (sum)", String(snap.summaryStars), "", "parent header stars"],
    ["has DB row", hasRow ? "yes" : "no", "", ""],
  ];

  const colW = [28, 28, 28, 36];
  for (const r of rows) {
    console.log(
      r.map((c, i) => String(c).padEnd(colW[i] || 20)).join(" | ")
    );
  }

  let failed = false;
  if (Number(perSubject.playerLevel) !== Number(snap.bySubject[subject]?.playerLevel)) {
    console.error("FAIL: subject playerLevel mismatch between mapper paths");
    failed = true;
  }
  if (Number(perSubject.stars) !== Number(snap.bySubject[subject]?.stars)) {
    console.error("FAIL: subject stars mismatch");
    failed = true;
  }
  if (
    hasRow &&
    (Number(rowNorm.subjects?.[subject]?.progressStore?.playerLevel) > 1 ||
      Number(rowNorm.subjects?.[subject]?.progressStore?.stars) > 0) &&
    Number(snap.summaryPlayerLevel) <= 1 &&
    Number(snap.summaryStars) === 0
  ) {
    console.error("FAIL: profile has real level/stars but snapshot summary stayed at Lv.1 / 0 — check mapper");
    failed = true;
  }

  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
