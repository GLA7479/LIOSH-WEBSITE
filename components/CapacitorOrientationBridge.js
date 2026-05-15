import { useEffect } from "react";
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

export default function CapacitorOrientationBridge() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let cancelled = false;
    let detach = () => {};

    const setup = async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (cancelled || !Capacitor.isNativePlatform()) return;

      const { ScreenOrientation } = await import(
        "@capacitor/screen-orientation"
      );

      const apply = async (pathOrUrl) => {
        const path = pathOrUrl.startsWith?.("http")
          ? pathFromUrl(pathOrUrl)
          : (pathOrUrl || "").split("?")[0] || "";
        const lockLandscape = LANDSCAPE_MLEO_GAME.test(path);
        try {
          if (lockLandscape) {
            await ScreenOrientation.lock({ orientation: "landscape" });
          } else {
            await ScreenOrientation.unlock();
          }
        } catch {
          // Timing / platform quirks — never break navigation
        }
      };

      await apply(router.asPath || router.pathname || "");

      const onComplete = (url) => {
        void apply(typeof url === "string" ? url : router.asPath || "");
      };
      router.events.on("routeChangeComplete", onComplete);
      detach = () => router.events.off("routeChangeComplete", onComplete);
    };

    void setup();

    return () => {
      cancelled = true;
      void Promise.resolve().then(() => detach());
    };
  }, [router]);

  return null;
}
