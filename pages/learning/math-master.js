import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";

const BLANK = "__";

const LEVELS = {
  easy: {
    name: "קל",
    addition: { max: 20 },
    subtraction: { min: 0, max: 20 },
    multiplication: { max: 5 },
    division: { max: 50, maxDivisor: 5 },
    fractions: { maxDen: 4 },
  },
  medium: {
    name: "בינוני",
    addition: { max: 100 },
    subtraction: { min: 0, max: 100 },
    multiplication: { max: 10 },
    division: { max: 100, maxDivisor: 10 },
    fractions: { maxDen: 8 },
  },
  hard: {
    name: "קשה",
    addition: { max: 500 },
    subtraction: { min: -200, max: 500 },
    multiplication: { max: 12 },
    division: { max: 500, maxDivisor: 12 },
    fractions: { maxDen: 12 },
  },
};

const GRADES = {
  g1_2: {
    name: "כיתות א–ב",
    operations: [
      "addition",
      "subtraction",
      "compare",
      "number_sense", // שכנים, זוגי/אי-זוגי, השלמה ל-10, עשרות/יחידות
    ],
    allowFractions: false,
    allowNegatives: false,
  },
  g3_4: {
    name: "כיתות ג–ד",
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "fractions",
      "sequences",
      "decimals",
      "compare",
      "equations",
      "number_sense",
      "mixed",
    ],
    allowFractions: true,
    allowNegatives: false,
  },
  g5_6: {
    name: "כיתות ה–ו",
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "fractions",
      "percentages",
      "sequences",
      "decimals",
      "rounding",
      "equations",
      "compare",
      "number_sense",
      "factors_multiples",
      "word_problems",
      "mixed",
    ],
    allowFractions: true,
    allowNegatives: true,
  },
};

const OPERATIONS = [
  "addition",
  "subtraction",
  "multiplication",
  "division",
  "fractions",
  "percentages",
  "sequences",
  "decimals",
  "rounding",
  "equations",
  "compare",
  "number_sense",
  "factors_multiples",
  "word_problems",
  "mixed",
];

function getLevelForGrade(levelKey, gradeKey) {
  const base = LEVELS[levelKey] || LEVELS.easy;
  const gradeCfg = GRADES[gradeKey] || GRADES.g3_4;

  let factor = 1;
  let allowNegatives = false;
  let allowTwoStep = false;

  switch (gradeKey) {
    case "g1_2":
      factor = 0.6;
      break;
    case "g3_4":
      factor = 1;
      break;
    case "g5_6":
      factor = 1.4;
      allowNegatives = gradeCfg.allowNegatives;
      allowTwoStep = levelKey !== "easy";
      break;
    default:
      factor = 1;
  }

  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  const scale = (n, min, max) => clamp(Math.round(n * factor), min, max);

  const additionMax = scale(base.addition?.max || 20, 10, 999);
  const subMax = scale(base.subtraction?.max || 20, 10, 999);
  const subMin =
    base.subtraction?.min != null ? Math.round(base.subtraction.min * factor) : 0;
  const mulMax = scale(base.multiplication?.max || 10, 3, 20);
  const divMax = scale(base.division?.max || 50, 10, 999);
  const maxDivisor = base.division?.maxDivisor || 12;

  let maxDen = base.fractions?.maxDen || 4;
  if (!gradeCfg.allowFractions) {
    maxDen = 0;
  } else if (gradeKey === "g3_4") {
    maxDen = Math.min(maxDen, 8);
  } else if (gradeKey === "g5_6") {
    maxDen = Math.min(Math.max(maxDen, 8), 12);
  }

  return {
    name: base.name,
    addition: { max: additionMax },
    subtraction: { min: subMin, max: subMax },
    multiplication: { max: mulMax },
    division: { max: divMax, maxDivisor },
    fractions: { maxDen },
    allowNegatives,
    allowTwoStep,
    allowFractions: gradeCfg.allowFractions,
  };
}

const MODES = {
  learning: {
    name: "למידה",
    description: "ללא סיום משחק, תרגול בקצב שלך",
  },
  challenge: {
    name: "אתגר",
    description: "טיימר + חיים, מרוץ ניקוד גבוה",
  },
  speed: {
    name: "מרוץ מהירות",
    description: "תשובות מהירות = יותר נקודות! ⚡",
  },
  marathon: {
    name: "מרתון",
    description: "כמה שאלות תוכל לפתור? 🏃",
  },
  practice: {
    name: "תרגול",
    description: "התמקד בפעולה אחת 📚",
  },
};

const STORAGE_KEY = "mleo_math_master";

// Build top 10 scores by score (highest first)
function buildTop10ByScore(saved, level) {
  const allScores = [];

  OPERATIONS.forEach((op) => {
    const key = `${level}_${op}`;
    const levelData = saved[key] || [];

    if (Array.isArray(levelData)) {
      // New format – array
      levelData.forEach((entry) => {
        const bestScore = entry.bestScore ?? entry.score ?? 0;
        const bestStreak = entry.bestStreak ?? entry.streak ?? 0;

        if (bestScore > 0) {
          allScores.push({
            name: entry.playerName || entry.name || "Player",
            bestScore,
            bestStreak,
            operation: op,
            timestamp: entry.timestamp || 0,
          });
        }
      });
    } else {
      // Old format – object { [name]: {bestScore, bestStreak...} }
      Object.entries(levelData).forEach(([name, data]) => {
        const bestScore = data.bestScore ?? data.score ?? 0;
        const bestStreak = data.bestStreak ?? data.streak ?? 0;

        if (bestScore > 0) {
          allScores.push({
            name,
            bestScore,
            bestStreak,
            operation: op,
            timestamp: data.timestamp || 0,
          });
        }
      });
    }
  });

  // Sort: first by score, then by streak, then by timestamp (newer first)
  const sorted = allScores
    .sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
      return (b.timestamp || 0) - (a.timestamp || 0);
    })
    .slice(0, 10);

  // If there are fewer than 10 records, fill with placeholders
  while (sorted.length < 10) {
    sorted.push({
      name: "-",
      bestScore: 0,
      bestStreak: 0,
      operation: "",
      timestamp: 0,
      placeholder: true,
    });
  }

  return sorted;
}

// Save score entry - handles conversion from old format (object) to new format (array)
function saveScoreEntry(saved, key, entry) {
  let levelData = saved[key];

  if (!levelData) {
    // Nothing exists – start with new array
    levelData = [];
  } else if (!Array.isArray(levelData)) {
    // Old format: convert to array of entries
    levelData = Object.entries(levelData).map(([name, data]) => ({
      playerName: name,
      bestScore: data.bestScore ?? data.score ?? 0,
      bestStreak: data.bestStreak ?? data.streak ?? 0,
      timestamp: data.timestamp || 0,
    }));
  }

  levelData.push(entry);

  // Limit to 100 entries
  if (levelData.length > 100) {
    levelData = levelData.slice(-100);
  }

  saved[key] = levelData;
}

