#!/usr/bin/env node
/**
 * Overnight Parent AI + learning QA orchestrator (reporting only).
 * - Windows-safe: spawn with argv arrays, no shell string concatenation.
 * - Classifies failures: product vs infrastructure vs test runner.
 * - Manages local Next dev: free port, health check, QA_BASE_URL + PDF_GATE_BASE_URL, clean shutdown.
 *
 * Usage:
 *   node scripts/overnight-parent-ai-audit.mjs
 *   node scripts/overnight-parent-ai-audit.mjs --smoke     # short verification (~minutes)
 * Env:
 *   OVERNIGHT_SMOKE_SKIP_BUILD=1  — with --smoke, skip npm run build
 *   OVERNIGHT_EXTERNAL_QA_URL=https://...  — optional; use this dev/staging base for PDF gates instead of
 *     spawning local Next (otherwise .env QA_BASE_URL is ignored for PDF phase to avoid stale ports).
 *   OVERNIGHT_SAMPLE_PDFS_TIMEOUT_MS=<ms>  — optional; timeout for f-sample-pdfs only (default 60 min).
 *     Parent PDF export / ls pdf-export still use T_PDF (20 min).
 *   OVERNIGHT_SOAK=1 + OVERNIGHT_STUDENT_MULTIPLIER / OVERNIGHT_TARGET_SCENARIOS — expand aggregate/deep scenarios (no sleeps).
 *   OVERNIGHT_COVERAGE_ENFORCE=0 — do not fail on COVERAGE_MANIFEST thresholds (default: enforce when not --smoke).
 *   COVERAGE thresholds: OVERNIGHT_MIN_GRADES, OVERNIGHT_MIN_SCENARIOS, OVERNIGHT_MIN_QUESTIONS, OVERNIGHT_MIN_SESSIONS, …
 *
 * Usage flags:
 *   --smoke   short gate
 *   --soak    sets OVERNIGHT_SOAK=1 for heavier learning-simulator repetition (env-driven)
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import {
  mkdirp,
  redactSecrets,
  runNpmScript,
  runNpxArgs,
  runSpawnCommand,
  findFreePort,
  copyTreeIfExists,
  packageScripts,
  hasScript,
  killProcessTree,
  npxCliPath,
  nodeExeForNpm,
} from "./lib/overnight-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const T_BUILD = 15 * 60 * 1000;
const T_TEST = 10 * 60 * 1000;
const T_PDF = 20 * 60 * 1000;
/** f-sample-pdfs only — Playwright multi-profile run; separate from T_PDF (parent PDF export). */
const DEFAULT_SAMPLE_PDFS_TIMEOUT_MS = 60 * 60 * 1000;

function samplePdfsTimeoutMs() {
  const raw = process.env.OVERNIGHT_SAMPLE_PDFS_TIMEOUT_MS;
  if (raw != null && String(raw).trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 60_000) return Math.floor(n);
  }
  return DEFAULT_SAMPLE_PDFS_TIMEOUT_MS;
}

const T_LS_QUICK = 45 * 60 * 1000;
const T_LS_FULL = 120 * 60 * 1000;
const DEV_HEALTH_MAX_MS = 240000;
const NPX_CLI = npxCliPath();
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

const SMOKE = process.argv.includes("--smoke");
if (process.argv.includes("--soak") && !process.env.OVERNIGHT_SOAK) process.env.OVERNIGHT_SOAK = "1";

/**
 * @param {{ OUT: string; ts: string; reportedOverall: string; commandRollup: string; smoke: boolean; cov: any; coverageManifestFailed: boolean }} args
 */
