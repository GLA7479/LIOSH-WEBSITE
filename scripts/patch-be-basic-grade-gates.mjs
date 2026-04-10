/**
 * חד־פעמי/ידני: מוסיף minGrade/maxGrade לפריטי be_basic (חצי לכיתה א׳, חצי לב׳).
 * הרצה: npx tsx scripts/patch-be-basic-grade-gates.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const path = join(ROOT, "data", "english-questions", "grammar-pools.js");
let s = readFileSync(path, "utf8");
const start = s.indexOf("  be_basic: [");
const end = s.indexOf("  question_frames:", start);
if (start < 0 || end < 0) throw new Error("be_basic block not found");
const head = s.slice(0, start);
const block = s.slice(start, end);
const tail = s.slice(end);
let n = 0;
const patched = block.replace(/\{\n      question:/g, () => {
  n++;
  const g1 = n <= 15;
  return g1
    ? `{\n      minGrade: 1,\n      maxGrade: 1,\n      question:`
    : `{\n      minGrade: 2,\n      maxGrade: 2,\n      question:`;
});
if (n === 0) throw new Error("no items patched");
writeFileSync(path, head + patched + tail, "utf8");
console.log(`Patched ${n} be_basic items with minGrade/maxGrade`);
