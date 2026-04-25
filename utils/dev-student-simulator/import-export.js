import { validateSnapshotNamespace } from "./validator";

const EXPORT_VERSION = 1;

export function exportSimulatorPackage({
  presetId,
  productDisplayName = "LEOK",
  snapshot,
  metadata,
}) {
  return {
    version: EXPORT_VERSION,
    type: "dev-student-simulator-snapshot",
    productDisplayName,
    presetId,
    createdAt: new Date().toISOString(),
    snapshot,
    metadata,
  };
}

export function serializeSimulatorPackage(pkg) {
  return JSON.stringify(pkg, null, 2);
}

export function parseSimulatorPackage(rawText) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid package: expected object");
  }
  if (parsed.version !== EXPORT_VERSION) {
    throw new Error(`Unsupported package version: ${String(parsed.version)}`);
  }
  const ns = validateSnapshotNamespace(parsed.snapshot || {});
  if (!ns.ok) {
    throw new Error(`Invalid snapshot namespace: ${ns.errors.join("; ")}`);
  }
  return parsed;
}
