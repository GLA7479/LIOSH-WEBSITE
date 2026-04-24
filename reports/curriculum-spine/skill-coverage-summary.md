# Skill coverage audit (Phase 7.14)

- **Generated:** 2026-04-24T23:34:29.337Z
- **Skills checked:** 423
- **Zero / weak / adequate / uncertain:** 88 / 60 / 244 / 31
- **Uncertain (coverage class):** 31
- **Hebrew content-map rows (stem inference used in audit):** 88

## By subject (zero)

```json
{
  "hebrew": 11,
  "english": 15,
  "geography": 62
}
```

## Recommended next fixes

- Add explicit skill_id or subtopicId fields to Hebrew audit rows (or export content-map join from generator) to remove stem-inference uncertainty for hebrew:* content_map skills.
- Join english:vocabulary:wordlist:* and english:grammar:line:* spine rows to english_pool_item or generator metadata with stable keys.
- Replace geography description substring heuristic with explicit curriculum-line ↔ question-bank keys in data (or emit geography rows into question-audit items.json).
- For math/geometry kinds listed as zero, run harness with expanded op/grade combos or narrow declared-branches regex if kinds are dead code.
