# Parent AI workstream — final status (Phases A–G)

**Audience:** engineering / product handoff.  
**Language:** documentation in English; **parent-facing product copy remains Hebrew.**

This document closes the Parent AI implementation track through **Phase G**. It records what shipped, what is frozen, optional follow-ups, and how to verify behavior.

---

## Workstream closure (final decision)

- **Parent AI summary insight** (short + detailed deterministic narratives): **launch-ready** as implemented.
- **Detailed report — Parent Copilot Q&A**: **available** as previously implemented (client-side runner on the detailed report page; deterministic-first + optional gated LLM per rollout env).
- **Short report — Parent Copilot**: **implemented** behind `NEXT_PUBLIC_ENABLE_PARENT_COPILOT_ON_SHORT` but **must remain OFF in production** (`false`) until a **server-side report snapshot** is implemented for `/api/parent/copilot-turn` — **no server snapshot in this closure**.
- **`/api/parent/copilot-turn`**: **production-safe** for launch in the sense that strict production mode **does not trust** a client-sent full report payload; requests that require a rebuilt snapshot respond with **HTTP 422** (`SERVER_SNAPSHOT_UNAVAILABLE`) unless the documented **emergency** env is used (not for public launch). See [`copilot-turn-production.md`](./copilot-turn-production.md).
- **Future engineering item:** implement **`tryRebuildDetailedPayloadServerSide`** in `lib/parent-copilot/copilot-turn-payload.server.js` when product is ready to turn short-report Copilot on in production.

---

## Definition of Done (workstream)

| Area | Status |
|------|--------|
| Short report — deterministic Parent AI insight | **Launch-ready** — PDF-first / sync path via adapter + explainer |
| Detailed report — deterministic Parent AI insight | **Launch-ready** |
| PDF / print — deterministic insight present before async enrich | **Done** — gated by [`scripts/qa-parent-pdf-export.mjs`](../../scripts/qa-parent-pdf-export.mjs) |
| Detailed report — Parent Copilot Q&A | **Done** — `utils/parent-copilot`, deterministic-first + optional gated LLM |
| Short report — Copilot Q&A | **Implemented; production default OFF** — keep `NEXT_PUBLIC_ENABLE_PARENT_COPILOT_ON_SHORT=false` until server snapshot exists |
| External / thin-evidence / practice-idea handling (Parent Copilot) | **Done** — `utils/parent-ai-topic-classifier/` + Phase E routing |
| Bad-prompt / leak safety (simulators) | **Done** — Phase F simulators |
| Human-review feedback aggregation (no auto-learning) | **Done** — Phase G aggregator |
| Student-facing AI | **Frozen / untouched** |
| Banks, taxonomies, diagnostics, planner | **Not mutated by Parent AI paths** |
| `/api/parent/copilot-turn` payload trust (strict production) | **Done** — refuses untrusted client payloads (**422**) unless emergency env (documented only) |

---

## What was built (phase summary)

| Phase | Focus | Main artifacts |
|-------|--------|----------------|
| **A** | Audit & map | [`docs/parent-ai/current-state.md`](./current-state.md) |
| **B–D** | Parent Copilot on detailed + short report (short behind flag), API turn route, session/auth wiring | `components/parent-copilot/*`, `pages/api/parent/copilot-turn.js`, `pages/learning/parent-report*.js` |
| **E** | Safe routing for external questions, thin evidence, practice disclaimer | `utils/parent-ai-topic-classifier/*`, additive branches in `utils/parent-copilot/index.js` |
| **F** | Simulation & QA coverage | `scripts/parent-ai-*-simulator.mjs`, `scripts/lib/parent-ai-phase-f-*.mjs`, `reports/parent-ai/simulations/` |
| **G** | Human-review feedback loop only | `scripts/parent-ai-feedback-aggregate.mjs`, `reports/parent-ai/feedback/`, `reports/parent-ai/improvement-suggestions/` |

---

## What Parent AI can do now

