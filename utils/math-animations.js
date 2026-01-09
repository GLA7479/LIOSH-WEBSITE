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

// פונקציה לבניית צעדי אנימציה לכפל (עם תרגיל מאונך)
export function buildMultiplicationAnimation(a, b, answer) {
  const steps = [];
  const aStr = String(a);
  const bStr = String(b);
  const answerStr = String(answer);
  const maxLen = Math.max(aStr.length, bStr.length, answerStr.length);
  
  // צעד 1: מיישרים את הספרות
  steps.push({
    id: "place-value",
    title: "מיישרים את הספרות",
    text: "כותבים את המספרים אחד מעל השני כך שסַפְרות היחידות נמצאות באותה עמודה.",
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
  });
  
  // צעד 2: הסבר על כפל
  steps.push({
    id: "explain",
    title: "מה זה כפל?",
    text: `כפל הוא חיבור חוזר: ${a} × ${b} זה כמו לחבר את ${a} לעצמו ${b} פעמים.`,
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
  });
  
  // צעד 3: החישוב - חשיפה הדרגתית
  steps.push({
    id: "calculate",
    title: "החישוב",
    text: `מחשבים: ${a} × ${b} = ${answer}`,
    highlights: ["aAll", "bAll", "resultAll"],
    revealDigits: answerStr.length,
  });
  
  // צעד 4: התוצאה הסופית
  steps.push({
    id: "final",
    title: "התוצאה הסופית",
    text: `התשובה היא ${answer}`,
    highlights: ["resultAll"],
    revealDigits: answerStr.length,
  });
  
  return steps;
}

// פונקציה לבניית צעדי אנימציה לחילוק (עם תרגיל מאונך)
export function buildDivisionAnimation(dividend, divisor, quotient) {
  const steps = [];
  const dividendStr = String(dividend);
  const divisorStr = String(divisor);
  const quotientStr = String(quotient);
  
  // צעד 1: מיישרים את הספרות
  steps.push({
    id: "place-value",
    title: "מיישרים את הספרות",
    text: "כותבים את המחלק והמחולק כך שסַפְרות היחידות נמצאות באותה עמודה.",
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
  });
  
  // צעד 2: הסבר על חילוק
  steps.push({
    id: "explain",
    title: "מה זה חילוק?",
    text: `חילוק שואל: כמה פעמים ${divisor} נכנס בתוך ${dividend}?`,
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
  });
  
  // צעד 3: בדיקה
  steps.push({
    id: "check",
    title: "בדיקה",
    text: `נבדוק: ${divisor} × ${quotient} = ${dividend}. אם כן – זה המספר הנכון.`,
    highlights: ["aAll", "bAll", "resultAll"],
    revealDigits: quotientStr.length,
  });
  
  // צעד 4: התוצאה הסופית
  steps.push({
    id: "final",
    title: "התוצאה הסופית",
    text: `לכן התשובה היא ${quotient}`,
    highlights: ["resultAll"],
    revealDigits: quotientStr.length,
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
  
  // צעד 1: מיישרים את הנקודות העשרוניות
  steps.push({
    id: "place-value",
    title: "מיישרים את הנקודות העשרוניות",
    text: "כותבים את המספרים אחד מעל השני כך שהנקודות העשרוניות נמצאות באותה עמודה.",
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
  });
  
  // צעד 2: הסבר
  steps.push({
    id: "explain",
    title: "חישוב עשרוניים",
    text: `מבצעים ${kind === "dec_add" ? "חיבור" : "חיסור"} רגיל בין המספרים אחרי היישור.`,
    highlights: ["aAll", "bAll"],
    revealDigits: 0,
  });
  
  // צעד 3: החישוב - חשיפה הדרגתית
  steps.push({
    id: "calculate",
    title: "החישוב",
    text: `מחשבים: ${aStr} ${kind === "dec_add" ? "+" : "−"} ${bStr} = ${answerStr}`,
    highlights: ["aAll", "bAll", "resultAll"],
    revealDigits: answerStr.length,
  });
  
  // צעד 4: התוצאה הסופית
  steps.push({
    id: "final",
    title: "התוצאה הסופית",
    text: `התשובה היא ${answerStr}`,
    highlights: ["resultAll"],
    revealDigits: answerStr.length,
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
    comparison = `${a} קטן מ-${b}, לכן הסימן הוא <`;
  } else if (a > b) {
    comparison = `${a} גדול מ-${b}, לכן הסימן הוא >`;
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
      if (params.dividend && params.divisor && params.quotient) {
        return buildDivisionAnimation(params.dividend, params.divisor, params.quotient);
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

