/**
 * Rebalances MCQ distractor length so correct answers are not visually obvious.
 * Regenerates data/science-questions.js and data/science-questions-phase3.js.
 *
 * Run: node scripts/rebalance-science-options-write.mjs
 *
 * WARNING (Phase 5.1): Do not run this to “fix” wording. Template-style expansions
 * harmed Hebrew and pedagogy. Prefer editing options by hand in the data files.
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { SCIENCE_QUESTIONS } from "../data/science-questions.js";
import { SCIENCE_QUESTIONS_PHASE3 } from "../data/science-questions-phase3.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const phase3Ids = new Set(SCIENCE_QUESTIONS_PHASE3.map((q) => q.id));

const TOPIC_HEADERS = {
  body: "גוף האדם",
  animals: "בעלי חיים",
  plants: "צמחים",
  materials: "חומרים",
  earth_space: "כדור הארץ והחלל",
  environment: "סביבה ואקולוגיה",
  experiments: "ניסויים ותהליכים",
  mixed: "ערבוב נושאים",
};

function jsStr(s) {
  return JSON.stringify(s ?? "");
}

function rakInner(rak) {
  return rak.replace(/^רק\s+/, "").trim();
}

/** Varied, parallel-length wrong lines — avoid one shared prefix that marks distractors */
function expandRak(rak, salt) {
  const x = rakInner(rak);
  const openers = [
    () => `מתמקד ב${x} בלבד ומתעלם משאר הרכיבים הנדרשים להבנה מלאה`,
    () => `מצמצם את ההסבר ל${x} בלי להשלים את החלקים החסרים בהגדרה`,
    () => `מניח שהדגש על ${x} מספיק כאן בלי להרחיב את ההגדרה`,
    () => `מתאר בעיקר את ${x} ולא את המבנה המלא של התשובה הנכונה`,
  ];
  return openers[salt % 4]();
}

function expandTiny(o, salt) {
  const tails = [
    ` — אינו ממלא את כל מה שהשאלה מבקשת`,
    ` — קצר מדי בשביל להיות תשובה שלמה כאן`,
    ` — לא סוגר את כל הדרוש להבנה`,
    ` — חסר פירוט בהשוואה לניסוח מלא`,
  ];
  return `${o}${tails[salt % 4]}`;
}

function padShort(o, salt) {
  const tails = [
    ` — חסר הקשרים הנוספים להבנה מלאה`,
    ` — לא מוסיף את שכבת ההסבר הנדרשת כאן`,
    ` — נשאר כללי מדי בלי לחבר את כל החלקים`,
    ` — אינו משלים את התמונה שבשאלה`,
  ];
  return `${o}${tails[salt % 4]}`;
}

function rebalanceQuestion(q) {
  const out = {
    ...q,
    grades: [...q.grades],
    options: [...q.options],
    theoryLines: [...q.theoryLines],
  };
  if (out.type === "true_false") return out;

  const opts = out.options;
  const ci = out.correctIndex;
  const correct = opts[ci];
  let cl = correct.length;

  const maxOpt = Math.max(...opts.map((o) => o.length), 0);
  const allReasonablyShort =
    opts.every((o) => o.length <= 24) && correct.length <= 28 && maxOpt <= 24;
  if (allReasonablyShort) return out;

  let salt = (q.id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < opts.length; i++) {
    if (i === ci) continue;
    let o = opts[i];
    if (/^רק\s+/.test(o)) opts[i] = expandRak(o, salt + i);
    else if (o.length < 14 && cl > 38) opts[i] = expandTiny(o, salt + i);
  }

  cl = opts[ci].length;
  const wrongLens = opts.filter((_, i) => i !== ci).map((x) => x.length);
  const maxWrong = Math.max(...wrongLens, 1);
  for (let i = 0; i < opts.length; i++) {
    if (i === ci) continue;
    if (opts[i].length < maxWrong * 0.72 && opts[i].length < cl * 0.62) {
      if (!/ — /.test(opts[i])) opts[i] = padShort(opts[i], salt + i * 7);
    }
  }

  return out;
}

