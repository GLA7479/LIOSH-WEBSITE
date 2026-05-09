/**
 * Builds question inventory for curriculum audit (advisory).
 * Scans the same sources as `audit:questions` — banks wired into learning masters.
 *
 * Hebrew archive files under `data/hebrew-questions/*` are intentionally excluded:
 * they are not imported by `generateQuestion` at runtime (see utils/hebrew-question-generator.js).
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildRowsForCurriculumInventory } from "../audit-question-banks.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

function normalizeSubject(raw) {
  if (raw === "geography") return "moledet-geography";
  return raw || "unknown";
}

function normalizeDifficulty(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "";
  const parts = s.split("|").map((x) => x.trim()).filter(Boolean);
  const levels = new Set(["easy", "medium", "hard"]);
  const hits = parts.filter((p) => levels.has(p));
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) return s;
  if (levels.has(s)) return s;
  return s || "";
}

function mapAnswerType(answerMode) {
  const a = String(answerMode || "").trim();
  if (!a) return "unknown";
  return a;
}

function mapQuestionType(row) {
  const rk = String(row.rowKind || "");
  if (rk.endsWith("_sample")) return "generator_sample";
  if (rk.includes("pool")) return "static_pool_item";
  if (rk.includes("bank") || rk === "hebrew_legacy" || rk === "hebrew_rich") return "static_bank_item";
  return rk || "unknown";
}

function inferHasExplanation(row) {
  const rk = String(row.rowKind || "");
  if (rk.endsWith("_sample")) return false;
  if (rk === "science_bank_item") return true;
  if (rk === "english_pool_item") return true;
  if (rk === "geometry_conceptual") return true;
  if (rk === "geography_bank_item") return false;
  if (rk === "hebrew_legacy" || rk === "hebrew_rich") return false;
  return false;
}

function explainUnknown(row) {
  const rk = String(row.rowKind || "");
  if (rk === "hebrew_legacy" || rk === "hebrew_rich") return true;
  if (rk === "geography_bank_item") return true;
  return false;
}

function computeMetadataFlags(row) {
  const gmin = Number(row.minGrade);
  const gmax = Number(row.maxGrade);
  const hasGrade =
    Number.isFinite(gmin) &&
    Number.isFinite(gmax) &&
    gmin >= 1 &&
    gmin <= 6 &&
    gmax >= 1 &&
    gmax <= 6;
  const topic = String(row.topic || "").trim();
  const hasTopic = topic.length > 0;
  const sub = String(row.subtopic || row.subtype || "").trim();
  const hasSubtopic = sub.length > 0 && sub !== "general";
  const diff = normalizeDifficulty(row.difficulty);
  const hasDifficulty = diff.length > 0;
  const expl = inferHasExplanation(row);
  const explUnknown = explainUnknown(row);
  return {
    hasGrade,
    hasTopic,
    hasSubtopic,
    hasDifficulty,
    hasExplanation: expl,
    explanationNeedsHumanReview: explUnknown,
    missingCritical:
      !hasGrade ||
      !hasTopic ||
      !hasDifficulty ||
      (String(row.patternFamily || "").trim() === "" &&
        String(row.subtype || "").trim() === "" &&
        rkNeedsPattern(row)),
  };
}

function rkNeedsPattern(row) {
  const rk = String(row.rowKind || "");
  return rk === "english_pool_item" || rk === "hebrew_legacy";
}

function stableQuestionId(row, index) {
  const payload = [
    normalizeSubject(row.subject),
    row.rowKind || "",
    row.poolKey || "",
    row.stemHash || "",
    String(row.minGrade ?? ""),
    String(row.maxGrade ?? ""),
    String(index),
  ].join("|");
  return createHash("sha256").update(payload, "utf8").digest("hex").slice(0, 40);
}

function rowToInventoryRecord(row, index) {
  const gmin = Number(row.minGrade);
  const gmax = Number(row.maxGrade);
  const meta = computeMetadataFlags(row);
  return {
    subject: normalizeSubject(row.subject),
    grade: Number.isFinite(gmin) ? gmin : null,
    gradeMin: Number.isFinite(gmin) ? gmin : null,
    gradeMax: Number.isFinite(gmax) ? gmax : null,
    topic: String(row.topic || "").trim(),
    subtopic: String(row.subtopic || row.subtype || "").trim() || null,
    difficulty: normalizeDifficulty(row.difficulty) || null,
    questionType: mapQuestionType(row),
    sourceFile: String(row.sourceFile || ""),
    questionId: stableQuestionId(row, index),
    textPreview: String(row.stemText || "").slice(0, 280),
    answerType: mapAnswerType(row.answerMode),
    hasExplanation: inferHasExplanation(row),
    metadataCompleteness: meta,
    /** Stable hash from quantitative audit (`stemHash`) — duplicate detection only */
    stemHash: row.stemHash ?? null,
    auditRowKind: row.rowKind ?? null,
    auditPoolKey: row.poolKey ?? null,
    bankProvenance: row.bankProvenance ?? null,
  };
}

function inventoryMarkdown(payload) {
  const { generatedAt, recordCount, notes, recordsBySubject } = payload;
  const lines = [
    `# Question inventory (curriculum audit)`,
    ``,
    `- Generated: ${generatedAt}`,
    `- Total records: ${recordCount}`,
    ``,
    `## Notes`,
    ...notes.map((n) => `- ${n}`),
    ``,
    `## Count by subject`,
    ``,
    `| Subject | Count |`,
    `|---------|------:|`,
  ];
  for (const [k, v] of Object.entries(recordsBySubject).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push(``, `## Record shape`, ``, `See \`question-inventory.json\` for full detail.`);
  return lines.join("\n");
}

/**
 * @param {{ writeFiles?: boolean }} [opts]
 */
export async function generateQuestionInventory(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const rawRows = buildRowsForCurriculumInventory();
  const records = rawRows.map((row, index) => rowToInventoryRecord(row, index));

  const recordsBySubject = {};
  for (const r of records) {
    recordsBySubject[r.subject] = (recordsBySubject[r.subject] || 0) + 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    recordCount: records.length,
    inventoryVersion: 1,
    notes: [
      "Sources match `scripts/audit-question-banks.mjs` (static banks + deterministic generator samples).",
      "Hebrew parallel archive under data/hebrew-questions/*.js is not loaded by the live Hebrew generator — excluded from inventory.",
      "Math and geometry include generator_sample rows for coverage visibility; they are not serialized static question banks.",
    ],
    recordsBySubject,
    records,
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(
      join(OUT_DIR, "question-inventory.json"),
      JSON.stringify(payload, null, 2),
      "utf8"
    );
    await writeFile(
      join(OUT_DIR, "question-inventory.md"),
      inventoryMarkdown(payload),
      "utf8"
    );
    console.log(`Wrote ${records.length} inventory records to ${OUT_DIR}`);
  }

  return payload;
}

async function main() {
  await generateQuestionInventory({ writeFiles: true });
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
