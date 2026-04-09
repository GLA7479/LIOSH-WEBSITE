import { execSync } from "child_process";
import { SCIENCE_QUESTIONS } from "../data/science-questions.js";

const oldSrc = execSync("git show HEAD:data/science-questions.js", {
  encoding: "utf8",
  maxBuffer: 35 * 1024 * 1024,
});
const re = /^    id: "([^"]+)",$/gm;
const oldIds = [];
let m;
while ((m = re.exec(oldSrc)) !== null) oldIds.push(m[1]);

const newIds = SCIENCE_QUESTIONS.map((q) => q.id);
if (oldIds.length !== newIds.length) {
  throw new Error(`len old ${oldIds.length} new ${newIds.length}`);
}

const changes = [];
for (let i = 0; i < newIds.length; i++) {
  if (oldIds[i] !== newIds[i]) changes.push({ index: i, from: oldIds[i], to: newIds[i] });
}
console.log(JSON.stringify({ count: changes.length, changes }, null, 2));
