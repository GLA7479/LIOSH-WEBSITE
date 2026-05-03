#!/usr/bin/env node
/**
 * Unit checks for parent-report-text-extractor (no jest).
 * npm run test:parent-report-narrative-safety-extractor
 */
import { runParentReportTextExtractorInlineTests } from "../utils/parent-narrative-safety/parent-report-text-extractor.js";

const r = runParentReportTextExtractorInlineTests();
if (!r.ok) {
  console.error("parent-report-text-extractor: FAIL", r.failures);
  process.exit(1);
}
console.log("parent-report-text-extractor: PASS");
process.exit(0);
