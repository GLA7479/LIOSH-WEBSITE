import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  DEV_STUDENT_PRESETS,
  STORAGE_KEYS,
  PRODUCT_DISPLAY_NAME,
  INTERNAL_STORAGE_NAMESPACE,
  buildSimulatorCoreFromPreset,
  exportSimulatorPackage,
  serializeSimulatorPackage,
  parseSimulatorPackage,
  buildBackupEnvelope,
} from "../../utils/dev-student-simulator/index.js";
import {
  readRawStorageMapForKeys,
  applyMetadataThenSnapshot,
  deriveEffectiveTouchedKeysFromSnapshot,
  validateSnapshotForApply,
  resetSimulatedStudentFromMetadata,
  readCurrentSimulatorExportFromLocalStorage,
  stringifyForLocalStorage,
} from "../../utils/dev-student-simulator/browser-storage.js";
import { SIMULATOR_METADATA_KEY } from "../../utils/dev-student-simulator/metadata.js";

const box = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: 12,
  marginBottom: 12,
  background: "#f8fafc",
};
const label = { fontWeight: 600, fontSize: 13, marginBottom: 6, color: "#0f172a" };
const mono = { fontFamily: "ui-monospace, monospace", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" };
const btn = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #64748b",
  background: "#fff",
  cursor: "pointer",
  marginRight: 8,
  marginBottom: 8,
  fontSize: 14,
};
const danger = { ...btn, borderColor: "#b91c1c", color: "#b91c1c" };
const primary = { ...btn, background: "#1d4ed8", color: "#fff", borderColor: "#1d4ed8" };

