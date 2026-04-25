/**
 * דגימה דטרמיניסטית + כפיית ענפים נדירים (מתמטיקה) + גיאומטריה נוסחתית/קונספטואלית.
 *
 * פלט:
 *   reports/question-audit/harness-math.json
 *   reports/question-audit/harness-geometry.json
 *   reports/question-audit/harness-geometry-conceptual.json
 *
 * npm run audit:harness
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-audit");

function modUrl(rel) {
  return pathToFileURL(join(ROOT, rel)).href;
}

function lcgRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function withMathRandom(seed, fn) {
  const orig = Math.random;
  Math.random = lcgRandom(seed);
  try {
    return fn();
  } finally {
    Math.random = orig;
  }
}

const SEEDS_PER_COMBO = Number(process.env.HARNESS_SEEDS || 128);

const { generateQuestion: genMath } = await import(
  modUrl("utils/math-question-generator.js")
);
const { getLevelConfig } = await import(modUrl("utils/math-storage.js"));
const { GRADES: MATH_GRADES } = await import(modUrl("utils/math-constants.js"));

globalThis.__LIOSH_SKIP_GEOMETRY_CONCEPTUAL = true;
const { generateQuestion: genGeometry } = await import(
  modUrl("utils/geometry-question-generator.js")
);
const { GRADES: GEO_GRADES, LEVELS: GEO_LEVELS } = await import(
  modUrl("utils/geometry-constants.js")
);

const LEVEL_KEYS = ["easy", "medium", "hard"];

const MATH_FORCE_PROBES = [
  { force: "mul_tens", gk: "g3", lev: "easy", op: "multiplication" },
  { force: "mul_hundreds", gk: "g3", lev: "easy", op: "multiplication" },
  { force: "frac_half", gk: "g2", lev: "easy", op: "fractions" },
  { force: "frac_half_reverse", gk: "g2", lev: "easy", op: "fractions" },
  { force: "frac_half_reverse", gk: "g2", lev: "easy", op: "fractions" },
  { force: "frac_half_reverse", gk: "g2", lev: "easy", op: "fractions" },
  { force: "frac_half_reverse", gk: "g2", lev: "easy", op: "fractions" },
  { force: "frac_quarter", gk: "g2", lev: "easy", op: "fractions" },
  { force: "frac_quarter_reverse", gk: "g2", lev: "easy", op: "fractions" },
  { force: "frac_quarter_reverse", gk: "g2", lev: "easy", op: "fractions" },
  { force: "frac_quarter_reverse", gk: "g2", lev: "easy", op: "fractions" },
  { force: "frac_quarter_reverse", gk: "g2", lev: "easy", op: "fractions" },
  { force: "dec_repeating", gk: "g6", lev: "hard", op: "decimals" },
  { force: "dec_repeating", gk: "g6", lev: "hard", op: "decimals" },
  { force: "dec_repeating", gk: "g6", lev: "hard", op: "decimals" },
  { force: "dec_repeating", gk: "g6", lev: "hard", op: "decimals" },
  { force: "dec_divide", gk: "g6", lev: "hard", op: "decimals" },
  { force: "dec_divide", gk: "g6", lev: "hard", op: "decimals" },
  { force: "dec_divide", gk: "g6", lev: "hard", op: "decimals" },
  { force: "dec_divide", gk: "g6", lev: "hard", op: "decimals" },
  { force: "frac_to_mixed", gk: "g5", lev: "medium", op: "fractions" },
  { force: "frac_to_mixed", gk: "g5", lev: "medium", op: "fractions" },
  { force: "frac_to_mixed", gk: "g5", lev: "hard", op: "fractions" },
  { force: "frac_to_mixed", gk: "g5", lev: "hard", op: "fractions" },
  { force: "wp_unit_cm_to_m", gk: "g5", lev: "medium", op: "word_problems" },
  { force: "wp_unit_cm_to_m", gk: "g5", lev: "hard", op: "word_problems" },
  { force: "wp_unit_cm_to_m", gk: "g6", lev: "medium", op: "word_problems" },
  { force: "wp_unit_cm_to_m", gk: "g6", lev: "hard", op: "word_problems" },
  { force: "dec_multiply", gk: "g6", lev: "medium", op: "decimals" },
  { force: "dec_multiply_10_100", gk: "g6", lev: "easy", op: "decimals" },
  { force: "div_two_digit", gk: "g5", lev: "medium", op: "division" },
  { force: "eq_add_simple", gk: "g1", lev: "easy", op: "equations" },
  { force: "eq_sub_simple", gk: "g1", lev: "easy", op: "equations" },
  { force: "wp_comparison_more", gk: "g3", lev: "medium", op: "word_problems" },
  { force: "wp_shop_discount", gk: "g5", lev: "medium", op: "word_problems" },
  { force: "ratio_find", gk: "g6", lev: "hard", op: "ratio" },
  { force: "scale_find", gk: "g6", lev: "hard", op: "scale" },
  { force: "fm_gcd", gk: "g5", lev: "medium", op: "factors_multiples" },
  { force: "est_add", gk: "g4", lev: "easy", op: "estimation" },
  { force: "perc_part_of", gk: "g5", lev: "medium", op: "percentages" },
];

function runMathForcedKinds() {
  const kinds = new Set();
  for (let i = 0; i < MATH_FORCE_PROBES.length; i++) {
    const p = MATH_FORCE_PROBES[i];
    withMathRandom(0xf00d + i * 999983, () => {
      globalThis.__LIOSH_MATH_FORCE = p.force;
      try {
        const gNum = parseInt(p.gk.replace(/\D/g, ""), 10) || 3;
        const lc = getLevelConfig(gNum, p.lev);
        const q = genMath(lc, p.op, p.gk);
        const k = q?.params?.kind;
        if (k) kinds.add(String(k));
      } catch {
        /* ignore */
      } finally {
        delete globalThis.__LIOSH_MATH_FORCE;
      }
    });
  }
  return [...kinds].sort();
}

