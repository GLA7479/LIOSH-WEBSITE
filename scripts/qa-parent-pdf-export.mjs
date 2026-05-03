#!/usr/bin/env node
/**
 * Phase C.1 — Parent PDF / print proof (Playwright).
 * Requires a running dev server unless QA_BASE_URL points to a deployed instance.
 *
 * Proof:
 * - DOM: wait for `.parent-report-parent-ai-insight` (deterministic insight paints before async enrich).
 * - Print CSS: `.no-pdf` regions (incl. Parent Copilot) are display:none; insight is not hidden.
 * - Bytes: generated PDF contains Hebrew "תובנה … להורה" via pdf-parse text extraction.
 *
 * Usage: QA_BASE_URL=http://127.0.0.1:3001 npx tsx scripts/qa-parent-pdf-export.mjs
 */
import fs from "fs";
import path from "path";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { PDFParse } from "pdf-parse";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3001";

/** pdf-parse v2 (ESM): no default export; use PDFParse like scripts/hebrew-official-extract-excerpts.mjs */
async function extractPdfText(buf) {
  const parser = new PDFParse({ data: buf });
  try {
    const textResult = await parser.getText();
    return String(textResult?.text || "");
  } finally {
    await parser.destroy?.();
  }
}

const outDir = path.resolve(process.cwd(), "qa-visual-output");

function seedStorageScript() {
  return () => {
    try {
      const now = Date.now();
      localStorage.setItem("mleo_player_name", "PDFQA");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            addition: {
              sessions: [
                { timestamp: now, total: 22, correct: 16, mode: "learning", grade: "g3", level: "medium", duration: 460 },
                { timestamp: now - 120000, total: 14, correct: 8, mode: "practice", grade: "g3", level: "easy", duration: 260 },
              ],
            },
          },
        })
      );
      localStorage.setItem("mleo_math_master_progress", JSON.stringify({ progress: { addition: { total: 220, correct: 162 } } }));
      localStorage.setItem("mleo_mistakes", JSON.stringify([]));
      localStorage.setItem(
        "mleo_geometry_time_tracking",
        JSON.stringify({
          topics: {
            perimeter: {
              sessions: [{ timestamp: now, total: 18, correct: 12, mode: "learning", grade: "g4", level: "hard", duration: 390 }],
            },
          },
        })
      );
      localStorage.setItem("mleo_geometry_master_progress", JSON.stringify({ progress: { perimeter: { total: 66, correct: 45 } } }));
      localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
    } catch {
      // ignore seeding errors in QA context
    }
  };
}

/**
 * @param {Buffer} buf
 * @param {string} label
 */
async function assertPdfBufferContainsInsightHeading(buf, label) {
  const raw = await extractPdfText(buf);
  const t = raw.replace(/\s+/g, " ");
  assert.match(t, /תובנה\s+להורה/u, `${label}: extracted PDF text must include Parent AI heading`);
}

/** Copilot panel uses this placeholder; it must not appear in exported PDF text (Phase C.1). */
async function assertPdfBufferExcludesCopilotPlaceholder(buf, label) {
  const t = await extractPdfText(buf);
  assert.ok(!t.includes("שאלה על הדוח"), `${label}: PDF text must not include Parent Copilot chat placeholder`);
}

/**
 * Detailed report: insight mounted + Copilot wrapper uses `.no-pdf` (hidden in print).
 * @param {import('playwright').Page} page
 * @param {string} label
 */
async function assertDetailedInsightAndCopilotPrintBehavior(page, label) {
  await page.waitForSelector(".parent-report-parent-ai-insight", { timeout: 90_000 });
  const card = page.locator(".parent-report-parent-ai-insight").first();
  await assert.match(await card.innerText(), /תובנה/, `${label}: insight card text`);

  await page.emulateMedia({ media: "print" });
  const printStats = await page.evaluate(() => {
    const noPdf = Array.from(document.querySelectorAll(".no-pdf"));
    const displays = noPdf.map((n) => window.getComputedStyle(n).display);
    const hiddenOk = displays.length > 0 && displays.every((d) => d === "none");
    const insightEl = document.querySelector(".parent-report-parent-ai-insight");
    const insightDisplay = insightEl ? window.getComputedStyle(insightEl).display : "missing";
    return { noPdfCount: noPdf.length, hiddenOk, insightDisplay };
  });
  assert.ok(printStats.hiddenOk, `${label}: all .no-pdf regions must be display:none in print (${JSON.stringify(printStats)})`);
  assert.notEqual(printStats.insightDisplay, "none", `${label}: insight must not be hidden in print`);

  await page.emulateMedia({ media: "screen" });
}

/** Short report: wait for insight (async enrich may still apply; often fast). */
async function assertShortInsightVisible(page, label) {
  await page.waitForSelector(".parent-report-parent-ai-insight", { timeout: 90_000 });
  const txt = await page.locator(".parent-report-parent-ai-insight").first().innerText();
  assert.match(txt, /תובנה/, `${label}: short report insight`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "he-IL" });
  await context.addInitScript(seedStorageScript());
  const page = await context.newPage();

  const pdfOpts = {
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" },
    preferCSSPageSize: true,
  };

  await page.goto(`${base}/learning/parent-report-detailed`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await assertDetailedInsightAndCopilotPrintBehavior(page, "detailed-full");
  /* Playwright PDF uses current media; assert* ends in screen mode — re-enter print so .no-pdf applies. */
  await page.emulateMedia({ media: "print" });
  let buf = await page.pdf({ ...pdfOpts });
  const fullPath = path.join(outDir, "parent-detailed-full.pdf");
  fs.writeFileSync(fullPath, buf);
  await assertPdfBufferContainsInsightHeading(buf, "detailed-full pdf");
  await assertPdfBufferExcludesCopilotPlaceholder(buf, "detailed-full pdf");

  await page.goto(`${base}/learning/parent-report-detailed?mode=summary`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await assertDetailedInsightAndCopilotPrintBehavior(page, "detailed-summary");
  await page.emulateMedia({ media: "print" });
  buf = await page.pdf({ ...pdfOpts });
  const summaryPath = path.join(outDir, "parent-detailed-summary.pdf");
  fs.writeFileSync(summaryPath, buf);
  await assertPdfBufferContainsInsightHeading(buf, "detailed-summary pdf");
  await assertPdfBufferExcludesCopilotPlaceholder(buf, "detailed-summary pdf");

  await page.goto(`${base}/learning/parent-report`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await assertShortInsightVisible(page, "short-report");
  await page.emulateMedia({ media: "print" });
  buf = await page.pdf({ ...pdfOpts });
  const parentPath = path.join(outDir, "parent-report-main.pdf");
  fs.writeFileSync(parentPath, buf);
  await assertPdfBufferContainsInsightHeading(buf, "short-report pdf");
  await assertPdfBufferExcludesCopilotPlaceholder(buf, "short-report pdf");

  await browser.close();
  console.log("Phase C.1 PDF gate OK", fullPath, summaryPath, parentPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
