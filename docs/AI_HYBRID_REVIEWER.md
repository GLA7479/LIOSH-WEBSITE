# AI Hybrid — מדריך בודק (פנימי)

מסמך קצר לבדיקה ידנית של שכבת ה־hybrid. לא מצהיר “סיום תוכנית” — רק איך לקרוא ולבדוק.

## איפה רואים את זה במוצר

1. פתח את **הדוח המקיף**: `/learning/parent-report-detailed` (אותה תקופה כמו בדוח המקוצר).
2. **הפעלת ביקורת פנימית** (לא מוצגת להדפסה):
   - כפתור **“הצג ביקורת (מסך בלבד)”**, או
   - `?reviewHybrid=1` בכתובת, או
   - **“הפעל ושמור בדפדפן”** — נשמר ב־`localStorage` תחת המפתח `mleo_internal_hybrid_reviewer`.

## שדות עיקריים — מה הם אומרים

| שדה | משמעות |
|-----|--------|
| `v2AuthoritySnapshot` | צילום סמכות ממנוע V2: `taxonomyId`, אבחון מותר, `snapshotHash` לייצוב. |
| `aiAssist.mode` | `assist` / `rank_only` / `explain_only` / `suppressed` — מה מותר להציג אחרי שערים. |
| `suppressionFlags` | סיבות דיכוי (למשל `v2_cannot_conclude`, `probability_invalid`). |
| `hypothesisRanking` | דירוג היפותזות; `top1Id` + הסתברות = “מה hybrid בחר”. |
| `disagreement` | השוואה ל־V2: `v2TopId` מול `aiTopId`, `severity`, `action`. |
| `probeIntelligence` | הצעת צעד בדיקה הבא (`suggestedProbeId`) — שכבת ניסוח, לא החלפת מנוע V2. |
| `explanations` + `explanationContract` | טקסט להורה/מורה וסטטוס יציאה (`ok` / `fallback` / `failed`). |
| `explanationValidator` | מעבר כללי + פירוט (`boundaryPass`, `evidenceLinkPass`, וכו'). |

## סיכום Shadow מקומי

בלוח הביקורת מוצגים:

- **סה״כ יחידות**
- ספירות לפי מצב: assist / rank_only / explain_only / suppressed
- **מספר התנגשויות** (יחידות עם `hasDisagreement`)
- **פירוט חומרה** רק ביחידות עם התנגשות (low / medium / high)
- פירוט נוסף לפי `severity` לכל היחידות (כולל `none`)

`entriesSampled` משקף דגימה ל־session (shadow/live), לא בהכרח את אותו מספר כמו בדוח אם לא נכתב ל־sessionStorage.

## מה לבדוק בכל יחידה (סדר עבודה)

1. **V2 קודם**: ב־`v2AuthoritySnapshot` — האם `taxonomyId` והאבחון עקביים למה שאתה מכיר מהדוח?
2. **מצב assist**: האם `mode` הגיוני לפי רועש נתונים / `cannotConclude`?
3. **התנגשות**: אם `hasDisagreement` — האם ההפרש בין `v2TopId` ל־`aiTopId` מוסבר (למשל עמימות גבוהה)?
4. **הסבר**: האם הטקסט נשמע בטוח ולא קליני; האם `outputStatus` הוא `ok` או יש fallback מוצדק?
5. **Validator**: `overallPass` false = עצור ובדוק `reasonCodes`.

## טוב / חשוד / רע (כללי)

- **טוב**: `suppressed` כשהנתונים דלים או V2 לא יכול להסיק; אין התנגשות כשהדירוג מתיישב; `validator` עובר.
- **חשוד**: התנגשות עם `severity` גבוה + `calibrationBand` גבוה בעמימות; או `suppress_ai` בלי סיבה ברורה בדגלים.
- **רע**: `outputStatus: failed` חוזר; דגלים אסורים בתוכן; `probability_invalid` בלי דיכוי מתאים.

## ייצוא שורת פקודה (מקרה בודד)

```bash
npm run ai-hybrid:review-export -- --harness weak_sparse --unit-index 0
npm run ai-hybrid:review-export -- --harness hybrid_attaches --json-only
```

עם שחקן מזוהה (דורש seed מלא של אחסון — ברירת מחדל VisualQA בסקריפט):

```bash
npm run ai-hybrid:review-export -- --player VisualQA --period week --unit-index 0
```

(הסקריפט: `scripts/ai-hybrid-review-case-export.ts`.)

הפלט כולל `shadowSummary` ו־`comparison` (V2 מול hybrid) לקובץ טקסט / JSON.
