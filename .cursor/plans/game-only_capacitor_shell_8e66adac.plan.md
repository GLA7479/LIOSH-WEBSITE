---
name: Game-only Capacitor shell
overview: Stop treating landscape games as a PWA-only React problem. Add a Capacitor-based, games-focused native shell (mirroring GLA7479/MLEO) that loads LEOK starting at `/game`, with native rotation and immersive WebView—while leaving the main Next site, learning routes, and existing PWA path unchanged. Include a follow-up cleanup plan for `mleo-catcher.js` only after the shell exists.
todos:
  - id: write-report-md
    content: "After approval: create reports/game-page-audit/game-only-app-shell-plan.md from approved plan"
    status: cancelled
  - id: scaffold-cap-shell
    content: Add apps/leok-games-shell with Capacitor config, server.url -> LEOK /game, cap add android/ios
    status: cancelled
  - id: align-native
    content: Align AndroidManifest + MainActivity + iOS Info.plist with MLEO (rotation + optional immersive)
    status: completed
  - id: device-qa
    content: Build/run debug shell; verify rotation + all 7 game routes; confirm learning unchanged in browser
    status: pending
  - id: mleo-catcher-followup
    content: "Optional second PR: simplify mleo-catcher.js for Capacitor vs PWA; keep landscape-only intro intact"
    status: cancelled
isProject: false
---

# Game-only app shell (Capacitor) + `mleo-catcher` cleanup plan

## Deliverable document (post-approval)

After owner approval, materialize this plan as **[reports/game-page-audit/game-only-app-shell-plan.md](reports/game-page-audit/game-only-app-shell-plan.md)** with the same sections (no learning/parent/DB changes in that doc unless explicitly scoped later).

---

## 1. Why browser PWA is not enough (for landscape games)

- **LEOK today:** [pages/_app.js](pages/_app.js) registers a **site-wide** PWA (`/manifest.json`, `/sw.js`); [pages/index.js](pages/index.js) promotes install via [components/InstallAppPrompt.js](components/InstallAppPrompt.js) / [InstallAppButton.js](components/InstallAppButton.js).
- **Problem class:** Standalone WebView + **manifest/install metadata** can yield a **viewport that does not rotate** like a Chrome tab or a **native Capacitor WebView**, so **page-level** guards in [pages/mleo-catcher.js](pages/mleo-catcher.js) (`computePortablePortraitBlocked`, `beginRun` early return) cannot create **real landscape dimensions**—they only block or message.
- **Product constraint:** Games stay **landscape-only** (no portrait gameplay); the fix is **distribution/shell**, not more React patches alone.

---

## 2. Why MLEO works (reference summary)

Already captured in [reports/game-page-audit/mleo-landscape-installation-model-diagnosis.md](reports/game-page-audit/mleo-landscape-installation-model-diagnosis.md). Essentials:

