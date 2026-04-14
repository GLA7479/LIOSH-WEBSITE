import { mistakePatternClusterKey } from "../mistake-event.js";

/**
 * בדיקת חזרתיות לפי ספי שורת הטקסונומיה (מינימום טעויות, ימים, משפחות דפוס).
 * @param {import("../mistake-event.js").MistakeEventV1[]} wrongEvents
 * @param {import("./taxonomy-types.js").TaxonomyRow} row
 */
export function passesRecurrenceRules(wrongEvents, row) {
  const n = wrongEvents.length;
  if (n < row.minWrong) return false;

  const minDays = row.minDistinctDays || 0;
  if (minDays > 0) {
    const days = new Set();
    for (const e of wrongEvents) {
      const t = e.timestamp;
      if (t == null || !Number.isFinite(t)) continue;
      const d = new Date(t);
      days.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
    }
    if (days.size < minDays) return false;
  }

  const minFam = row.minDistinctPatternFamilies || 0;
  if (minFam > 0) {
    const fams = new Set();
    for (const e of wrongEvents) fams.add(mistakePatternClusterKey(e));
    if (fams.size < minFam) return false;
  }

  return true;
}

/**
 * האם רמז כבד מספיק כדי לפסול ספירה (היוריסטיקה: רמז + נכון מיד אחרי).
 * @param {import("../mistake-event.js").MistakeEventV1[]} events
 */
export function heavyHintLikelyInvalidatesPattern(events) {
  const wrongs = events.filter((e) => !e.isCorrect);
  if (!wrongs.length) return false;
  let hinted = 0;
  for (const e of wrongs) {
    if (e.hintUsed === true) hinted += 1;
  }
  return hinted / wrongs.length >= 0.85 && wrongs.length >= 3;
}
