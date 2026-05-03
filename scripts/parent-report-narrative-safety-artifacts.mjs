#!/usr/bin/env node
/**
 * Validates parent-visible narrative strings in real report / simulator JSON artifacts.
 * npm run test:parent-report-narrative-safety-artifacts
 */
import { readFile, mkdir, writeFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { extractParentVisibleNarratives } from "../utils/parent-narrative-safety/parent-report-text-extractor.js";
import { validateParentNarrativeSafety } from "../utils/parent-narrative-safety/parent-narrative-safety-guard.js";
import { deriveEngineSnapshotForGuard } from "../utils/parent-narrative-safety/parent-engine-snapshot-for-guard.js";
import { runParentReportTextExtractorInlineTests } from "../utils/parent-narrative-safety/parent-report-text-extractor.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "reports", "parent-report-narrative-safety-artifacts");
const OUT_JSON = join(OUT_DIR, "summary.json");
const OUT_MD = join(OUT_DIR, "summary.md");

/** @type {{ rel: string, name: string, fileFilter: (name: string) => boolean }[]} */
const ARTIFACT_SOURCE_RULES = [
  {
    rel: join("reports", "parent-report-persona-corpus", "json"),
    name: "parent-report-persona-corpus",
    fileFilter: (n) => /\.(short|detailed)\.json$/i.test(n),
  },
  {
    rel: join("reports", "learning-simulator", "parent-report-review-pack", "reports"),
    name: "learning-simulator-parent-report-review-pack",
    fileFilter: () => true,
  },
  {
    rel: join("reports", "learning-simulator", "reports", "per-student"),
    name: "learning-simulator-per-student-reports",
    fileFilter: (n) => n.endsWith(".report.json"),
  },
];

/** Directories scanned (must exist under ROOT). */
export const ARTIFACT_SEARCH_PATHS_ABSOLUTE = ARTIFACT_SOURCE_RULES.map((r) => join(ROOT, r.rel));

async function* iterateJsonFilesRecursive(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* iterateJsonFilesRecursive(p);
    else if (e.isFile() && e.name.endsWith(".json")) yield p;
  }
}

async function collectArtifactFiles() {
  /** @type {string[]} */
  const files = [];
  const searched = [];

  for (const rule of ARTIFACT_SOURCE_RULES) {
    const abs = join(ROOT, rule.rel);
    searched.push(abs.replace(/\\/g, "/"));
    try {
      await readdir(abs);
    } catch {
      continue;
    }
    for await (const f of iterateJsonFilesRecursive(abs)) {
      const base = f.split(/[/\\]/).pop() || "";
      if (!rule.fileFilter(base)) continue;
      if (f.includes("parent-report-narrative-safety-artifacts")) continue;
      files.push(f);
    }
  }

  return { files: [...new Set(files)].sort(), searched };
}

function unwrapExistsDiagnostic(reportRoot) {
  const br =
    reportRoot?.baseReport?.diagnosticEngineV2 ||
    reportRoot?.reportJson?.baseReport?.diagnosticEngineV2 ||
    reportRoot?.diagnosticEngineV2;
  return !!(br && typeof br === "object");
}

