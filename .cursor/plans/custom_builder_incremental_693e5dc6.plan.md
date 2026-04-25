---
name: Custom Builder incremental
overview: Transform the Custom Builder from a random per-session topic picker + full-key snapshot replace into a true topic-level dynamic editor. Default Apply = replace/update only the selected subject/topic units (remove tagged simulator rows for those units, add new rows), never append by default, never full replace by default. Deterministic per-topic generation, full canonical topic lists, explicit preview table, extended metadata (affectedUnits), session/mistake tagging, merge module. No report pages, no subject master pages, no storage key renames.
todos:
  - id: tag-sessions
    content: "Tag every simulator session + mistake: origin dev-student-simulator, simulatorRunId, simulatorSubject, simulatorTopic"
    status: completed
  - id: topic-spec
    content: topicSettings per subject with mandatory per-topic controls; applyMode with default replaceSelectedTopicsOnly
    status: completed
  - id: per-topic-gen
    content: Deterministic buildSessions—no random bucket as primary mechanism; alloc per topic with targetQuestions
    status: pending
  - id: merge-layer
    content: snapshot-merge remove tagged rows for selected units only, add new, rebuild dailies/progress; append + fullSplit modes
    status: completed
  - id: metadata-affected
    content: affectedUnits in metadata; keep effectiveTouchedKeys, touchedKeys, backupByKey; Reset unchanged
    status: completed
  - id: apply-wiring
    content: browser-storage + core + client default path = merge selected topics only; presets may use full replace
    status: pending
  - id: ui-table
    content: Compact topic control table, Hebrew, RTL, internal keys behind toggle; preview table all selected topics + apply mode column
    status: completed
  - id: tests-qa
    content: Extend self-tests for 3-topic preview, single-topic apply isolation, replace no dup, append growth, reset, i18n keys
    status: pending
isProject: false
---

# Plan: Dynamic topic-level Custom Builder (strict rules)

**Product goal:** This is not “another child generator.” It is a **dynamic, topic-level editor** for simulated student data.

The plan is **directionally approved**; the following sections **harden** implementation so the result is not “approximately” correct.

---

## A. Real issues (unchanged analysis)

- [`buildSessionsFromCustomSpec`](utils/dev-student-simulator/custom-session-builder.js) picks **one random topic per session** from `subjects[s].topics`, so many checked topics are **not** guaranteed their own data distribution.
- [`buildStorageSnapshotFromSessions`](utils/dev-student-simulator/snapshot-builder.js) + [`applyMetadataThenSnapshot`](utils/dev-student-simulator/browser-storage.js) **replace** whole `mleo_*` key payloads—**not** merge at topic granularity.

---

## B. Critical product rule (default Apply)

**Default must NOT be:** full snapshot replace, random topic distribution, or **append** (append would duplicate on repeated Apply and distort reports).

**Default MUST be:**

**`עדכון / החלפת הנושאים שנבחרו בלבד`**

- Changing only e.g. `division_with_remainder` updates **only** that topic’s generated data in storage.
- Other subjects/topics stay **unchanged** (as stored before Apply for those buckets).
- **Reset** is the only user action that restores **everything** to the previous backup / zero per existing safety model.

---

## C. Apply modes (Hebrew in UI, strict semantics)

| Mode | Hebrew label | Behavior |
|------|--------------|----------|
| **Default** | `עדכון הנושאים שנבחרו בלבד` (or equivalent) | For each selected (subject, topic) unit: **remove** previous rows tagged as simulator for **that** unit only; **add** newly generated rows for that unit. **No** append of duplicates. Unrelated topics untouched. |
| **Optional** | `הוספה לנתונים קיימים` | **Append** new simulator rows for selected topics; **do not** remove previous rows. Use only when user explicitly wants accumulation. **Not default.** |
| **Optional** | `החלפת כל הסימולציה` | Full snapshot replace (current preset-style behavior for custom if chosen). **Not default.** Must show a **strong warning** before confirm. |

**Do not** make append the default.

Presets can keep their existing “full build” path; Custom Builder default path = **selected-topic replace/update only** (default row above).

---

## D. Per-topic controls (mandatory)

For **every** topic the user can enable in the table, a **dedicated row** with:

