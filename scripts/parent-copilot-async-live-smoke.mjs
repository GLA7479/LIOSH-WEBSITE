/**
 * Async full-pipeline live smoke: runParentCopilotTurnAsync + optional Gemini answer path.
 *
 * Loads `.env.local` into process.env only for keys not already set (never prints secrets).
 *
 * Run:
 *   npm run test:parent-copilot-async-live-smoke
 *
 * Or set explicitly:
 *   PARENT_COPILOT_LLM_ENABLED=true
 *   PARENT_COPILOT_LLM_EXPERIMENT=true
 *   PARENT_COPILOT_LLM_PROVIDER=gemini
 *   PARENT_COPILOT_LLM_MODEL=gemini-2.5-flash
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
        contractVersion: "v1", topicKey, subjectId,
        eligible: recEligible, intensity: recEligible ? "RI2" : "RI0",
        family: "general_practice", anchorEvidenceIds: [], rationaleCodes: [], forbiddenBecause: [],
      },
      evidence: { contractVersion: "v1", topicKey, subjectId },
    },
  };
}

function highDataPayload() {
  const mathGeo = makeContract(
    "geo", "math",
    "בגאומטריה נצפו 45 שאלות, עם דיוק של כ־72%.",
    "יש כיוון עבודה ברור בגאומטריה ונדרש חיזוק בזיהוי תכונות צורות.",
    "מומלץ תרגול ממוקד בזיהוי צורות וחישוב שטחים.",
    "כדאי לעקוב אחרי ההתקדמות בסבב הבא.",
  );
  const mathFrac = makeContract(
    "frac", "math",
    "בשברים נצפו 60 שאלות, עם דיוק של כ־68%.",
    "שברים מהווים אתגר ייחודי ודורשים חיזוק בסיסי בהמרות.",
    "מומלץ לתרגל המרות שברים וחיבור שברים פשוטים.",
    "כדאי לחזור לנושא אחרי עוד תרגול.",
  );
  const engVocab = makeContract(
    "eng_vocab", "english",
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

const gatePreview = {
  PARENT_COPILOT_LLM_ENABLED: process.env.PARENT_COPILOT_LLM_ENABLED,
  PARENT_COPILOT_LLM_EXPERIMENT: process.env.PARENT_COPILOT_LLM_EXPERIMENT,
  PARENT_COPILOT_LLM_PROVIDER: process.env.PARENT_COPILOT_LLM_PROVIDER,
  PARENT_COPILOT_LLM_MODEL: process.env.PARENT_COPILOT_LLM_MODEL,
  hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.PARENT_COPILOT_LLM_API_KEY || "").trim(),
};

const GROUPS = [
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

const payload = highDataPayload();
let seq = 0;

const llmGate = getLlmGateDecision();

console.log("=== Parent Copilot async live smoke (runParentCopilotTurnAsync) ===\n");
console.log("Env preview (no secrets):", JSON.stringify(gatePreview, null, 2));
console.log("getLlmGateDecision():", JSON.stringify({ enabled: llmGate.enabled, reasonCodes: llmGate.reasonCodes, stage: llmGate.stage }, null, 2));
console.log(
  "Note: generationPath=llm_grounded only when the gate is enabled, Gemini returns a valid draft, and validators pass.\n",
);

for (const g of GROUPS) {
  console.log(`\n${"=".repeat(72)}\n## ${g.name}\n${"=".repeat(72)}`);
  for (const q of g.questions) {
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
