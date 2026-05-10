#!/usr/bin/env node
/**
 * Render release gate — lightweight browser smoke for learning + parent-report surfaces.
 * npm run qa:learning-simulator:render
 *
 * Env:
 *   RENDER_GATE_BASE_URL — default http://127.0.0.1:3001
 *   RENDER_GATE_TRUST_EXISTING_SERVER — if "1", reuse listener at BASE_URL when it responds like Next.js (default off: always spawn a fresh dev server on a free port when auto-starting — avoids stale listeners / chunk 404s on :3001).
 *   RENDER_GATE_AUTO_SERVER — if "0", do not spawn dev server (expect server already up)
 *   RENDER_GATE_BROWSER — if "0", skip Playwright and run SSR fallback only (browserMode false)
 *   RENDER_GATE_SERVER_WAIT_MS — max wait for first HTTP from auto-started dev (default 300000)
 *   When RENDER_GATE_BASE_URL is unset, a free TCP port is chosen so EADDRINUSE on 3001 is avoided.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readdirSync } from "node:fs";
import { createServer } from "node:net";

/** Avoid spawn(\"npm\") without shell on Windows (EINVAL); prefer node + npx-cli.js like overnight-utils. */
function npxCliPath() {
  const nextToNode = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
  if (existsSync(nextToNode)) return nextToNode;
  if (process.platform === "win32") {
    const pf = process.env.ProgramFiles || "C:\\Program Files";
    const sys = join(pf, "nodejs", "node_modules", "npm", "bin", "npx-cli.js");
    if (existsSync(sys)) return sys;
  }
  return null;
}

function nodeExeForNpm() {
  if (process.platform === "win32") {
    const pf = process.env.ProgramFiles || "C:\\Program Files";
    const sysNode = join(pf, "nodejs", "node.exe");
    if (existsSync(sysNode)) return sysNode;
  }
  return process.execPath;
}

/** First webpack compile on cold start can exceed 2 minutes on Windows. */
const SERVER_BOOT_WAIT_MS = Number(process.env.RENDER_GATE_SERVER_WAIT_MS || 300_000);

function findFreePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      try {
        const addr = s.address();
        const p = typeof addr === "object" && addr ? addr.port : 0;
        s.close(() => resolve(p || 3000));
      } catch (e) {
        reject(e);
      }
    });
    s.on("error", reject);
  });
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "learning-simulator");
const OUT_JSON = join(OUT_DIR, "render-release-gate.json");
const OUT_MD = join(OUT_DIR, "render-release-gate.md");
const AUDIT_JSON = join(OUT_DIR, "render-release-gate-audit.json");
const AUDIT_MD = join(OUT_DIR, "render-release-gate-audit.md");
const FAILURE_ART_DIR = join(OUT_DIR, "render-release-gate", "failures");

const PORT = Number(process.env.PORT || process.env.RENDER_GATE_PORT || 3001);
const BASE_URL = process.env.RENDER_GATE_BASE_URL || `http://127.0.0.1:${PORT}`;
const AUTO_SERVER = process.env.RENDER_GATE_AUTO_SERVER !== "0";
const FORCE_NO_BROWSER = process.env.RENDER_GATE_BROWSER === "0";

/** Console messages treated as non-fatal noise (documented). */
const CONSOLE_WHITELIST = [/Download the React DevTools/i, /\[@faker-js/i];

function consoleAllowed(text) {
  const t = String(text || "");
  return CONSOLE_WHITELIST.some((re) => re.test(t));
}

function collectE2eFiles(dir, acc) {
  if (!existsSync(dir)) return;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) collectE2eFiles(p, acc);
    else if (/\.(spec|test)\.[tj]s$/.test(ent.name)) acc.push(p.replace(/\\/g, "/").replace(`${ROOT.replace(/\\/g, "/")}/`, ""));
  }
}

