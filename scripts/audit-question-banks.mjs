/**
 * סריקה כמותית של מאגרי שאלות: עברית, אנגלית, גיאומטריה (קונספטואלי + דגימת גנרטור),
 * מתמטיקה (דגימת גנרטור).
 *
 * פלט: reports/question-audit/items.json, items.csv, findings.json, stage2.json
 *
 * הרצה: npm run audit:questions
 *    (דורש tsx לייבוא מודולי הפרויקט ללא סיומת .js בנתיבים פנימיים)
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-audit");

/** נקודת התחלה קבועה ל־LCG — דגימות אודיט חוזרות בין ריצות (עם אותו קוד). */
const AUDIT_RNG_BASE = 0x4c104334;

function runWithAuditRandom(seed, fn) {
  const orig = Math.random;
  let s = (AUDIT_RNG_BASE + (seed >>> 0)) >>> 0;
  Math.random = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  try {
    return fn();
  } finally {
    Math.random = orig;
  }
}

/** מאחד סוגי kind מקובץ harness (combos + רשימות forced בראש הקובץ). */
function loadHarnessKindSet(fileName) {
  const p = join(OUT_DIR, fileName);
  try {
    const j = JSON.parse(readFileSync(p, "utf8"));
    const kinds = new Set();
    for (const v of Object.values(j.combos || {})) {
      for (const k of v.kinds || []) kinds.add(String(k));
    }
    for (const key of ["mathForcedKinds", "geoForcedKinds"]) {
      if (Array.isArray(j[key])) {
        for (const k of j[key]) kinds.add(String(k));
      }
    }
    return kinds;
  } catch {
    return new Set();
  }
}

function modUrl(rel) {
  return pathToFileURL(join(ROOT, rel)).href;
}

const {
  ENGLISH_GRAMMAR_POOL_RANGE,
  ENGLISH_TRANSLATION_POOL_RANGE,
  ENGLISH_SENTENCE_POOL_RANGE,
  gradeBandForKey,
} = await import(modUrl("utils/grade-gating.js"));

/** מיפוי דטרמיניסטי ל־spine `english:grammar:line:*` (ללא regex) — Phase 7.19 */
const EGG_LINE_ID = {
  G1_EXPOSURE:
    "english:grammar:line:חשיפה_ל_i_am_you_are_ולכינויי_גוף_בסיסיים_בתוך_תבניות_קבועות",
  G2_BE: "english:grammar:line:חיזוק_to_be_am_is_are_וכינויי_גוף",
  G2_PLURAL_QUESTIONS:
    "english:grammar:line:ריבוי_שמות_עצם_והיכרות_עם_מבני_שאלות_פשוטים",
  G3_ADJECTIVES_ARTICLES_PREPS:
    "english:grammar:line:תארים_בסיסיים_יידוע_a_an_the_ומילות_יחס_מקום_in_on_under",
  G3_PRESENT_SIMPLE: "english:grammar:line:present_simple_בחיובי_שלילי_שאלה",
  G4_PRESENT_VS_CONT: "english:grammar:line:present_simple_לעומת_present_continuous",
  G4_QUANTIFIERS:
    "english:grammar:line:some_any_much_many_כינויי_שייכות_ותוארי_פועל_slowly_quickly",
  G5_MODALS: "english:grammar:line:מודאליים_בסיסיים_future_will_going_to_והשוואתיים",
  G5_PAST_SIMPLE: "english:grammar:line:past_simple_סדירים_חריגים_נפוצים",
  G6_CONDITIONALS: "english:grammar:line:conditionals_type_0_1_ומודאליים_should_might_could",
  G6_COMPLEX_TENSES:
    "english:grammar:line:past_continuous_לצד_past_simple_היכרות_עם_present_perfect",
};

function representativeGrammarGrade(lo, hi, poolKey) {
  const r = ENGLISH_GRAMMAR_POOL_RANGE[poolKey];
  if (!r) {
    const mid = Math.floor((Number(lo) + Number(hi)) / 2);
    return Math.min(6, Math.max(1, mid));
  }
  const a = Math.max(Number(lo), r.minGrade);
  const b = Math.min(Number(hi), r.maxGrade);
  if (a > b) {
    const mid = Math.floor((Number(lo) + Number(hi)) / 2);
    return Math.min(6, Math.max(1, mid));
  }
  return Math.floor((a + b) / 2) || a;
}

/**
 * מיפוי שורת spine לדקדוק אנגלית (דטרמיניסטי). patternFamily — פרמטר אופציונלי לעתיד; ללא regex.
 * question_frames בטווח 2–3 מתפצל ב-collectEnglishPool ל־g2|g3 — Where/מיקום בכיתה ג׳ → קו התארים.
 */
function grammarLineIdForEnglishGrammarPool(poolKey, lo, hi, _patternFamily = "") {
  const g = representativeGrammarGrade(lo, hi, poolKey);
  switch (poolKey) {
    case "be_basic":
      return g <= 1 ? EGG_LINE_ID.G1_EXPOSURE : EGG_LINE_ID.G2_BE;
    case "question_frames":
      return g <= 2 ? EGG_LINE_ID.G2_PLURAL_QUESTIONS : EGG_LINE_ID.G3_ADJECTIVES_ARTICLES_PREPS;
    case "present_simple":
      return g <= 3 ? EGG_LINE_ID.G3_PRESENT_SIMPLE : EGG_LINE_ID.G4_PRESENT_VS_CONT;
    case "progressive":
      return EGG_LINE_ID.G4_PRESENT_VS_CONT;
    case "quantifiers":
      return g <= 4 ? EGG_LINE_ID.G4_QUANTIFIERS : EGG_LINE_ID.G5_MODALS;
    case "past_simple":
      return EGG_LINE_ID.G5_PAST_SIMPLE;
    case "modals":
      return g <= 5 ? EGG_LINE_ID.G5_MODALS : EGG_LINE_ID.G6_CONDITIONALS;
    case "comparatives":
      return g <= 5 ? EGG_LINE_ID.G5_MODALS : EGG_LINE_ID.G6_CONDITIONALS;
    case "future_forms":
      return EGG_LINE_ID.G5_MODALS;
    case "complex_tenses":
      return EGG_LINE_ID.G6_COMPLEX_TENSES;
    case "conditionals":
      return EGG_LINE_ID.G6_CONDITIONALS;
    default:
      return "";
  }
}

