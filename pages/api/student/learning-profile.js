import { getLearningSupabaseServiceRoleClient } from "../../../lib/learning-supabase/server";
import {
  clearStudentSessionCookie,
  getAuthenticatedStudentSession,
} from "../../../lib/learning-supabase/student-auth";
import {
  assertPatchSizeOk,
  computeStudentLearningDerived,
  deepMergeLearningState,
  ensureStudentLearningStateRow,
  extractLearningProfilePatch,
  LEARNING_PROFILE_SUBJECT_KEYS,
  normalizeLearningProfileRow,
  sanitizeProfileForStorage,
} from "../../../lib/learning-supabase/student-learning-profile.server";

function buildSubjectsResponse(normalized) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const key of LEARNING_PROFILE_SUBJECT_KEYS) {
    const v = normalized.subjects[key];
    out[key] = v && typeof v === "object" && !Array.isArray(v) ? v : {};
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Vary", "Cookie");

  try {
    const auth = await getAuthenticatedStudentSession(req);
    if (!auth) {
      clearStudentSessionCookie(res);
      return res.status(401).json({ ok: false, error: "Student session expired" });
    }

    const studentId = auth.studentId;
    const supabase = getLearningSupabaseServiceRoleClient();

    if (req.method === "GET") {
      const row = await ensureStudentLearningStateRow(supabase, studentId);
      const normalized = normalizeLearningProfileRow(row);
      const derived = await computeStudentLearningDerived(supabase, studentId);
      return res.status(200).json({
        ok: true,
        studentId,
        row: {
          subjects: buildSubjectsResponse(normalized),
          monthly: normalized.monthly,
          challenges: normalized.challenges,
          streaks: normalized.streaks,
          achievements: normalized.achievements,
          profile: normalized.profile,
          updated_at: row.updated_at,
        },
        derived,
      });
    }

    if (req.method === "PATCH" || req.method === "POST") {
      const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
      assertPatchSizeOk(raw);
      const body = typeof req.body === "object" && req.body != null ? req.body : {};
      if (body.studentId != null || body.student_id != null) {
        delete body.studentId;
        delete body.student_id;
      }

      const row = await ensureStudentLearningStateRow(supabase, studentId);
      const current = normalizeLearningProfileRow(row);
      const patch = extractLearningProfilePatch(body);

      const next = {
        subjects: deepMergeLearningState(current.subjects, patch.subjects ?? {}),
        monthly: deepMergeLearningState(current.monthly, patch.monthly ?? {}),
        challenges: deepMergeLearningState(current.challenges, patch.challenges ?? {}),
        streaks: deepMergeLearningState(current.streaks, patch.streaks ?? {}),
        achievements: deepMergeLearningState(current.achievements, patch.achievements ?? {}),
        profile: deepMergeLearningState(
          current.profile,
          sanitizeProfileForStorage(patch.profile ?? {})
        ),
      };

      const { error: upErr } = await supabase
        .from("student_learning_state")
        .update({
          subjects: next.subjects,
          monthly: next.monthly,
          challenges: next.challenges,
          streaks: next.streaks,
          achievements: next.achievements,
          profile: next.profile,
        })
        .eq("student_id", studentId);
      if (upErr) {
        return res.status(500).json({ ok: false, error: "Failed to update learning profile" });
      }

      const fresh = await ensureStudentLearningStateRow(supabase, studentId);
      const normalized = normalizeLearningProfileRow(fresh);
      const derived = await computeStudentLearningDerived(supabase, studentId);
      return res.status(200).json({
        ok: true,
        studentId,
        row: {
          subjects: buildSubjectsResponse(normalized),
          monthly: normalized.monthly,
          challenges: normalized.challenges,
          streaks: normalized.streaks,
          achievements: normalized.achievements,
          profile: normalized.profile,
          updated_at: fresh.updated_at,
        },
        derived,
      });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "PAYLOAD_TOO_LARGE") {
      return res.status(413).json({ ok: false, error: "Payload too large" });
    }
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