export default function DevStudentSimulatorClient() {
  const [presetId, setPresetId] = useState(DEV_STUDENT_PRESETS[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const preset = useMemo(() => DEV_STUDENT_PRESETS.find((p) => p.id === presetId) || null, [presetId]);

  const showMsg = useCallback((m) => {
    setMessage(m);
    setError("");
  }, []);

  const showErr = useCallback((m) => {
    setError(m);
    setMessage("");
  }, []);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await fetch("/api/dev-student-simulator/logout", { method: "POST", credentials: "same-origin" });
      window.location.reload();
    } catch (e) {
      showErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const existingWide = readRawStorageMapForKeys([...STORAGE_KEYS]);
      const built = buildSimulatorCoreFromPreset({
        presetId,
        anchorEndMs: Date.now(),
        existingStorageMap: existingWide,
      });
      const effectiveTouchedKeys = deriveEffectiveTouchedKeysFromSnapshot(built.snapshot);
      const touchedCurrent = readRawStorageMapForKeys(effectiveTouchedKeys);
      const backupByKey = buildBackupEnvelope(effectiveTouchedKeys, touchedCurrent);
      const metadata = {
        ...built.metadata,
        effectiveTouchedKeys,
        touchedKeys: effectiveTouchedKeys,
        backupByKey,
      };
      setPreview({
        ...built,
        touchedKeys: effectiveTouchedKeys,
        metadata,
        applySource: "preset",
        stagedPresetId: presetId,
      });
      showMsg("Preview generated (not applied). Apply will use this exact snapshot and backup.");
    } catch (e) {
      setPreview(null);
      showErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const canApplyStagedPreset =
    Boolean(presetId) &&
    preview?.applySource === "preset" &&
    preview.stagedPresetId === presetId;

  const handleApply = () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!preview) {
        showErr("Generate preview first.");
        return;
      }
      if (preview.applySource === "import") {
        showErr("Apply is only for a preset preview. Import has already written to storage.");
        return;
      }
      if (preview.stagedPresetId !== presetId) {
        showErr("The selected preset does not match the preview. Generate preview again before Apply.");
        return;
      }
      const ar = applyMetadataThenSnapshot({
        metadata: preview.metadata,
        snapshot: preview.snapshot,
        allowedKeys: STORAGE_KEYS,
      });
      if (!ar.ok) {
        if (ar.phase === "validate") {
          showErr(`Apply blocked at ${ar.key}: ${ar.error || "validation"}`);
        } else if (ar.phase === "metadata") {
          showErr(`Metadata write failed: ${ar.reason}. No snapshot keys were changed.`);
        } else if (ar.phase === "snapshot") {
          showErr(
            `Snapshot write stopped at ${ar.key} (${ar.error || "unknown"}). Backup metadata is already saved — use Reset to restore prior values.`
          );
        } else {
          showErr("Apply failed.");
        }
        return;
      }
      showMsg("Applied to this browser using the previewed package (metadata written before snapshot).");
    } catch (e) {
      showErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = resetSimulatedStudentFromMetadata();
      if (!r.ok) {
        showErr(`Reset skipped: ${r.reason}`);
        setBusy(false);
        return;
      }
      setPreview(null);
      showMsg("Restored prior values (or removed keys) per simulator backup. Metadata cleared.");
    } catch (e) {
      showErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleExport = () => {
    setBusy(true);
    try {
      const cur = readCurrentSimulatorExportFromLocalStorage();
      if (!cur) {
        showErr("No simulator metadata — export only works after Apply or Import.");
        setBusy(false);
        return;
      }
      const pkg = exportSimulatorPackage({
        presetId: cur.metadata.presetId,
        snapshot: cur.snapshot,
        metadata: cur.metadata,
      });
      const blob = new Blob([serializeSimulatorPackage(pkg)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dev-student-simulator-${String(cur.metadata.presetId || "export")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMsg("Download started.");
    } catch (e) {
      showErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleImportFile = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const pkg = parseSimulatorPackage(text);
        const snapshot = pkg.snapshot;
        if (!snapshot || typeof snapshot !== "object") throw new Error("Package missing snapshot");
        const v0 = validateSnapshotForApply(snapshot, STORAGE_KEYS);
        if (!v0.ok) throw new Error(`Import blocked at ${v0.key}: ${v0.code}`);
        const effectiveTouchedKeys = deriveEffectiveTouchedKeysFromSnapshot(snapshot);
        const existing = readRawStorageMapForKeys(effectiveTouchedKeys);
        const backupByKey = buildBackupEnvelope(effectiveTouchedKeys, existing);
        const importedTouchedKeysOriginal = Array.isArray(pkg.metadata?.touchedKeys)
          ? [...pkg.metadata.touchedKeys]
          : undefined;
        const meta = {
          ...pkg.metadata,
          effectiveTouchedKeys,
          touchedKeys: effectiveTouchedKeys,
          ...(importedTouchedKeysOriginal != null ? { importedTouchedKeysOriginal } : {}),
          backupByKey,
          generatedAt: new Date().toISOString(),
        };
        const ar = applyMetadataThenSnapshot({
          metadata: meta,
          snapshot,
          allowedKeys: STORAGE_KEYS,
        });
        if (!ar.ok) {
          if (ar.phase === "validate") throw new Error(`Import blocked at ${ar.key}: ${ar.error}`);
          if (ar.phase === "metadata") throw new Error(`Metadata write failed: ${ar.reason}`);
          if (ar.phase === "snapshot") {
            throw new Error(
              `Snapshot write stopped at ${ar.key} (${ar.error || "unknown"}). Metadata is saved — use Reset to restore prior values.`
            );
          }
          throw new Error("Import apply failed.");
        }
        setPreview({
          preset: DEV_STUDENT_PRESETS.find((p) => p.id === pkg.metadata?.presetId) || null,
          snapshot,
          touchedKeys: effectiveTouchedKeys,
          metadata: meta,
          validation: { sessions: { ok: true }, namespace: { ok: true } },
          applySource: "import",
          stagedPresetId: null,
        });
        showMsg("Imported package applied; current browser values backed up in metadata.");
      } catch (e) {
        showErr(String(e?.message || e));
      } finally {
        setBusy(false);
        ev.target.value = "";
      }
    };
    reader.onerror = () => {
      showErr("File read failed");
      setBusy(false);
      ev.target.value = "";
    };
    reader.readAsText(file, "utf8");
  };

  const handleCopySnapshot = async () => {
    setBusy(true);
    try {
      const cur = readCurrentSimulatorExportFromLocalStorage();
      if (!cur) {
        showErr("Nothing to copy — apply or import first.");
        return;
      }
      const pkg = exportSimulatorPackage({
        presetId: cur.metadata.presetId,
        snapshot: cur.snapshot,
        metadata: cur.metadata,
      });
      await navigator.clipboard.writeText(serializeSimulatorPackage(pkg));
      showMsg("Package JSON copied to clipboard.");
    } catch (e) {
      showErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Dev Student Simulator</h1>
        <button type="button" style={btn} onClick={handleLogout} disabled={busy}>
          Log out
        </button>
      </div>
      <p style={{ color: "#475569", fontSize: 14, marginTop: 0 }}>
        {PRODUCT_DISPLAY_NAME} · internal storage namespace <code>{INTERNAL_STORAGE_NAMESPACE}</code>
      </p>

      {message ? (
        <div style={{ ...box, background: "#ecfdf5", borderColor: "#6ee7b7", color: "#065f46" }}>{message}</div>
      ) : null}
      {error ? (
        <div style={{ ...box, background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}>{error}</div>
      ) : null}

      <div style={box}>
        <div style={label}>Preset</div>
        <select
          value={presetId}
          onChange={(e) => setPresetId(e.target.value)}
          disabled={busy}
          style={{ width: "100%", maxWidth: 480, padding: 8, fontSize: 14 }}
        >
          {DEV_STUDENT_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.studentName} ({p.id})
            </option>
          ))}
        </select>
        {preset ? (
          <p style={{ fontSize: 13, color: "#475569", marginTop: 8 }}>
            {preset.spanDays} days · {preset.targetSessions} sessions · ~{preset.targetQuestions} questions · pattern:{" "}
            {preset.trendPattern}
          </p>
        ) : null}
      </div>

      <div style={box}>
        <div style={label}>Actions</div>
        <button type="button" style={btn} onClick={handlePreview} disabled={busy || !presetId}>
          Generate preview
        </button>
        <button
          type="button"
          style={primary}
          onClick={handleApply}
          disabled={busy || !canApplyStagedPreset}
          title={
            canApplyStagedPreset
              ? undefined
              : "Generate preview for the selected preset first (preview must match current preset)."
          }
        >
          Apply to current browser
        </button>
        <button type="button" style={danger} onClick={handleReset} disabled={busy}>
          Reset simulated student
        </button>
        <button type="button" style={btn} onClick={handleExport} disabled={busy}>
          Export JSON
        </button>
        <label style={{ ...btn, display: "inline-block" }}>
          Import JSON
          <input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={handleImportFile} disabled={busy} />
        </label>
        <button type="button" style={btn} onClick={handleCopySnapshot} disabled={busy}>
          Copy storage snapshot
        </button>
      </div>

      <div style={box}>
        <div style={label}>Open real reports (this tab)</div>
        <Link href="/learning/parent-report" legacyBehavior>
          <a style={{ marginRight: 16 }}>Short parent report</a>
        </Link>
        <Link href="/learning/parent-report-detailed" legacyBehavior>
          <a style={{ marginRight: 16 }}>Detailed parent report</a>
        </Link>
        <Link href="/learning/parent-report-detailed?mode=summary" legacyBehavior>
          <a>Detailed (summary mode)</a>
        </Link>
      </div>

      {preview ? (
        <>
          <div style={box}>
            <div style={label}>Validation (sessions)</div>
            <pre style={mono}>{JSON.stringify(preview.validation?.sessions, null, 2)}</pre>
          </div>
          <div style={box}>
            <div style={label}>Validation (namespace)</div>
            <pre style={mono}>{JSON.stringify(preview.validation?.namespace, null, 2)}</pre>
          </div>
          <div style={box}>
            <div style={label}>touchedKeys ({preview.touchedKeys?.length || 0})</div>
            <pre style={mono}>{JSON.stringify(preview.touchedKeys, null, 2)}</pre>
          </div>
          <div style={box}>
            <div style={label}>backup/metadata preview ({SIMULATOR_METADATA_KEY})</div>
            <pre style={mono}>{JSON.stringify(preview.metadata, null, 2)}</pre>
          </div>
          <div style={box}>
            <div style={label}>Storage preview (keys only + value type / size)</div>
            <pre style={mono}>
              {JSON.stringify(
                Object.fromEntries(
                  Object.entries(preview.snapshot || {}).map(([k, v]) => {
                    const s = stringifyForLocalStorage(v);
                    return [k, { type: typeof v, bytes: s.length }];
                  })
                ),
                null,
                2
              )}
            </pre>
          </div>
        </>
      ) : (
        <div style={{ ...box, color: "#64748b" }}>Generate a preview to see validation, touchedKeys, metadata, and storage shape.</div>
      )}
    </div>
  );
}
