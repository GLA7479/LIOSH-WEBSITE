import { useEffect } from "react";

/**
 * Sets `--app-100vh` on `document.documentElement` to `window.innerHeight` (px).
 * Updates on `resize` and `orientationchange` so installed PWA / mobile Safari
 * get a stable full-viewport height without changing game logic.
 *
 * Consumed by `.game-page-mobile` in `styles/globals.css` (non-learning fill only).
 */
function applyApp100vh() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const root = document.documentElement;
  if (!root) return;
  root.style.setProperty("--app-100vh", `${window.innerHeight}px`);
}

export function useIOSViewportFix() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    applyApp100vh();

    const onChange = () => {
      applyApp100vh();
    };

    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);
    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
    };
  }, []);
}
