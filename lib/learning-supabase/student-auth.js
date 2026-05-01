import crypto from "node:crypto";

const COOKIE_NAME = "liosh_student_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function requireAccessSecret() {
  const secret = process.env.LEARNING_STUDENT_ACCESS_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error("Missing LEARNING_STUDENT_ACCESS_SECRET");
  }
  return secret.trim();
}

export function normalizeStudentCode(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

export function normalizeStudentUsername(raw) {
  return String(raw || "").toLowerCase().trim();
}

export function normalizeStudentPin(raw) {
  return String(raw || "").replace(/\D/g, "").trim();
}

export function hashStudentSecret(value) {
  const secret = requireAccessSecret();
  return crypto.createHmac("sha256", secret).update(String(value)).digest("hex");
}

export function generateStudentCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars[crypto.randomInt(0, chars.length)];
  }
  return out;
}

export function generateStudentPin() {
  let pin = "";
  for (let i = 0; i < 4; i += 1) {
    pin += String(crypto.randomInt(0, 10));
  }
  return pin;
}

export function generateStudentSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function sessionExpiryIsoFromNow(seconds = SESSION_MAX_AGE_SECONDS) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function getStudentSessionCookie(req) {
  return req?.cookies?.[COOKIE_NAME] || "";
}

export function setStudentSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === "production";
  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export function clearStudentSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production";
  const cookie = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
  res.setHeader("Set-Cookie", cookie);
}

