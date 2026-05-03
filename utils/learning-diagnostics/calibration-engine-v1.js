/**
 * Grade and difficulty aware performance interpretation.
 */

import { getSubjectQuestionTotalFromSummary, getSubjectAccuracyFromSummary } from "./diagnostic-framework-v1.js";
import { splitTopicRowKey } from "../parent-report-row-diagnostics.js";

export const CALIBRATION_ENGINE_V1 = "1.0.0";

/**
 * @param {Record<string, Record<string, unknown>>} maps
 * @param {Record<string, unknown>} summaryCounts
 * @param {string} [studentGradeKey] — e.g. g3
 */
export function buildCalibrationV1(maps, summaryCounts = {}, studentGradeKey = null) {
  /** @type {object[]} */
  const perSubject = [];
  const subjects = ["math", "hebrew", "english", "science", "geometry", "moledet-geography"];

  for (const subjectId of subjects) {
    const tm = maps?.[subjectId];
    const subjQ = getSubjectQuestionTotalFromSummary(summaryCounts, subjectId);
    const subjAcc = getSubjectAccuracyFromSummary(summaryCounts, subjectId);

    let difficultyCoverage = 0;
    let modesSeen = new Set();
    if (tm && typeof tm === "object") {
      for (const key of Object.keys(tm)) {
        const row = tm[key];
        const ms = row?.modeKey;
        if (ms) modesSeen.add(ms);
        const dsl = row?.dataSufficiencyLevel;
        if (dsl === "high" || dsl === "medium") difficultyCoverage += 1;
      }
    }

    const gradeExpectation = Number.isFinite(subjAcc) ? Math.min(95, 55 + subjQ * 0.25) : null;
    const difficultyAdjustedAccuracy = Number.isFinite(subjAcc) ? subjAcc * (0.85 + 0.05 * Math.min(modesSeen.size, 3)) : null;

    let gradeRelativeBand = "atExpected";
    if (Number.isFinite(subjAcc) && gradeExpectation != null) {
      if (subjAcc < gradeExpectation - 15) gradeRelativeBand = "belowExpected";
      else if (subjAcc > gradeExpectation + 12) gradeRelativeBand = "aboveExpected";
    }

    let gradeMismatchFlag = false;
    if (studentGradeKey) {
      let mismatchRows = 0;
      let rows = 0;
      if (tm && typeof tm === "object") {
        for (const [rowKey, row] of Object.entries(tm)) {
          if (!row?.questions) continue;
          rows += 1;
          const g = splitTopicRowKey(rowKey).gradeScope;
          if (g && studentGradeKey && g !== studentGradeKey) mismatchRows += 1;
        }
      }
      if (rows > 0 && mismatchRows / rows > 0.35) gradeMismatchFlag = true;
    }

    const missingDifficultyMeta = subjQ > 0 && difficultyCoverage === 0;

    perSubject.push({
      subjectId,
      gradeExpectation,
      difficultyAdjustedAccuracy: difficultyAdjustedAccuracy != null ? Math.round(difficultyAdjustedAccuracy * 10) / 10 : null,
      gradeRelativeBand,
      belowExpected: gradeRelativeBand === "belowExpected",
      atExpected: gradeRelativeBand === "atExpected",
      aboveExpected: gradeRelativeBand === "aboveExpected",
      difficultyCoverage: Math.min(1, difficultyCoverage / Math.max(1, Object.keys(tm || {}).length)),
      challengeReadiness:
        gradeRelativeBand === "aboveExpected" && subjQ >= 30 ? "high" : subjQ < 15 ? "low" : "medium",
      flags: {
        gradeMismatch: gradeMismatchFlag,
        missingDifficultyMetadata: missingDifficultyMeta,
      },
    });
  }

  return { version: CALIBRATION_ENGINE_V1, subjects: perSubject };
}
