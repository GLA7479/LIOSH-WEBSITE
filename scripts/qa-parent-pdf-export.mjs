import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
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

async function exportPdf(page, name) {
  const pdfPath = path.join(outDir, name);
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" },
    preferCSSPageSize: true,
  });
  return pdfPath;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "he-IL" });
  await context.addInitScript(seedStorageScript());
  const page = await context.newPage();

  await page.goto(`${base}/learning/parent-report-detailed`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2000);
  const fullPath = await exportPdf(page, "parent-detailed-full.pdf");

  await page.goto(`${base}/learning/parent-report-detailed?mode=summary`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(1500);
  const summaryPath = await exportPdf(page, "parent-detailed-summary.pdf");

  await browser.close();
  console.log("OK", fullPath, summaryPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
