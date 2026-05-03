/**
 * Helpers to scan learning-simulator report artifacts and validate planner outputs.
 * No I/O side effects except what callers perform.
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { NEXT_ACTIONS, PLANNER_STATUSES, REASON_CODES } from "./adaptive-planner-contract.js";

/** Relative to repo root */
export const DEFAULT_REPORT_SCAN_DIRS = [
  "reports/learning-simulator/reports/per-student",
  "reports/learning-simulator/deep/per-student",
];

/**
 * @param {string} rootAbs — absolute repo root
 * @param {string[]} [relDirs]
 * @returns {Promise<string[]>}
 */
export async function collectReportArtifactPaths(rootAbs, relDirs = DEFAULT_REPORT_SCAN_DIRS) {
  const files = [];
  for (const rel of relDirs) {
    const base = join(rootAbs, rel);
    try {
      const names = await readdir(base);
      for (const name of names) {
        if (name.endsWith(".report.json")) files.push(join(base, name));
      }
    } catch {
      /* directory missing in fresh clones */
    }
  }
  return [...new Set(files)].sort();
}

/**
 * @param {object} report
 * @returns {number[]}
 */
export function listDiagnosticUnitIndices(report) {
  const u = report?.facets?.diagnostic?.unitSummaries;
  if (!Array.isArray(u) || !u.length) return [];
  return u.map((_, i) => i);
}

const BANNED_OUTPUT_SUBSTRINGS = [
  "dyslexia",
  "adhd",
  "autism",
  "disability",
  "diagnosis",
  "clinical",
  "medical condition",
  "learning disability",
  " iq ",
  " i.q",
];

const REASON_CODE_VALUES = new Set(Object.values(REASON_CODES));
const NEXT_SET = new Set(NEXT_ACTIONS);
const STATUS_SET = new Set(PLANNER_STATUSES);

/**
 * @param {object} out
 */
export function validatePlannerOutputEnums(out) {
  const errs = [];
  if (!STATUS_SET.has(out.plannerStatus)) errs.push(`invalid plannerStatus: ${out.plannerStatus}`);
  if (!NEXT_SET.has(out.nextAction)) errs.push(`invalid nextAction: ${out.nextAction}`);
  for (const c of out.reasonCodes || []) {
    if (!REASON_CODE_VALUES.has(c)) errs.push(`invalid reasonCode: ${c}`);
  }
  return errs;
}

/**
 * @param {object} out
 */
export function validatePlannerMustNotSay(out) {
  if (!Array.isArray(out.mustNotSay) || out.mustNotSay.length === 0) {
    return ["mustNotSay empty"];
  }
  return [];
}

/**
 * @param {object} out
 */
export function validatePlannerNoBannedLanguage(out) {
  const blobs = [out.studentSafeSummary, out.parentSafeSummary, ...(out.internalNotes || [])]
    .map((x) => String(x || "").toLowerCase())
    .join(" ");
  const hits = [];
  for (const b of BANNED_OUTPUT_SUBSTRINGS) {
    if (blobs.includes(b)) hits.push(`banned_substring:${b}`);
  }
  return hits;
}

/**
 * @param {object} input
 * @param {object} out
 */
export function runArtifactSafetyAssertions(input, out) {
  /** @type {string[]} */
  const violations = [];
  violations.push(...validatePlannerOutputEnums(out));
  violations.push(...validatePlannerMustNotSay(out));
  violations.push(...validatePlannerNoBannedLanguage(out));
  if (!Array.isArray(out.reasonCodes) || out.reasonCodes.length === 0) {
    violations.push("reasonCodes empty");
  }

  const thin = String(input.dataQuality || "").toLowerCase() === "thin";
  const dnc = Array.isArray(input.doNotConclude) && input.doNotConclude.length > 0;
  if ((thin || dnc) && out.nextAction === "advance_skill") {
    violations.push("advance_skill_on_thin_or_doNotConclude");
  }
  if (dnc && out.nextAction === "advance_skill") {
    violations.push("advance_skill_when_doNotConclude");
  }

  const subj = String(input.subject || "").toLowerCase();
  const sk = String(input.currentSkillId || "").trim();
  const sub = String(input.currentSubskillId || "").trim();
  const englishWeakTag =
    input.skillTaggingIncomplete === true || (subj === "english" && (!sk || !sub));
  if (englishWeakTag && out.nextAction === "advance_skill") {
    violations.push("advance_skill_english_untagged");
  }
  if (englishWeakTag && out.plannerStatus === "ready" && out.nextAction === "maintain_skill") {
    violations.push("confident_maintain_english_untagged");
  }

  return violations;
}
