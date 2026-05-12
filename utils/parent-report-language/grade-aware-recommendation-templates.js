/**
 * Grade-aware parent recommendation templates (Phase 1: math M-02, M-09; Phase 2-A1: M-06; Phase 2-A2–A3: partial M-01 bucketOverrides; Phase 2-B4: math M-04, M-05 fractions — g1_g2 null; Phase 2-C3: math M-03, M-10 bucketOverrides; Phase 2-D3: math M-07, M-08 bucketOverrides only).
 * Slot-specific Hebrew is editorially approved; do not change without sign-off.
 */

/** @typedef {{ actionTextHe: string | null; goalTextHe: string | null; intentDescriptionEn: string }} GradeAwareBandCopy */

/** @typedef {{ g1_g2: GradeAwareBandCopy; g3_g4: GradeAwareBandCopy; g5_g6: GradeAwareBandCopy }} GradeAwareTaxonomyTemplate */

/**
 * Math extended entries: `defaultBands` + optional `bucketOverrides` — M-01 (compare, number_sense, estimation); M-03 (multiplication, factors_multiples, powers); M-10 (division, division_with_remainder, ratio, multiplication); M-07 (word_problems); M-08 (word_problems, sequences, equations, order_of_operations).
 * Legacy math taxonomies remain a flat {@link GradeAwareTaxonomyTemplate}.
 * @typedef {{
 *   defaultBands: GradeAwareTaxonomyTemplate;
 *   bucketOverrides?: Partial<Record<string, GradeAwareTaxonomyTemplate>>;
 * }} GradeAwareMathM01Template
 */

/**
 * @type {Record<string, Record<string, GradeAwareTaxonomyTemplate | GradeAwareMathM01Template>>}
 */
