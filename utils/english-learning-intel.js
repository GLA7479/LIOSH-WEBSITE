/** מפתח נגד חזרות לשאלות אנגלית */

export function englishQuestionFingerprint(q) {
  if (!q) return "";
  const topic = q.topic || "";
  const pf = q.params?.patternFamily || q.params?.distractorFamily || "";
  const anchor =
    q.params?.word ??
    q.params?.sentence ??
    q.params?.template ??
    "";
  const stem = String(q.question || "").slice(0, 140);
  return `${topic}|${pf}|${String(anchor).slice(0, 40)}|${stem}`;
}
