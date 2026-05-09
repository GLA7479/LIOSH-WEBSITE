/**
 * Hebrew sampled generated content quality — stems analyzed per grade/topic/difficulty.
 * Writes reports/curriculum-audit/hebrew-sampled-content-quality.{json,md}
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import {
  analyzeG12Stem,
  coverageBucketsWithKinds,
  evaluateUpperGradeCoverage,
  extractStemText,
  UPPER_G34_SIGNALS,
  UPPER_G56_SIGNALS,
} from "./lib/hebrew-content-quality-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { GRADES } = await import(modUrl("utils/hebrew-constants.js"));
const { getLevelForGrade } = await import(modUrl("utils/hebrew-storage.js"));
const { generateQuestion } = await import(modUrl("utils/hebrew-question-generator.js"));

const LEVELS = ["easy", "medium", "hard"];
const SAMPLES_PER_CELL = 24;

let rngState = 0x484252 >>> 0;
function runWithSeed(seed, fn) {
  const orig = Math.random;
  rngState = (seed >>> 0) ^ 0x9e3779b9;
  Math.random = () => {
    rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
    return rngState / 4294967296;
  };
  try {
    return fn();
  } finally {
    Math.random = orig;
  }
}

function median(nums) {
  if (!nums.length) return 0;
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  /** @type {object[]} */
  const g12DetailedSamples = [];
  /** @type {object[]} */
  const g12Failures = [];
  /** @type {string[]} */
  const allStemsG3 = [];
  const allKindsG3 = [];
  const allStemsG4 = [];
  const allKindsG4 = [];
  const allStemsG5 = [];
  const allKindsG5 = [];
  const allStemsG6 = [];
  const allKindsG6 = [];

  /** @type {Record<string, object>} */
  const cellStats = {};

  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const topics = (GRADES[gk]?.topics || []).filter((t) => t !== "mixed");

    for (const topic of topics) {
      for (const lev of LEVELS) {
        const lc = getLevelForGrade(lev, gk);
        const lens = [];
        const advisoriesCell = [];
        const failuresCell = [];

        for (let i = 0; i < SAMPLES_PER_CELL; i++) {
          const seed =
            0x686272 +
            g * 9973 +
            topic.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 131 +
            (lev === "easy" ? 11 : lev === "medium" ? 17 : 29) * 104729 +
            i * 65521;
          const q = runWithSeed(seed, () => generateQuestion(lc, topic, gk, null));
          const stem = extractStemText(q);
          const kind = String(q?.params?.kind ?? q?.params?.subtopicId ?? "");
          lens.push(stem.length);

          if (g <= 2) {
            const r = analyzeG12Stem(g, topic, stem);
            if (r.failures.length) {
              failuresCell.push(...r.failures.map((x) => `${gk}/${topic}/${lev}:${x}`));
              g12Failures.push({
                gradeKey: gk,
                topic,
                difficulty: lev,
                seed,
                stemPreview: stem.slice(0, 420),
                failures: r.failures,
                metrics: r.metrics,
              });
            }
            advisoriesCell.push(...r.advisories);
            if (i < 3) {
              g12DetailedSamples.push({
                gradeKey: gk,
                topic,
                difficulty: lev,
                seed,
                stemChars: stem.length,
                stemPreview: stem.slice(0, 360),
                failureCount: r.failures.length,
                advisoryCount: r.advisories.length,
              });
            }
          }

          if (g === 3) {
            allStemsG3.push(stem);
            allKindsG3.push(kind);
          } else if (g === 4) {
            allStemsG4.push(stem);
            allKindsG4.push(kind);
          } else if (g === 5) {
            allStemsG5.push(stem);
            allKindsG5.push(kind);
          } else if (g === 6) {
            allStemsG6.push(stem);
            allKindsG6.push(kind);
          }
        }

        const key = `${gk}|${topic}|${lev}`;
        cellStats[key] = {
          gradeKey: gk,
          topic,
          difficulty: lev,
          samples: SAMPLES_PER_CELL,
          medianStemChars: Math.round(median(lens)),
          maxStemChars: Math.max(...lens),
          g12FailureEvents: failuresCell.length,
          g12AdvisoryHits: advisoriesCell.length,
        };
      }
    }
  }

  const g34 = coverageBucketsWithKinds(
    [...allStemsG3, ...allStemsG4],
    [...allKindsG3, ...allKindsG4],
    UPPER_G34_SIGNALS
  );
  const g56g5 = coverageBucketsWithKinds(allStemsG5, allKindsG5, UPPER_G56_SIGNALS);
  const g56g6 = coverageBucketsWithKinds(allStemsG6, allKindsG6, UPPER_G56_SIGNALS);
  const upperEval = evaluateUpperGradeCoverage({ g34, g56g5, g56g6 });

  const g12GatePassed = g12Failures.length === 0;
  const upperGatePassed = upperEval.passed;
  const productContentQualityGatePassed = g12GatePassed && upperGatePassed;

  const payload = {
    generatedAt: new Date().toISOString(),
    meta: {
      samplesPerCell: SAMPLES_PER_CELL,
      purpose:
        "Deterministic seeded sampling of generateQuestion — stem/content heuristics for young grades + corpus signals for upper grades.",
      thresholdsDoc:
        "See scripts/curriculum-audit/lib/hebrew-content-quality-lib.mjs — G12_FAIL_MAX_CHARS, patterns for advanced grammar, upper-grade Hebrew regex buckets.",
    },
    summary: {
      totalCells: Object.keys(cellStats).length,
      g12StemFailureSamples: g12Failures.length,
      g12GatePassed,
      upperGradeCoverage: { g34, g56g5, g56g6 },
      upperGradeCoverageGatePassed: upperGatePassed,
      upperGradeMissing: upperEval.missing,
      productContentQualityGatePassed,
    },
    g12Failures: g12Failures.slice(0, 200),
    g12FailureCountTotal: g12Failures.length,
    g12ExampleExports: g12DetailedSamples,
    cellStats: cellStats,
    gates: {
      productContentQualityGatePassed,
      reasonsFailed: [
        !g12GatePassed ? `${g12Failures.length} g1/g2 samples failed stem/content rules` : null,
        !upperGatePassed ? `Upper-grade signal gaps: ${upperEval.missing.join("; ")}` : null,
      ].filter(Boolean),
    },
  };

  const md = renderMd(payload);
  await writeFile(join(OUT_DIR, "hebrew-sampled-content-quality.json"), JSON.stringify(payload, null, 2), "utf8");
  await writeFile(join(OUT_DIR, "hebrew-sampled-content-quality.md"), md, "utf8");
  console.log(`Wrote ${join(OUT_DIR, "hebrew-sampled-content-quality.json")}`);
}

