/**
 * Session-variety audit: g1/g2 × easy × topics — merged legacy+rich, post-finalize.
 * Run: npx tsx scripts/audit-g12-easy-session-variety.mjs
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const href = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { HEBREW_LEGACY_QUESTIONS_SNAPSHOT, finalizeHebrewMcq } = await import(
  href("utils/hebrew-question-generator.js")
);
const { filterRichHebrewPool } = await import(href("utils/hebrew-rich-question-bank.js"));
const {
  hebrewQuestionFingerprint,
  hebrewNearDuplicateKey,
  hebrewStemNorm,
} = await import(href("utils/hebrew-learning-intel.js"));
const { resolveG1ItemSubtopicId } = await import(href("utils/hebrew-g1-subtopic.js"));
const { resolveG2ItemSubtopicId } = await import(href("utils/hebrew-g2-subtopic.js"));

const TOPICS = ["reading", "comprehension", "grammar", "vocabulary"];
const LEVEL = "easy";

function mergeTopicPools(gradeKey, levelKey, topic, legacyList) {
  const richRows = filterRichHebrewPool(gradeKey, levelKey, topic);
  const fromRich = richRows.map(
    ({ grades: _g, gradeBand: _gb, allowedLevels: _al, levels: _l, topic: _tp, ...rest }) => ({
      ...rest,
      _fromRich: true,
    })
  );
  const base = Array.isArray(legacyList) ? [...legacyList] : [];
  return base.concat(fromRich);
}

/** מאחד מילים מצוטטות — למדידת חזרתיות תבניתית (לא ניסוח מילה-במילה). */
function cognitiveTemplate(stem) {
  return String(stem || "")
    .replace(/[“”"]/g, "'")
    .replace(/['׳][^'׳]{1,14}['׳]/g, "'@'")
    .replace(/׳[^׳]{1,14}׳/g, "׳@׳")
    .replace(/\s+/g, " ")
    .trim();
}

function toFingerprintObj(topic, fq) {
  return {
    topic,
    operation: topic,
    question: fq.question,
    answerMode: "choice",
    params: {
      patternFamily: fq.patternFamily || "",
      subtype: fq.subtype || "",
    },
  };
}

function subtopicHistogram(gradeKey, topic, merged) {
  const resolver =
    gradeKey === "g1"
      ? (raw) => resolveG1ItemSubtopicId(raw, topic)
      : gradeKey === "g2"
        ? (raw) => resolveG2ItemSubtopicId(raw, topic)
        : () => "(n/a)";
  const by = new Map();
  for (const raw of merged) {
    const sid = resolver(raw);
    by.set(sid, (by.get(sid) || 0) + 1);
  }
  return [...by.entries()].sort((a, b) => b[1] - a[1]);
}

function analyze(gradeKey) {
  const key = `${gradeKey.toUpperCase()}_${LEVEL.toUpperCase()}_QUESTIONS`;
  const pool = HEBREW_LEGACY_QUESTIONS_SNAPSHOT[key];
  const out = {};
  for (const topic of TOPICS) {
    const legacy = pool?.[topic] || [];
    const merged = mergeTopicPools(gradeKey, LEVEL, topic, legacy);
    const rows = [];
    for (const raw of merged) {
      const fq = finalizeHebrewMcq({ ...raw }, topic, LEVEL, gradeKey);
      const fpObj = toFingerprintObj(topic, fq);
      const fp = hebrewQuestionFingerprint(fpObj);
      const near = hebrewNearDuplicateKey(fpObj);
      const stemN = hebrewStemNorm(fq.question);
      const pf = fq.patternFamily || "(none)";
      rows.push({
        fp,
        near,
        pf,
        stemN: stemN.slice(0, 80),
        fromRich: !!raw._fromRich,
        cog: `${topic}|${cognitiveTemplate(fq.question)}`,
      });
    }
    const fpSet = new Set(rows.map((r) => r.fp));
    const nearSet = new Set(rows.map((r) => r.near));
    const cogSet = new Set(rows.map((r) => r.cog));
    const pfCounts = {};
    for (const r of rows) {
      pfCounts[r.pf] = (pfCounts[r.pf] || 0) + 1;
    }
    const pfSorted = Object.entries(pfCounts).sort((a, b) => b[1] - a[1]);
    const legacyN = merged.filter((q) => !q._fromRich).length;
    const richN = merged.filter((q) => q._fromRich).length;
    out[topic] = {
      mergedTotal: merged.length,
      legacyCount: legacyN,
      richCount: richN,
      uniqueFingerprint: fpSet.size,
      uniqueNearDuplicateKey: nearSet.size,
      uniqueCognitiveTemplate: cogSet.size,
      duplicateFingerprintCount: merged.length - fpSet.size,
      patternFamilyTop: pfSorted.slice(0, 8),
      subtopicBuckets:
        gradeKey === "g1" || gradeKey === "g2"
          ? subtopicHistogram(gradeKey, topic, merged).slice(0, 12)
          : [],
      grammarPosTaskSharePct:
        topic === "grammar"
          ? Number(
              (
                (rows.filter((r) =>
                  /grammar_pos|pos_inventory|מה חלק הדיבר|חלקי הדיבר|חלקי דיבר/i.test(
                    `${r.pf}|${r.stemN}`
                  )
                ).length /
                  Math.max(rows.length, 1)) *
                100
              ).toFixed(1)
            )
          : null,
    };
  }
  return out;
}

const g1 = analyze("g1");
const g2 = analyze("g2");

console.log(JSON.stringify({ g1_easy: g1, g2_easy: g2 }, null, 2));
