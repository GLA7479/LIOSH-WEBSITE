# Dev Student Simulator (LEOK)

## What this is

The Dev Student Simulator is an internal developer tool for LEOK. It generates deterministic-like test snapshots for legacy `mleo_*` browser storage keys and lets a developer apply/reset those snapshots in one browser profile to inspect how the real parent report routes react.

Primary route:

- `/learning/dev-student-simulator`

Auth APIs:

- `/api/dev-student-simulator/login`
- `/api/dev-student-simulator/logout`

## What this is NOT

- Not a production end-user feature.
- Not a report-text generator.
- Not a replacement for real student telemetry.
- Not a storage migration tool (no renames, no schema migration).
- Not public navigation/menu content.

## Environment requirements

Set both values on the server side:

- `ENABLE_DEV_STUDENT_SIMULATOR=true`
- `DEV_STUDENT_SIMULATOR_PASSWORD=...`

Important:

- Do not expose secrets with `NEXT_PUBLIC_*`.
- When disabled (`ENABLE_DEV_STUDENT_SIMULATOR` not `true`), page and APIs return 404.

## Internal storage namespace

- Product: `LEOK`
- Legacy namespace used by simulator snapshots: `mleo_*`
- Simulator metadata key: `mleo_dev_student_simulator_metadata_v1`

## Local run

1. Set env vars above.
2. Start app locally (`npm run dev`).
3. Open `/learning/dev-student-simulator`.
4. Login with `DEV_STUDENT_SIMULATOR_PASSWORD`.

## Using the simulator

### Login

- Wrong password returns unauthorized.
- Correct password sets a short-lived signed `httpOnly` cookie (`SameSite=Lax`).

### Generate Preview

- Pick a preset and click `Generate preview`.
- Preview displays:
  - validation panel
  - touched keys
  - metadata/backup preview
  - storage key/value-size preview

### Apply

- Apply uses the exact staged preview snapshot+metadata (Phase 4.3 anchor stability).
- Metadata is written first, then snapshot keys.
- If preset selection changes after preview, regenerate preview before Apply.

### Reset

- Reset reads simulator metadata and restores/removes only tracked touched keys.
- It never wipes all `mleo_*`.
- It removes `mleo_dev_student_simulator_metadata_v1` after reset.

### Export / Import / Copy

- `Export JSON`: exports current simulator snapshot package from local storage.
- `Import JSON`: validates package and writes metadata-first, snapshot-second.
- `Copy storage snapshot`: copies package JSON to clipboard.

Import safety hardening includes:

- blocks `leok_*` keys
- blocks unknown `mleo_*` keys not in allowlist
- derives effective touched keys from snapshot keys (not trusted imported touchedKeys)

### Open real reports

Use links in simulator page:

- `/learning/parent-report`
- `/learning/parent-report-detailed`
- `/learning/parent-report-detailed?mode=summary`

These are the real report routes and logic.

## Known limitation

`Generate preview` can rarely need a retry because session generation depends on time anchor.  
`Apply` should not rebuild and should use the staged preview snapshot directly.

