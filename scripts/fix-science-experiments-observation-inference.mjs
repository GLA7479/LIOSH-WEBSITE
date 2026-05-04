/**
 * Phase 10 follow-up: JS \\b does not work for Hebrew stems — re-tag experiments
 * that clearly reference hypothesis/observation/conclusion vocabulary.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { SCIENCE_QUESTIONS } from "../data/science-questions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mainPath = path.join(root, "data/science-questions.js");
const phase3Path = path.join(root, "data/science-questions-phase3.js");

const OBS_RE =
  /מסקנה|מסקנות|השערה|תצפית|ניתוח תוצאות|ניתוח הנתונים|הסבר את התוצא|מה למדנו מהניסוי|הסקת מסקנה|רושמים תצפית|הבדל בין השערה למסקנה|מסקנה בניסוי|תצפית גולמית/i;

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tryReplace(text, id) {
  const re = new RegExp(
    `(\\"id\\"\\s*:\\s*\\"${esc(id)}\\"[\\s\\S]*?\\"patternFamily\\"\\s*:\\s*\\")sci_experiments_scientific_method(\\")`,
    "m",
  );
  if (!re.test(text)) return { text, ok: false };
  return {
    text: text.replace(re, "$1sci_experiments_observation_inference$2"),
    ok: true,
  };
}

let main = fs.readFileSync(mainPath, "utf8");
let p3 = fs.readFileSync(phase3Path, "utf8");

for (const q of SCIENCE_QUESTIONS) {
  if (q.topic !== "experiments") continue;
  if (q.params?.patternFamily !== "sci_experiments_scientific_method") continue;
  if (!OBS_RE.test(q.stem || "")) continue;
  const id = q.id;
  let r = tryReplace(main, id);
  if (r.ok) {
    main = r.text;
    console.log("updated (main):", id);
    continue;
  }
  r = tryReplace(p3, id);
  if (r.ok) {
    p3 = r.text;
    console.log("updated (phase3):", id);
    continue;
  }
  console.warn("skip (pattern not found):", id);
}

fs.writeFileSync(mainPath, main, "utf8");
fs.writeFileSync(phase3Path, p3, "utf8");
