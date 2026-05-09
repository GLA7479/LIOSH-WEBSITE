/**
 * Phase 3 duplicate advisory review — separates generator samples vs static banks.
 */

import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const INV_PATH = join(OUT_DIR, "question-inventory.json");

function stemNormalizeHint(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\d+/g, "#");
}

export async function generateDuplicatesCurriculumReview(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  if (!existsSync(INV_PATH)) throw new Error(`Missing ${INV_PATH}`);
  const inventory = JSON.parse(readFileSync(INV_PATH, "utf8"));
  const records = inventory.records || [];

  const byHash = new Map();
  for (const r of records) {
    const h = r.stemHash;
    if (!h) continue;
    const k = `${r.subject}|${h}`;
    if (!byHash.has(k)) byHash.set(k, []);
    byHash.get(k).push(r);
  }

  /** @type {object[]} */
  const categories = {
    static_bank_duplicates: [],
    generator_sample_duplicates: [],
    mixed_generator_and_static: [],
    same_stem_across_grades: [],
    likely_intentional_variants: [],
    likely_problem_duplicates: [],
  };

  for (const [, list] of byHash) {
    if (list.length < 2) continue;
    const types = list.map((x) => x.questionType);
    const allGen = types.every((t) => t === "generator_sample");
    const allStatic = types.every((t) => t !== "generator_sample");
    const grades = new Set();
    for (const r of list) {
      for (let g = Number(r.gradeMin); g <= Number(r.gradeMax); g++) grades.add(g);
    }
    const gmin = Math.min(...grades);
    const gmax = Math.max(...grades);
    const crossGrade = gmax - gmin >= 2;

    const entry = {
      stemHash: list[0].stemHash,
      subject: list[0].subject,
      rowCount: list.length,
      gradeSpan: [gmin, gmax],
      preview: (list[0].textPreview || "").slice(0, 100),
      questionTypes: [...new Set(types)],
    };

    if (allGen) categories.generator_sample_duplicates.push(entry);
    else if (allStatic) categories.static_bank_duplicates.push(entry);
    else categories.mixed_generator_and_static.push(entry);

    if (crossGrade) categories.same_stem_across_grades.push(entry);

    if (allGen && list.length <= 24 && !crossGrade) {
      categories.likely_intentional_variants.push({
        ...entry,
        note: "Deterministic audit sampling often repeats templates — likely benign.",
      });
    }

    if (allStatic && crossGrade && list.length >= 2) {
      categories.likely_problem_duplicates.push({
        ...entry,
        note: "Same stem hash across distant grades in static banks — verify intentional spiral vs copy.",
      });
    }
  }

  const nearDup = [];
  const normGroups = new Map();
  for (const r of records) {
    if (r.questionType === "generator_sample") continue;
    const n = stemNormalizeHint(r.textPreview);
    if (n.length < 12) continue;
    const k = `${r.subject}|${n}`;
    if (!normGroups.has(k)) normGroups.set(k, []);
    normGroups.get(k).push(r);
  }
  for (const [, list] of normGroups) {
    if (list.length < 2) continue;
    const hashes = new Set(list.map((x) => x.stemHash));
    if (hashes.size < 2) continue;
    nearDup.push({
      subject: list[0].subject,
      normalizedSnippet: (list[0].textPreview || "").slice(0, 80),
      distinctHashes: hashes.size,
      rowCount: list.length,
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      exactHashCollisionGroups: [...byHash.values()].filter((l) => l.length >= 2).length,
      nearDuplicateNormalizedGroups: nearDup.length,
    },
    categories,
    nearDuplicateSamples: nearDup.slice(0, 120),
    notes: [
      "Generator duplicates often reflect deterministic sampling — do not delete automatically.",
      "Static cross-grade duplicates deserve pedagogy/content review.",
    ],
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(join(OUT_DIR, "duplicates-review.json"), JSON.stringify(report, null, 2), "utf8");
    await writeFile(join(OUT_DIR, "duplicates-review.md"), mdDup(report), "utf8");
    console.log(`Wrote duplicates review to ${OUT_DIR}/duplicates-review.{json,md}`);
  }

  return report;
}

function mdDup(r) {
  const lines = [
    `# Duplicates review (advisory)`,
    ``,
    `- Generated: ${r.generatedAt}`,
    `- Exact stem-hash collision groups: ${r.summary.exactHashCollisionGroups}`,
    `- Near-duplicate normalized groups: ${r.summary.nearDuplicateNormalizedGroups}`,
    ``,
    `## (a) Static bank duplicates (exact hash)`,
    ``,
    ...r.categories.static_bank_duplicates.slice(0, 25).map(
      (x) =>
        `- ${x.subject} rows=${x.rowCount} grades=${JSON.stringify(x.gradeSpan)} hash=${String(x.stemHash).slice(0, 16)}…`
    ),
    ``,
    `## (b) Generator sample duplicates`,
    ``,
    ...r.categories.generator_sample_duplicates.slice(0, 25).map(
      (x) =>
        `- ${x.subject} rows=${x.rowCount} grades=${JSON.stringify(x.gradeSpan)}`
    ),
    ``,
    `## (c) Same stem across grades (wide span)`,
    ``,
    ...r.categories.same_stem_across_grades.slice(0, 25).map(
      (x) =>
        `- ${x.subject} grades=${JSON.stringify(x.gradeSpan)} rows=${x.rowCount}`
    ),
    ``,
    `## (d) Likely intentional variants`,
    ``,
    ...r.categories.likely_intentional_variants.slice(0, 15).map((x) => `- ${x.note}`),
    ``,
    `## (e) Likely problem duplicates (static + cross-grade)`,
    ``,
    ...r.categories.likely_problem_duplicates.slice(0, 40).map(
      (x) =>
        `- ${x.subject} ${x.note} grades=${JSON.stringify(x.gradeSpan)}`
    ),
    ``,
    `## Mixed generator + static (same hash)`,
    ``,
    ...r.categories.mixed_generator_and_static.slice(0, 20).map(
      (x) => `- ${x.subject} rows=${x.rowCount}`
    ),
    ``,
    ...r.notes.map((n) => `_(${n})_`),
  ];
  return lines.join("\n");
}

function isMain() {
  try {
    return resolve(process.argv[1] || "") === resolve(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMain()) {
  generateDuplicatesCurriculumReview({ writeFiles: true }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
