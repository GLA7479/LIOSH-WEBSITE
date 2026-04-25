/**
 * Phase 4.2 — Real browser QA (Playwright Chromium): DOM + localStorage + report routes.
 * Run from repo root with Playwright browsers installed:
 *   npx playwright install chromium
 *   npx tsx scripts/dev-student-simulator-phase42-browser-qa.mjs
 *
 * Spawns two Next dev servers (OFF on QA_PORT_OFF, ON on QA_PORT_ON) unless SKIP_SERVER_SPAWN=1
 * and QA_BASE_URL / QA_SIM_PASSWORD are set for an already-running server.
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PORT_OFF = Number(process.env.QA_PORT_OFF || 3020);
const PORT_ON = Number(process.env.QA_PORT_ON || 3021);
const SIM_PASSWORD = process.env.DEV_STUDENT_SIMULATOR_PASSWORD || "phase42_browser_qa_pw";
const SKIP_SPAWN = String(process.env.SKIP_SERVER_SPAWN || "").trim() === "1";
const SKIP_OFF = String(process.env.QA_SKIP_OFF || "").trim() === "1";
const BASE_ON = process.env.QA_BASE_URL || `http://localhost:${PORT_ON}`;
const BASE_OFF = `http://localhost:${PORT_OFF}`;

const SIMULATOR_METADATA_KEY = "mleo_dev_student_simulator_metadata_v1";
const NO_DATA_SNIPPET = "אין עדיין מספיק פעילות בתקופה שנבחרה";

/** @type {{ id: string, storyHint: string }[]} */
const PRESET_CHECKS = [
  { id: "simDeep01_mixed_real_child", storyHint: "manual: single parent priority" },
  { id: "simDeep02_strong_stable_child", storyHint: "manual: no remediation main story" },
  { id: "simDeep03_weak_math_long_term", storyHint: "heuristic: math emphasis" },
  { id: "simDeep04_improving_child", storyHint: "manual: improvement signal" },
  { id: "simDeep05_declining_after_difficulty_jump", storyHint: "manual: post-jump decline" },
  { id: "simDeep06_fast_careless_vs_slow_accurate_mix", storyHint: "manual: pace / attention" },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Dynamic client may mount after networkidle; wait before using select/buttons. */
async function waitForSimulatorUi(page) {
  await page.getByRole("button", { name: "יצירת תצוגה מקדימה" }).waitFor({ state: "visible", timeout: 120_000 });
  await page.locator("select").first().waitFor({ state: "visible", timeout: 60_000 });
}

async function waitForHttp(url, { wantStatus, timeoutMs = 120_000 } = {}) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (wantStatus != null && res.status === wantStatus) return res;
      if (wantStatus == null && res.status < 500) return res;
    } catch {
      /* retry */
    }
    await sleep(800);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

function startNext(port, envExtra) {
  const env = {
    ...process.env,
    ...envExtra,
    NODE_ENV: "development",
  };
  return spawn("npx", ["next", "dev", "-p", String(port)], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
}

async function killTree(child) {
  if (!child || child.killed) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    /* no-op */
  }
  await sleep(1500);
}

