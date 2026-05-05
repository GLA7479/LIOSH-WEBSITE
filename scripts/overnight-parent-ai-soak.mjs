#!/usr/bin/env node
/**
 * Launch-readiness / soak entry: sets env defaults then runs the full overnight audit with --soak.
 * No sleeps — expands simulator + synthetic rows via env (see overnight-soak-expand.mjs, synthetic e2e).
 */
import { spawnSync } from "node:child_process";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const audit = path.join(__dirname, "overnight-parent-ai-audit.mjs");

process.env.OVERNIGHT_SOAK = process.env.OVERNIGHT_SOAK || "1";
process.env.OVERNIGHT_STUDENT_MULTIPLIER = process.env.OVERNIGHT_STUDENT_MULTIPLIER || "2";
process.env.OVERNIGHT_SYNTHETIC_ROUNDS = process.env.OVERNIGHT_SYNTHETIC_ROUNDS || process.env.OVERNIGHT_REPEATS || "2";

const r = spawnSync(process.execPath, [audit, "--soak"], {
  cwd: ROOT,
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