function renderMd(p) {
  const lines = [];
  lines.push("# Hebrew sampled content quality");
  lines.push("");
  lines.push(`Generated: ${p.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- **productContentQualityGatePassed:** ${p.summary.productContentQualityGatePassed}`);
  lines.push(`- g1/g2 gate: **${p.summary.g12GatePassed ? "pass" : "fail"}** (${p.summary.g12StemFailureSamples} failing samples)`);
  lines.push(`- Upper-grade coverage gate: **${p.summary.upperGradeCoverageGatePassed ? "pass" : "fail"}**`);
  lines.push("");
  lines.push("### Grade 3–4 corpus signals (combined g3+g4 stems)");
  lines.push("```json");
  lines.push(JSON.stringify(p.summary.upperGradeCoverage.g34, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("### Grade 5 signals");
  lines.push("```json");
  lines.push(JSON.stringify(p.summary.upperGradeCoverage.g56g5, null, 2));
  lines.push("```");
  lines.push("");
  lines.push("### Grade 6 signals");
  lines.push("```json");
  lines.push(JSON.stringify(p.summary.upperGradeCoverage.g56g6, null, 2));
  lines.push("```");
  if (p.summary.upperGradeMissing?.length) {
    lines.push("");
    lines.push("### Missing upper-grade signals");
    for (const m of p.summary.upperGradeMissing) lines.push(`- ${m}`);
  }
  if (p.gates.reasonsFailed?.length) {
    lines.push("");
    lines.push("### Gate failures");
    for (const r of p.gates.reasonsFailed) lines.push(`- ${r}`);
  }
  lines.push("");
  lines.push("## g1/g2 failure excerpts (truncated)");
  for (const row of (p.g12Failures || []).slice(0, 25)) {
    lines.push(`- **${row.gradeKey}/${row.topic}/${row.difficulty}** — ${(row.failures || []).join(", ")}`);
    lines.push(`  > ${String(row.stemPreview || "").slice(0, 200)}…`);
  }
  return lines.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
