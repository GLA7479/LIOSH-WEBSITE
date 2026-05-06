/**
 * Hybrid question sourcing: real bank rows where available, otherwise synthetic placeholder rows.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pick } from "./prng.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..", "..");

const scienceUrl = pathToFileURL(path.join(ROOT, "data", "science-questions.js")).href;
const { SCIENCE_QUESTIONS } = await import(scienceUrl);

const g4Url = pathToFileURL(path.join(ROOT, "data", "hebrew-questions", "g4.js")).href;
const { G4_EASY_QUESTIONS } = await import(g4Url);

const mathGeneratorUrl = pathToFileURL(path.join(ROOT, "utils", "math-question-generator.js")).href;
const mathStorageUrl = pathToFileURL(path.join(ROOT, "utils", "math-storage.js")).href;
const mathConstantsUrl = pathToFileURL(path.join(ROOT, "utils", "math-constants.js")).href;
const englishPoolsUrl = pathToFileURL(path.join(ROOT, "data", "english-questions", "index.js")).href;
const gradeGatingUrl = pathToFileURL(path.join(ROOT, "utils", "grade-gating.js")).href;
const geometryGeneratorUrl = pathToFileURL(path.join(ROOT, "utils", "geometry-question-generator.js")).href;
const geometryConstantsUrl = pathToFileURL(path.join(ROOT, "utils", "geometry-constants.js")).href;
const moledetGeneratorUrl = pathToFileURL(path.join(ROOT, "utils", "moledet-geography-question-generator.js")).href;
const moledetStorageUrl = pathToFileURL(path.join(ROOT, "utils", "moledet-geography-storage.js")).href;

const mathGeneratorMod = await import(mathGeneratorUrl);
const mathStorageMod = await import(mathStorageUrl);
const mathConstantsMod = await import(mathConstantsUrl);
const englishPoolsMod = await import(englishPoolsUrl);
const gradeGatingMod = await import(gradeGatingUrl);
const geometryGeneratorMod = await import(geometryGeneratorUrl);
const geometryConstantsMod = await import(geometryConstantsUrl);
const moledetGeneratorMod = await import(moledetGeneratorUrl);
const moledetStorageMod = await import(moledetStorageUrl);

const HEBREW_TOPIC_MAP = {
  reading_comprehension: "reading",
  vocabulary: "vocabulary",
  fact_vs_opinion: "reading",
  sequence: "reading",
  main_idea: "reading",
  inference: "reading",
};

const MATH_TOPIC_MAP = {
  addition: "addition",
  subtraction: "subtraction",
  multiplication: "multiplication",
  division: "division",
  fractions: "fractions",
  word_problems: "word_problems",
  place_value: "number_sense",
  comparison: "compare",
  patterns: "sequences",
};

const GEOMETRY_TOPIC_MAP = {
  shapes: "shapes_basic",
  area: "area",
  perimeter: "perimeter",
  angles: "angles",
  symmetry: "symmetry",
};

const MOLEDET_TOPIC_MAP = {
  map_reading: ["maps", "geography"],
  basic_geography: ["geography", "maps"],
  places: ["places", "homeland", "location", "geography"],
  directions: ["directions", "maps", "geography"],
  community: ["community", "homeland", "citizenship"],
};

function normalizeDifficulty(difficulty) {
  const d = String(difficulty || "").toLowerCase();
  if (d === "easy" || d === "medium" || d === "hard") return d;
  return "medium";
}

function gradeNum(grade) {
  const m = String(grade || "").match(/^g(\d)$/);
  return m ? parseInt(m[1], 10) : 4;
}

function gradeKey(grade) {
  const g = gradeNum(grade);
  return `g${Math.min(6, Math.max(1, g || 4))}`;
}

function safeText(v) {
  return String(v == null ? "" : v).trim();
}

function normalizedRow(sourceId, questionText, correctAnswer, questionId) {
  const qt = safeText(questionText);
  const ca = safeText(correctAnswer);
  if (!qt || !ca) return null;
  return {
    source: "real",
    questionText: qt,
    correctAnswer: ca,
    questionId: safeText(questionId || sourceId),
  };
}

function normalizeGeneratorResult(raw, fallbackId) {
  if (!raw || raw.emptyPool) return null;
  const qText = safeText(raw.question || raw.exerciseText);
  const directCorrect = safeText(raw.correctAnswer);
  const opts = Array.isArray(raw.answers) ? raw.answers : Array.isArray(raw.options) ? raw.options : [];
  const ci = Number(raw.correctIndex);
  const indexedCorrect = ci >= 0 && ci < opts.length ? safeText(opts[ci]) : "";
  return normalizedRow(
    fallbackId,
    qText,
    directCorrect || indexedCorrect,
    raw.questionId || raw.skillId || raw.params?.kind || raw.operation || fallbackId,
  );
}

function scienceMatchesGrade(q, grade) {
  const g = String(grade || "");
  return Array.isArray(q.grades) && q.grades.includes(g);
}

function pickScienceQuestion(rng, grade, topic) {
  const g = String(grade || "");
  let pool = SCIENCE_QUESTIONS.filter((q) => scienceMatchesGrade(q, g));
  if (topic && topic !== "general") {
    const t = String(topic);
    const narrowed = pool.filter((q) => String(q.topic || "") === t || String(q.topic || "").includes(t.split("_")[0]));
    if (narrowed.length) pool = narrowed;
  }
  if (!pool.length) pool = SCIENCE_QUESTIONS.filter((q) => scienceMatchesGrade(q, g));
  if (!pool.length) pool = SCIENCE_QUESTIONS.slice(0, 120);
  return pick(rng, pool);
}

function pickHebrewQuestion(rng, grade, topicKey) {
  const g = gradeNum(grade);
  const htKey = HEBREW_TOPIC_MAP[topicKey] || "reading";
  if (g >= 4 && G4_EASY_QUESTIONS?.[htKey]?.length) {
    return pick(rng, G4_EASY_QUESTIONS[htKey]);
  }
  const keys = Object.keys(G4_EASY_QUESTIONS || {});
  for (const k of keys) {
    const arr = G4_EASY_QUESTIONS[k];
    if (arr?.length) return pick(rng, arr);
  }
  return null;
}

function resolveMathQuestion(rng, grade, topic, difficulty) {
  const gk = gradeKey(grade);
  const opRequested = MATH_TOPIC_MAP[String(topic || "")] || "addition";
  const allowedOps = Array.isArray(mathConstantsMod?.GRADES?.[gk]?.operations) ? mathConstantsMod.GRADES[gk].operations : [];
  const op = allowedOps.includes(opRequested) ? opRequested : allowedOps.find((x) => x !== "mixed") || opRequested;
  const level = normalizeDifficulty(difficulty);
  const levelConfig = mathStorageMod.getLevelConfig(gradeNum(gk), level);
  const raw = mathGeneratorMod.generateQuestion(levelConfig, op, gk, null);
  return normalizeGeneratorResult(raw, `math_${op}`);
}

function englishItemFitsGrade(gating, category, poolKey, item, grade) {
  if (typeof gating?.englishPoolItemAllowedWithClassSplit === "function") {
    return gating.englishPoolItemAllowedWithClassSplit(category, poolKey, item, grade);
  }
  return true;
}

function englishDifficultyAllowed(item, difficulty) {
  const d = normalizeDifficulty(difficulty);
  const id = String(item?.difficulty || "").toLowerCase();
  if (!id) return true;
  if (d === "easy") return id === "basic" || id === "easy";
  if (d === "medium") return id === "standard" || id === "medium" || id === "basic";
  return id === "advanced" || id === "hard" || id === "standard";
}

function pushEnglishFamilyRows(target, pools, gating, grade, difficulty, category, poolKeys) {
  const map =
    category === "grammar"
      ? pools.GRAMMAR_POOLS
      : category === "sentence"
        ? pools.SENTENCE_POOLS
        : pools.TRANSLATION_POOLS;
  for (const key of poolKeys) {
    const arr = Array.isArray(map?.[key]) ? map[key] : [];
    for (const item of arr) {
      if (!englishItemFitsGrade(gating, category, key, item, grade)) continue;
      if (!englishDifficultyAllowed(item, difficulty)) continue;
      target.push({ category, poolKey: key, item });
    }
  }
}

function buildEnglishWordRows(wordLists, grade, difficulty) {
  const d = normalizeDifficulty(difficulty);
  const g = gradeNum(grade);
  const keys = Object.keys(wordLists || {});
  const out = [];
  for (const listName of keys) {
    const map = wordLists[listName];
    if (!map || typeof map !== "object") continue;
    const entries = Object.entries(map);
    for (const [en, he] of entries) {
      if (!safeText(en) || !safeText(he)) continue;
      if (d === "easy" && g >= 5 && listName === "sports") continue;
      out.push({ listName, en: String(en), he: String(he) });
    }
  }
  return out;
}

function pickEnglishDistractors(rng, candidates, correctValue, count) {
  const pool = candidates.filter((x) => safeText(x) && safeText(x) !== safeText(correctValue));
  const out = [];
  while (pool.length > 0 && out.length < count) {
    const v = pick(rng, pool);
    const idx = pool.indexOf(v);
    if (idx >= 0) pool.splice(idx, 1);
    out.push(v);
  }
  return out;
}

function normalizeEnglishRow(rng, row, fallbackId) {
  const { category, poolKey, item } = row;
  if (category === "translation") {
    const allHe = [];
    const questionText = `Translate to Hebrew: "${safeText(item.en)}"`;
    if (!safeText(item.en) || !safeText(item.he)) return null;
    allHe.push(String(item.he));
    return normalizedRow(`english_translation_${poolKey}`, questionText, item.he, `${fallbackId}_${poolKey}_${safeText(item.patternFamily || item.en)}`);
  }
  if (category === "wordlist") {
    const allHe = Array.isArray(row.allHe) ? row.allHe : [];
    const distractors = pickEnglishDistractors(rng, allHe, row.he, 3);
    if (distractors.length < 2) return null;
    return normalizedRow(
      `english_word_${row.listName}`,
      `What is the Hebrew meaning of "${safeText(row.en)}"?`,
      row.he,
      `${fallbackId}_${row.listName}_${safeText(row.en)}`,
    );
  }
  const stem = safeText(item.question || item.template);
  const correct = safeText(item.correct);
  return normalizedRow(`english_${category}_${poolKey}`, stem, correct, `${fallbackId}_${poolKey}_${safeText(item.patternFamily || stem).slice(0, 48)}`);
}

function resolveEnglishQuestion(rng, grade, topic, difficulty) {
  const rows = [];
  const topicKey = String(topic || "");
  if (topicKey === "grammar_basics") {
    pushEnglishFamilyRows(rows, englishPoolsMod, gradeGatingMod, grade, difficulty, "grammar", Object.keys(englishPoolsMod.GRAMMAR_POOLS || {}));
  } else if (topicKey === "sentence_understanding" || topicKey === "reading_comprehension") {
    pushEnglishFamilyRows(rows, englishPoolsMod, gradeGatingMod, grade, difficulty, "sentence", Object.keys(englishPoolsMod.SENTENCE_POOLS || {}));
    pushEnglishFamilyRows(rows, englishPoolsMod, gradeGatingMod, grade, difficulty, "grammar", ["present_simple", "past_simple", "question_frames", "comparatives"]);
  } else if (topicKey === "vocabulary") {
    pushEnglishFamilyRows(rows, englishPoolsMod, gradeGatingMod, grade, difficulty, "translation", Object.keys(englishPoolsMod.TRANSLATION_POOLS || {}));
    const words = buildEnglishWordRows(englishPoolsMod.WORD_LISTS, grade, difficulty);
    const allHe = words.map((w) => w.he);
    for (const w of words) rows.push({ category: "wordlist", ...w, allHe });
  } else if (topicKey === "matching") {
    const words = buildEnglishWordRows(englishPoolsMod.WORD_LISTS, grade, difficulty);
    const allHe = words.map((w) => w.he);
    for (const w of words) rows.push({ category: "wordlist", ...w, allHe });
    pushEnglishFamilyRows(rows, englishPoolsMod, gradeGatingMod, grade, difficulty, "translation", ["classroom", "routines", "hobbies"]);
  } else {
    pushEnglishFamilyRows(rows, englishPoolsMod, gradeGatingMod, grade, difficulty, "grammar", Object.keys(englishPoolsMod.GRAMMAR_POOLS || {}));
    pushEnglishFamilyRows(rows, englishPoolsMod, gradeGatingMod, grade, difficulty, "sentence", Object.keys(englishPoolsMod.SENTENCE_POOLS || {}));
  }
  if (!rows.length) return null;
  const row = pick(rng, rows);
  return normalizeEnglishRow(rng, row, `english_${topicKey || "general"}`);
}

function resolveGeometryQuestion(rng, grade, topic, difficulty) {
  const gk = gradeKey(grade);
  const mappedTopic = GEOMETRY_TOPIC_MAP[String(topic || "")] || "shapes_basic";
  const allowedTopics = Array.isArray(geometryConstantsMod?.GRADES?.[gk]?.topics) ? geometryConstantsMod.GRADES[gk].topics : [];
  const selected = allowedTopics.includes(mappedTopic)
    ? mappedTopic
    : allowedTopics.find((t) => ["shapes_basic", "area", "perimeter", "angles", "symmetry"].includes(t)) || mappedTopic;
  const level = normalizeDifficulty(difficulty);
  const levelCfg = geometryConstantsMod?.LEVELS?.[level];
  if (!levelCfg) return null;
  const raw = geometryGeneratorMod.generateQuestion(levelCfg, selected, gk, null);
  return normalizeGeneratorResult(raw, `geometry_${selected}`);
}

function resolveMoledetQuestion(rng, grade, topic, difficulty) {
  const gk = gradeKey(grade);
  const level = normalizeDifficulty(difficulty);
  const levelCfg = moledetStorageMod.getLevelConfig(gradeNum(gk), level);
  const topicCandidates = MOLEDET_TOPIC_MAP[String(topic || "")] || ["homeland", "geography", "maps"];
  for (const mapped of topicCandidates) {
    const raw = moledetGeneratorMod.generateQuestion(levelCfg, mapped, gk, null);
    const n = normalizeGeneratorResult(raw, `moledet_${mapped}`);
    if (n) return n;
  }
  return null;
}

/**
 * @returns {{ source: "real"|"placeholder", questionText: string, correctAnswer: string, questionId: string } | null}
 */
