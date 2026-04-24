/**
 * Phase 7.10 — canonical science skills for curriculum spine (data/build only).
 * Truth: SCIENCE_QUESTIONS[].topic + grades[] from data/science-questions.js (incl. phase3 concat),
 * validated against SCIENCE_GRADES[].topics in data/science-curriculum.js.
 */

export const SCIENCE_CANONICAL_SOURCE =
  "data/science-questions.js (SCIENCE_QUESTIONS: topic + grades[] per item, includes science-questions-phase3.js); cross-checked with data/science-curriculum.js SCIENCE_GRADES[].topics";

/**
 * @param {unknown[]} scienceQuestions
 * @param {Record<string, { topics?: string[] }>} scienceGrades
 * @param {{ cognitiveForGrade: (g: number) => string }} opts
 * @returns {{
 *   skills: Array<Record<string, unknown>>,
 *   extraGaps: Array<Record<string, unknown>>,
 *   unmappedQuestionTopics: string[],
 *   curriculumPairsWithoutQuestions: Array<{ grade: string, topic: string }>,
 * }}
 */
export function deriveCanonicalScienceSpine(scienceQuestions, scienceGrades, opts) {
  const { cognitiveForGrade } = opts;
  /** @type {Map<string, Set<number>>} */
  const topicToGradeNums = new Map();
  const badQuestionRefs = [];

  for (const q of scienceQuestions) {
    const topic = q?.topic;
    if (typeof topic !== "string" || !topic.trim()) {
      badQuestionRefs.push(String(q?.id ?? "unknown_id"));
      continue;
    }
    const grades = Array.isArray(q.grades) ? q.grades : [];
    if (!grades.length) badQuestionRefs.push(`${topic}:${q?.id ?? "?"}`);
    for (const gk of grades) {
      const n = Number.parseInt(String(gk).replace(/^g/i, ""), 10);
      if (Number.isNaN(n) || n < 1 || n > 6) continue;
      if (!topicToGradeNums.has(topic)) topicToGradeNums.set(topic, new Set());
      topicToGradeNums.get(topic).add(n);
    }
  }

  /** @type {Map<string, Set<string>>} */
  const curriculumTopicsByGrade = new Map();
  const unionCurriculumTopics = new Set();
  for (const [gk, row] of Object.entries(scienceGrades)) {
    const set = new Set(row?.topics || []);
    curriculumTopicsByGrade.set(gk, set);
    for (const t of set) unionCurriculumTopics.add(t);
  }

  const unmappedQuestionTopics = [];
  for (const topic of topicToGradeNums.keys()) {
    if (!unionCurriculumTopics.has(topic)) unmappedQuestionTopics.push(topic);
  }

  const extraGaps = [];
  const curriculumPairsWithoutQuestions = [];

  if (badQuestionRefs.length) {
    extraGaps.push({
      severity: "important",
      subject: "science",
      note: "Some SCIENCE_QUESTIONS items are missing a non-empty topic or grades[].",
      question_refs: badQuestionRefs.slice(0, 50),
    });
  }

  for (const topic of unmappedQuestionTopics) {
    extraGaps.push({
      severity: "critical",
      subject: "science",
      topic,
      note: `SCIENCE_QUESTIONS uses topic "${topic}" but it never appears in SCIENCE_GRADES[].topics — cannot align to curriculum.`,
    });
  }

  const skills = [];

  for (const [topic, nums] of [...topicToGradeNums.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "en"),
  )) {
    const arr = [...nums].sort((x, y) => x - y);
    const minGrade = arr[0];
    const maxGrade = arr[arr.length - 1];
    const strayGrades = [];
    for (const n of arr) {
      const gk = `g${n}`;
      if (!curriculumTopicsByGrade.get(gk)?.has(topic)) strayGrades.push(gk);
    }
    if (strayGrades.length) {
      extraGaps.push({
        severity: "important",
        subject: "science",
        topic,
        skill_id: `science:topic:${topic}`,
        note: `Question bank tags topic "${topic}" for ${strayGrades.join(", ")} but SCIENCE_GRADES omits this topic for those grades — fix grades[] on items or curriculum topics.`,
      });
    }

    skills.push({
      schema_version: 1,
      skill_id: `science:topic:${topic}`,
      subject: "science",
      topic,
      subtopic: "question_bank",
      minGrade,
      maxGrade,
      cognitive_level: cognitiveForGrade(maxGrade),
      description: `Science MCQ bank topic "${topic}": grade span ${minGrade}–${maxGrade} from union of SCIENCE_QUESTIONS[].grades across all items (Phase 7.10).`,
      source: SCIENCE_CANONICAL_SOURCE,
    });
  }

  for (const [gk, topics] of curriculumTopicsByGrade) {
    for (const topic of topics) {
      const has = scienceQuestions.some(
        (q) => q && q.topic === topic && Array.isArray(q.grades) && q.grades.includes(gk),
      );
      if (!has) curriculumPairsWithoutQuestions.push({ grade: gk, topic });
    }
  }

  if (curriculumPairsWithoutQuestions.length) {
    extraGaps.push({
      severity: "important",
      subject: "science",
      note: "SCIENCE_GRADES declares topic access for grade+topic pairs with no SCIENCE_QUESTIONS items carrying that exact grades[] tag (bank may still be usable via mixed mode or future items).",
      curriculum_topic_grade_pairs_without_questions: curriculumPairsWithoutQuestions,
    });
  }

  return {
    skills,
    extraGaps,
    unmappedQuestionTopics,
    curriculumPairsWithoutQuestions,
  };
}

/** Replicates pre–Phase 7.10 draft row count (one row per focus/skills line × each declared topic for that grade). */
export function countLegacyScienceDraftRows(scienceGrades) {
  let n = 0;
  for (const row of Object.values(scienceGrades)) {
    const cur = row?.curriculum || {};
    const lines = [...(cur.focus || []), ...(cur.skills || [])];
    const topics = row?.topics || [];
    n += lines.length * topics.length;
  }
  return n;
}
