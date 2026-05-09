/**
 * Runtime Geometry gate — explicit-topic generation per grade; output topic must stay in grade list.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { GRADES } = await import(modUrl("utils/geometry-constants.js"));
const { getLevelForGrade } = await import(modUrl("utils/geometry-storage.js"));
const { generateQuestion } = await import(modUrl("utils/geometry-question-generator.js"));

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
    const topics = (GRADES[gk].topics || []).filter((t) => t !== "mixed");

    for (const topic of topics) {
      for (const lev of LEVELS) {
        const lc = getLevelForGrade(lev, gk);
        for (let i = 0; i < PER_CELL; i++) {
          const seed = 0x676f + g * 4099 + topic.length * 17 + i * 997 + (lev === "easy" ? 3 : lev === "medium" ? 5 : 7);
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
        }
      }
    }
  }

  console.log(JSON.stringify({ ok: failures.length === 0, failureCount: failures.length, failures: failures.slice(0, 80), notes: notes.slice(0, 40) }, null, 2));

  if (failures.length) {
    console.error("qa-geometry-runtime-gate: FAILED");
    process.exit(1);
  }
  console.log("qa-geometry-runtime-gate: OK");
}

main();
