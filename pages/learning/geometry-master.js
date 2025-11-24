import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { useRouter } from "next/router";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";

const LEVELS = {
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

const PI = 3.14;

const TOPICS = {
  area: { name: "שטח", description: "חישוב שטח", icon: "📐" },
  perimeter: { name: "היקף", description: "חישוב היקף", icon: "📏" },
  volume: { name: "נפח", description: "חישוב נפח", icon: "📦" },
  angles: { name: "זוויות", description: "זוויות", icon: "📐" },
  pythagoras: { name: "פיתגורס", description: "משפט פיתגורס", icon: "🔺" },
  mixed: { name: "ערבוב", description: "ערבוב", icon: "🎲" },
};

const GRADES = {
  g3_4: {
    name: "כיתות ג–ד",
    topics: ["area", "perimeter"],
    shapes: ["square", "rectangle", "circle", "triangle"],
  },
  g5_6: {
    name: "כיתות ה–ו",
    topics: ["area", "perimeter", "volume", "mixed"],
    shapes: ["square", "rectangle", "circle", "triangle", "parallelogram", "trapezoid"],
  },
  g7_8: {
    name: "כיתות ז–ח",
    topics: ["area", "perimeter", "volume", "angles", "pythagoras", "mixed"],
    shapes: ["square", "rectangle", "circle", "triangle", "parallelogram", "trapezoid", "cylinder", "sphere", "cube"],
  },
};

const TOPIC_SHAPES = {
  area: {
    g3_4: ["square", "rectangle"],
    g5_6: ["square", "rectangle", "triangle"],
    g7_8: ["square", "rectangle", "triangle", "parallelogram", "trapezoid", "circle"],
  },
  perimeter: {
    g3_4: ["square", "rectangle", "triangle"],
    g5_6: ["square", "rectangle", "triangle"],
    g7_8: ["square", "rectangle", "triangle", "circle"],
  },
  volume: {
    g5_6: ["rectangular_prism", "cube"],
    g7_8: ["rectangular_prism", "cube", "cylinder", "sphere"],
  },
  angles: {
    g7_8: ["triangle"],
  },
  pythagoras: {
    g7_8: ["triangle"],
  },
};

function getShapesForTopic(gradeKey, topicKey) {
  const cfg = TOPIC_SHAPES[topicKey];
  if (cfg && cfg[gradeKey] && cfg[gradeKey].length > 0) {
    return cfg[gradeKey];
  }
  return GRADES[gradeKey].shapes;
}

const MODES = {
  learning: { name: "למידה", description: "ללא סיום משחק, תרגול בקצב שלך" },
  challenge: { name: "אתגר", description: "טיימר + חיים, מרוץ ניקוד גבוה" },
  speed: { name: "מרוץ מהירות", description: "תשובות מהירות = יותר נקודות! ⚡" },
  marathon: { name: "מרתון", description: "כמה שאלות תוכל לפתור? 🏃" },
};

const STORAGE_KEY = "mleo_geometry_master";

function getLevelForGrade(levelKey, gradeKey) {
  const base = LEVELS[levelKey];
  let factor = 1;

  switch (gradeKey) {
    case "g3_4":
      factor = 0.5;
      break;
    case "g5_6":
      factor = 1;
      break;
    case "g7_8":
      factor = 2;
      break;
    default:
      factor = 1;
  }

  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));

  let decimals = base.decimals;
  if (gradeKey === "g3_4") {
    decimals = false;
  }

  return {
    name: base.name,
    maxSide: clamp(Math.round(base.maxSide * factor), 5, 100),
    decimals,
  };
}

function buildTop10ByScore(saved, level) {
  const allScores = [];
  Object.keys(TOPICS).forEach((topic) => {
    const key = `${level}_${topic}`;
    const levelData = saved[key] || [];
    if (Array.isArray(levelData)) {
      levelData.forEach((entry) => {
        const bestScore = entry.bestScore ?? entry.score ?? 0;
        const bestStreak = entry.bestStreak ?? entry.streak ?? 0;
        if (bestScore > 0) {
          allScores.push({
            name: entry.playerName || entry.name || "Player",
            bestScore,
            bestStreak,
            topic,
            timestamp: entry.timestamp || 0,
          });
        }
      });
    } else {
      Object.entries(levelData).forEach(([name, data]) => {
        const bestScore = data.bestScore ?? data.score ?? 0;
        const bestStreak = data.bestStreak ?? data.streak ?? 0;
        if (bestScore > 0) {
          allScores.push({
            name,
            bestScore,
            bestStreak,
            topic,
            timestamp: data.timestamp || 0,
          });
        }
      });
    }
  });
  const sorted = allScores
    .sort((a, b) => {
      if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
      if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
      return (b.timestamp || 0) - (a.timestamp || 0);
    })
    .slice(0, 10);
  while (sorted.length < 10) {
    sorted.push({
      name: "-",
      bestScore: 0,
      bestStreak: 0,
      topic: "",
      timestamp: 0,
      placeholder: true,
    });
  }
  return sorted;
}

function saveScoreEntry(saved, key, entry) {
  let levelData = saved[key];
  if (!levelData) {
    levelData = [];
  } else if (!Array.isArray(levelData)) {
    levelData = Object.entries(levelData).map(([name, data]) => ({
      playerName: name,
      bestScore: data.bestScore ?? data.score ?? 0,
      bestStreak: data.bestStreak ?? data.streak ?? 0,
      timestamp: data.timestamp || 0,
    }));
  }
  levelData.push(entry);
  if (levelData.length > 100) {
    levelData = levelData.slice(-100);
  }
  saved[key] = levelData;
}

