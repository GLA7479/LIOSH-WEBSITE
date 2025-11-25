// יצירת שאלות גיאומטריה

import { GRADES, PI, getShapesForTopic } from "./geometry-constants";

export function generateQuestion(level, topic, gradeKey, mixedOps = null) {
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

