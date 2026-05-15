# LEOK — Capacitor shell (optional native app)

Native **Android / iOS** wrapper that loads the **same LEOK site as the browser**, starting at the **site root** (`/`). Users navigate normally (home, learning, parent, etc.). **`/game`** is only the games hub **route**, not a forced app launch URL.

Isolated from main Next source in this folder: no learning/parent/game logic edits here.

## Environment

| Variable | Description |
|----------|-------------|
| **`LEOK_GAMES_SHELL_URL`** | Deployed **site root**, e.g. `https://your-production-host` or `https://your-production-host/`. **Do not** set to `.../game` — the app must open like the main site, not jump to the arcade hub. |

For **Android emulator** + Next on host **port 3001**, leave unset: default is `http://10.0.2.2:3001/`.

After changing the URL, run:

```bash
npm run cap:sync
```

## Prerequisites

- **Node.js** 18+ (20.x recommended).
- **Android:** Android Studio, JDK 17, Android SDK. `npm run cap:open:android` then Run.
- **iOS (macOS):** Xcode, CocoaPods. `cd ios/App && pod install`, open workspace.

## Commands (from `apps/leok-games-shell/`)

```bash
npm install
npm run cap:sync
npm run cap:open:android
npm run cap:open:ios
npm run cap:run:android
```

### Android debug build (CLI)

Requires **`JAVA_HOME`** (JDK 17+) and Android SDK (`ANDROID_HOME` if needed).

```powershell
cd android; .\gradlew.bat assembleDebug
```

APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Manual device QA

1. Set `LEOK_GAMES_SHELL_URL` to **`https://YOUR-DOMAIN/`** (root), `npm run cap:sync`, build/install.
2. App opens on **home (or whatever `/` is)** — **not** forced to `/game`.
3. Navigate in-app to **`/game`** then to **`/mleo-catcher`** (or any `/mleo-*`).
4. **Rotate** on game routes — WebView should deliver landscape dimensions when the OS rotates; learning pages remain portrait-friendly in normal use.
5. Open **LEOK in Chrome** (not shell) — unchanged.

## What this does not do

- Does not modify `pages/mleo-catcher.js` or other game code from this folder.
- Does not change main PWA manifest/SW for the website.

## Rollback

Remove `apps/leok-games-shell/` and stop distributing the native build.
