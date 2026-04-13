/**
 * Hard validation — Hebrew grades g1/g2 only (legacy snapshot + rich pool).
 *
 * Reports:
 * - answers.length !== 4
 * - binary: true OR optionCount === 2 with 2 answers
 * - question stem (raw + post-finalize+scope+strip) matching internal/meta heuristics
 * - "typing risk" if legacy resolveAnswerMode (without g1/g2 override) would return typing
 *
 * Run: npx tsx scripts/audit-hebrew-g1-g2-hard.mjs
 * Exit 1 if any blocking issue is found.
 */
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const modUrl = (rel) => pathToFileURL(join(ROOT, rel)).href;

const { HEBREW_LEGACY_QUESTIONS_SNAPSHOT, finalizeHebrewMcq } = await import(
  modUrl("utils/hebrew-question-generator.js")
);
const { HEBREW_RICH_POOL } = await import(modUrl("utils/hebrew-rich-question-bank.js"));
const {
  scopeHebrewStemForGrade,
  stripHebrewQuestionPedagogicalLeadIn,
} = await import(modUrl("utils/hebrew-legacy-metadata.js"));
const { itemAllowedForGrade, itemAllowedForLevel } = await import(
  modUrl("utils/grade-gating.js")
);

const BLANK = "\uFF3F"; // same as generator uses for "רווח" if any

/** Same logic as resolveAnswerMode in hebrew-question-generator.js WITHOUT g1/g2 early return. */
function legacyTypingWithoutChildOverride(selectedTopicKey, questionText) {
  const q = String(questionText || "").trim();
  const hasBlankPattern = q.includes("_") || q.includes(BLANK);
  if (selectedTopicKey === "writing" || selectedTopicKey === "speaking") {
    return "typing";
  }
  if (selectedTopicKey === "comprehension") {
    return "choice";
  }
  if (selectedTopicKey === "grammar") {
    if (hasBlankPattern || q.includes("איך כותבים")) return "typing";
    return "choice";
  }
  if (selectedTopicKey === "reading") {
    if (
      hasBlankPattern ||
      q.includes("איזה אות חסרה") ||
      q.includes("מה המילה הנכונה")
    ) {
      return "typing";
    }
    return "choice";
  }
  if (selectedTopicKey === "vocabulary") {
    if (q.includes("מה המילה המתאימה") || q.includes("השלם")) return "typing";
    return "choice";
  }
  return "choice";
}

function finalizeStem(topic, levelKey, gradeKey, raw) {
  const fq = finalizeHebrewMcq({ ...raw }, topic, levelKey, gradeKey);
  let stem = String(fq.question || "").trim();
  stem = scopeHebrewStemForGrade(topic, stem, gradeKey);
  stem = stripHebrewQuestionPedagogicalLeadIn(stem);
  return stem.trim();
}

