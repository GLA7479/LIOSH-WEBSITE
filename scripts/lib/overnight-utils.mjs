/**
 * Shared helpers for overnight QA orchestration (reporting only).
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, cpSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createServer } from "node:net";

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

/**
 * @param {string} npmScript - package.json script name
 * @param {number} timeoutMs
 * @param {string} cwd
 * @param {string} logPath
 * @returns {Promise<{ exitCode: number | null; timedOut: boolean; durationMs: number; logPath: string }>}
 */
export function runNpmScript(npmScript, timeoutMs, cwd, logPath) {
  return new Promise((resolve) => {
    const start = Date.now();
    const isWin = process.platform === "win32";
    const proc = spawn(isWin ? "npm.cmd" : "npm", ["run", npmScript], {
      cwd,
      shell: true,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
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
      proc.kill("SIGTERM");
      setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
          /* ignore */
        }
      }, 5000);
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