function generateQuestion(level, topic, gradeKey, mixedOps = null) {
  const isMixed = topic === "mixed";

  let selectedTopic;
  if (isMixed) {
    let availableTopics;
    if (mixedOps) {
      availableTopics = Object.entries(mixedOps)
        .filter(([t, selected]) => selected && t !== "mixed")
        .map(([t]) => t);
    } else {
      availableTopics = GRADES[gradeKey].topics.filter((t) => t !== "mixed");
    }
    if (!availableTopics || availableTopics.length === 0) {
      availableTopics = GRADES[gradeKey].topics.filter((t) => t !== "mixed");
    }
    selectedTopic =
      availableTopics[Math.floor(Math.random() * availableTopics.length)];
  } else {
    selectedTopic = topic;
  }

  const availableShapes = getShapesForTopic(gradeKey, selectedTopic);
  const shape =
    availableShapes.length > 0
      ? availableShapes[Math.floor(Math.random() * availableShapes.length)]
      : null;

  let question;
  let correctAnswer;
  let params = {};

  const roundTo = level.decimals ? 2 : 0;
  const round = (num) =>
    Math.round(num * Math.pow(10, roundTo)) / Math.pow(10, roundTo);

  // לאפשר תרגילי מילים בעיקר לכיתות גבוהות יותר
  const allowStory = gradeKey === "g5_6" || gradeKey === "g7_8";

  switch (selectedTopic) {
    // ===================== AREA =====================
    case "area": {
      switch (shape) {
        case "square": {
          const side = Math.floor(Math.random() * level.maxSide) + 1;
          const useStory = allowStory && Math.random() < 0.4;

          params = { side, kind: useStory ? "story_square_area" : "square_area" };
          correctAnswer = round(side * side);

          if (useStory) {
            question = `לליאו יש גינה בצורת ריבוע, אורך כל צלע הוא ${side} מטר. כמה מטרים רבועים שטח הגינה?`;
          } else {
            question = `מה השטח של ריבוע עם צלע ${side}?`;
          }
          break;
        }

        case "rectangle": {
          const length = Math.floor(Math.random() * level.maxSide) + 1;
          const width = Math.floor(Math.random() * level.maxSide) + 1;
          const useStory = allowStory && Math.random() < 0.5;

          params = {
            length,
            width,
            kind: useStory ? "story_rectangle_area" : "rectangle_area",
          };
          correctAnswer = round(length * width);

          if (useStory) {
            question = `רצפת חדר של ליאו היא מלבן באורך ${length} מטר וברוחב ${width} מטר. מה שטח הרצפה במטרים רבועים?`;
          } else {
            question = `מה השטח של מלבן עם אורך ${length} ורוחב ${width}?`;
          }
          break;
        }

        case "triangle": {
          const base = Math.floor(Math.random() * level.maxSide) + 1;
          const height = Math.floor(Math.random() * level.maxSide) + 1;
          const useStory = allowStory && Math.random() < 0.3;

          params = {
            base,
            height,
            kind: useStory ? "story_triangle_area" : "triangle_area",
          };
          correctAnswer = round((base * height) / 2);

          if (useStory) {
            question = `גג של בית הוא משולש עם בסיס ${base} מטר וגובה ${height} מטר. מה שטח הגג בצד אחד?`;
          } else {
            question = `מה השטח של משולש עם בסיס ${base} וגובה ${height}?`;
          }
          break;
        }

        case "parallelogram": {
          const base = Math.floor(Math.random() * level.maxSide) + 1;
          const height = Math.floor(Math.random() * level.maxSide) + 1;
          params = { base, height, kind: "parallelogram_area" };
          correctAnswer = round(base * height);
          question = `מה השטח של מקבילית עם בסיס ${base} וגובה ${height}?`;
          break;
        }

        case "trapezoid": {
          const base1 = Math.floor(Math.random() * level.maxSide) + 1;
          const base2 = Math.floor(Math.random() * level.maxSide) + 1;
          const height = Math.floor(Math.random() * level.maxSide) + 1;
          params = { base1, base2, height, kind: "trapezoid_area" };
          correctAnswer = round(((base1 + base2) * height) / 2);
          question = `מה השטח של טרפז עם בסיסים ${base1} ו-${base2} וגובה ${height}?`;
          break;
        }

        case "circle": {
          const radius =
            Math.floor(Math.random() * (level.maxSide / 2)) + 1;
          const useStory = allowStory && Math.random() < 0.4;

          params = {
            radius,
            kind: useStory ? "story_circle_area" : "circle_area",
          };
          correctAnswer = round(PI * radius * radius);

          if (useStory) {
            question = `מגרש משחקים עגול בעל רדיוס ${radius} מטר. מה שטח המגרש? (π = 3.14)`;
          } else {
            question = `מה השטח של עיגול עם רדיוס ${radius}? (π = 3.14)`;
          }
          break;
        }

        default: {
          const side = Math.floor(Math.random() * level.maxSide) + 1;
          params = { side, kind: "square_area" };
          correctAnswer = round(side * side);
          question = `מה השטח של ריבוע עם צלע ${side}?`;
        }
      }
      break;
    }

    // ===================== PERIMETER =====================
    case "perimeter": {
      switch (shape) {
        case "square": {
          const side = Math.floor(Math.random() * level.maxSide) + 1;
          const useStory = allowStory && Math.random() < 0.4;

          params = { side, kind: useStory ? "story_square_perimeter" : "square_perimeter" };
          correctAnswer = round(side * 4);

          if (useStory) {
            question = `ליאו רוצה לשים גדר מסביב לגינה בצורת ריבוע, אורך כל צלע הוא ${side} מטר. מה אורך הגדר הכולל שהוא צריך?`;
          } else {
            question = `מה ההיקף של ריבוע עם צלע ${side}?`;
          }
          break;
        }

        case "rectangle": {
          const length = Math.floor(Math.random() * level.maxSide) + 1;
          const width = Math.floor(Math.random() * level.maxSide) + 1;
          const useStory = allowStory && Math.random() < 0.5;

          params = {
            length,
            width,
            kind: useStory ? "story_rectangle_perimeter" : "rectangle_perimeter",
          };
          correctAnswer = round((length + width) * 2);

          if (useStory) {
            question = `גינה מלבנית מוקפת בגדר. האורך ${length} מטר והרוחב ${width} מטר. כמה מטרים של גדר צריך בסך הכל?`;
          } else {
            question = `מה ההיקף של מלבן עם אורך ${length} ורוחב ${width}?`;
          }
          break;
        }

        case "triangle": {
          const side1 = Math.floor(Math.random() * level.maxSide) + 1;
          const side2 = Math.floor(Math.random() * level.maxSide) + 1;
          const side3 = Math.floor(Math.random() * level.maxSide) + 1;
          params = { side1, side2, side3, kind: "triangle_perimeter" };
          correctAnswer = round(side1 + side2 + side3);
          question = `מה ההיקף של משולש עם צלעות ${side1}, ${side2}, ${side3}?`;
          break;
        }

        case "circle": {
          const radius =
            Math.floor(Math.random() * (level.maxSide / 2)) + 1;
          const useStory = allowStory && Math.random() < 0.4;

          params = { radius, kind: useStory ? "story_circle_perimeter" : "circle_perimeter" };
          correctAnswer = round(2 * PI * radius);

          if (useStory) {
            question = `שביל הליכה מקיף אגם עגול בעל רדיוס ${radius} מטר. כמה מטרים אורך השביל? (π = 3.14)`;
          } else {
            question = `מה ההיקף של עיגול עם רדיוס ${radius}? (π = 3.14)`;
          }
          break;
        }

        default: {
          const side = Math.floor(Math.random() * level.maxSide) + 1;
          params = { side, kind: "square_perimeter" };
          correctAnswer = round(side * 4);
          question = `מה ההיקף של ריבוע עם צלע ${side}?`;
        }
      }
      break;
    }

    // ===================== VOLUME =====================
    case "volume": {
      switch (shape) {
        case "cube": {
          const side =
            Math.floor(Math.random() * (level.maxSide / 2)) + 1;
          const useStory = allowStory && Math.random() < 0.4;

          params = { side, kind: useStory ? "story_cube_volume" : "cube_volume" };
          correctAnswer = round(side * side * side);

          if (useStory) {
            question = `קופסת משחקים בצורת קובייה, אורך הצלע שלה ${side} ס"מ. מה נפח הקופסה בס"מ מעוקב?`;
          } else {
            question = `מה הנפח של קובייה עם צלע ${side}?`;
          }
          break;
        }

        case "rectangular_prism": {
          const length =
            Math.floor(Math.random() * (level.maxSide / 2)) + 1;
          const width =
            Math.floor(Math.random() * (level.maxSide / 2)) + 1;
          const height =
            Math.floor(Math.random() * level.maxSide) + 1;
          const useStory = allowStory && Math.random() < 0.5;

          params = {
            length,
            width,
            height,
            kind: useStory ? "story_box_volume" : "rectangular_prism_volume",
          };
          correctAnswer = round(length * width * height);

          if (useStory) {
            question = `ליאו אורז צעצועים בקופסת קרטון בצורת תיבה באורך ${length} ס"מ, רוחב ${width} ס"מ וגובה ${height} ס"מ. מה נפח הקופסה בס"מ מעוקב?`;
          } else {
            question = `מה הנפח של תיבה עם אורך ${length}, רוחב ${width} וגובה ${height}?`;
          }
          break;
        }

        case "cylinder": {
          const radius =
            Math.floor(Math.random() * (level.maxSide / 3)) + 1;
          const height =
            Math.floor(Math.random() * level.maxSide) + 1;
          params = { radius, height, kind: "cylinder_volume" };
          correctAnswer = round(PI * radius * radius * height);
          question = `מה הנפח של גליל עם רדיוס ${radius} וגובה ${height}? (π = 3.14)`;
          break;
        }

        case "sphere": {
          const radius =
            Math.floor(Math.random() * (level.maxSide / 3)) + 1;
          params = { radius, kind: "sphere_volume" };
          correctAnswer = round((4 / 3) * PI * radius * radius * radius);
          question = `מה הנפח של כדור עם רדיוס ${radius}? (π = 3.14)`;
          break;
        }

        default: {
          const length =
            Math.floor(Math.random() * (level.maxSide / 2)) + 1;
          const width =
            Math.floor(Math.random() * (level.maxSide / 2)) + 1;
          const height =
            Math.floor(Math.random() * level.maxSide) + 1;
          params = { length, width, height, kind: "rectangular_prism_volume" };
          correctAnswer = round(length * width * height);
          question = `מה הנפח של תיבה עם אורך ${length}, רוחב ${width} וגובה ${height}?`;
        }
      }
      break;
    }

    // ===================== ANGLES =====================
    case "angles": {
      const angle1 = Math.floor(Math.random() * 61) + 40;
      const maxAngle2 = 160 - angle1;
      const angle2 = Math.floor(Math.random() * (maxAngle2 - 19)) + 20;
      const angle3 = 180 - angle1 - angle2;

      params = { angle1, angle2, angle3, kind: "triangle_angles" };
      correctAnswer = round(angle3);
      question = `במשולש, זווית אחת היא ${angle1}° וזווית שנייה היא ${angle2}°. מה הזווית השלישית?`;
      break;
    }

    // ===================== PYTHAGORAS =====================
    case "pythagoras": {
      const triples = [
        [3, 4, 5],
        [5, 12, 13],
        [6, 8, 10],
        [8, 15, 17],
      ];
      const [ba, bb, bc] =
        triples[Math.floor(Math.random() * triples.length)];
      const maxK = gradeKey === "g7_8" ? 3 : 2;
      const k = Math.floor(Math.random() * maxK) + 1;

      const a = ba * k;
      const b = bb * k;
      const c = bc * k;

      // לפעמים שואלים על היתר (כמו קודם), לפעמים על אחד הניצבים
      const askLeg =
        allowStory && Math.random() < 0.4; // "שאלה הפוכה" רק בכיתות גבוהות
      if (!askLeg) {
        params = { a, b, c, which: "hypotenuse", kind: "pythagoras_hyp" };
        correctAnswer = round(c);
        question = `במשולש ישר זווית, הניצבים הם ${a} ו-${b}. מה אורך היתר?`;
      } else {
        // נשאל על ניצב חסר
        const missing = Math.random() < 0.5 ? "a" : "b";
        if (missing === "a") {
          params = { a, b, c, which: "leg_a", kind: "pythagoras_leg" };
          correctAnswer = round(a);
          question = `במשולש ישר זווית, היתר הוא ${c} והניצב השני הוא ${b}. מה אורך הניצב החסר?`;
        } else {
          params = { a, b, c, which: "leg_b", kind: "pythagoras_leg" };
          correctAnswer = round(b);
          question = `במשולש ישר זווית, היתר הוא ${c} והניצב השני הוא ${a}. מה אורך הניצב החסר?`;
        }
      }
      break;
    }

    // ===================== DEFAULT =====================
    default: {
      const side = Math.floor(Math.random() * level.maxSide) + 1;
      params = { side, kind: "square_area" };
      correctAnswer = round(side * side);
      question = `מה השטח של ריבוע עם צלע ${side}?`;
    }
  }

  // ===== יצירת תשובות =====
  const wrongAnswers = new Set();
  while (wrongAnswers.size < 3) {
    const variation = Math.floor(Math.random() * 3) + 1;
    const sign = Math.random() > 0.5 ? 1 : -1;
    const delta = Math.max(
      1,
      Math.abs(correctAnswer) * 0.1 * variation
    );
    const wrong = round(correctAnswer + sign * delta);
    if (
      wrong !== correctAnswer &&
      wrong > 0 &&
      !Number.isNaN(wrong) &&
      !wrongAnswers.has(wrong)
    ) {
      wrongAnswers.add(wrong);
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
    topic: selectedTopic,
    shape,
    params,
  };
}

function getHint(question, topic, gradeKey) {
  if (!question || !question.params) return "";
  switch (topic) {
    case "area":
      if (question.shape === "square") {
        return `שטח ריבוע = צלע × צלע = ${question.params.side} × ${question.params.side}`;
      } else if (question.shape === "rectangle") {
        return `שטח מלבן = אורך × רוחב = ${question.params.length} × ${question.params.width}`;
      } else if (question.shape === "circle") {
        return `שטח עיגול = π × רדיוס² = 3.14 × ${question.params.radius}²`;
      } else if (question.shape === "triangle") {
        return `שטח משולש = (בסיס × גובה) ÷ 2 = (${question.params.base} × ${question.params.height}) ÷ 2`;
      } else if (question.shape === "parallelogram") {
        return `שטח מקבילית = בסיס × גובה = ${question.params.base} × ${question.params.height}`;
      } else if (question.shape === "trapezoid") {
        return `שטח טרפז = ((בסיס1 + בסיס2) × גובה) ÷ 2 = ((${question.params.base1} + ${question.params.base2}) × ${question.params.height}) ÷ 2`;
      }
      break;
    case "perimeter":
      if (question.shape === "square") {
        return `היקף ריבוע = צלע × 4 = ${question.params.side} × 4`;
      } else if (question.shape === "rectangle") {
        return `היקף מלבן = (אורך + רוחב) × 2 = (${question.params.length} + ${question.params.width}) × 2`;
      } else if (question.shape === "circle") {
        return `היקף עיגול = 2 × π × רדיוס = 2 × 3.14 × ${question.params.radius}`;
      } else if (question.shape === "triangle") {
        return `היקף משולש = צלע1 + צלע2 + צלע3 = ${question.params.side1} + ${question.params.side2} + ${question.params.side3}`;
      }
      break;
    case "volume":
      if (question.shape === "cube") {
        return `נפח קובייה = צלע³ = ${question.params.side}³`;
      } else if (question.shape === "cylinder") {
        return `נפח גליל = π × רדיוס² × גובה = 3.14 × ${question.params.radius}² × ${question.params.height}`;
      } else if (question.shape === "sphere") {
        return `נפח כדור = (4/3) × π × רדיוס³ = (4/3) × 3.14 × ${question.params.radius}³`;
      } else if (question.shape === "rectangular_prism") {
        return `נפח תיבה = אורך × רוחב × גובה = ${question.params.length} × ${question.params.width} × ${question.params.height}`;
      }
      break;
    case "angles":
      return `סכום זוויות במשולש = 180°. אם יש ${question.params?.angle1 || 0}° ו-${question.params?.angle2 || 0}°, אז השלישית = 180° - (שתי הזוויות)`;
    case "pythagoras":
      return `משפט פיתגורס: a² + b² = c². כאן: ${question.params?.a || 0}² + ${question.params?.b || 0}² = c²`;
    default:
      return "נסה לחשוב על הנוסחה המתאימה";
  }
  return "נסה לחשוב על הנוסחה המתאימה";
}

// הסבר מפורט צעד-אחר-צעד לפי נושא וכיתה
function getSolutionSteps(question, topic, gradeKey) {
  if (!question || !question.params) return [];
  const p = question.params;
  const shape = question.shape;
  const { correctAnswer } = question;

  const ltr = (expr) => `\u2066${expr}\u2069`; // LRI ... PDI
  const toSpan = (text, key) => (
    <span
      key={key}
      style={{ display: "block", direction: "rtl", unicodeBidi: "plaintext" }}
    >
      {text}
    </span>
  );

  switch (topic) {
    case "area": {
      if (shape === "square") {
        return [
          toSpan("1. נכתוב את הנוסחה: שטח ריבוע = צלע × צלע.", "1"),
          toSpan(`2. נציב: ${ltr(`שטח = ${p.side} × ${p.side}`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`${p.side} × ${p.side} = ${correctAnswer}`)}.`, "3"),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות שטח.`, "4"),
        ];
      }
      if (shape === "rectangle") {
        return [
          toSpan("1. נכתוב את הנוסחה: שטח מלבן = אורך × רוחב.", "1"),
          toSpan(`2. נציב: ${ltr(`שטח = ${p.length} × ${p.width}`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`${p.length} × ${p.width} = ${correctAnswer}`)}.`, "3"),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות שטח.`, "4"),
        ];
      }
      if (shape === "triangle") {
        return [
          toSpan("1. נכתוב את הנוסחה: שטח משולש = (בסיס × גובה) ÷ 2.", "1"),
          toSpan(`2. נציב: ${ltr(`(${p.base} × ${p.height}) ÷ 2`)}.`, "2"),
          toSpan(
            `3. נחשב: ${ltr(`${p.base} × ${p.height} = ${p.base * p.height}`)}, ואז ${ltr(`${p.base * p.height} ÷ 2 = ${correctAnswer}`)}.`,
            "3"
          ),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות שטח.`, "4"),
        ];
      }
      if (shape === "parallelogram") {
        return [
          toSpan("1. נכתוב את הנוסחה: שטח מקבילית = בסיס × גובה.", "1"),
          toSpan(`2. נציב: ${ltr(`${p.base} × ${p.height}`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`${p.base} × ${p.height} = ${correctAnswer}`)}.`, "3"),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות שטח.`, "4"),
        ];
      }
      if (shape === "trapezoid") {
        const sumBases = p.base1 + p.base2;
        return [
          toSpan("1. נכתוב את הנוסחה: שטח טרפז = ((בסיס1 + בסיס2) × גובה) ÷ 2.", "1"),
          toSpan(`2. נציב: ${ltr(`((${p.base1} + ${p.base2}) × ${p.height}) ÷ 2`)}.`, "2"),
          toSpan(
            `3. נחשב: ${ltr(`${p.base1} + ${p.base2} = ${sumBases}`)}, ואז ${ltr(`(${sumBases} × ${p.height}) ÷ 2 = ${correctAnswer}`)}.`,
            "3"
          ),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות שטח.`, "4"),
        ];
      }
      if (shape === "circle") {
        const r2 = p.radius * p.radius;
        return [
          toSpan("1. נכתוב את הנוסחה: שטח עיגול = π × רדיוס².", "1"),
          toSpan(`2. נציב: ${ltr(`שטח = 3.14 × ${p.radius}²`)}.`, "2"),
          toSpan(
            `3. נחשב: ${ltr(`${p.radius}² = ${r2}`)}, ואז ${ltr(`3.14 × ${r2} = ${correctAnswer}`)}.`,
            "3"
          ),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות שטח.`, "4"),
        ];
      }
      break;
    }

    case "perimeter": {
      if (shape === "square") {
        return [
          toSpan("1. נוסחה: היקף ריבוע = צלע × 4.", "1"),
          toSpan(`2. נציב: ${ltr(`${p.side} × 4`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`${p.side} × 4 = ${correctAnswer}`)}.`, "3"),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות אורך.`, "4"),
        ];
      }
      if (shape === "rectangle") {
        const sum = p.length + p.width;
        return [
          toSpan("1. נוסחה: היקף מלבן = (אורך + רוחב) × 2.", "1"),
          toSpan(`2. נציב: ${ltr(`(${p.length} + ${p.width}) × 2`)}.`, "2"),
          toSpan(
            `3. נחשב: ${ltr(`${p.length} + ${p.width} = ${sum}`)}, ואז ${ltr(`${sum} × 2 = ${correctAnswer}`)}.`,
            "3"
          ),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות אורך.`, "4"),
        ];
      }
      if (shape === "triangle") {
        return [
          toSpan("1. נוסחה: היקף משולש = צלע1 + צלע2 + צלע3.", "1"),
          toSpan(
            `2. נציב: ${ltr(`${p.side1} + ${p.side2} + ${p.side3}`)}.`,
            "2"
          ),
          toSpan(
            `3. נחשב: ${ltr(`${p.side1} + ${p.side2} + ${p.side3} = ${correctAnswer}`)}.`,
            "3"
          ),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות אורך.`, "4"),
        ];
      }
      if (shape === "circle") {
        return [
          toSpan("1. נוסחה: היקף עיגול = 2 × π × רדיוס.", "1"),
          toSpan(`2. נציב: ${ltr(`2 × 3.14 × ${p.radius}`)}.`, "2"),
          toSpan(
            `3. נחשב: ${ltr(`2 × 3.14 = 6.28`)}, ואז ${ltr(`6.28 × ${p.radius} = ${correctAnswer}`)}.`,
            "3"
          ),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות אורך.`, "4"),
        ];
      }
      break;
    }

    case "volume": {
      if (shape === "cube") {
        return [
          toSpan("1. נוסחה: נפח קובייה = צלע³.", "1"),
          toSpan(`2. נציב: ${ltr(`${p.side}³`)}.`, "2"),
          toSpan(
            `3. נחשב: ${ltr(`${p.side} × ${p.side} × ${p.side} = ${correctAnswer}`)}.`,
            "3"
          ),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות נפח.`, "4"),
        ];
      }
      if (shape === "rectangular_prism") {
        const product = p.length * p.width * p.height;
        return [
          toSpan("1. נוסחה: נפח תיבה = אורך × רוחב × גובה.", "1"),
          toSpan(`2. נציב: ${ltr(`${p.length} × ${p.width} × ${p.height}`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`${p.length} × ${p.width} × ${p.height} = ${product}`)}.`, "3"),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות נפח.`, "4"),
        ];
      }
      if (shape === "cylinder") {
        const r2 = p.radius * p.radius;
        return [
          toSpan("1. נוסחה: נפח גליל = π × רדיוס² × גובה.", "1"),
          toSpan(`2. נציב: ${ltr(`3.14 × ${p.radius}² × ${p.height}`)}.`, "2"),
          toSpan(
            `3. נחשב: ${ltr(`${p.radius}² = ${r2}`)}, ואז ${ltr(`3.14 × ${r2} × ${p.height} = ${correctAnswer}`)}.`,
            "3"
          ),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות נפח.`, "4"),
        ];
      }
      if (shape === "sphere") {
        const r3 = p.radius * p.radius * p.radius;
        return [
          toSpan("1. נוסחה: נפח כדור = (4/3) × π × רדיוס³.", "1"),
          toSpan(`2. נציב: ${ltr(`(4/3) × 3.14 × ${p.radius}³`)}.`, "2"),
          toSpan(
            `3. נחשב: ${ltr(`${p.radius}³ = ${r3}`)}, ואז ${ltr(`(4/3) × 3.14 × ${r3} = ${correctAnswer}`)}.`,
            "3"
          ),
          toSpan(`4. התוצאה: ${correctAnswer} יחידות נפח.`, "4"),
        ];
      }
      break;
    }

    case "angles": {
      const angle1 = p.angle1 || 0;
      const angle2 = p.angle2 || 0;
      const sum = angle1 + angle2;
      return [
        toSpan("1. נזכור: סכום הזוויות במשולש = 180°.", "1"),
        toSpan(`2. נציב: ${ltr(`זווית1 = ${angle1}°`)} ו-${ltr(`זווית2 = ${angle2}°`)}.`, "2"),
        toSpan(
          `3. נחשב: ${ltr(`זווית3 = 180° - (${angle1}° + ${angle2}°) = 180° - ${sum}° = ${correctAnswer}°`)}.`,
          "3"
        ),
        toSpan(`4. הזווית השלישית היא ${correctAnswer}°.`, "4"),
      ];
    }

    case "pythagoras": {
      const a = p.a || 0;
      const b = p.b || 0;
      const c = p.c || 0;
      const kind = p.kind || (p.which ? "pythagoras_leg" : "pythagoras_hyp");

      // מצב 1 – מוצאים יתר (קלאסי)
      if (kind === "pythagoras_hyp" || !p.which) {
        const a2 = a * a;
        const b2 = b * b;
        const sum = a2 + b2;
        return [
          toSpan("1. משפט פיתגורס: a² + b² = c².", "1"),
          toSpan(`2. נציב: ${ltr(`${a}² + ${b}² = c²`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`${a}² = ${a2}`)} ו-${ltr(`${b}² = ${b2}`)}.`, "3"),
          toSpan(`4. נחבר: ${ltr(`${a2} + ${b2} = ${sum}`)}.`, "4"),
          toSpan(`5. נוציא שורש: ${ltr(`c = √${sum} = ${correctAnswer}`)}.`, "5"),
        ];
      }

      // מצב 2 – מוצאים ניצב חסר (מתקדם יותר)
      const c2 = c * c;
      const missingLeg = p.which === "leg_a" ? "a" : "b";
      const knownLegValue = p.which === "leg_a" ? b : a;
      const known2 = knownLegValue * knownLegValue;
      const diff = c2 - known2;

      return [
        toSpan("1. משפט פיתגורס: a² + b² = c².", "1"),
        toSpan(
          `2. כאן מחפשים ניצב חסר, ולכן נשתמש ב-${missingLeg}² = c² - (הניצב הידוע)².`,
          "2"
        ),
        toSpan(`3. נחשב: ${ltr(`${c}² = ${c2}`)} ו-${ltr(`${knownLegValue}² = ${known2}`)}.`, "3"),
        toSpan(`4. נחסיר: ${ltr(`${c2} - ${known2} = ${diff}`)}.`, "4"),
        toSpan(`5. נוציא שורש: ${ltr(`${missingLeg} = √${diff} = ${correctAnswer}`)}.`, "5"),
      ];
    }

    default:
      return [];
  }

  return [];
}

// "למה טעיתי?" – הסבר קצר לטעות נפוצה
function getErrorExplanation(question, topic, wrongAnswer, gradeKey) {
  if (!question) return "";
  const userAnsNum = Number(wrongAnswer);
  const correctNum = Number(question.correctAnswer);

  switch (topic) {
    case "area":
      if (!Number.isNaN(userAnsNum) && userAnsNum < correctNum) {
        return "נראה ששכחת לכפול או לחלק. בדוק שוב את הנוסחה – האם כפלת/חלקת את כל המספרים?";
      }
      if (!Number.isNaN(userAnsNum) && userAnsNum > correctNum) {
        return "נראה שהוספת במקום לכפול, או שכחת לחלק. בדוק שוב את הנוסחה.";
      }
      return "בדוק שוב: האם השתמשת בנוסחה הנכונה? זכור: שטח ריבוע = צלע × צלע, שטח מלבן = אורך × רוחב, שטח משולש = (בסיס × גובה) ÷ 2.";

    case "perimeter":
      if (!Number.isNaN(userAnsNum) && userAnsNum < correctNum) {
        return "נראה ששכחת לכפול ב-2 (במלבן) או ב-4 (בריבוע), או ששכחת צלע אחת. בדוק שוב.";
      }
      return "בדוק שוב: האם חיברת את כל הצלעות? זכור: היקף ריבוע = צלע × 4, היקף מלבן = (אורך + רוחב) × 2.";

    case "volume":
      if (!Number.isNaN(userAnsNum) && userAnsNum < correctNum) {
        return "נראה ששכחת לכפול באחד הממדים. בדוק שוב את הנוסחה – האם כפלת את כל הממדים?";
      }
      return "בדוק שוב: האם השתמשת בנוסחה הנכונה? זכור: נפח קובייה = צלע³, נפח תיבה = אורך × רוחב × גובה.";

    case "angles":
      if (!Number.isNaN(userAnsNum) && userAnsNum > correctNum) {
        return "נראה שהוספת במקום לחסר. זכור: סכום הזוויות במשולש = 180°, אז הזווית השלישית = 180° - (זווית1 + זווית2).";
      }
      return "בדוק שוב: סכום הזוויות במשולש תמיד שווה ל-180°. חסר את שתי הזוויות מ-180° כדי למצוא את השלישית.";

    case "pythagoras":
      if (!Number.isNaN(userAnsNum) && userAnsNum < correctNum) {
        return "נראה ששכחת להוציא שורש, או שכחת לכפול אחד המספרים בעצמו. זכור: a² + b² = c², אז c = √(a² + b²).";
      }
      return "בדוק שוב: משפט פיתגורס אומר a² + b² = c². חשב את a² ו-b², חבר אותם, ואז הוצא שורש.";

    default:
      return "";
  }
}

// תקציר תיאורטי קצר לפי נושא וכיתה – מוצג לפני השאלה במצב Learning
function getTheorySummary(question, topic, gradeKey) {
  if (!question) return null;

  const lines = [];

  switch (topic) {
    case "area": {
      lines.push("שטח מודד כמה מקום תופסת צורה על המשטח.");
      if (gradeKey === "g3_4") {
        lines.push("ריבוע: שטח = צלע × צלע.");
        lines.push("מלבן: שטח = אורך × רוחב.");
      } else if (gradeKey === "g5_6") {
        lines.push("ריבוע: שטח = צלע × צלע.");
        lines.push("מלבן: שטח = אורך × רוחב.");
        lines.push("משולש: שטח = (בסיס × גובה) ÷ 2.");
      } else {
        // g7_8
        lines.push("ריבוע: שטח = צלע².");
        lines.push("מלבן: שטח = אורך × רוחב.");
        lines.push("משולש: שטח = (בסיס × גובה) ÷ 2.");
        lines.push("מקבילית: שטח = בסיס × גובה.");
        lines.push("טרפז: שטח = ((בסיס1 + בסיס2) × גובה) ÷ 2.");
        lines.push("עיגול: שטח = π × רדיוס².");
      }
      break;
    }

    case "perimeter": {
      lines.push("היקף מודד את אורך המסלול שמקיף את הצורה.");
      lines.push("תמיד מחברים את כל הצלעות.");
      if (gradeKey === "g3_4") {
        lines.push("ריבוע: היקף = צלע × 4.");
        lines.push("מלבן: היקף = (אורך + רוחב) × 2.");
      } else {
        lines.push("בכל צורה: היקף = סכום אורכי כל הצלעות.");
        lines.push("עיגול: היקף = 2 × π × רדיוס.");
      }
      break;
    }

    case "volume": {
      lines.push("נפח מודד כמה מקום תופס גוף במרחב (תלת-מימד).");
      if (gradeKey === "g5_6") {
        lines.push("קובייה: נפח = צלע³.");
        lines.push("תיבה (מלבנית): נפח = אורך × רוחב × גובה.");
      } else {
        lines.push("קובייה: נפח = צלע³.");
        lines.push("תיבה: נפח = אורך × רוחב × גובה.");
        lines.push("גליל: נפח = π × רדיוס² × גובה.");
        lines.push("כדור: נפח = (4/3) × π × רדיוס³.");
      }
      break;
    }

    case "angles": {
      lines.push("בכל משולש: סכום הזוויות הפנימיות הוא 180°.");
      lines.push("אם שתי זוויות ידועות – מוצאים את השלישית בעזרת 180° פחות הסכום שלהן.");
      break;
    }

    case "pythagoras": {
      lines.push("במשולש ישר-זווית: a² + b² = c² (c הוא היתר).");
      lines.push("אם יודעים את שני הניצבים – מוצאים יתר: c = √(a² + b²).");
      lines.push("אם יודעים יתר וניצב – מוצאים ניצב חסר: √(c² - ניצב²).");
      break;
    }

    default: {
      lines.push("חשוב לזכור את הנוסחה המתאימה לנושא ולצורה.");
    }
  }

  return (
    <div>
      <div className="font-bold mb-1 text-[11px]">📘 מה חשוב לזכור?</div>
      <ul className="list-disc pr-4 text-[11px] space-y-0.5 text-right">
        {lines.map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export default function GeometryMaster() {
  useIOSViewportFix();
  const router = useRouter();
  const wrapRef = useRef(null);
  const headerRef = useRef(null);
  const gameRef = useRef(null);
  const controlsRef = useRef(null);
  const topicSelectRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [grade, setGrade] = useState("g5_6");
  const [mode, setMode] = useState("learning");
  const [level, setLevel] = useState("easy");
  const [topic, setTopic] = useState("area");
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
  const [lives, setLives] = useState(3);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [recentQuestions, setRecentQuestions] = useState(new Set());
  const [stars, setStars] = useState(0);
  const [badges, setBadges] = useState([]);
  const [showBadge, setShowBadge] = useState(null);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [progress, setProgress] = useState({
    area: { total: 0, correct: 0 },
    perimeter: { total: 0, correct: 0 },
    volume: { total: 0, correct: 0 },
    angles: { total: 0, correct: 0 },
    pythagoras: { total: 0, correct: 0 },
  });
  const [dailyChallenge, setDailyChallenge] = useState({
    date: new Date().toDateString(),
    bestScore: 0,
    questions: 0,
  });
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  // הסבר מפורט לשאלה
  const [showSolution, setShowSolution] = useState(false);

  // הסבר לטעות אחרונה
  const [errorExplanation, setErrorExplanation] = useState("");
  const [showMixedSelector, setShowMixedSelector] = useState(false);
  const [mixedTopics, setMixedTopics] = useState({
    area: true,
    perimeter: true,
    volume: false,
    angles: false,
    pythagoras: false,
  });
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardLevel, setLeaderboardLevel] = useState("easy");
  const [leaderboardData, setLeaderboardData] = useState([]);
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

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const key = `${level}_${topic}`;
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
  }, [level, topic, playerName]);

  useEffect(() => {
    if (showMixedSelector) return;
    const allowed = GRADES[grade].topics;
    if (!allowed.includes(topic)) {
      const firstAllowed = allowed.find((t) => t !== "mixed") || allowed[0];
      setTopic(firstAllowed);
    }
  }, [grade]);

  useEffect(() => {
    const availableTopics = GRADES[grade].topics.filter((t) => t !== "mixed");
    const newMixedTopics = {
      area: availableTopics.includes("area"),
      perimeter: availableTopics.includes("perimeter"),
      volume: availableTopics.includes("volume"),
      angles: availableTopics.includes("angles"),
      pythagoras: availableTopics.includes("pythagoras"),
    };
    setMixedTopics(newMixedTopics);
  }, [grade]);

  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyChallenge.date !== today) {
      setDailyChallenge({ date: today, bestScore: 0, questions: 0 });
    }
  }, [dailyChallenge.date]);

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

  useEffect(() => {
    if (!wrapRef.current || !mounted) return;
    const calc = () => {
      const rootH = window.visualViewport?.height ?? window.innerHeight;
      const headH = headerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty("--head-h", headH + "px");
      const controlsH = controlsRef.current?.offsetHeight || 40;
      // Use more conservative calculation to ensure content doesn't get cut
      const used = headH + controlsH + 120 + 40;
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

  function saveRunToStorage() {
    if (typeof window === "undefined" || !playerName.trim()) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const key = `${level}_${topic}`;
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
    const maxAttempts = 50;
    do {
      question = generateQuestion(
        levelConfig,
        topic,
        grade,
        topic === "mixed" ? mixedTopics : null
      );
      attempts++;
      const questionKey = question.question;
      if (!recentQuestions.has(questionKey)) {
        setRecentQuestions((prev) => {
          const newSet = new Set(prev);
          newSet.add(questionKey);
          if (newSet.size > 20) {
            const first = Array.from(newSet)[0];
            newSet.delete(first);
          }
          return newSet;
        });
        break;
      }
    } while (attempts < maxAttempts);
    if (attempts >= maxAttempts) {
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
    setRecentQuestions(new Set());
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
    if (mode === "challenge") {
      setTimeLeft(20);
    } else if (mode === "speed") {
      setTimeLeft(10);
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
      let points = 10 + streak;
      if (mode === "speed") {
        const timeBonus = timeLeft ? Math.floor(timeLeft * 2) : 0;
        points += timeBonus;
      }
      setScore((prev) => prev + points);
      setStreak((prev) => prev + 1);
      setCorrect((prev) => prev + 1);
      
      setErrorExplanation("");
      const top = currentQuestion.topic;
      setProgress((prev) => ({
        ...prev,
        [top]: {
          total: (prev[top]?.total || 0) + 1,
          correct: (prev[top]?.correct || 0) + 1,
        },
      }));
      const newCorrect = correct + 1;
      if (newCorrect % 5 === 0) {
        setStars((prev) => {
          const newStars = prev + 1;
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
      const xpGain = hintUsed ? 5 : 10;
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
          currentQuestion.topic,
          answer,
          grade
        )
      );
      
      const top = currentQuestion.topic;
      setProgress((prev) => ({
        ...prev,
        [top]: {
          total: (prev[top]?.total || 0) + 1,
          correct: prev[top]?.correct || 0,
        },
      }));
      if ("vibrate" in navigator) navigator.vibrate?.(200);
      if (mode === "learning") {
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
        setFeedback(
          `Wrong! Correct: ${currentQuestion.correctAnswer} ❌ (-1 ❤️)`
        );
        setLives((prevLives) => {
          const nextLives = prevLives - 1;
          if (nextLives <= 0) {
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
        const key = `${level}_${topic}`;
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

  const getTopicName = (t) => {
    return TOPICS[t]?.icon + " " + TOPICS[t]?.name || t;
  };

  if (!mounted)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center">
        <div className="text-white text-xl">טוען...</div>
      </div>
    );

  const accuracy =
    totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

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
              📐 Geometry Master
            </h1>
            <p className="text-white/70 text-xs">
              {playerName || "שחקן"} • {GRADES[grade].name} •{" "}
              {LEVELS[level].name} • {getTopicName(topic)} • {MODES[mode].name}
            </p>
          </div>

          <div
            ref={controlsRef}
            className={`grid gap-1 mb-1 w-full max-w-md ${
              stars > 0 || playerLevel > 1 ? "grid-cols-6" : "grid-cols-5"
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
                    ref={topicSelectRef}
                    value={topic}
                    onChange={(e) => {
                      const newTopic = e.target.value;
                      setGameActive(false);
                      if (newTopic === "mixed") {
                        setTopic(newTopic);
                        setShowMixedSelector(true);
                      } else {
                        setTopic(newTopic);
                        setShowMixedSelector(false);
                      }
                    }}
                    className="h-9 px-3 rounded-lg bg-black/30 border border-white/20 text-white text-xs font-bold flex-1"
                  >
                    {GRADES[grade].topics.map((t) => (
                      <option key={t} value={t}>
                        {getTopicName(t)}
                      </option>
                    ))}
                  </select>
                  {topic === "mixed" && (
                    <button
                      onClick={() => {
                        setShowMixedSelector(true);
                      }}
                      className="h-9 w-9 rounded-lg bg-blue-500/80 hover:bg-blue-500 border border-white/20 text-white text-xs font-bold flex items-center justify-center"
                      title="ערוך נושאים למיקס"
                    >
                      ⚙️
                    </button>
                  )}
                </div>
              </div>

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

              <div className="bg-black/20 border border-white/10 rounded-lg p-2 mb-2 w-full max-w-md text-center">
                <div className="text-xs text-white/60 mb-1">אתגר יומי</div>
                <div className="text-sm text-white">
                  שיא: {dailyChallenge.bestScore} • שאלות: {dailyChallenge.questions}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-2 flex-wrap w-full max-w-md">
                <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className="h-10 px-6 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  ▶️ התחל
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
                    🧹 איפוס
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
                    <div className="mt-1 text-xs text-red-100/90 font-normal" dir="ltr">
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
                  {mode === "learning" && (
                    <div
                      className="mb-2 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white/80 max-w-md"
                      style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                    >
                      {getTheorySummary(currentQuestion, currentQuestion.topic, grade)}
                    </div>
                  )}

                  {/* הפרדה בין שורת השאלה לשורת התרגיל */}
                  {currentQuestion.questionLabel && currentQuestion.exerciseText ? (
                    <>
                      <p
                        className="text-2xl text-center text-white mb-1"
                        style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                      >
                        {currentQuestion.questionLabel}
                      </p>
                      <p
                        className="text-4xl text-center text-white font-bold mb-4 whitespace-nowrap"
                        style={{ direction: "ltr", unicodeBidi: "plaintext" }}
                      >
                        {currentQuestion.exerciseText}
                      </p>
                    </>
                  ) : (
                    <div
                      className="text-4xl font-black text-white mb-4 text-center"
                      style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                    >
                      {currentQuestion.question}
                    </div>
                  )}

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
                      style={{ direction: "rtl", unicodeBidi: "plaintext" }}
                    >
                      {getHint(currentQuestion, currentQuestion.topic, grade)}
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
                                className="mb-2 font-semibold text-base text-center text-white"
                                dir="ltr"
                              >
                                {currentQuestion.question}
                              </div>
                              {/* כאן הצעדים */}
                              <div className="space-y-1 text-sm" style={{ direction: "rtl", unicodeBidi: "plaintext" }}>
                                {getSolutionSteps(
                                  currentQuestion,
                                  currentQuestion.topic,
                                  grade
                                ).map((step, idx) =>
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
                            console.error("שגיאה בטעינת לוח התוצאות:", e);
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
                            עדיין אין תוצאות ברמה {LEVELS[leaderboardLevel].name}
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
                    סגור
                  </button>
                </div>
              </div>
            </div>
          )}

          {showMixedSelector && (
            <div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
              onClick={() => {
                setShowMixedSelector(false);
                const hasSelected = Object.values(mixedTopics).some(
                  (selected) => selected
                );
                if (!hasSelected && topic === "mixed") {
                  const allowed = GRADES[grade].topics;
                  setTopic(allowed.find((t) => t !== "mixed") || allowed[0]);
                }
              }}
            >
              <div
                className="bg-gradient-to-br from-[#080c16] to-[#0a0f1d] border-2 border-white/20 rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-extrabold text-white mb-2">
                    🎲 בחר נושאים למיקס
                  </h2>
                  <p className="text-white/70 text-sm">
                    בחר אילו נושאים לכלול במיקס
                  </p>
                </div>

                <div className="space-y-3 mb-4">
                  {GRADES[grade].topics
                    .filter((t) => t !== "mixed")
                    .map((t) => (
                      <label
                        key={t}
                        className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/10 hover:bg-black/40 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={mixedTopics[t] || false}
                          onChange={(e) => {
                            setMixedTopics((prev) => ({
                              ...prev,
                              [t]: e.target.checked,
                            }));
                          }}
                          className="w-5 h-5 rounded"
                        />
                        <span className="text-white font-semibold text-lg">
                          {getTopicName(t)}
                        </span>
                      </label>
                    ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const availableTopics = GRADES[grade].topics.filter(
                        (t) => t !== "mixed"
                      );
                      const allSelected = {};
                      availableTopics.forEach((t) => {
                        allSelected[t] = true;
                      });
                      setMixedTopics(allSelected);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 font-bold text-sm"
                  >
                    הכל
                  </button>
                  <button
                    onClick={() => {
                      const availableTopics = GRADES[grade].topics.filter(
                        (t) => t !== "mixed"
                      );
                      const noneSelected = {};
                      availableTopics.forEach((t) => {
                        noneSelected[t] = false;
                      });
                      setMixedTopics(noneSelected);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-500/80 hover:bg-gray-500 font-bold text-sm"
                  >
                    בטל הכל
                  </button>
                  <button
                    onClick={() => {
                      const hasSelected = Object.values(mixedTopics).some(
                        (selected) => selected
                      );
                      if (hasSelected) {
                        setShowMixedSelector(false);
                      } else {
                        alert("אנא בחר לפחות נושא אחד");
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