const { HEBREW_RICH_POOL } = await import(modUrl("utils/hebrew-rich-question-bank.js"));
const { HEBREW_LEGACY_QUESTIONS_SNAPSHOT } = await import(
  modUrl("utils/hebrew-question-generator.js")
);
const { GRAMMAR_POOLS } = await import(
  modUrl("data/english-questions/grammar-pools.js")
);
const { TRANSLATION_POOLS } = await import(
  modUrl("data/english-questions/translation-pools.js")
);
const { SENTENCE_POOLS } = await import(
  modUrl("data/english-questions/sentence-pools.js")
);
const { GEOMETRY_CONCEPTUAL_ITEMS } = await import(
  modUrl("utils/geometry-conceptual-bank.js")
);
const { generateQuestion: genGeometry } = await import(
  modUrl("utils/geometry-question-generator.js")
);
const { GRADES: GEO_GRADES, LEVELS: GEO_LEVELS } = await import(
  modUrl("utils/geometry-constants.js")
);
const { generateQuestion: genMath } = await import(
  modUrl("utils/math-question-generator.js")
);
const { GRADES: MATH_GRADES } = await import(modUrl("utils/math-constants.js"));
const { getLevelConfig } = await import(modUrl("utils/math-storage.js"));
const { inferHebrewLegacyMeta, scopeHebrewStemForGrade } = await import(
  modUrl("utils/hebrew-legacy-metadata.js")
);
const { resolveG1ItemSubtopicId } = await import(modUrl("utils/hebrew-g1-subtopic.js"));
const { resolveG2ItemSubtopicId } = await import(modUrl("utils/hebrew-g2-subtopic.js"));
const { resolveUpperGradeItemSubtopicId } = await import(modUrl("utils/hebrew-g3456-subtopic.js"));

const GEO_Q = {
  1: await import(modUrl("data/geography-questions/g1.js")),
  2: await import(modUrl("data/geography-questions/g2.js")),
  3: await import(modUrl("data/geography-questions/g3.js")),
  4: await import(modUrl("data/geography-questions/g4.js")),
  5: await import(modUrl("data/geography-questions/g5.js")),
  6: await import(modUrl("data/geography-questions/g6.js")),
};

function normalizeStem(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\d+/g, "#");
}

function stemHash(stem) {
  return createHash("sha256")
    .update(normalizeStem(stem), "utf8")
    .digest("hex")
    .slice(0, 24);
}

function bandToGrades(band) {
  if (band === "early") return [1, 2];
  if (band === "mid") return [3, 4];
  if (band === "late") return [5, 6];
  return [1, 6];
}

function itemGradeSpan(item) {
  if (item.gradeBand) return bandToGrades(item.gradeBand);
  if (item.minGrade != null || item.maxGrade != null) {
    return [item.minGrade ?? 1, item.maxGrade ?? 6];
  }
  if (Array.isArray(item.grades) && item.grades.length) {
    const nums = item.grades
      .map((g) => parseInt(String(g).replace(/\D/g, ""), 10))
      .filter((n) => n >= 1 && n <= 6);
    if (nums.length) return [Math.min(...nums), Math.max(...nums)];
  }
  return [1, 6];
}

function englishPoolDefaultRange(category, poolKey) {
  const map =
    category === "grammar"
      ? ENGLISH_GRAMMAR_POOL_RANGE
      : category === "translation"
        ? ENGLISH_TRANSLATION_POOL_RANGE
        : ENGLISH_SENTENCE_POOL_RANGE;
  const r = map[poolKey];
  return r ? [r.minGrade, r.maxGrade] : [1, 6];
}

function englishEffectiveRange(category, poolKey, item) {
  const hasItemGate =
    item &&
    (item.gradeBand != null ||
      item.minGrade != null ||
      item.maxGrade != null ||
      (Array.isArray(item.grades) && item.grades.length > 0));
  if (hasItemGate) return itemGradeSpan(item);
  return englishPoolDefaultRange(category, poolKey);
}

function pushRow(rows, row) {
  rows.push({
    subject: "",
    topic: "",
    subtopic: "",
    patternFamily: "",
    subtype: "",
    difficulty: "",
    gradeBand: "",
    minGrade: "",
    maxGrade: "",
    allowedGrades: "",
    allowedLevels: "",
    answerMode: "",
    optionCount: "",
    sourceFile: "",
    stemText: "",
    stemHash: "",
    rowKind: "",
    poolKey: "",
    itemHasExplicitGate: "",
    spine_skill_id: "",
    geography_bank_topic: "",
    spine_grade_key: "",
    ...row,
  });
}

function resolveHebrewContentMapSpineId(g, topic, item) {
  const gk = `g${g}`;
  if (g === 1) return resolveG1ItemSubtopicId(item, topic);
  if (g === 2) return resolveG2ItemSubtopicId(item, topic);
  return resolveUpperGradeItemSubtopicId(gk, item, topic);
}

function collectGeographyBankItems(rows) {
  for (let g = 1; g <= 6; g++) {
    const pack = GEO_Q[g];
    const gk = `g${g}`;
    const names = [
      `G${g}_EASY_QUESTIONS`,
      `G${g}_MEDIUM_QUESTIONS`,
      `G${g}_HARD_QUESTIONS`,
    ];
    for (const nm of names) {
      const obj = pack[nm];
      if (!obj || typeof obj !== "object") continue;
      for (const [bankTopicKey, list] of Object.entries(obj)) {
        if (!Array.isArray(list)) continue;
        list.forEach((row, idx) => {
          const stem = String(row?.question ?? row?.prompt ?? "").trim();
          if (!stem) return;
          pushRow(rows, {
            subject: "geography",
            topic: bankTopicKey,
            subtopic: bankTopicKey,
            patternFamily: "moledet_geography_bank",
            subtype: String(idx),
            difficulty: nm.includes("EASY") ? "easy" : nm.includes("MEDIUM") ? "medium" : "hard",
            gradeBand: gradeBandForKey(gk) || "",
            minGrade: g,
            maxGrade: g,
            allowedGrades: JSON.stringify([gk]),
            allowedLevels: JSON.stringify([]),
            answerMode: "mcq",
            optionCount: (row.answers || []).length || "",
            sourceFile: `data/geography-questions/g${g}.js`,
            stemText: stem.slice(0, 2000),
            stemHash: stemHash(stem),
            rowKind: "geography_bank_item",
            poolKey: `${nm}:${bankTopicKey}#${idx}`,
            itemHasExplicitGate: "1",
            geography_bank_topic: bankTopicKey,
            spine_grade_key: gk,
          });
        });
      }
    }
  }
}