- פעיל (enabled)
- מספר שאלות
- דיוק %
- רמה
- מצב
- משך סשן ממוצע (דקות) → internal seconds
- מגמה (per topic, not only global)
- חוזק טעויות חוזרות
- פרופיל קצב / responseMs (per topic if specified)

**Subject-level** fields (weight, etc.) = **defaults only** for that subject; **topic-level overrides** subject defaults when both exist.

**Spec shape** (illustrative): `subjects[subjectId].topicSettings: Record<topicKey, TopicRow>` with fields above. Align names with [`custom-validator.js`](utils/dev-student-simulator/custom-validator.js) + builder.

---

## E. Deterministic generation (not random as main mechanism)

For **each** enabled topic with `questions > 0`:

- Generate sessions **only** for `bucket === that topic` (and correct subject).
- Allocate to match that topic’s question count (split across sessions as needed).
- correct/wrong from **that** topic’s accuracy.
- **That** topic’s trend (and per-topic mistake settings where applicable).
- If user selects 5 topics, **preview** must list **all 5** with numbers. **If any selected topic is missing** from preview → **broken**, must not ship.

**Do not** use `topicList[Math.floor(rng() * topicList.length)]` as the main allocation mechanism for the default product path.

---

## F. Merge behavior (by storage shape)

**Math:** update only the relevant `mleo_time_tracking.operations[topicKey]` (and related aggregates), only relevant `mleo_mistakes` entries, only relevant `mleo_math_master_progress` derivation—after merge, recompute from merged tracking.

**Non-math:** update only the relevant `topics[topicKey]` in the subject’s time-tracking key, only relevant `*_mistakes` rows, only relevant progress.

**Daily** totals: recompute consistently after merge (reuse or extract `rebuildDailyMath` / `rebuildDailyTopic` patterns from [`snapshot-builder.js`](utils/dev-student-simulator/snapshot-builder.js)).

**Do not** wipe unrelated operation/topic buckets in default mode.

---

## G. Tagging (required for safe replace)

Every simulator-generated **session** row and **mistake** (where possible) must include:

- `origin: "dev-student-simulator"`
- `simulatorRunId` (string, unique per Apply run)
- `simulatorSubject` (e.g. `math`, `hebrew`)
- `simulatorTopic` (bucket id, e.g. `addition`, `division_with_remainder`)

**Do not** assume old data without tags can be split from real app data. **Document** in code/README for dev: one-time `החלפת כל הסימולציה` or Reset may be needed to clean legacy unlabeled simulator rows.

---

## H. Metadata

Extend metadata (same [`SIMULATOR_METADATA_KEY`](utils/dev-student-simulator/metadata.js)) with **`affectedUnits`**, e.g.:

```json
{
  "affectedUnits": [
    { "subject": "math", "topic": "addition", "applyMode": "replaceSelectedTopics" },
    { "subject": "math", "topic": "division_with_remainder", "applyMode": "replaceSelectedTopics" }
  ]
}
```

**Keep** as today: `effectiveTouchedKeys`, `touchedKeys`, `backupByKey` (full key backup before write). **Reset** still restores full previous values for touched keys.

---

## I. Preview (explicit table)

Preview must show a table including at least:

- מקצוע / נושא (Hebrew display + internal key only if debug toggle on)
- שאלות, דיוק, סשנים, רמה, מצב, מגמה
- **מצב החלה** (the Apply mode used for this preview)

If user selects חיבור, חיסור, חילוק עם שארית — **all three** must appear. **If only one row appears, it is broken.**

---

## J. UI rules (no redesign)

- Compact; **no** large cards for topics.
- **Hebrew** labels in normal view; **no** English topic keys unless “הצג מפתחות פנימיים” = ON.
- RTL alignment, compact table / rows.
- Full **canonical** topic list remains ([`canonical-topic-keys.js`](utils/dev-student-simulator/canonical-topic-keys.js) / [`SUBJECT_BUCKETS`](utils/dev-student-simulator/constants.js)); Math must still expose the full `OPERATIONS` set (חיבור through מעורב, etc.); same **principle** for other subjects.

---

## K. Tests required (add or extend)

