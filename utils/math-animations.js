export function buildVerticalOperation(topNumber, bottomNumber, operator = "-") {
  const top = String(topNumber);
  const bottom = String(bottomNumber);
  
  // טיפול מיוחד לחילוק ארוך - המחולק משמאל עם סוגר, המחלק מימין
  if (operator === "÷") {
    // בחילוק ארוך התצוגה הנכונה היא:
    //  ____
    // 1320│6
    // הקו האופקי הוא קו תחתון (underscore) בשורה הראשונה, בתחתית השורה
    // הפרמטרים מועברים כך: topNumber = divisor (מחלק), bottomNumber = dividend (מחולק)
    
    const divisor = String(topNumber); // המחלק (6)
    const dividend = String(bottomNumber); // המחולק (1320)
    const dividendLen = dividend.length;
    
    // שורה 1: קו תחתון (underscore) - בשורה הראשונה, בתחתית השורה, באורך המחולק
    // הקו התחתון מיושר בדיוק מעל המחולק, מוזז ימינה ליישור מדויק
    const line1 = "_".repeat(dividendLen) + " ";
    
    // שורה 2: המחולק (dividend) + סוגר אנכי (│) + המחלק (divisor)
    // הקו התחתון בשורה 1 מיושר בדיוק מעל המחולק בשורה 2
    const line2 = dividend + "│" + divisor;
    
    // יצירת הפורמט המדויק - הקו התחתון בשורה הראשונה בתחתית השורה, מוזז שמאלה
    const raw = line1 + "\n" + line2;
    // עוטפים את כל הבלוק בסימון LTR כדי שלא יתבלגן בתוך טקסט עברי
    return `\u2066${raw}\u2069`;
  }
  
  // לפעולות אחרות - התצוגה המקורית
  // טיפול מיוחד בעשרוניים - יישור לפי הנקודה העשרונית
  const topHasDecimal = top.includes(".");
  const bottomHasDecimal = bottom.includes(".");
  
  if (topHasDecimal || bottomHasDecimal) {
    // יישור לפי הנקודה העשרונית
    const topParts = top.split(".");
    const bottomParts = bottom.split(".");
    const topInt = topParts[0] || "";
    const topDec = topParts[1] || "";
    const bottomInt = bottomParts[0] || "";
    const bottomDec = bottomParts[1] || "";
    
    // אורך החלק השלם והחלק העשרוני
    const maxIntLen = Math.max(topInt.length, bottomInt.length);
    const maxDecLen = Math.max(topDec.length, bottomDec.length);
    
    // יישור החלק השלם (מימין) והחלק העשרוני (משמאל)
    const topIntPadded = topInt.padStart(maxIntLen, " ");
    const bottomIntPadded = bottomInt.padStart(maxIntLen, " ");
    const topDecPadded = topDec.padEnd(maxDecLen, "0");
    const bottomDecPadded = bottomDec.padEnd(maxDecLen, "0");
    
    const topFormatted = topHasDecimal ? `${topIntPadded}.${topDecPadded}` : topIntPadded;
    const bottomFormatted = bottomHasDecimal ? `${bottomIntPadded}.${bottomDecPadded}` : bottomIntPadded;
    
    const totalWidth = maxIntLen + 1 + maxDecLen + 2; // 1 לנקודה, 2 לתו הפעולה ולרווח
    
    const line1 = " ".repeat(totalWidth - topFormatted.length) + topFormatted;
    const line2 = operator + " " + " ".repeat(maxIntLen + 1 + maxDecLen - bottomFormatted.length) + bottomFormatted;
    const line3 = "-".repeat(totalWidth);
    
    const raw = `${line1}\n${line2}\n${line3}`;
    return `\u2066${raw}\u2069`;
  }
  
  // לפעולות רגילות (ללא עשרוניים)
  const maxLen = Math.max(top.length, bottom.length);
  const width = maxLen + 2; // 2 לתו הפעולה ולרווח

  const line1 = " ".repeat(width - top.length) + top;
  const line2 = operator + " " + " ".repeat(maxLen - bottom.length) + bottom;
  const line3 = "-".repeat(width);

  const raw = `${line1}\n${line2}\n${line3}`;

  // עוטפים את כל הבלוק בסימון LTR כדי שלא יתבלגן בתוך טקסט עברי
  return `\u2066${raw}\u2069`;
}

// פונקציה כללית לטיפול בתרגילי השלמה
export function convertMissingNumberEquation(op, kind, params) {
  if (!params || !kind) return null;
  
  const { a, b, c } = params;
  
  // חיבור: __ + b = c או a + __ = c → חיסור
  if (op === "addition" && (kind === "add_missing_first" || kind === "add_missing_second")) {
    if (kind === "add_missing_first") {
      // __ + b = c  →  c - b = __
      return {
        effectiveOp: "subtraction",
        top: c,
        bottom: b,
        answer: a
      };
    } else {
      // a + __ = c  →  c - a = __
      return {
        effectiveOp: "subtraction",
        top: c,
        bottom: a,
        answer: b
      };
    }
  }
  
  // חיסור: __ - b = c או a - __ = c
  if (op === "subtraction" && (kind === "sub_missing_first" || kind === "sub_missing_second")) {
    if (kind === "sub_missing_first") {
      // __ - b = c  →  c + b = __ (חיבור)
      return {
        effectiveOp: "addition",
        top: c,
        bottom: b,
        answer: a
      };
    } else {
      // a - __ = c  →  a - c = __ (חיסור)
      return {
        effectiveOp: "subtraction",
        top: a,
        bottom: c,
        answer: b
      };
    }
  }
  
  // כפל: __ × b = c או a × __ = c → חילוק
  if (op === "multiplication" && (kind === "mul_missing_first" || kind === "mul_missing_second")) {
    if (kind === "mul_missing_first") {
      // __ × b = c  →  c ÷ b = __
      return {
        effectiveOp: "division",
        top: c,
        bottom: b,
        answer: a
      };
    } else {
      // a × __ = c  →  c ÷ a = __
      return {
        effectiveOp: "division",
        top: c,
        bottom: a,
        answer: b
      };
    }
  }
  
  // חילוק: __ ÷ divisor = quotient או dividend ÷ __ = quotient
  if (op === "division" && (kind === "div_missing_dividend" || kind === "div_missing_divisor")) {
    const { dividend, divisor, quotient } = params;
    
    if (kind === "div_missing_dividend") {
      // __ ÷ divisor = quotient  →  quotient × divisor = __ (כפל)
      return {
        effectiveOp: "multiplication",
        top: quotient,
        bottom: divisor,
        answer: dividend
      };
    } else {
      // dividend ÷ __ = quotient  →  dividend ÷ quotient = __ (חילוק)
      return {
        effectiveOp: "division",
        top: dividend,
        bottom: quotient,
        answer: divisor
      };
    }
  }
  
  return null;
}

