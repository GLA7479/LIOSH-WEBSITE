/**
 * Phase 5-B3 — Science S-05 / S-06 / S-08 bridge blocked: guardrails + blocked report JSON parse.
 * Run: npx tsx scripts/parent-report-grade-aware-phase5b3-science-bridge-verify.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const { taxonomyIdsForReportBucket } = await import(
  new URL("../utils/diagnostic-engine-v2/topic-taxonomy-bridge.js", import.meta.url).href
);
const { resolveGradeAwareParentRecommendationHe } = await import(
  new URL("../utils/parent-report-language/grade-aware-recommendation-resolver.js", import.meta.url).href
);
const { GRADE_AWARE_RECOMMENDATION_TEMPLATES } = await import(
  new URL("../utils/parent-report-language/grade-aware-recommendation-templates.js", import.meta.url).href
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const blockedPath = join(__dirname, "../reports/parent-report-grade-aware-phase5b3-science-bridge-blocked.json");

const FORBIDDEN_IN_BRIDGE = new Set(["S-05", "S-06", "S-08"]);

const SCIENCE_BUCKETS = [
  "body",
  "animals",
  "plants",
  "materials",
  "earth_space",
  "environment",
  "experiments",
  "mixed",
];

for (const bk of SCIENCE_BUCKETS) {
  const ids = taxonomyIdsForReportBucket("science", bk);
  for (const id of ids) {
    if (FORBIDDEN_IN_BRIDGE.has(id)) {
      throw new Error(`Phase 5-B3 guard: bucket "${bk}" must not list ${id} until a real product key exists`);
    }
  }
}

const rawBlocked = readFileSync(blockedPath, "utf8");
JSON.parse(rawBlocked);

const blocked = JSON.parse(rawBlocked);
if (blocked.bridgeImplemented !== false) throw new Error("blocked report must have bridgeImplemented: false");
if (!Array.isArray(blocked.items) || blocked.items.length !== 3) throw new Error("blocked.items must have 3 entries");
for (const id of ["S-05", "S-06", "S-08"]) {
  const row = blocked.items.find((x) => x.taxonomyId === id);
  if (!row || row.bridgeImplemented !== false) throw new Error(`missing or wrong blocked row for ${id}`);
}

const sci = GRADE_AWARE_RECOMMENDATION_TEMPLATES.science;
for (const id of ["S-05", "S-06", "S-08"]) {
  if (sci[id] != null) throw new Error(`No Hebrew template object expected for ${id} in this phase`);
}

function r(tid, bucket, grade) {
  return resolveGradeAwareParentRecommendationHe({
    subjectId: "science",
    taxonomyId: tid,
    bucketKey: bucket,
    gradeKey: grade,
    slot: "action",
  });
}

const s01 = sci["S-01"].bucketOverrides.animals.g3_g4.actionTextHe;
const s02 = sci["S-02"].bucketOverrides.experiments.g3_g4.actionTextHe;
const s03 = sci["S-03"].bucketOverrides.body.g3_g4.actionTextHe;
const s04 = sci["S-04"].bucketOverrides.materials.g3_g4.actionTextHe;
const s07 = sci["S-07"].bucketOverrides.environment.g3_g4.actionTextHe;

if (r("S-01", "animals", "g4") !== s01) throw new Error("S-01 animals g4 template drift");
if (r("S-02", "experiments", "g4") !== s02) throw new Error("S-02 experiments g4 template drift");
if (r("S-03", "body", "g4") !== s03) throw new Error("S-03 body g4 template drift");
if (r("S-04", "materials", "g4") !== s04) throw new Error("S-04 materials g4 template drift");
if (r("S-07", "environment", "g4") !== s07) throw new Error("S-07 environment g4 template drift");

if (r("S-05", "experiments", "g4") != null) throw new Error("S-05 must not resolve without template (expect null)");
if (r("S-06", "earth_space", "g4") != null) throw new Error("S-06 must not resolve without template (expect null)");
if (r("S-08", "animals", "g4") != null) throw new Error("S-08 must not resolve without template (expect null)");

process.stdout.write("parent-report-grade-aware-phase5b3-science-bridge-verify: ok\n");
