/**
 * Phase 4B-0b — Official source quality audit (registry classification report).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { OFFICIAL_CURRICULUM_SOURCE_REGISTRY } from "../../utils/curriculum-audit/official-curriculum-source-registry.js";
import {
  SUBJECT_SOURCE_PROFILES,
  computeSubjectSourceProfile,
} from "../../utils/curriculum-audit/official-source-subject-profile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

function gradesLabel(g) {
  if (g === "all") return "כל הכיתות";
  if (g === "none") return "—";
  if (Array.isArray(g)) return g.join(", ");
  return String(g);
}

function mdReport(payload) {
  const lines = [
    `# Official source quality audit (Phase 4B-0b)`,
    ``,
    `- Generated: ${payload.generatedAt}`,
    `- Registry rows: ${payload.registryEntries.length}`,
    ``,
    `## Summary`,
    ``,
    `- By source quality level:`,
    ...Object.entries(payload.countsByQualityLevel).map(([k, v]) => `  - ${k}: **${v}**`),
    `- By confidence after audit:`,
    ...Object.entries(payload.countsByConfidence).map(([k, v]) => `  - ${k}: **${v}**`),
    `- Official MoE published rows: **${payload.officialMoERowCount}**`,
    `- Internal gap rows: **${payload.internalGapRowCount}**`,
    `- RAMA assessment-only rows: **${payload.ramaRowCount}**`,
    ``,
    `## Subject profiles (rollup)`,
    ``,
    `| Subject | sourceQuality | grade-topic anchor? | subject POP/PDF anchor? | internal gap? | needs pedagogy review (weak source)? |`,
    `|---------|---------------|--------------------|---------------------------|----------------|----------------------------------------|`,
  ];

  for (const [sub, p] of Object.entries(payload.subjectProfiles).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    lines.push(
      `| ${sub} | ${p.sourceQuality} | ${p.hasExactGradeTopicAnchor ? "yes" : "no"} | ${p.hasExactSubjectCurriculumAnchor ? "yes" : "no"} | ${p.hasInternalGapRows ? "yes" : "no"} | ${p.needsPedagogyReviewBecauseSourceWeak ? "yes" : "no"} |`
    );
  }

  lines.push(
    ``,
    `## Registry rows (detail)`,
    ``,
    `| Subject | Quality level | Conf. | Official? | Grade detail? | Topic detail? | Skill depth? | Pedagogy review? | URL |`,
    `|---------|---------------|-------|-----------|-----------------|---------------|--------------|-------------------|-----|`,
  );

  for (const r of payload.registryEntries) {
    const shortUrl = r.url.length > 56 ? `${r.url.slice(0, 54)}…` : r.url || "—";
    lines.push(
      `| ${r.subject} | ${r.sourceQualityLevel} | ${r.confidenceAfterAudit} | ${r.isOfficialMoEPublished ? "yes" : "no"} | ${r.providesGradeLevelDetail ? "yes" : "no"} | ${r.providesTopicLevelDetail ? "yes" : "no"} | ${r.providesSkillOrDepthDetail ? "yes" : "no"} | ${r.needsHumanPedagogyReview ? "yes" : "no"} | [link](${r.url || "#"}) |`
    );
    lines.push(`|  | _${r.title.slice(0, 120)}${r.title.length > 120 ? "…" : ""}_ | | | | | | | ${shortUrl} |`);
    lines.push(`|  | **Action:** ${r.actionNeeded} | | | | | | | |`);
    lines.push(`|  | | | | | | | | |`);
  }

  lines.push(
    ``,
    `## Actions`,
    ``,
    `- **Downgraded:** broad ministry homepage rows removed; RAMA limited to rama.edu.gov.il as assessment context.`,
    `- **Upgraded:** direct POP (\`pop.education.gov.il\`) curriculum/pedagogy pages and selected \`meyda.education.gov.il\` PDFs.`,
    ``
  );

  return lines.join("\n");
}

export async function buildOfficialSourceQualityAudit(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const generatedAt = new Date().toISOString();
  const registryEntries = OFFICIAL_CURRICULUM_SOURCE_REGISTRY.map((r, idx) => ({
    ...r,
    _id: idx,
  }));

  const countsByQualityLevel = {};
  const countsByConfidence = {};
  let officialMoERowCount = 0;
  let internalGapRowCount = 0;
  let ramaRowCount = 0;

  for (const r of registryEntries) {
    countsByQualityLevel[r.sourceQualityLevel] =
      (countsByQualityLevel[r.sourceQualityLevel] || 0) + 1;
    countsByConfidence[r.confidenceAfterAudit] =
      (countsByConfidence[r.confidenceAfterAudit] || 0) + 1;
    if (r.isOfficialMoEPublished) officialMoERowCount++;
    if (r.sourceQualityLevel === "internal_gap") internalGapRowCount++;
    if (r.sourceType === "rama") ramaRowCount++;
  }

  const subjectProfiles = { ...SUBJECT_SOURCE_PROFILES };
  /* Ensure dynamic subjects */
  for (const s of new Set(registryEntries.map((x) => x.subject))) {
    if (!subjectProfiles[s]) subjectProfiles[s] = computeSubjectSourceProfile(s);
  }

  const upgraded = registryEntries.filter((r) =>
    String(r.url).includes("pop.education.gov.il")
  ).length;
  const downgraded = registryEntries.filter(
    (r) =>
      r.sourceQualityLevel === "broad_ministry_portal" ||
      r.confidenceAfterAudit === "low"
  ).length;

  const payload = {
    generatedAt,
    phase: "4B-0b",
    registryEntries,
    countsByQualityLevel,
    countsByConfidence,
    officialMoERowCount,
    internalGapRowCount,
    ramaRowCount,
    subjectProfiles,
    narrative: {
      upgradedDirectPopOrPdfRows: upgraded,
      rowsMarkedLowOrBroad: downgraded,
    },
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(
      join(OUT_DIR, "official-source-quality-audit.json"),
      JSON.stringify(payload, null, 2),
      "utf8"
    );
    await writeFile(
      join(OUT_DIR, "official-source-quality-audit.md"),
      mdReport(payload),
      "utf8"
    );
    console.log(`Wrote ${OUT_DIR}/official-source-quality-audit.{json,md}`);
  }

  return payload;
}

buildOfficialSourceQualityAudit().catch((e) => {
  console.error(e);
  process.exit(1);
});
