import { SCIENCE_QUESTIONS } from "../data/science-questions.js";
const ids = [];
for (const q of SCIENCE_QUESTIONS) {
  if (q.type !== "mcq" || !q.options) continue;
  if (q.options.some((o) => String(o).trim().startsWith("רק"))) ids.push(q.id);
}
console.log("count", ids.length);
console.log(ids.join("\n"));