async function discoverInfrastructureAudit() {
  const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
  const hasPlaywright =
    !!(pkg.devDependencies?.["@playwright/test"] || pkg.devDependencies?.playwright);
  const hasPwConfig = existsSync(join(ROOT, "playwright.config.ts"));
  const e2eAcc = [];
  collectE2eFiles(join(ROOT, "tests", "e2e"), e2eAcc);
  const e2eFiles = e2eAcc.sort();

  const reportRoutes = [
    "/learning/parent-report",
    "/learning/parent-report-detailed",
    "/learning/parent-report-detailed.renderable",
    "/learning/dev-db-report-preview",
  ];
  const learningRoutes = ["/learning", "/learning/curriculum", "/learning/math-master", "/learning/science-master"];

  return {
    generatedAt: new Date().toISOString(),
    isPlaywrightInstalled: hasPlaywright,
    hasPlaywrightConfig: hasPwConfig,
    existingE2ETests: e2eFiles,
    existingReportRoutes: reportRoutes,
    existingLearningRoutes: learningRoutes,
    existingPDFExportPaths: [
      "Client-side: utils/math-report-generator exportReportToPDF used from pages/learning/parent-report.js (no dedicated /api/pdf route)",
    ],
    existingParentReportRenderComponents: [
      "components/parent-report-detailed-surface.jsx",
      "components/parent-report-short-contract-preview.jsx",
      "components/parent-report-contract-ui-blocks.jsx",
      "scripts/parent-report-pages-ssr.mjs (SSR smoke, no browser)",
    ],
    recommendedMinimalGate: [
      "Playwright chromium against next dev for /learning/* + parent-report with seeded simulator storage",
      "Fallback: tsx scripts/parent-report-pages-ssr.mjs if browser unavailable",
    ],
    risks: [
      "Dev server startup time; port conflicts",
      "Parent report depends on localStorage shape from aggregate simulator artifacts",
      "PDF generation is in-page (html2pdf/jspdf) — full PDF binary validation not in scope",
    ],
  };
}

async function writeAuditArtifacts(audit) {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(AUDIT_JSON, JSON.stringify(audit, null, 2), "utf8");
  const md = [
    "# Render release gate — infrastructure audit",
    "",
    `- Generated at: ${audit.generatedAt}`,
    "",
    "| Question | Answer |",
    "| --- | --- |",
    `| Playwright installed (package.json) | **${audit.isPlaywrightInstalled ? "yes" : "no"}** |`,
    `| playwright.config.ts | **${audit.hasPlaywrightConfig ? "yes" : "no"}** |`,
    "",
    "## E2E tests discovered",
    "",
    ...(audit.existingE2ETests.length ? audit.existingE2ETests.map((x) => `- \`${x}\``) : ["- (none)"]),
    "",
    "## Report / learning routes (reference)",
    "",
    "### Parent/report",
    "",
    ...(audit.existingReportRoutes || []).map((x) => `- \`${x}\``),
    "",
    "### Learning entry",
    "",
    ...(audit.existingLearningRoutes || []).map((x) => `- \`${x}\``),
    "",
    "## PDF / export",
    "",
    ...audit.existingPDFExportPaths.map((x) => `- ${x}`),
    "",
    "## Components / SSR",
    "",
    ...audit.existingParentReportRenderComponents.map((x) => `- ${x}`),
    "",
    "## Recommended minimal gate",
    "",
    ...audit.recommendedMinimalGate.map((x) => `- ${x}`),
    "",
    "## Risks",
    "",
    ...audit.risks.map((x) => `- ${x}`),
    "",
    `JSON: \`${AUDIT_JSON.replace(/\\/g, "/")}\``,
    "",
  ].join("\n");
  await writeFile(AUDIT_MD, md, "utf8");
}

