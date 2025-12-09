import { BLANK } from './math-constants';
import { convertMissingNumberEquation, buildVerticalOperation } from './math-animations';

export function getHint(question, operation, gradeKey) {
  if (!question || !question.params) return "";

  const p = question.params;

  switch (operation) {
    case "addition":
      if (p.kind === "add_three") {
        return "חבר שני מספרים ואז הוסף את השלישי: (a + b) + c.";
      }
      if (p.kind === "add_complement10" || p.kind === "add_complement_round10") {
        return "חפש כמה חסר כדי להגיע לעשר/מספר עגול – לא צריך לחשב את כל החיבור הארוך.";
      }
      if (p.kind === "add_missing_first" || p.kind === "add_missing_second") {
        return "אם יש לך __ + b = c, אז המספר החסר הוא c - b. אם יש לך a + __ = c, אז המספר החסר הוא c - a.";
      }
      return "השתמש בשיטת \"עמודות\" או בקפיצות על ציר המספרים: חיבור = הוספה.";
    case "subtraction":
      if (p.kind === "sub_missing_first" || p.kind === "sub_missing_second") {
        return "אם יש לך __ - b = c, אז המספר החסר הוא c + b. אם יש לך a - __ = c, אז המספר החסר הוא a - c.";
      }
      return "בדוק מי המספר הגדול יותר. חיסור = כמה חסר מהקטן לגדול או כמה מורידים מהגדול.";
    case "multiplication":
      return "מחשבים כפל כמו חיבור חוזר: a × b זה כמו לחבר את a לעצמו b פעמים.";
    case "division":
      return "חילוק = כמה פעמים המספר הקטן נכנס בגדול, או כמה יש בכל קבוצה כשמחלקים שווה בשווה.";
    case "fractions":
      if (p.kind === "frac_same_den") {
        return "כשיש אותו מכנה – המכנה נשאר אותו דבר, עובדים רק על המונים.";
      }
      return "כשיש מכנים שונים – מוצאים מכנה משותף, מעבירים את השברים ואז מחברים או מחסרים.";
    case "percentages":
      return "אחוזים הם חלק מ-100. 10% זה עשירית, 25% זה רבע, 50% זה חצי. נסה לתרגם לחלק פשוט.";
    case "sequences":
      return "בדוק מה קורה בין כל שני מספרים סמוכים – מה מוסיפים או מחסרים בכל צעד.";
    case "decimals":
      return "יישר את הנקודות העשרוניות וחשב כאילו היו מספרים רגילים, ואז החזר את הנקודה למקום הנכון.";
    case "rounding":
      return "חפש את הספרה שמקיפים (עשרות/מאות) והסתכל על הספרה שאחריה: 0–4 עיגול למטה, 5–9 למעלה.";
    case "equations":
      return "במשוואות עם מספר חסר משתמשים בפעולה ההפוכה: בחיבור נעזרים בחיסור, בכפל – בחילוק וכדומה.";
    case "compare":
      return "דמיין את המספרים על ציר מספרים: מי שמימין גדול יותר. במספרים עשרוניים משווים קודם את החלק השלם.";
    case "number_sense":
      if (p.kind?.startsWith("ns_place")) {
        return "פרק את המספר לעשרות/מאות/יחידות: למשל 57 זה 5 עשרות ו-7 יחידות.";
      }
      if (p.kind === "ns_neighbors") {
        return "מספר אחד לפני – מורידים 1. מספר אחד אחרי – מוסיפים 1.";
      }
      if (p.kind === "ns_complement10" || p.kind === "ns_complement100") {
        return "חפש כמה חסר כדי להשלים לעשר/מאה – זה ההפרש בין שני המספרים.";
      }
      if (p.kind === "ns_even_odd") {
        return "הסתכל על ספרת היחידות: 0,2,4,6,8 – זוגי. 1,3,5,7,9 – אי-זוגי.";
      }
      return "נסה לחשוב על \"תחושת מספר\" – עשרות, יחידות, שכנים, זוגי/אי-זוגי.";
    case "factors_multiples":
      return "מחלק (גורם) מתחלק במספר בלי שארית. כפולה מתקבלת כשמכפילים את המספר במספר שלם.";
    case "word_problems":
      return "קרא לאט, סמן את המספרים ותרגם את הסיפור לתרגיל פשוט (חיבור, חיסור, כפל או חילוק).";
    default:
      return "נסה לתרגם את השאלה לתרגיל חשבון פשוט.";
  }
}

// פונקציה עזר: הסבר חיבור בעמודה עם העברה
export function getAdditionStepsColumn(a, b) {
  const sum = a + b;
  const aStr = String(a);
  const bStr = String(b);
  const resultStr = String(sum);
  const maxLen = Math.max(aStr.length, bStr.length, resultStr.length);
  const pad = (s) => s.toString().padStart(maxLen, " ");
  const line1 = pad(aStr);
  const line2 = "+" + pad(bStr).slice(1);  // לשים +
  const line3 = "-".repeat(maxLen);
  const digitsA = pad(aStr).split("").map((d) => (d === " " ? 0 : Number(d)));
  const digitsB = pad(bStr).split("").map((d) => (d === " " ? 0 : Number(d)));

  // מציג ביטויים מתמטיים משמאל לימין בתוך שורה בעברית
  const ltr = (expr) => `\u2066${expr}\u2069`; // LRI ... PDI

  // פונקציה שנותנת שם מקום (יחידות/עשרות/מאות...)
  const placeName = (idxFromRight) => {
    if (idxFromRight === 0) return "ספרת היחידות";
    if (idxFromRight === 1) return "ספרת העשרות";
    if (idxFromRight === 2) return "ספרת המאות";
    return `המקום ה-${idxFromRight + 1} מימין`;
  };

  let carry = 0;
  const steps = [];

  // שלב 1 – מציגים את החיבור בעמודה
  steps.push(
    <div key="col" className="font-mono text-lg text-center mb-2" dir="ltr">
      <div>{line1}</div>
      <div>{line2}</div>
      <div>{line3}</div>
    </div>
  );

  // שלב 2 – מסבירים חיבור ספרות מימין לשמאל
  const len = digitsA.length;
  for (let i = len - 1; i >= 0; i--) {
    const idxFromRight = len - 1 - i;
    const da = digitsA[i];
    const db = digitsB[i];

    // אם שתי הספרות 0 וגם אין העברה – אין מה להסביר כאן
    if (da === 0 && db === 0 && carry === 0) continue;

    const raw = da + db + carry;
    const digit = raw % 10;
    const nextCarry = Math.floor(raw / 10);
    const place = placeName(idxFromRight);

    // הביטוי המתמטי כולו בתוך בלוק LTR אחד
    const parts = [da, "+", db];
    if (carry > 0) {
      parts.push("+", carry);
    }
    const expr = ltr(`${parts.join(" ")} = ${raw}`);

    let text = `ב${place}: ${expr}. כותבים ${digit}`;
    if (nextCarry > 0) {
      text += ` ומעבירים ${nextCarry} לעמודה הבאה.`;
    } else {
      text += `. אין העברה לעמודה הבאה.`;
    }

    steps.push(
      <div
        key={`step-${i}`}
        className="mb-1"
        dir="rtl"
        style={{ unicodeBidi: "plaintext" }}
      >
        {text}
      </div>
    );

    carry = nextCarry;
  }

  // שלב אחרון – מסכמים
  steps.push(
    <div
      key="final"
      className="mt-2 font-semibold"
      dir="rtl"
      style={{ unicodeBidi: "plaintext" }}
    >
      בסוף מקבלים את המספר המלא: {sum}.
    </div>
  );

  return steps;
}

