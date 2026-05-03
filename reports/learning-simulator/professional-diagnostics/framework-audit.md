# Professional Diagnostic Framework — audit

- Generated at: 2026-05-03T06:20:29.612Z
- Framework version: 1.0.0

## Scope

- **In phase:** math, hebrew (internal structured findings only).
- **Deferred:** english, science, geometry, moledet-geography (no new logic beyond preserving existing engine behavior).

## Engine field mapping

Reads unit identifiers and canonical action state from `diagnosticEngineV2`, and row-level metrics from `maps`.
Writes `professionalFrameworkV1` on math/hebrew units and a rollup object on `diagnosticEngineV2`.

## Integration

- File: `utils/parent-report-v2.js`
- Point: Immediately after runDiagnosticEngineV2({ maps, rawMistakesBySubject, startMs, endMs })

## Remaining gaps

- English / Science / Geometry / Moledet: taxonomy hooks only if engine emits units; no expansion this phase.
- sessionsApprox in basedOn is reserved (null) until session linkage is standardized.
- Taxonomy bridge ids (topic-taxonomy-bridge) not yet merged into structuredFinding.topicId (uses internal bucketKey).
