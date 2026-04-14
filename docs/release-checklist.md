# Release Checklist (Internal Finished Product)

## Must be true before internal release

- [x] V2 is primary authority in parent + detailed flows.
- [x] Legacy path is explicit fallback only.
- [x] No open blocking engine/contract/authority failures.
- [ ] Wording gate is signed (`docs/wording-qa-matrix.md`) — reopened after artifact quality findings.
- [ ] PDF gate is signed (`docs/pdf-qa-matrix.md`) — reopened (artifact-first, pending visual approval after card-cutting fix).
- [ ] Manual QA gate is signed (`docs/manual-qa-matrix.md`) — reopened with PDF gate.
- [x] Full automated matrix passed (`docs/full-test-matrix.md`).
- [x] Pedagogical verdict remains GO with no blocking issues.
- [x] Production build passes.

## Must not remain open

- [x] no unresolved blocking bug
- [x] no unresolved wording blocking issue
- [ ] no unresolved PDF blocking issue
- [ ] no unresolved wording blocking issue
- [x] no unresolved fallback/authority ambiguity

## Internal release verdict

- Finished internal product: **NOT READY**
- External release claim: **NOT CLAIMED**
