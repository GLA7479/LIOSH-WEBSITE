#!/usr/bin/env node
/**
 * Overnight Parent AI + learning QA orchestrator (reporting only).
 * Continues on failure; redacts secrets in logs.
 */
import { spawn } from "node:child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import {
  mkdirp,
  redactSecrets,
  runNpmScript,
  findFreePort,
  copyTreeIfExists,
  packageScripts,
  hasScript,
} from "./lib/overnight-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const T_BUILD = 15 * 60 * 1000;
const T_TEST = 10 * 60 * 1000;
const T_PDF = 20 * 60 * 1000;
const T_LS_QUICK = 45 * 60 * 1000;
const T_LS_FULL = 120 * 60 * 1000;

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function writeJson(p, obj) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

async function runNpx(args, timeoutMs, cwd, logPath) {
  const start = Date.now();
  return new Promise((resolve) => {
    const proc = spawn(process.platform === "win32" ? "npx.cmd" : "npx", args, {
      cwd,
      shell: true,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    proc.stdout?.on("data", (c) => {
      out += c.toString();
    });
    proc.stderr?.on("data", (c) => {
      out += c.toString();
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill("SIGTERM");
    }, timeoutMs);
    proc.on("close", (code) => {
      clearTimeout(timer);
      mkdirp(path.dirname(logPath));
      fs.writeFileSync(logPath, redactSecrets(out), "utf8");
      resolve({
        exitCode: timedOut ? null : code,
        timedOut,
        durationMs: Date.now() - start,
        logPath,
      });
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      mkdirp(path.dirname(logPath));
      fs.writeFileSync(logPath, redactSecrets(`${out}\n${err}`), "utf8");
      resolve({ exitCode: 1, timedOut: false, durationMs: Date.now() - start, logPath });
    });
  });
}

/** Start Next dev server; returns { kill, port } */
async function startDevServer(logPath, preferredPort = null) {
  const port = preferredPort || (await findFreePort());
  const isWin = process.platform === "win32";
  const proc = spawn(isWin ? "npx.cmd" : "npx", ["next", "dev", "-p", String(port)], {
    cwd: ROOT,
    shell: true,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });
  let boot = "";
  proc.stdout?.on("data", (c) => {
    boot += c.toString();
  });
  proc.stderr?.on("data", (c) => {
    boot += c.toString();
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 90; i++) {
    try {
      const r = await fetch(`${base}/learning/parent-report-detailed`, {
        method: "GET",
        signal: AbortSignal.timeout(8000),
      });
      if (r.status < 500) break;
    } catch {
      /* wait */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  mkdirp(path.dirname(logPath));
  fs.writeFileSync(logPath, redactSecrets(boot.slice(-120000)), "utf8");
  return {
    port,
    base,
    kill: () => {
      try {
        proc.kill("SIGTERM");
      } catch {
        /* ignore */
      }
    },
  };
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
    let status = "run";
    if (!hasScript(scripts, npmScript)) {
      commands.push({
        id,
        npmScript,
        phase,
        status: "skipped_missing",
        durationMs: 0,
        logPath: null,
        ...extra,
      });
      return;
    }
    const r = await runNpmScript(npmScript, timeoutMs, ROOT, logPath);
    const ok = !r.timedOut && r.exitCode === 0;
    status = r.timedOut ? "timeout" : ok ? "pass" : "fail";
    commands.push({
      id,
      npmScript,
      phase,
      status,
      exitCode: r.exitCode,
      timedOut: r.timedOut,
      durationMs: r.durationMs,
      logPath,
      ...extra,
    });
  }

  async function recordNpx(id, args, timeoutMs, phase) {
    const logPath = path.join(logs, `${id}.log`);
    const r = await runNpx(args, timeoutMs, ROOT, logPath);
    const ok = !r.timedOut && r.exitCode === 0;
    commands.push({
      id,
      command: args.join(" "),
      phase,
      status: r.timedOut ? "timeout" : ok ? "pass" : "fail",
      exitCode: r.exitCode,
      timedOut: r.timedOut,
      durationMs: r.durationMs,
      logPath,
    });
  }

  // -------- A. Baseline build --------
  const buildStart = Date.now();
  await recordNpm("build", "build", T_BUILD, "A");
  const buildMeta = {
    durationMs: Date.now() - buildStart,
    note: "Webpack warnings from question-metadata scanner → planner bridge may be pre-existing.",
  };
  writeJson(path.join(OUT, "build-summary.json"), {
    ...commands.find((c) => c.id === "build"),
    ...buildMeta,
  });
  fs.writeFileSync(
    path.join(OUT, "build-summary.md"),
    `# Build\n\nStatus: ${commands.find((c) => c.id === "build")?.status}\nDuration: ${buildMeta.durationMs}ms\n`,
    "utf8"
  );

  // -------- B. Parent AI core --------
  await recordNpm("b1", "test:parent-ai-context:consistency", T_TEST, "B");
  await recordNpm("b2", "test:parent-report-ai:integration", T_TEST, "B");
  await recordNpm("b3", "test:parent-report-ai:scenario-simulator", T_TEST, "B");
  copyTreeIfExists(path.join(ROOT, "reports/parent-report-ai"), path.join(OUT, "copied/parent-report-ai"));
  copyTreeIfExists(path.join(ROOT, "reports/parent-ai"), path.join(OUT, "copied/parent-ai-latest"));

  // -------- C. Parent Copilot suites --------
  const copilotScripts = [
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
  for (let i = 0; i < copilotScripts.length; i++) {
    await recordNpm(`c-${i}`, copilotScripts[i], T_TEST, "C");
  }

  // -------- D. External / feedback / manual matrix --------
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

  // -------- E. Parent report SSR --------
  await recordNpx("e-ssr", ["tsx", path.join(ROOT, "scripts/parent-report-pages-ssr.mjs")], T_TEST, "E");
  await recordNpm("e-phase1", "test:parent-report-phase1", T_TEST, "E");

  // -------- F. PDF + sample PDFs + optional learning-simulator PDF gate --------
  let dev = null;
  const savedQaBase = process.env.QA_BASE_URL;
  let startedLocalDev = false;
  try {
    if (!savedQaBase) {
      dev = await startDevServer(path.join(logs, "dev-server-boot.log"));
      process.env.QA_BASE_URL = dev.base;
      startedLocalDev = true;
    }
    await recordNpm("f-pdf-export", "qa:parent-pdf-export", T_PDF, "F");
    copyTreeIfExists(path.join(ROOT, "qa-visual-output"), path.join(OUT, "pdf/qa-visual-output"));
    const sampleDir = path.join(OUT, "sample-pdfs");
    mkdirp(sampleDir);
    await recordNpx(
      "f-sample-pdfs",
      ["node", path.join(ROOT, "scripts/overnight-parent-ai-sample-pdfs.mjs"), "--outDir", sampleDir],
      T_PDF,
      "F"
    );
    await recordNpm("f-ls-pdf-export", "qa:learning-simulator:pdf-export", T_PDF, "F");
  } catch (e) {
    commands.push({
      id: "f-pdf-block",
      phase: "F",
      status: "fail",
      error: String(e?.message || e),
    });
  } finally {
    try {
      dev?.kill?.();
    } catch {
      /* ignore */
    }
    if (startedLocalDev) delete process.env.QA_BASE_URL;
    else if (savedQaBase) process.env.QA_BASE_URL = savedQaBase;
  }

  // -------- G. Metadata / planner --------
  await recordNpm("g1", "qa:question-metadata", T_TEST, "G");
  await recordNpm("g2", "test:adaptive-planner:artifacts", T_TEST, "G");
  await recordNpm("g3", "test:adaptive-planner:runtime", T_TEST, "G");
  await recordNpm("g4", "test:adaptive-planner:recommended-practice", T_TEST, "G");
  await recordNpm("g5", "test:adaptive-planner:scenario-simulator", T_TEST, "G");

  // -------- H. Learning simulator --------
  await recordNpm("h-quick", "qa:learning-simulator:quick", T_LS_QUICK, "H");
  await recordNpm("h-full", "qa:learning-simulator:full", T_LS_FULL, "H");
  copyTreeIfExists(path.join(ROOT, "reports/learning-simulator"), path.join(OUT, "copied/learning-simulator"));

  // -------- I. Synthetic E2E --------
  await recordNpx(
    "i-synthetic",
    ["tsx", "scripts/overnight-synthetic-e2e-scenarios.mjs", "--outDir", path.join(OUT, "synthetic-e2e")],
    T_TEST,
    "I"
  );

  // -------- Aggregated log aliases (requested filenames) --------
  function concatLogs(ids, destName) {
    const parts = [];
    for (const id of ids) {
      const p = path.join(logs, `${id}.log`);
      if (fs.existsSync(p)) parts.push(fs.readFileSync(p, "utf8"));
    }
    if (parts.length) fs.writeFileSync(path.join(OUT, destName), redactSecrets(parts.join("\n\n---\n\n")), "utf8");
  }
  concatLogs(["b1", "b2", "b3"], "parent-ai-core.log");
  concatLogs(
    copilotScripts.map((_, i) => `c-${i}`),
    "parent-copilot-all.log"
  );
  concatLogs(["e-ssr", "e-phase1"], "parent-report-render.log");
  concatLogs(["f-pdf-export", "f-sample-pdfs", "f-ls-pdf-export"], "pdf-export.log");
  concatLogs(["g1", "g2", "g3", "g4", "g5"], "engine-planner-metadata.log");
  concatLogs(["h-quick", "h-full"], "learning-simulator.log");
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
  writePhaseSummary("parent-ai-core-summary", "Parent AI core (B)", ["b1", "b2", "b3"]);
  writePhaseSummary(
    "parent-copilot-summary",
    "Parent Copilot (C)",
    copilotScripts.map((_, i) => `c-${i}`)
  );
  writePhaseSummary("parent-report-render-summary", "Parent report render (E)", ["e-ssr", "e-phase1"]);
  writePhaseSummary("pdf-export-summary", "PDF export (F)", ["f-pdf-export", "f-sample-pdfs", "f-ls-pdf-export"]);
  writePhaseSummary("engine-planner-metadata-summary", "Engine / planner / metadata (G)", ["g1", "g2", "g3", "g4", "g5"]);
  writePhaseSummary("learning-simulator-summary", "Learning simulator (H)", ["h-quick", "h-full"]);

  // -------- Summaries --------
  const passed = commands.filter((c) => c.status === "pass").length;
  const failed = commands.filter((c) => c.status === "fail").length;
  const timeouts = commands.filter((c) => c.status === "timeout").length;
  const skipped = commands.filter((c) => c.status === "skipped_missing").length;

  let overall = "PASS";
  if (failed > 0 || timeouts > 0) overall = "FAIL";
  else if (skipped > 0) overall = "PASS_WITH_WARNINGS";

  const topIssues = commands
    .filter((c) => c.status === "fail" || c.status === "timeout")
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      cmd: c.npmScript || c.command,
      status: c.status,
    }));

  const finalJson = {
    timestamp: ts,
    outputDir: OUT,
    overallStatus: overall,
    counts: {
      commands: commands.length,
      passed,
      failed,
      timedOut: timeouts,
      skipped,
    },
    commands,
    topIssues,
    notes: {
      secrets: "Logs redacted for tokens/API keys; no .env contents written.",
      telemetry: "Synthetic Hebrew utterances only in manual matrix / synthetic E2E.",
    },
  };
  writeJson(path.join(OUT, "FINAL_REPORT.json"), finalJson);

  const hebrewSummary = [
    `סיכום לילי אוטומטי (${ts}): מצב כולל ${overall}.`,
    `פקודות שעברו: ${passed}, נכשלו: ${failed}, timeout: ${timeouts}, לא קיימות בסקריפטים: ${skipped}.`,
    `פרטים מלאים בטבלה ובקובצי הלוג בתיקייה.`,
  ].join("\n");

  const md = [
    `# FINAL_REPORT — Overnight Parent AI audit`,
    ``,
    `## 1. Overall status`,
    ``,
    `**${overall}**`,
    ``,
    `## 2. Executive summary (Hebrew)`,
    ``,
    hebrewSummary,
    ``,
    `## 3. Command table`,
    ``,
    `| id | command | status | ms | log |`,
    `|----|---------|--------|-----|-----|`,
    ...commands.map((c) => {
      const cmd = c.npmScript || c.command || c.id || "";
      const lg = c.logPath ? path.relative(OUT, c.logPath) : "";
      return `| ${c.id} | ${cmd} | ${c.status} | ${c.durationMs ?? ""} | ${lg} |`;
    }),
    ``,
    `## 4. Main failures (top 10)`,
    ``,
    JSON.stringify(topIssues, null, 2),
    ``,
    `## 5. Parent AI summary`,
    `- Insight / report AI tests: see phase B logs and \`parent-ai-core-summary.json\`.`,
    `- Detailed Copilot suites: phase C and \`parent-copilot-summary.json\`.`,
    `- PDF gates: phase F; profile PDFs under \`sample-pdfs/\`.`,
    `- External / simulations / feedback: phase D.`,
    ``,
    `## 6. Safety summary (synthetic checks)`,
    `- Manual matrix + Phase F simulators cover hedging, external framing, practice disclaimer.`,
    `- Review \`manual-qa-matrix-output/\` and \`synthetic-e2e/\` for heuristic failures.`,
    ``,
    `## 7. Data / privacy`,
    `- No production telemetry; secrets redacted in logs.`,
    ``,
    `## 8. Engine / planner / metadata`,
    `- Phase G commands and logs (\`g1\`–\`g5\`).`,
    ``,
    `## 9. Learning simulator`,
    `- Phase H + copied \`reports/learning-simulator\` snapshot.`,
    ``,
    `## 10. Remaining work / priorities`,
    `- Investigate any **fail** or **timeout** rows first; then warnings from skipped scripts.`,
    `- PDF timeouts often mean dev server not ready — re-run with \`QA_BASE_URL\`.`,
    ``,
    `## 11. Recommended next tasks (first pass)`,
    `1. Fix failing npm scripts with exit code ≠ 0.`,
    `2. Re-run timed-out steps with higher timeout or healthier machine.`,
    `3. Verify PDF artifacts under \`pdf/\` and \`sample-pdfs/\`.`,
    `4. Triage learning-simulator output under \`copied/learning-simulator/\`.`,
    `5. Close gaps in question-metadata / planner if G phase failed.`,
    ``,
    `## Artifact index`,
    `- Output root: \`${OUT}\``,
    `- Logs: \`${logs}\`, merged: \`parent-ai-core.log\`, \`parent-copilot-all.log\`, \`build.log\``,
    `- Copied reports: \`copied/\``,
    `- PDF artifacts: \`pdf/\`, \`sample-pdfs/\` (profile PDFs named \`*__parent-report-*.pdf\`)`,
    `- Synthetic: \`synthetic-e2e/\`, manual matrix: \`manual-qa-matrix-output/\``,
    ``,
  ].join("\n");

  fs.writeFileSync(path.join(OUT, "FINAL_REPORT.md"), md, "utf8");

  const latestRoot = path.join(ROOT, "reports/overnight-parent-ai-audit");
  writeJson(path.join(latestRoot, "latest.json"), { path: OUT, timestamp: ts, overallStatus: overall });
  fs.writeFileSync(path.join(latestRoot, "latest.md"), `# Latest overnight run\n\nFolder: ${OUT}\nStatus: ${overall}\n`, "utf8");

  console.log("overnight-parent-ai-audit complete:", OUT, overall);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