function collectHebrewLegacy(rows) {
  const re = /^G(\d)_(EASY|MEDIUM|HARD)_QUESTIONS$/;
  for (const [exportName, poolObj] of Object.entries(
    HEBREW_LEGACY_QUESTIONS_SNAPSHOT
  )) {
    const m = exportName.match(re);
    if (!m) continue;
    const g = parseInt(m[1], 10);
    const diff = m[2].toLowerCase();
    const levelKey =
      diff === "easy" ? "easy" : diff === "medium" ? "medium" : "hard";
    const band = gradeBandForKey(`g${g}`) || "";
    for (const [topic, list] of Object.entries(poolObj || {})) {
      if (!Array.isArray(list)) continue;
      list.forEach((item, idx) => {
        let stem = item.question ?? item.exerciseText ?? "";
        const gNum = g;
        let pf = item.patternFamily;
        let sub = item.subtype;
        if (
          gNum >= 1 &&
          gNum <= 6 &&
          /^איזה משפט נכון\?$/i.test(
            String(item.question || item.exerciseText || "").trim()
          ) &&
          (topic === "grammar" || topic === "writing")
        ) {
          const heb = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"][gNum - 1];
          stem = `בהתאם לכיתה ${heb} [רמה ${levelKey}]: ${String(item.question || "").trim()}`;
          if (!item.patternFamily || item.patternFamily === "grammar_correct_sentence") {
            pf = "grammar_correct_sentence_scoped";
          }
        } else {
          stem = scopeHebrewStemForGrade(
            topic,
            String(item.question || item.exerciseText || "").trim(),
            `g${gNum}`
          );
        }
        const inf = inferHebrewLegacyMeta(topic, stem, levelKey, `g${gNum}`);
        if (!pf) {
          pf = inf.patternFamily;
          if (!sub || sub === "general") sub = inf.subtype;
        } else if (!sub || sub === "general") {
          sub = inf.subtype;
        }
        const opts = item.answers || item.options || [];
        const spineSub = resolveHebrewContentMapSpineId(g, topic, item);
        const spine_skill_id =
          spineSub && topic ? `hebrew:g${g}:${topic}:${spineSub}` : "";
        pushRow(rows, {
          subject: "hebrew",
          topic,
          subtopic: "",
          patternFamily: pf,
          subtype: sub || "",
          difficulty: inf.difficultyBand || levelKey,
          gradeBand: band,
          minGrade: inf.minGrade ?? g,
          maxGrade: inf.maxGrade ?? g,
          allowedGrades: JSON.stringify(inf.allowedGrades || [`g${g}`]),
          allowedLevels: JSON.stringify(inf.allowedLevels || [levelKey]),
          answerMode: item.answerMode || inf.answerMode || "choice",
          optionCount: opts.length || "",
          sourceFile: "utils/hebrew-question-generator.js",
          stemText: stem,
          stemHash: stemHash(stem),
          rowKind: "hebrew_legacy",
          poolKey: exportName,
          spine_skill_id,
        });
      });
    }
  }
}

function collectHebrewRich(rows) {
  HEBREW_RICH_POOL.forEach((item, idx) => {
    const [lo, hi] = itemGradeSpan(item);
    const stem = item.question ?? "";
    const opts = item.answers || [];
    const levels = item.levels || item.allowedLevels || [];
    const topic = item.topic || "general";
    for (let g = lo; g <= hi; g++) {
      const scoped = scopeHebrewStemForGrade(topic, stem, `g${g}`);
      const pf = item.patternFamily || "_";
      const st = item.subtype || "general";
      const spine_skill_id = `hebrew:rich:${topic}:${pf}:${st}`;
      pushRow(rows, {
        subject: "hebrew",
        topic,
        subtopic: "",
        patternFamily: item.patternFamily || "",
        subtype: item.subtype || "",
        difficulty: Array.isArray(levels) ? levels.join("|") : "",
        gradeBand: item.gradeBand || "",
        minGrade: g,
        maxGrade: g,
        allowedGrades: JSON.stringify(item.grades || []),
        allowedLevels: JSON.stringify(
          Array.isArray(item.allowedLevels)
            ? item.allowedLevels
            : item.levels || []
        ),
        answerMode: item.answerMode || "choice",
        optionCount: opts.length || "",
        sourceFile: "utils/hebrew-rich-question-bank.js",
        stemText: scoped,
        stemHash: stemHash(scoped),
        rowKind: "hebrew_rich",
        poolKey: `rich#${idx}_g${g}`,
        spine_skill_id,
      });
    }
  });
}

