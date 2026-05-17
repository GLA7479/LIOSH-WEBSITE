#!/usr/bin/env node
/**
 * Scan generated + bank question stems for UI metadata leaks.
 * npm run qa:student-question-stem-metadata
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const {
  collectStudentFacingStemsFromQuestion,
  detectStudentStemMetadataLeaks,
  sanitizeQuestionForStudentDisplay,
} = await import("../utils/student-question-stem-sanitizer.js");
const { generateForMatrixCell, SUPPORTED_SUBJECTS } = await import(
  "./learning-simulator/lib/question-generator-adapters.mjs"
);
const { normalizeQuestionPayload } = await import(
  "./learning-simulator/lib/question-integrity-checks.mjs"
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "question-audit");
const OUT_JSON = join(OUT_DIR, "student-stem-metadata-leaks.json");

const SAMPLES_PER_CELL = Math.max(
  1,
  Math.min(12, Number(process.env.STEM_METADATA_SAMPLES || 4))
);

const GRADES = ["g1", "g2", "g3", "g4", "g5", "g6"];
const LEVELS = ["easy", "medium", "hard"];

/** @type {{ subject: string, grade: string, level: string, topic: string, sample: number, field: string, stem: string, checks: object[] }[]} */
const leaks = [];

function recordLeak(ctx, field, stem, checks) {
  leaks.push({
    ...ctx,
    field,
    stem: String(stem).slice(0, 280),
    checks,
  });
}

function scanQuestion(q, ctx) {
  const sanitized = sanitizeQuestionForStudentDisplay(q);
  for (const field of ["stem", "question", "exerciseText", "questionLabel"]) {
    const stem = sanitized?.[field];
    if (typeof stem !== "string" || !stem.trim()) continue;
    const { leak, checks } = detectStudentStemMetadataLeaks(stem);
    if (leak) recordLeak(ctx, field, stem, checks);
  }
}

async function scanGeneratedSubjects() {
  const topicsBySubject = {
    math: [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "fractions",
      "equations",
      "geometry",
      "word_problems",
    ],
    geometry: ["area", "perimeter", "angles", "shapes_basic", "triangles"],
    hebrew: ["reading", "grammar", "vocabulary", "comprehension"],
    moledet_geography: ["israel_map", "settlements", "climate"],
  };

  for (const subject of SUPPORTED_SUBJECTS) {
    const topics = topicsBySubject[subject] || ["default"];
    for (const grade of GRADES) {
      for (const level of LEVELS) {
        for (const topic of topics) {
          for (let i = 0; i < SAMPLES_PER_CELL; i += 1) {
            const gen = await generateForMatrixCell(
              { grade, subjectCanonical: subject, level, topic },
              i
            );
            if (gen.unsupported || !gen.question) continue;
            const norm = normalizeQuestionPayload(gen.question);
            const raw = gen.question;
            scanQuestion(raw, {
              subject,
              grade,
              level,
              topic,
              sample: i,
              source: "generator_raw",
            });
            scanQuestion(norm, {
              subject,
              grade,
              level,
              topic,
              sample: i,
              source: "normalized",
            });
            const stems = collectStudentFacingStemsFromQuestion(
              sanitizeQuestionForStudentDisplay(raw)
            );
            if (stems.length === 0) {
              recordLeak(
                { subject, grade, level, topic, sample: i, source: "empty_stem" },
                "—",
                "",
                [{ id: "missing_stem", label: "no stem after sanitize" }]
              );
            }
          }
        }
      }
    }
  }
}

async function scanScienceBank() {
  const { SCIENCE_QUESTIONS } = await import(
    new URL("../data/science-questions.js", import.meta.url).href
  );
  for (const row of SCIENCE_QUESTIONS) {
    const q = sanitizeQuestionForStudentDisplay({
      stem: row.stem,
      question: row.stem,
    });
    scanQuestion(q, {
      subject: "science",
      grade: (row.grades && row.grades[0]) || "?",
      level: row.minLevel || "?",
      topic: row.topic || "?",
      sample: 0,
      source: `bank:${row.id}`,
    });
  }
}

async function scanEnglishPools() {
  const pools = await import(
    new URL("../data/english-questions/index.js", import.meta.url).href
  ).catch(() => null);
  if (!pools) return;
  for (const [exportName, val] of Object.entries(pools)) {
    if (!Array.isArray(val)) continue;
    for (let i = 0; i < val.length; i += 1) {
      const row = val[i];
      if (!row?.question) continue;
      scanQuestion(
        sanitizeQuestionForStudentDisplay({
          question: row.question,
          exerciseText: row.question,
        }),
        {
          subject: "english",
          grade: "?",
          level: "?",
          topic: exportName,
          sample: i,
          source: "english_pool",
        }
      );
    }
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  leaks.length = 0;

  await scanGeneratedSubjects();
  await scanScienceBank();
  await scanEnglishPools();

  const payload = {
    generatedAt: new Date().toISOString(),
    samplesPerCell: SAMPLES_PER_CELL,
    leakCount: leaks.length,
    leaks: leaks.slice(0, 500),
  };
  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  if (leaks.length > 0) {
    console.error(`FAIL: ${leaks.length} student stem metadata leak(s)`);
    console.error(`Report: ${OUT_JSON}`);
    for (const L of leaks.slice(0, 8)) {
      console.error(
        `  [${L.subject} ${L.grade} ${L.topic} ${L.level}] ${L.field}: ${L.stem.slice(0, 100)}…`
      );
    }
    process.exit(1);
  }
  console.log("PASS: no student stem metadata leaks detected");
  console.log(`Report: ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
