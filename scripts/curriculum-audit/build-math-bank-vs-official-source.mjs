/**
 * Math inventory vs hardened official sources + sequencing heuristics (advisory).
 */
import { readFileSync, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeInventoryTopic } from "../../utils/curriculum-audit/curriculum-topic-normalizer.js";
import { mathGradePdfUrl } from "../../utils/curriculum-audit/math-official-source-map.js";
import { mathSequencingSuspicions } from "../../utils/curriculum-audit/math-sequencing-heuristics.js";

/** Until subsection IDs exist in registry / stem mapping — always false. */
const HAS_EXACT_SUBSECTION_MAPPING = false;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const INV_PATH = join(OUT_DIR, "question-inventory.json");
const BANK_VS_PATH = join(OUT_DIR, "bank-vs-official-spine.json");

function loadJson(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${label}: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

function classifyMathRow(bvsRow, invRecord, normKey, normalizationConfidence) {
  const primary = bvsRow.primaryClassification || "";
  const gmin = Number(invRecord.gradeMin);

  let anchorTier = "broad_or_internal_only";
  if (bvsRow.officialGradeTopicAnchored) anchorTier = "grade_pdf_anchored";
  else if (bvsRow.officialSubjectOnlyAnchored) anchorTier = "subject_curriculum_only";
  else if (primary === "officially_anchored_low_confidence")
    anchorTier = "anchored_low_confidence";

  const sequencing = mathSequencingSuspicions(invRecord, normKey);

  const gradePdfAnchored = Boolean(bvsRow.officialGradeTopicAnchored);
  const exactSubsectionAnchored = Boolean(HAS_EXACT_SUBSECTION_MAPPING);
  const needsSubsectionReview = gradePdfAnchored && !exactSubsectionAnchored;

  return {
    questionId: invRecord.questionId,
    gradeMin: gmin,
    gradeMax: invRecord.gradeMax,
    normalizedTopicKey: normKey,
    primaryClassification: primary,
    anchorTier,
    gradePdfAnchored,
    exactSubsectionAnchored,
    needsSubsectionReview,
    officialGradeTopicAnchored: gradePdfAnchored,
    officialSubjectOnlyAnchored: Boolean(bvsRow.officialSubjectOnlyAnchored),
    broadOrInternalOnly: Boolean(bvsRow.broadOrInternalOnly),
    sourceQuality: bvsRow.sourceQuality,
    recommendedOfficialPdf: Number.isFinite(gmin) ? mathGradePdfUrl(gmin) : null,
    normalizationConfidence: normalizationConfidence || "medium",
    sequencingSuspicions: sequencing,
    duplicateNote:
      "Possible duplicate stems are listed in duplicates-review.* — no deletion from this report.",
  };
}

export async function buildMathBankVsOfficialSource(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const inventory = loadJson(INV_PATH, "question-inventory");
  const bankVs = loadJson(BANK_VS_PATH, "bank-vs-official-spine");
  const rows = bankVs.rows || [];
  const byId = new Map(rows.map((r) => [r.questionId, r]));

  const invRecords = (inventory.records || []).filter((r) => r.subject === "math");
  /** @type {object[]} */
  const compared = [];
  /** @type {Record<string, Record<string, number>>} */
  const byGradeTopic = {};
  let countGradePdf = 0;
  let countSubjectOnly = 0;
  let countBroad = 0;
  /** @type {Record<string, number>} */
  const sequencingHistogram = {};
  /** @type {Record<string, number>} */
  const broadInternalByGradeTopic = {};

  for (const rec of invRecords) {
    const g = Number(rec.gradeMin);
    const b = byId.get(rec.questionId);
    const norm = normalizeInventoryTopic({
      subject: "math",
      topic: rec.topic,
      subtopic: rec.subtopic || "",
    });
    const normKey = norm.normalizedTopicKey;
    const merged = b
      ? classifyMathRow(b, rec, normKey, norm.normalizationConfidence)
      : {
          questionId: rec.questionId,
          gradeMin: rec.gradeMin,
          gradeMax: rec.gradeMax,
          normalizedTopicKey: normKey,
          primaryClassification: "missing_bank_vs_row",
          anchorTier: "unknown",
          gradePdfAnchored: false,
          exactSubsectionAnchored: false,
          needsSubsectionReview: false,
          officialGradeTopicAnchored: false,
          officialSubjectOnlyAnchored: false,
          broadOrInternalOnly: true,
          sourceQuality: "low",
          normalizationConfidence: norm.normalizationConfidence,
          recommendedOfficialPdf: mathGradePdfUrl(Number(rec.gradeMin) || 1),
          sequencingSuspicions: mathSequencingSuspicions(rec, normKey),
          duplicateNote:
            "See duplicates-review.* for possible static collisions — advisory only.",
        };

    compared.push(merged);

    if (Number.isFinite(g) && g >= 1 && g <= 6) {
      byGradeTopic[g] = byGradeTopic[g] || {};
      byGradeTopic[g][normKey] = (byGradeTopic[g][normKey] || 0) + 1;
    }

    if (b?.officialGradeTopicAnchored) countGradePdf++;
    else if (b?.officialSubjectOnlyAnchored) countSubjectOnly++;
    else if (b?.broadOrInternalOnly) countBroad++;
    else countBroad++;

    for (const s of merged.sequencingSuspicions || []) {
      sequencingHistogram[s.code] = (sequencingHistogram[s.code] || 0) + 1;
    }

    if (merged.broadOrInternalOnly && Number.isFinite(g) && g >= 1 && g <= 6) {
      const k = `g${g}|${normKey}`;
      broadInternalByGradeTopic[k] = (broadInternalByGradeTopic[k] || 0) + 1;
    }
  }

  const sequencingTop = Object.entries(sequencingHistogram)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);

  const payload = {
    generatedAt: new Date().toISOString(),
    phase: "math-bank-vs-official-source",
    meta: {
      ownerRules:
        "No question bank edits from this report; sequencing flags are advisory until owner approval.",
      mathPdfAnchorPattern: mathGradePdfUrl(1).replace("kita1", "kita{n}"),
      phase42Semantics:
        "gradePdfAnchored = official grade programme PDF exists for that grade (registry). It does NOT mean an inventory item is mapped to a named subsection inside the PDF — see math-subtopic-alignment-review.*",
      hasAutomatedSubsectionMapping: HAS_EXACT_SUBSECTION_MAPPING,
    },
    inventoryMathCount: invRecords.length,
    summary: {
      gradePdfAnchoredRows: countGradePdf,
      exactSubsectionAnchoredRows: 0,
      needsSubsectionReviewRows: HAS_EXACT_SUBSECTION_MAPPING ? 0 : countGradePdf,
      subjectOnlyAnchoredRows: countSubjectOnly,
      broadOrInternalRows: countBroad,
    },
    countsByGradeAndTopic: byGradeTopic,
    sequencingSuspicionHistogram: sequencingHistogram,
    sequencingTopSuspicions: sequencingTop,
    broadOrInternalOnlyByGradeTopic: broadInternalByGradeTopic,
    rows: compared,
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    const jsonPath = join(OUT_DIR, "math-bank-vs-official-source.json");
    const mdPath = join(OUT_DIR, "math-bank-vs-official-source.md");
    await writeFile(jsonPath, JSON.stringify(payload, null, 2), "utf8");

    const md = [
      `# Math bank vs official source map`,
      ``,
      `- Generated: ${payload.generatedAt}`,
      ``,
      `## Summary`,
      ``,
      `| Metric | Count |`,
      `|--------|------:|`,
      `| Math inventory rows | ${payload.inventoryMathCount} |`,
      `| **gradePdfAnchoredRows** (registry PDF for grade — not subsection approval) | ${countGradePdf} |`,
      `| **exactSubsectionAnchoredRows** (automated PDF subsection mapping) | 0 |`,
      `| **needsSubsectionReviewRows** (grade PDF only; no subsection IDs yet) | ${HAS_EXACT_SUBSECTION_MAPPING ? 0 : countGradePdf} |`,
      `| **subjectOnlyAnchoredRows** | ${countSubjectOnly} |`,
      `| **broadOrInternalRows** | ${countBroad} |`,
      ``,
      `## Sequencing suspicion codes (advisory)`,
      ``,
      `| Code | Rows |`,
      `|------|-----:|`,
      ...sequencingTop.map(([k, v]) => `| ${k} | ${v} |`),
      ``,
      `## Missing automation`,
      ``,
      `- Topic-level mapping inside each grade PDF still requires human cross-check for stem alignment.`,
      `- Duplicates: consult \`duplicates-review.*\` — no automated deletion.`,
      ``,
      `## Grade × topic counts`,
      ``,
      ...Object.keys(byGradeTopic)
        .sort((a, b) => Number(a) - Number(b))
        .flatMap((g) => [
          `### Grade ${g}`,
          ``,
          `| Normalized topic key | Count |`,
          `|----------------------|------:|`,
          ...Object.entries(byGradeTopic[g])
            .sort((a, b) => b[1] - a[1])
            .map(([t, c]) => `| \`${t}\` | ${c} |`),
          ``,
        ]),
      `---`,
      `Full row detail: **math-bank-vs-official-source.json**`,
      ``,
    ].join("\n");

    await writeFile(mdPath, md, "utf8");
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
  }

  return payload;
}

async function main() {
  await buildMathBankVsOfficialSource({ writeFiles: true });
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
