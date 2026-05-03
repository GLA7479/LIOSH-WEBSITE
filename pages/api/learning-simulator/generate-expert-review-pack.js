/**
 * Internal-only: regenerate Expert Review Pack on the server (writes under reports/).
 * Uses artifact-only generation (no diagnostic/parent-report import chain) — see generate-expert-review-pack-artifacts.mjs.
 * Requires ENGINE_REVIEW_ADMIN_TOKEN header match and NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN=true.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** True on Vercel / Lambda — scripts/ under repo root are not deployed to /var/task; skip dynamic imports. */
function isServerlessRuntime() {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL_ENV) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT)
  );
}

function deploymentInfo() {
  const vercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const awsLambda = Boolean(process.env.AWS_EXECUTION_ENV || process.env.LAMBDA_TASK_ROOT);
  const serverless = vercel || awsLambda;
  let kind = "unknown";
  if (serverless) kind = "serverless";
  else if (process.env.NODE_ENV === "development") kind = "local_dev";
  else kind = "long_running";

  return {
    kind,
    filesystemEphemeral: serverless,
    vercel,
    awsLambda,
    nodeEnv: process.env.NODE_ENV || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ code: "method_not_allowed", error: "Method not allowed" });
  }

  if (process.env.NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN !== "true") {
    return res.status(403).json({
      code: "admin_disabled",
      error: "Engine review admin is disabled. Set NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN=true",
    });
  }

  const expected = process.env.ENGINE_REVIEW_ADMIN_TOKEN;
  const headerToken = req.headers["x-engine-review-token"];
  const sent = typeof headerToken === "string" ? headerToken.trim() : "";

  if (!expected || String(expected).trim() === "") {
    return res.status(503).json({
      code: "missing_token",
      error: "ENGINE_REVIEW_ADMIN_TOKEN is not configured on the server",
      message: "ENGINE_REVIEW_ADMIN_TOKEN is not configured on the server",
    });
  }

  if (!sent) {
    return res.status(401).json({
      code: "missing_token",
      error: "Missing x-engine-review-token header",
      message: "Missing x-engine-review-token header",
    });
  }

  if (sent !== expected) {
    return res.status(401).json({
      code: "invalid_token",
      error: "x-engine-review-token does not match server configuration",
      message: "x-engine-review-token does not match server configuration",
    });
  }

  const deployment = deploymentInfo();

  if (isServerlessRuntime()) {
    return res.status(200).json({
      ok: false,
      code: "generation_not_supported_in_serverless",
      message:
        "Remote generation is not supported on this deployment. Use CLI/CI to create a durable Expert Review Pack. Run npm run qa:learning-simulator:expert-review-pack locally or in CI.",
      cliFallback: "npm run qa:learning-simulator:expert-review-pack",
      deployment,
    });
  }

  try {
    const artifactScript = join(process.cwd(), "scripts/learning-simulator/generate-expert-review-pack-artifacts.mjs");
    const packUrl = pathToFileURL(artifactScript).href;
    const mod = await import(/* webpackIgnore: true */ packUrl);
    if (typeof mod.generateExpertReviewPackFromArtifacts !== "function") {
      return res.status(500).json({
        ok: false,
        code: "generation_failed",
        message:
          "Generation module is unavailable on this server. Run npm run qa:learning-simulator:expert-review-pack locally or in CI.",
        cliFallback: "npm run qa:learning-simulator:expert-review-pack",
      });
    }
    const out = await mod.generateExpertReviewPackFromArtifacts(process.cwd());
    const persistenceWarning = deployment.filesystemEphemeral;

    return res.status(200).json({
      ok: true,
      code: "ok",
      generationMode: out.manifest?.generationMode || "artifact_snapshot_v1",
      generatedAt: out.manifest?.generatedAt,
      scenarioCount: out.manifest?.scenarioCount,
      requiresHumanExpertReview: out.manifest?.requiresHumanExpertReview !== false,
      outDir: out.outDir,
      deployment,
      persistenceWarning,
      persistenceMessage: persistenceWarning
        ? "Generation ran on this server instance. On serverless hosts (e.g. Vercel) the filesystem is typically ephemeral — artifacts may not persist between invocations. Use local CLI or a durable runner for a lasting pack."
        : "Artifacts were written under reports/ on this server filesystem.",
      cliFallback:
        "For the full expert review pack (complete professionalEngineV1 + aggregates), run: npm run qa:learning-simulator:expert-review-pack",
    });
  } catch (e) {
    const msg = String(e?.message || e);
    const isAssert = msg.includes("Expert review pack (artifact mode) QA failed:");
    if (isAssert) {
      return res.status(422).json({
        ok: false,
        code: "validation_artifact_not_ready",
        error: msg,
        message: msg.replace(/^Error:\s*/, ""),
        cliFallback: "Run npm run qa:learning-simulator:professional-engine (PASS), then retry or run npm run qa:learning-simulator:expert-review-pack locally.",
      });
    }
    return res.status(500).json({
      ok: false,
      code: "generation_failed",
      message:
        "Generation failed on the server. Run npm run qa:learning-simulator:expert-review-pack locally or in CI for a reliable pack.",
      cliFallback: "npm run qa:learning-simulator:expert-review-pack",
    });
  }
}