/** Conservative: catch grade tags / internal words; allow normal "בכיתה" in running text. */
const META_RES = [
  { id: "grade_tag_paren", re: /\(\s*כיתה\s+[אבגדהו]/i },
  { id: "grade_prefix_colon", re: /^\s*כיתה\s+[אבגדהו][׳']?\s*:/i },
  { id: "grade_bekita_colon", re: /^\s*בכיתה\s+[אבגדהו][׳']?\s*:/i },
  { id: "level_label", re: /רמה\s+(קלה|בינונית|קשה)/i },
  { id: "hitamat_dover", re: /התאמת\s+דובר/i },
  { id: "hitamat_guf_phrase", re: /התאמת\s+גוף/i },
  { id: "subtopic_token", re: /subtopic/i },
  { id: "pattern_token", re: /pattern\s*family|patternfamily/i },
  { id: "internal_underscore_id", re: /\bg[12]_[a-z0-9_]{12,}\b/i },
];

function metaHits(text) {
  const s = String(text || "");
  const hits = [];
  for (const { id, re } of META_RES) {
    if (re.test(s)) hits.push(id);
  }
  return hits;
}

const LEVELS = ["easy", "medium", "hard"];
const LEGACY_KEYS = [
  "G1_EASY_QUESTIONS",
  "G1_MEDIUM_QUESTIONS",
  "G1_HARD_QUESTIONS",
  "G2_EASY_QUESTIONS",
  "G2_MEDIUM_QUESTIONS",
  "G2_HARD_QUESTIONS",
];

function auditLegacy(gradeKey) {
  const out = [];
  const prefix = gradeKey === "g1" ? "G1" : "G2";
  for (const key of LEGACY_KEYS) {
    if (!key.startsWith(prefix)) continue;
    const pool = HEBREW_LEGACY_QUESTIONS_SNAPSHOT[key];
    if (!pool || typeof pool !== "object") continue;
    const levelKey = key.includes("EASY")
      ? "easy"
      : key.includes("MEDIUM")
        ? "medium"
        : "hard";
    for (const [topic, arr] of Object.entries(pool)) {
      if (!Array.isArray(arr)) continue;
      arr.forEach((raw, idx) => {
        const answers = Array.isArray(raw.answers) ? raw.answers : [];
        const n = answers.length;
        const stemFinal = finalizeStem(topic, levelKey, gradeKey, raw);
        const stemRaw = String(raw.question || "").trim();
        const bin =
          raw.binary === true ||
          raw.optionCount === 2 ||
          (n === 2 && /נכון|לא\s+נכון|אמת|שקר/i.test(answers.join(" ")));
        const typingOld = legacyTypingWithoutChildOverride(topic, stemFinal);
        const row = {
          source: "legacy",
          pool: key,
          topic,
          index: idx,
          answersLen: n,
          binaryish: bin,
          metaRaw: metaHits(stemRaw),
          metaFinal: metaHits(stemFinal),
          typingWithoutG12Override: typingOld,
          snippet: stemFinal.slice(0, 72),
        };
        if (n !== 4) out.push({ ...row, issue: "answers_len_not_4" });
        if (bin) out.push({ ...row, issue: "binary_or_two_option" });
        if (row.metaFinal.length) out.push({ ...row, issue: "meta_in_final_stem" });
        if (row.metaRaw.length && !row.metaFinal.length)
          out.push({ ...row, issue: "meta_raw_only" });
        if (typingOld === "typing")
          out.push({ ...row, issue: "typing_would_apply_without_g12_fix" });
      });
    }
  }
  return out;
}

function auditRich(gradeKey) {
  const out = [];
  for (const row of HEBREW_RICH_POOL) {
    if (!itemAllowedForGrade(row, gradeKey)) continue;
    const answers = Array.isArray(row.answers) ? row.answers : [];
    const n = answers.length;
    const topic = String(row.topic || "");
    const stemRaw = String(row.question || "").trim();
    const bin =
      row.binary === true ||
      row.optionCount === 2 ||
      (n === 2 && /נכון|לא\s+נכון/i.test(answers.join(" ")));
    for (const levelKey of LEVELS) {
      if (!Array.isArray(row.levels) || !row.levels.includes(levelKey)) continue;
      if (!itemAllowedForLevel(row, levelKey)) continue;
      const stemFinal = finalizeStem(topic, levelKey, gradeKey, row);
      const typingOld = legacyTypingWithoutChildOverride(topic, stemFinal);
      const hit = {
        source: "rich",
        topic,
        levelKey,
        patternFamily: row.patternFamily,
        answersLen: n,
        binaryish: bin,
        metaRaw: metaHits(stemRaw),
        metaFinal: metaHits(stemFinal),
        typingWithoutG12Override: typingOld,
        snippet: stemFinal.slice(0, 72),
      };
      if (n !== 4) out.push({ ...hit, issue: "answers_len_not_4" });
      if (bin) out.push({ ...hit, issue: "binary_or_two_option" });
      if (hit.metaFinal.length) out.push({ ...hit, issue: "meta_in_final_stem" });
      if (hit.metaRaw.length && !hit.metaFinal.length)
        out.push({ ...hit, issue: "meta_raw_only" });
      if (typingOld === "typing")
        out.push({ ...hit, issue: "typing_would_apply_without_g12_fix" });
    }
  }
  return out;
}

function dedupe(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = `${r.issue}|${r.source}|${r.pool || r.patternFamily || ""}|${r.topic}|${r.index ?? ""}|${r.levelKey || ""}|${r.snippet}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

const blocking = new Set([
  "answers_len_not_4",
  "binary_or_two_option",
  "meta_in_final_stem",
]);

const g1Legacy = auditLegacy("g1");
const g2Legacy = auditLegacy("g2");
const g1Rich = auditRich("g1");
const g2Rich = auditRich("g2");

const all = dedupe([...g1Legacy, ...g2Legacy, ...g1Rich, ...g2Rich]);
const blockers = all.filter((r) => blocking.has(r.issue));
const inform = all.filter((r) => !blocking.has(r.issue));

const summary = {
  totalFindings: all.length,
  blockers: blockers.length,
  informTypingMitigated: inform.filter(
    (r) => r.issue === "typing_would_apply_without_g12_fix"
  ).length,
  byIssue: {},
};
for (const r of all) {
  summary.byIssue[r.issue] = (summary.byIssue[r.issue] || 0) + 1;
}

console.log(JSON.stringify({ summary, blockers: blockers.slice(80), informSample: inform.slice(20) }, null, 2));

if (blockers.length > 0) {
  console.error("audit-hebrew-g1-g2-hard: BLOCKERS", blockers.length);
  process.exit(1);
}
console.log("audit-hebrew-g1-g2-hard: OK (no blockers)");
process.exit(0);