// הסבר מפורט צעד-אחר-צעד לפי סוג תרגיל וכיתה
export function getSolutionSteps(question, operation, gradeKey) {
  if (!question || !question.params) return [];
  const p = question.params;
  const ans = question.correctAnswer;
  const isStory = !!question.isStory;
  // מציג ביטויים מתמטיים משמאל לימין בתוך שורה בעברית
  const ltr = (expr) => `\u2066${expr}\u2069`; // LRI ... PDI

  const toSpan = (text, key) => (
    <span
      key={key}
      style={{
        display: "block",
        direction: "rtl",
        unicodeBidi: "plaintext",
      }}
    >
      {text}
    </span>
  );

  // אם יש params.op, נשתמש בו; אחרת נשתמש ב-operation
  const op = p.op || operation;

  // אם זה חיבור רגיל עם שני מספרים - נשתמש בהסבר בעמודה
  if (op === "add" && typeof p.a === "number" && typeof p.b === "number" && p.kind === "add_two") {
    return getAdditionStepsColumn(p.a, p.b);
  }

  switch (operation) {
    case "addition": {
      if (p.kind === "add_three") {
        const s1 = p.a + p.b;
        return [
          toSpan(`1. נכתוב את התרגיל: ${ltr(`${p.a} + ${p.b} + ${p.c}`)}.`, "1"),
          toSpan(`2. נחבר את שני הראשונים: ${ltr(`${p.a} + ${p.b} = ${s1}`)}.`, "2"),
          toSpan(`3. נוסיף את האחרון: ${ltr(`${s1} + ${p.c} = ${ans}`)}.`, "3"),
          toSpan(`4. התשובה: ${ans}.`, "4"),
        ];
      }
      if (p.kind === "add_complement10" || p.kind === "add_complement_round10") {
      return [
          toSpan(
            `1. זה תרגיל השלמה: מחפשים כמה חסר כדי להגיע ל-${p.c ?? p.tens}.`,
            "1"
          ),
          toSpan(
            `2. נחשב: ${ltr(`${p.c ?? p.tens} - ${p.b ?? p.base} = ${ans}`)}.`,
            "2"
          ),
          toSpan(`3. נבדוק שחיבור התוצאה נותן את המספר העגול.`, "3"),
        ];
      }
      if (p.kind === "add_missing_first") {
        // __ + b = c
        return [
          toSpan(`1. נבין: מחפשים מספר שכשמוסיפים לו ${p.b}, מקבלים ${p.c}.`, "1"),
          toSpan(`2. נחשב: ${ltr(`${p.c} - ${p.b} = ${ans}`)}.`, "2"),
          toSpan(`3. נבדוק: ${ltr(`${ans} + ${p.b} = ${p.c}`)}? כן!`, "3"),
          toSpan(`4. התשובה: ${ans}.`, "4"),
        ];
      }
      if (p.kind === "add_missing_second") {
        // a + __ = c
        return [
          toSpan(`1. נבין: מחפשים מספר שכשמוסיפים ל-${p.a}, מקבלים ${p.c}.`, "1"),
          toSpan(`2. נחשב: ${ltr(`${p.c} - ${p.a} = ${ans}`)}.`, "2"),
          toSpan(`3. נבדוק: ${ltr(`${p.a} + ${ans} = ${p.c}`)}? כן!`, "3"),
          toSpan(`4. התשובה: ${ans}.`, "4"),
        ];
      }
      // אם זה חיבור רגיל עם שני מספרים - נשתמש בהסבר בעמודה
      if (typeof p.a === "number" && typeof p.b === "number") {
        return getAdditionStepsColumn(p.a, p.b);
      }
      const sum = p.a + p.b;
      return [
        toSpan(`1. נכתוב את התרגיל: ${ltr(`${p.a} + ${p.b}`)}.`, "1"),
        toSpan(`2. נחבר: ${ltr(`${p.a} + ${p.b} = ${sum}`)}.`, "2"),
        toSpan(`3. התוצאה: ${ans}.`, "3"),
      ];
    }

    case "subtraction":
      if (p.kind === "sub_missing_first") {
        // __ - b = c
        return [
          toSpan(`1. נבין: מחפשים מספר שכשמחסרים ממנו ${p.b}, מקבלים ${p.c}.`, "1"),
          toSpan(`2. נחשב: ${ltr(`${p.c} + ${p.b} = ${ans}`)}.`, "2"),
          toSpan(`3. נבדוק: ${ltr(`${ans} - ${p.b} = ${p.c}`)}? כן!`, "3"),
          toSpan(`4. התשובה: ${ans}.`, "4"),
        ];
      }
      if (p.kind === "sub_missing_second") {
        // a - __ = c
      return [
          toSpan(`1. נבין: מחפשים מספר שכשמחסרים אותו מ-${p.a}, מקבלים ${p.c}.`, "1"),
          toSpan(`2. נחשב: ${ltr(`${p.a} - ${p.c} = ${ans}`)}.`, "2"),
          toSpan(`3. נבדוק: ${ltr(`${p.a} - ${ans} = ${p.c}`)}? כן!`, "3"),
          toSpan(`4. התשובה: ${ans}.`, "4"),
        ];
      }
      return [
        toSpan(`1. נכתוב את התרגיל: ${ltr(`${p.a} - ${p.b}`)}.`, "1"),
        toSpan("2. נבדוק מי המספר הגדול ומי הקטן (משפיע על הסימן).", "2"),
        toSpan(`3. נחשב: ${ltr(`${p.a} - ${p.b} = ${ans}`)}.`, "3"),
        toSpan(`4. נעשה בדיקה מהירה: ${ltr(`${ans} + ${p.b} = ${p.a}`)}?`, "4"),
      ];

    case "multiplication":
        return [
        toSpan(
          `1. נכיר שכפל הוא חיבור חוזר: ${ltr(`${p.a} × ${p.b}`)} = ${ltr(
            `${p.a} + ${p.a} + ...`
          )} (${p.b} פעמים).`,
          "1"
        ),
        toSpan(`2. נחשב: ${ltr(`${p.a} × ${p.b} = ${ans}`)}.`, "2"),
        toSpan(`3. התשובה: ${ans}.`, "3"),
      ];

    case "division":
      return [
        toSpan(
          `1. נכתוב: ${ltr(`${p.dividend} ÷ ${p.divisor}`)} – כמה קבוצות של ${p.divisor} נכנסות בתוך ${p.dividend}?`,
          "1"
        ),
        toSpan(
          `2. נבדוק: ${ltr(`${p.divisor} × ${ans} = ${p.dividend}`)}. אם כן – זה המספר הנכון.`,
          "2"
        ),
        toSpan(`3. לכן התשובה: ${ans}.`, "3"),
      ];

    case "fractions":
      if (p.kind === "frac_same_den") {
        return [
          toSpan(
            `1. יש לנו אותו מכנה (${p.den}). במכנה לא נוגעים – עובדים רק על המונים.`,
            "1"
          ),
          toSpan(
            `2. ${p.op === "add" ? "מחברים" : "מחסרים"} את המונים: ${ltr(
              `${p.n1} ${p.op === "add" ? "+" : "-"} ${p.n2}`
            )}.`,
            "2"
          ),
          toSpan(`3. התוצאה במונה: ${ans.split("/")[0]}.`, "3"),
          toSpan(`4. המכנה נשאר ${p.den} – לכן התשובה: ${ans}.`, "4"),
        ];
      }

      if (p.kind === "frac_diff_den") {
      return [
          toSpan(
            `1. יש מכנים שונים (${p.den1} ו-${p.den2}). נמצא מכנה משותף – כאן ${p.commonDen}.`,
            "1"
          ),
          toSpan("2. נעביר כל שבר למכנה המשותף.", "2"),
          toSpan("3. אחרי שהמכנים זהים – עובדים על המונים בלבד.", "3"),
          toSpan(`4. כך נקבל את ${ans}.`, "4"),
        ];
      }

      return [
        toSpan("1. מוצאים מכנה משותף.", "1"),
        toSpan("2. מעבירים את השברים למכנה הזה.", "2"),
        toSpan("3. מחברים או מחסרים את המונים.", "3"),
        toSpan(`4. מצמצמים אם אפשר ומקבלים ${ans}.`, "4"),
      ];

    case "percentages":
      if (p.kind === "perc_discount") {
        return [
          toSpan(
            `1. מחשבים את גובה ההנחה: ${ltr(`${p.base} × ${p.p}/100 = ${p.discount}`)}.`,
            "1"
          ),
          toSpan(
            `2. מפחיתים מהמחיר: ${ltr(`${p.base} - ${p.discount} = ${ans}`)}.`,
            "2"
          ),
        ];
      }
      return [
        toSpan(
          `1. ${p.p}% מתוך ${p.base} זה ${p.base} כפול ${p.p}/100.`,
          "1"
        ),
        toSpan(
          `2. נחשב: ${ltr(`${p.base} × ${p.p}/100 = ${ans}`)}.`,
          "2"
        ),
      ];

    case "sequences":
      return [
        toSpan(
          `1. נסתכל על ההפרש בין שני מספרים סמוכים: למשל ${ltr(
            `${p.seq[1]} - ${p.seq[0]} = ${p.step}`
          )}.`,
          "1"
        ),
        toSpan("2. זה הצעד הקבוע של הסדרה.", "2"),
        toSpan(
          `3. נשתמש באותו צעד כדי להשלים את המקום הריק.`,
          "3"
        ),
      ];

    case "decimals":
      return [
        toSpan("1. ניישר את הנקודות העשרוניות אחת מתחת לשנייה.", "1"),
        toSpan("2. נחשב כאילו זה מספרים שלמים.", "2"),
        toSpan(
          "3. נחזיר את הנקודה למקום לפי מספר הספרות אחרי הנקודה.",
          "3"
        ),
      ];

    case "rounding":
      return [
        toSpan(
          `1. נזהה אם מעגלים לעשרות או למאות ומסתכלים על הספרה שאחרי.`,
          "1"
        ),
        toSpan(
          "2. אם הספרה שאחרי היא 0–4 – מעגלים למטה. אם 5–9 – למעלה.",
          "2"
        ),
        toSpan(`3. כך נקבל את ${ans}.`, "3"),
      ];

    case "equations": {
      if (p.kind === "eq_add") {
        return [
          toSpan(
            `1. זוכרים שבחיבור הפעולה ההפוכה היא חיסור.`,
            "1"
          ),
          toSpan(
            `2. במקום לנחש את המספר ב-${BLANK}, נחשב ${ltr(`${p.c} - ${p.a}`)} או ${ltr(`${p.c} - ${p.b}`)}.`,
            "2"
          ),
          toSpan(
            `3. קבלת התוצאה: ${ans}.`,
            "3"
          ),
        ];
      }

      if (p.kind === "eq_sub") {
      return [
          toSpan(
            `1. בחיסור הפעולה ההפוכה היא חיבור.`,
            "1"
          ),
          toSpan(
            `2. אם יש ${ltr(`${p.a} - ${BLANK} = ${p.c}`)}, נחשב ${ltr(`${p.a} - ${p.c}`)}.`,
            "2"
          ),
          toSpan(
            `3. התוצאה היא ${ans} – נבדוק: ${ltr(`${p.a} - ${ans} = ${p.c}`)}.`,
            "3"
          ),
        ];
      }

      if (p.kind === "eq_mul") {
      return [
          toSpan(
            `1. בכפל הפעולה ההפוכה היא חילוק.`,
            "1"
          ),
          toSpan(
            `2. נחשב ${ltr(`${p.c} ÷ ${p.a}`)} או ${ltr(`${p.c} ÷ ${p.b}`)} לפי המקום של ${BLANK}.`,
            "2"
          ),
          toSpan(
            `3. מקבלים ${ans} ובודקים: ${ltr(`${p.a} × ${ans} = ${p.c}`)} או ${ltr(`${ans} × ${p.b} = ${p.c}`)}.`,
            "3"
          ),
        ];
      }

      if (p.kind === "eq_div") {
        return [
          toSpan(
            `1. בחילוק הפעולה ההפוכה היא כפל.`,
            "1"
          ),
          toSpan(
            `2. אם ${ltr(`${BLANK} ÷ ${p.divisor} = ${p.quotient}`)}, נכפול ${ltr(`${p.quotient} × ${p.divisor}`)}.`,
            "2"
          ),
          toSpan(
            `3. מקבלים ${ans} ובודקים חזרה בחילוק.`,
            "3"
          ),
        ];
      }

      return [];
    }

    case "compare": {
      return [
        toSpan(
          `1. נסתכל על שני המספרים: ${ltr(`${p.a}`)} ו-${ltr(`${p.b}`)}.`,
          "1"
        ),
        toSpan(
          `2. נבדוק מי גדול יותר (או אם שווים).`,
          "2"
        ),
        toSpan(
          `3. לפי זה נבחר את הסימן הנכון: "<" אם הראשון קטן, ">" אם גדול, "=" אם שווים.`,
          "3"
        ),
      ];
    }

    case "number_sense": {
      if (p.kind === "ns_place_tens_units" || p.kind === "ns_place_hundreds") {
        return [
          toSpan(
            `1. מפרקים את המספר לעשרות/מאות/יחידות.`,
            "1"
          ),
          toSpan(
            `2. לדוגמה ${ltr(String(p.n))} = ${p.hundreds ?? ""}${p.hundreds != null ? " מאות," : ""} ${p.tens ?? ""}${p.tens != null ? " עשרות," : ""} ${p.units ?? ""}${p.units != null ? " יחידות" : ""}.`,
            "2"
          ),
          toSpan(
            `3. בוחרים את הספרה לפי מה ששאלו.`,
            "3"
          ),
        ];
      }

      if (p.kind === "ns_neighbors") {
        return [
          toSpan(
            `1. מספר אחד אחרי – מוסיפים 1. מספר אחד לפני – מחסרים 1.`,
            "1"
          ),
          toSpan(
            `2. למשל אחרי ${p.n} מגיע ${p.n + 1}, ולפניו ${p.n - 1}.`,
            "2"
          ),
        ];
      }

      if (p.kind === "ns_complement10" || p.kind === "ns_complement100") {
        const target = p.c;
        return [
          toSpan(
            `1. מחפשים כמה חסר מ-${p.b} כדי להגיע ל-${target}.`,
            "1"
          ),
          toSpan(
            `2. נחשב: ${ltr(`${target} - ${p.b} = ${ans}`)}.`,
            "2"
          ),
        ];
      }

      if (p.kind === "ns_even_odd") {
        return [
          toSpan(
            `1. מסתכלים על ספרת היחידות של ${p.n}.`,
            "1"
          ),
          toSpan(
            `2. אם הספרה היא 0,2,4,6,8 – המספר זוגי. אם 1,3,5,7,9 – אי-זוגי.`,
            "2"
          ),
        ];
      }

      return [];
    }

    case "factors_multiples": {
      if (p.kind === "fm_factor") {
        return [
          toSpan(
            `1. נבדוק אילו מספרים מתחלקים ב-${p.n} בלי שארית.`,
            "1"
          ),
          toSpan(
            `2. נחלק את ${p.n} במספרים האפשריים עד שנמצא מי שמתחלק בדיוק.`,
            "2"
          ),
        ];
      }
      if (p.kind === "fm_multiple") {
        return [
          toSpan(
            `1. כפולות של ${p.base} מתקבלות כשמכפילים את המספר ב-1,2,3,...`,
            "1"
          ),
          toSpan(
            `2. נבדוק מי מהרשימה מתאים לצורה ${p.base} × מספר שלם.`,
            "2"
          ),
        ];
      }
      if (p.kind === "fm_gcd") {
        return [
          toSpan(
            `1. נפרק את ${p.a} ו-${p.b} לגורמים.`,
            "1"
          ),
          toSpan(
            `2. נמצא גורמים משותפים ונראה מי הגדול ביותר – כאן ${ans}.`,
            "2"
          ),
        ];
      }
      return [];
    }

    case "word_problems":
      if (p.kind === "wp_simple_add") {
        const sum = p.a + p.b;
        return [
          toSpan("1. מזהים שהשאלה מבקשת כמה יש בסך הכל – פעולה של חיבור.", "1"),
          toSpan(`2. כותבים תרגיל: ${ltr(`${p.a} + ${p.b}`)}.`, "2"),
          toSpan(`3. מחשבים: ${ltr(`${p.a} + ${p.b} = ${sum}`)}.`, "3"),
          toSpan(`4. התשובה: לליאו יש ${ans} כדורים.`, "4"),
        ];
      }

      if (p.kind === "wp_simple_sub") {
        return [
          toSpan("1. מזהים שהשאלה מבקשת כמה נשאר – פעולה של חיסור.", "1"),
          toSpan(`2. כותבים תרגיל: ${ltr(`${p.total} - ${p.give}`)}.`, "2"),
          toSpan(`3. מחשבים: ${ltr(`${p.total} - ${p.give} = ${ans}`)}.`, "3"),
          toSpan(`4. התשובה: נשארו לליאו ${ans} מדבקות.`, "4"),
        ];
      }

      if (p.kind === "wp_pocket_money") {
        return [
          toSpan("1. מזהים שהשאלה מבקשת כמה כסף נשאר אחרי קנייה – פעולה של חיסור.", "1"),
          toSpan(`2. כותבים תרגיל: ${ltr(`${p.money} - ${p.toy}`)}.`, "2"),
          toSpan(`3. מחשבים: ${ltr(`${p.money} - ${p.toy} = ${ans}`)}.`, "3"),
          toSpan(`4. התשובה: נשאר לליאו ${ans}₪.`, "4"),
        ];
      }

      if (p.kind === "wp_time_sum") {
        const sum = p.l1 + p.l2;
        return [
          toSpan("1. מזהים שהשאלה מבקשת כמה זמן נמשך ביחד – פעולה של חיבור.", "1"),
          toSpan(`2. כותבים תרגיל: ${ltr(`${p.l1} + ${p.l2}`)}.`, "2"),
          toSpan(`3. מחשבים: ${ltr(`${p.l1} + ${p.l2} = ${sum}`)}.`, "3"),
          toSpan(`4. התשובה: הצפייה נמשכה ${ans} דקות.`, "4"),
        ];
      }

      if (p.kind === "wp_average") {
        const sum = p.s1 + p.s2 + p.s3;
        return [
          toSpan("1. ממוצע מחושב על ידי חיבור כל הציונים וחילוק במספר המבחנים.", "1"),
          toSpan(`2. נחבר את הציונים: ${ltr(`${p.s1} + ${p.s2} + ${p.s3} = ${sum}`)}.`, "2"),
          toSpan(`3. נחלק ב-3: ${ltr(`${sum} ÷ 3 = ${ans}`)}.`, "3"),
          toSpan(`4. התשובה: הממוצע הוא ${ans}.`, "4"),
        ];
      }

      if (p.kind === "wp_groups") {
        const prod = p.per * p.groups;
        return [
          toSpan(
            `1. בכל קופסה יש ${p.per} עפרונות ויש ${p.groups} קופסאות – מדובר בחיבור חוזר.`,
            "1"
          ),
          toSpan(`2. נרשום תרגיל כפל: ${ltr(`${p.per} × ${p.groups}`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`${p.per} × ${p.groups} = ${prod}`)}.`, "3"),
          toSpan(`4. התשובה: ${ans} עפרונות.`, "4"),
        ];
      }

      if (p.kind === "wp_leftover") {
        return [
          toSpan(
            `1. יש ${p.total} תלמידים ומחלקים לקבוצות של ${p.groupSize}.`,
            "1"
          ),
          toSpan(
            `2. נחשב כמה קבוצות שלמות: ${ltr(`${p.total} ÷ ${p.groupSize} = ${p.groups}`)}.`,
            "2"
          ),
          toSpan(
            `3. נבדוק כמה נשארו: ${ltr(`${p.total} - (${p.groups} × ${p.groupSize}) = ${p.leftover}`)}.`,
            "3"
          ),
          toSpan(`4. לכן ${ans} תלמידים נשארים בלי קבוצה מלאה.`, "4"),
        ];
      }

      if (p.kind === "wp_multi_step") {
        return [
          toSpan(
            `1. נחשב כמה פריטים קונים בסך הכל: ${p.a} + ${p.b} = ${p.totalQty}.`,
            "1"
          ),
          toSpan(
            `2. נמצא את עלות הקנייה: ${ltr(`${p.price} × ${p.totalQty} = ${p.totalCost}`)}.`,
            "2"
          ),
          toSpan(
            `3. נחסר מהסכום שהיה לליאו: ${ltr(`${p.money} - ${p.totalCost} = ${ans}`)}.`,
            "3"
          ),
        ];
      }

      if (p.kind === "wp_shop_discount") {
        return [
          toSpan(
            `1. נחשב את ההנחה: ${ltr(`${p.price} × ${p.discPerc}/100 = ${p.discount}`)}.`,
            "1"
          ),
          toSpan(
            `2. נפחית מהמחיר: ${ltr(`${p.price} - ${p.discount} = ${ans}`)}.`,
            "2"
          ),
        ];
      }

      if (p.kind === "wp_unit_cm_to_m") {
        return [
          toSpan(
            `1. יודעים ש-1 מ' = 100 ס"מ.`,
            "1"
          ),
          toSpan(
            `2. לכן מחלקים ב-100: ${ltr(`${p.cm} ÷ 100 = ${ans}`)}.`,
            "2"
          ),
        ];
      }

      if (p.kind === "wp_unit_g_to_kg") {
        return [
          toSpan(
            `1. יודעים ש-1 ק\"ג = 1000 גרם.`,
            "1"
          ),
          toSpan(
            `2. לכן מחלקים ב-1000: ${ltr(`${p.g} ÷ 1000 = ${ans}`)}.`,
            "2"
          ),
        ];
      }

      if (p.kind === "wp_distance_time") {
        return [
          toSpan(
            `1. נוסחת הדרך: דרך = מהירות × זמן.`,
            "1"
          ),
          toSpan(
            `2. נחשב: ${ltr(`${p.speed} × ${p.hours} = ${ans}`)} ק\"מ.`,
            "2"
          ),
        ];
      }

      return [
        toSpan("1. לזהות מה שואלים – כמה ביחד? כמה נשאר? כמה בכל קבוצה?", "1"),
        toSpan("2. לכתוב תרגיל חשבון שמתאים לסיפור.", "2"),
        toSpan("3. לפתור את התרגיל ולקשר אותו למילים.", "3"),
      ];

    default:
      return [];
  }
}

