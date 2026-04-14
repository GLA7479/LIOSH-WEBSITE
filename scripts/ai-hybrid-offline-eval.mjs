/**
 * Offline smoke metrics on synthetic gold (requires generated JSONL).
 * Run: npm run ai-hybrid:offline-eval
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import rankerModule from "../utils/ai-hybrid-diagnostic/hypothesis-ranker.js";
const rankHypotheses = rankerModule.rankHypotheses ?? rankerModule.default?.rankHypotheses;
if (typeof rankHypotheses !== "function") {
  throw new Error("rankHypotheses not resolved (tsx/CJS interop)");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const goldFile = path.join(root, "data", "ai-hybrid-gold", "synthetic-gold-v1.jsonl");

if (!fs.existsSync(goldFile)) {
  console.log("Skip: run npm run ai-hybrid:generate-gold first.");
  process.exit(0);
}

const lines = fs.readFileSync(goldFile, "utf8").trim().split("\n").filter(Boolean);
let top1 = 0;
const max = Math.min(lines.length, 2000);
for (let i = 0; i < max; i += 1) {
  const g = JSON.parse(lines[i]);
  const unit = {
    subjectId: g.subjectId,
    topicRowKey: g.topicRowKey,
    bucketKey: g.bucketKey,
    taxonomy: g.goldPrimaryTaxonomyId && g.goldPrimaryTaxonomyId !== "none" ? { id: g.goldPrimaryTaxonomyId } : null,
    diagnosis: { allowed: true, taxonomyId: g.goldPrimaryTaxonomyId },
    recurrence: { full: !!g.recurrenceFull },
    confidence: { level: "high" },
    outputGating: { cannotConcludeYet: false, diagnosisAllowed: true, confidenceOnly: false, probeOnly: false },
  };
  const row = {
    questions: g.questions,
    correct: g.questions - g.wrongAggregate,
    wrong: g.wrongAggregate,
    accuracy: Math.round(((g.questions - g.wrongAggregate) / Math.max(1, g.questions)) * 100),
    needsPractice: true,
    behaviorProfile: { dominantType: "knowledge_gap" },
  };
  const mistakes = [];
  for (let j = 0; j < g.wrongEventCount; j += 1) {
    mistakes.push({
      subject: g.subjectId,
      topic: g.bucketKey,
      operation: g.bucketKey,
      bucketKey: g.bucketKey,
      timestamp: Date.UTC(2026, 3, 1) + j * 3600000,
      isCorrect: false,
      patternFamily: `pf:${j % 2}`,
    });
  }
  const r = rankHypotheses({
    unit,
    row,
    features: { weakEvidence: false },
    rawMistakes: mistakes,
    startMs: Date.UTC(2026, 3, 1),
    endMs: Date.UTC(2026, 3, 30),
    learningState: { taxonomyLiftByKey: {} },
    mode: "assist",
  });
  if (r.top1Id === g.goldPrimaryTaxonomyId) top1 += 1;
}

console.log(JSON.stringify({ sampled: max, top1Accuracy: top1 / max }, null, 2));
