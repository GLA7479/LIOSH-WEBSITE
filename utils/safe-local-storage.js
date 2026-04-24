/**
 * Thin, non-throwing façade over window.localStorage.
 * No logging, retries, or fallback backends. Callers own schema validation.
 */

/**
 * @param {unknown} e
 * @returns {"quota" | "unknown"}
 */
function classifySetError(e) {
  if (e && typeof e === "object") {
    const name = "name" in e ? String(e.name) : "";
    if (name === "QuotaExceededError") return "quota";
    if (typeof DOMException !== "undefined" && e instanceof DOMException) {
      if (e.name === "QuotaExceededError" || e.code === 22) return "quota";
    }
    if (/quota|exceeded/i.test(String(e.message))) return "quota";
  }
  return "unknown";
}

export function isLocalStorageAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const ls = window.localStorage;
    return (
      ls != null &&
      typeof ls.getItem === "function" &&
      typeof ls.setItem === "function"
    );
  } catch {
    return false;
  }
}

/**
 * @param {string} key
 * @returns {string | null}
 */
export function safeGetItem(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {{ ok: boolean, error?: "quota" | "unknown" }}
 */
export function safeSetItem(key, value) {
  if (typeof window === "undefined") return { ok: false, error: "unknown" };
  try {
    window.localStorage.setItem(key, value);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: classifySetError(e) };
  }
}

/**
 * @param {string} key
 */
export function safeRemoveItem(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

/**
 * @param {string} key
 * @returns {Record<string, unknown>}
 */
export function safeGetJsonObject(key) {
  const raw = safeGetItem(key);
  try {
    const parsed = JSON.parse(raw == null || raw === "" ? "{}" : raw);
    if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return /** @type {Record<string, unknown>} */ (parsed);
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * @param {string} key
 * @returns {unknown[]}
 */
export function safeGetJsonArray(key) {
  const raw = safeGetItem(key);
  try {
    const parsed = JSON.parse(raw == null || raw === "" ? "[]" : raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Serializes with JSON.stringify then writes. Never throws.
 * @param {string} key
 * @param {unknown} value
 * @returns {{ ok: boolean, error?: "quota" | "unknown" }}
 */
export function safeSetJson(key, value) {
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return { ok: false, error: "unknown" };
  }
  return safeSetItem(key, serialized);
}
