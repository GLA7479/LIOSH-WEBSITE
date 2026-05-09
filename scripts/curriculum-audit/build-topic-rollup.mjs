/**
 * Builds topic rollup from inventory (+ optional latest audit) for curriculum Phase 2.
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
  return import(
    pathToFileURL(join(ROOT, "utils/curriculum-audit/curriculum-topic-normalizer.js")).href
  );
}

/** Heuristic: raw operation/topic vs minimum typical grade (advisory). */
const SUSPICIOUS_GRADE_RULES = [
  { subject: "math", rawIncludes: ["fractions"], maxGradeSuspicious: 1, code: "math_fractions_in_g1" },
  {
    subject: "math",
    rawExact: ["percentages", "ratio"],
    maxGradeSuspicious: 4,
    code: "math_percent_ratio_early",
  },
  {
    subject: "math",
    rawIncludes: ["percent"],
    maxGradeSuspicious: 3,
    code: "math_percent_wording_early",
  },
  { subject: "math", rawIncludes: ["decimals"], maxGradeSuspicious: 2, code: "math_decimals_very_early" },
  { subject: "geometry", rawIncludes: ["pythagoras"], maxGradeSuspicious: 5, code: "geometry_pythagoras_early" },
  { subject: "geometry", rawIncludes: ["volume"], maxGradeSuspicious: 3, code: "geometry_volume_early" },
  { subject: "geometry", rawIncludes: ["diagonal"], maxGradeSuspicious: 3, code: "geometry_diagonals_early" },
  { subject: "geometry", rawIncludes: ["diagonals"], maxGradeSuspicious: 3, code: "geometry_diagonals_early" },
  {
    subject: "english",
    rawExact: ["grammar"],
    maxGradeSuspicious: 2,
    code: "english_grammar_formal_early",
  },
  {
    subject: "english",
    rawExact: ["sentence"],
    maxGradeSuspicious: 2,
    code: "english_sentence_patterns_early",
  },
  {
    subject: "hebrew",
    rawExact: ["grammar"],
    maxGradeSuspicious: 2,
    code: "hebrew_grammar_language_knowledge_early",
  },
];

function appliesSuspicion(rec, rule) {
  if (rec.subject !== rule.subject) return false;
  const t = `${rec.topic || ""}`.toLowerCase().trim();
  if (rule.rawExact?.length) {
    return rule.rawExact.some((x) => t === String(x).toLowerCase());
  }
  if (rule.rawIncludes?.length) {
    return rule.rawIncludes.some((x) => t.includes(x));
  }
  return false;
}

function finalizeTree(tree) {
  const out = {};
  for (const [sub, grades] of Object.entries(tree)) {
    out[sub] = {};
    for (const [g, topics] of Object.entries(grades)) {
      out[sub][g] = {};
      for (const [nk, b] of Object.entries(topics)) {
        out[sub][g][nk] = {
          ...b,
          rawTopics: [...b.rawTopics].sort(),
        };
      }
    }
  }
  return out;
}

