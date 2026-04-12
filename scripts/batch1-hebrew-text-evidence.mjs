/**
 * צילומי הוכחה — Batch עברית 2 (טקסט בלבד, אותו layout).
 * דורש dev server. הרצה: npx tsx scripts/batch1-hebrew-text-evidence.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const outDir = path.join(ROOT, "qa-evidence-audit");

function seedHighMultCaution() {
  return () => {
    const now = Date.now();
    const mkWrong = (i) => ({
      operation: "multiplication",
      isCorrect: false,
      patternFamily: "multiplication",
      timestamp: now - i * 120_000,
      total: 1,
      correct: 0,
    });
    try {
      localStorage.setItem("mleo_player_name", "HebrewEvidenceA");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            multiplication: {
              sessions: [
                {
                  timestamp: now - 86_400_000,
                  total: 50,
                  correct: 47,
                  mode: "learning",
                  grade: "g4",
                  level: "medium",
                  duration: 4800,
                },
              ],
            },
            addition: {
              sessions: [
                {
                  timestamp: now - 50_000_000,
                  total: 15,
                  correct: 14,
                  mode: "learning",
                  grade: "g4",
                  level: "medium",
                  duration: 900,
                },
              ],
            },
          },
        })
      );
      localStorage.setItem(
        "mleo_math_master_progress",
        JSON.stringify({
          progress: { multiplication: { total: 200, correct: 180 }, addition: { total: 100, correct: 90 } },
          stars: 3,
          xp: 120,
          playerLevel: 5,
          badges: ["מתמטיקאי מתחיל"],
        })
      );
      localStorage.setItem("mleo_mistakes", JSON.stringify(Array.from({ length: 10 }, (_, i) => mkWrong(i))));
      localStorage.setItem("mleo_geometry_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_geometry_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_geometry_mistakes", "[]");
      localStorage.setItem("mleo_english_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_english_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_english_mistakes", "[]");
      localStorage.setItem("mleo_science_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_science_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_science_mistakes", "[]");
      localStorage.setItem("mleo_hebrew_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_hebrew_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_hebrew_mistakes", "[]");
      localStorage.setItem("mleo_moledet_geography_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_moledet_geography_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_moledet_geography_mistakes", "[]");
    } catch (_) {}
  };
}

/** חיבור בולט בדוח המקיף לצילום הוכחה */
function seedAdditionProminent() {
  return () => {
    const now = Date.now();
    const mkWrongMult = (i) => ({
      operation: "multiplication",
      isCorrect: false,
      patternFamily: "multiplication",
      timestamp: now - i * 90_000,
      total: 1,
      correct: 0,
    });
    try {
      localStorage.setItem("mleo_player_name", "HebrewEvidenceAdd");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            addition: {
              sessions: [
                {
                  timestamp: now - 80_000_000,
                  total: 40,
                  correct: 38,
                  mode: "learning",
                  grade: "g4",
                  level: "medium",
                  duration: 4000,
                },
              ],
            },
            multiplication: {
              sessions: [
                {
                  timestamp: now - 70_000_000,
                  total: 28,
                  correct: 22,
                  mode: "learning",
                  grade: "g4",
                  level: "medium",
                  duration: 2600,
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
            addition: { total: 220, correct: 205 },
            multiplication: { total: 120, correct: 85 },
          },
          stars: 3,
          xp: 110,
          playerLevel: 5,
          badges: [],
        })
      );
      localStorage.setItem("mleo_mistakes", JSON.stringify(Array.from({ length: 8 }, (_, i) => mkWrongMult(i))));
      localStorage.setItem("mleo_geometry_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_geometry_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_geometry_mistakes", "[]");
      localStorage.setItem("mleo_english_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_english_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_english_mistakes", "[]");
      localStorage.setItem("mleo_science_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_science_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_science_mistakes", "[]");
      localStorage.setItem("mleo_hebrew_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_hebrew_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_hebrew_mistakes", "[]");
      localStorage.setItem("mleo_moledet_geography_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_moledet_geography_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_moledet_geography_mistakes", "[]");
    } catch (_) {}
  };
}

