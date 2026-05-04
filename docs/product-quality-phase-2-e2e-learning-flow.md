# Product Quality Phase 2 — E2E Learning Flow Verification

**Last updated:** 2026-05-04 (Phase 2B — **local env blocker resolved**; full manual + DB verification **pending** — see **§9**)  
**Scope:** Real student learning path (login → subject → session → 3 answers → finish) with **browser** + **Supabase** checks, and a light pass on **parent report** visibility.  
**Out of scope (per product rules):** security/coins hardening, dev-only routes, UI redesign, Hebrew copy edits, Parent AI behavior changes, question banks, broad refactors.

---

## 1. Purpose

Prove that the **production-shaped** flow persists data correctly:

| Step | Client | Server |
|------|--------|--------|
| Login | `POST /api/student/login` | `student_sessions` + cookie |
| Start | `POST /api/learning/session/start` | `learning_sessions` (`status=active`) |
| Answer ×3 | `POST /api/learning/answer` | `answers` rows |
| Finish | `POST /api/learning/session/finish` | `learning_sessions` (`status=completed`, `ended_at`, `metadata.summary`) |
| Parent | parent auth + report route / API | Aggregates from DB-backed activity |

Reference implementation (server): `pages/api/student/login.js`, `pages/api/learning/session/start.js`, `pages/api/learning/answer.js`, `pages/api/learning/session/finish.js`.

---

## 2. Prerequisites

### 2.1 Environment variables

Required for **real** student auth and API crypto (see `lib/learning-supabase/student-auth.js`):

- `NEXT_PUBLIC_LEARNING_SUPABASE_URL`
- `NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY`
- `LEARNING_SUPABASE_SERVICE_ROLE_KEY`
- **`LEARNING_STUDENT_ACCESS_SECRET`** — required for HMAC on access codes / session tokens; **without it**, login and authenticated learning APIs will fail at runtime.

Template: [`.env.example`](../.env.example).

**Local env merge for CLI checks:** `node scripts/run-verify-learning-env.mjs` loads `.env` then applies `.env.local` **overrides** (same precedence idea as Next.js) and runs `scripts/verify-learning-supabase-env.mjs`. Use this to confirm variables **without** pasting secrets into the shell.

### 2.2 Test identity

- A **student** row in `public.students` linked to a parent.
- An active **`student_access_codes`** row (username/code + PIN as created by the parent flow).
- Parent can sign in (Supabase Auth) and open the report for that `student_id`.

### 2.3 App URL

- Default dev: `http://127.0.0.1:3001` (`npm run dev`).
- Playwright default `baseURL` matches [`playwright.config.ts`](../playwright.config.ts) (`PORT` / `PLAYWRIGHT_BASE_URL`).

---

## 3. Minimal manual E2E protocol (single subject)

Use **one** subject end-to-end (example: **מדעים** — straightforward MCQ surface).

1. **Student login** — `/student/login` (or the route your shell uses after gate): submit username/code + 4-digit PIN. Expect **200** from `POST /api/student/login` and redirect into learning shell.
2. **Choose subject** — Navigate to e.g. `/learning/science-master` (or `/learning/math-master`, etc.).
3. **Start practice** — Start the game/practice control so the client calls **`POST /api/learning/session/start`** with a valid `subject` (and optional `topic`). Network tab: expect **200**, body includes `learningSessionId`.
4. **Answer 3 questions** — Each graded interaction should call **`POST /api/learning/answer`** with `learningSessionId`, `subject`, `isCorrect`, `questionId` (or fingerprint). Expect **200** ×3.
5. **Finish session** — Stop / complete flow so the client calls **`POST /api/learning/session/finish`** with the same `learningSessionId` and summary fields. Expect **200**.
6. **DB verification** (Supabase SQL editor or Table Editor):
   - `learning_sessions`: one row with `id = learningSessionId`, `student_id` correct, `status = 'completed'`, `ended_at` set, `metadata` contains `summary` (when migration supports full schema).
   - `answers`: **≥ 3** rows with `learning_session_id` = that session and `student_id` matching the student.
7. **Parent report** — As parent, open e.g. `/learning/parent-report` (and optionally `/learning/parent-report-detailed`) with the same student selected / `studentId` in query if applicable. Confirm recent activity reflects the session (subject/time range). API backing: `GET /api/parent/students/[studentId]/report-data` (Bearer parent JWT).
8. **UI sanity** — Scan visible strings for user-facing **`undefined`**, **`null`**, **`NaN`**, or suspicious placeholders like **`00000`** (report charts, stats, labels).

---

## 4. Optional SQL snippets (read-only)

Run in Supabase SQL editor (adjust UUIDs):

```sql
-- Latest sessions for a student
select id, student_id, subject, topic, status, started_at, ended_at, metadata
from public.learning_sessions
where student_id = '<STUDENT_UUID>'
order by started_at desc
limit 10;

-- Answers linked to a session
select id, student_id, learning_session_id, question_id, is_correct, answered_at
from public.answers
where learning_session_id = '<SESSION_UUID>'
order by answered_at asc;
```

---

## 5. Automated UI smoke (not a DB substitute)

[`tests/e2e/active-diagnosis/learning-flows.spec.ts`](../tests/e2e/active-diagnosis/learning-flows.spec.ts) exercises math/geometry/science/english/hebrew surfaces with a **mocked** `GET /api/student/me` response. It is useful for **UI progression** (next question, modals) but does **not** assert Supabase writes.

Run locally when dev server is reachable:

```bash
npx playwright test tests/e2e/active-diagnosis/learning-flows.spec.ts
```

