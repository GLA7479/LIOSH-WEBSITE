/**
 * מיפוי סטטי של מחרוזות kind / נושאים בגנרטורי מתמטיקה וגיאומטריה.
 * פלט: reports/question-audit/declared-branches.json
 *
 * npm run audit:branches
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-audit");

function extractKindLiterals(src) {
  const kinds = new Set();
  const re = /\bkind\s*:\s*["']([a-zA-Z0-9_]+)["']/g;
  let m;
  while ((m = re.exec(src))) kinds.add(m[1]);
  return [...kinds].sort();
}

function extractSelectedOpBranches(src) {
  const ops = new Set();
  const re = /selectedOp\s*===\s*["']([a-zA-Z0-9_]+)["']/g;
  let m;
  while ((m = re.exec(src))) ops.add(m[1]);
  return [...ops].sort();
}

function extractSwitchCasesAfter(src, anchor) {
  const i = src.indexOf(anchor);
  if (i < 0) return [];
  const slice = src.slice(i, Math.min(src.length, i + 200000));
  const cases = new Set();
  const re = /case\s+["']([a-zA-Z0-9_]+)["']\s*:/g;
  let m;
  while ((m = re.exec(slice))) cases.add(m[1]);
  return [...cases].sort();
}

const mathSrc = readFileSync(
  join(ROOT, "utils", "math-question-generator.js"),
  "utf8"
);
const geoSrc = readFileSync(
  join(ROOT, "utils", "geometry-question-generator.js"),
  "utf8"
);

const payload = {
  generatedAt: new Date().toISOString(),
  math: {
    sourceFile: "utils/math-question-generator.js",
    kindLiterals: extractKindLiterals(mathSrc),
    selectedOpBranches: extractSelectedOpBranches(mathSrc),
    note:
      "סריקת טקסט (לא AST). ענפים דינמיים בלי מחרוזת kind קבועה לא יופיעו.",
  },
  geometry: {
    sourceFile: "utils/geometry-question-generator.js",
    kindLiterals: extractKindLiterals(geoSrc),
    switchSelectedTopicCases: extractSwitchCasesAfter(
      geoSrc,
      "switch (selectedTopic)"
    ),
  },
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  join(OUT_DIR, "declared-branches.json"),
  JSON.stringify(payload, null, 2),
  "utf8"
);
console.log("Wrote reports/question-audit/declared-branches.json");
