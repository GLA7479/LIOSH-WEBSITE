// קבועים לדף ההנדסה

export const LEVELS = {
  easy: {
    name: "קל",
    maxSide: 10,
    decimals: false,
  },
  medium: {
    name: "בינוני",
    maxSide: 20,
    decimals: true,
  },
  hard: {
    name: "קשה",
    maxSide: 50,
    decimals: true,
  },
};

export const PI = 3.14;

export const TOPICS = {
  shapes_basic: { name: "צורות בסיסיות", description: "הכרת מצולעים", icon: "🔷" },
  area: { name: "שטח", description: "חישוב שטח", icon: "📐" },
  perimeter: { name: "היקף", description: "חישוב היקף", icon: "📏" },
  volume: { name: "נפח", description: "חישוב נפח", icon: "📦" },
  angles: { name: "זוויות", description: "זוויות", icon: "📐" },
  parallel_perpendicular: { name: "מקבילות ומאונכות", description: "מקבילות ומאונכות", icon: "📐" },
  triangles: { name: "משולשים", description: "מיון משולשים", icon: "🔺" },
  quadrilaterals: { name: "מרובעים", description: "מיון מרובעים", icon: "⬜" },
  transformations: { name: "טרנספורמציות", description: "הזזה, שיקוף, סיבוב", icon: "🔄" },
  rotation: { name: "סיבוב", description: "סיבוב", icon: "🔄" },
  symmetry: { name: "סימטרייה", description: "סימטרייה", icon: "✨" },
  diagonal: { name: "אלכסון", description: "אלכסון", icon: "📐" },
  heights: { name: "גבהים", description: "גבהים", icon: "📏" },
  tiling: { name: "ריצוף", description: "ריצוף", icon: "🔲" },
  circles: { name: "מעגל ועיגול", description: "מעגל ועיגול", icon: "⭕" },
  solids: { name: "גופים", description: "גופים תלת-מימדיים", icon: "📦" },
  pythagoras: { name: "פיתגורס", description: "משפט פיתגורס", icon: "🔺" },
  mixed: { name: "ערבוב", description: "ערבוב", icon: "🎲" },
};

// עדכון ל-6 כיתות נפרדות (א', ב', ג', ד', ה', ו')
// בהתאם לתוכנית משרד החינוך
export const GRADES = {
  g1: {
    name: "כיתה א'",
    topics: ["shapes_basic", "transformations"], // הכרת מצולעים, הזזה/שיקוף
    shapes: ["square", "rectangle"],
  },
  g2: {
    name: "כיתה ב'",
    topics: ["area", "perimeter", "solids", "transformations"], // שטח, היקף, גופים, שיקוף/הזזה
    shapes: ["square", "rectangle", "cube", "rectangular_prism", "cylinder", "pyramid", "cone", "sphere"],
  },
  g3: {
    name: "כיתה ג'",
    topics: ["area", "perimeter", "angles", "parallel_perpendicular", "triangles", "quadrilaterals", "rotation"], // שטח, היקף, זוויות, מקבילות/מאונכות, משולשים, מרובעים, סיבוב
    shapes: ["triangle", "square", "rectangle"],
  },
  g4: {
    name: "כיתה ד'",
    topics: ["area", "perimeter", "diagonal", "symmetry", "volume", "shapes_basic"], // שטח, היקף, אלכסון, סימטרייה, נפח תיבות, ריבוע ומלבן (תכונות)
    shapes: ["square", "rectangle", "triangle", "circle", "rectangular_prism", "cube"],
  },
  g5: {
    name: "כיתה ה'",
    topics: ["area", "perimeter", "volume", "angles", "parallel_perpendicular", "quadrilaterals", "heights", "tiling", "mixed"], // שטח, היקף, נפח, זוויות, מקבילות/מאונכות, מרובעים, גבהים, ריצוף, ערבוב
    shapes: ["square", "rectangle", "triangle", "circle", "parallelogram", "trapezoid", "rectangular_prism", "cube"],
  },
  g6: {
    name: "כיתה ו'",
    topics: ["area", "perimeter", "volume", "angles", "pythagoras", "circles", "solids", "mixed"], // שטח, היקף, נפח, זוויות, פיתגורס, מעגל, גופים, ערבוב
    shapes: ["square", "rectangle", "triangle", "circle", "parallelogram", "trapezoid", "cylinder", "sphere", "cube", "rectangular_prism", "pyramid", "cone", "prism"],
  },
};

