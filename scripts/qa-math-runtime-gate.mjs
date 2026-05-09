/**
 * Runtime Math gate — explicit-topic generation per grade; forbidden ops must never appear.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { GRADES } = await import(modUrl("utils/math-constants.js"));
const { getLevelConfig } = await import(modUrl("utils/math-storage.js"));
const { generateQuestion } = await import(modUrl("utils/math-question-generator.js"));
const { MUST_NOT_EXPOSE_OPS } = await import(modUrl("utils/math-grade-topic-policy.js"));

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

function main() {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const notes = [];

  for (let g = 1; g <= 6; g++) {
    const gk = `g${g}`;
    const forbidden = MUST_NOT_EXPOSE_OPS[gk] || new Set();
    const ops = (GRADES[gk].operations || []).filter((o) => o !== "mixed");

    for (const op of ops) {
      if (forbidden.has(op)) {
        failures.push(`${gk}: policy forbids "${op}" but GRADES still lists it`);
      }

      for (const lev of LEVELS) {
        const lc = getLevelConfig(g, lev);
        for (let i = 0; i < PER_CELL; i++) {
          const seed = 0x72754e + g * 4099 + op.length * 17 + i * 997 + (lev === "easy" ? 3 : lev === "medium" ? 5 : 7);
          const q = runWithSeed(seed, () => generateQuestion(lc, op, gk, null));
          const outOp = String(q?.operation || "").trim();
          const allowed = GRADES[gk].operations;
          if (!outOp) failures.push(`${gk}/${op}/${lev}: missing output.operation`);
          else if (!allowed.includes(outOp)) {
            failures.push(`${gk}/${op}/${lev}: output.operation="${outOp}" not in GRADES.operations`);
          }
          if (forbidden.has(outOp)) {
            failures.push(`${gk}/${op}/${lev}: forbidden operation leaked — "${outOp}"`);
          }
          const diff = String(q?.difficulty || q?.params?.difficulty || "").toLowerCase();
          const allowedDiff = new Set(["easy", "medium", "hard", "basic", "standard", "advanced"]);
          if (diff && !allowedDiff.has(diff)) {
            notes.push(`${gk}/${op}: unexpected difficulty label "${diff}"`);
          }
        }
      }
    }
  }

  console.log(JSON.stringify({ ok: failures.length === 0, failureCount: failures.length, failures: failures.slice(0, 80), notes: notes.slice(0, 40) }, null, 2));

  if (failures.length) {
    console.error("qa-math-runtime-gate: FAILED");
    process.exit(1);
  }
  console.log("qa-math-runtime-gate: OK");
}

main();
