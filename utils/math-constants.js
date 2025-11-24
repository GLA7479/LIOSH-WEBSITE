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

export const GRADES = {
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

