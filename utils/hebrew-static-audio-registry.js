/**
 * Registry lookup: audio_asset_id → static clip URL (Core v1).
 * Source of truth: data/hebrew-audio/he-core-v1.registry.json
 */

import registryDoc from "../data/hebrew-audio/he-core-v1.registry.json";

/** @typedef {{ audio_asset_id: string, locale: string, voice_id: string, asset_version: number, task_mode: string, grade: string, topic: string, relative_url: string, duration_ms: number, sha256: string|null }} HebrewStaticRegistryEntry */

/** @type {Map<string, HebrewStaticRegistryEntry>|null} */
let idToEntry = null;

function getMap() {
  if (!idToEntry) {
    idToEntry = new Map();
    const entries = Array.isArray(registryDoc.entries) ? registryDoc.entries : [];
    for (const e of entries) {
      if (e && typeof e.audio_asset_id === "string" && e.audio_asset_id.trim()) {
        idToEntry.set(e.audio_asset_id.trim(), /** @type {HebrewStaticRegistryEntry} */ (e));
      }
    }
  }
  return idToEntry;
}

/**
 * @param {string} audio_asset_id
 * @returns {HebrewStaticRegistryEntry | null}
 */
export function resolveHebrewStaticCoreV1(audio_asset_id) {
  const id = String(audio_asset_id || "").trim();
  if (!id) return null;
  return getMap().get(id) || null;
}

export function getHebrewStaticCoreV1RegistryVersion() {
  return registryDoc.version != null ? String(registryDoc.version) : "1";
}

export function listHebrewStaticCoreV1RegistryEntries() {
  return Array.isArray(registryDoc.entries) ? registryDoc.entries.slice() : [];
}
