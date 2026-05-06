import fs from "node:fs";
import path from "node:path";
import { PROFILE_TYPES, SUBJECT_KEYS, TOPICS_BY_SUBJECT, GRADE_ORDER } from "./constants.mjs";
import { createRng, pick, randInt } from "./prng.mjs";

const FIRST_NAMES = [
  "נועם",
  "תמר",
  "איתי",
  "שירה",
  "רועי",
  "מיה",
  "עומר",
  "עדי",
  "אורי",
  "דניאל",
  "ליאור",
  "הדר",
  "אילי",
  "מיכל",
  "יובל",
];

const LAST_NAMES = ["כהן", "לוי", "מזרחי", "דגן", "ביטון", "שטרן", "גולן", "פרץ", "אברהם", "רוזן"];

function gradeIndexFromEnv(minG, maxG) {
  let minIdx = GRADE_ORDER.indexOf(minG);
  let maxIdx = GRADE_ORDER.indexOf(maxG);
  if (minIdx < 0) minIdx = 0;
  if (maxIdx < 0) maxIdx = GRADE_ORDER.length - 1;
  if (maxIdx < minIdx) {
    const t = minIdx;
    minIdx = maxIdx;
    maxIdx = t;
  }
  return { minIdx, maxIdx };
}

function subjectsFromEnv(envSubjects) {
  if (!envSubjects || String(envSubjects).trim() === "") return [...SUBJECT_KEYS];
  const raw = String(envSubjects)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const mapped = raw.map((s) => {
    if (s === "moledet" || s === "geography") return "moledet_geography";
    return s;
  });
  const allowed = new Set(SUBJECT_KEYS);
  return mapped.filter((s) => allowed.has(s));
}

function profileStrengthsWeaknesses(profileType, subjects, rng) {
  const weakMath = ["חישובים בסיסיים", "בעיות מילוליות", "שברים"];
  const weakHebrew = ["הבנת הנקרא", "אוצר מילים", "מבנה משפט"];
  const weakEn = ["אוצר מילים באנגלית", "הבנת משפטים"];
  switch (profileType) {
    case "strong_stable":
      return {
        strengths: subjects.map((s) => `ביצועים יציבים ב-${s}`),
        weaknesses: ["נקודות עדינות לחיזוק חוזר"],
      };
    case "weak_all_subjects":
      return {
        strengths: ["מוטיבציה בסיסית ללמידה"],
        weaknesses: subjects.map((s) => `קושי מערכתי ב-${s}`),
      };
    case "weak_math":
      return {
        strengths: subjects.some((s) => s !== "math") ? ["קריאה יחסית טובה"] : ["עבודה שיטתית"],
        weaknesses: weakMath,
      };
    case "weak_hebrew":
      return { strengths: ["שיחה יומיומית"], weaknesses: weakHebrew };
    case "weak_english":
      return { strengths: ["עברית"], weaknesses: weakEn };
    case "improving_student":
      return {
        strengths: ["מגמת שיפור ברורה לאורך זמן"],
        weaknesses: ["עדיין נדרש חיזוק יומיומי"],
      };
    case "declining_student":
      return {
        strengths: ["בסיס קודם טוב יותר"],
        weaknesses: ["ירידה עקבית בדיוק ובמהירות"],
      };
    case "inconsistent_student":
      return {
        strengths: ["רגעי הצלחה חזקים"],
        weaknesses: ["תוצאות לא עקביות בין נושאים"],
      };
    case "random_guessing":
      return {
        strengths: ["מהירות תגובה"],
        weaknesses: ["בחירת תשובות לא עקבית עם הנחיות"],
      };
    case "fast_wrong":
      return { strengths: ["זריזות"], weaknesses: ["טעויות תחת לחץ זמן"] };
    case "slow_correct":
      return { strengths: ["דיוק כשיש זמן"], weaknesses: ["מהירות נמוכה"] };
    case "repeated_misconception":
      return {
        strengths: ["ניסיון חוזר"],
        weaknesses: ["טעות חוזרת באותו סוג משימה"],
      };
    case "prerequisite_gap":
      return {
        strengths: ["מוטיבציה"],
        weaknesses: ["חוסר יציבות בידע קודם נדרש"],
      };
    case "thin_data":
      return {
        strengths: [],
        weaknesses: ["מעט מאוד נתוני תרגול זמינים"],
      };
    case "rich_data":
      return {
        strengths: ["הרבה תרגול ונתונים"],
        weaknesses: ["נקודות ליטוש ממוקדות"],
      };
    case "mixed_strengths":
      return {
        strengths: [pick(rng, subjects) + " חזק יחסית"],
        weaknesses: [pick(rng, subjects) + " דורש חיזוק"],
      };
    case "reading_comprehension_gap":
      return {
        strengths: ["זיהוי מילים"],
        weaknesses: ["הסקות והבנת מטקסט"],
      };
    case "calculation_errors":
      return {
        strengths: ["הבנת הבעיה"],
        weaknesses: ["טעויות חישוב"],
      };
    case "word_problem_gap":
      return {
        strengths: ["חישוב ישיר"],
        weaknesses: ["תרגום מילולי לפעולה מתמטית"],
      };
    case "topic_specific_gap":
      return {
        strengths: ["נושאים רחבים יציבים"],
        weaknesses: ["פער ממוקד בנושא אחד"],
      };
    case "external_question_flow":
      return {
        strengths: ["חשיבה מחוץ למסגרת"],
        weaknesses: ["סטיות מהנחיות המשימה"],
      };
    case "six_subject_mixed_profile":
      return {
        strengths: subjects.slice(0, 3).map((s) => `ב-${s} יש רגעים חזקים`),
        weaknesses: subjects.slice(3).map((s) => `ב-${s} דורש תשומת לב`),
      };
    default:
      return { strengths: ["לומד"], weaknesses: ["נדרש חיזוק"] };
  }
}

