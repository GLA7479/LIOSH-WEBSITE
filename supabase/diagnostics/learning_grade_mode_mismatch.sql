-- Diagnosis only (run in Supabase SQL editor). Adjust LIMIT / filters as needed.
-- Does not delete or modify data.

-- 1) learning_sessions: metadata.gradeLevel present as g1–g6 but different from students.grade_level
--    when the latter is also stored as g1–g6 (common server shape).
SELECT
  ls.id,
  ls.student_id,
  s.grade_level AS student_grade_level,
  ls.metadata ->> 'gradeLevel' AS session_grade_level,
  ls.metadata ->> 'mode' AS session_mode,
  ls.subject,
  ls.started_at
FROM learning_sessions ls
JOIN students s ON s.id = ls.student_id
WHERE
  (s.grade_level ~* '^g[1-6]$')
  AND (ls.metadata ->> 'gradeLevel') ~* '^g[1-6]$'
  AND lower(trim(ls.metadata ->> 'gradeLevel')) <> lower(trim(s.grade_level))
ORDER BY ls.started_at DESC
LIMIT 200;

-- 2) answers: answer_payload.gradeLevel g1–g6 differs from students.grade_level when both g-shaped
SELECT
  a.id,
  a.student_id,
  s.grade_level AS student_grade_level,
  a.answer_payload ->> 'gradeLevel' AS answer_grade_level,
  a.answer_payload ->> 'gameMode' AS answer_game_mode,
  a.answer_payload ->> 'subject' AS subject,
  coalesce(a.answered_at, a.created_at) AS at
FROM answers a
JOIN students s ON s.id = a.student_id
WHERE
  (s.grade_level ~* '^g[1-6]$')
  AND (a.answer_payload ->> 'gradeLevel') ~* '^g[1-6]$'
  AND lower(trim(a.answer_payload ->> 'gradeLevel')) <> lower(trim(s.grade_level))
ORDER BY coalesce(a.answered_at, a.created_at) DESC
LIMIT 200;

-- 3) Sessions with missing or blank mode in metadata (often legacy or incomplete writes)
SELECT
  ls.id,
  ls.student_id,
  ls.metadata ->> 'gradeLevel' AS session_grade_level,
  ls.metadata ->> 'mode' AS session_mode,
  ls.subject,
  ls.started_at
FROM learning_sessions ls
WHERE
  ls.metadata ->> 'mode' IS NULL
  OR trim(ls.metadata ->> 'mode') = ''
ORDER BY ls.started_at DESC
LIMIT 200;
