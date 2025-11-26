import { GRADES, BLANK } from './math-constants';

export function generateQuestion(levelConfig, operation, gradeKey, mixedOps = null) {
  const gradeCfg = GRADES[gradeKey] || GRADES.g3;

  let allowedOps = gradeCfg.operations.filter((op) => op !== "mixed");
  if (mixedOps) {
    allowedOps = allowedOps.filter((op) => mixedOps[op]);
  }
  if (allowedOps.length === 0) {
    allowedOps = ["addition", "subtraction", "multiplication", "division"];
  }

  const isMixed = operation === "mixed";
  let selectedOp = operation;
  
  if (isMixed) {
    selectedOp = allowedOps[Math.floor(Math.random() * allowedOps.length)];
  }

  if (!allowedOps.includes(selectedOp)) {
    selectedOp = "addition";
  }

  const randInt = (min, max) => {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  };

  const round = (n, places = 0) => {
    const factor = Math.pow(10, places);
    return Math.round(n * factor) / factor;
  };

  const allowNegatives = !!levelConfig.allowNegatives && gradeCfg.allowNegatives;
  const allowTwoStep = !!levelConfig.allowTwoStep;

  let question = "";
  let correctAnswer = 0;
  let params = { kind: selectedOp };
  let operandA = null;
  let operandB = null;
  let isStory = false;

  // ===== חיבור =====
  if (selectedOp === "addition") {
    const maxA = levelConfig.addition.max || 20;
    const isLowGrade = gradeKey === "g1" || gradeKey === "g2"; // כיתות א' וב'

    // כיתה א' - חיבור בעשרות שלמות (30+40=70)
    const useTensOnly = gradeKey === "g1" && Math.random() < 0.2;
    // כיתה א' - חיבור בעשרת השנייה (13+4, 17-4)
    const useSecondDecade = gradeKey === "g1" && Math.random() < 0.2;
    // כיתה ב' - חיבור במאונך (אם מוגדר)
    const useVertical = (gradeKey === "g2" && levelConfig.addition?.vertical && Math.random() < 0.4);
    // האם להשתמש בתרגיל 3 מספרים - רק מכיתה ג' ומעלה
    const useThreeTerms = !isLowGrade && allowTwoStep && Math.random() < 0.3;

    if (useTensOnly) {
      // כיתה א': חיבור בעשרות שלמות (30+40=70)
      const tens1 = randInt(1, 9) * 10; // 10, 20, 30, ..., 90
      const tens2 = randInt(1, Math.min(9, Math.floor((100 - tens1) / 10))) * 10;
      correctAnswer = tens1 + tens2;
      const exerciseText = `${tens1} + ${tens2} = ${BLANK}`;
      question = exerciseText;
      params = {
        kind: "add_tens_only",
        a: tens1,
        b: tens2,
        exerciseText,
        op: "add",
        grade: gradeKey,
      };
      operandA = tens1;
      operandB = tens2;
    } else if (useSecondDecade) {
      // כיתה א': חיבור בעשרת השנייה (13+4, 17-4)
      const base = randInt(11, 19); // 11-19
      const addend = randInt(1, Math.min(9, 20 - base));
      correctAnswer = base + addend;
      const exerciseText = `${base} + ${addend} = ${BLANK}`;
      question = exerciseText;
      params = {
        kind: "add_second_decade",
        a: base,
        b: addend,
        exerciseText,
        op: "add",
        grade: gradeKey,
      };
      operandA = base;
      operandB = addend;
    } else if (useThreeTerms) {
      // חיבור של 3 מספרים - רק מכיתה ג' ומעלה
      const a = randInt(1, maxA);
      const b = randInt(1, maxA);
      const c = randInt(1, maxA);
      correctAnswer = round(a + b + c);
      const exerciseText = `${a} + ${b} + ${c} = ${BLANK}`;
      question = exerciseText;
      params = {
        kind: "add_three",
        a,
        b,
        c,
        exerciseText,
        op: "add",
        grade: gradeKey,
      };
      operandA = a;
      operandB = b;
    } else {
      // ✅ וריאציות שונות של חיבור שני מספרים
      const a = randInt(1, maxA);
      const b = randInt(1, maxA);
      const c = a + b;

      // כיתה ב' - חיבור במאונך (אם מוגדר)
      if (useVertical) {
        // חיבור במאונך - נציג את התרגיל בצורה מאונכת
        correctAnswer = c;
        const exerciseText = `${a} + ${b} = ${BLANK}`;
        question = exerciseText;
        params = {
          kind: "add_vertical",
          a,
          b,
          c,
          exerciseText,
          op: "add",
          grade: gradeKey,
          vertical: true,
        };
        operandA = a;
        operandB = b;
      } else {
        // חיבור - רק תרגיל ישיר (ללא נעלם) - נעלמים רק במשוואות
        correctAnswer = c;
        const exerciseText = `${a} + ${b} = ${BLANK}`;
        question = exerciseText;
        params = {
          kind: "add_two",
          a,
          b,
          exerciseText,
          op: "add",
          grade: gradeKey,
        };

        operandA = a;
        operandB = b;
      }
    }
  } else if (selectedOp === "subtraction") {
    const maxS = levelConfig.subtraction.max || 20;
    const minS = levelConfig.subtraction.min ?? 0;
    const isLowGrade = gradeKey === "g1" || gradeKey === "g2"; // כיתות א' וב'

    // כיתה א' - חיסור בעשרות שלמות
    const useTensOnly = gradeKey === "g1" && Math.random() < 0.2;
    // כיתה א' - חיסור בעשרת השנייה
    const useSecondDecade = gradeKey === "g1" && Math.random() < 0.2;
    // כיתה ב' - חיסור במאונך (אם מוגדר)
    const useVertical = (gradeKey === "g2" && levelConfig.subtraction?.vertical && Math.random() < 0.4);

    let a;
    let b;

    if (useTensOnly) {
      // כיתה א': חיסור בעשרות שלמות (50-20=30)
      const tens1 = randInt(2, 9) * 10; // 20, 30, 40, ..., 90
      const tens2 = randInt(1, Math.floor(tens1 / 10)) * 10;
      a = tens1;
      b = tens2;
    } else if (useSecondDecade) {
      // כיתה א': חיסור בעשרת השנייה (17-4, 17-14)
      const base = randInt(11, 19); // 11-19
      const subtrahend = randInt(1, base - 10);
      a = base;
      b = subtrahend;
    } else if (allowNegatives) {
      a = randInt(minS, maxS);
      b = randInt(minS, maxS);
    } else {
      b = randInt(minS, maxS);
      a = randInt(b, maxS); // דואג ש-a ≥ b
    }

    const c = a - b;

    // כיתה ב' - חיסור במאונך
    if (useVertical) {
      // חיסור במאונך
      correctAnswer = c;
      const exerciseText = `${a} - ${b} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "sub_vertical", a, b, c, exerciseText, vertical: true };
      operandA = a;
      operandB = b;
    } else {
      // חיסור - רק תרגיל ישיר (ללא נעלם) - נעלמים רק במשוואות
      correctAnswer = c;
      const exerciseText = `${a} - ${b} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "sub_two", a, b, c, exerciseText };

      operandA = a;
      operandB = b;
    }
  } else if (selectedOp === "multiplication") {
    // שימוש ב-levelConfig.multiplication.max ישירות מ-GRADE_LEVELS
    const maxM = levelConfig.multiplication?.max || 10;
    
    // כיתה ד' - כפל במאונך (גורם רב-ספרתי)
    if (gradeKey === "g4" && levelConfig.multiplication?.multiDigit && Math.random() < 0.4) {
      const twoDigit = randInt(10, 99);
      const oneDigit = randInt(2, 9);
      const result = twoDigit * oneDigit;
      correctAnswer = result;
      const exerciseText = `${twoDigit} × ${oneDigit} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "mul_vertical", twoDigit, oneDigit, result, exerciseText, multiDigit: true, vertical: true };
      operandA = twoDigit;
      operandB = oneDigit;
    } else if (gradeKey === "g3" && levelConfig.multiplication?.tensHundreds && Math.random() < 0.4) {
      // כיתה ג' - כפל בעשרות שלמות ובמאות שלמות
      const useTens = Math.random() < 0.7; // 70% עשרות, 30% מאות
      if (useTens) {
        // כפל בעשרות שלמות: 20 × 3, 30 × 4 וכו'
        const tens = randInt(1, 9) * 10; // 10, 20, 30, ..., 90
        const multiplier = randInt(1, Math.min(10, maxM));
        const result = tens * multiplier;
        correctAnswer = result;
        const exerciseText = `${tens} × ${multiplier} = ${BLANK}`;
        question = exerciseText;
        params = { kind: "mul_tens", tens, multiplier, result, exerciseText, tensHundreds: true };
        operandA = tens;
        operandB = multiplier;
      } else {
        // כפל במאות שלמות: 200 × 3, 300 × 4 וכו'
        const hundreds = randInt(1, 9) * 100; // 100, 200, 300, ..., 900
        const multiplier = randInt(1, Math.min(10, maxM));
        const result = hundreds * multiplier;
        correctAnswer = result;
        const exerciseText = `${hundreds} × ${multiplier} = ${BLANK}`;
        question = exerciseText;
        params = { kind: "mul_hundreds", hundreds, multiplier, result, exerciseText, tensHundreds: true };
        operandA = hundreds;
        operandB = multiplier;
      }
    } else {
      // כפל רגיל - רק תרגיל ישיר (ללא נעלם) - נעלמים רק במשוואות
      const a = randInt(1, maxM);
      const b = randInt(1, maxM);
      const c = a * b;

      // צורה רגילה: a × b = __
      correctAnswer = round(c);
      const exerciseText = `${a} × ${b} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "mul", a, b, exerciseText };

      operandA = a;
      operandB = b;
    }
  } else if (selectedOp === "division") {
    const maxD = levelConfig.division.max || 100;
    const maxDivisor = levelConfig.division.maxDivisor || 12;
    const allowRemainder = levelConfig.division.allowRemainder || false; // כיתה ג' ומעלה
    
    // כיתה ד' - חילוק ארוך (המחלק הוא חד-ספרתי או עשרת שלמה)
    if (gradeKey === "g4" && levelConfig.division?.longDivision && Math.random() < 0.5) {
      const useTens = Math.random() < 0.5; // 50% עשרות, 50% חד-ספרתי
      let divisor;
      if (useTens) {
        divisor = randInt(1, 9) * 10; // 10, 20, 30, ..., 90
      } else {
        divisor = randInt(2, 9); // 2-9
      }
      const quotient = randInt(2, Math.max(2, Math.floor(maxD / divisor)));
      const dividend = divisor * quotient;
      correctAnswer = quotient;
      const exerciseText = `${dividend} ÷ ${divisor} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "div_long", dividend, divisor, quotient, exerciseText, isTens: useTens, longDivision: true };
      operandA = dividend;
      operandB = divisor;
    } else if (gradeKey === "g5" && levelConfig.division?.twoDigit && Math.random() < 0.4) {
      // כיתה ה' - חילוק במספר דו-ספרתי
      const divisor = randInt(11, 99);
      const quotient = randInt(2, Math.max(2, Math.floor(maxD / divisor)));
      const dividend = divisor * quotient;
      correctAnswer = quotient;
      const exerciseText = `${dividend} ÷ ${divisor} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "div_two_digit", dividend, divisor, quotient, exerciseText, twoDigit: true };
      operandA = dividend;
      operandB = divisor;
    } else {
      // חילוק רגיל
      const divisor = randInt(2, maxDivisor);
      
      let quotient, dividend, remainder = 0;
      if (allowRemainder && Math.random() < 0.3) {
        // חילוק עם שארית - רק לכיתה ג' ומעלה
        quotient = randInt(2, Math.max(2, Math.floor(maxD / divisor)));
        remainder = randInt(1, divisor - 1); // שארית בין 1 ל-divisor-1
        dividend = divisor * quotient + remainder;
      } else {
        // חילוק ללא שארית
        quotient = randInt(2, Math.max(2, Math.floor(maxD / divisor)));
        dividend = divisor * quotient;
      }

      // חילוק - רק תרגיל ישיר (ללא נעלם) - נעלמים רק במשוואות
      // צורה רגילה: dividend ÷ divisor = __ (או עם שארית)
      if (remainder > 0) {
        correctAnswer = `${quotient} ושארית ${remainder}`;
        const exerciseText = `${dividend} ÷ ${divisor} = ${BLANK}`;
        question = exerciseText;
        params = { kind: "div_with_remainder", dividend, divisor, quotient, remainder, exerciseText };
      } else {
        correctAnswer = round(quotient);
        const exerciseText = `${dividend} ÷ ${divisor} = ${BLANK}`;
        question = exerciseText;
        params = { kind: "div", dividend, divisor, exerciseText };
      }

      operandA = dividend;
      operandB = divisor;
    }
  } else if (selectedOp === "fractions" && levelConfig.allowFractions) {
    const densSmall = [2, 4, 5, 10];
    const densBig = [2, 3, 4, 5, 6, 8, 10, 12];
    const dens =
      gradeKey === "g3" || gradeKey === "g4"
        ? densSmall.filter((d) => d <= levelConfig.fractions.maxDen)
        : densBig.filter((d) => d <= levelConfig.fractions.maxDen);

    // כיתה ה' - צמצום והרחבה, חיבור וחיסור, מספרים מעורבים
    if (gradeKey === "g5") {
      const fractionType = Math.random();
      if (fractionType < 0.2) {
        // מספרים מעורבים (20% מהשאלות)
        const variant = Math.random();
        if (variant < 0.5) {
          // המרה משבר למספר מעורב
          const whole = randInt(1, 3);
          const den = dens[Math.floor(Math.random() * dens.length)] || 4;
          const num = randInt(1, den - 1);
          const improperNum = whole * den + num;
          correctAnswer = `${whole} ${num}/${den}`;
          question = `המר את השבר ${improperNum}/${den} למספר מעורב: ${BLANK}`;
          params = { kind: "frac_to_mixed", improperNum, den, whole, num };
        } else {
          // המרה ממספר מעורב לשבר
          const whole = randInt(1, 3);
          const den = dens[Math.floor(Math.random() * dens.length)] || 4;
          const num = randInt(1, den - 1);
          const improperNum = whole * den + num;
          correctAnswer = `${improperNum}/${den}`;
          question = `המר את המספר המעורב ${whole} ${num}/${den} לשבר: ${BLANK}`;
          params = { kind: "mixed_to_frac", whole, num, den, improperNum };
        }
      } else if (fractionType < 0.5) {
        // צמצום והרחבה
        const den = dens[Math.floor(Math.random() * dens.length)] || 4;
        const num = randInt(1, den - 1);
        const factor = randInt(2, 3);
        const variant = Math.random();
        
        if (variant < 0.5) {
          // הרחבה: מצא שבר שווה
          const expandedNum = num * factor;
          const expandedDen = den * factor;
          correctAnswer = `${expandedNum}/${expandedDen}`;
          question = `מצא שבר שווה ל-${num}/${den} (הרחב ב-${factor}): ${BLANK}`;
          params = { kind: "frac_expand", num, den, factor, expandedNum, expandedDen };
        } else {
          // צמצום: מצא שבר שווה
          const reducedNum = num;
          const reducedDen = den;
          const expandedNum = num * factor;
          const expandedDen = den * factor;
          correctAnswer = `${reducedNum}/${reducedDen}`;
          question = `צמצם את השבר ${expandedNum}/${expandedDen}: ${BLANK}`;
          params = { kind: "frac_reduce", num: expandedNum, den: expandedDen, reducedNum, reducedDen };
        }
      } else {
        // חיבור וחיסור שברים - כיתה ה'
        const den1 = dens[Math.floor(Math.random() * dens.length)] || 4;
        let den2 = dens[Math.floor(Math.random() * dens.length)] || 6;
        if (den1 === den2 && Math.random() < 0.3) {
          den2 = dens[(dens.indexOf(den1) + 1) % dens.length] || 3;
        }
        
        const n1 = randInt(1, den1 - 1);
        const n2 = randInt(1, den2 - 1);
        
        const lcm = (a, b) => {
          const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
          return Math.abs((a * b) / gcd(a, b));
        };
        
        const commonDen = lcm(den1, den2);
        const m1 = commonDen / den1;
        const m2 = commonDen / den2;
        
        const opKind = Math.random() < 0.5 ? "add" : "sub";
        let resNum = opKind === "add" ? n1 * m1 + n2 * m2 : n1 * m1 - n2 * m2;
        
        if (opKind === "sub" && resNum < 0) {
          resNum = n2 * m2 - n1 * m1;
          question = `${n2}/${den2} - ${n1}/${den1} = ${BLANK}`;
          params = { kind: "frac_add_sub", op: "sub", n1: n2, den1: den2, n2: n1, den2: den1, commonDen, resNum };
        } else {
          question = opKind === "add" 
            ? `${n1}/${den1} + ${n2}/${den2} = ${BLANK}`
            : `${n1}/${den1} - ${n2}/${den2} = ${BLANK}`;
          params = { kind: "frac_add_sub", op: opKind, n1, den1, n2, den2, commonDen, resNum };
        }
        
        // צמצום התוצאה אם אפשר
        const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
        const divisor = gcd(resNum, commonDen);
        if (divisor > 1) {
          resNum = resNum / divisor;
          const resDen = commonDen / divisor;
          correctAnswer = `${resNum}/${resDen}`;
        } else {
          correctAnswer = `${resNum}/${commonDen}`;
        }
      }
    } else if (gradeKey === "g6") {
      // כיתה ו' - כפל וחילוק שברים, שבר כמנת חילוק
      const fractionType = Math.random();
      if (fractionType < 0.2) {
        // שבר כמנת חילוק (20% מהשאלות)
        const dividend = randInt(2, 20);
        const divisor = randInt(2, 10);
        const quotient = dividend / divisor;
        if (quotient % 1 !== 0) {
          // אם התוצאה היא שבר
          const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
          const divisorGcd = gcd(dividend, divisor);
          const num = dividend / divisorGcd;
          const den = divisor / divisorGcd;
          correctAnswer = `${num}/${den}`;
          question = `מה התוצאה של ${dividend} ÷ ${divisor}? רשמו כשבר: ${BLANK}`;
          params = { kind: "frac_as_division", dividend, divisor, num, den };
        } else {
          // אם התוצאה היא מספר שלם, ננסה שוב
          const newDividend = randInt(3, 15);
          const newDivisor = randInt(2, 7);
          const newGcd = (x, y) => (y === 0 ? x : newGcd(y, x % y));
          const divisorGcd = newGcd(newDividend, newDivisor);
          const num = newDividend / divisorGcd;
          const den = newDivisor / divisorGcd;
          correctAnswer = `${num}/${den}`;
          question = `מה התוצאה של ${newDividend} ÷ ${newDivisor}? רשמו כשבר: ${BLANK}`;
          params = { kind: "frac_as_division", dividend: newDividend, divisor: newDivisor, num, den };
        }
      } else if (fractionType < 0.7) {
        // כפל שברים
        const den1 = dens[Math.floor(Math.random() * dens.length)] || 4;
        const den2 = dens[Math.floor(Math.random() * dens.length)] || 6;
        const n1 = randInt(1, den1 - 1);
        const n2 = randInt(1, den2 - 1);
        
        const resNum = n1 * n2;
        const resDen = den1 * den2;
        
        // צמצום התוצאה
        const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
        const divisor = gcd(resNum, resDen);
        const finalNum = resNum / divisor;
        const finalDen = resDen / divisor;
        
        correctAnswer = `${finalNum}/${finalDen}`;
        question = `${n1}/${den1} × ${n2}/${den2} = ${BLANK}`;
        params = { kind: "frac_multiply", n1, den1, n2, den2, finalNum, finalDen };
      } else {
        // חילוק שברים
        const den1 = dens[Math.floor(Math.random() * dens.length)] || 4;
        const den2 = dens[Math.floor(Math.random() * dens.length)] || 6;
        const n1 = randInt(1, den1 - 1);
        const n2 = randInt(1, den2 - 1);
        
        // חילוק = כפל בהופכי
        const resNum = n1 * den2;
        const resDen = den1 * n2;
        
        // צמצום התוצאה
        const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
        const divisor = gcd(resNum, resDen);
        const finalNum = resNum / divisor;
        const finalDen = resDen / divisor;
        
        correctAnswer = `${finalNum}/${finalDen}`;
        question = `${n1}/${den1} ÷ ${n2}/${den2} = ${BLANK}`;
        params = { kind: "frac_divide", n1, den1, n2, den2, finalNum, finalDen };
      }
    } else if (gradeKey === "g3" || gradeKey === "g4") {
      // כיתות ג'-ד' - שברים בסיסיים (חיבור וחיסור עם מכנה זהה)
      const opKind = Math.random() < 0.5 ? "add_frac" : "sub_frac";
      const den = dens[Math.floor(Math.random() * dens.length)] || 4;
      const n1 = randInt(1, den - 1);
      const n2 = randInt(1, den - 1);

      let resNum = opKind === "add_frac" ? n1 + n2 : n1 - n2;
      const resDen = den;

      if (opKind === "sub_frac" && resNum < 0) {
        resNum = n2 - n1;
        question = `${n2}/${den} - ${n1}/${den} = ${BLANK}`;
        params = { kind: "frac_same_den", op: "sub", n1: n2, n2: n1, den };
      } else {
        question =
          opKind === "add_frac"
            ? `${n1}/${den} + ${n2}/${den} = ${BLANK}`
            : `${n1}/${den} - ${n2}/${den} = ${BLANK}`;
        params = {
          kind: "frac_same_den",
          op: opKind === "add_frac" ? "add" : "sub",
          n1,
          n2,
          den,
        };
      }

      correctAnswer = `${resNum}/${resDen}`;
    } else if (gradeKey === "g2") {
      // כיתה ב' - חצי ורבע בלבד
      const fractionType = Math.random() < 0.5 ? "half" : "quarter";
      if (fractionType === "half") {
        const whole = randInt(2, 20);
        const variant = Math.random();
        if (variant < 0.5) {
          correctAnswer = whole / 2;
          question = `מהו חצי מ-${whole}?`;
          params = { kind: "frac_half", whole };
        } else {
          correctAnswer = whole;
          question = `חצי מ-${BLANK} הוא ${whole / 2}. מה המספר השלם?`;
          params = { kind: "frac_half_reverse", half: whole / 2, whole };
        }
      } else {
        const whole = randInt(4, 20);
        const variant = Math.random();
        if (variant < 0.5) {
          correctAnswer = whole / 4;
          question = `מהו רבע מ-${whole}?`;
          params = { kind: "frac_quarter", whole };
        } else {
          correctAnswer = whole;
          question = `רבע מ-${BLANK} הוא ${whole / 4}. מה המספר השלם?`;
          params = { kind: "frac_quarter_reverse", quarter: whole / 4, whole };
        }
      }
    }
  // ===== אחוזים (כיתות ה–ו) =====
  } else if (selectedOp === "percentages") {
    const maxBase = levelConfig.percentages?.maxBase || 400;
    const maxPercent = levelConfig.percentages?.maxPercent || 50;
    const base = randInt(40, maxBase);
    const percOptions = [10, 20, 25, maxPercent].filter(p => p <= maxPercent);
    const p = percOptions[Math.floor(Math.random() * percOptions.length)];

    const t = Math.random() < 0.5 ? "part_of" : "discount";

    if (t === "part_of") {
      correctAnswer = round((base * p) / 100);
      question = `כמה זה ${p}% מתוך ${base}? = ${BLANK}`;
      params = { kind: "perc_part_of", base, p };
      } else {
      const discount = round((base * p) / 100);
      const finalPrice = base - discount;
      correctAnswer = finalPrice;
      question = `מחיר מוצר הוא ${base}₪ ויש הנחה של ${p}%. מה המחיר אחרי ההנחה? = ${BLANK}`;
      params = { kind: "perc_discount", base, p, discount, finalPrice };
    }
  // ===== סדרות =====
  } else if (selectedOp === "sequences") {
    const maxStart = levelConfig.sequences?.maxStart || 20;
    const maxStep = levelConfig.sequences?.maxStep || 9;
    const start = randInt(1, maxStart);
    let step;
    if (gradeKey === "g1" || gradeKey === "g2") {
      step = randInt(1, Math.min(3, maxStep));
    } else if (gradeKey === "g3" || gradeKey === "g4") {
      step = randInt(1, maxStep);
    } else {
      step = randInt(-maxStep, maxStep) || 2;
    }

    const posOfBlank = randInt(0, 4); // אחד מחמשת המספרים
    const seq = [];
    for (let i = 0; i < 5; i++) {
      seq.push(start + i * step);
    }
    correctAnswer = seq[posOfBlank];
    // יצירת הסדרה עם פסיקים, אבל בלי פסיקים לפני ואחרי המספר החסר
    const displayParts = [];
    for (let i = 0; i < seq.length; i++) {
      if (i === posOfBlank) {
        displayParts.push(BLANK);
      } else {
        displayParts.push(seq[i]);
      }
    }
    // חיבור עם פסיקים, אבל בלי פסיקים לפני ואחרי BLANK
    const display = displayParts
      .map((item, idx) => {
        if (item === BLANK) {
          return BLANK;
        }
        // נוסיף פסיק רק אחרי המספר, אם יש משהו אחרי (ולא BLANK)
        const needsCommaAfter = idx < displayParts.length - 1 && displayParts[idx + 1] !== BLANK;
        return needsCommaAfter ? item + ", " : item;
      })
      .join(" ");
    
    const questionLabel = "השלם את הסדרה";
    const exerciseText = display;
    question = `${questionLabel} ${exerciseText}`;
    params = { kind: "sequence", start, step, seq, posOfBlank, questionLabel, exerciseText };
  // ===== עשרוניים =====
  } else if (selectedOp === "decimals") {
    const places = levelConfig.decimals?.places || 2;
    const maxBase = levelConfig.decimals?.maxBase || 200;
    
    // כיתה ו' - כפל וחילוק שברים עשרוניים ב-10, 100, שבר עשרוני מחזורי
    if (gradeKey === "g6" && (levelConfig.decimals?.multiply || levelConfig.decimals?.divide || levelConfig.repeatingDecimals) && Math.random() < 0.5) {
      // שבר עשרוני מחזורי - רק אם מוגדר
      if (levelConfig.repeatingDecimals && Math.random() < 0.2) {
        // שבר מחזורי: 1/3 = 0.333..., 1/6 = 0.1666...
        const den = [3, 6, 9][Math.floor(Math.random() * 3)];
        const num = 1;
        const repeating = num / den;
        correctAnswer = repeating.toFixed(3) + "...";
        question = `המר את השבר ${num}/${den} לשבר עשרוני (עד 3 ספרות אחרי הנקודה) = ${BLANK}`;
        params = { kind: "dec_repeating", num, den, repeating };
        operandA = num;
        operandB = den;
      } else if (levelConfig.decimals?.multiply || levelConfig.decimals?.divide) {
        const useMultiply = levelConfig.decimals?.multiply && (Math.random() < 0.5 || !levelConfig.decimals?.divide);
        const useDivide = levelConfig.decimals?.divide && (Math.random() >= 0.5 || !levelConfig.decimals?.multiply);
        const factor = Math.random() < 0.5 ? 10 : 100;
        const num = round(Math.random() * maxBase, places);
        
        if (useMultiply) {
          // כפל ב-10 או 100
          const result = round(num * factor, places);
          correctAnswer = result;
          question = `${num.toFixed(places)} × ${factor} = ${BLANK}`;
          params = { kind: "dec_multiply_10_100", num, factor, result, places };
          operandA = num;
          operandB = factor;
        } else if (useDivide) {
          // חילוק ב-10 או 100
          const result = round(num / factor, places);
          correctAnswer = result;
          question = `${num.toFixed(places)} ÷ ${factor} = ${BLANK}`;
          params = { kind: "dec_divide_10_100", num, factor, result, places };
          operandA = num;
          operandB = factor;
        } else {
          // כפל וחילוק עשרוניים רגילים
          const a = round(Math.random() * maxBase, places);
          const b = round(Math.random() * maxBase, places);
          if (levelConfig.decimals?.multiply) {
            correctAnswer = round(a * b, places * 2);
            question = `${a.toFixed(places)} × ${b.toFixed(places)} = ${BLANK}`;
            params = { kind: "dec_multiply", a, b, places };
          } else {
            const big = Math.max(a, b);
            const small = Math.min(a, b);
            correctAnswer = round(big / small, places);
            question = `${big.toFixed(places)} ÷ ${small.toFixed(places)} = ${BLANK}`;
            params = { kind: "dec_divide", a: big, b: small, places };
          }
          operandA = a;
          operandB = b;
        }
      }
    } else {
      // עשרוניים רגילים - חיבור וחיסור
      const a = round(Math.random() * maxBase, places);
      const b = round(Math.random() * maxBase, places);
      const t = Math.random() < 0.5 ? "add" : "sub";

      if (t === "add") {
        correctAnswer = round(a + b, places);
        question = `${a.toFixed(places)} + ${b.toFixed(places)} = ${BLANK}`;
        params = { kind: "dec_add", a, b, places };
        operandA = a;
        operandB = b;
      } else {
        const big = Math.max(a, b);
        const small = Math.min(a, b);
        correctAnswer = round(big - small, places);
        question = `${big.toFixed(places)} - ${small.toFixed(places)} = ${BLANK}`;
        params = { kind: "dec_sub", a: big, b: small, places };
        operandA = big;
        operandB = small;
      }
    }
  // ===== עיגול =====
  } else if (selectedOp === "rounding") {
    const roundingConfig = levelConfig.rounding || {};
    const toWhat = roundingConfig.toWhat || (Math.random() < 0.5 ? 10 : 100);
    const maxN = roundingConfig.maxN || (toWhat === 10 ? 999 : 9999);
    const n = randInt(1, maxN);
    correctAnswer =
      toWhat === 10 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100;
    question =
      toWhat === 10
        ? `עגל את ${n} לעשרות הקרובות = ${BLANK}`
        : `עגל את ${n} למאות הקרובות = ${BLANK}`;
    params = { kind: "round", n, toWhat };
  } else if (selectedOp === "equations" || (selectedOp === "order_of_operations" && gradeKey === "g3")) {
    // כיתה ג' - סדר פעולות
    if (gradeKey === "g3" && levelConfig.order_of_operations && selectedOp === "order_of_operations") {
      const maxVal = levelConfig.order_of_operations.max || 200;
      const a = randInt(1, Math.min(20, maxVal));
      const b = randInt(1, Math.min(10, maxVal));
      const c = randInt(1, Math.min(10, maxVal));
      
      const variant = Math.random();
      if (variant < 0.33) {
        // כפל וחיבור: a + b × c
        correctAnswer = a + b * c;
        question = `${a} + ${b} × ${c} = ${BLANK}`;
        params = { kind: "order_add_mul", a, b, c };
      } else if (variant < 0.66) {
        // כפל וחיסור: a × b - c
        correctAnswer = a * b - c;
        question = `${a} × ${b} - ${c} = ${BLANK}`;
        params = { kind: "order_mul_sub", a, b, c };
      } else {
        // עם סוגריים: (a + b) × c
        correctAnswer = (a + b) * c;
        question = `(${a} + ${b}) × ${c} = ${BLANK}`;
        params = { kind: "order_parentheses", a, b, c };
      }
      operandA = a;
      operandB = b;
    } else {
      // משוואות רגילות
      // כיתה א' - משוואות פשוטות (5 + __ = 7, 10 - __ = 6)
      if (gradeKey === "g1" && Math.random() < 0.3) {
        const eqType = Math.random() < 0.5 ? "add" : "sub";
        if (eqType === "add") {
          const a = randInt(1, 9);
          const c = randInt(a + 1, 10);
          const b = c - a;
          correctAnswer = b;
          const exerciseText = `${a} + ${BLANK} = ${c}`;
          question = exerciseText;
          params = { kind: "eq_add_simple", a, b, c, exerciseText };
          operandA = a;
          operandB = b;
        } else {
          const c = randInt(1, 9);
          const a = randInt(c + 1, 10);
          const b = a - c;
          correctAnswer = b;
          const exerciseText = `${a} - ${BLANK} = ${c}`;
          question = exerciseText;
          params = { kind: "eq_sub_simple", a, b, c, exerciseText };
          operandA = a;
          operandB = b;
        }
      } else {
        const canUseMulDiv = gradeKey === "g5" || gradeKey === "g6";
        const types = canUseMulDiv ? ["add", "sub", "mul", "div"] : ["add", "sub"];
        const t = types[Math.floor(Math.random() * types.length)];

        const maxAdd = levelConfig.addition.max || 100;
        const maxSub = levelConfig.subtraction.max || 100;
        const maxMul = levelConfig.multiplication.max || 10;
        const maxDiv = levelConfig.division.max || 100;
        const maxDivisor = levelConfig.division.maxDivisor || 12;

        if (t === "add") {
          const a = randInt(1, Math.floor(maxAdd / 2));
          const b = randInt(1, Math.floor(maxAdd / 2));
          const c = a + b;
          const form = Math.random() < 0.5 ? "a_plus_x" : "x_plus_b";

          let exerciseText;
          if (form === "a_plus_x") {
            correctAnswer = b;
            exerciseText = `${a} + ${BLANK} = ${c}`;
          } else {
            correctAnswer = a;
            exerciseText = `${BLANK} + ${b} = ${c}`;
          }
          question = exerciseText;
          params = { kind: "eq_add", form, a, b, c, exerciseText };
        } else if (t === "sub") {
          const c = randInt(0, Math.floor(maxSub / 2));
          const b = randInt(0, Math.floor(maxSub / 2));
          const a = c + b;
          const form = Math.random() < 0.5 ? "a_minus_x" : "x_minus_b";

          let exerciseText;
          if (form === "a_minus_x") {
            correctAnswer = b;
            exerciseText = `${a} - ${BLANK} = ${c}`;
          } else {
            correctAnswer = a;
            exerciseText = `${BLANK} - ${b} = ${c}`;
          }
          question = exerciseText;
          params = { kind: "eq_sub", form, a, b, c, exerciseText };
        } else if (t === "mul") {
          const a = randInt(1, maxMul);
          const b = randInt(1, maxMul);
          const c = a * b;
          const form = Math.random() < 0.5 ? "a_times_x" : "x_times_b";

          let exerciseText;
          if (form === "a_times_x") {
            correctAnswer = b;
            exerciseText = `${a} × ${BLANK} = ${c}`;
          } else {
            correctAnswer = a;
            exerciseText = `${BLANK} × ${b} = ${c}`;
          }
          question = exerciseText;
          params = { kind: "eq_mul", form, a, b, c, exerciseText };
        } else {
          const divisor = randInt(2, maxDivisor);
          const quotient = randInt(2, Math.max(2, Math.floor(maxDiv / divisor)));
          const dividend = divisor * quotient;
          const form = Math.random() < 0.5 ? "a_div_x" : "x_div_b";

          let exerciseText;
          if (form === "a_div_x") {
            correctAnswer = divisor;
            exerciseText = `${dividend} ÷ ${BLANK} = ${quotient}`;
          } else {
            correctAnswer = dividend;
            exerciseText = `${BLANK} ÷ ${divisor} = ${quotient}`;
          }
          question = exerciseText;
          params = { kind: "eq_div", form, dividend, divisor, quotient, exerciseText };
        }
      }
    }
  } else if (selectedOp === "compare") {
    const isLowGrade = gradeKey === "g1" || gradeKey === "g2";
    const maxVal = levelConfig.compare?.max || levelConfig.addition?.max || 500;
    const a = isLowGrade ? randInt(0, 100) : randInt(-20, maxVal);
    const b = isLowGrade ? randInt(0, 100) : randInt(-20, maxVal);

    let symbol = "=";
    if (a < b) symbol = "<";
    else if (a > b) symbol = ">";

    correctAnswer = symbol;
    const questionLabel = "השלם את הסימן:";
    const exerciseText = `${a} ${BLANK} ${b}`;
    question = `${questionLabel} ${exerciseText}`;
    params = { kind: "cmp", a, b, questionLabel, exerciseText };

    const baseOptions = ["<", ">", "="];
    const answers = [symbol, ...baseOptions.filter((s) => s !== symbol)];
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    return {
      question,
      questionLabel,
      exerciseText,
      correctAnswer,
      answers,
      operation: selectedOp,
      params,
      a,
      b,
      isStory: false,
    };

  // ===== Number Sense – שכנים, עשרות/יחידות, זוגי/אי-זוגי, השלמה, ישר המספרים, מנייה =====
  } else if (selectedOp === "number_sense") {
    const types =
      gradeKey === "g1"
        ? ["neighbors", "place_tens_units", "even_odd", "complement10", "number_line", "counting"]
        : gradeKey === "g2"
        ? ["neighbors", "place_tens_units", "even_odd", "complement10"]
        : gradeKey === "g3" || gradeKey === "g4"
        ? ["neighbors", "place_hundreds", "complement10", "complement100"]
        : ["neighbors", "place_hundreds", "complement100"];
    const t = types[Math.floor(Math.random() * types.length)];

    const maxNumberSense = levelConfig.number_sense?.max || levelConfig.addition?.max || 999;
    
    if (t === "neighbors") {
      const n = randInt(1, Math.min(999, maxNumberSense));
      const dir = Math.random() < 0.5 ? "after" : "before";
      if (dir === "after") {
        correctAnswer = n + 1;
        question = `מה המספר שבא אחרי ${n}? = ${BLANK}`;
      } else {
        correctAnswer = n - 1;
        question = `מה המספר שבא לפני ${n}? = ${BLANK}`;
      }
      params = { kind: "ns_neighbors", n, dir };
    } else if (t === "place_tens_units") {
      const n = randInt(10, 99);
      const askTens = Math.random() < 0.5;
      const tens = Math.floor(n / 10);
      const units = n % 10;
      correctAnswer = askTens ? tens : units;
      question = askTens
        ? `מהי ספרת העשרות במספר ${n}? = ${BLANK}`
        : `מהי ספרת היחידות במספר ${n}? = ${BLANK}`;
      params = { kind: "ns_place_tens_units", n, askTens, tens, units };
    } else if (t === "place_hundreds") {
      const n = randInt(100, 999);
      const partType = ["hundreds", "tens", "units"][
        Math.floor(Math.random() * 3)
      ];
      const hundreds = Math.floor(n / 100);
      const tens = Math.floor((n % 100) / 10);
      const units = n % 10;
      if (partType === "hundreds") correctAnswer = hundreds;
      else if (partType === "tens") correctAnswer = tens;
      else correctAnswer = units;
      const label =
        partType === "hundreds"
          ? "המאות"
          : partType === "tens"
          ? "העשרות"
          : "היחידות";
      question = `מהי ספרת ${label} במספר ${n}? = ${BLANK}`;
      params = { kind: "ns_place_hundreds", n, partType, hundreds, tens, units };
    } else if (t === "complement10") {
      const b = randInt(1, 9);
      const c = 10;
      const a = c - b;
      correctAnswer = a;
      question = `${BLANK} + ${b} = ${c}`;
      params = { kind: "ns_complement10", a, b, c };
    } else if (t === "complement100") {
      const b = randInt(1, 99);
      const c = 100;
      const a = c - b;
      correctAnswer = a;
      question = `${BLANK} + ${b} = ${c}`;
      params = { kind: "ns_complement100", a, b, c };
    } else if (t === "number_line") {
      // כיתה א' - ישר המספרים
      const start = randInt(0, 15);
      const end = start + 5;
      const missing = randInt(start + 1, end - 1);
      const numbers = [];
      for (let i = start; i <= end; i++) {
        numbers.push(i === missing ? BLANK : i);
      }
      correctAnswer = missing;
      question = `השלם את המספר החסר על ישר המספרים: ${numbers.join(" - ")}`;
      params = { kind: "ns_number_line", start, end, missing, numbers };
    } else if (t === "counting") {
      // כיתה א' - מנייה וספירה
      const countType = Math.random() < 0.5 ? "forward" : "backward";
      const start = randInt(1, 20);
      if (countType === "forward") {
        // ספירה קדימה: מה המספר הבא?
        correctAnswer = start + 1;
        question = `ספור קדימה: ${start}, ${BLANK}`;
        params = { kind: "ns_counting_forward", start, next: start + 1 };
      } else {
        // ספירה אחורה: מה המספר הקודם?
        if (start > 1) {
          correctAnswer = start - 1;
          question = `ספור אחורה: ${start}, ${BLANK}`;
          params = { kind: "ns_counting_backward", start, prev: start - 1 };
        } else {
          // אם start = 1, נשנה לספירה קדימה
          correctAnswer = start + 1;
          question = `ספור קדימה: ${start}, ${BLANK}`;
          params = { kind: "ns_counting_forward", start, next: start + 1 };
        }
      }
    } else {
      // even_odd – תשובה טקסטואלית
      const n = randInt(0, Math.min(200, maxNumberSense));
      const isEven = n % 2 === 0;
      correctAnswer = isEven ? "זוגי" : "אי-זוגי";
      question = `האם המספר ${n} הוא זוגי או אי-זוגי?`;
      params = { kind: "ns_even_odd", n, isEven };
      // ליצירת 4 תשובות, נוסיף גם תשובות על בסיס מספרים שכנים
      const baseAnswers = ["זוגי", "אי-זוגי"];
      const neighbor1 = n + 1;
      const neighbor2 = n - 1;
      baseAnswers.push(neighbor1 % 2 === 0 ? "זוגי" : "אי-זוגי");
      baseAnswers.push(neighbor2 % 2 === 0 ? "זוגי" : "אי-זוגי");
      // נסיר כפילויות ונשמור רק 4 תשובות ייחודיות
      const uniqueAnswers = [...new Set(baseAnswers)];
      while (uniqueAnswers.length < 4) {
        // אם עדיין אין 4, נוסיף תשובות חלופיות
        const altNum = n + uniqueAnswers.length;
        uniqueAnswers.push(altNum % 2 === 0 ? "זוגי" : "אי-זוגי");
      }
      const answers = uniqueAnswers.slice(0, 4);
      // נשמור את התשובה הנכונה ברשימה
      const correctIdx = answers.indexOf(correctAnswer);
      if (correctIdx === -1) {
        // אם התשובה הנכונה לא ברשימה, נחליף את הראשונה
        answers[0] = correctAnswer;
      } else if (correctIdx > 0) {
        // נזיז את התשובה הנכונה למקום אקראי (לא בהכרח ראשון)
        const randomPos = Math.floor(Math.random() * answers.length);
        [answers[randomPos], answers[correctIdx]] = [answers[correctIdx], answers[randomPos]];
      }

      return {
        question,
        correctAnswer,
        answers,
        operation: selectedOp,
        params,
        a: n,
        b: null,
        isStory: false,
      };
    }

  // ===== גורמים / כפולות / מ.כ.ק/מ.א.ח – Factors & Multiples =====
  } else if (selectedOp === "factors_multiples") {
    const types = ["factor", "multiple", "gcd"];
    const t = types[Math.floor(Math.random() * types.length)];
    const maxNumber = levelConfig.factors_multiples?.maxNumber || 100;

    if (t === "factor") {
      const n = randInt(12, Math.min(60, maxNumber));
      const factors = [];
      for (let i = 1; i <= n; i++) {
        if (n % i === 0) factors.push(i);
      }
      const correct = factors[randInt(1, factors.length - 1)]; // לא 1
      const options = new Set([correct]);
      while (options.size < 4) {
        const candidate = randInt(2, n + 5);
        if (candidate !== n && n % candidate !== 0) {
          options.add(candidate);
        }
      }
      const answers = Array.from(options);
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }

      correctAnswer = correct;
      question = `איזה מהמספרים הבאים הוא מחלק (גורם) של ${n}?`;
      params = { kind: "fm_factor", n, correct };

      return {
        question,
        correctAnswer,
        answers,
        operation: selectedOp,
        params,
        a: n,
        b: null,
        isStory: false,
      };
    } else if (t === "multiple") {
      const base = randInt(3, Math.min(12, Math.floor(maxNumber / 10)));
      const correct = base * randInt(2, Math.min(10, Math.floor(maxNumber / base)));
      const options = new Set([correct]);
      while (options.size < 4) {
        const candidate = randInt(base + 1, Math.min(base * 15, maxNumber));
        if (candidate % base !== 0) options.add(candidate);
      }
      const answers = Array.from(options);
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
      }

      correctAnswer = correct;
      question = `איזה מהמספרים הבאים הוא כפולה של ${base}?`;
      params = { kind: "fm_multiple", base, correct };

      return {
        question,
        correctAnswer,
        answers,
        operation: selectedOp,
        params,
        a: base,
        b: null,
        isStory: false,
      };
    } else {
      // gcd – מ.א.ח
      const base = randInt(2, 10);
      const k1 = randInt(2, 10);
      const k2 = randInt(2, 10);
      const a = base * k1;
      const b = base * k2;
      correctAnswer = base;
      question = `מהו המחלק המשותף הגדול ביותר של ${a} ו-${b}? = ${BLANK}`;
      params = { kind: "fm_gcd", a, b, gcd: base };
    }

  // ===== תרגילי מילים (רק חשבון – בלי גאומטריה) =====
  } else if (selectedOp === "word_problems") {
    // כיתות א' וב' - שאלות פשוטות
    const templates =
      gradeKey === "g1"
        ? ["simple_add", "simple_sub", "pocket_money", "time_days", "coins"]
        : gradeKey === "g2"
        ? ["simple_add", "simple_sub", "pocket_money", "groups", "time_days", "coins", "division_simple"]
        : gradeKey === "g5" || gradeKey === "g6"
        ? [
            "multi_step",
            "groups",
            "leftover",
            "shop_discount",
            "unit_convert",
            "distance_time",
            "simple_sub",
            "pocket_money",
            "time_sum",
            "average",
          ]
        : ["groups", "simple_add", "simple_sub", "pocket_money"];

    const t = templates[Math.floor(Math.random() * templates.length)];

    if (t === "simple_add") {
      const a = randInt(3, 9);
      const b = randInt(2, 8);
      correctAnswer = a + b;
      question = `לליאו יש ${a} כדורים והוא מקבל עוד ${b} כדורים. כמה כדורים יש לליאו בסך הכל?`;
      params = { kind: "wp_simple_add", a, b };
    } else if (t === "simple_sub") {
      const total = randInt(8, 15);
      const give = randInt(2, total - 3);
      correctAnswer = total - give;
      question = `לליאו יש ${total} מדבקות. הוא נותן לחבר ${give} מדבקות. כמה מדבקות נשארות לליאו?`;
      params = { kind: "wp_simple_sub", total, give };
    } else if (t === "pocket_money") {
      const money = randInt(20, 80);
      const toy = randInt(10, money - 5);
      correctAnswer = money - toy;
      question = `לליאו יש ${money}₪ דמי כיס. הוא קונה משחק ב-${toy}₪. כמה כסף נשאר לו?`;
      params = { kind: "wp_pocket_money", money, toy };
    } else if (t === "groups") {
      const per = randInt(3, 8);
      const groups = randInt(2, 6);
      correctAnswer = per * groups;
      question = `בכל קופסה יש ${per} עפרונות. יש ${groups} קופסאות כאלה. כמה עפרונות יש בסך הכל?`;
      params = { kind: "wp_groups", per, groups };
    } else if (t === "time_days") {
      // שאלות זמן - ימים בשבוע (כיתות א'-ב')
      const variant = Math.random();
      if (variant < 0.5) {
        const days = randInt(1, 6);
        const startDay = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"][randInt(0, 5)];
        const endDay = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"][randInt(0, 6)];
        correctAnswer = days;
        question = `אם היום יום ${startDay}, כמה ימים יעברו עד יום ${endDay}?`;
        params = { kind: "wp_time_days", days };
      } else {
        const today = randInt(1, 5);
        const daysLater = randInt(1, 7 - today);
        correctAnswer = today + daysLater;
        question = `אם היום ה-${today} לחודש, איזה תאריך יהיה בעוד ${daysLater} ימים?`;
        params = { kind: "wp_time_date", today, daysLater };
      }
    } else if (t === "coins") {
      // שאלות כסף - מטבעות (כיתות א'-ב')
      const variant = Math.random();
      if (variant < 0.5) {
        const coins1 = randInt(1, 5);
        const coins2 = randInt(1, 5);
        const value1 = coins1 * 1; // שקל
        const value2 = coins2 * 2; // 2 שקלים
        correctAnswer = value1 + value2;
        question = `לליאו יש ${coins1} מטבעות של שקל ו-${coins2} מטבעות של 2 שקלים. כמה כסף יש לו בסך הכל?`;
        params = { kind: "wp_coins", coins1, coins2, value1, value2 };
      } else {
        const total = randInt(5, 15);
        const spent = randInt(2, total - 2);
        correctAnswer = total - spent;
        question = `לליאו יש ${total}₪ במטבעות. הוא קונה ממתק ב-${spent}₪. כמה כסף נשאר לו?`;
        params = { kind: "wp_coins_spent", total, spent };
      }
    } else if (t === "division_simple") {
      // שאלות חילוק פשוטות (כיתה ב')
      const total = randInt(6, 20);
      const perGroup = randInt(2, 5);
      const groups = Math.floor(total / perGroup);
      const remainder = total % perGroup;
      if (remainder === 0) {
        correctAnswer = groups;
        question = `יש ${total} תפוחים. מחלקים אותם לקבוצות של ${perGroup} תפוחים בכל קבוצה. כמה קבוצות יש?`;
        params = { kind: "wp_division_simple", total, perGroup, groups };
      } else {
        correctAnswer = groups;
        question = `יש ${total} תפוחים. מחלקים אותם לקבוצות של ${perGroup} תפוחים בכל קבוצה. כמה קבוצות מלאות יש?`;
        params = { kind: "wp_division_simple_remainder", total, perGroup, groups, remainder };
      }
    } else if (t === "leftover") {
      const total = randInt(40, 100);
      const groupSize = randInt(4, 8);
      const groups = Math.floor(total / groupSize);
      const leftover = total - groups * groupSize;
      correctAnswer = leftover;
      question = `יש ${total} תלמידים והם מתחלקים לקבוצות של ${groupSize} תלמידים בכל קבוצה. כמה תלמידים יישארו בלי קבוצה מלאה?`;
      params = { kind: "wp_leftover", total, groupSize, groups, leftover };
    } else if (t === "shop_discount") {
      const price = randInt(50, 400);
      const discPerc = [10, 20, 25, 50][randInt(0, 3)];
      const discount = Math.round((price * discPerc) / 100);
      const finalPrice = price - discount;
      correctAnswer = finalPrice;
      question = `חולצה עולה ${price}₪ ויש עליה הנחה של ${discPerc}%. כמה תשלם אחרי ההנחה?`;
      params = {
        kind: "wp_shop_discount",
        price,
        discPerc,
        discount,
        finalPrice,
      };
    } else if (t === "unit_convert") {
      const mode = Math.random() < 0.5 ? "cm_to_m" : "g_to_kg";
      if (mode === "cm_to_m") {
        const meters = randInt(1, 9);
        const cm = meters * 100;
        correctAnswer = meters;
        question = `כמה מטרים הם ${cm} סנטימטרים? = ${BLANK}`;
        params = { kind: "wp_unit_cm_to_m", cm, meters };
      } else {
        const kg = randInt(1, 9);
        const g = kg * 1000;
        correctAnswer = kg;
        question = `כמה קילוגרמים הם ${g} גרם? = ${BLANK}`;
        params = { kind: "wp_unit_g_to_kg", g, kg };
      }
    } else if (t === "distance_time") {
      const speed = [5, 6, 8, 10][randInt(0, 3)]; // קמ"ש
      const hours = randInt(1, 4);
      const distance = speed * hours;
      correctAnswer = distance;
      question = `ילד הולך במהירות קבועה של ${speed} ק"מ בשעה במשך ${hours} שעות. כמה קילומטרים יעבור?`;
      params = {
        kind: "wp_distance_time",
        speed,
        hours,
        distance,
      };
    } else if (t === "time_sum") {
      const l1 = randInt(20, 60);
      const l2 = randInt(10, 40);
      correctAnswer = l1 + l2;
      question = `סרט ראשון נמשך ${l1} דקות וסרטון נוסף נמשך ${l2} דקות. כמה דקות נמשך הצפייה ביחד?`;
      params = { kind: "wp_time_sum", l1, l2 };
    } else if (t === "average") {
      const s1 = randInt(60, 100);
      const s2 = randInt(60, 100);
      const s3 = randInt(60, 100);
      correctAnswer = Math.round((s1 + s2 + s3) / 3);
      question = `לליאו ציונים ${s1}, ${s2} ו-${s3} בשלושה מבחנים. מה הממוצע שלו (מעוגל למספר שלם)?`;
      params = { kind: "wp_average", s1, s2, s3 };
    } else {
      // multi_step – בעיה חשבונית רב-שלבית (קנייה+עודף)
      const a = randInt(2, 5);
      const b = randInt(3, 7);
      const price = randInt(5, 20);
      const totalQty = a + b;
      const totalCost = totalQty * price;
      const money = randInt(totalCost + 10, totalCost + 50);
      correctAnswer = money - totalCost;
      question = `לליאו יש ${money}₪. הוא קונה ${a} עטים ו-${b} עפרונות, וכל פריט עולה ${price}₪. כמה כסף יישאר לו אחרי הקנייה?`;
      params = {
        kind: "wp_multi_step",
        a,
        b,
        price,
        totalQty,
        totalCost,
        money,
      };
    }
    isStory = true;
  // ===== סימני התחלקות =====
  } else if (selectedOp === "divisibility") {
    const divisibilityConfig = levelConfig.divisibility || {};
    const divisors = divisibilityConfig.divisors || [2, 5, 10];
    const divisor = divisors[Math.floor(Math.random() * divisors.length)];
    const maxNum = levelConfig.compare?.max || 1000;
    const num = randInt(10, maxNum);
    const isDivisible = num % divisor === 0;
    
    correctAnswer = isDivisible ? "כן" : "לא";
    question = `האם המספר ${num} מתחלק ב-${divisor}?`;
    params = { kind: "divisibility", num, divisor, isDivisible };
    operandA = num;
    operandB = divisor;
    // הוספת תשובה שגויה
    wrongAnswers.add(isDivisible ? "לא" : "כן");

  // ===== מספרים ראשוניים ופריקים =====
  } else if (selectedOp === "prime_composite") {
    const primeConfig = levelConfig.prime_composite || {};
    const maxNum = primeConfig.maxNumber || 100;
    
    // פונקציה לבדיקת ראשוני
    const isPrime = (n) => {
      if (n < 2) return false;
      if (n === 2) return true;
      if (n % 2 === 0) return false;
      for (let i = 3; i * i <= n; i += 2) {
        if (n % i === 0) return false;
      }
      return true;
    };
    
    const num = randInt(2, maxNum);
    const isNumPrime = isPrime(num);
    correctAnswer = isNumPrime ? "ראשוני" : "פריק";
    question = `האם המספר ${num} הוא ראשוני או פריק?`;
    params = { kind: "prime_composite", num, isPrime: isNumPrime };
    operandA = num;
    operandB = null;
    // הוספת תשובה שגויה
    wrongAnswers.add(isNumPrime ? "פריק" : "ראשוני");

  // ===== חזקות =====
  } else if (selectedOp === "powers") {
    const powersConfig = levelConfig.powers || {};
    const maxBase = powersConfig.maxBase || 10;
    const maxExp = powersConfig.maxExp || 3;
    const base = randInt(2, maxBase);
    const exp = randInt(2, maxExp);
    const result = Math.pow(base, exp);
    
    const variant = Math.random();
    if (variant < 0.5) {
      // מה התוצאה?
      correctAnswer = result;
      question = `${base}^${exp} = ${BLANK}`;
      params = { kind: "power_calc", base, exp, result };
    } else {
      // מה הבסיס?
      correctAnswer = base;
      question = `${BLANK}^${exp} = ${result}`;
      params = { kind: "power_base", base, exp, result };
    }
    
    operandA = base;
    operandB = exp;

  // ===== יחס =====
  } else if (selectedOp === "ratio") {
    const a = randInt(1, 20);
    const b = randInt(1, 20);
    const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
    const divisor = gcd(a, b);
    const simplifiedA = a / divisor;
    const simplifiedB = b / divisor;
    
    const variant = Math.random();
    if (variant < 0.33) {
      // מציאת היחס
      correctAnswer = `${simplifiedA}:${simplifiedB}`;
      question = `מה היחס בין ${a} ל-${b}? (בצורה מצומצמת)`;
      params = { kind: "ratio_find", a, b, simplifiedA, simplifiedB };
    } else if (variant < 0.66) {
      // מציאת המספר הראשון
      const ratio = simplifiedA / simplifiedB;
      const secondNum = randInt(1, 20);
      const firstNum = Math.round(secondNum * ratio);
      correctAnswer = firstNum;
      question = `היחס בין מספר למספר ${secondNum} הוא ${simplifiedA}:${simplifiedB}. מה המספר הראשון?`;
      params = { kind: "ratio_first", firstNum, secondNum, simplifiedA, simplifiedB };
    } else {
      // מציאת המספר השני
      const ratio = simplifiedA / simplifiedB;
      const firstNum = randInt(1, 20);
      const secondNum = Math.round(firstNum / ratio);
      correctAnswer = secondNum;
      question = `היחס בין מספר ${firstNum} למספר הוא ${simplifiedA}:${simplifiedB}. מה המספר השני?`;
      params = { kind: "ratio_second", firstNum, secondNum, simplifiedA, simplifiedB };
    }
    
    operandA = a;
    operandB = b;

  // ===== תכונות ה-0 וה-1 (כיתה ד') =====
  } else if (selectedOp === "zero_one_properties") {
    const variant = Math.random();
    if (variant < 0.25) {
      // כפל ב-0
      const a = randInt(1, 100);
      correctAnswer = 0;
      question = `מה התוצאה של ${a} × 0?`;
      params = { kind: "zero_mul", a };
      operandA = a;
      operandB = 0;
    } else if (variant < 0.5) {
      // חיבור עם 0
      const a = randInt(1, 100);
      correctAnswer = a;
      question = `מה התוצאה של ${a} + 0?`;
      params = { kind: "zero_add", a };
      operandA = a;
      operandB = 0;
    } else if (variant < 0.75) {
      // חיסור של 0
      const a = randInt(1, 100);
      correctAnswer = a;
      question = `מה התוצאה של ${a} - 0?`;
      params = { kind: "zero_sub", a };
      operandA = a;
      operandB = 0;
    } else {
      // כפל ב-1
      const a = randInt(1, 100);
      correctAnswer = a;
      question = `מה התוצאה של ${a} × 1?`;
      params = { kind: "one_mul", a };
      operandA = a;
      operandB = 1;
    }

  // ===== אומדן (כיתות ד'-ה') =====
  } else if (selectedOp === "estimation") {
    const maxVal = levelConfig.estimation?.max || 1000;
    const variant = Math.random();
    if (variant < 0.33) {
      // אומדן חיבור
      const a = randInt(10, maxVal);
      const b = randInt(10, maxVal);
      const exact = a + b;
      const estimate = Math.round(exact / 10) * 10; // עיגול לעשרות
      correctAnswer = estimate;
      question = `אמד את התוצאה של ${a} + ${b} (עיגול לעשרות הקרובות): ${BLANK}`;
      params = { kind: "est_add", a, b, exact, estimate };
      operandA = a;
      operandB = b;
    } else if (variant < 0.66) {
      // אומדן כפל
      const a = randInt(10, Math.min(100, maxVal));
      const b = randInt(2, 10);
      const exact = a * b;
      const estimate = Math.round(exact / 100) * 100; // עיגול למאות
      correctAnswer = estimate;
      question = `אמד את התוצאה של ${a} × ${b} (עיגול למאות הקרובות): ${BLANK}`;
      params = { kind: "est_mul", a, b, exact, estimate };
      operandA = a;
      operandB = b;
    } else {
      // אומדן כמויות
      const quantity = randInt(50, maxVal);
      const estimate = Math.round(quantity / 10) * 10;
      correctAnswer = estimate;
      question = `אמד את הכמות ${quantity} (עיגול לעשרות הקרובות): ${BLANK}`;
      params = { kind: "est_quantity", quantity, estimate };
      operandA = quantity;
      operandB = null;
    }

  // ===== קנה מידה (כיתה ו') =====
  } else if (selectedOp === "scale") {
    const scaleConfig = levelConfig.scale || {};
    const maxScale = scaleConfig.max || 100;
    const variant = Math.random();
    if (variant < 0.33) {
      // מציאת אורך במציאות לפי מפה
      const mapLength = randInt(1, 10);
      const scale = randInt(2, 10);
      const realLength = mapLength * scale;
      correctAnswer = realLength;
      question = `במפה בקנה מידה 1:${scale}, אורך של ${mapLength} ס"מ במפה שווה ל-${BLANK} ס"מ במציאות`;
      params = { kind: "scale_map_to_real", mapLength, scale, realLength };
      operandA = mapLength;
      operandB = scale;
    } else if (variant < 0.66) {
      // מציאת אורך במפה לפי מציאות
      const realLength = randInt(10, maxScale);
      const scale = randInt(2, 10);
      const mapLength = realLength / scale;
      correctAnswer = round(mapLength, 1);
      question = `במפה בקנה מידה 1:${scale}, אורך של ${realLength} ס"מ במציאות שווה ל-${BLANK} ס"מ במפה`;
      params = { kind: "scale_real_to_map", realLength, scale, mapLength };
      operandA = realLength;
      operandB = scale;
    } else {
      // מציאת קנה מידה
      const mapLength = randInt(1, 5);
      const realLength = randInt(10, 50);
      const scale = realLength / mapLength;
      correctAnswer = scale;
      question = `אורך של ${mapLength} ס"מ במפה שווה ל-${realLength} ס"מ במציאות. מה קנה המידה? (1:${BLANK})`;
      params = { kind: "scale_find", mapLength, realLength, scale };
      operandA = mapLength;
      operandB = realLength;
    }
  } else {
    // ברירת מחדל - חיבור פשוט
    const maxA = levelConfig.addition.max || 20;
    const a = randInt(1, maxA);
    const b = randInt(1, maxA);
    correctAnswer = round(a + b);
    const exerciseText = `${a} + ${b} = ${BLANK}`;
    question = exerciseText;
    params = { kind: "add_two", a, b, exerciseText };
    operandA = a;
    operandB = b;
  }

  const wrongAnswers = new Set();
  const isDecimalsOp = selectedOp === "decimals";
  const correctIsFraction =
    typeof correctAnswer === "string" && correctAnswer.includes("/");
  const isNumericAnswer = typeof correctAnswer === "number";

  if (isDecimalsOp) {
    const places =
      params?.places != null ? Math.max(1, Math.min(3, params.places)) : 1;
    const correctNum = Number(correctAnswer);
    const fmt = (x) => x.toFixed(places);

    let guard = 0;
    while (wrongAnswers.size < 3 && guard < 50) {
      guard++;
      const deltaBase = Math.max(0.1, Math.abs(correctNum) * 0.1);
      const sign = Math.random() < 0.5 ? 1 : -1;
      const step = Math.random() < 0.5 ? 0.1 : 0.2;
      const wrongNum = correctNum + sign * deltaBase * step;
      const wrong = fmt(wrongNum);
      if (wrong !== correctAnswer && !wrongAnswers.has(wrong)) {
        wrongAnswers.add(wrong);
      }
    }
    if (guard >= 50) {
      console.warn("Failed to generate enough wrong answers for decimals");
    }
  } else if (correctIsFraction) {
    const [cnRaw, cdRaw] = String(correctAnswer).split("/");
    const cn = Number(cnRaw);
    const cd = Number(cdRaw) || 1;

    let guard = 0;
    while (wrongAnswers.size < 3 && guard < 50) {
      guard++;
      const delta = randInt(1, 3);
      const sign = Math.random() > 0.5 ? 1 : -1;
      const nWrong = cn + sign * delta;
      const wrong = `${nWrong}/${cd}`;
      if (wrong !== correctAnswer && !wrongAnswers.has(wrong) && nWrong > 0) {
        wrongAnswers.add(wrong);
      }
    }
    if (guard >= 50) {
      console.warn("Failed to generate enough wrong answers for fractions");
    }
  } else if (isNumericAnswer) {
    let guard = 0;
    while (wrongAnswers.size < 3 && guard < 50) {
      guard++;
      const baseDelta = Math.max(
        1,
        Math.round(Math.abs(correctAnswer) * 0.15)
      );
      const variation = randInt(1, 3);
      const sign = Math.random() > 0.5 ? 1 : -1;
      const wrong = correctAnswer + sign * baseDelta * variation;

      if (
        wrong !== correctAnswer &&
        !wrongAnswers.has(wrong) &&
        wrong >= -200 &&
        wrong <= 5000
      ) {
        wrongAnswers.add(wrong);
      }
    }
    if (guard >= 50) {
      console.warn("Failed to generate enough wrong answers for numeric");
    }
  } else {
    // תשובות לא מספריות (כמו סימני השוואה) כבר טופלו ב-return מוקדם
  }

  // וודא שיש תמיד 3 תשובות שגויות (4 כולל התשובה הנכונה)
  // אם הלולאות הקודמות לא הצליחו ליצור 3 תשובות, נוסיף תשובות פשוטות
  if (wrongAnswers.size < 3) {
    if (isNumericAnswer && typeof correctAnswer === "number") {
      // יצירת תשובות שגויות פשוטות למספרים
      const attempts = [
        correctAnswer + 1,
        correctAnswer - 1,
        correctAnswer + 2,
        correctAnswer - 2,
        correctAnswer + Math.max(1, Math.round(Math.abs(correctAnswer) * 0.1)),
        correctAnswer - Math.max(1, Math.round(Math.abs(correctAnswer) * 0.1)),
        correctAnswer * 2,
        correctAnswer + 5,
        correctAnswer - 5,
      ];
      
      for (const attempt of attempts) {
        if (wrongAnswers.size >= 3) break;
        if (
          attempt !== correctAnswer &&
          !wrongAnswers.has(attempt) &&
          attempt >= -200 &&
          attempt <= 5000 &&
          !Number.isNaN(attempt)
        ) {
          wrongAnswers.add(attempt);
        }
      }
    } else if (correctIsFraction) {
      const [cnRaw, cdRaw] = String(correctAnswer).split("/");
      const cn = Number(cnRaw);
      const cd = Number(cdRaw) || 1;
      
      // יצירת תשובות שגויות פשוטות לשברים
      const attempts = [
        `${cn + 1}/${cd}`,
        `${Math.max(1, cn - 1)}/${cd}`,
        `${cn}/${cd + 1}`,
        `${cn + 2}/${cd}`,
        `${cn}/${Math.max(1, cd - 1)}`,
      ];
      
      for (const attempt of attempts) {
        if (wrongAnswers.size >= 3) break;
        if (attempt !== correctAnswer && !wrongAnswers.has(attempt)) {
          wrongAnswers.add(attempt);
        }
      }
    } else if (isDecimalsOp) {
      const correctNum = Number(correctAnswer);
      const places = params?.places != null ? Math.max(1, Math.min(3, params.places)) : 1;
      const fmt = (x) => x.toFixed(places);
      
      // יצירת תשובות שגויות פשוטות לעשרוניים
      const attempts = [
        fmt(correctNum + 0.1),
        fmt(correctNum - 0.1),
        fmt(correctNum + 0.2),
        fmt(correctNum - 0.2),
        fmt(correctNum * 1.1),
        fmt(correctNum * 0.9),
      ];
      
      for (const attempt of attempts) {
        if (wrongAnswers.size >= 3) break;
        if (attempt !== correctAnswer && !wrongAnswers.has(attempt)) {
          wrongAnswers.add(attempt);
        }
      }
    } else if (typeof correctAnswer === "number") {
      // למקרים אחרים עם מספרים
      const attempts = [
        correctAnswer + 1,
        correctAnswer - 1,
        correctAnswer + 2,
        correctAnswer - 2,
        correctAnswer * 2,
      ];
      
      for (const attempt of attempts) {
        if (wrongAnswers.size >= 3) break;
        if (attempt !== correctAnswer && !wrongAnswers.has(attempt)) {
          wrongAnswers.add(attempt);
        }
      }
    }
  }

  // וודא שיש בדיוק 3 תשובות שגויות (אם עדיין לא, נוסיף תשובות ברירת מחדל)
  const wrongAnswersArray = Array.from(wrongAnswers);
  while (wrongAnswersArray.length < 3 && typeof correctAnswer === "number") {
    const fallback = correctAnswer + wrongAnswersArray.length + 10;
    if (fallback !== correctAnswer && !wrongAnswersArray.includes(fallback)) {
      wrongAnswersArray.push(fallback);
      } else {
      // ננסה ערכים אחרים
      const altFallback = correctAnswer - (wrongAnswersArray.length + 10);
      if (altFallback !== correctAnswer && !wrongAnswersArray.includes(altFallback)) {
        wrongAnswersArray.push(altFallback);
      } else {
        break; // הגנה מפני לולאה אינסופית
      }
    }
  }
  
  // וודא שיש בדיוק 4 תשובות (1 נכונה + 3 שגויות)
  const allAnswers = [correctAnswer, ...wrongAnswersArray.slice(0, 3)];
  
  // אם עדיין אין 4 תשובות, נוסיף תשובות ברירת מחדל
  while (allAnswers.length < 4) {
    if (typeof correctAnswer === "number") {
      const defaultWrong = correctAnswer + allAnswers.length * 5;
      if (defaultWrong !== correctAnswer && !allAnswers.includes(defaultWrong)) {
        allAnswers.push(defaultWrong);
      } else {
        break; // הגנה מפני לולאה אינסופית
      }
    } else {
      // למקרים לא מספריים, נסיים כאן
      break;
    }
  }

  
  // וודא שיש בדיוק 4 תשובות לפני ערבוב
  if (allAnswers.length !== 4) {
    console.warn(`Expected 4 answers but got ${allAnswers.length} for question: ${question}`);
    // אם יש פחות מ-4, נמלא עם תשובות ברירת מחדל
    while (allAnswers.length < 4 && typeof correctAnswer === "number") {
      allAnswers.push(correctAnswer + allAnswers.length * 10);
    }
  }
  
  // ערבוב התשובות
  for (let i = allAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
  }

  // וודא שיש טקסט לשאלה
  const finalQuestionText = question && question.trim().length > 0 ? question : `תרגיל ${selectedOp}`;
  const finalExerciseText = params.exerciseText || finalQuestionText;

  return {
    question: finalQuestionText,
    questionLabel: params.questionLabel,
    exerciseText: finalExerciseText,
    correctAnswer,
    answers: allAnswers,
    operation: selectedOp,
    params,
    a: operandA,
    b: operandB,
    isStory,
  };
}