function collectEnglishPool(rows, category, pools) {
  const fileMap = {
    grammar: "data/english-questions/grammar-pools.js",
    translation: "data/english-questions/translation-pools.js",
    sentence: "data/english-questions/sentence-pools.js",
  };
  const sourceFile = fileMap[category] || `data/english-questions/${category}.js`;
  const gradeHeb = ["", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"];
  const splitG5G6Pool = (poolKey) =>
    (category === "grammar" &&
      (poolKey === "modals" || poolKey === "comparatives")) ||
    (category === "sentence" && poolKey === "advanced") ||
    (category === "translation" &&
      (poolKey === "technology" || poolKey === "global"));

  const splitQuestionFramesG2G3 = (poolKey) =>
    category === "grammar" && poolKey === "question_frames";

  for (const [poolKey, list] of Object.entries(pools || {})) {
    if (!Array.isArray(list)) continue;
    list.forEach((item, idx) => {
      const [lo, hi] = englishEffectiveRange(category, poolKey, item);
      const stem =
        item.question ??
        item.sentence ??
        item.prompt ??
        item.template ??
        (category === "translation"
          ? String(item.en || item.he || "").trim()
          : "") ??
        "";
      const opts = item.options || item.answers || [];
      const explicitGate =
        item.gradeBand != null ||
        item.minGrade != null ||
        item.maxGrade != null ||
        (Array.isArray(item.grades) && item.grades.length > 0);

      if (
        !explicitGate &&
        splitQuestionFramesG2G3(poolKey) &&
        lo <= 2 &&
        hi >= 3
      ) {
        for (const g of [2, 3]) {
          const scoped = `(כיתה ${gradeHeb[g]}) ${stem}`;
          const basePf = item.patternFamily || poolKey;
          const grammar_line_id =
            category === "grammar"
              ? grammarLineIdForEnglishGrammarPool(
                  poolKey,
                  g,
                  g,
                  item.patternFamily || "",
                )
              : "";
          pushRow(rows, {
            subject: "english",
            topic: category,
            subtopic: poolKey,
            patternFamily: `${basePf}_g${g}`,
            subtype: item.subtype || "",
            difficulty: (item.difficulty || "").toString(),
            gradeBand: item.gradeBand || "",
            minGrade: g,
            maxGrade: g,
            allowedGrades: JSON.stringify(item.grades || []),
            allowedLevels: JSON.stringify(item.allowedLevels || []),
            answerMode: item.answerMode || "mcq",
            optionCount: opts.length || "",
            sourceFile,
            stemText: scoped,
            stemHash: stemHash(scoped),
            rowKind: "english_pool_item",
            poolKey,
            itemHasExplicitGate: "0",
            grammar_line_id,
          });
        }
        return;
      }

      if (!explicitGate && splitG5G6Pool(poolKey) && lo <= 5 && hi >= 6) {
        for (const g of [5, 6]) {
          const scoped = `(כיתה ${gradeHeb[g]}) ${stem}`;
          const basePf = item.patternFamily || poolKey;
          const grammar_line_id =
            category === "grammar"
              ? grammarLineIdForEnglishGrammarPool(
                  poolKey,
                  g,
                  g,
                  item.patternFamily || "",
                )
              : "";
          pushRow(rows, {
            subject: "english",
            topic: category,
            subtopic: poolKey,
            patternFamily: `${basePf}_g${g}`,
            subtype: item.subtype || "",
            difficulty: (item.difficulty || "").toString(),
            gradeBand: item.gradeBand || "",
            minGrade: g,
            maxGrade: g,
            allowedGrades: JSON.stringify(item.grades || []),
            allowedLevels: JSON.stringify(item.allowedLevels || []),
            answerMode: item.answerMode || "mcq",
            optionCount: opts.length || "",
            sourceFile,
            stemText: scoped,
            stemHash: stemHash(scoped),
            rowKind: "english_pool_item",
            poolKey,
            itemHasExplicitGate: "0",
            grammar_line_id,
          });
        }
        return;
      }

      const grammar_line_id =
        category === "grammar"
          ? grammarLineIdForEnglishGrammarPool(
              poolKey,
              lo,
              hi,
              item.patternFamily || "",
            )
          : "";
      pushRow(rows, {
        subject: "english",
        topic: category,
        subtopic: poolKey,
        patternFamily: item.patternFamily || poolKey,
        subtype: item.subtype || "",
        difficulty: (item.difficulty || "").toString(),
        gradeBand: item.gradeBand || "",
        minGrade: lo,
        maxGrade: hi,
        allowedGrades: JSON.stringify(item.grades || []),
        allowedLevels: JSON.stringify(item.allowedLevels || []),
        answerMode: item.answerMode || "mcq",
        optionCount: opts.length || "",
        sourceFile,
        stemText: stem,
        stemHash: stemHash(stem),
        rowKind: "english_pool_item",
        poolKey,
        itemHasExplicitGate: explicitGate ? "1" : "0",
        grammar_line_id,
      });
    });
  }
}

function collectGeometryConceptual(rows) {
  const hebG = ["", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"];
  GEOMETRY_CONCEPTUAL_ITEMS.forEach((item, idx) => {
    const [lo, hi] = itemGradeSpan(item);
    const stem = item.question || "";
    for (let g = lo; g <= hi; g++) {
      const scoped =
        g >= 1 && g <= 6 ? `(כיתה ${hebG[g]}) ${stem}` : stem;
      pushRow(rows, {
        subject: "geometry",
        topic: (item.topics || []).join("|"),
        subtopic: item.conceptTag || "",
        patternFamily: item.patternFamily || "",
        subtype: item.subtype || "",
        difficulty: (item.levels || []).join("|"),
        gradeBand: item.gradeBand || "",
        minGrade: g,
        maxGrade: g,
        allowedGrades: JSON.stringify(item.grades || []),
        allowedLevels: JSON.stringify(item.levels || []),
        answerMode: item.binary ? "binary" : "mcq_text",
        optionCount: (item.options || []).length,
        sourceFile: "utils/geometry-conceptual-bank.js",
        stemText: scoped,
        stemHash: stemHash(scoped),
        rowKind: "geometry_conceptual",
        poolKey: `concept#${idx}_g${g}`,
      });
    }
  });
}

function sampleGeometryGenerator(rows, samplesPerCombo = 12) {
  const grades = ["g1", "g2", "g3", "g4", "g5", "g6"];
  const levels = ["easy", "medium", "hard"];
  let sampleIndex = 0;
  for (const gk of grades) {
    const topics = GEO_GRADES[gk]?.topics || [];
    for (const topic of topics) {
      if (topic === "mixed") continue;
      for (const lk of levels) {
        const levelObj = GEO_LEVELS[lk];
        for (let i = 0; i < samplesPerCombo; i++) {
          const seed =
            0x604f0000 +
            (gk.charCodeAt(1) | 0) * 9176 +
            topic.split("").reduce((a, c) => a + c.charCodeAt(0), 0) +
            (lk === "easy" ? 1 : lk === "medium" ? 2 : 3) * 499979 +
            i * 131071;
          const q = runWithAuditRandom(seed, () =>
            genGeometry(levelObj, topic, gk, null)
          );
          const stem = q.question ?? "";
          const kind = q.params?.kind ?? "";
          if (!stem || kind === "no_question") continue;
          const gNum = parseInt(gk.replace(/\D/g, ""), 10);
          pushRow(rows, {
            subject: "geometry",
            topic,
            subtopic: kind,
            patternFamily: q.params?.patternFamily || kind,
            subtype: q.params?.subtype || "",
            difficulty: lk,
            gradeBand: gradeBandForKey(gk) || "",
            minGrade: gNum,
            maxGrade: gNum,
            allowedGrades: JSON.stringify([gk]),
            allowedLevels: JSON.stringify([lk]),
            answerMode: q.params?.answerMode || "numeric_mcq",
            optionCount: q.params?.optionCount ?? (q.answers || []).length,
            sourceFile: "utils/geometry-question-generator.js#sample",
            stemText: stem.slice(0, 2000),
            stemHash: stemHash(stem),
            rowKind: "geometry_generator_sample",
            poolKey: `geo-sample-${sampleIndex++}`,
          });
        }
      }
    }
  }
}

function sampleMathGenerator(rows, samplesPerOp = 10) {
  const grades = [1, 2, 3, 4, 5, 6];
  const levels = ["easy", "medium", "hard"];
  let sampleIndex = 0;
  for (const g of grades) {
    const gk = `g${g}`;
    const ops = (MATH_GRADES[gk]?.operations || []).filter((o) => o !== "mixed");
    for (const lk of levels) {
      const lc = getLevelConfig(g, lk);
      for (const op of ops) {
        for (let i = 0; i < samplesPerOp; i++) {
          const seed =
            0x6d617468 +
            g * 0xf1e2d3c4 +
            (lk === "easy" ? 11 : lk === "medium" ? 17 : 23) * 104729 +
            op.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 1009 +
            i * 65521;
          const q = runWithAuditRandom(seed, () => genMath(lc, op, gk, null));
          const stem = q.question ?? q.exerciseText ?? "";
          const kind = q.params?.kind ?? op;
          if (!stem) continue;
          pushRow(rows, {
            subject: "math",
            topic: op,
            subtopic: kind,
            patternFamily: q.params?.patternFamily || kind,
            subtype: q.params?.subtype || "",
            difficulty: lk,
            gradeBand: gradeBandForKey(gk) || "",
            minGrade: g,
            maxGrade: g,
            allowedGrades: JSON.stringify([gk]),
            allowedLevels: JSON.stringify([lk]),
            answerMode: q.params?.answerMode || "numeric",
            optionCount: (q.answers || q.options || []).length,
            sourceFile: "utils/math-question-generator.js#sample",
            stemText: String(stem).slice(0, 2000),
            stemHash: stemHash(stem),
            rowKind: "math_generator_sample",
            poolKey: `math-sample-${sampleIndex++}`,
          });
        }
      }
    }
  }

  /** Phase 7.20 — דגימות כפויות לאודיט בלבד (מזהה מין spine); לא משנה משחק רגיל. */
  const MATH_AUDIT_FORCE_PROBES = [
    { force: "dec_divide", gk: "g6", lev: "hard", op: "decimals" },
    { force: "dec_repeating", gk: "g6", lev: "hard", op: "decimals" },
    { force: "frac_half_reverse", gk: "g2", lev: "easy", op: "fractions" },
    { force: "frac_quarter_reverse", gk: "g2", lev: "easy", op: "fractions" },
    { force: "frac_to_mixed", gk: "g5", lev: "medium", op: "fractions" },
    { force: "wp_unit_cm_to_m", gk: "g5", lev: "medium", op: "word_problems" },
    { force: "wp_unit_cm_to_m", gk: "g6", lev: "medium", op: "word_problems" },
    /** Phase 7.23 — כפייה לאודיט: ns_counting_backward (auditReps=4), dec_multiply. */
    { force: "ns_counting_backward", gk: "g1", lev: "easy", op: "number_sense", auditReps: 6 },
    { force: "dec_multiply", gk: "g6", lev: "hard", op: "decimals" },
  ];
  const SAMPLES_PER_FORCE_KIND = 6;
  for (let pi = 0; pi < MATH_AUDIT_FORCE_PROBES.length; pi++) {
    const p = MATH_AUDIT_FORCE_PROBES[pi];
    const gNum = parseInt(String(p.gk).replace(/\D/g, ""), 10) || 1;
    const lc = getLevelConfig(gNum, p.lev);
    const reps =
      typeof p.auditReps === "number" && p.auditReps >= 1 && p.auditReps <= 32
        ? p.auditReps
        : SAMPLES_PER_FORCE_KIND;
    for (let rep = 0; rep < reps; rep++) {
      const seed =
        0x70206175 + pi * 524287 + rep * 65521 + p.force.length * 1009 + p.op.length * 131;
      const q = runWithAuditRandom(seed, () => {
        globalThis.__LIOSH_MATH_FORCE = p.force;
        try {
          return genMath(lc, p.op, p.gk, null);
        } finally {
          delete globalThis.__LIOSH_MATH_FORCE;
        }
      });
      const stem = q?.question ?? q?.exerciseText ?? "";
      const kind = q?.params?.kind ?? p.op;
      if (!stem) continue;
      pushRow(rows, {
        subject: "math",
        topic: p.op,
        subtopic: kind,
        patternFamily: q.params?.patternFamily || kind,
        subtype: q.params?.subtype || "",
        difficulty: p.lev,
        gradeBand: gradeBandForKey(p.gk) || "",
        minGrade: gNum,
        maxGrade: gNum,
        allowedGrades: JSON.stringify([p.gk]),
        allowedLevels: JSON.stringify([p.lev]),
        answerMode: q.params?.answerMode || "numeric",
        optionCount: (q.answers || q.options || []).length,
        sourceFile: "utils/math-question-generator.js#audit_force_sample",
        stemText: String(stem).slice(0, 2000),
        stemHash: stemHash(stem),
        rowKind: "math_generator_sample",
        poolKey: `math-audit-force-${sampleIndex++}`,
      });
    }
  }
}

function extractDeclaredKindsFromSource(relPath) {
  const text = readFileSync(join(ROOT, relPath), "utf8");
  const kinds = new Set();
  const re = /\bkind:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(text))) {
    if (!m[1].includes("${")) kinds.add(m[1]);
  }
  return [...kinds].sort();
}

