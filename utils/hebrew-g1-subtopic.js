import {
  G1_FLAGS_DEFAULT,
  pickG1SubtopicId,
  getG1SubtopicSpec,
} from "../data/hebrew-g1-content-map";

/**
 * היסק תת־נושא לשאלת legacy / עשירה ללא שדה subtopicId (כיתה א׳ בלבד).
 * @param {string} stem
 * @param {string} topicKey
 * @returns {string}
 */
export function inferG1SubtopicIdFromStem(stem, topicKey) {
  const s = String(stem || "").trim();
  const low = s.toLowerCase();

  if (topicKey === "reading") {
    if (/פונול|צלילים|הבחנה|שומעים|נשמעים/.test(low)) return "g1.phoneme_awareness";
    if (/הברה\s+פתוחה|הברה\s+סגורה|סוגרת|פתוחה/.test(low)) return "g1.open_close_syllable";
    if (/חרוז|מחרוזת/.test(low)) return "g1.rhyme";
    if (/מספר\s+הברות|הברות\s+במילה/.test(low)) return "g1.syllables";
    if (/ניקוד|תנועה|קמץ|פתח|צירה|חולם|שורוק|חיריק/.test(low)) return "g1.basic_niqqud";
    if (/צליל.*אות|אות.*צליל|התאמ.*צליל/.test(low)) return "g1.sound_letter_match";
    if (/אות\s+סופית|סופית|ך|ם|ן|ף|ץ/.test(low)) return "g1.final_letters";
    if (/איזה\s+אות\s+חסרה|אות\s+חסרה|מה\s+האות\s+הראשונה|האות\s+הראשונה|מה\s+האות\s+האחרונה|איזה\s+אות\s+רואים/.test(low))
      return "g1.letters";
    if (/קרא\s+את\s+המילה|קראו\s+את\s+המילה/.test(low)) return "g1.simple_words_read";
    if (/מה\s+המילה\s+הנכונה|המילה\s+הנכונה|בחרו\s+מילה|השלם\s+את\s+המילה/.test(low)) return "g1.simple_words_read";
    return "g1.simple_words_read";
  }

  if (topicKey === "comprehension") {
    if (/עקוב|סמן|הקף|לפי\s+ההוראה|הוראה\s+פשוטה/.test(low)) return "g1.simple_instruction";
    if (/מי\s|מה\s|איפה\s|מתי\s|למה\s|איך\s.*\?/.test(low) && s.length > 20) return "g1.one_sentence_who_what";
    if (/מה\s+ההפך|ההפך\s+של|נכון\s*\/\s*לא|האם\s+נכון|אמת\s+או\s+שקר/.test(low)) return "g1.one_sentence_who_what";
    if (/מה\s+המשמעות\s+של\s+המילה|משמעות\s+של\s+'/.test(low)) return "g1.word_meaning_concrete";
    return "g1.word_meaning_concrete";
  }

  if (topicKey === "writing") {
    if (/איך\s+כותבים\s+את\s+המילה|איך\s+כותבים/.test(low)) return "g1.copy_word";
    if (/בחרו\s+משפט|ניסוח\s+תקין|איזה\s+משפט/.test(low)) return "g1.spell_word_choice";
    return "g1.spell_word_choice";
  }

  if (topicKey === "grammar") {
    return "g1.noun_verb_adj_basic";
  }

  if (topicKey === "vocabulary") {
    if (/תמונה|תמונות/.test(low)) return "g1.word_picture";
    if (/מה\s+המשמעות|משמעות\s+של/.test(low)) return "g1.word_meaning_concrete";
    return "g1.word_meaning_concrete";
  }

  if (topicKey === "speaking") {
    return "g1.phrase_appropriateness";
  }

  return "g1.simple_words_read";
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} topicKey
 */
export function resolveG1ItemSubtopicId(raw, topicKey) {
  if (raw && typeof raw === "object" && raw.subtopicId != null && String(raw.subtopicId).trim()) {
    return String(raw.subtopicId).trim();
  }
  return inferG1SubtopicIdFromStem(String(raw?.question ?? ""), topicKey);
}

/**
 * מצר את הבריכה לתת־נושא שנבחר; אם אין התאמות — מחזיר את המקור.
 * @param {unknown[]} merged
 * @param {string} topicKey
 * @param {string} pickedSubtopicId
 * @returns {unknown[]}
 */
export function narrowHebrewG1Pool(merged, topicKey, pickedSubtopicId) {
  if (!Array.isArray(merged) || merged.length === 0) return merged;
  const match = merged.filter(
    (row) => resolveG1ItemSubtopicId(row, topicKey) === pickedSubtopicId
  );
  return match.length > 0 ? match : merged;
}

/**
 * @param {string} gradeKey
 * @param {string} topicKey
 * @param {unknown[]} mergedList
 * @returns {{ merged: unknown[], pickedSubtopicId: string|null }}
 */
export function withG1SubtopicPreference(gradeKey, topicKey, mergedList) {
  if (String(gradeKey || "").toLowerCase() !== "g1" || !Array.isArray(mergedList) || mergedList.length === 0) {
    return { merged: mergedList, pickedSubtopicId: null };
  }
  const picked = pickG1SubtopicId(topicKey);
  const narrowed = narrowHebrewG1Pool(mergedList, topicKey, picked);
  return { merged: narrowed, pickedSubtopicId: picked };
}

/**
 * שדות params נוספים לכיתה א׳ בלבד (לפי נושא UI + גזע השאלה).
 * @param {string} topicKey
 * @param {Record<string, unknown>} rawPick
 */
export function attachG1SubtopicParams(topicKey, rawPick) {
  const subtopicId = resolveG1ItemSubtopicId(rawPick, topicKey);
  const spec = getG1SubtopicSpec(topicKey, subtopicId);
  const flags = spec?.flags ? { ...spec.flags } : { ...G1_FLAGS_DEFAULT };
  return {
    subtopicId,
    subtopicFlags: flags,
    modesAllowed: spec?.modesAllowed
      ? [...spec.modesAllowed]
      : ["learning", "challenge", "speed", "marathon", "practice"],
  };
}
