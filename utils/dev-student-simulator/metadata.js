export const SIMULATOR_METADATA_KEY = "mleo_dev_student_simulator_metadata_v1";

export function buildBackupEnvelope(touchedKeys, existingStorageMap) {
  const backup = {};
  for (const key of touchedKeys) {
    backup[key] = Object.prototype.hasOwnProperty.call(existingStorageMap, key)
      ? existingStorageMap[key]
      : null;
  }
  return backup;
}

/**
 * @param {object} args
 * @param {{ subject: string, topic: string }[]} [args.affectedUnits] — custom builder units touched by Apply
 * @param {string} [args.customApplyMode] — how snapshot was merged (default replace selected topics)
 * @param {string} [args.simulatorRunId] — id stamped on all generated session/mistake rows
 */
export function buildSimulatorMetadata({
  presetId,
  touchedKeys,
  backupByKey,
  playerName,
  generatedAt = new Date().toISOString(),
  affectedUnits,
  customApplyMode,
  simulatorRunId,
}) {
  return {
    version: 1,
    simulator: "dev-student-simulator-core",
    presetId,
    playerName,
    generatedAt,
    touchedKeys: [...touchedKeys],
    // Reset policy: restore previous values from this map; if value is null => remove key.
    backupByKey: { ...backupByKey },
    ...(affectedUnits != null ? { affectedUnits: [...affectedUnits] } : {}),
    ...(customApplyMode != null ? { customApplyMode } : {}),
    ...(simulatorRunId != null ? { simulatorRunId } : {}),
  };
}