1. **Summary insight (Hebrew)** on short and detailed parent reports using the strict allowlist pipeline (`utils/parent-report-ai/*`, `lib/parent-report-ai/*`): deterministic baseline, optional LLM with validation and fallback.
2. **Parent Copilot Q&A** on the detailed report; **short-report Copilot** exists behind a flag but **must stay disabled in production** until server-side snapshot work ships (see [closure](#workstream-closure-final-decision)).
3. **Phase E behaviors**: general-education framing for pasted/external-style questions; explicit hedging when child-level evidence is thin; mandated practice-idea disclaimer line (see classifier).
4. **Phase F simulators**: regression-style checks for normal Q&A, external/practice paths, bad prompts, leak patterns.
5. **Phase G aggregator**: reads optional exported telemetry JSON or synthetic fixture; writes **human-review-only** JSON/MD summaries (counts, buckets, phase_e routes) with **no raw utterances**.

---

## What it cannot do yet (product truth)

- **Does not** automatically improve wording, banks, or routing from feedback reports.
- **Does not** approve or merge AI suggestions into official content.
- **Does not** expose student-facing AI or change diagnostic/planner **decisions** from Copilot.
- **Does not** store raw parent chat text in bundled telemetry (length + structured fields only).

---

## What is frozen

- **Student-facing learning AI surfaces** (`*-master` and related): no Copilot integration.
- **Question banks, taxonomies, diagnostic engines, planner logic**: Parent AI must remain **read-only** with respect to mutating production artifacts.
- **Telemetry privacy**: do not extend persisted traces to full utterance text without an explicit privacy review.

---

## Before launch / follow-ups (non-blocking)

### 1. Short-report Copilot + server snapshot

**Decision:** Do **not** ship short-report Copilot in production until **`tryRebuildDetailedPayloadServerSide`** is implemented. Keep **`NEXT_PUBLIC_ENABLE_PARENT_COPILOT_ON_SHORT=false`** for launch. Emergency operator-only env for client payload is documented in `.env.example` — **not** for public sites.

### 2. Hebrew copy polish (non-blocking)

Parent-facing Hebrew may need an editorial pass (tone, redundancy). Example noted for follow-up: awkward phrasing such as **«לשתף בהירות עם ההורה»** in deterministic narratives — track as **content QA**, not as an engine change.

---

## Tests & simulators (`package.json`)

| Command | Purpose |
|---------|---------|
| `npm run test:parent-ai-context:consistency` | Truth packet / context projection consistency |
| `npm run test:parent-report-ai:integration` | Parent report AI adapter + validation wiring |
| `npm run test:parent-report-ai:scenario-simulator` | Narrative scenario matrix → `reports/parent-report-ai/` |
| `npm run test:parent-copilot-phase6` | Hebrew robustness / parent-facing surfaces |
| `npm run test:parent-ai-phase-e:external` | Phase E external / thin / baseline scenarios |
| `npm run test:parent-ai:simulations` | Phase F combined assistant + external + bad-prompt simulators |
| `npm run test:parent-ai:feedback-aggregate` | Phase G aggregator self-test + report generation |
| `npm run test:parent-copilot-observability-contract` | Telemetry / observability shape |
| `npm run test:parent-copilot-copilot-turn-api` | Copilot-turn payload trust (production vs dev) |
| `npm run qa:parent-pdf-export` | Playwright PDF gate (**needs dev server** — see below) |
| `npm run qa:parent-ai-final` | **Phase H** — runs the focused suite end-to-end (optional PDF skip) |

**PDF gate prerequisite:** Next dev on port **3001** by default (`npm run dev`), or set `QA_BASE_URL` to any reachable instance (another local port if `3001` is busy, or a deployed URL):

```bash
QA_BASE_URL=http://127.0.0.1:3001 npm run qa:parent-pdf-export
# Example when 3001 is already taken:
# npx next dev -p 9876
# QA_BASE_URL=http://127.0.0.1:9876 npm run qa:parent-pdf-export
```

The Phase H runner (`npm run qa:parent-ai-final`) expects the same: either run it while a healthy server is listening at `QA_BASE_URL`, or set `QA_SKIP_PDF=1` to run scripts + `next build` only.

---

## Reports & artifacts (write locations)

| Path | Contents |
|------|----------|
| `reports/parent-report-ai/` | Scenario simulator (`scenario-simulator.{json,md}`) |
| `reports/parent-ai/simulations/` | Phase F timestamped + suite outputs |
| `reports/parent-ai/feedback/` | Phase G `turns-summary`, `fallbacks-summary`, `validator-failures`, `low-confidence`, `repeated-unanswered`, `aggregate-run-meta` |
| `reports/parent-ai/improvement-suggestions/` | Phase G `external-question-gaps`, `practice-suggestions-review` |
| `reports/parent-ai/practice-suggestions/` | Optional dev review queue (see `PARENT_AI_PRACTICE_REVIEW_LOG`) |
| `qa-visual-output/` | PDF QA script output (Playwright) |

Optional inputs for Phase G: place exported trace JSON at `reports/parent-ai/telemetry-export.json` or pass `--fixture` / `PARENT_AI_TELEMETRY_JSON`.

---

## Environment flags (primary)

Documented in [`.env.example`](../../.env.example) and [`docs/PARENT_COPILOT_ROLLOUT.md`](../PARENT_COPILOT_ROLLOUT.md) where applicable.

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_PARENT_COPILOT_V1` | Enables Copilot feature wiring |
| `NEXT_PUBLIC_ENABLE_PARENT_COPILOT_ON_SHORT` | Short-report Copilot panel (default **off**) |
| `PARENT_COPILOT_ALLOW_UNAUTH_LOCAL_PAYLOAD` | Dev-only unauthenticated payload for copilot-turn |
| `PARENT_COPILOT_ALLOW_CLIENT_PAYLOAD_IN_PRODUCTION` | Production escape hatch to trust client payload (default **off** — insecure) |
| `PARENT_COPILOT_ROLLOUT_STAGE`, `PARENT_COPILOT_LLM_ENABLED`, `PARENT_COPILOT_FORCE_DETERMINISTIC` | Rollout + LLM kill-switch |
| `PARENT_COPILOT_KPI_*` | KPI thresholds for grounded LLM gate |
| `PARENT_COPILOT_LLM_*` | LLM endpoint / model / timeout / key |
| `PARENT_AI_TELEMETRY_JSON` | Phase G: path to telemetry JSON for aggregation |
| `PARENT_AI_PRACTICE_REVIEW_LOG` | Dev: optional console log for practice-idea review signal |
| `QA_BASE_URL` | PDF export QA base URL (default `http://127.0.0.1:3001`) |
| `QA_SKIP_PDF` | Set to `1` to skip PDF step in `qa:parent-ai-final` when no server |

---

## Confirmation checklist (Phases A–G outcomes)

| Capability | Verified by |
|------------|-------------|
| Short report insight | Integration + PDF deterministic paint |
| Detailed report insight | Integration + detailed surfaces |
| PDF insight | `qa:parent-pdf-export` |
| Detailed Q&A | Copilot suites + Phase F |
| Short Q&A (flag) | Code path + `.env.example` flag |
| External question handling | Phase E + Phase F external simulator |
| Practice disclaimer | Phase E constant + Phase F assertions |
| Bad prompts | Phase F bad-prompt simulator |
| Feedback reports | Phase G aggregator + test script |
| Frozen student AI | No edits to student AI modules in this track |
| No bank/taxonomy/diagnostic/planner mutation | Architecture + review-only scripts |

---

## References

- Phase A audit: [`current-state.md`](./current-state.md)
- Parent Copilot rollout: [`docs/PARENT_COPILOT_ROLLOUT.md`](../PARENT_COPILOT_ROLLOUT.md)
- Parent report system: [`docs/PARENT_REPORT.md`](../PARENT_REPORT.md)

---

*Last updated: Phase H — final QA & documentation.*
