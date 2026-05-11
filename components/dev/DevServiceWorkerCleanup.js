import { useEffect } from "react";

/**
 * Dev only: remove controlling SW + wipe Cache Storage so stale `/_next/static`
 * chunks from an old PWA session cannot 404 under sw.js during `next dev`.
 * Runs once per mount (typically once per full page load). No UI.
 */
export default function DevServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return undefined;

    let cancelled = false;

    (async () => {
      try {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;

        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));

        if (cancelled || !("caches" in window)) return;
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (e) {
        console.warn("[dev] Service Worker / Cache Storage cleanup:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