export function resolveHybridQuestionRow(rng, { grade, subject, topic, difficulty }) {
  if (subject === "science") {
    const q = pickScienceQuestion(rng, grade, topic);
    if (!q) return null;
    const stem = String(q.stem || "").trim();
    const opts = Array.isArray(q.options) ? q.options : [];
    const ci = Number(q.correctIndex);
    const correct = opts[ci] != null ? String(opts[ci]) : "";
    return {
      source: "real",
      questionText: stem,
      correctAnswer: correct,
      questionId: String(q.id || "science_bank"),
    };
  }

  if (subject === "hebrew") {
    const row = pickHebrewQuestion(rng, grade, topic);
    if (!row) return null;
    return {
      source: "real",
      questionText: String(row.question || "").trim(),
      correctAnswer: Array.isArray(row.answers) ? String(row.answers[row.correct] ?? "") : "",
      questionId: String(row.skillId || "hebrew_bank"),
    };
  }

  if (subject === "math") {
    return resolveMathQuestion(rng, grade, topic, difficulty);
  }

  if (subject === "english") {
    return resolveEnglishQuestion(rng, grade, topic, difficulty);
  }

  if (subject === "geometry") {
    return resolveGeometryQuestion(rng, grade, topic, difficulty);
  }

  if (subject === "moledet_geography") {
    return resolveMoledetQuestion(rng, grade, topic, difficulty);
  }

  return null;
}
