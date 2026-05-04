/**
 * Server-only resolution of the Parent Copilot detailed-report payload for `/api/parent/copilot-turn`.
 *
 * Security contract:
 * - In production, the API must not execute Copilot against a client-supplied full report snapshot
 *   unless `PARENT_COPILOT_ALLOW_CLIENT_PAYLOAD_IN_PRODUCTION` is explicitly set to `"true"` (emergency / operators only).
 * - Development may continue to accept `body.payload` after auth (or unauthenticated local QA via existing env flags).
 *
 * Structural note: `generateDetailedParentReport` → `generateParentReportV2` currently depends on browser
 * `window` + localStorage-shaped learning telemetry. Replaying Supabase `answers` / `learning_sessions` into that
 * shape for an authoritative server snapshot is not wired here yet — when strict production mode is on and the
 * emergency override is off, `tryRebuildDetailedPayloadServerSide` returns null and the handler responds 422 until
 * hydration is implemented.
 */

/**
 * @returns {boolean}
 */
export function isStrictProductionCopilotPayloadMode() {
  const prod = process.env.NODE_ENV === "production";
  const emergency = String(process.env.PARENT_COPILOT_ALLOW_CLIENT_PAYLOAD_IN_PRODUCTION || "")
    .trim()
    .toLowerCase() === "true";
  return prod && !emergency;
}

/**
 * @param {string} raw
 * @returns {string | null}
 */
export function safeUuid(raw) {
  const s = String(raw || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)) return null;
  return s;
}

/**
 * @param {string} ymd
 * @returns {boolean}
 */
function isYmd(ymd) {
  return typeof ymd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(ymd.trim());
}

/**
 * Mirrors short-report defaults: week = last 7 calendar days from today, month = last 30 days, custom uses explicit range.
 * Dates are local-calendar via ISO date strings YYYY-MM-DD (same pattern as parent report pages).
 *
 * @param {{ reportPeriod?: string, rangeFrom?: string | null, rangeTo?: string | null }}
 * @returns {{ ok: true, period: 'week'|'month'|'custom', from: string, to: string } | { ok: false, error: string }}
 */
export function parseReportRangeFromBody(body) {
  const rp = String(body?.reportPeriod || body?.period || "week")
    .trim()
    .toLowerCase();
  const rf = body?.rangeFrom != null ? String(body.rangeFrom).trim() : "";
  const rt = body?.rangeTo != null ? String(body.rangeTo).trim() : "";

  const today = new Date();
  const isoEnd = today.toISOString().slice(0, 10);

  if (rp === "custom") {
    if (!isYmd(rf) || !isYmd(rt) || rf > rt) {
      return { ok: false, error: "Invalid custom range: rangeFrom/rangeTo must be YYYY-MM-DD and from <= to" };
    }
    return { ok: true, period: "custom", from: rf, to: rt };
  }

  if (rp === "month") {
    const end = new Date();
    const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
    return { ok: true, period: "month", from: start.toISOString().slice(0, 10), to: isoEnd };
  }

  if (rp === "week") {
    const end = new Date();
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    return { ok: true, period: "week", from: start.toISOString().slice(0, 10), to: isoEnd };
  }

  return { ok: false, error: "reportPeriod must be week, month, or custom" };
}

/**
 * Future: hydrate browser-shaped telemetry from Supabase for `studentId` + range, seed `globalThis.window` /
 * `localStorage`, call `generateDetailedParentReport`, return object. Not implemented — returns null.
 *
 * @param {{ studentId: string, range: { ok: true, period: string, from: string, to: string }, authMode: string }} _ctx
 * @returns {Promise<object | null>}
 */
export async function tryRebuildDetailedPayloadServerSide(_ctx) {
  void _ctx;
  return null;
}

/**
 * @param {{
 *   body: Record<string, unknown>;
 *   auth: { ok: boolean; mode?: string };
 * }} args
 * @returns {Promise<
 *   | { ok: true; payload: object; grounding: string }
 *   | { ok: false; status: number; error: string; code?: string }
 * >}
 */
export async function resolveCopilotTurnPayloadForApi(args) {
  const { body, auth } = args;
  const strict = isStrictProductionCopilotPayloadMode();

  if (!strict) {
    const payload = body?.payload;
    if (!payload || typeof payload !== "object") {
      return { ok: false, status: 400, error: "Missing payload" };
    }
    const g =
      auth.mode === "dev_local"
        ? "client_payload_dev_only_unverified"
        : "client_payload_authenticated_session_or_parent";
    return { ok: true, payload, grounding: g };
  }

  // Production strict: never trust client snapshot for the engine (unless emergency env — handled by strict=false branch).
  const clientPayload = body?.payload;
  if (clientPayload != null && typeof clientPayload === "object") {
    void clientPayload;
  }

  const studentId = safeUuid(body?.studentId);
  if (!studentId) {
    return {
      ok: false,
      status: 400,
      error: "studentId (UUID) is required for server-grounded Copilot in production",
      code: "STUDENT_ID_REQUIRED",
    };
  }

  const range = parseReportRangeFromBody(body);
  if (!range.ok) {
    return { ok: false, status: 400, error: range.error, code: "INVALID_REPORT_RANGE" };
  }

  const rebuilt = await tryRebuildDetailedPayloadServerSide({
    studentId,
    range,
    authMode: auth.mode || "",
  });

  if (rebuilt && typeof rebuilt === "object") {
    return { ok: true, payload: rebuilt, grounding: "server_rebuilt_learning_snapshot" };
  }

  return {
    ok: false,
    status: 422,
    error:
      "Server-side report snapshot is not available for this deployment. Copilot cannot run with client-supplied payloads in production until hydration is implemented, or operators may set PARENT_COPILOT_ALLOW_CLIENT_PAYLOAD_IN_PRODUCTION=true (not recommended).",
    code: "SERVER_SNAPSHOT_UNAVAILABLE",
  };
}
