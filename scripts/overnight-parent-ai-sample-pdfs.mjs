#!/usr/bin/env node
/**
 * Generates profile-labeled parent-report PDFs via Playwright (requires healthy Next dev server).
 * Usage: QA_BASE_URL=http://127.0.0.1:PORT node scripts/overnight-parent-ai-sample-pdfs.mjs --outDir <path>
 *
 * Reporting-only; does not change product behavior.
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const args = process.argv.slice(2);
let outDir = path.join(ROOT, "reports", "overnight-parent-ai-audit", "sample-pdfs-temp");
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--outDir" && args[i + 1]) {
    outDir = path.resolve(args[i + 1]);
    i++;
  }
}

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3001";

/** @returns {() => void} init script for Playwright */
function seedStrongStable() {
  const now = Date.now();
  return () => {
    localStorage.setItem("mleo_player_name", "OvernightStrong");
    localStorage.setItem(
      "mleo_time_tracking",
      JSON.stringify({
        operations: {
          addition: {
            sessions: Array.from({ length: 8 }, (_, i) => ({
              timestamp: now - i * 3600000,
              total: 24,
              correct: 22,
              mode: "learning",
              grade: "g4",
              level: "medium",
              duration: 400,
            })),
          },
        },
      })
    );
    localStorage.setItem("mleo_math_master_progress", JSON.stringify({ progress: { addition: { total: 400, correct: 360 } } }));
    localStorage.setItem("mleo_mistakes", JSON.stringify([]));
    localStorage.setItem(
      "mleo_geometry_time_tracking",
      JSON.stringify({
        topics: {
          perimeter: {
            sessions: Array.from({ length: 6 }, (_, i) => ({
              timestamp: now - i * 400000,
              total: 20,
              correct: 18,
              mode: "learning",
              grade: "g4",
              level: "hard",
              duration: 380,
            })),
          },
        },
      })
    );
    localStorage.setItem("mleo_geometry_master_progress", JSON.stringify({ progress: { perimeter: { total: 120, correct: 108 } } }));
    localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
    seedSixSubjectsMinimal(now);
  };
}

function seedSixSubjectsMinimal(now) {
  const mkTopic = (sessions) => ({ topics: { t1: { sessions } } });
  const one = (corr, tot) => [
    {
      timestamp: now,
      total: tot,
      correct: corr,
      mode: "learning",
      grade: "g3",
      level: "medium",
      duration: 300,
    },
  ];
  localStorage.setItem("mleo_english_time_tracking", JSON.stringify(mkTopic(one(8, 10))));
  localStorage.setItem("mleo_english_master_progress", JSON.stringify({ progress: { t1: { total: 50, correct: 42 } } }));
  localStorage.setItem("mleo_english_mistakes", JSON.stringify([]));
  localStorage.setItem("mleo_science_time_tracking", JSON.stringify(mkTopic(one(7, 10))));
  localStorage.setItem("mleo_science_master_progress", JSON.stringify({ progress: { t1: { total: 40, correct: 30 } } }));
  localStorage.setItem("mleo_science_mistakes", JSON.stringify([]));
  localStorage.setItem("mleo_hebrew_time_tracking", JSON.stringify(mkTopic(one(9, 11))));
  localStorage.setItem("mleo_hebrew_master_progress", JSON.stringify({ progress: { t1: { total: 44, correct: 38 } } }));
  localStorage.setItem("mleo_hebrew_mistakes", JSON.stringify([]));
  localStorage.setItem("mleo_moledet_geography_time_tracking", JSON.stringify(mkTopic(one(6, 9))));
  localStorage.setItem("mleo_moledet_geography_master_progress", JSON.stringify({ progress: { t1: { total: 36, correct: 28 } } }));
  localStorage.setItem("mleo_moledet_geography_mistakes", JSON.stringify([]));
}

function seedWeakImproving() {
  const now = Date.now();
  return () => {
    localStorage.setItem("mleo_player_name", "OvernightWeakImp");
    localStorage.setItem(
      "mleo_time_tracking",
      JSON.stringify({
        operations: {
          subtraction: {
            sessions: [
              { timestamp: now - 86400000 * 5, total: 12, correct: 4, mode: "practice", grade: "g3", level: "easy", duration: 200 },
              { timestamp: now - 86400000 * 2, total: 14, correct: 7, mode: "learning", grade: "g3", level: "medium", duration: 260 },
              { timestamp: now, total: 16, correct: 11, mode: "learning", grade: "g3", level: "medium", duration: 280 },
            ],
          },
        },
      })
    );
    localStorage.setItem("mleo_math_master_progress", JSON.stringify({ progress: { subtraction: { total: 90, correct: 52 } } }));
    localStorage.setItem("mleo_mistakes", JSON.stringify([]));
    localStorage.setItem("mleo_geometry_time_tracking", JSON.stringify({ topics: {} }));
    localStorage.setItem("mleo_geometry_master_progress", JSON.stringify({ progress: {} }));
    localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
    clearOtherSubjects();
  };
}

