/**
 * Phase 3 focused advisory reports (English early grades, geometry sequencing, coverage gaps).
 */

import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const INV_PATH = join(OUT_DIR, "question-inventory.json");
const LATEST_PATH = join(OUT_DIR, "latest.json");

async function loadNormalizer() {
  return import(pathToFileURL(join(ROOT, "utils/curriculum-audit/curriculum-topic-normalizer.js")).href);
}

export async function generateFocusedCurriculumReports(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  if (!existsSync(INV_PATH)) {
    throw new Error(`Missing ${INV_PATH}`);
  }
  const inventory = JSON.parse(readFileSync(INV_PATH, "utf8"));
  const latest = existsSync(LATEST_PATH)
    ? JSON.parse(readFileSync(LATEST_PATH, "utf8"))
    : null;
  const { normalizeInventoryTopic } = await loadNormalizer();
  const records = inventory.records || [];

  const englishEarly = records.filter(
    (r) => r.subject === "english" && Number(r.gradeMin) <= 3
  );
  const byTopicEnglish = {};
  for (const r of englishEarly) {
    const k = `${r.topic || "?"} / ${r.subtopic || ""}`;
    byTopicEnglish[k] = (byTopicEnglish[k] || 0) + 1;
  }

  const englishReport = {
    generatedAt: new Date().toISOString(),
    scope: "English grades 1–3 — grammar, vocabulary, sentence patterns, exposure vs formal literacy",
    rowCount: englishEarly.length,
    byPoolTopicCounts: Object.entries(byTopicEnglish).sort((a, b) => b[1] - a[1]),
    sampleRows: englishEarly.slice(0, 120).map((r) => ({
      questionId: r.questionId,
      gradeMin: r.gradeMin,
      topic: r.topic,
      subtopic: r.subtopic,
      difficulty: r.difficulty,
      questionType: r.questionType,
      preview: (r.textPreview || "").slice(0, 120),
    })),
    advisoryNotes: [
      "Grades 1–2 grammar/sentence pools should be treated as exposure unless pedagogy signs formal mastery expectations.",
      "Compare with english-early depth flags in latest.json.",
    ],
    latestAuditHint: latest?.generatedAt ?? null,
  };

  const geometryRows = records.filter((r) => r.subject === "geometry");
  const byGradeGeom = {};
  for (const r of geometryRows) {
    const norm = normalizeInventoryTopic({
      subject: r.subject,
      topic: r.topic,
      subtopic: r.subtopic,
    });
    const g = Number(r.gradeMin);
    if (!byGradeGeom[g]) byGradeGeom[g] = {};
    const nk = norm.normalizedTopicKey;
    byGradeGeom[g][nk] = (byGradeGeom[g][nk] || 0) + 1;
  }

  const geometryReport = {
    generatedAt: new Date().toISOString(),
    scope: "Geometry — sequencing snapshot by grade vs normalized topic keys",
    rowsByGrade: Object.fromEntries(
      Object.entries(
        geometryRows.reduce((acc, r) => {
          const g = Number(r.gradeMin);
          acc[g] = (acc[g] || 0) + 1;
          return acc;
        }, {})
      ).sort(([a], [b]) => Number(a) - Number(b))
    ),
    normalizedTopicCountsByGrade: byGradeGeom,
    advisoryNotes: [
      "Cross-check against geometry-constants topics per grade in code — this report is inventory-weighted.",
    ],
  };

  const matrix = {};
  const subjects = ["math", "geometry", "hebrew", "english", "science", "moledet-geography"];
  for (const s of subjects) matrix[s] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const r of records) {
    const s = r.subject;
    if (!matrix[s]) continue;
    const g = Number(r.gradeMin);
    if (g >= 1 && g <= 6) matrix[s][g] += 1;
  }

  const LOW_ROW_THRESHOLDS = { science: 50, hebrew: 100, english: 40, math: 200, geometry: 150 };
  const gaps = [];
  for (const s of subjects) {
    for (let g = 1; g <= 6; g++) {
      const n = matrix[s][g];
      const t = LOW_ROW_THRESHOLDS[s] ?? 80;
      if (n < t) {
        gaps.push({
          subject: s,
          grade: g,
          rowCount: n,
          thresholdHint: t,
          severity: n === 0 ? "empty" : n < t * 0.3 ? "critical_low" : "low",
        });
      }
    }
  }

  const coverageReport = {
    generatedAt: new Date().toISOString(),
    matrixSubjectByGrade: matrix,
    flaggedLowCoverageCells: gaps.sort((a, b) => a.rowCount - b.rowCount),
    thresholdsNote:
      "Thresholds are coarse advisory hints only — tune per subject pedagogy review.",
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(
      join(OUT_DIR, "english-early-grades-review.json"),
      JSON.stringify(englishReport, null, 2),
      "utf8"
    );
    await writeFile(
      join(OUT_DIR, "geometry-sequencing-review.json"),
      JSON.stringify(geometryReport, null, 2),
      "utf8"
    );
    await writeFile(
      join(OUT_DIR, "coverage-gaps-by-grade.json"),
      JSON.stringify(coverageReport, null, 2),
      "utf8"
    );

    await writeFile(
      join(OUT_DIR, "english-early-grades-review.md"),
      mdEnglish(englishReport),
      "utf8"
    );
    await writeFile(
      join(OUT_DIR, "geometry-sequencing-review.md"),
      mdGeometry(geometryReport),
      "utf8"
    );
    await writeFile(join(OUT_DIR, "coverage-gaps-by-grade.md"), mdCoverage(coverageReport), "utf8");

    console.log(`Wrote focused Phase 3 reports to ${OUT_DIR}`);
  }

  return { englishReport, geometryReport, coverageReport };
}

function mdEnglish(r) {
  return [
    `# English early grades (1–3) review`,
    ``,
    `- Rows: ${r.rowCount}`,
    `- Generated: ${r.generatedAt}`,
    ``,
    `## Topic / pool counts`,
    ``,
    ...r.byPoolTopicCounts.slice(0, 40).map(([k, v]) => `- ${k}: ${v}`),
    ``,
    `## Advisory`,
    ``,
    ...r.advisoryNotes.map((x) => `- ${x}`),
    ``,
  ].join("\n");
}

function mdGeometry(r) {
  const lines = [
    `# Geometry sequencing review`,
    ``,
    `- Generated: ${r.generatedAt}`,
    ``,
    `## Row counts by grade`,
    ``,
    ...Object.entries(r.rowsByGrade).map(([g, n]) => `- Grade ${g}: ${n}`),
    ``,
    `## Normalized topic density by grade (see JSON for full matrix)`,
    ``,
    ...r.advisoryNotes.map((x) => `- ${x}`),
  ];
  return lines.join("\n");
}

function mdCoverage(r) {
  return [
    `# Coverage gaps by subject × grade`,
    ``,
    `- Generated: ${r.generatedAt}`,
    ``,
    `## Flagged low cells`,
    ``,
    ...r.flaggedLowCoverageCells.slice(0, 80).map(
      (x) =>
        `- **${x.subject}** g${x.grade}: ${x.rowCount} rows (${x.severity}, hint≥${x.thresholdHint})`
    ),
    ``,
    `_${r.thresholdsNote}_`,
    ``,
  ].join("\n");
}

function isMain() {
  try {
    return resolve(process.argv[1] || "") === resolve(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMain()) {
  generateFocusedCurriculumReports({ writeFiles: true }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
