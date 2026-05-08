/**
 * Hebrew system prompt + facts JSON for the parent-report AI narrative writer.
 *
 * Hard rules embedded in the prompt:
 *  - Audience: הורה. Voice: חמה, מקצועית, פשוטה.
 *  - אין שפה רפואית/אבחנתית, אין ADHD/לקויות למידה/חרדה/דיכאון/חוסר ביטחון.
 *  - אין הנחות רגשיות.
 *  - חובה לציין מגבלת נתונים אם `thinDataWarnings` קיים.
 *  - לתת 2–3 טיפים פרקטיים לבית.
 *  - להתבסס רק על Hebrew display labels וההמלצות הדטרמיניסטיות.
 *  - אסור להמציא נושאים, מקצועות, מספרים או שמות מורים.
 *  - חייב להחזיר JSON בלבד, ללא Markdown.
 *  - sourceId חייב להילקח מהרשימות `availableStrengthSourceIds` / `availableFocusSourceIds`.
 */

const SYSTEM_LINES_HE = [
  "את/ה כותב/ת סיכום קצר ומקצועי בעברית להורה על תרגול הילד/ה במערכת לימודית.",
  "סגנון: חם, פשוט, מקצועי, ללא שיפוטיות וללא דרמטיזציה.",
  "אסור להשתמש בשפה רפואית או אבחנתית: ADHD, דיסלקציה, לקות למידה, חרדה, דיכאון, חוסר ביטחון, ASD, מאסטרי.",
  "אסור לקבוע מסקנות רגשיות על הילד/ה ('הוא לא בטוח בעצמו', 'היא חוששת').",
  "אסור להמציא נושאים, מקצועות, שמות מורים, ציונים או מספרים שלא מופיעים בקלט.",
  "אסור להשתמש ב-Markdown, סימני * או #, או רשימות עם תווי כוכבית.",
  "אסור לכלול מפתחות באנגלית כמו `multiplication_table` או `reading_comprehension` בטקסט הגלוי. הטקסט חייב להיות בעברית בלבד.",
  "אם `thin_data_warnings` אינו ריק, חובה לכלול שורת `caution_note` בעברית שמסבירה שהנתונים מועטים והתובנה ראשונית בלבד.",
  "אם הנתונים מספיקים, אפשר להותיר את `caution_note` כמחרוזת ריקה.",
  "החוזקות וה-focus areas שתבחר/י מותרות אך ורק מתוך הרשימות הסגורות `available_strength_source_ids` ו-`available_focus_source_ids`. עבור כל פריט, החזר/י גם `source_id` תואם.",
  "ה-`text_he` של כל חוזקה/focus area חייב להיות מבוסס על ה-`display_name_he` המקביל בקלט (אפשר לנסח אותו במשפט קצר), ולא להמציא נושא חדש.",
  "כתוב/י 2 עד 3 `home_tips` פרקטיים, קצרים, בני ביצוע בבית.",
  "פלט: JSON בלבד עם השדות summary (string), strengths (array של {text_he, source_id}), focus_areas (array של {text_he, source_id}), home_tips (array של strings), caution_note (string).",
];

const SYSTEM_RULES_EN = [
  "Output strictly valid JSON. No prose outside JSON. No Markdown.",
  "Field names use snake_case in the JSON: summary, strengths, focus_areas, home_tips, caution_note.",
  "All visible text fields are Hebrew (text_he, summary, home_tips, caution_note).",
];

function buildFactsJson(input) {
  return {
    student_display_name: input.studentDisplayName || "",
    grade_level: input.gradeLevel || "unknown",
    range_label: input.rangeLabel || "",
    overall: {
      total_questions: input.overall?.totalQuestions || 0,
      accuracy_band: input.overall?.accuracyBand || "low",
      data_confidence: input.overall?.dataConfidence || "thin",
      avg_time_per_question_sec: input.overall?.avgTimePerQuestionSec ?? null,
      avg_hints_per_question: input.overall?.avgHintsPerQuestion ?? null,
      mode_counts: input.overall?.modeCounts || null,
      level_counts: input.overall?.levelCounts || null,
    },
    subjects: (input.subjects || []).map((s) => ({
      source_id: s.sourceId,
      display_name_he: s.displayNameHe,
      total_questions: s.totalQuestions,
      accuracy_band: s.accuracyBand,
      trend: s.trend,
      data_confidence: s.dataConfidence,
    })),
    strengths_candidates: (input.strengths || []).map((s) => ({
      source_id: s.sourceId,
      display_name_he: s.displayNameHe,
      evidence_he: s.evidenceHe,
    })),
    focus_areas_candidates: (input.focusAreas || []).map((f) => ({
      source_id: f.sourceId,
      display_name_he: f.displayNameHe,
      evidence_he: f.evidenceHe,
      thin_data: f.thinData === true,
    })),
    available_strength_source_ids: input.availableStrengthSourceIds || [],
    available_focus_source_ids: input.availableFocusSourceIds || [],
    fluency_signals: input.fluency || null,
    repeated_mistakes: input.repeatedMistakes || [],
    deterministic_recommendations_he: input.deterministicRecommendationsHe || [],
    thin_data_warnings: input.thinDataWarnings || [],
  };
}

/**
 * Builds the prompt sent to the OpenAI Responses API.
 *
 * @param {object} aiNarrativeInput — strict, allowlisted projection of the Insight Packet
 * @returns {string} prompt
 */
export function buildNarrativePrompt(aiNarrativeInput) {
  const facts = buildFactsJson(aiNarrativeInput || {});
  const lines = [
    ...SYSTEM_LINES_HE,
    ...SYSTEM_RULES_EN,
    `FACTS_JSON: ${JSON.stringify(facts)}`,
  ];
  return lines.join("\n");
}

export function buildFactsJsonForTests(input) {
  return buildFactsJson(input || {});
}
