# Dev Student Simulator Final Handoff

## Current status

The Dev Student Simulator is technically ready for internal/dev usage and QA workflows.  
It is intentionally not a production end-user feature and is gated by server-side env + auth.

## Phases completed

- Phase 3: protected page + auth shell + simulator controls
- Phase 3.5: apply safety hardening (metadata-first write model)
- Phase 3.6: import touchedKeys hardening (effective keys from snapshot)
- Phase 4.1: simDeep04 validator blocker fix
- Phase 4.2: automated interactive browser QA (Playwright Chromium)
- Phase 4.3: preview/apply anchor stability (apply uses staged preview snapshot)
- Phase 5: docs + removal checklist + final safety handoff

## Feature area file map

### Route + APIs

- `pages/learning/dev-student-simulator.js`
- `pages/api/dev-student-simulator/login.js`
- `pages/api/dev-student-simulator/logout.js`

### Simulator UI

- `components/dev-student-simulator/DevStudentSimulatorClient.jsx`

### Server auth + cookie

- `utils/server/dev-student-simulator-auth.js`

### Simulator core/utilities

- `utils/dev-student-simulator/*`

### QA and support scripts

- `scripts/dev-student-simulator-self-test.mjs`
- `scripts/dev-student-simulator-engine-proof.mjs`
- `scripts/dev-student-simulator-browser-storage-selftest.mjs`
- `scripts/dev-student-simulator-phase42-browser-qa.mjs`

### Artifacts

- `reports/dev-student-simulator/phase2-core/*`
- `reports/dev-student-simulator/phase2-engine-proof/*`
- `reports/dev-student-simulator/phase42-browser-qa/*`

## Commands that passed

- Browser-storage safety tests:
  - `npm run test:dev-student-simulator-browser-storage`
- Preset self-test:
  - `npx tsx scripts/dev-student-simulator-self-test.mjs`
- Engine proof:
  - `npx tsx scripts/dev-student-simulator-engine-proof.mjs`
- Interactive browser QA (Playwright Chromium):
  - `npx tsx scripts/dev-student-simulator-phase42-browser-qa.mjs`

## Remaining known limitations

- Preview generation is anchor/time-sensitive; rare retries may be needed on `Generate preview`.
- Manual human narrative/story review is still recommended for nuanced educational interpretation.
- Existing unrelated repository issue: `next build` / `geometry-master` blocker should be handled outside simulator scope.

## Things intentionally not done

- No changes to production report generation logic.
- No changes to parent report pages.
- No changes to subject master pages.
- No public menu/navigation link for simulator route.
- No storage migration/renaming.

## Production safety notes

- Simulator is server-gated by:
  - `ENABLE_DEV_STUDENT_SIMULATOR=true`
  - `DEV_STUDENT_SIMULATOR_PASSWORD`
- Login uses signed short-lived `httpOnly` cookie with `SameSite=Lax`.
- No `NEXT_PUBLIC` secret.
- Apply uses metadata-first write and reset-safe backup restoration.
- Reset only touches simulator-tracked keys and metadata key.
- Import is validated:
  - blocks `leok_*`
  - blocks unknown `mleo_*` keys outside allowlist
  - effective touched keys derived from snapshot

## Human QA recommendation

Even after automated QA passes, perform manual human review on the real report pages for preset story fidelity before any broader internal rollout.