const GEO_SHAPE_PROBES = [
  { gk: "g5", lev: "medium", topic: "diagonal", shape: "parallelogram" },
  { gk: "g6", lev: "medium", topic: "volume", shape: "prism" },
];

function runGeoForcedKinds() {
  const kinds = new Set();
  for (let i = 0; i < GEO_SHAPE_PROBES.length; i++) {
    const p = GEO_SHAPE_PROBES[i];
    withMathRandom(0x600d + i * 7919, () => {
      globalThis.__LIOSH_GEOMETRY_FORCE = { shape: p.shape };
      try {
        const q = genGeometry(GEO_LEVELS[p.lev], p.topic, p.gk);
        const k = q?.params?.kind;
        if (k && k !== "no_question") kinds.add(String(k));
      } catch {
        /* ignore */
      } finally {
        delete globalThis.__LIOSH_GEOMETRY_FORCE;
      }
    });
  }
  return [...kinds].sort();
}

function runMathHarness() {
  const byCombo = {};
  for (const gk of Object.keys(MATH_GRADES)) {
    const gNum = parseInt(gk.replace(/\D/g, ""), 10) || 1;
    const ops = (MATH_GRADES[gk].operations || []).filter((o) => o !== "mixed");
    for (const lev of LEVEL_KEYS) {
      const lc = getLevelConfig(gNum, lev);
      for (const op of ops) {
        const key = `${gk}|${lev}|${op}`;
        const kinds = new Set();
        let errors = 0;
        for (let seed = 0; seed < SEEDS_PER_COMBO; seed++) {
          withMathRandom(seed * 10007 + gNum * 13 + lev.length * 3, () => {
            try {
              const q = genMath(lc, op, gk);
              const k = q?.params?.kind;
              if (k) kinds.add(String(k));
            } catch {
              errors++;
            }
          });
        }
        byCombo[key] = {
          kinds: [...kinds].sort(),
          kindCount: kinds.size,
          errors,
          seeds: SEEDS_PER_COMBO,
        };
      }
    }
  }
  const forcedKinds = runMathForcedKinds();
  for (const k of forcedKinds) {
    byCombo[`__forced__|${k}`] = { kinds: [k], kindCount: 1, forced: true };
  }
  return {
    generatedAt: new Date().toISOString(),
    seedsPerCombo: SEEDS_PER_COMBO,
    skipGeometryConceptual: true,
    mathForcedKinds: forcedKinds,
    combos: byCombo,
  };
}