function stemUsableRow(r) {
  return String(r.stemText || "").trim().length >= 4;
}

/** Moledet bank rows reuse stems across grades — exclude from duplicate/cross-grade heuristics. */
function omitFromCrossGradeDupHeuristics(r) {
  return r.rowKind === "geography_bank_item";
}

function withinBandClassPairOverlaps(rows) {
  const isSample = (r) =>
    typeof r.rowKind === "string" && r.rowKind.endsWith("_sample");
  const map = new Map();
  for (const r of rows) {
    if (isSample(r) || !stemUsableRow(r) || omitFromCrossGradeDupHeuristics(r)) continue;
    const k = `${r.subject}|${r.patternFamily}|${r.stemHash}|${r.subtopic || ""}`;
    if (!map.has(k)) map.set(k, new Set());
    const lo = Number(r.minGrade);
    const hi = Number(r.maxGrade);
    for (let g = lo; g <= hi; g++) map.get(k).add(g);
  }
  const labels = [
    [1, 2, "g1_vs_g2_early_band"],
    [3, 4, "g3_vs_g4_mid_band"],
    [5, 6, "g5_vs_g6_late_band"],
  ];
  const out = [];
  for (const [ga, gb, label] of labels) {
    for (const [key, set] of map) {
      if (set.has(ga) && set.has(gb)) {
        const [subject, patternFamily, stemHash, subtopic] = key.split("|");
        out.push({ bandPair: label, subject, patternFamily, stemHash, subtopic });
      }
    }
  }
  return out.slice(0, 500);
}

function weakLevelSeparationFromSamples(rows) {
  const samples = rows.filter(
    (r) => typeof r.rowKind === "string" && r.rowKind.endsWith("_sample")
  );
  const m = new Map();
  for (const r of samples) {
    const key = `${r.subject}|${r.topic}|${r.subtopic}|${r.minGrade}`;
    if (!m.has(key)) m.set(key, { easy: [], medium: [], hard: [] });
    const lv = String(r.difficulty || "").toLowerCase();
    if (m.get(key)[lv]) m.get(key)[lv].push(r.stemHash);
  }
  const out = [];
  for (const [key, o] of m) {
    if (o.easy.length < 5 || o.medium.length < 5 || o.hard.length < 5) continue;
    const all = [...o.easy, ...o.medium, ...o.hard];
    const uniq = new Set(all);
    // ≤2 תבניות ניסוח בלבד נחשבות חלשות (3 תבניות מספיקות להבחנה בין רמות)
    if (uniq.size <= 2) {
      out.push({
        comboKey: key,
        uniqueStemHashesAcrossLevels: uniq.size,
        samplesPerLevel: { easy: o.easy.length, medium: o.medium.length, hard: o.hard.length },
        note:
          "דגימות רבות אך מעט צורות ניסוח שונות בין רמות — לרוב תבנית מספרית זהה.",
      });
    }
  }
  return out.sort((a, b) => a.uniqueStemHashesAcrossLevels - b.uniqueStemHashesAcrossLevels).slice(0, 200);
}

