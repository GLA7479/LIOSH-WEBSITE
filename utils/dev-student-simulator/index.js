export { PRODUCT_DISPLAY_NAME, INTERNAL_STORAGE_NAMESPACE, STORAGE_KEYS, SUBJECTS, SUBJECT_BUCKETS } from "./constants";
export { DEV_STUDENT_PRESETS, getDevStudentPresetById } from "./presets";
export { buildSessionsFromPreset } from "./session-builder";
export { buildStorageSnapshotFromSessions } from "./snapshot-builder";
export { SIMULATOR_METADATA_KEY, buildBackupEnvelope, buildSimulatorMetadata } from "./metadata";
export { validatePresetSessions, validateSnapshotNamespace } from "./validator";
export { exportSimulatorPackage, serializeSimulatorPackage, parseSimulatorPackage } from "./import-export";
export { buildSimulatorCoreFromPreset } from "./core";
export {
  validateSnapshotForApply,
  applyMetadataThenSnapshot,
  deriveEffectiveTouchedKeysFromSnapshot,
  getResetTouchedKeysFromMetadata,
} from "./browser-storage";
