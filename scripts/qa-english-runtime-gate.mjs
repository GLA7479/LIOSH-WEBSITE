/**
 * English runtime gate — pool item × grade must respect effective ranges + class-split rules.
 * Writes reports/curriculum-audit/english-runtime-gate-export.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { GRAMMAR_POOLS, TRANSLATION_POOLS, SENTENCE_POOLS } = await import(modUrl("data/english-questions/index.js"));
const {
  ENGLISH_GRAMMAR_POOL_RANGE,
  ENGLISH_TRANSLATION_POOL_RANGE,
  ENGLISH_SENTENCE_POOL_RANGE,
  englishPoolItemAllowedWithClassSplit,
  parseGradeKey,
} = await import(modUrl("utils/grade-gating.js"));

const GRADE_KEYS = ["g1", "g2", "g3", "g4", "g5", "g6"];

function bandToGrades(band) {
  if (band === "early") return [1, 2];
  if (band === "mid") return [3, 4];
  if (band === "late") return [5, 6];
  return [1, 6];
}

function itemGradeSpan(item) {
  if (!item || typeof item !== "object") return [1, 6];
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

function stemLenForItem(category, item) {
  if (category === "grammar") return String(item?.question || "").length;
  if (category === "translation") return String(item?.en || item?.question || "").length;
  return String(item?.template || item?.question || "").length;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const g12LongStemAdvisory = [];
  let checks = 0;

  const poolsByCat = {
    grammar: GRAMMAR_POOLS,
    translation: TRANSLATION_POOLS,
    sentence: SENTENCE_POOLS,
  };

  for (const category of /** @type {const} */ (["grammar", "translation", "sentence"])) {
    const pools = poolsByCat[category];
    for (const [poolKey, items] of Object.entries(pools)) {
      if (!Array.isArray(items)) continue;
      for (let ii = 0; ii < items.length; ii++) {
        const item = items[ii];
        const [lo, hi] = englishEffectiveRange(category, poolKey, item);
        for (const gk of GRADE_KEYS) {
          checks++;
          const n = parseGradeKey(gk);
          const inRange = n != null && n >= lo && n <= hi;
          const allowed = englishPoolItemAllowedWithClassSplit(category, poolKey, item, gk);
          if (allowed && !inRange) {
            failures.push(
              `${category}/${poolKey}[${ii}] ${gk}: allowed=true but effective span is G${lo}–G${hi}`
            );
          }
          if (
            allowed &&
            n != null &&
            n <= 2 &&
            category !== "sentence" &&
            stemLenForItem(category, item) > 220
          ) {
            g12LongStemAdvisory.push(`${gk} ${category}/${poolKey}[${ii}] len=${stemLenForItem(category, item)}`);
          }
        }
      }
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      matrixChecks: checks,
      failureCount: failures.length,
      g12LongStemAdvisoryCount: g12LongStemAdvisory.length,
      gatePassed: failures.length === 0,
    },
    failures: failures.slice(0, 400),
    failuresTruncated: failures.length > 400,
    g12LongStemAdvisory: g12LongStemAdvisory.slice(0, 120),
  };

  await writeFile(join(OUT_DIR, "english-runtime-gate-export.json"), JSON.stringify(payload, null, 2), "utf8");

  console.log(JSON.stringify(payload.summary, null, 2));
  if (!payload.summary.gatePassed) {
    console.error("qa-english-runtime-gate: FAILED");
    process.exit(1);
  }
  console.log("qa-english-runtime-gate: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
