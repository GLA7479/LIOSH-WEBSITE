import { useState, useEffect, useRef, useMemo } from "react";
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

// לכל כיתה (1–6) יש 3 רמות: easy / medium / hard
// בכל רמה יש אותו מבנה כמו LEVELS: addition / subtraction / multiplication / division / fractions
const GRADE_LEVELS = {
  1: {
    name: "כיתה א׳",
    levels: {
      easy: {
        addition: { max: 10 },
        subtraction: { min: 0, max: 10 },
        multiplication: { max: 5 },
        division: { max: 20, maxDivisor: 5 },
        fractions: { maxDen: 2 },
      },
      medium: {
        addition: { max: 20 },
        subtraction: { min: 0, max: 20 },
        multiplication: { max: 5 },
        division: { max: 20, maxDivisor: 5 },
        fractions: { maxDen: 2 },
      },
      hard: {
        addition: { max: 20 },
        subtraction: { min: 0, max: 20 },
        multiplication: { max: 5 },
        division: { max: 20, maxDivisor: 5 },
        fractions: { maxDen: 2 },
      },
    },
  },
  2: {
    name: "כיתה ב׳",
    levels: {
      easy: {
    addition: { max: 50 },
        subtraction: { min: 0, max: 50 },
        multiplication: { max: 5 },
        division: { max: 50, maxDivisor: 5 },
        fractions: { maxDen: 2 },
      },
      medium: {
        addition: { max: 100 },
        subtraction: { min: 0, max: 100 },
    multiplication: { max: 10 },
    division: { max: 100, maxDivisor: 10 },
        fractions: { maxDen: 3 },
  },
  hard: {
    addition: { max: 100 },
        subtraction: { min: 0, max: 100 },
        multiplication: { max: 10 },
        division: { max: 100, maxDivisor: 10 },
        fractions: { maxDen: 4 },
      },
    },
  },
  3: {
    name: "כיתה ג׳",
    levels: {
      easy: {
        addition: { max: 200 },
        subtraction: { min: 0, max: 200 },
        multiplication: { max: 10 },
        division: { max: 100, maxDivisor: 10 },
        fractions: { maxDen: 4 },
      },
      medium: {
        addition: { max: 500 },
        subtraction: { min: 0, max: 500 },
    multiplication: { max: 12 },
    division: { max: 144, maxDivisor: 12 },
        fractions: { maxDen: 6 },
      },
      hard: {
        addition: { max: 1000 },
        subtraction: { min: 0, max: 1000 },
        multiplication: { max: 12 },
        division: { max: 200, maxDivisor: 12 },
        fractions: { maxDen: 6 },
      },
    },
  },
  4: {
    name: "כיתה ד׳",
    levels: {
      easy: {
        addition: { max: 1000 },
        subtraction: { min: 0, max: 1000 },
        multiplication: { max: 12 },
        division: { max: 200, maxDivisor: 12 },
        fractions: { maxDen: 6 },
      },
      medium: {
        addition: { max: 5000 },
        subtraction: { min: 0, max: 5000 },
        multiplication: { max: 12 },
        division: { max: 500, maxDivisor: 12 },
        fractions: { maxDen: 8 },
      },
      hard: {
        addition: { max: 10000 },
        subtraction: { min: 0, max: 10000 },
        multiplication: { max: 12 },
        division: { max: 1000, maxDivisor: 12 },
        fractions: { maxDen: 8 },
      },
    },
  },
  5: {
    name: "כיתה ה׳",
    levels: {
      easy: {
        addition: { max: 10000 },
        subtraction: { min: 0, max: 10000 },
        multiplication: { max: 12 },
        division: { max: 1000, maxDivisor: 12 },
        fractions: { maxDen: 8 },
      },
      medium: {
        addition: { max: 50000 },
        subtraction: { min: 0, max: 50000 },
        multiplication: { max: 12 },
        division: { max: 2000, maxDivisor: 12 },
        fractions: { maxDen: 10 },
      },
      hard: {
        addition: { max: 100000 },
        subtraction: { min: 0, max: 100000 },
        multiplication: { max: 12 },
        division: { max: 5000, maxDivisor: 12 },
        fractions: { maxDen: 12 },
      },
    },
  },
  6: {
    name: "כיתה ו׳",
    levels: {
      easy: {
        addition: { max: 50000 },
        subtraction: { min: 0, max: 50000 },
        multiplication: { max: 12 },
        division: { max: 2000, maxDivisor: 12 },
        fractions: { maxDen: 10 },
      },
      medium: {
        addition: { max: 100000 },
        subtraction: { min: 0, max: 100000 },
        multiplication: { max: 12 },
        division: { max: 10000, maxDivisor: 12 },
        fractions: { maxDen: 12 },
      },
      hard: {
        addition: { max: 200000 },
        subtraction: { min: 0, max: 200000 },
        multiplication: { max: 12 },
        division: { max: 20000, maxDivisor: 12 },
        fractions: { maxDen: 20 },
      },
    },
  },
};

