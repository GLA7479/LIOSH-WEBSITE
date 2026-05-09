/**
 * Advisory Math sequencing flags (Phase 4B-1 / 4B-2). Not syllabus certification.
 */

/**
 * @param {object} invRecord inventory row (topic, subtopic, gradeMin, difficulty, …)
 * @param {string} normKey normalized topic key
 * @returns {Array<{ code: string, severity: string, note: string }>}
 */
export function mathSequencingSuspicions(invRecord, normKey) {
  const gmin = Number(invRecord.gradeMin);
  const g = Number.isFinite(gmin) ? gmin : null;
  /** @type {Array<{ code: string, severity: string, note: string }>} */
  const flags = [];
  if (!Number.isFinite(g) || g < 1 || g > 6) return flags;

  const diff = String(invRecord.difficulty || "").toLowerCase();
  const isHard = diff.includes("hard");
  const topic = String(invRecord.topic || "").toLowerCase();
  const sub = String(invRecord.subtopic || "").toLowerCase();

  if (normKey.includes("percentages") && g <= 4) {
    flags.push({
      code: "percentages_possibly_early",
      severity: "review",
      note: "אחוזים לפני כיתות העליונות — לאמת מול מסמך הכיתה והוראת המוסד.",
    });
  }
  if (normKey.includes("decimals") && g <= 3) {
    flags.push({
      code: "decimals_possibly_early",
      severity: "review",
      note: "עשרוניים בכיתות נמוכות — לוודא מול תוכנית הכיתה.",
    });
  }
  if (normKey.includes("fractions") && g <= 2) {
    flags.push({
      code: "fractions_depth_unclear_low_grade",
      severity: "review",
      note: "שברים בכיתה א׳–ב׳ — בדוק עומק צפוי לפי מסמך הכיתה.",
    });
  }
  if (
    (normKey.includes("multiplication_division") || topic.includes("division")) &&
    (sub.includes("remainder") || topic.includes("remainder")) &&
    g <= 2
  ) {
    flags.push({
      code: "division_with_remainder_possibly_early",
      severity: "review",
      note: "חילוק עם שארית בכיתות נמוכות — לאמת רצף.",
    });
  }
  if (normKey.includes("equations_and_expressions") && g <= 3) {
    flags.push({
      code: "equations_expressions_possibly_early",
      severity: "review",
      note: "משוואות/ביטויים מוקדם — השווה למסמך הכיתה.",
    });
  }
  if (normKey.includes("word_problems") && isHard && g <= 2) {
    flags.push({
      code: "word_problem_difficulty_mismatch_low_grade",
      severity: "review",
      note: "שאלה מילולית מסומנת קשה בכיתה נמוכה — לבדוק התאמת קושי.",
    });
  }
  if (normKey.includes("powers_and_scaling") && g <= 3) {
    flags.push({
      code: "powers_scaling_possibly_early",
      severity: "review",
      note: "חזקות/קנה מידה — לאמת מול תוכנית הכיתה.",
    });
  }
  if (normKey.includes("ratio_and_scale") && g <= 3) {
    flags.push({
      code: "ratio_scale_possibly_early",
      severity: "review",
      note: "יחס וקנה מידה בכיתות נמוכות — לאמת.",
    });
  }

  return flags;
}
