import fs from "node:fs";
import path from "node:path";

function safeCopy(src, dstDir, name) {
  try {
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dstDir, name));
  } catch {
    /* ignore */
  }
}

/**
 * Curated copies for human launch review.
 */
export function buildManualReviewPack(outputRoot, students) {
  const dir = path.join(outputRoot, "samples-for-manual-review");
  fs.mkdirSync(dir, { recursive: true });

  const pick = (pred) => students.find(pred);

  const samples = [
    { tag: "strong_stable", s: pick((x) => x.profileType === "strong_stable") },
    { tag: "weak_all_subjects", s: pick((x) => x.profileType === "weak_all_subjects") },
    { tag: "thin_data", s: pick((x) => x.profileType === "thin_data") },
    { tag: "improving_student", s: pick((x) => x.profileType === "improving_student") },
    { tag: "declining_student", s: pick((x) => x.profileType === "declining_student") },
    { tag: "rich_data", s: pick((x) => x.profileType === "rich_data") },
    { tag: "random_guessing", s: pick((x) => x.profileType === "random_guessing") },
    { tag: "six_subject_mixed_profile", s: pick((x) => x.profileType === "six_subject_mixed_profile") },
  ].filter((x) => x.s);

  for (const { tag, s } of samples) {
    const base = `${tag}__${s.studentId}`;
    safeCopy(path.join(outputRoot, "parent-reports", s.studentId, "short.md"), dir, `${base}__report_short.md`);
    safeCopy(path.join(outputRoot, "parent-ai-chats", `${s.studentId}.md`), dir, `${base}__parent_ai.md`);
    safeCopy(path.join(outputRoot, "question-runs", `${s.studentId}.md`), dir, `${base}__questions.md`);
    safeCopy(path.join(outputRoot, "pdfs", "short", `${s.studentId}.pdf`), dir, `${base}__short.pdf`);
  }

  const guide = [
    "# מדריך לסקירה ידנית (Mass Simulation)",
    "",
    "פתח קודם:",
    "",
    "1. `../MASS_SIMULATION_SUMMARY.md` — תמונת מצב כוללת בעברית.",
    "2. `../QUALITY_FLAGS.md` — כשלים ואזהרות שחייבים מעקב.",
    "3. `../STUDENTS_INDEX.md` — מפת תלמידים וקישורים לקבצים.",
    "",
    "## דוגמאות בתיקייה זו",
    "",
    ...samples.map(({ tag }) => `- קבצים עם הקידומת \`${tag}__\` — פרופיל ${tag}`),
    "",
    "### מה כל דוגמה בודקת",
    "",
    "- דוח קצר (`*report_short.md`): שפה להורים, התאמה לפרופיל.",
    "- Parent AI (`*parent_ai.md`): הזחות, גבולות, עקביות.",
    "- שאלות סימולציה (`*questions.md`): כיסוי נושאים וטעויות.",
    "- PDF קצר (`*short.pdf`): יצוא תצוגה (שימו לב לעברית בפונט ברירת מחדל).",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(dir, "REVIEW_GUIDE.md"), guide, "utf8");
}