// מחזיר את ההגדרות האקטואליות לפי כיתה + רמת קושי
function getLevelConfig(grade, levelKey) {
  const safeGrade = Math.min(6, Math.max(1, grade || 1));
  const gradeCfg = GRADE_LEVELS[safeGrade];
  const gradeKey = safeGrade <= 2 ? "g1_2" : safeGrade <= 4 ? "g3_4" : "g5_6";
  const gradeCfgGrades = GRADES[gradeKey] || GRADES.g3_4;

  let levelData;
  if (gradeCfg && gradeCfg.levels && gradeCfg.levels[levelKey]) {
    levelData = gradeCfg.levels[levelKey];
  } else {
    // אם משום מה אין – נופלים להגדרות הכלליות
    levelData = LEVELS[levelKey] || LEVELS.easy;
  }

  // לוודא שיש ערך תקין
  if (!levelData) {
    console.warn(`Invalid level config for grade ${grade}, level ${levelKey}, using default`);
    levelData = LEVELS.easy;
  }

  // מוסיפים שדות נוספים שנדרשים
  return {
    ...levelData,
    name: levelData.name || LEVELS[levelKey]?.name || "קל",
    allowNegatives: gradeCfgGrades.allowNegatives && levelKey === "hard",
    allowTwoStep: levelKey !== "easy" && safeGrade >= 5,
    allowFractions: gradeCfgGrades.allowFractions,
  };
}

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

    // האם להשתמש בתרגילי השלמה (לעשר/מספר עגול)
    const useComplementG1 = gradeKey === "g1_2" && Math.random() < 0.3;
    const useComplementG3 = gradeKey === "g3_4" && Math.random() < 0.2;
    // האם להשתמש בתרגיל 3 מספרים
    const useThreeTerms = allowTwoStep && Math.random() < 0.3;

    if (useComplementG1) {
      // כיתות א–ב: השלמה ל-10
      const b = randInt(1, 9);
      const c = 10;
      const a = c - b;
      correctAnswer = a;
      const exerciseText = `${BLANK} + ${b} = ${c}`;
      question = exerciseText;
      params = {
        kind: "add_complement10",
        a,
        b,
        c,
        exerciseText,
        op: "add",
        grade: gradeKey,
      };
      operandA = a;
      operandB = b;
    } else if (useComplementG3) {
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
      // חיבור של 3 מספרים
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
      a = randInt(b, maxS); // דואג ש-a ≥ b
    }

    const c = a - b;
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

    operandA = a;
    operandB = b;
  } else if (selectedOp === "multiplication") {
    const maxM = levelConfig.multiplication.max || 10;
    const a = randInt(1, maxM);
    const b = randInt(1, Math.min(maxM, 12));
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

  // ===== תרגילי מילים (רק חשבון – בלי גאומטריה) =====
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

// Build detailed step-by-step explanation for the current question
// מחזיר מחרוזת עם כתיבה מאונכת מיושרת:
//   33
// - 13
// ----
function buildVerticalOperation(topNumber, bottomNumber, operator = "-") {
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
function convertMissingNumberEquation(op, kind, params) {
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
function buildAdditionOrSubtractionAnimation(a, b, answer, op) {
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

function buildStepExplanation(question) {
  if (!question) return null;

  const BLANK = "__";
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
  const [gradeNumber, setGradeNumber] = useState(3); // 1 = כיתה א׳, 2 = ב׳, ... 6 = ו׳
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
  const [animationStep, setAnimationStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  
  // Ref לשמירת timeouts לניקוי - מונע תקיעות
  const animationTimeoutsRef = useRef([]);
  
  // Memoize explanation to avoid recalculating on every render
  const stepExplanation = useMemo(
    () => showSolution && currentQuestion ? buildStepExplanation(currentQuestion) : null,
    [showSolution, currentQuestion]
  );

  // בניית צעדי אנימציה
  const animationSteps = useMemo(() => {
    if (!showSolution || !currentQuestion) return null;
    
    const p = currentQuestion.params || {};
    const op = currentQuestion.operation;
    let effectiveOp = op;
    let top = p.a ?? currentQuestion.a;
    let bottom = p.b ?? currentQuestion.b;
    
    const answer = currentQuestion.correctAnswer !== undefined
      ? currentQuestion.correctAnswer
      : currentQuestion.answer;
    
    // טיפול כללי בתרגילי השלמה
    const missingConversion = convertMissingNumberEquation(op, p.kind, p);
    if (missingConversion) {
      effectiveOp = missingConversion.effectiveOp;
      top = missingConversion.top;
      bottom = missingConversion.bottom;
    }
    // טיפול במספר שלילי בחיבור (רק אם זה לא תרגיל השלמה)
    else if (op === "addition" && typeof bottom === "number" && bottom < 0) {
      effectiveOp = "subtraction";
      bottom = Math.abs(bottom);
    }
    
    if ((effectiveOp === "addition" || effectiveOp === "subtraction") && 
        typeof top === "number" && typeof bottom === "number") {
      return buildAdditionOrSubtractionAnimation(top, bottom, answer, effectiveOp);
    }
    
    return null;
  }, [showSolution, currentQuestion]);

  // אנימציה אוטומטית - עם ניקוי תקין של timeouts
  useEffect(() => {
    // ניקוי כל ה-timeouts הקודמים
    animationTimeoutsRef.current.forEach(clearTimeout);
    animationTimeoutsRef.current = [];
    
    if (!showSolution || !autoPlay || !animationSteps) return;
    if (animationStep >= animationSteps.length - 1) return;

    const id = setTimeout(() => {
      setAnimationStep((s) => s + 1);
    }, 2000); // 2 שניות בין שלבים
    
    animationTimeoutsRef.current.push(id);

    return () => {
      animationTimeoutsRef.current.forEach(clearTimeout);
      animationTimeoutsRef.current = [];
    };
  }, [showSolution, autoPlay, animationStep, animationSteps]);

  // איפוס צעד האנימציה כשפותחים את המודל או כשהשאלה משתנה
  useEffect(() => {
    // ניקוי timeouts כשסוגרים את המודל או משנים שאלה
    animationTimeoutsRef.current.forEach(clearTimeout);
    animationTimeoutsRef.current = [];
    
    if (showSolution && animationSteps && animationSteps.length > 0) {
      setAnimationStep(0);
      setAutoPlay(true);
    } else if (showSolution && (!animationSteps || animationSteps.length === 0)) {
      // אם אין אנימציה, נאפס את הצעד
      setAnimationStep(0);
    } else if (!showSolution) {
      // כשסוגרים את המודל - ניקוי מלא
      setAnimationStep(0);
      setAutoPlay(true);
    }
    
    // cleanup כשסוגרים את המודל או משנים שאלה
    return () => {
      animationTimeoutsRef.current.forEach(clearTimeout);
      animationTimeoutsRef.current = [];
    };
  }, [showSolution, animationSteps, currentQuestion]);

  // הסבר לטעות אחרונה
  const [errorExplanation, setErrorExplanation] = useState("");

  // תרגול ממוקד (רק במצב Practice)
  const [practiceFocus, setPracticeFocus] = useState("default"); // default | add_to_20 | times_6_8

  // מצב story questions
  const [useStoryQuestions, setUseStoryQuestions] = useState(false);
  const [storyOnly, setStoryOnly] = useState(false); // שאלות מילוליות בלבד

  // בחירת פעולות למיקס
  const [showMixedSelector, setShowMixedSelector] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
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

  // בדיקה אם זה יום חדש לתחרות יומית - רק פעם אחת בטעינה
  useEffect(() => {
    const today = new Date().toDateString();
    setDailyChallenge((prev) => {
      if (prev.date !== today) {
        return { date: today, bestScore: 0, questions: 0 };
    }
      return prev;
    });
  }, []); // רק פעם אחת בטעינה

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

  // Dynamic layout calculation - optimized to prevent performance issues
  useEffect(() => {
    if (!wrapRef.current || !mounted) return;
    
    let resizeTimer = null;
    const calc = () => {
      // Debounce resize events to prevent excessive recalculations
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const rootH = window.innerHeight; // Use innerHeight instead of visualViewport
      const headH = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty("--head-h", headH + "px");

      const controlsH = controlsRef.current?.offsetHeight || 40;
        const used = headH + controlsH + 120 + 40;
      const freeH = Math.max(300, rootH - used);
      document.documentElement.style.setProperty("--game-h", freeH + "px");
      }, 150); // Debounce 150ms
    };
    
    // Initial calculation
    const timer = setTimeout(calc, 100);
    
    // Only listen to window resize, not visualViewport (causes too many events)
    window.addEventListener("resize", calc, { passive: true });
    
    return () => {
      clearTimeout(timer);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", calc);
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
    const levelConfig = getLevelConfig(gradeNumber, level);
    if (!levelConfig) {
      console.error("Invalid level config for grade", gradeNumber, "level", level);
      return;
    }

    let question;
    let attempts = 0;
    const maxAttempts = 50; // מקסימום ניסיונות למצוא שאלה חדשה

    const supportsWordProblems = GRADES[grade].operations.includes("word_problems");

    // ✅ התאמה לפי מצב תרגול ממוקד (Practice)
    let operationForState = operation;
    const levelConfigCopy = { ...levelConfig }; // עותק כדי לא לשנות את המקורי

    if (mode === "practice") {
      if (practiceFocus === "add_to_20") {
        // תרגול חיבור עד 20 – מתאים בעיקר לקטנים
        operationForState = "addition";
        if (levelConfigCopy.addition) {
          levelConfigCopy.addition = {
            ...levelConfigCopy.addition,
            max: Math.min(levelConfigCopy.addition.max || 20, 20),
          };
        }
      } else if (practiceFocus === "times_6_8") {
        // תרגול טבלת כפל 6–8
        operationForState = "multiplication";
        if (levelConfigCopy.multiplication) {
          // מבטיחים שהטווח יכלול לפחות 8
          levelConfigCopy.multiplication = {
            ...levelConfigCopy.multiplication,
            max: Math.max(levelConfigCopy.multiplication.max || 8, 8),
          };
        }
      }
    }

    // עותק מקומי של recentQuestions כדי לא לעדכן state בתוך הלולאה
    const localRecentQuestions = new Set(recentQuestions);

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
        levelConfigCopy,
        opForQuestion,
        grade,
        opForQuestion === "mixed" ? mixedOperations : null
      );
      attempts++;

      // יצירת מפתח ייחודי לשאלה
      const questionKey = question.question;

      // אם השאלה לא הייתה לאחרונה, נשתמש בה
      if (!localRecentQuestions.has(questionKey)) {
        localRecentQuestions.add(questionKey);
        // שמירה רק על 60 שאלות אחרונות
        if (localRecentQuestions.size > 60) {
          const first = Array.from(localRecentQuestions)[0];
          localRecentQuestions.delete(first);
        }
        break;
      }
    } while (attempts < maxAttempts);

    // עדכון state רק פעם אחת אחרי הלולאה
    if (attempts >= maxAttempts) {
      console.warn(`Too many attempts (${attempts}) to generate new question, resetting recent questions`);
      // איפוס ההיסטוריה כדי לאפשר שאלות חוזרות
      setRecentQuestions(new Set());
    } else {
      setRecentQuestions(localRecentQuestions);
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
            className="grid grid-cols-7 gap-0.5 mb-1 w-full max-w-md"
          >
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">ניקוד</div>
              <div className="text-sm font-bold text-emerald-400 leading-tight">{score}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">רצף</div>
              <div className="text-sm font-bold text-amber-400 leading-tight">🔥{streak}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">כוכבים</div>
              <div className="text-sm font-bold text-yellow-400 leading-tight">⭐{stars}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">רמה</div>
              <div className="text-sm font-bold text-purple-400 leading-tight">Lv.{playerLevel}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">✅</div>
              <div className="text-sm font-bold text-green-400 leading-tight">{correct}</div>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px]">
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">חיים</div>
              <div className="text-sm font-bold text-rose-400 leading-tight">
                {mode === "challenge" ? `${lives} ❤️` : "∞"}
              </div>
            </div>
            <div
              className={`rounded-lg py-1.5 px-0.5 text-center flex flex-col justify-center min-h-[50px] ${
                gameActive && (mode === "challenge" || mode === "speed") && timeLeft <= 5
                  ? "bg-red-500/30 border-2 border-red-400 animate-pulse"
                  : "bg-black/30 border border-white/10"
              }`}
            >
              <div className="text-[9px] text-white/60 leading-tight mb-0.5">⏰ טיימר</div>
              <div
                className={`text-sm font-black leading-tight ${
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
                  value={gradeNumber}
                  onChange={(e) => {
                    const newGradeNum = Number(e.target.value);
                    setGradeNumber(newGradeNum);
                    // עדכן גם את grade לפי gradeNumber
                    if (newGradeNum <= 2) {
                      setGrade("g1_2");
                    } else if (newGradeNum <= 4) {
                      setGrade("g3_4");
                    } else {
                      setGrade("g5_6");
                    }
                    setGameActive(false);
                  }}
                  className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>
                      {`כיתה ${["א","ב","ג","ד","ה","ו"][g - 1]}`}
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

              {/* כפתור "איך לומדים חשבון כאן?" */}
              <div className="mb-2 w-full max-w-md flex justify-center">
                <button
                  onClick={() => setShowHowTo(true)}
                  className="px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  ❓ איך לומדים חשבון כאן?
                </button>
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
                        {mode === "learning" && (
                          <button
                            onClick={() => setShowSolution((prev) => !prev)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/80 hover:bg-emerald-500 text-white"
                          >
                            📖 הסבר צעד־אחר־צעד
                          </button>
                        )}
                  </div>

                  {/* כפתור חיבור לטבלת כפל/חילוק – רק במצב למידה */}
                  {mode === "learning" &&
                    (currentQuestion.operation === "multiplication" ||
                      currentQuestion.operation === "division") && (
                          <div className="flex justify-center">
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
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/80 hover:bg-blue-500 text-white"
                      >
                              📊 הצג בטבלה
                      </button>
                          </div>
                        )}

                      {/* תיבת רמז */}
                      {showHint && hintText && (
                        <div className="w-full max-w-md mx-auto bg-blue-500/10 border border-blue-400/50 rounded-lg p-2 text-right">
                          <div className="text-[11px] text-blue-300 mb-1">רמז</div>
                          <div className="text-xs text-blue-100 leading-relaxed">{hintText}</div>
                        </div>
                      )}

                      {/* חלון הסבר מלא - Modal גדול ומרכזי - רק במצב למידה */}
                      {mode === "learning" && showSolution && currentQuestion && (() => {
                        const p = currentQuestion.params || {};
                        const op = currentQuestion.operation;
                        let effectiveOp = op;
                        let aEff = p.a ?? currentQuestion.a;
                        let bEff = p.b ?? currentQuestion.b;
                        
                        // טיפול כללי בתרגילי השלמה
                        const missingConversion = convertMissingNumberEquation(op, p.kind, p);
                        if (missingConversion) {
                          effectiveOp = missingConversion.effectiveOp;
                          aEff = missingConversion.top;
                          bEff = missingConversion.bottom;
                        }
                        // טיפול במספר שלילי בחיבור (רק אם זה לא תרגיל השלמה)
                        else if (op === "addition" && typeof bEff === "number" && bEff < 0) {
                          effectiveOp = "subtraction";
                          bEff = Math.abs(bEff);
                        }
                        
                        const answer = currentQuestion.correctAnswer !== undefined
                          ? currentQuestion.correctAnswer
                          : currentQuestion.answer;
                        
                        const hasAnimation = (effectiveOp === "addition" || effectiveOp === "subtraction") && 
                                            typeof aEff === "number" && typeof bEff === "number";
                        
                        if (!hasAnimation) {
                          // חזרה למודל הישן אם אין אנימציה
                          const info = stepExplanation;
                          if (!info) return null;
                          
                          return (
                            <div
                              className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center px-4"
                              onClick={() => setShowSolution(false)}
                            >
                              <div
                                className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl w-[390px] h-[450px] shadow-2xl flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                                style={{ maxWidth: "90vw", maxHeight: "90vh" }}
                              >
                                {/* כותרת - קבועה */}
                                <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
                                  <h3 className="text-lg font-bold text-emerald-100" dir="rtl">
                                    {"\u200Fאיך פותרים את התרגיל?"}
                                  </h3>
                                  <button
                                    onClick={() => setShowSolution(false)}
                                    className="text-emerald-200 hover:text-white text-xl leading-none px-2"
                                  >
                                    ✖
                                  </button>
                                </div>
                                
                                {/* תוכן - גלילה */}
                                <div className="flex-1 overflow-y-auto px-4 pb-2 text-sm text-emerald-50" dir="rtl">
                                  <div
                                    className="mb-2 font-semibold text-base text-center text-white"
                                    style={{ direction: "ltr", unicodeBidi: "plaintext" }}
                                  >
                                    {info.exercise || currentQuestion.exerciseText || currentQuestion.question}
                                  </div>
                                  {info.vertical && (
                                    <div className="mb-3 rounded-lg bg-emerald-900/50 px-3 py-2">
                                      <pre
                                        dir="ltr"
                                        className="text-center font-mono text-base leading-relaxed whitespace-pre text-emerald-100"
                                      >
                                        {info.vertical}
                                      </pre>
                                    </div>
                                  )}
                                  <div className="space-y-1.5 text-sm" style={{ direction: "rtl", unicodeBidi: "plaintext" }}>
                                    {info.steps.map((step, idx) => (
                                      <div key={idx} className="text-emerald-50 leading-relaxed">
                                        {step}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* כפתורים - קבועים בתחתית */}
                                <div className="p-4 pt-2 flex justify-center flex-shrink-0 border-t border-emerald-400/20">
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
                          );
                        }
                        
                        // מודל עם אנימציה
                        if (!animationSteps || !Array.isArray(animationSteps) || animationSteps.length === 0) {
                          return null;
                        }
                        
                        // וודא ש-animationStep בטווח תקין
                        const safeStepIndex = Math.max(0, Math.min(animationStep || 0, animationSteps.length - 1));
                        const activeStep = animationSteps[safeStepIndex];
                        
                        if (!activeStep || !activeStep.highlights || !Array.isArray(activeStep.highlights)) {
                          return null;
                        }
                        
                        // פונקציה לפיצול ספרות עם padding
                        const splitDigits = (num, minLength = 1) => {
                          const s = String(Math.abs(num)).padStart(minLength, " ");
                          return s.split("");
                        };
                        
                        const maxLen = Math.max(
                          String(aEff).length,
                          String(bEff).length,
                          answer != null ? String(answer).length : 0
                        );
                        
                        const aDigits = splitDigits(aEff, maxLen);
                        const bDigits = splitDigits(bEff, maxLen);
                        const resDigitsFull = answer != null ? splitDigits(answer, maxLen) : Array(maxLen).fill(" ");
                        
                        // חישוב כמה ספרות לחשוף לפי הצעד הנוכחי
                        const revealCount = (activeStep && typeof activeStep.revealDigits === "number") 
                          ? activeStep.revealDigits 
                          : 0;
                        
                        // יצירת מערך ספרות תוצאה חלקי - רק הספרות החשופות
                        const visibleResultDigits = resDigitsFull.map((d, idx) => {
                          const fromRight = maxLen - 1 - idx; // 0 = ספרת אחדות (מימין)
                          if (fromRight < revealCount) {
                            return d.trim() || "\u00A0";
                          }
                          // ספרות לא חשופות - רווח
                          return "\u00A0";
                        });
                        
                        const isHighlighted = (key) => {
                          if (!activeStep || !activeStep.highlights || !Array.isArray(activeStep.highlights)) {
                            return false;
                          }
                          return activeStep.highlights.includes(key);
                        };
                        
                        return (
                          <div
                            className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center px-4"
                            onClick={() => setShowSolution(false)}
                          >
                            <div
                              className="bg-gradient-to-br from-emerald-950 to-emerald-900 border border-emerald-400/60 rounded-2xl w-[390px] h-[450px] shadow-2xl flex flex-col"
                              onClick={(e) => e.stopPropagation()}
                              style={{ maxWidth: "90vw", maxHeight: "90vh" }}
                            >
                              {/* כותרת - קבועה */}
                              <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
                                <h3 className="text-lg font-bold text-emerald-100" dir="rtl">
                                  {"\u200Fאיך פותרים את התרגיל?"}
                                </h3>
                                <button
                                  onClick={() => setShowSolution(false)}
                                  className="text-emerald-200 hover:text-white text-xl leading-none px-2"
                                >
                                  ✖
                                </button>
                              </div>
                              
                              {/* תוכן - גלילה */}
                              <div className="flex-1 overflow-y-auto px-4 pb-2">
                                {/* תצוגת התרגיל המאונך עם הדגשות - טבלה */}
                                <div className="mb-4 flex flex-col items-center font-mono text-2xl leading-[1.8]" style={{ direction: "ltr" }}>
                                  {/* שורה 1 – המספר הראשון (תא ריק במקום סימן הפעולה) */}
                                  <div 
                                    className="grid gap-x-1 mb-1"
                                    style={{ 
                                      gridTemplateColumns: `auto repeat(${maxLen}, 1.5ch)`
                                    }}
                                  >
                                    <span className="w-4" /> {/* תא ריק במקום סימן הפעולה */}
                                    {aDigits.map((d, idx) => {
                                      const pos = maxLen - idx - 1; // מיקום מהסוף (0 = אחדות, 1 = עשרות וכו')
                                      const highlightKey = pos === 0 ? "Units" : pos === 1 ? "Tens" : "Hundreds";
                                      const shouldHighlight = isHighlighted("aAll") || 
                                                            (pos === 0 && isHighlighted("aUnits")) ||
                                                            (pos === 1 && isHighlighted("aTens")) ||
                                                            (pos === 2 && isHighlighted("aHundreds"));
                                      return (
                                        <span
                                          key={`a-${idx}`}
                                          className={`text-center font-bold ${
                                            shouldHighlight ? "bg-yellow-500/30 rounded px-1 animate-pulse" : ""
                                          }`}
                                        >
                                          {d.trim() || "\u00A0"}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* שורה 2 – סימן הפעולה והמספר השני */}
                                  <div 
                                    className="grid gap-x-1 mb-1"
                                    style={{ 
                                      gridTemplateColumns: `auto repeat(${maxLen}, 1.5ch)`
                                    }}
                                  >
                                    <span className="w-4 text-center text-2xl font-bold">
                                      {effectiveOp === "addition" ? "+" : "−"}
                                    </span>
                                    {bDigits.map((d, idx) => {
                                      const pos = maxLen - idx - 1;
                                      const highlightKey = pos === 0 ? "Units" : pos === 1 ? "Tens" : "Hundreds";
                                      const shouldHighlight = isHighlighted("bAll") || 
                                                            (pos === 0 && isHighlighted("bUnits")) ||
                                                            (pos === 1 && isHighlighted("bTens")) ||
                                                            (pos === 2 && isHighlighted("bHundreds"));
                                      return (
                                        <span
                                          key={`b-${idx}`}
                                          className={`text-center font-bold ${
                                            shouldHighlight ? "bg-yellow-500/30 rounded px-1 animate-pulse" : ""
                                          }`}
                                        >
                                          {d.trim() || "\u00A0"}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* קו תחתון */}
                                  <div 
                                    className="h-[2px] bg-white my-2"
                                    style={{ width: `${(maxLen + 1) * 1.5}ch` }}
                                  />
                                  
                                  {/* שורה 3 – התוצאה (חשיפה הדרגתית) */}
                                  <div 
                                    className="grid gap-x-1"
                                    style={{ 
                                      gridTemplateColumns: `auto repeat(${maxLen}, 1.5ch)`
                                    }}
                                  >
                                    <span className="w-4" /> {/* תא ריק */}
                                    {visibleResultDigits.map((d, idx) => {
                                      const pos = maxLen - idx - 1;
                                      const fromRight = pos; // 0 = אחדות, 1 = עשרות וכו'
                                      const isVisible = fromRight < revealCount;
                                      const highlightKey = pos === 0 ? "Units" : pos === 1 ? "Tens" : "Hundreds";
                                      const shouldHighlight = isVisible && (
                                        isHighlighted("resultAll") || 
                                        (pos === 0 && isHighlighted("resultUnits")) ||
                                        (pos === 1 && isHighlighted("resultTens")) ||
                                        (pos === 2 && isHighlighted("resultHundreds"))
                                      );
                                      return (
                                        <span
                                          key={`r-${idx}`}
                                          className={`text-center font-bold ${
                                            shouldHighlight ? "bg-yellow-500/30 rounded px-1 animate-pulse" : ""
                                          }`}
                                        >
                                          {d}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                                
                                {/* טקסט ההסבר */}
                                <div className="mb-4 text-sm text-emerald-50" dir="rtl">
                                  <h4 className="font-bold text-base mb-1">{activeStep.title}</h4>
                                  <p className="leading-relaxed">{activeStep.text}</p>
                                </div>
                              </div>
                              
                              {/* כפתורים ואינדיקטור - קבועים בתחתית */}
                              <div className="p-4 pt-2 flex flex-col gap-2 flex-shrink-0 border-t border-emerald-400/20">
                                {/* שליטה באנימציה */}
                                <div className="flex gap-2 justify-center items-center">
                                  <button
                                    onClick={() => setAnimationStep((s) => (s < animationSteps.length - 1 ? s + 1 : s))}
                                    disabled={animationStep >= animationSteps.length - 1}
                                    className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                  >
                                    הבא
                                  </button>
                                  <button
                                    onClick={() => setAutoPlay((p) => !p)}
                                    className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-sm font-bold"
                                  >
                                    {autoPlay ? "עצור" : "נגן"}
                                  </button>
                                  <button
                                    onClick={() => setAnimationStep((s) => (s > 0 ? s - 1 : 0))}
                                    disabled={animationStep === 0}
                                    className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                    dir="rtl"
                                  >
                                    {"\u200Fקודם"}
                                  </button>
                                </div>
                                
                                {/* אינדיקטור צעדים */}
                                <div className="text-center text-xs text-emerald-300">
                                  צעד {animationStep + 1} מתוך {animationSteps.length}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

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

          {showHowTo && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[180] p-4"
              onClick={() => setShowHowTo(false)}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-emerald-400/60 rounded-2xl p-4 max-w-md w-full text-sm text-white"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-extrabold mb-2 text-center">
                  📘 איך לומדים חשבון כאן?
                </h2>

                <p className="text-white/80 text-xs mb-3 text-center">
                  המטרה היא לתרגל חשבון בצורה משחקית, עם התאמה לכיתה, פעולה ורמת קושי.
                </p>

                <ul className="list-disc pr-4 space-y-1 text-[13px] text-white/90">
                  <li>בחר כיתה, רמת קושי ופעולה (חיבור, חיסור, כפל, חילוק, שברים, אחוזים ועוד).</li>
                  <li>בחר מצב משחק: למידה, אתגר עם טיימר וחיים, מרוץ מהירות או מרתון.</li>
                  <li>קרא היטב את השאלה – לפעמים יש תרגילי מילים שצריך להבין את הסיפור.</li>
                  <li>לחץ על 💡 Hint כדי לקבל רמז, ועל "📘 הסבר מלא" כדי לראות פתרון צעד־אחר־צעד.</li>
                  <li>ניקוד גבוה, רצף תשובות נכון, כוכבים ו־Badges עוזרים לך לעלות רמה כשחקן.</li>
                </ul>

                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowHowTo(false)}
                    className="px-5 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-sm font-bold"
                  >
                    סגור
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



