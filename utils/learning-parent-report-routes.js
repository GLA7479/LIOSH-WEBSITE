/**
 * Canonical browser paths for parent reports under `/learning/*`.
 * Single source of truth for simulator links and QA — pages live in `pages/learning/`.
 */
export const LEARNING_PARENT_REPORT_SHORT_PATH = "/learning/parent-report";
export const LEARNING_PARENT_REPORT_DETAILED_PATH = "/learning/parent-report-detailed";

/** Detailed report, print-friendly summary layout (same page, `mode=summary`). */
export function learningParentReportDetailedSummaryHref() {
  return `${LEARNING_PARENT_REPORT_DETAILED_PATH}?mode=summary`;
}
