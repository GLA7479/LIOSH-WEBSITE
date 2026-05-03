/**
 * Internal-only: regenerate Expert Review Pack on the server (writes under reports/).
 * Requires ENGINE_REVIEW_ADMIN_TOKEN header match and NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN=true.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";

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
    });
  }

  if (!sent) {
    return res.status(401).json({
      code: "missing_token",
      error: "Missing x-engine-review-token header",
    });
  }

  if (sent !== expected) {
    return res.status(401).json({
      code: "invalid_token",
      error: "x-engine-review-token does not match server configuration",
    });
  }

  const deployment = deploymentInfo();

  try {
    const packUrl = pathToFileURL(join(process.cwd(), "scripts/learning-simulator/run-engine-expert-review-pack.mjs")).href;
    const mod = await import(/* webpackIgnore: true */ packUrl);
    if (typeof mod.generateExpertReviewPack !== "function") {
      return res.status(500).json({
        code: "generation_failed",
        error: "generateExpertReviewPack export missing",
      });
    }
    const out = await mod.generateExpertReviewPack(process.cwd());
    const persistenceWarning = deployment.filesystemEphemeral;

    return res.status(200).json({
      ok: true,
      code: "ok",
      generatedAt: out.manifest?.generatedAt,
      scenarioCount: out.manifest?.scenarioCount,
      requiresHumanExpertReview: out.manifest?.requiresHumanExpertReview !== false,
      outDir: out.outDir,
      deployment,
      persistenceWarning,
      persistenceMessage: persistenceWarning
        ? "Generation ran on this server instance. On serverless hosts (e.g. Vercel) the filesystem is typically ephemeral — artifacts may not persist between invocations. Use local CLI or a durable runner for a lasting pack."
        : "Artifacts were written under reports/ on this server filesystem.",
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      code: "generation_failed",
      error: String(e?.message || e),
    });
  }
}
