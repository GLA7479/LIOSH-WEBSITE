/**
 * Internal-only: read expert-review / engine gate JSON artifacts from disk (no token).
 * Gate: NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN=true only.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ code: "method_not_allowed", error: "Method not allowed" });
  }
  if (process.env.NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN !== "true") {
    return res.status(403).json({ code: "admin_disabled", error: "NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN is not true" });
  }

  const base = join(process.cwd(), "reports/learning-simulator/engine-professionalization");
  const readJson = async (rel) => {
    try {
      return JSON.parse(await readFile(join(base, rel), "utf8"));
    } catch {
      return null;
    }
  };

  const packMeta = await readJson("expert-review-pack/manifest.json");
  const engineFinal = await readJson("engine-final-summary.json");
  const profVal = await readJson("professional-engine-validation.json");

  return res.status(200).json({
    ok: true,
    code: "ok",
    deployment: deploymentInfo(),
    artifactBaseRelative: "reports/learning-simulator/engine-professionalization",
    expertReviewIndexRelative: "reports/learning-simulator/engine-professionalization/expert-review-pack/index.md",
    packMeta,
    engineFinal,
    profVal,
    hasPack: Boolean(packMeta?.generatedAt),
  });
}