/**
 * @param {{ studentCount: number, seed: number, minGrade: string, maxGrade: string, subjectsEnv?: string }} opts
 */
export function generateStudents(opts) {
  const rng = createRng(opts.seed ^ 0x9e3779b9);
  const { minIdx, maxIdx } = gradeIndexFromEnv(opts.minGrade, opts.maxGrade);
  const subjectsList = subjectsFromEnv(opts.subjectsEnv);
  if (subjectsList.length === 0) {
    throw new Error("MASS_SUBJECTS resolved to empty — use comma list of valid subjects.");
  }

  const stamp = Date.now().toString(36);
  /** @type {any[]} */
  const students = [];

  for (let i = 0; i < opts.studentCount; i++) {
    const profileType = PROFILE_TYPES[i % PROFILE_TYPES.length];
    const grade = GRADE_ORDER[randInt(rng, minIdx, maxIdx)];
    const sid = `mass_${stamp}_${String(i + 1).padStart(4, "0")}_${profileType}_${grade}`;
    const displayName = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    const subjects =
      profileType === "six_subject_mixed_profile" ? [...SUBJECT_KEYS] : [...subjectsList];

    const { strengths, weaknesses } = profileStrengthsWeaknesses(profileType, subjects, rng);

    const baselineLevel =
      profileType === "strong_stable"
        ? "high"
        : profileType.startsWith("weak") || profileType === "thin_data"
          ? "low"
          : profileType === "improving_student"
            ? "rising"
            : profileType === "declining_student"
              ? "falling"
              : "mid";

    students.push({
      studentId: sid,
      displayName,
      grade,
      profileType,
      baselineLevel,
      subjects,
      strengths,
      weaknesses,
      learningHistory: [
        `סימולציה מונחית פרופיל: ${profileType}`,
        `כיסוי נושאים: ${subjects.join(", ")}`,
      ],
      generatedSessions: [],
      generatedAnswers: [],
      mistakes: [],
      trendOverTime:
        profileType === "improving_student"
          ? "שיפור הדרגתי"
          : profileType === "declining_student"
            ? "מגמת ירידה"
            : profileType === "inconsistent_student"
              ? "תנודתיות"
              : "יציבות יחסית",
      reportFiles: {},
      pdfFiles: {},
      parentAiChatFiles: {},
      questionRunFiles: {},
      metadata: { index: i, rngSeedFragment: (opts.seed + i * 9973) >>> 0 },
    });
  }

  return { students, subjectsResolved: subjectsList };
}

export function writeStudentFiles(outputRoot, students) {
  const dir = path.join(outputRoot, "students");
  fs.mkdirSync(dir, { recursive: true });
  for (const s of students) {
    fs.writeFileSync(path.join(dir, `${s.studentId}.json`), JSON.stringify(s, null, 2), "utf8");
    const md = [`# תלמיד ${s.displayName}`, "", `- מזהה: \`${s.studentId}\``, `- כיתה: ${s.grade}`, `- פרופיל: ${s.profileType}`, `- רמת בסיס: ${s.baselineLevel}`, "", "## מקצועות", ...s.subjects.map((x) => `- ${x}`), "", "## חוזקות", ...s.strengths.map((x) => `- ${x}`), "", "## חולשות", ...s.weaknesses.map((x) => `- ${x}`), ""].join("\n");
    fs.writeFileSync(path.join(dir, `${s.studentId}.md`), md, "utf8");
  }
}
