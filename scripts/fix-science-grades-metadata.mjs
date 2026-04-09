/**
 * One-off maintainer script: align science question grades[] with
 * data/science-curriculum.js (SCIENCE_GRADES[g].topics).
 * Run from repo root: node scripts/fix-science-grades-metadata.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SCIENCE_QUESTIONS } from "../data/science-questions.js";
import { SCIENCE_GRADES } from "../data/science-curriculum.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const target = path.join(root, "data", "science-questions.js");

function gradeAllowsTopic(g, topic) {
  const t = SCIENCE_GRADES[g]?.topics;
  return Array.isArray(t) && t.includes(topic);
}

const fixedGrades = SCIENCE_QUESTIONS.map((q) =>
  (q.grades || []).filter((g) => gradeAllowsTopic(g, q.topic))
);

let text = fs.readFileSync(target, "utf8");
const re = /^    grades: \[[^\]]*\],$/gm;
let i = 0;
text = text.replace(re, () => {
  const arr = fixedGrades[i++];
  return `    grades: [${arr.map((g) => `"${g}"`).join(", ")}],`;
});

if (i !== fixedGrades.length) {
  throw new Error(
    `grades line count mismatch: replaced ${i}, expected ${fixedGrades.length}`
  );
}

fs.writeFileSync(target, text, "utf8");
console.log("Updated", target, "-", fixedGrades.length, "grade lines");