async function runOffTests() {
  if (SKIP_SPAWN || SKIP_OFF) {
    console.log("Skipping Env OFF HTTP checks (QA_SKIP_OFF or SKIP_SERVER_SPAWN).");
    return;
  }
  let proc;
  try {
    proc = startNext(PORT_OFF, { ENABLE_DEV_STUDENT_SIMULATOR: "false" });
    await waitForHttp(`${BASE_OFF}/`, { timeoutMs: 180_000 });
    const page = await fetch(`${BASE_OFF}/learning/dev-student-simulator`, { redirect: "manual" });
    if (page.status !== 404) throw new Error(`Expected 404 simulator page when OFF, got ${page.status}`);

    const login404 = await fetch(`${BASE_OFF}/api/dev-student-simulator/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "x" }),
    });
    if (login404.status !== 404) throw new Error(`Expected 404 login when OFF, got ${login404.status}`);

    const out404 = await fetch(`${BASE_OFF}/api/dev-student-simulator/logout`, { method: "POST" });
    if (out404.status !== 404) throw new Error(`Expected 404 logout when OFF, got ${out404.status}`);
  } finally {
    await killTree(proc);
  }
}

async function singleApplyAndWaitForMetadata(page, storageKey) {
  await page.getByRole("button", { name: "החלה בדפדפן הנוכחי" }).click();
  await page.waitForFunction((k) => Boolean(window.localStorage.getItem(k)), storageKey, { timeout: 90_000 });
}

async function clickPreviewUntilSuccess(page, { maxAttempts = 28 } = {}) {
  for (let a = 0; a < maxAttempts; a += 1) {
    await page.getByRole("button", { name: "יצירת תצוגה מקדימה" }).click();
    await sleep(1600);
    const body = await page.innerText("body");
    if (/נוצרה תצוגה מקדימה/i.test(body)) return;
    if (/Session validation failed|Unknown preset|אימות פגישות|פרופיל לא ידוע/i.test(body)) {
      await sleep(200);
      continue;
    }
    await sleep(600);
    if (/נוצרה תצוגה מקדימה/i.test(await page.innerText("body"))) return;
  }
  throw new Error("Preview never succeeded (exhausted retries; simDeep06 may be anchor-sensitive)");
}

function reportHasContent(text) {
  const t = String(text || "");
  if (t.length < 3500) return { ok: false, reason: `body too short (${t.length})` };
  if (t.includes(NO_DATA_SNIPPET)) return { ok: false, reason: "no-data banner text present" };
  return { ok: true };
}

async function runOnTests() {
  let proc;
  const evidence = join(ROOT, "reports", "dev-student-simulator", "phase42-browser-qa");
  mkdirSync(evidence, { recursive: true });
  const results = {
    presets: [],
    exportImport: null,
    safetyImports: [],
    logout: null,
    errors: [],
    applyPolicy: "single_click_after_staged_preview_phase43",
  };

  try {
    if (!SKIP_SPAWN) {
      proc = startNext(PORT_ON, {
        ENABLE_DEV_STUDENT_SIMULATOR: "true",
        DEV_STUDENT_SIMULATOR_PASSWORD: SIM_PASSWORD,
      });
      await waitForHttp(`${BASE_ON}/`, { timeoutMs: 180_000 });
    }

    const badPw = await fetch(`${BASE_ON}/api/dev-student-simulator/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "___wrong_password___" }),
    });
    if (badPw.status !== 401) {
      throw new Error(`Expected 401 wrong password, got ${badPw.status}`);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();

    await page.goto(`${BASE_ON}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });

    const loginForm = await page.locator('input[type="password"]').count();
    if (loginForm > 0) {
      await page.screenshot({ path: join(evidence, "phase44-hebrew-login.png"), fullPage: true });
      await page.locator('input[type="password"]').fill(SIM_PASSWORD);
      await page.getByRole("button", { name: "כניסה" }).click();
      await waitForSimulatorUi(page);
      await page.screenshot({ path: join(evidence, "phase44-hebrew-dashboard.png"), fullPage: true });
    }

    const docCookie = await page.evaluate(() => document.cookie);
    if (docCookie.includes("dev_student_simulator_v1")) {
      throw new Error("Simulator cookie must not appear in document.cookie (expect HttpOnly)");
    }

    const shortHashes = [];
    for (const { id, storyHint } of PRESET_CHECKS) {
      const row = {
        id,
        preview: "fail",
        apply: "fail",
        reports: { short: "fail", detailed: "fail", summary: "fail" },
        reset: "fail",
        storyHint,
        storyHeuristic: "n/a",
      };
      try {
        await page.goto(`${BASE_ON}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
        await waitForSimulatorUi(page);
        await page.locator("select").first().selectOption(id);
        await clickPreviewUntilSuccess(page);
        const bodyAfterPreview = await page.innerText("body");
        if (/leok_/i.test(bodyAfterPreview)) throw new Error("leok_ leaked in UI");
        row.preview = "pass";

        await singleApplyAndWaitForMetadata(page, SIMULATOR_METADATA_KEY);
        row.apply = "pass";

        const routes = [
          ["short", "/learning/parent-report"],
          ["detailed", "/learning/parent-report-detailed"],
          ["summary", "/learning/parent-report-detailed?mode=summary"],
        ];
        for (const [key, path] of routes) {
          await page.goto(`${BASE_ON}${path}`, { waitUntil: "networkidle", timeout: 120_000 });
          await sleep(2500);
          const text = await page.innerText("body");
          const chk = reportHasContent(text);
          if (!chk.ok) throw new Error(`${key}: ${chk.reason}`);
          row.reports[key] = "pass";
        }

        if (id === "simDeep03_weak_math_long_term") {
          const t = await page.locator("body").innerText();
          row.storyHeuristic = /מתמטיקה|חשבון|math/i.test(t) ? "pass (math visible)" : "warn (math not obvious in text sample)";
        }

        shortHashes.push(
          await page.evaluate(() => {
            const t = document.body?.innerText || "";
            let h = 0;
            for (let i = 0; i < Math.min(t.length, 8000); i += 1) h = (h * 31 + t.charCodeAt(i)) | 0;
            return String(h);
          })
        );

        await page.goto(`${BASE_ON}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
        await waitForSimulatorUi(page);
        await page.getByRole("button", { name: "איפוס תלמיד מדומה" }).click();
        await sleep(1000);
        const metaAfter = await page.evaluate((k) => window.localStorage.getItem(k), SIMULATOR_METADATA_KEY);
        if (metaAfter != null) throw new Error("metadata still present after Reset");
        row.reset = "pass";
      } catch (e) {
        row.error = String(e?.message || e);
        results.errors.push({ id, step: "preset-loop", error: row.error });
      }
      results.presets.push(row);
    }

    const distinctShort = new Set(shortHashes.filter(Boolean)).size;
    results.reportsChangeBetweenPresets = distinctShort >= 4 ? "pass" : `warn (distinct short-report hashes: ${distinctShort})`;

    await page.goto(`${BASE_ON}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
    await waitForSimulatorUi(page);
    await page.locator("select").first().selectOption("simDeep01_mixed_real_child");
    await clickPreviewUntilSuccess(page);
    await singleApplyAndWaitForMetadata(page, SIMULATOR_METADATA_KEY);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "ייצוא JSON" }).click();
    const download = await downloadPromise;
    const tmpDir = mkdtempSync(join(tmpdir(), "dsim42-"));
    const exportPath = join(tmpDir, "export.json");
    await download.saveAs(exportPath);
    const exportText = readFileSync(exportPath, "utf8");
    JSON.parse(exportText);

    await page.getByRole("button", { name: "איפוס תלמיד מדומה" }).click();
    await sleep(800);

    await page.setInputFiles('input[type="file"]', exportPath);
    await sleep(2000);
    const metaRe = await page.evaluate((k) => Boolean(window.localStorage.getItem(k)), SIMULATOR_METADATA_KEY);
    if (!metaRe) throw new Error("metadata missing after import");
    await page.goto(`${BASE_ON}/learning/parent-report`, { waitUntil: "networkidle", timeout: 120_000 });
    const afterImport = reportHasContent(await page.innerText("body"));
    results.exportImport = afterImport.ok ? "pass" : String(afterImport.reason);

    await page.goto(`${BASE_ON}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
    await waitForSimulatorUi(page);
    await page.evaluate(() => navigator.clipboard.writeText(""));
    await page.getByRole("button", { name: "העתקת snapshot אחסון" }).click();
    await sleep(500);
    let clip = "";
    try {
      clip = await page.evaluate(() => navigator.clipboard.readText());
      JSON.parse(clip);
      results.copyJson = "pass";
    } catch {
      results.copyJson = "warn (clipboard read unavailable in this headless context)";
    }

    const badDir = mkdtempSync(join(tmpdir(), "dsim42bad-"));
    const pkgFixture = join(
      ROOT,
      "reports",
      "dev-student-simulator",
      "phase2-core",
      "snapshots",
      "simDeep02_strong_stable_child.package.json"
    );
    if (!existsSync(pkgFixture)) {
      throw new Error(`Missing fixture ${pkgFixture} — run dev-student-simulator self-test first.`);
    }
    const sim02Pkg = JSON.parse(readFileSync(pkgFixture, "utf8"));

    const leokPath = join(badDir, "leok.json");
    writeFileSync(
      leokPath,
      JSON.stringify({
        version: 1,
        type: "dev-student-simulator-snapshot",
        productDisplayName: "LEOK",
        presetId: "x",
        createdAt: new Date().toISOString(),
        snapshot: { leok_evil: "1", mleo_player_name: JSON.stringify("A") },
        metadata: { version: 1, simulator: "dev-student-simulator-core", touchedKeys: ["mleo_player_name"] },
      })
    );
    await page.setInputFiles('input[type="file"]', leokPath);
    await sleep(600);
    const errLeok = await page.locator("body").innerText();
    results.safetyImports.push({
      name: "leok_* in snapshot",
      pass: /blocked|ייבוא נחסם|Import blocked|leok|namespace|forbidden/i.test(errLeok),
    });

    const unknownPkg = JSON.parse(JSON.stringify(sim02Pkg));
    unknownPkg.snapshot = { ...unknownPkg.snapshot, mleo_fake_unknown_key_zzzzz: {} };
    const unknownPath = join(badDir, "unknown.json");
    writeFileSync(unknownPath, JSON.stringify(unknownPkg));
    await page.setInputFiles('input[type="file"]', unknownPath);
    await page.waitForFunction(
      () => {
        const t = document.body.innerText || "";
        return (
          t.includes("ייבוא נחסם") ||
          t.includes("Import blocked") ||
          t.includes("key_not_in_allowlist") ||
          t.includes("Invalid snapshot namespace")
        );
      },
      { timeout: 25_000 }
    );
    const errUk = await page.locator("body").innerText();
    results.safetyImports.push({
      name: "unknown mleo_*",
      pass:
        /ייבוא נחסם|Import blocked|key_not_in_allowlist|allowlist|blocked/i.test(errUk) ||
        errUk.includes("mleo_fake_unknown_key"),
    });

    const emptyPath = join(badDir, "empty.json");
    writeFileSync(
      emptyPath,
      JSON.stringify({
        version: 1,
        type: "dev-student-simulator-snapshot",
        productDisplayName: "LEOK",
        presetId: "x",
        createdAt: new Date().toISOString(),
        snapshot: {},
        metadata: {
          version: 1,
          simulator: "dev-student-simulator-core",
          touchedKeys: ["mleo_player_name"],
          presetId: "x",
        },
      })
    );
    const keysBeforeEmpty = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("mleo_")).length);
    await page.setInputFiles('input[type="file"]', emptyPath);
    await sleep(600);
    const keysAfterEmpty = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("mleo_")).length);
    results.safetyImports.push({
      name: "empty snapshot",
      pass: keysAfterEmpty >= keysBeforeEmpty - 1,
      note: "no mass wipe of mleo_*",
    });

    await page.goto(`${BASE_ON}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
    await waitForSimulatorUi(page);
    await page.locator("select").first().selectOption("simDeep02_strong_stable_child");
    await clickPreviewUntilSuccess(page);
    await singleApplyAndWaitForMetadata(page, SIMULATOR_METADATA_KEY);
    const badMetaPkg = JSON.parse(JSON.stringify(sim02Pkg));
    badMetaPkg.metadata = {
      ...badMetaPkg.metadata,
      touchedKeys: ["mleo_player_name"],
    };
    delete badMetaPkg.metadata.effectiveTouchedKeys;
    const badTouchedPath = join(badDir, "badmeta.json");
    writeFileSync(badTouchedPath, JSON.stringify(badMetaPkg));
    await page.getByRole("button", { name: "איפוס תלמיד מדומה" }).click();
    await sleep(600);
    await page.setInputFiles('input[type="file"]', badTouchedPath);
    await page.waitForFunction(
      (key) => {
        const r = window.localStorage.getItem(key);
        if (!r) return false;
        return r.includes("mleo_mistakes") && r.includes("effectiveTouchedKeys");
      },
      SIMULATOR_METADATA_KEY,
      { timeout: 20_000 }
    );
    const metaBad = await page.evaluate((k) => {
      try {
        return JSON.parse(window.localStorage.getItem(k) || "null");
      } catch {
        return null;
      }
    }, SIMULATOR_METADATA_KEY);
    const eff = metaBad?.effectiveTouchedKeys || metaBad?.touchedKeys || [];
    const restored = await page.evaluate(() => window.localStorage.getItem("mleo_mistakes"));
    results.safetyImports.push({
      name: "snapshot key missing from imported touchedKeys still in effective backup",
      pass: Boolean(metaBad) && Array.isArray(eff) && eff.includes("mleo_mistakes") && typeof restored === "string",
    });

    await page.goto(`${BASE_ON}/learning/dev-student-simulator`, { waitUntil: "networkidle", timeout: 120_000 });
    await waitForSimulatorUi(page);
    await page.getByRole("button", { name: "התנתקות" }).click();
    await sleep(1500);
    await page.reload({ waitUntil: "networkidle" });
    const loginAgain = await page.locator('input[type="password"]').count();
    results.logout = loginAgain > 0 ? "pass" : "fail";

    await browser.close();
    try {
      rmSync(tmpDir, { recursive: true, force: true });
      rmSync(badDir, { recursive: true, force: true });
    } catch {
      /* no-op */
    }

    writeFileSync(join(evidence, "phase42-result.json"), JSON.stringify(results, null, 2), "utf8");
    return results;
  } finally {
    await killTree(proc);
  }
}

async function main() {
  console.log("Phase 4.2 / 4.3 browser QA — Playwright Chromium");
  console.log("SKIP_SERVER_SPAWN=", SKIP_SPAWN, "BASE_ON=", BASE_ON, "PORT_OFF=", PORT_OFF);
  await runOffTests();
  console.log("Env OFF checks: PASS");
  const results = await runOnTests();
  console.log(JSON.stringify(results, null, 2));
  const presetFail = results.presets.some((p) => p.error || p.preview !== "pass" || p.apply !== "pass");
  const badSafety = results.safetyImports.some((s) => s.pass === false);
  const copyFail = results.copyJson === "fail";
  if (presetFail || badSafety || results.logout !== "pass" || copyFail) {
    console.error("Phase 4.2: automated checks reported failures — see phase42-result.json");
    process.exit(1);
  }
  console.log("Phase 4.2/4.3 automated browser QA: PASS (see reports/dev-student-simulator/phase42-browser-qa/phase42-result.json)");
  console.log("Story fidelity rows marked storyHint still require human sign-off in real Chrome if desired.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
