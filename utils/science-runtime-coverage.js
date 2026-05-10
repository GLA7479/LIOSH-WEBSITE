/**
 * Effective Science pool buckets aligned with pages/learning/science-master.js:
 * UI level matches when minLevel ≤ level ≤ maxLevel (easy=1, medium=2, hard=3).
 */
import { SCIENCE_GRADES, SCIENCE_GRADE_ORDER } from "../data/science-curriculum.js";

export const SCIENCE_UI_LEVEL_ORDER = ["easy", "medium", "hard"];

export function scienceLevelAllowed(question, levelKey) {
  const order = { easy: 1, medium: 2, hard: 3 };
  const min = order[question.minLevel] || 1;
  const max = order[question.maxLevel] || 3;
  const cur = order[levelKey] || 1;
  return cur >= min && cur <= max;
}

export function countScienceRuntimeBucket(scienceQuestions, gradeKey, topic, uiLevel) {
  return scienceQuestions.filter(
    (q) =>
      q.topic === topic &&
      q.grades?.includes(gradeKey) &&
      scienceLevelAllowed(q, uiLevel)
  ).length;
}

/**
 * @param {object[]} scienceQuestions
 * @returns {{ key: string, gradeKey: string, topic: string, uiLevel: string, count: number }[]}
 */
export function listScienceRuntimeThinBuckets(scienceQuestions) {
  /** @type {{ key: string, gradeKey: string, topic: string, uiLevel: string, count: number }[]} */
  const thin = [];
  for (const gradeKey of SCIENCE_GRADE_ORDER) {
    const topics = (SCIENCE_GRADES[gradeKey]?.topics || []).filter((t) => t !== "mixed");
    for (const topic of topics) {
      for (const uiLevel of SCIENCE_UI_LEVEL_ORDER) {
        const count = countScienceRuntimeBucket(scienceQuestions, gradeKey, topic, uiLevel);
        const key = `${gradeKey}|${topic}|${uiLevel}`;
        if (count > 0 && count < 3) {
          thin.push({ key, gradeKey, topic, uiLevel, count });
        }
      }
    }
  }
  thin.sort((a, b) => a.count - b.count || a.gradeKey.localeCompare(b.gradeKey) || a.topic.localeCompare(b.topic));
  return thin;
}

const G12_STRETCH_REASON =
  "כיתות א׳–ב׳: דגש פדגוגי על רצף קל ותצפית קונקרטית; רמות בינוני/קשה כוללות פריטי הרחבה מצומצמים במכוון, לא דורשות שלישייה מלאה לכל נושא.";

/**
 * @param {{ gradeKey: string, uiLevel: string, count: number }} row
 * @returns {{ kind: 'A' | 'B' | 'C', blocking: boolean, reason?: string }}
 */
export function classifyScienceRuntimeThinBucket(row) {
  const gnum = Number(String(row.gradeKey).replace(/^g/, ""));
  if (Number.isFinite(gnum) && gnum <= 2 && (row.uiLevel === "medium" || row.uiLevel === "hard")) {
    return { kind: "C", blocking: false, reason: G12_STRETCH_REASON };
  }
  return { kind: "A", blocking: true };
}

/**
 * @param {object[]} scienceQuestions
 */
export function summarizeScienceRuntimeThinForClosure(scienceQuestions) {
  const thin = listScienceRuntimeThinBuckets(scienceQuestions);
  const classified = thin.map((t) => {
    const c = classifyScienceRuntimeThinBucket(t);
    return {
      ...t,
      classification: c.kind,
      blocking: c.blocking,
      nonBlockingReason: c.reason || null,
      visibleToStudents: true,
      generatedAtRuntime: true,
    };
  });
  const blocking = classified.filter((x) => x.blocking);
  return {
    thinRuntimeBuckets: classified,
    blockingThinRuntimeCount: blocking.length,
    blockingThinRuntimeBuckets: blocking,
    advisoryThinRuntimeCount: classified.length - blocking.length,
  };
}
