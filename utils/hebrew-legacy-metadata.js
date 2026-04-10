/**
 * מטא־דאטה מסווגת לשאלות legacy בעברית (ללא שינוי תוכן הבנק).
 * משמש ב־finalizeHebrewMcq ובסקריפט audit.
 */

/**
 * @param {string} topic
 * @param {string} stem
 * @returns {"choice"|"binary"|"typing"}
 */
function inferAnswerMode(topic, stem) {
  const s = String(stem || "").trim();
  if (/אמת או שקר|נכון או לא|כן או לא|\bכן\b.*\bלא\b/i.test(s)) {
    return "binary";
  }
  if (
    topic === "writing" ||
    topic === "speaking" ||
    /^(כתוב|חברו משפט|הרחיבו|נסחו|השיבו במשפט מלא)/i.test(s)
  ) {
    return "typing";
  }
  return "choice";
}

/**
 * קידומת כיתה לטקסט שאלה — מיושר ל־audit (אותו טקסט כמו בזמן ריצה אחרי finalize).
 */
export function scopeHebrewStemForGrade(topic, question, gradeKey) {
  const q0 = String(question || "").trim();
  const g = parseInt(String(gradeKey || "").replace(/\D/g, ""), 10) || 0;
  if (!g || /^\(כיתה|בהתאם לכיתה/.test(q0)) return q0;
  if (
    g >= 1 &&
    g <= 2 &&
    [
      "comprehension",
      "vocabulary",
      "grammar",
      "speaking",
      "reading",
      "writing",
    ].includes(topic)
  ) {
    const heb = g === 1 ? "א׳" : "ב׳";
    return `(כיתה ${heb}) ${q0}`;
  }
  if (
    g >= 3 &&
    g <= 4 &&
    ["vocabulary", "speaking", "reading", "writing", "grammar", "comprehension"].includes(
      topic
    )
  ) {
    const heb = g === 3 ? "ג׳" : "ד׳";
    return `(כיתה ${heb}) ${q0}`;
  }
  if (
    g >= 5 &&
    g <= 6 &&
    ["reading", "writing", "speaking", "comprehension", "grammar", "vocabulary"].includes(
      topic
    )
  ) {
    const heb = g === 5 ? "ה׳" : "ו׳";
    return `(כיתה ${heb}) ${q0}`;
  }
  return q0;
}

/**
 * @param {string} topic
 * @param {string} question
 * @param {string} levelKey easy|medium|hard
 * @param {string} gradeKey g1..g6
 * @returns {object}
 */
export function inferHebrewLegacyMeta(topic, question, levelKey, gradeKey) {
  const stem = String(question || "").trim();
  const g = parseInt(String(gradeKey || "").replace(/\D/g, ""), 10) || 1;

  const out = {
    patternFamily: `${topic}_typed`,
    subtype: "general",
    suggestedAllowedLevels: undefined,
    allowedLevels: undefined,
    answerMode: inferAnswerMode(topic, stem),
    difficultyBand: String(levelKey || "easy").toLowerCase(),
    minGrade: g,
    maxGrade: g,
    allowedGrades: [`g${g}`],
  };

  const lev = out.difficultyBand;

  if (topic === "reading") {
    if (/קראו:|קרא את/i.test(stem)) {
      out.patternFamily = "reading_passage_style";
      out.subtype = /טקסט מורכב|מתקדם|חטיבת ביניים/i.test(stem)
        ? "passage_complex"
        : /קרא את המשפט/i.test(stem)
          ? "sentence_in_context"
          : "passage_short";
    } else if (/קרא את המילה/i.test(stem)) {
      out.patternFamily = "reading_word";
      out.subtype = "word_read_aloud";
    } else if (/מה האות (הראשונה|האחרונה)/i.test(stem)) {
      out.patternFamily = "reading_letter_position";
      out.subtype = /ראשונה/.test(stem) ? "first_letter" : "last_letter";
    } else if (/איזה אות חסרה|איזה אות רואים/i.test(stem)) {
      out.patternFamily = "reading_letter_gap";
      out.subtype = stem.includes("חסרה") ? "missing_letter" : "letter_spot";
    } else if (/מה המילה הנכונה|ב___|י_ד|ש_מש/i.test(stem)) {
      out.patternFamily = "reading_completion";
      out.subtype = "word_spelling_gap";
    }
  } else if (topic === "vocabulary") {
    if (/מה המשמעות של המילה/i.test(stem)) {
      out.patternFamily = "vocab_definition";
      out.subtype = "word_meaning";
    } else if (/מה ההפך של/i.test(stem)) {
      out.patternFamily = "vocab_antonym";
      out.subtype = "opposite";
    } else if (/מה המילה המתאימה|השלם/i.test(stem)) {
      out.patternFamily = "vocab_context_fit";
      out.subtype = "cloze";
    } else if (/נרדפ|דומה ל|במשמעות דומה/i.test(stem)) {
      out.patternFamily = "vocab_synonym";
      out.subtype = "near_synonym";
    } else if (/שורש|משפחת מילים|מבנה המילה/i.test(stem)) {
      out.patternFamily = "vocab_morphology";
      out.subtype = "word_structure";
    }
  } else if (topic === "comprehension") {
    if (/מה הנושא המרכזי|מה המסר|מה ניתן להסיק|ניתוח|ביקורתית|אקדמי/i.test(
      stem
    )) {
      out.patternFamily = "comprehension_infer";
      out.subtype = g >= 5 ? "inference_advanced" : "gist_or_inference";
    } else if (/מי |מתי |איפה |למה |איך /i.test(stem)) {
      out.patternFamily = "comprehension_wh";
      out.subtype = "literal_detail";
    } else if (/מה המשמעות של/i.test(stem)) {
      out.patternFamily = "comprehension_lexical";
      out.subtype = "word_in_context";
    } else if (/מה ההפך/i.test(stem)) {
      out.patternFamily = "comprehension_antonym";
      out.subtype = "opposite";
    } else if (/סדר אירועים|מה קרה קודם/i.test(stem)) {
      out.patternFamily = "comprehension_sequence";
      out.subtype = "event_order";
    }
  } else if (topic === "grammar") {
    if (/איזה משפט נכון/i.test(stem)) {
      out.patternFamily = "grammar_correct_sentence";
      out.subtype = "sentence_judgment";
    } else if (/מה חלק הדיבר/i.test(stem)) {
      out.patternFamily = "grammar_pos";
      out.subtype = "part_of_speech";
    } else if (/מה חלקי דיבר|חלקי דיבר\?/i.test(stem)) {
      out.patternFamily = "grammar_pos_inventory";
      out.subtype = "pos_list";
    } else if (/מילת הקישור|קישור במשפט/i.test(stem)) {
      out.patternFamily = "grammar_connective";
      out.subtype = "linking_word";
    } else if (/נטיית הפועל|נטיות פועל|מה נטיית/i.test(stem)) {
      out.patternFamily = "grammar_verb_conjugation";
      out.subtype = "verb_form";
    } else if (/מה הכתבה|כללי כתיב/i.test(stem)) {
      out.patternFamily = "grammar_spelling_meta";
      out.subtype = "orthography";
    } else if (/מה התאמה|צורות פועל/i.test(stem)) {
      out.patternFamily = "grammar_agreement_forms";
      out.subtype = "agreement";
    } else if (/שייכות|מילות יחס מורכבות|התאמה של פועל/i.test(stem)) {
      out.patternFamily = "grammar_relation_agreement";
      out.subtype = "syntax_relation";
    } else if (/דקדוק אקדמי|דקדוק ברמת חטיבה|שפה פורמלית|מבנים מורכבים/i.test(
      stem
    )) {
      out.patternFamily = "grammar_academic_register";
      out.subtype = g >= 6 ? "secondary_meta" : "formal_style";
    } else if (/זמן|הטיה|התאמה בין גוף לפועל|ציווי|שאלה/i.test(stem)) {
      out.patternFamily = "grammar_tense_agreement";
      out.subtype = "verb_syntax";
    } else if (/ניקוד|שורש|בניין|דקדוק מורכב|תחביר/i.test(stem)) {
      out.patternFamily = "grammar_morphology";
      out.subtype = "advanced_form";
    }
  } else if (topic === "writing") {
    if (/איך כותבים/i.test(stem)) {
      out.patternFamily = "writing_spelling";
      out.subtype = "word_spelling";
    } else if (/מבנה חיבור|טיוטה|מתווה|פתיחה וסיום/i.test(stem)) {
      out.patternFamily = "writing_structure";
      out.subtype = g >= 4 ? "outline_meta" : "sentence_plan";
    } else if (/חיבור|מחקר|סיכום|דעה מנומקת|אקדמי/i.test(stem)) {
      out.patternFamily = "writing_genre_prompt";
      out.subtype = g >= 5 ? "essay_meta" : "sentence_meta";
    }
  } else if (topic === "speaking") {
    if (/איך אומרים|איך מציגים|דיון|מצגת/i.test(stem)) {
      out.patternFamily = "speaking_phrase";
      out.subtype = /מצגת|דיון/.test(stem) ? "presentation" : "formulaic";
    } else if (/מה התשובה הנכונה|מה אומרים/i.test(stem)) {
      out.patternFamily = "speaking_routine";
      out.subtype = "dialogue";
    } else if (/הקשבה|תרגול הגייה|הגיית/i.test(stem)) {
      out.patternFamily = "speaking_pronunciation";
      out.subtype = "oral_form";
    }
  }

  if (lev === "hard") {
    out.allowedLevels = ["medium", "hard"];
  } else if (lev === "medium") {
    out.allowedLevels = ["easy", "medium", "hard"];
  } else {
    out.allowedLevels = ["easy", "medium"];
  }
  out.suggestedAllowedLevels = out.allowedLevels;

  if (stem.length > 180 && lev === "easy") {
    out.difficultyBand = "medium";
  }
  if (g >= 5 && /אקדמי|ניתוח|מחקר|מנומקת/i.test(stem) && lev !== "hard") {
    out.difficultyBand = lev === "easy" ? "medium" : lev;
  }

  const wideFamiliesBandSplit = new Set([
    "writing_spelling",
    "reading_passage_style",
    "speaking_phrase",
    "comprehension_typed",
    "speaking_typed",
  ]);
  if (wideFamiliesBandSplit.has(out.patternFamily)) {
    const band =
      g <= 2 ? "band_early_g1_g2" : g <= 4 ? "band_mid_g3_g4" : "band_late_g5_g6";
    out.patternFamily = `${out.patternFamily}_${band}`;
  }

  if (topic === "grammar" && out.patternFamily === "grammar_typed") {
    out.patternFamily = `grammar_typed_g${g}_${lev}`;
    out.subtype = out.subtype === "general" ? `legacy_${lev}` : out.subtype;
  }

  return out;
}
