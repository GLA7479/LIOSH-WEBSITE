/**
 * Phase 4B-0 — Emit official curriculum spine report (JSON + markdown).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { OFFICIAL_CURRICULUM_SOURCE_REGISTRY } from "../../utils/curriculum-audit/official-curriculum-source-registry.js";
import {
  OFFICIAL_PRIMARY_CURRICULUM_SPINE,
  OFFICIAL_SPINE_META,
} from "../../utils/curriculum-audit/official-primary-curriculum-spine.js";
import { SUBJECT_SOURCE_PROFILES } from "../../utils/curriculum-audit/official-source-subject-profile.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");

const GRADE_KEYS = [
  "grade_1",
  "grade_2",
  "grade_3",
  "grade_4",
  "grade_5",
  "grade_6",
];

function listTopics(label, arr) {
  if (!Array.isArray(arr) || !arr.length) return [`- _(${label}: none)_`];
  return arr.map(
    (t) =>
      `- **${t.key}** — ${t.labelHe} _(${t.expectedLevel}, ${t.gradeDepth}, conf ${t.confidence})_`
  );
}

function mdForGradeSlot(gk, slot) {
  return [
    `#### ${gk}`,
    ``,
    `**Confidence:** ${slot.confidence}  `,
    `**needsHumanPedagogyReview:** ${slot.needsHumanPedagogyReview ? "yes" : "no"}`,
    ``,
    `**core topics**`,
    ...listTopics("core", slot.coreTopics),
    ``,
    `**allowed topics**`,
    ...listTopics("allowed", slot.allowedTopics),
    ``,
    `**exposure-only topics**`,
    ...listTopics("exposure", slot.exposureOnlyTopics),
    ``,
    `**enrichment topics**`,
    ...listTopics("enrichment", slot.enrichmentTopics),
    ``,
    `**not expected yet (at this grade)**`,
    ...listTopics("not expected", slot.notExpectedYet),
    ``,
    `**skills (summary)**`,
    ...(slot.skills || []).map((s) => `- ${s}`),
    ``,
    `**text complexity / language notes**`,
    ...(slot.textComplexityNotes || []).map((s) => `- ${s}`),
    ``,
    `**difficulty / depth notes**`,
    ...(slot.difficultyNotes || []).map((s) => `- ${s}`),
    ``,
    `**source references (registry + anchors)**`,
    ...((slot.sourceRefs && slot.sourceRefs.length
      ? slot.sourceRefs
      : [{ title: "_(none attached)_", url: "" }]
    ).map((r) => `- ${r.title || r.sourceType} — ${r.url || "—"}`)),
    ``,
    `**narrative**`,
    slot.narrativeNotes || "—",
    ``,
  ].join("\n");
}

function buildMarkdown(payload) {
  const lines = [
    `# Official primary curriculum spine (Phase 4B-0b)`,
    ``,
    `- Generated: ${payload.generatedAt}`,
    `- Phase: ${payload.meta.phase}`,
    `- Scope: ${payload.meta.scope}`,
    ``,
    `## Meta`,
    ``,
    `- **geometry vs math:** ${payload.meta.geometryVsMathNote}`,
    `- **Moladeta grade band:** ${payload.meta.moladetaGradeBandNote}`,
    `- **Disclaimer:** ${payload.meta.disclaimer}`,
    ``,
    `## Subject source profiles (registry rollup)`,
    ``,
    `| Subject | sourceQuality | grade-topic anchor | subject POP/PDF anchor | internal gap rows | weak-source pedagogy review |`,
    `|---------|---------------|--------------------|-------------------------|-------------------|------------------------------|`,
  ];

  for (const [sub, p] of Object.entries(payload.subjectSourceProfiles || {}).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    lines.push(
      `| ${sub} | ${p.sourceQuality} | ${p.hasExactGradeTopicAnchor ? "yes" : "no"} | ${p.hasExactSubjectCurriculumAnchor ? "yes" : "no"} | ${p.hasInternalGapRows ? "yes" : "no"} | ${p.needsPedagogyReviewBecauseSourceWeak ? "yes" : "no"} |`
    );
  }

  lines.push(
    ``,
    `## Source registry (hardened rows)`,
    ``,
    `| Subject | Quality class | Conf. (audit) | Title (trimmed) |`,
    `|---------|---------------|---------------|-------------------|`,
  );

  for (const r of payload.registry) {
    lines.push(
      `| ${r.subject} | ${r.sourceQualityLevel} | ${r.confidenceAfterAudit} | ${r.title.slice(0, 72)}${r.title.length > 72 ? "…" : ""} |`
    );
  }

  lines.push(``, `## Spine by subject`, ``);

  for (const subject of Object.keys(payload.spine).sort()) {
    lines.push(`### ${subject}`, ``);
    const sub = payload.spine[subject];
    for (const gk of GRADE_KEYS) {
      const slot = sub[gk];
      if (!slot) continue;
      lines.push(mdForGradeSlot(gk, slot));
    }
  }

  lines.push(
    ``,
    `## Missing official source gaps`,
    ``,
    `See registry rows with \`sourceQualityLevel: internal_gap\` or \`confidenceAfterAudit: low\` — these require PDF anchors before treating alignment as binding. RAMA (\`rama.edu.gov.il\`) is assessment context only.`,
    ``
  );

  return lines.join("\n");
}

function confidenceRollup() {
  /** @type {Record<string, Record<string, { confidence: string, needsHumanPedagogyReview: boolean }>>} */
  const bySubjectGrade = {};
  for (const [sub, grades] of Object.entries(OFFICIAL_PRIMARY_CURRICULUM_SPINE)) {
    bySubjectGrade[sub] = {};
    for (const [gk, slot] of Object.entries(grades)) {
      if (!slot || typeof slot !== "object") continue;
      bySubjectGrade[sub][gk] = {
        confidence: slot.confidence,
        needsHumanPedagogyReview: Boolean(slot.needsHumanPedagogyReview),
      };
    }
  }
  return bySubjectGrade;
}

export async function buildOfficialCurriculumSpineReport(opts = {}) {
  const writeFiles = opts.writeFiles !== false;
  const generatedAt = new Date().toISOString();

  const payload = {
    generatedAt,
    meta: OFFICIAL_SPINE_META,
    registry: OFFICIAL_CURRICULUM_SOURCE_REGISTRY,
    spine: OFFICIAL_PRIMARY_CURRICULUM_SPINE,
    subjectSourceProfiles: SUBJECT_SOURCE_PROFILES,
    confidenceBySubjectAndGrade: confidenceRollup(),
    subjectsWithSourceGaps: OFFICIAL_CURRICULUM_SOURCE_REGISTRY.filter(
      (r) =>
        r.sourceQualityLevel === "internal_gap" || r.confidenceAfterAudit === "low"
    ).map((r) => `${r.subject}:${r.title.slice(0, 48)}`),
  };

  if (writeFiles) {
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(
      join(OUT_DIR, "official-curriculum-spine.json"),
      JSON.stringify(payload, null, 2),
      "utf8"
    );
    await writeFile(
      join(OUT_DIR, "official-curriculum-spine.md"),
      buildMarkdown(payload),
      "utf8"
    );
    console.log(`Wrote ${OUT_DIR}/official-curriculum-spine.{json,md}`);
  }

  return payload;
}

buildOfficialCurriculumSpineReport().catch((e) => {
  console.error(e);
  process.exit(1);
});
