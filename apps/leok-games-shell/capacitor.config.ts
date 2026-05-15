import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Remote LEOK **site root** (same launch experience as the main website: home, learning, `/game` hub, `/mleo-*`, etc.).
 * Set `LEOK_GAMES_SHELL_URL` to the deployed origin, e.g. `https://your-domain.com` or `https://your-domain.com/`.
 * Do **not** set this to `/game` only — the app must not open directly on the games hub unless the user navigates there.
 *
 * Default: Android emulator → host Next on port **3001** at site root.
 */
const raw = process.env.LEOK_GAMES_SHELL_URL || "http://10.0.2.2:3001/";
const shellUrl = `${raw.replace(/\/+$/, "")}/`;
const cleartext = shellUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.leok.games.shell",
  appName: "LEOK Games",
  webDir: "www",
  server: {
    url: shellUrl,
    cleartext,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
