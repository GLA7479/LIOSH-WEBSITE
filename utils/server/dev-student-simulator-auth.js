/**
 * Server-only auth for /learning/dev-student-simulator (Phase 11).
 * Uses ENABLE_DEV_STUDENT_SIMULATOR + DEV_STUDENT_SIMULATOR_PASSWORD — never expose to client.
 */

import crypto from "crypto";

export const DEV_STUDENT_SIMULATOR_COOKIE_NAME = "dev_student_simulator_v1";
/** Short-lived session (seconds). */
export const DEV_STUDENT_SIMULATOR_COOKIE_MAX_AGE_SEC = 2 * 60 * 60;

export function isDevStudentSimulatorEnabled() {
  return String(process.env.ENABLE_DEV_STUDENT_SIMULATOR || "").trim().toLowerCase() === "true";
}

function hmacSecret() {
  const p = process.env.DEV_STUDENT_SIMULATOR_PASSWORD;
  if (p == null || String(p).length === 0) return null;
  return String(p);
}

function signPayload(payloadB64) {
  const secret = hmacSecret();
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/**
 * @param {string | undefined} cookieHeaderValue raw `Cookie` header
 * @returns {string | null}
 */
export function getDevStudentSimulatorCookieRaw(cookieHeaderValue) {
  return readCookieFromHeader(cookieHeaderValue, DEV_STUDENT_SIMULATOR_COOKIE_NAME);
}

/**
 * @param {string | undefined} cookieHeaderValue raw Cookie header value (optional)
 * @returns {boolean}
 */
export function hasValidDevStudentSimulatorSession(cookieHeaderValue) {
  if (!isDevStudentSimulatorEnabled()) return false;
  return verifySessionToken(getDevStudentSimulatorCookieRaw(cookieHeaderValue)) != null;
}

function readCookieFromHeader(cookieHeader, name) {
  if (!cookieHeader || typeof cookieHeader !== "string") return null;
  for (const part of cookieHeader.split(";")) {
    const p = part.trim();
    const eq = p.indexOf("=");
    if (eq <= 0) continue;
    const k = p.slice(0, eq).trim();
    if (k !== name) continue;
    const v = p.slice(eq + 1).trim();
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }
  return null;
}

/**
 * @param {string | null | undefined} token cookie value
 * @returns {{ exp: number } | null}
 */
export function verifySessionToken(token) {
  const secret = hmacSecret();
  if (!secret || !token || typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = signPayload(payloadB64);
  if (!expected || sig.length !== expected.length) return null;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  let payload;
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    payload = JSON.parse(json);
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== "number") return null;
  if (payload.exp <= Date.now()) return null;
  return payload;
}

/**
 * @returns {string | null} full token for Set-Cookie value
 */
export function createSessionToken() {
  const secret = hmacSecret();
  if (!secret) return null;
  const exp = Date.now() + DEV_STUDENT_SIMULATOR_COOKIE_MAX_AGE_SEC * 1000;
  const payload = JSON.stringify({ v: 1, exp, i: crypto.randomBytes(8).toString("hex") });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = signPayload(payloadB64);
  if (!sig) return null;
  return `${payloadB64}.${sig}`;
}

/**
 * @param {import('http').ServerResponse} res
 * @param {string} token from createSessionToken
 */
export function setDevStudentSimulatorSessionCookie(res, token) {
  const parts = [
    `${DEV_STUDENT_SIMULATOR_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${DEV_STUDENT_SIMULATOR_COOKIE_MAX_AGE_SEC}`,
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

/**
 * @param {import('http').ServerResponse} res
 */
export function clearDevStudentSimulatorSessionCookie(res) {
  const parts = [
    `${DEV_STUDENT_SIMULATOR_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

/**
 * Constant-time password check (hash compare).
 * @param {string} provided
 * @returns {boolean}
 */
export function verifyDevStudentSimulatorPassword(provided) {
  const expected = process.env.DEV_STUDENT_SIMULATOR_PASSWORD;
  if (expected == null || String(expected).length === 0) return false;
  const a = crypto.createHash("sha256").update(String(provided), "utf8").digest();
  const b = crypto.createHash("sha256").update(String(expected), "utf8").digest();
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
