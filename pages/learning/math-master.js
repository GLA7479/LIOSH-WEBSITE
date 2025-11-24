import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";

const LEVELS = {
  easy: {
    name: "Easy",
    addition: { max: 20 },
    subtraction: { min: 0, max: 20 },
    multiplication: { max: 5 },
    division: { max: 50, maxDivisor: 5 },
    fractions: { maxDen: 4 },
  },
  medium: {
    name: "Medium",
    addition: { max: 100 },
    subtraction: { min: 0, max: 100 },
    multiplication: { max: 10 },
    division: { max: 100, maxDivisor: 10 },
    fractions: { maxDen: 8 },
  },
  hard: {
    name: "Hard",
    addition: { max: 500 },
    subtraction: { min: -200, max: 500 },
    multiplication: { max: 12 },
    division: { max: 500, maxDivisor: 12 },
    fractions: { maxDen: 12 },
  },
};

const GRADES = {
  g1_2: {
    name: "Grade 1–2",
    operations: ["addition", "subtraction"],
    allowFractions: false,
    allowNegatives: false,
  },
  g3_4: {
    name: "Grade 3–4",
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "fractions",
      "sequences",
      "decimals",
      "mixed",
    ],
    allowFractions: true,
    allowNegatives: false,
  },
  g5_6: {
    name: "Grade 5–6",
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
    name: "Learning",
    description: "No hard game over, practice at your pace",
  },
  challenge: {
    name: "Challenge",
    description: "Timer + lives, high score race",
  },
  speed: {
    name: "Speed Run",
    description: "Fast answers = more points! ⚡",
  },
  marathon: {
    name: "Marathon",
    description: "How many questions can you solve? 🏃",
  },
  practice: {
    name: "Practice",
    description: "Focus on one operation 📚",
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

  const round = (n) => Math.round(n);

  const allowNegatives = !!levelConfig.allowNegatives && gradeCfg.allowNegatives;
  const allowTwoStep = !!levelConfig.allowTwoStep;

  let question = "";
  let correctAnswer = 0;
  let params = { kind: selectedOp };
  let operandA = null;
  let operandB = null;
  let isStory = false;

  if (selectedOp === "addition") {
    const maxA = levelConfig.addition.max || 20;

    if (allowTwoStep && Math.random() < 0.3) {
      const a = randInt(1, maxA);
      const b = randInt(1, maxA);
      const c = randInt(1, maxA);
      correctAnswer = round(a + b + c);
      question = `${a} + ${b} + ${c} = ?`;
      params = { kind: "add_three", a, b, c };
      operandA = a;
      operandB = b;
    } else {
      const a = randInt(1, maxA);
      const b = randInt(1, maxA);
      correctAnswer = round(a + b);
      question = `${a} + ${b} = ?`;
      params = { kind: "add_two", a, b };
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
    question = `${a} - ${b} = ?`;
    params = { kind: "sub_two", a, b };
    operandA = a;
    operandB = b;
  } else if (selectedOp === "multiplication") {
    const maxM = levelConfig.multiplication.max || 10;
    const a = randInt(1, maxM);
    const b = randInt(1, Math.min(maxM, 12));
    correctAnswer = round(a * b);
    question = `${a} × ${b} = ?`;
    params = { kind: "mul", a, b };
    operandA = a;
    operandB = b;
  } else if (selectedOp === "division") {
    const maxD = levelConfig.division.max || 100;
    const maxDivisor = levelConfig.division.maxDivisor || 12;
    const divisor = randInt(2, maxDivisor);
    const quotient = randInt(2, Math.max(2, Math.floor(maxD / divisor)));
    const dividend = divisor * quotient;
    correctAnswer = round(quotient);
    question = `${dividend} ÷ ${divisor} = ?`;
    params = { kind: "div", dividend, divisor };
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
        question = `${n2}/${den} - ${n1}/${den} = ?`;
        params = { kind: "frac_same_den", op: "sub", n1: n2, n2: n1, den };
      } else {
        question =
          opKind === "add_frac"
            ? `${n1}/${den} + ${n2}/${den} = ?`
            : `${n1}/${den} - ${n2}/${den} = ?`;
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
        question = `${n2}/${den2} - ${n1}/${den1} = ?`;
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
            ? `${n1}/${den1} + ${n2}/${den2} = ?`
            : `${n1}/${den1} - ${n2}/${den2} = ?`;
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
  } else if (selectedOp === "percentages") {
    const templates =
      gradeKey === "g5_6" ? ["percent_of", "what_percent"] : ["percent_of"];
    const percentOptions = [10, 20, 25, 30, 40, 50];
    const t = templates[Math.floor(Math.random() * templates.length)];

    if (t === "percent_of") {
      const base = randInt(20, 500);
      const percent =
        percentOptions[Math.floor(Math.random() * percentOptions.length)];
      correctAnswer = Math.round((base * percent) / 100);
      question = `${percent}% מ-${base} = ?`;
      params = { kind: "perc_of", base, percent };
    } else {
      const base = randInt(40, 200);
      const percent =
        percentOptions[Math.floor(Math.random() * percentOptions.length)];
      const part = Math.round((base * percent) / 100);
      correctAnswer = percent;
      question = `${part} הוא כמה אחוז מ-${base}?`;
      params = { kind: "perc_what", base, part };
    }
  } else if (selectedOp === "sequences") {
    const isLowerGrade = gradeKey === "g3_4";
    const length = 5;
    const step =
      isLowerGrade
        ? randInt(1, 5)
        : Math.random() < 0.7
        ? randInt(1, 7)
        : -randInt(1, 5);
    const start = isLowerGrade ? randInt(1, 20) : randInt(-20, 50);

    const terms = [];
    for (let i = 0; i < length; i++) {
      terms.push(start + i * step);
    }
    const missingIndex = randInt(1, length - 2);
    correctAnswer = terms[missingIndex];
    const displayTerms = terms
      .map((val, idx) => (idx === missingIndex ? "?" : val))
      .join(", ");
    question = `מצא את המספר החסר בסדרה: ${displayTerms}`;
    params = { kind: "seq_arith", start, step, terms, missingIndex };
  } else if (selectedOp === "decimals") {
    const isLower = gradeKey === "g3_4";
    const types = isLower ? ["add", "sub"] : ["add", "sub", "times10", "div10"];

    const t = types[Math.floor(Math.random() * types.length)];

    const randDec = (min, max, places) => {
      const factor = Math.pow(10, places);
      const lo = Math.round(min * factor);
      const hi = Math.round(max * factor);
      const n = randInt(lo, hi);
      return n / factor;
    };

    const places = gradeKey === "g3_4" ? 1 : Math.random() < 0.5 ? 1 : 2;
    const fmt = (x) => x.toFixed(places);

    if (t === "add") {
      const a = randDec(0.1, 50, places);
      const b = randDec(0.1, 50, places);
      const res = a + b;
      correctAnswer = fmt(res);
      question = `${fmt(a)} + ${fmt(b)} = ?`;
      params = { kind: "dec_add", a: fmt(a), b: fmt(b), places };
    } else if (t === "sub") {
      let a = randDec(0.1, 50, places);
      let b = randDec(0.1, 50, places);
      if (isLower && a < b) {
        [a, b] = [b, a];
      }
      const res = a - b;
      correctAnswer = fmt(res);
      question = `${fmt(a)} - ${fmt(b)} = ?`;
      params = { kind: "dec_sub", a: fmt(a), b: fmt(b), places };
    } else if (t === "times10") {
      const a = randDec(0.1, 500, places);
      const factor = Math.random() < 0.5 ? 10 : 100;
      const res = a * factor;
      correctAnswer = fmt(res);
      question = `${fmt(a)} × ${factor} = ?`;
      params = { kind: "dec_times", a: fmt(a), factor, places };
    } else {
      const a = randDec(1, 500, places);
      const factor = Math.random() < 0.5 ? 10 : 100;
      const res = a / factor;
      const resPlaces = places + (factor === 100 ? 2 : 1);
      const fmtRes = (x) => x.toFixed(Math.min(resPlaces, 3));
      correctAnswer = fmtRes(res);
      question = `${fmt(a)} ÷ ${factor} = ?`;
      params = { kind: "dec_div", a: fmt(a), factor, places: resPlaces };
    }
  } else if (selectedOp === "rounding") {
    const isLower = gradeKey === "g3_4";
    const kinds = isLower
      ? ["nearest_10", "nearest_100"]
      : ["nearest_10", "nearest_100", "nearest_whole", "nearest_tenth"];

    const k = kinds[Math.floor(Math.random() * kinds.length)];
    const roundTo = (num, factor) => Math.round(num / factor) * factor;

    if (k === "nearest_10") {
      const n = randInt(10, 999);
      correctAnswer = roundTo(n, 10);
      question = `עגל את ${n} לעשרות הקרובות ביותר.`;
      params = { kind: "round_10", n };
    } else if (k === "nearest_100") {
      const n = randInt(100, 9999);
      correctAnswer = roundTo(n, 100);
      question = `עגל את ${n} למאות הקרובות ביותר.`;
      params = { kind: "round_100", n };
    } else if (k === "nearest_whole") {
      const base = randInt(1, 100);
      const frac = randInt(1, 9) / 10;
      const n = base + frac;
      const rounded = Math.round(n);
      correctAnswer = rounded;
      question = `עגל את ${n.toFixed(1)} למספר השלם הקרוב ביותר.`;
      params = { kind: "round_whole", n: n.toFixed(1) };
    } else {
      const base = randInt(1, 100);
      const frac = randInt(1, 99) / 100;
      const n = base + frac;
      const rounded = Math.round(n * 10) / 10;
      correctAnswer = Number(rounded.toFixed(1));
      question = `עגל את ${n.toFixed(2)} לעשירית הקרובה ביותר.`;
      params = { kind: "round_tenth", n: n.toFixed(2) };
    }
  } else if (selectedOp === "word_problems") {
    const templates =
      gradeKey === "g5_6"
        ? ["multi_step", "groups", "leftover", "money"]
        : ["groups", "simple_add"];
    const t = templates[Math.floor(Math.random() * templates.length)];
    isStory = true;

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
    } else if (t === "multi_step") {
      const price = randInt(5, 20);
      const qty1 = randInt(2, 5);
      const qty2 = randInt(1, 4);
      const totalCost = price * (qty1 + qty2);
      const money = randInt(totalCost + 20, totalCost + 80);
      correctAnswer = money - totalCost;
      question = `לליאו יש ${money} שקלים. הוא קונה ${qty1} מחברות ו-${qty2} עפרונות, שכל אחד מהם עולה ${price} שקלים. כמה כסף יישאר לו אחרי הקנייה?`;
      params = {
        kind: "wp_multi_step",
        money,
        price,
        qty1,
        qty2,
        totalCost,
      };
    } else {
      const price = randInt(3, 15);
      const qty = randInt(2, 8);
      correctAnswer = price * qty;
      question = `מחברת אחת עולה ${price} שקלים. כמה יעלה לקנות ${qty} מחברות?`;
      params = { kind: "wp_money", price, qty };
    }
  } else {
    const maxA = levelConfig.addition.max || 20;
    const a = randInt(1, maxA);
    const b = randInt(1, maxA);
    correctAnswer = round(a + b);
    question = `${a} + ${b} = ?`;
    params = { kind: "add_two", a, b };
    operandA = a;
    operandB = b;
  }

  const wrongAnswers = new Set();

  if (selectedOp === "decimals") {
    const places =
      params?.places != null
        ? Math.max(1, Math.min(3, params.places))
        : 1;
    const correctNum = Number(correctAnswer);
    const fmtWrong = (x) => x.toFixed(places);

    while (wrongAnswers.size < 3) {
      const deltaBase = Math.max(0.1, Math.abs(correctNum) * 0.1);
      const sign = Math.random() < 0.5 ? 1 : -1;
      const step = Math.random() < 0.5 ? 0.1 : 0.2;
      const wrongNum = correctNum + sign * deltaBase * step;
      const wrong = fmtWrong(wrongNum);
      if (wrong !== correctAnswer && !wrongAnswers.has(wrong)) {
        wrongAnswers.add(wrong);
      }
    }
  } else {
    const correctIsFraction =
      typeof correctAnswer === "string" && correctAnswer.includes("/");

    if (correctIsFraction) {
      const [cnRaw, cdRaw] = correctAnswer.split("/");
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
    } else {
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
    }
  }

  const allAnswers = [correctAnswer, ...Array.from(wrongAnswers)];
  for (let i = allAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
  }

  return {
    question,
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
      if (p.kind === "perc_of") {
        return "כדי למצוא אחוז ממספר, מכפילים במספר האחוז ומחלקים ב-100.";
      }
      if (p.kind === "perc_what") {
        return "חלקי שלם = אחוז/100. חלק ÷ שלם ואז כפול 100 לקבלת אחוז.";
      }
      return "אחוז הוא חלק מתוך 100. אפשר לחשוב על 25% כמו 25 מתוך 100.";
    case "sequences":
      return "בסדרה חשבונית ההפרש בין כל שני איברים סמוכים קבוע. בדוק בכמה המספרים עולים (או יורדים) כל פעם.";
    case "decimals":
      return "בעשרוניים מיישרים את הנקודה העשרונית ומבצעים את הפעולה כמו בחשבון רגיל. אפשר לחשוב על עשיריות ומאות כמו על אגורות.";
    case "rounding":
      return "בעיגול מסתכלים על הספרה שאחרי המקום שאליו מעגלים: אם היא 5 או יותר – מעגלים למעלה, אחרת נשארים למטה.";
    case "word_problems":
      return "קרא לאט, סמן את המספרים ותרגם את הסיפור לתרגיל פשוט (חיבור, חיסור, כפל או חילוק).";
    default:
      return "נסה לתרגם את השאלה לתרגיל חשבון פשוט.";
  }
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
        direction: isStory ? "rtl" : "ltr",
        unicodeBidi: "plaintext",
      }}
    >
      {text}
    </span>
  );

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
      if (p.kind === "perc_of") {
        return [
          toSpan(`1. נרשום: ${ltr(`${p.percent}% מ-${p.base}`)}.`, "1"),
          toSpan(`2. נהפוך אחוז לשבר: ${p.percent}% = ${ltr(`${p.percent} ÷ 100`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`${p.base} × ${p.percent} ÷ 100 = ${ans}`)}.`, "3"),
          toSpan(`4. לכן ${p.percent}% מ-${p.base} הוא ${ans}.`, "4"),
        ];
      }
      if (p.kind === "perc_what") {
        const approx = ((p.part / p.base) * 100).toFixed(1);
        return [
          toSpan(`1. נרשום יחס: ${ltr(`${p.part} ÷ ${p.base}`)}.`, "1"),
          toSpan("2. את התוצאה נכפיל ב-100 כדי לקבל אחוז.", "2"),
          toSpan(`3. זה יוצא בערך ${approx}%, ובעיגול ${ans}%.`, "3"),
          toSpan(`4. לכן ${p.part} הוא ${ans}% מתוך ${p.base}.`, "4"),
        ];
      }
      return [];

    case "sequences":
      if (p.kind === "seq_arith") {
        const diffList = p.terms
          .slice(1)
          .map((val, idx) => val - p.terms[idx])
          .join(", ");
        return [
          toSpan(`1. נסתכל על הסדרה: ${ltr(p.terms.join(", "))}.`, "1"),
          toSpan(`2. נחשב הפרשים בין איברים סמוכים: ${diffList}.`, "2"),
          toSpan(`3. ההפרש הקבוע הוא ${p.step}.`, "3"),
          toSpan(`4. נמשיך באותו הפרש ונקבל שהאיבר החסר הוא ${ans}.`, "4"),
        ];
      }
      return [];

    case "decimals": {
      if (p.kind === "dec_add") {
        return [
          toSpan(
            "1. נרשום את המספרים אחד מתחת לשני כך שהנקודות העשרוניות מיושרות.",
            "1"
          ),
          toSpan("2. נחבר כמו בעמודות רגילות, והנקודה נשארת באותו מקום.", "2"),
          toSpan(`3. נקבל: ${ltr(`${p.a} + ${p.b} = ${ans}`)}.`, "3"),
        ];
      }
      if (p.kind === "dec_sub") {
        return [
          toSpan("1. נכין את המספרים בעמודה ונדאג לנקודות מיושרות.", "1"),
          toSpan("2. נחסר ספרה אחר ספרה מימין לשמאל.", "2"),
          toSpan(`3. התוצאה: ${ltr(`${p.a} - ${p.b} = ${ans}`)}.`, "3"),
        ];
      }
      if (p.kind === "dec_times") {
        return [
          toSpan(
            `1. הכפלה ב-${p.factor} משמעה הזזה של הנקודה ${p.factor === 10 ? "ספרה אחת" : "שתי ספרות"} ימינה.`,
            "1"
          ),
          toSpan(
            `2. נבצע את ההזזה על ${p.a} ונמלא אפסים אם צריך.`,
            "2"
          ),
          toSpan(`3. נקבל: ${ltr(`${p.a} × ${p.factor} = ${ans}`)}.`, "3"),
        ];
      }
      if (p.kind === "dec_div") {
        return [
          toSpan(
            `1. בחילוק ב-${p.factor} מזיזים את הנקודה ${p.factor === 10 ? "ספרה אחת" : "שתי ספרות"} שמאלה.`,
            "1"
          ),
          toSpan(
            "2. נוסיף אפסים משמאל אם צריך כדי לבצע את ההזזה.",
            "2"
          ),
          toSpan(`3. לכן ${ltr(`${p.a} ÷ ${p.factor} = ${ans}`)}.`, "3"),
        ];
      }
      return [];
    }

    case "rounding": {
      if (p.kind === "round_10") {
        return [
          toSpan(`1. נסתכל על ספרת היחידות של ${p.n}.`, "1"),
          toSpan("2. אם היא 0–4 נעגל למטה, אם 5–9 נעגל למעלה.", "2"),
          toSpan(`3. התוצאה העגולה לעשרות: ${ans}.`, "3"),
        ];
      }
      if (p.kind === "round_100") {
        return [
          toSpan(`1. נסתכל על ספרת העשרות של ${p.n}.`, "1"),
          toSpan("2. 0–4 -> מעגלים למטה, 5–9 -> למעלה.", "2"),
          toSpan(`3. לכן ${p.n} מעוגל למאות הוא ${ans}.`, "3"),
        ];
      }
      if (p.kind === "round_whole") {
        return [
          toSpan(`1. נסתכל על החלק העשרוני של ${p.n}.`, "1"),
          toSpan("2. אם הוא קטן מ-0.5 נעגל למטה, אחרת למעלה.", "2"),
          toSpan(`3. לכן המספר השלם הקרוב ביותר הוא ${ans}.`, "3"),
        ];
      }
      if (p.kind === "round_tenth") {
        return [
          toSpan(
            `1. נסתכל על הספרה במקום המאות של ${p.n} (השנייה אחרי הנקודה).`,
            "1"
          ),
          toSpan("2. אם היא 5 או יותר – נעלה את ספרת העשיריות, אחרת נשאיר.", "2"),
          toSpan(`3. לכן לעשירית הקרובה ביותר נקבל ${ans}.`, "3"),
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

      if (p.kind === "wp_money") {
        return [
          toSpan("1. מבינים שמדובר בכפל (מחיר × כמות).", "1"),
          toSpan(
            `2. נחשב: ${ltr(`${p.price} × ${p.qty} = ${ans}`)}.`,
            "2"
          ),
          toSpan("3. זה הסכום הכולל שיש לשלם.", "3"),
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
      return "באחוזים קל להתבלבל אם מחלקים או מכפילים ב-100. ודא מי המספר המלא (שלם) ומי החלק שאתה משווה אליו.";
    case "sequences":
      return "בסדרות כדאי לוודא שהפרש בין כל שני איברים סמוכים קבוע. אולי בחרת הפרש לא נכון או דילגת על איבר.";
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

    do {
      let opForQuestion = operation;
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
    setFeedback("Time's up! Game Over! ⏰");
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
        return "+";
      case "subtraction":
        return "-";
      case "multiplication":
        return "×";
      case "division":
        return "÷";
      case "fractions":
        return "⅟ Fractions";
      case "percentages":
        return "% Percentages";
      case "sequences":
        return "🔢 Sequences";
      case "decimals":
        return "• Decimals";
      case "rounding":
        return "≈ Rounding";
      case "word_problems":
        return "📘 Word Problems";
      case "mixed":
        return "🎲 Mixed";
      default:
        return op;
    }
  };

  if (!mounted)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const gradeSupportsWordProblems = GRADES[grade].operations.includes("word_problems");

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
              {playerName || "Player"} • {GRADES[grade].name} •{" "}
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
              <div className="text-[10px] text-white/60">Score</div>
              <div className="text-sm font-bold text-emerald-400">{score}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">Streak</div>
              <div className="text-sm font-bold text-amber-400">🔥{streak}</div>
            </div>
            {stars > 0 && (
              <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
                <div className="text-[10px] text-white/60">Stars</div>
                <div className="text-sm font-bold text-yellow-400">⭐{stars}</div>
              </div>
            )}
            {playerLevel > 1 && (
              <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
                <div className="text-[10px] text-white/60">Level</div>
                <div className="text-sm font-bold text-purple-400">Lv.{playerLevel}</div>
              </div>
            )}
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">✅</div>
              <div className="text-sm font-bold text-green-400">{correct}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-1 text-center">
              <div className="text-[10px] text-white/60">Lives</div>
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
              <div className="text-[10px] text-white/60">⏰ Timer</div>
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
                <div className="text-2xl font-bold">New Badge!</div>
                <div className="text-xl">{showBadge}</div>
              </div>
            </div>
          )}
          
          {showLevelUp && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center animate-pulse">
                <div className="text-4xl mb-2">🌟</div>
                <div className="text-2xl font-bold">Level Up!</div>
                <div className="text-xl">You're now Level {playerLevel}!</div>
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
                  placeholder="Player Name"
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
                  <div className="text-xs text-white/60">Best Score</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {bestScore}
                  </div>
                </div>
                <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-center">
                  <div className="text-xs text-white/60">Best Streak</div>
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
                <div className="text-xs text-white/60 mb-1">Daily Challenge</div>
                <div className="text-sm text-white">
                  Best: {dailyChallenge.bestScore} • Questions: {dailyChallenge.questions}
                </div>
              </div>
              
              {/* אפשרות לשאלות עם סיפור */}
              {gradeSupportsWordProblems && (
                <div className="flex items-center justify-center gap-4 mb-2 w-full max-w-md flex-wrap">
                  <label className="flex items-center gap-2 text-white text-sm">
                    <input
                      type="checkbox"
                      checked={useStoryQuestions}
                      onChange={(e) => {
                        setUseStoryQuestions(e.target.checked);
                        if (!e.target.checked) setStoryOnly(false);
                      }}
                      className="w-4 h-4"
                    />
                    📖 Story Questions
                  </label>
                  {useStoryQuestions && (
                    <label className="flex items-center gap-2 text-white text-sm">
                      <input
                        type="checkbox"
                        checked={storyOnly}
                        onChange={(e) => setStoryOnly(e.target.checked)}
                        className="w-4 h-4"
                      />
                      📝 Story Only
                    </label>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-10 px-6 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  ▶️ Start
                </button>
                <button
                  onClick={() => setShowMultiplicationTable(true)}
                  className="h-10 px-4 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                >
                  📊 Times Table
                </button>
                <button
                  onClick={() => setShowLeaderboard(true)}
                  className="h-10 px-4 rounded-lg bg-amber-500/80 hover:bg-amber-500 font-bold text-sm"
                >
                  🏆 Leaderboard
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
                  Enter your name to start
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
                  
                  <div
                    className="text-4xl font-black text-white mb-4 text-center"
                    style={{
                      direction: currentQuestion.isStory ? "rtl" : "ltr",
                      unicodeBidi: "plaintext",
                    }}
                  >
                    {currentQuestion.question}
                  </div>
                  
                  {/* כפתור רמז */}
                  {!hintUsed && !selectedAnswer && (
                    <button
                      onClick={() => {
                        setShowHint(true);
                        setHintUsed(true);
                      }}
                      className="mb-2 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-sm font-bold"
                    >
                      💡 Hint
                    </button>
                  )}
                  
                  {showHint && (
                    <div
                      className="mb-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-400/50 text-blue-200 text-sm text-center max-w-md"
                      style={{
                        direction: currentQuestion.isStory ? "rtl" : "ltr",
                        unicodeBidi: "plaintext",
                      }}
                    >
                      {getHint(currentQuestion, currentQuestion.operation, grade)}
                    </div>
                  )}

                  {/* כפתור הסבר מלא – רק במצב Learning */}
                  {mode === "learning" && currentQuestion && (
                    <>
                      <button
                        onClick={() => setShowSolution((prev) => !prev)}
                        className="mb-2 px-4 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                      >
                        📘 הסבר מלא
                      </button>

                      {showSolution && (
                        <div
                          className="mb-3 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-100 text-sm space-y-1 max-w-md"
                          style={{
                            direction: currentQuestion.isStory ? "rtl" : "ltr",
                            unicodeBidi: "plaintext",
                          }}
                        >
                          {getSolutionSteps(
                            currentQuestion,
                            currentQuestion.operation,
                            grade
                          )}
                        </div>
                      )}
                    </>
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
                        📊 Show on table
                      </button>
                    )}
                </div>
              )}

              <button
                onClick={stopGame}
                className="h-9 px-4 rounded-lg bg-red-500/80 hover:bg-red-500 font-bold text-sm"
              >
                ⏹️ Stop
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
                    📊 Multiplication Table
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
                      RESET
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
                      × Multiplication
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
                      ÷ Division
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
                            ⚠️ Error: {selectedResult} ÷ {selectedDivisor} is
                            not a whole number!
                          </span>
                          <span className="text-xs text-red-300">
                            (
                            {Math.floor(selectedResult / selectedDivisor)}{" "}
                            remainder {selectedResult % selectedDivisor})
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
                        ? "Click a number from the table, then a row or column number"
                        : "Click a result number, then a row/column number to see the division"}
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
                      Close
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
                    🏆 Leaderboard
                  </h2>
                  <p className="text-white/70 text-xs">Local High Scores</p>
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
                              "Error loading leaderboard:",
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
                          Rank
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          Player
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          Score
                        </th>
                        <th className="text-white/80 p-2 font-bold text-xs">
                          Streak
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
                            No scores yet for{" "}
                            {LEVELS[leaderboardLevel].name} level
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



