/**
 * Node tests: topic-level custom builder, merge, tagging (dev-student-simulator only).
 * Run: npx tsx scripts/dev-student-simulator-topic-merge-test.mjs
 */
import * as simMod from "../utils/dev-student-simulator/index.js";
const simApi = simMod?.default && Object.keys(simMod).length === 1 ? simMod.default : { ...(simMod.default || {}), ...simMod };

const {
  listTopicKeysMissingHebrewLabel,
  buildSimulatorCoreFromCustomSpec,
  buildStorageSnapshotFromSessions,
  buildSessionsFromCustomSpec,
  defaultCustomSpec,
  resolveCustomSpecTopicSettings,
  validateCustomSpecBeforeBuild,
  SUBJECT_BUCKETS,
  SUBJECTS,
  SIMULATOR_ORIGIN,
  CUSTOM_APPLY_MODE,
  STORAGE_KEYS,
} = simApi;

function assert(name, cond, detail = "") {
  if (!cond) {
    throw new Error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function makeSpecThreeMathTopics() {
  const spec = defaultCustomSpec();
  for (const sid of SUBJECTS || []) {
    if (sid !== "math" && spec.subjects[sid]) spec.subjects[sid].enabled = false;
  }
  const m = SUBJECT_BUCKETS.math;
  for (const t of m) {
    if (!spec.topicSettings.math[t]) {
      spec.topicSettings.math[t] = { ...spec.topicSettings.math[t] };
    }
  }
  const three = m.slice(0, 3);
  for (const t of m) {
    spec.topicSettings.math[t] = {
      ...spec.topicSettings.math[t],
      enabled: three.includes(t),
      targetQuestions: three.includes(t) ? 30 : 0,
    };
  }
  spec.subjects.math.enabled = true;
  resolveCustomSpecTopicSettings(spec);
  return spec;
}

function countSessionsForOp(snapshot, op) {
  const s = snapshot?.mleo_time_tracking?.operations?.[op]?.sessions || [];
  return s.length;
}

function totalQsForOp(snapshot, op) {
  const s = snapshot?.mleo_time_tracking?.operations?.[op]?.sessions || [];
  return s.reduce((a, r) => a + (Number(r.total) || 0), 0);
}

function main() {
  const miss = listTopicKeysMissingHebrewLabel?.() || [];
  assert("hebrew map complete", miss.length === 0, miss.join(", "));

  const anchor = Date.parse("2025-06-15T12:00:00");
  const emptyMap = Object.fromEntries((STORAGE_KEYS || []).map((k) => [k, null]));

  // 1) Preview: 3 math topics → all 3 in sessions
  const s3 = makeSpecThreeMathTopics();
  const core3 = buildSimulatorCoreFromCustomSpec({ spec: s3, anchorEndMs: anchor, existingStorageMap: emptyMap });
  const byBucket = new Set(core3.sessions.map((x) => x.bucket));
  assert("3 math topics in sessions", byBucket.size === 3, [...byBucket].join(", "));

  // unknown topic
  const bad = JSON.parse(JSON.stringify(defaultCustomSpec()));
  bad.subjects.math.enabled = true;
  bad.subjects.math.topics = ["not_a_real_topic_key_zzz"];
  const vbad = validateCustomSpecBeforeBuild(bad);
  assert("invalid topic blocked", !vbad.ok, vbad.errors.join("; "));

  // 2) Apply only one topic: unrelated bucket unchanged
  const additionOnly = {
    mleo_time_tracking: {
      operations: {
        addition: {
          total: 99,
          sessions: [
            {
              date: "2025-01-01",
              duration: 99,
              grade: "g4",
              level: "medium",
              operation: "addition",
              mathReportBucket: "addition",
              timestamp: 1,
              mode: "learning",
              total: 5,
              correct: 3,
            },
          ],
          byGrade: {},
          byLevel: {},
        },
      },
      daily: {},
    },
  };
  const existingA = { mleo_time_tracking: JSON.stringify(additionOnly.mleo_time_tracking) };
  const oneDiv = JSON.parse(JSON.stringify(defaultCustomSpec()));
  for (const sid of SUBJECTS || []) {
    if (sid !== "math" && oneDiv.subjects[sid]) oneDiv.subjects[sid].enabled = false;
  }
  for (const t of SUBJECT_BUCKETS.math) {
    oneDiv.topicSettings.math[t] = { ...oneDiv.topicSettings.math[t], enabled: false, targetQuestions: 0 };
  }
  oneDiv.topicSettings.math[SUBJECT_BUCKETS.math[4] || "division_with_remainder"] = {
    ...defaultCustomSpec().topicSettings.math[SUBJECT_BUCKETS.math[0]],
    enabled: true,
    targetQuestions: 70,
  };
  oneDiv.subjects.math.enabled = true;
  resolveCustomSpecTopicSettings(oneDiv);
  const divKey = oneDiv.subjects.math.topics[0] || "division_with_remainder";
  const run = buildSimulatorCoreFromCustomSpec({
    spec: oneDiv,
    anchorEndMs: anchor,
    existingStorageMap: existingA,
  });
  const addAfter = countSessionsForOp(run.snapshot, "addition");
  const addQ = totalQsForOp(run.snapshot, "addition");
  assert("addition sessions unchanged", addAfter === 1, String(addAfter));
  assert("addition questions unchanged", addQ === 5, String(addQ));
  assert("division has sessions", countSessionsForOp(run.snapshot, divKey) >= 1, String(countSessionsForOp(run.snapshot, divKey)));

  // 3) Replace selected twice: no duplicate
  const fresh = { mleo_time_tracking: null, mleo_mistakes: null, mleo_math_master_progress: null };
  const onlyMul = (spec0) => {
    const s = JSON.parse(JSON.stringify(spec0));
    for (const sid of SUBJECTS || []) {
      if (sid !== "math" && s.subjects[sid]) s.subjects[sid].enabled = false;
    }
    for (const t of SUBJECT_BUCKETS.math) {
      s.topicSettings.math[t] = {
        ...s.topicSettings.math[t],
        enabled: t === "multiplication",
        targetQuestions: t === "multiplication" ? 50 : 0,
      };
    }
    s.subjects.math.enabled = true;
    resolveCustomSpecTopicSettings(s);
    return s;
  };
  const m1 = onlyMul(defaultCustomSpec());
  const sameAnchor = anchor + 1;
  const r1 = buildSimulatorCoreFromCustomSpec({ spec: m1, anchorEndMs: sameAnchor, existingStorageMap: fresh });
  const c1 = countSessionsForOp(r1.snapshot, "multiplication");
  const r2 = buildSimulatorCoreFromCustomSpec({
    spec: m1,
    anchorEndMs: sameAnchor,
    existingStorageMap: { mleo_time_tracking: JSON.stringify(r1.snapshot.mleo_time_tracking) },
  });
  const c2 = countSessionsForOp(r2.snapshot, "multiplication");
  assert("replace idempotent count", c1 === c2, `c1=${c1} c2=${c2}`);

  // 4) Append twice increases
  const appendSpec = onlyMul(defaultCustomSpec());
  appendSpec.customApplyMode = CUSTOM_APPLY_MODE.append;
  const a1 = buildSimulatorCoreFromCustomSpec({ spec: appendSpec, anchorEndMs: anchor + 3, existingStorageMap: fresh });
  const a2 = buildSimulatorCoreFromCustomSpec({
    spec: appendSpec,
    anchorEndMs: anchor + 3,
    existingStorageMap: { mleo_time_tracking: JSON.stringify(a1.snapshot.mleo_time_tracking) },
  });
  const mAfter1 = countSessionsForOp(a1.snapshot, "multiplication");
  const mAfter2 = countSessionsForOp(a2.snapshot, "multiplication");
  assert("append grows", mAfter2 > mAfter1, `${mAfter1} -> ${mAfter2}`);

  // 4b) Browser QA parity: math (3 ops) + Hebrew (2 topics) — same selection as Playwright script
  const qa = defaultCustomSpec();
  for (const sid of SUBJECTS || []) {
    if (qa.subjects[sid]) qa.subjects[sid].enabled = sid === "math" || sid === "hebrew";
  }
  for (const t of SUBJECT_BUCKETS.math) {
    qa.topicSettings.math[t] = { ...qa.topicSettings.math[t], enabled: false, targetQuestions: 0 };
  }
  for (const t of ["division_with_remainder", "multiplication", "fractions"]) {
    qa.topicSettings.math[t] = { ...qa.topicSettings.math[t], enabled: true, targetQuestions: 20 };
  }
  for (const t of SUBJECT_BUCKETS.hebrew) {
    qa.topicSettings.hebrew[t] = { ...qa.topicSettings.hebrew[t], enabled: false, targetQuestions: 0 };
  }
  for (const t of ["reading", "comprehension"]) {
    qa.topicSettings.hebrew[t] = { ...qa.topicSettings.hebrew[t], enabled: true, targetQuestions: 20 };
  }
  resolveCustomSpecTopicSettings(qa);
  const coreQA = buildSimulatorCoreFromCustomSpec({ spec: qa, anchorEndMs: anchor, existingStorageMap: emptyMap });
  const bucketsQA = new Set(coreQA.sessions.map((x) => `${x.subject}:${x.bucket}`));
  assert("browser QA 5 topic buckets in sessions", bucketsQA.size === 5, [...bucketsQA].sort().join("|"));

  // 5) Tags on rows
  const mtag = onlyMul(defaultCustomSpec());
  const partial = buildStorageSnapshotFromSessions(
    buildSessionsFromCustomSpec(mtag, sameAnchor, { simulatorRunId: "run-test" }),
    "P"
  );
  const s0 = partial.snapshot.mleo_time_tracking.operations.multiplication.sessions[0];
  assert("session tagged", s0?.origin === SIMULATOR_ORIGIN && s0?.simulatorTopic === "multiplication" && s0?.simulatorRunId, JSON.stringify(s0));

  // 6) merge metadata shape (affectedUnits in core)
  assert("core metadata affectedUnits", Array.isArray(core3.metadata.affectedUnits) && core3.metadata.affectedUnits.length === 3);

  console.log(
    JSON.stringify(
      {
        ok: true,
        threeTopicKeys: [...byBucket].sort(),
        replaceIdempotent: { c1, c2 },
        appendGrow: { mAfter1, mAfter2 },
      },
      null,
      2
    )
  );
}

main();
