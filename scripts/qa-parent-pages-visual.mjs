/**
 * Headless visual QA: screenshots at multiple viewports + print media.
 * Requires Next.js on http://127.0.0.1:3000 and localStorage player name.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "qa-visual-output");
const base = process.env.QA_BASE_URL || "http://127.0.0.1:3000";

const viewports = [
  ["m360", 360, 800],
  ["m390", 390, 844],
  ["tab768", 768, 1024],
  ["d1366", 1366, 768],
  ["d1440", 1440, 900],
];

async function shot(page, name, fullPage = true) {
  const p = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: p, fullPage });
  return p;
}

async function gotoReport(page, pathSuffix) {
  await page.goto(`${base}${pathSuffix}`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForTimeout(2000);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  for (const [label, w, h] of viewports) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      locale: "he-IL",
    });
    await context.addInitScript(() => {
      try {
        const now = Date.now();
        localStorage.setItem("mleo_player_name", "VisualQA");
        localStorage.setItem(
          "mleo_time_tracking",
          JSON.stringify({
            operations: {
              addition: {
                sessions: [
                  {
                    timestamp: now,
                    total: 18,
                    correct: 16,
                    mode: "learning",
                    grade: "g3",
                    level: "medium",
                    duration: 420,
                  },
                  {
                    timestamp: now - 60_000,
                    total: 10,
                    correct: 4,
                    mode: "practice",
                    grade: "g3",
                    level: "easy",
                    duration: 200,
                  },
                ],
              },
            },
          })
        );
        localStorage.setItem(
          "mleo_math_master_progress",
          JSON.stringify({
            progress: {
              addition: { total: 200, correct: 150 },
            },
          })
        );
        localStorage.setItem("mleo_mistakes", JSON.stringify([]));
        localStorage.setItem(
          "mleo_geometry_time_tracking",
          JSON.stringify({
            topics: {
              perimeter: {
                sessions: [
                  {
                    timestamp: now,
                    total: 14,
                    correct: 11,
                    mode: "learning",
                    grade: "g4",
                    level: "hard",
                    duration: 360,
                  },
                ],
              },
            },
          })
        );
        localStorage.setItem(
          "mleo_geometry_master_progress",
          JSON.stringify({
            progress: {
              perimeter: { total: 50, correct: 40 },
            },
          })
        );
        localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
      } catch (_) {}
    });
    const page = await context.newPage();

    await gotoReport(page, "/learning/parent-report");
    await shot(page, `${label}__parent-report`);

    await gotoReport(page, "/learning/parent-report-detailed");
    await shot(page, `${label}__parent-detailed`);

    await page.emulateMedia({ media: "print" });
    await shot(page, `${label}__parent-detailed__printmedia`);
    await page.emulateMedia({ media: "screen" });

    await gotoReport(page, "/learning/parent-report-detailed?mode=summary");
    await shot(page, `${label}__parent-detailed__summarymode`);

    await context.close();
  }

  const ctx2 = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: "he-IL",
  });
  await ctx2.addInitScript(() => {
    try {
      const now = Date.now();
      localStorage.setItem("mleo_player_name", "VisualQA");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            addition: {
              sessions: [
                {
                  timestamp: now,
                  total: 18,
                  correct: 16,
                  mode: "learning",
                  grade: "g3",
                  level: "medium",
                  duration: 420,
                },
                {
                  timestamp: now - 60_000,
                  total: 10,
                  correct: 4,
                  mode: "practice",
                  grade: "g3",
                  level: "easy",
                  duration: 200,
                },
              ],
            },
          },
        })
      );
      localStorage.setItem(
        "mleo_math_master_progress",
        JSON.stringify({
          progress: { addition: { total: 200, correct: 150 } },
        })
      );
      localStorage.setItem("mleo_mistakes", JSON.stringify([]));
      localStorage.setItem(
        "mleo_geometry_time_tracking",
        JSON.stringify({
          topics: {
            perimeter: {
              sessions: [
                {
                  timestamp: now,
                  total: 14,
                  correct: 11,
                  mode: "learning",
                  grade: "g4",
                  level: "hard",
                  duration: 360,
                },
              ],
            },
          },
        })
      );
      localStorage.setItem(
        "mleo_geometry_master_progress",
        JSON.stringify({
          progress: { perimeter: { total: 50, correct: 40 } },
        })
      );
      localStorage.setItem("mleo_geometry_mistakes", JSON.stringify([]));
    } catch (_) {}
  });
  const p2 = await ctx2.newPage();
  await gotoReport(p2, "/learning/parent-report");
  await p2.emulateMedia({ media: "print" });
  await shot(p2, "d1366__parent-report__printmedia");
  await ctx2.close();

  await browser.close();
  console.log("OK", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
