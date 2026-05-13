#!/usr/bin/env node
/**
 * PDF export gate — Playwright download smoke for parent-report file export (html2pdf canvas path).
 * npm run qa:learning-simulator:pdf-export
 *
 * Uses ?qa_pdf=file on /learning/parent-report to select canvas/html2pdf (see audit).
 *
 * Env (same family as render gate):
 *   PDF_GATE_BASE_URL / RENDER_GATE_BASE_URL — default http://127.0.0.1:3001
 *   PDF_GATE_AUTO_SERVER — if "0", do not spawn dev server (RENDER_GATE_AUTO_SERVER does not apply; avoids full-orchestrator env coupling)
 *   PDF_GATE_BROWSER — if "0", skip Playwright → deferred
 *   PDF_GATE_SERVER_WAIT_MS / RENDER_GATE_SERVER_WAIT_MS — max wait for auto-started dev (default 300000)
 *   Auto-started dev always binds a free TCP port (ignores stale PORT / *_BASE_URL from env) so EADDRINUSE after render or overnight is avoided.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import { pdfTextContainsParentAiInsightFingerprint } from "../lib/parent-report-pdf-insight-fingerprint.mjs";

async function extractPdfText(buf) {
  const parser = new PDFParse({ data: buf });
  try {
    const textResult = await parser.getText();
    return String(textResult?.text || "");
  } finally {
    await parser.destroy?.();
  }
}
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { createServer } from "node:net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const LS_DIR = join(ROOT, "reports", "learning-simulator");
const PDF_DIR = join(LS_DIR, "pdf-export");
const AUDIT_JSON = join(LS_DIR, "pdf-export-audit.json");
const AUDIT_MD = join(LS_DIR, "pdf-export-audit.md");
const OUT_JSON = join(LS_DIR, "pdf-export-gate.json");
const OUT_MD = join(LS_DIR, "pdf-export-gate.md");

const PORT = Number(process.env.PORT || process.env.PDF_GATE_PORT || process.env.RENDER_GATE_PORT || 3001);
const BASE_URL =
  process.env.PDF_GATE_BASE_URL || process.env.RENDER_GATE_BASE_URL || `http://127.0.0.1:${PORT}`;
const AUTO_SERVER = process.env.PDF_GATE_AUTO_SERVER !== "0";
const FORCE_NO_BROWSER = process.env.PDF_GATE_BROWSER === "0";

const SERVER_BOOT_WAIT_MS = Number(
  process.env.PDF_GATE_SERVER_WAIT_MS || process.env.RENDER_GATE_SERVER_WAIT_MS || 300_000
);

/** Avoid spawn("npm") without shell on Windows (EINVAL); prefer node + npx-cli.js like render gate. */
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

/** Minimum PDF size for pass (documented). */
const MIN_PDF_BYTES = 10 * 1024;