function topicMetadataCoverage(rows) {
  const bySub = {};
  for (const r of rows) {
    const s = r.subject || "?";
    const t = r.topic || "?";
    if (!bySub[s]) bySub[s] = {};
    if (!bySub[s][t]) {
      bySub[s][t] = {
        rows: 0,
        staticRows: 0,
        sampleRows: 0,
        withSubtype: 0,
        withPatternFamily: 0,
      };
    }
    const b = bySub[s][t];
    b.rows++;
    if (r.rowKind?.endsWith("_sample")) b.sampleRows++;
    else b.staticRows++;
    if (String(r.subtype || "").trim() && r.subtype !== "general") b.withSubtype++;
    if (String(r.patternFamily || "").trim()) b.withPatternFamily++;
  }
  return bySub;
}

function buildFallbackMap() {
  return {
    hebrew: [
      {
        path: "utils/hebrew-question-generator.js",
        steps: [
          "מיזוג rich+legacy לפי כיתה/רמה/נושא (filterRichHebrewPool + mergeTopicPools)",
          "אם ריק: ניסיון רמות אחרות באותו נושא (עדיין אותה כיתה)",
          "אם עדיין ריק: ניסיון reading באותה כיתה עם סדר רמות",
          "אם עדיין ריק: הודעת empty_pool + patternFamily no_questions",
        ],
        keepsGrade: true,
        keepsTopic: "עד כמה שאפשר לפני מעבר ל-reading",
      },
    ],
    english: [
      {
        path: "pages/learning/english-master.js",
        steps: [
          "סינון בריכות עם englishPoolItemAllowedWithClassSplit (כולל פיצול כיתה בתוך טווח בריכה)",
          "אם ריק אחרי שער: בריכת grammar/translation/sentence חלופית מותרת לכיתה",
          "אם עדיין ריק: placeholder + english_empty_pool",
        ],
        keepsGrade: true,
      },
    ],
    geometry: [
      {
        path: "utils/geometry-question-generator.js",
        steps: [
          "נושא לא מותר לכיתה → נושא חלופי מאותה כיתה",
          "אין צורות לנושא → הודעת no_question",
        ],
        keepsGrade: true,
      },
    ],
    math: [
      {
        path: "utils/math-question-generator.js",
        notes: "אין fallback לכיתה אחרת בתוך הגנרטור; בחירת פעולה מותרת לפי GRADES",
        keepsGrade: true,
      },
    ],
  };
}

function buildStage2Report(rows, declaredMathKinds, declaredGeoKinds) {
  const mathObs = new Set();
  const geoObs = new Set();
  for (const r of rows) {
    if (r.rowKind === "math_generator_sample" && r.subtopic)
      mathObs.add(r.subtopic);
    if (r.rowKind === "geometry_generator_sample" && r.subtopic)
      geoObs.add(r.subtopic);
  }
  const harnessMathKinds = loadHarnessKindSet("harness-math.json");
  const harnessGeoKinds = new Set([
    ...loadHarnessKindSet("harness-geometry.json"),
    ...loadHarnessKindSet("harness-geometry-conceptual.json"),
  ]);
  for (const k of harnessMathKinds) mathObs.add(k);
  for (const k of harnessGeoKinds) geoObs.add(k);

  const missingMath = declaredMathKinds.filter((k) => !mathObs.has(k));
  const missingGeo = declaredGeoKinds.filter(
    (k) => k !== "no_question" && !geoObs.has(k)
  );

  return {
    generatedAt: new Date().toISOString(),
    harnessMerged: {
      mathKindsFromHarnessFiles: harnessMathKinds.size,
      geoKindsFromHarnessFiles: harnessGeoKinds.size,
      note: "איחוד kind מ־harness-math.json + harness-geometry.json + harness-geometry-conceptual.json (הרץ npm run audit:harness לפני אודיט).",
    },
    generatorBranchCoverage: {
      math: {
        sourceFile: "utils/math-question-generator.js",
        declaredKindCount: declaredMathKinds.length,
        observedDistinctKindsInSample: mathObs.size,
        kindsNotHitInRun: missingMath.slice(0, 120),
        kindsHitButNotInStaticRegex: [...mathObs]
          .filter((k) => !declaredMathKinds.includes(k))
          .slice(0, 40),
        coverageNote:
          "דגימת אודיט דטרמיניסטית (LCG קבוע לכל צירוף) + איחוד תוצאות harness וכפיית ענפים נדירים.",
      },
      geometry: {
        sourceFile: "utils/geometry-question-generator.js",
        declaredKindCount: declaredGeoKinds.length,
        observedDistinctKindsInSample: geoObs.size,
        kindsNotHitInRun: missingGeo.slice(0, 120),
        kindsHitButNotInStaticRegex: [...geoObs]
          .filter((k) => !declaredGeoKinds.includes(k))
          .slice(0, 40),
        coverageNote:
          "דגימת אודיט דטרמיניסטית + harness נוסחתי וקונספטואלי + כפיית צורה (prism / parallelogram) בקובץ harness.",
      },
    },
    withinBandClassPairOverlaps: withinBandClassPairOverlaps(rows),
    weakLevelSeparationCombos: weakLevelSeparationFromSamples(rows),
    topicMetadataCoverage: topicMetadataCoverage(rows),
    englishClassSplitPools: {
      note: "פיצול דטרמיניסטי בין כיתות בתוך אותה בריכה — englishPoolItemAllowedWithClassSplit ב־grade-gating.js",
      pools: [
        "grammar: present_simple (g3|g4), quantifiers (g4|g5)",
        "grammar: modals, comparatives (g5|g6)",
        "translation: community (g4|g5), technology+global (g5|g6)",
        "sentence: routine (g2|g3|g4), descriptive (g3|g4), narrative (g4|g5)",
      ],
    },
    fallbackMap: buildFallbackMap(),
    hebrewLegacyMetadata: {
      note: "מיפוי patternFamily/subtype ל־legacy — inferHebrewLegacyMeta ב־utils/hebrew-legacy-metadata.js (גם בזמן ריצה ב־finalizeHebrewMcq)",
    },
  };
}

