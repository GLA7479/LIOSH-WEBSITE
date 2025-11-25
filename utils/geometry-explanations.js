// פונקציות הסבר ורמזים לדף ההנדסה

export function getHint(question, topic, gradeKey) {
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
    case "shapes_basic":
      return `זהה את הצורה: ${question.params?.shape || "ריבוע"} - ריבוע יש לו 4 צלעות שוות, מלבן יש לו 2 זוגות של צלעות שוות`;
    case "parallel_perpendicular":
      return `קווים ${question.params?.type || "מקבילות"} - מקבילות לא נפגשות, מאונכות יוצרות זווית ישרה`;
    case "triangles":
      return `מיון משולשים: ${question.params?.type || "שווה צלעות"} - לפי אורך הצלעות`;
    case "quadrilaterals":
      return `מיון מרובעים: ${question.params?.type || "ריבוע"} - לפי תכונות הצלעות והזוויות`;
    case "transformations":
      return `טרנספורמציה: ${question.params?.type || "הזזה"} - הזזה מעתיקה את הצורה, שיקוף הופך אותה`;
    case "rotation":
      return `סיבוב: ${question.params?.angle || 90}° - סיבוב סביב נקודה`;
    case "symmetry":
      return `סימטרייה: ${question.params?.shape || "ריבוע"} - כמה צירי סימטרייה יש לצורה?`;
    case "diagonal":
      return `אלכסון: ${question.params?.shape || "ריבוע"} - קטע המחבר שני קדקודים שאינם על אותה צלע`;
    case "heights":
      return `גובה: במשולש, הגובה הוא המרחק מהקדקוד לבסיס. שטח = (בסיס × גובה) ÷ 2`;
    case "tiling":
      return `ריצוף: ${question.params?.shape || "ריבוע"} - צורות המשמשות לריצוף ללא רווחים`;
    case "circles":
      return question.params?.askArea 
        ? `שטח עיגול = π × רדיוס² = 3.14 × ${question.params?.radius || 0}²`
        : `היקף מעגל = 2 × π × רדיוס = 2 × 3.14 × ${question.params?.radius || 0}`;
    case "solids":
      return `גוף תלת-מימדי: ${question.params?.solid || "קובייה"} - זהה את הגוף לפי תכונותיו`;
    default:
      return "נסה לחשוב על הנוסחה המתאימה";
  }
  return "נסה לחשוב על הנוסחה המתאימה";
}