function generateQuestion(levelConfig, operation, gradeKey, mixedOps = null) {
  const gradeCfg = GRADES[gradeKey] || GRADES.g3_4;

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

    // שילוב השלמה ל-10/100 בתוך חיבור (מתאים לסעיף 10)
    if (gradeKey === "g1_2" && Math.random() < 0.3) {
      const b = randInt(1, 9);
      const c = 10;
      const a = c - b;
      correctAnswer = a;
      const exerciseText = `${BLANK} + ${b} = ${c}`;
      question = exerciseText;
      params = { kind: "add_complement10", a, b, c, exerciseText, op: "add", grade: gradeKey };
      operandA = a;
      operandB = b;
    } else if (gradeKey === "g3_4" && Math.random() < 0.2) {
      const base = randInt(10, 90);
      const tens = Math.round(base / 10) * 10;
      const diff = tens - base;
      correctAnswer = diff;
      const exerciseText = `${base} + ${BLANK} = ${tens}`;
      question = exerciseText;
      params = { kind: "add_complement_round10", base, tens, diff, exerciseText };
    } else if (allowTwoStep && Math.random() < 0.3) {
      const a = randInt(1, maxA);
      const b = randInt(1, maxA);
      const c = randInt(1, maxA);
      correctAnswer = round(a + b + c);
      const exerciseText = `${a} + ${b} + ${c} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "add_three", a, b, c, exerciseText, op: "add", grade: gradeKey };
      operandA = a;
      operandB = b;
    } else {
      const a = randInt(1, maxA);
      const b = randInt(1, maxA);
      correctAnswer = round(a + b);
      const exerciseText = `${a} + ${b} = ${BLANK}`;
      question = exerciseText;
      params = { kind: "add_two", a, b, exerciseText, op: "add", grade: gradeKey };
      operandA = a;
      operandB = b;
    }
  } else if (selectedOp === "subtraction") {
    const maxS = levelConfig.subtraction.max || 20;
    const minS = levelConfig.subtraction.min ?? 0;

    let a;
    let b;
    if (allowNegatives) {
      a = randInt(minS, maxS);
      b = randInt(minS, maxS);
    } else {
      b = randInt(minS, maxS);
      a = randInt(b, maxS);
    }
    correctAnswer = round(a - b);
    const exerciseText = `${a} - ${b} = ${BLANK}`;
    question = exerciseText;
    params = { kind: "sub_two", a, b, exerciseText };
    operandA = a;
    operandB = b;
  } else if (selectedOp === "multiplication") {
    const maxM = levelConfig.multiplication.max || 10;
    const a = randInt(1, maxM);
    const b = randInt(1, Math.min(maxM, 12));
    correctAnswer = round(a * b);
    const exerciseText = `${a} × ${b} = ${BLANK}`;
    question = exerciseText;
    params = { kind: "mul", a, b, exerciseText };
    operandA = a;
    operandB = b;
  } else if (selectedOp === "division") {
    const maxD = levelConfig.division.max || 100;
    const maxDivisor = levelConfig.division.maxDivisor || 12;
    const divisor = randInt(2, maxDivisor);
    const quotient = randInt(2, Math.max(2, Math.floor(maxD / divisor)));
    const dividend = divisor * quotient;
    correctAnswer = round(quotient);
    const exerciseText = `${dividend} ÷ ${divisor} = ${BLANK}`;
    question = exerciseText;
    params = { kind: "div", dividend, divisor, exerciseText };
    operandA = dividend;
    operandB = divisor;
  } else if (selectedOp === "fractions" && levelConfig.allowFractions) {
    const densSmall = [2, 4, 5, 10];
    const densBig = [2, 3, 4, 5, 6, 8, 10, 12];
    const dens =
      gradeKey === "g3_4"
        ? densSmall.filter((d) => d <= levelConfig.fractions.maxDen)
        : densBig.filter((d) => d <= levelConfig.fractions.maxDen);

    const opKind = Math.random() < 0.5 ? "add_frac" : "sub_frac";

    if (gradeKey === "g3_4") {
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
    const base = randInt(40, 400);
    const percOptions = [10, 20, 25, 50];
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
    const start = randInt(1, 20);
    let step;
    if (gradeKey === "g1_2") {
      step = randInt(1, 3);
    } else if (gradeKey === "g3_4") {
      step = randInt(1, 9);
    } else {
      step = randInt(-9, 9) || 2;
    }

    const posOfBlank = randInt(0, 4); // אחד מחמשת המספרים
    const seq = [];
    for (let i = 0; i < 5; i++) {
      seq.push(start + i * step);
    }
    correctAnswer = seq[posOfBlank];
    const display = seq
      .map((v, idx) => (idx === posOfBlank ? BLANK : v))
      .join(", ");
    question = `השלים את הסדרה: ${display}`;
    params = { kind: "sequence", start, step, seq, posOfBlank };
  // ===== עשרוניים =====
  } else if (selectedOp === "decimals") {
    const places = gradeKey === "g3_4" ? 1 : 2;
    const maxBase = gradeKey === "g3_4" ? 50 : 200;
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
    const toWhat = Math.random() < 0.5 ? 10 : 100;
    const maxN = toWhat === 10 ? 999 : 9999;
    const n = randInt(1, maxN);
    correctAnswer =
      toWhat === 10 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100;
    question =
      toWhat === 10
        ? `עגל את ${n} לעשרות הקרובות = ${BLANK}`
        : `עגל את ${n} למאות הקרובות = ${BLANK}`;
    params = { kind: "round", n, toWhat };
  } else if (selectedOp === "equations") {
    const canUseMulDiv = gradeKey === "g5_6";
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
    const isLowGrade = gradeKey === "g1_2";
    const maxVal = levelConfig.addition.max || 500;
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
      gradeKey === "g1_2"
        ? ["neighbors", "place_tens_units", "even_odd", "complement10"]
        : gradeKey === "g3_4"
        ? ["neighbors", "place_hundreds", "complement10", "complement100"]
        : ["neighbors", "place_hundreds", "complement100"];
    const t = types[Math.floor(Math.random() * types.length)];

    if (t === "neighbors") {
      const n = randInt(1, 999);
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
      const n = randInt(0, 200);
      const isEven = n % 2 === 0;
      correctAnswer = isEven ? "זוגי" : "אי-זוגי";
      question = `האם המספר ${n} הוא זוגי או אי-זוגי?`;
      params = { kind: "ns_even_odd", n, isEven };
      const answers = ["זוגי", "אי-זוגי"];
      if (!isEven) answers.reverse();

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

    if (t === "factor") {
      const n = randInt(12, 60);
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
      const base = randInt(3, 12);
      const correct = base * randInt(2, 10);
      const options = new Set([correct]);
      while (options.size < 4) {
        const candidate = randInt(base + 1, base * 15);
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

  // ===== תרגילי מילים (כולל זמן, כסף, מידות) =====
  } else if (selectedOp === "word_problems") {
    const templates =
      gradeKey === "g5_6"
        ? [
            "multi_step",
            "groups",
            "leftover",
            "shop_discount",
            "unit_convert",
            "distance_time",
          ]
        : ["groups", "simple_add"];
    const t = templates[Math.floor(Math.random() * templates.length)];

    if (t === "simple_add") {
      const a = randInt(3, 9);
      const b = randInt(2, 8);
      correctAnswer = a + b;
      question = `לליאו יש ${a} כדורים והוא מקבל עוד ${b} כדורים. כמה כדורים יש לליאו בסך הכל?`;
      params = { kind: "wp_simple_add", a, b };
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
    } else {
      // distance_time
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

    while (wrongAnswers.size < 3) {
      const deltaBase = Math.max(0.1, Math.abs(correctNum) * 0.1);
      const sign = Math.random() < 0.5 ? 1 : -1;
      const step = Math.random() < 0.5 ? 0.1 : 0.2;
      const wrongNum = correctNum + sign * deltaBase * step;
      const wrong = fmt(wrongNum);
      if (wrong !== correctAnswer && !wrongAnswers.has(wrong)) {
        wrongAnswers.add(wrong);
      }
    }
  } else if (correctIsFraction) {
    const [cnRaw, cdRaw] = String(correctAnswer).split("/");
    const cn = Number(cnRaw);
    const cd = Number(cdRaw) || 1;

    while (wrongAnswers.size < 3) {
      const delta = randInt(1, 3);
      const sign = Math.random() > 0.5 ? 1 : -1;
      const nWrong = cn + sign * delta;
      const wrong = `${nWrong}/${cd}`;
      if (wrong !== correctAnswer && !wrongAnswers.has(wrong) && nWrong > 0) {
        wrongAnswers.add(wrong);
      }
    }
  } else if (isNumericAnswer) {
    while (wrongAnswers.size < 3) {
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
  } else {
    // תשובות לא מספריות (כמו סימני השוואה) כבר טופלו ב-return מוקדם
  }

  const allAnswers = [correctAnswer, ...Array.from(wrongAnswers)];
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


function getHint(question, operation, gradeKey) {
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
      return "השתמש בשיטת \"עמודות\" או בקפיצות על ציר המספרים: חיבור = הוספה.";
    case "subtraction":
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
function getAdditionStepsColumn(a, b) {
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
function getSolutionSteps(question, operation, gradeKey) {
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
          toSpan(`1. נחשב כמה פריטים קונים בסך הכל: ${p.qty1 + p.qty2}.`, "1"),
          toSpan(
            `2. נמצא את עלות הקנייה: ${ltr(`${p.price} × (${p.qty1} + ${p.qty2}) = ${p.totalCost}`)}.`,
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
function getErrorExplanation(question, operation, wrongAnswer, gradeKey) {
  if (!question) return "";
  const userAnsNum = Number(wrongAnswer);
  const correctNum =
    typeof question.correctAnswer === "string" && question.correctAnswer.includes("/")
      ? Number(
          question.correctAnswer.split("/")[0] /
            (question.correctAnswer.split("/")[1] || 1)
        )
      : Number(question.correctAnswer);

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
      return "באחוזים טעות נפוצה היא להתבלבל בין חלק מתוך 100 לבין חיבור/חיסור רגיל. נסה לכתוב קודם את השבר (למשל 25% = 1/4).";
    case "sequences":
      return "בסדרות רבים מפספסים את ההפרש הקבוע. בדוק שוב מה קורה בין שני איברים סמוכים.";
    case "decimals":
      return "בעשרוניים באגים קורים כשלא מיישרים את הנקודות או שוכחים את מספר הספרות אחרי הנקודה.";
    case "rounding":
      return "בעיגול קל להתבלבל בספרה שאחריה. בדוק אם היא 0–4 (למטה) או 5–9 (למעלה).";
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


export default function MathMaster() {
  useIOSViewportFix();
  const router = useRouter();
  const wrapRef = useRef(null);
  const headerRef = useRef(null);
  const gameRef = useRef(null);
  const controlsRef = useRef(null);
  const operationSelectRef = useRef(null);

  const [mounted, setMounted] = useState(false);

  // NEW: grade & mode
  const [grade, setGrade] = useState("g3_4");
  const [mode, setMode] = useState("learning");

  const [level, setLevel] = useState("easy");
  const [operation, setOperation] = useState("addition"); // לא mixed כברירת מחדל כדי שה-modal לא יפתח אוטומטית
  const [gameActive, setGameActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [bestScore, setBestScore] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // NEW: lives (for Challenge mode)
  const [lives, setLives] = useState(3);

  // Progress stats (אפשר להרחיב בעתיד)
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  // מניעת שאלות חוזרות
  const [recentQuestions, setRecentQuestions] = useState(new Set());

  // מערכת כוכבים ותגים
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showBadge, setShowBadge] = useState(null);

  // מערכת רמות עם XP
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // מערכת התקדמות אישית
  const [progress, setProgress] = useState({
    addition: { total: 0, correct: 0 },
    subtraction: { total: 0, correct: 0 },
    multiplication: { total: 0, correct: 0 },
    division: { total: 0, correct: 0 },
    fractions: { total: 0, correct: 0 },
    percentages: { total: 0, correct: 0 },
    sequences: { total: 0, correct: 0 },
    decimals: { total: 0, correct: 0 },
    rounding: { total: 0, correct: 0 },
    equations: { total: 0, correct: 0 },
    compare: { total: 0, correct: 0 },
    number_sense: { total: 0, correct: 0 },
    factors_multiples: { total: 0, correct: 0 },
    word_problems: { total: 0, correct: 0 },
  });

  // תחרויות יומיות
  const [dailyChallenge, setDailyChallenge] = useState({
    date: new Date().toDateString(),
    bestScore: 0,
    questions: 0,
  });

  // רמזים
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  // הסבר מפורט לשאלה
  const [showSolution, setShowSolution] = useState(false);

  // הסבר לטעות אחרונה
  const [errorExplanation, setErrorExplanation] = useState("");

  // תרגול ממוקד (רק במצב Practice)
  const [practiceFocus, setPracticeFocus] = useState("default"); // default | add_to_20 | times_6_8

  // מצב story questions
  const [useStoryQuestions, setUseStoryQuestions] = useState(false);
  const [storyOnly, setStoryOnly] = useState(false); // שאלות מילוליות בלבד

  // בחירת פעולות למיקס
  const [showMixedSelector, setShowMixedSelector] = useState(false);
  const [mixedOperations, setMixedOperations] = useState({
    addition: true,
    subtraction: true,
    multiplication: false,
    division: false,
    fractions: false,
    percentages: false,
    sequences: false,
    decimals: false,
    rounding: false,
    equations: false,
    compare: false,
    number_sense: false,
    factors_multiples: false,
    word_problems: false,
  });

  const [showMultiplicationTable, setShowMultiplicationTable] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardLevel, setLeaderboardLevel] = useState("easy");
  const [leaderboardData, setLeaderboardData] = useState([]);
  useEffect(() => {
    if (!GRADES[grade].operations.includes("word_problems")) {
      setUseStoryQuestions(false);
      setStoryOnly(false);
    }
  }, [grade]);
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("mleo_player_name") || "";
      } catch {
        return "";
      }
    }
    return "";
  });
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedCol, setSelectedCol] = useState(null);
  const [highlightedAnswer, setHighlightedAnswer] = useState(null);
  const [tableMode, setTableMode] = useState("multiplication"); // "multiplication" or "division"
  const [selectedResult, setSelectedResult] = useState(null); // For division mode
  const [selectedDivisor, setSelectedDivisor] = useState(null); // For division mode
  const [selectedCell, setSelectedCell] = useState(null); // {row, col, value}

  useEffect(() => {
    setMounted(true);

    // Load best scores for current player
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const key = `${level}_${operation}`;

        if (saved[key] && playerName.trim()) {
          if (Array.isArray(saved[key])) {
            const playerScores = saved[key].filter(
              (s) => s.playerName === playerName.trim()
            );
            if (playerScores.length > 0) {
              const maxScore = Math.max(
                ...playerScores.map((s) => s.bestScore || 0),
                0
              );
              const maxStreak = Math.max(
                ...playerScores.map((s) => s.bestStreak || 0),
                0
              );
              setBestScore(maxScore);
              setBestStreak(maxStreak);
            } else {
              setBestScore(0);
              setBestStreak(0);
            }
          } else {
            if (saved[key][playerName.trim()]) {
              setBestScore(saved[key][playerName.trim()].bestScore || 0);
              setBestStreak(saved[key][playerName.trim()].bestStreak || 0);
            } else {
              setBestScore(0);
              setBestStreak(0);
            }
          }
        } else {
          setBestScore(0);
          setBestStreak(0);
        }
      } catch {}
    }
  }, [level, operation, playerName]);

  // לוודא שהפעולה שתבחר קיימת לכיתה שנבחרה
  useEffect(() => {
    // אל תשנה אם ה-modal פתוח
    if (showMixedSelector) return;
    
    const allowed = GRADES[grade].operations;
    if (!allowed.includes(operation)) {
      // מצא את הפעולה הראשונה שזמינה (לא mixed)
      const firstAllowed = allowed.find(op => op !== "mixed") || allowed[0];
      setOperation(firstAllowed);
    }
  }, [grade]); // רק כשהכיתה משתנה, לא כשהפעולה משתנה

  // עדכון mixedOperations לפי הכיתה
  useEffect(() => {
    const availableOps = GRADES[grade].operations.filter(
      (op) => op !== "mixed"
    );
    const newMixedOps = {
      addition: availableOps.includes("addition"),
      subtraction: availableOps.includes("subtraction"),
      multiplication: availableOps.includes("multiplication"),
      division: availableOps.includes("division"),
      fractions: availableOps.includes("fractions"),
      percentages: availableOps.includes("percentages"),
      sequences: availableOps.includes("sequences"),
      decimals: availableOps.includes("decimals"),
      rounding: availableOps.includes("rounding"),
      equations: availableOps.includes("equations"),
      compare: availableOps.includes("compare"),
      number_sense: availableOps.includes("number_sense"),
      factors_multiples: availableOps.includes("factors_multiples"),
      word_problems: availableOps.includes("word_problems"),
    };
    setMixedOperations(newMixedOps);
  }, [grade]);

  // לא צריך useEffect - ה-modal נפתח ישירות ב-onChange

  // בדיקה אם זה יום חדש לתחרות יומית
  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyChallenge.date !== today) {
      setDailyChallenge({ date: today, bestScore: 0, questions: 0 });
    }
  }, [dailyChallenge.date]);

  // לא צריך event listener - ה-modal נפתח רק ב-onChange או דרך כפתור ⚙️

  // טעינת נתונים מ-localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
      if (saved.stars) setStars(saved.stars);
      if (saved.badges) setBadges(saved.badges);
      if (saved.playerLevel) setPlayerLevel(saved.playerLevel);
      if (saved.xp) setXp(saved.xp);
      if (saved.progress) setProgress(saved.progress);
    } catch {}
  }, []);

  // Load leaderboard data when modal opens or level changes
  useEffect(() => {
    if (showLeaderboard && typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const topScores = buildTop10ByScore(saved, leaderboardLevel);
        setLeaderboardData(topScores);
      } catch (e) {
        console.error("Error loading leaderboard:", e);
        setLeaderboardData([]);
      }
    }
  }, [showLeaderboard, leaderboardLevel]);

  // Dynamic layout calculation - stable, no state dependencies
  useEffect(() => {
    if (!wrapRef.current || !mounted) return;
    const calc = () => {
      const rootH = window.visualViewport?.height ?? window.innerHeight;
      const headH = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty("--head-h", headH + "px");

      const controlsH = controlsRef.current?.offsetHeight || 40;
      // Use more conservative calculation to ensure content doesn't get cut
      const used =
        headH +
        controlsH +
        120 + // Title, score, timer, spacing
        40; // Safe bottom padding (includes safe area)
      const freeH = Math.max(300, rootH - used);
      document.documentElement.style.setProperty("--game-h", freeH + "px");
    };
    const timer = setTimeout(calc, 100);
    window.addEventListener("resize", calc);
    window.visualViewport?.addEventListener("resize", calc);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calc);
      window.visualViewport?.removeEventListener("resize", calc);
    };
  }, [mounted]);

  // Timer countdown (רק במצב Challenge או Speed)
  useEffect(() => {
    if (!gameActive || (mode !== "challenge" && mode !== "speed")) return;
    if (timeLeft == null) return;

    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => (prev != null ? prev - 1 : prev));
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameActive, mode, timeLeft]);

  // שמירת ריצה נוכחית ל־localStorage + עדכון Best & Leaderboard
  function saveRunToStorage() {
    if (typeof window === "undefined" || !playerName.trim()) return;

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const key = `${level}_${operation}`;

      saveScoreEntry(saved, key, {
        playerName: playerName.trim(),
        bestScore: score,
        bestStreak: streak,
        timestamp: Date.now(),
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const playerScores = (saved[key] || []).filter(
        (s) => s.playerName === playerName.trim()
      );
      const maxScore = Math.max(
        ...playerScores.map((s) => s.bestScore || 0),
        0
      );
      const maxStreak = Math.max(
        ...playerScores.map((s) => s.bestStreak || 0),
        0
      );
      setBestScore(maxScore);
      setBestStreak(maxStreak);

      if (showLeaderboard) {
        const topScores = buildTop10ByScore(saved, leaderboardLevel);
        setLeaderboardData(topScores);
      }
    } catch {}
  }

  function hardResetGame() {
    setGameActive(false);
    setCurrentQuestion(null);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTimeLeft(20);
    setSelectedAnswer(null);
    setFeedback(null);
    setLives(3);
    setTotalQuestions(0);
    setAvgTime(0);
    setQuestionStartTime(null);
  }

  function generateNewQuestion() {
    const levelConfig = getLevelForGrade(level, grade);
    let question;
    let attempts = 0;
    const maxAttempts = 50; // מקסימום ניסיונות למצוא שאלה חדשה

    const supportsWordProblems = GRADES[grade].operations.includes("word_problems");

    // ✅ התאמה לפי מצב תרגול ממוקד (Practice)
    let operationForState = operation;

    if (mode === "practice") {
      if (practiceFocus === "add_to_20") {
        // תרגול חיבור עד 20 – מתאים בעיקר לקטנים
        operationForState = "addition";
        if (levelConfig.addition) {
          levelConfig.addition.max = Math.min(levelConfig.addition.max || 20, 20);
        }
      } else if (practiceFocus === "times_6_8") {
        // תרגול טבלת כפל 6–8
        operationForState = "multiplication";
        if (levelConfig.multiplication) {
          // מבטיחים שהטווח יכלול לפחות 8
          levelConfig.multiplication.max = Math.max(levelConfig.multiplication.max || 8, 8);
        }
      }
    }

    do {
      let opForQuestion = operationForState;
      if (supportsWordProblems) {
        if (storyOnly) {
          opForQuestion = "word_problems";
        } else if (useStoryQuestions && operation !== "word_problems") {
          opForQuestion =
            Math.random() < 0.5 ? "word_problems" : operation;
        }
      }

      question = generateQuestion(
        levelConfig,
        opForQuestion,
        grade,
        opForQuestion === "mixed" ? mixedOperations : null
      );
      attempts++;

      // יצירת מפתח ייחודי לשאלה
      const questionKey = question.question;

      // אם השאלה לא הייתה לאחרונה, נשתמש בה
      if (!recentQuestions.has(questionKey)) {
        // שמירת השאלה החדשה בהיסטוריה
        setRecentQuestions((prev) => {
          const newSet = new Set(prev);
          newSet.add(questionKey);
          // שמירה רק על 20 שאלות אחרונות
          if (newSet.size > 20) {
            const first = Array.from(newSet)[0];
            newSet.delete(first);
          }
          return newSet;
        });
        break;
      }
    } while (attempts < maxAttempts);

    // אם לא מצאנו שאלה חדשה אחרי 50 ניסיונות, נשתמש בכל מקרה
    if (attempts >= maxAttempts) {
      // איפוס ההיסטוריה כדי לאפשר שאלות חוזרות
      setRecentQuestions(new Set());
    }

    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setFeedback(null);
    setQuestionStartTime(Date.now());
    setShowHint(false);
    setHintUsed(false);
    setShowSolution(false);
    setErrorExplanation("");
  }

  function startGame() {
    setRecentQuestions(new Set()); // איפוס ההיסטוריה
    setGameActive(true);
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setTotalQuestions(0);
    setAvgTime(0);
    setQuestionStartTime(null);
    setFeedback(null);
    setSelectedAnswer(null);
    setLives(mode === "challenge" ? 3 : 0);
    setShowHint(false);
    setHintUsed(false);
    setShowBadge(null);
    setShowLevelUp(false);
    setShowSolution(false);
    setErrorExplanation("");

    // הגדרת טיימר לפי מצב
    if (mode === "challenge") {
      setTimeLeft(20);
    } else if (mode === "speed") {
      setTimeLeft(10); // טיימר קצר יותר למצב מהירות
    } else {
      setTimeLeft(null);
    }

    generateNewQuestion();
  }

  function stopGame() {
    setGameActive(false);
    setCurrentQuestion(null);
    setFeedback(null);
    setSelectedAnswer(null);
    saveRunToStorage();
  }

  function handleTimeUp() {
    // Time up – במצב Challenge או Speed
    setWrong((prev) => prev + 1);
    setStreak(0);
      setFeedback("הזמן נגמר! המשחק נגמר! ⏰");
    setGameActive(false);
    setCurrentQuestion(null);
    setTimeLeft(0);
    saveRunToStorage();

    setTimeout(() => {
      hardResetGame();
    }, 2000);
  }

  function handleAnswer(answer) {
    if (selectedAnswer || !gameActive || !currentQuestion) return;

    // סטטיסטיקה – ספירת שאלה וזמן
    setTotalQuestions((prevCount) => {
      const newCount = prevCount + 1;
      if (questionStartTime) {
        const elapsed = (Date.now() - questionStartTime) / 1000;
        setAvgTime((prevAvg) =>
          prevCount === 0 ? elapsed : (prevAvg * prevCount + elapsed) / newCount
        );
      }
      return newCount;
    });

    setSelectedAnswer(answer);
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      // חישוב נקודות לפי מצב
      let points = 10 + streak;
      if (mode === "speed") {
        const timeBonus = timeLeft ? Math.floor(timeLeft * 2) : 0;
        points += timeBonus; // בונוס זמן במצב מהירות
      }
      
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      setCorrect((prev) => prev + 1);
      
      setErrorExplanation("");

      // עדכון התקדמות אישית
      const op = currentQuestion.operation;
      setProgress((prev) => ({
        ...prev,
        [op]: {
          total: (prev[op]?.total || 0) + 1,
          correct: (prev[op]?.correct || 0) + 1,
        },
      }));

      // מערכת כוכבים - כוכב כל 5 תשובות נכונות
      const newCorrect = correct + 1;
      if (newCorrect % 5 === 0) {
        setStars((prev) => {
          const newStars = prev + 1;
          // שמירה ל-localStorage
          if (typeof window !== "undefined") {
            try {
              const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
              saved.stars = newStars;
              localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
            } catch {}
          }
          return newStars;
        });
      }

      // מערכת תגים
      const newStreak = streak + 1;
      if (newStreak === 10 && !badges.includes("🔥 Hot Streak")) {
        const newBadge = "🔥 Hot Streak";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.badges = [...badges, newBadge];
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
      } else if (newStreak === 25 && !badges.includes("⚡ Lightning Fast")) {
        const newBadge = "⚡ Lightning Fast";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.badges = [...badges, newBadge];
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
      } else if (newStreak === 50 && !badges.includes("🌟 Master")) {
        const newBadge = "🌟 Master";
        setBadges((prev) => [...prev, newBadge]);
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.badges = [...badges, newBadge];
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
      }

      // מערכת XP ורמות
      const xpGain = hintUsed ? 5 : 10; // פחות XP אם השתמש ברמז
      setXp((prev) => {
        const newXp = prev + xpGain;
        const xpNeeded = playerLevel * 100;
        
        if (newXp >= xpNeeded) {
          setPlayerLevel((prevLevel) => {
            const newLevel = prevLevel + 1;
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 3000);
            if (typeof window !== "undefined") {
              try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
                saved.playerLevel = newLevel;
                saved.xp = newXp - xpNeeded;
                localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
              } catch {}
            }
            return newLevel;
          });
          return newXp - xpNeeded;
        }
        
        if (typeof window !== "undefined") {
          try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY + "_progress") || "{}");
            saved.xp = newXp;
            localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(saved));
          } catch {}
        }
        return newXp;
      });

      // עדכון תחרות יומית
      setDailyChallenge((prev) => ({
        ...prev,
        bestScore: Math.max(prev.bestScore, score + points),
        questions: prev.questions + 1,
      }));

      setFeedback("Correct! 🎉");
      if ("vibrate" in navigator) navigator.vibrate?.(50);

      setTimeout(() => {
        generateNewQuestion();
        if (mode === "challenge") {
          setTimeLeft(20);
        } else if (mode === "speed") {
          setTimeLeft(10);
        } else {
          setTimeLeft(null);
        }
      }, 1000);
    } else {
      setWrong((prev) => prev + 1);
      setStreak(0);
      
      setErrorExplanation(
        getErrorExplanation(
          currentQuestion,
          currentQuestion.operation,
          answer,
          grade
        )
      );
      
      // עדכון התקדמות אישית
      const op = currentQuestion.operation;
      setProgress((prev) => ({
        ...prev,
        [op]: {
          total: (prev[op]?.total || 0) + 1,
          correct: prev[op]?.correct || 0,
        },
      }));
      
      if ("vibrate" in navigator) navigator.vibrate?.(200);

      if (mode === "learning") {
        // במצב למידה – אין Game Over, רק הצגת תשובה והמשך
        setFeedback(
          `Wrong! Correct answer: ${currentQuestion.correctAnswer} ❌`
        );
        setTimeout(() => {
          generateNewQuestion();
          setSelectedAnswer(null);
          setFeedback(null);
          setTimeLeft(null);
        }, 1500);
      } else {
        // מצב Challenge – עובדים עם חיים
        setFeedback(
          `Wrong! Correct: ${currentQuestion.correctAnswer} ❌ (-1 ❤️)`
        );
        setLives((prevLives) => {
          const nextLives = prevLives - 1;

          if (nextLives <= 0) {
            // Game Over
            setFeedback("Game Over! 💔");
            saveRunToStorage();
            setGameActive(false);
            setCurrentQuestion(null);
            setTimeLeft(0);
            setTimeout(() => {
              hardResetGame();
            }, 2000);
          } else {
            setTimeout(() => {
              generateNewQuestion();
              setSelectedAnswer(null);
              setFeedback(null);
              setTimeLeft(20);
            }, 1500);
          }

          return nextLives;
        });
      }
    }
  }

  function resetStats() {
    setScore(0);
    setStreak(0);
    setCorrect(0);
    setWrong(0);
    setBestScore(0);
    setBestStreak(0);
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const key = `${level}_${operation}`;
        delete saved[key];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch {}
    }
  }

  const backSafe = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/learning");
    }
  };

  const getOperationName = (op) => {
    switch (op) {
      case "addition":
        return "חיבור";
      case "subtraction":
        return "חיסור";
      case "multiplication":
        return "כפל";
      case "division":
        return "חילוק";
      case "fractions":
        return "שברים";
      case "percentages":
        return "אחוזים";
      case "sequences":
        return "סדרות";
      case "decimals":
        return "עשרוניים";
      case "rounding":
        return "עיגול";
      case "equations":
        return "משוואות";
      case "compare":
        return "השוואה";
      case "number_sense":
        return "חוש מספרים";
      case "factors_multiples":
        return "גורמים וכפולות";
      case "word_problems":
        return "בעיות מילוליות";
      case "mixed":
        return "ערבוב";
      default:
        return op;
    }
  };

  if (!mounted)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const gradeSupportsWordProblems = GRADES[grade].operations.includes("word_problems");

  // ✅ טקסט רמז והסבר מלא לשאלה הנוכחית
  const hintText =
    currentQuestion && currentQuestion.operation
      ? getHint(currentQuestion, currentQuestion.operation, grade)
      : "";

  const solutionSteps =
    currentQuestion && currentQuestion.operation
      ? getSolutionSteps(currentQuestion, currentQuestion.params?.op || currentQuestion.operation, grade)
      : [];

  return (
    <Layout>
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden bg-gradient-to-b from-[#0a0f1d] to-[#141928] game-page-mobile"
        style={{ height: "100vh", height: "100dvh" }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
        </div>

        <div
          ref={headerRef}
          className="absolute top-0 left-0 right-0 z-50 pointer-events-none"
        >
          <div
            className="relative px-2 py-3"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
          >
            <div className="absolute left-2 top-2 flex gap-2 pointer-events-auto">
              <button
                onClick={backSafe}
                className="min-w-[60px] px-3 py-1 rounded-lg text-sm font-bold bg-white/5 border border-white/10 hover:bg-white/10"
              >
                BACK
              </button>
            </div>
            <div className="absolute right-2 top-2 pointer-events-auto">
              <span className="text-xs uppercase tracking-[0.3em] text-white/60">
                Local
              </span>
            </div>
          </div>
        </div>

        <div
          className="relative flex flex-col items-center justify-start px-4 overflow-hidden"
          style={{
            height: "100%",
            maxHeight: "100%",
            paddingTop: "calc(var(--head-h, 56px) + 8px)",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
            overflow: "hidden"
          }}
        >
          <div className="text-center mb-1">
            <h1 className="text-2xl font-extrabold text-white mb-0.5">
              🧮 Math Master
            </h1>
            <p className="text-white/70 text-xs">
              {playerName || "שחקן"} • {GRADES[grade].name} •{" "}
              {LEVELS[level].name} • {getOperationName(operation)} •{" "}
              {MODES[mode].name}
            </p>
          </div>

          <div
            ref={controlsRef}
            className={`grid gap-1 mb-1 w-full max-w-md ${
              stars > 0 || playerLevel > 1
                ? "grid-cols-6"
                : "grid-cols-5"
            }`}
          >
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">ניקוד</div>
              <div className="text-sm font-bold text-emerald-400">{score}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">רצף</div>
              <div className="text-sm font-bold text-amber-400">🔥{streak}</div>
            </div>
            {stars > 0 && (
              <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
                <div className="text-[10px] text-white/60">כוכבים</div>
                <div className="text-sm font-bold text-yellow-400">⭐{stars}</div>
              </div>
            )}
            {playerLevel > 1 && (
              <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
                <div className="text-[10px] text-white/60">רמה</div>
                <div className="text-sm font-bold text-purple-400">Lv.{playerLevel}</div>
              </div>
            )}
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">✅</div>
              <div className="text-sm font-bold text-green-400">{correct}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">חיים</div>
              <div className="text-sm font-bold text-rose-400">
                {mode === "challenge" ? `${lives} ❤️` : "∞"}
              </div>
            </div>
            <div
              className={`rounded-lg p-1 text-center ${
                gameActive && (mode === "challenge" || mode === "speed") && timeLeft <= 5
                  ? "bg-red-500/30 border-2 border-red-400 animate-pulse"
                  : "bg-black/30 border border-white/10"
              }`}
            >
              <div className="text-[10px] text-white/60">⏰ טיימר</div>
              <div
                className={`text-lg font-black ${
                  gameActive && (mode === "challenge" || mode === "speed") && timeLeft <= 5
                    ? "text-red-400"
                    : gameActive && (mode === "challenge" || mode === "speed")
                    ? "text-yellow-400"
                    : "text-white/60"
                }`}
              >
                {gameActive
                  ? mode === "challenge" || mode === "speed"
                    ? timeLeft ?? "--"
                    : "∞"
                  : "--"}
              </div>
            </div>
          </div>

          {/* בחירת מצב (Learning / Challenge) */}
          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
            {Object.keys(MODES).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setGameActive(false);
                  setFeedback(null);
                }}
                className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === m
                    ? "bg-emerald-500/80 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {MODES[m].name}
              </button>
            ))}
          </div>

          {/* הודעות מיוחדות */}
          {showBadge && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-bounce">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-2xl font-bold">תג חדש!</div>
                <div className="text-xl">{showBadge}</div>
              </div>
            </div>
          )}
          
          {showLevelUp && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-pulse">
                <div className="text-4xl mb-2">🌟</div>
                <div className="text-2xl font-bold">עלית רמה!</div>
                <div className="text-xl">עכשיו אתה ברמה {playerLevel}!</div>
              </div>
            </div>
          )}

          {!gameActive ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setPlayerName(newName);
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem("mleo_player_name", newName);
                      } catch {}
                    }
                  }}
                  placeholder="שם שחקן"
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-sm font-bold placeholder:text-white/40 flex-1 min-w-[120px]"
                  maxLength={15}
                />
                <select
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {Object.keys(GRADES).map((g) => (
                    <option key={g} value={g}>
                      {GRADES[g].name}
                    </option>
                  ))}
                </select>
                <select
                  value={level}
                  onChange={(e) => {
                    setLevel(e.target.value);
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {Object.keys(LEVELS).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {LEVELS[lvl].name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <select
                    ref={operationSelectRef}
                    value={operation}
                    onChange={(e) => {
                      const newOp = e.target.value;
                      setGameActive(false);
                      // אם בוחרים mixed, פתח את ה-modal לבחירת פעולות
                      if (newOp === "mixed") {
                        // עדכן את operation
                        setOperation(newOp);
                        // פתח את ה-modal מיד
                        setShowMixedSelector(true);
                      } else {
                        setOperation(newOp);
                        // סגור את ה-modal אם הוא היה פתוח
                        setShowMixedSelector(false);
                      }
                    }}
                    className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold flex-1"
                  >
                    {GRADES[grade].operations.map((op) => (
                      <option key={op} value={op}>
                        {getOperationName(op)}
                      </option>
                    ))}
                  </select>
                  {/* כפתור לפתיחת modal אם operation הוא mixed */}
                  {operation === "mixed" && (
                    <button
                      onClick={() => {
                        setShowMixedSelector(true);
                      }}
                      className="h-9 w-9 rounded-lg bg-blue-500/80 hover:bg-blue-500 border border-white/20 text-white text-xs font-bold flex items-center justify-center"
                      title="ערוך פעולות למיקס"
                    >
                      ⚙️
                    </button>
                  )}
                </div>
              </div>

              {/* בחירת נושא תרגול ממוקד – רק במצב Practice */}
              {mode === "practice" && (
                <select
                  value={practiceFocus}
                  onChange={(e) => setPracticeFocus(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold w-full max-w-md mb-2"
                >
                  <option value="default">📚 כל התרגילים</option>
                  <option value="add_to_20">➕ חיבור עד 20</option>
                  <option value="times_6_8">✖️ טבלת כפל 6–8</option>
                </select>
              )}

              <div className="grid grid-cols-3 gap-2 mb-2 w-full max-w-md">
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">שיא ניקוד</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {bestScore}
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">שיא רצף</div>
                  <div className="text-lg font-bold text-amber-400">
                    {bestStreak}
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">Accuracy</div>
                  <div className="text-lg font-bold text-blue-400">
                    {accuracy}%
                  </div>
                </div>
              </div>
              
              {/* תצוגת כוכבים, רמה ותגים */}
              {(stars > 0 || playerLevel > 1 || badges.length > 0) && (
                <div className="grid grid-cols-3 gap-2 mb-2 w-full max-w-md">
                  {stars > 0 && (
                    <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/60">Stars</div>
                      <div className="text-lg font-bold text-yellow-400">
                        ⭐ {stars}
                      </div>
                    </div>
                  )}
                  {playerLevel > 1 && (
                    <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/60">Level</div>
                      <div className="text-lg font-bold text-purple-400">
                        Lv.{playerLevel} ({xp}/{playerLevel * 100} XP)
                      </div>
                    </div>
                  )}
                  {badges.length > 0 && (
                    <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                      <div className="text-xs text-white/60">Badges</div>
                      <div className="text-sm font-bold text-orange-400">
                        {badges.length} 🏅
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* תחרות יומית */}
              <div className="bg-black/20 border border-white/10 rounded-lg p-2 mb-2 w-full max-w-md text-center">
                <div className="text-xs text-white/60 mb-1">אתגר יומי</div>
                <div className="text-sm text-white">
                  שיא: {dailyChallenge.bestScore} • שאלות: {dailyChallenge.questions}
                </div>
              </div>
              
              {/* אפשרות לשאלות עם סיפור */}
              {/* אפשרות לשאלות עם סיפור */}
              {gradeSupportsWordProblems && (
                <div className="flex items-center justify-center gap-4 mb-2 w-full max-w-md flex-wrap">
                  <label className="flex items-center gap-2 text-white text-xs">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={useStoryQuestions}
                      onChange={(e) => {
                        setUseStoryQuestions(e.target.checked);
                        if (!e.target.checked) {
                          setStoryOnly(false);
                        }
                      }}
                    />
                    <span>📘 לשלב שאלות מילוליות בתוך המשחק</span>
                  </label>
                  <label className="flex items-center gap-2 text-white text-xs">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={storyOnly}
                      disabled={!useStoryQuestions}
                      onChange={(e) => setStoryOnly(e.target.checked)}
                    />
                    <span>📖 רק שאלות מילוליות</span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-10 px-6 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  ▶️ התחל
                </button>
                <button
                  onClick={() => setShowMultiplicationTable(true)}
                  className="h-10 px-4 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                >
                  📊 לוח הכפל
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="h-10 px-4 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-sm"
                >
                  🏆 לוח תוצאות
                </button>
                {bestScore > 0 && (
                  <button
                    onClick={resetStats}
                    className="h-10 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm"
                  >
                    🧹 Reset
                  </button>
                )}
              </div>
              {!playerName.trim() && (
                <p className="text-xs text-white/60 text-center mb-2">
                  הכנס את שמך כדי להתחיל
                </p>
              )}
            </>
          ) : (
            <>
              {feedback && (
                <div
                  className={`mb-2 px-4 py-2 rounded-lg text-sm font-semibold text-center ${
                    feedback.includes("Correct") ||
                    feedback.includes("∞") ||
                    feedback.includes("Start")
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-red-500/20 text-red-200"
                  }`}
                >
                  <div>{feedback}</div>
                  {errorExplanation && (
                    <div className="mt-1 text-xs text-red-100/90 font-normal">
                      {errorExplanation}
                    </div>
                  )}
                </div>
              )}

              {currentQuestion && (
                <div
                  ref={gameRef}
                  className="w-full max-w-md flex flex-col items-center justify-center mb-2 flex-1"
                  style={{ height: "var(--game-h, 400px)", minHeight: "300px" }}
                >
                  {/* ויזואליזציה של מספרים (רק לכיתות נמוכות) */}
                  {grade === "g1_2" && currentQuestion.operation === "addition" && (
                    <div className="mb-2 flex gap-4 items-center">
                      {currentQuestion.a <= 10 && (
                        <div className="flex flex-wrap gap-1 justify-center max-w-[100px]">
                          {Array(Math.min(currentQuestion.a, 10))
                            .fill(0)
                            .map((_, i) => (
                              <span
                                key={i}
                                className="inline-block w-3 h-3 bg-blue-500 rounded-full"
                              />
                            ))}
                        </div>
                      )}
                      <span className="text-white text-2xl">+</span>
                      {currentQuestion.b <= 10 && (
                        <div className="flex flex-wrap gap-1 justify-center max-w-[100px]">
                          {Array(Math.min(currentQuestion.b, 10))
                            .fill(0)
                            .map((_, i) => (
                              <span
                                key={i}
                                className="inline-block w-3 h-3 bg-green-500 rounded-full"
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* הפרדה בין שורת השאלה לשורת התרגיל */}
                  {currentQuestion.questionLabel && currentQuestion.exerciseText ? (
                    <>
                      <p
                        className="text-2xl text-center text-white mb-1"
                        style={{
                          direction: currentQuestion.isStory ? "rtl" : "ltr",
                          unicodeBidi: "plaintext",
                        }}
                      >
                        {currentQuestion.questionLabel}
                      </p>
                      <p
                        className="text-4xl text-center text-white font-bold mb-4 whitespace-nowrap"
                        style={{
                          direction: "ltr",
                          unicodeBidi: "plaintext",
                        }}
                      >
                        {currentQuestion.exerciseText}
                      </p>
                    </>
                  ) : currentQuestion.exerciseText ? (
                    <p
                      className="text-4xl text-center text-white font-bold mb-4 whitespace-nowrap"
                      style={{
                        direction: "ltr",
                        unicodeBidi: "plaintext",
                      }}
                    >
                      {currentQuestion.exerciseText}
                    </p>
                  ) : (
                    <div
                      className="text-4xl font-black text-white mb-4 text-center"
                      style={{
                        direction: currentQuestion.isStory ? "rtl" : "ltr",
                        unicodeBidi: "plaintext",
                      }}
                    >
                      {currentQuestion.question}
                    </div>
                  )}
                  

                  <div className="grid grid-cols-2 gap-3 w-full mb-3">
                    {currentQuestion.answers.map((answer, idx) => {
                      const isSelected = selectedAnswer === answer;
                      const isCorrect = answer === currentQuestion.correctAnswer;
                      const isWrong = isSelected && !isCorrect;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(answer)}
                          disabled={!!selectedAnswer}
                          className={`rounded-xl border-2 px-6 py-6 text-2xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
                            isCorrect && isSelected
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : isWrong
                              ? "bg-red-500/30 border-red-400 text-red-200"
                              : selectedAnswer &&
                                answer === currentQuestion.correctAnswer
                              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                              : "bg-black/30 border-white/15 text-white hover:border-white/40"
                          }`}
                        >
                          {answer}
                        </button>
                      );
                    })}
                  </div>

                  {/* רמז + הסבר + למה טעיתי */}
                  {currentQuestion && (
                    <div className="mt-3 flex flex-col gap-2 w-full">
                      {/* כפתורי רמז/הסבר */}
                      <div className="flex gap-2 justify-center flex-wrap">
                        <button
                          onClick={() => setShowHint((prev) => !prev)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/80 hover:bg-blue-500 text-white"
                        >
                          💡 רמז
                        </button>
                        <button
                          onClick={() => setShowSolution((prev) => !prev)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/80 hover:bg-emerald-500 text-white"
                        >
                          📖 הסבר צעד־אחר־צעד
                        </button>
                      </div>

                      {/* תיבת רמז */}
                      {showHint && hintText && (
                        <div className="w-full max-w-md mx-auto bg-blue-500/10 border border-blue-400/50 rounded-lg p-2 text-right">
                          <div className="text-[11px] text-blue-300 mb-1">רמז</div>
                          <div className="text-xs text-blue-100 leading-relaxed">{hintText}</div>
                        </div>
                      )}

                      {/* חלון הסבר מלא - Modal גדול ומרכזי */}
                      {showSolution && currentQuestion && (
                        <div
                          className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center px-4"
                          onClick={() => setShowSolution(false)}
                        >
                          <div
                            className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl p-4 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3
                                className="text-lg font-bold text-emerald-100"
                                dir="rtl"
                              >
                                {"\u200Fאיך פותרים את התרגיל?"}
                              </h3>
                              <button
                                onClick={() => setShowSolution(false)}
                                className="text-emerald-200 hover:text-white text-xl leading-none px-2"
                              >
                                ✖
                              </button>
                            </div>
                            <div className="mb-2 text-sm text-emerald-50" dir="rtl">
                              {/* מציגים שוב את התרגיל */}
                              <div
                                className="mb-2 font-semibold text-base text-center text-white whitespace-nowrap"
                                style={{
                                  direction: "ltr",
                                  unicodeBidi: "plaintext"
                                }}
                              >
                                {currentQuestion.exerciseText || currentQuestion.question}
                              </div>
                              {/* כאן הצעדים */}
                              <div className="space-y-1 text-sm" style={{ direction: "rtl", unicodeBidi: "plaintext" }}>
                                {solutionSteps.map((step, idx) =>
                                  typeof step === "string" ? (
                                    <div key={idx}>{step}</div>
                                  ) : (
                                    <div key={idx}>{step}</div>
                                  )
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex justify-center">
                              <button
                                onClick={() => setShowSolution(false)}
                                className="px-6 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                                dir="rtl"
                              >
                                {"\u200Fסגור"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* למה טעיתי? – רק אחרי טעות */}
                      {errorExplanation && (
                        <div className="w-full max-w-md mx-auto bg-rose-500/10 border border-rose-400/50 rounded-lg p-2 text-right">
                          <div className="text-[11px] text-rose-300 mb-1">למה הטעות קרתה?</div>
                          <div className="text-xs text-rose-100 leading-relaxed">
                            {errorExplanation}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* כפתור חיבור לטבלת כפל/חילוק – רק במצב למידה */}
                  {mode === "learning" &&
                    (currentQuestion.operation === "multiplication" ||
                      currentQuestion.operation === "division") && (
                      <button
                        onClick={() => {
                          setShowMultiplicationTable(true);
                          setTableMode(
                            currentQuestion.operation === "multiplication"
                              ? "multiplication"
                              : "division"
                          );
                          if (currentQuestion.operation === "multiplication") {
                            const a = currentQuestion.a;
                            const b = currentQuestion.b;
                            if (a >= 1 && a <= 12 && b >= 1 && b <= 12) {
                              const value = a * b;
                              setSelectedCell({ row: a, col: b, value });
                              setSelectedRow(null);
                              setSelectedCol(null);
                              setSelectedResult(null);
                              setSelectedDivisor(null);
                            }
                          } else {
                            const { a, b } = currentQuestion;
                            const value = a;
                            if (b >= 1 && b <= 12) {
                              setSelectedCell({ row: 1, col: b, value });
                              setSelectedResult(value);
                              setSelectedDivisor(b);
                              setSelectedRow(null);
                              setSelectedCol(null);
                            }
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-sm font-bold"
                      >
                        📊 הצג בטבלה
                      </button>
                    )}
                </div>
              )}

              <button
                onClick={stopGame}
                className="h-9 px-4 rounded-lg bg-red-500/80 hover:bg-red-500 font-bold text-sm"
              >
                ⏹️ עצור
              </button>
            </>
          )}

          {/* Multiplication Table Modal */}
          {showMultiplicationTable && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => {
                  setShowMultiplicationTable(false);
                  setSelectedRow(null);
                  setSelectedCol(null);
                  setHighlightedAnswer(null);
                  setTableMode("multiplication");
                  setSelectedResult(null);
                  setSelectedDivisor(null);
                  setSelectedCell(null);
                }}
              />
              <div className="relative w-full max-w-md max-h-[80svh] overflow-y-auto bg-gradient-to-b from-[#0a0f1d] to-[#141928] rounded-2xl border-2 border-white/20 shadow-2xl">
                <div className="sticky top-0 bg-gradient-to-b from-[#0a0f1d] to-[#141928] border-b border-white/10 px-4 py-3 flex items-center justify-between z-10">
                  <h2 className="text-xl font-bold text-white">
                    📊 לוח הכפל
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                      }}
                      className="px-2 py-1 rounded text-xs font-bold bg-white/10 hover:bg-white/20 text-white"
                    >
                      איפוס
                    </button>
                    <button
                      onClick={() => {
                        setShowMultiplicationTable(false);
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setTableMode("multiplication");
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                      }}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {/* Mode toggle */}
                  <div className="mb-4 flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        setTableMode("multiplication");
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                      }}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        tableMode === "multiplication"
                          ? "bg-blue-500/80 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      × כפל
                    </button>
                    <button
                      onClick={() => {
                        setTableMode("division");
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                      }}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        tableMode === "division"
                          ? "bg-purple-500/80 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      ÷ חילוק
                    </button>
                  </div>

                  {/* Result window */}
                  <div className="mb-3 min-h-[30px] w-full flex items-center justify-center">
                    {tableMode === "division" &&
                      selectedCell &&
                      (selectedRow || selectedCol) &&
                      selectedResult &&
                      selectedDivisor &&
                      selectedResult % selectedDivisor !== 0 && (
                        <div className="w-full px-4 py-1 rounded-lg bg-red-500/20 border border-red-400/50 text-center flex items-center justify-center gap-2">
                          <span className="text-sm text-red-200 font-semibold">
                            ⚠️ שגיאה: {selectedResult} ÷ {selectedDivisor} הוא
                            לא מספר שלם!
                          </span>
                          <span className="text-xs text-red-300">
                            (
                            {Math.floor(selectedResult / selectedDivisor)}{" "}
                            שארית {selectedResult % selectedDivisor})
                          </span>
                        </div>
                      )}

                    {tableMode === "multiplication" &&
                      selectedCell &&
                      (selectedRow || selectedCol) && (
                        <div
                          className={`w-full px-4 py-1 rounded-lg border text-center flex items-center justify-center gap-3 ${
                            (selectedRow || selectedCell.row) *
                              (selectedCol || selectedCell.col) ===
                            selectedCell.value
                              ? "bg-emerald-500/20 border-emerald-400/50"
                              : "bg-red-500/20 border-red-400/50"
                          }`}
                        >
                          <span className="text-base text-white/80">
                            {selectedRow || selectedCell.row} ×{" "}
                            {selectedCol || selectedCell.col} =
                          </span>
                          <span
                            className={`text-xl font-bold ${
                              (selectedRow || selectedCell.row) *
                                (selectedCol || selectedCell.col) ===
                              selectedCell.value
                                ? "text-emerald-300"
                                : "text-red-300"
                            }`}
                          >
                            {selectedCell.value}
                          </span>
                          {(selectedRow || selectedCell.row) *
                            (selectedCol || selectedCell.col) !==
                            selectedCell.value && (
                            <span className="text-xs text-red-300 font-semibold">
                              ⚠️ Should be{" "}
                              {(selectedRow || selectedCell.row) *
                                (selectedCol || selectedCell.col)}
                            </span>
                          )}
                        </div>
                      )}

                    {tableMode === "division" &&
                      selectedResult &&
                      selectedDivisor &&
                      selectedResult % selectedDivisor === 0 && (
                        <div className="w-full px-4 py-1 rounded-lg bg-purple-500/20 border border-purple-400/50 text-center flex items-center justify-center gap-3">
                          <span className="text-base text-white/80">
                            {selectedResult} ÷ {selectedDivisor} =
                          </span>
                          <span className="text-xl font-bold text-purple-300">
                            {selectedResult / selectedDivisor}
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-center">
                      <thead>
                        <tr>
                          <th className="font-bold text-white/80 p-2 bg-black/30 rounded">
                            ×
                          </th>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (num) => {
                              const isColSelected =
                                (tableMode === "multiplication" &&
                                  selectedCol &&
                                  num === selectedCol) ||
                                (tableMode === "multiplication" &&
                                  selectedCell &&
                                  selectedRow &&
                                  num === selectedCell.col);
                              const isColInvalid =
                                tableMode === "division" &&
                                selectedCell &&
                                selectedResult &&
                                selectedResult % num !== 0;
                              return (
                                <th
                                  key={num}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (tableMode === "multiplication") {
                                      if (selectedCol === num) {
                                        setSelectedCol(null);
                                      } else {
                                        setSelectedCol(num);
                                      }
                                    } else {
                                      if (selectedResult && selectedCell) {
                                        const quotient =
                                          selectedResult / num;
                                        if (
                                          quotient ===
                                            Math.floor(quotient) &&
                                          quotient > 0
                                        ) {
                                          if (selectedDivisor === num) {
                                            setSelectedDivisor(null);
                                            setSelectedCol(null);
                                          } else {
                                            setSelectedDivisor(num);
                                            setSelectedRow(null);
                                            setSelectedCol(num);
                                          }
                                        }
                                      }
                                    }
                                  }}
                                  className={`font-bold text-white/80 p-2 rounded min-w-[40px] cursor-pointer transition-all ${
                                    isColSelected
                                      ? tableMode === "multiplication"
                                        ? "bg-yellow-500/40 border-2 border-yellow-400"
                                        : "bg-purple-500/40 border-2 border-purple-400"
                                      : isColInvalid
                                      ? "bg-red-500/20 border border-red-400/30 opacity-50 cursor-not-allowed"
                                      : "bg-black/30 hover:bg-black/40"
                                  }`}
                                  style={{ pointerEvents: "auto", zIndex: 10 }}
                                >
                                  {num}
                                </th>
                              );
                            }
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (row) => (
                            <tr key={row}>
                              <td
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (tableMode === "multiplication") {
                                    if (selectedRow === row) {
                                      setSelectedRow(null);
                                    } else {
                                      setSelectedRow(row);
                                    }
                                  } else {
                                    if (selectedResult && selectedCell) {
                                      const quotient =
                                        selectedResult / row;
                                      if (
                                        quotient ===
                                          Math.floor(quotient) &&
                                        quotient > 0
                                      ) {
                                        if (selectedDivisor === row) {
                                          setSelectedDivisor(null);
                                          setSelectedRow(null);
                                        } else {
                                          setSelectedDivisor(row);
                                          setSelectedCol(null);
                                          setSelectedRow(row);
                                        }
                                      }
                                    }
                                  }
                                }}
                                className={`font-bold text-white/80 p-2 rounded cursor-pointer transition-all ${
                                  (tableMode === "multiplication" &&
                                    selectedRow &&
                                    row === selectedRow) ||
                                  (tableMode === "multiplication" &&
                                    selectedCell &&
                                    selectedCol &&
                                    row === selectedCell.row)
                                    ? "bg-yellow-500/40 border-2 border-yellow-400"
                                    : tableMode === "division" &&
                                      selectedCell &&
                                      selectedResult &&
                                      selectedResult % row !== 0
                                    ? "bg-red-500/20 border border-red-400/30 opacity-50 cursor-not-allowed"
                                    : "bg-black/30 hover:bg-black/40"
                                }`}
                                style={{ pointerEvents: "auto", zIndex: 10 }}
                              >
                                {row}
                              </td>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                (col) => {
                                  const value = row * col;
                                  const isCellSelected =
                                    selectedCell &&
                                    selectedCell.row === row &&
                                    selectedCell.col === col;

                                  const isRowSelected =
                                    tableMode === "multiplication" &&
                                    selectedRow &&
                                    row === selectedRow;
                                  const isColSelected =
                                    tableMode === "multiplication" &&
                                    selectedCol &&
                                    col === selectedCol;

                                  const isAnswerCellMultiplication =
                                    tableMode === "multiplication" &&
                                    selectedRow &&
                                    selectedCol &&
                                    row === selectedRow &&
                                    col === selectedCol;

                                  const isDivisionIntersection =
                                    tableMode === "division" &&
                                    selectedCell &&
                                    selectedResult &&
                                    selectedDivisor &&
                                    ((selectedRow &&
                                      row === selectedRow &&
                                      col === selectedCell.col) ||
                                      (selectedCol &&
                                        row === selectedCell.row &&
                                        col === selectedCol));

                                  let isAnswerCell = false;
                                  if (
                                    tableMode === "division" &&
                                    selectedCell &&
                                    selectedResult &&
                                    selectedDivisor &&
                                    selectedResult % selectedDivisor === 0
                                  ) {
                                    const answer =
                                      selectedResult / selectedDivisor;
                                    if (answer >= 1 && answer <= 12) {
                                      if (
                                        selectedRow &&
                                        selectedRow === selectedDivisor &&
                                        row === selectedDivisor &&
                                        col === answer
                                      ) {
                                        isAnswerCell = true;
                                      }
                                      if (
                                        selectedCol &&
                                        selectedCol === selectedDivisor &&
                                        col === selectedDivisor &&
                                        row === answer
                                      ) {
                                        isAnswerCell = true;
                                      }
                                      if (
                                        value === answer &&
                                        ((selectedRow &&
                                          row === selectedDivisor) ||
                                          (selectedCol &&
                                            col === selectedDivisor))
                                      ) {
                                        isAnswerCell = true;
                                      }
                                    }
                                  }

                                  return (
                                    <td
                                      key={`${row}-${col}`}
                                      onClick={() => {
                                        if (tableMode === "multiplication") {
                                          setSelectedCell({
                                            row,
                                            col,
                                            value,
                                          });
                                          setSelectedRow(null);
                                          setSelectedCol(null);
                                          setHighlightedAnswer(null);
                                        } else {
                                          setSelectedResult(value);
                                          setSelectedDivisor(null);
                                          setSelectedRow(null);
                                          setSelectedCol(null);
                                          setSelectedCell({
                                            row,
                                            col,
                                            value,
                                          });
                                        }
                                      }}
                                      className={`p-2 rounded border text-white text-sm min-w-[40px] cursor-pointer transition-all ${
                                        isCellSelected
                                          ? tableMode === "multiplication"
                                            ? "bg-emerald-500/40 border-2 border-emerald-400 text-emerald-200 font-bold text-base"
                                            : "bg-purple-500/40 border-2 border-purple-400 text-purple-200 font-bold text-base"
                                          : isAnswerCellMultiplication
                                          ? "bg-emerald-500/40 border-2 border-emerald-400 text-emerald-200 font-bold text-base"
                                          : isAnswerCell
                                          ? "bg-purple-500/40 border-2 border-purple-400 text-purple-200 font-bold text-base"
                                          : isRowSelected || isColSelected
                                          ? "bg-yellow-500/20 border border-yellow-400/30"
                                          : isDivisionIntersection &&
                                            !isCellSelected
                                          ? "bg-purple-500/30 border border-purple-400/50"
                                          : "bg-black/20 border border-white/5 hover:bg-black/30"
                                      }`}
                                      style={{ pointerEvents: "auto" }}
                                    >
                                      {value}
                                    </td>
                                  );
                                }
                              )}
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-center space-y-2">
                    <div className="text-xs text-white/60 mb-2 text-center">
                      {tableMode === "multiplication"
                        ? "לחץ על מספר מהטבלה, ואז על מספר שורה או עמודה"
                        : "לחץ על מספר תוצאה, ואז על מספר שורה/עמודה כדי לראות את החילוק"}
                    </div>
                    <button
                      onClick={() => {
                        setShowMultiplicationTable(false);
                        setSelectedRow(null);
                        setSelectedCol(null);
                        setHighlightedAnswer(null);
                        setSelectedResult(null);
                        setSelectedDivisor(null);
                        setSelectedCell(null);
                      }}
                      className="px-6 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                    >
                      סגור
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Modal */}
          {showLeaderboard && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setShowLeaderboard(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-4 max-w-md w-full max-h-[85svh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-1">
                    🏆 לוח תוצאות
                  </h2>
                  <p className="text-white/70 text-xs">שיאים מקומיים</p>
                </div>

                {/* Level Selection */}
                <div className="flex gap-2 mb-4 justify-center">
                  {Object.keys(LEVELS).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setLeaderboardLevel(lvl);
                        if (typeof window !== "undefined") {
                          try {
                            const saved = JSON.parse(
                              localStorage.getItem(STORAGE_KEY) || "{}"
                            );
                            const topScores = buildTop10ByScore(saved, lvl);
                            setLeaderboardData(topScores);
                          } catch (e) {
                            console.error(
                              "שגיאה בטעינת לוח התוצאות:",
                              e
                            );
                          }
                        }
                      }}
                      className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                        leaderboardLevel === lvl
                          ? "bg-amber-500/80 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      {LEVELS[lvl].name}
                    </button>
                  ))}
                </div>

                {/* Leaderboard Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-center">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-white/80 p-2 font-bold text-xs">
                          דירוג
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          שחקן
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          ניקוד
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          רצף
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-white/60 p-4 text-sm"
                          >
                            עדיין אין תוצאות ברמה{" "}
                            {LEVELS[leaderboardLevel].name}
                          </td>
                        </tr>
                      ) : (
                        leaderboardData.map((score, idx) => (
                          <tr
                            key={`${score.name}-${score.timestamp}-${idx}`}
                            className={`border-b border-white/10 ${
                              score.placeholder
                                ? "opacity-40"
                                : idx === 0
                                ? "bg-amber-500/20"
                                : idx === 1
                                ? "bg-gray-500/20"
                                : idx === 2
                                ? "bg-amber-900/20"
                                : ""
                            }`}
                          >
                            <td className="text-white/80 p-2 text-sm font-bold">
                              {score.placeholder
                                ? `#${idx + 1}`
                                : idx === 0
                                ? "🥇"
                                : idx === 1
                                ? "🥈"
                                : idx === 2
                                ? "🥉"
                                : `#${idx + 1}`}
                            </td>
                            <td className="text-white p-2 text-sm font-semibold">
                              {score.name}
                            </td>
                            <td className="text-emerald-400 p-2 text-sm font-bold">
                              {score.bestScore}
                            </td>
                            <td className="text-amber-400 p-2 text-sm font-bold">
                              🔥{score.bestStreak}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="px-6 py-2 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mixed Operations Selector Modal */}
          {showMixedSelector && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
              onClick={() => {
                setShowMixedSelector(false);
                // אם לא נבחרו פעולות, חזור לפעולה הקודמת
                const hasSelected = Object.values(mixedOperations).some(
                  (selected) => selected
                );
                if (!hasSelected && operation === "mixed") {
                  const allowed = GRADES[grade].operations;
                  setOperation(allowed.find(op => op !== "mixed") || allowed[0]);
                }
              }}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-2">
                    🎲 בחר פעולות למיקס
                  </h2>
                  <p className="text-white/70 text-sm">
                    בחר אילו פעולות לכלול במיקס
                  </p>
                </div>

                <div className="space-y-3 mb-4">
                  {GRADES[grade].operations
                    .filter((op) => op !== "mixed")
                    .map((op) => (
                      <label
                        key={op}
                        className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/10 hover:bg-black/40 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={mixedOperations[op] || false}
                          onChange={(e) => {
                            setMixedOperations((prev) => ({
                              ...prev,
                              [op]: e.target.checked,
                            }));
                          }}
                          className="w-5 h-5 rounded"
                        />
                        <span className="text-white font-semibold text-lg">
                          {getOperationName(op)}
                        </span>
                      </label>
                    ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // בחר הכל
                      const availableOps = GRADES[grade].operations.filter(
                        (op) => op !== "mixed"
                      );
                      const allSelected = {};
                      availableOps.forEach((op) => {
                        allSelected[op] = true;
                      });
                      setMixedOperations(allSelected);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                  >
                    הכל
                  </button>
                  <button
                    onClick={() => {
                      // בטל הכל
                      const availableOps = GRADES[grade].operations.filter(
                        (op) => op !== "mixed"
                      );
                      const noneSelected = {};
                      availableOps.forEach((op) => {
                        noneSelected[op] = false;
                      });
                      setMixedOperations(noneSelected);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-500/80 hover:bg-gray-500 font-bold text-sm"
                  >
                    בטל הכל
                  </button>
                  <button
                    onClick={() => {
                      // בדוק שיש לפחות פעולה אחת נבחרת
                      const hasSelected = Object.values(mixedOperations).some(
                        (selected) => selected
                      );
                      if (hasSelected) {
                        setShowMixedSelector(false);
                      } else {
                        alert("אנא בחר לפחות פעולה אחת");
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 font-bold text-sm"
                  >
                    שמור
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}



