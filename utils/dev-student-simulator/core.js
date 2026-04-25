import { getDevStudentPresetById } from "./presets";
import { buildSessionsFromPreset } from "./session-builder";
import { buildStorageSnapshotFromSessions } from "./snapshot-builder";
import { buildBackupEnvelope, buildSimulatorMetadata } from "./metadata";
import { validatePresetSessions, validateSnapshotNamespace } from "./validator";

export function buildSimulatorCoreFromPreset({
  presetId,
  playerNameOverride,
  existingStorageMap = {},
  anchorEndMs = Date.now(),
}) {
  const preset = getDevStudentPresetById(presetId);
  if (!preset) throw new Error(`Unknown preset id: ${presetId}`);

  const sessions = buildSessionsFromPreset(preset, anchorEndMs);
  const sessionValidation = validatePresetSessions(preset, sessions);
  if (!sessionValidation.ok) {
    throw new Error(`Session validation failed (${presetId}): ${sessionValidation.errors.join(", ")}`);
  }

  const playerName = playerNameOverride || preset.studentName;
  const { snapshot, touchedKeys } = buildStorageSnapshotFromSessions(sessions, playerName);
  const namespaceValidation = validateSnapshotNamespace(snapshot);
  if (!namespaceValidation.ok) {
    throw new Error(`Snapshot namespace validation failed: ${namespaceValidation.errors.join(", ")}`);
  }

  const backupByKey = buildBackupEnvelope(touchedKeys, existingStorageMap);
  const metadata = buildSimulatorMetadata({
    presetId: preset.id,
    touchedKeys,
    backupByKey,
    playerName,
  });

  return {
    preset,
    sessions,
    snapshot,
    touchedKeys,
    metadata,
    validation: {
      sessions: sessionValidation,
      namespace: namespaceValidation,
    },
  };
}
