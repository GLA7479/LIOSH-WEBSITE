# Pilot Readiness Package (Stage1)

## Pilot success criteria

- V2 authority is primary across parent and detailed report flows (`diagnosticPrimarySource=diagnosticEngineV2` when units exist).
- Legacy diagnostics are fallback only and explicit (`legacy_patternDiagnostics_fallback`) with no silent mixed authority.
- Full report contracts remain stable (`base -> V2 -> detailed`) with explicit `cannotConclude` behavior for weak/contradictory evidence.
- Six-subject coverage is active in QA harness and produces structured outputs for diagnosis/confidence/priority/gating/probe/intervention.
- No blocking failures in core engine logic, authority model, or payload contracts.

## Severe issue categories (blocking)

- `authority_regression`: any main flow source returning to legacy-first without explicit fallback reason.
- `contract_break`: missing critical output sections or broken payload shape in parent/detailed flows.
- `unsafe_overclaim`: weak/sparse evidence producing strong diagnosis/intervention without required gating.
- `cross_subject_failure`: one or more of the six subjects missing from executable harness coverage.
- `cannot_conclude_breach`: contradictory/insufficient evidence path missing explicit uncertainty handling.

## Known limitations (non-blocking for controlled pilot)

- Some parent-facing narratives are generic under low evidence volume.
- Transfer/recovery narrative richness is still fixture-limited and should be expanded post-pilot.
- Legacy fallback path is retained for compatibility and should be monitored in pilot logs for frequency.

## Controlled pilot checklist

- [ ] Run `npm run test:parent-report-phase1`
- [ ] Run `npm run test:topic-next-step-phase2`
- [ ] Run `npm run test:topic-next-step-engine-scenarios`
- [ ] Run `npm run test:diagnostic-engine-v2-harness`
- [ ] Run `npm run test:parent-report-phase6`
- [ ] Run `npm run build`
- [ ] Verify `diagnosticPrimarySource` labeling in parent report UI
- [ ] Verify fallback appears only with explicit reason and no hidden authority mixing
- [ ] Confirm pedagogical matrix remains GO with no blocking items

## Ready-for-pilot verdict

- Verdict: **ready for pilot (controlled)**.
- Guard condition: any severe issue category immediately pauses rollout and returns to fix-and-verify loop.
