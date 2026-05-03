#!/usr/bin/env node
/**
 * Parent narrative safety guard — fixture runner + artifact writer.
 * npm run test:parent-report-narrative-safety
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateParentNarrativeSafety } from "../utils/parent-narrative-safety/parent-narrative-safety-guard.js";
import { PARENT_NARRATIVE_SAFETY_FIXTURES } from "../utils/parent-narrative-safety/parent-narrative-safety-fixtures.js";
import {
  buildNarrativeSafetySummaryJson,
  buildNarrativeSafetySummaryMd,
} from "../utils/parent-narrative-safety/parent-narrative-safety-report.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "parent-report-narrative-safety");
const OUT_JSON = join(OUT_DIR, "summary.json");
const OUT_MD = join(OUT_DIR, "summary.md");

function assertFixture(fx, result) {
  const ok =
    result.status === fx.expectStatus &&
    result.ok === fx.expectOk &&
    (fx.expectStatus === "block" ? result.ok === false : true);
  if (!ok) {
    throw new Error(
      `Expected status=${fx.expectStatus} ok=${fx.expectOk}, got status=${result.status} ok=${result.ok}`
    );
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const generatedAtIso = new Date().toISOString();
  /** @type {Array<{ id: string, description: string, expectedStatus: string, pass: boolean, result: object, error?: string }>} */
  const cases = [];

  for (const fx of PARENT_NARRATIVE_SAFETY_FIXTURES) {
    let errorMsg;
    const result = validateParentNarrativeSafety({
      narrativeText: fx.narrativeText,
      engineOutput: fx.engineOutput,
      reportContext: fx.reportContext || {},
      locale: fx.locale || "he",
    });
    let pass = false;
    try {
      assertFixture(fx, result);
      pass = true;
    } catch (e) {
      errorMsg = String(e?.message || e || "unknown_error");
    }

    cases.push({
      id: fx.id,
      description: fx.description,
      expectedStatus: fx.expectStatus,
      pass,
      result,
      ...(errorMsg ? { error: errorMsg } : {}),
    });
  }

  const allPassed = cases.every((c) => c.pass);

  const jsonPayload = buildNarrativeSafetySummaryJson({
    generatedAtIso,
    cases,
    allPassed,
  });

  const mdPayload = buildNarrativeSafetySummaryMd({
    generatedAtIso,
    cases,
    allPassed,
  });

  await writeFile(OUT_JSON, JSON.stringify(jsonPayload, null, 2), "utf8");
  await writeFile(OUT_MD, mdPayload, "utf8");

  console.log(`Parent narrative safety: ${allPassed ? "PASS" : "FAIL"} (${cases.filter((c) => c.pass).length}/${cases.length})`);
  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_MD}`);

  if (!allPassed) {
    for (const c of cases.filter((x) => !x.pass)) {
      console.error(`FAIL: ${c.id} — ${c.error || "assertion mismatch"}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