// "למה טעיתי?" – הסבר קצר לטעות נפוצה
// פונקציה להסבר מותאם לגיל - הסברים פשוטים יותר לכיתות נמוכות
function getAgeAppropriateExplanation(operation, gradeKey, question, correctAnswer) {
  // לכיתות א'-ב' - הסברים פשוטים מאוד עם דוגמאות ויזואליות
  if (gradeKey === "g1" || gradeKey === "g2") {
    const a = question.a || question.params?.a;
    const b = question.b || question.params?.b;
    
    switch (operation) {
      case "addition":
        return `💡 נסה לחשוב על זה כך: יש לך ${a} עיגולים, ואתה מוסיף ${b} עיגולים נוספים. כמה עיגולים יש לך עכשיו? נסה לספור: ${a}... ${a + 1}... ${a + 2}... עד ${correctAnswer}!`;
      case "subtraction":
        return `💡 נסה לחשוב על זה כך: יש לך ${a} עיגולים, ואתה לוקח ${b} עיגולים. כמה עיגולים נשארו? נסה לספור לאחור: ${a}... ${a - 1}... ${a - 2}... עד ${correctAnswer}!`;
      case "multiplication":
        return `💡 כפל זה כמו חיבור חוזר! ${a} × ${b} זה כמו ${a} + ${a} + ${a}... (${b} פעמים). נסה לספור: ${a}, ${a * 2}, ${a * 3}... עד ${correctAnswer}!`;
      case "division":
        return `💡 חילוק זה כמו חלוקה לקבוצות! ${a} ÷ ${b} זה כמו לקחת ${a} עיגולים ולחלק אותם ל-${b} קבוצות שוות. כמה עיגולים בכל קבוצה? ${correctAnswer}!`;
      default:
        return `💡 נסה לחשוב על התרגיל בצורה פשוטה. התשובה הנכונה היא ${correctAnswer}.`;
    }
  }
  
  // לכיתות ג'-ד' - הסברים בינוניים
  if (gradeKey === "g3" || gradeKey === "g4") {
    const a = question.a || question.params?.a;
    const b = question.b || question.params?.b;
    
    switch (operation) {
      case "addition":
        if (a && b) {
          const tens = Math.floor(b / 10) * 10;
          const ones = b % 10;
          return `💡 נסה לחשוב על חיבור: ${a} + ${b} = ${correctAnswer}. אם קשה, נסה לפרק: ${a} + ${b} = ${a} + ${tens} + ${ones} = ${a + tens} + ${ones} = ${correctAnswer}`;
        }
        return `💡 נסה לחשוב על התרגיל בצורה שיטתית. התשובה הנכונה היא ${correctAnswer}.`;
      case "subtraction":
        if (a && b) {
          const tens = Math.floor(b / 10) * 10;
          const ones = b % 10;
          return `💡 נסה לחשוב על חיסור: ${a} - ${b} = ${correctAnswer}. אם קשה, נסה לפרק: ${a} - ${b} = ${a} - ${tens} - ${ones} = ${a - tens} - ${ones} = ${correctAnswer}`;
        }
        return `💡 נסה לחשוב על התרגיל בצורה שיטתית. התשובה הנכונה היא ${correctAnswer}.`;
      default:
        return `💡 נסה לחשוב על התרגיל בצורה שיטתית. התשובה הנכונה היא ${correctAnswer}.`;
    }
  }
  
  // לכיתות ה'-ו' - הסברים רגילים
  return null; // נשתמש בהסבר הרגיל
}

