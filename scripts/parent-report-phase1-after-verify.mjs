/**
 * One-off: load a learning-simulation storage snapshot, open parent report pages with custom
 * period, write PDFs + PNG + body text to reports/parent-report-phase1-after/.
 * Requires: `npm run dev` (or QA_BASE_URL) on port 3001 by default.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "reports", "parent-report-phase1-after");
const BASE_URL = process.env.QA_BASE_URL || "http://localhost:3001";
const DEFAULT_SNAP = join(
  ROOT,
  "reports",
  "parent-report-learning-simulations",
  "snapshots",
  "sim12_mixed_realistic_student.storage.json"
);
const SNAPSHOT = process.env.PHASE1_VERIFY_SNAPSHOT || DEFAULT_SNAP;
const Q =
  "period=custom&start=2026-04-17&end=2026-04-25";

async function applyStorageInit(page, storageSnapshot) {
  await page.addInitScript((snap) => {
    try {
      Object.entries(snap || {}).forEach(([k, v]) => {
        const raw = typeof v === "string" ? v : JSON.stringify(v);
        window.localStorage.setItem(k, raw);
      });
    } catch (e) {
      console.error(e);
    }
  }, storageSnapshot);
}

const ROUTES = [
  { name: "short", path: `/learning/parent-report?${Q}`, pdf: "short-report-after.pdf", shot: "short-report-after.png", txt: "short-report-after.txt" },
  { name: "detailed", path: `/learning/parent-report-detailed?${Q}`, pdf: "detailed-report-after.pdf", shot: "detailed-report-after.png", txt: "detailed-report-after.txt" },
  {
    name: "summary",
    path: `/learning/parent-report-detailed?${Q}&mode=summary`,
    pdf: "summary-report-after.pdf",
    shot: "summary-report-after.png",
    txt: "summary-report-after.txt",
  },
];
const STANDALONE_ZERO_LEAK_RE = /(?<![#0-9])00000(?![0-9])/g;
const RAW_ENUM_RE = /\b(knowledge_gap|withhold|probe_only|actionState|canonical|outputGating|rowSignals)\b/;

async function main() {
  const raw = await readFile(SNAPSHOT, "utf8");
  const storage = JSON.parse(raw);
  await mkdir(OUT, { recursive: true });
  const meta = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    snapshot: SNAPSHOT.replace(/\\/g, "/"),
    query: Q,
  };
  await writeFile(join(OUT, "run-meta.json"), JSON.stringify(meta, null, 2), "utf8");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await applyStorageInit(page, storage);
  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });

  for (const r of ROUTES) {
    const url = `${BASE_URL}${r.path}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText();
    await writeFile(join(OUT, r.txt), body, "utf8");
    if (r.name === "detailed" || r.name === "summary") {
      assert.ok(!STANDALONE_ZERO_LEAK_RE.test(body), `${r.name}: standalone 00000 leaked`);
      assert.ok(!body.includes("דוגמה לכל סוג"), `${r.name}: demo taxonomy leak`);
      assert.ok(!RAW_ENUM_RE.test(body), `${r.name}: raw enum/internal token leak`);
    }
    await page.screenshot({ path: join(OUT, r.shot), fullPage: true });
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: join(OUT, r.pdf),
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" },
    });
    await page.emulateMedia({ media: "screen" });
  }

  await browser.close();
  console.log("OK:", OUT.replace(/\\/g, "/"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
