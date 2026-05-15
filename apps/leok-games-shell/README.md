# LEOK Games — Capacitor shell

Native **Android / iOS** wrapper that opens the deployed **LEOK** site at **`/game`**. Isolated from the main Next.js app and PWA: no learning/parent/game source changes in this folder.

## Environment

| Variable | Description |
|----------|-------------|
| **`LEOK_GAMES_SHELL_URL`** | Full URL including **`/game`**, e.g. `https://your-production-host/game`. For **Android emulator** + Next on host port **3001**, leave unset to use default `http://10.0.2.2:3001/game`. |

After changing the URL, run:

```bash
npm run cap:sync
```

## Prerequisites

- **Node.js** 18+ (20.x recommended, matches MLEO reference).
- **Android:** Android Studio, JDK 17, Android SDK. From this directory: `npm run cap:open:android` then build/run **Run** in Android Studio.
- **iOS (macOS only):** Xcode, **CocoaPods** (`sudo gem install cocoapods`). Then `cd ios/App && pod install` and open `App.xcworkspace`. This Windows scaffold run skipped a full `pod install` if CocoaPods was missing — **run on a Mac** before shipping iOS.

## Commands (from `apps/leok-games-shell/`)

```bash
npm install
npm run cap:sync          # copy web assets + embed capacitor.config
npm run cap:open:android  # Android Studio
npm run cap:open:ios      # Xcode (macOS)
npm run cap:run:android   # CLI run (requires device/emulator + adb)
```

### Android debug build (CLI)

Requires **`JAVA_HOME`** pointing to a JDK (17+ recommended) and Android SDK on `PATH` / **`ANDROID_HOME`**.

```bash
cd android
./gradlew assembleDebug
```

On Windows:

```powershell
cd android; .\gradlew.bat assembleDebug
```

If Gradle reports `JAVA_HOME is not set`, install a JDK, set `JAVA_HOME`, and retry — or use **Android Studio** to build (recommended).

APK output: `android/app/build/outputs/apk/debug/app-debug.apk` (path may vary slightly by Gradle version).

## Manual device QA

1. Deploy LEOK (or run `npm run dev` on host **3001** for emulator).
2. Set `LEOK_GAMES_SHELL_URL` if not using emulator default; `npm run cap:sync`.
3. Install/run the shell app.
4. **Starts at `/game`** (arcade hub).
5. **Rotate** the device — WebView should report changing `innerWidth`/`innerHeight`.
6. Open **`/mleo-catcher`** — landscape should show a usable width; **התחלה**, pads, **יציאה** behave as in Chrome.
7. **Exit** from a game should return to hub per existing site routing.
8. Open **LEOK in normal mobile Chrome** (not the shell) — **learning** and **PWA** unchanged.

## What this does *not* do

- Does not modify **`pages/mleo-catcher.js`** or other game logic (separate follow-up after shell QA).
- Does not change **manifest / SW** of the main site.
- Does not ship to Play/App Store — signing and store listings are out of scope for this scaffold.

## Rollback

Delete the `apps/leok-games-shell` directory and stop distributing the APK/IPA.
