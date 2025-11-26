// יצירת שאלות גיאומטריה

import { GRADES, PI, getShapesForTopic } from "./geometry-constants";

export function generateQuestion(level, topic, gradeKey, mixedOps = null) {
  // בדיקה שהכיתה קיימת
  if (!GRADES[gradeKey]) {
    return {
      question: "כיתה לא תקינה. אנא בחר כיתה אחרת.",
      correctAnswer: 0,
      options: [0],
      params: { kind: "no_question" },
    };
  }
  
  const isMixed = topic === "mixed";
  const allowedTopics = GRADES[gradeKey].topics || [];
  
  let selectedTopic;
  if (isMixed) {
    let availableTopics;
    if (mixedOps) {
      availableTopics = Object.entries(mixedOps)
        .filter(([t, selected]) => selected && t !== "mixed")
        .map(([t]) => t);
    } else {
      availableTopics = allowedTopics.filter((t) => t !== "mixed");
    }
    if (!availableTopics || availableTopics.length === 0) {
      availableTopics = allowedTopics.filter((t) => t !== "mixed");
    }
    if (!availableTopics || availableTopics.length === 0) {
      return {
        question: "אין נושאים זמינים עבור הכיתה הזו. אנא בחר כיתה אחרת.",
        correctAnswer: 0,
        options: [0],
        params: { kind: "no_question" },
      };
    }
    selectedTopic =
      availableTopics[Math.floor(Math.random() * availableTopics.length)];
  } else {
    // בדיקה שהנושא קיים עבור הכיתה
    if (!allowedTopics.includes(topic)) {
      // ננסה למצוא נושא חלופי
      const alternativeTopic = allowedTopics.find(t => t !== "mixed");
      if (alternativeTopic) {
        selectedTopic = alternativeTopic;
      } else {
        return {
          question: `הנושא "${topic}" לא זמין עבור הכיתה הזו. אנא בחר נושא אחר.`,
          correctAnswer: 0,
          options: [0],
          params: { kind: "no_question" },
        };
      }
    } else {
      selectedTopic = topic;
    }
  }

  const availableShapes = getShapesForTopic(gradeKey, selectedTopic);
  
  // אם אין צורות זמינות, נחזיר שאלה ברירת מחדל
  if (!availableShapes || availableShapes.length === 0) {
    return {
      question: "אין שאלות זמינות עבור הנושא והכיתה שנבחרו. אנא בחר נושא אחר.",
      correctAnswer: 0,
      options: [0],
      params: { kind: "no_question" },
    };
  }
  
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

  // לאפשר תרגילי מילים בעיקר לכיתות גבוהות יותר (ה' ו-ו')
  const allowStory = gradeKey === "g5" || gradeKey === "g6";

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

        case "pyramid": {
          // נפח פירמידה = (1/3) × שטח בסיס × גובה
          // נשתמש בפירמידה עם בסיס ריבועי או מלבני
          const baseSide = Math.floor(Math.random() * (level.maxSide / 2)) + 1;
          const height = Math.floor(Math.random() * level.maxSide) + 1;
          const isSquareBase = Math.random() < 0.5;
          
          if (isSquareBase) {
            const baseArea = baseSide * baseSide;
            params = { baseSide, height, baseArea, kind: "pyramid_volume_square" };
            correctAnswer = round((baseArea * height) / 3);
            question = `מה הנפח של פירמידה עם בסיס ריבועי (צלע ${baseSide}) וגובה ${height}?`;
          } else {
            const baseWidth = Math.floor(Math.random() * (level.maxSide / 2)) + 1;
            const baseArea = baseSide * baseWidth;
            params = { baseSide, baseWidth, height, baseArea, kind: "pyramid_volume_rectangular" };
            correctAnswer = round((baseArea * height) / 3);
            question = `מה הנפח של פירמידה עם בסיס מלבני (${baseSide} × ${baseWidth}) וגובה ${height}?`;
          }
          break;
        }

        case "cone": {
          // נפח חרוט = (1/3) × π × רדיוס² × גובה
          const radius = Math.floor(Math.random() * (level.maxSide / 3)) + 1;
          const height = Math.floor(Math.random() * level.maxSide) + 1;
          params = { radius, height, kind: "cone_volume" };
          correctAnswer = round((PI * radius * radius * height) / 3);
          question = `מה הנפח של חרוט עם רדיוס ${radius} וגובה ${height}? (π = 3.14)`;
          break;
        }

        case "prism": {
          // נפח מנסרה = שטח בסיס × גובה
          // נשתמש במנסרה עם בסיס משולש או מלבני
          const baseType = Math.random() < 0.5 ? "triangle" : "rectangle";
          const height = Math.floor(Math.random() * level.maxSide) + 1;
          
          if (baseType === "triangle") {
            const base = Math.floor(Math.random() * (level.maxSide / 2)) + 1;
            const baseHeight = Math.floor(Math.random() * (level.maxSide / 2)) + 1;
            const baseArea = (base * baseHeight) / 2;
            params = { base, baseHeight, height, baseArea, kind: "prism_volume_triangle" };
            correctAnswer = round(baseArea * height);
            question = `מה הנפח של מנסרה עם בסיס משולש (בסיס ${base}, גובה ${baseHeight}) וגובה המנסרה ${height}?`;
          } else {
            const baseLength = Math.floor(Math.random() * (level.maxSide / 2)) + 1;
            const baseWidth = Math.floor(Math.random() * (level.maxSide / 2)) + 1;
            const baseArea = baseLength * baseWidth;
            params = { baseLength, baseWidth, height, baseArea, kind: "prism_volume_rectangular" };
            correctAnswer = round(baseArea * height);
            question = `מה הנפח של מנסרה עם בסיס מלבני (${baseLength} × ${baseWidth}) וגובה המנסרה ${height}?`;
          }
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
      const maxK = gradeKey === "g6" ? 3 : 2;
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

    // ===================== SHAPES BASIC =====================
    case "shapes_basic": {
      // כיתה א' - זיהוי בסיסי, כיתה ד' - תכונות
      if (gradeKey === "g1") {
        // שאלות זיהוי בסיסיות - מה השם של הצורה?
        const side = Math.floor(Math.random() * level.maxSide) + 1;
        const isSquare = Math.random() < 0.5;
        
        if (isSquare) {
          params = { shape: "ריבוע", side, kind: "shapes_basic_square" };
          correctAnswer = 1; // ריבוע
          question = `צורה עם 4 צלעות שוות באורך ${side}. מה שמה? (1 = ריבוע, 2 = מלבן)`;
        } else {
          const width = Math.floor(Math.random() * level.maxSide) + 1;
          params = { shape: "מלבן", length: side, width, kind: "shapes_basic_rectangle" };
          correctAnswer = 2; // מלבן
          question = `צורה עם אורך ${side} ורוחב ${width}. מה שמה? (1 = ריבוע, 2 = מלבן)`;
        }
      } else {
        // כיתה ד' - תכונות ריבוע ומלבן
        const questionType = Math.random();
        if (questionType < 0.33) {
          // כמה צלעות שוות יש לריבוע?
          params = { shape: "ריבוע", kind: "shapes_basic_properties_square" };
          correctAnswer = 4; // 4 צלעות שוות
          question = `כמה צלעות שוות יש לריבוע? (1 = 2, 2 = 3, 3 = 4, 4 = אין צלעות שוות)`;
        } else if (questionType < 0.66) {
          // כמה זוגות של צלעות שוות יש למלבן?
          params = { shape: "מלבן", kind: "shapes_basic_properties_rectangle" };
          correctAnswer = 2; // 2 זוגות
          question = `כמה זוגות של צלעות שוות יש למלבן? (1 = 1, 2 = 2, 3 = 3, 4 = 4)`;
        } else {
          // כמה זוויות ישרות יש לריבוע/מלבן?
          const shape = Math.random() < 0.5 ? "ריבוע" : "מלבן";
          params = { shape, kind: "shapes_basic_properties_angles" };
          correctAnswer = 4; // 4 זוויות ישרות
          question = `כמה זוויות ישרות יש ל${shape}? (1 = 2, 2 = 3, 3 = 4, 4 = אין זוויות ישרות)`;
        }
      }
      break;
    }

    // ===================== PARALLEL PERPENDICULAR =====================
    case "parallel_perpendicular": {
      const types = ["מקבילות", "מאונכות"];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      const isParallel = selectedType === "מקבילות";
      
      params = { type: selectedType, isParallel, kind: "parallel_perpendicular" };
      correctAnswer = isParallel ? 1 : 2; // 1 = מקבילות, 2 = מאונכות
      question = `איזה סוג קווים הם ${selectedType}? (1 = מקבילות, 2 = מאונכות)`;
      break;
    }

    // ===================== TRIANGLES =====================
    case "triangles": {
      const types = ["שווה צלעות", "שווה שוקיים", "שונה צלעות"];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      
      params = { type: selectedType, kind: "triangles" };
      correctAnswer = types.indexOf(selectedType) + 1;
      question = `איזה סוג משולש הוא ${selectedType}? (1 = שווה צלעות, 2 = שווה שוקיים, 3 = שונה צלעות)`;
      break;
    }

    // ===================== QUADRILATERALS =====================
    case "quadrilaterals": {
      const types = ["ריבוע", "מלבן", "מקבילית", "טרפז"];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      
      params = { type: selectedType, kind: "quadrilaterals" };
      correctAnswer = types.indexOf(selectedType) + 1;
      question = `איזה סוג מרובע הוא ${selectedType}? (1 = ריבוע, 2 = מלבן, 3 = מקבילית, 4 = טרפז)`;
      break;
    }

    // ===================== TRANSFORMATIONS =====================
    case "transformations": {
      const types = ["הזזה", "שיקוף"];
      const selectedType = types[Math.floor(Math.random() * types.length)];
      const isTranslation = selectedType === "הזזה";
      
      params = { type: selectedType, isTranslation, kind: "transformations" };
      correctAnswer = isTranslation ? 1 : 2; // 1 = הזזה, 2 = שיקוף
      question = `איזה סוג טרנספורמציה היא ${selectedType}? (1 = הזזה, 2 = שיקוף)`;
      break;
    }

    // ===================== ROTATION =====================
    case "rotation": {
      const angle = [90, 180, 270][Math.floor(Math.random() * 3)];
      params = { angle, kind: "rotation" };
      correctAnswer = angle;
      question = `סיבוב של כמה מעלות? (${angle}°)`;
      break;
    }

    // ===================== SYMMETRY =====================
    case "symmetry": {
      const shapes = ["ריבוע", "מלבן", "משולש שווה צלעות"];
      const selectedShape = shapes[Math.floor(Math.random() * shapes.length)];
      const axes = selectedShape === "ריבוע" ? 4 : selectedShape === "מלבן" ? 2 : 3;
      
      params = { shape: selectedShape, axes, kind: "symmetry" };
      correctAnswer = axes;
      question = `כמה צירי סימטרייה יש ל${selectedShape}?`;
      break;
    }

    // ===================== DIAGONAL =====================
    case "diagonal": {
      // כיתה ד' - ריבוע ומלבן, כיתה ה' - גם מקבילית
      const shapeOptions = gradeKey === "g5" 
        ? ["ריבוע", "מלבן", "מקבילית"]
        : ["ריבוע", "מלבן"];
      const shape = shapeOptions[Math.floor(Math.random() * shapeOptions.length)];
      const side = Math.floor(Math.random() * level.maxSide) + 1;
      
      let diagonal;
      if (shape === "ריבוע") {
        diagonal = round(side * Math.sqrt(2));
        params = { shape, side, diagonal, kind: "diagonal_square" };
        question = `מה אורך האלכסון של ריבוע עם צלע ${side}?`;
      } else if (shape === "מלבן") {
        const width = Math.floor(Math.random() * level.maxSide) + 1;
        diagonal = round(Math.sqrt(side * side + width * width));
        params = { shape, side, width, diagonal, kind: "diagonal_rectangle" };
        question = `מה אורך האלכסון של מלבן עם אורך ${side} ורוחב ${width}?`;
      } else {
        // מקבילית - כיתה ה'
        const width = Math.floor(Math.random() * level.maxSide) + 1;
        diagonal = round(Math.sqrt(side * side + width * width));
        params = { shape, side, width, diagonal, kind: "diagonal_parallelogram" };
        question = `מה אורך האלכסון של מקבילית עם צלע ${side} וצלע ${width}?`;
      }
      
      correctAnswer = diagonal;
      break;
    }

    // ===================== HEIGHTS =====================
    case "heights": {
      const shapeType = Math.random();
      if (shapeType < 0.33) {
        // משולש
        const base = Math.floor(Math.random() * level.maxSide) + 1;
        const area = Math.floor(Math.random() * level.maxSide * 5) + 10;
        const height = round((area * 2) / base);
        
        params = { base, area, height, shape: "triangle", kind: "heights_triangle" };
        correctAnswer = height;
        question = `במשולש עם בסיס ${base} ושטח ${area}, מה הגובה?`;
      } else if (shapeType < 0.66) {
        // מקבילית
        const base = Math.floor(Math.random() * level.maxSide) + 1;
        const area = Math.floor(Math.random() * level.maxSide * 5) + 10;
        const height = round(area / base);
        
        params = { base, area, height, shape: "parallelogram", kind: "heights_parallelogram" };
        correctAnswer = height;
        question = `במקבילית עם בסיס ${base} ושטח ${area}, מה הגובה?`;
      } else {
        // טרפז
        const base1 = Math.floor(Math.random() * level.maxSide) + 1;
        const base2 = Math.floor(Math.random() * level.maxSide) + 1;
        const area = Math.floor(Math.random() * level.maxSide * 5) + 10;
        const height = round((area * 2) / (base1 + base2));
        
        params = { base1, base2, area, height, shape: "trapezoid", kind: "heights_trapezoid" };
        correctAnswer = height;
        question = `בטרפז עם בסיסים ${base1} ו-${base2} ושטח ${area}, מה הגובה?`;
      }
      break;
    }

    // ===================== TILING =====================
    case "tiling": {
      const shapes = ["ריבוע", "משולש שווה צלעות", "משושה"];
      const selectedShape = shapes[Math.floor(Math.random() * shapes.length)];
      const angle = selectedShape === "ריבוע" ? 90 : selectedShape === "משולש שווה צלעות" ? 60 : 120;
      
      params = { shape: selectedShape, angle, kind: "tiling" };
      correctAnswer = angle;
      question = `איזו זווית יש ב${selectedShape} המשמש לריצוף?`;
      break;
    }

    // ===================== CIRCLES =====================
    case "circles": {
      const radius = Math.floor(Math.random() * (level.maxSide / 2)) + 1;
      const askArea = Math.random() < 0.5;
      
      if (askArea) {
        params = { radius, kind: "circle_area", askArea: true };
        correctAnswer = round(PI * radius * radius);
        question = `מה שטח העיגול עם רדיוס ${radius}? (π = 3.14)`;
      } else {
        params = { radius, kind: "circle_perimeter", askArea: false };
        correctAnswer = round(2 * PI * radius);
        question = `מה היקף המעגל עם רדיוס ${radius}? (π = 3.14)`;
      }
      break;
    }

    // ===================== SOLIDS =====================
    case "solids": {
      // שאלות זיהוי גופים - מה השם של הגוף?
      const solids = [
        { name: "קובייה", desc: "6 פאות ריבועיות שוות", num: 1 },
        { name: "תיבה", desc: "6 פאות מלבניות", num: 2 },
        { name: "גליל", desc: "2 בסיסים עגולים", num: 3 },
        { name: "פירמידה", desc: "בסיס מצולע ופאות משולשות", num: 4 },
        { name: "חרוט", desc: "בסיס עגול וקודקוד", num: 5 },
        { name: "כדור", desc: "כל הנקודות במרחק שווה מהמרכז", num: 6 },
      ];
      const selected = solids[Math.floor(Math.random() * solids.length)];
      
      params = { solid: selected.name, desc: selected.desc, kind: "solids" };
      correctAnswer = selected.num;
      question = `גוף עם ${selected.desc}. מה שמו? (1 = קובייה, 2 = תיבה, 3 = גליל, 4 = פירמידה, 5 = חרוט, 6 = כדור)`;
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

