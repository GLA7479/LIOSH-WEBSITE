async function postLearningJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const message = data?.error ? String(data.error) : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function startLearningSession(payload) {
  return postLearningJson("/api/learning/session/start", payload);
}

export async function saveLearningAnswer(payload) {
  return postLearningJson("/api/learning/answer", payload);
}

export async function finishLearningSession(payload) {
  return postLearningJson("/api/learning/session/finish", payload);
}
