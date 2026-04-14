import { STORAGE_KEYS } from "./constants.js";

const MAX = 50;

function inBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

/**
 * @param {object} entry
 */
export function appendShadowHybridEntry(entry) {
  if (!inBrowser()) return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEYS.shadowLog);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return;
    arr.push({ ...entry, at: new Date().toISOString() });
    while (arr.length > MAX) arr.shift();
    window.sessionStorage.setItem(STORAGE_KEYS.shadowLog, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

/**
 * @returns {object[]}
 */
export function readShadowHybridLog() {
  if (!inBrowser()) return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEYS.shadowLog);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
