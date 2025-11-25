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

    // האם להשתמש בתרגילי השלמה (לעשר/מספר עגול) - רק מכיתה ג' ומעלה
    const useComplementG3 = !isLowGrade && (gradeKey === "g3" || gradeKey === "g4") && Math.random() < 0.2;
    // האם להשתמש בתרגיל 3 מספרים - רק מכיתה ג' ומעלה
    const useThreeTerms = !isLowGrade && allowTwoStep && Math.random() < 0.3;

    if (useComplementG3) {
      // כיתות ג–ד: השלמה לעשרות קרובות
      const base = randInt(10, 90);
      const tens = Math.round(base / 10) * 10;
      const diff = tens - base;
      correctAnswer = diff;
      const exerciseText = `${base} + ${BLANK} = ${tens}`;
      question = exerciseText;
      params = {
        kind: "add_complement_round10",
        base,
        tens,
        diff,
        exerciseText,
        op: "add",
        grade: gradeKey,
      };
      operandA = base;
      operandB = diff;
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

      // בכיתות א' וב' - רק תרגיל ישיר (ללא נעלם)
      if (isLowGrade) {
        // צורה רגילה: a + b = __
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
      } else {
        // מכיתה ג' ומעלה - אפשר גם נעלם
        const variant = Math.random();

        if (variant < 0.33) {
          // צורה רגילה: a + b = __
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
        } else if (variant < 0.66) {
          // חסר המספר הראשון: __ + b = c
          correctAnswer = a;
          const exerciseText = `${BLANK} + ${b} = ${c}`;
          question = exerciseText;
          params = {
            kind: "add_missing_first",
            a,
            b,
            c,
            exerciseText,
            op: "add",
            grade: gradeKey,
          };
        } else {
          // חסר המספר השני: a + __ = c
          correctAnswer = b;
          const exerciseText = `${a} + ${BLANK} = ${c}`;
          question = exerciseText;
          params = {
            kind: "add_missing_second",
            a,
            b,
            c,
            exerciseText,
            op: "add",
            grade: gradeKey,
          };
        }
      }

      operandA = a;
      operandB = b;
    }
  } else if (selectedOp === "subtraction") {
    const maxS = levelConfig.subtraction.max || 20;
    const minS = levelConfig.subtraction.min ?? 0;
    const isLowGrade = gradeKey === "g1" || gradeKey === "g2"; // כיתות א' וב'

    let a;
    let b;

    if (allowNegatives) {
      a = randInt(minS, maxS);
      b = randInt(minS, maxS);
  } else {
      b = randInt(minS, maxS);
      a = randInt(b, maxS); // דואג ש-a ≥ b
    }

    const c = a - b;

    // בכיתות א' וב' - רק תרגיל ישיר (ללא נעלם)
    if (isLowGrade) {
      // צורה רגילה: a - b = __
      correctAnswer = c;
      const exerciseText = `${a} - ${b} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "sub_two", a, b, c, exerciseText };
    } else {
      // מכיתה ג' ומעלה - אפשר גם נעלם
      const variant = Math.random();

      if (variant < 0.33) {
        // צורה רגילה: a - b = __
        correctAnswer = c;
        const exerciseText = `${a} - ${b} = ${BLANK}`;
        question = exerciseText;
        params = { kind: "sub_two", a, b, c, exerciseText };
      } else if (variant < 0.66) {
        // חסר המספר הראשון: __ - b = c
        // מתאים רק אם אין צורך בשליליים לתשובה הראשונה
        correctAnswer = a;
        const exerciseText = `${BLANK} - ${b} = ${c}`;
        question = exerciseText;
        params = {
          kind: "sub_missing_first",
          a,
          b,
          c,
          exerciseText,
        };
      } else {
        // חסר המספר השני: a - __ = c
        correctAnswer = b;
        const exerciseText = `${a} - ${BLANK} = ${c}`;
        question = exerciseText;
        params = {
          kind: "sub_missing_second",
          a,
          b,
          c,
          exerciseText,
        };
      }
    }

    operandA = a;
    operandB = b;
  } else if (selectedOp === "multiplication") {
    // שימוש ב-levelConfig.multiplication.max ישירות מ-GRADE_LEVELS
    const maxM = levelConfig.multiplication?.max || 10;
    // שני הגורמים יכולים להיות עד maxM (ללא הגבלה של 12)
    const a = randInt(1, maxM);
    const b = randInt(1, maxM);
    const c = a * b;

    const variant = Math.random();

    if (variant < 0.33) {
      // צורה רגילה: a × b = __
      correctAnswer = round(c);
      const exerciseText = `${a} × ${b} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "mul", a, b, exerciseText };
    } else if (variant < 0.66) {
      // חסר המספר הראשון: __ × b = c
      correctAnswer = a;
      const exerciseText = `${BLANK} × ${b} = ${c}`;
      question = exerciseText;
      params = {
        kind: "mul_missing_first",
        a,
        b,
        c,
        exerciseText,
        op: "mul",
        grade: gradeKey,
      };
    } else {
      // חסר המספר השני: a × __ = c
      correctAnswer = b;
      const exerciseText = `${a} × ${BLANK} = ${c}`;
      question = exerciseText;
      params = {
        kind: "mul_missing_second",
        a,
        b,
        c,
        exerciseText,
        op: "mul",
        grade: gradeKey,
      };
    }

    operandA = a;
    operandB = b;
  } else if (selectedOp === "division") {
    const maxD = levelConfig.division.max || 100;
    const maxDivisor = levelConfig.division.maxDivisor || 12;
    const divisor = randInt(2, maxDivisor);
    const quotient = randInt(2, Math.max(2, Math.floor(maxD / divisor)));
    const dividend = divisor * quotient;

    const variant = Math.random();

    if (variant < 0.33) {
      // צורה רגילה: dividend ÷ divisor = __
      correctAnswer = round(quotient);
      const exerciseText = `${dividend} ÷ ${divisor} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "div", dividend, divisor, exerciseText };
    } else if (variant < 0.66) {
      // חסר המחולק: __ ÷ divisor = quotient
      correctAnswer = dividend;
      const exerciseText = `${BLANK} ÷ ${divisor} = ${quotient}`;
      question = exerciseText;
      params = {
        kind: "div_missing_dividend",
        dividend,
        divisor,
        quotient,
        exerciseText,
        op: "div",
        grade: gradeKey,
      };
      } else {
      // חסר המחלק: dividend ÷ __ = quotient
      correctAnswer = divisor;
      const exerciseText = `${dividend} ÷ ${BLANK} = ${quotient}`;
      question = exerciseText;
      params = {
        kind: "div_missing_divisor",
        dividend,
        divisor,
        quotient,
        exerciseText,
        op: "div",
        grade: gradeKey,
      };
    }

    operandA = dividend;
    operandB = divisor;
  } else if (selectedOp === "fractions" && levelConfig.allowFractions) {
    const densSmall = [2, 4, 5, 10];
    const densBig = [2, 3, 4, 5, 6, 8, 10, 12];
    const dens =
      gradeKey === "g3" || gradeKey === "g4"
        ? densSmall.filter((d) => d <= levelConfig.fractions.maxDen)
        : densBig.filter((d) => d <= levelConfig.fractions.maxDen);

    const opKind = Math.random() < 0.5 ? "add_frac" : "sub_frac";

    if (gradeKey === "g3" || gradeKey === "g4") {
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
      } else {
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

      let resNum = opKind === "add_frac" ? n1 * m1 + n2 * m2 : n1 * m1 - n2 * m2;

      if (opKind === "sub_frac" && resNum < 0) {
        resNum = n2 * m2 - n1 * m1;
        question = `${n2}/${den2} - ${n1}/${den1} = ${BLANK}`;
        params = {
          kind: "frac_diff_den",
          op: "sub",
          n1: n2,
          den1: den2,
          n2: n1,
          den2: den1,
          commonDen,
        };
      } else {
        question =
          opKind === "add_frac"
            ? `${n1}/${den1} + ${n2}/${den2} = ${BLANK}`
            : `${n1}/${den1} - ${n2}/${den2} = ${BLANK}`;
        params = {
          kind: "frac_diff_den",
          op: opKind === "add_frac" ? "add" : "sub",
          n1,
          den1,
          n2,
          den2,
          commonDen,
        };
      }

      correctAnswer = `${resNum}/${commonDen}`;
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
    const a = round(Math.random() * maxBase, places);
    const b = round(Math.random() * maxBase, places);
    const t = Math.random() < 0.5 ? "add" : "sub";

    if (t === "add") {
      correctAnswer = round(a + b, places);
      question = `${a.toFixed(places)} + ${b.toFixed(places)} = ${BLANK}`;
      params = { kind: "dec_add", a, b, places };
      } else {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      correctAnswer = round(big - small, places);
      question = `${big.toFixed(places)} - ${small.toFixed(places)} = ${BLANK}`;
      params = { kind: "dec_sub", a: big, b: small, places };
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
  } else if (selectedOp === "equations") {
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

  // ===== Number Sense – שכנים, עשרות/יחידות, זוגי/אי-זוגי, השלמה =====
  } else if (selectedOp === "number_sense") {
    const types =
      gradeKey === "g1" || gradeKey === "g2"
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
    const templates =
      gradeKey === "g5" || gradeKey === "g6"
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
  } else {
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

  return {
    question,
    questionLabel: params.questionLabel,
    exerciseText: params.exerciseText,
    correctAnswer,
    answers: allAnswers,
    operation: selectedOp,
    params,
    a: operandA,
    b: operandB,
    isStory,
  };
}

