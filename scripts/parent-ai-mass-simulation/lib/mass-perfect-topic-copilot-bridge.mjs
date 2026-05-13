/**
 * Test-only harness bridge: Parent Copilot topic scope reads `topicRecommendations` rows with
 * `contractsV1.narrative.textSlots.observation`. Strength / probe_only v2 units are intentionally
 * excluded there, so the Phase 8 Hebrew "100% topic" turn would otherwise always hit
 * `buildTruthPacketV1NoAnchoredFallback` even when the diagnostic unit + topic maps contain rich evidence.
 *
 * Mirrors `attachNarrativeContractsToTopicRecommendations` (detailed-parent-report) for a single row.
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..", "..");

/**
 * Mutates `payload.subjectProfiles` when needed.
 * @param {{ payload: any, student: any }} ctx
 * @returns {boolean} true when a row was inserted
 */
export async function harnessAttachPerfectTopicCopilotAnchor(ctx) {
  const { payload, student } = ctx;
  const pt = student?.coverageHints?.perfectTopic;
  if (!pt || typeof pt !== "object" || !pt.subject || !pt.topic || !payload?.subjectProfiles) return false;

  const { normalizeSubjectId } = await import(pathToFileURL(path.join(ROOT, "utils/parent-copilot/contract-reader.js")).href);
  const { generateParentReportV2 } = await import(pathToFileURL(path.join(ROOT, "utils/parent-report-v2.js")).href);
  const { buildTopicRecommendationFromV2UnitForPhaseTests } = await import(
    pathToFileURL(path.join(ROOT, "utils/detailed-parent-report.js")).href,
  );
  const {
    buildNarrativeContractV1,
    validateNarrativeContractV1,
    applyNarrativeContractToRecord,
  } = await import(pathToFileURL(path.join(ROOT, "utils/contracts/narrative-contract-v1.js")).href);

  const sid = normalizeSubjectId(pt.subject);
  const topicKey = String(pt.topic || "").trim();
  if (!topicKey) return false;

  const profiles = payload.subjectProfiles;
  const sp = profiles.find((p) => normalizeSubjectId(p?.subject) === sid);
  if (!sp) return false;

  const list = Array.isArray(sp.topicRecommendations) ? sp.topicRecommendations : [];
  if (list.some((tr) => String(tr?.topicRowKey || tr?.topicKey || "") === topicKey)) return false;

  const units = payload?.diagnosticEngineV2?.units;
  if (!Array.isArray(units)) return false;
  const unit = units.find((u) => normalizeSubjectId(u?.subjectId) === sid && String(u?.topicRowKey || u?.bucketKey || "") === topicKey);
  if (!unit) return false;

  const base = generateParentReportV2(student.displayName, "week", null, null);
  if (!base) return false;

  let tr = buildTopicRecommendationFromV2UnitForPhaseTests(unit, base, sid);
  const narrativeContract = buildNarrativeContractV1({
    ...tr,
    subjectId: tr?.subjectId || sid,
    topicKey: tr?.topicKey || tr?.topicRowKey,
    contractsV1: tr?.contractsV1 && typeof tr.contractsV1 === "object" ? tr.contractsV1 : {},
    cannotConcludeYet:
      tr?.cannotConcludeYet === true ||
      tr?.suppressAggressiveStep === true ||
      String(tr?.conclusionStrength || "") === "withheld" ||
      String(tr?.conclusionStrength || "") === "tentative",
  });
  const validation = validateNarrativeContractV1(narrativeContract);
  tr = applyNarrativeContractToRecord(tr, narrativeContract, validation);
  sp.topicRecommendations = [tr, ...list];
  return true;
}
