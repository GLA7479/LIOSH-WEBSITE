# Phase 2.5 Engine Proof

- Total presets: 6
- PASS: 6
- FAIL: 0

## Per preset

| Preset | PASS | No-data month | Insufficient evidence | Main status | Main priority | Primary subject | Story issues |
|---|:---:|:---:|:---:|---|---|---|---|
| simDeep01_mixed_real_child | PASS | no | no | בנושא שברים — כיתה ד׳ — רמה בינונית: השוואה לפי מונה בלבד | עם/בלי משפט כפל | math | - |
| simDeep02_strong_stable_child | PASS | no | no | בנושא חיבור — כיתה ה׳ — רמה בינונית: שגיאה בעמודת עשרות | חיבור עם העברה בחיבור ובלי העברה | english | - |
| simDeep03_weak_math_long_term | PASS | no | no | בנושא חיבור — כיתה ד׳ — רמה בינונית: שגיאה בעמודת עשרות | עם/בלי שדה יחידה | math | - |
| simDeep04_improving_child | PASS | no | no | בנושא חיבור — כיתה ד׳ — רמה בינונית: שגיאה בעמודת עשרות | חיבור עם העברה בחיבור ובלי העברה | math | - |
| simDeep05_declining_after_difficulty_jump | PASS | no | no | בנושא כפל — כיתה ה׳ — רמה קשה: אותם זוגות שגויים | זמן כפול לאותו סט | math | - |
| simDeep06_fast_careless_vs_slow_accurate_mix | PASS | no | no | בנושא חיבור — כיתה ד׳ — רמה בינונית: שגיאה בעמודת עשרות | חיבור עם/בלי נשיאה | math | - |

## touchedKeys policy proof

- identicalTouchedKeysAcrossPresets: true
- allPresetsSameTopStoryWhenInactiveKeysPruned: true
- Conclusion: Identical touchedKeys do not confuse the real report engine for these presets.
