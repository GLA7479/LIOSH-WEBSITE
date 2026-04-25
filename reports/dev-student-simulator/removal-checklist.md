# Dev Student Simulator Removal Checklist

Use this checklist to fully remove the simulator feature from the repository.

## 1) Remove routes

- Remove page:
  - `pages/learning/dev-student-simulator.js`
- Remove APIs:
  - `pages/api/dev-student-simulator/login.js`
  - `pages/api/dev-student-simulator/logout.js`

## 2) Remove UI + auth helpers

- Remove component:
  - `components/dev-student-simulator/DevStudentSimulatorClient.jsx`
- Remove server auth helper:
  - `utils/server/dev-student-simulator-auth.js`

## 3) Remove simulator utility layer

- Remove:
  - `utils/dev-student-simulator/*`

## 4) Remove simulator scripts

- Remove:
  - `scripts/dev-student-simulator-*`

## 5) Remove reports/artifacts (optional but recommended for cleanup)

- Remove:
  - `reports/dev-student-simulator/*`

## 6) Remove package scripts

- Remove package scripts related to simulator tests/QA (for example):
  - `test:dev-student-simulator-browser-storage`
  - any `dev-student-simulator-*` script entries

## 7) Remove env vars

- Remove:
  - `ENABLE_DEV_STUDENT_SIMULATOR`
  - `DEV_STUDENT_SIMULATOR_PASSWORD`

## 8) Grep verification after removal

Run:

- `grep -R "dev-student-simulator" .`
- `grep -R "ENABLE_DEV_STUDENT_SIMULATOR" .`
- `grep -R "DEV_STUDENT_SIMULATOR_PASSWORD" .`
- `grep -R "mleo_dev_student_simulator_metadata_v1" .`

Expected:

- no remaining feature references (except maybe old docs/changelog if intentionally kept)

## 9) Security and behavior checks

- Confirm no `NEXT_PUBLIC` secret exists for simulator auth.
- Confirm simulator route is inaccessible / 404 when feature is disabled.
- Confirm no public navigation/menu references remain.

## 10) Non-goals (do not do during removal)

- Do not migrate existing `mleo_*` storage keys.
- Do not rename storage keys.
- Do not introduce `leok_*` keys.

