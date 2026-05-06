/**
 * Hybrid question sourcing: real bank rows where available, otherwise synthetic placeholder rows.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pick } from "./prng.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..", "..");

const scienceUrl = pathToFileURL(path.join(ROOT, "data", "science-questions.js")).href;
const { SCIENCE_QUESTIONS } = await import(scienceUrl);

const g4Url = pathToFileURL(path.join(ROOT, "data", "hebrew-questions", "g4.js")).href;
const { G4_EASY_QUESTIONS } = await import(g4Url);

const HEBREW_TOPIC_MAP = {
  reading_comprehension: "reading",
  vocabulary: "vocabulary",
  fact_vs_opinion: "reading",
  sequence: "reading",
  main_idea: "reading",
  inference: "reading",
};

function gradeNum(grade) {
  const m = String(grade || "").match(/^g(\d)$/);
  return m ? parseInt(m[1], 10) : 4;
}

function scienceMatchesGrade(q, grade) {
  const g = String(grade || "");
  return Array.isArray(q.grades) && q.grades.includes(g);
}

function pickScienceQuestion(rng, grade, topic) {
  const g = String(grade || "");
  let pool = SCIENCE_QUESTIONS.filter((q) => scienceMatchesGrade(q, g));
  if (topic && topic !== "general") {
    const t = String(topic);
    const narrowed = pool.filter((q) => String(q.topic || "") === t || String(q.topic || "").includes(t.split("_")[0]));
    if (narrowed.length) pool = narrowed;
  }
  if (!pool.length) pool = SCIENCE_QUESTIONS.filter((q) => scienceMatchesGrade(q, g));
  if (!pool.length) pool = SCIENCE_QUESTIONS.slice(0, 120);
  return pick(rng, pool);
}

function pickHebrewQuestion(rng, grade, topicKey) {
  const g = gradeNum(grade);
  const htKey = HEBREW_TOPIC_MAP[topicKey] || "reading";
  if (g >= 4 && G4_EASY_QUESTIONS?.[htKey]?.length) {
    return pick(rng, G4_EASY_QUESTIONS[htKey]);
  }
  const keys = Object.keys(G4_EASY_QUESTIONS || {});
  for (const k of keys) {
    const arr = G4_EASY_QUESTIONS[k];
    if (arr?.length) return pick(rng, arr);
  }
  return null;
}

/**
 * @returns {{ source: "real"|"placeholder", questionText: string, correctAnswer: string, questionId: string } | null}
 */
export function resolveHybridQuestionRow(rng, { grade, subject, topic }) {
  if (subject === "science") {
    const q = pickScienceQuestion(rng, grade, topic);
    if (!q) return null;
    const stem = String(q.stem || "").trim();
    const opts = Array.isArray(q.options) ? q.options : [];
    const ci = Number(q.correctIndex);
    const correct = opts[ci] != null ? String(opts[ci]) : "";
    return {
      source: "real",
      questionText: stem,
      correctAnswer: correct,
      questionId: String(q.id || "science_bank"),
    };
  }

  if (subject === "hebrew") {
    const row = pickHebrewQuestion(rng, grade, topic);
    if (!row) return null;
    return {
      source: "real",
      questionText: String(row.question || "").trim(),
      correctAnswer: Array.isArray(row.answers) ? String(row.answers[row.correct] ?? "") : "",
      questionId: String(row.skillId || "hebrew_bank"),
    };
  }

  return null;
}