function runGeometryHarness() {
  const byCombo = {};
  for (const gk of Object.keys(GEO_GRADES)) {
    const topics = (GEO_GRADES[gk].topics || []).filter((t) => t !== "mixed");
    for (const lev of LEVEL_KEYS) {
      const level = GEO_LEVELS[lev];
      for (const topic of topics) {
        const key = `${gk}|${lev}|${topic}`;
        const kinds = new Set();
        let errors = 0;
        for (let seed = 0; seed < SEEDS_PER_COMBO; seed++) {
          withMathRandom(seed * 13001 + gk.charCodeAt(1) * 17, () => {
            try {
              const q = genGeometry(level, topic, gk);
              const k = q?.params?.kind;
              if (k && k !== "no_question") kinds.add(String(k));
            } catch {
              errors++;
            }
          });
        }
        byCombo[key] = {
          kinds: [...kinds].sort(),
          kindCount: kinds.size,
          errors,
          seeds: SEEDS_PER_COMBO,
        };
      }
    }
  }
  const forcedGeo = runGeoForcedKinds();
  for (const k of forcedGeo) {
    byCombo[`__forced_shape__|${k}`] = { kinds: [k], kindCount: 1, forced: true };
  }
  return {
    generatedAt: new Date().toISOString(),
    seedsPerCombo: SEEDS_PER_COMBO,
    conceptualSuppressed: true,
    geoForcedKinds: forcedGeo,
    combos: byCombo,
  };
}

function runGeometryConceptualHarness() {
  delete globalThis.__LIOSH_SKIP_GEOMETRY_CONCEPTUAL;
  globalThis.__LIOSH_GEOMETRY_FORCE_CONCEPTUAL = true;
  const byCombo = {};
  try {
    for (const gk of Object.keys(GEO_GRADES)) {
      const topics = (GEO_GRADES[gk].topics || []).filter((t) => t !== "mixed");
      for (const lev of LEVEL_KEYS) {
        const level = GEO_LEVELS[lev];
        for (const topic of topics) {
          const key = `${gk}|${lev}|${topic}|conceptual`;
          const kinds = new Set();
          let errors = 0;
          const extra = 64;
          for (let seed = 0; seed < extra; seed++) {
            withMathRandom(seed * 17011 + gk.charCodeAt(1) * 31, () => {
              try {
                const q = genGeometry(level, topic, gk);
                const k = q?.params?.kind;
                if (k && k !== "no_question") kinds.add(String(k));
              } catch {
                errors++;
              }
            });
          }
          byCombo[key] = {
            kinds: [...kinds].sort(),
            kindCount: kinds.size,
            errors,
            seeds: extra,
          };
        }
      }
    }
  } finally {
    delete globalThis.__LIOSH_GEOMETRY_FORCE_CONCEPTUAL;
  }
  return {
    generatedAt: new Date().toISOString(),
    conceptualForced: true,
    combos: byCombo,
  };
}

mkdirSync(OUT_DIR, { recursive: true });
const mathReport = runMathHarness();
writeFileSync(
  join(OUT_DIR, "harness-math.json"),
  JSON.stringify(mathReport, null, 2),
  "utf8"
);

const geoReport = runGeometryHarness();
writeFileSync(
  join(OUT_DIR, "harness-geometry.json"),
  JSON.stringify(geoReport, null, 2),
  "utf8"
);

delete globalThis.__LIOSH_SKIP_GEOMETRY_CONCEPTUAL;
const geoConceptReport = runGeometryConceptualHarness();
writeFileSync(
  join(OUT_DIR, "harness-geometry-conceptual.json"),
  JSON.stringify(geoConceptReport, null, 2),
  "utf8"
);

console.log(
  "Wrote harness-math.json, harness-geometry.json, harness-geometry-conceptual.json"
);