export function getErrorExplanation(question, operation, wrongAnswer, gradeKey) {
  if (!question) return "";
  const userAnsNum = Number(wrongAnswer);
  const correctNum =
    typeof question.correctAnswer === "string" && question.correctAnswer.includes("/")
      ? Number(
          question.correctAnswer.split("/")[0] /
            (question.correctAnswer.split("/")[1] || 1)
        )
      : Number(question.correctAnswer);

  // נסה להשתמש בהסבר מותאם לגיל קודם
  const ageAppropriate = getAgeAppropriateExplanation(operation, gradeKey, question, correctNum);
  if (ageAppropriate) {
    return ageAppropriate;
  }

  switch (operation) {
    case "addition":
      if (!Number.isNaN(userAnsNum) && userAnsNum < correctNum) {
        return "נראה שלא חיברת את כל החלקים או פספסת מספר אחד בדרך.";
      }
      if (!Number.isNaN(userAnsNum) && userAnsNum > correctNum) {
        return "נראה שחיברת משהו פעמיים או טעית בחיבור ביניים.";
      }
      return "בדוק שוב: האם חיברת את המספרים לפי הסדר?";
    case "subtraction":
      return "בחיסור קל להתבלבל בסדר המספרים. בדוק שוב שהקטנת את המספר הגדול ולא להפך.";
    case "multiplication":
      return "בכפל לפעמים מערבבים בין כפל לחיבור. ודא שחזרת על המספר הנכון מספר הפעמים הנכון.";
    case "division":
      return "בחילוק בדוק שהתוצאה כפול המחלק מחזירה את המספר המקורי.";
    case "fractions":
      return "בשברים לרוב שוכחים מכנה משותף או עובדים גם על המכנה במקום רק על המונה.";
    case "percentages":
      return "באחוזים טעות נפוצה היא להתבלבל בין חלק מתוך 100 לבין חיבור/חיסור רגיל. נסה לכתוב קודם את השבר (למשל \u206625% = 1/4\u2069).";
    case "sequences":
      return "בסדרות רבים מפספסים את ההפרש הקבוע. בדוק שוב מה קורה בין שני איברים סמוכים.";
    case "decimals":
      return "בעשרוניים באגים קורים כשלא מיישרים את הנקודות או שוכחים את מספר הספרות אחרי הנקודה.";
    case "rounding":
      return "בעיגול קל להתבלבל בספרה שאחריה. בדוק אם היא \u20660–4\u2069 (למטה) או \u20665–9\u2069 (למעלה).";
    case "equations":
      return "במשוואות מספר חסר רבים מנסים לנחש. כדאי להשתמש בפעולה ההפוכה ולהחזיר את שני הצדדים לאותו מספר.";
    case "compare":
      return "בהשוואת מספרים הטעות הנפוצה היא להתבלבל מי גדול יותר, במיוחד בעשרוניים. נסה להשוות קודם את החלק השלם.";
    case "number_sense":
      return "בדוק שוב את פירוק המספר לעשרות/מאות/יחידות או אם המספר זוגי/אי-זוגי. אלה דברים שקל להתבלבל בהם כשממהרים.";
    case "factors_multiples":
      return "בגורמים וכפולות קל להתבלבל בין \"מה מחלק את המספר\" לבין \"מה מתקבל כשמכפילים\". נסה לכתוב את כל הגורמים או הכפולות בצד.";
    case "word_problems":
      return "בתרגילי מילים הטעות הנפוצה היא לבחור פעולה לא נכונה (חיבור במקום חיסור וכו'). נסה לכתוב תרגיל פשוט שמתאים לסיפור.";
    default:
      return "";
  }
}

