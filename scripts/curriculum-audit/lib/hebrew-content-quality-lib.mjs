/**
 * Hebrew generator stem/content analysis — shared by runtime gate + sampled quality report.
 * Thresholds are heuristic; documented inline for owner review.
 */

/** Max stem chars before FAIL (clear leakage) — grades 1–2 only */
export const G12_FAIL_MAX_CHARS = {
  g1: {
    comprehension: 520,
    reading: 440,
    writing: 380,
    grammar: 300,
    vocabulary: 260,
    speaking: 340,
  },
  g2: {
    comprehension: 780,
    reading: 620,
    writing: 540,
    grammar: 440,
    vocabulary: 400,
    speaking: 560,
  },
};

/** Advisory band (borderline; does not fail gate alone) */
export const G12_ADVISORY_MIN_CHARS = {
  g1: {
    comprehension: 340,
    reading: 280,
    writing: 240,
    grammar: 200,
    vocabulary: 180,
    speaking: 220,
  },
  g2: {
    comprehension: 500,
    reading: 400,
    writing: 360,
    grammar: 300,
    vocabulary: 260,
    speaking: 340,
  },
};

/** “Long block”: single contiguous paragraph over this length (chars) suggests embedded passage */
export const G12_LONG_PARAGRAPH_FAIL = { g1: 260, g2: 380 };

/** Too many explicit newlines → multi-block reading passage */
export const G12_MAX_NEWLINES_FAIL = { g1: 5, g2: 8 };

/**
 * Advanced / upper-primary grammar lexicon — should not dominate stems in כיתות א׳–ב׳.
 * Matching any two distinct patterns, or one “heavy” pattern, is a FAIL for g1/g2 grammar topic or when grade ≤ 2.
 */
export const ADVANCED_GRAMMAR_PATTERNS = [
  /שייכות|שייכות\s+הפועל|התאמת\s+פועל[-–]נושא/i,
  /מילות\s+יחס\s+מורכבות/i,
  /תחביר\s+מורכב|משפט\s+מורכב|משפטים\s+מורכבים/i,
  /נטיות?\s+פועל\s+בזמנים?\s+לא\s+סדירים/i,
  /שורש\s+[א-ת]{2,4}\s+ובניין/i,
  /גזרות?\s+לא\s+שגרתיות|גזרת\s+חזקה/i,
  /מקור\s+עברי|שם\s+הפועל\s+בבניין\s+הפעיל\s+השלם/i,
];

export const ADVANCED_GRAMMAR_HEAVY = [/חזקת\s+הפועל|שורש\s+וע\b/i];

/** Writing prompts inappropriate for g1/g2 */
export const ADVANCED_WRITING_PROMPT_PATTERNS = [
  /חיבור\s+של\s+(שלוש|ארבע|\d+)\s+פסקאות/i,
  /כתוב\s+חיבור\s+טיעוני/i,
  /נסח\s+מסה\s+מלאה/i,
  /פתיחה\s*[\u2013\-]\s*גוף\s*[\u2013\-]\s*סיום(?!\s*קצר)/i,
  /שלוש\s+פסקאות\s+לפחות/i,
];

/**
 * @param {unknown} q
 * @returns {string}
 */
export function extractStemText(q) {
  const raw = q?.question ?? q?.exerciseText ?? q?.stem ?? "";
  return String(raw || "");
}

/**
 * @param {string} text
 * @returns {number}
 */
export function longestParagraphLen(text) {
  const parts = String(text || "").split(/\n\s*\n|<br\s*\/?>/i);
  let m = 0;
  for (const p of parts) {
    const L = p.replace(/\s+/g, " ").trim().length;
    if (L > m) m = L;
  }
  return m;
}

/**
 * @param {number} gradeNum 1 or 2
 * @param {string} topic
 * @param {string} stem
 * @returns {{ failures: string[], advisories: string[], metrics: object }}
 */
export function analyzeG12Stem(gradeNum, topic, stem) {
  const gk = gradeNum === 1 ? "g1" : "g2";
  const failures = [];
  const advisories = [];
  const text = String(stem || "");
  const len = text.length;
  const nl = (text.match(/\n/g) || []).length;
  const failMax = G12_FAIL_MAX_CHARS[gk][topic] ?? G12_FAIL_MAX_CHARS[gk].comprehension;
  const advMin = G12_ADVISORY_MIN_CHARS[gk][topic] ?? G12_ADVISORY_MIN_CHARS[gk].comprehension;

  if (len > failMax) {
    failures.push(`stem_length_${len}_exceeds_fail_max_${failMax}`);
  } else if (len >= advMin) {
    advisories.push(`stem_length_${len}_advisory_band_${advMin}_${failMax}`);
  }

  const paraCap = G12_LONG_PARAGRAPH_FAIL[gk];
  const longestPara = longestParagraphLen(text);
  if (longestPara > paraCap) {
    failures.push(`long_paragraph_${longestPara}_chars_gt_${paraCap}`);
  }

  const nlCap = G12_MAX_NEWLINES_FAIL[gk];
  if (nl > nlCap) {
    failures.push(`newline_blocks_${nl}_gt_${nlCap}`);
  }

  let gramHits = 0;
  for (const re of ADVANCED_GRAMMAR_PATTERNS) {
    if (re.test(text)) gramHits++;
  }
  let heavy = false;
  for (const re of ADVANCED_GRAMMAR_HEAVY) {
    if (re.test(text)) heavy = true;
  }

  if (gradeNum <= 2) {
    if (heavy) failures.push("advanced_grammar_heavy_pattern");
    else if (topic === "grammar") {
      if (gramHits >= 2) failures.push(`advanced_grammar_in_young_grammar_topic_hits_${gramHits}`);
    } else if (gramHits >= 1) {
      failures.push(`advanced_grammar_lexicon_leaked_into_${topic}_hits_${gramHits}`);
    }
  }

  if (gradeNum <= 2) {
    for (const re of ADVANCED_WRITING_PROMPT_PATTERNS) {
      if (re.test(text)) {
        failures.push(`advanced_writing_prompt_pattern:${re.source.slice(0, 48)}`);
        break;
      }
    }
  }

  return {
    failures,
    advisories,
    metrics: {
      stemChars: len,
      newlineCount: nl,
      longestParagraphChars: longestPara,
      advancedGrammarPatternHits: gramHits,
      failMaxChars: failMax,
    },
  };
}