// הסבר מפורט צעד-אחר-צעד לפי נושא וכיתה
export function getSolutionSteps(question, topic, gradeKey) {
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

    case "shapes_basic": {
      const shape = p.shape || "ריבוע";
      return [
        toSpan(`1. ${shape} הוא מצולע.`, "1"),
        toSpan(shape === "ריבוע" ? "2. לריבוע יש 4 צלעות שוות ו-4 זוויות ישרות." : "2. למלבן יש 2 זוגות של צלעות שוות ו-4 זוויות ישרות.", "2"),
        toSpan(`3. זהה את הצורה לפי התכונות.`, "3"),
      ];
    }

    case "parallel_perpendicular": {
      const type = p.type || "מקבילות";
      return [
        toSpan(`1. קווים ${type} הם קווים מיוחדים.`, "1"),
        toSpan(type === "מקבילות" ? "2. קווים מקבילים לא נפגשים לעולם." : "2. קווים מאונכים יוצרים זווית ישרה (90°).", "2"),
        toSpan(`3. זהה את סוג הקווים לפי התכונות.`, "3"),
      ];
    }

    case "triangles": {
      const type = p.type || "שווה צלעות";
      return [
        toSpan(`1. משולש ${type} מסווג לפי אורך הצלעות.`, "1"),
        toSpan(type === "שווה צלעות" ? "2. כל 3 הצלעות שוות." : type === "שווה שוקיים" ? "2. יש 2 צלעות שוות." : "2. כל הצלעות שונות.", "2"),
        toSpan(`3. זהה את סוג המשולש לפי התכונות.`, "3"),
      ];
    }

    case "quadrilaterals": {
      const type = p.type || "ריבוע";
      return [
        toSpan(`1. ${type} הוא סוג של מרובע.`, "1"),
        toSpan(`2. כל מרובע יש לו תכונות מיוחדות של צלעות וזוויות.`, "2"),
        toSpan(`3. זהה את סוג המרובע לפי התכונות.`, "3"),
      ];
    }

    case "transformations": {
      const type = p.type || "הזזה";
      return [
        toSpan(`1. ${type} היא טרנספורמציה גאומטרית.`, "1"),
        toSpan(type === "הזזה" ? "2. הזזה מעתיקה את הצורה באותו כיוון ובאותו מרחק." : "2. שיקוף הופך את הצורה סביב קו (ציר).", "2"),
        toSpan(`3. זהה את סוג הטרנספורמציה לפי התכונות.`, "3"),
      ];
    }

    case "rotation": {
      const angle = p.angle || 90;
      return [
        toSpan(`1. סיבוב הוא טרנספורמציה סביב נקודה.`, "1"),
        toSpan(`2. סיבוב של ${angle}° מעביר את הצורה סביב מרכז הסיבוב.`, "2"),
        toSpan(`3. זהה את זווית הסיבוב.`, "3"),
      ];
    }

    case "symmetry": {
      const shape = p.shape || "ריבוע";
      const axes = p.axes || 4;
      return [
        toSpan(`1. סימטרייה היא תכונה של צורות.`, "1"),
        toSpan(`2. ${shape} יש לו ${axes} צירי סימטרייה.`, "2"),
        toSpan(`3. ציר סימטרייה הוא קו שמחלק את הצורה לשני חלקים זהים.`, "3"),
      ];
    }

    case "diagonal": {
      const shape = p.shape || "ריבוע";
      const side = p.side || 1;
      return [
        toSpan(`1. אלכסון הוא קטע המחבר שני קדקודים שאינם על אותה צלע.`, "1"),
        toSpan(`2. ב${shape} עם צלע ${side}, האלכסון מחושב לפי משפט פיתגורס.`, "2"),
        toSpan(`3. נחשב: ${ltr(`אלכסון = √(${side}² + ${side}²) = ${correctAnswer}`)}.`, "3"),
      ];
    }

    case "heights": {
      const base = p.base || 1;
      const area = p.area || 1;
      return [
        toSpan("1. גובה במשולש הוא המרחק מהקדקוד לבסיס.", "1"),
        toSpan(`2. נוסחה: שטח = (בסיס × גובה) ÷ 2.`, "2"),
        toSpan(`3. נציב: ${ltr(`${area} = (${base} × גובה) ÷ 2`)}.`, "3"),
        toSpan(`4. נחשב: ${ltr(`גובה = (${area} × 2) ÷ ${base} = ${correctAnswer}`)}.`, "4"),
      ];
    }

    case "tiling": {
      const shape = p.shape || "ריבוע";
      const angle = p.angle || 90;
      return [
        toSpan("1. ריצוף הוא כיסוי של משטח ללא רווחים.", "1"),
        toSpan(`2. ${shape} משמש לריצוף כי הזוויות שלו מתאימות.`, "2"),
        toSpan(`3. זווית של ${shape} היא ${angle}°.`, "3"),
      ];
    }

    case "circles": {
      const radius = p.radius || 1;
      const askArea = p.askArea;
      if (askArea) {
        const r2 = radius * radius;
        return [
          toSpan("1. נוסחה: שטח עיגול = π × רדיוס².", "1"),
          toSpan(`2. נציב: ${ltr(`שטח = 3.14 × ${radius}²`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`${radius}² = ${r2}`)}, ואז ${ltr(`3.14 × ${r2} = ${correctAnswer}`)}.`, "3"),
        ];
      } else {
        return [
          toSpan("1. נוסחה: היקף מעגל = 2 × π × רדיוס.", "1"),
          toSpan(`2. נציב: ${ltr(`2 × 3.14 × ${radius}`)}.`, "2"),
          toSpan(`3. נחשב: ${ltr(`2 × 3.14 = 6.28`)}, ואז ${ltr(`6.28 × ${radius} = ${correctAnswer}`)}.`, "3"),
        ];
      }
    }

    case "solids": {
      const solid = p.solid || "קובייה";
      return [
        toSpan(`1. ${solid} הוא גוף תלת-מימדי.`, "1"),
        toSpan(`2. כל גוף יש לו תכונות מיוחדות של פאות, צלעות וקדקודים.`, "2"),
        toSpan(`3. זהה את הגוף לפי התכונות.`, "3"),
      ];
    }

    default:
      return [];
  }

  return [];
}

