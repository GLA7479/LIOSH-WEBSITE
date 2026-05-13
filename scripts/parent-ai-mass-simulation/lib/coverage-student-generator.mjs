/**
 * Coverage-driven synthetic students for Phase 8 mass runs (deterministic, not random-only).
 * Activated when MASS_COVERAGE_MODE=1 in run-mass-simulation.mjs
 */
import { SUBJECT_KEYS, TOPICS_BY_SUBJECT, GRADE_ORDER } from "./constants.mjs";

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

const SUBJECT_LABEL_HE = {
  hebrew: "עברית",
  math: "חשבון",
  english: "אנגלית",
  science: "מדעים",
  geometry: "גיאומטריה",
  moledet_geography: "מולדת וגאוגרפיה",
};

/** 13 scenario archetypes aligned with Phase 8 checklist (+ blocked reference row). */
const ARCHETYPES = [
  { key: "excellent_overall", profileType: "strong_stable", note: "חזק כללי" },
  { key: "weak_overall", profileType: "weak_all_subjects", note: "חלש במרבית המקצועות" },
  { key: "mixed_performance", profileType: "inconsistent_student", note: "ביצועים מעורבים" },
  { key: "thin_data", profileType: "thin_data", note: "מעט נתונים" },
  { key: "high_volume_data", profileType: "rich_data", note: "נפח תרגול גבוה" },
  { key: "topic_perfect_100", profileType: "strong_stable", note: "100% בנושא ממוקד", perfectTopic: true },
  { key: "topic_very_weak", profileType: "topic_specific_gap", note: "חולשה חמורה בנושא ממוקד", weakTopic: true },
  { key: "strong_topic_weak_topic", profileType: "mixed_strengths", note: "חזק במקצוע אחד וחלש באחר" },
  { key: "recurring_mistakes", profileType: "repeated_misconception", note: "טעות חוזרת" },
  { key: "improvement_over_time", profileType: "improving_student", note: "שיפור לאורך זמן" },
  { key: "regression_over_time", profileType: "declining_student", note: "ירידה לאורך זמן" },
  { key: "fallback_placeholder_bias", profileType: "external_question_flow", note: "דגש על מסלול חריג / פחות אנקור" },
  { key: "grade_aware_manifest_row", profileType: "slow_correct", note: "פרופיל לבדיקת שכבת תבניות (ללא שינוי מוצר)" },
  { key: "blocked_taxonomy_ids_note", profileType: "strong_stable", note: "תיעוד ידני בלבד — M-01 H-05 E-08 S-05 S-06 S-08", blockedTaxonomyNote: true },
];

function pickName(seed) {
  let s = (seed >>> 0) || 1;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
  return `${FIRST_NAMES[next() % FIRST_NAMES.length]} ${LAST_NAMES[next() % LAST_NAMES.length]}`;
}

function baselineForProfile(profileType) {
  if (profileType === "strong_stable") return "high";
  if (profileType.startsWith("weak") || profileType === "thin_data") return "low";
  if (profileType === "improving_student") return "rising";
  if (profileType === "declining_student") return "falling";
  return "mid";
}

function strengthsWeaknesses(profileType, subjects, primarySubject, arch) {
  if (arch.key === "blocked_taxonomy_ids_note") {
    return {
      strengths: ["יציבות יחסית בדוחות"],
      weaknesses: ["בדיקת מזהי טקסונומיה חסומים מתועדת ב-notes בלבד"],
    };
  }
  if (profileType === "weak_all_subjects") {
    return { strengths: ["מוטיבציה"], weaknesses: subjects.map((x) => `קושי ב-${x}`) };
  }
  if (profileType === "thin_data") {
    return { strengths: [], weaknesses: ["מעט מאוד נתוני תרגול"] };
  }
  if (profileType === "rich_data") {
    return { strengths: ["הרבה תרגול"], weaknesses: ["ליטוש נקודתי"] };
  }
  if (profileType === "mixed_strengths" || profileType === "inconsistent_student") {
    const a = subjects[0] || primarySubject;
    const b = subjects[1] || subjects[0] || primarySubject;
    return {
      strengths: [`${a} חזק יחסית`],
      weaknesses: [`${b} דורש חיזוק`],
    };
  }
  if (profileType === "topic_specific_gap") {
    return { strengths: ["רוב הנושאים יציבים"], weaknesses: [`פער ממוקד בנושא ב${primarySubject}`] };
  }
  if (profileType === "improving_student") {
    return { strengths: ["מגמת שיפור"], weaknesses: ["עדיין נדרש חיזוק"] };
  }
  if (profileType === "declining_student") {
    return { strengths: ["בסיס קודם"], weaknesses: ["ירידה בדיוק"] };
  }
  if (profileType === "repeated_misconception") {
    return { strengths: ["ניסיון חוזר"], weaknesses: ["טעות חוזרת באותו סוג משימה"] };
  }
  if (profileType === "external_question_flow") {
    return { strengths: ["חשיבה גמישה"], weaknesses: ["סטיות מהמשימה"] };
  }
  if (profileType === "slow_correct") {
    return { strengths: ["דיוק כשיש זמן"], weaknesses: ["קצב איטי"] };
  }
  if (profileType === "strong_stable") {
    return { strengths: subjects.map((s) => `יציב ב-${s}`), weaknesses: ["חיזוק עדין"] };
  }
  return { strengths: ["לומד"], weaknesses: ["חיזוק"] };
}

