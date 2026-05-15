import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * Route-aware screen orientation for the LEOK Capacitor shell only.
 * `Capacitor.isNativePlatform()` is false in browser/PWA — no runtime effect there.
 */
const LANDSCAPE_MLEO_GAME =
  /^\/mleo-(runner|flyer|catcher|puzzle|memory|penalty)(\/|$)/i;

function pathFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  try {
    if (url.startsWith("/")) return url.split("?")[0] || "";
    const u = new URL(url);
    return (u.pathname || "").split("?")[0] || "";
  } catch {
    return url.split("?")[0] || "";
  }
}

/** Temporary diagnostics: `?debugOrientation=1` or `localStorage.debugOrientation=1` */
function readDebugOrientationFlag() {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("debugOrientation") === "1") return true;
  } catch {
    /* ignore */
  }
  try {
    return (
      new URLSearchParams(window.location.search).get("debugOrientation") ===
      "1"
    );
  } catch {
    return false;
  }
}

function pathnameOnlyFromPathOrUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return "";
  return pathOrUrl.startsWith?.("http")
    ? pathFromUrl(pathOrUrl)
    : pathOrUrl.split("?")[0] || "";
}

export default function CapacitorOrientationBridge() {
  const router = useRouter();
  const [debugSnap, setDebugSnap] = useState(null);
  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    setDebugEnabled(readDebugOrientationFlag());
  }, [router.asPath]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const onRoute = () => setDebugEnabled(readDebugOrientationFlag());
    router.events.on("routeChangeComplete", onRoute);
    return () => router.events.off("routeChangeComplete", onRoute);
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined" || !debugEnabled) return undefined;

    const refreshDims = () => {
      setDebugSnap((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          mqPortrait: window.matchMedia("(orientation: portrait)").matches,
          mqLandscape: window.matchMedia("(orientation: landscape)").matches,
          screenOrientationType:
            typeof screen !== "undefined" && screen.orientation?.type
              ? screen.orientation.type
              : "(none)",
        };
      });
    };

    window.addEventListener("resize", refreshDims);
    window.addEventListener("orientationchange", refreshDims);
    return () => {
      window.removeEventListener("resize", refreshDims);
      window.removeEventListener("orientationchange", refreshDims);
    };
  }, [debugEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!router.isReady) return undefined;

    let cancelled = false;
    let detach = () => {};

    const emitDebug = (partial) => {
      if (!readDebugOrientationFlag()) return;
      const base = {
        currentPath: router.asPath || router.pathname || "",
        pathnameOnly: pathnameOnlyFromPathOrUrl(
          router.asPath || router.pathname || ""
        ),
        windowCapacitorExists: typeof window.Capacitor !== "undefined",
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        mqPortrait: window.matchMedia("(orientation: portrait)").matches,
        mqLandscape: window.matchMedia("(orientation: landscape)").matches,
        screenOrientationType:
          typeof screen !== "undefined" && screen.orientation?.type
            ? screen.orientation.type
            : "(none)",
        updatedAt: new Date().toISOString(),
        ...partial,
      };
      console.info("[debugOrientation]", base);
      setDebugSnap(base);
    };

    const setup = async () => {
      let Capacitor;
      try {
        ({ Capacitor } = await import("@capacitor/core"));
      } catch (e) {
        if (!cancelled && readDebugOrientationFlag()) {
          emitDebug({
            isNativePlatform: false,
            platform: "n/a",
            matchesMleoStar: false,
            matchesLockRegex: false,
            lastAction: "import @capacitor/core",
            lastResult: "error",
            lastError: e?.message || String(e),
          });
        }
        return;
      }

      if (cancelled) return;

      const doApply = async (pathOrUrl) => {
        const path = pathnameOnlyFromPathOrUrl(
          typeof pathOrUrl === "string" && pathOrUrl.length
            ? pathOrUrl
            : router.asPath || router.pathname || ""
        );
        const debug = readDebugOrientationFlag();
        const lockLandscape = LANDSCAPE_MLEO_GAME.test(path);
        const matchesMleoStar = /^\/mleo-/i.test(path);

        const capWin = typeof window.Capacitor !== "undefined";
        let native = false;
        let platform = "n/a";
        try {
          native = Capacitor.isNativePlatform();
          platform =
            typeof Capacitor.getPlatform === "function"
              ? Capacitor.getPlatform()
              : "n/a";
        } catch (e) {
          if (debug) {
            emitDebug({
              windowCapacitorExists: capWin,
              isNativePlatform: false,
              platform: "n/a",
              matchesMleoStar,
              matchesLockRegex: lockLandscape,
              lastAction: "Capacitor.isNativePlatform()",
              lastResult: "error",
              lastError: e?.message || String(e),
            });
          }
          return;
        }

        if (!native) {
          if (debug) {
            emitDebug({
              windowCapacitorExists: capWin,
              isNativePlatform: false,
              platform,
              matchesMleoStar,
              matchesLockRegex: lockLandscape,
              lastAction: "none (not native)",
              lastResult: "noop",
              lastError: "",
            });
          }
          return;
        }

        const { ScreenOrientation } = await import(
          "@capacitor/screen-orientation"
        );
        const lastAction = lockLandscape ? "lock landscape" : "unlock";
        let lastResult = "success";
        let lastError = "";
        try {
          if (lockLandscape) {
            await ScreenOrientation.lock({ orientation: "landscape" });
          } else {
            await ScreenOrientation.unlock();
          }
        } catch (e) {
          lastResult = "error";
          lastError = e?.message || String(e);
        }

        if (debug) {
          emitDebug({
            windowCapacitorExists: capWin,
            isNativePlatform: true,
            platform,
            matchesMleoStar,
            matchesLockRegex: lockLandscape,
            lastAction,
            lastResult,
            lastError,
          });
        }
      };

      await doApply(router.asPath || router.pathname || "");

      const onComplete = (url) => {
        void doApply(
          typeof url === "string" ? url : router.asPath || router.pathname || ""
        );
      };
      router.events.on("routeChangeComplete", onComplete);
      detach = () => router.events.off("routeChangeComplete", onComplete);
    };

    void setup();

    return () => {
      cancelled = true;
      void Promise.resolve().then(() => detach());
    };
  }, [router, router.asPath, router.isReady]);

  if (!debugEnabled) {
    return null;
  }

  const boxStyle = {
    position: "fixed",
    left: 6,
    bottom: 6,
    zIndex: 2147483646,
    maxWidth: "min(96vw, 420px)",
    maxHeight: "45vh",
    overflow: "auto",
    padding: "8px 10px",
    fontFamily: "ui-monospace, monospace",
    fontSize: 11,
    lineHeight: 1.35,
    color: "#b6ffb6",
    background: "rgba(0,0,0,0.88)",
    border: "1px solid #2a6",
    borderRadius: 6,
    boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
    pointerEvents: "none",
    textAlign: "left",
    direction: "ltr",
  };

  const row = (k, v) => (
    <div key={k}>
      <strong style={{ color: "#8f8" }}>{k}:</strong>{" "}
      <span style={{ wordBreak: "break-all" }}>{String(v)}</span>
    </div>
  );

  return (
    <div style={boxStyle} aria-hidden="true">
      <div style={{ fontWeight: 700, marginBottom: 6, color: "#9f6" }}>
        debugOrientation (temporary)
      </div>
      {!debugSnap ? (
        <div>Waiting for bridge…</div>
      ) : (
        <>
          {row("currentPath", debugSnap.currentPath)}
          {row("window.Capacitor exists", debugSnap.windowCapacitorExists)}
          {row("Capacitor.isNativePlatform()", debugSnap.isNativePlatform)}
          {row("platform", debugSnap.platform)}
          {row("route matches /mleo-*", debugSnap.matchesMleoStar)}
          {row("route matches lock regex", debugSnap.matchesLockRegex)}
          {row("last attempted action", debugSnap.lastAction)}
          {row("result", debugSnap.lastResult)}
          {row("error", debugSnap.lastError || "—")}
          {row("innerWidth", debugSnap.innerWidth)}
          {row("innerHeight", debugSnap.innerHeight)}
          {row('matchMedia("(orientation: portrait)")', debugSnap.mqPortrait)}
          {row('matchMedia("(orientation: landscape)")', debugSnap.mqLandscape)}
          {row("screen.orientation?.type", debugSnap.screenOrientationType)}
          {row("last update (ISO)", debugSnap.updatedAt)}
        </>
      )}
    </div>
  );
}

```
