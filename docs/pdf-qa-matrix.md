# PDF QA Matrix (Finished Product Gate)

Scope: `parent-report` and `parent-report-detailed` print/export quality.

## Pass/fail criteria (blocking)

- no clipping of text/cards/tables/charts
- stable page breaks (no broken section headers, no isolated labels)
- readable tables and charts in print media
- no abnormal empty regions between sections
- consistent spacing and typography
- PDF output not less professional than on-screen layout

Any failed criterion in one scenario is a blocking fail.

## Execution evidence

- Visual capture script: `node scripts/qa-parent-pages-visual.mjs`
- Output folder: `qa-visual-output`
- Coverage:
  - viewports: `360x800`, `390x844`, `768x1024`, `1366x768`, `1440x900`
  - pages: `/learning/parent-report`, `/learning/parent-report-detailed`
  - modes: screen, print media, summary mode

## Matrix (reopened)

| Scenario | Clipping | Page breaks | Table/chart readability | Empty gaps | Spacing/typography | Professional parity | Verdict |
|---|---|---|---|---|---|---|---|
| parent-report (desktop print) | pass | pass | pass | pass | pass | pass | pass |
| parent-detailed (desktop print) | **fail (artifact report)** | **fail (artifact report)** | **fail (artifact report)** | **fail (artifact report)** | fail | fail | **fail** |
| parent-detailed (desktop summary print) | **fail (artifact report)** | **fail (artifact report)** | **fail (artifact report)** | **fail (artifact report)** | fail | fail | **fail** |
| parent-detailed (mobile-derived print) | **fail (artifact report)** | **fail (artifact report)** | **fail (artifact report)** | **fail (artifact report)** | fail | fail | **fail** |
| parent-report (tablet print) | pass | pass | pass | pass | pass | pass | pass |

## Reopen reason

- User-validated PDF artifact showed large empty/gray regions (not acceptable for finished-product quality).
- Text contrast/readability fell below required standard in several pages.
- Previous matrix pass is invalidated by artifact-first gate rule.

## Fix pass execution (current)

- Applied print-layout fixes in `pages/learning/parent-report-detailed.js`:
  - removed global `visibility: hidden` print strategy
  - removed absolute-position print container strategy
  - reduced aggressive `break-inside: avoid` on large blocks
  - enforced high-contrast print text defaults
  - simplified heavy gradient print backgrounds to clean white + bordered cards
- New artifact export script: `scripts/qa-parent-pdf-export.mjs`
- New generated PDF artifacts:
  - `qa-visual-output/parent-detailed-full.pdf`
  - `qa-visual-output/parent-detailed-summary.pdf`
- Refreshed visual print artifacts:
  - `qa-visual-output/d1366__parent-detailed__printmedia.png`
  - `qa-visual-output/d1440__parent-detailed__printmedia.png`
  - `qa-visual-output/m390__parent-detailed__printmedia.png`
  - `qa-visual-output/tab768__parent-detailed__printmedia.png`

## Post-fix matrix (retest)

| Scenario | Clipping | Page breaks | Table/chart readability | Empty gaps | Spacing/typography | Professional parity | Verdict |
|---|---|---|---|---|---|---|---|
| parent-detailed full PDF (new artifact) | pass | pass | pass | pass | pass | pass | pass (awaiting reviewer sign-off) |
| parent-detailed summary PDF (new artifact) | pass | pass | pass | pass | pass | pass | pass (awaiting reviewer sign-off) |

## Signed gate

- PDF reviewer: **Pending re-sign after artifact review**
- UI reviewer: **Pending re-sign after artifact review**
- Gate result: **REOPENED (blocking gate not closed yet)**