/**
 * @param {{ studentCount: number, seed: number, minGrade: string, maxGrade: string, subjectsEnv?: string }} opts
 */
export function generateCoverageStudents(opts) {
  const minIdx = Math.max(0, GRADE_ORDER.indexOf(opts.minGrade));
  const maxIdx = Math.min(GRADE_ORDER.length - 1, GRADE_ORDER.indexOf(opts.maxGrade));
  if (minIdx > maxIdx) throw new Error("MASS_MIN_GRADE / MASS_MAX_GRADE invalid");

  const subjectsList =
    !opts.subjectsEnv || String(opts.subjectsEnv).trim() === ""
      ? [...SUBJECT_KEYS]
      : String(opts.subjectsEnv)
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .map((s) => (s === "moledet" || s === "geography" ? "moledet_geography" : s))
          .filter((s) => SUBJECT_KEYS.includes(s));
  if (subjectsList.length === 0) throw new Error("MASS_SUBJECTS resolved to empty");

  const stamp = Date.now().toString(36);
  const students = [];

  for (let i = 0; i < opts.studentCount; i++) {
    const slot = i % 36;
    const grade = GRADE_ORDER[minIdx + (slot % (maxIdx - minIdx + 1))];
    const primarySubject = SUBJECT_KEYS[Math.floor(slot / 6) % SUBJECT_KEYS.length];
    const arch = ARCHETYPES[i % ARCHETYPES.length];

    let profileType = arch.profileType;
    if (profileType === "weak_math" && primarySubject !== "math") profileType = "weak_all_subjects";

    const subjects =
      arch.key === "strong_topic_weak_topic" || arch.key === "mixed_performance"
        ? [primarySubject, SUBJECT_KEYS[(SUBJECT_KEYS.indexOf(primarySubject) + 1) % SUBJECT_KEYS.length]]
        : arch.profileType === "six_subject_mixed_profile"
          ? [...SUBJECT_KEYS]
          : [...subjectsList];

    const { strengths, weaknesses } = strengthsWeaknesses(profileType, subjects, primarySubject, arch);

    const topics = TOPICS_BY_SUBJECT[primarySubject] || ["general"];
    const topicPick = topics[i % topics.length];

    /** @type {Record<string, unknown>} */
    const coverageHints = {
      scenarioKey: arch.key,
      primarySubject,
      primaryTopic: topicPick,
    };

    if (arch.perfectTopic) {
      coverageHints.perfectTopic = { subject: primarySubject, topic: topicPick };
      const subHe = SUBJECT_LABEL_HE[primarySubject] || primarySubject;
      coverageHints.perfectTopicQuestionHe = `במקצוע ${subHe} יש רצף של תשובות נכונות בתרגול המדומה — מה עושים אם בנושא הזה הילד מצליח ב־100%?`;
    }
    if (arch.weakTopic) {
      coverageHints.weakTopic = { subject: primarySubject, topic: topicPick };
    }

    const sid = `p8_${stamp}_${String(i + 1).padStart(4, "0")}_${arch.key}_${grade}_${primarySubject}`;

    students.push({
      studentId: sid,
      displayName: pickName(opts.seed + i * 7919),
      grade,
      profileType,
      baselineLevel: baselineForProfile(profileType),
      subjects,
      strengths,
      weaknesses,
      learningHistory: [
        `Phase8 coverage archetype: ${arch.key}`,
        `מקצוע ממוקד לסימולציה: ${primarySubject} / ${topicPick}`,
        arch.note,
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
      metadata: { index: i, rngSeedFragment: (opts.seed + i * 9973) >>> 0, coverageArchetype: arch.key },
      coverageHints,
      phase8Notes: arch.note,
    });
  }

  return { students, subjectsResolved: subjectsList };
}
