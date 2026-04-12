/**
 * תווית שם נושא מתמטיקה להורה — כיתה ורמה לפי שורה scoped (ללא שינוי UI).
 * מצב (למידה/תרגול) מתווסף רק כשיש כפילות תצוגתית אמיתית (אותו topic+grade+level, mode שונה).
 */

import {
  getMathReportBucketDisplayName,
  formatParentReportGradeLabel,
  canonicalParentReportGradeKey,
} from "./math-report-generator.js";
import { splitTopicRowKey, MATH_SCOPE_UNKNOWN } from "./parent-report-row-diagnostics.js";

const MODE_SUFFIX_LABELS = {
  learning: "למידה",
  practice: "תרגול",
  challenge: "אתגר",
  speed: "מהירות",
  marathon: "מרתון",
  graded: "מדורג",
  normal: "רגיל",
  mistakes: "טעויות",
  practice_mistakes: "חזרה על שגיאות",
};

const MATH_TOPIC_PARENT_LEVEL_HE = { easy: "קלה", medium: "בינונית", hard: "קשה" };

function effectiveMathGradeKeyFromRowOrKey(rowKey, row) {
  if (row?.gradeKey) return row.gradeKey;
  const tp = splitTopicRowKey(String(rowKey || ""));
  if (!tp.gradeScope || tp.gradeScope === MATH_SCOPE_UNKNOWN) return null;
  return canonicalParentReportGradeKey(tp.gradeScope);
}

function effectiveMathLevelKeyFromRowOrKey(rowKey, row) {
  if (row?.levelKey && row.levelKey !== MATH_SCOPE_UNKNOWN) return row.levelKey;
  const tp = splitTopicRowKey(String(rowKey || ""));
  if (!tp.levelScope || tp.levelScope === MATH_SCOPE_UNKNOWN) return null;
  const l = String(tp.levelScope).trim().toLowerCase();
  if (l === "easy" || l === "medium" || l === "hard") return l;
  return null;
}

function modeSuffixLabel(m) {
  if (m == null || m === "") return "לא זמין";
  return MODE_SUFFIX_LABELS[m] || String(m);
}

/**
 * ליבת התווית בלי מצב (מצב מתווסף רק כשיש כפילות).
 * @param {Record<string, unknown>} row
 * @param {string} [rowKey] מפתח שורת דוח (מתמטיקה scoped) — משלים grade/level כשחסרים על האובייקט
 */
export function mathTopicParentDisplayCoreFromRow(row, rowKey = "") {
  if (!row || typeof row !== "object") return "";
  const bk = row.bucketKey != null && row.bucketKey !== "" ? String(row.bucketKey) : "";
  const topic = String(getMathReportBucketDisplayName(bk)).trim() || bk || "נושא";
  const parts = [topic];
  const gk = effectiveMathGradeKeyFromRowOrKey(rowKey, row);
  if (gk) {
    const gHe = formatParentReportGradeLabel(gk);
    if (gHe && gHe !== "לא זמין") parts.push(`כיתה ${gHe}`);
  }
  const lk = effectiveMathLevelKeyFromRowOrKey(rowKey, row);
  if (lk === "easy" || lk === "medium" || lk === "hard") {
    parts.push(`רמה ${MATH_TOPIC_PARENT_LEVEL_HE[lk]}`);
  }
  return parts.length > 1 ? parts.join(" — ") : topic;
}

/**
 * מעדכן displayName + displayNameScoped לכל שורות המתמטיקה במפה.
 * @param {Record<string, unknown>|null|undefined} mathOperations
 */
export function applyMathScopedParentDisplayNames(mathOperations) {
  if (!mathOperations || typeof mathOperations !== "object") return;
  const list = Object.entries(mathOperations).filter(([, row]) => row && typeof row === "object");
  if (!list.length) return;
  const countByCore = new Map();
  for (const [itemKey, row] of list) {
    const core = mathTopicParentDisplayCoreFromRow(row, itemKey);
    countByCore.set(core, (countByCore.get(core) || 0) + 1);
  }
  for (const [itemKey, row] of list) {
    const core = mathTopicParentDisplayCoreFromRow(row, itemKey);
    const needModeSuffix = (countByCore.get(core) || 0) > 1;
    const modeSuff = needModeSuffix ? ` — ${modeSuffixLabel(row.modeKey)}` : "";
    const full = `${core}${modeSuff}`.trim();
    row.displayNameScoped = full;
    row.displayName = full;
  }
}