| Area | MLEO reference (GitHub `main`) |
|------|--------------------------------|
| Stack | `@capacitor/android`, `@capacitor/ios`, `@capacitor/cli`, `@capacitor/core` in `package.json` |
| Entry URL | [capacitor.config.ts](https://github.com/GLA7479/MLEO/blob/main/capacitor.config.ts): `server.url: "https://ey-delta.vercel.app/game"` |
| Android | `MainActivity` extends `BridgeActivity`; `AndroidManifest.xml` activity uses `configChanges` including `orientation\|screenSize\|…` and **no** `screenOrientation="portrait"` in the fetched manifest |
| iOS | `Info.plist`: `UISupportedInterfaceOrientations` includes **portrait + landscape left/right** |
| Immersive | `MainActivity.java` applies **system bars hide** (immersive) |
| Web manifest | MLEO `public/manifest.json`: **no** `orientation` lock; `start_url: /game` |

---

## 3. Exact game-only solution (preferred)

**Add a Capacitor wrapper whose sole purpose is to load the deployed LEOK site starting at `/game`.** It does **not** replace the Next app; it is a **second installable artifact** (APK/IPA / sideload) for games.

```mermaid
flowchart LR
  subgraph mainSite [LEOK main site unchanged]
    NextApp[Next.js all routes]
    PWA[Existing PWA manifest SW]
    Learning[/learning etc]
  end
  subgraph gameShell [New game-only Capacitor shell]
    Native[Android Activity iOS ViewController]
    WebView[Capacitor WebView]
  end
  Deployed[HTTPS LEOK deployment]
  NextApp --> Deployed
  PWA --> NextApp
  WebView -->|"server.url https origin /game"| Deployed
  Native --> WebView
```

**Least invasive to this repo (recommended):** new directory **`apps/leok-games-shell/`** (or top-level `leok-games-capacitor/`) containing only Capacitor + native projects, **not** merged into the root `package.json` scripts unless you want one monorepo install command.

**Alternative (if owners reject touching monorepo at all):** a **small separate git repo** cloned from MLEO’s layout, with `appId` / branding changed and `server.url` pointing at **production LEOK** `https://<your-domain>/game` (and `cleartext: false`).

---

## 4. Files to add / change (implementation phase — not now)

### 4A. New game shell (Capacitor) — new tree

| Path (proposed) | Purpose |
|-----------------|--------|
| `apps/leok-games-shell/package.json` | `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/app` (versions aligned with MLEO 7.x or current LTS) |
| `apps/leok-games-shell/capacitor.config.ts` | `appId`, `appName`, `server.url: process.env.LEOK_GAMES_URL \|\| 'https://<prod>/game'`, `webDir` placeholder or `server` only for remote URL mode |
| `apps/leok-games-shell/android/**` | From `npx cap add android` + align **MainActivity** with MLEO pattern (BridgeActivity + optional immersive) |
| `apps/leok-games-shell/ios/**` | From `npx cap add ios` + **Info.plist** orientations like MLEO (portrait + both landscapes) |
| `apps/leok-games-shell/README.md` | Build/sign/run, env var for URL, QA checklist |

**Root repo (optional, minimal):**

- Root [package.json](package.json): optional **workspace** or scripts `games:cap:sync` / `games:cap:open:android` that `cd apps/leok-games-shell && npx cap …` — only if product wants one-command DX.

### 4B. LEOK Next site — default **no** changes to learning

- **No** requirement to change [pages/_app.js](pages/_app.js) for learning to work.
- **Optional later (small):** On `/game` only, a **“Best in Games app”** call-to-action linking to Play/internal APK—product copy, not architecture.

### 4C. `mleo-catcher.js` cleanup (separate small pass — after shell validated)

**Goals:** landscape-only; original intro/start flow feels intact; start never looks “dead”; **no portrait play**; reduce reliance on React-only blocking when `window.Capacitor?.isNativePlatform?.()` is true (optional branch).

Concrete directions (for a future PR scoped **only** to [pages/mleo-catcher.js](pages/mleo-catcher.js)):

- Keep **`beginRun`** guard: no run while `computePortablePortraitBlocked()` in **browser/PWA** contexts.
- If **`Capacitor` is present**, treat **native shell** as rotation-capable: either **skip** portrait-only blocking for **start** or simplify UI (product decision in implementation).
- **Intro:** ensure the **classic** intro (image, title, name, **התחלה**, back) is the default; rotate hint only as **inline** guidance, not a replacement screen (align with owner feedback in prior diagnosis).
- **Do not** touch other `pages/mleo-*.js` in the first shell milestone.

---

## 5. Package dependencies (shell app)

Mirror MLEO-style versions (verify at implementation time):

- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/app`
- Optional: `@capacitor/assets` for icons/splash generation

**No** new dependencies required in the **main** Next `package.json` for the shell to work if the shell is a **separate** `package.json`.

---

## 6. Android / iOS config (behavior)

| Topic | Choice |
|-------|--------|
| **start URL** | `https://<production-host>/game` (must match deployed LEOK; use env in `capacitor.config.ts` for staging) |
| **Orientation** | Same as MLEO: **Android** — no portrait lock on `MainActivity`; **iOS** — support portrait + landscape (hub can stay portrait; **games** still enforce landscape in-page) |
| **Immersive** | Optional copy of MLEO `MainActivity` immersive helpers for “app-like” feel on game shell only |
| **Scope isolation** | Shell WebView still loads **same origin**; isolation is **product/UX** (user opened “Games app”) not network isolation |

---

## 7. How this avoids impacting learning / parent / rest of site

- **Learning** routes live in the **browser** and existing **PWA**; unchanged.
- **Capacitor shell** is a **separate binary**; users who never install it are unaffected.
- **No** global `orientation: landscape` in [public/manifest.json](public/manifest.json) for the main site (would harm learning portrait UX).
- **Games** list remains in [pages/game.js](pages/game.js) (`GAMES` slugs match the scoped routes).

---

## 8. Testing on device

1. Build debug APK / run from Xcode with `server.url` → **staging** LEOK `/game`.
2. Confirm **rotation** updates `innerWidth` / `innerHeight` in remote WebView.
3. Open each scoped route: `/game`, `/mleo-runner`, `/mleo-flyer`, `/mleo-catcher`, `/mleo-puzzle`, `/mleo-memory`, `/mleo-penalty` — **landscape play** only where designed.
4. Confirm **learning** not part of shell smoke (open main site in Safari/Chrome separately).

---

## 9. Rollback plan

- **Remove** `apps/leok-games-shell/` (or archive separate repo).
- **Stop** distributing the APK/IPA; no server revert required if no server code was deployed.
- If any optional `mleo-catcher` Capacitor branch was added, revert that commit.

---

## 10. What will not be touched (unless explicitly re-scoped)

- Learning pages, parent reports, student dashboard (except optional link), coin/DB/API, **other games’** logic in the **first** shell milestone, main site redesign, root PWA removal (not required).

---

## 11. Recommended next step (after owner approval)

1. **Write** [reports/game-page-audit/game-only-app-shell-plan.md](reports/game-page-audit/game-only-app-shell-plan.md) from this plan.
2. **Scaffold** `apps/leok-games-shell` with Capacitor CLI, set `server.url` to staging `/game`, sync Android/iOS.
3. **Device-verify** rotation + `/mleo-catcher` before any `mleo-catcher` simplification.
4. **Then** optional minimal [pages/mleo-catcher.js](pages/mleo-catcher.js) cleanup PR.
