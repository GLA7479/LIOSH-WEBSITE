export function buildVerticalOperation(topNumber, bottomNumber, operator = "-") {
  const top = String(topNumber);
  const bottom = String(bottomNumber);
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

  if (op === "addition") {
    const answerStr = String(answer);
    const answerLen = answerStr.length;
    
    // צעד 1: מיישרים את הספרות
    steps.push({
      id: "place-value",
      title: "מיישרים את הספרות",
      text: "כותבים את המספרים אחד מעל השני כך שסַפְרות היחידות נמצאות באותה עמודה.",
      highlights: ["aAll", "bAll"],
      revealDigits: 0, // עדיין לא מראים כלום
    });

    // חישוב ספרה ספרה
    let carry = 0;
    let stepIndex = 2;
    let revealedCount = 0; // כמה ספרות כבר נחשפו

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
      steps.push({
        id: `step-${stepIndex}`,
        title: `ספרת ה${placeName}`,
        text: `מחברים את ספרת ה${placeName}: ${da} + ${db}${carry ? " + " + carry : ""} = ${sum}. כותבים ${ones} בעמודת ה${placeName}${newCarry ? " ומעבירים 1 לעמודה הבאה" : ""}.`,
        highlights: [`a${highlightKey}`, `b${highlightKey}`, `result${highlightKey}`],
        carry: newCarry,
        revealDigits: revealedCount, // כמה ספרות מימין חשופות
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
      });
    }

    // צעד אחרון: התוצאה הסופית
    steps.push({
      id: "final",
      title: "התוצאה הסופית",
      text: `המספר שנוצר הוא ${answer}. זהו התשובה הסופית לתרגיל.`,
      highlights: ["resultAll"],
      revealDigits: answerLen, // מראים את כל הספרות
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
    });
  }

  return steps;
}

