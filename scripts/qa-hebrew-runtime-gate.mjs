/**
 * Runtime Hebrew gate — topic visibility + grade-sensitive stem/content rules (esp. g1/g2).
 * Writes reports/curriculum-audit/hebrew-g12-runtime-sampled-export.json (summary + failure excerpts).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

import {
  analyzeG12Stem,
  extractStemText,
  G12_ADVISORY_MIN_CHARS,
  G12_FAIL_MAX_CHARS,
} from "./curriculum-audit/lib/hebrew-content-quality-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { GRADES } = await import(modUrl("utils/hebrew-constants.js"));
const { getLevelForGrade } = await import(modUrl("utils/hebrew-storage.js"));
const { generateQuestion } = await import(modUrl("utils/hebrew-question-generator.js"));

const LEVELS = ["easy", "medium", "hard"];
const PER_CELL = 24;

let rngState = 0xdeadbeef;
function runWithSeed(seed, fn) {
  const orig = Math.random;
  rngState = (seed >>> 0) ^ 0xcafe1234;
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

  /** @type {string[]} */
  const failures = [];
  let g12StemFailureEvents = 0;
  /** @type {string[]} */
  const notes = [];

  /** @type {Record<string, { lengths: number[], advisoryCount: number, failureCount: number }>} */
  const g12CellAgg = {};
  /** @type {object[]} */
  const g12FailureRows = [];

  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const topics = (GRADES[gk].topics || []).filter((t) => t !== "mixed");

    for (const topic of topics) {
      for (const lev of LEVELS) {
        const lc = getLevelForGrade(lev, gk);
        const cellKey = `${gk}|${topic}|${lev}`;
        if (g <= 2 && !g12CellAgg[cellKey]) {
          g12CellAgg[cellKey] = { lengths: [], advisoryCount: 0, failureCount: 0 };
        }

        for (let i = 0; i < PER_CELL; i++) {
          const seed =
            0x686272 + g * 4099 + topic.length * 17 + i * 997 + (lev === "easy" ? 3 : lev === "medium" ? 5 : 7);
          const q = runWithSeed(seed, () => generateQuestion(lc, topic, gk, null));
          const outTopic = String(q?.topic || "").trim();
          const allowed = GRADES[gk].topics;
          if (!outTopic) failures.push(`${gk}/${topic}/${lev}: missing output.topic`);
          else if (!allowed.includes(outTopic)) {
            failures.push(`${gk}/${topic}/${lev}: output.topic="${outTopic}" not in GRADES.topics`);
          }
          const diff = String(q?.difficulty || q?.params?.difficulty || "").toLowerCase();
          const allowedDiff = new Set(["easy", "medium", "hard", "basic", "standard", "advanced"]);
          if (diff && !allowedDiff.has(diff)) {
            notes.push(`${gk}/${topic}: unexpected difficulty label "${diff}"`);
          }

          const stem = extractStemText(q);
          if (g <= 2) {
            const r = analyzeG12Stem(g, topic, stem);
            g12CellAgg[cellKey].lengths.push(stem.length);
            g12CellAgg[cellKey].advisoryCount += r.advisories.length;
            if (r.failures.length) {
              g12CellAgg[cellKey].failureCount += 1;
              g12StemFailureEvents += 1;
              failures.push(`${gk}/${topic}/${lev}[${i}]: ${r.failures.join("; ")}`);
              if (g12FailureRows.length < 120) {
                g12FailureRows.push({
                  gradeKey: gk,
                  topic,
                  difficulty: lev,
                  seed,
                  stemPreview: stem.slice(0, 380),
                  failures: r.failures,
                  metrics: r.metrics,
                });
              }
            }
          }
        }
      }
    }
  }

  /** @type {Record<string, unknown>} */
  const cellSummaries = {};
  for (const [ck, v] of Object.entries(g12CellAgg)) {
    const lens = v.lengths;
    cellSummaries[ck] = {
      samples: lens.length,
      medianStemChars: Math.round(median(lens)),
      maxStemChars: lens.length ? Math.max(...lens) : 0,
      failureSamplesInCell: v.failureCount,
      advisoryHitsInCell: v.advisoryCount,
    };
  }

  const exportPayload = {
    generatedAt: new Date().toISOString(),
    purpose:
      "g1/g2 runtime sampling — stem metrics + analyzeG12Stem failures; thresholds in hebrew-content-quality-lib.mjs",
    thresholdsReference: {
      G12_FAIL_MAX_CHARS,
      G12_ADVISORY_MIN_CHARS,
    },
    perCellSummary: cellSummaries,
    failureSamples: g12FailureRows,
    totals: {
      g12Cells: Object.keys(g12CellAgg).length,
      g12StemFailureEvents,
    },
  };

  await writeFile(join(OUT_DIR, "hebrew-g12-runtime-sampled-export.json"), JSON.stringify(exportPayload, null, 2), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: failures.length === 0,
        failureCount: failures.length,
        failures: failures.slice(0, 80),
        notes: notes.slice(0, 40),
        g12Export: "reports/curriculum-audit/hebrew-g12-runtime-sampled-export.json",
      },
      null,
      2
    )
  );

  if (failures.length) {
    console.error("qa-hebrew-runtime-gate: FAILED");
    process.exit(1);
  }
  console.log("qa-hebrew-runtime-gate: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
