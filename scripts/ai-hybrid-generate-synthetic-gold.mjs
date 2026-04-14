/**
 * Generates synthetic gold JSONL (4800 rows) for offline tooling — not shipped in git by default.
 * Run: npm run ai-hybrid:generate-gold
 * Output: data/ai-hybrid-gold/synthetic-gold-v1.jsonl
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import taxonomyBridgeModule from "../utils/diagnostic-engine-v2/topic-taxonomy-bridge.js";
const taxonomyIdsForReportBucket =
  taxonomyBridgeModule.taxonomyIdsForReportBucket ??
  taxonomyBridgeModule.default?.taxonomyIdsForReportBucket;
if (typeof taxonomyIdsForReportBucket !== "function") {
  throw new Error("taxonomyIdsForReportBucket not resolved (tsx/CJS interop)");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "data", "ai-hybrid-gold");
const outFile = path.join(outDir, "synthetic-gold-v1.jsonl");

const SUBJECTS = ["math", "geometry", "english", "science", "hebrew", "moledet-geography"];
const FAMILIES = [
  "high_stable",
  "moderate_ambiguous",
  "weak_sparse",
  "contradictory",
  "cannot_conclude",
  "probe_path",
  "intervention_followup",
];

function bucketFor(subject, fi) {
  const keys = {
    math: ["addition", "subtraction", "multiplication"],
    geometry: ["perimeter", "area"],
    english: ["grammar", "vocabulary"],
    science: ["graphs", "forces"],
    hebrew: ["nikkud", "reading"],
    "moledet-geography": ["israel_map", "climate"],
  };
  const arr = keys[subject] || ["topic_a"];
  return arr[fi % arr.length];
}

fs.mkdirSync(outDir, { recursive: true });
const stream = fs.createWriteStream(outFile, { flags: "w" });

let idx = 0;
for (const subjectId of SUBJECTS) {
  for (let k = 0; k < 800; k += 1) {
    const family = FAMILIES[k % FAMILIES.length];
    const bucketKey = bucketFor(subjectId, k);
    const topicRowKey = `${bucketKey}\u0001learning`;
    const ids = taxonomyIdsForReportBucket(subjectId, bucketKey);
    const goldPrimaryTaxonomyId = ids.length ? ids[k % ids.length] : "none";
    const row = {
      id: `synth_${idx}`,
      subjectId,
      topicRowKey,
      bucketKey,
      family,
      goldPrimaryTaxonomyId,
      questions: family === "weak_sparse" ? 5 : 18,
      wrongAggregate: family === "cannot_conclude" ? 0 : 4,
      wrongEventCount: family === "weak_sparse" ? 0 : 4,
      recurrenceFull: family === "high_stable",
    };
    stream.write(`${JSON.stringify(row)}\n`);
    idx += 1;
  }
}

stream.end();
await new Promise((res, rej) => {
  stream.on("finish", res);
  stream.on("error", rej);
});
console.log(`Wrote ${idx} rows to ${outFile}`);
