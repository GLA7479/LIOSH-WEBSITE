/**
 * Server-side Parent Copilot turn — `runParentCopilotTurnAsync` only on the server (LLM keys stay server-side).
 *
 * Grounding / auth (Phase D.1):
 * - The Copilot engine still needs a **detailed-report payload** shape (`generateDetailedParentReport` output).
 *   There is no server-side builder that reproduces that object from DB alone without duplicating the full
 *   client pipeline — so the **snapshot is supplied by the client** on each turn.
 * - **Authorization** proves who is asking:
 *   (1) **Student session cookie** (`getAuthenticatedStudentSession`): `studentId` in JSON must match the
 *       logged-in student — grounds turns to that learner’s session on the learning site.
 *   (2) **Parent Bearer JWT** (same pattern as `pages/api/parent/students/[studentId]/report-data.js`):
 *       student must belong to the authenticated parent.
 *   (3) **Development only**: if `NODE_ENV !== 'production'` and `PARENT_COPILOT_ALLOW_UNAUTH_LOCAL_PAYLOAD`
 *       is not `"false"`, allow payload-only turns for localStorage/local QA (no ownership proof).
 *       This path is **disabled in production**.
 *
 * Never mutates stored reports, banks, taxonomies, diagnostics, or planner output.
 */

import { runParentCopilotTurnAsync } from "../../../utils/parent-copilot/index.js";
import { getLearningSupabaseServerUserClient } from "../../../lib/learning-supabase/server";
import { getAuthenticatedStudentSession } from "../../../lib/learning-supabase/student-auth";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

function safeStudentId(raw) {
  const s = String(raw || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) return null;
  return s;
}

/**
 * @returns {Promise<{ ok: boolean; mode?: string; error?: string; status?: number }>}
 */
async function authorizeRequest(req, res, studentIdFromBody) {
  const isProd = process.env.NODE_ENV === "production";
  const allowUnauthDevPayload =
    !isProd && process.env.PARENT_COPILOT_ALLOW_UNAUTH_LOCAL_PAYLOAD !== "false";

  const studentId = safeStudentId(studentIdFromBody);

  const studentAuth = await getAuthenticatedStudentSession(req);
  if (studentAuth?.student?.id) {
    if (!studentId || studentId !== studentAuth.student.id) {
      return { ok: false, error: "studentId must match the authenticated student session", status: 403 };
    }
    res.setHeader("X-LIOSH-Parent-Copilot-Auth", "student_session");
    res.setHeader("X-LIOSH-Parent-Copilot-Grounding", "client_payload_session_verified");
    return { ok: true, mode: "student_session" };
  }

  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    if (!studentId) {
      return { ok: false, error: "studentId is required when using parent authorization", status: 400 };
    }
    try {
      const parentClient = getLearningSupabaseServerUserClient(authHeader);
      const { data: userData, error: userErr } = await parentClient.auth.getUser();
      if (userErr || !userData?.user?.id) {
        return { ok: false, error: "Invalid session", status: 401 };
      }
      const { data: row, error: rowErr } = await parentClient
        .from("students")
        .select("id")
        .eq("id", studentId)
        .eq("parent_id", userData.user.id)
        .maybeSingle();
      if (rowErr) {
        return { ok: false, error: "Could not verify student ownership", status: 403 };
      }
      if (!row?.id) {
        return { ok: false, error: "Student not found for this parent", status: 404 };
      }
      res.setHeader("X-LIOSH-Parent-Copilot-Auth", "parent_bearer");
      res.setHeader("X-LIOSH-Parent-Copilot-Grounding", "client_payload_parent_owned_student_verified");
      return { ok: true, mode: "parent_bearer" };
    } catch {
      return { ok: false, error: "Authorization failed", status: 401 };
    }
  }

  if (allowUnauthDevPayload) {
    res.setHeader("X-LIOSH-Parent-Copilot-Auth", "dev_local_unverified");
    res.setHeader("X-LIOSH-Parent-Copilot-Grounding", "client_payload_dev_only_unverified");
    return { ok: true, mode: "dev_local" };
  }

  return {
    ok: false,
    error:
      "Unauthorized: sign in as a student on this site, use a parent Bearer token with studentId, or enable local dev payload (see API comment)",
    status: 401,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const utterance = String(body.utterance || "").trim();
    const sessionId = String(body.sessionId || "").trim() || "default";
    const audience = String(body.audience || "parent").trim() || "parent";
    const payload = body.payload;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ ok: false, error: "Missing payload" });
    }
    if (!utterance) {
      return res.status(400).json({ ok: false, error: "Missing utterance" });
    }

    const auth = await authorizeRequest(req, res, body.studentId);
    if (!auth.ok) {
      return res.status(auth.status || 401).json({ ok: false, error: auth.error || "Unauthorized" });
    }

    const selectedContextRef = body.selectedContextRef ?? null;
    const clickedFollowupFamily = body.clickedFollowupFamily ?? null;

    const result = await runParentCopilotTurnAsync({
      audience,
      payload,
      utterance,
      sessionId,
      selectedContextRef,
      clickedFollowupFamily,
    });

    return res.status(200).json({ ok: true, result, authMode: auth.mode });
  } catch (e) {
    const msg = String(e?.message || e || "copilot_turn_failed");
    return res.status(500).json({ ok: false, error: msg });
  }
}
