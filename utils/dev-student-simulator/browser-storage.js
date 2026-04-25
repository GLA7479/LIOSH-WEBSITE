/**
 * Client-only helpers for Apply / Reset / Export (Phase 11 dev simulator).
 */

import { safeGetItem, safeSetItem, safeRemoveItem } from "../safe-local-storage";
import { STORAGE_KEYS } from "./constants";
import { SIMULATOR_METADATA_KEY } from "./metadata";

/**
 * Reset / backup authority: keys actually present in the snapshot (Phase 3.6).
 * @param {Record<string, unknown>} snapshot
 * @returns {string[]}
 */
export function deriveEffectiveTouchedKeysFromSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return [];
  return Object.keys(snapshot).filter((k) => typeof k === "string");
}

/**
 * Keys used for Reset and export reads. Prefers metadata.effectiveTouchedKeys; falls back to touchedKeys (legacy).
 * @param {Record<string, unknown>} meta
 * @returns {string[]}
 */
export function getResetTouchedKeysFromMetadata(meta) {
  if (!meta || typeof meta !== "object") return [];
  const eff = meta.effectiveTouchedKeys;
  if (Array.isArray(eff) && eff.some((k) => typeof k === "string" && k.startsWith("mleo_"))) {
    return eff.filter((k) => typeof k === "string" && k.startsWith("mleo_"));
  }
  const t = meta.touchedKeys;
  if (Array.isArray(t)) return t.filter((k) => typeof k === "string" && k.startsWith("mleo_"));
  return [];
}

/**
 * @param {string[]} keys
 * @returns {Record<string, string | null>}
 */
export function readRawStorageMapForKeys(keys) {
  const out = {};
  for (const key of keys) {
    out[key] = safeGetItem(key);
  }
  return out;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function stringifyForLocalStorage(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/**
 * @param {Record<string, unknown>} snapshot
 * @param {readonly string[]} allowedKeys frozen allowlist (defaults to STORAGE_KEYS)
 * @returns {{ ok: true } | { ok: false, key: string, code: string }}
 */
export function validateSnapshotForApply(snapshot, allowedKeys = STORAGE_KEYS) {
  if (!snapshot || typeof snapshot !== "object") {
    return { ok: false, key: "(snapshot)", code: "invalid_snapshot" };
  }
  const allow = new Set(allowedKeys);
  for (const k of Object.keys(snapshot)) {
    if (typeof k !== "string") return { ok: false, key: String(k), code: "bad_key_type" };
    if (k.startsWith("leok_")) return { ok: false, key: k, code: "leok_blocked" };
    if (!k.startsWith("mleo_")) return { ok: false, key: k, code: "non_mleo_key" };
    if (!allow.has(k)) return { ok: false, key: k, code: "key_not_in_allowlist" };
  }
  return { ok: true };
}

function writeSnapshotEntries(snapshot) {
  for (const [k, v] of Object.entries(snapshot)) {
    const r = safeSetItem(k, stringifyForLocalStorage(v));
    if (!r.ok) return { ok: false, key: k, error: r.error };
  }
  return { ok: true };
}

/**
 * Writes snapshot keys only (validated against allowlist; blocks leok_*).
 * @param {Record<string, unknown>} snapshot
 * @param {readonly string[]} [allowedKeys]
 * @returns {{ ok: true } | { ok: false, key: string, error?: string }}
 */
export function applySnapshotToLocalStorage(snapshot, allowedKeys = STORAGE_KEYS) {
  const v = validateSnapshotForApply(snapshot, allowedKeys);
  if (!v.ok) return { ok: false, key: v.key, error: v.code };
  return writeSnapshotEntries(snapshot);
}

/**
 * Phase 3.5: persist backup metadata before snapshot writes so Reset can recover if snapshot write fails mid-way.
 * @param {{ metadata: unknown, snapshot: Record<string, unknown>, allowedKeys?: readonly string[] }} args
 * @returns
 *   | { ok: true }
 *   | { ok: false, phase: "validate", key: string, error: string }
 *   | { ok: false, phase: "metadata", reason: string }
 *   | { ok: false, phase: "snapshot", key: string, error?: string, metadataWritten: true }
 */
export function applyMetadataThenSnapshot({ metadata, snapshot, allowedKeys = STORAGE_KEYS }) {
  const v = validateSnapshotForApply(snapshot, allowedKeys);
  if (!v.ok) {
    return { ok: false, phase: "validate", key: v.key, error: v.code };
  }
  const wm = writeSimulatorMetadata(metadata);
  if (!wm.ok) {
    return { ok: false, phase: "metadata", reason: wm.reason };
  }
  const wr = writeSnapshotEntries(snapshot);
  if (!wr.ok) {
    return { ok: false, phase: "snapshot", key: wr.key, error: wr.error, metadataWritten: true };
  }
  return { ok: true };
}

/**
 * @param {unknown} metadata
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function writeSimulatorMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return { ok: false, reason: "invalid_metadata" };
  const r = safeSetItem(SIMULATOR_METADATA_KEY, JSON.stringify(metadata));
  if (!r.ok) return { ok: false, reason: r.error || "set_failed" };
  return { ok: true };
}

/**
 * Restores backup from metadata or removes keys when backup is null. Removes metadata key at end.
 * Never touches keys outside getResetTouchedKeysFromMetadata(meta) (except metadata key itself).
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function resetSimulatedStudentFromMetadata() {
  const raw = safeGetItem(SIMULATOR_METADATA_KEY);
  if (raw == null || raw === "") return { ok: false, reason: "no_metadata" };
  let meta;
  try {
    meta = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "bad_metadata" };
  }
  if (!meta || meta.simulator !== "dev-student-simulator-core") {
    return { ok: false, reason: "not_simulator_metadata" };
  }
  const touched = getResetTouchedKeysFromMetadata(meta);
  const backupByKey = meta.backupByKey && typeof meta.backupByKey === "object" ? meta.backupByKey : {};
  for (const key of touched) {
    if (typeof key !== "string" || !key.startsWith("mleo_")) continue;
    if (!Object.prototype.hasOwnProperty.call(backupByKey, key)) {
      safeRemoveItem(key);
      continue;
    }
    const backup = backupByKey[key];
    if (backup == null) {
      safeRemoveItem(key);
    } else {
      const str = typeof backup === "string" ? backup : JSON.stringify(backup);
      safeSetItem(key, str);
    }
  }
  safeRemoveItem(SIMULATOR_METADATA_KEY);
  return { ok: true };
}

/**
 * Reads current snapshot for keys listed in metadata (for export).
 * @returns {{ snapshot: Record<string, unknown>, metadata: unknown } | null}
 */
export function readCurrentSimulatorExportFromLocalStorage() {
  const raw = safeGetItem(SIMULATOR_METADATA_KEY);
  if (raw == null || raw === "") return null;
  let meta;
  try {
    meta = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!meta || meta.simulator !== "dev-student-simulator-core") {
    return null;
  }
  const keys = getResetTouchedKeysFromMetadata(meta);
  if (!keys.length) return null;
  const snapshot = {};
  for (const key of keys) {
    if (typeof key !== "string" || !key.startsWith("mleo_")) continue;
    const s = safeGetItem(key);
    if (s == null) continue;
    try {
      snapshot[key] = JSON.parse(s);
    } catch {
      snapshot[key] = s;
    }
  }
  return { snapshot, metadata: meta };
}
