# Professional Diagnostic Framework — audit

- Generated at: 2026-05-04T00:28:17.777Z
- Framework version: 1.1.0

## Scope

- **In phase:** math, hebrew, english, science, geometry, moledet-geography (internal structured findings only).

## Engine field mapping

Reads unit identifiers and canonical action state from `diagnosticEngineV2`, and row-level metrics from `maps`.
Writes `professionalFrameworkV1` on math/hebrew units and a rollup object on `diagnosticEngineV2`.

## Integration

- File: `utils/parent-report-v2.js`
- Point: Immediately after runDiagnosticEngineV2({ maps, rawMistakesBySubject, startMs, endMs })

## Remaining gaps

- sessionsApprox in basedOn is reserved (null) until session linkage is standardized.
- Taxonomy bridge ids (topic-taxonomy-bridge) not yet merged into structuredFinding.topicId (uses internal bucketKey).
