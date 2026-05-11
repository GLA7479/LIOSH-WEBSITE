const HEBREW_GRADE_LETTER_TO_NUMBER = {
  א: 1,
  ב: 2,
  ג: 3,
  ד: 4,
  ה: 5,
  ו: 6,
};

export function normalizeGradeLevelToKey(rawGradeLevel) {
  const value = String(rawGradeLevel || "").trim();
  if (!value) return "";

  const lower = value.toLowerCase();

  if (/^g[1-6]$/.test(lower)) {
    return lower;
  }

  const gradeMatch = lower.match(/(?:grade|grade_|g|class|כיתה)[\s_-]*([1-6])/);
  if (gradeMatch) {
    return `g${gradeMatch[1]}`;
  }

  const hebrewMatch = value.match(/כיתה\s*([אבגדהו])/);
  if (hebrewMatch) {
    const gradeNumber = HEBREW_GRADE_LETTER_TO_NUMBER[hebrewMatch[1]];
    if (gradeNumber) {
      return `g${gradeNumber}`;
    }
  }

  return "";
}

export function gradeKeyToNumber(gradeKey) {
  const match = String(gradeKey || "").toLowerCase().match(/^g([1-6])$/);
  return match ? Number(match[1]) : null;
}

export async function fetchStudentDefaults() {
  const response = await fetch("/api/student/me", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.student?.id) {
    return null;
  }

  const student = payload.student;
  return {
    fullName: String(student.full_name || "").trim(),
    gradeKey: normalizeGradeLevelToKey(student.grade_level),
  };
}