function seedVeryLittleData() {
  const now = Date.now();
  return () => {
    localStorage.setItem("mleo_player_name", "OvernightThin");
    localStorage.setItem(
      "mleo_time_tracking",
      JSON.stringify({
        operations: {
          addition: {
            sessions: [{ timestamp: now, total: 3, correct: 2, mode: "learning", grade: "g2", level: "easy", duration: 120 }],
          },
        },
      })
    );
    localStorage.setItem("mleo_math_master_progress", JSON.stringify({ progress: { addition: { total: 3, correct: 2 } } }));
    localStorage.setItem("mleo_mistakes", JSON.stringify([]));
    clearOtherSubjects();
  };
}

function seedSixSubjectMixed() {
  const now = Date.now();
  return () => {
    localStorage.setItem("mleo_player_name", "Overnight6Mix");
    localStorage.setItem(
      "mleo_time_tracking",
      JSON.stringify({
        operations: {
          division: {
            sessions: [{ timestamp: now, total: 11, correct: 7, mode: "learning", grade: "g4", level: "medium", duration: 340 }],
          },
        },
      })
    );
    localStorage.setItem("mleo_math_master_progress", JSON.stringify({ progress: { division: { total: 44, correct: 30 } } }));
    localStorage.setItem("mleo_mistakes", JSON.stringify([]));
    localStorage.setItem(
      "mleo_geometry_time_tracking",
      JSON.stringify({
        topics: {
          angles: {
            sessions: [{ timestamp: now - 1000, total: 9, correct: 6, mode: "learning", grade: "g4", level: "medium", duration: 310 }],
          },
        },
      })
    );
    localStorage.setItem("mleo_geometry_master_progress", JSON.stringify({ progress: { angles: { total: 36, correct: 24 } } }));
    localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
    seedSixSubjectsMinimal(now);
  };
}

function clearOtherSubjects() {
  ["mleo_geometry_time_tracking", "mleo_geometry_master_progress", "mleo_geometry_mistakes"].forEach((k) => localStorage.removeItem(k));
  ["english", "science", "hebrew", "moledet_geography"].forEach((sub) => {
    localStorage.removeItem(`mleo_${sub}_time_tracking`);
    localStorage.removeItem(`mleo_${sub}_master_progress`);
    localStorage.removeItem(`mleo_${sub}_mistakes`);
  });
}

/** Same visual report PDF as strong-stable; external Copilot flow is validated in simulations / JSON sidecar, not print surface. */
function seedExternalFlowReport() {
  return seedStrongStable();
}

const PROFILES = [
  { id: "strong-stable", seed: seedStrongStable },
  { id: "weak-but-improving", seed: seedWeakImproving },
  { id: "very-little-data", seed: seedVeryLittleData },
  { id: "six-subject-mixed", seed: seedSixSubjectMixed },
  { id: "external-question-flow-report-surface", seed: seedExternalFlowReport },
];

const pdfOpts = {
  format: "A4",
  printBackground: true,
  margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" },
  preferCSSPageSize: true,
};

async function assertInsightOrSkip(page, label, timeoutMs) {
  try {
    await page.waitForSelector(".parent-report-parent-ai-insight", { timeout: timeoutMs, state: "attached" });
    return true;
  } catch {
    console.warn(`[overnight-sample-pdfs] skip insight assertions for ${label} (timeout)`);
    return false;
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const summary = { baseUrl: base, profiles: [], ok: true };

  const browser = await chromium.launch({ headless: true });
  for (const p of PROFILES) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "he-IL" });
    await context.addInitScript(p.seed());
    const page = await context.newPage();
    const label = p.id;
    try {
      await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.evaluate(p.seed());

      await page.goto(`${base}/learning/parent-report-detailed`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await assertInsightOrSkip(page, `${label}-detailed`, 120000);
      await page.emulateMedia({ media: "print" });
      let buf = await page.pdf({ ...pdfOpts });
      const detailedPath = path.join(outDir, `${label}__parent-report-detailed-full.pdf`);
      fs.writeFileSync(detailedPath, buf);

      await page.goto(`${base}/learning/parent-report`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await assertInsightOrSkip(page, `${label}-short`, 120000);
      await page.emulateMedia({ media: "print" });
      buf = await page.pdf({ ...pdfOpts });
      const shortPath = path.join(outDir, `${label}__parent-report-short.pdf`);
      fs.writeFileSync(shortPath, buf);

      summary.profiles.push({ id: label, detailedPath, shortPath, status: "ok" });
    } catch (e) {
      summary.ok = false;
      summary.profiles.push({ id: label, status: "error", error: String(e?.message || e) });
    } finally {
      await context.close();
    }
  }
  await browser.close();

  fs.writeFileSync(path.join(outDir, "sample-pdfs-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log("overnight-parent-ai-sample-pdfs:", summary.ok ? "OK" : "PARTIAL", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
