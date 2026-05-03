import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Layout from "../../../components/Layout";

const TOKEN_SESSION_KEY = "engine_review_admin_token_v1";
const COPY_EXPERT = "npm run qa:learning-simulator:expert-review-pack";
const COPY_CLOSURE = `npm run qa:learning-simulator:engine-final
npm run qa:learning-simulator:release
npm run build`;

export async function getServerSideProps() {
  if (process.env.NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN !== "true") {
    return { notFound: true };
  }

  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");

  const readJson = async (p) => {
    try {
      return JSON.parse(await readFile(p, "utf8"));
    } catch {
      return null;
    }
  };

  const base = join(process.cwd(), "reports/learning-simulator/engine-professionalization");
  const manifest = await readJson(join(base, "expert-review-pack/manifest.json"));
  const engineFinal = await readJson(join(base, "engine-final-summary.json"));
  const profVal = await readJson(join(base, "professional-engine-validation.json"));

  return {
    props: {
      packMeta: manifest,
      engineFinal,
      profVal,
      hasPack: Boolean(manifest?.generatedAt),
      ssrDeployment: {
        nodeEnv: process.env.NODE_ENV || null,
        vercel: Boolean(process.env.VERCEL || process.env.VERCEL_ENV),
      },
    },
  };
}

export default function EngineExpertReviewAdminPage({ packMeta: initialPack, engineFinal: initialFinal, profVal: initialProf, hasPack: initialHasPack, ssrDeployment }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [packMeta, setPackMeta] = useState(initialPack);
  const [engineFinal, setEngineFinal] = useState(initialFinal);
  const [profVal, setProfVal] = useState(initialProf);
  const [hasPack, setHasPack] = useState(initialHasPack);
  const [deployment, setDeployment] = useState(null);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(TOKEN_SESSION_KEY);
      if (s) setToken(s);
    } catch {
      /* sessionStorage unavailable */
    }
  }, []);

  useEffect(() => {
    try {
      if (token) sessionStorage.setItem(TOKEN_SESSION_KEY, token);
    } catch {
      /* ignore */
    }
  }, [token]);

  const applyStatusPayload = useCallback((data) => {
    if (data?.deployment) setDeployment(data.deployment);
    setPackMeta(data?.packMeta ?? null);
    setEngineFinal(data?.engineFinal ?? null);
    setProfVal(data?.profVal ?? null);
    setHasPack(Boolean(data?.packMeta?.generatedAt));
  }, []);

  const fetchStatus = useCallback(async () => {
    setRefreshBusy(true);
    try {
      const res = await fetch("/api/learning-simulator/engine-review-pack-status");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      applyStatusPayload(data);
    } catch {
      /* keep existing SSR/client state */
    } finally {
      setRefreshBusy(false);
    }
  }, [applyStatusPayload]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleGenerate = async () => {
    setBusy(true);
    setGenResult(null);
    try {
      const res = await fetch("/api/learning-simulator/generate-expert-review-pack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-engine-review-token": token,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (data.deployment) setDeployment(data.deployment);

      if (!res.ok) {
        setGenResult({
          level: "error",
          code: data.code || "error",
          text: data.error || `HTTP ${res.status}`,
        });
        return;
      }

      setGenResult({
        level: data.persistenceWarning ? "warning" : "success",
        code: data.code || "ok",
        text: data.persistenceMessage || "Generation completed on this server instance.",
        scenarioCount: data.scenarioCount,
        generatedAt: data.generatedAt,
        requiresHumanExpertReview: data.requiresHumanExpertReview,
        persistenceWarning: data.persistenceWarning,
      });
      await fetchStatus();
    } catch (e) {
      setGenResult({ level: "error", code: "generation_failed", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = (t) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(t);
    }
  };

  const repoRelativeIndex = "reports/learning-simulator/engine-professionalization/expert-review-pack/index.md";

  let depLabel = "unknown";
  if (deployment?.kind) depLabel = deployment.kind;
  else if (ssrDeployment?.vercel) depLabel = "serverless (Vercel env at SSR)";
  else if (ssrDeployment?.nodeEnv) depLabel = ssrDeployment.nodeEnv;

  const ephemeral =
    deployment?.filesystemEphemeral != null ? deployment.filesystemEphemeral : Boolean(ssrDeployment?.vercel);

  return (
    <Layout>
      <Head>
        <title>Engine Expert Review Pack (internal)</title>
      </Head>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          <Link href="/learning/dev-student-simulator">← Dev tools</Link>
        </p>
        <h1 style={{ fontSize: 22 }}>Professional engine — Expert Review Pack</h1>
        <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
          Internal educational diagnostic support only. Not parent-facing. Not a clinical assessment. This page is shown when{" "}
          <code>NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN=true</code> (any environment, including production).
        </p>

        <section style={{ marginTop: 20, padding: 14, background: "#ecfeff", borderRadius: 8, border: "1px solid #67e8f9", fontSize: 13, lineHeight: 1.6 }}>
          <strong>Remote / Vercel env</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
            <li>
              <code>NEXT_PUBLIC_ENABLE_ENGINE_REVIEW_ADMIN=true</code> — enables this page and APIs (build-time public).
            </li>
            <li>
              <code>ENGINE_REVIEW_ADMIN_TOKEN=&lt;secret&gt;</code> — server only; never embedded in the client bundle. Enter the same value below for each session (stored in <strong>sessionStorage</strong> only).
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 20, padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Runtime / filesystem</h2>
          <ul style={{ fontSize: 14, lineHeight: 1.7 }}>
            <li>
              <strong>Deployment (best-effort):</strong> {depLabel}
            </li>
            <li>
              <strong>Filesystem ephemeral risk:</strong> {ephemeral ? "yes — serverless-style host; writes may not persist" : "lower — typical long-running or local Node"}
            </li>
            <li>
              <strong>Last known artifact path:</strong>{" "}
              <code style={{ fontSize: 12 }}>{repoRelativeIndex}</code>
            </li>
          </ul>
        </section>

        <section style={{ marginTop: 24, padding: 16, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Gate status</h2>
            <button
              type="button"
              onClick={fetchStatus}
              disabled={refreshBusy}
              style={{ padding: "8px 14px", fontSize: 13, cursor: refreshBusy ? "wait" : "pointer" }}
            >
              {refreshBusy ? "Refreshing…" : "Refresh status"}
            </button>
          </div>
          <ul style={{ fontSize: 14, lineHeight: 1.7 }}>
            <li>
              <strong>Engine final:</strong> {engineFinal?.engineFinalStatus ?? "not generated yet"}
              {engineFinal?.generatedAt ? ` (${new Date(engineFinal.generatedAt).toLocaleString()})` : ""}
            </li>
            <li>
              <strong>Professional validation:</strong> {profVal?.status ?? "not generated yet"}{" "}
              {profVal?.scenarioCount != null ? `(${profVal.scenarioCount} scenarios)` : ""}
            </li>
            <li>
              <strong>requiresHumanExpertReview:</strong> {packMeta?.requiresHumanExpertReview !== false ? "true" : "false"} (automation ≠ educator sign-off)
            </li>
            <li>
              <strong>Expert pack:</strong>{" "}
              {hasPack && packMeta?.generatedAt
                ? `${packMeta.scenarioCount ?? "?"} scenarios — ${new Date(packMeta.generatedAt).toLocaleString()}`
                : "not generated yet"}
            </li>
          </ul>
          {engineFinal?.knownLimitations?.length ? (
            <div style={{ marginTop: 12 }}>
              <strong>Known limitations</strong>
              <ul>
                {engineFinal.knownLimitations.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16 }}>Copy commands (CLI source of truth)</h2>
          <label style={{ fontSize: 13, color: "#64748b" }}>Expert review pack</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "flex-start" }}>
            <textarea readOnly rows={2} style={{ flex: 1, fontSize: 13, fontFamily: "monospace", padding: 8 }} value={COPY_EXPERT} />
            <button type="button" onClick={() => copyToClipboard(COPY_EXPERT)} style={{ padding: "8px 12px", fontSize: 13 }}>
              Copy
            </button>
          </div>
          <label style={{ fontSize: 13, color: "#64748b", display: "block", marginTop: 14 }}>Full closure (when you need release + build)</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "flex-start" }}>
            <textarea readOnly rows={4} style={{ flex: 1, fontSize: 13, fontFamily: "monospace", padding: 8 }} value={COPY_CLOSURE} />
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  "npm run qa:learning-simulator:engine-final && npm run qa:learning-simulator:release && npm run build"
                )
              }
              style={{ padding: "8px 12px", fontSize: 13 }}
            >
              Copy (one line)
            </button>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 10 }}>
            Requires prior <code>npm run qa:learning-simulator:professional-engine</code> (PASS) before generating the pack.
          </p>
        </section>

        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16 }}>Generate on server</h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            Enter the same secret as <code>ENGINE_REVIEW_ADMIN_TOKEN</code> on the server. Stored in <strong>sessionStorage</strong> for this browser tab only (not localStorage).
          </p>
          <label style={{ display: "block", marginTop: 12, fontSize: 14 }}>
            Admin token
            <input
              type="password"
              autoComplete="off"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={busy}
              style={{ display: "block", width: "100%", marginTop: 6, padding: 10, fontSize: 14, boxSizing: "border-box" }}
            />
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy}
            style={{ marginTop: 12, padding: "10px 16px", fontSize: 14, cursor: busy ? "wait" : "pointer" }}
          >
            {busy ? "Generating…" : "Generate Expert Review Pack"}
          </button>
          {genResult ? (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 6,
                fontSize: 14,
                background: genResult.level === "error" ? "#fef2f2" : genResult.level === "warning" ? "#fffbeb" : "#f0fdf4",
                border: `1px solid ${genResult.level === "error" ? "#fecaca" : genResult.level === "warning" ? "#fcd34d" : "#86efac"}`,
              }}
            >
              <div>
                <strong>Result:</strong> {genResult.code}{" "}
                {genResult.level === "success"
                  ? "— generated successfully"
                  : genResult.level === "warning"
                    ? "— generated; persistence may be ephemeral on this host"
                    : genResult.level === "error"
                      ? "— failed"
                      : ""}
              </div>
              {genResult.text ? <p style={{ margin: "8px 0 0" }}>{genResult.text}</p> : null}
              {genResult.scenarioCount != null ? (
                <p style={{ margin: "8px 0 0" }}>
                  <strong>scenarioCount:</strong> {genResult.scenarioCount}
                </p>
              ) : null}
              {genResult.generatedAt ? (
                <p style={{ margin: "4px 0 0" }}>
                  <strong>generatedAt:</strong> {genResult.generatedAt}
                </p>
              ) : null}
              {genResult.requiresHumanExpertReview != null ? (
                <p style={{ margin: "4px 0 0" }}>
                  <strong>requiresHumanExpertReview:</strong> {String(genResult.requiresHumanExpertReview)}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16 }}>Open review pack files</h2>
          <p style={{ fontSize: 14 }}>
            Artifacts are written under the repo / deploy workspace (not public URLs). On remote serverless, they may not survive the next cold start — use CLI from a machine with a persistent checkout when you need a stable copy.
          </p>
          <code style={{ display: "block", padding: 12, background: "#0f172a", color: "#e2e8f0", borderRadius: 6, fontSize: 13 }}>
            {repoRelativeIndex}
          </code>
        </section>
      </main>
    </Layout>
  );
}
