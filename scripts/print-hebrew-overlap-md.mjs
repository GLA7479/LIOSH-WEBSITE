import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const rows = JSON.parse(readFileSync(join(ROOT, "reports/question-audit/items.json"), "utf8"));
const stage2 = JSON.parse(
  readFileSync(join(ROOT, "reports/question-audit/stage2.json"), "utf8")
);
/** Phase 21: unresolved + intentional spiral = full Hebrew overlap catalog (37 rows). */
function stripSpiralAuditFields(row) {
  const { intentionalSpiral, phase20Classification, note, ...rest } = row;
  return rest;
}
const unresolved = stage2.withinBandClassPairOverlaps || [];
const spiral = (stage2.hebrewIntentionalSpiralOverlaps || []).map(stripSpiralAuditFields);
const bandOrder = {
  g1_vs_g2_early_band: 1,
  g3_vs_g4_mid_band: 2,
  g5_vs_g6_late_band: 3,
};
const overlaps = [...unresolved, ...spiral].sort((a, b) => {
  const da = bandOrder[a.bandPair] ?? 99;
  const db = bandOrder[b.bandPair] ?? 99;
  if (da !== db) return da - db;
  const pf = String(a.patternFamily).localeCompare(String(b.patternFamily));
  if (pf !== 0) return pf;
  return String(a.stemHash).localeCompare(String(b.stemHash));
});
const byHash = new Map();
for (const r of rows) {
  if (r.subject !== "hebrew") continue;
  if (!byHash.has(r.stemHash)) byHash.set(r.stemHash, []);
  byHash.get(r.stemHash).push(r);
}

function summarizePaths(list) {
  const uniq = [];
  const seen = new Set();
  for (const r of list) {
    const key = `${r.minGrade}-${r.maxGrade}|${r.difficulty}|${r.rowKind}|${r.poolKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(
      `g${r.minGrade}–g${r.maxGrade} / ${r.difficulty} / ${r.rowKind} / ${String(r.poolKey || "").slice(0, 52)}`
    );
  }
  return uniq.join(" · ");
}

function classify(o, list) {
  const allRich = list.every((r) => r.rowKind === "hebrew_rich");
  if (o.patternFamily === "comprehension_typed_band_early_g1_g2")
    return "needs owner decision (legacy buckets differ: G1 hard vs G2 easy)";
  if (allRich && o.bandPair?.startsWith("g3_vs"))
    return "acceptable spiral repetition (rich G3 vs G4)";
  if (allRich && o.bandPair?.startsWith("g5_vs") && list.length <= 3)
    return "acceptable spiral repetition (rich G5 vs G6)";
  if (o.bandPair?.startsWith("g5_vs") && list.some((r) => String(r.poolKey || "").includes("G5_")))
    return "needs owner decision (legacy academic stems across bands)";
  return "needs owner decision";
}

function action(cl) {
  if (cl.startsWith("acceptable")) return "keep";
  return "owner review";
}

const lines = [];
lines.push(
  "| # | מסלול כיתות | patternFamily | stemHash | תיאור מסלולים (כיתה / רמה / מקור) | הבדל מהותי | סיווג | המלצה |"
);
lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");

let n = 1;
for (const o of overlaps) {
  const list = byHash.get(o.stemHash) || [];
  const paths = summarizePaths(list);
  const cl = classify(o, list);
  const ac = action(cl);
  const diffNote =
    list.length >= 2 && list[0].stemText !== list[1].stemText
      ? "טקסט שונה בין שורות (אותו stemHash לא צפוי)"
      : "אותו stem לאחר נירמול באודיט";
  lines.push(
    `| ${n} | ${o.bandPair} | ${o.patternFamily} | \`${o.stemHash}\` | ${paths} | ${diffNote} | ${cl} | ${ac} |`
  );
  n += 1;
}

const out = lines.join("\n") + "\n";
const outPath = join(ROOT, "docs", "product-quality-phase1-hebrew-overlap-table.md");
writeFileSync(outPath, out, "utf8");
console.log(`Wrote ${outPath}`);
