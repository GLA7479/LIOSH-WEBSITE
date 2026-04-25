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

export function buildSimulatorMetadata({
  presetId,
  touchedKeys,
  backupByKey,
  playerName,
  generatedAt = new Date().toISOString(),
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
  };
}
