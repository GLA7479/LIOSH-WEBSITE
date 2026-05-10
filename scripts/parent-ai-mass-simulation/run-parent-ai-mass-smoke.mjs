#!/usr/bin/env node
/**
 * Smaller Parent AI mass run for Phase QA (fewer students/questions; category-balanced).
 * Sets env then loads the full mass simulation (dynamic import after env).
 */
/** Smoke defaults; PDF limit forced to 0 so no Next/Playwright server is required unless caller exports MASS_PDF_LIMIT before npm. */
Object.assign(process.env, {
  MASS_STUDENT_COUNT: process.env.MASS_STUDENT_COUNT || "6",
  MASS_QUESTION_TARGET: process.env.MASS_QUESTION_TARGET || "400",
  MASS_REPORT_LIMIT: process.env.MASS_REPORT_LIMIT || "6",
  MASS_PARENT_AI_QUESTION_LIMIT: process.env.MASS_PARENT_AI_QUESTION_LIMIT || "120",
  MASS_PARENT_AI_CATEGORY_BALANCED: process.env.MASS_PARENT_AI_CATEGORY_BALANCED || "1",
  MASS_PARENT_AI_CATEGORY_MIN: process.env.MASS_PARENT_AI_CATEGORY_MIN || "1",
});
process.env.MASS_PDF_LIMIT = "0";

await import("./run-mass-simulation.mjs");
