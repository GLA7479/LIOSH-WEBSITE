/**
 * Phase 5.2 analysis: list MCQ ids that likely need surgical option fixes.
 * Run: node scripts/flag-science-mcq-phase52.mjs
 */
import { SCIENCE_QUESTIONS } from "../data/science-questions.js";

function analyze() {
  const flagged = [];
  for (const q of SCIENCE_QUESTIONS) {
    if (q.type !== "mcq" || !Array.isArray(q.options)) continue;
    const opts = q.options.map((s) => String(s || ""));
    const ci = q.correctIndex;
    if (ci < 0 || ci >= opts.length) continue;

    const lens = opts.map((o) => o.length);
    const correct = opts[ci];
    const wrongLens = lens.filter((_, i) => i !== ci);
    const minW = Math.min(...wrongLens);
    const maxW = Math.max(...wrongLens);
    const meanW = wrongLens.reduce((a, b) => a + b, 0) / wrongLens.length;
    const Lc = correct.length;

    let reasons = [];

    const hasRek = opts.some((o) => /^רק\s/.test(o.trim()) || /^רק[\u0590-\u05FF]/.test(o.trim()));
    if (hasRek) reasons.push("rek");

    if (Lc >= maxW + 20 && Lc > 40) reasons.push("correct_much_longer");
    if (Lc > meanW * 1.35 && Lc > 35) reasons.push("correct_vs_mean");

    const shortWrong = wrongLens.some((w) => w < 15 && Lc > 40);
    if (shortWrong) reasons.push("short_wrong");

    if (Lc === Math.max(...lens) && lens.filter((L) => L === Lc).length === 1) {
      const sorted = [...lens].sort((a, b) => b - a);
      if (sorted[1] < Lc * 0.65 && Lc > 30) reasons.push("correct_lone_long");
    }

    if (reasons.length) {
      flagged.push({
        id: q.id,
        stem: (q.stem || "").slice(0, 60),
        reasons: [...new Set(reasons)],
        lengths: lens.join(","),
        Lc,
        maxW,
      });
    }
  }

  flagged.sort((a, b) => {
    const score = (x) =>
      (x.reasons.includes("rek") ? 4 : 0) +
      (x.reasons.includes("correct_lone_long") ? 3 : 0) +
      (x.reasons.includes("correct_much_longer") ? 2 : 0) +
      (x.reasons.includes("short_wrong") ? 1 : 0);
    return score(b) - score(a);
  });

  console.log("total_mcq", SCIENCE_QUESTIONS.filter((q) => q.type === "mcq").length);
  console.log("flagged", flagged.length);
  flagged.slice(0, 130).forEach((f) => {
    console.log(`${f.id}\t${f.reasons.join("+")}\tLc${f.Lc} maxW${f.maxW}\t${f.stem}`);
  });
  return flagged;
}

analyze();
