# Generic-only report assertion — audit

## Summary

| Field | Value |
|-------|--------|
| Original rule | `unitCount >= 1` and (`topicRecLabels.length >= 1` or `diagnosedCount >= 1`) |
| New rule | Multi-signal structural check: `reportHasNonGenericSignals()` (see `scripts/learning-simulator/lib/report-assertion-engine.mjs`) |
| Change type | **More accurate** (additional pass paths only where structured specificity exists); **not** a silent loosening to empty reports |

## Why the original rule failed

Topic recommendation labels were often empty while other diagnostic/executive fields still contained actionable structure. Relying on a single layer (`topicRecLabels` + `diagnosedCount`) produced false positives for “generic-only.”

## Risk

Low: empty or boilerplate-only reports still fail (no units → fail; units with no substantive signals → fail).

## Recommended use

Enable `noGenericOnlyReport: true` on critical matrix deep scenarios and keep the implementation in the shared report assertion engine.

Full JSON: `reports/learning-simulator/generic-report-assertion-audit.json`