// פונקציה לבניית צעדי אנימציה לחיבור וחיסור
export function buildAdditionOrSubtractionAnimation(a, b, answer, op) {
  const steps = [];
  const aStr = String(a);
  const bStr = String(Math.abs(b));
  const maxLen = Math.max(aStr.length, bStr.length);
  const pa = aStr.padStart(maxLen, "0");
  const pb = bStr.padStart(maxLen, "0");

  const padLeft = (s, w) => String(s).padStart(w, " ");
  const repeat = (ch, n) => Array(Math.max(0, n)).fill(ch).join("");
  const maskAnswerRight = (full, revealDigits) => {
    const s = String(full);
    let out = s.split("");
    let seenDigits = 0;
    for (let i = out.length - 1; i >= 0; i--) {
      const ch = out[i];
      if (/\d/.test(ch)) {
        if (seenDigits < revealDigits) {
          seenDigits++;
        } else {
          out[i] = " ";
        }
      }
    }
    return out.join("");
  };
  const makeVerticalSnapshot = ({ operator, top, bottom, answerFull, revealDigits, carryRow = null }) => {
    const topS = String(top);
    const bottomS = String(bottom);
    const ansS = String(answerFull);
    const maxDigits = Math.max(topS.replace(/\D/g, "").length, bottomS.replace(/\D/g, "").length, ansS.replace(/\D/g, "").length);
    const w = Math.max(maxDigits, ansS.length, topS.length, bottomS.length) + 2;

    const line1 = padLeft(topS, w);
    const line2 = operator + " " + padLeft(bottomS, w - 2);
    const line3 = repeat("-", w);
    const masked = maskAnswerRight(padLeft(ansS, w), revealDigits);
    const lines = [];
    if (carryRow && carryRow.trim()) {
      lines.push(padLeft(carryRow, w));
    }
    lines.push(line1, line2, line3, masked);
    return lines.join("\n");
  };

  if (op === "addition") {
    const answerStr = String(answer);
    const answerLen = answerStr.length;
    const carryMarks = []; // positions in printable width where carry should appear
    
    // צעד 1: מיישרים את הספרות
    steps.push({
      id: "place-value",
      title: "מיישרים את הספרות",
      text: "כותבים את המספרים אחד מעל השני כך שסַפְרות היחידות נמצאות באותה עמודה.",
      highlights: ["aAll", "bAll"],
      revealDigits: 0, // עדיין לא מראים כלום
      pre: makeVerticalSnapshot({
        operator: "+",
        top: a,
        bottom: Math.abs(b),
        answerFull: answer,
        revealDigits: 0,
        carryRow: "",
      }),
    });

    // חישוב ספרה ספרה
    let carry = 0;
    let stepIndex = 2;
    let revealedCount = 0; // כמה ספרות כבר נחשפו

    // הכנה: רוחב הציור (כדי שנוכל למקם נשיאות)
    const topS = String(a);
    const bottomS = String(Math.abs(b));
    const ansS = String(answer);
    const maxDigits = Math.max(topS.length, bottomS.length, ansS.length);
    const w = maxDigits + 2;
    const digitsStart = w - maxLen; // איפה מתחילים הספרות (ימין-מיושר)
    const carryRowArr = Array(w).fill(" ");

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

      const highlightKey = i === maxLen - 1 ? "Units" : i === maxLen - 2 ? "Tens" : "Hundreds";

      revealedCount++; // חושפים ספרה נוספת

      // עדכון שורת נשיאות: הנשיאה עוברת לעמודה שמשמאל (i-1)
      if (newCarry) {
        const targetDigitIndex = i - 1;
        const pos = targetDigitIndex >= 0 ? digitsStart + targetDigitIndex : digitsStart - 1;
        if (pos >= 0 && pos < carryRowArr.length) {
          carryRowArr[pos] = "1";
        }
      }

      const carryRowStr = carryRowArr.join("");
      steps.push({
        id: `step-${stepIndex}`,
        title: `ספרת ה${placeName}`,
        text: `מחברים את ספרת ה${placeName}: ${da} + ${db}${carry ? " + " + carry : ""} = ${sum}. כותבים ${ones} בעמודת ה${placeName}${newCarry ? " ומעבירים 1 לעמודה הבאה" : ""}.`,
        highlights: [`a${highlightKey}`, `b${highlightKey}`, `result${highlightKey}`],
        carry: newCarry,
        revealDigits: revealedCount, // כמה ספרות מימין חשופות
        pre: makeVerticalSnapshot({
          operator: "+",
          top: a,
          bottom: Math.abs(b),
          answerFull: answer,
          revealDigits: revealedCount,
          carryRow: carryRowStr,
        }),
      });

      carry = newCarry;
      stepIndex++;
    }

    if (carry) {
      revealedCount++; // אם יש carry, יש ספרה נוספת
      steps.push({
        id: "final-carry",
        title: "העברה נוספת",
        text: "בסוף החיבור נשאר לנו 1 נוסף, כותבים אותו משמאל כמספר חדש בעמודת המאות/אלפים.",
        highlights: ["resultAll"],
        revealDigits: revealedCount,
        pre: makeVerticalSnapshot({
          operator: "+",
          top: a,
          bottom: Math.abs(b),
          answerFull: answer,
          revealDigits: revealedCount,
          carryRow: carryRowArr.join(""),
        }),
      });
    }

    // צעד אחרון: התוצאה הסופית
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `המספר שנוצר הוא ${answer}. זהו התשובה הסופית לתרגיל.`,
      highlights: ["resultAll"],
      revealDigits: answerLen, // מראים את כל הספרות
      pre: makeVerticalSnapshot({
        operator: "+",
        top: a,
        bottom: Math.abs(b),
        answerFull: answer,
        revealDigits: answerStr.replace(/\D/g, "").length,
        carryRow: carryRowArr.join(""),
      }),
    });
  } else if (op === "subtraction") {
    const answerStr = String(answer);
    const answerLen = answerStr.length;
    
    // צעד 1: מיישרים את הספרות
    steps.push({
      id: "place-value",
      title: "מיישרים את הספרות",
      text: "כותבים את המספרים אחד מעל השני כך שסַפְרות היחידות, העשרות וכו' נמצאות באותו טור.",
      highlights: ["aAll", "bAll"],
      revealDigits: 0, // עדיין לא מראים כלום
      pre: makeVerticalSnapshot({
        operator: "−",
        top: a,
        bottom: Math.abs(b),
        answerFull: answer,
        revealDigits: 0,
      }),
    });

    // חישוב ספרה ספרה
    let borrow = 0;
    let stepIndex = 2;
    let revealedCount = 0; // כמה ספרות כבר נחשפו

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

      const highlightKey = i === maxLen - 1 ? "Units" : i === maxLen - 2 ? "Tens" : "Hundreds";

      if (da < db) {
        steps.push({
          id: `borrow-${stepIndex}`,
          title: `השאלה מעמודת ה${placeName}`,
          text: `בעמודת ה${placeName} ${da} קטן מ-${db}, לכן לוקחים "השאלה" מהעמודה הבאה (מוסיפים 10 לספרה הזו ומפחיתים 1 בעמודה הבאה).`,
          highlights: [`a${highlightKey}`, `b${highlightKey}`],
          revealDigits: revealedCount, // לא חושפים ספרה חדשה בשלב ההשאלה
          pre: makeVerticalSnapshot({
            operator: "−",
            top: a,
            bottom: Math.abs(b),
            answerFull: answer,
            revealDigits: revealedCount,
          }),
        });
        da += 10;
        borrow = 1;
        stepIndex++;
      } else {
        borrow = 0;
      }

      const diff = da - db;
      revealedCount++; // חושפים ספרה נוספת
      steps.push({
        id: `step-${stepIndex}`,
        title: `ספרת ה${placeName}`,
        text: `כעת מחשבים בעמודת ה${placeName}: ${da} - ${db} = ${diff} וכותבים ${diff} בעמודה זו.`,
        highlights: [`a${highlightKey}`, `b${highlightKey}`, `result${highlightKey}`],
        revealDigits: revealedCount, // כמה ספרות מימין חשופות
        pre: makeVerticalSnapshot({
          operator: "−",
          top: a,
          bottom: Math.abs(b),
          answerFull: answer,
          revealDigits: revealedCount,
        }),
      });

      stepIndex++;
    }

    // צעד אחרון: התוצאה הסופית
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `המספר שקיבלנו בסוף הוא ${answer}. זו התוצאה של החיסור.`,
      highlights: ["resultAll"],
      revealDigits: answerLen, // מראים את כל הספרות
      pre: makeVerticalSnapshot({
        operator: "−",
        top: a,
        bottom: Math.abs(b),
        answerFull: answer,
        revealDigits: answerStr.replace(/\D/g, "").length,
      }),
    });
  }

  return steps;
}

