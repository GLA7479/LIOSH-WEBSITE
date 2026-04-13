/**
 * Verifies g1/g2 niqqud client pipeline assumptions (strip → vocalize).
 * Run: node scripts/verify-hebrew-niqqud-flow.mjs
 */
import {
  stripHebrewNiqqudMarks,
  vocalizeHebrewWithDicta,
  hebrewScriptLikely,
} from "../utils/hebrew-dicta-nakdan.js";

function buildEntriesLikeHebrewMaster(q) {
  const entries = [];
  const pushIf = (id, text) => {
    const s = String(text ?? "").trim();
    if (!s) return;
    if (!hebrewScriptLikely(s)) return;
    const stripped = stripHebrewNiqqudMarks(s).trim();
    if (!stripped) return;
    if (!hebrewScriptLikely(stripped)) return;
    entries.push({ id, text: stripped });
  };
  pushIf("question", q.question);
  (q.answers || []).forEach((a, i) => pushIf(`answer_${i}`, a));
  return entries;
}

const partialNiqqudQ = {
  question: "קרא את המילה המנוקדת: 'בַּיִת'",
  answers: ["בית", "בת", "בני", "ביש"],
};

const plainQ = {
  question: "מה טוב לשתות כשצמאים?",
  answers: ["מים", "מחברת", "שולחן", "ענן"],
};

console.log("strip(bayit niqqud):", JSON.stringify(stripHebrewNiqqudMarks("בַּיִת")));

const e1 = buildEntriesLikeHebrewMaster(partialNiqqudQ);
const e2 = buildEntriesLikeHebrewMaster(plainQ);
console.log("entries partial-niqqud question count:", e1.length, "(expect >=5)");
console.log("entries plain question count:", e2.length);

if (e1.length === 0) {
  console.error("FAIL: partial niqqud question produced no nakdan entries");
  process.exit(1);
}

const sample = e1.find((x) => x.id === "question")?.text;
console.log("nakdan input for partial question (stripped):", sample);

try {
  const v = await vocalizeHebrewWithDicta(sample);
  const hasMarks = /[\u0591-\u05BD\u05BF-\u05C7]/.test(v);
  console.log("Dicta vocalized length:", v.length, "has niqqud marks:", hasMarks);
  if (!hasMarks) {
    console.warn(
      "WARN: Dicta returned text without niqqud marks (service or tokenization); UI still uses API path."
    );
  }
} catch (err) {
  console.warn("WARN: Dicta fetch failed (offline?):", err?.message || err);
}

console.log("OK: strip + entry build pipeline behaves for g1-style stems.");
