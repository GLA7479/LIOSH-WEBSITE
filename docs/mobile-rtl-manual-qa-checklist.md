# Mobile + RTL Manual QA Checklist

Scope: manual checklist only (no code execution, no heavy QA commands).

## Devices / Viewports To Cover
- Small phone: 360x640
- Standard phone: 390x844
- Large phone: 430x932
- Tablet portrait: 768x1024
- Tablet landscape: 1024x768

## Orientation Coverage
- Portrait: required
- Landscape: required

## Core Flow Checklist

### Parent login
- [ ] Page loads correctly in RTL
- [ ] Inputs/buttons visible and clickable on small screens
- [ ] No clipped labels/placeholders
- [ ] Error messages readable and non-overlapping

### Student login
- [ ] Username/PIN fields align correctly in RTL
- [ ] PIN keyboard interaction works on mobile
- [ ] Invalid login error text wraps properly
- [ ] No undefined/null/NaN/00000 output

### Parent dashboard
- [ ] Cards, stats, and actions render in correct RTL order
- [ ] Long Hebrew labels do not overflow containers
- [ ] Scrolling remains smooth and does not trap focus

### Student dashboard
- [ ] Navigation and quick actions remain visible on small screens
- [ ] Touch targets are large enough and not overlapping
- [ ] No clipped buttons in portrait/landscape

### Practice screen
- [ ] Question stem is readable in RTL
- [ ] Answer options maintain clear spacing
- [ ] Timer/status bars (if present) do not overlap headers

### Question answering
- [ ] Selecting answers works with touch
- [ ] Feedback/result states are visible without horizontal scroll
- [ ] No broken text direction for mixed Hebrew/numbers

### Results screen
- [ ] Score/result data displays correctly in RTL
- [ ] No placeholder artifacts (`undefined`, `null`, `NaN`, `00000`)
- [ ] CTA buttons remain visible on all tested devices

### Short report
- [ ] Summary sections render fully on mobile
- [ ] Insight/recommendation cards do not clip
- [ ] Tables/charts (if any) are readable without layout breakage

### Detailed report
- [ ] All sections open/readable in mobile viewport
- [ ] Long Hebrew paragraphs wrap naturally
- [ ] Inline labels and values stay aligned in RTL

### PDF buttons
- [ ] Print/PDF action buttons are visible and not clipped
- [ ] Button texts are readable on small screens
- [ ] Actions do not shift layout unexpectedly

### Parent Copilot
- [ ] Input area usable in mobile keyboard state
- [ ] Responses wrap correctly in Hebrew
- [ ] Suggested action chips are tappable and readable

## UI Components Checklist

### Modals
- [ ] Open/close works on touch
- [ ] Modal content fits viewport height with scroll where needed
- [ ] Focus does not get trapped behind keyboard

### Long Hebrew text
- [ ] No horizontal scrolling caused by long text
- [ ] No broken punctuation direction in RTL
- [ ] Typography stays readable at mobile font sizes

### Tables
- [ ] Headers and rows remain aligned in RTL
- [ ] Overflow behavior is intentional and usable
- [ ] Numeric columns do not visually break alignment

### Charts
- [ ] Axis labels are readable in RTL layout
- [ ] Tooltips/legends do not escape screen bounds
- [ ] No overlapping chart labels on small screens

### Buttons
- [ ] Minimum tap target size maintained
- [ ] No clipped text in Hebrew
- [ ] Disabled/enabled states clearly distinguishable

### Scrolling
- [ ] Page-level scroll works with fixed headers
- [ ] Inner scroll containers do not fight page scroll
- [ ] No hidden CTA under sticky/fixed UI

### Small screens
- [ ] Primary actions remain above fold where required
- [ ] No key content hidden behind collapses without cues

### Landscape/portrait
- [ ] Reflow is stable when rotating
- [ ] No component overlap after orientation switch

## Hard-Fail Conditions (Launch Blockers)
- [ ] Any clipped primary CTA on mobile
- [ ] Any broken RTL direction in critical flows
- [ ] Any `undefined` / `null` / `NaN` / `00000` in user-facing UI
- [ ] Any login/report/copilot flow inaccessible on mobile

## Execution Notes (After Simulation Finishes)
- Use this checklist during post-simulation manual QA pass.
- Record each failure with screenshot + route + device + orientation.
