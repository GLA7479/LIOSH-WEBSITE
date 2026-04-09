/**
 * Phase 2: unique science question ids + orphan grade recovery.
 * Run from repo root: node scripts/phase2-science-integrity.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SCIENCE_QUESTIONS } from "../data/science-questions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, "..", "data", "science-questions.js");

const origIds = SCIENCE_QUESTIONS.map((q) => q.id);
const serial = new Map();
const newIds = [];
for (let i = 0; i < origIds.length; i++) {
  const key = origIds[i];
  if (!serial.has(key)) {
    serial.set(key, 2);
    newIds.push(key);
  } else {
    const v = serial.get(key);
    newIds.push(`${key}__v${v}`);
    serial.set(key, v + 1);
  }
}

/** Orphans had grades: []; plants allowed g1–g3 per science-curriculum. Assignments by array index (deterministic). */
const orphanGradesByIndex = new Map([
  [14, ["g1", "g2", "g3"]], // medium T/F — day/night respiration vs photosynthesis
  [15, ["g3"]], // hard — stomata (פיוניות)
  [92, ["g3"]], // hard — cellular respiration (נשימה תאית)
  [93, ["g3"]], // hard — photosynthesis definition
  [129, ["g2", "g3"]], // hard — pollination
  [130, ["g3"]], // hard — transpiration
  [131, ["g2", "g3"]], // hard — organic fertilizer
  [177, ["g2", "g3"]], // hard — fertilizer
  [178, ["g2", "g3"]], // hard — compost
]);

let text = fs.readFileSync(target, "utf8");

let idIdx = 0;
text = text.replace(/^    id: "([^"]+)",$/gm, (_, old) => {
  const expected = SCIENCE_QUESTIONS[idIdx].id;
  if (old !== expected) {
    throw new Error(`id order mismatch at ${idIdx}: file "${old}" vs module "${expected}"`);
  }
  const next = newIds[idIdx++];
  return `    id: "${next}",`;
});
if (idIdx !== newIds.length) {
  throw new Error(`id line count ${idIdx} !== ${newIds.length}`);
}

const fmtGrades = (arr) =>
  `    grades: [${arr.map((g) => `"${g}"`).join(", ")}],`;

let gIdx = 0;
text = text.replace(/^    grades: \[[^\]]*\],$/gm, (line) => {
  const i = gIdx++;
  if (orphanGradesByIndex.has(i)) return fmtGrades(orphanGradesByIndex.get(i));
  return line;
});
if (gIdx !== SCIENCE_QUESTIONS.length) {
  throw new Error(`grades line count ${gIdx} !== ${SCIENCE_QUESTIONS.length}`);
}

fs.writeFileSync(target, text, "utf8");
console.log("OK: wrote", target);
console.log("Renamed duplicate rows:", newIds.filter((id, i) => id !== origIds[i]).length);
console.log("Orphan indices recovered:", orphanGradesByIndex.size);