If port **3001** is already in use, either free it or align `PLAYWRIGHT_BASE_URL` / dev server port with [`playwright.config.ts`](../playwright.config.ts).

---

## 6. Phase 2 run log — 2026-05-04 (this workspace)

| Item | Result |
|------|--------|
| Environment | **Local** intended; **no staging URL** was targeted in this run. |
| `node scripts/run-verify-learning-env.mjs` | **Fail:** `LEARNING_STUDENT_ACCESS_SECRET` **missing** after merging `.env` + `.env.local` (must be set for real student E2E). |
| Playwright E2E | **Not completed** in agent environment: **no reliable localhost HTTP** from automation sandbox to the Next dev server; additionally `webServer` in Playwright targets port **3001** — resolve port conflicts before relying on CI/local runs. |
| DB row verification | **Not executed** here — blocked by incomplete auth env + no safe live session from this runner. |
| Parent dashboard | **Not verified** in-browser here — same blocker. |
| Product code changes | **None** for Phase 2 (docs + env-loader helpers only). |

**Next action for a human / staging:** add `LEARNING_STUDENT_ACCESS_SECRET` to local or host secrets (never commit values), re-run `node scripts/run-verify-learning-env.mjs`, then execute **§3** once on a dedicated student account and record pass/fail in a new row below.

### 6.1 Controlled Playwright smoke — 2026-05-04 (port 3025)

| Item | Result |
|------|--------|
| Server | `npx next dev -p 3025` (the `npm run dev` script hard-codes **3001**; explicit `-p` was used to match a clean port without code edits). |
| `PLAYWRIGHT_BASE_URL` | `http://127.0.0.1:3025` |
| Pre-check | `GET /` → **200** on `127.0.0.1:3025` |
| Playwright | `tests/e2e/active-diagnosis/learning-flows.spec.ts` — **6 passed** in ~51s (chromium, serial). |
| Real student login / Supabase / parent report | **Not covered** by this spec (tests **mock** `GET /api/student/me`); still follow **§3** for full Phase 2. |

---

## 7. Files added for Phase 2 tooling

| File | Role |
|------|------|
| [`scripts/load-env-files.mjs`](../scripts/load-env-files.mjs) | Load `.env` / `.env.local` for Node CLI without adding npm deps. |
| [`scripts/run-verify-learning-env.mjs`](../scripts/run-verify-learning-env.mjs) | Runs learning Supabase env verification after loading env files. |

---

## 8. Recommended next step

After `LEARNING_STUDENT_ACCESS_SECRET` is configured and a test student exists: perform **one** full manual pass of **§3**, paste anonymized Network timestamps + SQL row counts into §6 (new subsection), then consider adding a **non-mocked** Playwright scenario behind `E2E_REAL_STUDENT_*` env vars (optional, separate PR).

---

## 9. Phase 2B — Real learning flow + DB verification

**Definition of done (Phase 2B):** one **manual** (preferred) or approved automation run that uses **real** `POST /api/student/login`, real `learningSessionId`, **3** `POST /api/learning/answer` calls, `POST /api/learning/session/finish`, then **read** confirmation in Supabase for `learning_sessions` + `answers`, then parent report UI for the same `student_id`, plus a quick scan for bad UI tokens (`undefined`, `null`, `NaN`, `00000`, broken Hebrew/RTL).

**Not in scope for Phase 2B:** the Playwright file in **§5** (mocked `GET /api/student/me`); that remains **Phase 2A smoke** only.

### 9.1 Local environment blocker — **resolved** (2026-05-04)

| Check | Result |
|-------|--------|
| `LEARNING_STUDENT_ACCESS_SECRET` | **Added** to **`.env.local` only** (32-byte hex via `crypto.randomBytes`; value **not** committed — see `.gitignore` for `.env*.local`). Existing lines in `.env.local` (e.g. engine-review flags) were **preserved**. |
| `node scripts/run-verify-learning-env.mjs` | **Pass** — all required learning env vars report present, including `LEARNING_STUDENT_ACCESS_SECRET`. |
| Local app | `next dev` can load `.env.local` with the new variable; start the app with e.g. `npx next dev -p <port>` or `npm run dev` (see §2.3). |

### 9.2 Critical: secret must match access-code hashes in Supabase

`student_access_codes` stores **HMAC hashes** derived with `LEARNING_STUDENT_ACCESS_SECRET` (see `lib/learning-supabase/student-auth.js`). If you set a **new** random local secret, it will only validate codes that were **issued while that same secret was active**. Codes created under another secret (e.g. staging or an older local value) will **not** log in until:

- you align `.env.local` with the secret used when those codes were created, **or**
- a parent re-creates student access codes using the app while your local server uses the intended secret.

Do **not** paste the secret into docs, tickets, or chat logs.

### 9.3 Full Phase 2B manual verification — **pending**

Real login → 3 answers → finish → DB (`learning_sessions`, `answers`) → parent report → UI scan (**§3**) was **not** executed as part of this env-only fix (requires a **human** tester + valid credentials aligned with **§9.2**).

| Gate | State |
|------|--------|
| Manual browser E2E (**§3**) | **Pending** |
| Supabase row checks | **Pending** |
| Parent report / dashboard | **Pending** |

**Summary:** Phase **2B environment** is **unblocked**. Phase **2B product verification** (manual end-to-end + DB + parent UI) remains **pending** until completed and recorded below.

### 9.4 Audit trail — fill after a successful manual run

| Field | Value |
|-------|--------|
| Date | |
| Environment | local / staging URL |
| Subject | e.g. math / english |
| `learning_session` id | (optional: last 4 chars only) |
| `answers` count for session | expected **3** |
| Parent report spot-check | pass / fail |
| UI strings scan | pass / fail |