// "למה טעיתי?" – הסבר קצר לטעות נפוצה
export function getErrorExplanation(question, topic, wrongAnswer, gradeKey) {
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

    case "shapes_basic":
      return "בדוק שוב: ריבוע יש לו 4 צלעות שוות, מלבן יש לו 2 זוגות של צלעות שוות.";

    case "parallel_perpendicular":
      return "בדוק שוב: קווים מקבילים לא נפגשים, קווים מאונכים יוצרים זווית ישרה.";

    case "triangles":
      return "בדוק שוב: משולש שווה צלעות = כל הצלעות שוות, שווה שוקיים = 2 צלעות שוות, שונה צלעות = כל הצלעות שונות.";

    case "quadrilaterals":
      return "בדוק שוב: זהה את המרובע לפי תכונות הצלעות והזוויות.";

    case "transformations":
      return "בדוק שוב: הזזה מעתיקה את הצורה, שיקוף הופך אותה.";

    case "rotation":
      return "בדוק שוב: סיבוב הוא טרנספורמציה סביב נקודה.";

    case "symmetry":
      return "בדוק שוב: ציר סימטרייה מחלק את הצורה לשני חלקים זהים.";

    case "diagonal":
      return "בדוק שוב: אלכסון מחושב לפי משפט פיתגורס.";

    case "heights":
      return "בדוק שוב: גובה במשולש מחושב לפי שטח = (בסיס × גובה) ÷ 2.";

    case "tiling":
      return "בדוק שוב: ריצוף דורש שהזוויות יתאימו.";

    case "circles":
      return "בדוק שוב: שטח עיגול = π × רדיוס², היקף מעגל = 2 × π × רדיוס.";

    case "solids":
      return "בדוק שוב: זהה את הגוף לפי תכונות הפאות והצלעות.";

    default:
      return "";
  }
}

