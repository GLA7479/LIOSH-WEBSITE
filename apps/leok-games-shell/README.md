# LEOK — Capacitor shell (optional native app)

Native **Android / iOS** wrapper that loads the **same LEOK site as the browser**, starting at the **site root** (`/`). Users navigate normally (home, learning, parent, etc.). **`/game`** is only the games hub **route**, not a forced app launch URL.

Isolated from main Next source in this folder: no learning/parent/game logic edits here.

---

## Critical: test the **Capacitor APK**, not the Chrome PWA

| What you are testing | Uses `apps/leok-games-shell`? | Uses `AndroidManifest` / `fullSensor` / Capacitor plugins? |
|----------------------|--------------------------------|------------------------------------------------------------|
| **This project’s Android APK** (`app-debug.apk` or release build) | Yes | Yes |
| **“Install app” on the website** or Chrome’s install prompt | No | No — that is the **normal browser PWA**, same as opening the site in Chrome |

**Do not** validate native orientation, rotation, or shell behavior by installing from Chrome or the site’s install button. That path **never** loads this native project.

**Do instead:**

1. Build the APK from `apps/leok-games-shell/android` (see below).
2. Install **only** that APK:
   - **Android Studio:** Run the `android` project, or use **Build → Build Bundle(s) / APK(s) → Build APK(s)** and install the output.
   - **ADB:** `adb install -r app-debug.apk` (use the full path to the file on your machine).

**During shell QA**, consider **temporarily hiding or renaming** the website’s PWA install affordance so testers are not misled into thinking they installed the Capacitor app. That is a **product/copy** change on the main site (not required for this folder); coordinate separately if you do not want to touch root PWA assets yet.

---

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
- **Android:** Android Studio, **JDK 21** (see `JAVA_HOME` above), Android SDK. `npm run cap:open:android` then Run.
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

Requires a **JDK** on `PATH` and **`JAVA_HOME`** pointing at that JDK’s **root folder** (the directory that contains `bin\java.exe`). This project’s Android Gradle config targets **Java 21** language level — use **JDK 21** (or a JDK 17+ that satisfies the Android Gradle Plugin; if Gradle errors, install JDK 21 and point `JAVA_HOME` there).

#### If the build fails: `JAVA_HOME is not set` / `java` not found (Windows)

1. **Install a JDK** (pick one):
   - **Temurin 21:** [Adoptium Temurin 21 (Windows x64)](https://adoptium.net/) — install to e.g. `C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot\`.
   - **Or** use the JBR bundled with Android Studio, e.g.  
     `C:\Program Files\Android\Android Studio\jbr`  
     (folder must contain `bin\java.exe`).

2. **Set `JAVA_HOME` (user or system):**
   - **Settings → System → About → Advanced system settings → Environment variables**
   - New **user** variable (recommended for one developer machine):
     - **Name:** `JAVA_HOME`
     - **Value:** e.g. `C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot`  
       (no trailing `\`; must be the JDK root, not `...\bin`).

3. **Add Java to `PATH`** (if the installer did not):
   - Edit **Path** → add `%JAVA_HOME%\bin`.

4. **Open a new** PowerShell or CMD and verify:

   ```powershell
   java -version
   echo $env:JAVA_HOME
   ```

   You should see JDK 21 (or your chosen version) and the same path you set.

5. **Build again** from the shell’s Android folder:

   ```powershell
   cd "path\to\repo\apps\leok-games-shell\android"
   .\gradlew.bat assembleDebug
   ```

#### Exact debug APK path (after a successful `assembleDebug`)

Relative to repo root:

```text
apps/leok-games-shell/android/app/build/outputs/apk/debug/app-debug.apk
```

Example absolute path (replace with your clone location):

```text
C:\Users\<You>\Desktop\final projects\FINAL-WEB\LIOSH-WEB-TRY\apps\leok-games-shell\android\app\build\outputs\apk\debug\app-debug.apk
```

**Note:** That file exists **only after** Gradle finishes successfully. If `JAVA_HOME` is missing, the folder may be absent or stale.

#### Install the built APK on a phone (not Chrome PWA)

```powershell
adb install -r "C:\path\to\LIOSH-WEB-TRY\apps\leok-games-shell\android\app\build\outputs\apk\debug\app-debug.apk"
```

Use **USB debugging** or a paired wireless ADB device. **Do not** use Chrome’s “Install app” or the website install button for this test.

---

### Android debug build (short reference)

```powershell
cd apps\leok-games-shell\android
.\gradlew.bat assembleDebug
```

Output: `app\build\outputs\apk\debug\app-debug.apk` under that `android` directory.

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
