import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(process.cwd());
const migrationPath = path.join(
  projectRoot,
  "supabase",
  "migrations",
  "001_learning_core_foundation.sql"
);

const requiredEnvNames = [
  "NEXT_PUBLIC_LEARNING_SUPABASE_URL",
  "NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY",
  "LEARNING_SUPABASE_SERVICE_ROLE_KEY",
];

const bannedEnvNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "MLEO_SUPABASE_URL",
  "MLEO_SUPABASE_ANON_KEY",
  "MLEO_SUPABASE_SERVICE_ROLE_KEY",
];

const browserDirs = ["components", "pages", "hooks", "public"];
const browserFiles = ["lib/learning-supabase/client.js"];

function fileExists(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function walkFiles(startPath) {
  if (!fileExists(startPath)) return [];
  const stat = fs.statSync(startPath);
  if (stat.isFile()) return [startPath];

  const output = [];
  for (const entry of fs.readdirSync(startPath, { withFileTypes: true })) {
    const fullPath = path.join(startPath, entry.name);
    if (entry.isDirectory()) {
      output.push(...walkFiles(fullPath));
    } else if (entry.isFile()) {
      output.push(fullPath);
    }
  }
  return output;
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".json",
    ".env",
    ".md",
    ".sql",
    ".txt",
  ].includes(ext);
}

function collectEnvFilePaths(rootDir) {
  return fs
    .readdirSync(rootDir)
    .filter(name => name.startsWith(".env"))
    .map(name => path.join(rootDir, name))
    .filter(filePath => fileExists(filePath));
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

for (const envName of requiredEnvNames) {
  if (!process.env[envName]) {
    fail(`Missing required env var ${envName}`);
  } else {
    pass(`${envName} is set`);
  }
}

const url = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL || "";
if (!url.startsWith("https://ajxwmlwbzxwffrtlfuoe.supabase.co")) {
  fail("NEXT_PUBLIC_LEARNING_SUPABASE_URL must start with https://ajxwmlwbzxwffrtlfuoe.supabase.co");
} else {
  pass("NEXT_PUBLIC_LEARNING_SUPABASE_URL matches expected learning Supabase host");
}

if (!fileExists(migrationPath)) {
  fail("Missing migration file supabase/migrations/001_learning_core_foundation.sql");
} else {
  pass("Learning migration file exists");
}

const browserSearchTargets = [
  ...browserDirs.map(dir => path.join(projectRoot, dir)),
  ...browserFiles.map(file => path.join(projectRoot, file)),
];

let foundServiceRoleInBrowserCode = false;
for (const targetPath of browserSearchTargets) {
  for (const filePath of walkFiles(targetPath)) {
    if (!isTextFile(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    if (text.includes("LEARNING_SUPABASE_SERVICE_ROLE_KEY")) {
      foundServiceRoleInBrowserCode = true;
      fail(
        `Service role env name found in browser/client surface: ${path.relative(projectRoot, filePath)}`
      );
    }
  }
}
if (!foundServiceRoleInBrowserCode) {
  pass("Service role env name is not referenced in browser/client surface");
}

let foundBannedEnvName = false;
for (const envFilePath of collectEnvFilePaths(projectRoot)) {
  const text = fs.readFileSync(envFilePath, "utf8");
  for (const bannedEnvName of bannedEnvNames) {
    const exactEnvNamePattern = new RegExp(`^\\s*${bannedEnvName}=`, "m");
    if (exactEnvNamePattern.test(text)) {
      foundBannedEnvName = true;
      fail(
        `Banned/legacy Supabase env name found in ${path.basename(envFilePath)}: ${bannedEnvName}`
      );
    }
  }
}
if (!foundBannedEnvName) {
  pass("No banned MLEO/legacy Supabase env names found in .env files");
}

if (!process.exitCode) {
  console.log("Verification completed successfully.");
}