// תקציר תיאורטי קצר לפי נושא וכיתה – מוצג לפני השאלה במצב Learning
export function getTheorySummary(question, topic, gradeKey) {
  if (!question) return null;

  const lines = [];

  switch (topic) {
    case "area": {
      lines.push("שטח מודד כמה מקום תופסת צורה על המשטח.");
      if (gradeKey === "g2" || gradeKey === "g3") {
        lines.push("ריבוע: שטח = צלע × צלע.");
        lines.push("מלבן: שטח = אורך × רוחב.");
      } else if (gradeKey === "g4") {
        lines.push("ריבוע: שטח = צלע × צלע.");
        lines.push("מלבן: שטח = אורך × רוחב.");
        lines.push("משולש: שטח = (בסיס × גובה) ÷ 2.");
      } else if (gradeKey === "g5") {
        lines.push("ריבוע: שטח = צלע × צלע.");
        lines.push("מלבן: שטח = אורך × רוחב.");
        lines.push("משולש: שטח = (בסיס × גובה) ÷ 2.");
        lines.push("מקבילית: שטח = בסיס × גובה.");
        lines.push("טרפז: שטח = ((בסיס1 + בסיס2) × גובה) ÷ 2.");
      } else {
        // g6
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
      if (gradeKey === "g2" || gradeKey === "g3") {
        lines.push("ריבוע: היקף = צלע × 4.");
        lines.push("מלבן: היקף = (אורך + רוחב) × 2.");
      } else {
        lines.push("בכל צורה: היקף = סכום אורכי כל הצלעות.");
        if (gradeKey === "g4" || gradeKey === "g5" || gradeKey === "g6") {
          lines.push("עיגול: היקף = 2 × π × רדיוס.");
        }
      }
      break;
    }

    case "volume": {
      lines.push("נפח מודד כמה מקום תופס גוף במרחב (תלת-מימד).");
      if (gradeKey === "g5") {
        lines.push("קובייה: נפח = צלע³.");
        lines.push("תיבה (מלבנית): נפח = אורך × רוחב × גובה.");
      } else {
        // g6
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

    case "shapes_basic": {
      lines.push("ריבוע: 4 צלעות שוות, 4 זוויות ישרות.");
      lines.push("מלבן: 2 זוגות של צלעות שוות, 4 זוויות ישרות.");
      break;
    }

    case "parallel_perpendicular": {
      lines.push("קווים מקבילים: לא נפגשים לעולם.");
      lines.push("קווים מאונכים: יוצרים זווית ישרה (90°).");
      break;
    }

    case "triangles": {
      lines.push("משולש שווה צלעות: כל 3 הצלעות שוות.");
      lines.push("משולש שווה שוקיים: 2 צלעות שוות.");
      lines.push("משולש שונה צלעות: כל הצלעות שונות.");
      break;
    }

    case "quadrilaterals": {
      lines.push("ריבוע: 4 צלעות שוות, 4 זוויות ישרות.");
      lines.push("מלבן: 2 זוגות של צלעות שוות, 4 זוויות ישרות.");
      lines.push("מקבילית: 2 זוגות של צלעות מקבילות.");
      lines.push("טרפז: זוג אחד של צלעות מקבילות.");
      break;
    }

    case "transformations": {
      lines.push("הזזה: מעתיקה את הצורה באותו כיוון ובאותו מרחק.");
      lines.push("שיקוף: הופך את הצורה סביב קו (ציר).");
      break;
    }

    case "rotation": {
      lines.push("סיבוב: מעביר את הצורה סביב נקודה.");
      lines.push("סיבוב של 90° = רבע סיבוב, 180° = חצי סיבוב, 360° = סיבוב שלם.");
      break;
    }

    case "symmetry": {
      lines.push("סימטרייה: צורה שיש לה ציר סימטרייה.");
      lines.push("ריבוע: 4 צירי סימטרייה, מלבן: 2 צירי סימטרייה.");
      break;
    }

    case "diagonal": {
      lines.push("אלכסון: קטע המחבר שני קדקודים שאינם על אותה צלע.");
      lines.push("בריבוע: אלכסון = צלע × √2.");
      break;
    }

    case "heights": {
      lines.push("גובה: המרחק מהקדקוד לבסיס.");
      lines.push("במשולש: שטח = (בסיס × גובה) ÷ 2.");
      break;
    }

    case "tiling": {
      lines.push("ריצוף: כיסוי משטח ללא רווחים.");
      lines.push("ריבוע: זווית 90°, משולש שווה צלעות: זווית 60°.");
      break;
    }

    case "circles": {
      lines.push("מעגל: כל הנקודות במרחק שווה מהמרכז.");
      lines.push("שטח עיגול = π × רדיוס².");
      lines.push("היקף מעגל = 2 × π × רדיוס.");
      break;
    }

    case "solids": {
      lines.push("קובייה: 6 פאות ריבועיות שוות.");
      lines.push("תיבה: 6 פאות מלבניות.");
      lines.push("גליל: 2 בסיסים עגולים.");
      lines.push("כדור: כל הנקודות במרחק שווה מהמרכז.");
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

