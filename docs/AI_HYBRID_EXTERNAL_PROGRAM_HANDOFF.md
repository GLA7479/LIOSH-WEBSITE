# AI-Hybrid — external program handoff

This file lists work that **cannot** be completed from repository code alone. Ownership and execution sit outside this repo (operations, experts, production).

## Gates (external)

| Gate | What must happen |
|------|------------------|
| Expert / adjudicated gold | Human labels, dispute resolution, gold dataset acceptance |
| Inter-rater / kappa | Measurement protocol, thresholds, sign-off |
| Real shadow period | Multi-window live or staged traffic, metrics against SLOs |
| Rollout cohorts | Controlled exposure, rollback procedure, comms |
| Production monitoring | Dashboards, alerts, incident response |
| Trained models | Optional replacement of heuristic ranker/probe; training infra, model cards, deployment policy |

## Repo boundary

- **Repo delivers:** hybrid layer implementation, V2 authority preservation, validators, harnesses, CI hooks, documentation of scope.
- **Repo does not deliver:** the rows above without operational execution.

## Suggested owners (assign explicitly)

- Labeling / adjudication: *TBD — expert panel or vendor*
- Shadow / rollout: *TBD — product + engineering ops*
- Monitoring: *TBD — platform / SRE*
- ML training (if any): *TBD — ML + compliance*

Update this table with real names when the program starts.
