import { STORAGE_KEYS } from "./constants.js";

/**
 * @typedef {"unset"|"opted_in"|"opted_out"} ConsentState
 */

function inBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * @returns {{ state: ConsentState, policyVersion: string }}
 */
export function readAiHybridConsent() {
  if (!inBrowser()) return { state: "opted_in", policyVersion: "1" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.consent);
    if (!raw) return { state: "unset", policyVersion: "1" };
    const o = JSON.parse(raw);
    const s = String(o?.state || "");
    if (s === "opted_in" || s === "opted_out") return { state: s, policyVersion: String(o?.policyVersion || "1") };
    return { state: "unset", policyVersion: "1" };
  } catch {
    return { state: "unset", policyVersion: "1" };
  }
}

/**
 * @param {ConsentState} state
 */
export function writeAiHybridConsent(state) {
  if (!inBrowser()) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.consent,
      JSON.stringify({ state, policyVersion: "1", updatedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore */
  }
}

/**
 * Training export filter: drop rows that must not enter model training.
 * @param {object} row
 * @returns {{ allowed: boolean, reasons: string[] }}
 */
export function trainingExportAllowed(row) {
  const reasons = [];
  if (!row || typeof row !== "object") {
    reasons.push("invalid_row");
    return { allowed: false, reasons };
  }
  if (row.consentState && row.consentState !== "opted_in") reasons.push("consent_not_opted_in");
  if (row.legalHold) reasons.push("legal_hold");
  if (row.explanationValidator && row.explanationValidator.overallPass === false) reasons.push("explanation_failed_validator");
  if (row.identityAmbiguous) reasons.push("identity_ambiguous");
  return { allowed: reasons.length === 0, reasons };
}