// Build detailed step-by-step explanation for the current question
export function buildStepExplanation(question) {
  if (!question) return null;

  const LTR = (expr) => `\u2066${expr}\u2069`;

  const p = question.params || {};

  const op = question.operation;
  const a = p.a ?? question.a;
  const b = p.b ?? question.b;
  const answer =
    question.correctAnswer !== undefined
      ? question.correctAnswer
      : question.answer;

  let exercise = "";
  let vertical = "";
  const steps = [];

  // נריץ את ההסבר על פעולה "אפקטיבית" – למשל:
  // 53 + (-3) → פעולה אפקטיבית: חיסור 53 - 3
  let effectiveOp = op;
  let aEff = a;
  let bEff = b;

  // אם זה חיבור עם מספר שני שלילי – נמיר לחיסור רגיל
  if (op === "addition" && typeof b === "number" && b < 0) {
    effectiveOp = "subtraction";
    bEff = Math.abs(b);

    steps.push(
      `0. שמים לב שתרגיל החיבור ${LTR(
        `${a} + (${b})`
      )} הוא בעצם כמו חיסור: ${LTR(`${a} - ${Math.abs(b)}`)}.`
    );
  }

  // טיפול בתרגילי השלמה - משתמש בפונקציה הכללית
  const missingConversion = convertMissingNumberEquation(op, p.kind, p);
  if (missingConversion) {
    effectiveOp = missingConversion.effectiveOp;
    aEff = missingConversion.top;
    bEff = missingConversion.bottom;
  }

  // טיפול בתרגילי השלמה בחיבור - הופכים לחיסור (להסבר מפורט)
  if (
    op === "addition" &&
    (p.kind === "add_missing_first" || p.kind === "add_missing_second")
  ) {
    const c = p.c; // התוצאה הסופית
    let leftNum, rightNum;

    if (p.kind === "add_missing_first") {
      // __ + b = c  →  c - b = __
      leftNum = c;
      rightNum = p.b;
      exercise = LTR(`${BLANK} + ${p.b} = ${c}`);
    } else {
      // a + __ = c  →  c - a = __
      leftNum = c;
      rightNum = p.a;
      exercise = LTR(`${p.a} + ${BLANK} = ${c}`);
    }

    const missing = answer;
    vertical = buildVerticalOperation(leftNum, rightNum, "-");

    steps.push(
      `1. הופכים את התרגיל לחיסור: במקום ${exercise} כותבים ${LTR(
        `${c} - ${rightNum} = ${BLANK}`
      )}.`
    );
    steps.push(
      "2. כותבים את המספרים זה מתחת לזה בעמודות: עשרות מעל עשרות ויחידות מעל יחידות."
    );

    // חישוב ספרה ספרה
    const topStr = String(leftNum);
    const bottomStr = String(rightNum);
    const maxLen = Math.max(topStr.length, bottomStr.length);
    const topPadded = topStr.padStart(maxLen, "0");
    const bottomPadded = bottomStr.padStart(maxLen, "0");

    let borrow = 0;
    let stepIndex = 3;
    const resultDigits = [];

    for (let i = maxLen - 1; i >= 0; i--) {
      let topDigit = Number(topPadded[i]);
      const bottomDigit = Number(bottomPadded[i]);
      topDigit -= borrow;

      const placeName =
        i === maxLen - 1
          ? "יחידות"
          : i === maxLen - 2
          ? "עשרות"
          : "מאות ומעלה";

      if (topDigit < bottomDigit) {
        steps.push(
          `${stepIndex}. בעמודת ה${placeName} ${topDigit} קטן מ-${bottomDigit}, לכן לוקחים "השאלה" מהעמודה הבאה (מוסיפים 10 לספרה הזו ומפחיתים 1 בעמודה הבאה).`
        );
        topDigit += 10;
        borrow = 1;
        stepIndex++;
      } else {
        borrow = 0;
      }

      const diff = topDigit - bottomDigit;
      resultDigits.unshift(diff);
      steps.push(
        `${stepIndex}. כעת מחשבים בעמודת ה${placeName}: ${LTR(
          `${topDigit} - ${bottomDigit} = ${diff}`
        )} וכותבים ${diff} בעמודה זו.`
      );
      stepIndex++;
    }

    steps.push(
      `5. המספר שנוצר הוא ${missing}. זה המספר שחסר בתרגיל: ${
        p.kind === "add_missing_first"
          ? LTR(`${missing} + ${p.b} = ${c}`)
          : LTR(`${p.a} + ${missing} = ${c}`)
      }.`
    );

    return {
      exercise,
      vertical,
      steps,
    };
  }

  // טיפול בתרגילי השלמה בכפל - הופכים לחילוק (להסבר מפורט)
  if (
    op === "multiplication" &&
    (p.kind === "mul_missing_first" || p.kind === "mul_missing_second")
  ) {
    const c = p.c; // התוצאה הסופית
    let leftNum, rightNum;

    if (p.kind === "mul_missing_first") {
      // __ × b = c  →  c ÷ b = __
      leftNum = c;
      rightNum = p.b;
      exercise = LTR(`${BLANK} × ${p.b} = ${c}`);
    } else {
      // a × __ = c  →  c ÷ a = __
      leftNum = c;
      rightNum = p.a;
      exercise = LTR(`${p.a} × ${BLANK} = ${c}`);
    }

    const missing = answer;
    vertical = buildVerticalOperation(leftNum, rightNum, "÷");

    steps.push(
      `1. הופכים את התרגיל לחילוק: במקום ${exercise} כותבים ${LTR(
        `${c} ÷ ${rightNum} = ${BLANK}`
      )}.`
    );
    steps.push(
      `2. חילוק הוא בעצם הפוך מהכפל: כמה פעמים המספר ${rightNum} נכנס ב-${c}?`
    );
    
    if (typeof answer === "number") {
      steps.push(
        `3. בודקים: ${LTR(`${rightNum} × ${answer} = ${rightNum * answer}`)}. זה נותן לנו ${rightNum * answer}, שזה בדיוק ${c}.`
      );
      steps.push(
        `4. לכן המספר החסר הוא ${missing}. זה המספר שחסר בתרגיל: ${
          p.kind === "mul_missing_first"
            ? LTR(`${missing} × ${p.b} = ${c}`)
            : LTR(`${p.a} × ${missing} = ${c}`)
        }.`
      );
    }

    return {
      exercise,
      vertical,
      steps,
    };
  }

  // טיפול בתרגילי השלמה בחילוק (להסבר מפורט)
  if (
    op === "division" &&
    (p.kind === "div_missing_dividend" || p.kind === "div_missing_divisor")
  ) {
    const { dividend, divisor, quotient } = p;
    let leftNum, rightNum, opSymbol;

    if (p.kind === "div_missing_dividend") {
      // __ ÷ divisor = quotient  →  quotient × divisor = __ (כפל)
      leftNum = quotient;
      rightNum = divisor;
      opSymbol = "×";
      exercise = LTR(`${BLANK} ÷ ${divisor} = ${quotient}`);
      steps.push(
        `1. הופכים את התרגיל לכפל: במקום ${exercise} כותבים ${LTR(
          `${quotient} × ${divisor} = ${BLANK}`
        )}.`
      );
    } else {
      // dividend ÷ __ = quotient  →  dividend ÷ quotient = __ (חילוק)
      leftNum = dividend;
      rightNum = quotient;
      opSymbol = "÷";
      exercise = LTR(`${dividend} ÷ ${BLANK} = ${quotient}`);
      steps.push(
        `1. הופכים את התרגיל לחילוק: במקום ${exercise} כותבים ${LTR(
          `${dividend} ÷ ${quotient} = ${BLANK}`
        )}.`
      );
    }

    const missing = answer;
    vertical = buildVerticalOperation(leftNum, rightNum, opSymbol);

    if (p.kind === "div_missing_dividend") {
      steps.push(
        `2. כפל הוא בעצם חיבור חוזר: ${LTR(
          `${quotient} × ${divisor} = ${Array(quotient).fill(divisor).join(" + ")} = ${dividend}`
        )}.`
      );
      steps.push(
        `3. לכן המספר החסר הוא ${missing}. זה המספר שחסר בתרגיל: ${LTR(
          `${missing} ÷ ${divisor} = ${quotient}`
        )}.`
      );
    } else {
      steps.push(
        `2. חילוק הוא בעצם הפוך מהכפל: כמה פעמים המספר ${quotient} נכנס ב-${dividend}?`
      );
      if (typeof answer === "number") {
        steps.push(
          `3. בודקים: ${LTR(`${quotient} × ${answer} = ${quotient * answer}`)}. זה נותן לנו ${quotient * answer}, שזה בדיוק ${dividend}.`
        );
        steps.push(
          `4. לכן המספר החסר הוא ${missing}. זה המספר שחסר בתרגיל: ${LTR(
            `${dividend} ÷ ${missing} = ${quotient}`
          )}.`
        );
      }
    }

    return {
      exercise,
      vertical,
      steps,
    };
  }

  // תצוגת תרגיל בסיסית (אופקית) – רק חשבון
  if (aEff != null && bEff != null && typeof aEff === "number" && typeof bEff === "number") {
    let symbol = "";
    if (effectiveOp === "addition") symbol = "+";
    else if (effectiveOp === "subtraction") symbol = "−";
    else if (effectiveOp === "multiplication") symbol = "×";
    else if (effectiveOp === "division") symbol = "÷";

    exercise = LTR(`${aEff} ${symbol} ${bEff} = ${BLANK}`);
  } else {
    const raw = question.params?.exerciseText || question.question || "";
    exercise = raw ? LTR(raw) : "";
  }

  // טיפוסי הסבר לפי פעולה

  // חיבור
  if (effectiveOp === "addition" && typeof aEff === "number" && typeof bEff === "number") {
    vertical = buildVerticalOperation(aEff, bEff, "+");
    const aStr = String(aEff);
    const bStr = String(bEff);
    const maxLen = Math.max(aStr.length, bStr.length);
    const pa = aStr.padStart(maxLen, "0");
    const pb = bStr.padStart(maxLen, "0");

    steps.push(
      `1. כותבים את המספרים אחד מעל השני, כך שסַפְרות היחידות נמצאות באותה עמודה: ${LTR(
        `${aEff}\n+ ${bEff}`
      )}.`
    );

    let carry = 0;
    let stepIndex = 2;

    for (let i = maxLen - 1; i >= 0; i--) {
      const da = Number(pa[i]);
      const db = Number(pb[i]);
      const sum = da + db + carry;
      const ones = sum % 10;
      const newCarry = sum >= 10 ? 1 : 0;

      const placeName =
        i === maxLen - 1
          ? "יחידות"
          : i === maxLen - 2
          ? "עשרות"
          : "מאות ומעלה";

      let text = `${stepIndex}. מחברים את ספרת ה${placeName}: ${LTR(
        `${da} + ${db}${carry ? " + " + carry : ""} = ${sum}`
      )}. כותבים ${ones} בעמודת ה${placeName}`;
      if (newCarry) text += ` ומעבירים 1 לעמודת ה${placeName} הבאה.`;
      steps.push(text);

      carry = newCarry;
      stepIndex++;
    }

    if (carry) {
      steps.push(
        `${stepIndex}. בסוף החיבור נשאר לנו 1 נוסף, כותבים אותו משמאל כמספר חדש בעמודת המאות/אלפים.`
      );
      stepIndex++;
    }

    if (typeof answer === "number") {
      steps.push(
        `${stepIndex}. המספר שנוצר בסוף הוא ${answer}. זהו התשובה הסופית לתרגיל.`
      );
    }

    return {
      exercise,
      vertical,
      steps,
    };
  }

  // חיסור
  if (effectiveOp === "subtraction" && typeof aEff === "number" && typeof bEff === "number") {
    vertical = buildVerticalOperation(aEff, bEff, "-");
    const aStr = String(aEff);
    const bStr = String(bEff);
    const maxLen = Math.max(aStr.length, bStr.length);
    const pa = aStr.padStart(maxLen, "0");
    const pb = bStr.padStart(maxLen, "0");

    steps.push(
      `1. כותבים את המספרים אחד מעל השני, כך שסַפְרות היחידות, העשרות וכו' נמצאות באותו טור: ${LTR(
        `${aEff}\n- ${bEff}`
      )}.`
    );

    let borrow = 0;
    let stepIndex = 2;

    for (let i = maxLen - 1; i >= 0; i--) {
      let da = Number(pa[i]);
      const db = Number(pb[i]);
      da -= borrow;

      const placeName =
        i === maxLen - 1
          ? "יחידות"
          : i === maxLen - 2
          ? "עשרות"
          : "מאות ומעלה";

      if (da < db) {
        steps.push(
          `${stepIndex}. בעמודת ה${placeName} ${da} קטן מ-${db}, לכן לוקחים "השאלה" מהעמודה הבאה (מוסיפים 10 לספרה הזו ומפחיתים 1 בעמודה הבאה).`
        );
        da += 10;
        borrow = 1;
      } else {
        borrow = 0;
      }

      const diff = da - db;
      stepIndex++;

      steps.push(
        `${stepIndex}. כעת מחשבים בעמודת ה${placeName}: ${LTR(
          `${da} - ${db} = ${diff}`
        )} וכותבים ${diff} בעמודה זו.`
      );
      stepIndex++;
    }

    if (typeof answer === "number") {
      steps.push(
        `${stepIndex}. המספר שקיבלנו בסוף הוא ${answer}. זו התוצאה של החיסור.`
      );
    }

    return {
      exercise,
      vertical,
      steps,
    };
  }

  // כפל
  if (
    effectiveOp === "multiplication" &&
    typeof aEff === "number" &&
    typeof bEff === "number"
  ) {
    vertical = LTR(`${aEff}\n× ${bEff}`);

    steps.push(
      "1. מבינים שהכפל הוא חיבור חוזר: למשל 3 × 4 זה כמו 4 + 4 + 4."
    );
    steps.push(
      `2. במקרה שלנו מחשבים: ${LTR(
        `${aEff} × ${bEff}`
      )}. אפשר לחשב כ-${aEff} פעמים המספר ${bEff} או ${bEff} פעמים המספר ${aEff}.`
    );

    if (aEff <= 12 && bEff <= 12) {
      const smaller = Math.min(aEff, bEff);
      const bigger = Math.max(aEff, bEff);
      steps.push(
        `3. למשל: ${LTR(
          `${smaller} × ${bigger} = ${Array(smaller)
            .fill(bigger)
            .join(" + ")} = ${answer}`
        )}.`
      );
    } else if (typeof answer === "number") {
      steps.push(
        `3. משתמשים בטבלת כפל או פירוק לגורמים כדי להגיע לתוצאה ${answer}.`
      );
    }

    if (typeof answer === "number") {
      steps.push(`4. לכן ${LTR(`${aEff} × ${bEff} = ${answer}`)}.`);
    }

    return {
      exercise,
      vertical,
      steps,
    };
  }

  // חילוק
  if (effectiveOp === "division" && typeof aEff === "number" && typeof bEff === "number") {
    steps.push(
      `1. חלוקה היא בעצם הפוך מהכפל: כמה פעמים המספר ${bEff} נכנס ב-${aEff}?`
    );
    if (typeof answer === "number") {
      const q = Math.floor(answer);
      const r = aEff - q * bEff;
      steps.push(
        `2. בודקים: ${LTR(`${bEff} × ${q} = ${bEff * q}`)}. זה נותן לנו ${
          bEff * q
        } מתוך ${aEff}.`
      );

      if (r > 0) {
        steps.push(
          `3. נשאר שארית: ${LTR(
            `${aEff} - ${bEff * q} = ${r}`
          )}. כלומר התשובה היא ${q} עם שארית ${r}.`
        );
      } else {
        steps.push(
          `3. אין שארית ולכן ${aEff} מתחלק ב-${bEff} בדיוק ${q} פעמים (ללא שארית).`
        );
      }
    }

    return {
      exercise,
      vertical,
      steps,
    };
  }

  // תרגיל מילים – הסבר כללי
  if (op === "word_problems") {
    steps.push("1. קוראים את שאלת המילים לאט ומסמנים את הנתונים החשובים.");
    steps.push(
      "2. מחליטים אם צריך לחבר, לחסר, לכפול או לחלק לפי הסיפור (האם הכמות גדלה, קטנה, חוזרת על עצמה או מתחלקת?)."
    );
    steps.push(
      "3. כותבים תרגיל חשבוני שמתאים לסיפור, פותרים אותו ואז עונים במשפט מלא."
    );
    if (typeof answer === "number") {
      steps.push(`4. החישוב נותן לנו ${answer}, ולכן זו התשובה לשאלה.`);
    }

    return {
      exercise,
      vertical,
      steps,
    };
  }

  // כל השאר (שברים, אחוזים וכו') – הסבר כללי
  steps.push(
    "1. בודקים איזה סוג פעולה זו (חיבור, חיסור, כפל או חילוק) ומסדרים את המספרים בצורה נוחה על הדף."
  );
  steps.push("2. פותרים שלב־אחר־שלב, בלי לדלג, ומסמנים כל שלב בדרך.");
  if (typeof answer === "number") {
    steps.push(`3. בסוף מקבלים את התוצאה ${answer}.`);
  }

  return {
    exercise,
    vertical,
    steps,
  };
}