/**
 * Grade 3–4: corpus-level signals. Each bucket merges **stem Hebrew** hints + **generator kind** substrings
 * (e.g. g3.compare_light) so we validate real product metadata, not only literal phrases in stems.
 */
export const UPPER_G34_SIGNALS = {
  inference: [
    /מה\s+ניתן\s+להסיק|להסיק|מסקנה|למה\s+לדעתך|הסקת|הסקה/i,
    /compare_light|cause_effect|inference|השוואה|היקש/i,
  ],
  locating: [
    /מצאו|איתור|באיזה\s+פסקה|לפי\s+הטקסט|פרטים|מידע|בפסקה|בטקסט/i,
    /explicit_only|detail|מיקום|איפה\s+בטקסט|position/i,
  ],
  sequence: [
    /סדר|רצף|מה\s+קרה\s+קודם|לפני|אחרי|קודם|המשך/i,
    /multi_sentence|sequence|simple_sequence|סדר/i,
  ],
  mainIdea: [
    /רעיון\s+מרכזי|עיקר|נושא\s+הטקסט|מה\s+המשמעות|מה\s+מספר\s+הטקסט/i,
    /main_idea|genre|detail_main|word_meaning|עיקר/i,
  ],
};

/** Grade 5–6 — stems + kinds (g5.inference, g6.evidence_from_text, …) */
export const UPPER_G56_SIGNALS = {
  deeperComprehension: [
    /ניתוח|השוואה|עמדה|פרשנות|מורכב|שכבות|ביקורת|ראיה|ציטוט/i,
    /multiple_perspectives|inference|critical_evaluation|evidence_from_text|complex_text|compare_genres/i,
  ],
  argumentWriting: [
    /טיעון|נימוק|חיבור|הסבר\s+את\s+דעתך|חיבור\s+טיעוני|מבנה\s+חיבור/i,
    /argument|composition|scaffold|debate|טיעוני/i,
  ],
  connectors: [
    /מילות\s+קישור|לכן|משום\s+כך|בנוסף|לעומת\s+זאת|מצד\s+שני|אולם/i,
    /connector|מילות_קישור|connectors/i,
  ],
  vocabInContext: [
    /בהקשר|משמעות\s+המילה|לפי\s+ההקשר|הסבר\s+את\s+משמעות|שדה\s+סמנטי|מה\s+משמעות|בחרו\s+(את\s+)?המילה/i,
    /context_meaning|semantic_fields|word_families|academic_vocab|discipline_words|discipline|academic|vocab|מילים\s+מתקדמות/i,
  ],
};

/**
 * @param {string[]} stems
 * @param {Record<string, RegExp[]>} buckets
 * @returns {Record<string, boolean>}
 */
export function coverageBuckets(stems, buckets) {
  const joined = stems.join("\n---\n");
  /** @type {Record<string, boolean>} */
  const out = {};
  for (const [key, patterns] of Object.entries(buckets)) {
    out[key] = patterns.some((re) => re.test(joined));
  }
  return out;
}

/**
 * Join stem + kind per row so subtopic ids participate in coverage (more stable than stem-only Hebrew).
 * @param {string[]} stems
 * @param {string[]} kinds parallel to stems
 */
export function coverageBucketsWithKinds(stems, kinds, buckets) {
  const merged = stems.map((s, i) => `${s}\n${kinds[i] || ""}`);
  return coverageBuckets(merged, buckets);
}

/**
 * @param {{ g34?: Record<string, boolean>, g56g5?: Record<string, boolean>, g56g6?: Record<string, boolean> }} cov
 * @returns {{ passed: boolean, missing: string[] }}
 */
export function evaluateUpperGradeCoverage(cov) {
  const missing = [];
  const g34 = cov.g34 || {};
  for (const k of Object.keys(UPPER_G34_SIGNALS)) {
    if (!g34[k]) missing.push(`g3_g4_missing_${k}`);
  }
  const g5 = cov.g56g5 || {};
  for (const k of Object.keys(UPPER_G56_SIGNALS)) {
    if (!g5[k]) missing.push(`g5_missing_${k}`);
  }
  const g6 = cov.g56g6 || {};
  for (const k of Object.keys(UPPER_G56_SIGNALS)) {
    if (!g6[k]) missing.push(`g6_missing_${k}`);
  }
  return { passed: missing.length === 0, missing };
}