async function loadSimulatorStorageSnapshot() {
  const p = join(ROOT, "reports", "learning-simulator", "aggregate", "per-student", "strong_all_subjects_g3_7d.storage.json");
  if (!existsSync(p)) return null;
  const raw = JSON.parse(await readFile(p, "utf8"));
  const flat = {};
  for (const [k, v] of Object.entries(raw)) {
    flat[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return flat;
}

async function waitForHttpOk(url, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(url, { redirect: "follow" });
      if (r.ok || r.status === 404) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

/** Port 3001 may answer HTTP without being `next dev` — avoid skipping auto-start on a stale listener. */
async function looksLikeNextDevApp(baseUrl) {
  try {
    const root = String(baseUrl || "").replace(/\/$/, "");
    const r = await fetch(`${root}/learning`, { redirect: "follow" });
    if (!r.ok) return false;
    const html = await r.text();
    return html.includes("__NEXT_DATA__") || /\/_next\/static\//.test(html);
  } catch {
    return false;
  }
}

function startDevServer(listenPort) {
  const p = listenPort ?? PORT;
  const env = { ...process.env, PORT: String(p) };
  const cli = npxCliPath();
  if (cli) {
    return spawn(nodeExeForNpm(), [cli, "next", "dev", "-p", String(p)], {
      cwd: ROOT,
      shell: false,
      stdio: "pipe",
      env,
      windowsHide: true,
    });
  }
  return spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], {
    cwd: ROOT,
    shell: process.platform === "win32",
    stdio: "pipe",
    env,
    windowsHide: true,
  });
}

async function mockStudentMe(page) {
  await page.route("**/api/student/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        student: {
          id: "00000000-0000-0000-0000-0000000000e2",
          full_name: "RenderGateQA",
          grade_level: 3,
          is_active: true,
          coin_balance: 0,
        },
      }),
    });
  });
}

async function applyLocalStorage(page, data, originBase) {
  const ob = originBase || BASE_URL;
  await page.goto(`${ob}/`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.evaluate((d) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(d || {})) localStorage.setItem(k, String(v));
  }, data);
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function runSsrFallback() {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync("npx", ["tsx", "scripts/parent-report-pages-ssr.mjs"], {
    cwd: ROOT,
    shell: true,
    encoding: "utf8",
    timeout: 120_000,
  });
  return {
    ok: r.status === 0,
    stdout: (r.stdout || "").slice(-2000),
    stderr: (r.stderr || "").slice(-2000),
  };
}

