import { SCIENCE_QUESTIONS } from "../data/science-questions.js";
import { SCIENCE_QUESTIONS_PHASE3 } from "../data/science-questions-phase3.js";
import { SCIENCE_GRADES } from "../data/science-curriculum.js";

const required = [
  "id",
  "topic",
  "grades",
  "minLevel",
  "maxLevel",
  "type",
  "stem",
  "options",
  "correctIndex",
  "explanation",
  "theoryLines",
];

let errors = [];
const ids = new Map();

for (let i = 0; i < SCIENCE_QUESTIONS.length; i++) {
  const q = SCIENCE_QUESTIONS[i];
  for (const k of required) {
    if (!(k in q)) errors.push(`#${i} missing ${k}`);
  }
  if (!Array.isArray(q.options) || q.options.length < 2)
    errors.push(`#${i} bad options`);
  if (
    typeof q.correctIndex !== "number" ||
    q.correctIndex < 0 ||
    q.correctIndex >= q.options?.length
  )
    errors.push(`#${i} bad correctIndex`);
  if (!Array.isArray(q.theoryLines) || q.theoryLines.length < 1)
    errors.push(`#${i} bad theoryLines`);
  if (q.id) {
    ids.set(q.id, (ids.get(q.id) || 0) + 1);
  }
  for (const g of q.grades || []) {
    const allowed = SCIENCE_GRADES[g]?.topics;
    if (!allowed || !allowed.includes(q.topic)) {
      errors.push(`#${i} id=${q.id} invalid grade-topic: ${g} + ${q.topic}`);
    }
  }
}

for (const [id, c] of ids) {
  if (c > 1) errors.push(`duplicate id: ${id} (${c})`);
}

console.log("Total questions:", SCIENCE_QUESTIONS.length);

const phase3Ids = new Set(SCIENCE_QUESTIONS_PHASE3.map((q) => q.id));
const phase3 = SCIENCE_QUESTIONS.filter((q) => phase3Ids.has(q.id));

const byTopic = {};
const byGrade = {};
const byDiff = {};
for (const q of phase3) {
  byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
  for (const g of q.grades) byGrade[g] = (byGrade[g] || 0) + 1;
  const d = `${q.minLevel}/${q.maxLevel}`;
  byDiff[d] = (byDiff[d] || 0) + 1;
}
console.log("Phase3-like id sample count:", phase3.length);
console.log("By topic:", byTopic);
console.log("By grade:", byGrade);
console.log("By difficulty:", byDiff);

const hardCount = phase3.filter((q) => q.minLevel === "hard").length;
console.log("Phase3 hard (minLevel):", hardCount);

if (errors.length) {
  console.error("ERRORS:\n" + errors.slice(0, 50).join("\n"));
  if (errors.length > 50) console.error(`... and ${errors.length - 50} more`);
  process.exit(1);
}
console.log("OK: schema, duplicates, grade-topic");