function formatQuestion(q) {
  const expl = q.explanation;
  const lines = ["  {"];
  lines.push(`    id: ${jsStr(q.id)},`);
  lines.push(`    topic: ${jsStr(q.topic)},`);
  lines.push(`    grades: [${q.grades.map((g) => jsStr(g)).join(", ")}],`);
  lines.push(`    minLevel: ${jsStr(q.minLevel)},`);
  lines.push(`    maxLevel: ${jsStr(q.maxLevel)},`);
  lines.push(`    type: ${jsStr(q.type)},`);
  lines.push(`    stem: ${jsStr(q.stem)},`);
  lines.push(`    options: [`);
  for (const o of q.options) lines.push(`      ${jsStr(o)},`);
  lines.push(`    ],`);
  lines.push(`    correctIndex: ${q.correctIndex},`);
  if (expl.includes("\n")) {
    lines.push(`    explanation:`);
    lines.push(`      ${jsStr(expl)},`);
  } else {
    lines.push(`    explanation: ${jsStr(expl)},`);
  }
  lines.push(`    theoryLines: [`);
  for (const t of q.theoryLines) lines.push(`      ${jsStr(t)},`);
  lines.push(`    ],`);
  lines.push(`  }`);
  return lines.join("\n");
}

function formatBankWithTopicHeaders(questions) {
  let prevTopic = null;
  const groups = [];
  let headerLine = "";
  const qs = [];
  const flush = () => {
    if (headerLine && qs.length) {
      groups.push(`${headerLine}\n${qs.join(",\n")}`);
    }
    qs.length = 0;
  };
  for (const q of questions) {
    if (q.topic !== prevTopic) {
      flush();
      headerLine = `  // ========= ${TOPIC_HEADERS[q.topic] || q.topic} =========`;
      prevTopic = q.topic;
    }
    qs.push(formatQuestion(q));
  }
  flush();
  return groups.join(",\n");
}

function formatPhase3Bank(questions) {
  let prevSection = null;
  const groups = [];
  let headerLine = "";
  const qs = [];
  const flush = () => {
    if (headerLine && qs.length) {
      groups.push(`${headerLine}\n${qs.join(",\n")}`);
    }
    qs.length = 0;
  };
  for (const q of questions) {
    if (q.topic !== prevSection) {
      flush();
      headerLine = `  // --- ${q.topic} ---`;
      prevSection = q.topic;
    }
    qs.push(formatQuestion(q));
  }
  flush();
  return groups.join(",\n");
}

const balanced = SCIENCE_QUESTIONS.map((q) => rebalanceQuestion(q));
const base = balanced.filter((q) => !phase3Ids.has(q.id));
const p3 = balanced.filter((q) => phase3Ids.has(q.id));

const mainHeader = `// grades[] must list only grades where topic appears in SCIENCE_GRADES[g].topics (data/science-curriculum.js).
// Maintainer realignment: node scripts/fix-science-grades-metadata.mjs
// Option distractors balanced: node scripts/rebalance-science-options-write.mjs
import { SCIENCE_QUESTIONS_PHASE3 } from "./science-questions-phase3.js";

export const SCIENCE_QUESTIONS = [
${formatBankWithTopicHeaders(base)},
].concat(SCIENCE_QUESTIONS_PHASE3);
`;

const phaseHeader = `/**
 * Phase 3 expansion: deeper items for environment, experiments, earth_space
 * (emphasis g5/g6, mostly hard band). Concatenated in science-questions.js.
 * Option lengths aligned with scripts/rebalance-science-options-write.mjs
 */
export const SCIENCE_QUESTIONS_PHASE3 = [
${formatPhase3Bank(p3)},
];
`;

writeFileSync(join(root, "data", "science-questions.js"), mainHeader, "utf8");
writeFileSync(join(root, "data", "science-questions-phase3.js"), phaseHeader, "utf8");

let changed = 0;
for (let i = 0; i < SCIENCE_QUESTIONS.length; i++) {
  if (
    JSON.stringify(SCIENCE_QUESTIONS[i].options) !==
    JSON.stringify(balanced[i].options)
  )
    changed++;
}
console.log("Options changed:", changed, "/", SCIENCE_QUESTIONS.length);
