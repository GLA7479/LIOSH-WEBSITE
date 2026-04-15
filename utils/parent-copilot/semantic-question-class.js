/**
 * Answer-first semantic routing: aggregate / comparison-style parent questions
 * (Hebrew utterances). Does not read contracts — pattern only.
 */

/**
 * @param {string} utterance
 * @returns {
 *   "strongest_subject"|"weakest_subject"|"hardest_subject"|"subject_listing"|"period_highlight"|
 *   "comparison"|"most_practice"|"least_data"|"improved"|"needs_attention"|"still_unclear"|"most_stable"|"none"
 * }
 */
export function detectAggregateQuestionClass(utterance) {
  const t = String(utterance || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  if (t.length < 3) return "none";

  const hasSubjectWord = /מקצוע|מקצועות|חומר|חומרים/.test(t);
  const hasMore = /יש\s+עוד|עוד\s+מק|אילו\s+מק|כל\s+המק|רשימת\s+מק|כמה\s+מק/.test(t);

  if (hasMore && hasSubjectWord) return "subject_listing";
  if (hasMore && /נושא|נושאים/.test(t)) return "subject_listing";

  if (
    (/מה\s+הכי\s+בולט|מה\s+בולט\s+ביותר|הכי\s+בולט/.test(t) && /תקופ|התקופ|בתקופ|דוח|למידה/.test(t)) ||
    (/בולט|בולטים|בולטת|מה\s+בולט|הדגש|ההדגשה/.test(t) && /תקופ|התקופ|בתקופ/.test(t))
  ) {
    return "period_highlight";
  }
  if (/בולט|בולטים/.test(t) && (t.includes("דוח") || t.includes("למידה"))) {
    return "period_highlight";
  }

  if (/איפה\s+יש\s+הכי\s+הרבה\s+תרגול|הכי\s+הרבה\s+תרגול|הכי\s+הרבה\s+שאלות|מרבית\s+התרגול/.test(t)) {
    return "most_practice";
  }
  if (/איפה\s+יש\s+הכי\s+מעט\s+נתונים|הכי\s+מעט\s+נתונים|פחות\s+נתונים|הכי\s+מעט\s+שאלות/.test(t)) {
    return "least_data";
  }
  if (/מה\s+השתפר|איפה\s+השתפר|שיפור|התקדמות|התחזק/.test(t)) return "improved";
  if (/מה\s+דורש\s+תשומת\s+לב|דורש\s+תשומת\s+לב|מה\s+צריך\s+חיזוק|צריך\s+חיזוק/.test(t)) return "needs_attention";
  if (/מה\s+עדיין\s+לא\s+ברור|עדיין\s+לא\s+ברור|מה\s+לא\s+ברור/.test(t)) return "still_unclear";
  if (/הכי\s+יציב|יציב\s+ביותר|יציבות|לא\s+יציב|stable|unstable/.test(t) && (hasSubjectWord || t.includes("מקצוע"))) {
    return "most_stable";
  }

  if (/(הכי|הכי\s+)(קשה|מאתגר|מאתגרת)/.test(t) && hasSubjectWord) return "hardest_subject";
  if (/באיזה\s+מקצוע\s+הכי\s+קשה|באיזה\s+מקצוע\s+קשה|מקצוע\s+הכי\s+קשה/.test(t)) return "hardest_subject";

  if (/(הכי|הכי\s+)(חלש|חלשה|חלשים|נמוך|נמוכה)/.test(t) && hasSubjectWord) return "weakest_subject";
  if (/מקצוע\s+החלש|המקצוע\s+החלש|חלש\s+ביותר/.test(t)) return "weakest_subject";

  if (/(הכי|הכי\s+)(חזק|חזקה|חזקים|טוב|טובה|טובים)/.test(t) && hasSubjectWord) return "strongest_subject";
  if (/מקצוע\s+החזק|המקצוע\s+החזק|חזק\s+ביותר|הכי\s+חזק/.test(t) && (hasSubjectWord || t.includes("מקצוע"))) {
    return "strongest_subject";
  }
  if (/מה\s+המקצוע\s+החזק|איזה\s+מקצוע\s+החזק/.test(t)) return "strongest_subject";

  if (
    /(לעומת|מול|בהשוואה|יותר\s+מ|פחות\s+מ).*(מקצוע|חשבון|עברית|גאומטריה|אנגלית|מדעים|מולדת)/.test(t) ||
    /(חשבון|עברית|אנגלית|גאומטריה|מדעים)\s+מול\s+(חשבון|עברית|אנגלית|גאומטריה|מדעים)/.test(t)
  ) {
    return "comparison";
  }

  return "none";
}

export default { detectAggregateQuestionClass };