export const GRADE_AWARE_RECOMMENDATION_TEMPLATES = {
  math: {
    "M-09": {
      g1_g2: {
        actionTextHe:
          "כדאי לתרגל חיסור במספרים קטנים בעזרת חפצים, ציור או קו מספרים קצר, ואז לכתוב את אותו רעיון גם כתרגיל מספרי.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בחיסור במספרים קטנים, עם מעבר הדרגתי מעזרים מוחשיים לכתיבה מספרית.",
        intentDescriptionEn:
          "Early subtraction with concrete objects, drawing, or a short number line, then connecting to symbolic notation.",
      },
      g3_g4: {
        actionTextHe:
          "כדאי לתרגל חיסור במאונך עם פריטה, תוך הקפדה על ערך הספרות בכל עמודה. אחרי כל תרגיל בקשו מהילד לבדוק את התשובה בעזרת חיבור הפוך.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בחיסור רב־ספרתי במאונך, בפריטה נכונה ובבדיקת התשובה בעזרת חיבור הפוך.",
        intentDescriptionEn:
          "Multi-digit vertical subtraction with regrouping, place-value attention, and inverse addition check.",
      },
      g5_g6: {
        actionTextHe:
          "כדאי לתרגל חיסור במספרים גדולים או בהקשר רב־שלבי, עם אומדן לפני הפתרון ובדיקת סבירות בסיום. בקשו מהילד להסביר את דרך החישוב ולא רק לכתוב תשובה.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בחיסור כחלק מפתרון בעיות, כולל אומדן, בדיקת סבירות והסבר קצר של דרך הפתרון.",
        intentDescriptionEn:
          "Upper-grade subtraction with larger numbers or multi-step contexts, estimation before solving, reasonableness check, and explanation of strategy.",
      },
    },
    "M-02": {
      g1_g2: {
        actionTextHe:
          "כדאי לתרגל חיבור במספרים קטנים בעזרת חפצים, ציור או מסגרת עשר, ואז לכתוב את אותו רעיון גם כתרגיל מספרי.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בחיבור במספרים קטנים, עם מעבר הדרגתי מעזרים מוחשיים לכתיבה מספרית.",
        intentDescriptionEn:
          "Early addition with concrete objects, drawing, or ten-frame support, then connecting to symbolic notation.",
      },
      g3_g4: {
        actionTextHe:
          "כדאי לתרגל חיבור במאונך עם נשיאה, תוך הקפדה על ערך הספרות בכל עמודה. אחרי כל תרגיל בקשו מהילד להסביר היכן הייתה נשיאה ולבדוק אם התשובה הגיונית.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בחיבור רב־ספרתי במאונך, בנשיאה נכונה ובבדיקת הסבירות של התשובה.",
        intentDescriptionEn:
          "Multi-digit vertical addition with carrying, place-value attention, and reasonableness check.",
      },
      g5_g6: {
        actionTextHe:
          "כדאי לתרגל חיבור במספרים גדולים או בהקשר רב־שלבי, עם אומדן לפני הפתרון ובדיקת סבירות בסיום. בקשו מהילד להסביר את דרך החישוב ולא רק לכתוב תשובה.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בחיבור כחלק מפתרון בעיות, כולל אומדן, בדיקת סבירות והסבר קצר של דרך הפתרון.",
        intentDescriptionEn:
          "Upper-grade addition with larger numbers or multi-step contexts, estimation before solving, reasonableness check, and explanation of strategy.",
      },
    },
    "M-06": {
      g1_g2: {
        actionTextHe:
          "כדאי לתרגל אומדן ועיגול במספרים שלמים קטנים, בעזרת קו מספרים או סימון העשרת הקרובה. בכל תרגיל בקשו מהילד להסביר אם המספר קרוב יותר למספר הקטן או הגדול.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בהבנה של קירוב מספרים: לאן המספר קרוב יותר, ולמה.",
        intentDescriptionEn:
          "Early estimation and simple rounding with whole numbers, using number-line distance and nearest ten reasoning.",
      },
      g3_g4: {
        actionTextHe:
          "כדאי לתרגל עיגול והשוואת מספרים לפי ערך הספרות, במיוחד עשרות, מאות ואלפים. לפני החישוב בקשו מהילד לומר לאיזה מספר התשובה בערך צריכה להיות קרובה.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בעיגול לפי ערך מקום ובבדיקת סבירות של תשובות במספרים שלמים.",
        intentDescriptionEn:
          "Rounding and comparing whole numbers by place value, with estimation before calculating and reasonableness checks.",
      },
      g5_g6: {
        actionTextHe:
          "כדאי לתרגל עיגול והשוואה במספרים עשרוניים, אחוזים או תרגילים עם אומדן. בקשו מהילד להסביר לפי איזו ספרה הוא מעגל, ואז לבדוק אם התוצאה הסופית סבירה.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בעיגול, השוואה ואומדן במספרים עשרוניים או באחוזים, עם בדיקת סבירות בסיום.",
        intentDescriptionEn:
          "Upper-grade rounding, comparison, and estimation with decimals or percentages, including place-value explanation and final reasonableness check.",
      },
    },
    "M-04": {
      g1_g2: {
        actionTextHe: null,
        goalTextHe: null,
        intentDescriptionEn:
          "Do not provide formal fraction comparison recommendations for grades 1–2 unless product evidence explicitly supports it.",
      },
      g3_g4: {
        actionTextHe:
          "כדאי לתרגל השוואת שברים בעזרת ציור מדויק או סרגל שברים, ואז להסביר מה מייצג המונה ומה מייצג המכנה. בשברים בעלי אותו מכנה, בקשו מהילד להסביר מדוע משווים לפי מספר החלקים שנלקחו.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בהשוואת שברים ובהבנת תפקיד המונה והמכנה, במיוחד בשברים בעלי אותו מכנה או בייצוגים פשוטים וברורים.",
        intentDescriptionEn:
          "Grade 3–4 fraction comparison through visual representation, numerator/denominator meaning, and same-denominator comparison reasoning.",
      },
      g5_g6: {
        actionTextHe:
          "כדאי לתרגל השוואת שברים בעזרת שברים שקולים, מכנה משותף או אומדן ביחס ל־0, חצי ו־1. בקשו מהילד להסביר מדוע שבר אחד גדול מאחר, ולא להסתמך רק על גודל המונה או המכנה.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בהשוואת שברים בעזרת שברים שקולים, מכנה משותף ואומדן, עם נימוק ברור לכל השוואה.",
        intentDescriptionEn:
          "Grade 5–6 fraction comparison using equivalent fractions, common denominators, benchmark fractions, and explicit reasoning.",
      },
    },
    "M-05": {
      g1_g2: {
        actionTextHe: null,
        goalTextHe: null,
        intentDescriptionEn:
          "Do not provide formal fraction operation recommendations for grades 1–2 unless product evidence explicitly supports it.",
      },
      g3_g4: {
        actionTextHe:
          "כדאי לתרגל חיבור וחיסור שברים בעלי אותו מכנה. בקשו מהילד להסביר שהמכנה מתאר את גודל החלקים, ולכן מחברים או מחסרים את המונים ובודקים שהתוצאה מתאימה לשלם.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בחיבור וחיסור שברים בעלי אותו מכנה, תוך שמירה על משמעות המכנה ובדיקת סבירות התוצאה.",
        intentDescriptionEn:
          "Grade 3–4 fraction addition/subtraction with same denominators, focusing on denominator meaning, numerator operation, and reasonableness.",
      },
      g5_g6: {
        actionTextHe:
          "כדאי לתרגל חיבור וחיסור שברים עם מכנים שונים בעזרת מציאת מכנה משותף, יצירת שברים שקולים ובדיקת התוצאה לאחר הפעולה. בקשו מהילד להסביר כל שלב לפני שהוא מפשט את התשובה.",
        goalTextHe:
          "בשבוע הקרוב התמקדו בפעולות חיבור וחיסור בשברים עם מכנים שונים: מכנה משותף, שברים שקולים, ביצוע הפעולה ובדיקת סבירות.",
        intentDescriptionEn:
          "Grade 5–6 fraction addition/subtraction with unlike denominators, using common denominators, equivalent fractions, step explanation, and reasonableness checks.",
      },
    },
    "M-03": {
      defaultBands: {
        g1_g2: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-03 default: no approved parent copy; use bucketOverrides (multiplication, factors_multiples, powers) or engine fallback.",
        },
        g3_g4: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-03 default: no approved parent copy; use bucketOverrides (multiplication, factors_multiples, powers) or engine fallback.",
        },
        g5_g6: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-03 default: no approved parent copy; use bucketOverrides (multiplication, factors_multiples, powers) or engine fallback.",
        },
      },
      bucketOverrides: {
        multiplication: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn:
              "Do not provide formal multiplication recommendations for grades 1–2 unless product evidence explicitly supports it.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל כפל דרך קבוצות שוות, מערכים ופירוק תרגילים לעובדות מוכרות. בקשו מהילד להסביר איזו עובדת כפל הוא מזהה ואיך היא עוזרת לו לפתור את התרגיל.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בחיזוק עובדות כפל ובהבנת כפל כקבוצות שוות או מערך, עם הסבר קצר של דרך הפתרון.",
            intentDescriptionEn:
              "Grade 3–4 multiplication through equal groups, arrays, known facts, and explaining the chosen strategy.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל כפל במספרים גדולים יותר בעזרת פירוק מספרים, אומדן ובדיקת סבירות. בקשו מהילד להסביר את שלבי החישוב ולבדוק אם התוצאה מתאימה לגודל המספרים.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בכפל עם פירוק מספרים, אומדן ובדיקת סבירות של התוצאה.",
            intentDescriptionEn:
              "Grade 5–6 multiplication with decomposition, estimation, multi-step calculation, and reasonableness checks.",
          },
        },
        factors_multiples: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn: "Do not provide formal factors/multiples recommendations for grades 1–2.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל כפולות וגורמים דרך סדרות כפל, לוחות כפל וחיפוש דפוסים. בקשו מהילד להסביר מדוע מספר מסוים הוא כפולה או גורם, ולא רק לסמן תשובה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בזיהוי כפולות וגורמים בעזרת דפוסי כפל והסבר מילולי.",
            intentDescriptionEn:
              "Grade 3–4 factors and multiples through multiplication patterns, times tables, and verbal explanation.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל גורמים וכפולות בהקשרים רחבים יותר, כמו פירוק מספר לגורמים, מציאת כפולות משותפות ובדיקת קשרים בין מספרים. בקשו מהילד לנמק את הבחירה שלו לפי תכונות המספרים.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בגורמים, כפולות וקשרים בין מספרים, כולל נימוק לפי תכונות המספר.",
            intentDescriptionEn:
              "Grade 5–6 factors and multiples using factorization, common multiples, number properties, and explicit justification.",
          },
        },
        powers: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn: "Do not provide powers/exponents recommendations for grades 1–2.",
          },
          g3_g4: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn:
              "Keep powers/exponents null for grades 3–4 unless product evidence explicitly supports formal exponent work.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל חזקות כהכפלה חוזרת, למשל להבין ש־3 בחזקת 4 פירושו 3 כפול עצמו ארבע פעמים. בקשו מהילד לפרק את החזקה לכפל ולבדוק את סדר הפעולות בתרגיל.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בהבנת חזקות כהכפלה חוזרת ובשימוש נכון בהן בתוך תרגילים.",
            intentDescriptionEn:
              "Grade 5–6 powers as repeated multiplication, unpacking exponent notation and applying order of operations.",
          },
        },
      },
    },
    "M-10": {
      defaultBands: {
        g1_g2: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-10 default: no approved parent copy; use bucketOverrides (multiplication, division, division_with_remainder, ratio) or engine fallback.",
        },
        g3_g4: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-10 default: no approved parent copy; use bucketOverrides (multiplication, division, division_with_remainder, ratio) or engine fallback.",
        },
        g5_g6: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-10 default: no approved parent copy; use bucketOverrides (multiplication, division, division_with_remainder, ratio) or engine fallback.",
        },
      },
      bucketOverrides: {
        multiplication: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn:
              "Do not provide inverse multiplication/division recommendations for grades 1–2 unless product evidence explicitly supports it.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל את הקשר בין כפל לחילוק בעזרת משפחות תרגילים. אחרי פתרון תרגיל, בקשו מהילד לכתוב תרגיל הפוך ולבדוק אם הוא מחזיר לאותו מספר.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בקשר בין כפל לחילוק ובבדיקת תשובות בעזרת פעולה הפוכה.",
            intentDescriptionEn:
              "Grade 3–4 inverse relationship between multiplication and division using fact families and inverse checks.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל בחירה בין כפל לחילוק בבעיות שבהן יש יחס או קשר כפלי בין כמויות. בקשו מהילד להסביר מדוע הפעולה שבחר מתאימה, ולבדוק את התשובה בעזרת הפעולה ההפוכה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בזיהוי מתי מתאים להשתמש בכפל ומתי בחילוק, במיוחד בקשרים כפליים ובבדיקה בעזרת פעולה הפוכה.",
            intentDescriptionEn:
              "Grade 5–6 choosing multiplication vs division in multiplicative relationships, explaining operation choice, and checking with inverse operation.",
          },
        },
        division: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn:
              "Do not provide formal division recommendations for grades 1–2 unless product evidence explicitly supports it.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל חילוק דרך חלוקה שווה וקבוצות שוות. בקשו מהילד להסביר מה מייצג כל מספר בתרגיל, ואז לבדוק את התשובה בעזרת כפל.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בחילוק כחלוקה שווה או לקבוצות שוות, ובבדיקת התשובה בעזרת כפל.",
            intentDescriptionEn:
              "Grade 3–4 division as equal sharing or equal groups, with multiplication as an inverse check.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל חילוק במספרים גדולים יותר או בתוך בעיות מילוליות, עם אומדן לפני הפתרון ובדיקת התשובה בעזרת כפל. בקשו מהילד להסביר מהי הכמות שמחלקים, לכמה חלקים מחלקים, ומה משמעות המנה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בחילוק עם אומדן, פירוש משמעות המנה ובדיקת התשובה בעזרת כפל.",
            intentDescriptionEn:
              "Grade 5–6 division with larger numbers or word problems, estimation, quotient meaning, and multiplication check.",
          },
        },
        division_with_remainder: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn: "Do not provide division-with-remainder recommendations for grades 1–2.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל חילוק עם שארית בעזרת סיפור קצר או ציור של קבוצות שוות. בקשו מהילד להסביר מה חולק באופן שווה ומה נשאר כשארית.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בהבנת שארית: מה מתחלק לקבוצות שוות ומה נשאר מחוץ לקבוצות.",
            intentDescriptionEn:
              "Grade 3–4 division with remainder using equal groups and explaining what is shared and what remains.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל חילוק עם שארית בתוך בעיות מילוליות, ולבדוק מה משמעות השארית לפי ההקשר. בקשו מהילד להחליט אם צריך להשאיר שארית, לעגל, או לפרש אותה כחלק מהתשובה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בפירוש השארית לפי ההקשר ובבדיקת התאמת התשובה לבעיה.",
            intentDescriptionEn:
              "Grade 5–6 division with remainder in context, interpreting whether to keep, round, or explain the remainder.",
          },
        },
        ratio: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn: "Do not provide ratio recommendations for grades 1–2.",
          },
          g3_g4: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn:
              "Keep ratio null for grades 3–4 unless product evidence explicitly supports ratio/proportion work.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל יחס דרך השוואה בין שתי כמויות ושמירה על אותו קשר כפלי. בקשו מהילד להסביר מה משווים, מה נשאר קבוע ביחס, ואיך אפשר לבדוק שהתשובה שומרת על אותו קשר.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בהבנת יחס כקשר בין שתי כמויות ובבדיקה שהקשר נשמר לאורך הפתרון.",
            intentDescriptionEn:
              "Grade 5–6 ratio as a multiplicative relationship between two quantities, preserving the relationship and checking consistency.",
          },
        },
      },
    },
    "M-07": {
      defaultBands: {
        g1_g2: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-07 default: no approved parent copy; use bucketOverrides (word_problems) or engine fallback.",
        },
        g3_g4: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-07 default: no approved parent copy; use bucketOverrides (word_problems) or engine fallback.",
        },
        g5_g6: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-07 default: no approved parent copy; use bucketOverrides (word_problems) or engine fallback.",
        },
      },
      bucketOverrides: {
        word_problems: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn:
              "Do not provide formal word-problem unit recommendations for grades 1–2 unless product evidence explicitly supports it.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל בעיות מילוליות שבהן צריך לכתוב תשובה מלאה עם יחידה מתאימה. לפני הפתרון בקשו מהילד לסמן מה בדיוק שואלים, ובסיום לבדוק שהמספר והיחידה בתשובה מתאימים לשאלה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בזיהוי מה נשאל בבעיה מילולית ובכתיבת תשובה מלאה עם יחידה מתאימה.",
            intentDescriptionEn:
              "Grade 3–4 word-problem answer labeling: identify what is asked, solve, and write a complete answer with the correct unit.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל בעיות מילוליות שבהן מופיעות כמה כמויות או יחידות. לפני החישוב בקשו מהילד להגדיר מה מייצג כל מספר ובאיזו יחידה צריכה להיכתב התשובה, ואז לבדוק שהפתרון מתאים להקשר של הבעיה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בהתאמת התשובה להקשר הבעיה: מה מייצג כל מספר, מהי היחידה הנכונה, והאם התשובה הסופית עונה בדיוק על מה שנשאל.",
            intentDescriptionEn:
              "Grade 5–6 word-problem unit/context alignment: track quantities, units, and whether the final answer matches the question.",
          },
        },
      },
    },
    "M-08": {
      defaultBands: {
        g1_g2: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-08 default: no approved parent copy; use bucketOverrides (word_problems, sequences, equations, order_of_operations) or engine fallback.",
        },
        g3_g4: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-08 default: no approved parent copy; use bucketOverrides (word_problems, sequences, equations, order_of_operations) or engine fallback.",
        },
        g5_g6: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-08 default: no approved parent copy; use bucketOverrides (word_problems, sequences, equations, order_of_operations) or engine fallback.",
        },
      },
      bucketOverrides: {
        word_problems: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn:
              "Do not provide formal multi-step word-problem recommendations for grades 1–2 unless product evidence explicitly supports it.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל בעיות מילוליות בשלב אחד או שניים בעזרת תכנון קצר לפני החישוב. בקשו מהילד לכתוב מה ידוע, מה צריך למצוא, איזו פעולה מתאימה לכל שלב, ורק אז לפתור.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בתכנון פתרון לבעיה מילולית: מה ידוע, מה מחפשים, ואיזו פעולה מתאימה לכל שלב.",
            intentDescriptionEn:
              "Grade 3–4 word-problem planning: identify known information, target question, and operation choice for one- or two-step problems.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל בעיות מילוליות רב־שלביות בעזרת טבלה, תרשים או משוואה פשוטה. בקשו מהילד להסביר את סדר השלבים, מדוע בחר בכל פעולה, ולבדוק בסיום אם התשובה סבירה ביחס לנתוני הבעיה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בפתרון בעיות רב־שלביות: תכנון דרך, בחירת פעולות, הסבר סדר השלבים ובדיקת סבירות התשובה.",
            intentDescriptionEn:
              "Grade 5–6 multi-step word-problem modeling with tables, diagrams, simple equations, operation choice, and reasonableness checks.",
          },
        },
        sequences: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn:
              "Do not provide formal sequence recommendations for grades 1–2 unless product evidence explicitly supports it.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל סדרות מספרים על ידי זיהוי החוקיות בין איברים סמוכים. בקשו מהילד להסביר במילים מה משתנה בכל צעד, ואז להשתמש בכלל שמצא כדי להשלים את האיבר הבא.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בזיהוי חוקיות בסדרות ובהסבר מילולי של הכלל שמוביל מאיבר לאיבר.",
            intentDescriptionEn:
              "Grade 3–4 sequences through identifying the change between neighboring terms and explaining the rule.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל סדרות שבהן צריך לנסח כלל ברור, לבדוק אותו על כמה איברים, ולהשתמש בו כדי למצוא איבר חסר או איבר בהמשך הסדרה. בקשו מהילד להסביר האם הכלל קבוע ולמה הוא מתאים לכל הסדרה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בניסוח כלל לסדרה, בדיקתו על כמה איברים ושימוש בו למציאת איברים חסרים או מתקדמים.",
            intentDescriptionEn:
              "Grade 5–6 sequence reasoning: formulate and test a rule, then use it to find missing or later terms.",
          },
        },
        equations: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn:
              "Do not provide formal equation recommendations for grades 1–2 unless product evidence explicitly supports it.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל תרגילי נעלם פשוטים בעזרת פעולה הפוכה. בקשו מהילד להסביר מה חסר בתרגיל, איזו פעולה תעזור למצוא אותו, ואז להציב את התשובה בחזרה כדי לבדוק.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בתרגילי נעלם פשוטים, שימוש בפעולה הפוכה ובדיקת התשובה בתוך התרגיל המקורי.",
            intentDescriptionEn:
              "Grade 3–4 simple missing-number equations using inverse operations and substitution check.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל משוואות פשוטות על ידי שמירה על שוויון בין שני האגפים. בקשו מהילד להסביר איזו פעולה הוא מבצע על שני הצדדים, ולבדוק את הפתרון באמצעות הצבה במשוואה המקורית.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בפתרון משוואות פשוטות: שמירה על שוויון, ביצוע פעולות על שני האגפים ובדיקת הפתרון בהצבה.",
            intentDescriptionEn:
              "Grade 5–6 simple equation solving by preserving equality, applying operations to both sides, and checking by substitution.",
          },
        },
        order_of_operations: {
          g1_g2: {
            actionTextHe: null,
            goalTextHe: null,
            intentDescriptionEn: "Do not provide order-of-operations recommendations for grades 1–2.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל סדר פעולות בתרגילים קצרים, במיוחד כאשר מופיעים סוגריים או שילוב של פעולות. בקשו מהילד לסמן מה פותרים קודם, להסביר למה, ואז לחשב שלב אחר שלב.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בסדר פעולות בתרגילים קצרים: זיהוי מה פותרים קודם וחישוב מסודר שלב אחר שלב.",
            intentDescriptionEn:
              "Grade 3–4 order of operations in short expressions, especially parentheses and mixed operations, with step-by-step reasoning.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל תרגילים עם כמה פעולות, סוגריים ולעיתים גם חזקות, תוך כתיבת שלבי פתרון מסודרים. בקשו מהילד להצדיק את סדר הפעולות ולבדוק שהתוצאה לא השתנתה בגלל דילוג על שלב.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בסדר פעולות בתרגילים מורכבים יותר, כולל כתיבת שלבים, הצדקת הסדר ובדיקת התוצאה.",
            intentDescriptionEn:
              "Grade 5–6 order of operations in more complex expressions, including parentheses and sometimes powers, with written steps and justification.",
          },
        },
      },
    },
    "M-01": {
      defaultBands: {
        g1_g2: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-01 default parent copy not approved yet; use bucketOverrides (compare, number_sense, estimation) or engine fallback.",
        },
        g3_g4: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-01 default parent copy not approved yet; use bucketOverrides (compare, number_sense, estimation) or engine fallback.",
        },
        g5_g6: {
          actionTextHe: null,
          goalTextHe: null,
          intentDescriptionEn:
            "M-01 default parent copy not approved yet; use bucketOverrides (compare, number_sense, estimation) or engine fallback.",
        },
      },
      bucketOverrides: {
        compare: {
          g1_g2: {
            actionTextHe:
              "כדאי לתרגל השוואת מספרים קטנים בעזרת חפצים, ציור או טבלת עשרות ואחדות. בכל פעם בקשו מהילד להסביר איזה מספר גדול יותר ולמה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בהשוואת מספרים קטנים ובהסבר פשוט של גדול, קטן ושווה.",
            intentDescriptionEn:
              "Early number comparison with concrete supports, tens/ones representation, and simple greater-than/less-than reasoning.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל השוואת מספרים רב־ספרתיים לפי ערך הספרות. בקשו מהילד להתחיל מהספרה בעלת הערך הגבוה ביותר ולהסביר באיזו עמודה נקבע ההבדל.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בהשוואת מספרים לפי ערך מקום, מהספרה הגדולה ביותר ועד העמודה שבה מופיע ההבדל.",
            intentDescriptionEn:
              "Multi-digit comparison by place value, starting from the highest place and identifying the first differing place.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל השוואת מספרים גדולים או ייצוגים מספריים שונים בעזרת ערך מקום ואומדן. בקשו מהילד להסביר מה הופך מספר אחד לגדול או קטן יותר, ולא להסתמך רק על ספירת ספרות.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בהשוואה מדויקת של מספרים גדולים או ייצוגים שונים, עם נימוק לפי ערך מקום ואומדן.",
            intentDescriptionEn:
              "Upper-grade comparison of larger numbers or different numeric representations using place value, estimation, and explicit reasoning.",
          },
        },
        number_sense: {
          g1_g2: {
            actionTextHe:
              "כדאי לתרגל בניית מספרים ופירוקם בעזרת חפצים, ציור או עשרות ואחדות. בקשו מהילד להראות למשל שמספר יכול להיות מורכב מעשרת ועוד אחדות.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בהבנת מבנה המספר: עשרות, אחדות ופירוק מספרים קטנים לחלקים.",
            intentDescriptionEn:
              "Early number sense through composing and decomposing numbers with objects, drawings, tens, and ones.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל פירוק מספרים לפי ערך מקום: אחדות, עשרות, מאות ואלפים. בקשו מהילד לכתוב את המספר גם בצורה רגילה וגם כפירוק לפי הערך של כל ספרה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בערך מקום ובפירוק מספרים רב־ספרתיים לפי הספרות שלהם.",
            intentDescriptionEn:
              "Multi-digit number sense through place-value decomposition across ones, tens, hundreds, and thousands.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל מעבר בין ייצוגים של אותו מספר, כמו כתיבה רגילה, פירוק לפי ערך מקום ואומדן גודל. בקשו מהילד להסביר איך כל ייצוג מתאר את אותו מספר.",
            goalTextHe:
              "בשבוע הקרוב התמקדו בקשר בין ייצוגים שונים של מספרים ובבדיקת משמעות כל ספרה בתוך המספר.",
            intentDescriptionEn:
              "Upper-grade number sense through translating between standard notation, place-value decomposition, and magnitude reasoning.",
          },
        },
        estimation: {
          g1_g2: {
            actionTextHe:
              "כדאי לתרגל אומדן בכמויות ובמספרים קטנים: לפני הספירה או החישוב בקשו מהילד לומר בערך כמה יש, ואז לבדוק יחד אם ההשערה הייתה קרובה.",
            goalTextHe:
              "בשבוע הקרוב התמקדו באומדן פשוט: האם המספר או התשובה נראים בערך מתאימים.",
            intentDescriptionEn:
              "Early estimation with small quantities and numbers, making an approximate guess before counting or calculating and checking closeness.",
          },
          g3_g4: {
            actionTextHe:
              "כדאי לתרגל אומדן לפני חישוב במספרים רב־ספרתיים. בקשו מהילד לעגל את המספרים בקירוב, לשער מה גודל התשובה, ואז לבדוק אם החישוב הסופי סביר.",
            goalTextHe:
              "בשבוע הקרוב התמקדו באומדן לפני חישוב ובבדיקת סבירות של תשובות במספרים רב־ספרתיים.",
            intentDescriptionEn:
              "Multi-digit estimation before calculation, using rounded numbers to predict approximate answer size and check reasonableness.",
          },
          g5_g6: {
            actionTextHe:
              "כדאי לתרגל אומדן בתרגילים מורכבים יותר, כולל מספרים גדולים, שברים פשוטים, עשרוניים או אחוזים. לפני הפתרון בקשו מהילד לשער את גודל התשובה ולבדוק בסוף אם היא הגיונית.",
            goalTextHe:
              "בשבוע הקרוב התמקדו באומדן ובבדיקת סבירות בתרגילים מורכבים, לפני הפתרון ולאחריו.",
            intentDescriptionEn:
              "Upper-grade estimation across larger numbers and more complex contexts, including simple fractions, decimals, or percentages, with before-and-after reasonableness checks.",
          },
        },
      },
    },
  },
};