function buildLatestAuditMd(args) {
  const { OUT, ts, reportedOverall, commandRollup, smoke, cov, coverageManifestFailed } = args;
  const o = cov?.overall;
  const g = (cov?.grades?.covered || []).join(", ") || "—";
  const subs = (cov?.subjects?.unionFromAggregateAndCatalog || []).join(", ") || "—";
  const thr = cov?.thresholdsPass;
  return [
    `# Latest overnight run`,
    ``,
    `- **Folder:** \`${OUT}\``,
    `- **Timestamp:** ${ts}`,
    `- **Declared status (commands + coverage):** ${reportedOverall}`,
    `- **Command-only rollup:** ${commandRollup}`,
    `- **Smoke:** ${smoke}`,
    `- **Coverage thresholds:** ${thr === true ? "PASS" : thr === false ? "FAIL" : "n/a"}${coverageManifestFailed ? " (manifest error)" : ""}`,
    `- **Manifest:** \`${path.join(OUT, "COVERAGE_MANIFEST.md")}\``,
    ``,
    `## מה נבדק — תמונת מצב`,
    `- **תרחישים משוקללים (aggregate+deep+critical+synthetic):** ${o?.combinedScenarios ?? "—"}`,
    `- **שאלות מדומות (aggregate+deep):** ${o?.combinedQuestions ?? "—"}`,
    `- **סשנים מדומים:** ${o?.combinedSessions ?? "—"}`,
    `- **PDFים (דוגמת overnight PDF):** ${o?.pdfsGeneratedCount ?? "—"}`,
    `- **כיתות מיוצגות:** ${g}`,
    `- **מקצועות (איחוד):** ${subs}`,
    `- **פקודות שעברו (pass):** ${o?.aiTestsCommands ?? "—"} / ${cov?.overall?.totalCommands ?? "—"}`,
    ``,
    `## פערים (קצר)`,
    ...(cov?.gapsHebrew?.length ? cov.gapsHebrew.slice(0, 12).map((x) => `- ${x}`) : ["- (none recorded)"]),
    ``,
    `לטבלאות מלאות (A–H) ראו \`COVERAGE_MANIFEST.md\` בתיקיית הריצה.`,
    ``,
  ].join("\n");
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function writeJson(p, obj) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

function readLogTail(logPath, maxChars = 4500) {
  try {
    const t = fs.readFileSync(logPath, "utf8");
    return t.length <= maxChars ? t : t.slice(-maxChars);
  } catch {
    return "";
  }
}

/**
 * @param {string} text
 * @returns {string}
 */
function classifyFailureCategory(text) {
  const t = String(text || "");
  if (/ERR_MODULE_NOT_FOUND|Cannot find module|MODULE_NOT_FOUND/i.test(t)) return "ESM_NODE_RUNNER_FAILURE";
  if (/C:\\Users\\[A-Za-z]+\s*$/m.test(t) || /\bC:\\Users\\[A-Za-z]+\s*$/i.test(t)) return "WINDOWS_PATH_FAILURE";
  if (/EPERM|EACCES|ENOTFOUND.*Supabase|Missing .*SUPABASE|LEARNING_SUPABASE_SERVICE_ROLE/i.test(t)) return "ENV_MISSING";
  if (/INFRA_SERVER_FAILURE|dev server did not reach HTTP 200/i.test(t)) return "INFRA_SERVER_FAILURE";
  if (/EADDRINUSE|ECONNREFUSED|ENOTFOUND|fetch failed|network\s/i.test(t) && /127\.0\.0\.1|localhost/i.test(t))
    return "DEV_SERVER_FAILURE";
  if (/QA PDF gate cannot reach|cannot reach .*parent-report-detailed/i.test(t)) return "PDF_GATE_FAILURE";
  if (/404|HTTP\s*404/i.test(t) && /parent-report|pdf|Playwright|QA PDF/i.test(t)) return "PDF_GATE_FAILURE";
  if (/waitForSelector:\s*Timeout|locator\(.*\).*Timeout/i.test(t)) return "PRODUCT_FAILURE";
  if (/AssertionError|Assertion \[|throws:|Expected|✗\s*FAIL|scenario.*fail/i.test(t)) return "PRODUCT_FAILURE";
  if (/spawn_error|ENOENT|command not found/i.test(t)) return "TEST_RUNNER_FAILURE";
  return "TEST_RUNNER_FAILURE";
}

function categoryBlocksRelease(cat) {
  if (cat === "PRODUCT_FAILURE") return true;
  if (cat === "ENV_MISSING") return true;
  if (cat === "ESM_NODE_RUNNER_FAILURE") return false;
  if (cat === "WINDOWS_PATH_FAILURE") return false;
  if (cat === "DEV_SERVER_FAILURE") return false;
  if (cat === "INFRA_SERVER_FAILURE") return false;
  if (cat === "PDF_GATE_FAILURE") return false;
  if (cat === "TEST_RUNNER_FAILURE") return false;
  if (cat === "ADVISORY_WARNING") return false;
  return false;
}

/**
 * @returns {Promise<{ ok: boolean; lastStatus: number; lastErr: string }>}
 */
async function waitForPage200(baseUrl, pathname, maxMs) {
  const url = `${String(baseUrl).replace(/\/$/, "")}${pathname}`;
  const start = Date.now();
  let lastStatus = 0;
  let lastErr = "";
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(15000) });
      lastStatus = r.status;
      if (r.status === 200) return { ok: true, lastStatus: 200, lastErr: "" };
      lastErr = `HTTP ${r.status}`;
    } catch (e) {
      lastErr = String(e?.message || e);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return { ok: false, lastStatus, lastErr };
}

/**
 * Start Next dev; wait until /learning/parent-report-detailed returns 200.
 * @returns {Promise<{ port: number; base: string; kill: () => void; health: { ok: boolean }; bootLogPath: string; proc: import('child_process').ChildProcess }>}
 */
async function startDevServer(bootLogPath) {
  const port = await findFreePort();
  const env = { ...process.env, PORT: String(port) };
  const baseOpts = {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  };
  const proc = NPX_CLI
    ? spawn(nodeExeForNpm(), [NPX_CLI, "next", "dev", "-p", String(port)], { ...baseOpts, shell: false })
    : spawn(NPX, ["next", "dev", "-p", String(port)], { ...baseOpts, shell: process.platform === "win32" });
  let boot = "";
  proc.stdout?.on("data", (c) => {
    boot += c.toString();
  });
  proc.stderr?.on("data", (c) => {
    boot += c.toString();
  });
  const base = `http://127.0.0.1:${port}`;
  const health = await waitForPage200(base, "/learning/parent-report-detailed", DEV_HEALTH_MAX_MS);
  mkdirp(path.dirname(bootLogPath));
  fs.writeFileSync(bootLogPath, redactSecrets(boot.slice(-150000)), "utf8");

  return {
    port,
    base,
    proc,
    health,
    bootLogPath,
    kill: () => {
      if (proc.pid) killProcessTree(proc.pid);
    },
  };
}

