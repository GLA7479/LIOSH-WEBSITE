export const BLANK = "__";

export const LEVELS = {
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
export const GRADE_LEVELS = {
  1: {
    name: "כיתה א׳",
    levels: {
      easy: {
        addition: { max: 10 },
        subtraction: { min: 0, max: 10 },
        compare: { max: 10 },
        number_sense: { max: 10 },
        // כיתה א' - אין כפל, חילוק או שברים
      },
      medium: {
        addition: { max: 20 },
        subtraction: { min: 0, max: 20 },
        compare: { max: 20 },
        number_sense: { max: 20 },
        // כיתה א' - אין כפל, חילוק או שברים
      },
      hard: {
        addition: { max: 20 },
        subtraction: { min: 0, max: 20 },
        compare: { max: 20 },
        number_sense: { max: 20 },
        // כיתה א' - אין כפל, חילוק או שברים
      },
    },
  },
  2: {
    name: "כיתה ב׳",
    levels: {
      easy: {
        // חיבור/חיסור עד 50
        addition: { max: 50 },
        subtraction: { min: 0, max: 50 },
        // התחלה רכה של כפל וחילוק – לוח עד 5×5
        multiplication: { max: 5 },
        division: { max: 50, maxDivisor: 5 },
        // אופציונלי – חצי בלבד, להמשך
        fractions: { maxDen: 2 },
        compare: { max: 50 },
        number_sense: { max: 50 },
      },
      medium: {
        // חיבור/חיסור עד 100
        addition: { max: 100 },
        subtraction: { min: 0, max: 100 },
        // לוח כפל מלא עד 10×10
        multiplication: { max: 10 },
        division: { max: 100, maxDivisor: 10 },
        fractions: { maxDen: 4 }, // חצי/רבע אם תרצה להשתמש
        compare: { max: 100 },
        number_sense: { max: 100 },
      },
      hard: {
        addition: { max: 100 },
        subtraction: { min: 0, max: 100 },
        multiplication: { max: 10 },
        division: { max: 100, maxDivisor: 10 },
        fractions: { maxDen: 4 },
        compare: { max: 100 },
        number_sense: { max: 100 },
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
        sequences: { maxStart: 20, maxStep: 3 },
        decimals: { maxBase: 50, places: 1 },
        equations: { max: 200 },
        compare: { max: 200 },
        number_sense: { max: 200 },
      },
      medium: {
        addition: { max: 500 },
        subtraction: { min: 0, max: 500 },
        multiplication: { max: 12 },
        division: { max: 144, maxDivisor: 12 },
        fractions: { maxDen: 6 },
        sequences: { maxStart: 50, maxStep: 9 },
        decimals: { maxBase: 50, places: 1 },
        equations: { max: 500 },
        compare: { max: 500 },
        number_sense: { max: 500 },
      },
      hard: {
        addition: { max: 1000 },
        subtraction: { min: 0, max: 1000 },
        multiplication: { max: 12 },
        division: { max: 200, maxDivisor: 12 },
        fractions: { maxDen: 6 },
        sequences: { maxStart: 50, maxStep: 9 },
        decimals: { maxBase: 50, places: 1 },
        equations: { max: 1000 },
        compare: { max: 1000 },
        number_sense: { max: 1000 },
      },
    },
  },
  4: {
    name: "כיתה ד׳",
    levels: {
      easy: {
        addition: { max: 1000 },
        subtraction: { min: 0, max: 1000 },
        multiplication: { max: 20 },  // עד 20×20 = 400
        division: { max: 200, maxDivisor: 12 },
        fractions: { maxDen: 6 },
        sequences: { maxStart: 100, maxStep: 9 },
        decimals: { maxBase: 100, places: 1 },
        rounding: { maxN: 999, toWhat: 10 },
        equations: { max: 1000 },
        compare: { max: 1000 },
        number_sense: { max: 1000 },
        factors_multiples: { maxNumber: 100 },
      },
      medium: {
        addition: { max: 5000 },
        subtraction: { min: 0, max: 5000 },
        multiplication: { max: 30 },  // עד 30×30 = 900
        division: { max: 500, maxDivisor: 12 },
        fractions: { maxDen: 8 },
        sequences: { maxStart: 200, maxStep: 9 },
        decimals: { maxBase: 200, places: 2 },
        rounding: { maxN: 9999, toWhat: 100 },
        equations: { max: 5000 },
        compare: { max: 5000 },
        number_sense: { max: 5000 },
        factors_multiples: { maxNumber: 200 },
      },
      hard: {
        addition: { max: 10000 },
        subtraction: { min: 0, max: 10000 },
        multiplication: { max: 50 },  // עד 50×50 = 2500
        division: { max: 1000, maxDivisor: 12 },
        fractions: { maxDen: 8 },
        sequences: { maxStart: 200, maxStep: 9 },
        decimals: { maxBase: 200, places: 2 },
        rounding: { maxN: 9999, toWhat: 100 },
        equations: { max: 10000 },
        compare: { max: 10000 },
        number_sense: { max: 10000 },
        factors_multiples: { maxNumber: 500 },
      },
    },
  },
  5: {
    name: "כיתה ה׳",
    levels: {
      easy: {
        addition: { max: 10000 },
        subtraction: { min: 0, max: 10000 },
        multiplication: { max: 50 },  // עד 50×50 = 2500
        division: { max: 1000, maxDivisor: 12 },
        fractions: { maxDen: 8 },
        percentages: { maxBase: 400, maxPercent: 50 },
        sequences: { maxStart: 500, maxStep: 9 },
        decimals: { maxBase: 200, places: 2 },
        rounding: { maxN: 9999, toWhat: 100 },
        equations: { max: 10000 },
        compare: { max: 10000 },
        number_sense: { max: 10000 },
        factors_multiples: { maxNumber: 500 },
        word_problems: { max: 10000 },
      },
      medium: {
        addition: { max: 50000 },
        subtraction: { min: 0, max: 50000 },
        multiplication: { max: 100 },  // עד 100×100 = 10000
        division: { max: 2000, maxDivisor: 12 },
        fractions: { maxDen: 10 },
        percentages: { maxBase: 1000, maxPercent: 50 },
        sequences: { maxStart: 1000, maxStep: 9 },
        decimals: { maxBase: 500, places: 2 },
        rounding: { maxN: 99999, toWhat: 100 },
        equations: { max: 50000 },
        compare: { max: 50000 },
        number_sense: { max: 50000 },
        factors_multiples: { maxNumber: 1000 },
        word_problems: { max: 50000 },
      },
      hard: {
        addition: { max: 100000 },
        subtraction: { min: 0, max: 100000 },
        multiplication: { max: 200 },  // עד 200×200 = 40000
        division: { max: 5000, maxDivisor: 12 },
        fractions: { maxDen: 12 },
        percentages: { maxBase: 2000, maxPercent: 50 },
        sequences: { maxStart: 1000, maxStep: 9 },
        decimals: { maxBase: 1000, places: 2 },
        rounding: { maxN: 99999, toWhat: 100 },
        equations: { max: 100000 },
        compare: { max: 100000 },
        number_sense: { max: 100000 },
        factors_multiples: { maxNumber: 2000 },
        word_problems: { max: 100000 },
      },
    },
  },
  6: {
    name: "כיתה ו׳",
    levels: {
      easy: {
        addition: { max: 50000 },
        subtraction: { min: 0, max: 50000 },
        multiplication: { max: 100 },  // עד 100×100 = 10000
        division: { max: 2000, maxDivisor: 12 },
        fractions: { maxDen: 10 },
        percentages: { maxBase: 1000, maxPercent: 50 },
        sequences: { maxStart: 1000, maxStep: 9 },
        decimals: { maxBase: 500, places: 2 },
        rounding: { maxN: 99999, toWhat: 100 },
        equations: { max: 50000 },
        compare: { max: 50000 },
        number_sense: { max: 50000 },
        factors_multiples: { maxNumber: 1000 },
        word_problems: { max: 50000 },
      },
      medium: {
        addition: { max: 100000 },
        subtraction: { min: 0, max: 100000 },
        multiplication: { max: 200 },  // עד 200×200 = 40000
        division: { max: 10000, maxDivisor: 12 },
        fractions: { maxDen: 12 },
        percentages: { maxBase: 2000, maxPercent: 50 },
        sequences: { maxStart: 2000, maxStep: 9 },
        decimals: { maxBase: 1000, places: 2 },
        rounding: { maxN: 999999, toWhat: 100 },
        equations: { max: 100000 },
        compare: { max: 100000 },
        number_sense: { max: 100000 },
        factors_multiples: { maxNumber: 2000 },
        word_problems: { max: 100000 },
      },
      hard: {
        addition: { max: 200000 },
        subtraction: { min: 0, max: 200000 },
        multiplication: { max: 500 },  // עד 500×500 = 250000
        division: { max: 20000, maxDivisor: 12 },
        fractions: { maxDen: 20 },
        percentages: { maxBase: 5000, maxPercent: 50 },
        sequences: { maxStart: 2000, maxStep: 9 },
        decimals: { maxBase: 2000, places: 2 },
        rounding: { maxN: 999999, toWhat: 100 },
        equations: { max: 200000 },
        compare: { max: 200000 },
        number_sense: { max: 200000 },
        factors_multiples: { maxNumber: 5000 },
        word_problems: { max: 200000 },
      },
    },
  },
};

export const GRADES = {
  g1: {
    name: "כיתה א׳",
    operations: [
      "addition",
      "subtraction",
      "compare",
      "number_sense", // שכנים, זוגי/אי-זוגי, השלמה ל-10, עשרות/יחידות
    ],
    allowFractions: false,
    allowNegatives: false,
  },
  g2: {
    name: "כיתה ב׳",
    operations: [
      "addition",
      "subtraction",
      "multiplication", // לוח כפל עד 10×10
      "division",       // חילוק פשוט לפי לוח הכפל
      "compare",
      "number_sense",
      "mixed",          // תרגילים מעורבים בתחום ה-100
    ],
    allowFractions: false,  // שברים מסודרים מתחילים רשמית מד׳
    allowNegatives: false,
  },
  g3: {
    name: "כיתה ג׳",
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "fractions",     // היכרות עם שבר כחלק משלם
      "sequences",
      "decimals",      // עשרוניים בסיסיים
      "compare",
      "equations",
      "number_sense",
      "mixed",
    ],
    allowFractions: true,
    allowNegatives: false,
  },
  g4: {
    name: "כיתה ד׳",
    operations: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "fractions",      // שברים פשוטים – משמעות והשוואה
      "decimals",
      "sequences",
      "rounding",
      "equations",
      "compare",
      "number_sense",
      "factors_multiples",
      "mixed",
    ],
    allowFractions: true,
    allowNegatives: false,
  },
  g5: {
    name: "כיתה ה׳",
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
  g6: {
    name: "כיתה ו׳",
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

export const OPERATIONS = [
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

export const MODES = {
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

export const STORAGE_KEY = "mleo_math_master";

