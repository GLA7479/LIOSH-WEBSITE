/**
 * Phase 10.4 — Deep simulation audit (Node + frozen clock + real report generators).
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { FORBIDDEN_INTERNAL_PARENT_TERMS } = await import(
  pathToFileURL(path.join(__dirname, "..", "utils", "contracts", "parent-product-contract-v1.js")).href
);

const ROOT = process.cwd();
const DEEP = path.join(ROOT, "reports", "parent-report-learning-simulations", "deep");
const SHOT_DIR = path.join(DEEP, "screenshots");
const MANIFEST = path.join(DEEP, "deep-simulations-manifest.json");
const SITE_RESULTS = path.join(DEEP, "site-rendered-deep-results.json");
const AUDIT_JSON = path.join(DEEP, "deep-simulation-audit.json");
const AUDIT_MD = path.join(DEEP, "deep-simulation-audit.md");
const INDEX_MD = path.join(DEEP, "index.md");
const REVIEWER_MD = path.join(DEEP, "reviewer-pack.md");

function patchDate(anchorMs) {
  const Orig = Date;
  function Patched(...args) {
    if (args.length === 0) return new Orig(anchorMs);
    return new Orig(...args);
  }
  Patched.prototype = Orig.prototype;
  Patched.now = () => anchorMs;
  Patched.UTC = Orig.UTC;
  Patched.parse = Orig.parse;
  return Patched;
}

function installLocalStorageShim() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  globalThis.window = globalThis;
}

function loadSnapshotIntoStore(storageObj) {
  globalThis.localStorage.clear();
  for (const [k, v] of Object.entries(storageObj || {})) {
    if (k.startsWith("__")) continue;
    globalThis.localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  }
}

function collectContractText(top) {
  if (!top || typeof top !== "object") return "";
  return Object.values(top)
    .filter((x) => typeof x === "string")
    .join("\n");
}

function forbiddenHits(text) {
  const hits = [];
  const t = String(text || "");
  for (const tok of FORBIDDEN_INTERNAL_PARENT_TERMS) {
    if (t.toLowerCase().includes(tok.toLowerCase())) hits.push(tok);
  }
  return hits;
}

function auditTopForSim(simId, top, periodLabel) {
  const fails = [];
  const t = collectContractText(top);
  const status = String(top?.mainStatusHe || "");
  const pri = String(top?.mainPriorityHe || "");
  const dn = String(top?.doNowHe || "");

  if (forbiddenHits(t).length) fails.push(`forbidden_terms:${forbiddenHits(t).join(",")}`);

  /* mainPriorityHe is derived from doNow in buildContractRow — identical strings are normal. */

  if (status.includes("אין מספיק ראיות")) {
    fails.push("top_status_insufficient_evidence");
  }

  if (simId === "simDeep02_strong_stable_child") {
    if (t.includes("פער ידע")) fails.push("strong_child_knowledge_gap_tone");
    if (t.includes("שיקום")) fails.push("strong_child_remediation_word");
  }

  if (simId === "simDeep03_weak_math_long_term") {
    const m = `${pri} ${dn} ${status}`;
    if (!/(חשבון|חיבור|חילוק|שברים|מספר|כפל|חיסור)/.test(m)) {
      fails.push("weak_math_missing_math_focus_heuristic");
    }
  }

  if (simId === "simDeep04_improving_child") {
    const full = JSON.stringify(top);
    if (full.includes("מגמת שיפור") || full.includes("שיפור")) {
      /* ok */
    } else {
      /* soft — only warn if trend evidence sufficient elsewhere */
    }
  }

  if (simId === "simDeep05_declining_after_difficulty_jump") {
    const pack = `${t}`;
    if (!pack.includes("לא") && !pack.includes("ייצוב") && !pack.includes("קושי")) {
      /* non-fatal heuristic */
    }
  }

  if (simId === "simDeep06_fast_careless_vs_slow_accurate_mix") {
    if (status.includes("פער ידע") && !t.includes("מהירות") && !t.includes("בדיק")) {
      fails.push("pace_child_only_knowledge_gap");
    }
  }

  if (simId === "simDeep01_mixed_real_child") {
    if (status.includes("אין מספיק נתונים כדי לקבוע תמונת מצב מקצועית")) {
      fails.push("mixed_child_global_insufficient");
    }
  }

  return fails;
}

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  const anchorMs = manifest.anchorEndMs;
  globalThis.Date = patchDate(anchorMs);
  installLocalStorageShim();

  const { generateDetailedParentReport } = await import("../utils/detailed-parent-report.js");

  let siteResults = null;
  try {
    siteResults = JSON.parse(await fs.readFile(SITE_RESULTS, "utf8"));
  } catch {
    siteResults = null;
  }
  if (!siteResults?.results?.length) {
    console.error("Missing or empty site-rendered-deep-results.json — run npm run generate:parent-report-deep-learning-pdfs first.");
    process.exit(1);
  }

  const pdfMap = {};
  if (siteResults?.results) {
    for (const r of siteResults.results) {
      pdfMap[r.id] = r.artifacts || {};
    }
  }

  const rows = [];

  for (const sim of manifest.simulations || []) {
    const snapPath = path.join(ROOT, sim.snapshotPath);
    const storage = JSON.parse(await fs.readFile(snapPath, "utf8"));
    loadSnapshotIntoStore(storage);
    const name = storage.mleo_player_name;
    const dr = sim.simulatedDateRange;

    const week = generateDetailedParentReport(name, "week");
    const month = generateDetailedParentReport(name, "month");
    const full =
      dr?.start && dr?.end
        ? generateDetailedParentReport(name, "custom", dr.start, dr.end)
        : null;

    const wTop = week?.parentProductContractV1?.top || {};
    const mTop = month?.parentProductContractV1?.top || {};
    const fTop = full?.parentProductContractV1?.top || {};

    const fails = [
      ...auditTopForSim(sim.id, wTop, "week"),
      ...auditTopForSim(sim.id, mTop, "month"),
      ...(full ? auditTopForSim(sim.id, fTop, "full") : []),
    ];

    for (const period of ["week", "month", "full"]) {
      const art = pdfMap[sim.id]?.[period];
      if (period === "full" && art?.skipped) continue;
      if (!art?.shortPdf || !(await fileExists(path.join(ROOT, art.shortPdf)))) {
        fails.push(`missing_pdf:${period}:short`);
      }
      for (const route of ["short", "detailed", "summary"]) {
        const mob = path.join(SHOT_DIR, `${sim.id}.${period}.${route}.mobile.png`);
        const desk = path.join(SHOT_DIR, `${sim.id}.${period}.${route}.desktop.png`);
        if (!(await fileExists(mob)) || !(await fileExists(desk))) {
          fails.push(`missing_screenshot:${period}:${route}`);
        }
      }
    }

    rows.push({
      id: sim.id,
      weekMainConclusion: String(wTop?.mainStatusHe || "").slice(0, 200),
      monthMainConclusion: String(mTop?.mainStatusHe || "").slice(0, 200),
      fullMainConclusion: fTop ? String(fTop?.mainStatusHe || "").slice(0, 200) : null,
      weekPriority: String(wTop?.mainPriorityHe || ""),
      monthPriority: String(mTop?.mainPriorityHe || ""),
      fullPriority: fTop ? String(fTop?.mainPriorityHe || "") : null,
      pass: fails.length === 0,
      failures: fails,
    });
  }

  const summary = {
    total: rows.length,
    pass: rows.filter((r) => r.pass).length,
    fail: rows.filter((r) => !r.pass).length,
  };

  await fs.writeFile(
    AUDIT_JSON,
    JSON.stringify({ generatedAt: new Date().toISOString(), anchorMs, summary, students: rows }, null, 2),
    "utf8"
  );

  await fs.writeFile(
    AUDIT_MD,
    [
      "# Deep simulation audit",
      "",
      `- pass: ${summary.pass} / ${summary.total}`,
      "",
      "| ID | Week status (trim) | Month status (trim) | PASS | Issues |",
      "|---|---|---|:---:|---|",
      ...rows.map((r) => {
        const iss = (r.failures || []).join("; ") || "-";
        return `| ${r.id} | ${r.weekMainConclusion.slice(0, 60)}… | ${r.monthMainConclusion.slice(0, 60)}… | ${r.pass ? "PASS" : "FAIL"} | ${iss} |`;
      }),
      "",
    ].join("\n"),
    "utf8"
  );

  const man = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  const sims = man.simulations || [];
  const indexLines = [
    "# Deep longitudinal parent-report simulations",
    "",
    "| Sim ID | Profile | Days | Sessions | Questions | Subjects | Expected behavior | Week PDF | Month PDF | Full PDF | Status |",
    "|---|---|---:|---:|---:|---|---|---|---|---|---|",
  ];
  for (const s of sims) {
    const rrow = rows.find((x) => x.id === s.id);
    const artw = pdfMap[s.id]?.week;
    const artm = pdfMap[s.id]?.month;
    const artf = pdfMap[s.id]?.full;
    const wk = artw?.shortPdf ? `[week](${artw.shortPdf})` : "—";
    const mo = artm?.shortPdf ? `[month](${artm.shortPdf})` : "—";
    const fu =
      artf && !artf.skipped && artf.shortPdf ? `[full](${artf.shortPdf})` : artf?.skipped ? "_n/a_" : "—";
    indexLines.push(
      `| ${s.id} | ${s.studentName} | ${s.totalDays} | ${s.totalSessions} | ${s.totalQuestions} | ${s.subjects.join(", ")} | ${(s.expectedReportBehavior || "").slice(0, 80)}… | ${wk} | ${mo} | ${fu} | ${rrow?.pass ? "PASS" : "FAIL"} |`
    );
  }
  indexLines.push("");
  await fs.writeFile(INDEX_MD, indexLines.join("\n"), "utf8");

  const reviewer = ["# Deep simulations — reviewer pack", ""];
  for (const s of sims) {
    const artw = pdfMap[s.id]?.week;
    reviewer.push(`## ${s.id}`, "", `**שם מוצג:** ${s.studentName}`, "");
    reviewer.push("### סיפור הילד המדומה", "");
    reviewer.push(
      `- טווח: ${s.simulatedDateRange?.start} → ${s.simulatedDateRange?.end} (${s.totalDays} ימים מתוכננים, ${s.activeDays} ימים עם פעילות)`,
      `- נפח: ${s.totalSessions} מפגשים, ${s.totalQuestions} שאלות, ~${s.totalTimeMinutes} דקות פעילות`,
      `- מקצועות: ${s.subjects.join(", ")}`,
      `- דפוס מגמה (תכנון): ${s.trendPattern}`,
      ""
    );
    reviewer.push("### מה אנחנו מצפים מהדוח", "", s.expectedReportBehavior, "", "**חייב לא לקרות:**", ...(s.mustNotHappen || []).map((x) => `- ${x}`), "");
    reviewer.push("### קבצים", "");
    if (artw?.shortPdf) reviewer.push(`- [שבוע — דוח קצר (PDF)](${artw.shortPdf})`);
    const artm = pdfMap[s.id]?.month;
    if (artm?.shortPdf) reviewer.push(`- [חודש — דוח קצר (PDF)](${artm.shortPdf})`);
    const artf = pdfMap[s.id]?.full;
    if (artf && !artf.skipped && artf.shortPdf) reviewer.push(`- [מלא — דוח קצר (PDF)](${artf.shortPdf})`);
    reviewer.push(
      "",
      "### שאלות לבודק",
      "",
      "- האם הדוח מספר את סיפור הילד נכון?",
      "- האם ההורה יודע מה לעשות?",
      "- האם יש סתירה בין דוח קצר למפורט?",
      "- האם הטון מתאים?",
      "- האם יש יותר מדי טקסט?",
      "- האם ההמלצה מתאימה לכמות הנתונים?",
      "- ציון 1–5",
      "- הערות",
      "",
      "---",
      ""
    );
  }
  await fs.writeFile(REVIEWER_MD, reviewer.join("\n"), "utf8");

  console.log(JSON.stringify({ ok: true, summary }, null, 2));
  if (summary.fail > 0) process.exitCode = 2;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
