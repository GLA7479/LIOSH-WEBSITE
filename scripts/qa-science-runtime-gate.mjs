/**
 * Science runtime gate — each question row must match curriculum topics × grade
 * and conservative strand placement (no notExpectedYet泄漏).
 * Writes reports/curriculum-audit/science-runtime-gate-export.json
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "curriculum-audit");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { SCIENCE_QUESTIONS } = await import(modUrl("data/science-questions.js"));
const { SCIENCE_GRADES } = await import(modUrl("data/science-curriculum.js"));
const { normalizeInventoryTopic } = await import(modUrl("utils/curriculum-audit/curriculum-topic-normalizer.js"));
const { findTopicPlacement } = await import(modUrl("utils/curriculum-audit/israeli-primary-curriculum-map.js"));

const G12_STEM_ADVISORY_LEN = 320;

function parseGk(gk) {
  const m = String(gk || "").match(/^g([1-6])$/);
  return m ? parseInt(m[1], 10) : null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const g12LongStemAdvisory = [];
  let checks = 0;

  for (const q of SCIENCE_QUESTIONS) {
    const grades = Array.isArray(q.grades) ? q.grades : [];
    if (!grades.length) {
      failures.push(`${q.id}: missing grades[]`);
      continue;
    }
    for (const gk of grades) {
      checks++;
      const gnum = parseGk(gk);
      if (gnum == null) {
        failures.push(`${q.id}: invalid grade key "${gk}"`);
        continue;
      }

      const allowedTopics = SCIENCE_GRADES[gk]?.topics || [];
      if (!allowedTopics.includes(q.topic)) {
        failures.push(`${q.id}: topic "${q.topic}" not listed in SCIENCE_GRADES[${gk}].topics`);
        continue;
      }

      const norm = normalizeInventoryTopic({
        subject: "science",
        topic: q.topic,
        subtopic: q.params?.subtype || "",
      });
      const nk = norm.normalizedTopicKey;
      const hit = findTopicPlacement("science", gnum, nk);
      if (!hit) {
        failures.push(`${q.id} ${gk}: no curriculum placement for ${nk}`);
      } else if (hit.bucket === "notExpectedYet") {
        failures.push(`${q.id} ${gk}: strand ${nk} is notExpectedYet for this grade`);
      }

      const stem = String(q.stem || "");
      if (gnum <= 2 && stem.length > G12_STEM_ADVISORY_LEN) {
        g12LongStemAdvisory.push(`${gk} ${q.id} len=${stem.length}`);
      }
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      questionRowsChecked: checks,
      failureCount: failures.length,
      g12LongStemAdvisoryCount: g12LongStemAdvisory.length,
      gatePassed: failures.length === 0,
    },
    failures: failures.slice(0, 500),
    failuresTruncated: failures.length > 500,
    g12LongStemAdvisory: g12LongStemAdvisory.slice(0, 120),
  };

  await writeFile(join(OUT_DIR, "science-runtime-gate-export.json"), JSON.stringify(payload, null, 2), "utf8");

  console.log(JSON.stringify(payload.summary, null, 2));
  if (!payload.summary.gatePassed) {
    console.error("qa-science-runtime-gate: FAILED");
    process.exit(1);
  }
  console.log("qa-science-runtime-gate: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
