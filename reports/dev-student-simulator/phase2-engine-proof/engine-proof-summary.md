# Phase 2.5 Engine Proof

- Total presets: 6
- PASS: 6
- FAIL: 0

## Per preset

| Preset | PASS | No-data month | Insufficient evidence | Main status | Main priority | Primary subject | Story issues |
|---|:---:|:---:|:---:|---|---|---|---|
| simDeep01_mixed_real_child | PASS | no | no | בנושא נפח: שוכח עומק | עם סימון זווית/צלע | english | - |
| simDeep02_strong_stable_child | PASS | no | no | בנושא בעיות מילוליות — כיתה ה׳ — רמה בינונית: מספר נכון + יחידה שגויה | עם/בלי שדה יחידה | math | - |
| simDeep03_weak_math_long_term | PASS | no | no | בנושא בעיות מילוליות — כיתה ד׳ — רמה בינונית: מספר נכון + יחידה שגויה | עם/בלי משפט כפל | math | - |
| simDeep04_improving_child | PASS | no | no | בנושא חיבור — כיתה ד׳ — רמה בינונית: שגיאה בעמודת עשרות | חיבור עם העברה בחיבור ובלי העברה | math | - |
| simDeep05_declining_after_difficulty_jump | PASS | no | no | בנושא כפל — כיתה ה׳ — רמה קשה: אותם זוגות שגויים | זמן כפול לאותו סט | math | - |
| simDeep06_fast_careless_vs_slow_accurate_mix | PASS | no | yes | אין מספיק ראיות בשלב זה. | להמשיך תרגול קצר ומדויק עם משימה אחת ברורה. | math | - |

## touchedKeys policy proof

- identicalTouchedKeysAcrossPresets: true
- allPresetsSameTopStoryWhenInactiveKeysPruned: true
- Conclusion: Identical touchedKeys do not confuse the real report engine for these presets.
