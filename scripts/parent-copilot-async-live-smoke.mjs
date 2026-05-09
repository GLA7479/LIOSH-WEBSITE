/**
 * Async full-pipeline live smoke: runParentCopilotTurnAsync + optional Gemini answer path.
 *
 * Loads `.env.local` into process.env only for keys not already set (never prints secrets).
 *
 * Run:
 *   npm run test:parent-copilot-async-live-smoke
 *
 * Single question (report-related payload — best for proving llm_grounded without hammering the API):
 *   npm run test:parent-copilot-async-live-smoke -- --only "מה הכי חשוב לתרגל השבוע?"
 *
 * Delay between Report-related questions (default 2500 ms; avoids free-tier rate limits):
 *   PARENT_COPILOT_ASYNC_SMOKE_DELAY_MS=3000 npm run test:parent-copilot-async-live-smoke
 *   npm run test:parent-copilot-async-live-smoke -- --delay-ms 4000
 *
 * Env (examples):
 *   PARENT_COPILOT_LLM_ENABLED=true
 *   PARENT_COPILOT_LLM_EXPERIMENT=true
 *   PARENT_COPILOT_LLM_PROVIDER=gemini
 *   PARENT_COPILOT_LLM_MODEL=gemini-2.5-flash
 *   # If flash hits HTTP 429 often, try a lighter model:
 *   # PARENT_COPILOT_LLM_MODEL=gemini-2.5-flash-lite
 *   GEMINI_API_KEY=...
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import parentCopilotMod from "../utils/parent-copilot/index.js";
import rolloutGatesMod from "../utils/parent-copilot/rollout-gates.js";

const { runParentCopilotTurnAsync } = parentCopilotMod;
const getLlmGateDecision = rolloutGatesMod.getLlmGateDecision;

function loadEnvLocalBestEffort() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined || process.env[k] === "") {
      process.env[k] = v;
    }
  }
}

function parseSmokeArgs(argv) {
  const rest = argv.slice(2);
  let onlyQuestion = null;
  let delayMs = Number(process.env.PARENT_COPILOT_ASYNC_SMOKE_DELAY_MS);
  if (!Number.isFinite(delayMs) || delayMs < 0) delayMs = 2500;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--only") {
      onlyQuestion = rest[i + 1] != null ? String(rest[++i]).trim() : "";
      continue;
    }
    if (a === "--delay-ms") {
      const n = Number(rest[++i]);
      if (Number.isFinite(n) && n >= 0) delayMs = n;
      continue;
    }
  }
  return { onlyQuestion, delayMs };
}

function sleepMs(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

loadEnvLocalBestEffort();

function makeContract(topicKey, subjectId, obs, interp, act, unc, qCount = 12, acc = 75, recEligible = true) {
  return {
    topicRowKey: topicKey,
    displayName: topicKey === "geo" ? "גאומטריה" : topicKey === "frac" ? "שברים" : topicKey === "eng_vocab" ? "אוצר מילים" : "נושא כללי",
    questions: qCount,
    accuracy: acc,
    contractsV1: {
      narrative: {
        contractVersion: "v1",
        topicKey,
        subjectId,
        wordingEnvelope: "WE2",
        hedgeLevel: "light",
        allowedTone: "parent_professional_warm",
        forbiddenPhrases: [],
        requiredHedges: [],
        allowedSections: ["summary", "finding", "recommendation", "limitations"],
        recommendationIntensityCap: recEligible ? "RI2" : "RI0",
        textSlots: {
          observation: obs,
          interpretation: interp,
          action: act,
          uncertainty: unc,
        },
      },
      decision: { contractVersion: "v1", topicKey, subjectId, decisionTier: 2, cannotConcludeYet: false },
      readiness: { contractVersion: "v1", topicKey, subjectId, readiness: "emerging" },
      confidence: { contractVersion: "v1", topicKey, subjectId, confidenceBand: "medium" },
      recommendation: {
        contractVersion: "v1",
        topicKey,
        subjectId,
        eligible: recEligible,
        intensity: recEligible ? "RI2" : "RI0",
        family: "general_practice",
        anchorEvidenceIds: [],
        rationaleCodes: [],
        forbiddenBecause: [],
      },
      evidence: { contractVersion: "v1", topicKey, subjectId },
    },
  };
}

function highDataPayload() {
  const mathGeo = makeContract(
    "geo",
    "math",
    "בגאומטריה נצפו 45 שאלות, עם דיוק של כ־72%.",
    "יש כיוון עבודה ברור בגאומטריה ונדרש חיזוק בזיהוי תכונות צורות.",
    "מומלץ תרגול ממוקד בזיהוי צורות וחישוב שטחים.",
    "כדאי לעקוב אחרי ההתקדמות בסבב הבא.",
  );
  const mathFrac = makeContract(
    "frac",
    "math",
    "בשברים נצפו 60 שאלות, עם דיוק של כ־68%.",
    "שברים מהווים אתגר ייחודי ודורשים חיזוק בסיסי בהמרות.",
    "מומלץ לתרגל המרות שברים וחיבור שברים פשוטים.",
    "כדאי לחזור לנושא אחרי עוד תרגול.",
  );
  const engVocab = makeContract(
    "eng_vocab",
    "english",
    "באוצר מילים אנגלית נצפו 38 שאלות, עם דיוק של כ־81%.",
    "אוצר מילים מתפתח בצורה טובה.",
    "המשך עם תרגול יומי קצר.",
    "",
  );
  return {
    version: 2,
    summary: { totalAnswers: 484 },
    overallSnapshot: { totalQuestions: 484, accuracyPct: 74 },
    subjectProfiles: [
      { subject: "math", topicRecommendations: [mathGeo, mathFrac] },
      { subject: "english", topicRecommendations: [engVocab] },
    ],
    executiveSummary: {
      majorTrendsHe: [
        "בתקופה הנבחרת נצפו 484 שאלות עם דיוק ממוצע של כ-74%.",
        "תחומי הדגש העיקריים הם שברים וגאומטריה.",
        "אנגלית מראה ביצועים טובים.",
      ],
    },
  };
}

function visibleAnswerFull(res) {
  if (res.resolutionStatus === "resolved") {
    return (Array.isArray(res.answerBlocks) ? res.answerBlocks : [])
      .map((b) => String(b?.textHe || ""))
      .join("\n\n");
  }
  return String(res.clarificationQuestionHe || "");
}

function answerLlmSucceeded(res) {
  const gp = res?.telemetry?.generationPath || res?.generationPath;
  return gp === "llm_grounded";
}

/** Best-effort: grounded LLM was invoked (may have failed validation after). */
function answerLlmTelemetry(res) {
  const la = res?.telemetry?.trace?.branchOutcomes?.llmAttempt || res?.telemetry?.llmAttempt;
  return la && typeof la === "object" ? la : null;
}

