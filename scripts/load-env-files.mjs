/**
 * Loads `.env` then `.env.local` from project root into `process.env`
 * without adding a npm dependency (Next.js-compatible simple KEY=VAL lines).
 * Loads `.env` first, then `.env.local` **overrides** (aligned with Next.js).
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());

function loadFile(name, { override } = { override: false }) {
  const filePath = path.join(root, name);
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (override || process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadFile(".env", { override: false });
loadFile(".env.local", { override: true });
