/**
 * TEMP dev-only observability for time tracking / session progress.
 * Enable with ?debugTracking=1 or localStorage debug_tracking=1
 */

export const TRACKING_DEBUG_SNAPSHOT = {
  lastTrackedBucket: null,
  lastTrackedDuration: null,
  lastTrackedMode: null,
  lastTrackedFn: null,
  lastSessionSubject: null,
  lastSessionTopic: null,
  lastSessionMode: null,
};

const STORAGE_SPECS = {
  math: { key: "mleo_time_tracking", field: "operations" },
  geometry: { key: "mleo_geometry_time_tracking", field: "topics" },
  english: { key: "mleo_english_time_tracking", field: "topics" },
  science: { key: "mleo_science_time_tracking", field: "topics" },
  hebrew: { key: "mleo_hebrew_time_tracking", field: "topics" },
  moledet: { key: "mleo_moledet_geography_time_tracking", field: "topics" },
};

export function isTrackingDebugEnabled() {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("debug_tracking") === "1") return true;
    const v = new URLSearchParams(window.location.search).get("debugTracking");
    if (v === "1" || v === "true") return true;
  } catch {
    // ignore
  }
  return false;
}

function normalizeMode(m) {
  if (m == null) return "";
  if (typeof m === "object") {
    try {
      return JSON.stringify(m);
    } catch {
      return String(m);
    }
  }
  return String(m);
}

/** Call at entry to track*Time (before early returns) so failed calls are visible too. */
export function trackingDebugRecordTrack(bucket, duration, metaMode, fnLabel = "") {
  if (!isTrackingDebugEnabled()) return;
  TRACKING_DEBUG_SNAPSHOT.lastTrackedBucket =
    bucket === undefined || bucket === null ? "" : String(bucket);
  TRACKING_DEBUG_SNAPSHOT.lastTrackedDuration =
    duration === undefined || duration === null ? "" : Number(duration);
  TRACKING_DEBUG_SNAPSHOT.lastTrackedMode = normalizeMode(metaMode);
  TRACKING_DEBUG_SNAPSHOT.lastTrackedFn = fnLabel || "";
}

/** Call when addSessionProgress actually persists (after duration guard). */
export function trackingDebugRecordSession(meta = {}) {
  if (!isTrackingDebugEnabled()) return;
  TRACKING_DEBUG_SNAPSHOT.lastSessionSubject = meta.subject != null ? String(meta.subject) : "";
  TRACKING_DEBUG_SNAPSHOT.lastSessionTopic = meta.topic != null ? String(meta.topic) : "";
  TRACKING_DEBUG_SNAPSHOT.lastSessionMode = meta.mode != null ? String(meta.mode) : "";
}

export function getTrackingDebugBucketInfo(subjectId) {
  if (typeof window === "undefined") return { count: 0, keys: [] };
  const spec = STORAGE_SPECS[subjectId];
  if (!spec) return { count: 0, keys: [] };
  try {
    const raw = localStorage.getItem(spec.key);
    if (!raw) return { count: 0, keys: [] };
    const o = JSON.parse(raw);
    const bag = o[spec.field] || {};
    const keys = Object.keys(bag).sort();
    return { count: keys.length, keys };
  } catch {
    return { count: 0, keys: [] };
  }
}