async function main() {
  await mkdir(FAILURE_ART_DIR, { recursive: true });

  const audit = await discoverInfrastructureAudit();
  await writeAuditArtifacts(audit);

  const runId = `render-gate-${Date.now().toString(36)}`;
  const generatedAt = new Date().toISOString();

  /** @type {object[]} */
  const checks = [];
  /** @type {object[]} */
  const failures = [];
  /** @type {string[]} */
  const deferredSurfaces = [
    {
      id: "pdf_export_binary",
      reason:
        "In-page PDF/export uses html2pdf/jspdf from parent-report UI; binary output validation and print CSS are out of scope for this gate.",
    },
    {
      id: "dev_db_report_preview_authenticated",
      reason: "dev-db-report-preview requires parent bearer token / env; not opened in automated gate.",
    },
  ];

  let browserMode = false;
  let serverProc = null;
  let playwright = null;

  if (FORCE_NO_BROWSER || !audit.isPlaywrightInstalled) {
    const ssr = await runSsrFallback();
    checks.push({
      routeOrSurface: "scripts/parent-report-pages-ssr.mjs",
      mode: "ssr_fallback",
      inputArtifact: "React renderToStaticMarkup (fixtures)",
      opened: true,
      rendered: ssr.ok,
      fatalPageErrorCount: ssr.ok ? 0 : 1,
      consoleErrorCount: ssr.ok ? 0 : 1,
      knownWarningCount: 0,
      screenshotOnFailure: false,
      status: ssr.ok ? "ok" : "failed",
      errors: ssr.ok ? [] : [ssr.stderr || ssr.stdout || "SSR smoke failed"],
    });
    if (!ssr.ok) failures.push({ check: "ssr_fallback", detail: ssr });

    const payload = {
      runId,
      generatedAt,
      browserMode: false,
      checksTotal: checks.length,
      checksPassed: checks.filter((c) => c.status === "ok").length,
      checksFailed: checks.filter((c) => c.status !== "ok").length,
      consoleErrorsTotal: checks.reduce((a, c) => a + (c.consoleErrorCount || 0), 0),
      fatalErrorsTotal: checks.reduce((a, c) => a + (c.fatalPageErrorCount || 0), 0),
      deferredSurfaces,
      checks,
      failures,
      note: "Playwright unavailable or RENDER_GATE_BROWSER=0 — SSR fallback only. Set RENDER_GATE_BROWSER unset and npm install for full browser gate.",
    };
    await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(
      OUT_MD,
      [
        "# Render release gate",
        "",
        "**Mode:** SSR fallback only (no browser).",
        "",
        `- checksPassed / checksTotal: **${payload.checksPassed}** / **${payload.checksTotal}**`,
        "",
        "Install Playwright devDependencies and run without `RENDER_GATE_BROWSER=0` for browser checks.",
        "",
      ].join("\n"),
      "utf8"
    );
    console.log(JSON.stringify({ ok: ssr.ok, browserMode: false, outJson: OUT_JSON }, null, 2));
    process.exit(ssr.ok ? 0 : 1);
    return;
  }

  playwright = await import("playwright");
  browserMode = true;

  let activeBaseUrl = BASE_URL;
  let serverStarted = false;
  /** Default false: a listener on :3001 may look like Next yet serve stale chunk hashes (mass 404s). Set RENDER_GATE_TRUST_EXISTING_SERVER=1 to reuse a known-good dev server. */
  const trustExistingListener = process.env.RENDER_GATE_TRUST_EXISTING_SERVER === "1";
  let serverAlreadyUp = false;
  if (trustExistingListener) {
    serverAlreadyUp = await waitForHttpOk(activeBaseUrl, 2000);
    if (serverAlreadyUp && !(await looksLikeNextDevApp(activeBaseUrl))) {
      serverAlreadyUp = false;
    }
  }
  if (!serverAlreadyUp && AUTO_SERVER) {
    let bootPort = PORT;
    if (!process.env.RENDER_GATE_BASE_URL) {
      bootPort = await findFreePort();
      activeBaseUrl = `http://127.0.0.1:${bootPort}`;
    }
    serverProc = startDevServer(bootPort);
    serverStarted = true;
    let bootLog = "";
    serverProc.stdout?.on("data", (c) => {
      bootLog += c.toString();
      if (bootLog.length > 120_000) bootLog = bootLog.slice(-120_000);
    });
    serverProc.stderr?.on("data", (c) => {
      bootLog += c.toString();
      if (bootLog.length > 120_000) bootLog = bootLog.slice(-120_000);
    });
    const up = await waitForHttpOk(activeBaseUrl, SERVER_BOOT_WAIT_MS);
    if (!up) {
      const payload = {
        runId,
        generatedAt,
        browserMode: true,
        checksTotal: 0,
        checksPassed: 0,
        checksFailed: 1,
        consoleErrorsTotal: 0,
        fatalErrorsTotal: 1,
        deferredSurfaces,
        checks: [],
        failures: [
          {
            phase: "server_boot",
            error: `Server did not respond at ${activeBaseUrl} within ${SERVER_BOOT_WAIT_MS}ms`,
            devBootTail: bootLog.slice(-8000),
          },
        ],
      };
      await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
      if (bootLog) console.error("[render-gate] dev boot log (tail):\n", bootLog.slice(-4000));
      if (serverProc) try {
        serverProc.kill();
      } catch {}
      console.error("Render gate: dev server failed to start");
      process.exit(1);
      return;
    }
  } else if (!serverAlreadyUp && !AUTO_SERVER) {
    const payload = {
      runId,
      generatedAt,
      browserMode: true,
      checksTotal: 0,
      checksPassed: 0,
      checksFailed: 1,
      consoleErrorsTotal: 0,
      fatalErrorsTotal: 1,
      deferredSurfaces,
      checks: [],
      failures: [
        {
          phase: "server_missing",
          error: `No server at ${activeBaseUrl} and RENDER_GATE_AUTO_SERVER=0`,
        },
      ],
    };
    await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
    console.error("Render gate: start dev server or set RENDER_GATE_AUTO_SERVER=1");
    process.exit(1);
    return;
  }

  const storageSnapshot = await loadSimulatorStorageSnapshot();
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: "he-IL" });

  const scenarios = [
    {
      id: "learning_index",
      path: "/learning",
      setup: "student_mock",
      inputArtifact: "(route + api mock — StudentAccessGate)",
      expectRendered: async (page) => (await page.locator("body").innerText()).length > 30,
    },
    {
      id: "learning_curriculum",
      path: "/learning/curriculum",
      setup: "student_mock",
      inputArtifact: "(route + api mock — StudentAccessGate)",
      expectRendered: async (page) => (await page.locator("body").innerText()).length > 40,
    },
    {
      id: "math_master",
      path: "/learning/math-master",
      setup: "student_mock",
      inputArtifact: "(route + api mock)",
      expectRendered: async (page) => {
        await page.getByTestId("math-player-name").fill("RGMath").catch(() => {});
        return (await page.locator("body").innerText()).length > 20;
      },
    },
    {
      id: "science_master",
      path: "/learning/science-master",
      setup: "student_mock",
      inputArtifact: "(route + api mock)",
      expectRendered: async (page) => (await page.locator("body").innerText()).length > 20,
    },
    {
      id: "parent_report_summary",
      /** Rolling month (30d) overlaps seeded aggregate sessions; bare /week can yield zero rows near calendar edges and tiny shells. */
      path: "/learning/parent-report?period=month",
      setup: "simulator_storage",
      inputArtifact: "reports/learning-simulator/aggregate/per-student/strong_all_subjects_g3_7d.storage.json",
      expectRendered: async (page) => {
        /**
         * Wait for client hydration: loading shell ("טוען דוח…") must disappear, then require substantive body text.
         * Do not require `#parent-report-pdf` — that node exists only on the populated branch; thin-window / empty
         * branches render a different layout without that id (would timeout forever).
         */
        await page.waitForFunction(
          () => {
            const t = document.body?.innerText || "";
            if (t.includes("טוען דוח")) return false;
            if (document.querySelector("#parent-report-pdf")) return true;
            return t.length > 180;
          },
          null,
          { timeout: 90_000 },
        );
        return true;
      },
    },
    {
      id: "parent_report_detailed",
      path: "/learning/parent-report-detailed",
      setup: "simulator_storage",
      inputArtifact: "reports/learning-simulator/aggregate/per-student/strong_all_subjects_g3_7d.storage.json",
      expectRendered: async (page) => {
        const t = await page.locator("body").innerText();
        return t.length > 300;
      },
    },
    {
      id: "parent_report_detailed_renderable",
      path: "/learning/parent-report-detailed.renderable",
      setup: "simulator_storage",
      inputArtifact: "reports/learning-simulator/aggregate/per-student/strong_all_subjects_g3_7d.storage.json",
      expectRendered: async (page) => (await page.locator("body").innerText()).length > 200,
    },
  ];

  if (!storageSnapshot) {
    deferredSurfaces.push({
      id: "simulator_storage_missing",
      reason: "strong_all_subjects_g3_7d.storage.json missing — parent-report checks skipped",
    });
  }

  for (const sc of scenarios) {
    if (sc.setup === "simulator_storage" && !storageSnapshot) {
      checks.push({
        routeOrSurface: sc.path,
        mode: "browser",
        inputArtifact: sc.inputArtifact,
        opened: false,
        rendered: false,
        fatalPageErrorCount: 0,
        consoleErrorCount: 0,
        knownWarningCount: 0,
        screenshotOnFailure: false,
        status: "deferred",
        errors: ["missing aggregate simulator storage artifact"],
      });
      continue;
    }

    const page = await context.newPage();
    const fatal = [];
    const consoleBad = [];
    let knownWarn = 0;

    page.on("pageerror", (e) => fatal.push(String(e?.message || e)));
    page.on("console", (msg) => {
      const t = msg.text();
      if (msg.type() === "error") {
        if (consoleAllowed(t)) knownWarn += 1;
        else consoleBad.push(t);
      }
    });

    let opened = false;
    let rendered = false;
    /** @type {string[]} */
    const errors = [];

    try {
      if (sc.setup === "student_mock") {
        await mockStudentMe(page);
        await page.goto(`${activeBaseUrl}${sc.path}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
        await new Promise((r) => setTimeout(r, 1200));
        opened = true;
      } else if (sc.setup === "simulator_storage") {
        await mockStudentMe(page);
        await applyLocalStorage(page, storageSnapshot, activeBaseUrl);
        await page.goto(`${activeBaseUrl}${sc.path}`, { waitUntil: "domcontentloaded", timeout: 180_000 });
        await new Promise((r) => setTimeout(r, 1200));
        opened = true;
      } else {
        await page.goto(`${activeBaseUrl}${sc.path}`, { waitUntil: "domcontentloaded", timeout: 90_000 });
        await new Promise((r) => setTimeout(r, 1200));
        opened = true;
      }

      rendered = await sc.expectRendered(page);
      if (!rendered) errors.push("expectRendered returned false");
    } catch (e) {
      errors.push(String(e?.message || e));
      const shot = join(FAILURE_ART_DIR, `${sc.id}.png`);
      try {
        await page.screenshot({ path: shot, fullPage: false });
      } catch {
        /* ignore */
      }
    }

    const fatalPageErrorCount = fatal.length;
    const consoleErrorCount = consoleBad.length;
    const pass =
      opened &&
      rendered &&
      fatalPageErrorCount === 0 &&
      consoleErrorCount === 0;

    if (!pass && opened) {
      const shot = join(FAILURE_ART_DIR, `${sc.id}.png`);
      try {
        await page.screenshot({ path: shot, fullPage: false });
      } catch {
        /* ignore */
      }
    }

    checks.push({
      routeOrSurface: sc.path,
      mode: "browser",
      inputArtifact: sc.inputArtifact,
      opened,
      rendered,
      fatalPageErrorCount,
      consoleErrorCount,
      knownWarningCount: knownWarn,
      screenshotOnFailure: !pass,
      status: pass ? "ok" : "failed",
      errors: [...fatal, ...consoleBad, ...errors],
    });

    if (!pass) {
      failures.push({ checkId: sc.id, route: sc.path, errors: [...fatal, ...consoleBad, ...errors] });
    }

    await page.close();
  }

  await browser.close();

  if (serverStarted && serverProc) {
    try {
      serverProc.kill();
    } catch {
      /* ignore */
    }
  }

  const checksPassed = checks.filter((c) => c.status === "ok").length;
  const checksFailed = checks.filter((c) => c.status === "failed").length;
  const deferredCount = checks.filter((c) => c.status === "deferred").length;

  const payload = {
    runId,
    generatedAt,
    browserMode,
    baseURL: activeBaseUrl,
    checksTotal: checks.length,
    checksPassed,
    checksFailed,
    deferredCount,
    consoleErrorsTotal: checks.reduce((a, c) => a + (c.consoleErrorCount || 0), 0),
    fatalErrorsTotal: checks.reduce((a, c) => a + (c.fatalPageErrorCount || 0), 0),
    deferredSurfaces,
    checks,
    failures,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# Render release gate",
    "",
    `- Run id: ${runId}`,
    `- Generated at: ${generatedAt}`,
    `- **browserMode:** ${browserMode}`,
    `- **baseURL:** ${activeBaseUrl}`,
    "",
    "## Summary",
    "",
    `| Passed | Failed | Deferred checks | Total |`,
    `| ---: | ---: | ---: | ---: |`,
    `| ${checksPassed} | ${checksFailed} | ${deferredCount} | ${checks.length} |`,
    "",
    "## Surfaces",
    "",
    "| Surface | Status | Console err | Fatal err |",
    "| --- | --- | ---: | ---: |",
    ...checks.map(
      (c) =>
        `| ${mdEscape(c.routeOrSurface)} | ${mdEscape(c.status)} | ${c.consoleErrorCount ?? 0} | ${c.fatalPageErrorCount ?? 0} |`
    ),
    "",
    "## Deferred (informational)",
    "",
    ...deferredSurfaces.map((d) => `- **${mdEscape(d.id)}:** ${mdEscape(d.reason)}`),
    "",
    "## Failures",
    "",
    ...(failures.length
      ? failures.map((f) => `\`\`\`json\n${JSON.stringify(f, null, 2)}\n\`\`\`\n`)
      : ["- (none)", ""]),
    "",
    `Full JSON: \`${OUT_JSON.replace(/\\/g, "/")}\``,
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  const ok = checksFailed === 0 && failures.length === 0;
  console.log(JSON.stringify({ ok, browserMode, checks: checks.length, failed: checksFailed, outJson: OUT_JSON }, null, 2));
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