function applyPdfEnv(baseUrl, port) {
  process.env.QA_BASE_URL = baseUrl;
  process.env.PDF_GATE_BASE_URL = baseUrl;
  process.env.RENDER_GATE_BASE_URL = baseUrl;
  process.env.PORT = String(port);
}

function clearPdfEnv(saved) {
  for (const k of ["QA_BASE_URL", "PDF_GATE_BASE_URL", "RENDER_GATE_BASE_URL", "PORT"]) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
}

async function main() {
  const ts = stamp();
  const OUT = path.join(ROOT, "reports", "overnight-parent-ai-audit", ts);
  const logs = path.join(OUT, "logs");
  mkdirp(logs);

  const scripts = packageScripts(ROOT);
  /** @type {any[]} */
  const commands = [];

  async function recordNpm(id, npmScript, timeoutMs, phase, extra = {}) {
    const logPath = path.join(logs, `${id}.log`);
    if (!hasScript(scripts, npmScript)) {
      commands.push({
        id,
        npmScript,
        phase,
        status: "skipped_missing",
        durationMs: 0,
        logPath: null,
        failureCategory: "ADVISORY_WARNING",
        ...extra,
      });
      return;
    }
    const r = await runNpmScript(npmScript, timeoutMs, ROOT, logPath);
    const ok = !r.timedOut && r.exitCode === 0;
    const status = r.timedOut ? "timeout" : ok ? "pass" : "fail";
    const tail = readLogTail(logPath);
    const failureCategory = ok ? null : classifyFailureCategory(tail);
    commands.push({
      id,
      npmScript,
      phase,
      status,
      exitCode: r.exitCode,
      timedOut: r.timedOut,
      durationMs: r.durationMs,
      logPath,
      failureCategory,
      failureExcerpt: ok ? null : redactSecrets(tail.slice(-1200)),
      blocksRelease: ok ? false : categoryBlocksRelease(failureCategory || "TEST_RUNNER_FAILURE"),
      ...extra,
    });
  }

  async function recordNpx(id, args, timeoutMs, phase, envExtra = {}) {
    const logPath = path.join(logs, `${id}.log`);
    const r = await runNpxArgs(args, timeoutMs, ROOT, logPath, envExtra);
    const ok = !r.timedOut && r.exitCode === 0;
    const tail = readLogTail(logPath);
    const failureCategory = ok ? null : classifyFailureCategory(tail);
    commands.push({
      id,
      command: args.join(" "),
      phase,
      status: r.timedOut ? "timeout" : ok ? "pass" : "fail",
      exitCode: r.exitCode,
      timedOut: r.timedOut,
      durationMs: r.durationMs,
      logPath,
      failureCategory,
      failureExcerpt: ok ? null : redactSecrets(tail.slice(-1200)),
      blocksRelease: ok ? false : categoryBlocksRelease(failureCategory || "TEST_RUNNER_FAILURE"),
    });
  }

  /** Node binary + script path (no npx) — safe for Windows paths with spaces. */
  async function recordNodeArgv(id, argv, timeoutMs, phase) {
    const logPath = path.join(logs, `${id}.log`);
    const r = await runSpawnCommand(nodeExeForNpm(), argv, { cwd: ROOT, timeoutMs, logPath });
    const ok = !r.timedOut && r.exitCode === 0;
    const tail = readLogTail(logPath);
    const failureCategory = ok ? null : classifyFailureCategory(tail);
    commands.push({
      id,
      command: [nodeExeForNpm(), ...argv].join(" "),
      phase,
      status: r.timedOut ? "timeout" : ok ? "pass" : "fail",
      exitCode: r.exitCode,
      timedOut: r.timedOut,
      durationMs: r.durationMs,
      logPath,
      failureCategory,
      failureExcerpt: ok ? null : redactSecrets(tail.slice(-1200)),
      blocksRelease: ok ? false : categoryBlocksRelease(failureCategory || "TEST_RUNNER_FAILURE"),
    });
  }

  const copilotScriptsFull = [
    "test:parent-copilot-phase6",
    "test:parent-copilot-observability-contract",
    "test:parent-copilot-parent-render",
    "test:parent-copilot-product-behavior",
    "test:parent-copilot-classifier-edge-matrix",
    "test:parent-copilot-scope-collision",
    "test:parent-copilot-semantic-nearmiss",
    "test:parent-copilot-broad-report-routing",
    "test:parent-copilot-recommendation-semantic",
    "test:parent-copilot-question-class-behavior",
    "test:parent-copilot-async-llm-gate",
    "test:parent-copilot-copilot-turn-api",
  ];
  const copilotScripts = SMOKE ? ["test:parent-copilot-phase6"] : copilotScriptsFull;

  // -------- A. Baseline build --------
  const buildStart = Date.now();
  if (!SMOKE || !process.env.OVERNIGHT_SMOKE_SKIP_BUILD) {
    await recordNpm("build", "build", SMOKE ? Math.min(T_BUILD, 10 * 60 * 1000) : T_BUILD, "A");
  } else {
    commands.push({
      id: "build",
      phase: "A",
      status: "skipped_smoke",
      npmScript: "build",
      durationMs: 0,
      failureCategory: "ADVISORY_WARNING",
      note: "OVERNIGHT_SMOKE_SKIP_BUILD=1",
    });
  }
  const buildMeta = {
    durationMs: Date.now() - buildStart,
    note: "Webpack warnings from question-metadata scanner → planner bridge may be pre-existing.",
  };
  const buildRow = commands.find((c) => c.id === "build");
  writeJson(path.join(OUT, "build-summary.json"), { ...buildRow, ...buildMeta });
  fs.writeFileSync(
    path.join(OUT, "build-summary.md"),
    `# Build\n\nStatus: ${buildRow?.status || "skipped_smoke"}\nDuration: ${buildMeta.durationMs}ms\n`,
    "utf8"
  );

  // -------- B. Parent AI core --------
  if (!SMOKE) {
    await recordNpm("b1", "test:parent-ai-context:consistency", T_TEST, "B");
    await recordNpm("b2", "test:parent-report-ai:integration", T_TEST, "B");
    await recordNpm("b3", "test:parent-report-ai:scenario-simulator", T_TEST, "B");
  } else {
    await recordNpm("b1", "test:parent-ai-context:consistency", T_TEST, "B");
  }
  if (!SMOKE) {
    copyTreeIfExists(path.join(ROOT, "reports/parent-report-ai"), path.join(OUT, "copied/parent-report-ai"));
    copyTreeIfExists(path.join(ROOT, "reports/parent-ai"), path.join(OUT, "copied/parent-ai-latest"));
  }

  // -------- C. Parent Copilot --------
  for (let i = 0; i < copilotScripts.length; i++) {
    await recordNpm(`c-${i}`, copilotScripts[i], T_TEST, "C");
  }

  // -------- D. External / feedback / manual matrix --------
  if (!SMOKE) {
    await recordNpm("d1", "test:parent-ai-phase-e:external", T_TEST, "D");
    await recordNpm("d2", "test:parent-ai:simulations", T_TEST, "D");
    await recordNpm("d3", "test:parent-ai:feedback-aggregate", T_TEST, "D");
    await recordNpm("d4", "test:parent-ai:assistant-qa", T_TEST, "D");
    await recordNpm("d5", "test:parent-ai:external-question", T_TEST, "D");
    await recordNpm("d6", "test:parent-ai:bad-prompt", T_TEST, "D");
    await recordNpx(
      "d-manual",
      ["tsx", path.join(ROOT, "scripts/parent-ai-manual-qa-matrix.mjs"), "--outDir", path.join(OUT, "manual-qa-matrix-output")],
      T_TEST,
      "D"
    );
  }

  // -------- E. Parent report SSR --------
  await recordNpx("e-ssr", ["tsx", path.join(ROOT, "scripts/parent-report-pages-ssr.mjs")], T_TEST, "E");
  if (!SMOKE) {
    await recordNpm("e-phase1", "test:parent-report-phase1", T_TEST, "E");
  }

  // -------- F. PDF + sample PDFs + optional learning-simulator PDF gate --------
  let dev = null;
  const savedEnv = {
    QA_BASE_URL: process.env.QA_BASE_URL,
    PDF_GATE_BASE_URL: process.env.PDF_GATE_BASE_URL,
    RENDER_GATE_BASE_URL: process.env.RENDER_GATE_BASE_URL,
    PORT: process.env.PORT,
  };
  const externalPdfBase = String(process.env.OVERNIGHT_EXTERNAL_QA_URL || "").trim();
  let infraPdfNote = null;
  let pdfGateBlocked = false;

  try {
    if (externalPdfBase) {
      try {
        const raw = String(externalPdfBase);
        const u = new URL(raw.includes("://") ? raw : `http://${raw}`);
        applyPdfEnv(raw, u.port || process.env.PORT || "3000");
      } catch {
        applyPdfEnv(externalPdfBase, process.env.PORT || "3000");
      }
    } else {
      // `.env` often pins QA_BASE_URL to a stale local port; ignore for this run and spawn managed dev.
      delete process.env.QA_BASE_URL;
      delete process.env.PDF_GATE_BASE_URL;
      delete process.env.RENDER_GATE_BASE_URL;
      dev = await startDevServer(path.join(logs, "dev-server-boot.log"));
      if (!dev.health.ok) {
        infraPdfNote = `INFRA_SERVER_FAILURE: dev server did not reach HTTP 200 on /learning/parent-report-detailed within ${DEV_HEALTH_MAX_MS}ms (lastStatus=${dev.health.lastStatus} lastErr=${dev.health.lastErr}).`;
        pdfGateBlocked = true;
        commands.push({
          id: "f-dev-health",
          phase: "F",
          status: "fail",
          failureCategory: "INFRA_SERVER_FAILURE",
          blocksRelease: false,
          logPath: dev.bootLogPath,
          failureExcerpt: infraPdfNote,
        });
        dev.kill();
        dev = null;
      } else {
        applyPdfEnv(dev.base, dev.port);
      }
    }

    if (pdfGateBlocked) {
      const blockedIds = SMOKE ? ["f-pdf-export", "f-sample-pdfs"] : ["f-pdf-export", "f-sample-pdfs", "f-ls-pdf-export"];
      for (const bid of blockedIds) {
        commands.push({
          id: bid,
          phase: "F",
          status: "fail",
          durationMs: 0,
          logPath: null,
          failureCategory: "INFRA_SERVER_FAILURE",
          failureExcerpt: infraPdfNote,
          blocksRelease: false,
          npmScript:
            bid === "f-pdf-export"
              ? "qa:parent-pdf-export"
              : bid === "f-ls-pdf-export"
                ? "qa:learning-simulator:pdf-export"
                : "overnight-parent-ai-sample-pdfs.mjs",
          note: "Not run — dev server health check failed (INFRA_SERVER_FAILURE)",
        });
      }
    } else {
      // Full Playwright PDF proof is a strict product gate; smoke only proves server + sample PDF path.
      if (!SMOKE) {
        await recordNpm("f-pdf-export", "qa:parent-pdf-export", T_PDF, "F");
        copyTreeIfExists(path.join(ROOT, "qa-visual-output"), path.join(OUT, "pdf/qa-visual-output"));
      } else {
        commands.push({
          id: "f-pdf-export",
          phase: "F",
          status: "skipped_smoke",
          npmScript: "qa:parent-pdf-export",
          durationMs: 0,
          failureCategory: "ADVISORY_WARNING",
          note: "Full qa:parent-pdf-export skipped in --smoke (orchestrator proves dev server + sample PDFs only)",
        });
      }
      const sampleDir = path.join(OUT, "sample-pdfs");
      mkdirp(sampleDir);
      await recordNodeArgv(
        "f-sample-pdfs",
        [path.join(ROOT, "scripts/overnight-parent-ai-sample-pdfs.mjs"), "--outDir", sampleDir],
        samplePdfsTimeoutMs(),
        "F"
      );
      if (!SMOKE) {
        await recordNpm("f-ls-pdf-export", "qa:learning-simulator:pdf-export", T_PDF, "F");
      }
    }
  } catch (e) {
    commands.push({
      id: "f-pdf-block",
      phase: "F",
      status: "fail",
      failureCategory: "PDF_GATE_FAILURE",
      failureExcerpt: String(e?.message || e),
      blocksRelease: false,
    });
  } finally {
    try {
      dev?.kill?.();
    } catch {
      /* ignore */
    }
    clearPdfEnv(savedEnv);
  }

  // -------- G. Metadata / planner --------
  if (!SMOKE) {
    await recordNpm("g1", "qa:question-metadata", T_TEST, "G");
    await recordNpm("g2", "test:adaptive-planner:artifacts", T_TEST, "G");
    await recordNpm("g3", "test:adaptive-planner:runtime", T_TEST, "G");
    await recordNpm("g4", "test:adaptive-planner:recommended-practice", T_TEST, "G");
    await recordNpm("g5", "test:adaptive-planner:scenario-simulator", T_TEST, "G");
  }

  // -------- H. Learning simulator (skipped in smoke — focuses on orchestrator + PDF + one Copilot) --------
  if (!SMOKE) {
    await recordNpm("h-quick", "qa:learning-simulator:quick", T_LS_QUICK, "H");
    await recordNpm("h-full", "qa:learning-simulator:full", T_LS_FULL, "H");
    copyTreeIfExists(path.join(ROOT, "reports/learning-simulator"), path.join(OUT, "copied/learning-simulator"));
  } else {
    commands.push({
      id: "h-smoke-skip",
      phase: "H",
      status: "skipped_smoke",
      durationMs: 0,
      failureCategory: "ADVISORY_WARNING",
      note: "Learning simulator skipped in --smoke mode",
    });
  }

  // -------- I. Synthetic E2E --------
  if (!SMOKE) {
    await recordNpx(
      "i-synthetic",
      ["tsx", path.join(ROOT, "scripts/overnight-synthetic-e2e-scenarios.mjs"), "--outDir", path.join(OUT, "synthetic-e2e")],
      T_TEST,
      "I"
    );
  }

  // -------- Aggregated log aliases --------
  function concatLogs(ids, destName) {
    const parts = [];
    for (const id of ids) {
      const p = path.join(logs, `${id}.log`);
      if (fs.existsSync(p)) parts.push(fs.readFileSync(p, "utf8"));
    }
    if (parts.length) fs.writeFileSync(path.join(OUT, destName), redactSecrets(parts.join("\n\n---\n\n")), "utf8");
  }
  const cIds = copilotScripts.map((_, i) => `c-${i}`);
  concatLogs(["b1", "b2", "b3"].filter((id) => commands.some((c) => c.id === id)), "parent-ai-core.log");
  concatLogs(cIds, "parent-copilot-all.log");
  concatLogs(["e-ssr", "e-phase1"].filter((id) => commands.some((c) => c.id === id)), "parent-report-render.log");
  concatLogs(
    ["f-pdf-export", "f-sample-pdfs", "f-ls-pdf-export"].filter((id) => commands.some((c) => c.id === id)),
    "pdf-export.log"
  );
  concatLogs(["g1", "g2", "g3", "g4", "g5"].filter((id) => commands.some((c) => c.id === id)), "engine-planner-metadata.log");
  concatLogs(["h-quick", "h-full"].filter((id) => commands.some((c) => c.id === id)), "learning-simulator.log");
  const buildLogPath = path.join(logs, "build.log");
  if (fs.existsSync(buildLogPath)) fs.copyFileSync(buildLogPath, path.join(OUT, "build.log"));

  function writePhaseSummary(slug, title, ids) {
    const rows = ids.map((id) => commands.find((c) => c.id === id)).filter(Boolean);
    writeJson(path.join(OUT, `${slug}-summary.json`), { title, rows });
    fs.writeFileSync(
      path.join(OUT, `${slug}-summary.md`),
      `# ${title}\n\n${rows.map((r) => `- **${r.id}**: ${r.status} (${r.durationMs ?? 0}ms)`).join("\n")}\n`,
      "utf8"
    );
  }
  writePhaseSummary("parent-ai-core-summary", "Parent AI core (B)", ["b1", "b2", "b3"].filter((id) => commands.some((c) => c.id === id)));
  writePhaseSummary("parent-copilot-summary", "Parent Copilot (C)", cIds);
  writePhaseSummary(
    "parent-report-render-summary",
    "Parent report render (E)",
    ["e-ssr", "e-phase1"].filter((id) => commands.some((c) => c.id === id))
  );
  writePhaseSummary(
    "pdf-export-summary",
    "PDF export (F)",
    ["f-pdf-export", "f-sample-pdfs", "f-ls-pdf-export"].filter((id) => commands.some((c) => c.id === id))
  );
  writePhaseSummary(
    "engine-planner-metadata-summary",
    "Engine / planner / metadata (G)",
    ["g1", "g2", "g3", "g4", "g5"].filter((id) => commands.some((c) => c.id === id))
  );
  writePhaseSummary(
    "learning-simulator-summary",
    "Learning simulator (H)",
    ["h-quick", "h-full"].filter((id) => commands.some((c) => c.id === id))
  );

  // -------- Summaries & classification rollup --------
  const passed = commands.filter((c) => c.status === "pass").length;
  const failed = commands.filter((c) => c.status === "fail").length;
  const timeouts = commands.filter((c) => c.status === "timeout").length;
  const skipped = commands.filter((c) => c.status === "skipped_missing" || c.status === "skipped_smoke").length;

  const infraCats = new Set([
    "DEV_SERVER_FAILURE",
    "INFRA_SERVER_FAILURE",
    "PDF_GATE_FAILURE",
    "WINDOWS_PATH_FAILURE",
    "ESM_NODE_RUNNER_FAILURE",
    "ENV_MISSING",
    "TEST_RUNNER_FAILURE",
  ]);
  let productFail = 0;
  let infraFail = 0;
  for (const c of commands) {
    if (c.status !== "fail" && c.status !== "timeout") continue;
    if (c.failureCategory === "PRODUCT_FAILURE") productFail += 1;
    else if (c.failureCategory && infraCats.has(c.failureCategory)) infraFail += 1;
    else infraFail += 1;
  }

  let overall = "PASS";
  if (failed > 0 || timeouts > 0) overall = "FAIL";
  else if (skipped > 0) overall = "PASS_WITH_WARNINGS";

  const sampleSummaryPath = path.join(OUT, "sample-pdfs", "sample-pdfs-summary.json");
  /** @type {any} */
  let samplePdfSummary = null;
  if (fs.existsSync(sampleSummaryPath)) {
    try {
      samplePdfSummary = JSON.parse(fs.readFileSync(sampleSummaryPath, "utf8"));
    } catch {
      samplePdfSummary = { ok: false, parseError: true, path: sampleSummaryPath };
    }
  }
  const samplePdfsRel = path.join("sample-pdfs", "sample-pdfs-summary.json");
  if (SMOKE && fs.existsSync(path.join(OUT, "sample-pdfs")) && (!samplePdfSummary || samplePdfSummary.ok !== true)) {
    overall = "FAIL";
  } else if (samplePdfSummary && samplePdfSummary.ok === false) {
    overall = "FAIL";
  }

  const failedRows = commands.filter((c) => c.status === "fail" || c.status === "timeout");
  const failureAnalysis = failedRows.map((c) => ({
    id: c.id,
    command: c.npmScript || c.command || c.id,
    status: c.status,
    category: c.failureCategory || "UNKNOWN",
    blocksRelease: c.blocksRelease === true,
    likelyCause:
      c.failureCategory === "INFRA_SERVER_FAILURE"
        ? "Local Next dev failed health check or QA_BASE_URL unreachable — orchestrator infra"
        : c.failureCategory === "DEV_SERVER_FAILURE"
          ? "Next dev did not become healthy or wrong QA_BASE_URL"
          : c.failureCategory === "ESM_NODE_RUNNER_FAILURE"
          ? "Run suite with tsx or fix Node ESM resolution for extensionless imports"
          : c.failureCategory === "WINDOWS_PATH_FAILURE"
            ? "Shell split path on space — use spawn argv arrays (fixed in orchestrator)"
            : c.failureCategory === "PDF_GATE_FAILURE"
              ? "Dev server down, wrong port, or page 404 — infrastructure"
              : c.failureCategory === "PRODUCT_FAILURE"
                ? "Assertion/test expectation — review product or fixture"
                : "See log excerpt",
    excerpt: c.failureExcerpt || null,
    logPath: c.logPath ? path.relative(OUT, c.logPath) : "",
    priority: c.blocksRelease ? "high" : "medium",
  }));

  const parentAiPass = SMOKE
    ? commands.some((x) => x.id === "b1" && x.status === "pass")
    : ["b1", "b2", "b3"].every((id) => commands.some((x) => x.id === id && x.status === "pass"));

  const pdfRows = commands.filter((c) => ["f-pdf-export", "f-sample-pdfs", "f-ls-pdf-export"].includes(c.id));
  const pdfFailedInfra = pdfRows.some(
    (c) =>
      (c.status === "fail" || c.status === "timeout") &&
      ["PDF_GATE_FAILURE", "DEV_SERVER_FAILURE", "INFRA_SERVER_FAILURE"].includes(c.failureCategory || "")
  );

  const topIssues = failureAnalysis.slice(0, 10);

  const failedSampleProfiles =
    samplePdfSummary?.profiles?.filter((p) => p.status === "error").map((p) => p.id) || [];
  const expectedSamplePdfs = samplePdfSummary?.expectedPdfCount ?? 10;
  const generatedSamplePdfs = samplePdfSummary?.generatedPdfCount ?? 0;
  const samplePdfFiles = Array.isArray(samplePdfSummary?.generatedFiles) ? samplePdfSummary.generatedFiles : [];

  const finalJson = {
    timestamp: ts,
    outputDir: OUT,
    smokeMode: SMOKE,
    overallStatus: overall,
    productStatus: productFail === 0 && failed === 0 ? "PASS" : productFail > 0 ? "FAIL" : "PASS_WITH_INFRA_ISSUES",
    infrastructureStatus: infraFail === 0 && !failed ? "PASS" : infraFail > 0 ? "FAIL" : "UNKNOWN",
    counts: {
      commands: commands.length,
      passed,
      failed,
      timedOut: timeouts,
      skipped,
      productFailures: productFail,
      infrastructureOrRunnerFailures: infraFail,
    },
    parentAiCorePassed: parentAiPass,
    pdfFailuresLikelyInfra: pdfFailedInfra || !!infraPdfNote,
    commands,
    failureAnalysis,
    topIssues,
    samplePdfs: {
      summaryPath: fs.existsSync(sampleSummaryPath) ? samplePdfsRel : null,
      expectedCount: expectedSamplePdfs,
      generatedCount: generatedSamplePdfs,
      ok: samplePdfSummary?.ok === true,
      failedProfiles: failedSampleProfiles,
      generatedFilenames: samplePdfFiles,
      fullPathsRelToRun: samplePdfFiles.map((f) => path.join("sample-pdfs", f)),
      validationErrors: samplePdfSummary?.validationErrors || [],
    },
    notes: {
      secrets: "Logs redacted for tokens/API keys; no .env contents written.",
      telemetry: "Synthetic Hebrew utterances only in manual matrix / synthetic E2E.",
      orchestratorV2: "spawn argv arrays (no shell); dev server health = HTTP 200; PDF_* env aligned.",
    },
  };
  writeJson(path.join(OUT, "FINAL_REPORT.json"), finalJson);

  const hebrewSummary = [
    `סיכום לילי אוטומטי (${ts})${SMOKE ? " [מצב smoke]" : ""}: מצב כולל ${overall}.`,
    `פקודות שעברו: ${passed}, נכשלו: ${failed}, timeout: ${timeouts}, דולגו: ${skipped}.`,
    `כשלי מוצר (משוערים): ${productFail}; כשלי תשתית/רנר: ${infraFail}.`,
  ].join("\n");

  const md = [
    `# FINAL_REPORT — Overnight Parent AI audit`,
    ``,
    `## 1. Overall status`,
    ``,
    `**${overall}**`,
    ``,
    `## 2. Product vs infrastructure`,
    ``,
    `- **Product-oriented failures (estimated):** ${productFail}`,
    `- **Infrastructure / test-runner failures:** ${infraFail}`,
    `- **Parent AI core scripts passed:** ${parentAiPass ? "yes (per configured IDs)" : "no / partial"}`,
    `- **PDF failures likely infra:** ${pdfFailedInfra || infraPdfNote ? "yes" : "no"}`,
    ``,
    `## 3. Executive summary (Hebrew)`,
    ``,
    hebrewSummary,
    ``,
    `## 4. Failure analysis (all fail/timeout)`,
    ``,
    JSON.stringify(failureAnalysis, null, 2),
    ``,
    `## 5. Command table`,
    ``,
    `| id | command | status | category | ms | log |`,
    `|----|---------|--------|----------|-----|-----|`,
    ...commands.map((c) => {
      const cmd = c.npmScript || c.command || c.id || "";
      const lg = c.logPath ? path.relative(OUT, c.logPath) : "";
      const cat = c.failureCategory || "";
      return `| ${c.id} | ${cmd} | ${c.status} | ${cat} | ${c.durationMs ?? ""} | ${lg} |`;
    }),
    ``,
    `## 6. Top actionable issues`,
    ``,
    JSON.stringify(topIssues, null, 2),
    ``,
    `## 7. Recommended next fixes`,
    ``,
    `1. Fix PRODUCT_FAILURE rows—review failing assertion/logic.`,
    `2. Fix ESM failures—suites now use \`tsx\` in package.json; re-run.`,
    `3. For DEV_SERVER_FAILURE—ensure port free; orchestrator waits for HTTP 200.`,
    `4. For PDF_GATE_FAILURE—set QA_BASE_URL to healthy Next dev before gates.`,
    ``,
    `## 8. Sample PDFs (overnight-parent-ai-sample-pdfs.mjs)`,
    ``,
    `- **Summary file:** \`${samplePdfsRel}\` (exists: ${fs.existsSync(sampleSummaryPath)})`,
    `- **Expected PDF count:** ${expectedSamplePdfs}`,
    `- **Generated PDF count:** ${generatedSamplePdfs}`,
    `- **summary.ok:** ${samplePdfSummary?.ok === true}`,
    `- **Failed profiles:** ${failedSampleProfiles.length ? failedSampleProfiles.join(", ") : "(none)"}`,
    `- **Generated files:** ${samplePdfFiles.length ? samplePdfFiles.join(", ") : "(see summary)"}`,
    `- **Validation errors:** ${(samplePdfSummary?.validationErrors || []).length ? JSON.stringify(samplePdfSummary.validationErrors, null, 2) : "(none)"}`,
    ``,
    `## Artifact index`,
    `- Output root: \`${OUT}\``,
    `- Logs: \`${logs}\``,
    `- PDF / sample-pdfs: \`pdf/\`, \`sample-pdfs/\``,
    ``,
  ].join("\n");

  fs.writeFileSync(path.join(OUT, "FINAL_REPORT.md"), md, "utf8");

  const morning = [
    `# Morning summary`,
    ``,
    `- **Overall:** ${overall}`,
    `- **Smoke mode:** ${SMOKE ? "yes" : "no"}`,
    `- **Product blockers:** ${productFail} failing commands classified PRODUCT_FAILURE (see FINAL_REPORT.json).`,
    `- **Infrastructure blockers:** ${infraFail} failing commands (dev server, PDF gate, ESM runner, env, path).`,
    `- **Sample PDFs:** expected ${expectedSamplePdfs}, generated ${generatedSamplePdfs}, ok=${samplePdfSummary?.ok === true}${failedSampleProfiles.length ? `, failed profiles: ${failedSampleProfiles.join(", ")}` : ""}`,
    `- **Sample PDF paths:** \`${path.join(OUT, "sample-pdfs")}\` — manifest \`${samplePdfsRel}\``,
    ``,
    `## Top 5 fixes`,
    ...failureAnalysis.slice(0, 5).map((f, i) => `${i + 1}. [${f.category}] ${f.id}: ${f.likelyCause}`),
    ``,
    `## Where PDFs are`,
    `- See \`pdf/qa-visual-output/\` and \`sample-pdfs/\` under this run folder.`,
    ``,
    `## Where logs are`,
    `- \`${logs}\` — per-command \`.log\`; merged aliases: parent-ai-core.log, parent-copilot-all.log, pdf-export.log, etc.`,
    ``,
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "MORNING_SUMMARY.md"), morning, "utf8");

  const manifestScript = path.join(ROOT, "scripts", "overnight-coverage-manifest.mjs");
  const manifestProc = spawnSync(process.execPath, [manifestScript, "--outDir", OUT], {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    stdio: "inherit",
  });
  const coverageManifestFailed = manifestProc.status !== 0 && manifestProc.status != null;

  let cov = null;
  try {
    cov = JSON.parse(fs.readFileSync(path.join(OUT, "COVERAGE_MANIFEST.json"), "utf8"));
  } catch {
    cov = null;
  }

  let reportedOverall = overall;
  if (coverageManifestFailed) reportedOverall = "FAIL";
  else if (cov?.thresholdsPass === false && cov?.enforcementEnabled) reportedOverall = "FAIL";

  const latestRoot = path.join(ROOT, "reports/overnight-parent-ai-audit");
  writeJson(path.join(latestRoot, "latest.json"), {
    path: OUT,
    timestamp: ts,
    overallStatus: reportedOverall,
    commandRollupStatus: overall,
    smoke: SMOKE,
    coverageManifestPath: path.join(OUT, "COVERAGE_MANIFEST.json"),
    coverageThresholdsPass: cov?.thresholdsPass ?? null,
    coverageEnforcementEnabled: cov?.enforcementEnabled ?? null,
    coverageSummary: cov?.overall ?? null,
    gapsHebrew: cov?.gapsHebrew ?? [],
  });
  fs.writeFileSync(
    path.join(latestRoot, "latest.md"),
    buildLatestAuditMd({
      OUT,
      ts,
      reportedOverall,
      commandRollup: overall,
      smoke: SMOKE,
      cov,
      coverageManifestFailed,
    }),
    "utf8"
  );

  console.log("overnight-parent-ai-audit complete:", OUT, reportedOverall, SMOKE ? "(smoke)" : "");
  if (failed > 0 || timeouts > 0 || overall === "FAIL" || reportedOverall === "FAIL" || coverageManifestFailed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