function buildRollup(inventory, latestMeta, normalizeInventoryTopic) {
  const allRawTopics = new Set();
  const allNormKeys = new Set();

  /** subject -> grade -> normKey -> aggregator */
  const tree = {};

  const unclearNames = [];
  const suspicious = [];
  const sharedAcrossGrades = new Map();

  for (const rec of inventory.records || []) {
    const norm = normalizeInventoryTopic({
      subject: rec.subject,
      topic: rec.topic,
      subtopic: rec.subtopic,
    });
    allRawTopics.add(`${rec.subject}::${rec.topic || ""}`);
    allNormKeys.add(norm.normalizedTopicKey);

    if (!norm.rawTopic?.trim() || norm.normalizationConfidence === "low") {
      unclearNames.push({
        questionId: rec.questionId,
        subject: rec.subject,
        rawTopic: rec.topic,
        reason: "empty_or_low_normalizer_confidence",
      });
    }

    const gmin = Number(rec.gradeMin);
    for (const rule of SUSPICIOUS_GRADE_RULES) {
      if (appliesSuspicion(rec, rule) && gmin <= rule.maxGradeSuspicious) {
        suspicious.push({
          questionId: rec.questionId,
          subject: rec.subject,
          gradeMin: gmin,
          rawTopic: rec.topic,
          ruleCode: rule.code,
        });
      }
    }

    if (rec.subject === "english" && gmin <= 3) {
      if (
        norm.normalizedTopicKey.includes("formal_reading") ||
        (norm.normalizedTopicKey.includes("vocabulary") && String(rec.difficulty || "").toLowerCase() === "hard")
      ) {
        suspicious.push({
          questionId: rec.questionId,
          subject: rec.subject,
          gradeMin: gmin,
          rawTopic: rec.topic,
          ruleCode: "english_reading_load_early_normalized",
        });
      }
    }
    if (rec.subject === "geometry" && gmin <= 3) {
      const nk = norm.normalizedTopicKey;
      if (nk.includes("volume") || nk.includes("diagonals")) {
        suspicious.push({
          questionId: rec.questionId,
          subject: rec.subject,
          gradeMin: gmin,
          rawTopic: rec.topic,
          ruleCode: "geometry_volume_or_diagonals_early_normalized",
        });
      }
    }
    if (rec.subject === "math" && gmin <= 3 && norm.normalizedTopicKey.includes("percentages")) {
      suspicious.push({
        questionId: rec.questionId,
        subject: rec.subject,
        gradeMin: gmin,
        rawTopic: rec.topic,
        ruleCode: "math_percentages_early_normalized",
      });
    }

    const sg = rec.subject;
    if (!tree[sg]) tree[sg] = {};
    for (let g = Number(rec.gradeMin); g <= Number(rec.gradeMax); g++) {
      if (!Number.isFinite(g) || g < 1 || g > 6) continue;
      if (!tree[sg][g]) tree[sg][g] = {};
      const nk = norm.normalizedTopicKey;
      if (!tree[sg][g][nk]) {
        tree[sg][g][nk] = {
          normalizedTopicSuggestion: nk,
          normalizationConfidence: norm.normalizationConfidence,
          normalizedTopicLabelHe: norm.normalizedTopicLabelHe,
          rawTopics: new Set(),
          count: 0,
          difficultyHistogram: {},
          examples: [],
        };
      }
      const bucket = tree[sg][g][nk];
      bucket.rawTopics.add(rec.topic || "");
      bucket.count += 1;
      const d = rec.difficulty || "unknown";
      bucket.difficultyHistogram[d] = (bucket.difficultyHistogram[d] || 0) + 1;
      if (bucket.examples.length < 5) {
        bucket.examples.push((rec.textPreview || "").slice(0, 140));
      }

      const shareKey = `${sg}|${nk}`;
      if (!sharedAcrossGrades.has(shareKey)) sharedAcrossGrades.set(shareKey, new Set());
      sharedAcrossGrades.get(shareKey).add(g);
    }
  }

  const topicsSpanningGrades = [];
  for (const [k, set] of sharedAcrossGrades) {
    if (set.size >= 2) {
      topicsSpanningGrades.push({
        key: k,
        grades: [...set].sort((a, b) => a - b),
        span: set.size,
      });
    }
  }
  topicsSpanningGrades.sort((a, b) => b.span - a.span);

  return {
    generatedAt: new Date().toISOString(),
    sourceInventoryGeneratedAt: inventory.generatedAt,
    latestAuditGeneratedAt: latestMeta?.generatedAt ?? null,
    summary: {
      totalInventoryRows: inventory.records?.length ?? 0,
      distinctRawTopicLabels: allRawTopics.size,
      distinctNormalizedTopicKeys: allNormKeys.size,
      subjects: Object.keys(tree).sort(),
      grades: [1, 2, 3, 4, 5, 6],
    },
    bySubjectGradeNormalizedTopic: finalizeTree(tree),
    topicsSpanningGrades: topicsSpanningGrades.slice(0, 500),
    unclearTopicNames: unclearNames.slice(0, 800),
    suspiciousGradeTopics: suspicious,
    notes: [
      "Suspicion rules are heuristic advisory flags only.",
      "Normalization uses utils/curriculum-audit/curriculum-topic-normalizer.js.",
    ],
  };
}

export async function generateTopicRollup(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  if (!existsSync(INV_PATH)) {
    throw new Error(`Missing ${INV_PATH} — run npm run audit:curriculum:inventory first.`);
  }
  const normMod = await loadNormalizer();
  const { normalizeInventoryTopic } = normMod;

  const inventory = JSON.parse(readFileSync(INV_PATH, "utf8"));
  let latestMeta = null;
  if (existsSync(LATEST_PATH)) {
    try {
      latestMeta = JSON.parse(readFileSync(LATEST_PATH, "utf8"));
    } catch {
      latestMeta = null;
    }
  }

  const rollup = buildRollup(inventory, latestMeta, normalizeInventoryTopic);

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(
      join(OUT_DIR, "topic-rollup.json"),
      JSON.stringify(rollup, null, 2),
      "utf8"
    );
    await writeFile(join(OUT_DIR, "topic-rollup.md"), rollupMarkdown(rollup), "utf8");
    console.log(`Wrote topic rollup to ${OUT_DIR}/topic-rollup.{json,md}`);
  }
  return rollup;
}

function rollupMarkdown(r) {
  const lines = [
    `# Topic rollup (curriculum audit Phase 2)`,
    ``,
    `- Generated: ${r.generatedAt}`,
    `- Inventory rows: ${r.summary.totalInventoryRows}`,
    `- Distinct raw topic labels: ${r.summary.distinctRawTopicLabels}`,
    `- Distinct normalized keys: ${r.summary.distinctNormalizedTopicKeys}`,
    ``,
    `## Topics shared across grades (sample)`,
    ``,
    ...r.topicsSpanningGrades.slice(0, 40).map(
      (x) => `- ${x.key} → grades ${x.grades.join(", ")} (${x.span} grades)`
    ),
    ``,
    `## Suspicious grade-topic pairs (heuristic)`,
    ``,
    `Total flagged: ${r.suspiciousGradeTopics.length}`,
    ``,
    ...r.suspiciousGradeTopics.slice(0, 60).map(
      (x) =>
        `- \`${x.questionId}\` ${x.subject} g${x.gradeMin} topic=${x.rawTopic} [${x.ruleCode}]`
    ),
    ``,
    `## Unclear topic names / low normalizer confidence`,
    ``,
    `Count: ${r.unclearTopicNames.length} (truncated in JSON)`,
    ``,
    `See **topic-rollup.json** for nested counts per subject → grade → normalized topic.`,
  ];
  return lines.join("\n");
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
  generateTopicRollup({ writeFiles: true }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