function seedWeakSubtraction() {
  return () => {
    const now = Date.now();
    const mkWrong = (i) => ({
      operation: "subtraction",
      isCorrect: false,
      patternFamily: "subtraction",
      timestamp: now - i * 120_000,
      total: 1,
      correct: 0,
    });
    try {
      localStorage.setItem("mleo_player_name", "HebrewEvidenceWeak");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            subtraction: {
              sessions: [
                {
                  timestamp: now - 86_400_000,
                  total: 24,
                  correct: 10,
                  mode: "learning",
                  grade: "g4",
                  level: "medium",
                  duration: 3600,
                },
              ],
            },
            addition: {
              sessions: [
                {
                  timestamp: now - 50_000_000,
                  total: 12,
                  correct: 11,
                  mode: "learning",
                  grade: "g4",
                  level: "medium",
                  duration: 800,
                },
              ],
            },
          },
        })
      );
      localStorage.setItem(
        "mleo_math_master_progress",
        JSON.stringify({
          progress: { subtraction: { total: 80, correct: 35 }, addition: { total: 100, correct: 90 } },
          stars: 2,
          xp: 80,
          playerLevel: 4,
          badges: [],
        })
      );
      localStorage.setItem("mleo_mistakes", JSON.stringify(Array.from({ length: 10 }, (_, i) => mkWrong(i))));
      localStorage.setItem("mleo_geometry_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_geometry_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_geometry_mistakes", "[]");
      localStorage.setItem("mleo_english_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_english_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_english_mistakes", "[]");
      localStorage.setItem("mleo_science_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_science_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_science_mistakes", "[]");
      localStorage.setItem("mleo_hebrew_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_hebrew_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_hebrew_mistakes", "[]");
      localStorage.setItem("mleo_moledet_geography_time_tracking", JSON.stringify({ topics: {} }));
      localStorage.setItem(
        "mleo_moledet_geography_master_progress",
        JSON.stringify({ progress: {}, stars: 0, xp: 0, playerLevel: 1, badges: [] })
      );
      localStorage.setItem("mleo_moledet_geography_mistakes", "[]");
    } catch (_) {}
  };
}

async function grab(baseUrl, init, urlPath, outName, check) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "he-IL" });
  await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const b = baseUrl.replace(/\/$/, "");
  await page.goto(`${b}${urlPath}`, { waitUntil: "load", timeout: 45000 });
  await page.waitForTimeout(5500);
  if (check) await check(page);
  await page.screenshot({ path: path.join(outDir, outName), fullPage: true });
  await browser.close();
}

function parseBaseUrlArg() {
  const a = process.argv[2];
  if (a && /^https?:\/\//i.test(a)) {
    return a.replace(/\/$/, "");
  }
  const env = process.env.PARENT_REPORT_E2E_BASE || process.env.E2E_BASE_URL;
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/$/, "");
  return null;
}

async function resolveBaseUrl() {
  const fromArg = parseBaseUrlArg();
  if (fromArg) return fromArg;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    try {
      localStorage.setItem("mleo_player_name", "Probe");
      localStorage.setItem(
        "mleo_time_tracking",
        JSON.stringify({
          operations: {
            addition: {
              sessions: [
                {
                  timestamp: Date.now() - 3_600_000,
                  total: 5,
                  correct: 5,
                  mode: "learning",
                  grade: "g4",
                  level: "easy",
                  duration: 300,
                },
              ],
            },
          },
        })
      );
    } catch (_) {}
  });
  const ports = [3003, 3002, 3001, 3000, 3004, 3005, 3006, 3007];
  for (const p of ports) {
    try {
      await page.goto(`http://127.0.0.1:${p}/learning/parent-report?period=week`, {
        waitUntil: "domcontentloaded",
        timeout: 6000,
      });
      await page.waitForTimeout(1200);
      const hasHe = await page
        .getByText("דוח להורים", { exact: false })
        .first()
        .isVisible()
        .catch(() => false);
      if (!hasHe) continue;
      await page.waitForSelector("#parent-report-pdf", { timeout: 25000 });
      await browser.close();
      return `http://127.0.0.1:${p}`;
    } catch (_) {
      /* ניסיון פורט הבא */
    }
  }
  await browser.close();
  return null;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const baseUrl = await resolveBaseUrl();
  if (!baseUrl) throw new Error("no dev server (הרץ next dev או העבר PARENT_REPORT_E2E_BASE)");

  await grab(
    baseUrl,
    seedHighMultCaution(),
    "/learning/parent-report?period=week",
    "batch2-hebrew-regular-mult.png",
    async (page) => {
      const t = await page.locator(".parent-report-recommendations-print").first().innerText();
      if (!/שליטה טובה|כשיש טעות/.test(t)) throw new Error("regular: expected new Hebrew lead");
    }
  );

  await grab(
    baseUrl,
    seedHighMultCaution(),
    "/learning/parent-report-detailed?period=week",
    "batch2-hebrew-detailed-mult.png",
    async (page) => {
      const t = await page.locator("#parent-report-detailed-print, body").first().innerText();
      if (!t.includes("כפל") && !t.includes("חשבון")) throw new Error("detailed: expected math context");
    }
  );

  await grab(
    baseUrl,
    seedAdditionProminent(),
    "/learning/parent-report-detailed?period=week",
    "batch2-hebrew-detailed-addition.png",
    async (page) => {
      const t = await page.locator("#parent-report-detailed-print, body").first().innerText();
      if (!t.includes("חיבור")) throw new Error("detailed-add: expected חיבור");
    }
  );

  console.log("OK wrote", path.join(outDir, "batch2-hebrew-*.png"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