function csvEscape(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows) {
  const cols = [
    "subject",
    "topic",
    "subtopic",
    "patternFamily",
    "subtype",
    "difficulty",
    "gradeBand",
    "minGrade",
    "maxGrade",
    "allowedGrades",
    "allowedLevels",
    "answerMode",
    "optionCount",
    "sourceFile",
    "rowKind",
    "poolKey",
    "itemHasExplicitGate",
    "spine_skill_id",
    "geography_bank_topic",
    "spine_grade_key",
    "stemHash",
    "stemText",
  ];
  const lines = [cols.join(",")];
  for (const r of rows) {
    lines.push(cols.map((c) => csvEscape(r[c])).join(","));
  }
  return lines.join("\n");
}

function analyze(rows) {
  const isGeneratorSample = (r) =>
    typeof r.rowKind === "string" && r.rowKind.endsWith("_sample");
  const stemUsable = (r) => String(r.stemText || "").trim().length >= 4;

  const byHash = new Map();
  const byHashStatic = new Map();
  const byNorm = new Map();
  for (const r of rows) {
    if (!stemUsable(r)) continue;
    if (omitFromCrossGradeDupHeuristics(r)) continue;
    const h = r.stemHash;
    if (!byHash.has(h)) byHash.set(h, []);
    byHash.get(h).push(r);
    if (!isGeneratorSample(r)) {
      if (!byHashStatic.has(h)) byHashStatic.set(h, []);
      byHashStatic.get(h).push(r);
    }
    const n = normalizeStem(r.stemText);
    if (n.length < 8) continue;
    if (!byNorm.has(n)) byNorm.set(n, []);
    byNorm.get(n).push(r);
  }

  const exactCrossGrade = [];
  for (const [h, list] of byHash) {
    if (list.length < 2) continue;
    const grades = new Set();
    for (const r of list) {
      for (let g = r.minGrade; g <= r.maxGrade; g++) grades.add(g);
    }
    const gmin = Math.min(...grades);
    const gmax = Math.max(...grades);
    if (gmax - gmin >= 3) {
      exactCrossGrade.push({
        stemHash: h,
        gradeSpan: [gmin, gmax],
        count: list.length,
        subjects: [...new Set(list.map((x) => x.subject))],
        sampleStem: list[0].stemText.slice(0, 120),
        includesGeneratorSample: list.some(isGeneratorSample),
      });
    }
  }

  const exactCrossGradeStaticBanks = [];
  for (const [h, list] of byHashStatic) {
    if (list.length < 2) continue;
    const grades = new Set();
    for (const r of list) {
      for (let g = r.minGrade; g <= r.maxGrade; g++) grades.add(g);
    }
    const gmin = Math.min(...grades);
    const gmax = Math.max(...grades);
    if (gmax - gmin >= 3) {
      exactCrossGradeStaticBanks.push({
        stemHash: h,
        gradeSpan: [gmin, gmax],
        count: list.length,
        subjects: [...new Set(list.map((x) => x.subject))],
        sampleStem: list[0].stemText.slice(0, 120),
      });
    }
  }

  const nearDupCrossGrade = [];
  for (const [norm, list] of byNorm) {
    if (list.length < 2 || norm.length < 12) continue;
    const staticOnly = list.filter((x) => !isGeneratorSample(x));
    if (staticOnly.length < 2) continue;
    const hashes = new Set(staticOnly.map((x) => x.stemHash));
    if (hashes.size < 2) continue;
    const grades = new Set();
    for (const r of staticOnly) {
      for (let g = r.minGrade; g <= r.maxGrade; g++) grades.add(g);
    }
    const gmin = Math.min(...grades);
    const gmax = Math.max(...grades);
    if (gmax - gmin >= 3) {
      nearDupCrossGrade.push({
        normalizedLength: norm.length,
        gradeSpan: [gmin, gmax],
        distinctHashes: hashes.size,
        subjects: [...new Set(staticOnly.map((x) => x.subject))],
        sampleStem: staticOnly[0].stemText.slice(0, 120),
      });
    }
  }
  nearDupCrossGrade.sort((a, b) => b.distinctHashes - a.distinctHashes);
  exactCrossGrade.sort((a, b) => b.count - a.count);
  exactCrossGradeStaticBanks.sort((a, b) => b.count - a.count);

  const exactCrossGradeClassification = {
    note:
      "רוב המקרים עם דגימות math ונרמול ספרות ל-# משקפים אותה תבנית ניסוח עם מספרים שונים — מוצדק פדגוגית. מקרים סטטיים או לא־מתמטיים דורשים סקירה.",
    totalListed: exactCrossGrade.length,
    justifiedMathGeneratorTemplate: exactCrossGrade.filter(
      (x) =>
        x.includesGeneratorSample &&
        x.subjects.length === 1 &&
        x.subjects[0] === "math"
    ).length,
    flaggedForReview: exactCrossGrade.filter(
      (x) =>
        !x.includesGeneratorSample ||
        x.subjects.some((s) => s !== "math") ||
        x.subjects.length !== 1
    ).length,
    topExamples: exactCrossGrade.slice(0, 12).map((x) => ({
      stemHash: x.stemHash,
      sampleStem: x.sampleStem,
      classification:
        x.includesGeneratorSample &&
        x.subjects.length === 1 &&
        x.subjects[0] === "math"
          ? "justified_same_template_normalized_digits"
          : "review_non_math_or_static",
    })),
  };

  const familyCrossBand = [];
  const byFam = new Map();
  for (const r of rows) {
    if (isGeneratorSample(r)) continue;
    if (omitFromCrossGradeDupHeuristics(r)) continue;
    const fam = r.patternFamily || "";
    if (!fam) continue;
    const k = `${r.subject}::${fam}`;
    if (!byFam.has(k)) byFam.set(k, []);
    byFam.get(k).push(r);
  }
  for (const [k, list] of byFam) {
    const grades = new Set();
    for (const r of list) {
      for (let g = r.minGrade; g <= r.maxGrade; g++) grades.add(g);
    }
    if (grades.size < 2) continue;
    const gmin = Math.min(...grades);
    const gmax = Math.max(...grades);
    if (gmax - gmin >= 4) {
      familyCrossBand.push({
        key: k,
        gradeSpan: [gmin, gmax],
        rowCount: list.length,
      });
    }
  }
  familyCrossBand.sort((a, b) => b.rowCount - a.rowCount);

  /** English pool rows: band by grade so one pool with g1…g6 items is not one “6-grade topic”. */
  function gradeToEnglishTopicBand(g) {
    if (g <= 2) return "early";
    if (g <= 4) return "mid";
    return "late";
  }

  const topicWeakGrade = [];
  const bySubTop = new Map();
  for (const r of rows) {
    if (r.rowKind.endsWith("_sample")) continue;
    if (r.subject === "english") {
      const pool = r.subtopic || r.poolKey || "";
      const bands = new Set();
      for (let g = r.minGrade; g <= r.maxGrade; g++) {
        bands.add(gradeToEnglishTopicBand(g));
      }
      for (const band of bands) {
        const key = `${r.subject}::${r.topic}::${pool}::${band}`;
        if (!bySubTop.has(key)) bySubTop.set(key, []);
        bySubTop.get(key).push(r);
      }
    } else {
      const key = `${r.subject}::${r.topic}`;
      if (!bySubTop.has(key)) bySubTop.set(key, []);
      bySubTop.get(key).push(r);
    }
  }
  const englishBandSuffix = /::(early|mid|late)$/;
  for (const [key, list] of bySubTop) {
    const grades = new Set();
    const bandMatch = key.match(englishBandSuffix);
    const bandOnly = bandMatch ? bandMatch[1] : null;
    for (const r of list) {
      for (let g = r.minGrade; g <= r.maxGrade; g++) {
        if (bandOnly && gradeToEnglishTopicBand(g) !== bandOnly) continue;
        grades.add(g);
      }
    }
    if (grades.size >= 5) {
      const fams = {};
      for (const r of list) {
        const f = r.patternFamily || "none";
        fams[f] = (fams[f] || 0) + 1;
      }
      const topFam = Object.entries(fams).sort((a, b) => b[1] - a[1])[0];
      topicWeakGrade.push({
        key,
        distinctGrades: grades.size,
        totalRows: list.length,
        dominantPatternFamily: topFam[0],
        dominantShare: topFam[1] / list.length,
      });
    }
  }
  topicWeakGrade.sort((a, b) => b.totalRows - a.totalRows);

  const englishUngatedWidePool = [];
  for (const r of rows) {
    if (r.subject !== "english" || r.rowKind !== "english_pool_item") continue;
    const poolSpan = Number(r.maxGrade) - Number(r.minGrade);
    if (r.itemHasExplicitGate === "0" && poolSpan >= 2) {
      englishUngatedWidePool.push({
        poolKey: r.poolKey,
        topic: r.subtopic,
        effectiveMin: r.minGrade,
        effectiveMax: r.maxGrade,
        stemPreview: r.stemText.slice(0, 80),
      });
    }
  }

  const hebrewLevelFake = [];
  const hebStemLevel = new Map();
  for (const r of rows) {
    if (r.subject !== "hebrew" || r.rowKind !== "hebrew_legacy") continue;
    const stem = normalizeStem(r.stemText);
    if (stem.length < 15) continue;
    const key = `${r.topic}::${stem}`;
    if (!hebStemLevel.has(key)) hebStemLevel.set(key, new Set());
    hebStemLevel.get(key).add(r.difficulty);
  }
  for (const [key, set] of hebStemLevel) {
    if (set.size >= 3) {
      hebrewLevelFake.push({
        key: key.slice(0, 100),
        levels: [...set].sort(),
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalRows: rows.length,
    exactDuplicateCrossGrade: exactCrossGrade.slice(0, 200),
    exactDuplicateCrossGradeStaticBanksOnly:
      exactCrossGradeStaticBanks.slice(0, 200),
    nearDuplicateCrossGrade: nearDupCrossGrade.slice(0, 200),
    patternFamilyWideGradeSpan: familyCrossBand.slice(0, 150),
    topicsSpanManyGrades: topicWeakGrade.slice(0, 80),
    englishItemsRelyingOnPoolGateOnly: englishUngatedWidePool.slice(0, 300),
    hebrewLegacySameStemThreeLevels: hebrewLevelFake.slice(0, 100),
    exactCrossGradeClassification,
    fallbackNotes: [
      {
        where: "utils/hebrew-question-generator.js",
        behavior:
          "אם אין בריכה: ניסיון רמות אחרות באותו נושא (עם rich+legacy), אחר כך אותו דבר ל-reading; רק אז הודעת ריק.",
      },
      {
        where: "pages/learning/english-master.js",
        behavior:
          "בריכות ריקות אחרי שער → placeholder עם patternFamily english_empty_pool (לא פתיחת כל המילון).",
      },
      {
        where: "utils/geometry-question-generator.js",
        behavior:
          "נושא לא לכיתה → החלפה לנושא חלופי באותה כיתה (עדיין גנרטור).",
      },
    ],
    staticVsSample: {
      note:
        "שורות math/geometry עם rowKind *_sample נוצרות עם RNG דטרמיניסטי באודיט; מיפוי kind מלא משתמש גם בקובצי harness.",
    },
  };
}

async function main() {
  const rows = [];
  collectGeographyBankItems(rows);
  collectHebrewLegacy(rows);
  collectHebrewRich(rows);
  collectEnglishPool(rows, "grammar", GRAMMAR_POOLS);
  collectEnglishPool(rows, "translation", TRANSLATION_POOLS);
  collectEnglishPool(rows, "sentence", SENTENCE_POOLS);
  collectGeometryConceptual(rows);
  sampleGeometryGenerator(rows, 24);
  sampleMathGenerator(rows, 16);

  const declaredMathKinds = extractDeclaredKindsFromSource(
    "utils/math-question-generator.js"
  );
  const declaredGeoKinds = extractDeclaredKindsFromSource(
    "utils/geometry-question-generator.js"
  );

  const findings = analyze(rows);
  const stage2 = buildStage2Report(rows, declaredMathKinds, declaredGeoKinds);
  findings.stage2Summary = {
    withinBandOverlapCount: stage2.withinBandClassPairOverlaps.length,
    weakLevelSeparationCount: stage2.weakLevelSeparationCombos.length,
    mathKindsNotHitSample: stage2.generatorBranchCoverage.math.kindsNotHitInRun.length,
    geoKindsNotHitSample: stage2.generatorBranchCoverage.geometry.kindsNotHitInRun.length,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, "items.json"), JSON.stringify(rows, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "items.csv"), rowsToCsv(rows), "utf8");
  await writeFile(
    join(OUT_DIR, "findings.json"),
    JSON.stringify(findings, null, 2),
    "utf8"
  );
  await writeFile(join(OUT_DIR, "stage2.json"), JSON.stringify(stage2, null, 2), "utf8");

  console.log(`Wrote ${rows.length} rows to ${OUT_DIR}`);
  console.log(
    `Findings: exactCrossGrade(all)=${findings.exactDuplicateCrossGrade.length}, exactStatic=${findings.exactDuplicateCrossGradeStaticBanksOnly.length}, nearDup=${findings.nearDuplicateCrossGrade.length}, familyWide=${findings.patternFamilyWideGradeSpan.length}`
  );
  console.log(
    `Stage2: withinBandPairs=${stage2.withinBandClassPairOverlaps.length}, weakLevels=${stage2.weakLevelSeparationCombos.length}, mathKindsMissed=${stage2.generatorBranchCoverage.math.kindsNotHitInRun.length}, geoKindsMissed=${stage2.generatorBranchCoverage.geometry.kindsNotHitInRun.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
