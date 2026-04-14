import { stableJsonHash } from "./stable-json-hash.js";

/**
 * Immutable subset of V2 unit for hybrid / explanation bundles.
 * @param {object} unit
 */
export function buildV2AuthoritySnapshot(unit) {
  const gating = unit?.outputGating && typeof unit.outputGating === "object" ? { ...unit.outputGating } : {};
  const diagnosis = unit?.diagnosis && typeof unit.diagnosis === "object" ? { ...unit.diagnosis } : {};
  const snap = {
    unitKey: unit?.unitKey ?? null,
    subjectId: unit?.subjectId ?? null,
    topicRowKey: unit?.topicRowKey ?? null,
    bucketKey: unit?.bucketKey ?? null,
    outputGating: gating,
    confidence: unit?.confidence ?? null,
    priority: unit?.priority ?? null,
    diagnosis: {
      allowed: !!diagnosis.allowed,
      taxonomyId: diagnosis.taxonomyId ?? unit?.taxonomy?.id ?? null,
      conditional: !!diagnosis.conditional,
      humanBoundaryStripped: !!diagnosis.humanBoundaryStripped,
    },
    taxonomyId: unit?.taxonomy?.id ?? diagnosis.taxonomyId ?? null,
    explainability: unit?.explainability ?? null,
  };
  return {
    ...snap,
    snapshotHash: stableJsonHash(snap),
  };
}
