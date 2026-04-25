import { CUSTOM_SIMULATOR_PRESET_ID } from "./constants";
import { getDevStudentPresetById } from "./presets";
import { buildSessionsFromPreset } from "./session-builder";
import { buildSessionsFromCustomSpec, anchorEndMsFromSpec } from "./custom-session-builder";
import { buildStorageSnapshotFromSessions } from "./snapshot-builder";
import { buildBackupEnvelope, buildSimulatorMetadata } from "./metadata";
import { validatePresetSessions, validateSnapshotNamespace } from "./validator";
import { validateCustomSpecBeforeBuild, validateCustomSessionsAfterBuild } from "./custom-validator";

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

/**
 * Build simulator package from manual custom controls (UI spec).
 * Does not touch report pages or storage keys beyond the existing snapshot contract.
 */
export function buildSimulatorCoreFromCustomSpec({
  spec,
  playerNameOverride,
  existingStorageMap = {},
  anchorEndMs: anchorEndMsArg,
} = {}) {
  const pre = validateCustomSpecBeforeBuild(spec);
  if (!pre.ok) {
    throw new Error(`Custom spec invalid: ${pre.errors.join("; ")}`);
  }

  const anchorEndMs = anchorEndMsArg != null ? anchorEndMsArg : anchorEndMsFromSpec(spec);
  const sessions = buildSessionsFromCustomSpec(spec, anchorEndMs);
  const sessionValidation = validateCustomSessionsAfterBuild(sessions, spec);
  const sessionBlock = {
    ...sessionValidation,
    warnings: [...(pre.warnings || []), ...(sessionValidation.warnings || [])],
    preBuildWarnings: pre.warnings,
  };
  if (!sessionValidation.ok) {
    throw new Error(`Custom session validation failed: ${sessionValidation.errors.join("; ")}`);
  }

  const playerName = (playerNameOverride || spec.studentName || "").trim() || "Student";
  const { snapshot, touchedKeys } = buildStorageSnapshotFromSessions(sessions, playerName);
  const namespaceValidation = validateSnapshotNamespace(snapshot);
  if (!namespaceValidation.ok) {
    throw new Error(`Snapshot namespace validation failed: ${namespaceValidation.errors.join("; ")}`);
  }

  const backupByKey = buildBackupEnvelope(touchedKeys, existingStorageMap);
  const metadata = buildSimulatorMetadata({
    presetId: CUSTOM_SIMULATOR_PRESET_ID,
    touchedKeys,
    backupByKey,
    playerName,
  });

  return {
    preset: null,
    sessions,
    snapshot,
    touchedKeys,
    metadata,
    validation: {
      sessions: sessionBlock,
      namespace: namespaceValidation,
    },
  };
}
