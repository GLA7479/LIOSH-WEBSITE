import fs from "node:fs";
import path from "node:path";
import { DIFFICULTIES, TOPICS_BY_SUBJECT } from "./constants.mjs";
import { createRng, pick, randInt } from "./prng.mjs";
import { resolveHybridQuestionRow } from "./question-hybrid.mjs";

const MISTAKE_TYPES = [
  "conceptual",
  "careless",
  "misread_question",
  "wrong_operation",
  "timeout_pressure",
  "guess",
  "prerequisite_gap",
  "pattern_confusion",
];

function difficultyForProfile(rng, profileType) {
  if (profileType === "fast_wrong") return pick(rng, ["easy", "medium"]);
  if (profileType === "slow_correct") return pick(rng, ["medium", "hard"]);
  return pick(rng, DIFFICULTIES);
}

function mistakeTypeForAnswer(rng, profileType, isCorrect) {
  if (isCorrect) return null;
  if (profileType === "random_guessing") return "guess";
  if (profileType === "calculation_errors") return pick(rng, ["wrong_operation", "careless"]);
  if (profileType === "reading_comprehension_gap") return "misread_question";
  if (profileType === "repeated_misconception") return "conceptual";
  return pick(rng, MISTAKE_TYPES);
}

function answerCorrect(rng, profileType, difficulty) {
  let base = 0.72;
  if (profileType.startsWith("weak") || profileType === "thin_data") base = 0.42;
  if (profileType === "strong_stable" || profileType === "rich_data") base = 0.88;
  if (profileType === "improving_student") base = 0.62 + rng() * 0.15;
  if (profileType === "declining_student") base = 0.48;
  if (profileType === "random_guessing") base = 0.28;
  if (profileType === "fast_wrong") base = 0.35;
  if (profileType === "slow_correct") base = 0.82;
  if (difficulty === "hard") base -= 0.12;
  if (difficulty === "easy") base += 0.1;
  return rng() < Math.min(0.97, Math.max(0.05, base));
}

/**
 * @param {{ students: any[], questionTarget: number, outputRoot: string, questionSourceMode?: string }} opts
 */
export function simulateQuestionRuns(opts) {
  const rows = [];
  const perStudent = Math.max(1, Math.ceil(opts.questionTarget / opts.students.length));
  const mode = opts.questionSourceMode || "synthetic";

  for (const student of opts.students) {
    const rng = createRng((student.metadata?.rngSeedFragment ?? 1) ^ 0xdeadbeef);
    let si = 0;
    for (let i = 0; i < perStudent; i++) {
      const subject = pick(rng, student.subjects);
      const topic = pick(rng, TOPICS_BY_SUBJECT[subject] || ["general"]);
      const difficulty =
        pick(rng, DIFFICULTIES) === "mixed" ? pick(rng, ["easy", "medium", "hard"]) : difficultyForProfile(rng, student.profileType);
      const isCorrect = answerCorrect(rng, student.profileType, difficulty);
      const mistakeType = mistakeTypeForAnswer(rng, student.profileType, isCorrect);
      const sessionId = `sess_${student.studentId}_${si++}`;
      let qid = `q_${student.studentId}_${i}`;
      let questionText = `[סימולציה] תרגול ${topic} ב-${subject} (${difficulty})`;
      /** @type {"real"|"synthetic"|"placeholder"} */
      let questionSource = "synthetic";

      if (mode === "hybrid" || mode === "real") {
        const hq = resolveHybridQuestionRow(rng, { grade: student.grade, subject, topic });
        if (hq && hq.source === "real") {
          questionText = hq.questionText;
          qid = `${hq.questionId}__${student.studentId}__${i}`;
          questionSource = "real";
        } else if (mode === "real") {
          questionSource = "placeholder";
          questionText = `[placeholder] אין שאלה אמיתית זמינה ל-${subject}/${topic} — ${difficulty}`;
        } else {
          questionSource = "placeholder";
        }
      }

      const responseTimeMs = randInt(rng, student.profileType === "slow_correct" ? 8000 : 4000, student.profileType === "fast_wrong" ? 12000 : 55000);

      const row = {
        studentId: student.studentId,
        grade: student.grade,
        subject,
        topic,
        difficulty,
        questionId: qid,
        generatedQuestionId: qid,
        questionText,
        correctAnswer: isCorrect ? "בחירה נכונה" : "ערך ייחוס",
        studentAnswer: isCorrect ? "בחירה נכונה" : "בחירה שגויה",
        isCorrect,
        mistakeType,
        responseTimeMs,
        sessionId,
        questionSource,
        contributesToParentReportEvidence: rng() > 0.08,
      };
      rows.push(row);
      if (!isCorrect) {
        student.mistakes.push({ topic, subject, mistakeType, questionId: qid });
      }
      student.generatedAnswers.push(row);
    }
    student.generatedSessions = [{ note: "סימולציה: סשן לכל שאלה", approximateSessions: perStudent }];
  }

  const qDir = path.join(opts.outputRoot, "question-runs");
  fs.mkdirSync(qDir, { recursive: true });
  for (const student of opts.students) {
    const filtered = rows.filter((r) => r.studentId === student.studentId);
    fs.writeFileSync(path.join(qDir, `${student.studentId}.json`), JSON.stringify(filtered, null, 2), "utf8");
    const md = [
      `# ריצות שאלות — ${student.displayName}`,
      "",
      `סה״כ שאלות בסימולציה: ${filtered.length}`,
      "",
      ...filtered.slice(0, 80).map(
        (r) =>
          `- [${r.subject}/${r.topic}/${r.difficulty}] ${r.isCorrect ? "✓" : "✗"} mistake=${r.mistakeType || "—"} \`${r.questionId}\``
      ),
      filtered.length > 80 ? `\n… ועוד ${filtered.length - 80} שורות (ראה JSON).` : "",
    ].join("\n");
    fs.writeFileSync(path.join(qDir, `${student.studentId}.md`), md, "utf8");
    student.questionRunFiles = { json: `question-runs/${student.studentId}.json`, md: `question-runs/${student.studentId}.md` };
  }

  return { rows };
}

export function aggregateQuestionStats(rows) {
  const byGrade = {};
  const bySubject = {};
  const byTopic = {};
  const byDifficulty = {};
  const byQuestionSource = { real: 0, synthetic: 0, placeholder: 0 };
  let correct = 0;
  const mistakeCounts = {};
  for (const r of rows) {
    byGrade[r.grade] = (byGrade[r.grade] || 0) + 1;
    bySubject[r.subject] = (bySubject[r.subject] || 0) + 1;
    byTopic[r.topic] = (byTopic[r.topic] || 0) + 1;
    byDifficulty[r.difficulty] = (byDifficulty[r.difficulty] || 0) + 1;
    const qs = r.questionSource || "synthetic";
    byQuestionSource[qs] = (byQuestionSource[qs] || 0) + 1;
    if (r.isCorrect) correct += 1;
    if (r.mistakeType) mistakeCounts[r.mistakeType] = (mistakeCounts[r.mistakeType] || 0) + 1;
  }
  return {
    total: rows.length,
    byGrade,
    bySubject,
    byTopic,
    byDifficulty,
    correctRatio: rows.length ? correct / rows.length : 0,
    mistakeTypes: mistakeCounts,
    realQuestionCount: byQuestionSource.real,
    generatedQuestionCount: byQuestionSource.synthetic,
    placeholderQuestionCount: byQuestionSource.placeholder,
    byQuestionSource,
  };
}