/** Flatten llmAttempt from telemetry for diagnostics (includes Gemini error fields). */
function answerLlmTelemetryFlat(res) {
  const tel = res?.telemetry?.llmAttempt;
  const branch = res?.telemetry?.trace?.branchOutcomes?.llmAttempt;
  const pick = branch && typeof branch === "object" ? branch : tel;
  return pick && typeof pick === "object" ? pick : null;
}

function printGemini429Diagnostics(res, utterance, groupName) {
  const la = answerLlmTelemetryFlat(res);
  const reason = la && String(la.reason || "");
  const is429 =
    reason === "http_429" ||
    la?.httpStatus === 429 ||
    (reason.startsWith("http_") && reason.includes("429"));
  const reportRelated = groupName === "Report-related";
  if (!reportRelated || !is429 || !la) return;

  console.log("\n--- Gemini HTTP 429 diagnostics (report-related LLM attempt) ---");
  if (typeof la.llmRetryCount === "number") console.log(`clientRetriesExhaustedAfterAttempts: ${la.llmRetryCount + 1}`);
  if (la.geminiErrorSummary) console.log(`geminiErrorSummary: ${la.geminiErrorSummary}`);
  if (la.geminiErrorBody) {
    console.log("geminiErrorBody (full HTTP response body):");
    console.log(String(la.geminiErrorBody));
  } else {
    console.log("geminiErrorBody: (missing — provider returned 429 without readable body)");
  }
  console.log(
    "hint: quota vs rate-limit vs overload appear in error.message / error.details in the JSON above.",
  );
  console.log("--- end 429 diagnostics ---\n");
}

const gatePreview = {
  PARENT_COPILOT_LLM_ENABLED: process.env.PARENT_COPILOT_LLM_ENABLED,
  PARENT_COPILOT_LLM_EXPERIMENT: process.env.PARENT_COPILOT_LLM_EXPERIMENT,
  PARENT_COPILOT_LLM_PROVIDER: process.env.PARENT_COPILOT_LLM_PROVIDER,
  PARENT_COPILOT_LLM_MODEL: process.env.PARENT_COPILOT_LLM_MODEL,
  hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.PARENT_COPILOT_LLM_API_KEY || "").trim(),
};

const GROUPS_BASE = [
  {
    name: "Off-topic",
    questions: [
      "כמה עולה ביטקוין?",
      "איך מכינים פיצה?",
      "מי כתב את הארי פוטר?",
      "מה זה פוטוסינתזה?",
    ],
  },
  {
    name: "Ambiguous",
    questions: ["מה אתה חושב?", "תסביר"],
  },
  {
    name: "Report-related",
    questions: [
      "מה הכי חשוב לתרגל השבוע?",
      "במה הוא חזק?",
      "איפה הוא מתקשה?",
      "מה לעשות בבית?",
      "מה עם גאומטריה?",
      "האם יש סיבה לדאגה?",
    ],
  },
];

