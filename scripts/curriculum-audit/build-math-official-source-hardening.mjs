/**
 * Math-only official source hardening report (registry + strand matrix). Reports only.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { OFFICIAL_CURRICULUM_SOURCE_REGISTRY } from "../../utils/curriculum-audit/official-curriculum-source-registry.js";
import {
  MATH_STRAND_ANCHOR_ROWS,
  mathGradePdfUrl,
  SOURCE_REGISTRY_CHECKED_AT,
} from "../../utils/curriculum-audit/math-official-source-map.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

function sourceTypeLabel(sourceType) {
  const m = {
    official_moe: "MoE curriculum (POP)",
    official_pdf: "MoE PDF (מיידע)",
    rama: "RAMA support",
    internal_gap: "internal gap",
  };
  return m[sourceType] || sourceType;
}

function buildMatrix() {
  const grades = [1, 2, 3, 4, 5, 6];
  /** @type {object[]} */
  const rows = [];
  for (const g of grades) {
    for (const strand of MATH_STRAND_ANCHOR_ROWS) {
      rows.push({
        grade: g,
        strandId: strand.strandId,
        strandLabelHe: strand.labelHe,
        auditTopicKeys: strand.auditTopicKeys,
        officialPdfUrl: mathGradePdfUrl(g),
        popCurriculumUrl: strand.popUrl,
        sourceQualityLevel: "exact_grade_topic_source",
        confidence: "high",
        sourceTypePrimary: "official_pdf",
        notes:
          "עיגון כיתתי ראשי: מסמך התוכנית הרשמי לכיתה במאגר מיידע; מיתרי POP משלימים לפי נושא.",
      });
    }
  }
  return rows;
}

function registryMathRows() {
  return OFFICIAL_CURRICULUM_SOURCE_REGISTRY.filter((r) => r.subject === "math");
}

function missingAnchorsSummary(mathRows) {
  const gaps = mathRows.filter((r) => r.sourceQualityLevel === "internal_gap");
  const missing = [];
  for (const r of gaps) {
    missing.push({
      title: r.title,
      appliesToGrades: r.appliesToGrades,
      appliesToTopics: r.appliesToTopics,
      notes: r.notes,
      actionNeeded: r.actionNeeded,
    });
  }
  return missing;
}

function markdown(payload) {
  const lines = [
    `# Math official source hardening`,
    ``,
    `- Generated: ${payload.generatedAt}`,
    `- Registry checked-at stamp: ${SOURCE_REGISTRY_CHECKED_AT}`,
    ``,
    `## Summary`,
    ``,
    `- Math registry rows: **${payload.registryMathRowCount}**`,
    `- Per-grade official PDF pattern: \`${payload.mathGradePdfPattern}\``,
    `- Strand definitions: **${payload.strandCount}**`,
    `- RAMA: supporting only — see registry rows with source type RAMA.`,
    ``,
    `## Registry entries (math only)`,
    ``,
    `| Title | Type | Quality | Confidence | Grades | URL |`,
    `|-------|------|---------|------------|--------|-----|`,
  ];

  for (const r of payload.registryMathRows) {
    const gl =
      r.appliesToGrades === "all"
        ? "all"
        : Array.isArray(r.appliesToGrades)
          ? r.appliesToGrades.join(",")
          : String(r.appliesToGrades);
    const url = r.url ? `[PDF/POP](${r.url})` : "—";
    lines.push(
      `| ${r.title.slice(0, 72)}${r.title.length > 72 ? "…" : ""} | ${sourceTypeLabel(r.sourceType)} | ${r.sourceQualityLevel} | ${r.confidenceAfterAudit} | ${gl} | ${url} |`
    );
  }

  lines.push(
    ``,
    `## Grade × strand matrix (primary anchor = per-grade PDF)`,
    ``,
    `Each cell uses the **official grade PDF** plus the listed POP strand page as contextual reference.`,
    ``,
    `| Grade | Strand | Official PDF | POP supplement |`,
    `|------:|--------|--------------|----------------|`
  );

  for (const g of [1, 2, 3, 4, 5, 6]) {
    for (const strand of MATH_STRAND_ANCHOR_ROWS) {
      lines.push(
        `| ${g} | ${strand.strandId} | [kita${g}.pdf](${mathGradePdfUrl(g)}) | [link](${strand.popUrl}) |`
      );
    }
  }

  lines.push(
    ``,
    `## Internal gaps / missing automation`,
    ``,
    ...payload.missingAnchors.flatMap((m) => [
      `- **${m.title}**`,
      `  - Notes: ${m.notes}`,
      ``,
    ]),
    `## Confidence rules used`,
    ``,
    `- **high:** official per-grade PDF from מיידע (מזכירות פדגוגית) with programme detail for that grade.`,
    `- **medium:** POP curriculum pages or overview PDF without replacing per-grade programme document.`,
    `- **low:** internal_gap rows or RAMA-only / assessment framing without programme detail.`,
    ``,
    `---`,
    `Planning artefact only — does not authorize question-bank edits.`,
    ``
  );

  return lines.join("\n");
}

export async function buildMathOfficialSourceHardening(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const mathRows = registryMathRows();
  const matrix = buildMatrix();
  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "math-official-source-hardening",
    registryMathRowCount: mathRows.length,
    mathGradePdfPattern: `${mathGradePdfUrl(1).replace(/kita1/, "kita{n}")}`,
    strandCount: MATH_STRAND_ANCHOR_ROWS.length,
    registryMathRows: mathRows,
    strandDefinitions: MATH_STRAND_ANCHOR_ROWS,
    gradeStrandMatrix: matrix,
    missingAnchors: missingAnchorsSummary(mathRows),
    narrative: {
      perGradePdfAnchorsGrades1Through6:
        "Official meyda PDFs kita1.pdf … kita6.pdf under mazkirut_pedagogit/matematika/tochnyotlemud (HTTP verified).",
      popStrands:
        "POP pages for programme framework, data strand, and geometry strand complement PDFs.",
      ramaRole:
        "RAMA field/math lists assessment tools described as aligned to the curriculum — use as supporting evidence only.",
    },
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-official-source-hardening.json");
    const mdPath = join(OUT_DIR, "math-official-source-hardening.md");
    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(mdPath, markdown(payload), "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }
  return payload;
}

async function main() {
  await buildMathOfficialSourceHardening({ writeFiles: true });
}

function isExecutedAsMainScript() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    const self = fileURLToPath(import.meta.url);
    return resolve(entry) === resolve(self);
  } catch {
    return false;
  }
}

if (isExecutedAsMainScript()) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
