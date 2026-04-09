/**
 * Prints effective Science question pool counts matching science-master.js rules:
 * levelAllowed: easy=1, medium=2, hard=3; question matches if minLevel <= L <= maxLevel.
 * Topic-grade: question.grades includes grade AND topic in SCIENCE_GRADES[grade].topics.
 *
 * Usage: node scripts/science-pool-matrix.mjs
 */
import { SCIENCE_QUESTIONS } from "../data/science-questions.js";
import { SCIENCE_GRADES, SCIENCE_GRADE_ORDER } from "../data/science-curriculum.js";

const LEVEL_ORDER = ["easy", "medium", "hard"];

function levelAllowed(q, levelKey) {
  const order = { easy: 1, medium: 2, hard: 3 };
  const min = order[q.minLevel] || 1;
  const max = order[q.maxLevel] || 3;
  const cur = order[levelKey] || 1;
  return cur >= min && cur <= max;
}

function countPool(grade, topicsList, level) {
  return SCIENCE_QUESTIONS.filter(
    (q) =>
      topicsList.includes(q.topic) &&
      q.grades.includes(grade) &&
      levelAllowed(q, level)
  ).length;
}

const matrix = {};
const thin = [];
const mixedByGradeLevel = {};

for (const g of SCIENCE_GRADE_ORDER) {
  const topics = SCIENCE_GRADES[g]?.topics || [];
  const hasMixedTopic = topics.includes("mixed");
  matrix[g] = {};
  for (const topic of topics) {
    if (topic === "mixed") continue;
    matrix[g][topic] = {};
    for (const lvl of LEVEL_ORDER) {
      const n = countPool(g, [topic], lvl);
      matrix[g][topic][lvl] = n;
      if (n > 0 && n < 8) {
        thin.push({ grade: g, topic, level: lvl, n });
      }
    }
  }
  const mixedTopics = topics.filter((t) => t !== "mixed");
  mixedByGradeLevel[g] = {};
  for (const lvl of LEVEL_ORDER) {
    mixedByGradeLevel[g][lvl] = countPool(g, mixedTopics, lvl);
    const m = mixedByGradeLevel[g][lvl];
    if (hasMixedTopic && m < 20) {
      thin.push({ grade: g, topic: "(mixed UI pool)", level: lvl, n: m });
    }
  }
}

// Practice subgroup sizes (intersection with grade topics)
const PRACTICE_TOPIC_GROUPS = {
  life_science: ["body", "animals", "plants", "environment"],
  earth_space: ["earth_space", "environment"],
  materials_energy: ["materials", "experiments"],
};

console.log("=== SCIENCE EFFECTIVE POOL MATRIX (curriculum topic × grade × UI level) ===\n");

for (const g of SCIENCE_GRADE_ORDER) {
  console.log(`## ${g} (${SCIENCE_GRADES[g]?.name || g})`);
  const topics = (SCIENCE_GRADES[g]?.topics || []).filter((t) => t !== "mixed");
  for (const topic of topics) {
    const row = matrix[g][topic];
    console.log(
      `  ${topic.padEnd(14)} | easy: ${String(row.easy).padStart(3)} | medium: ${String(row.medium).padStart(3)} | hard: ${String(row.hard).padStart(3)}`
    );
  }
  if ((SCIENCE_GRADES[g]?.topics || []).includes("mixed")) {
    const mx = mixedByGradeLevel[g];
    console.log(
      `  ${"🎲 mixed (g6)".padEnd(14)} | easy: ${String(mx.easy).padStart(3)} | medium: ${String(mx.medium).padStart(3)} | hard: ${String(mx.hard).padStart(3)}`
    );
  } else {
    console.log(
      `  ${"(no mixed topic)".padEnd(14)} | all topics union — see per-topic rows`
    );
  }
  console.log("");
}

console.log("=== PRACTICE FOCUS POOLS (g5 example; all grades in JSON below) ===\n");
for (const g of SCIENCE_GRADE_ORDER) {
  const allowed = new Set(SCIENCE_GRADES[g]?.topics || []);
  let line = `${g}:`;
  for (const [key, list] of Object.entries(PRACTICE_TOPIC_GROUPS)) {
    const topics = list.filter((t) => allowed.has(t));
    const parts = LEVEL_ORDER.map(
      (lvl) => `${lvl}=${countPool(g, topics, lvl)}`
    );
    line += ` ${key}[${topics.join(",")}]: ${parts.join(" ")};`;
  }
  console.log(line);
}

console.log("\n=== BUCKETS WITH < 8 (topic-specific) OR mixed pool < 20 ===\n");
thin.sort((a, b) => a.n - b.n || a.grade.localeCompare(b.grade));
for (const t of thin) {
  console.log(`  ${t.n}\t${t.grade}\t${t.topic}\t${t.level}`);
}

console.log("\n=== TOTAL QUESTIONS ===", SCIENCE_QUESTIONS.length);
