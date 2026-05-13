/**
 * Server-only resolution of the Parent Copilot detailed-report payload for `/api/parent/copilot-turn`.
 *
 * Security contract:
 * - In production, the API must not execute Copilot against a client-supplied full report snapshot
 *   unless `PARENT_COPILOT_ALLOW_CLIENT_PAYLOAD_IN_PRODUCTION` is explicitly set to `"true"` (emergency / operators only).
 * - Development may continue to accept `body.payload` after auth (or unauthenticated local QA via existing env flags).
 *
 * Strict production rebuild path:
 * - Load sessions/answers via shared aggregation (`aggregateParentReportPayload`, same data as GET report-data).
 * - Adapt with `buildReportInputFromDbData`, seed a minimal browser-shaped localStorage, then call existing
 *   `generateParentReportV2` → `buildDetailedParentReportFromBaseReport` (see `db-input-to-detailed-report.server.js`).
 *
 * **Copilot grounding:** the resolved `payload` may still contain full `diagnosticEngineV2` for non-LLM consumers;
 * `runParentCopilotTurn` / `runParentCopilotTurnAsync` apply `redactPayloadForCopilotGrounding` from
 * `utils/parent-copilot/redact-payload-for-copilot-grounding.js` before truth-packet assembly and LLM grounding
 * so raw diagnostic engine strings never reach Copilot prompts.
 */

import { getLearningSupabaseServiceRoleClient } from "../learning-supabase/server.js";
import {
  aggregateParentReportPayload,
  parseIsoDateParam,
} from "../parent-server/report-data-aggregate.server.js";
import { buildDetailedPayloadFromAggregatedReportBody } from "../parent-server/db-input-to-detailed-report.server.js";
import { attachStudentLearningAccountToParentReportPayload } from "../parent-server/parent-report-account-attachment.server.js";

/**
 * @returns {boolean}
 */
export function isStrictProductionCopilotPayloadMode() {
  const prod = process.env.NODE_ENV === "production";
  const emergency =
    String(process.env.PARENT_COPILOT_ALLOW_CLIENT_PAYLOAD_IN_PRODUCTION || "")
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
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s))
    return null;
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
 * @param {{
 *   studentId: string,
 *   range: { ok: true, period: string, from: string, to: string },
 *   authMode?: string
 * }} ctx
 * @returns {Promise<object | null>}
 */
export async function tryRebuildDetailedPayloadServerSide(ctx) {
  const { studentId, range } = ctx;
  if (!studentId || !range?.ok) return null;

  let serviceClient;
  try {
    serviceClient = getLearningSupabaseServiceRoleClient();
  } catch {
    return null;
  }

  const fromDate = parseIsoDateParam(range.from);
  const toDate = parseIsoDateParam(range.to);
  if (!fromDate || !toDate || fromDate.getTime() > toDate.getTime()) return null;

  const { data: student, error: studentErr } = await serviceClient
    .from("students")
    .select("id,full_name,grade_level,is_active")
    .eq("id", studentId)
    .maybeSingle();

  if (studentErr || !student?.id) return null;

  try {
    const reportBody = await aggregateParentReportPayload(serviceClient, student, fromDate, toDate);
    const reportWithAccount = await attachStudentLearningAccountToParentReportPayload(
      serviceClient,
      student,
      reportBody
    );
    const detailed = await buildDetailedPayloadFromAggregatedReportBody(reportWithAccount, range.period);
    return detailed;
  } catch {
    return null;
  }
}

/**
 * @param {{
 *   body: Record<string, unknown>;
 *   req?: import("http").IncomingMessage;
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
  const prod = process.env.NODE_ENV === "production";
  const emergencyProd =
    String(process.env.PARENT_COPILOT_ALLOW_CLIENT_PAYLOAD_IN_PRODUCTION || "")
      .trim()
      .toLowerCase() === "true";

  if (!strict) {
    const payload = body?.payload;
    if (!payload || typeof payload !== "object") {
      return { ok: false, status: 400, error: "Missing payload" };
    }
    let g;
    if (auth.mode === "dev_local") {
      g = "client_payload_dev_only_unverified";
    } else if (prod && emergencyProd) {
      g = "client_payload_emergency_production";
    } else {
      g = "client_payload_authenticated_session_or_parent";
    }
    return { ok: true, payload, grounding: g };
  }

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
    return { ok: true, payload: rebuilt, grounding: "server_snapshot" };
  }

  return {
    ok: false,
    status: 422,
    error:
      "Server-side report snapshot could not be built (database unreachable, missing server credentials, or report builders failed). Copilot cannot use client-supplied payloads in strict production; operators may set PARENT_COPILOT_ALLOW_CLIENT_PAYLOAD_IN_PRODUCTION=true as an emergency override (not recommended).",
    code: "SERVER_SNAPSHOT_UNAVAILABLE",
  };
}