1. **Preview:** select 3 math topics (`addition`, `multiplication`, `division_with_remainder`) — preview lists **all 3** with per-topic stats.
2. **Default Apply:** apply only `division_with_remainder` — existing `addition` (and others) in storage **unchanged** vs pre-apply state for that bucket.
3. **Replace selected (default) twice** on same topic: **no** duplicate session explosion (idempotent for same spec).
4. **Append mode** (explicit): two Applies — sessions/questions **increase** as expected.
5. **Reset** restores `backupByKey` / prior behavior.
6. **Unknown topic key** blocked by validator.
7. **UI:** normal view does not show English internal keys (smoke/QA or unit where feasible).
8. **Reports:** after Apply, parent report routes still load and are **not** empty solely due to this flow (smoke: [`scripts/dev-student-simulator-phase42-browser-qa.mjs`](scripts/dev-student-simulator-phase42-browser-qa.mjs) or equivalent, updated locators as needed).

---

## L. Files allowed vs not allowed

**Allowed to change:**

- [`custom-session-builder.js`](utils/dev-student-simulator/custom-session-builder.js)
- [`custom-validator.js`](utils/dev-student-simulator/custom-validator.js)
- **New** `snapshot-merge.js` (or `apply-merge.js`)
- [`snapshot-builder.js`](utils/dev-student-simulator/snapshot-builder.js) — tagging helpers, optional export of `rebuildDaily*`, `toProgressMap`
- [`metadata.js`](utils/dev-student-simulator/metadata.js)
- [`browser-storage.js`](utils/dev-student-simulator/browser-storage.js)
- [`core.js`](utils/dev-student-simulator/core.js)
- [`index.js`](utils/dev-student-simulator/index.js)
- [`CustomBuilderPanel.jsx`](components/dev-student-simulator/CustomBuilderPanel.jsx)
- [`DevStudentSimulatorClient.jsx`](components/dev-student-simulator/DevStudentSimulatorClient.jsx)
- Simulator self-tests / QA scripts under `scripts/`

**Not allowed:**

- Report **logic** / parent report **pages**
- Subject **master** pages
- **Auth / routes** unless strictly necessary for the simulator page only
- **Renaming** `mleo_*` keys or touching `leok_*` contract
- New storage key **names** (only new optional **fields inside JSON values** + metadata JSON)

---

## M. Required output after implementation (for the implementer / PR)

1. Exact files changed  
2. How per-topic spec works  
3. How **default** apply mode works (selected topics only)  
4. How selected-topic **merge** works (math + non-math)  
5. How rows are **tagged** (field list)  
6. How `affectedUnits` metadata works  
7. Confirmation **all** selected topics appear in preview  
8. Confirmation applying **one** topic does not change unrelated topics  
9. Tests run and results  
10. Screenshots: topic control table, preview with multiple topics, after single-topic apply  
11. Confirmation: no report/storage key **names** / auth behavior **contract** changed (values + metadata only)

---

## N. Risks (retained + tagging)

- Legacy **untagged** simulator data cannot be surgically removed per topic; document one-time full replace or Reset.
- Merge bugs on `daily` / mistakes / progress: mitigate with unit tests and reuse rebuild functions.
- Optional fields on session objects must remain **optional** for report readers (no report file edits).

---

## O. Suggested implementation order (updated)

1. **Tagging** on all new session + mistake objects (`origin`, `simulatorRunId`, `simulatorSubject`, `simulatorTopic`).  
2. **Spec + validation**: `topicSettings`, per-topic fields, `applyMode` with **default = replace selected topics only**.  
3. **Deterministic** `buildSessionsFromCustomSpec` (per-topic loops).  
4. **`snapshot-merge.js`**: default path removes tagged rows for **affected units** only, injects new rows, rebuilds dailies + progress.  
5. **Metadata** `affectedUnits` + `buildSimulatorMetadata` extension.  
6. **`applyMetadataThenMergedSnapshot`** (or branch) in [`browser-storage.js`](utils/dev-student-simulator/browser-storage.js) + core + client; full replace = explicit + warning.  
7. **UI**: topic table, mode selector (Hebrew), preview table.  
8. **Tests** per section K.

---

## P. Acceptance criteria (stricter)

- **Default** Apply = update/replace **only** selected subject/topic units; no global wipe; **not** append by default.  
- **Random topic pick** is not the primary generation strategy.  
- **Preview** shows **every** selected topic in a table; includes apply mode.  
- **Tagging** as in section G; merge uses tags for removal on default path.  
- **Reset** unchanged in contract (full backup restore for touched keys).  
- **No** changes to report logic files or subject pages; **no** renames of `mleo_*` keys.