// מיפוי נושאים לצורות לפי כיתה
export const TOPIC_SHAPES = {
  shapes_basic: {
    g1: ["square", "rectangle"], // הכרת מצולעים - כיתה א'
    g4: ["square", "rectangle"], // ריבוע ומלבן (תכונות) - כיתה ד'
  },
  area: {
    g2: ["square", "rectangle"],
    g3: ["square", "rectangle", "triangle"], // כיתה ג' - מתווסף משולש
    g4: ["square", "rectangle", "triangle"],
    g5: ["square", "rectangle", "triangle", "parallelogram", "trapezoid"],
    g6: ["square", "rectangle", "triangle", "parallelogram", "trapezoid", "circle"],
  },
  perimeter: {
    g2: ["square", "rectangle"],
    g3: ["square", "rectangle", "triangle"],
    g4: ["square", "rectangle", "triangle"],
    g5: ["square", "rectangle", "triangle"],
    g6: ["square", "rectangle", "triangle", "circle"],
  },
  volume: {
    g4: ["rectangular_prism", "cube"], // תיבות - כיתה ד'
    g5: ["rectangular_prism", "cube"],
    g6: ["rectangular_prism", "cube", "cylinder", "sphere", "pyramid", "cone", "prism"], // כיתה ו' - כולל מנסרה
  },
  angles: {
    g3: ["triangle", "quadrilateral"],
    g5: ["triangle", "quadrilateral"],
    g6: ["triangle"],
  },
  parallel_perpendicular: {
    g3: ["square", "rectangle", "quadrilateral"],
    g5: ["square", "rectangle", "parallelogram", "trapezoid"],
  },
  triangles: {
    g3: ["triangle"],
  },
  quadrilaterals: {
    g3: ["square", "rectangle", "quadrilateral"],
    g5: ["square", "rectangle", "parallelogram", "trapezoid"],
  },
  transformations: {
    g1: ["square", "rectangle"],
    g2: ["square", "rectangle"],
  },
  rotation: {
    g3: ["square", "rectangle", "triangle"],
  },
  symmetry: {
    g4: ["square", "rectangle", "triangle"],
  },
  diagonal: {
    g4: ["square", "rectangle"], // אלכסון - כיתה ד'
    g5: ["square", "rectangle", "parallelogram"], // אלכסון - כיתה ה'
  },
  heights: {
    g5: ["triangle", "parallelogram", "trapezoid"],
  },
  tiling: {
    g5: ["square", "triangle"], // ריצוף במצולעים משוכללים - כיתה ה'
  },
  circles: {
    g6: ["circle"],
  },
  solids: {
    g2: ["cube", "rectangular_prism", "cylinder", "pyramid", "cone", "sphere"], // גופים - כיתה ב'
    g6: ["cube", "rectangular_prism", "cylinder", "pyramid", "cone", "sphere"], // גופים משוכללים - כיתה ו'
  },
  pythagoras: {
    g6: ["triangle"],
  },
};

export function getShapesForTopic(gradeKey, topicKey) {
  const cfg = TOPIC_SHAPES[topicKey];
  if (cfg && cfg[gradeKey] && cfg[gradeKey].length > 0) {
    return cfg[gradeKey];
  }
  // אם אין הגדרה ספציפית, נחזיר את הצורות הכלליות של הכיתה
  return GRADES[gradeKey]?.shapes || [];
}

export const MODES = {
  learning: { name: "למידה", description: "ללא סיום משחק, תרגול בקצב שלך" },
  challenge: { name: "אתגר", description: "טיימר + חיים, מרוץ ניקוד גבוה" },
  speed: { name: "מרוץ מהירות", description: "תשובות מהירות = יותר נקודות! ⚡" },
  marathon: { name: "מרתון", description: "כמה שאלות תוכל לפתור? 🏃" },
  practice: { name: "תרגול", description: "התמקד בנושא אחד 📚" },
};

export const STORAGE_KEY = "mleo_geometry_master";