const CONSOLE_WHITELIST = [/Download the React DevTools/i, /\[@faker-js/i];

function consoleAllowed(text) {
  return CONSOLE_WHITELIST.some((re) => re.test(String(text || "")));
}

async function buildPdfExportAudit() {
  const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
  const pdfLib =
    pkg.dependencies?.["html2pdf.js"] || pkg.devDependencies?.["html2pdf.js"] || "html2pdf.js (see package.json)";

  return {
    generatedAt: new Date().toISOString(),
    pdfLibraryDetected: String(pdfLib),
    pdfExportMechanism:
      "exportReportToPDF(report, options) in utils/math-report-generator.js. Default options.method is \"print\" → window.print() (no file download). With method \"canvas\", dynamic import of html2pdf.js/dist/html2pdf.js then html2pdf().set(opt).from(el).save() (jsPDF inside html2pdf options).",
    exportIsClientSide: true,
    exportIsServerSide: false,
    hasDedicatedPdfRoute: false,
    hasExportButton: true,
    buttonSelectorsFound: [
      "pages/learning/parent-report.js — button with visible label containing ייצא ל-PDF",
      "QA file mode: query ?qa_pdf=file so click passes { method: \"canvas\" } (html2pdf path)",
    ],
    requiresAuth: true,
    requiresLocalStorage: true,
    requiresReportData: true,
    canTestDownloadWithPlaywright:
      "Yes when navigating to /learning/parent-report?qa_pdf=file with seeded aggregate storage + mocked /api/student/me; canvas path emits a browser download.",
    blockingIssues: [
      "Without ?qa_pdf=file, default UI uses print dialog — not capturable as Playwright download.",
    ],
    recommendedMinimalGate:
      "Playwright: open parent-report with ?qa_pdf=file, seed storage, click export, assert download + %PDF header + min size.",
    recommendedFutureImprovement:
      "Optional dedicated /api PDF route if product moves generation server-side; keep client path tested via canvas.",
    evidenceFiles: [
      "utils/math-report-generator.js (exportReportToPDF)",
      "pages/learning/parent-report.js (export button)",
      "package.json (html2pdf.js dependency)",
    ],
  };
}

async function writeAuditFiles(audit) {
  await mkdir(LS_DIR, { recursive: true });
  await writeFile(AUDIT_JSON, JSON.stringify(audit, null, 2), "utf8");
  const md = [
    "# PDF export — implementation audit",
    "",
    `- Generated at: ${audit.generatedAt}`,
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| pdfLibraryDetected | ${audit.pdfLibraryDetected} |`,
    `| exportIsClientSide | ${audit.exportIsClientSide ? "yes" : "no"} |`,
    `| exportIsServerSide | ${audit.exportIsServerSide ? "yes" : "no"} |`,
    `| hasDedicatedPdfRoute | ${audit.hasDedicatedPdfRoute ? "yes" : "no"} |`,
    `| hasExportButton | ${audit.hasExportButton ? "yes" : "no"} |`,
    "",
    "## Mechanism",
    "",
    audit.pdfExportMechanism,
    "",
    "## Button / selectors",
    "",
    ...audit.buttonSelectorsFound.map((x) => `- ${x}`),
    "",
    "## Requires",
    "",
    `- Auth/session: ${audit.requiresAuth} (StudentAccessGate + mocked /api/student/me in gate)`,
    `- localStorage seed: ${audit.requiresLocalStorage}`,
    `- Built report object in page: ${audit.requiresReportData}`,
    "",
    "## Playwright download testability",
    "",
    audit.canTestDownloadWithPlaywright,
    "",
    "## Blocking issues",
    "",
    ...audit.blockingIssues.map((x) => `- ${x}`),
    "",
    "## Recommended gate",
    "",
    audit.recommendedMinimalGate,
    "",
    "## Future",
    "",
    audit.recommendedFutureImprovement,
    "",
    "## Evidence files",
    "",
    ...audit.evidenceFiles.map((x) => `- ${x.replace(/\\/g, "/")}`),
    "",
    "JSON: " + AUDIT_JSON.replace(/\\/g, "/"),
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
      const perTryMs = Math.min(4000, Math.max(500, Math.floor(timeoutMs / 4) || 1500));
      const ac = new AbortController();
      const kill = setTimeout(() => ac.abort(), perTryMs);
      const r = await fetch(url, { redirect: "follow", signal: ac.signal });
      clearTimeout(kill);
      if (r.ok || r.status === 404) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

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
          id: "00000000-0000-0000-0000-0000000000e3",
          full_name: "PdfGateQA",
          grade_level: 3,
          is_active: true,
          coin_balance: 0,
        },
      }),
    });
  });
}

async function applyLocalStorage(page, data, base) {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate((d) => {
    localStorage.clear();
    for (const [k, v] of Object.entries(d || {})) localStorage.setItem(k, String(v));
  }, data);
}

function mdEscape(s) {
  return String(s ?? "").replace(/\|/g, "\\|");
}

async function readPkgPlaywright() {
  const pkg = JSON.parse(await readFile(join(ROOT, "package.json"), "utf8"));
  return !!(pkg.devDependencies?.["@playwright/test"] || pkg.devDependencies?.playwright);
}

async function main() {
  await mkdir(PDF_DIR, { recursive: true });

  const audit = await buildPdfExportAudit();
  await writeAuditFiles(audit);

  const runId = `pdf-gate-${Date.now().toString(36)}`;
  const generatedAt = new Date().toISOString();

  const basePayload = {
    runId,
    generatedAt,
    browserMode: false,
    checkedRoute: "/learning/parent-report?qa_pdf=file&period=month",
    pdfLibraryDetected: audit.pdfLibraryDetected,
    exportMechanism: "client html2pdf canvas when qa_pdf=file",
    downloadAttempted: false,
    downloadSucceeded: false,
    downloadPath: null,
    fileSizeBytes: null,
    pdfHeaderOk: null,
    consoleErrorsTotal: null,
    fatalErrorsTotal: null,
    deferredReason: null,
    failures: [],
    warnings: [],
    minPdfBytesThreshold: MIN_PDF_BYTES,
  };

  const hasPw = await readPkgPlaywright();
  if (FORCE_NO_BROWSER || !hasPw) {
    const deferPayload = {
      ...basePayload,
      status: "deferred",
      deferredReason: "Playwright not available or PDF_GATE_BROWSER=0 — cannot run browser PDF gate.",
    };
    await writeFile(OUT_JSON, JSON.stringify(deferPayload, null, 2), "utf8");
    await writeFile(
      OUT_MD,
      "# PDF export gate\n\n**Status: deferred** — browser runner unavailable.\n",
      "utf8"
    );
    console.log(JSON.stringify({ ok: true, status: "deferred", browserMode: false, outJson: OUT_JSON }, null, 2));
    process.exit(0);
    return;
  }

  const storage = await loadSimulatorStorageSnapshot();
  if (!storage) {
    const deferPayload = {
      ...basePayload,
      status: "deferred",
      deferredReason:
        "Missing aggregate artifact strong_all_subjects_g3_7d.storage.json — cannot render parent-report for export.",
    };
    await writeFile(OUT_JSON, JSON.stringify(deferPayload, null, 2), "utf8");
    await writeFile(
      OUT_MD,
      `# PDF export gate\n\nStatus: deferred — missing aggregate storage artifact.\n`,
      "utf8"
    );
    console.log(JSON.stringify({ ok: true, status: "deferred", reason: basePayload.deferredReason }, null, 2));
    process.exit(0);
    return;
  }

  let serverProc = null;
  let serverStarted = false;
  /** @type {string} */
  let activeBaseUrl = BASE_URL;
  const trustExistingListener =
    process.env.RENDER_GATE_TRUST_EXISTING_SERVER === "1" || process.env.PDF_GATE_TRUST_EXISTING_SERVER === "1";
  let serverAlreadyUp = false;
  if (trustExistingListener) {
    serverAlreadyUp = await waitForHttpOk(activeBaseUrl, 2500);
    if (serverAlreadyUp && !(await looksLikeNextDevApp(activeBaseUrl))) {
      serverAlreadyUp = false;
    }
  }
  if (!serverAlreadyUp && AUTO_SERVER) {
    const bootPort = await findFreePort();
    activeBaseUrl = `http://127.0.0.1:${bootPort}`;
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
      basePayload.status = "fail";
      basePayload.failures.push(`Dev server did not respond at ${activeBaseUrl} within ${SERVER_BOOT_WAIT_MS}ms`);
      await writeFile(OUT_JSON, JSON.stringify(basePayload, null, 2), "utf8");
      if (bootLog) console.error("[pdf-export-gate] dev boot log (tail):\n", bootLog.slice(-4000));
      if (serverProc)
        try {
          serverProc.kill();
        } catch {}
      console.error("PDF export gate: server failed to start");
      process.exit(1);
      return;
    }
  } else if (!serverAlreadyUp && !AUTO_SERVER) {
    basePayload.status = "fail";
    basePayload.failures.push(`No server at ${activeBaseUrl} and PDF_GATE_AUTO_SERVER=0`);
    await writeFile(OUT_JSON, JSON.stringify(basePayload, null, 2), "utf8");
    process.exit(1);
    return;
  }

  const playwright = await import("playwright");
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "he-IL",
    acceptDownloads: true,
  });
  const page = await context.newPage();

  const fatal = [];
  const consoleBad = [];
  page.on("pageerror", (e) => fatal.push(String(e?.message || e)));
  page.on("console", (msg) => {
    const t = msg.text();
    if (msg.type() === "error" && !consoleAllowed(t)) consoleBad.push(t);
  });

  /** @type {string[]} */
  const failures = [];
  let downloadAttempted = false;
  let downloadSucceeded = false;
  let downloadPath = null;
  let fileSizeBytes = null;
  let pdfHeaderOk = null;

  try {
    await mockStudentMe(page);
    await applyLocalStorage(page, storage, activeBaseUrl);

    /** month window keeps aggregate fixture sessions in-range across calendar edges (Phase C.1). */
    const url = `${activeBaseUrl}/learning/parent-report?qa_pdf=file&period=month`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90_000 });
    await new Promise((r) => setTimeout(r, 2000));

    /** Phase C.1 — Parent AI insight must be in DOM before canvas export (avoid empty PDF slice). */
    await page.waitForSelector(".parent-report-parent-ai-insight", { timeout: 90_000 });

    const bodyLen = (await page.locator("body").innerText()).length;
    if (bodyLen < 150) failures.push("Report body text too short — report may not have hydrated.");

    /**
     * Text proof via Playwright print PDF — html2pdf canvas downloads are often image-only, so pdf-parse
     * cannot recover Hebrew from the file bytes. Same DOM state as export; `.no-pdf` respected in print.
     */
    await page.emulateMedia({ media: "print" });
    try {
      const proofBuf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" },
        preferCSSPageSize: true,
      });
      const proofTxt = (await extractPdfText(Buffer.from(proofBuf))).replace(/\s+/g, " ");
      if (!pdfTextContainsParentAiInsightFingerprint(proofTxt)) {
        failures.push(
          "Phase C.1: Playwright print PDF missing Parent AI insight fingerprint (heading or structured provenance — see scripts/lib/parent-report-pdf-insight-fingerprint.mjs).",
        );
      }
      if (proofTxt.includes("שאלה על הדוח")) {
        failures.push("Phase C.1: Parent Copilot placeholder leaked into Playwright print PDF.");
      }
    } catch (e) {
      failures.push(`Phase C.1: print-PDF text proof failed: ${String(e?.message || e)}`);
    }
    await page.emulateMedia({ media: "screen" });

    const exportBtn = page.getByRole("button", { name: /ייצא ל-PDF/ });
    const count = await exportBtn.count();
    if (count === 0) failures.push("Export button not found (accessible name /ייצא ל-PDF/).");

    if (!failures.length) {
      downloadAttempted = true;
      const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
      await exportBtn.first().click();
      const download = await downloadPromise;
      const suggested = download.suggestedFilename() || `parent-report-${runId}.pdf`;
      const safeName = suggested.replace(/[^a-zA-Z0-9._\-א-ת]/g, "_") || `parent-report-${runId}.pdf`;
      downloadPath = join(PDF_DIR, safeName);
      await download.saveAs(downloadPath);
      downloadSucceeded = true;

      const buf = await readFile(downloadPath);
      fileSizeBytes = buf.length;
      pdfHeaderOk = buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF";

      if (fileSizeBytes < MIN_PDF_BYTES) failures.push(`PDF smaller than minimum (${fileSizeBytes} < ${MIN_PDF_BYTES} bytes).`);
      if (!pdfHeaderOk) failures.push("File does not start with %PDF header.");

      /** Optional: canvas PDFs are often image-heavy — Copilot leak check only when text extracts. */
      try {
        const txt = await extractPdfText(buf);
        if (txt.includes("שאלה על הדוח")) {
          failures.push("Phase C.1: Parent Copilot placeholder text leaked into html2pdf export.");
        }
      } catch (e) {
        failures.push(`Phase C.1: pdf-parse on download failed: ${String(e?.message || e)}`);
      }
    }
  } catch (e) {
    failures.push(String(e?.message || e));
  }

  if (fatal.length) failures.push(...fatal.map((x) => `pageerror: ${x}`));
  if (consoleBad.length) failures.push(...consoleBad.map((x) => `console: ${x}`));

  await browser.close();

  if (serverStarted && serverProc) {
    try {
      serverProc.kill();
    } catch {}
  }

  const blocking =
    failures.length > 0 ||
    (downloadAttempted && !downloadSucceeded) ||
    (downloadSucceeded && (!pdfHeaderOk || fileSizeBytes < MIN_PDF_BYTES));

  const status = blocking ? "fail" : "pass";

  const payload = {
    ...basePayload,
    browserMode: true,
    baseURL: activeBaseUrl,
    downloadAttempted,
    downloadSucceeded,
    downloadPath: downloadPath ? downloadPath.replace(/\\/g, "/") : null,
    fileSizeBytes,
    pdfHeaderOk,
    consoleErrorsTotal: consoleBad.length,
    fatalErrorsTotal: fatal.length,
    failures,
    status,
    deferredReason: basePayload.deferredReason ?? null,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const md = [
    "# PDF export gate",
    "",
    "- runId: " + runId,
    "- status: " + mdEscape(status),
    "- browserMode: true",
    "- checkedRoute: " + mdEscape(payload.checkedRoute),
    "",
    "## Result",
    "",
    `| Field | Value |`,
    `| --- | --- |`,
    `| downloadAttempted | ${downloadAttempted} |`,
    `| downloadSucceeded | ${downloadSucceeded} |`,
    `| fileSizeBytes | ${fileSizeBytes ?? "—"} |`,
    `| pdfHeaderOk | ${pdfHeaderOk ?? "—"} |`,
    `| consoleErrorsTotal | ${consoleBad.length} |`,
    `| fatalErrorsTotal | ${fatal.length} |`,
    "",
    payload.downloadPath ? "Saved file: " + mdEscape(payload.downloadPath) : "",
    "",
    "## Failures",
    "",
    ...(failures.length ? failures.map((f) => `- ${mdEscape(f)}`) : ["- (none)"]),
    "",
    "Full JSON: " + OUT_JSON.replace(/\\/g, "/"),
    "",
  ].join("\n");

  await writeFile(OUT_MD, md, "utf8");

  const exitCode = status === "fail" ? 1 : 0;
  console.log(JSON.stringify({ ok: exitCode === 0, status, browserMode: true, outJson: OUT_JSON }, null, 2));
  process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