const { onlyQuestion, delayMs } = parseSmokeArgs(process.argv);

let GROUPS = GROUPS_BASE;
if (onlyQuestion != null) {
  if (!onlyQuestion) {
    console.error('Usage: --only requires a question string, e.g. --only "מה הכי חשוב לתרגל השבוע?"');
    process.exit(2);
  }
  GROUPS = [{ name: "Report-related (--only)", questions: [onlyQuestion] }];
}

const payload = highDataPayload();
let seq = 0;

const llmGate = getLlmGateDecision();

console.log("=== Parent Copilot async live smoke (runParentCopilotTurnAsync) ===\n");
console.log("Env preview (no secrets):", JSON.stringify(gatePreview, null, 2));
console.log("getLlmGateDecision():", JSON.stringify({ enabled: llmGate.enabled, reasonCodes: llmGate.reasonCodes, stage: llmGate.stage }, null, 2));
if (onlyQuestion != null) {
  console.log(`Mode: single question (--only), delay-ms=${delayMs} (not applied — only one call)`);
} else {
  console.log(`Delay between Report-related questions: ${delayMs} ms (set PARENT_COPILOT_ASYNC_SMOKE_DELAY_MS or --delay-ms)`);
}
console.log(
  "Note: generationPath=llm_grounded only when the gate is enabled, Gemini returns a valid draft, and validators pass.\n",
);

for (const g of GROUPS) {
  console.log(`\n${"=".repeat(72)}\n## ${g.name}\n${"=".repeat(72)}`);
  let reportRelatedIndex = 0;
  for (const q of g.questions) {
    if (g.name.startsWith("Report-related") && reportRelatedIndex++ > 0) {
      await sleepMs(delayMs);
    }

    seq += 1;
    const sessionId = `async-smoke-${seq}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    let res;
    try {
      res = await runParentCopilotTurnAsync({
        audience: "parent",
        payload,
        utterance: q,
        sessionId,
      });
    } catch (e) {
      console.log(`\n---\nQ: ${q}\nERROR: ${String(e?.message || e)}\n`);
      continue;
    }

    const md = res.metadata || {};
    const tel = res.telemetry || {};
    const gp = tel.generationPath || "(missing)";
    const la = answerLlmTelemetry(res);
    const llmOk = answerLlmSucceeded(res);

    console.log(`\n---\nQ: ${q}\n`);
    console.log(`classifierBucket: ${md.classifierBucket ?? "(missing)"}`);
    console.log(`classifierSource: ${md.classifierSource ?? "(missing)"}`);
    console.log(`classifierConfidence: ${md.classifierConfidence ?? "(missing)"}`);
    console.log(`generationPath: ${gp}`);
    console.log(`answerLlmUsed (grounded draft accepted): ${llmOk}`);
    console.log(`telemetry.llmAttempt: ${JSON.stringify(la)}`);
    printGemini429Diagnostics(res, q, g.name);
    console.log(`fallbackUsed: ${!!res.fallbackUsed}`);
    console.log(`validatorStatus: ${res.validatorStatus ?? "(missing)"}`);
    console.log(`validatorFailCodes: ${JSON.stringify(res.validatorFailCodes || [])}`);
    console.log(`resolutionStatus: ${res.resolutionStatus}`);
    console.log(`\n--- full visible answer ---`);
    console.log(visibleAnswerFull(res));
    console.log(`--- end visible answer ---`);

    if (g.name === "Off-topic" || g.name === "Ambiguous") {
      const t = visibleAnswerFull(res);
      const bad =
        /\d{2,}\s*שאלות/.test(t) ||
        /דיוק\s+של\s*\d/.test(t) ||
        /לפי\s+הדוח|על\s+פי\s+הדוח/.test(t) ||
        /גאומטריה|שברים|אנגלית|אוצר מילים/.test(t);
      if (bad && g.name === "Off-topic") {
        console.log("\n[CHECK] WARNING: possible report-data leakage in off-topic boundary text.");
      }
    }

    if (q === "במה הוא חזק?") {
      const t = visibleAnswerFull(res);
      if (/מתקשה|חיזוק נדרש|דורש(?:ים)?\s+חיזוק|חולשה|קושי(?!.*חזק)/u.test(t) && /חוזק|חזק/u.test(t)) {
        console.log("\n[CHECK] NOTE: strength answer may mention weakness language — review manually.");
      }
    }
  }
}

console.log("\n=== Done ===\n");
