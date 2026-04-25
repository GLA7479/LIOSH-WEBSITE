# Skill coverage audit (Phase 7.15)

- **Generated:** 2026-04-25T00:52:28.464Z
- **Phase 7.14 baseline (pre-join hardening):** zero 88, weak 60, adequate 244, uncertain 31
- **Skills checked:** 423
- **Zero / weak / adequate / uncertain:** 0 / 7 / 416 / 0
- **Uncertain (coverage class):** 0
- **Hebrew content-map spine rows:** 88

## By subject (zero)

```json
{}
```

## Recommended next fixes

- Optional: tag english_pool_item rows with vocabulary_list_key / grammar_line_id for exact wordlist/grammar-line joins (Phase 7.15 uses heuristics).
- Optional: per-curriculum-line spine_skill_id on geography bank rows to upgrade weak→adequate without substring heuristics.
- Triage any remaining zero Hebrew content_map rows (true bank gaps vs. resolver edge cases).
- Triage remaining weak math kinds — expand harness further or accept low-frequency kinds.
