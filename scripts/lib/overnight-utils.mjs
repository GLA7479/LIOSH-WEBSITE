/**
 * Shared helpers for overnight QA orchestration (reporting only).
 * Spawning uses argv arrays + shell:false so Windows paths with spaces work reliably.
 */
import { spawn, execSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, cpSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createServer } from "node:net";

/**
 * npm-cli.js next to the active node.exe. When the shell uses Cursor's helper node.exe,
 * npm is not bundled there — fall back to the system Node install (Windows: Program Files\\nodejs).
 */
function npmCliPath() {
  const nextToNode = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  if (existsSync(nextToNode)) return nextToNode;
  if (process.platform === "win32") {
    const pf = process.env.ProgramFiles || "C:\\Program Files";
    const sys = join(pf, "nodejs", "node_modules", "npm", "bin", "npm-cli.js");
    if (existsSync(sys)) return sys;
  }
  return null;
}

export function npxCliPath() {
  const nextToNode = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
  if (existsSync(nextToNode)) return nextToNode;
  if (process.platform === "win32") {
    const pf = process.env.ProgramFiles || "C:\\Program Files";
    const sys = join(pf, "nodejs", "node_modules", "npm", "bin", "npx-cli.js");
    if (existsSync(sys)) return sys;
  }
  return null;
}

/** node.exe to pair with npm-cli.js / npx-cli.js (avoids Cursor helper node without npm). */
export function nodeExeForNpm() {
  if (process.platform === "win32") {
    const pf = process.env.ProgramFiles || "C:\\Program Files";
    const sysNode = join(pf, "nodejs", "node.exe");
    if (existsSync(sysNode)) return sysNode;
  }
  return process.execPath;
}

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
  /OPENAI_API_KEY\s*=\s*\S+/gi,
  /api[_-]?key\s*[:=]\s*\S+/gi,
  /service_role\s+[a-zA-Z0-9\-._]+/gi,
  /LEARNING_SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/gi,
  /password\s*[:=]\s*\S+/gi,
];

export function redactSecrets(text) {
  let out = String(text || "");
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, "[REDACTED]");
  }
  out = out.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[REDACTED_JWT]");
  return out;
}

export function mkdirp(p) {
  mkdirSync(p, { recursive: true });
}

function npmCmd() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function npxCmd() {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

/**
 * Spawn a command with argument vector (no shell). Safe for paths containing spaces.
 * @param {string} command - e.g. npm.cmd, npx.cmd, node
 * @param {string[]} args
 * @param {{ cwd: string, timeoutMs: number, logPath: string, env?: Record<string, string|undefined>, shell?: boolean }} opts
 */
export function runSpawnCommand(command, args, opts) {
  const { cwd, timeoutMs, logPath, env, shell } = opts;
  return new Promise((resolve) => {
    const start = Date.now();
    const proc = spawn(command, args, {
      cwd,
      shell: shell === true,
      env: env ? { ...process.env, ...env } : { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let out = "";
    const append = (chunk) => {
      out += chunk.toString();
    };
    proc.stdout?.on("data", append);
    proc.stderr?.on("data", append);

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      killProcessTree(proc.pid);
    }, timeoutMs);

    proc.on("close", (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - start;
      mkdirp(dirname(logPath));
      writeFileSync(logPath, redactSecrets(out), "utf8");
      resolve({
        exitCode: timedOut ? null : code,
        timedOut,
        durationMs,
        logPath,
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      const durationMs = Date.now() - start;
      mkdirp(dirname(logPath));
      writeFileSync(logPath, redactSecrets(`${out}\n[spawn_error] ${err}`), "utf8");
      resolve({ exitCode: 1, timedOut: false, durationMs, logPath });
    });
  });
}

/** Kill process and children (Windows: taskkill /T). */
export function killProcessTree(pid) {
  if (!pid || pid <= 0) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore", windowsHide: true });
    } else {
      try {
        process.kill(-pid, "SIGTERM");
      } catch {
        try {
          process.kill(pid, "SIGTERM");
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {string} npmScript - package.json script name
 * @param {number} timeoutMs
 * @param {string} cwd
 * @param {string} logPath
 * @returns {Promise<{ exitCode: number | null; timedOut: boolean; durationMs: number; logPath: string }>}
 */
export function runNpmScript(npmScript, timeoutMs, cwd, logPath) {
  const cli = npmCliPath();
  if (cli) {
    return runSpawnCommand(nodeExeForNpm(), [cli, "run", npmScript], { cwd, timeoutMs, logPath });
  }
  return runSpawnCommand(npmCmd(), ["run", npmScript], { cwd, timeoutMs, logPath, shell: process.platform === "win32" });
}

/**
 * Run npx with argv array (no shell).
 * @param {string[]} args - e.g. ['tsx', '/abs/path/script.mjs', '--flag', 'x']
 */
export function runNpxArgs(args, timeoutMs, cwd, logPath, env) {
  const cli = npxCliPath();
  if (cli) {
    return runSpawnCommand(nodeExeForNpm(), [cli, ...args], { cwd, timeoutMs, logPath, env });
  }
  return runSpawnCommand(npxCmd(), args, {
    cwd,
    timeoutMs,
    logPath,
    env,
    shell: process.platform === "win32",
  });
}

export function copyTreeIfExists(src, dest) {
  if (!existsSync(src)) return false;
  mkdirp(dest);
  cpSync(src, dest, { recursive: true });
  return true;
}

export function safeReadJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export function packageScripts(root) {
  const pkg = safeReadJson(join(root, "package.json"), {});
  return pkg.scripts && typeof pkg.scripts === "object" ? pkg.scripts : {};
}

export function hasScript(scripts, name) {
  return typeof scripts[name] === "string";
}

/** @returns {Promise<number>} */
export function findFreePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      try {
        const addr = s.address();
        const port = typeof addr === "object" && addr ? addr.port : 0;
        s.close(() => resolve(port || 3000));
      } catch (e) {
        reject(e);
      }
    });
    s.on("error", reject);
  });
}
