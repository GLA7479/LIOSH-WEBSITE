/**
 * Phase 10.4 — Site-rendered PDFs + screenshots for deep simulations.
 */
import fs from "fs/promises";
import path from "path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const BASE_URL = process.env.PARENT_REPORT_BASE_URL || "http://localhost:3001";
const DEEP = path.join(ROOT, "reports", "parent-report-learning-simulations", "deep");
const MANIFEST = path.join(DEEP, "deep-simulations-manifest.json");
const PDF_DIR = path.join(DEEP, "pdf");
const SHOT_DIR = path.join(DEEP, "screenshots");
const RESULT_JSON = path.join(DEEP, "site-rendered-deep-results.json");

const PERIODS = ["week", "month", "full"];

async function applyStorage(page, storageObj) {
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate((data) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(data || {})) {
      if (k.startsWith("__")) continue;
      localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
    }
  }, storageObj);
}

async function pdfRoute(page, outPath) {
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" },
  });
  await page.emulateMedia({ media: "screen" });
}

async function shotTop(page, outPath, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(400);
  await page.screenshot({ path: outPath, fullPage: false });
}

async function setShortReportPeriod(page, period, dateRange) {
  await page.goto(`${BASE_URL}/learning/parent-report`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  if (period === "week") {
    await page.getByRole("button", { name: "שבוע" }).click();
  } else if (period === "month") {
    await page.getByRole("button", { name: "חודש" }).click();
  } else if (period === "full" && dateRange?.start && dateRange?.end) {
    await page.getByRole("button", { name: "תאריכים מותאמים" }).click();
    const inputs = page.locator('input[type="date"]');
    await inputs.nth(0).fill(dateRange.start);
    await inputs.nth(1).fill(dateRange.end);
    await page.getByRole("button", { name: "הצג" }).click();
  }
  await page.waitForTimeout(900);
}

function detailedUrl(period, dateRange, summary) {
  const q = new URLSearchParams();
  q.set("period", period);
  if (period === "custom" && dateRange?.start && dateRange?.end) {
    q.set("start", dateRange.start);
    q.set("end", dateRange.end);
  }
  if (summary) q.set("mode", "summary");
  return `/learning/parent-report-detailed?${q.toString()}`;
}

async function captureOneSim(page, sim, storage) {
  await applyStorage(page, storage);
  const rel = {};
  const dateRange = sim.simulatedDateRange;
  const customRange =
    dateRange?.start && dateRange?.end
      ? { start: dateRange.start, end: dateRange.end }
      : null;

  for (const period of PERIODS) {
    if (period === "full" && !customRange) {
      rel[period] = { skipped: true, reason: "no_date_range_in_manifest" };
      continue;
    }

    const periodLabel = period;
    const detailedPeriod = period === "full" ? "custom" : period;
    const dr = period === "full" ? customRange : null;

    /* Short */
    await setShortReportPeriod(page, period === "full" ? "full" : period, customRange);
    await shotTop(page, path.join(SHOT_DIR, `${sim.id}.${periodLabel}.short.mobile.png`), {
      width: 360,
      height: 800,
    });
    await shotTop(page, path.join(SHOT_DIR, `${sim.id}.${periodLabel}.short.desktop.png`), {
      width: 1366,
      height: 768,
    });
    await page.setViewportSize({ width: 1366, height: 900 });
    await pdfRoute(page, path.join(PDF_DIR, `${sim.id}.${periodLabel}.short.site.pdf`));

    /* Detailed full */
    await page.goto(`${BASE_URL}${detailedUrl(detailedPeriod, dr, false)}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);
    await shotTop(page, path.join(SHOT_DIR, `${sim.id}.${periodLabel}.detailed.mobile.png`), {
      width: 360,
      height: 800,
    });
    await shotTop(page, path.join(SHOT_DIR, `${sim.id}.${periodLabel}.detailed.desktop.png`), {
      width: 1366,
      height: 768,
    });
    await page.setViewportSize({ width: 1366, height: 900 });
    await pdfRoute(page, path.join(PDF_DIR, `${sim.id}.${periodLabel}.detailed.site.pdf`));

    /* Summary */
    await page.goto(`${BASE_URL}${detailedUrl(detailedPeriod, dr, true)}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(800);
    await shotTop(page, path.join(SHOT_DIR, `${sim.id}.${periodLabel}.summary.mobile.png`), {
      width: 360,
      height: 800,
    });
    await shotTop(page, path.join(SHOT_DIR, `${sim.id}.${periodLabel}.summary.desktop.png`), {
      width: 1366,
      height: 768,
    });
    await page.setViewportSize({ width: 1366, height: 900 });
    await pdfRoute(page, path.join(PDF_DIR, `${sim.id}.${periodLabel}.summary.site.pdf`));

    rel[periodLabel] = {
      shortPdf: path.relative(ROOT, path.join(PDF_DIR, `${sim.id}.${periodLabel}.short.site.pdf`)).replace(/\\/g, "/"),
      detailedPdf: path.relative(ROOT, path.join(PDF_DIR, `${sim.id}.${periodLabel}.detailed.site.pdf`)).replace(/\\/g, "/"),
      summaryPdf: path.relative(ROOT, path.join(PDF_DIR, `${sim.id}.${periodLabel}.summary.site.pdf`)).replace(/\\/g, "/"),
    };
  }

  return rel;
}

async function main() {
  await fs.mkdir(PDF_DIR, { recursive: true });
  await fs.mkdir(SHOT_DIR, { recursive: true });
  const manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const sim of manifest.simulations || []) {
    const snapPath = path.join(ROOT, sim.snapshotPath);
    const storage = JSON.parse(await fs.readFile(snapPath, "utf8"));
    const rel = await captureOneSim(page, sim, storage);
    results.push({ id: sim.id, artifacts: rel });
  }

  await browser.close();
  await fs.writeFile(
    RESULT_JSON,
    JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: BASE_URL, results }, null, 2),
    "utf8"
  );
  console.log(JSON.stringify({ ok: true, sims: results.length, result: path.relative(ROOT, RESULT_JSON) }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
