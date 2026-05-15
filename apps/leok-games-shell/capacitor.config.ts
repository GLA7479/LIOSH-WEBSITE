import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Remote LEOK games hub. Set LEOK_GAMES_SHELL_URL to your deployed origin including `/game`, e.g.:
 *   https://your-domain.com/game
 * Default targets Android emulator → host machine (Next dev on port 3001).
 */
const shellUrl = (process.env.LEOK_GAMES_SHELL_URL || "http://10.0.2.2:3001/game").replace(/\/$/, "");
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
