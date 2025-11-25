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
  area: { name: "שטח", description: "חישוב שטח", icon: "📐" },
  perimeter: { name: "היקף", description: "חישוב היקף", icon: "📏" },
  volume: { name: "נפח", description: "חישוב נפח", icon: "📦" },
  angles: { name: "זוויות", description: "זוויות", icon: "📐" },
  pythagoras: { name: "פיתגורס", description: "משפט פיתגורס", icon: "🔺" },
  mixed: { name: "ערבוב", description: "ערבוב", icon: "🎲" },
};

// עדכון ל-6 כיתות נפרדות (א', ב', ג', ד', ה', ו')
// בהתאם לתוכנית משרד החינוך
export const GRADES = {
  g1: {
    name: "כיתה א'",
    topics: [], // הנדסה לא נלמדת בכיתה א'
    shapes: [],
  },
  g2: {
    name: "כיתה ב'",
    topics: ["area", "perimeter"], // היכרות בסיסית עם שטח והיקף
    shapes: ["square", "rectangle"],
  },
  g3: {
    name: "כיתה ג'",
    topics: ["area", "perimeter"],
    shapes: ["square", "rectangle", "triangle"],
  },
  g4: {
    name: "כיתה ד'",
    topics: ["area", "perimeter"],
    shapes: ["square", "rectangle", "triangle", "circle"],
  },
  g5: {
    name: "כיתה ה'",
    topics: ["area", "perimeter", "volume", "mixed"],
    shapes: ["square", "rectangle", "triangle", "circle", "parallelogram", "trapezoid"],
  },
  g6: {
    name: "כיתה ו'",
    topics: ["area", "perimeter", "volume", "angles", "pythagoras", "mixed"],
    shapes: ["square", "rectangle", "triangle", "circle", "parallelogram", "trapezoid", "cylinder", "sphere", "cube"],
  },
};

// מיפוי נושאים לצורות לפי כיתה
export const TOPIC_SHAPES = {
  area: {
    g2: ["square", "rectangle"],
    g3: ["square", "rectangle"],
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
    g5: ["rectangular_prism", "cube"],
    g6: ["rectangular_prism", "cube", "cylinder", "sphere"],
  },
  angles: {
    g6: ["triangle"],
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