// פונקציה לבניית צעדי אנימציה לכפל (עם תרגיל מאונך)
export function buildMultiplicationAnimation(a, b, answer) {
  const steps = [];

  const toInt = (x) => (typeof x === "number" ? x : Number(x));
  const A = Math.abs(toInt(a));
  const B = Math.abs(toInt(b));
  const ansNum = typeof answer === "number" ? answer : Number(answer);
  const answerStr = String(answer);

  // helpers
  const digitsRev = (n) => String(n).split("").reverse().map((d) => Number(d));
  const padLeft = (s, w) => String(s).padStart(w, " ");
  const repeat = (ch, n) => Array(Math.max(0, n)).fill(ch).join("");

  const makeSnapshot = ({ partialRows = [], inProgressRow = null, sumRow = null }) => {
    const aStr = String(A);
    const bStr = String(B);
    // width: result width or max of rows
    const baseWidth = Math.max(
      aStr.length,
      bStr.length + 2,
      String(ansNum || answerStr).length,
      ...partialRows.map((r) => String(r).length),
      inProgressRow ? String(inProgressRow).length : 0
    );
    const w = Math.max(baseWidth, 6);

    const lines = [];
    lines.push(padLeft(aStr, w));
    lines.push("× " + padLeft(bStr, w - 2));
    lines.push(repeat("-", w));
    if (partialRows.length === 0) {
      // show blank area
    } else {
      partialRows.forEach((row) => lines.push(padLeft(row, w)));
    }
    if (inProgressRow) {
      lines.push(padLeft(inProgressRow, w));
    }
    if (sumRow != null) {
      lines.push(repeat("-", w));
      lines.push(padLeft(sumRow, w));
    }
    return lines.join("\n");
  };

  const formatInProgressRow = (digitsSoFarRev, totalDigitsNoCarry, shiftZeros) => {
    const known = digitsSoFarRev.slice().reverse().join("");
    const blanks = repeat(" ", Math.max(0, totalDigitsNoCarry - digitsSoFarRev.length));
    return `${blanks}${known}${repeat("0", shiftZeros)}`;
  };

  // צעד 1: סידור בעמודות
  steps.push({
    id: "place-value",
    title: "מיישרים את הספרות",
    text: "כותבים את שני המספרים אחד מתחת לשני, כך שסַפְרות היחידות נמצאות באותה עמודה.",
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
    pre: makeSnapshot({ partialRows: [] }),
  });

  // אם זה חד-ספרתי×חד-ספרתי: עדיין נפרט אבל קצר
  if (A < 10 && B < 10) {
    steps.push({
      id: "single-digit",
      title: "כפל חד-ספרתי",
      text: `מכפילים: ${A} × ${B} = ${ansNum}.`,
      highlights: ["aAll", "bAll", "resultAll"],
      revealDigits: answerStr.length,
      pre: makeSnapshot({ partialRows: [], sumRow: String(ansNum) }),
    });
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${ansNum}.`,
      highlights: ["resultAll"],
      revealDigits: answerStr.length,
      pre: makeSnapshot({ partialRows: [], sumRow: String(ansNum) }),
    });
    return steps;
  }

  steps.push({
    id: "explain",
    title: "מה עושים בכפל ארוך?",
    text: "נכפיל קודם את המספר העליון בכל ספרה של המספר התחתון (מימין לשמאל). כל שורה היא 'מכפלה חלקית'. אחר כך נחבר את כל המכפלות החלקיות.",
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
    pre: makeSnapshot({ partialRows: [] }),
  });

  const aDigits = digitsRev(A); // יחידות קודם
  const bDigits = digitsRev(B);

  const partials = []; // numbers as strings already shifted
  const rawPartials = []; // numeric partials without shift (for explanation)

  let globalStep = 1;

  for (let j = 0; j < bDigits.length; j++) {
    const bd = bDigits[j];
    let carry = 0;
    const rowDigits = [];

    steps.push({
      id: `row-${j}-start`,
      title: `שורה ${j + 1}: כופלים ב-${bd}${j === 0 ? " (יחידות)" : j === 1 ? " (עשרות)" : " (מקום גבוה)"}`,
      text: `כופלים את ${A} בספרה ${bd} של ${B}. מתחילים מימין (יחידות).`,
      highlights: ["aAll", "bAll"],
      revealDigits: 0,
      pre: makeSnapshot({ partialRows: partials.map((p) => p) }),
    });

    for (let i = 0; i < aDigits.length; i++) {
      const ad = aDigits[i];
      const prod = ad * bd + carry;
      const digit = prod % 10;
      const nextCarry = Math.floor(prod / 10);
      const place =
        i === 0 ? "ספרת היחידות" : i === 1 ? "ספרת העשרות" : i === 2 ? "ספרת המאות" : `ספרה במקום ${i + 1} מימין`;

      rowDigits.push(digit);

      const carryText = carry ? ` + נשיאה ${carry}` : "";
      const inProgressRow = formatInProgressRow(rowDigits, aDigits.length + 1, j);
      steps.push({
        id: `row-${j}-mul-${i}`,
        title: `כפל ${place}`,
        text: `מכפילים ${ad} × ${bd}${carryText} = ${prod}. כותבים ${digit} במקום הזה${nextCarry ? ` ונושאים ${nextCarry} לשלב הבא.` : " (אין נשיאה)."
          }`,
        highlights: ["aAll", "bAll"],
        revealDigits: 0,
        pre: makeSnapshot({ partialRows: partials.map((p) => p), inProgressRow }),
      });

      carry = nextCarry;
      globalStep++;
    }

    if (carry) {
      rowDigits.push(carry);
      const inProgressRow = formatInProgressRow(rowDigits, aDigits.length + 1, j);
      steps.push({
        id: `row-${j}-carry-end`,
        title: "נשיאה אחרונה",
        text: `בסוף השורה נשארה נשיאה ${carry}. כותבים אותה משמאל לשורה.`,
        highlights: ["aAll", "bAll"],
        revealDigits: 0,
        pre: makeSnapshot({ partialRows: partials.map((p) => p), inProgressRow }),
      });
    }

    const rowValue = Number(rowDigits.slice().reverse().join("") || "0");
    rawPartials.push(rowValue);

    const shifted = String(rowValue) + repeat("0", j);
    partials.push(shifted);

    steps.push({
      id: `row-${j}-done`,
      title: `מכפלה חלקית ${j + 1}`,
      text:
        j === 0
          ? `קיבלנו מכפלה חלקית: ${rowValue}.`
          : `קיבלנו ${rowValue}. כי כפלנו בספרת מקום גבוה (×${repeat("10", j).replace(/10/g, "10") || 10}), מוסיפים ${j} אפסים בסוף ⇒ ${shifted}.`,
      highlights: ["aAll", "bAll"],
      revealDigits: 0,
      pre: makeSnapshot({ partialRows: partials.map((p) => p) }),
    });
  }

  // חיבור מכפלות חלקיות
  steps.push({
    id: "sum-start",
    title: "מחברים את המכפלות החלקיות",
    text: "עכשיו מחברים את כל השורות שקיבלנו כדי לקבל את התוצאה הסופית.",
    highlights: ["resultAll"],
    revealDigits: 0,
    pre: makeSnapshot({ partialRows: partials.map((p) => p) }),
  });

  // פירוט חיבור עמודות (כמו חיבור ארוך), על בסיס מספרים מיושרים
  const maxW = Math.max(...partials.map((p) => p.length), String(ansNum || answerStr).length);
  const padded = partials.map((p) => p.padStart(maxW, "0").split("").reverse().map((d) => Number(d)));
  const resDigits = [];
  let carryAdd = 0;
  for (let col = 0; col < maxW; col++) {
    const colSum = padded.reduce((s, row) => s + (row[col] || 0), 0) + carryAdd;
    const digit = colSum % 10;
    const nextCarry = Math.floor(colSum / 10);
    resDigits[col] = digit;

    const place =
      col === 0 ? "יחידות" : col === 1 ? "עשרות" : col === 2 ? "מאות" : `מקום ${col + 1} מימין`;
    steps.push({
      id: `sum-col-${col}`,
      title: `חיבור בעמודת ה${place}`,
      text: `מחברים בעמודת ה${place}: סכום הספרות בעמודה${carryAdd ? ` + נשיאה ${carryAdd}` : ""} = ${colSum}. כותבים ${digit}${nextCarry ? ` ונושאים ${nextCarry}.` : "."}`,
      highlights: ["resultAll"],
      revealDigits: 0,
      pre: makeSnapshot({ partialRows: partials.map((p) => p), sumRow: padLeft(String(resDigits.slice().reverse().join("")).replace(/^0+/, "") || "0", maxW) }),
    });

    carryAdd = nextCarry;
  }
  if (carryAdd) {
    resDigits.push(carryAdd);
    steps.push({
      id: "sum-carry-end",
      title: "נשיאה אחרונה בחיבור",
      text: `נשארה נשיאה ${carryAdd} בסוף, כותבים אותה משמאל.`,
      highlights: ["resultAll"],
      revealDigits: 0,
      pre: makeSnapshot({ partialRows: partials.map((p) => p), sumRow: String(resDigits.slice().reverse().join("")).replace(/^0+/, "") || "0" }),
    });
  }

  const sumStr = String(resDigits.slice().reverse().join("")).replace(/^0+/, "") || "0";

  steps.push({
    id: "final",
    title: "התוצאה הסופית",
    text: `אחרי שחיברנו את כל המכפלות החלקיות קיבלנו: ${A} × ${B} = ${sumStr}.`,
    highlights: ["resultAll"],
    revealDigits: answerStr.length,
    pre: makeSnapshot({ partialRows: partials.map((p) => p), sumRow: sumStr }),
  });

  // בדיקה קצרה (אם יש תשובה צפויה)
  if (!Number.isNaN(ansNum) && sumStr !== String(ansNum)) {
    steps.push({
      id: "note",
      title: "בדיקה",
      text: `שימו לב: לפי השלבים יצא ${sumStr} אבל התשובה השמורה לשאלה היא ${ansNum}. אם זה קורה, כנראה שיש פרמטרים מיוחדים בשאלה (למשל מספרים עם סימן/המרה).`,
      highlights: ["resultAll"],
      revealDigits: answerStr.length,
      pre: makeSnapshot({ partialRows: partials.map((p) => p), sumRow: sumStr }),
    });
  }

  return steps;
}

// פונקציה לבניית צעדי אנימציה לחילוק ארוך (עם תרגיל מאונך)
export function buildDivisionAnimation(dividend, divisor, quotient) {
  const steps = [];
  const dividendStr = String(dividend);
  const divisorStr = String(divisor);
  const quotientStr = String(quotient);
  const dividendLen = dividendStr.length;
  const repeat = (ch, n) => Array(Math.max(0, n)).fill(ch).join("");

  // בניית ASCII של חילוק ארוך (LTR) כשהמחולק משמאל כמו שהיה אצלך:
  //    31
  //   ____
  // 94│3
  //  9
  // --
  // 04
  //  3
  // --
  //  1
  // שימו לב: יש קו אנכי (│) רק בשורת הבסיס "מחולק│מחלק" — בלי קווים מיותרים בשאר השורות.
  // כדי שהמנה והקו יהיו בדיוק מעל המחולק (גם כשמיישרים למרכז), כל השורות חייבות להיות באותו רוחב:
  // רוחב = אורך המחולק + "│" + אורך המחלק
  const totalWidth = dividendLen + 1 + divisorStr.length;
  const padToWidth = (s) => String(s).padEnd(totalWidth, " ");

  const makeWorkLineAt = (position, text) => {
    const t = String(text);
    const line = Array(dividendLen).fill(" ");
    const end = Math.min(position, dividendLen - 1);
    const start = Math.max(0, end - t.length + 1);
    for (let i = 0; i < t.length; i++) {
      const idx = start + i;
      if (idx >= 0 && idx < dividendLen) line[idx] = t[i];
    }
    return padToWidth(line.join(""));
  };

  const quotientLineArr = Array(dividendLen).fill(" ");
  const workLines = [];
  const makePre = () => {
    // מנה מעל המחולק (רק מעל אזור המחולק)
    const line1 = padToWidth(quotientLineArr.join(""));
    // קו המנה - אותו אורך כמו המחולק, ומרופד לרוחב מלא כדי שלא "יזוז" במרכז
    const line2 = padToWidth(repeat("_", dividendLen));
    const line3 = padToWidth(dividendStr + "│" + divisorStr);
    // עוטפים ב-LTR markers כדי שלא יתבלגן בתוך טקסט עברי
    return `\u2066${[line1, line2, line3, ...workLines].join("\n")}\u2069`;
  };
  
  // חישוב חילוק ארוך צעד אחר צעד
  const divisionSteps = [];
  let workingNumber = 0;
  let quotientPos = 0;
  let startPos = 0; // מיקום ההתחלה של workingNumber
  
  for (let i = 0; i < dividendStr.length; i++) {
    // אם workingNumber הוא 0, זה תחילת מספר חדש
    if (workingNumber === 0) {
      startPos = i;
    }
    
    workingNumber = workingNumber * 10 + parseInt(dividendStr[i]);
    
    if (workingNumber >= divisor) {
      const qDigit = Math.floor(workingNumber / divisor);
      const product = qDigit * divisor;
      const remainder = workingNumber - product;
      const wNumLen = String(workingNumber).length;
      
      divisionSteps.push({
        position: i, // מיקום הספרה האחרונה (הימנית ביותר)
        startPosition: startPos, // מיקום הספרה הראשונה (השמאלית ביותר)
        workingNumber,
        quotientDigit: qDigit,
        product,
        remainder,
        quotientPosition: quotientPos,
        workingNumberLength: wNumLen,
      });
      
      quotientPos++;
      workingNumber = remainder;
      // אם יש שארית, המיקום הבא יתחיל מהמיקום הנוכחי + 1
      startPos = remainder > 0 ? i : i + 1;
    }
  }
  
  // צעד 1: הצגת השאלה
  steps.push({
    id: "place-value",
    title: "הצגת השאלה",
    text: `נחלק ${dividend} ב-${divisor}. נכתוב את המחולק והמחלק בצורת חילוק ארוך.`,
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
    type: "division",
    dividend,
    divisor,
    quotient,
    pre: makePre(),
  });
  
  // יצירת צעדים מפורטים לכל שלב בחילוק
  for (let stepIndex = 0; stepIndex < divisionSteps.length; stepIndex++) {
    const step = divisionSteps[stepIndex];
    const { position, workingNumber: wNum, quotientDigit: qDigit, product, remainder, quotientPosition } = step;
    
    // צעד: כתיבה במנה
    quotientLineArr[position] = String(qDigit);
    steps.push({
      id: `step-${stepIndex + 1}-write`,
      title: `צעד ${stepIndex + 1}: כתיבה במנה`,
      text: `${divisor} נכנס ב-${wNum} בדיוק ${qDigit} פעמים. כותבים ${qDigit} במנה מעל הספרה ${dividendStr[position]}.`,
      highlights: [`result${quotientPosition}`, `a${position}`],
      revealDigits: quotientPosition + 1,
      type: "division",
      dividend,
      divisor,
      quotient,
      stepIndex,
      quotientDigit: qDigit,
      workingNumber: wNum,
      pre: makePre(),
    });
    
    // צעד: כפל וחיסור
    // מוסיפים שורות עבודה: מכפלה, קו, שארית (מיושר מתחת לחלק הרלוונטי במחולק)
    workLines.push(makeWorkLineAt(position, product));
    workLines.push(makeWorkLineAt(position, repeat("-", String(product).length)));
    workLines.push(makeWorkLineAt(position, remainder));
    steps.push({
      id: `step-${stepIndex + 1}-subtract`,
      title: `צעד ${stepIndex + 1}: כפל וחיסור`,
      text: `מכפילים: ${qDigit} × ${divisor} = ${product}. מחסרים: ${wNum} - ${product} = ${remainder}. ${remainder === 0 ? 'אין שארית.' : `השארית היא ${remainder}.`}`,
      highlights: [`a${position}`, "bAll", `result${quotientPosition}`, `product${stepIndex}`, `remainder${stepIndex}`],
      revealDigits: quotientPosition + 1,
      type: "division",
      dividend,
      divisor,
      quotient,
      stepIndex,
      product,
      remainder,
      workingNumber: wNum,
      pre: makePre(),
    });
    
    // אם לא זה הצעד האחרון, מורידים את הספרה הבאה
    if (stepIndex < divisionSteps.length - 1 && position < dividendStr.length - 1) {
      const nextStep = divisionSteps[stepIndex + 1];
      const nextDigitPos = nextStep.position;
      // שורת עבודה: המספר החדש לחלוקה (השארית + הספרה שהורדנו) — מציגים גם 0 מוביל כשצריך (למשל 04)
      const bringDownStr = `${remainder}${dividendStr[nextDigitPos]}`;
      workLines.push(makeWorkLineAt(nextDigitPos, bringDownStr));
      steps.push({
        id: `step-${stepIndex + 1}-bring-down`,
        title: `צעד ${stepIndex + 1}: הורדת ספרה`,
        text: `מורידים את הספרה הבאה (${dividendStr[nextDigitPos]}). המספר החדש לחלוקה הוא ${bringDownStr}.`,
        highlights: [`a${nextDigitPos}`],
        revealDigits: quotientPosition + 1,
        type: "division",
        dividend,
        divisor,
        quotient,
        stepIndex,
        nextDigit: parseInt(dividendStr[nextDigitPos]),
        newNum: nextStep.workingNumber,
        pre: makePre(),
      });
    }
  }
  
  // צעד אחרון: התוצאה הסופית
  const finalRemainder = divisionSteps.length > 0 ? divisionSteps[divisionSteps.length - 1].remainder : 0;
  steps.push({
    id: "final",
    title: "התוצאה הסופית",
    text: `סיימנו! המנה היא ${quotient}${finalRemainder > 0 ? ` והשארית היא ${finalRemainder}` : ' בלי שארית'}.`,
    highlights: ["resultAll"],
    revealDigits: quotientStr.length,
    type: "division",
    dividend,
    divisor,
    quotient,
    remainder: finalRemainder,
    pre: makePre(),
  });
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה לשברים
export function buildFractionsAnimation(params, answer) {
  const steps = [];
  
  if (params.kind === "frac_same_den") {
    const { n1, n2, den, op } = params;
    const isAdd = op === "add";
    
    // צעד 1: הצגת השברים
    steps.push({
      id: "show-fractions",
      title: "הצגת השברים",
      text: `יש לנו שני שברים עם אותו מכנה: ${n1}/${den} ${isAdd ? "+" : "-"} ${n2}/${den}`,
      highlights: ["fraction1", "fraction2"],
      type: "fractions",
      params,
      answer,
    });
    
    // צעד 2: הסבר על מכנה משותף
    steps.push({
      id: "same-denominator",
      title: "מכנה משותף",
      text: `יש לנו אותו מכנה (${den}). במכנה לא נוגעים – עובדים רק על המונים.`,
      highlights: ["denominator"],
      type: "fractions",
      params,
      answer,
    });
    
    // צעד 3: חיבור/חיסור המונים
    const resNum = isAdd ? n1 + n2 : n1 - n2;
    steps.push({
      id: "calculate-numerators",
      title: "חישוב המונים",
      text: `${isAdd ? "מחברים" : "מחסרים"} את המונים: ${n1} ${isAdd ? "+" : "-"} ${n2} = ${resNum}`,
      highlights: ["numerators"],
      type: "fractions",
      params,
      answer,
    });
    
    // צעד 4: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `המכנה נשאר ${den} – לכן התשובה היא ${answer}`,
      highlights: ["result"],
      type: "fractions",
      params,
      answer,
    });
  } else if (params.kind === "frac_diff_den") {
    const { n1, den1, n2, den2, commonDen, op } = params;
    const isAdd = op === "add";
    
    // צעד 1: הצגת השברים
    steps.push({
      id: "show-fractions",
      title: "הצגת השברים",
      text: `יש לנו שני שברים עם מכנים שונים: ${n1}/${den1} ${isAdd ? "+" : "-"} ${n2}/${den2}`,
      highlights: ["fraction1", "fraction2"],
      type: "fractions",
      params,
      answer,
    });
    
    // צעד 2: מציאת מכנה משותף
    steps.push({
      id: "find-common",
      title: "מציאת מכנה משותף",
      text: `מוצאים מכנה משותף – כאן ${commonDen}`,
      highlights: ["commonDen"],
      type: "fractions",
      params,
      answer,
    });
    
    // צעד 3: המרה למכנה משותף
    const m1 = commonDen / den1;
    const m2 = commonDen / den2;
    steps.push({
      id: "convert",
      title: "המרה למכנה משותף",
      text: `מעבירים כל שבר למכנה המשותף: ${n1}/${den1} = ${n1 * m1}/${commonDen}, ${n2}/${den2} = ${n2 * m2}/${commonDen}`,
      highlights: ["convert1", "convert2"],
      type: "fractions",
      params,
      answer,
    });
    
    // צעד 4: חיבור/חיסור
    const resNum = isAdd ? n1 * m1 + n2 * m2 : n1 * m1 - n2 * m2;
    steps.push({
      id: "calculate",
      title: "חישוב",
      text: `אחרי שהמכנים זהים – עובדים על המונים בלבד: ${n1 * m1} ${isAdd ? "+" : "-"} ${n2 * m2} = ${resNum}`,
      highlights: ["calculation"],
      type: "fractions",
      params,
      answer,
    });
    
    // צעד 5: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${answer}`,
      highlights: ["result"],
      type: "fractions",
      params,
      answer,
    });
  }
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה לעשרוניים (עם תרגיל מאונך)
export function buildDecimalsAnimation(params, answer) {
  const steps = [];
  const { a, b, kind } = params;
  const aStr = a.toFixed(2);
  const bStr = b.toFixed(2);
  const answerStr = answer.toFixed(2);
  const opSymbol = kind === "dec_add" ? "+" : "−";
  const answerDigitsCount = answerStr.replace(/\D/g, "").length;
  const preBase = buildVerticalOperation(aStr, bStr, opSymbol);
  
  // צעד 1: מיישרים את הנקודות העשרוניות
  steps.push({
    id: "place-value",
    title: "מיישרים את הנקודות העשרוניות",
    text: "כותבים את המספרים אחד מעל השני כך שהנקודות העשרוניות נמצאות באותה עמודה.",
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
    pre: preBase + "\n" + "\n", // מקום לתוצאה
  });
  
  // צעד 2: הסבר
  steps.push({
    id: "explain",
    title: "חישוב עשרוניים",
    text: `מבצעים ${kind === "dec_add" ? "חיבור" : "חיסור"} רגיל בין המספרים אחרי היישור. חשוב: הנקודה העשרונית נשארת באותה עמודה בתוצאה.`,
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
    pre: preBase + "\n" + "\n",
  });
  
  // צעד 3: החישוב - חשיפה הדרגתית
  steps.push({
    id: "calculate",
    title: "החישוב",
    text: `מחשבים עמודה-עמודה כמו במספרים רגילים: ${aStr} ${opSymbol} ${bStr} = ${answerStr}`,
    highlights: ["aAll", "bAll", "resultAll"],
    revealDigits: answerDigitsCount,
    pre: preBase + "\n" + `  ${answerStr}`,
  });
  
  // צעד 4: התוצאה הסופית
  steps.push({
    id: "final",
    title: "התוצאה הסופית",
    text: `התשובה היא ${answerStr}`,
    highlights: ["resultAll"],
    revealDigits: answerDigitsCount,
    pre: preBase + "\n" + `  ${answerStr}`,
  });
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה לאחוזים
export function buildPercentagesAnimation(params, answer) {
  const steps = [];
  const { base, p, kind } = params;
  
  if (kind === "perc_part_of") {
    // צעד 1: הצגת השאלה
    steps.push({
      id: "show-question",
      title: "הצגת השאלה",
      text: `כמה זה ${p}% מתוך ${base}?`,
      highlights: ["question"],
      type: "percentages",
      params,
      answer,
    });
    
    // צעד 2: הסבר על אחוזים
    steps.push({
      id: "explain",
      title: "מה זה אחוז?",
      text: `${p}% מתוך ${base} זה ${base} כפול ${p}/100`,
      highlights: ["explanation"],
      type: "percentages",
      params,
      answer,
    });
    
    // צעד 3: החישוב
    const result = Math.round((base * p) / 100);
    steps.push({
      id: "calculate",
      title: "החישוב",
      text: `נחשב: ${base} × ${p}/100 = ${result}`,
      highlights: ["calculation"],
      type: "percentages",
      params,
      answer,
    });
    
    // צעד 4: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${answer}`,
      highlights: ["result"],
      type: "percentages",
      params,
      answer,
    });
  } else if (kind === "perc_discount") {
    const { discount, finalPrice } = params;
    
    // צעד 1: הצגת השאלה
    steps.push({
      id: "show-question",
      title: "הצגת השאלה",
      text: `מחיר מוצר הוא ${base}₪ ויש הנחה של ${p}%. מה המחיר אחרי ההנחה?`,
      highlights: ["question"],
      type: "percentages",
      params,
      answer,
    });
    
    // צעד 2: חישוב ההנחה
    steps.push({
      id: "calculate-discount",
      title: "חישוב ההנחה",
      text: `מחשבים את גובה ההנחה: ${base} × ${p}/100 = ${discount}₪`,
      highlights: ["discount"],
      type: "percentages",
      params,
      answer,
    });
    
    // צעד 3: חישוב המחיר הסופי
    steps.push({
      id: "calculate-final",
      title: "חישוב המחיר הסופי",
      text: `מפחיתים מהמחיר: ${base} - ${discount} = ${finalPrice}₪`,
      highlights: ["finalPrice"],
      type: "percentages",
      params,
      answer,
    });
    
    // צעד 4: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `המחיר אחרי ההנחה הוא ${answer}₪`,
      highlights: ["result"],
      type: "percentages",
      params,
      answer,
    });
  }
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה לסדרות
export function buildSequencesAnimation(params, answer) {
  const steps = [];
  const { seq, step, posOfBlank } = params;
  
  // צעד 1: הצגת הסדרה
  const display = seq.map((v, idx) => (idx === posOfBlank ? "__" : v)).join(", ");
  steps.push({
    id: "show-sequence",
    title: "הצגת הסדרה",
    text: `הסדרה היא: ${display}`,
    highlights: ["sequence"],
    type: "sequences",
    params,
    answer,
  });
  
  // צעד 2: מציאת ההפרש
  const firstDiff = seq[1] - seq[0];
  steps.push({
    id: "find-difference",
    title: "מציאת ההפרש",
    text: `נסתכל על ההפרש בין שני מספרים סמוכים: ${seq[1]} - ${seq[0]} = ${firstDiff}`,
    highlights: ["difference"],
    type: "sequences",
    params,
    answer,
  });
  
  // צעד 3: הסבר על הצעד הקבוע
  steps.push({
    id: "explain-step",
    title: "הצעד הקבוע",
    text: `זה הצעד הקבוע של הסדרה: ${step > 0 ? "מוסיפים" : "מחסרים"} ${Math.abs(step)} בכל צעד`,
    highlights: ["step"],
    type: "sequences",
    params,
    answer,
  });
  
  // צעד 4: חישוב המספר החסר
  const beforeBlank = posOfBlank > 0 ? seq[posOfBlank - 1] : null;
  const afterBlank = posOfBlank < seq.length - 1 ? seq[posOfBlank + 1] : null;
  
  if (beforeBlank !== null) {
    steps.push({
      id: "calculate",
      title: "חישוב המספר החסר",
      text: `המספר שאחרי ${beforeBlank} הוא ${beforeBlank + step} = ${answer}`,
      highlights: ["calculation"],
      type: "sequences",
      params,
      answer,
    });
  } else if (afterBlank !== null) {
    steps.push({
      id: "calculate",
      title: "חישוב המספר החסר",
      text: `המספר שלפני ${afterBlank} הוא ${afterBlank - step} = ${answer}`,
      highlights: ["calculation"],
      type: "sequences",
      params,
      answer,
    });
  }
  
  // צעד 5: התוצאה
  steps.push({
    id: "final",
    title: "התוצאה הסופית",
    text: `המספר החסר הוא ${answer}`,
    highlights: ["result"],
    type: "sequences",
    params,
    answer,
  });
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה למשוואות
export function buildEquationsAnimation(params, answer) {
  const steps = [];
  const { kind, form, a, b, c, exerciseText } = params;
  
  // צעד 1: הצגת המשוואה
  steps.push({
    id: "show-equation",
    title: "הצגת המשוואה",
    text: `המשוואה היא: ${exerciseText}`,
    highlights: ["equation"],
    type: "equations",
    params,
    answer,
  });
  
  if (kind === "eq_add") {
    // צעד 2: הסבר על פעולה הפוכה
    steps.push({
      id: "explain",
      title: "פעולה הפוכה",
      text: `זוכרים שבחיבור הפעולה ההפוכה היא חיסור.`,
      highlights: ["explanation"],
      type: "equations",
      params,
      answer,
    });
    
    // צעד 3: החישוב
    const calc = form === "a_plus_x" ? `${c} - ${a}` : `${c} - ${b}`;
    steps.push({
      id: "calculate",
      title: "החישוב",
      text: `נחשב: ${calc} = ${answer}`,
      highlights: ["calculation"],
      type: "equations",
      params,
      answer,
    });
  } else if (kind === "eq_sub") {
    // צעד 2: הסבר על פעולה הפוכה
    steps.push({
      id: "explain",
      title: "פעולה הפוכה",
      text: `בחיסור הפעולה ההפוכה היא חיבור.`,
      highlights: ["explanation"],
      type: "equations",
      params,
      answer,
    });
    
    // צעד 3: החישוב
    const calc = form === "a_minus_x" ? `${a} - ${c}` : `${c} + ${b}`;
    steps.push({
      id: "calculate",
      title: "החישוב",
      text: `נחשב: ${calc} = ${answer}`,
      highlights: ["calculation"],
      type: "equations",
      params,
      answer,
    });
  } else if (kind === "eq_mul") {
    // צעד 2: הסבר על פעולה הפוכה
    steps.push({
      id: "explain",
      title: "פעולה הפוכה",
      text: `בכפל הפעולה ההפוכה היא חילוק.`,
      highlights: ["explanation"],
      type: "equations",
      params,
      answer,
    });
    
    // צעד 3: החישוב
    const calc = form === "a_times_x" ? `${c} ÷ ${a}` : `${c} ÷ ${b}`;
    steps.push({
      id: "calculate",
      title: "החישוב",
      text: `נחשב: ${calc} = ${answer}`,
      highlights: ["calculation"],
      type: "equations",
      params,
      answer,
    });
  } else if (kind === "eq_div") {
    const { dividend, divisor, quotient } = params;
    
    // צעד 2: הסבר על פעולה הפוכה
    steps.push({
      id: "explain",
      title: "פעולה הפוכה",
      text: `בחילוק הפעולה ההפוכה היא כפל.`,
      highlights: ["explanation"],
      type: "equations",
      params,
      answer,
    });
    
    // צעד 3: החישוב
    const calc = form === "a_div_x" ? `${quotient} × ${divisor}` : `${dividend} ÷ ${quotient}`;
    steps.push({
      id: "calculate",
      title: "החישוב",
      text: `נחשב: ${calc} = ${answer}`,
      highlights: ["calculation"],
      type: "equations",
      params,
      answer,
    });
  }
  
  // צעד 4: התוצאה
  steps.push({
    id: "final",
    title: "התוצאה הסופית",
    text: `התשובה היא ${answer}`,
    highlights: ["result"],
    type: "equations",
    params,
    answer,
  });
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה להשוואה
export function buildCompareAnimation(params, answer) {
  const steps = [];
  const { a, b, exerciseText } = params;
  
  // צעד 1: הצגת השאלה
  steps.push({
    id: "show-question",
    title: "הצגת השאלה",
    text: `השלם את הסימן: ${a} __ ${b}`,
    highlights: ["question"],
    type: "compare",
    params,
    answer,
  });
  
  // צעד 2: הסבר על השוואה
  steps.push({
    id: "explain",
    title: "איך משווים?",
    text: `נסתכל על שני המספרים: ${a} ו-${b}`,
    highlights: ["explanation"],
    type: "compare",
    params,
    answer,
  });
  
  // צעד 3: החישוב
  let comparison = "";
  if (a < b) {
    comparison = `${a} קטן מ-${b}, לכן הסימן הוא >`;
  } else if (a > b) {
    comparison = `${a} גדול מ-${b}, לכן הסימן הוא <`;
  } else {
    comparison = `${a} שווה ל-${b}, לכן הסימן הוא =`;
  }
  
  steps.push({
    id: "calculate",
    title: "החישוב",
    text: comparison,
    highlights: ["calculation"],
    type: "compare",
    params,
    answer,
  });
  
  // צעד 4: התוצאה
  steps.push({
    id: "final",
    title: "התוצאה הסופית",
    text: `הסימן הנכון הוא ${answer}`,
    highlights: ["result"],
    type: "compare",
    params,
    answer,
  });
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה לחוש מספרים
export function buildNumberSenseAnimation(params, answer) {
  const steps = [];
  const { kind } = params;
  
  if (kind === "ns_neighbors") {
    const { n, dir } = params;
    
    // צעד 1: הצגת השאלה
    steps.push({
      id: "show-question",
      title: "הצגת השאלה",
      text: dir === "after" ? `מה המספר שבא אחרי ${n}?` : `מה המספר שבא לפני ${n}?`,
      highlights: ["question"],
      type: "number_sense",
      params,
      answer,
    });
    
    // צעד 2: הסבר
    steps.push({
      id: "explain",
      title: "איך מוצאים שכן?",
      text: dir === "after" 
        ? `מספר אחד אחרי – מוסיפים 1: ${n} + 1 = ${answer}`
        : `מספר אחד לפני – מחסרים 1: ${n} - 1 = ${answer}`,
      highlights: ["explanation"],
      type: "number_sense",
      params,
      answer,
    });
    
    // צעד 3: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${answer}`,
      highlights: ["result"],
      type: "number_sense",
      params,
      answer,
    });
  } else if (kind === "ns_place_tens_units" || kind === "ns_place_hundreds") {
    const { n, askTens, tens, units, hundreds } = params;
    
    // צעד 1: הצגת השאלה
    let questionText = "";
    if (kind === "ns_place_tens_units") {
      questionText = askTens 
        ? `מהי ספרת העשרות במספר ${n}?`
        : `מהי ספרת היחידות במספר ${n}?`;
    } else {
      const partType = params.partType;
      const label = partType === "hundreds" ? "המאות" : partType === "tens" ? "העשרות" : "היחידות";
      questionText = `מהי ספרת ${label} במספר ${n}?`;
    }
    
    steps.push({
      id: "show-question",
      title: "הצגת השאלה",
      text: questionText,
      highlights: ["question"],
      type: "number_sense",
      params,
      answer,
    });
    
    // צעד 2: פירוק המספר
    let breakdown = "";
    if (kind === "ns_place_tens_units") {
      breakdown = `${n} = ${tens} עשרות + ${units} יחידות`;
    } else {
      breakdown = `${n} = ${hundreds} מאות + ${tens} עשרות + ${units} יחידות`;
    }
    
    steps.push({
      id: "breakdown",
      title: "פירוק המספר",
      text: breakdown,
      highlights: ["breakdown"],
      type: "number_sense",
      params,
      answer,
    });
    
    // צעד 3: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${answer}`,
      highlights: ["result"],
      type: "number_sense",
      params,
      answer,
    });
  } else if (kind === "ns_complement10" || kind === "ns_complement100") {
    const { b, c } = params;
    const target = c;
    
    // צעד 1: הצגת השאלה
    steps.push({
      id: "show-question",
      title: "הצגת השאלה",
      text: `__ + ${b} = ${target}`,
      highlights: ["question"],
      type: "number_sense",
      params,
      answer,
    });
    
    // צעד 2: הסבר
    steps.push({
      id: "explain",
      title: "השלמה",
      text: `מחפשים כמה חסר מ-${b} כדי להגיע ל-${target}`,
      highlights: ["explanation"],
      type: "number_sense",
      params,
      answer,
    });
    
    // צעד 3: החישוב
    steps.push({
      id: "calculate",
      title: "החישוב",
      text: `נחשב: ${target} - ${b} = ${answer}`,
      highlights: ["calculation"],
      type: "number_sense",
      params,
      answer,
    });
    
    // צעד 4: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${answer}`,
      highlights: ["result"],
      type: "number_sense",
      params,
      answer,
    });
  } else if (kind === "ns_even_odd") {
    const { n, isEven } = params;
    
    // צעד 1: הצגת השאלה
    steps.push({
      id: "show-question",
      title: "הצגת השאלה",
      text: `האם המספר ${n} הוא זוגי או אי-זוגי?`,
      highlights: ["question"],
      type: "number_sense",
      params,
      answer,
    });
    
    // צעד 2: הסבר
    steps.push({
      id: "explain",
      title: "איך בודקים?",
      text: `מסתכלים על ספרת היחידות של ${n}. אם הספרה היא 0,2,4,6,8 – המספר זוגי. אם 1,3,5,7,9 – אי-זוגי.`,
      highlights: ["explanation"],
      type: "number_sense",
      params,
      answer,
    });
    
    // צעד 3: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `המספר ${n} הוא ${answer}`,
      highlights: ["result"],
      type: "number_sense",
      params,
      answer,
    });
  }
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה לגורמים/כפולות
export function buildFactorsMultiplesAnimation(params, answer) {
  const steps = [];
  const { kind } = params;
  
  if (kind === "fm_factor") {
    const { n, correct } = params;
    
    // צעד 1: הצגת השאלה
    steps.push({
      id: "show-question",
      title: "הצגת השאלה",
      text: `איזה מהמספרים הבאים הוא מחלק (גורם) של ${n}?`,
      highlights: ["question"],
      type: "factors_multiples",
      params,
      answer,
    });
    
    // צעד 2: הסבר
    steps.push({
      id: "explain",
      title: "מה זה גורם?",
      text: `גורם הוא מספר שמתחלק במספר בלי שארית. נבדוק אילו מספרים מתחלקים ב-${n} בלי שארית.`,
      highlights: ["explanation"],
      type: "factors_multiples",
      params,
      answer,
    });
    
    // צעד 3: בדיקה
    steps.push({
      id: "check",
      title: "בדיקה",
      text: `נחלק את ${n} ב-${correct}: ${n} ÷ ${correct} = ${n / correct}. זה מספר שלם, לכן ${correct} הוא גורם של ${n}`,
      highlights: ["check"],
      type: "factors_multiples",
      params,
      answer,
    });
    
    // צעד 4: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${answer}`,
      highlights: ["result"],
      type: "factors_multiples",
      params,
      answer,
    });
  } else if (kind === "fm_multiple") {
    const { base, correct } = params;
    
    // צעד 1: הצגת השאלה
    steps.push({
      id: "show-question",
      title: "הצגת השאלה",
      text: `איזה מהמספרים הבאים הוא כפולה של ${base}?`,
      highlights: ["question"],
      type: "factors_multiples",
      params,
      answer,
    });
    
    // צעד 2: הסבר
    steps.push({
      id: "explain",
      title: "מה זה כפולה?",
      text: `כפולה מתקבלת כשמכפילים את המספר במספר שלם. כפולות של ${base} הן: ${base} × 1, ${base} × 2, ${base} × 3, ...`,
      highlights: ["explanation"],
      type: "factors_multiples",
      params,
      answer,
    });
    
    // צעד 3: בדיקה
    steps.push({
      id: "check",
      title: "בדיקה",
      text: `נבדוק: ${correct} ÷ ${base} = ${correct / base}. זה מספר שלם, לכן ${correct} הוא כפולה של ${base}`,
      highlights: ["check"],
      type: "factors_multiples",
      params,
      answer,
    });
    
    // צעד 4: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${answer}`,
      highlights: ["result"],
      type: "factors_multiples",
      params,
      answer,
    });
  } else if (kind === "fm_gcd") {
    const { a, b, gcd } = params;
    
    // צעד 1: הצגת השאלה
    steps.push({
      id: "show-question",
      title: "הצגת השאלה",
      text: `מהו המחלק המשותף הגדול ביותר של ${a} ו-${b}?`,
      highlights: ["question"],
      type: "factors_multiples",
      params,
      answer,
    });
    
    // צעד 2: הסבר
    steps.push({
      id: "explain",
      title: "מה זה מ.א.ח?",
      text: `מחלק משותף גדול ביותר (מ.א.ח) הוא המספר הגדול ביותר שמחלק את שני המספרים בלי שארית.`,
      highlights: ["explanation"],
      type: "factors_multiples",
      params,
      answer,
    });
    
    // צעד 3: חישוב
    steps.push({
      id: "calculate",
      title: "חישוב",
      text: `נפרק את ${a} ו-${b} לגורמים ונראה מי הגדול ביותר – כאן ${gcd}`,
      highlights: ["calculation"],
      type: "factors_multiples",
      params,
      answer,
    });
    
    // צעד 4: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${answer}`,
      highlights: ["result"],
      type: "factors_multiples",
      params,
      answer,
    });
  }
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה לתרגילי מילים
export function buildWordProblemsAnimation(params, answer) {
  const steps = [];
  const { kind } = params;
  
  if (kind === "wp_simple_add") {
    const { a, b } = params;
    const sum = a + b;
    
    // צעד 1: קריאת הסיפור
    steps.push({
      id: "read-story",
      title: "קריאת הסיפור",
      text: `לליאו יש ${a} כדורים והוא מקבל עוד ${b} כדורים. כמה כדורים יש לליאו בסך הכל?`,
      highlights: ["story"],
      type: "word_problems",
      params,
      answer,
    });
    
    // צעד 2: זיהוי הפעולה
    steps.push({
      id: "identify-operation",
      title: "זיהוי הפעולה",
      text: `מזהים שהשאלה מבקשת כמה יש בסך הכל – פעולה של חיבור.`,
      highlights: ["operation"],
      type: "word_problems",
      params,
      answer,
    });
    
    // צעד 3: כתיבת התרגיל
    steps.push({
      id: "write-equation",
      title: "כתיבת התרגיל",
      text: `כותבים תרגיל: ${a} + ${b}`,
      highlights: ["equation"],
      type: "word_problems",
      params,
      answer,
    });
    
    // צעד 4: החישוב
    steps.push({
      id: "calculate",
      title: "החישוב",
      text: `מחשבים: ${a} + ${b} = ${sum}`,
      highlights: ["calculation"],
      type: "word_problems",
      params,
      answer,
    });
    
    // צעד 5: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה: לליאו יש ${answer} כדורים.`,
      highlights: ["result"],
      type: "word_problems",
      params,
      answer,
    });
  } else if (kind === "wp_groups") {
    const { per, groups } = params;
    const prod = per * groups;
    
    // צעד 1: קריאת הסיפור
    steps.push({
      id: "read-story",
      title: "קריאת הסיפור",
      text: `בכל קופסה יש ${per} עפרונות. יש ${groups} קופסאות כאלה. כמה עפרונות יש בסך הכל?`,
      highlights: ["story"],
      type: "word_problems",
      params,
      answer,
    });
    
    // צעד 2: זיהוי הפעולה
    steps.push({
      id: "identify-operation",
      title: "זיהוי הפעולה",
      text: `בכל קופסה יש ${per} עפרונות ויש ${groups} קופסאות – מדובר בחיבור חוזר, כלומר כפל.`,
      highlights: ["operation"],
      type: "word_problems",
      params,
      answer,
    });
    
    // צעד 3: כתיבת התרגיל
    steps.push({
      id: "write-equation",
      title: "כתיבת התרגיל",
      text: `נרשום תרגיל כפל: ${per} × ${groups}`,
      highlights: ["equation"],
      type: "word_problems",
      params,
      answer,
    });
    
    // צעד 4: החישוב
    steps.push({
      id: "calculate",
      title: "החישוב",
      text: `נחשב: ${per} × ${groups} = ${prod}`,
      highlights: ["calculation"],
      type: "word_problems",
      params,
      answer,
    });
    
    // צעד 5: התוצאה
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה: ${answer} עפרונות.`,
      highlights: ["result"],
      type: "word_problems",
      params,
      answer,
    });
  } else {
    // תרגילי מילים כלליים
    steps.push({
      id: "read-story",
      title: "קריאת הסיפור",
      text: `קוראים את הסיפור בקפידה ומזהים את המספרים והפעולה הנדרשת.`,
      highlights: ["story"],
      type: "word_problems",
      params,
      answer,
    });
    
    steps.push({
      id: "identify-operation",
      title: "זיהוי הפעולה",
      text: `מזהים מה שואלים – כמה ביחד? כמה נשאר? כמה בכל קבוצה?`,
      highlights: ["operation"],
      type: "word_problems",
      params,
      answer,
    });
    
    steps.push({
      id: "write-equation",
      title: "כתיבת התרגיל",
      text: `כותבים תרגיל חשבון שמתאים לסיפור.`,
      highlights: ["equation"],
      type: "word_problems",
      params,
      answer,
    });
    
    steps.push({
      id: "calculate",
      title: "החישוב",
      text: `פותרים את התרגיל.`,
      highlights: ["calculation"],
      type: "word_problems",
      params,
      answer,
    });
    
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `התשובה היא ${answer}`,
      highlights: ["result"],
      type: "word_problems",
      params,
      answer,
    });
  }
  
  return steps;
}

// פונקציה כללית לבניית אנימציה לפי נושא
export function buildAnimationForOperation(question, operation, gradeKey) {
  if (!question || !question.params) return null;
  
  const params = question.params;
  const answer = question.correctAnswer !== undefined 
    ? question.correctAnswer 
    : question.answer;
  
  switch (operation) {
    case "multiplication":
      if (params.a && params.b) {
        return buildMultiplicationAnimation(params.a, params.b, answer);
      }
      break;
      
    case "division":
    case "division_with_remainder":
      // בחלק מהתרגילים אין params.quotient (הוא פשוט התשובה). עדיין נרצה אנימציה.
      if (params.dividend != null && params.divisor != null) {
        const q =
          params.quotient != null
            ? params.quotient
            : (typeof answer === "number" ? answer : null);
        if (q != null) {
          return buildDivisionAnimation(params.dividend, params.divisor, q);
        }
      }
      break;
      
    case "decimals":
      if (params.a && params.b) {
        return buildDecimalsAnimation(params, answer);
      }
      break;
      
    case "fractions":
      return buildFractionsAnimation(params, answer);
      
    case "percentages":
      return buildPercentagesAnimation(params, answer);
      
    case "sequences":
      return buildSequencesAnimation(params, answer);
      
    case "equations":
      return buildEquationsAnimation(params, answer);
      
    case "compare":
      return buildCompareAnimation(params, answer);
      
    case "number_sense":
      return buildNumberSenseAnimation(params, answer);
      
    case "factors_multiples":
      return buildFactorsMultiplesAnimation(params, answer);
      
    case "word_problems":
      return buildWordProblemsAnimation(params, answer);
      
    default:
      return null;
  }
  
  return null;
}