function mainSummaryMd(payload) {
  const lines = [
    "# Parent narrative safety — real artifact validation",
    "",
    `- Generated: ${payload.generatedAt}`,
    `- Status: **${payload.status}**`,
    "",
  ];
  if (payload.status === "no_artifacts_found" && payload.message) {
    lines.push(`> ${payload.message}`, "");
  }
  if (payload.status === "warnings_only") {
    lines.push(
      "> **Warnings** (for example `ambiguous_evidence` where the text is still vague on thin rows) are listed for review. They do not fail this script. **Info / caution** rows are *not* safety problems — they mark correctly cautious thin-data Hebrew copy.",
      ""
    );
  }
  lines.push(
    "## Scope",
    "",
    "- Searched directories:",
    ...payload.searchedDirectories.map((d) => `  - \`${d}\``),
    "",
    "## Counts",
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| JSON files read | ${payload.artifactFileCount} |`,
    `| Narratives checked | ${payload.narrativesChecked} |`,
    `| Clean pass (no info tags) | ${payload.cleanPassCount ?? 0} |`,
    `| Info / caution (safe thin-data framing) | ${payload.infoCautionCount ?? 0} |`,
    `| Pass total (clean + info) | ${payload.passTotalCount ?? (payload.cleanPassCount ?? 0) + (payload.infoCautionCount ?? 0)} |`,
    `| Warning | ${payload.warningCount} |`,
    `| Block | ${payload.blockCount} |`,
    `| Missing engine context (heuristic) | ${payload.missingContextCount} |`,
    "",
    "## Interpreting counts",
    "",
    "- **Info / caution**: deterministic recognition of explicit limited-evidence / statistical-restraint Hebrew wording on thin engine rows. These narratives **passed** the guard; tags are for QA visibility only.",
    "- **Warning**: review suggested — not a failure for this script unless you tighten policy.",
    "",
  );

  if (payload.status === "no_artifacts_found") {
    lines.push("## Result", "", payload.message, "");
  }

  if (payload.topIssueCodes?.length) {
    lines.push("## Top issue codes", "", "| Code | Count |", "| --- | --- |");
    for (const [c, n] of payload.topIssueCodes) {
      lines.push(`| ${c} | ${n} |`);
    }
    lines.push("");
  }

  if (payload.topInfoFindings?.length) {
    lines.push("## Top info / caution tags", "", "| Tag | Count |", "| --- | --- |");
    for (const [c, n] of payload.topInfoFindings) {
      lines.push(`| ${c} | ${n} |`);
    }
    lines.push("");
  }

  if (payload.exampleInfoCaution?.length) {
    lines.push("## Info / caution examples (trimmed)", "");
    for (const ex of payload.exampleInfoCaution) {
      lines.push(`- **${ex.id}** (\`${ex.path}\`)`, `  - Text: ${ex.textPreview}`, `  - Tags: ${ex.tags}`, "");
    }
  }

  if (payload.blockedNarrativeIds?.length) {
    lines.push("## Blocked narrative ids", "", ...payload.blockedNarrativeIds.map((x) => `- \`${x}\``), "");
  }
  if (payload.warningNarrativeIds?.length) {
    lines.push("## Warning narrative ids", "", ...payload.warningNarrativeIds.map((x) => `- \`${x}\``), "");
  }

  if (payload.exampleBlocks?.length) {
    lines.push("## Block examples (trimmed)", "");
    for (const ex of payload.exampleBlocks) {
      lines.push(`- **${ex.id}** (\`${ex.path}\`)`, `  - Text: ${ex.textPreview}`, `  - Codes: ${ex.codes}`, "");
    }
  }
  if (payload.exampleWarnings?.length) {
    lines.push("## Warning examples (trimmed)", "");
    for (const ex of payload.exampleWarnings) {
      lines.push(`- **${ex.id}**`, `  - Text: ${ex.textPreview}`, `  - Codes: ${ex.codes}`, "");
    }
  }

  lines.push("## Exit policy", "", "- `no_artifacts_found` → exit 0 (nothing validated).", "- Any **block** → exit 1.", "- Warnings only → exit 0.", "");

  return lines.join("\n");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const extractorInline = runParentReportTextExtractorInlineTests();
  if (!extractorInline.ok) {
    console.error("extractor inline tests failed:", extractorInline.failures);
    process.exit(1);
  }

  const generatedAt = new Date().toISOString();
  const { files, searched } = await collectArtifactFiles();

  if (!files.length) {
    const payload = {
      version: 1,
      generatedAt,
      status: "no_artifacts_found",
      message:
        "No JSON artifacts matched the configured paths/filters. Narrative safety was NOT validated on real outputs.",
      searchedDirectories: searched.map((s) => relative(ROOT, s).replace(/\\/g, "/")),
      artifactFileCount: 0,
      narrativesChecked: 0,
      cleanPassCount: 0,
      infoCautionCount: 0,
      passTotalCount: 0,
      warningCount: 0,
      blockCount: 0,
      missingContextCount: 0,
      artifactResults: [],
      topIssueCodes: [],
      topInfoFindings: [],
      blockedNarrativeIds: [],
      warningNarrativeIds: [],
      exampleBlocks: [],
      exampleWarnings: [],
      exampleInfoCaution: [],
    };
    await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
    await writeFile(OUT_MD, mainSummaryMd(payload), "utf8");
    console.log("parent-report-narrative-safety-artifacts: no_artifacts_found (exit 0)");
    console.log("Searched:", searched.join("; "));
    process.exit(0);
  }

  /** @type {Record<string, number>} */
  const issueAgg = {};
  /** @type {Record<string, number>} */
  const infoFindingAgg = {};
  let narrativesChecked = 0;
  let cleanPassCount = 0;
  let infoCautionCount = 0;
  let warningCount = 0;
  let blockCount = 0;
  let missingContextCount = 0;

  /** @type {string[]} */
  const blockedNarrativeIds = [];
  /** @type {string[]} */
  const warningNarrativeIds = [];

  /** @type {{ id: string, path: string, textPreview: string, codes: string }[]} */
  const exampleBlocks = [];
  /** @type {{ id: string, path: string, textPreview: string, codes: string }[]} */
  const exampleWarnings = [];
  /** @type {{ id: string, path: string, textPreview: string, tags: string }[]} */
  const exampleInfoCaution = [];

  /** @type {object[]} */
  const artifactResults = [];

  for (const absPath of files) {
    const relPath = relative(ROOT, absPath).replace(/\\/g, "/");
    let raw;
    try {
      raw = await readFile(absPath, "utf8");
    } catch {
      artifactResults.push({ file: relPath, ok: false, error: "read_failed" });
      continue;
    }

    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      artifactResults.push({ file: relPath, ok: false, error: "json_parse_failed" });
      continue;
    }

    const source =
      relPath.includes("persona-corpus")
        ? "persona_corpus"
        : relPath.includes("parent-report-review-pack")
          ? "simulator_review_pack"
          : relPath.includes("per-student")
            ? "simulator_per_student_report"
            : "artifact";

    const narratives = extractParentVisibleNarratives(obj, { source: relPath, dedupeText: true });
    const hasDiag = unwrapExistsDiagnostic(obj);

    let blockedInFile = 0;
    let warnedInFile = 0;
    let infoInFile = 0;

    for (const n of narratives) {
      narrativesChecked += 1;
      const engineOutput = deriveEngineSnapshotForGuard(obj, n.path);
      const needsContractContext =
        /\.parentProductContractPreview\./.test(n.path) || /\.contractsV1\.parentProductContractPreview\./.test(n.path);
      if (needsContractContext && !hasDiag) {
        missingContextCount += 1;
      }


      const res = validateParentNarrativeSafety({
        narrativeText: n.text,
        engineOutput,
        reportContext: {
          surface: "artifact",
          subjectId: n.context?.subject,
          source,
        },
        locale: "he",
      });

      for (const iss of res.issues || []) {
        issueAgg[iss.code] = (issueAgg[iss.code] || 0) + 1;
      }

      if (res.status === "pass") {
        if (res.infoCount > 0) {
          infoCautionCount += 1;
          infoInFile += 1;
          for (const tag of res.infoFindings || []) {
            infoFindingAgg[tag] = (infoFindingAgg[tag] || 0) + 1;
          }
          if (exampleInfoCaution.length < 12) {
            exampleInfoCaution.push({
              id: n.id,
              path: n.path,
              textPreview: n.text.slice(0, 140).replace(/\s+/g, " "),
              tags: (res.infoFindings || []).join(","),
            });
          }
        } else {
          cleanPassCount += 1;
        }
      } else if (res.status === "warning") {
        warnedInFile += 1;
        warningCount += 1;
        warningNarrativeIds.push(`${relPath}::${n.id}`);
        if (exampleWarnings.length < 12) {
          exampleWarnings.push({
            id: n.id,
            path: n.path,
            textPreview: n.text.slice(0, 140).replace(/\s+/g, " "),
            codes: (res.issues || []).map((i) => i.code).join(","),
          });
        }
      } else if (res.status === "block") {
        blockedInFile += 1;
        blockCount += 1;
        blockedNarrativeIds.push(`${relPath}::${n.id}`);
        if (exampleBlocks.length < 12) {
          exampleBlocks.push({
            id: n.id,
            path: n.path,
            textPreview: n.text.slice(0, 140).replace(/\s+/g, " "),
            codes: (res.issues || []).map((i) => i.code).join(","),
          });
        }
      }

    }

    artifactResults.push({
      file: relPath,
      ok: true,
      narrativeCount: narratives.length,
      blockedInFile,
      warnedInFile,
      infoInFile,
    });
  }

  const topIssueCodes = Object.entries(issueAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24);

  const topInfoFindings = Object.entries(infoFindingAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24);

  const passTotalCount = cleanPassCount + infoCautionCount;

  const status =
    blockCount > 0 ? "blocked" : warningCount > 0 ? "warnings_only" : narrativesChecked > 0 ? "pass" : "no_narratives_extracted";

  const payload = {
    version: 1,
    generatedAt,
    status,
    searchedDirectories: searched.map((s) => relative(ROOT, s).replace(/\\/g, "/")),
    artifactFileCount: files.length,
    narrativesChecked,
    cleanPassCount,
    infoCautionCount,
    passTotalCount,
    warningCount,
    blockCount,
    missingContextCount,
    artifactResults,
    topIssueCodes,
    topInfoFindings,
    blockedNarrativeIds,
    warningNarrativeIds,
    exampleBlocks,
    exampleWarnings,
    exampleInfoCaution,
  };

  await writeFile(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");
  await writeFile(OUT_MD, mainSummaryMd(payload), "utf8");

  console.log(
    `parent-report-narrative-safety-artifacts: ${status} — files=${files.length} narratives=${narrativesChecked} cleanPass=${cleanPassCount} infoCaution=${infoCautionCount} block=${blockCount} warn=${warningCount}`
  );

  if (blockCount > 0) {
    console.error("FAIL: blocked narratives present — see reports/parent-report-narrative-safety-artifacts/summary.md");
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
